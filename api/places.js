import { isSiteDisabled, disabledResponse } from './_killswitch.js';
import { spend, refused } from './_budget.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  // KILL SWITCH and SPENDING GUARD: each search here pays for up to 6 Google
  // lookups, so it's capped per visitor and per day. (6 Oct 2026)
  if (isSiteDisabled()) return disabledResponse(res);
  { const ok = await spend(req, 'google'); if (!ok.ok) return refused(res, ok.message); }

  try {
    // phone and website are optional — they only help with scoring.
    const { bizName, city, phone, website } = req.body || {};
    const apiKey = process.env.GOOGLE_PLACES_KEY;

    if (!bizName || !city) {
      return res.status(400).json({ error: 'Business name and city are required' });
    }

    // --- helpers -------------------------------------------------------

    // Reduce any phone number to bare digits so formatting never matters.
    // A US number with country code (11 digits starting with 1) is trimmed
    // to its 10-digit form so both styles compare equal.
    function normalizePhone(p) {
      if (!p) return '';
      let digits = String(p).replace(/\D/g, '');
      if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
      return digits;
    }

    function normalizeSite(s) {
      if (!s) return '';
      return String(s).toLowerCase().trim()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/.*$/, '')
        .trim();
    }

    function normalizeName(n) {
      if (!n) return '';
      return String(n).toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    // Keep the search inside the United States so an ambiguous city like
    // "Venice" resolves to Venice, FL and never Venice, Italy.
    //  - If the user already typed a country (USA / United States), leave it.
    //  - Otherwise append ", USA". Any state the user typed stays in the
    //    string, so "Venice, FL" -> "Venice, FL, USA" and a bare "Venice"
    //    -> "Venice, USA" (US-only instead of worldwide).
    function normalizeLocation(loc) {
      let c = String(loc || '').trim().replace(/,\s*$/, '');
      const lower = c.toLowerCase();
      const hasCountry = /\b(usa|u\.s\.a\.?|united states)\b/.test(lower);
      if (!hasCountry) c = c + ', USA';
      return c;
    }

    // Pull the US state the owner typed (e.g. "Venice, FL" -> "FL"). Used to
    // filter out far-off, same-name businesses in other states or countries.
    const US_STATES = {alabama:'AL',alaska:'AK',arizona:'AZ',arkansas:'AR',california:'CA',colorado:'CO',connecticut:'CT',delaware:'DE',florida:'FL',georgia:'GA',hawaii:'HI',idaho:'ID',illinois:'IL',indiana:'IN',iowa:'IA',kansas:'KS',kentucky:'KY',louisiana:'LA',maine:'ME',maryland:'MD',massachusetts:'MA',michigan:'MI',minnesota:'MN',mississippi:'MS',missouri:'MO',montana:'MT',nebraska:'NE',nevada:'NV',newhampshire:'NH',newjersey:'NJ',newmexico:'NM',newyork:'NY',northcarolina:'NC',northdakota:'ND',ohio:'OH',oklahoma:'OK',oregon:'OR',pennsylvania:'PA',rhodeisland:'RI',southcarolina:'SC',southdakota:'SD',tennessee:'TN',texas:'TX',utah:'UT',vermont:'VT',virginia:'VA',washington:'WA',westvirginia:'WV',wisconsin:'WI',wyoming:'WY'};
    function parseWantState(loc) {
      const s = String(loc || '').trim();
      // Prefer a 2-letter code after a comma: "Venice, FL".
      const m = s.match(/,\s*([A-Za-z]{2})\b/);
      if (m) return m[1].toUpperCase();
      // Fall back to a spelled-out state name anywhere in the string.
      const key = s.toLowerCase().replace(/[^a-z]/g, '');
      for (const name in US_STATES) { if (key.includes(name)) return US_STATES[name]; }
      return '';
    }
    // Pull the state/region code out of a Google formatted address, e.g.
    // "..., North Port, FL 34286, USA" -> "FL"; "..., Toronto, ON M6S ..." -> "ON".
    function addressState(addr) {
      const m = String(addr || '').match(/,\s*([A-Z]{2})\s+[A-Z0-9]/);
      return m ? m[1].toUpperCase() : '';
    }

    const wantPhone = normalizePhone(phone);
    const wantSite = normalizeSite(website);
    const wantName = normalizeName(bizName);
    const wantState = parseWantState(city);

    // --- search Google -------------------------------------------------

    const location = normalizeLocation(city);
    const searchQuery = encodeURIComponent(`${bizName} ${location}`);
    // region=us biases ambiguous results toward the United States.
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${searchQuery}&region=us&key=${apiKey}`;

    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    // Google Places (legacy) returns HTTP 200 with a status field. ZERO_RESULTS
    // is the only non-OK value that genuinely means "no such business" — every
    // other status (REQUEST_DENIED, INVALID_REQUEST, OVER_QUERY_LIMIT,
    // UNKNOWN_ERROR) is a Google-side failure we MUST NOT report as "not found."
    if (searchData.status && searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
      return res.status(502).json({
        error: true,
        upstream: 'google-places-textsearch',
        googleStatus: searchData.status,
        googleErrorMessage: searchData.error_message || null,
        message: `Google Places search returned ${searchData.status}`,
      });
    }

    if (!searchData.results || searchData.results.length === 0) {
      return res.status(200).json({ found: false, candidates: [], message: 'No Google Business Profile found' });
    }

    // Look at up to 5 candidates.
    const top = searchData.results.slice(0, 5);

    const fields = 'name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,opening_hours,photos,business_status,types';

    // Pull full details for each candidate.
    const detailed = [];
    // Track the LAST non-OK Google status seen from details. If every candidate
    // errors, we surface this as a real upstream failure instead of silently
    // returning "not found."
    let lastDetailError = null;
    for (const c of top) {
      try {
        const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${c.place_id}&fields=${fields}&key=${apiKey}`;
        const dRes = await fetch(detailUrl);
        const dData = await dRes.json();
        if (dData.status && dData.status !== 'OK') {
          lastDetailError = { googleStatus: dData.status, googleErrorMessage: dData.error_message || null };
          continue;
        }
        if (dData.result) detailed.push({ placeId: c.place_id, detail: dData.result });
      } catch (e) { /* skip a candidate that fails to load */ }
    }

    if (detailed.length === 0) {
      if (lastDetailError) {
        return res.status(502).json({
          error: true,
          upstream: 'google-places-details',
          googleStatus: lastDetailError.googleStatus,
          googleErrorMessage: lastDetailError.googleErrorMessage,
          message: `Google Places details returned ${lastDetailError.googleStatus} for all candidates`,
        });
      }
      return res.status(200).json({ found: false, candidates: [], message: 'No Google Business Profile found' });
    }

    // --- LOCATION GUARD: drop far-off same-name businesses ------------
    // The text search can return a business with the same name in another
    // state or country (searching a Venice, FL cleaner returned a
    // "Lemon & Lavender" in Alabama and one in Ontario). If the owner told us
    // a state, drop any candidate we can confidently place in a DIFFERENT
    // state. Candidates whose state we can't parse are KEPT (never drop on
    // uncertainty), so a real local listing is never removed by mistake.
    let pool = detailed;
    if (wantState) {
      pool = detailed.filter(d => {
        const addr = String(d.detail.formatted_address || '');
        const st = addressState(addr);
        if (st) return st === wantState;                 // US state parsed: must match the typed state
        return /,\s*(USA|United States)\s*$/i.test(addr); // state unreadable: keep only if it's in the USA
      });
    }
    // If the guard removed everything, nothing local actually matched — send
    // the user to the "help us find your business" path instead of offering
    // out-of-area businesses.
    if (pool.length === 0) {
      return res.status(200).json({ found: false, candidates: [], message: 'No Google Business Profile found in the area you entered' });
    }

    // --- score each candidate -----------------------------------------

    function scoreCandidate(detail) {
      let score = 0;
      const candPhone = normalizePhone(detail.formatted_phone_number);
      if (wantPhone && candPhone) {
        if (candPhone === wantPhone) score += 100;
        else score -= 50;
      }
      const candSite = normalizeSite(detail.website);
      if (wantSite && candSite) {
        if (candSite === wantSite) score += 60;
        else score -= 30;
      }
      const candName = normalizeName(detail.name);
      if (wantName && candName) {
        if (candName === wantName) score += 25;
        else if (candName.includes(wantName) || wantName.includes(candName)) score += 12;
      }
      return score;
    }

    // Build the candidate list the front end will show in the pick-list.
    let candidates = pool.map(d => {
      const detail = d.detail;
      return {
        placeId: d.placeId,
        score: scoreCandidate(detail),
        name: detail.name || null,
        rating: detail.rating || null,
        reviewCount: detail.user_ratings_total || 0,
        address: detail.formatted_address || null,
        phone: detail.formatted_phone_number || null,
        website: detail.website || null,
        hasHours: !!(detail.opening_hours),
        isOpen: detail.opening_hours?.open_now ?? null,
        // Opening hours as Google shows them, e.g. "Monday: 7:30 AM \u2013 2:00 PM" (already in the lookup, no extra cost).
        hours: Array.isArray(detail.opening_hours?.weekday_text) ? detail.opening_hours.weekday_text.slice(0, 7) : [],
        photoCount: detail.photos?.length || 0,
        businessStatus: detail.business_status || null,
        types: detail.types || [],
      };
    });

    // Sort best match first.
    candidates.sort((a, b) => b.score - a.score);

    // Is the top candidate a confident match? (a strong signal actually matched)
    const hadStrongSignal = !!wantPhone || !!wantSite;
    const topConfident = hadStrongSignal && candidates[0].score >= 60;

    return res.status(200).json({
      found: true,
      candidates,          // full list for the pick-a-list screen
      topConfident,        // true = candidates[0] is a confident match
      bestPlaceId: candidates[0].placeId,
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
