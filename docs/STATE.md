# STATE.md — PresenceScanner Current State

**Snapshot date:** May 24, 2026 (Sunday morning strategic session)
**This file is overwritten every session. It shows the project as it is RIGHT NOW.**

---

## NEXT STEP
Two real paths, pick deliberately. Path A: complete the queued strategy session — produce the feature gap analysis and the formal ROADMAP.md document, built on top of the four strategic decisions locked in on May 24 (positioning, five-layer model, diagnostic-not-SEO filter, affiliate placement principle). Estimated 1-2 hour focused session. Path B: pick ONE fix-list item and execute it. Recommended highest-impact fix-list item: move AffCards below the category findings in the results view (implements the Affiliate Placement Principle from DECISIONS.md — small contained code change, real user trust improvement). Do not start multiple items at once.

## LIVE AND DEPLOYED
- Site: presencescanner.ai (also presencescanner.vercel.app)
- Repo: github.com/presenceiq/presencescanner — hosted on Vercel, auto-deploys on every commit
- Architecture: single self-contained HTML file, NO build step
- Repo structure: `api/` folder, `public/` folder, `vercel.json` at root, `docs/` folder
- API keys live ONLY in Vercel environment variables: ANTHROPIC_KEY, GOOGLE_PLACES_KEY, REACT_APP_MAILCHIMP_KEY, MAILCHIMP_API_KEY, MAILCHIMP_AUDIENCE_ID
- Google Maps browser key lives in public/index.html (correct — browser keys are visible by design, protected by HTTP referrer restrictions in Google Cloud)
- Google Cloud HTTP referrer restrictions for the browser key (exactly): `https://*.presencescanner.ai/*`, `https://presencescanner.ai/*`, `https://*.vercel.app/*`
- Config (not secret): Mailchimp audience d81f996825, server us17; GA4 ID G-WD4QS0XK2C

## STRATEGIC FOUNDATION (locked May 24, 2026 — see DECISIONS.md)
- Primary identity frame: "Free online footprint health check, including AI search visibility." Consumer word is "footprint."
- Five-layer product model: free scan → free fixes → affiliate recommendations → $99 personalized DIY guide → $19/mo founding-member subscription.
- Diagnostic-not-SEO filter applies to all future feature decisions.
- Affiliate placement principle: affiliates go after the diagnosis is complete, never interrupting it.

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
- "Invisible to AI" homepage headline (will be updated to reflect new positioning per Decision 1)
- Google Analytics (GA4)
- public/widgettest.html — widget test page
- Founding-member waitlist — results-page section; tested end-to-end May 19; pending tag in Mailchimp confirmed
- Website-from-listing fix — phone-match and Maps-link scan paths pull website from matched Google listing
- Session contamination fix (Glitch #6) — reset() now clears all 5 user form fields between scans
- Business identity confirmation block (Glitch #2) — results page shows matched business name, address, phone, ★★★★★ rating · review count

## FIX LIST — NOT YET BUILT (verify against live code before acting)

### High-impact items connected to strategic decisions:
1. **Move AffCards below category findings in results view** — implements the Affiliate Placement Principle (Decision 4). Currently affiliate cards interrupt the diagnosis flow; moving them to after the category findings preserves the trust contract. Small contained code change, real UX improvement.
2. **Homepage messaging refresh** — reflect the new positioning (Decision 1). "Free Online Footprint Health Check — including how AI search engines see your business" or similar. Headline, subhead, founding-member offer copy. Larger task, deserves its own session.
3. **AI Advisor language update** — match new positioning (Decision 1). Currently uses "Presence Advisor" framing; update intro copy to reflect "footprint health check" language while keeping AI label.

### Open glitches still real:
4. **Glitch #4** — Autocomplete shows then DROPS a listing as you keep typing (type "VeniceFlH" finds it, next letter loses it, backspace finds it again). Lives partly in Google's Places library; may be diagnostic-only first pass.
5. **Glitch #5** — "Something went wrong loading that business" error after a valid autocomplete pick. Could not reproduce on May 23. Status: WATCH-LIST. Improvement plan: add proper error surfacing in api/resolveplace.js (currently swallows Google's status/error_message).
6. **Glitch #8** — Phone-match returns wrong business when multiple GBPs share a phone (real-world entity conflation; UX could flag name mismatch to user).
7. **Score variability** — Same business scanned twice gives slightly different scores. Normal AI variability. Captured for later if consistency becomes a felt problem.

### Earlier items still open:
8. Verify line-705 "candidate-chosen" path — passes form `website` not listing's; may have same bug as item B fixed earlier.
9. Smarter "no website" messaging — distinguish "business has no website at all" from "this Google listing is missing the website."
10. PresenceIQ → PresenceScanner branding inconsistency — logo says PresenceIQ, AI advisor says PresenceScanner.
11. Confirm the Mailchimp double opt-in email actually arrives (likely a sending-domain setting, NOT code).
12. From original backlog: Stripe payment flow; Microsoft Clarity; address-nudge safeguard; guided fix-instructions; rate limiter; competitor comparison; real website crawling; before/after dashboard; exit-intent popup; delete PASTE_YOUR_BROWSER_KEY comment.

### New features from strategic decisions:
13. **Layer 4 build — $99 personalized DIY guide** — deliverable is the user's free-scan results reformatted and expanded into a tangible printable guide (PDF + email at launch). Needs: PDF generation, payment integration (likely Stripe), email delivery, drip campaign architecture. Real multi-session build. Queue after Layer 4 demand is validated by founding-member subscription traction.
14. **Bug-report mechanism for beta users** — small persistent "Something off?" link in footer, opens modal with text area + optional email + screenshot attachment. Submit to Formspree. Captured for pre-beta launch. Estimated 1-3 hours.
15. **Ambient sentiment pulse (😀😐😞 buttons)** — separate feature from bug report. "How are you finding the tool so far?" ongoing read on user mood. Different session, different placement.

## QUEUED STRATEGY SESSION
- Feature gap analysis + formal ROADMAP.md document
- Maps PresenceScanner's current feature inventory against verified competitor capabilities
- Output: docs/ROADMAP.md committed alongside STATE.md and DECISIONS.md
- Estimated 1-2 hour focused session
- Built on top of the four May 24 strategic decisions, not from a blank slate

## NOT BUGS — DO NOT TRY TO FIX (real-world data issues)
- Glitch #1 (Lundstrom not in candidates): Confirmed Lundstrom has a GBP, but autocomplete data gap. Not tool-wide (5-for-5 other businesses worked).
- Glitch #3 (Michael's own businesses missing in autocomplete): entity-conflation, shared phone, weak local signals. Real-world data gap, not code.

## KNOWN ISSUES / PARKED
- Entity conflation is real and confirmed: businesses with multiple GBPs often have inconsistent data across them.
- Michael keeps a detailed glitch journal in Google Docs (working notes). This STATE.md is the official summary.
- Anthropic API spend: $309.47 of $400 cap this month (heavy direct AI conversation usage on FHV chat). Balance $3.41. Top up needed before more meaningful testing. Cost-per-scan TBD before beta volume.
