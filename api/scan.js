import { isSiteDisabled, disabledResponse } from './_killswitch.js';
import { checkRateLimit, rateLimitedResponse } from './_ratelimit.js';

// Hard timeout for the Anthropic API call. If the API hangs or runs
// slow, we abort the request after this many milliseconds so a single
// stuck request can't sit open eating Vercel function time and
// Anthropic tokens indefinitely.
const SCAN_TIMEOUT_MS = 60000; // 60 seconds

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // KILL SWITCH — if SITE_DISABLED=true in Vercel env vars, return immediately.
  if (isSiteDisabled()) return disabledResponse(res);

  // RATE LIMITER — block IPs that have already done their daily quota.
  const rl = await checkRateLimit(req);
  if (!rl.allowed) return rateLimitedResponse(res, rl.message);

  // SCAN TIMEOUT — abort the Anthropic call if it takes longer than
  // SCAN_TIMEOUT_MS. AbortController is the standard way to cancel
  // a fetch() in flight.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);

  try {
    const body = req.body;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    clearTimeout(timeoutId);
    // Distinguish a timeout abort from any other error so the frontend
    // can show the right message and the user knows what happened.
    if (e.name === 'AbortError') {
      return res.status(504).json({
        timeout: true,
        error: 'The scan took too long and was stopped. Please try again — this is usually temporary.',
      });
    }
    return res.status(500).json({ error: e.message });
  }
}
