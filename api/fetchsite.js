import { isSiteDisabled, disabledResponse } from './_killswitch.js';

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
      pageRes = await fetch(website, {
        signal: controller.signal,
        // Real browser-like headers so ordinary bot-detection lets us in.
        // (Many sites block a fetcher that announces itself as a bot.)
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      return res.status(200).json({
        fetched: false,
        // Honest signal: a failed fetch is OFTEN just a security setting,
        // NOT a real problem with the site. The report must not claim
        // the website is "broken" — see reasonForUser below.
        reason: 'Could not reach the website automatically',
        reasonForUser: 'We could not reach this website with our automated scanner. This is commonly caused by the site\'s security settings (firewall or bot protection) and does NOT necessarily mean anything is wrong with the website. Website analysis was skipped for this scan.',
        likelyAccessibleToHumans: true,
      });
    }
    clearTimeout(timeout);

    if (!pageRes.ok) {
      return res.status(200).json({
        fetched: false,
        reason: 'Website returned status ' + pageRes.status,
        reasonForUser: 'Our automated scanner received an unexpected response (status ' + pageRes.status + ') from this website. This can be caused by security or server settings and does NOT necessarily mean the website is broken for visitors. Website analysis was skipped for this scan.',
        likelyAccessibleToHumans: true,
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

    return res.status(200).json({
      fetched: true,
      url: website,
      title,
      metaDescription,
      hasSchema,
      hasViewport,
      h1Count,
      h2Count,
      hasFAQ,
      hasFacebook,
      hasInstagram,
      wordCount,
      textSample,
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
