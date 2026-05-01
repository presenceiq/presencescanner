export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { bizName, city } = req.body;
    const apiKey = process.env.GOOGLE_PLACES_KEY;

    const searchQuery = encodeURIComponent(`${bizName} ${city}`);
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${searchQuery}&key=${apiKey}`;
    
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) {
      return res.status(200).json({ found: false, message: 'No Google Business Profile found' });
    }

    const place = searchData.results[0];
    const placeId = place.place_id;

    const fields = 'name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,opening_hours,photos,business_status,types';
    const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;
    
    const detailRes = await fetch(detailUrl);
    const detailData = await detailRes.json();
    const detail = detailData.result;

    return res.status(200).json({
      found: true,
      placeId,
      name: detail.name || bizName,
      rating: detail.rating || null,
      reviewCount: detail.user_ratings_total || 0,
      address: detail.formatted_address || null,
      phone: detail.formatted_phone_number || null,
      website: detail.website || null,
      hasHours: !!(detail.opening_hours),
      isOpen: detail.opening_hours?.open_now ?? null,
      photoCount: detail.photos?.length || 0,
      businessStatus: detail.business_status || null,
      types: detail.types || [],
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
