// /api/lead  — PresenceScanner lead-capture email
// Fires when someone submits a scan. Emails their entered business info
// (and the score, if the page sends it later) to PresenceScanner@gmail.com
// via Resend. The RESEND_API_KEY lives in Vercel env vars, never in the page.

export default async function handler(req, res) {
  // Allow a GET request as a built-in self-test: visiting /api/lead in a
  // browser sends a test email and returns the exact Resend result, so we
  // can see precisely what's failing without digging through logs.
  const isTest = req.method === "GET";
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is MISSING from environment");
      return res.status(500).json({ error: "no api key in environment" });
    }
    const b = isTest
      ? { bizName: "TEST LEAD", city: "Venice FL", phone: "941-555-0000", email: "test@example.com", website: "https://example.com" }
      : (req.body || {});

    // Pull the fields the scanner form collects. Everything optional except
    // we won't bother emailing if there's no business name at all.
    const bizName = (b.bizName || "").toString().trim();
    const website = (b.website || "").toString().trim();
    const phone   = (b.phone   || "").toString().trim();
    const city    = (b.city    || "").toString().trim();
    const email   = (b.email   || "").toString().trim();
    const score   = (b.score === 0 || b.score) ? String(b.score) : "";

    if (!bizName && !city && !website) {
      return res.status(200).json({ ok: false, skipped: "no identifying info" });
    }

    // Build the subject with the useful data up front (FHV lesson:
    // put what matters in the subject so it reads without opening).
    const subjBits = [bizName || "Unknown business"];
    if (city) subjBits.push(city);
    let subject = "New scan — " + subjBits.join(", ");
    if (score) subject += " (score " + score + ")";

    // Body: lead with what matters, OMIT empty fields entirely
    // (FHV lesson: blank fields make a real lead look like nothing).
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
      return res.status(200).json({ ok: false, resendStatus: resp.status, resendError: t.slice(0, 400), fromAddress: "leads@presencescanner.ai" });
    }
    console.log("RESEND OK — lead email sent");

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e).slice(0, 200) });
  }
}
