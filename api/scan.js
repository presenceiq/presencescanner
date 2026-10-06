import { isSiteDisabled, disabledResponse } from './_killswitch.js';
import { spend, refused } from './_budget.js';

// Only these models may be called through this endpoint, each with a ceiling
// on reply length, so nobody can use it to run an expensive model or a huge
// reply on Michael's account. (Added 6 Oct 2026.)
const ALLOWED_MODELS = { 'claude-sonnet-4-6': 3000, 'claude-haiku-4-5-20251001': 600 };
const MAX_INPUT_CHARS = 40000;
const ADVISOR_MAX_TOKENS = 600; // anything this size or smaller counts as an advisor message, not a scan

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

  // CHECK THE REQUEST before anything costs money.
  const inBody = req.body || {};
  const model = String(inBody.model || '');
  if (!ALLOWED_MODELS[model]) return res.status(400).json({ error: 'Model not allowed' });
  if (!Array.isArray(inBody.messages) || !inBody.messages.length) return res.status(400).json({ error: 'No messages' });
  if (JSON.stringify(inBody.messages).length > MAX_INPUT_CHARS) return res.status(413).json({ error: 'Request too large' });
  const maxTokens = Math.min(Math.max(parseInt(inBody.max_tokens, 10) || 500, 1), ALLOWED_MODELS[model]);

  // SPENDING GUARD — full scans and advisor messages are counted separately,
  // so asking the advisor questions no longer uses up someone's 3 daily scans.
  const bucket = maxTokens > ADVISOR_MAX_TOKENS ? 'scan' : 'advisor';
  const ok = await spend(req, bucket);
  if (!ok.ok) return refused(res, ok.message);

  // SCAN TIMEOUT — abort the Anthropic call if it takes longer than
  // SCAN_TIMEOUT_MS. AbortController is the standard way to cancel
  // a fetch() in flight.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);

  try {
    const body = { model: model, max_tokens: maxTokens, messages: inBody.messages };
    if (typeof inBody.temperature === 'number' && inBody.temperature >= 0 && inBody.temperature <= 1) body.temperature = inBody.temperature;
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
