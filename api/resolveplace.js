export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { mapsUrl, placeId: directPlaceId } = req.body || {};
    const apiKey = process.env.GOOGLE_PLACES_KEY;

    // FAST PATH: the autocomplete widget gives us an exact place_id
    // directly. No URL parsing needed — go straight to fetching details.
    if (directPlaceId && String(directPlaceId).trim()) {
      const pid = String(directPlaceId).trim();
      const fields = 'name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,opening_hours,photos,business_status,types';
      const dUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${pid}&fields=${fields}&key=${apiKey}`;
      const dRes = await fetch(dUrl);
      const dData = await dRes.json();
      if (!dData.result) {
        return res.status(200).json({ found: false, message: "We couldn't load that business's details. Please try again." });
      }
      const d = dData.result;
      return res.status(200).json({
        found: true,
        placeId: pid,
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
    }

    if (!mapsUrl || !String(mapsUrl).trim()) {
      return res.status(400).json({ error: 'A Google Maps link is required' });
    }
    const url = String(mapsUrl).trim();

    // ---------------------------------------------------------------
    // Step 1: try to pull a usable Google ID out of the URL TEXT.
    // We never have to "follow" the link — these IDs sit in the URL.
    // Two kinds appear in Google share URLs:
    //   - place_id  (ChIJ...)            -> Places API uses directly
    //   - kgmid     (/g/11... or /m/...) -> a Knowledge Graph ID; the
    //                                       Places API does NOT take this
    //                                       directly, so we resolve it.
    // ---------------------------------------------------------------

    let placeId = null;
    let kgmid = null;

    // place_id can appear as ...place_id=ChIJ... or ...!1s0x..:0x..
    const placeIdMatch = url.match(/place_id[=:]([A-Za-z0-9_-]+)/);
    if (placeIdMatch) placeId = placeIdMatch[1];

    // kgmid appears as kgmid=/g/11xxxx  (also /m/xxxx form)
    const kgmidMatch = url.match(/kgmid=(\/[gm]\/[A-Za-z0-9_]+)/);
    if (kgmidMatch) kgmid = kgmidMatch[1];

    // Also grab a plain business name. Try the q= parameter first, then
    // the /maps/place/NAME/ path style. This name is our fallback for
    // resolving the business when no direct place_id is present.
    let nameFromUrl = null;
    const qMatch = url.match(/[?&]q=([^&]+)/);
    if (qMatch && !/place_id/i.test(qMatch[1])) {
      try { nameFromUrl = decodeURIComponent(qMatch[1].replace(/\+/g, ' ')); }
      catch (e) { nameFromUrl = qMatch[1].replace(/\+/g, ' '); }
    }
    // /maps/place/Venice+FL+Handyman/@... style
    if (!nameFromUrl) {
      const pathMatch = url.match(/\/maps\/place\/([^/@]+)/);
      if (pathMatch) {
        try { nameFromUrl = decodeURIComponent(pathMatch[1].replace(/\+/g, ' ')); }
        catch (e) { nameFromUrl = pathMatch[1].replace(/\+/g, ' '); }
      }
    }

    // ---------------------------------------------------------------
    // Step 2: if we only have a kgmid, resolve it to a place_id.
    // Strategy: search the Places API by the business NAME from the URL.
    // Long, messy GBP names (with en-dashes, &, taglines) often return
    // nothing, so we try progressively simpler versions of the name.
    // ---------------------------------------------------------------

    if (!placeId && nameFromUrl) {
      // Normalize odd punctuation: en-dash/em-dash -> hyphen, collapse spaces.
      const cleaned = nameFromUrl
        .replace(/[\u2012-\u2015]/g, '-')   // en/em dashes -> hyphen
        .replace(/\s+/g, ' ')
        .trim();

      // Build a list of search attempts, simplest-likely-to-work included.
      // e.g. "CMPCleaning Venice - House Cleaning & Vacation Rental Cleaning"
      //  ->  also try just "CMPCleaning Venice"
      const attempts = [cleaned];
      const beforeDash = cleaned.split(/\s[-–—]\s/)[0].trim();
      if (beforeDash && beforeDash !== cleaned) attempts.push(beforeDash);
      // first 2-3 words as a last resort
      const fewWords = cleaned.split(' ').slice(0, 3).join(' ')
        .replace(/[\s\-–—&]+$/, '').trim();
      if (fewWords && !attempts.includes(fewWords)) attempts.push(fewWords);

      for (const attempt of attempts) {
        if (placeId) break;
        const sQuery = encodeURIComponent(attempt);
        const sUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${sQuery}&key=${apiKey}`;
        const sRes = await fetch(sUrl);
        const sData = await sRes.json();
        if (sData.results && sData.results.length > 0) {
          placeId = sData.results[0].place_id;
        }
      }
    }

    if (!placeId) {
      // Honest failure — we could not read a usable business ID from the link.
      return res.status(200).json({
        found: false,
        message: "We couldn't read a Google business from that link. Please paste the full Google listing URL, or enter your details manually.",
      });
    }

    // ---------------------------------------------------------------
    // Step 3: fetch the REAL listing details from the resolved place_id.
    // This is the whole point — real reviews, photos, hours.
    // ---------------------------------------------------------------

    const fields = 'name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,opening_hours,photos,business_status,types';
    const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;
    const dRes = await fetch(detailUrl);
    const dData = await dRes.json();

    if (!dData.result) {
      return res.status(200).json({
        found: false,
        message: "We found the link but couldn't load the business details. Please try again or enter details manually.",
      });
    }

    const d = dData.result;
    return res.status(200).json({
      found: true,
      placeId,
      name: d.name || nameFromUrl || null,
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
