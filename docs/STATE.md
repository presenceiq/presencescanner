# STATE.md — PresenceScanner Current State

**Snapshot date:** May 24, 2026 (Sunday evening sign-off)
**This file is overwritten every session. It shows the project as it is RIGHT NOW.**

---

## NEXT STEP
Two real paths, pick deliberately when the next session starts. Path A: complete the queued strategy session — produce the feature gap analysis and the formal ROADMAP.md document, built on top of the four locked strategic decisions. Estimated 1-2 hour focused session. Path B: pick the next item from the build list below and execute it. Recommended next build item if Path B is chosen: AI Advisor language update (item 2 below) — small, contained, finishes the Decision 1 work that the homepage refresh started.

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
- Google Analytics (GA4)
- public/widgettest.html — widget test page
- Founding-member waitlist — results-page section; tested end-to-end May 19; pending tag in Mailchimp confirmed
- Website-from-listing fix — phone-match and Maps-link scan paths pull website from matched Google listing
- Session contamination fix (Glitch #6) — reset() now clears all 5 user form fields between scans
- Business identity confirmation block (Glitch #2) — results page shows matched business name, address, phone, ★★★★★ rating · review count
- Affiliate Placement Principle implemented (Decision 4) — affiliate cards and founding waitlist now render AFTER the seven category findings; trust contract preserved
- Anchor teaser strip on results page — two small jump-links ("See recommended tools", "Lock in founding pricing") near the top of results, smooth-scroll to those sections; visually quiet by design
- Homepage messaging refresh (Decision 1 in code) — headline now "Does Your Business Show Up Online as it Should?"; subhead about free online footprint health check; browser tab title and meta description updated; "AI-POWERED PRESENCE SCANNER" eyebrow preserved for tech-aware credibility
- Headline typography fix — Syne font weight 600 with relaxed letter-spacing and increased line-height; font import expanded to include weights 400/500/600 so weight 600 renders as a real font weight rather than a faked one

## FIX LIST — NOT YET BUILT (in priority order)

### 1. AI Advisor language update
Update the chat advisor's intro language to match Decision 1's positioning. Currently uses "Presence Advisor" framing. Should reflect "online footprint health check" while keeping the AI label. Small, contained, finishes the Decision 1 work that the homepage refresh started.

### 2. Glitch #4 — Autocomplete drops listings as you type
Type "VeniceFlH" finds it; next letter loses it; backspace finds it again. Lives partly in Google's Places library; may be diagnostic-only first pass with no full fix possible. Real credibility issue when it bites users — worth investigating even if the fix turns out to be UX mitigation rather than root-cause.

### 3. Glitch #8 — Phone-match returns wrong business when phones shared
Real-world entity conflation (Michael's handyman phone returned home watch listing). UX flag opportunity: when name and matched-listing-name don't align, surface a "this isn't the right business?" prompt.

### 4. Smarter "no website" messaging
Distinguish "business has no website at all" from "this Google listing is missing the website field but the business has one." Two different problems, two different recommendations.

### 5. PresenceIQ → PresenceScanner branding fix
Logo and nav still say "PresenceIQ" while AI advisor and product copy now say "PresenceScanner." Pick one and unify everywhere. Probably PresenceScanner based on Decision 1 momentum.

### 6. Bug-report mechanism for beta users
Small persistent "Something off?" link in footer, opens modal with text area + screenshot attachment + optional email. Submit to Formspree. Founding-member-ownership framing in the copy. Captured for pre-beta launch. Estimated 1-3 hours.

### 7. Ambient sentiment pulse (😀😐😞 buttons)
Separate feature from bug report. "How are you finding the tool so far?" — ongoing read on user mood. Different session, different placement.

### 8. Site-wide UX/readability pass (CAPTURED FROM MAY 24 OBSERVATION)
Two compounding readability problems documented during testing: (1) bright saturated cyan/green/orange accents on near-black backgrounds cause eye strain even though contrast math passes; (2) body text is 12.5-13.8px when modern standards call for 16px minimum, especially for the 40-60+ target audience. Do NOT patch piecemeal. Address typography sizing, color saturation, contrast, and the strategic question of whether the dark theme is right for the audience at all (Birdeye/BrightLocal lean light) in one focused 1-2 hour UX pass. Best paired with broader homepage and AI advisor copy work since it touches a lot of surface area.

### 9. Glitch #5 — "Something went wrong loading that business" (WATCH-LIST)
Could not reproduce on May 23 (3 picks succeeded). Status: not closed, not actively broken. Improvement plan when it next reappears: add proper error surfacing in api/resolveplace.js so the actual Google status/error_message is captured rather than swallowed.

### 10. Earlier carry-over items
Verify line-705 "candidate-chosen" path passes listing's website not form's; Stripe payment flow (for Layer 4 launch); Microsoft Clarity; address-nudge safeguard; guided fix-instructions; rate limiter; competitor comparison; real website crawling; before/after dashboard; exit-intent popup; delete PASTE_YOUR_BROWSER_KEY_HERE comment from the Google Maps script tag in index.html.

### 11. Layer 4 build — $99 personalized DIY guide
Deliverable is the user's free-scan results reformatted and expanded into a tangible printable guide (PDF + email at launch). Needs: PDF generation, payment integration (Stripe), email delivery, drip campaign architecture. Real multi-session build. Queue after Layer 5 (founding-member subscription) traction validates demand.

## QUEUED STRATEGY SESSION
- Feature gap analysis + formal ROADMAP.md document
- Maps PresenceScanner's current feature inventory against verified competitor capabilities
- Output: docs/ROADMAP.md committed alongside STATE.md and DECISIONS.md
- Estimated 1-2 hour focused session
- Built on top of the four locked strategic decisions

## NOT BUGS — DO NOT TRY TO FIX (real-world data issues)
- Glitch #1 (Lundstrom not in candidates): Confirmed Lundstrom has a GBP, but autocomplete data gap. Not tool-wide (5-for-5 other businesses worked).
- Glitch #3 (Michael's own businesses missing in autocomplete): entity-conflation, shared phone, weak local signals. Real-world data gap, not code.
- Score variability (69 vs 71 on back-to-back scans): normal AI variance, not urgent.

## KNOWN ISSUES / PARKED
- Entity conflation is real and confirmed: businesses with multiple GBPs often have inconsistent data across them.
- Michael keeps a detailed glitch journal in Google Docs (working notes). This STATE.md is the official summary.
- Anthropic API spend: $309.47 of $400 cap this month (heavy direct AI conversation usage on FHV chat). Balance $3.41. Top up needed before more meaningful testing. Cost-per-scan TBD before beta volume.

## END-OF-SESSION NOTES (May 24, Sunday evening)
Full day completed under the new strategic foundation. Morning session locked in four binding decisions. Afternoon shipped Decision 4 in code. Evening shipped Decision 1 in homepage copy plus anchor teasers, typography fix, and a real readability observation captured for the next UX pass. Repo and docs reflect everything actually built. Tomorrow picks up from a strong foundation, no orientation work needed.
