// ---------------------------------------------------------------
// ALERTS TO MICHAEL (added 11 Oct 2026)
//
// When something stops scans from working for visitors (a daily cap is
// reached, the AI account runs out of credit, Google refuses our lookups),
// email PresenceScanner@gmail.com so Michael hears about it before a member
// does. Each kind of alert goes out at most once a day, using the same
// Upstash Redis store as the spending guard to remember what was sent.
//
// An alert never blocks or slows a visitor's scan by more than one email
// call, and if sending fails it is only logged.
// ---------------------------------------------------------------

const DAY = 86400;

function today() { return new Date().toISOString().slice(0, 10); }

// True the first time this key is claimed today, false after that.
// If the store isn't set up, it says true (better a repeat email than none).
async function firstToday(key) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return true;
  try {
    const r = await fetch(url + '/set/' + encodeURIComponent('alert:' + key + ':' + today()) + '/1/EX/' + DAY + '/NX', {
      headers: { Authorization: 'Bearer ' + token },
    });
    const d = await r.json();
    return d && d.result === 'OK';
  } catch (e) {
    return true;
  }
}

export async function alertOnce(key, subject, text) {
  try {
    if (!(await firstToday(key))) return;
    if (!process.env.RESEND_API_KEY) {
      console.error('ALERT (no email key): ' + subject + ' | ' + text);
      return;
    }
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'leads@presencescanner.ai',
        to: ['PresenceScanner@gmail.com'],
        subject: '[ALERT] ' + subject,
        text: text + '\n\nThis alert is sent at most once a day for this problem.',
      }),
    });
    if (!resp.ok) console.error('ALERT EMAIL FAILED status=' + resp.status);
  } catch (e) {
    console.error('ALERT error: ' + String(e).slice(0, 200));
  }
}
