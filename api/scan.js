import { isSiteDisabled, disabledResponse } from './_killswitch.js';
import { checkRateLimit, rateLimitedResponse } from './_ratelimit.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // KILL SWITCH — if SITE_DISABLED=true in Vercel env vars, return immediately.
  if (isSiteDisabled()) return disabledResponse(res);

  // RATE LIMITER — block IPs that have already done their daily quota.
  // scan.js is the ONLY endpoint that consumes the rate limit, because
  // every full scan necessarily calls scan.js exactly once. Other
  // endpoints (findplace, resolveplace, fetchsite) are scan helpers
  // that get called as part of a single scan attempt.
  const rl = await checkRateLimit(req);
  if (!rl.allowed) return rateLimitedResponse(res, rl.message);

  try {
    const body = req.body;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
