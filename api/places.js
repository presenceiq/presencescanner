export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // phone and website are optional — the scanner works without them,
    // but when present they make matching far more accurate.
    const { bizName, city, phone, website } = req.body || {};
    const apiKey = process.env.GOOGLE_PLACES_KEY;

    if (!bizName || !city) {
      return res.status(400).json({ error: 'Business name and city are required' });
    }

    // --- helpers -------------------------------------------------------

    // Reduce any phone number to bare digits so formatting never matters.
    // "(941) 662-9941", "+1 941.662.9941", "9416629941" all become "9416629941".
    // A US number typed with country code (11 digits starting with 1) is
    // trimmed to its 10-digit form so both styles compare equal.
    function normalizePhone(p) {
      if (!p) return '';
      let digits = String(p).replace(/\D/g, '');
      if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
      return digits;
    }

    // Reduce a website to its core domain so "https://www.x.com/" == "x.com".
    function normalizeSite(s) {
      if (!s) return '';
      return String(s).toLowerCase().trim()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/.*$/, '')
        .trim();
    }

    // Loose name comparison — lowercase, letters/numbers only.
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
      return res.status(200).json({ found: false, message: 'No Google Business Profile found' });
    }

    // Look at up to 5 candidates — not just the first result.
    const candidates = searchData.results.slice(0, 5);

    const fields = 'name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,opening_hours,photos,business_status,types';

    // Pull full details for each candidate so we can score it.
    const detailed = [];
    for (const c of candidates) {
      try {
        const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${c.place_id}&fields=${fields}&key=${apiKey}`;
        const dRes = await fetch(detailUrl);
        const dData = await dRes.json();
        if (dData.result) detailed.push({ placeId: c.place_id, detail: dData.result });
      } catch (e) { /* skip a candidate that fails to load */ }
    }

    if (detailed.length === 0) {
      return res.status(200).json({ found: false, message: 'No Google Business Profile found' });
    }

    // --- score each candidate -----------------------------------------

    function scoreCandidate(detail) {
      let score = 0;
      const reasons = [];

      // Phone match — the strongest signal.
      const candPhone = normalizePhone(detail.formatted_phone_number);
      if (wantPhone && candPhone) {
        if (candPhone === wantPhone) { score += 100; reasons.push('phone match'); }
        else { score -= 50; reasons.push('phone mismatch'); }
      }

      // Website match — strong signal when both sides have one.
      const candSite = normalizeSite(detail.website);
      if (wantSite && candSite) {
        if (candSite === wantSite) { score += 60; reasons.push('website match'); }
        else { score -= 30; reasons.push('website mismatch'); }
      }

      // Name similarity — weak signal (names vary a lot on Google).
      const candName = normalizeName(detail.name);
      if (wantName && candName) {
        if (candName === wantName) { score += 25; reasons.push('exact name'); }
        else if (candName.includes(wantName) || wantName.includes(candName)) {
          score += 12; reasons.push('partial name');
        }
      }

      return { score, reasons };
    }

    let best = null;
    for (const d of detailed) {
      const { score, reasons } = scoreCandidate(d.detail);
      if (!best || score > best.score) {
        best = { ...d, score, reasons };
      }
    }

    // --- decide how confident we are ----------------------------------

    // confident  = a strong signal (phone or website) actually matched
    // unsure     = we have a best guess but no strong confirmation
    const hadStrongSignal = !!wantPhone || !!wantSite;
    const confident = hadStrongSignal && best.score >= 60;

    const detail = best.detail;
    return res.status(200).json({
      found: true,
      confident,            // true = trust it; false = ask the user
      matchReasons: best.reasons,
      candidateCount: detailed.length,
      placeId: best.placeId,
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
