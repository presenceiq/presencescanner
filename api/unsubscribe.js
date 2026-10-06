// /api/unsubscribe  One-click unsubscribe for PresenceScanner emails, as the
// privacy page promises. Link format: /api/unsubscribe?e=<email>&t=<signature>
// It marks the address "unsubscribed" on the Mailchimp list (the only list
// PresenceScanner keeps). Report emails are only ever sent when someone types
// their address into the scan form, so there's no other list to remove it from.
// Accepts GET (a person clicking the link) and POST (email apps' one-click
// unsubscribe button).
import crypto from 'crypto';
import { tokenOk } from './_unsub.js';

function page(res, status, title, msg) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(status).send(
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex"><title>' + title + '</title></head>' +
    '<body style="background:#f7f8fa;font-family:Arial,Helvetica,sans-serif;color:#1a202c;padding:40px 16px">' +
    '<div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px">' +
    '<h1 style="font-size:22px;margin:0 0 10px">' + title + '</h1><p style="font-size:16px;line-height:1.55">' + msg + '</p>' +
    '<p style="font-size:14px"><a href="https://www.presencescanner.ai" style="color:#2b8eb0">Back to PresenceScanner</a></p>' +
    '</div></body></html>'
  );
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end();
  const q = req.query || {};
  const email = String(q.e || '').trim().toLowerCase();
  const token = String(q.t || '');
  const help = 'If you keep getting emails, reply to any of them and Michael will remove you by hand.';

  if (!email || !tokenOk(email, token)) {
    return page(res, 400, 'That link didn\'t work', 'This unsubscribe link looks incomplete. ' + help);
  }

  const apiKey = process.env.MAILCHIMP_API_KEY || process.env.REACT_APP_MAILCHIMP_KEY;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
  const dc = apiKey ? apiKey.split('-')[1] : '';
  if (!apiKey || !audienceId || !dc) {
    console.error('UNSUBSCRIBE: Mailchimp not configured');
    return page(res, 500, 'Something went wrong', 'We couldn\'t process that automatically. ' + help);
  }

  try {
    const hash = crypto.createHash('md5').update(email).digest('hex');
    const r = await fetch('https://' + dc + '.api.mailchimp.com/3.0/lists/' + audienceId + '/members/' + hash, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Basic ' + Buffer.from('key:' + apiKey).toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'unsubscribed' }),
    });
    // 404 = this address was never on the list, so there's nothing to remove.
    if (r.ok || r.status === 404) {
      if (req.method === 'POST') return res.status(200).json({ ok: true });
      return page(res, 200, 'You\'re unsubscribed', 'You won\'t get any more tips from PresenceScanner. If you run another scan and type your email again, we\'ll send you that one report.');
    }
    const t = await r.text().catch(() => '');
    console.error('UNSUBSCRIBE MAILCHIMP status=' + r.status + ' body=' + t.slice(0, 300));
    return page(res, 502, 'Something went wrong', 'We couldn\'t process that automatically. ' + help);
  } catch (e) {
    console.error('UNSUBSCRIBE ERROR ' + String(e).slice(0, 300));
    return page(res, 500, 'Something went wrong', 'We couldn\'t process that automatically. ' + help);
  }
}
