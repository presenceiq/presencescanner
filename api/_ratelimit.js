// ---------------------------------------------------------------
// RATE LIMITER HELPER
//
// Tracks how many scans each IP address has done in the current day
// using Upstash Redis. When an IP exceeds the daily limit, the API
// endpoint returns a friendly "come back tomorrow" message instead
// of running the scan.
//
// HOW IT WORKS:
// - Each scan checks the IP's current count for today
// - If under the limit, increments the count and lets the scan run
// - If at the limit, blocks the scan with a friendly message
// - Counters expire after 24 hours automatically (Redis TTL)
//
// OWNER BYPASS:
// - If the incoming IP matches one in the OWNER_IPS env var
//   (comma-separated list), the rate limit is skipped entirely.
// - Set OWNER_IPS in Vercel env vars like:
//     OWNER_IPS=73.124.45.198,99.234.55.187
// - Useful so the owner doesn't lock themselves out during testing.
//
// CONFIGURATION:
//   DAILY_LIMIT = 3   (scans per IP per day)
// ---------------------------------------------------------------

const DAILY_LIMIT = 3;
const SECONDS_PER_DAY = 86400;

// Get the user's IP from the request. Vercel sets several headers we
// can use — we try them in order of reliability.
function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    // x-forwarded-for can be a comma-separated chain; the first one is the real client
    return String(xff).split(',')[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (realIp) return String(realIp).trim();
  return 'unknown';
}

// Check if this IP is in the owner allow-list from env var.
function isOwnerIp(ip) {
  const list = (process.env.OWNER_IPS || '').trim();
  if (!list) return false;
  const owners = list.split(',').map(s => s.trim()).filter(Boolean);
  return owners.includes(ip);
}

// Build today's date string (UTC) so the counter key naturally rolls
// over at midnight UTC. Example: "2026-05-26"
function todayKey() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Call Upstash REST API to get current count for this IP today.
// Returns 0 if no record exists yet.
async function getCount(ip) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    console.error('Rate limiter: KV env vars missing, allowing request');
    return 0;
  }
  const key = `rl:${todayKey()}:${ip}`;
  try {
    const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return parseInt(data.result || '0', 10) || 0;
  } catch (e) {
    console.error('Rate limiter: get failed, allowing request', e.message);
    return 0;
  }
}

// Increment the count for this IP today. Also sets a 24-hour expiry
// so old counters automatically clean themselves up.
async function increment(ip) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return;
  const key = `rl:${todayKey()}:${ip}`;
  try {
    await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetch(`${url}/expire/${encodeURIComponent(key)}/${SECONDS_PER_DAY}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (e) {
    console.error('Rate limiter: increment failed', e.message);
  }
}

// Main function exported for use by API endpoints.
// Returns { allowed: true/false, message: '...' if blocked }
export async function checkRateLimit(req) {
  const ip = getClientIp(req);

  // OWNER BYPASS — skip rate limit for owner IPs.
  if (isOwnerIp(ip)) {
    return { allowed: true, owner: true };
  }

  const count = await getCount(ip);
  if (count >= DAILY_LIMIT) {
    return {
      allowed: false,
      message: `You've reached your daily limit of ${DAILY_LIMIT} free scans. Please come back tomorrow!`,
    };
  }
  // Allow the request and increment the counter for future requests.
  await increment(ip);
  return { allowed: true };
}

// Standard response when rate-limited.
export function rateLimitedResponse(res, message) {
  return res.status(429).json({
    rateLimited: true,
    error: message,
  });
}
