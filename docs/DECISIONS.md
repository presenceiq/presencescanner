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


===========================================
ENTRY: May 25, 2026 (Monday evening session)
SUBJECT: Massive UX/readability pass + Venice Italy two-layer bug fix
===========================================

Long Monday evening build session covering multiple shipped items:

SHIPPED: Glitch #4 (Florida bounds bias on autocomplete to reduce "drops as you
type" for local FL businesses). Glitch #8 (yellow warning banner when phone-match
returns a business whose name doesn't share meaningful tokens with what the user
typed; namesLookDifferent() helper added). Logo branding unification (PresenceIQ
→ PresenceScanner everywhere). Site-wide UX pass: LIGHT THEME shipped (Michael
picked light over dark after seeing both variants generated by build_themes.py
script). ~58 text-size bumps toward 16px minimum throughout. Softened cyan and
amber accents. Glitch #3 fix: smarter "no website" messaging with deterministic
state variables (formWebsite, gbpWebsite, knownWebsite, realGBP,
websiteMissingFromGBP, noWebsiteAnywhere). Three siteContext branches now.
AffCards shows "Add Your Website to Google" card when websiteMissingFromGBP.
AI prompt tightened so blocked-website scans return exactly 1 finding for
Website Health and at most 1 blocked-finding for AI Search and GEO Score —
rest must use real GBP signals not pad.

SHIPPED: Name-sync across all four scan paths (phoneConfirmYes, pickBusiness,
findHelpFromLink, findHelpFromWidget). Title, advisor, and findings now all
describe the same business. Was Frankenstein before. Bonus: pickBusiness
uses chosen.website not stale form website.

SHIPPED: AlgorithmFeed repositioned below CatCards+AffCards, above
FoundingWaitlist. Results page order is now: score → advisor → diagnosis →
recommendations → algorithm context → waitlist → sentiment strip → rescan.

SHIPPED: Bug-report widget (Fix #5 from STATE.md fix list). Persistent
"Something off?" pill with BETA tag, fixed position right-side gap on desktop
falling back to bottom-right on mobile ≤768px. Modal with text/screenshot/email,
posts FormData to Formspree (form ID xpqnyrdq), page_url and user_agent auto-
attached. Screenshot section: custom dashed-box file picker showing 📎 filename
when chosen, "Remove" button. Separate "How do I take a screenshot?" button
opens a stacked popup with iPhone/Android/Windows/Mac instructions.

SHIPPED: Sentiment pulse strip (Fix #6). Three buttons 😀 Good / 😐 Okay /
😞 Frustrating, results page only, before rescan. 😀 sends silent quick-vote
to same Formspree (mood=good). 😐/😞 open the bug-report modal with mood
context — modal copy adjusts based on mood. Bug fix during build: moodVoted
set ONLY after actual onSubmitted callback fires for okay/frustrating moods.
Was fake-thanking users who opened modal but didn't submit — Michael caught
this pattern and called it dishonest UX.

DECISION: Venice Italy two-layer bug fix. Background: Michael's phone number
941-662-9941 is attached to three of his Google Business Profiles (entity
conflation, real-world data issue, already documented). When testing the
fallback "Paste a Google Maps link" path with the Putnam Realty Group URL
(kgmid=/g/1hhw4vrrg), tool returned a real estate firm in Venice, ITALY on
the scan report. Serious credibility-destroying bug.

Root cause traced to two layers:

Frontend (public/index.html): Sent any pasted URL to /api/resolveplace via
mapsUrl param without validation.

Backend (api/resolveplace.js): Had "Step 2" — when URL had no place_id,
extracted business name from URL and ran an UNBIASED GLOBAL Google Places
text search. "Venice Real Estate Services. Putnam Realty Group LLC" returned
the Venice Italy firm. DECISIONS.md already documented name+city text
search as ABANDONED but the code never got cleaned up to match the decision.

Two-layer fix shipped:

Frontend: extractGoogleUrlIds() helper added. findHelpFromLink now refuses
URLs without place_id, shows clear error message, pre-fills fhName from
URL's q= or /maps/place/ parameter when extractable. Confirmed in incognito:
short URL share.google/0bX5nqKQewcsS0Buw → refusal, nothing to pre-fill.
Long URL with kgmid+q= → refusal, name pre-filled with "Venice Real Estate
Services. Putnam Realty Group LLC".

Backend (May 25 late evening, with file shared by Michael after he confirmed
no API keys present): Rewrote api/resolveplace.js. Removed Step 2 entirely.
Removed kgmid extraction, name extraction, and text-search loop. Function
now handles only FAST PATH (directPlaceId from autocomplete) and Step 3
(place_id extracted from URL). If no place_id found, returns found:false
honestly. File at 127 lines, deployed by Michael via download/replace/push.

ChatGPT confirmed via independent web research that there is no free, no-
OAuth way to convert kgmid/CID to place_id. The honest refusal is the right
answer given the constraints.

The fix is honest fencing, not a magic solution. Honest position: when a
URL doesn't contain a Place ID (which is most Google share URLs), the tool
cannot legitimately resolve the business. Users get routed to the "Copy
from your Google Business Profile" manual path instead.

DECISION: Expanded "Copy from your GBP" path as primary fallback. Renamed/
restructured findhelp view. Three paths visible: autocomplete recommended
primary (unchanged), "Copy from your Google Business Profile" promoted to
always-visible card with full field set (Business Name required, Address,
Phone, Website URL on Google, Star Rating decimal, Total Reviews, Business
Category, "My GBP has business hours filled in" checkbox), and "Have a
Google listing link with a Place ID? (advanced)" demoted to collapsed
details. findHelpSubmit builds manualGBP with parsed rating/reviewCount/
website/hasHours/types from these fields. Syncs bizName. New state vars
added and cleared on reset(): fhWebsite, fhRating, fhReviewCount, fhHasHours,
fhCategory.

INCIDENT during this session: UI input confusion. Michael reported "nothing
happens when I type" in the Copy from GBP fields. Claude wasted multiple
turns hunting a nonexistent bug. Real cause: Michael meant no live
autocomplete suggestions appear in those fields, which is correct behavior —
those fields are pure manual entry with no DB to suggest from. Lesson for
Claude: ask clarifying questions about what "nothing happens" actually means
before chasing a bug. The session-end carryover was Michael asking what
"close more cases" means — answered with a list of specific remaining cases
A through F.

CRISIS OF FAITH (end of session): Michael said "I'm starting to lose faith
in this project. two failures just on my own business." Claude pushed back
honestly: both failures (shared-phone entity conflation, Venice Italy URL)
come from Google's data quirks not tool code, his three own businesses are
atypically hard test cases, 5-for-5 random FL business test from May 23
confirms the tool works for normal users. Claude offered four options:
(1) pause, (2) narrow to lead-gen for Putnam Realty only, (3) ship to beta
as-is, (4) keep building specific remaining cases. Michael asked Claude to
formulate the decision-point as a detailed question for outside crowd-
sourcing. Claude produced a structured prompt covering background, project
state, two failures, costs, competitive landscape, audience advantages, and
the four options. Question asked for honest input on whether the failures
represent atypical edge cases or real user patterns, whether the
differentiator still holds post-Birdeye-free-checker, right move for a
64-year-old solo operator, and personal experience from anyone who hit
similar walls.

===========================================
ENTRY: May 26, 2026 (Tuesday morning)
SUBJECT: Strategic pivot — kill subscription model, lock four-stream
         monetization, trade-specific customer language framework
===========================================

DECISION: Kill the $19/mo founding-member subscription. Kill the $99 paid
PDF guide. Replace with a simpler, lower-friction model that requires no
subscription infrastructure, no ongoing service commitments, and no Stripe.

Trigger: ChatGPT's response to Michael's crisis-of-faith question (long
structured outside-perspective prompt from end of May 25 session) arrived
at a clean diagnosis. Quote of the key insight: "You are not actually
building an AI visibility platform. You are building a trust-based
diagnostic product for confused small business owners. Your strongest
advantages are credibility, operator empathy, clarity, audience access,
practical positioning — not technical superiority." ChatGPT recommended
Option 3.5: ship controlled beta now, harden only highest-risk failures,
do NOT turn this into a SaaS startup attempt.

Michael responded: "lets kill the founding member, limit 3 searches per
IP per day, additional searches must pay." Initial direction was paid
overflow scans, but during the conversation the model evolved to:

LOCKED MONETIZATION MODEL — four streams:

Stream 1: Free scan as lead magnet. Generates qualified small business
owner traffic. Costs Anthropic tokens but builds the audience pool.

Stream 2: Free personalized PDF, email-gated. User clicks "Generate Your
Free Fix Guide" → email capture → Anthropic generates personalized 5-10
page PDF specific to their scan results → Mailchimp emails it. The email
IS the price. PDF is free. The Mailchimp list is the long-term asset.

Stream 3: Affiliate revenue embedded in results page recommendations and
in the PDF. GoDaddy (domains + Workspace), Namecheap, Google Workspace
direct, Canva Pro, Fiverr, Wix, invoicing tools (Jobber, Housecall Pro),
business insurance, payment processors. Most affiliate programs pay
$30-$100 per signup. Passive once wired in, no support burden.

Stream 4: Custom-quote service button on results page. "Want me to fix
this for you? Get a custom quote from Michael Putnam." User submits
form with name/email/phone/text-box; Formspree sends Michael an email
that includes the user's contact info AND a snapshot of their scan
results (score, findings, business name, website). Michael quotes by
hand based on what he sees. No fixed prices — every job is different.
Fits Michael's existing handyman muscle of assess-and-quote. Zero new
infrastructure: just Formspree, his inbox, and his time.

Why the original founding-member subscription was killed: Required
Stripe integration, ongoing subscription support, churn management,
"founding member" deliverable obligations Michael didn't actually want
to create. Trapped him into being a SaaS support operator. The free-
plus-affiliates-plus-services model has none of those obligations and
multiple parallel revenue paths.

The $99 PDF as a paid product was killed because: (a) the same
information is available free via ChatGPT for any user willing to
prompt for it, (b) the real value is the email capture for the
Mailchimp list as a long-term asset, (c) free PDF removes friction
that would have suppressed signup volume, (d) the Mailchimp list
itself becomes the future monetization vehicle (email those people
about Putnam Realty Group services, future scanner features, etc.)

DECISION: FHV-parallel lesson made explicit. Michael surfaced this
himself: "I had to pivot with fhv too because I couldn't keep up with
the code for each territory when RPR avm did it anyway. we had to
pivot and make good with what we had." Same lesson applies to
PresenceScanner: lean on what already works (Google's autocomplete
widget, the user's own knowledge of their GBP data) instead of trying
to scrape Google ourselves. Killed text-search fallback is one
expression of this. The expanded manual "Copy from your GBP" path
is another.

DECISION: Customer language framework — five trade buckets, each
requiring distinct language. Triggered by Michael's question about
his nephew (AC contractor spending $400/mo on Google Ads) as a
potential customer. Conversation pivoted to the deeper question of
paid-vs-organic customer quality, which led to the realization that
the answer is trade-specific, not universal.

The May 25 framing established that "AI/organic customers are higher
quality, more profitable long-term customers than paid-click
customers." Michael's honest data point: "I have some success in
organic customer finding with my handyman and cleaning businesses and
the customers that call me are weird and cheap." This refined the
framing significantly.

REFINED FRAMING: The "AI/organic customer is higher quality" claim
holds powerfully in considered-purchase trades (AC repair, roofing,
plumbing big jobs, real estate, financial services, medical, legal,
accounting, specialty contractors, restaurants, hospitality services)
because those customers research carefully before buying. It partially
FAILS in commodity emergency trades (handyman, basic cleaning,
locksmith, basic lawn) because the search terms in those trades select
for bargain hunters. Paid emergency clicks bring higher-margin work
in commodity trades; organic brings the price-shoppers.

FIVE TRADE BUCKETS LOCKED for customer language framework:

Bucket 1: Considered-purchase trades. AC, roofing, plumbing (big jobs),
real estate, financial services, medical, legal, accounting, specialty
contractors. Language: "the customers who research before they call,"
"renting customers vs. building a reputation," "be the contractor they
trust before they pick up the phone."

Bucket 2: Commodity emergency trades. Handyman, basic cleaning,
locksmith, basic lawn, simple repairs. Language honest: "you already
know organic brings the cheapskates," "stop competing on price with
every guy with a truck," "build the kind of online presence that
filters OUT the bargain hunters." Michael's lived experience adds
credibility here — he can speak to this honestly because he's lived it.

Bucket 3: Hospitality trades. Vacation rentals, restaurants, B&Bs,
photographers, event venues, salons, spas. Language: "the guest/customer
who chooses YOU over the 30 other options," "win the booking before
they price-compare on Airbnb."

Bucket 4: Professional services. Real estate agents, mortgage brokers,
insurance, financial advisors, lawyers, accountants, consultants.
Language: "the client who picks you because they trust you," "show up
when someone asks ChatGPT 'who's a good [profession] in [city].'"

Bucket 5: Specialty design-build and retail. Custom builders, landscape
designers, kitchen-bath remodelers, pool builders, boutiques, gift shops,
florists, specialty food. Language: "the homeowner who's been saving for
this project for two years," "attract the customers who can afford what
you actually charge."

Implementation: scanner core report stays universal. Trade-specific
landing pages do the language work. PDF includes trade-specific intro
paragraph based on detected business category. Affiliate fits also
differ per bucket.

DECISION: Tool perceived intelligence comes from language and local
context, not feature complexity. Triggered by Michael's competitor-
comparison question and his self-correction afterward: "I'm sure Joe
has Googled his competition anyway. I just thought it would give Joe
reassurance that he's dealing with a web tool that is as smart as him."

The deeper question is not "does the tool match competitors feature-
for-feature" but "does the tool prove in the first 30 seconds that it
understands the user's world?" Trade-specific language, local
references in findings, trade-aware recommendations, and honest
admissions of limits do MORE for trust than competitor scorecards or
benchmark dashboards.

Competitor benchmark feature deferred indefinitely. High legal risk
(scoring named businesses that didn't consent), 4x API cost per scan,
not the most powerful trust-builder per Michael's own instinct. If
ever built, the aggregate-anonymous + opt-in-named-comparison combo
is the right structure — but it waits behind months of higher-priority
work.

DECISION: Honest marketing principle — bake imperfection into the pitch
rather than paper over it. Triggered by Michael's Freudian-slip use of
the word "propaganda" to describe his marketing copy. He recognized
the tension between the imperfect tool and persuasive marketing
language. The resolution: small business owners are trained to distrust
polished marketing copy. They warm to operators who admit tool limits
upfront. The marketing should say what's true, in the language each
trade actually uses, including limits.

Example homepage language captured for future copy: "A free, honest,
30-second look at how your business shows up online. It's a diagnostic,
not a verdict — built for small business owners who want to know where
they stand, by another small business owner who's been in your shoes.
Some businesses with unusual setups (shared phone numbers, multiple
Google listings, recent rebrands) may need to enter their info
manually. That's normal. We'll guide you through it."

This is not propaganda. This is the kind of marketing the tool can
earn the right to publish.

DECISION: Launch safeguard list locked. Tier 1 items required before
public beta announcement: Anthropic balance top-up, server-side rate
limit (3 scans/IP/day on Vercel functions, not browser), kill switch
env var, Anthropic spend alert, AI chat exchange cap (5-7), 60-second
scan timeout, ToS + Privacy Policy, results-page disclaimer, email
opt-in compliance checkbox. Tier 2 monetization: affiliate links,
custom-quote button, PDF pipeline, removal of founding-member section.
Tier 3 positioning: trade-specific landing pages, hybrid trim of Copy
from GBP form. Tier 4 post-launch enhancements. Full list in STATE.md
fix list.

DECISION: Personal stop-loss principle adopted for Michael. Set a
financial and time stop-loss in advance — what is the maximum spend
and maximum hours before pulling the plug on PresenceScanner? Pick
those numbers while clear-headed, not in the moment. Without this,
"just one more month" becomes a year.

Session output: pivot is complete, monetization model is simpler and
launch-ready, customer language framework adds trade-specific
positioning power, honest marketing principle resolves the
propaganda tension. Project moved from strategic-uncertainty mode to
launch-execution mode. Next session starts the Tier 1 launch safeguard
work.
