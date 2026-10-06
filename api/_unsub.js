// Shared by /api/sendreport and /api/unsubscribe. The unsubscribe link is
// signed so nobody can unsubscribe somebody else by guessing a link. The
// signing key is RESEND_API_KEY (already in Vercel), so no new setting is
// needed. If that key is ever replaced, links in older emails stop working;
// those people can still reply to any email and be removed by hand.
import crypto from 'crypto';

export function unsubToken(email) {
  return crypto.createHmac('sha256', String(process.env.RESEND_API_KEY || ''))
    .update('unsub:' + String(email).trim().toLowerCase()).digest('hex').slice(0, 32);
}

export function tokenOk(email, token) {
  const want = Buffer.from(unsubToken(email));
  const got = Buffer.from(String(token || ''));
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}
