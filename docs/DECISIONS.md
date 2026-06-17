=== DECISIONS — June 16, 2026 (Monday evening session) ===

D-0XX: AI MODEL STRING IS claude-sonnet-4-6.
The dated model string claude-sonnet-4-20250514 was retired by Anthropic on
June 15, 2026 and crashed every scan. Locked decision: use "claude-sonnet-4-6"
(Sonnet 4.6). Never hardcode a dated model string again without a safety
net/remap. Content-array guards added so a malformed AI response degrades
gracefully instead of crashing.

D-0XX: ABUSE PROTECTION FOR BETA IS COMPLETE AT THIS LAYER.
Locked the cost/abuse protection stack for beta: per-IP scan rate limiter
(3/day, server-side, the real wall), advisor chat turn cap (7), advisor chat
char cap (600), 60-sec scan timeout, manual kill switch (SITE_DISABLED).
Decision: browser-side caps are the right level for a beta; the server-side
rate limiter is the actual enforcement. Not building heavier bot protection
before launch.

D-0XX: PRESENCESCANNER OPERATES UNDER PUTNAM ENTERPRISES LLC.
Confirmed via sunbiz that PresenceScanner is not separately registered. Decision:
it operates legally under the existing Putnam Enterprises LLC (L19000236139),
with Michael Putnam as the public face. Legal pages name the LLC; contact is
putnamm@comcast.net. A separate DBA/fictitious name for "PresenceScanner" under
the LLC is a possible later step, not required for a beta trickle.

D-0XX: MANUAL-PATH BLANKS = "UNKNOWN", NOT "MISSING" (per scan path).
The manual "Copy from your GBP" path was treating blank fields as confirmed
absences, producing confident false-negative findings (told Michael his own
business had "no hours/zero photos" when his real GBP has both). Locked
decision: represent unprovided manual fields as unknown (null), and instruct
the AI that unverified fields must NOT produce negative findings and must NOT
lower the score — only explicitly-confirmed deficiencies get penalized. CRUCIAL
NUANCE: this applies PER PATH. A blank from the manual form = "unknown"; a
genuinely empty field from Google's Places API on the autocomplete/phone paths
= legitimately "missing". Same blank means different things by path.

D-0XX: CONFIDENCE SCORING DEFERRED.
High/med/low scan-confidence display (based on how the data was gathered) is a
good professionalism enhancement but is polish, not a credibility fix. Decision:
deferred to wish-list, not built now.

D-0XX: DO NOT HOST CUSTOMER WEBSITES ON MICHAEL'S GITHUB.
Considered and rejected hosting each customer's mini-site on Michael's GitHub.
Reasons: reintroduces the ongoing-service/support burden the project
deliberately escaped, github.io looks unprofessional to a contractor's
customers and ranks poorly, and it's a different business than the one being
launched. Decision: instead guide customers to their own cheap domain
(GoDaddy/Namecheap), which is also where the affiliate model already points.

D-0XX: CONTRACTOR-PLATFORM SCANNING — ONLY GOOGLE + YELP ARE API-VIABLE.
Researched contractor promotional platforms. Decision: the only realistically
API-compatible data sources for scanning are Google's own products (already
used) and Yelp via Yelp Fusion. Angi, Thumbtack, HomeAdvisor, Houzz, Bark, and
Nextdoor are closed lead-gen marketplaces with no public profile-read API —
ruled out (scraping them = the Venice Italy trap). Yelp scanning is a strong
POST-LAUNCH candidate for the contractor/trades segment, GATED on: (1)
confirming Yelp Fusion API access is obtainable and durable for a free tool,
(2) repeated real user demand. Nextdoor ruled out entirely.

D-0XX: GBP STRATEGY (reaffirmed, now in DECISIONS for the record).
PresenceScanner will be listed as a SERVICE under the Putnam Realty Group GBP
(honest community-service framing, brokerage URL stays primary). NO standalone
PresenceScanner GBP. Do NOT morph VeniceFlHomeWatch into PresenceScanner —
entity-conflation/suspension-cascade risk across Michael's other GBPs.

D-0XX: POSITIONING REAFFIRMED POST-PERPLEXITY.
"Free AI visibility scan" is now table stakes (Perplexity offers it free with a
paywalled $200/yr workflow; Birdeye has a free checker). Decision: do not lead
marketing with "free AI visibility scan". Lead with the uncopyable stack —
local FL operator credibility + plain English + trade-specific + human follow-up.
Homepage trust-building (Michael's face + broker credentials + "why I built
this") elevated to top of Tier 2.

NOTE: Renumber the D-0XX placeholders to the next sequential decision numbers
following the last entry already in DECISIONS.md.

=== END June 16 decisions ===
