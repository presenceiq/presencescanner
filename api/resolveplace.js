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
    // Try to pull a usable place_id out of the URL TEXT.
    // We never have to "follow" the link — if there's a place_id in it,
    // it's right there in the parameters.
    //
    // Two patterns Google uses:
    //   ?place_id=ChIJ...
    //   ?query_place_id=ChIJ...   (Google's documented URL format)
    //   ?placeid=ChIJ...           (legacy variant)
    // ---------------------------------------------------------------

    let placeId = null;
    const placeIdMatch = url.match(/place_id[=:]([A-Za-z0-9_-]+)/)
      || url.match(/[?&]query_place_id=([^&]+)/)
      || url.match(/[?&]placeid=([A-Za-z0-9_-]+)/);
    if (placeIdMatch) placeId = placeIdMatch[1];

    // ---------------------------------------------------------------
    // VENICE-ITALY BUG FIX (May 25, 2026):
    //
    // The previous version of this file had a "Step 2" that, when no
    // place_id was found in the URL, tried to recover by extracting the
    // business name and running an UNBIASED GLOBAL text search through
    // Google's Places API. That fallback confidently returned wrong-
    // country results (e.g. "Putnam Realty Venice" returned a firm in
    // Venice, ITALY) and got published as a successful scan with no
    // safety check.
    //
    // DECISIONS.md already records "Name + city text search as primary
    // matching" as an ABANDONED approach for exactly this reason. The
    // code, however, kept the abandoned logic live. We've now removed it.
    //
    // When a URL doesn't contain a Place ID — which is the case for most
    // Google share URLs, kgmid-based URLs, and short share.google links
    // — return found:false honestly and route the user to the manual
    // "Copy from your Google Business Profile" path on the frontend.
    // ---------------------------------------------------------------

    if (!placeId) {
      return res.status(200).json({
        found: false,
        message: "This Google link doesn't include a Place ID we can use. Most Google share links don't — that's normal. Please use the \"Copy from your Google Business Profile\" option instead.",
      });
    }

    // ---------------------------------------------------------------
    // Fetch the REAL listing details from the resolved place_id.
    // ---------------------------------------------------------------

    const fields = 'name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,opening_hours,photos,business_status,types';
    const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;
    const dRes = await fetch(detailUrl);
    const dData = await dRes.json();

    if (!dData.result) {
      return res.status(200).json({
        found: false,
        message: "We found a Place ID in the link but couldn't load the business details. Please try again or use the \"Copy from your Google Business Profile\" option.",
      });
    }

    const d = dData.result;
    return res.status(200).json({
      found: true,
      placeId,
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
