# PresenceScanner — STATE.md
Last updated: June 16, 2026 (Monday evening session)

This is the current snapshot of where PresenceScanner is RIGHT NOW. For the
full history and the reasoning behind decisions, see the Glitch Log and
DECISIONS.md. STATE.md is overwritten each session; DECISIONS.md is append-only.

---

## ONE-LINE STATUS

Trickle-ready. All launch blockers for a quiet soft-share are cleared. One
final code deploy pending (the unknown-fields fix), then the only remaining
items are Michael's own Anthropic console tasks. A full Facebook announcement
wants a balance top-up + spend alert + measured cost/scan first.

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

---

## DEPLOY-PENDING (staged, not yet live as of session end)

THE UNKNOWN-FIELDS FIX (index.html at /mnt/user-data/outputs/). Manual-path
blank fields now = "unknown / could not verify" instead of "no / zero", per
scan path, with a prompt rule that unverified fields never produce negative
findings or lower the score, plus a warning line above the manual form. This
is the last code deploy of the session. NOTE: the staged index.html ALSO
contains the model fix, chat caps, founding removal, footer, and disclaimer —
deploying it carries everything. Test by re-scanning Venice FL Handyman via the
manual path with hours unchecked + photos blank; report should say "could not
verify", not "no", and not tank the score.

---

## LEFT FOR MICHAEL (solo console tasks — none block a quiet trickle)

1. Deploy the staged unknown-fields index.html.
2. Top up Anthropic beyond $22 (currently ~150-200 scans of runway).
3. Set an Anthropic spend alert.
4. Measure REAL cost/scan: run 10 scans, check console.anthropic.com, divide
   by 10. (Estimate is ~$0.06-0.15/scan but it's calculated, not measured.)
5. Mark the Formspree sender "not Other" so beta bug reports aren't missed.

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
