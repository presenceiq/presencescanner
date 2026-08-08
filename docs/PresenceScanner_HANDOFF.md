# PRESENCESCANNER — MASTER HANDOFF (self-contained, current as of 2026-08-08)
# Read THIS first. It's everything a new session needs to act without asking Michael to re-explain.
# The full history/session-logs live in PresenceScanner_Truth.md; this is the operating summary.

═══════════════════════════════════════════════════════════════════════════════
## 1. WHO / WHAT / NON-NEGOTIABLE RULES
═══════════════════════════════════════════════════════════════════════════════
Michael Putnam, 64, solo operator, Nokomis FL. Builds/runs PresenceScanner.ai (free AI-visibility
scanner + free local business directory for SW Florida, under Putnam Enterprises LLC). Tech-challenged
but capable, works on a Chromebook + iPhone, voice-to-text, DOES NOT CODE (but can paste code edits when
given exact copy-paste blocks). Claude is his execution partner for all technical + content work.

RULES (hard):
- "RIVERS" — Michael runs SEPARATE businesses that must NEVER cross-link or cross-attribute in any public
  way: CMP Cleaning (wife Cleir's), Venice FL Handyman, Putnam Realty Group (Michael = FL Sales Associate
  SL3220671, NOT a broker), Florida Home Value AI (FHV). Work them separately; never let one appear in
  another's marketing. Data from one river can inform Michael's private conviction but is NEVER displayed
  in another's public materials.
- CLEAN COPY RULE: anything to copy/paste/send = a complete, ready-to-use block, nothing to fill in or
  hunt for, names+links already filled. Explanation goes BEFORE or AFTER, never inside the block. One
  item, one destination, clearly labeled. (Michael saved this to Settings; he says "clean" if violated.)
- URLS: always give links; put each URL ALONE on its own line with blank space above+below so it's
  tappable in texts/Messenger. Use the WWW version when sending to people (www.presencescanner.ai/...).
- NO TIME-OF-DAY REMARKS EVER. Claude does NOT reliably know the time/date and must say nothing about it
  (no "goodnight," "rest up," "good morning," "you're in bed"). Michael works at all hours.
- NO GUESSING PRESENTED AS FACT. If unsure, say so. Verify online before stating compliance-sensitive
  facts. Label inferences as inferences. (Michael enforces this hard and has caught many slips.)
- HONEST PUSHBACK / WEAKNESS-HUNTER: proactively flag weak assumptions, failure/embarrassment risks,
  overpromises, scaling/compliance risks, gold-plating, and whether something is the highest-value use of
  time. Never flatter. Be proactive with proven tactics; don't wait to be asked.
- HONESTY IN COPY: never claim something the site/service doesn't actually do (see the "approve before
  live" fix). Overpromising = trust + legal risk.
- Concise, plain English, low jargon, step-by-step, no padding.

═══════════════════════════════════════════════════════════════════════════════
## 2. CURRENT STATE (as of 2026-08-08)
═══════════════════════════════════════════════════════════════════════════════
DIRECTORY = 10 LISTINGS / 10 CATEGORIES, all live + indexed + built to full standard:
1. Roofing — A's Star Roofing (Ken Siharath) /venice/as-star-roofing — lukewarm reviewer (Fast/Good/Maybe)
2. Home Inspection — Lundstrom (Scott) /venice/lundstrom-home-inspections — enthusiastic, public praise
3. House Cleaning — CMP (RIVER) /venice/cmpcleaning-venice
4. Cabinet Refinishing — K&C (Bethany West) /venice/kc-cabinet-refinishing — enthusiastic, building a website
5. Concrete — USA Concrete (Stephen Seed) /venice/usa-concrete-services — enthusiastic
6. Painting — Legacy Paintworks (Joshua Betancourt) /venice/legacy-paintworks — enthusiastic, building a website
7. Mortgage — LeoLends (Leo Namiot) /venice/leolends-mortgage — slow responder, text-wordmark logo
8. Handyman — Venice FL Handyman (Michael's own, RIVER) /venice/venice-fl-handyman
9. Real Estate — Putnam Realty Group (Michael's own, RIVER) /venice/putnam-realty-group
10. Bookkeeping — Simple Books Bookkeeping (simplebooksbk@gmail.com) /venice/simple-books-bookkeeping —
    newest, inbound, QuickBooks-certified, 5 yrs, 941-500-3107, simplebooksbookkeeping.com,
    instagram.com/simplebooksbookkeeping. Has ONE Google review — TODO: ask if she wants it added as text.

SITE PAGES (all built to standard): homepage/scanner (index.html, React), /directory, /reviews,
/how-it-works, /about ("Our Story"), /get-found. Intake form: https://forms.gle/9yzjCMDn3gUoxBNf7
Review form: https://forms.gle/JMCS9qh1NLw8hHAE6

REVIEWS live on /reviews (4, all enthusiastic + attributed): K&C, Scott Lundstrom, Stephen/USA Concrete,
Joshua/Legacy. Not displayed: Ken (lukewarm). Not yet reviewed: Leo (slow).

═══════════════════════════════════════════════════════════════════════════════
## 3. ★ STANDING BUILD REQUIREMENT — every new page MUST include ALL of these
═══════════════════════════════════════════════════════════════════════════════
Hand-building means hand-remembering. Miss one and the page is invisible/broken in some way. Checklist:

A. GA4 TRACKING TAG (or the page is invisible to analytics). Exact snippet in <head>:
   <!-- Google Analytics -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-WD4QS0XK2C"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-WD4QS0XK2C');
   </script>

B. OG SOCIAL-PREVIEW IMAGE (or shared links show an ugly gray box).
   - Build a 1200x630 PNG. Per-MEMBER pages get that owner's OWN logo centered on a clean light card
     (#f7f8fa bg, thin cyan->purple top bar, footer "Local Business Directory · PresenceScanner.ai").
     Even a text-wordmark logo looks fine this way. Common pages use og-default.png (cyan->purple
     gradient, magnifier, "PresenceScanner.ai / Free Local Business Directory / Get found on Google & AI
     search").
   - OG images MUST be a HOSTED FILE URL (cannot be base64/inline). Host in GitHub public/ root ->
     https://presencescanner.ai/og-<slug>.png . (Empty folders don't persist on GitHub; keep images in
     public/ root, not a subfolder.)
   - Tags in <head> (swap slug + page url):
     <meta property="og:type" content="website">
     <meta property="og:title" content="...">
     <meta property="og:description" content="...">
     <meta property="og:image" content="https://presencescanner.ai/og-<slug>.png">
     <meta property="og:image:width" content="1200">
     <meta property="og:image:height" content="630">
     <meta property="og:url" content="https://presencescanner.ai/venice/<slug>">
     <meta name="twitter:card" content="summary_large_image">
     <meta name="twitter:image" content="https://presencescanner.ai/og-<slug>.png">
   - After deploy: FB Sharing Debugger (developers.facebook.com/tools/debug/) -> paste page URL ->
     "Scrape Again" to refresh FB's cache. (The "Missing fb:app_id" warning is harmless; ignore it.)

C. FOOTER NAV (full cross-linking on EVERY page): Directory · How It Works · Reviews · Our Story ·
   Get Found in AI · (Scanner/home). Plus Terms + Privacy.

D. SCHEMA (JSON-LD in <head>):
   - Most specific business type that fits (e.g. AccountingService, RoofingContractor, HousePainter,
     HomeInspection, GeneralContractor, etc.) — NOT generic "LocalBusiness" if a specific subtype exists.
   - PLUS FAQPage schema on every page (FAQ schema materially boosts AI-citation odds). 3-5 real Q&As,
     answers 40-60 words, phrased how people actually ask AI.
   - Consistent NAP (name / service-area / phone) IDENTICAL across page, schema, and external profiles.
   - Validate every page in Google's Rich Results Test before calling it done.

E. TRUST / COMPLIANCE elements: "Listed on PresenceScanner" badge (NEVER "Verified"). Licensing
   disclaimer ("Listing is not an endorsement/verification; confirm credentials directly"). Real reviews
   as TEXT ONLY (NO star/review schema — don't fabricate ratings). "Find us on Google →" GBP label.
   Breadcrumb, canonical (non-www), meta description.

F. DEPLOY/INDEX: add to sitemap.xml -> push to GitHub -> Vercel auto-deploys -> GSC request indexing
   (non-www) + Bing resubmit sitemap -> confirm live in incognito -> notify owner (link isolated, WWW).

NOTE: The long-term fix for all this is a TEMPLATE/generator so A-F are automatic. Until then, this
checklist is the guardrail. Every hand-built page = hand-remember every item.

═══════════════════════════════════════════════════════════════════════════════
## 4. ★ CONTENT / GEO STANDARD — how pages are written to be found + cited
═══════════════════════════════════════════════════════════════════════════════
ANSWER-FIRST: every page (and every section) opens with a specific, concrete fact that directly answers
the core question. AI extracts the first clearly-stated fact. Example that WINS: "median recorded sale
price $610,000, $346/sq ft, based on 355 recorded sales from Sarasota County public records" beats "great
market data." Specific beats generic every time.

OWNER'S-WORDS DIFFERENTIATOR: each page includes the owner's real "what makes you different" answer
(from intake). This is the anti-template signal AI favors — unique, specific, human.

CITATIONS: ground every stat in a real, verifiable source and SAY SO on the page ("based on X recorded
sales from public records"). Honesty about limits is itself a trust signal. Never publish a number you
can't stand behind.

HYPERLOCAL SPECIFICITY: target the specific niche/service/subdivision, NOT broad terms.

★★ THE PROVEN GEO THESIS (validated via live ChatGPT + Google testing, Aug 2026 — hands-on, not theory):
- BROAD queries ("best house cleaner / best handyman") are won by REVIEW VOLUME. AI explicitly shortlists
  by "ratings, review volume, services." A small business CANNOT easily win these; review giants + review
  aggregators (Yelp, Yellow Pages, etc.) own them.
- SPECIFIC/NICHE queries are won by SPECIALIZATION — and specialization can beat far higher review counts.
  (Proven: CMP ranked #1 for "vacation rental cleaning Venice FL" across 3 phrasings — vacation rental /
  VRBO / Airbnb — with only 14 reviews, beating a competitor with 108.)
- BUT specificity only wins when you GENUINELY ARE the specialist. A GENERALIST loses to dedicated
  specialists on a single-trade query. (Proven: Venice FL Handyman, a generalist, lost "drywall repair"
  to drywall-only companies with 65-238 reviews.)
- REVIEWS ARE THE MASTER KEY. The #1 authority signal AI uses. A struggling business's real fix is
  REBUILDING REVIEWS, not a prettier page. (Handyman's site ranks page-1 organic on specific terms but is
  skipped by AI everywhere because it has ~1 review after a GBP suspension wiped the rest.)
- AI referral traffic is REAL and now MEASURABLE: GA4 shows it as "chatgpt.com / ai-assistant" (channel
  "AI Assistant"). This is the ONLY way to SEE real AI-referred visitors — and only works if the GA tag
  is on the page. (Confirmed on CMP's own site: ChatGPT sent a real customer.)
- AI CITATION vs ORGANIC RANK are different games: specific/hyperlocal pages WIN organic Google; AI
  answers/overviews still default to the giants (Zillow/Redfin for valuations; review-volume businesses
  for services). Winning AI citation is the harder frontier — driven by authority signals, esp. reviews.
- HONEST VIDEO CONCEPT (provable, no overpromise): show broad query -> giants win on reviews ("you can't
  win this way") -> show specific query -> specialist wins despite fewer reviews ("here's HOW you win") ->
  lesson: get specific, own your niche. Do NOT claim "the directory gets you cited by AI" (unprovable).
  Use Michael's real voice + screen-recording; captions essential (FB plays muted); under 60 sec; clear
  CTA. Use a non-river example or generic queries — never show CMP/FHV data. Tool: CapCut (free).

═══════════════════════════════════════════════════════════════════════════════
## 5. MARKETING RHYTHM (FB group: North Port Business Network, ~9,200 members, Michael is admin)
═══════════════════════════════════════════════════════════════════════════════
FOUR rotating post types (all give-first, none chasing), on DIFFERENT days:
- "Post Your Business" (supply — businesses self-promote)
- "What Do You Need Done?" (demand — addresses HOMEOWNERS/customers; graphic what-do-you-need-done.png)
- Member Spotlight (2-4 members, TAG each business page so they get notified + share; NO graphic on
  multi-tag posts — the tags ARE the visual)
- Gratitude post (humble "words like these are why I do this" + reviews link; branded OG card)

LINK RULE: post BODY = no link (protects FB reach) -> link in FIRST COMMENT. EXCEPT scheduled posts
(can't pre-load a first comment) = link IN THE BODY (complete > forgotten). Comments/replies = links fine,
no throttle. @everyone notifies ALL 9,200 (use very rarely). Tag individuals to reach specific people.
Commenters auto-get notified of new activity on a post they engaged with.

WELCOME NEW MEMBERS: FB auto-posts a "welcome new members" post every ~10 joins. Drop a warm admin
comment (welcome-first, directory as a light P.S.). Saved as a FB "Saved Reply" for 2-tap reuse.

═══════════════════════════════════════════════════════════════════════════════
## 6. KEY RESOURCES / ACCESS
═══════════════════════════════════════════════════════════════════════════════
- GitHub repo: github.com/presenceiq/presencescanner (public/ = homepage index.html [React/JSX] + common
  pages + og-*.png images; public/venice/ = member pages). Deploys to Vercel from main on commit.
  Everything under Gmail cleirshusband@gmail.com (do NOT delete — runs forms, GitHub, GA).
- GA4 PresenceScanner Measurement ID: G-WD4QS0XK2C (verified against live scanner).
- Vercel: vercel.com/presenceiq-9808s-projects/presencescanner
- GSC: search.google.com/search-console (inspect/index the NON-www version).
- Bing Webmaster: bing.com/webmasters. FB Debugger: developers.facebook.com/tools/debug/.
- Anthropic balance ~$45, near-zero burn, auto-reload OFF (flip ON only if scanner traffic spikes, or the
  scanner errors for visitors when balance hits 0).
- SCANNER note: root issue was service-area-business (SAB) limitation — address-hidden businesses don't
  appear in Google Places API by name (not fixable). Two fixes shipped: honest error-status messaging +
  "common for service-area businesses" copy. Lean on the DIRECTORY over the scanner.

═══════════════════════════════════════════════════════════════════════════════
## 7. OPEN TO-DOS / FOLLOW-UPS (none urgent)
═══════════════════════════════════════════════════════════════════════════════
- Ask Simple Books if she wants her ONE Google review added (as honest attributed TEXT; no star schema).
- Leo + Ken: don't chase for reviews; they warm up when they see results. Leo headshot swap when he sends it.
- Update the delivery message + Directory Guide PDF to the honest "built from your details, sent straight
  to you, corrections if a detail needs updating" framing (still say old "approve before live" wording).
- Members building websites (K&C, Legacy): when their sites near launch, they add a link to their PS
  directory page (real follow-able backlink). Copy-paste snippet: link text "Find us in the Local Business
  Directory" + their WWW /venice/<slug> URL. K&C said "still working on it"; Legacy sent, no reply yet.
- RIVER cleanups (separate, banked): Venice FL Handyman GA tag not installed on the site (ID G-B5T1T87CK8,
  "no data"); CMP GBP had wrong Google-auto-added services (Michael cleaned them 8/7). These are Michael's
  own/river tasks, not PS work.
- Duplicate the PS standards (Section 3 + 4) onto the other sites (FHV, Handyman, Putnam Realty) to fix
  them — highest-impact missing items are usually GA-on-every-page and OG images.

═══════════════════════════════════════════════════════════════════════════════
## 8. THE HONESTY / TRUST FIXES ALREADY MADE (keep them true)
═══════════════════════════════════════════════════════════════════════════════
- Dropped the false "you approve your page before it goes live" claim sitewide (reviews/how-it-works/about,
  visible text AND FAQ schema answers). Real workflow: BUILD from their intake info (they checked the
  accuracy box) -> PUBLISH -> SEND link. Tweaks = MISTAKE CORRECTIONS ONLY, never custom design (Michael
  gives free standard pages, not bespoke service). Wording: "built from the details you provide and sent
  straight to you" — NO self-blame ("if I got it wrong"), since the info is theirs. K&C's testimonial
  (which mentions proof-before-live) left intact — it's her real words, not Michael's claim.
- All 16 pages now have OG cards (homepage + 5 common via og-default.png + 10 member via per-member cards).
- All pages have GA + full footer nav. Homepage (React) footer completed 2026-08-08.

# END MASTER HANDOFF. Full session history in PresenceScanner_Truth.md.
