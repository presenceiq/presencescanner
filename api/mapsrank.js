// /api/mapsrank  PresenceScanner: where does this business actually come up
// on Google Maps for the search a customer would type?
// Added 6 Oct 2026. A real scan of The Breakfast Cottage (Nokomis) got no
// credit for being Google's top breakfast pick, because every other section
// is estimated from website signals. This is a measured fact instead.
//
// One Google text search per call, nothing else. It returns up to 20 places,
// and we report where the scanned business's own Google ID lands in that list.
// Capped by the spending guard: per visitor and site-wide per day.

import { isSiteDisabled, disabledResponse } from './_killswitch.js';
import { spend, refused } from './_budget.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (isSiteDisabled()) return disabledResponse(res);

  const b = req.body || {};
  const phrase = String(b.phrase || '').replace(/[^A-Za-z0-9 &'\-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
  const city = String(b.city || '').replace(/[^A-Za-z0-9 ,.'\-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
  const placeId = String(b.placeId || '').trim();
  if (phrase.length < 3 || city.length < 2 || !/^[A-Za-z0-9_-]{10,300}$/.test(placeId)) {
    return res.status(400).json({ error: 'bad input' });
  }

  const apiKey = process.env.GOOGLE_PLACES_KEY;
  if (!apiKey) return res.status(500).json({ error: 'not configured' });

  const ok = await spend(req, 'mapsrank');
  if (!ok.ok) return refused(res, ok.message);

  const query = phrase + ' in ' + city;
  try {
    const url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query=' +
      encodeURIComponent(query) + '&region=us&key=' + apiKey;
    const r = await fetch(url);
    const d = await r.json();
    if (d.status && d.status !== 'OK' && d.status !== 'ZERO_RESULTS') {
      return res.status(502).json({ error: 'google ' + d.status });
    }
    const results = Array.isArray(d.results) ? d.results : [];
    const idx = results.findIndex(function (x) { return x && x.place_id === placeId; });
    return res.status(200).json({
      ok: true,
      query: query,
      checked: results.length,
      rank: idx === -1 ? null : idx + 1,
      // The top 3 names, so the report can say who shows up first.
      top: results.slice(0, 3).map(function (x) { return { name: String(x.name || '').slice(0, 80), isYou: x.place_id === placeId }; }),
    });
  } catch (e) {
    console.error('MAPSRANK ERROR ' + String(e).slice(0, 200));
    return res.status(500).json({ error: 'error' });
  }
}
