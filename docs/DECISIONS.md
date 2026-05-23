# DECISIONS.md — PresenceScanner Decision Log

**APPEND ONLY. Never overwrite this file. Add new entries at the bottom with a date.**
This file records what was decided, what failed, and what was abandoned — so dead ideas don't get resurrected.

---

## SETTLED DECISIONS

**Single self-contained HTML file, no build step.**
The product is one HTML file. No React build pipeline. This is final.

**API keys live only in Vercel environment variables.**
Never in code. AI calls go through a serverless function, never browser-direct.
EXCEPTION: The Google Maps *browser* key lives in public/index.html. This is correct
and intentional — browser keys are designed to be visible (they execute in the user's
browser), and they are protected by HTTP referrer restrictions in Google Cloud, NOT by
hiding them. The HTTP referrer restriction is the only thing protecting the billing
account; verify those restrictions whenever the key is touched.

**"Diagnosis, not surgery."**
The tool audits and tells the user what's wrong. It never logs into or manipulates anyone's Google account. Account access would mean liability and labor.

**Carl's Flow is the business-matching architecture.**
Match a user's Google listing in this order: (1) phone-first lookup, (2) owner confirmation screen, (3) autocomplete widget where the user picks their exact listing, (4) manual exception (rare, paid).

**Honest reporting.**
When a website can't be fetched, say "couldn't scan automatically, likely a security setting" — never falsely claim the site is broken, and don't unfairly tank the score.

**Flat, feature-based pricing.**
Pricing is per the software's features — NOT scaled to each customer's needs, no setup fee. A needs-based model would recreate a service business.

**Persistent docs system.**
STATE.md and DECISIONS.md live in /docs/ in the repo. STATE.md is overwritten each session; DECISIONS.md is append-only. Updated as the last action of every working day (or mid-session checkpoint for long sessions).

**Honest scarcity, never fake urgency.**
The founding-member waitlist counter shows the REAL number of claimed spots, hand-edited in code as spots fill. Fake counts and fake urgency were explicitly rejected.

**Working notes vs. official record.**
Michael keeps a detailed glitch journal in Google Docs as he tests (working notes).
The repo docs (STATE.md / DECISIONS.md) are the OFFICIAL summary — what next-Claude
reads on session start. The two are different on purpose: notes are raw and chronological;
the repo docs are curated and current. Both have a job; one does not replace the other.

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
A Mailchimp key was once committed and revoked. Server keys now live only in Vercel env vars. (Note: browser keys are a different case — see Settled Decisions.)

**Owner-notification-on-signup as a pre-beta feature.**
Was suggested as a "fix" for not receiving Mailchimp confirmation emails. Not a bug — Mailchimp was never meant to forward signups to the owner. Building a backend notification system before beta is scope creep. Real feature for later, after beta has revealed actual signup volume worth alerting on.

**SMS/text waitlist signup (deferred for beta).**
Needs a separate service (Twilio), separate cost, separate TCPA compliance. Its own project. Email-only for beta.

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

**May 23, 2026 (mid-session checkpoint)** — Major bug-fixing session. Completed:
- DIAGNOSED a long-standing issue: the Google Maps browser key in public/index.html was
  a placeholder string (`AIza[REDACTED_BROWSER_KEY]`), not a real key. The autocomplete
  widget had been failing silently for any user who tried it. Console error was
  `InvalidKeyMapError`. Root cause: a redacted zip was uploaded for an earlier audit, all
  keys were revoked, and a fresh browser key was generated in Google Cloud — but never
  pasted into the code.
- ALSO DIAGNOSED: The newly-generated browser key's HTTP referrer restrictions in Google
  Cloud were written in the WRONG format (`*.presencescanner.ai` instead of the required
  `https://*.presencescanner.ai/*`). Google silently rejects requests when the restriction
  format is malformed. Both pieces had to be fixed for autocomplete to work.
- Fixed BOTH: Restrictions reformatted to `https://...domain.../*` style. Fresh real key
  pasted into index.html (with a careful cross-check after Michael caught a `AIzaAIza`
  doubling typo before commit).
- VALIDATED: 5-for-5 random local Florida business autocomplete test — all 5 GBPs showed
  up in the dropdown. Autocomplete confirmed working tool-wide.
- DIAGNOSED Glitch #6 (session contamination): The reset() function in index.html was
  clearing only 10 state variables but leaving the 5 user-typed form fields (bizName,
  website, city, phone, email) populated between scans. Stale form values were being
  passed to runScan -> getSiteData on subsequent scans, contaminating the AI's input
  context. Earlier Claude theory (specific website carrying over) was WRONG — Michael
  had not scanned the alleged source business in that session. The honest diagnosis is:
  cross-scan state leakage of some kind in the React form state, fixable at the root by
  clearing all form fields on reset().
- FIXED Glitch #6: Updated reset() to also call setBizName(""), setWebsite(""), setCity(""),
  setPhone(""), setEmail(""). Added a comment explaining why this matters.
- VERIFIED Glitch #6 fix end-to-end: scanned The Flower Box of Sarasota first, clicked
  Scan Another Business, confirmed form was visibly empty (a behavioral change Michael
  could see with his own eyes), then scanned VeniceFlHomeWatch via the "I don't have a
  GBP" path. Resulting report mentioned ZERO content from the prior scan. Bug closed.
- NEW GLITCH CAPTURED (#8): Phone-match returns wrong business when multiple GBPs share
  a phone — Michael's handyman phone matched VeniceFlHomeWatch instead. Real entity-
  conflation surfacing again. Captured for later UX improvement.
- NOT BUGS, confirmed: Lundstrom missing from autocomplete (Google data gap, not tool);
  Michael's own businesses missing from autocomplete (entity conflation). Tool was 5-for-5
  on unrelated random businesses.
- DISCIPLINE NOTES from session: Michael multiple times went off-script ("ohh let me also
  try this") during testing — he flagged it himself each time. Pattern is real. Working
  countermeasure: Claude drafts paste-blocks for Google Doc capture immediately when off-
  script findings appear, then redirects back to the planned test. Worked well today.
- ERROR Claude made and corrected: proposed a specific cause for Glitch #6 (a particular
  carried-over website) before having the data to confirm it. Theory was wrong. Honest
  correction logged in Michael's Google Doc rather than glossed over. Lesson: diagnosis
  must be evidence-based, not story-based; multiple times today Michael had to slow Claude
  down on this. Michael's instinct to verify ("can you see my confusion?", "found it per
  your instructions") consistently caught typos and bad assumptions before commit.
