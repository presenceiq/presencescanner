// /api/aicheck  PresenceScanner: does an AI assistant actually recommend this
// business? Added 6 Oct 2026.
//
// We ask Claude (with ONE live web search, localized to the business's town)
// the question a customer would ask, e.g. "What are the best breakfast
// restaurants in Nokomis, FL?". We do NOT tell it which business we're
// checking, so the answer isn't biased. Then the CODE (not the AI) checks
// whether the business's name appears in the list it gave.
//
// Honest limits, stated in the report: answers vary from run to run and from
// one AI to another. This is one AI, asked once, at one moment.
//
// Cost: one web search ($10 per 1,000 per Anthropic's docs) plus the tokens
// to read the results. Capped by the spending guard per visitor and per day.

import { isSiteDisabled, disabledResponse } from './_killswitch.js';
import { spend, refused } from './_budget.js';

const MODELS = ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6']; // cheapest first; second only if the first can't search
const TIMEOUT_MS = 25000;

const STATES = { AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming' };

// Name matching done in code: lowercase, drop punctuation and filler words.
const FILLER = new Set(['the','and','of','llc','inc','co','company','corp','ltd','fl','florida','a','an']);
function norm(s) {
  return String(s || '').toLowerCase().replace(/['\u2019]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/).filter(function (w) { return w && !FILLER.has(w); }).join(' ');
}
function sameBusiness(ours, theirs) {
  const a = norm(ours), b = norm(theirs);
  if (!a || !b) return false;
  if (a === b) return true;
  // Whole words only. "Their" name may add at most one extra word to ours
  // ("Breakfast Cottage" vs "The Breakfast Cottage Nokomis"), and ours must be
  // 2+ words, so "Venice Plumbing" never matches "North Venice Plumbing Drain".
  const aw = a.split(' '), bw = b.split(' ');
  const inside = function (x, y) { return (' ' + y + ' ').indexOf(' ' + x + ' ') !== -1; };
  if (aw.length >= 2 && inside(a, b) && bw.length - aw.length <= 1) return true;
  if (bw.length >= 2 && inside(b, a) && aw.length - bw.length <= 1) return true;
  // One-word names ("Pinchers") match "Pinchers Crab Shack" if long enough.
  if (aw.length === 1 && a.length >= 6 && inside(a, b) && bw.length - aw.length <= 2) return true;
  return false;
}

async function ask(model, question, loc) {
  const controller = new AbortController();
  const t = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: model,
        max_tokens: 500,
        temperature: 0,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 1, user_location: loc }],
        messages: [{ role: 'user', content:
          'A customer asks you: "' + question + '"\n' +
          'Search the web once, then answer the way you normally would for a customer, recommending up to 5 specific local businesses, best first. ' +
          'Keep it short. On the very last line, write NAMES: followed by the business names you recommended, in order, separated by | (for example: NAMES: Joe\'s Diner | Main Street Cafe). If you can\'t recommend any, write NAMES: none' }],
      }),
    });
    const d = await r.json();
    return { ok: r.ok, d: d };
  } finally { clearTimeout(t); }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (isSiteDisabled()) return disabledResponse(res);

  const b = req.body || {};
  const clean = function (s, n) { return String(s || '').replace(/[^A-Za-z0-9 &'.,\-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n); };
  const bizName = clean(b.bizName, 100);
  const phrase = clean(b.phrase, 60).toLowerCase();
  const city = clean(b.city, 60);
  // The question comes from the scanner's short AI call (the way a customer
  // would ask it). Kept short and must be a question; otherwise a plain one is used.
  const q = String(b.question || '').replace(/[^A-Za-z0-9 &'.,?\-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140);
  if (bizName.length < 2 || phrase.length < 3 || city.length < 2) return res.status(400).json({ error: 'bad input' });
  if (!process.env.ANTHROPIC_KEY) return res.status(500).json({ error: 'not configured' });

  const ok = await spend(req, 'aicheck');
  if (!ok.ok) return refused(res, ok.message);

  const parts = city.split(',').map(function (s) { return s.trim(); });
  const st = (parts[1] || '').toUpperCase().slice(0, 2);
  const loc = { type: 'approximate', city: parts[0], country: 'US', timezone: 'America/New_York' };
  if (STATES[st]) loc.region = STATES[st];

  // The question must not name the business, or the check would be biased.
  const named = norm(bizName) && (' ' + norm(q) + ' ').indexOf(' ' + norm(bizName) + ' ') !== -1;
  const question = (q.length >= 12 && /\?$/.test(q) && !named) ? q : ('Who are the best places for ' + phrase + ' in ' + city + '?');

  try {
    let out = null, used = null;
    for (const m of MODELS) {
      out = await ask(m, question, loc);
      used = m;
      if (out.ok) break;
      console.error('AICHECK ' + m + ' failed: ' + JSON.stringify(out.d).slice(0, 300));
      // Only try the second model if the first one can't do this kind of
      // request. A busy or rate-limited error would just cost a second call.
      if (!(out.d && out.d.error && out.d.error.type === 'invalid_request_error')) break;
    }
    if (!out || !out.ok) return res.status(502).json({ error: 'ai failed' });
    const text = (out.d.content || []).filter(function (c) { return c.type === 'text'; }).map(function (c) { return c.text; }).join('');
    const searched = (out.d.content || []).some(function (c) { return c.type === 'web_search_tool_result'; });
    const all = text.match(/NAMES:\s*([^\n]*)/gi);
    // No NAMES line (answer cut off, or format ignored): report nothing rather
    // than wrongly saying the AI recommended nobody.
    if (!all || !searched) return res.status(200).json({ ok: false, error: 'unreadable answer' });
    const line = all[all.length - 1].replace(/^NAMES:\s*/i, '');
    const names = /^none$/i.test(line.replace(/[^A-Za-z]/g, '')) ? [] :
      line.split('|').map(function (s) { return s.replace(/\*+/g, '').trim().replace(/[.;,]+$/, '').slice(0, 80); }).filter(Boolean).slice(0, 5);
    const idx = names.findIndex(function (n) { return sameBusiness(bizName, n); });
    return res.status(200).json({
      ok: true,
      question: question,
      searched: searched,
      model: used,
      named: idx !== -1,
      position: idx === -1 ? null : idx + 1,
      count: names.length,
      names: names,
    });
  } catch (e) {
    console.error('AICHECK ERROR ' + String(e).slice(0, 200));
    return res.status(500).json({ error: 'error' });
  }
}
