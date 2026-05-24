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

**Diagnose before fixing.**
When a bug appears, the disciplined response is to find the cause with evidence (controlled
re-test, code reading, console output) BEFORE writing a fix. Theory-driven fixes are
guesses dressed as solutions. Evidence-driven fixes are real.

**"Can't reproduce" is a legitimate outcome.**
If a bug appears once and cannot be reproduced under controlled testing, the honest position
is "watch-list, not closed, not actively broken" — not "write a speculative fix anyway." Real
bugs reappear; transient API hiccups don't.

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

**Pure affiliate marketing as the business model.**
Considered and rejected May 23 after external strategic review. Affiliate-only has no
moat, no owned asset, and is being eroded by AI search. Affiliates remain a real revenue
layer underneath the proprietary tool (see Five-Layer Product Model), but they are not
the business itself.

**Out-featuring Semrush / BrightLocal / Yext / Birdeye.**
These platforms have dev teams, funding, and mature infrastructure. Trying to compete on
their features is a losing battlefield. The opening is serving the confused small business
owner, not the SEO professional — see Diagnostic-Not-SEO Filter.

---

## LOG

**May 19, 2026** — Context recovered after multiple chat restarts. Docs system (STATE.md + DECISIONS.md) created and committed to /docs/. No features built today.

**May 19, 2026 (end of session)** — Productive build session. Completed:
- Security audit of the whole codebase — key handling is correct (server keys in env vars,
  Google browser key visible-but-domain-restricted by design). All keys ever committed have
  been revoked. Audit closed clean.
- Built the FOUNDING-MEMBER WAITLIST. Decision: chose a lightweight email-capture waitlist
  (Option A) over a full Stripe payment flow (Option B). Reasoning: capture demand now with
  near-zero risk, prove people want it before building payment plumbing.
- subscribe.js change: added an OPTIONAL `tag` parameter. Waitlist signups send
  `founding-member-waitlist`. Verified end-to-end.
- Honest scarcity decision: the "X of 50 spots claimed" counter shows the REAL number.
- Fixed the website-not-pulled bug. The phone-match and Maps-link scan paths were passing
  the BLANK form field to be scanned instead of the website returned in the matched Google
  listing. Now they use `listing.website || formField`. Tested & confirmed.
- DEFERRED: SMS/text signup option; owner-notification-on-signup.
- Entity conflation confirmed in the wild: Babe's Plumbing has 3 phone numbers, only one
  GBP has the website filled in. Tool correctly reports "no website" for incomplete listings.

**May 23, 2026 (mid-session checkpoint)** — Major bug-fixing session. Completed:
- Diagnosed and fixed the Google Maps browser key issue: placeholder string in code +
  malformed HTTP referrer restrictions in Google Cloud. Both fixed. Autocomplete now
  works tool-wide (validated by 5-for-5 random local business test).
- Diagnosed and fixed Glitch #6 (session contamination): reset() function was clearing
  10 state variables but leaving the 5 user-typed form fields populated between scans.
  Updated reset() to clear bizName, website, city, phone, email. Verified end-to-end.
- New glitch captured (#8): phone-match returns wrong business when multiple GBPs share
  a phone. Real entity-conflation, not a code bug — but a UX flag opportunity.
- Confirmed not-bugs: Lundstrom missing from autocomplete (Google data gap); Michael's
  own businesses missing (entity conflation).

**May 23, 2026 (end of session)** — Second-half work after dinner. Completed:
- Investigated Glitch #5 ("Something went wrong loading that business"). 3-pick test
  succeeded for all three picks; bug did not reproduce. Honest call: do not write a
  speculative fix. Status: watch-list with a captured improvement plan for resolveplace.js.
- Built Glitch #2 fix — business-identity confirmation block on the results page. Shows
  matched business name, address, phone, five-star rating display, and review count.
  Three coordinated code changes; clean upload preserving the earlier Glitch #6 fix.
- Polish iteration: original single-star display read as "1 star" instead of "4.8 of 5";
  changed to five gold stars + rating number (Google/Yelp pattern). Visually unambiguous.
- Score variability captured for later (69 vs 71 on back-to-back scans, normal AI variance).
- Discipline notes: Michael caught at least three real mistakes that would have shipped
  (doubled AIza in API key, stale working copy that would have undone Glitch #6, wrong
  Ctrl+F count from Claude). The working partnership pattern is sound.

**May 23, 2026 (late evening)** — Strategic research and validation. Two rounds of
competitive research via ChatGPT plus a third pass on the build-vs-affiliate question.
Key inputs added: verified pricing for Yext, Whitespark, GoSite, Paige; verified
complaint patterns across GoSite, Birdeye, Podium (cancellation/contract friction);
identified that Birdeye already has a free AI Visibility Checker, narrowing but not
closing the AI-visibility-transparency opportunity. Third-party ChatGPT pass
independently validated the hybrid model (lightweight proprietary scanner + affiliate
revenue underneath) and the diagnostic-not-SEO positioning. The strategic
foundation for May 24's decisions came from these three research passes.

**May 24, 2026 (Sunday morning strategic session)** — Four binding strategic decisions
locked in before church. These shape every future feature and messaging choice.

DECISION 1 — PRIMARY IDENTITY FRAME
PresenceScanner's primary identity is a "free online footprint health check, including
AI search visibility." The consumer-facing word is "footprint" (concrete, plain-English,
relatable to a non-technical owner like Joe the plumber). AI visibility is called out
as one of the things being checked, not as the headline category — this gives the best
of both worlds: instant comprehension from non-tech owners plus credibility with the
tech-aware crowd, and ages well regardless of whether AI buzz cools. The brand name
remains PresenceScanner; brand names and consumer language don't have to match (Credit
Karma doesn't call its score a "karma score"). Mental model for positioning: this is
like Credit Karma for online presence, or a home inspection report — a free, finite,
plain-English diagnostic that everyone immediately understands.

DECISION 2 — FIVE-LAYER PRODUCT MODEL
PresenceScanner is formally structured as five stacked layers. Layer 1 is the free scan,
no signup required — the trust engine and lead magnet. Layer 2 is the free plain-English
fixes that accompany every scan — what makes the tool useful rather than just informational.
Layer 3 is affiliate and service recommendations underneath the fixes — passive revenue
that's additive to subscription revenue, not competing with it. Layer 4 is a roughly $99
one-time-purchase DIY product that delivers a personalized, business-specific guide built
DIRECTLY FROM THE BUYER'S OWN SCAN RESULTS — not a generic template. Format at launch is
emailed PDF (zero marginal cost, instant delivery); printed-mailed upgrade can be added
later if demand pulls it. The DIY tier serves the hands-on owner who wants a tangible
deliverable and resists subscriptions, and includes an automated drip campaign that
checks in on buyer progress and serves as the bridge to Layer 5. Layer 5 is the recurring
founding-member subscription at $19/month for ongoing support, ongoing relationship, and
ongoing tracking. The two paid tiers (Layer 4 one-time, Layer 5 recurring) are not
competing offers — they serve different buyer psychologies and one funnels into the other.

DECISION 3 — DIAGNOSTIC-NOT-SEO FILTER
Every future feature must be evaluated against this binding filter before being built.
Does the feature make the product more diagnostic — clearer, more actionable, more
plain-English, more focused on the confused small business owner? If yes, it can go
in the roadmap. Does the feature make the product more like SEO infrastructure —
heavier data, more dashboards, more agency-oriented complexity, aimed at SEO
professionals? If yes, it doesn't belong, regardless of how reasonable it sounds.
Some features sit ambiguously between the two and require judgment (e.g., AI search
visibility can be either diagnostic or SEO-infrastructure depending on presentation).
This filter does not mean PresenceScanner can never grow into something more complex;
it means any deliberate move into SEO-infrastructure territory must be a conscious
strategic choice with full awareness, not a slow drift. The category PresenceScanner
competes in — diagnostic infrastructure for small business owners — is genuinely
underserved; the SEO-infrastructure category is genuinely overcrowded. Stay in the
underserved category.

DECISION 4 — AFFILIATE PLACEMENT PRINCIPLE
Affiliate and service recommendations (Layer 3) appear on result-bearing pages AFTER
the diagnosis is complete, never interrupting it. The trust contract of a diagnostic
tool is "free scan → real findings → real fixes → THEN, here are tools that can help
with those fixes." Inserting affiliate cards in the middle of the diagnosis breaks
that trust contract because the reader's mental model shifts from "this tool is
helping me" to "this tool is selling me" at exactly the moment value should be
landing. Once value has been delivered, the same affiliate cards read as helpful
suggestions rather than salesy interruptions. This principle applies to any future
placement decisions on result-bearing pages, not just the current results view. The
specific implementation task for the current results page (move AffCards below the
category findings) is queued in STATE.md as a fix-list item for the next coding
session.

These four decisions, taken together, are the strategic foundation for everything
PresenceScanner does next. Every future feature, messaging change, and build
priority gets checked against this foundation before being acted on.

**Session output**: Strategic foundation locked. No code changes today. The feature
gap analysis and the formal ROADMAP.md document remain queued for a future 1-2 hour
focused session, now to be built on top of this strategic foundation rather than
from a blank slate.
