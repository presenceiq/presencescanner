export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PresenceScanner/1.0)' },
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      return res.status(200).json({
        fetched: false,
        reason: 'Could not reach the website',
      });
    }
    clearTimeout(timeout);

    if (!pageRes.ok) {
      return res.status(200).json({
        fetched: false,
        reason: 'Website returned status ' + pageRes.status,
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
