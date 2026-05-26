// ---------------------------------------------------------------
// KILL SWITCH HELPER
//
// One-line check used by every API endpoint. When the SITE_DISABLED
// environment variable in Vercel is set to "true", every API call
// returns a friendly "we're temporarily offline" response instead of
// running. Flipping the env var in Vercel takes effect within ~30
// seconds — no code deploy needed.
//
// To enable: in Vercel dashboard → Settings → Environment Variables,
//   add SITE_DISABLED = true (Production environment), save.
// To disable: same screen, change value to false OR remove the var.
//
// Use in any API endpoint like this:
//
//   import { isSiteDisabled, disabledResponse } from './_killswitch.js';
//   export default async function handler(req, res) {
//     // ... CORS headers ...
//     if (isSiteDisabled()) return disabledResponse(res);
//     // ... rest of handler ...
//   }
// ---------------------------------------------------------------

export function isSiteDisabled() {
  // Case-insensitive check so "true", "True", "TRUE" all work the same.
  const val = (process.env.SITE_DISABLED || '').toString().trim().toLowerCase();
  return val === 'true' || val === '1' || val === 'yes';
}

export function disabledResponse(res) {
  return res.status(503).json({
    disabled: true,
    error: 'PresenceScanner is temporarily offline for maintenance. Please check back soon.',
  });
}
