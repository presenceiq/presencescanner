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
export const LIMITS = {
  google:  { perIp: 10,  site: 60  },  // business lookups (places, findplace, resolveplace); a real scan uses 1 to 3
  mapsrank:{ perIp: 6,   site: 30  },  // Google Maps rank check
  scan:    { perIp: 3,   site: 40  },  // full AI scans (the per-IP 3 matches the old limiter)
  advisor: { perIp: 25,  site: 200 },  // advisor chat messages (7 per visit) and the short search-phrase call
  aicheck: { perIp: 3,   site: 30  },  // AI assistant check (1 web search each)
};

const DAY = 86400;

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
