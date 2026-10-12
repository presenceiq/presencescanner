// ---------------------------------------------------------------
// SPENDING GUARD (added 6 Oct 2026)
//
// Every call to Google or to the AI costs Michael money. This caps how many
// paid calls can happen per day, two ways:
//   - per visitor (by IP address), so one person can't run up the bill
//   - across the whole site, so even someone switching IP addresses hits a
//     hard daily ceiling
// Counters live in the same Upstash Redis store as the scan limiter and
// reset every 24 hours on their own.
//
// OWNER BYPASS: IPs listed in the OWNER_IPS env var skip the per-visitor
// limit (same as the scan limiter) but still count toward the site-wide cap.
//
// If the store isn't configured, calls are allowed (same as the scan
// limiter) and a warning is logged. The hard stop for real money is the
// spending cap set in Google Cloud and in the Anthropic console.
// ---------------------------------------------------------------

// Daily limits. Change a number here to raise or lower a cap.
// 11 Oct 2026: scan 40 -> 80 and google 60 -> 200 for the Facebook push, with
// email alerts at 80% and at the cap (see _alert.js).
export const LIMITS = {
  google:  { perIp: 10,  site: 200 },  // business lookups (places, findplace, resolveplace); a real scan uses 1 to 3
  mapsrank:{ perIp: 6,   site: 30  },  // Google Maps rank check
  scan:    { perIp: 3,   site: 80  },  // full AI scans (the per-IP 3 matches the old limiter)
  advisor: { perIp: 25,  site: 200 },  // advisor chat messages (7 per visit) and the short search-phrase call
  aicheck: { perIp: 3,   site: 30  },  // AI assistant check (1 web search each)
  sab:     { perIp: 4,   site: 30  },  // second-chance lookup for hidden-address businesses (up to 2 Google searches each)
};

import { alertOnce } from './_alert.js';

const DAY = 86400;

// What each cap blocks, for the alert email. Maps rank and the AI check are
// left out: when they hit their cap the report just skips that check.
const WHAT = {
  google:  'Business lookups. New visitors will see a "reached its limit for today" message instead of finding their business.',
  scan:    'Full scans. New visitors will see a "reached its limit for today" message.',
  advisor: 'Advisor chat replies.',
  sab:     'The second-chance lookup for businesses that hide their address. Those businesses may be told we could not find their listing.',
};

function ipOf(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return String(req.headers['x-real-ip'] || 'unknown').trim();
}

function isOwner(ip) {
  const list = (process.env.OWNER_IPS || '').split(',').map(s => s.trim()).filter(Boolean);
  return list.includes(ip);
}

function today() { return new Date().toISOString().slice(0, 10); }

async function incr(key) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const h = { Authorization: 'Bearer ' + token };
  const r = await fetch(url + '/incr/' + encodeURIComponent(key), { headers: h });
  const d = await r.json();
  const n = parseInt(d.result || '0', 10) || 0;
  if (n === 1) await fetch(url + '/expire/' + encodeURIComponent(key) + '/' + DAY, { headers: h });
  return n;
}

// Returns { ok: true } or { ok: false, message }.
export async function spend(req, bucket) {
  const lim = LIMITS[bucket];
  if (!lim) return { ok: true };
  const ip = ipOf(req);
  try {
    // Per-visitor first, so one visitor who is over their limit can't also
    // use up the site-wide allowance for everyone else.
    if (!isOwner(ip)) {
      const mine = await incr('bg:' + bucket + ':ip:' + today() + ':' + ip);
      if (mine === null) {
        console.error('Spending guard: KV env vars missing, allowing ' + bucket);
        return { ok: true };
      }
      if (mine > lim.perIp) {
        return { ok: false, message: bucket === 'scan'
          ? "You've reached your daily limit of " + lim.perIp + ' free scans. Please come back tomorrow!'
          : "You've reached today's limit. Please come back tomorrow!" };
      }
    }
    const site = await incr('bg:' + bucket + ':site:' + today());
    if (site !== null && WHAT[bucket]) {
      if (site === Math.ceil(lim.site * 0.8)) {
        await alertOnce('warn:' + bucket, 'PresenceScanner has used 80% of today\'s ' + bucket + ' limit',
          'Today ' + site + ' of ' + lim.site + ' ' + bucket + ' calls are used. When the limit is reached, this stops: ' + WHAT[bucket] +
          '\n\nThe limit resets at midnight UTC (8 PM Eastern). To raise it, change the number for ' + bucket + ' in api/_budget.js.');
      } else if (site === lim.site + 1) {
        await alertOnce('cap:' + bucket, 'PresenceScanner hit today\'s ' + bucket + ' limit',
          'All ' + lim.site + ' ' + bucket + ' calls for today are used. This is now stopped: ' + WHAT[bucket] +
          '\n\nThe limit resets at midnight UTC (8 PM Eastern). To raise it, change the number for ' + bucket + ' in api/_budget.js.');
      }
    }
    if (site !== null && site > lim.site) {
      console.error('Spending guard: site-wide daily cap reached for ' + bucket + ' (' + lim.site + ')');
      return { ok: false, message: 'PresenceScanner has reached its limit for today. Please try again tomorrow.' };
    }
    return { ok: true };
  } catch (e) {
    console.error('Spending guard error, allowing ' + bucket + ': ' + String(e).slice(0, 200));
    return { ok: true };
  }
}

export function refused(res, message) {
  return res.status(429).json({ rateLimited: true, error: message });
}
