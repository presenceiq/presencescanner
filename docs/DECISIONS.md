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
The founding-member waitlist counter shows the REAL number of claimed founding spots, hand-edited in code as spots fill. Fake counts and fake urgency were explicitly rejected.

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
placement decisions on result-bearing pages, not just the current results view.

These four decisions, taken together, are the strategic foundation for everything
PresenceScanner does next. Every future feature, messaging change, and build
priority gets checked against this foundation before being acted on.

**May 24, 2026 (Sunday afternoon implementation)** — Shipped Decision 4. Affiliate
cards and founding-member waitlist moved BELOW the seven category findings in the
results view. New render sequence: score + identity → AI advisor chat → algorithm
feed → category findings (the diagnosis) → affiliate recommendations → founding-member
offer → rescan button. Single surgical edit, JSX syntax check passed. Tested in
fresh incognito on Flower Box of Sarasota — render order verified, trust contract
visibly restored.

**May 24, 2026 (Sunday evening session)** — Continued building under the new strategic
foundation. Five further changes shipped in one session, all tied to the four locked
decisions and to direct user observations from real testing.

CHANGE A — Anchor teaser strip on the results page.
The Decision 4 reorder solved the trust-contract problem but created a discoverability
problem: the founding-member offer was now buried below seven category cards. Two small
jump-link teasers added near the top of the results view (right under the score block):
"See recommended tools" and "Lock in founding pricing." Click either and the page smoothly
scrolls to that section. Visually quiet by design — small grey pills, not loud call-to-
action buttons — so they offer the shortcut without breaking the natural read order or
edging back toward salesy. This is consistent with Decision 4's spirit: the diagnosis
still leads, but the curious can skip to the deeper offer without scrolling past
everything. Honest principle behind the placement: anchors should feel like a quiet
table of contents, never like demands.

CHANGE B — Homepage messaging refresh (Decision 1 in code).
Headline changed from "Is Your Business Invisible to AI?" to "Does Your Business Show
Up Online as it Should?" Subhead changed to "Get a free health check on your online
footprint — Google, AI search, reviews, and more. Results in plain English, delivered
in 30 seconds." Browser tab title changed from "PresenceIQ — Is Your Business Invisible
Online?" to "PresenceScanner — Free Online Footprint Health Check." Meta description
updated to match. The "AI-POWERED PRESENCE SCANNER" eyebrow line above the headline was
deliberately kept to preserve the tech-aware credibility signal that Decision 1 also
preserves. Headline language was Michael's draft, sharpened from Claude's three options
— the "as it should" hook is Michael's contribution and is sharper than any of Claude's
proposals. Lesson worth recording: Michael has strong copy instinct that should be
trusted over Claude's defaults.

CHANGE C — Headline typography fix.
After the headline copy change shipped, the new (longer) text rendered as visually
squished because the previous CSS used a maximum font-size of 3.8rem with weight 800
and letter-spacing -1.5px, which had been tuned for the much shorter old headline. Two
adjustments: font weight dropped from 800 to 600 (much thinner letters), max font-size
dropped from 3.8rem to 2.5rem (no longer tries to stretch to fill the screen), line-
height loosened from 1.08 to 1.25 (more vertical breathing room), letter-spacing
relaxed from -1.5px to -0.5px. Plus a real font-import fix: the Syne font import was
only loading weights 700 and 800, so any lighter weight specified in CSS would have
been faked by the browser; the import was expanded to include weights 400, 500, 600,
700, 800 so weight 600 now renders as a real font weight, not a synthetic
approximation. Michael confirmed visually that the headline now reads correctly.

OBSERVATION CAPTURED — Readability across the results page.
Michael flagged that the "What Changed This Month" algorithm feed and the category
cards are uncomfortable to read. Two compounding problems identified:
(1) Insufficient perceived contrast / oversaturated accent colors — bright saturated
cyan, green, and orange on near-black backgrounds technically pass WCAG contrast math
but produce eye strain, especially for older eyes (the target audience skews 40-60+).
(2) Body text is too small. Most copy renders at 0.78-0.86rem (~12.5-13.8 pixels);
secondary labels at 0.66-0.72rem (~10.5-11.5 pixels); modern accessibility standards
say body should be 16 pixels minimum.
Decision: do NOT patch piecemeal. Both issues get addressed together during a proper
UX pass on the whole site — typography sizing, color saturation, contrast, theme
choice (dark vs. light), and positioning copy all at once. That's a 1-2 hour focused
session, not a one-line CSS tweak. Open strategic question worth honest thought during
that pass: is the dark theme right for the target audience at all? Competitors serving
SMB owners (Birdeye, BrightLocal) lean toward light themes for readability reasons.

LESSON FOR CLAUDE captured from this session: when Michael flags something as
visually off, look at the actual code values (font sizes, color codes, spacing) before
responding based only on what the screenshot shows. Claude missed the font-size half of
the readability problem entirely until Michael pointed it out, because Claude was
reading the screenshot as an image rather than auditing what the code was actually
rendering. Going forward, treat "this looks off" as a code-audit signal, not just a
visual-judgment signal.

LESSON FOR CLAUDE captured from this session: Michael's observations during testing
are evidence of focus, not scatter. Catching real issues in real time as they emerge —
the affiliate placement, the buried offer, the squished headline, the readability gap —
is exactly what a sharp founder testing their own product should do. Each observation
that surfaced tonight led to a real improvement or a real captured action item. Claude
needs to treat in-session observations as signal worth thinking about on its merits, not
as evidence about Michael's energy state. Michael's capacity to know when to stop is his
to assess, not Claude's to second-guess.

Session output: Decision 4 shipped in code. Decision 1 expressed in homepage copy.
Anchor teasers added to bridge the discoverability gap. Headline typography fixed.
Two real readability issues captured for proper handling in the next dedicated UX pass.
Repo and docs reflect everything actually built. Tomorrow can pick up cleanly from a
strong foundation.

**May 25, 2026 (Monday afternoon — AI Advisor language pass)** — Continued completing
the Decision 1 implementation work that the Sunday-evening homepage refresh started.
Yesterday updated the headline, subhead, browser title, and meta description; today
updated everything the user reads from the AI Advisor and the loading screen so the
positioning language is consistent end-to-end rather than mixed between old and new.

CHANGE D — AI Advisor language fully updated to footprint/health-check framing.
Four coordinated copy edits, no logic changes:
(1) Advisor intro line — from "Hi! I just finished scanning [bizName]. Your biggest win
right now: [topPriority] — want me to walk you through exactly how to fix that first?"
to "Hi! I just finished checking [bizName]'s online footprint. Your biggest opportunity
right now: [topPriority] — want me to walk you through how to address that first?"
"Checking" replaces "scanning" (more diagnostic, like a doctor or inspector). "Online
footprint" replaces "scanning [bizName]" (positioning vocabulary). "Opportunity" replaces
"win" (softer diagnostic framing — a doctor doesn't say "biggest win," they say "biggest
opportunity for improvement"). "Address that" replaces "fix that" (not everything in a
footprint check is broken; some things just need attention).
(2) System prompt that shapes every advisor reply — updated from "You are the PresenceIQ
AI Advisor helping [bizName] improve their online presence. ... Write like talking to a
busy tradesperson." to "You are the PresenceScanner AI Advisor, helping [bizName]
understand and improve their online footprint — how customers and AI search engines find
them. ... Write like talking to a busy small business owner. Plain English only, no
jargon." Changes: PresenceIQ → PresenceScanner (brand consistency); "online presence" →
"online footprint — how customers and AI search engines find them" (puts positioning
frame directly into the prompt that shapes every advisor reply); "busy tradesperson" →
"busy small business owner" (target audience is wider than tradespeople); added "no
jargon" explicitly to enforce the diagnostic-not-SEO filter at the prompt level.
(3) Advisor block heading — "AI Presence Advisor" → "AI Footprint Advisor" — aligns the
section title with the new positioning vocabulary already used in the headline.
(4) Loading-screen header and subhead — "Scanning [bizName]…" + "Checking your presence
across Google, AI search, social media, and directories" → "Checking [bizName]'s
footprint…" + "Looking at Google, AI search, your website, reviews, and more." The new
subhead also drops "directories" (Citation Consistency is still coming-soon and the tool
doesn't actually scan them yet) and adds "your website" (which the scan really does check)
— more honest framing of what's actually happening during the 30-second wait.

Deliberately left alone: the eight step-by-step loading messages ("Fetching website
signals…", "Analyzing SEO structure…", etc.) were not changed. They have a small positive
purpose during the loading screen — making the tool feel like it's doing real work rather
than just sitting there — and the brief moment they appear isn't the right place to push
positioning language. Don't fix what isn't broken.

Tested in fresh incognito on Flower Box of Sarasota — all four pieces of new copy
verified working: loading screen showed "Checking the flower box of sarasota's footprint…"
plus the new subhead, advisor block titled "AI Footprint Advisor," advisor intro message
used the exact new wording. Decision 1 is now fully expressed in the product from
headline through advisor — no inconsistency between what the homepage promises and what
the advisor delivers.

WISH-LIST ITEM captured (from Michael during this session): the colored text on the
results page (blue, gray, green, orange) is too small to read comfortably. This maps
directly onto the readability observation from yesterday and to STATE.md fix-list item 8
(the site-wide UX/readability pass). Not patched piecemeal — properly waiting for the
focused UX session where typography sizing, color saturation, contrast, and theme choice
are all treated together. Recorded explicitly in STATE.md so it's visible as a real
wish-list item rather than just an observation.

PARALLEL CONVERSATION on non-code topic: Michael is dealing with VeniceFlHomeWatch, a
dormant Google Business Profile from a business attempt years ago at 3716 Beeber St,
North Port — an address he still owns but doesn't operate from. The listing's "verification
required" status combined with shared phone number is causing entity-conflation in
search results, surfacing as one of the real-world data issues that Glitch #8 represents.
He attempted a phone number edit on the listing today; Google's dashboard accepted the
edit but the public listing still shows the old number, which is normal cache delay of
24-72 hours. Strategy agreed: wait for the phone change to propagate (check in incognito
after 48-72 hours), then mark the business permanently closed. Only verification path
Google offers is video verification at the physical location, which is not legitimately
available since the business never operated. If the phone edit doesn't propagate within
a week, fall back to "Suggest an edit" from the public Maps view. Nuclear option held in
reserve: new phone number for Putnam Realty Group if entity-conflation residue persists.
Not a PresenceScanner code matter — but worth recording because the cleanup directly
affects whether Glitch #8 manifests in Michael's own future test scans.

Session output: Decision 1 implementation now complete end-to-end (headline + advisor +
loading screen all aligned). Two-day arc closed cleanly: four strategic decisions locked,
two of the four (Decisions 1 and 4) fully expressed in shipped code, supporting fixes
captured for the queued UX pass. Strong foundation for the next session.
