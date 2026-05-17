export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

    const wantPhone = normalizePhone(phone);
    const wantSite = normalizeSite(website);
    const wantName = normalizeName(bizName);

    // --- search Google -------------------------------------------------

    const searchQuery = encodeURIComponent(`${bizName} ${city}`);
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${searchQuery}&key=${apiKey}`;

    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) {
      return res.status(200).json({ found: false, candidates: [], message: 'No Google Business Profile found' });
    }

    // Look at up to 5 candidates.
    const top = searchData.results.slice(0, 5);

    const fields = 'name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,opening_hours,photos,business_status,types';

    // Pull full details for each candidate.
    const detailed = [];
    for (const c of top) {
      try {
        const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${c.place_id}&fields=${fields}&key=${apiKey}`;
        const dRes = await fetch(detailUrl);
        const dData = await dRes.json();
        if (dData.result) detailed.push({ placeId: c.place_id, detail: dData.result });
      } catch (e) { /* skip a candidate that fails to load */ }
    }

    if (detailed.length === 0) {
      return res.status(200).json({ found: false, candidates: [], message: 'No Google Business Profile found' });
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
    let candidates = detailed.map(d => {
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
