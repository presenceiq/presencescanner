import { isSiteDisabled, disabledResponse } from './_killswitch.js';

// Real browser-like headers so ordinary bot-detection lets us in.
// (Many sites block a fetcher that announces itself as a bot.)
const BROWSER_HEADERS = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Upgrade-Insecure-Requests': '1',
          'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-User': '?1',
          'Sec-Fetch-Dest': 'document',
        };

// Plain, honest request used when a site refuses the browser-style one.
const PLAIN_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; PresenceScanner/1.0; +https://www.presencescanner.ai)',
  'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// Follows up to 8 redirects by hand, keeping cookies like a browser. Throws
// "redirect loop" only when the same address comes back with the same cookies.
async function fetchFollow(startUrl, signal, headers) {
  let url = startUrl;
  const jar = {};
  const seen = {};
  for (let hop = 0; hop < 8; hop++) {
    const cookie = Object.keys(jar).map(function (k) { return k + '=' + jar[k]; }).join('; ');
    const h = cookie ? Object.assign({}, headers, { Cookie: cookie }) : headers;
    const r = await fetch(url, { signal: signal, redirect: 'manual', headers: h });
    const setCookies = (r.headers && typeof r.headers.getSetCookie === 'function')
      ? r.headers.getSetCookie()
      : (r.headers && r.headers.get('set-cookie') ? [r.headers.get('set-cookie')] : []);
    setCookies.forEach(function (c) {
      const m = String(c).match(/^\s*([^=;\s]+)=([^;]*)/);
      if (m) jar[m[1]] = m[2];
    });
    const loc = r.headers && r.headers.get('location');
    if (r.status >= 300 && r.status < 400 && loc) {
      const next = new URL(loc, url).toString();
      const now = Object.keys(jar).map(function (k) { return k + '=' + jar[k]; }).join('; ');
      const key = next + '|' + now;
      if (seen[key]) throw new Error('redirect loop');
      seen[key] = 1;
      url = next;
      continue;
    }
    return r;
  }
  throw new Error('redirect loop (too many redirects)');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // KILL SWITCH — if SITE_DISABLED=true in Vercel env vars, return immediately.
  if (isSiteDisabled()) return disabledResponse(res);

  try {
    let { website } = req.body || {};

    // No website given — return cleanly, the scanner handles this case.
    if (!website || !String(website).trim()) {
      return res.status(200).json({ fetched: false, reason: 'No website provided' });
    }

    // Make sure the URL has a protocol so fetch() accepts it.
    website = String(website).trim();
    if (!/^https?:\/\//i.test(website)) {
      website = 'https://' + website;
    }

    // Fetch the page with a timeout so a slow site can't hang the scan.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let pageRes;
    try {
      // Follow redirects ourselves, carrying cookies between hops the way a
      // browser does. Some sites (a real one: The Breakfast Cottage, 6 Oct 2026)
      // bounce a visitor between http and https until a cookie is set, which a
      // plain fetch sees as an endless loop. If it still loops, try once more
      // without the "upgrade to secure" header, which some servers react to.
      try {
        pageRes = await fetchFollow(website, controller.signal, BROWSER_HEADERS);
      } catch (firstErr) {
        if (!/redirect/i.test(String(firstErr && firstErr.message))) throw firstErr;
        const plain = Object.assign({}, BROWSER_HEADERS);
        ['Upgrade-Insecure-Requests','Sec-Fetch-Site','Sec-Fetch-Mode','Sec-Fetch-User','Sec-Fetch-Dest'].forEach(function (h) { delete plain[h]; });
        pageRes = await fetchFollow(website, controller.signal, plain);
      }
    } catch (fetchErr) {
      clearTimeout(timeout);
      // Capture WHAT actually failed so the lead notification can show it
      // (redirect loop, timeout, connection error) instead of a vague miss.
      const em = String((fetchErr && fetchErr.message) || '').toLowerCase();
      const scanReason =
        (fetchErr && fetchErr.name === 'AbortError') ? 'timed out' :
        /redirect/.test(em) ? 'redirect loop' :
        /certificate|tls|ssl/.test(em) ? 'SSL/certificate error' :
        (em ? em.slice(0, 80) : 'could not connect');
      return res.status(200).json({
        fetched: false,
        scanReason: scanReason,
        // Honest signal: a failed fetch is OFTEN just a security setting,
        // NOT a real problem with the site. The report must not claim
        // the website is "broken" — see reasonForUser below.
        reason: 'Could not reach the website automatically',
        reasonForUser: 'We could not reach this website with our automated scanner. This is commonly caused by the site\'s security settings (firewall or bot protection) and does NOT necessarily mean anything is wrong with the website. Website analysis was skipped for this scan.',
        likelyAccessibleToHumans: true,
        // We could not read the page, so EVERY website signal is unknown —
        // not false, not zero. The report must treat these as "could not
        // verify," never as confirmed deficiencies.
        schemaStatus: 'unknown',
        viewportStatus: 'unknown',
        faqStatus: 'unknown',
        facebookStatus: 'unknown',
        instagramStatus: 'unknown',
      });
    }
    // REFUSED? (7 Oct 2026) A real scan of Titanium Tint got "403 refused"
    // from a site that a plain request read fine the same day. Some sites'
    // protection rejects a request that dresses up as Chrome but comes from a
    // server. So when refused, ask once more the plain way, saying honestly
    // who we are, and if the address was http, try the https version too.
    if (pageRes && [401, 403, 406, 429, 503].indexOf(pageRes.status) !== -1) {
      const firstStatus = pageRes.status;
      const tries = [website];
      if (/^http:/i.test(website)) tries.push(website.replace(/^http:/i, 'https:'));
      // Close the refused answer so its connection isn't left hanging.
      try { if (pageRes.body) pageRes.body.cancel(); } catch (e) {}
      for (const u of tries) {
        try {
          const alt = await fetchFollow(u, controller.signal, PLAIN_HEADERS);
          if (alt.ok) { pageRes = alt; break; }
          try { if (alt.body) alt.body.cancel(); } catch (e) {}
        } catch (e) { /* keep the first answer */ }
      }
      if (!pageRes.ok) console.error('FETCHSITE refused (' + firstStatus + ') even on plain retry: ' + website);
    }
    clearTimeout(timeout);

    if (!pageRes.ok) {
      return res.status(200).json({
        fetched: false,
        scanReason: 'status ' + pageRes.status,
        reason: 'Website returned status ' + pageRes.status,
        reasonForUser: 'Our automated scanner received an unexpected response (status ' + pageRes.status + ') from this website. This can be caused by security or server settings and does NOT necessarily mean the website is broken for visitors. Website analysis was skipped for this scan.',
        likelyAccessibleToHumans: true,
        // Page not readable, so every website signal is unknown, not false.
        schemaStatus: 'unknown',
        viewportStatus: 'unknown',
        faqStatus: 'unknown',
        facebookStatus: 'unknown',
        instagramStatus: 'unknown',
      });
    }

    const html = await pageRes.text();

    // --- Pull out the signals the AI needs, WITHOUT shipping the whole page ---

    const lower = html.toLowerCase();

    // Title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().slice(0, 200) : '';

    // Meta description
    const descMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i
    );
    const metaDescription = descMatch ? descMatch[1].trim().slice(0, 300) : '';

    // Schema markup (JSON-LD structured data) — key for AI/GEO scoring
    const hasSchema = lower.includes('application/ld+json') || lower.includes('schema.org');

    // Mobile viewport tag
    const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html);

    // Heading count (rough content-structure signal)
    const h1Count = (html.match(/<h1[\s\S]*?<\/h1>/gi) || []).length;
    const h2Count = (html.match(/<h2[\s\S]*?<\/h2>/gi) || []).length;

    // FAQ presence — AI systems lean on FAQ content
    const hasFAQ = lower.includes('faq') || lower.includes('frequently asked');

    // Social links
    const hasFacebook = lower.includes('facebook.com');
    const hasInstagram = lower.includes('instagram.com');

    // THREE-STATE SIGNALS — because we DID successfully read this homepage, a
    // signal that's absent means "we looked on the scanned page and didn't find
    // it" (not_found_on_scanned_page), NOT "the business doesn't have it." The
    // business may well have a Facebook page, an FAQ, or schema elsewhere on the
    // site or on another platform — we only checked this one homepage. The AI
    // prompt is told to phrase these as "not found on the scanned page."
    const schemaStatus    = hasSchema    ? 'found' : 'not_found_on_scanned_page';
    const viewportStatus  = hasViewport  ? 'found' : 'not_found_on_scanned_page';
    const faqStatus       = hasFAQ       ? 'found' : 'not_found_on_scanned_page';
    const facebookStatus  = hasFacebook  ? 'found' : 'not_found_on_scanned_page';
    const instagramStatus = hasInstagram ? 'found' : 'not_found_on_scanned_page';

    // Strip tags to estimate how much real text content the page has.
    const textOnly = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const wordCount = textOnly ? textOnly.split(' ').length : 0;

    // A short text sample so the AI can judge tone/clarity — capped small.
    const textSample = textOnly.slice(0, 1500);

    // PAGE BUILT BY CODE (10 Oct 2026). Some site builders (Hostinger's AI
    // Builder, for one) send an almost empty page and add the words, headings
    // and photos with code in the visitor's browser. People see a full site;
    // anything that reads the page without running the code, including this
    // scanner and the AI crawlers behind ChatGPT, Claude and Perplexity, sees
    // next to nothing. Flag it so the report says so instead of "no content".
    // Builder tag, read in either attribute order (name first or content first).
    const genTag = (html.match(/<meta\b[^>]*\b(?:name|property|http-equiv)=["']?generator["']?[^>]*>/i) || [''])[0];
    const genMatch = genTag.match(/\bcontent=["']([^"']{1,300})["']/i);
    const generator = genMatch ? genMatch[1].trim() : '';
    const scriptCount = (html.match(/<script\b/gi) || []).length;
    const appShell = /<div[^>]+id=["'](root|app|__next|__nuxt|___gatsby)["']/i.test(html) || /<noscript[^>]*>[\s\S]{0,300}(enable|turn on) javascript/i.test(html);
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyWords = bodyMatch ? bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length : wordCount;
    const jsBuilt = bodyWords < 40 && h1Count === 0 && (scriptCount >= 3 || appShell || !!generator);

    return res.status(200).json({
      fetched: true,
      url: website,
      title,
      metaDescription,
      h1Count,
      h2Count,
      // Three-state signals ONLY. The old boolean fields (hasSchema, hasFAQ,
      // hasFacebook, hasInstagram, hasViewport) were removed on purpose: keeping
      // both invited the report to read a bare false and reintroduce the
      // "treated absent as confirmed-missing" bug. 'found' = confirmed on the
      // scanned homepage; 'not_found_on_scanned_page' = read the page, wasn't
      // there (NOT proof the business lacks it); 'unknown' = couldn't read page.
      schemaStatus,
      viewportStatus,
      faqStatus,
      facebookStatus,
      instagramStatus,
      wordCount,
      textSample,
      jsBuilt,
      // The site builder named in the page's own code, e.g. "WebStarts.com",
      // "Hostinger AI Builder", "Wix.com Website Builder". Version numbers dropped.
      builder: generator.replace(/[;(].*$/, '').replace(/\s+[-|:]\s+.*$/, '').replace(/\s+v?\d[\d.]*.*$/i, '').slice(0, 60),
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
