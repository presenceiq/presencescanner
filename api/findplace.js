import { isSiteDisabled, disabledResponse } from './_killswitch.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // KILL SWITCH — if SITE_DISABLED=true in Vercel env vars, return immediately.
  if (isSiteDisabled()) return disabledResponse(res);

  try {
    const { phone } = req.body || {};
    const apiKey = process.env.GOOGLE_PLACES_KEY;

    if (!phone || !String(phone).trim()) {
      return res.status(200).json({ found: false, message: 'No phone number provided' });
    }

    // ---------------------------------------------------------------
    // Step 1: normalize the phone into the format Google's phone
    // lookup expects — E.164: a "+", country code, then digits.
    // We assume US (+1) since this serves US small businesses.
    // ---------------------------------------------------------------
    let digits = String(phone).replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
    if (digits.length !== 10) {
      // Not a standard 10-digit US number — can't do a confident lookup.
      return res.status(200).json({ found: false, message: 'Phone number not in a recognized format' });
    }
    const e164 = '+1' + digits;

    // ---------------------------------------------------------------
    // Step 2: ask Google "Find Place From Text" with inputtype=phonenumber.
    // Phone numbers are far more unique than business names, so this
    // returns the right business when a name search would not.
    // ---------------------------------------------------------------
    const findUrl = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json'
      + '?input=' + encodeURIComponent(e164)
      + '&inputtype=phonenumber'
      + '&fields=place_id'
      + '&key=' + apiKey;

    const findRes = await fetch(findUrl);
    const findData = await findRes.json();

    if (!findData.candidates || findData.candidates.length === 0) {
      // Honest "no match" — the flow will fall through to the next step.
      return res.status(200).json({ found: false, message: 'No Google business found for that phone number' });
    }

    const placeId = findData.candidates[0].place_id;

    // ---------------------------------------------------------------
    // Step 3: fetch the full real listing details for that place_id.
    // Same field set the rest of the app uses, so the result drops
    // straight into the existing scan flow.
    // ---------------------------------------------------------------
    const fields = 'name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,opening_hours,photos,business_status,types';
    const detailUrl = 'https://maps.googleapis.com/maps/api/place/details/json'
      + '?place_id=' + placeId
      + '&fields=' + fields
      + '&key=' + apiKey;

    const dRes = await fetch(detailUrl);
    const dData = await dRes.json();

    if (!dData.result) {
      return res.status(200).json({ found: false, message: 'Found a match but could not load its details' });
    }

    const d = dData.result;
    // Return in the SAME shape places.js uses for a candidate, so the
    // front end can treat it identically.
    return res.status(200).json({
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
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
