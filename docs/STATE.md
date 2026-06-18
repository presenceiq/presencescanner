# PresenceScanner — STATE.md
Last updated: June 16, 2026 (Monday evening session)

This is the current snapshot of where PresenceScanner is RIGHT NOW. For the
full history and the reasoning behind decisions, see the Glitch Log and
DECISIONS.md. STATE.md is overwritten each session; DECISIONS.md is append-only.

---

## ONE-LINE STATUS

Trickle-ready and in good honest shape. All launch blockers cleared and
deployed. Today also shipped findings-consolidation, website-URL transparency,
and the advisor chat scroll fix. Remaining items are Michael's own Anthropic
console tasks. Next real BUILD = harden the fetcher (reads bot-protected sites
poorly vs ChatGPT) — fresh session, not a bolt-on. A full Facebook announcement
still wants a balance top-up + spend alert + measured cost/scan first.

---

## WHAT IT IS

PresenceScanner.ai — a free, beta diagnostic tool that scans how a local
small business shows up online (Google Business Profile, website, AI search
visibility) and returns a 0-100 score with plain-English fixes. Positioned as
a trust-based diagnostic by a real Florida operator, NOT as an "AI visibility
checker" (that's now table stakes — Perplexity, Birdeye offer it free).

Legal entity: Putnam Enterprises LLC (L19000236139). Public face: Michael
Putnam. Contact: putnamm@comcast.net.

---

## ARCHITECTURE (unchanged)

- Single self-contained public/index.html, React via in-browser Babel, NO
  build step. The "Babel transformer" console warning is expected and harmless.
- Serverless functions in api/ on Vercel. Repo: github.com/presenceiq/
  presencescanner. Auto-deploys from main on commit to public/.
- Deploy workflow: Michael downloads the file from Claude, uploads via GitHub
  web UI (Add file -> Upload files -> drag to replace -> commit). Must be
  signed in to GitHub to see the upload option.
- API keys in Vercel env vars (ANTHROPIC_KEY, GOOGLE_PLACES_KEY, Mailchimp).
  Google Maps BROWSER key is embedded in index.html on purpose (referrer-
  restricted — correct, not a leak).
- Current AI model: claude-sonnet-4-6 (Sonnet 4.6). Used in callClaude and
  fetchNews. Both have content-array safety guards now.

---

## CONFIRMED BUILT AND WORKING

- Seven-category scan + scored report + AI advisor chat + affiliate cards +
  "What Changed This Month" news feed.
- Four scan paths: autocomplete widget, phone lookup, paste-a-link (refuses
  non-place_id URLs after the Venice Italy fix), manual "Copy from your GBP".
- Glitch #8 name-mismatch warning (yellow banner when phone match returns a
  differently-named business — catches Michael's shared-phone case).
- Session-contamination fix (reset clears all form fields between scans).
- Venice Italy fix (frontend URL validation + backend resolveplace.js Step-2
  global text-search removed).
- Light theme + readability pass (16px min body text).
- Bug-report "Something off?" widget -> Formspree xpqnyrdq. Sentiment pulse
  strip (😀/😐/😞).
- SAFEGUARDS: per-IP scan rate limiter (3/day, Upstash Redis, owner-IP bypass),
  manual kill switch (SITE_DISABLED env var, all 4 API endpoints), 60-sec scan
  timeout, advisor chat turn cap (7), advisor chat char cap (600).
- Legal: terms.html + privacy.html live; footer links on every page; results-
  page disclaimer.
- Founding-member block REMOVED from results page (model was killed weeks ago).
- FINDINGS CONSOLIDATION: reports now give 1-3 distinct findings per category
  (was a forced 3, = 16 every time), no cross-category repetition, ~8-11 total.
  News section trimmed to 2 non-repetitive items.
- "Website analyzed: [url]" shown in report header so users see what was scanned.
- Advisor chat scroll fixed (scrolls the inner message box, not the whole page).

---

## DEPLOY-PENDING

Nothing pending — everything above is deployed and confirmed live (verified via
incognito to bust cache). Michael confirmed all deploys.

---

## LEFT FOR MICHAEL (solo console tasks — none block a quiet trickle)

1. Top up Anthropic beyond $22 (currently ~150-200 scans of runway).
2. Set an Anthropic spend alert.
3. Measure REAL cost/scan: run 10 scans, check console.anthropic.com, divide
   by 10. (Estimate is ~$0.06-0.15/scan but it's calculated, not measured.)
4. Mark the Formspree sender "not Other" so beta bug reports aren't missed.
5. Verify the handyman GBP isn't genuinely showing "Closed" (ChatGPT's map
   showed it closed — may just have been after-hours).

---

## NEXT REAL BUILD (fresh focused session, NOT a bolt-on)

HARDEN THE FETCHER. fetchsite.js fails on bot-protected sites that ChatGPT
reads fine (e.g. Michael's own veniceflhandyman.com). Scope: browser-like
headers, a real/proper user-agent, follow redirects, possibly handle
JS-rendered pages (headless). GOAL: read the ordinary small-business site
cleanly and stop losing to BASIC bot protection. Do NOT try to rival ChatGPT's
full retrieval stack — parity is a money/time pit; aim for "easy 80%, handle
the stubborn 20% honestly." Graceful-failure handling already shipped means a
blocked site produces an HONEST report ("could not be scanned — usually a
security setting"), so there's no active misleading in the meantime.

---

## TIER LIST (post-trickle growth work)

TIER 2 (monetization + reach, in rough priority):
- Homepage trust-building above the fold: Michael's face, name, FL broker
  credentials, one-line "why I built this". (Top of Tier 2 — biggest trust
  lever, uncopyable by faceless competitors.)
- Google Search Console submission + sitemap for presencescanner.ai (without
  it the landing pages can't rank — do early).
- SEO/AI landing pages, wave-based: Wave 1 = 3-5 highest-intent cornerstones,
  Wave 2 = trade-specific, Wave 3 = FL geo pages. Prose-then-list-then-prose,
  FAQ + FAQPage schema, author attribution, real local specifics, humanize AI
  drafts. Slow-compound, start now.
- Affiliate links live in results + PDF (GoDaddy, Namecheap, Google Workspace,
  Canva, Fiverr, Wix).
- Custom-quote button on results page (Formspree -> Michael's inbox + scan
  snapshot, he quotes by hand).
- Free email-gated personalized PDF (Mailchimp list = the asset).
- List PresenceScanner as a SERVICE under Putnam Realty Group GBP (community-
  service framing, brokerage URL stays primary). NOT a standalone GBP. NOT
  morphing VeniceFlHomeWatch.

TIER 3 (positioning):
- Homepage proof: visible scan categories, a real sample report, testimonials
  (Ken = first proof-case candidate).
- Product Hunt / BetaList / AlternativeTo when launch-ready.
- LinkedIn as operator-behind-the-tool.

TIER 4 (post-launch):
- Microsoft Clarity (install when real traffic arrives, not before).
- Confidence scoring on scans (high/med/low by data-gathering method).
- Yelp Fusion scanning — GATE on confirming free-tool API access + repeated
  real user demand. Nextdoor and other contractor marketplaces ruled out (no
  public API).
- Automatic Google OAuth GBP connection (heavy, deferred — manual path is the
  lightweight stand-in).
- Dedicated support email (help@presencescanner.ai).
- G2 / Capterra listings once there are reviews to seed them.

---

## KEY FACTS / CREDENTIALS (for continuity)

- Formspree bug-report form ID: xpqnyrdq.
- Upstash Redis DB: presencescanner-rate-limit (iad1). Owner-IP bypass via
  OWNER_IPS env var (Michael's IPv6 may rotate).
- Kill switch: SITE_DISABLED env var.
- Google Analytics: GA4 G-WD4QS0XK2C (live).
- Anthropic balance: ~$22 as of session end.
- Repo: github.com/presenceiq/presencescanner. Host: Vercel.

---

## OPERATING PRINCIPLES (how to work on this project)

Stress-test, don't just respond. On any feature or decision, proactively ask:
where is this likely to break or embarrass Michael in front of a real user;
what is it pretending to know that it doesn't; what would a competitor or
skeptic call weak; given limited budget and solo time, is it worth building or
is it gold-plating; what's most likely to make someone distrust it; is this the
highest-value thing right now or just the most interesting; is it being tested
the way a confused stranger would use it, not the way its builder would.

Shipping fast and shipping fragile are different — ask if it's reliable enough,
not just whether it runs. The value is the judgment (what to build, where it
breaks, whether to trust it), not just working code. Done and live beats perfect
and pending. Michael tests on REAL businesses — that's how the real bugs surface
(the unknown-fields bug came from him scanning his own GBP). Claude can't see his
GBP or live sites, so reality-testing stays his job; Claude's job is to hunt the
weaknesses he can't see coming and warn him before he ships them.

## WORKING-STYLE NOTES (carry forward)

Honest pushback over flattery. Plain English, no jargon. No horizontal divider
lines (breaks his phone reader). Continuous prose when he's on mobile (voice-
to-text / text-to-speech friendly) — he'll say when he wants it shorter.
Propose plans before writing code. When he flags something visually off, audit
the ACTUAL code values (font sizes, colors) before responding to a screenshot.
Treat his real-time testing observations as focused signal, not scatter. He
deploys; Claude stages files and gives clear click-by-click upload steps. He
verifies deploys in incognito (busts cache). His own three businesses are
atypically hard test cases (shared phone, weak local signals) — most users
won't hit those edges.

=== END STATE.md ===
