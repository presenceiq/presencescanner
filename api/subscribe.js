import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email } = req.body || {};

    // Validate the email before doing anything else
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    const cleanEmail = String(email).trim().toLowerCase();

    const apiKey = process.env.MAILCHIMP_API_KEY || process.env.REACT_APP_MAILCHIMP_KEY;
    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

    if (!apiKey || !audienceId) {
      return res.status(500).json({ error: 'Mailchimp is not configured' });
    }

    // Every Mailchimp API key ends in a data-center suffix, e.g. "...-us21"
    const dc = apiKey.split('-')[1];
    if (!dc) {
      return res.status(500).json({ error: 'Mailchimp API key is malformed' });
    }

    // MD5 of the lowercased email is Mailchimp's "subscriber hash". Using PUT
    // with this hash is an upsert: a repeat signup updates the existing contact
    // instead of throwing a "Member Exists" error.
    const subscriberHash = crypto.createHash('md5').update(cleanEmail).digest('hex');
    const url = `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`;

    const mcRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': 'Basic ' + Buffer.from('key:' + apiKey).toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: cleanEmail,
        status_if_new: 'subscribed',
        status: 'subscribed',
        tags: ['presence-scanner'],
      }),
    });

    const data = await mcRes.json();

    if (mcRes.status >= 400) {
      // Mailchimp puts the human-readable reason in data.detail
      return res.status(mcRes.status).json({
        error: data.detail || data.title || 'Mailchimp request failed',
      });
    }

    return res.status(200).json({ subscribed: true });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
