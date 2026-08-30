// /api/lead  — PresenceScanner lead-capture email
// Fires when someone submits a scan. Emails their entered business info
// (name, website, phone, city, email) to PresenceScanner@gmail.com via Resend.
// RESEND_API_KEY lives in Vercel env vars, never in the page or this file.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is MISSING from environment");
      return res.status(500).json({ error: "no api key in environment" });
    }

    const b = req.body || {};
    const bizName = (b.bizName || "").toString().trim();
    const website = (b.website || "").toString().trim();
    const phone   = (b.phone   || "").toString().trim();
    const city    = (b.city    || "").toString().trim();
    const email   = (b.email   || "").toString().trim();
    const score   = (b.score === 0 || b.score) ? String(b.score) : "";

    // Nothing worth emailing if there's no identifying info at all.
    if (!bizName && !city && !website) {
      return res.status(200).json({ ok: false, skipped: "no identifying info" });
    }

    // Useful data in the subject so it reads without opening.
    const subjBits = [bizName || "Unknown business"];
    if (city) subjBits.push(city);
    let subject = "New scan — " + subjBits.join(", ");
    if (score) subject += " (score " + score + ")";

    // Body leads with what matters; omit empty fields entirely.
    const lines = [];
    if (bizName) lines.push("BUSINESS   " + bizName);
    if (city)    lines.push("CITY       " + city);
    if (phone)   lines.push("PHONE      " + phone);
    if (email)   lines.push("EMAIL      " + email);
    if (website) lines.push("WEBSITE    <" + website + ">");
    if (score)   lines.push("SCORE      " + score + " / 100");
    lines.push("WHEN       " + new Date().toISOString());

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.RESEND_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "leads@presencescanner.ai",
        to: ["PresenceScanner@gmail.com"],
        subject: subject,
        text: lines.join("\n")
      })
    });

    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      console.error("RESEND FAILED status=" + resp.status + " body=" + t.slice(0, 500));
      return res.status(502).json({ error: "notify failed", status: resp.status });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("LEAD ERROR " + String(e).slice(0, 300));
    return res.status(500).json({ error: String(e).slice(0, 200) });
  }
}
