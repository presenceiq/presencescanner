// /api/sendreport  PresenceScanner: email the finished report to the person
// who ran the scan, when they typed an email address on the scan form.
// Added 6 Oct 2026 (Round 4) after a real user assumed her report would be
// emailed, skimmed the screen, closed it, and lost it.
//
// SAFETY, because this sends mail to addresses typed by strangers:
// - Every field from the browser is length-capped and HTML-escaped. The only
//   links in the email are fixed PresenceScanner links built here, never links
//   sent by the browser.
// - Rate limits (Upstash Redis, same store as the scan limiter): at most
//   REPORTS_PER_IP per IP per day and REPORTS_PER_ADDRESS per address per day.
//   If the store isn't configured, sends are allowed (same as the scan limiter).
// - Every email carries a one-click unsubscribe link (see /api/unsubscribe),
//   as the privacy page promises.
// RESEND_API_KEY lives in Vercel env vars, never in this file.

import crypto from 'crypto';
import { isSiteDisabled, disabledResponse } from './_killswitch.js';
import { unsubToken } from './_unsub.js';

const REPORTS_PER_IP = 5;
const REPORTS_PER_ADDRESS = 2;
const SITE = 'https://www.presencescanner.ai';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function cap(s, n) { return String(s == null ? '' : s).slice(0, n); }
function num(v) { return (typeof v === 'number' && isFinite(v)) ? Math.round(v) : null; }

function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return String(req.headers['x-real-ip'] || 'unknown').trim();
}

// Counts one send against a key for 24 hours. Returns the new count, or 0 if
// the store isn't reachable (fail open, like the scan limiter).
async function bump(key) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return 0;
  try {
    const r = await fetch(url + '/incr/' + encodeURIComponent(key), { headers: { Authorization: 'Bearer ' + token } });
    const d = await r.json();
    const n = parseInt(d.result || '0', 10) || 0;
    if (n === 1) {
      await fetch(url + '/expire/' + encodeURIComponent(key) + '/86400', { headers: { Authorization: 'Bearer ' + token } });
    }
    return n;
  } catch (e) {
    console.error('sendreport limiter failed, allowing', String(e).slice(0, 200));
    return 0;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (isSiteDisabled()) return disabledResponse(res);

  try {
    if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: 'not configured' });

    const b = req.body || {};
    const email = cap(b.email, 200).trim().toLowerCase();
    if (!/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email)) {
      return res.status(400).json({ error: 'invalid email' });
    }

    const ipCount = await bump('rpt:ip:' + new Date().toISOString().slice(0, 10) + ':' + clientIp(req));
    const addrHash = crypto.createHash('sha256').update(email).digest('hex').slice(0, 24);
    const addrCount = await bump('rpt:to:' + new Date().toISOString().slice(0, 10) + ':' + addrHash);
    if (ipCount > REPORTS_PER_IP || addrCount > REPORTS_PER_ADDRESS) {
      return res.status(429).json({ error: 'limit' });
    }

    const biz = cap(b.bizName, 120).trim() || 'your business';
    const score = num(b.overallScore);
    const grade = cap(b.overallGrade, 40);
    const summary = cap(b.summary, 800);
    const topPriority = cap(b.topPriority, 500);
    const mapsLine = cap(b.mapsLine, 900);
    const aiLine = cap(b.aiLine, 900);
    const basisLine = cap(b.basisLine, 200);
    const scannedName = cap(b.scannedName, 120);
    const scannedAddress = cap(b.scannedAddress, 200);
    const isMember = b.isMember === true;
    const cats = (Array.isArray(b.categories) ? b.categories : []).slice(0, 8).map(function (c) {
      c = c || {};
      return {
        name: cap(c.name, 60),
        score: num(c.score),
        notScored: c.notScored === true,
        scoreReason: cap(c.scoreReason, 700),
        sourceNote: cap(c.sourceNote, 200),
        findings: (Array.isArray(c.findings) ? c.findings : []).slice(0, 8).map(function (f) {
          f = f || {};
          return { title: cap(f.title, 160), detail: cap(f.detail, 900), action: cap(f.action, 600) };
        }),
      };
    });

    const unsubUrl = SITE + '/api/unsubscribe?e=' + encodeURIComponent(email) + '&t=' + unsubToken(email);

    // ---------- plain-text version ----------
    const T = [];
    T.push('Your PresenceScanner report for ' + biz);
    T.push('');
    if (scannedName) T.push('Scanned: ' + scannedName + (scannedAddress ? ', ' + scannedAddress : ''));
    T.push(score !== null ? ('Overall: ' + score + ' / 100' + (grade ? ' (' + grade + ')' : '')) : ('Overall: ' + (grade || 'not available')));
    if (basisLine) T.push(basisLine);
    if (mapsLine) { T.push(''); T.push('Google Maps check: ' + mapsLine); }
    if (aiLine) { T.push(''); T.push('AI assistant check: ' + aiLine); }
    if (summary) { T.push(''); T.push(summary); }
    if (topPriority) { T.push(''); T.push('Start here: ' + topPriority); }
    cats.forEach(function (c) {
      T.push(''); T.push(c.name.toUpperCase() + ': ' + (c.notScored ? 'not scored this time' : (c.score !== null ? c.score + '%' : '')));
      if (c.scoreReason) T.push(c.scoreReason);
      if (c.sourceNote) T.push('Source: ' + c.sourceNote);
      c.findings.forEach(function (f) {
        T.push('- ' + f.title + (f.detail ? ': ' + f.detail : ''));
        if (f.action) T.push('  What to do: ' + f.action);
      });
    });
    T.push('');
    if (!isMember) { T.push('Want a free page in the PresenceScanner local business directory? ' + SITE + '/directory'); T.push(''); }
    T.push('Run a new scan any time: ' + SITE);
    T.push('Questions? Just reply to this email.');
    T.push('');
    T.push('This report is an automated estimate based on public information, not professional advice.');
    T.push('You got this because a copy of this report was requested for this address at www.presencescanner.ai.');
    T.push('Unsubscribe: ' + unsubUrl);

    // ---------- HTML version ----------
    const cyan = '#2b8eb0', purple = '#6d28d9', ink = '#1a202c', mute = '#4a5568';
    let H = '';
    H += '<div style="background:#f7f8fa;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:' + ink + '">';
    H += '<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;border:1px solid #e2e8f0">';
    H += '<div style="font-size:13px;font-weight:bold;letter-spacing:1px;color:' + cyan + '">PRESENCESCANNER REPORT</div>';
    H += '<h1 style="font-size:22px;margin:8px 0 4px">' + esc(biz) + '</h1>';
    if (scannedName) H += '<div style="font-size:14px;color:' + mute + '">Scanned: ' + esc(scannedName) + (scannedAddress ? ', ' + esc(scannedAddress) : '') + '</div>';
    H += '<div style="margin:18px 0;padding:16px;border-radius:10px;background:linear-gradient(135deg,' + cyan + ',' + purple + ');color:#ffffff">';
    H += '<div style="font-size:32px;font-weight:bold">' + (score !== null ? score + '<span style="font-size:16px"> / 100</span>' : esc(grade || 'Score not available')) + '</div>';
    if (grade && score !== null) H += '<div style="font-size:15px">' + esc(grade) + '</div>';
    if (basisLine) H += '<div style="font-size:13px;opacity:0.9;margin-top:4px">' + esc(basisLine) + '</div>';
    H += '</div>';
    if (mapsLine) H += '<p style="font-size:15px;line-height:1.55;margin:0 0 12px;padding:12px;background:#f7f8fa;border-radius:8px"><b>Google Maps check:</b> ' + esc(mapsLine) + '</p>';
    if (aiLine) H += '<p style="font-size:15px;line-height:1.55;margin:0 0 12px;padding:12px;background:#f7f8fa;border-radius:8px"><b>AI assistant check:</b> ' + esc(aiLine) + '</p>';
    if (summary) H += '<p style="font-size:15px;line-height:1.55;margin:0 0 12px">' + esc(summary) + '</p>';
    if (topPriority) H += '<p style="font-size:15px;line-height:1.55;margin:0 0 18px"><b>Start here:</b> ' + esc(topPriority) + '</p>';
    cats.forEach(function (c) {
      H += '<div style="border-top:1px solid #e2e8f0;padding-top:14px;margin-top:14px">';
      H += '<div style="font-size:17px;font-weight:bold">' + esc(c.name) + ' <span style="color:' + cyan + '">' + (c.notScored ? 'not scored this time' : (c.score !== null ? c.score + '%' : '')) + '</span></div>';
      if (c.scoreReason) H += '<p style="font-size:14px;line-height:1.5;color:' + mute + ';margin:6px 0">' + esc(c.scoreReason) + '</p>';
      if (c.sourceNote) H += '<p style="font-size:13px;line-height:1.5;color:' + mute + ';margin:6px 0;padding:8px;background:#f7f8fa;border-radius:6px"><b>Source:</b> ' + esc(c.sourceNote) + '</p>';
      c.findings.forEach(function (f) {
        H += '<div style="margin:10px 0 0 0">';
        H += '<div style="font-size:15px;font-weight:bold">' + esc(f.title) + '</div>';
        if (f.detail) H += '<div style="font-size:14px;line-height:1.5;margin-top:2px">' + esc(f.detail) + '</div>';
        if (f.action) H += '<div style="font-size:14px;line-height:1.5;margin-top:4px"><b>What to do:</b> ' + esc(f.action) + '</div>';
        H += '</div>';
      });
      H += '</div>';
    });
    H += '<div style="border-top:1px solid #e2e8f0;margin-top:18px;padding-top:14px;font-size:14px;line-height:1.6">';
    if (!isMember) H += '<p style="margin:0 0 10px">Want a free page in the PresenceScanner local business directory? <a href="' + SITE + '/directory" style="color:' + cyan + '">See the directory</a></p>';
    H += '<p style="margin:0 0 10px">Run a new scan any time at <a href="' + SITE + '" style="color:' + cyan + '">www.presencescanner.ai</a>. Questions? Just reply to this email.</p>';
    H += '</div>';
    H += '<div style="font-size:12px;line-height:1.5;color:#718096;margin-top:14px">This report is an automated estimate based on public information, not professional advice. You got this because a copy of this report was requested for this address at www.presencescanner.ai. <a href="' + esc(unsubUrl) + '" style="color:#718096">Unsubscribe</a></div>';
    H += '</div></div>';

    const subject = 'Your PresenceScanner report: ' + biz + (score !== null ? ', ' + score + '/100' : '');

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'PresenceScanner <report@presencescanner.ai>',
        to: [email],
        reply_to: 'PresenceScanner@gmail.com',
        subject: subject,
        html: H,
        text: T.join('\n'),
        headers: {
          'List-Unsubscribe': '<' + unsubUrl + '>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    });
    if (!resp.ok) {
      const t = await resp.text().catch(() => '');
      console.error('SENDREPORT RESEND FAILED status=' + resp.status + ' body=' + t.slice(0, 300));
      return res.status(502).json({ error: 'send failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('SENDREPORT ERROR ' + String(e).slice(0, 300));
    return res.status(500).json({ error: 'error' });
  }
}
