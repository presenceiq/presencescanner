# DECISIONS.md — PresenceScanner Decision Log

**APPEND ONLY. Never overwrite this file. Add new entries at the bottom with a date.**
This file records what was decided, what failed, and what was abandoned — so dead ideas don't get resurrected.

---

## SETTLED DECISIONS

**Single self-contained HTML file, no build step.**
The product is one HTML file. No React build pipeline. This is final.

**API keys live only in Vercel environment variables.**
Never in code. AI calls go through a serverless function, never browser-direct.

**"Diagnosis, not surgery."**
The tool audits and tells the user what's wrong. It never logs into or manipulates anyone's Google account. Account access would mean liability and labor.

**Carl's Flow is the business-matching architecture.**
Match a user's Google listing in this order: (1) phone-first lookup, (2) owner confirmation screen, (3) autocomplete widget where the user picks their exact listing, (4) manual exception (rare, paid).

**Honest reporting.**
When a website can't be fetched, say "couldn't scan automatically, likely a security setting" — never falsely claim the site is broken, and don't unfairly tank the score.

**Flat, feature-based pricing.**
Pricing is per the software's features — NOT scaled to each customer's needs, no setup fee. A needs-based model would recreate a service business.

**Persistent docs system.**
STATE.md and DECISIONS.md live in /docs/ in the repo. STATE.md is overwritten each session; DECISIONS.md is append-only. Updated as the last action of every working day.

---

## ABANDONED — DO NOT RESURRECT

**Name + city text search as primary matching.**
Returns wrong/competitor businesses confidently (e.g. "Putnam Realty Venice" returned a firm in Venice, ITALY). Abandoned in favor of Carl's Flow.

**kgmid -> place_id conversion.**
No reliable documented API path. Falls back to unreliable name search. Abandoned.

**Resolving short share.google/... links.**
Google returns 403 to automated fetches. Abandoned.

**Deploying as a React app with a build step.**
Caused days of deployment failures. Replaced permanently by the single-HTML, no-build architecture.

**API keys in the code.**
A Mailchimp key was once committed and revoked. Keys now live only in Vercel env vars.

---

## LOG

**May 19, 2026** — Context recovered after multiple chat restarts. Docs system (STATE.md + DECISIONS.md) created and committed to /docs/. No features built today.

**May 19, 2026 (end of session)** — Productive build session. Completed:
- Security audit of the whole codebase — key handling is correct (server keys in env vars,
  Google browser key visible-but-domain-restricted by design). All keys ever committed have
  been revoked. Audit closed clean.
- Built the FOUNDING-MEMBER WAITLIST. Decision: chose a lightweight email-capture waitlist
  (Option A) over a full Stripe payment flow (Option B). Reasoning: capture demand now with
  near-zero risk, prove people want it before building payment plumbing. Stripe is deferred,
  not abandoned — it becomes the right move once the waitlist has names in it.
- subscribe.js change: added an OPTIONAL `tag` parameter. If none is sent it defaults to
  `presence-scanner`, so existing scan-form signups are unaffected. Waitlist signups send
  `founding-member-waitlist`. Verified end-to-end: a brand-new email landed in Mailchimp as
  `pending` with the correct tag.
- Honest scarcity decision: the "X of 50 spots claimed" counter shows the REAL number, hand-
  edited as spots fill. Fake/inflated urgency was explicitly rejected.
- Fixed the website-not-pulled bug (fix-list item B). The phone-match and Maps-link scan
  paths were passing the BLANK form field to be scanned instead of the website returned in
  the matched Google listing. Now they use `listing.website || formField`. Tested & confirmed.
- DEFERRED, deliberately: SMS/text signup option for the waitlist (needs a separate service
  like Twilio, separate cost, and TCPA compliance — its own project, not a tweak).
- DEFERRED, deliberately: owner-notification-on-signup (emailing Michael when someone signs
  up). Not a bug — Mailchimp was never meant to do this. Real feature for later; needs a
  sending service + verified domain. Not worth building during beta with few signups.
- NOT A BUG, confirmed: when 2 of Babe's Plumbing's 3 phone numbers scan as "no website,"
  that is the tool correctly reporting that those Google listings are incomplete. Entity
  conflation (one business, multiple listings, inconsistent data) is real and now confirmed
  in the wild. Idea logged: smarter messaging to distinguish "no website at all" from
  "this listing is missing the website."
