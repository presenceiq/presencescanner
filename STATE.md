# STATE.md — PresenceScanner Current State

**Snapshot date:** May 23, 2026 (mid-session checkpoint)
**This file is overwritten every session. It shows the project as it is RIGHT NOW.**

---

## NEXT STEP
Pick ONE glitch from the FIX LIST below. Recommended (highest user impact still open): Glitch #5 (post-selection "Something went wrong" error) or Glitch #2 (results page should display the user's inputs / confirm business identity). Do not start multiple items at once.

## LIVE AND DEPLOYED
- Site: presencescanner.ai (also presencescanner.vercel.app)
- Repo: github.com/presenceiq/presencescanner — hosted on Vercel, auto-deploys on every commit
- Architecture: single self-contained HTML file, NO build step
- Repo structure: `api/` folder, `public/` folder, `vercel.json` at root, `docs/` folder
- API keys live ONLY in Vercel environment variables: ANTHROPIC_KEY, GOOGLE_PLACES_KEY, REACT_APP_MAILCHIMP_KEY, MAILCHIMP_API_KEY, MAILCHIMP_AUDIENCE_ID
- Google Maps browser key lives in public/index.html (this is correct — browser keys are visible by design, protected by HTTP referrer restrictions in Google Cloud)
- Google Cloud HTTP referrer restrictions for the browser key (exactly): `https://*.presencescanner.ai/*`, `https://presencescanner.ai/*`, `https://*.vercel.app/*`
- Config (not secret): Mailchimp audience d81f996825, server us17; GA4 ID G-WD4QS0XK2C

## CONFIRMED BUILT AND WORKING
- api/findplace.js — phone-first lookup (correctly returns website field)
- api/resolveplace.js — place_id resolution (correctly returns website field)
- api/fetchsite.js — website fetcher with browser headers; honest "could not reach" reporting
- api/subscribe.js — Mailchimp signup; accepts optional `tag` param (defaults to `presence-scanner`)
- api/scan.js — Anthropic API proxy (pass-through only, no scoring logic)
- api/places.js — Google Places lookup
- Phone confirmation screen ("Is this your business?")
- Autocomplete widget — confirmed working tool-wide (5-for-5 random local business test May 23)
- GEO Score (7th scan category)
- "What Changed This Month" algorithm feed
- "Invisible to AI" homepage headline
- Google Analytics (GA4)
- public/widgettest.html — widget test page
- Founding-member waitlist — results-page section; tested end-to-end May 19; pending tag in Mailchimp confirmed
- Website-from-listing fix — phone-match and Maps-link scan paths pull website from matched Google listing
- **Session contamination fix (Glitch #6)** — reset() now clears all 5 user form fields (bizName, website, city, phone, email) between scans, preventing cross-scan AI prompt contamination. Tested May 23 end-to-end.

## FIX LIST — NOT YET BUILT (verify against live code before acting)

### Open glitches from May 23 testing session:
1. **Glitch #2** — Results page should display user inputs and confirm business identity (small UX improvement)
2. **Glitch #4** — Autocomplete shows then DROPS a listing as you keep typing (instability — type "VeniceFlH" finds it, next letter loses it, backspace finds it again)
3. **Glitch #5** — "Something went wrong loading that business" error after selecting a valid autocomplete listing. Possibly in resolveplace.js or post-selection handler. Real bug.
4. **Glitch #8** — Phone-match returns wrong business when multiple GBPs share a phone (real-world entity conflation; UX could flag name mismatch to user)

### Earlier items still open:
5. Verify line-705 "candidate-chosen" path — passes form `website` not listing's; may have same bug as item B fixed earlier
6. Smarter "no website" messaging — distinguish "business has no website at all" from "this Google listing is missing the website"
7. PresenceIQ -> PresenceScanner branding inconsistency — logo says PresenceIQ, AI advisor says PresenceScanner
8. Confirm the Mailchimp double opt-in email actually arrives (likely a sending-domain setting, NOT code)
9. From original backlog: Stripe payment flow; Microsoft Clarity; address-nudge safeguard; guided fix-instructions; rate limiter; competitor comparison; real website crawling; before/after dashboard; exit-intent popup; delete PASTE_YOUR_BROWSER_KEY comment.

## NOT BUGS — DO NOT TRY TO FIX (real-world data issues)
- Glitch #1 (Lundstrom not in candidates): Confirmed Lundstrom has a GBP, but autocomplete data gap. Not tool-wide (5-for-5 other businesses worked).
- Glitch #3 (Michael's own businesses missing in autocomplete): entity-conflation, shared phone, weak local signals. Real-world data gap, not code.

## KNOWN ISSUES / PARKED
- Entity conflation is real and confirmed: businesses with multiple GBPs (one per location/number) often have inconsistent data across them. Examples: Babe's Plumbing, Michael's own portfolio (handyman + home watch share phone). When a phone-lookup returns a different GBP than the user named, that's Google's choice, not a tool bug — though the UX could improve by flagging the name mismatch (Glitch #8).
- Detailed glitch journal lives in Michael's Google Doc (working notes). This STATE.md is the official summary.
