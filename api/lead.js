// /api/lead  — PresenceScanner lead-capture email
// Fires AFTER a full scan completes (not on submit), so it carries the results.
// Emails a structured, consistent record to PresenceScanner@gmail.com via Resend.
// The record doubles as a log entry (email-as-log) and is database-ready if ever
// imported. RESEND_API_KEY lives in Vercel env vars, never in this file.

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
    const overallScore = (b.overallScore === 0 || b.overallScore) ? b.overallScore : null;
    const overallGrade = (b.overallGrade || "").toString().trim();
    const components = (b.components && typeof b.components === "object") ? b.components : {};
    const topIssues = Array.isArray(b.topIssues) ? b.topIssues : [];
    const isMine = b.mine === true;
    const hasDirPage = (b.hasDirPage || "").toString().trim(); // "yes" / "no" / ""

    if (!bizName && !city && !website) {
      return res.status(200).json({ ok: false, skipped: "no identifying info" });
    }

    // Consistent ISO date (YYYY-MM-DD) — the key field for before/after tracking.
    const dateStr = new Date().toISOString().slice(0, 10);

    // Subject: useful data up front. Michael's own scans are tagged so his 25
    // member scans don't look like real inbound leads.
    let subject = (isMine ? "[MY SCAN] " : "New scan — ") + (bizName || "Unknown business");
    if (city) subject += ", " + city;
    if (overallScore !== null) subject += " — " + overallScore + "/100";

    // Body = a clean, consistently-structured record (same fields, same order,
    // every time) so it reads well AND any future database can ingest it.
    const lines = [];
    lines.push("DATE       " + dateStr);
    lines.push("BUSINESS   " + (bizName || "(not given)"));
    if (city)    lines.push("CITY       " + city);
    if (phone)   lines.push("PHONE      " + phone);
    if (email)   lines.push("EMAIL      " + email);
    if (website) lines.push("WEBSITE    <" + website + ">");
    if (hasDirPage) lines.push("DIR MEMBER " + (hasDirPage === "yes" ? "Yes" : hasDirPage === "no" ? "No" : hasDirPage));
    lines.push("");
    lines.push("OVERALL    " + (overallScore !== null ? (overallScore + " / 100") : "(not available)") + (overallGrade ? ("  (" + overallGrade + ")") : ""));

    // Component scores — one per line, labeled, consistent.
    const compKeys = Object.keys(components);
    if (compKeys.length) {
      lines.push("");
      lines.push("COMPONENTS");
      compKeys.forEach(function (k) {
        lines.push("  " + k + ": " + components[k]);
      });
    }

    // Top issues — up to 3.
    if (topIssues.length) {
      lines.push("");
      lines.push("TOP ISSUES");
      topIssues.slice(0, 3).forEach(function (t, i) {
        lines.push("  " + (i + 1) + ". " + t);
      });
    }

    if (isMine) {
      lines.push("");
      lines.push("(This is one of your own member scans — tagged via ?mine=1.)");
    }

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
