# STATE.md — PresenceScanner Current State

**Snapshot date:** May 19, 2026
**This file is overwritten every session. It shows the project as it is RIGHT NOW.**

---

## NEXT STEP
Nothing built yet this session — context was recovered and the docs system was set up. The next real task to pick is the founding-member signup + pricing flow (the keystone launch task), unless Michael chooses otherwise.

## LIVE AND DEPLOYED
- Site: presencescanner.ai (also presencescanner.vercel.app)
- Repo: github.com/presenceiq/presencescanner — hosted on Vercel, auto-deploys on every commit
- Architecture: single self-contained HTML file, NO build step
- Repo structure: `api/` folder, `public/` folder, `vercel.json` at root, `docs/` folder (new)
- API keys live ONLY in Vercel environment variables: ANTHROPIC_KEY, GOOGLE_PLACES_KEY, REACT_APP_MAILCHIMP_KEY, MAILCHIMP_API_KEY, MAILCHIMP_AUDIENCE_ID

## CONFIRMED BUILT AND WORKING
- api/findplace.js — phone-first lookup
- api/resolveplace.js — place_id resolution
- api/fetchsite.js — website fetcher with browser headers
- api/subscribe.js — Mailchimp signup
- api/scan.js — Anthropic API proxy
- api/places.js — Google Places lookup
- Phone confirmation screen ("Is this your business?")
- Autocomplete widget — built and integrated into index.html
- GEO Score (7th scan category)
- "What Changed This Month" algorithm feed
- "Invisible to AI" homepage headline
- Google Analytics (GA4 ID G-WD4QS0XK2C)
- public/widgettest.html — widget test page
- Verified working end-to-end via live test (Babe's Plumbing returned a correct report)

## NOT YET BUILT (verify against live code before acting)
- Founding-member signup + pricing flow — keystone launch task
- Stripe payment integration
- Microsoft Clarity analytics
- Email verification / Mailchimp double opt-in (deferred)
- Address-nudge safeguard in autocomplete
- Guided fix-instructions system (Version 1)
- Rate limiter
- Competitor comparison
- Real website crawling
- Before/after improvement dashboard
- Exit-intent popup
- Cosmetic: PASTE_YOUR_BROWSER_KEY placeholder still in an index.html comment (harmless)

## KNOWN ISSUES / PARKED
- Michael's own businesses share one phone number across ~4 GBPs (entity conflation). This is a real-world problem for Michael, NOT a PresenceScanner code bug. Parked.
