import { isSiteDisabled, disabledResponse } from './_killswitch.js';

// How many candidates to pull full details for when a phone number
// maps to more than one business. Keeps API cost/latency bounded.
const MAX_CANDIDATES = 5;

const DETAIL_FIELDS =
  'name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,opening_hours,photos,business_status,types';

// Normalize a business name for loose matching (lowercase, strip anything
// that isn't a letter or number, collapse spaces).
function normalizeName(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Score how well a candidate name matches the name the user is scanning.
// Higher = better. 0 = no meaningful overlap.
function nameMatchScore(candidateName, wantedName) {
  const c = normalizeName(candidateName);
  const w = normalizeName(wantedName);
  if (!c || !w) return 0;
  if (c === w) return 100;                 // exact
  if (c.includes(w) || w.includes(c)) return 80; // one contains the other
  // token overlap
  const ct = new Set(c.split(' '));
  const wt = w.split(' ');
  let hits = 0;
  for (const t of wt) if (t && ct.has(t)) hits++;
  return hits * 10;
}

// Fetch full details for one place_id. Returns the raw Google result or null.
async function fetchDetails(placeId, apiKey) {
  const url =
    'https://maps.googleapis.com/maps/api/place/details/json' +
    '?place_id=' + encodeURIComponent(placeId) +
    '&fields=' + DETAIL_FIELDS +
    '&key=' + apiKey;
  const r = await fetch(url);
  const j = await r.json();
  return j.result || null;
}

// Shape a Google details result into the object the rest of the app expects.
function shape(placeId, d) {
  return {
    found: true,
    placeId: placeId,
    name: d.name || null,
    rating: d.rating || null,
    reviewCount: d.user_ratings_total || 0,
    address: d.formatted_address || null,
    phone: d.formatted_phone_number || null,
    website: d.website || null,
    hasHours: !!(d.opening_hours),
    isOpen: d.opening_hours?.open_now ?? null,
    photoCount: d.photos?.length || 0,
    businessStatus: d.business_status || null,
    types: d.types || [],
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // KILL SWITCH — if SITE_DISABLED=true in Vercel env vars, return immediately.
  if (isSiteDisabled()) return disabledResponse(res);

  try {
    // `name` is OPTIONAL. When the scan sends it, we use it to pick the
    // right business if the phone number maps to more than one.
    const { phone, name } = req.body || {};
    const apiKey = process.env.GOOGLE_PLACES_KEY;

    if (!phone || !String(phone).trim()) {
      return res.status(200).json({ found: false, message: 'No phone number provided' });
    }

    // ---------------------------------------------------------------
    // Step 1: normalize the phone into E.164 (+1XXXXXXXXXX), US assumed.
    // ---------------------------------------------------------------
    let digits = String(phone).replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
    if (digits.length !== 10) {
      return res.status(200).json({ found: false, message: 'Phone number not in a recognized format' });
    }
    const e164 = '+1' + digits;

    // ---------------------------------------------------------------
    // Step 2: ask Google "Find Place From Text" by phone number.
    // NOTE: one phone number can map to MULTIPLE businesses (e.g. an
    // owner who runs several businesses off one line). We must NOT
    // assume a single result here.
    // ---------------------------------------------------------------
    const findUrl =
      'https://maps.googleapis.com/maps/api/place/findplacefromtext/json' +
      '?input=' + encodeURIComponent(e164) +
      '&inputtype=phonenumber' +
      '&fields=place_id' +
      '&key=' + apiKey;

    const findRes = await fetch(findUrl);
    const findData = await findRes.json();

    if (!findData.candidates || findData.candidates.length === 0) {
      return res.status(200).json({ found: false, message: 'No Google business found for that phone number' });
    }

    // ---------------------------------------------------------------
    // Step 3: pull full details for EVERY candidate (capped), instead of
    // blindly taking candidates[0]. This is the core of the shared-number fix.
    // ---------------------------------------------------------------
    const ids = findData.candidates
      .map((c) => c.place_id)
      .filter(Boolean)
      .slice(0, MAX_CANDIDATES);

    const detailed = [];
    for (const id of ids) {
      const d = await fetchDetails(id, apiKey);
      if (d) detailed.push({ placeId: id, d });
    }

    if (detailed.length === 0) {
      return res.status(200).json({ found: false, message: 'Found a match but could not load its details' });
    }

    // Split operational vs. permanently-closed. A closed listing should
    // never be handed back as the business unless it's the ONLY thing there.
    const isClosed = (d) => (d.business_status && d.business_status !== 'OPERATIONAL');
    const operational = detailed.filter((x) => !isClosed(x.d));
    const pool = operational.length ? operational : detailed;

    // ---------------------------------------------------------------
    // Step 4: choose the PRIMARY result.
    //  - If the scan passed a name, pick the best name match.
    //  - Otherwise take the first operational one.
    // ---------------------------------------------------------------
    let primary = pool[0];
    if (name && String(name).trim() && pool.length > 1) {
      let best = pool[0];
      let bestScore = nameMatchScore(pool[0].d.name, name);
      for (let i = 1; i < pool.length; i++) {
        const s = nameMatchScore(pool[i].d.name, name);
        if (s > bestScore) { best = pool[i]; bestScore = s; }
      }
      primary = best;
    }

    // Build the response: SAME shape as before for the primary (so the
    // existing front end keeps working untouched), plus extra fields for
    // the "which of these is yours?" picker and the shared-number finding.
    const out = shape(primary.placeId, primary.d);

    out.matchCount = detailed.length;
    out.sharedPhoneNumber = detailed.length > 1; // the conflation finding flag
    out.candidates = detailed.map((x) => ({
      placeId: x.placeId,
      name: x.d.name || null,
      address: x.d.formatted_address || null,
      businessStatus: x.d.business_status || null,
      isClosed: isClosed(x.d),
    }));

    return res.status(200).json(out);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
