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
    const matchedAddress = (b.matchedAddress || "").toString().trim();
    // How the Google profile was (or wasn't) found. Lets the MATCHED line say
    // what our LOOKUP did, never what exists — an empty lookup is not proof a
    // business has no Google listing (service-area businesses are often missed).
    //   "owner-says-listed" = owner says they have a listing we couldn't find
    //   "owner-says-none"   = owner chose "I don't have a Google Business Profile yet"
    //   anything else       = lookup found nothing; owner typed details by hand
    const gbpStatus = (b.gbpStatus || "").toString().trim();
    const listingUrl = (b.listingUrl || "").toString().trim();
    // Direct link to the Google listing our lookup matched (built from its
    // Google ID). Lets Michael see photos, reviews and what the listing says
    // before he calls. Only sent when Google itself returned the listing.
    const googleListing = (b.googleListing || "").toString().trim();
    const mapsRank = (b.mapsRank || "").toString().trim().slice(0, 200);
    const aiCheck = (b.aiCheck || "").toString().trim().slice(0, 900);
    const websiteScan = (b.websiteScan || "").toString().trim();
    const email   = (b.email   || "").toString().trim();
    const overallScore = (b.overallScore === 0 || b.overallScore) ? b.overallScore : null;
    const overallGrade = (b.overallGrade || "").toString().trim();
    const components = (b.components && typeof b.components === "object") ? b.components : {};
    const topIssues = Array.isArray(b.topIssues) ? b.topIssues : [];
    const isMine = b.mine === true;
    // True when the person skipped the email on the form, saw the results, and
    // then asked for the report by email (added 7 Oct 2026). Same record as the
    // first lead email, now with their email address.
    const emailLater = b.emailLater === true;
    const hasDirPage = (b.hasDirPage || "").toString().trim(); // "yes" / "no" / ""
    // "2 of 5" when too few sections were scored for the customer to be shown an
    // overall number. Michael still sees the internal number, clearly marked.
    const partial = (b.partial || "").toString().trim().slice(0, 20);
    const basis = (b.basis || "").toString().trim().slice(0, 200);

    if (!bizName && !city && !website) {
      return res.status(200).json({ ok: false, skipped: "no identifying info" });
    }

    // Date in Eastern time (America/New_York) — Michael schedules follow-ups
    // off this, so it must be his local date, not UTC. en-CA gives YYYY-MM-DD.
    const dateStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

    // Subject: useful data up front. Michael's own scans are tagged so his 25
    // member scans don't look like real inbound leads.
    let subject = (isMine ? "[MY SCAN] " : "") + (emailLater ? "Email added after results — " : (isMine ? "" : "New scan — ")) + (bizName || "Unknown business");
    if (city) subject += ", " + city;
    if (partial) subject += " — partial check (" + partial + ")";
    else if (overallScore !== null) subject += " — " + overallScore + "/100";

    // Body = a clean, consistently-structured record (same fields, same order,
    // every time) so it reads well AND any future database can ingest it.
    const lines = [];
    lines.push("DATE       " + dateStr);
    lines.push("BUSINESS   " + (bizName || "(not given)"));
    if (city)    lines.push("CITY       " + city);
    let matchedLine;
    if (matchedAddress) {
      matchedLine = matchedAddress;
    } else if (gbpStatus === "owner-says-listed") {
      matchedLine = "Our Google lookup found no matching listing. The owner says one exists"
        + (listingUrl ? ". Their link: " + listingUrl : " (no link given).");
    } else if (gbpStatus === "owner-says-none") {
      matchedLine = "Our Google lookup found no matching listing, and the owner chose \"I don't have a Google Business Profile yet.\" Check Google Maps before relying on that.";
    } else {
      matchedLine = "Our Google lookup found no matching listing. Check Google Maps before telling them they don't have one.";
    }
    lines.push("MATCHED    " + matchedLine);
    // Links sit bare at the END of their line, with nothing after them. Gmail
    // was treating the old closing ">" as part of the link, which made a 404.
    if (googleListing) lines.push("LISTING    " + googleListing);
    if (mapsRank) lines.push("MAPS RANK  " + mapsRank);
    if (aiCheck) lines.push("AI CHECK   " + aiCheck);
    if (phone)   lines.push("PHONE      " + phone);
    lines.push("EMAIL      " + (email || "(not provided)"));
    if (website) lines.push("WEBSITE    " + website);
    if (websiteScan) lines.push("WEBSITE SCAN  could not reach site (" + websiteScan + ")");
    lines.push("DIR MEMBER " + (hasDirPage === "yes" ? "Yes" : hasDirPage === "no" ? "No" : "(not provided)"));
    lines.push("");
    if (partial) {
      lines.push("OVERALL    PARTIAL CHECK: only " + partial + " sections scored. No overall score was shown to the customer.");
      if (overallScore !== null) lines.push("           (internal average of the scored sections: " + overallScore + " / 100)");
    } else {
      lines.push("OVERALL    " + (overallScore !== null ? (overallScore + " / 100") : "(not available)") + (overallGrade ? ("  (" + overallGrade + ")") : ""));
    }
    if (basis) lines.push("BASIS      " + basis);

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
