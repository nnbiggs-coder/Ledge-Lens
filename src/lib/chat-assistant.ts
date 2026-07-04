import {
  formatCurrency,
  getDashboardStats,
  lineOfBusinessLabels,
  submissionStatusLabels,
} from "@/lib/submissions";
import type { Submission } from "@/types";

function summarizeSubmission(s: Submission): string {
  const openC = s.contradictions.filter((c) => c.status === "open").length;
  const missing = s.missingItems.filter((m) => m.status !== "received").length;

  let summary = `**${s.insuredName}** (${s.referenceNumber})\n`;
  summary += `• Status: ${submissionStatusLabels[s.status]}\n`;
  summary += `• Line: ${lineOfBusinessLabels[s.lineOfBusiness]}\n`;
  summary += `• Premium: ${formatCurrency(s.premiumEstimate)}\n`;
  summary += `• Underwriter: ${s.assignedUnderwriter}\n`;
  summary += `• Readiness: ${s.readiness.overall}% (completeness ${s.readiness.completeness}%, consistency ${s.readiness.consistency}%)\n`;
  summary += `• Open contradictions: ${openC} · Missing items: ${missing}`;

  if (s.contradictions.length > 0) {
    const top = s.contradictions.find((c) => c.status === "open");
    if (top) {
      summary += `\n\n⚠️ **Key issue:** ${top.fieldName} — ${top.explanation}`;
    }
  }

  if (s.notes) {
    summary += `\n\n📝 ${s.notes}`;
  }

  return summary;
}

export function generateAssistantResponse(
  input: string,
  submissions: Submission[]
): string {
  const q = input.trim().toLowerCase();
  const stats = getDashboardStats(submissions);

  if (!q) {
    return "Ask me about portfolio premium, submission status, contradictions, or a specific insured account.";
  }

  if (
    q.includes("hello") ||
    q.includes("hi") ||
    q.includes("help") ||
    q === "hey"
  ) {
    return `Hello! I'm **LedgeLens Assistant**, your underwriting co-pilot for this prototype portfolio.

I can help with:
• Portfolio & premium metrics
• Submission summaries & readiness scores
• Open contradictions & missing items
• Pipeline status breakdown

Try: *"What's our active pipeline premium?"* or *"Summarize Harbor Street Social"*`;
  }

  if (
    q.includes("pipeline") &&
    (q.includes("premium") || q.includes("exposure") || q.includes("total"))
  ) {
    return `**Active pipeline premium:** ${formatCurrency(stats.activePremium)}

• Total submissions: ${stats.total}
• Quoted premium: ${formatCurrency(stats.quotedPremium)} (${stats.quoted} accounts)
• Average deal size: ${formatCurrency(stats.avgDealSize)}
• Quote rate: ${stats.quoteRate}%

From a financial controller view, ${formatCurrency(stats.quotedPremium)} is quoted and awaiting bind confirmation.`;
  }

  if (q.includes("premium") && (q.includes("portfolio") || q.includes("total"))) {
    return `Total estimated premium across all files: **${formatCurrency(stats.totalPipelinePremium)}**.

Active (non-declined) exposure: **${formatCurrency(stats.activePremium)}**.`;
  }

  if (
    q.includes("contradiction") ||
    q.includes("conflict") ||
    q.includes("issue")
  ) {
    const withIssues = submissions.filter((s) =>
      s.contradictions.some((c) => c.status === "open")
    );

    if (withIssues.length === 0) {
      return "No open contradictions in the portfolio. All files are consistent.";
    }

    let response = `**${stats.openContradictions} open contradiction(s)** across ${withIssues.length} file(s):\n\n`;
    for (const s of withIssues) {
      for (const c of s.contradictions.filter((x) => x.status === "open")) {
        response += `• **${s.insuredName}** — ${c.fieldName}: ${c.explanation} (${c.severity})\n`;
      }
    }
    response +=
      "\nRecommend resolving before quote release to avoid E&O exposure.";
    return response;
  }

  if (
    q.includes("readiness") &&
    (q.includes("low") || q.includes("worst") || q.includes("lowest"))
  ) {
    const sorted = [...submissions].sort(
      (a, b) => a.readiness.overall - b.readiness.overall
    );
    const lowest = sorted[0];
    return `Lowest readiness: **${lowest.insuredName}** at **${lowest.readiness.overall}%**.

${summarizeSubmission(lowest)}

Consider holding quote until missing items are cleared.`;
  }

  if (q.includes("readiness") || q.includes("ready")) {
    return `Portfolio average readiness: **${stats.avgReadiness}%**.

Breakdown by file:
${submissions
  .map(
    (s) =>
      `• ${s.insuredName}: ${s.readiness.overall}% (${submissionStatusLabels[s.status]})`
  )
  .join("\n")}`;
  }

  if (q.includes("quoted") || q.includes("quote")) {
    const quoted = submissions.filter((s) => s.status === "quoted");
    if (quoted.length === 0) {
      return "No submissions are currently in quoted status.";
    }
    return `**${quoted.length} quoted submission(s)** totaling ${formatCurrency(stats.quotedPremium)}:\n\n${quoted
      .map(
        (s) =>
          `• ${s.insuredName} — ${formatCurrency(s.premiumEstimate)} · ${s.readiness.overall}% ready`
      )
      .join("\n")}`;
  }

  if (
    q.includes("declined") ||
    q.includes("decline") ||
    q.includes("reject")
  ) {
    const declined = submissions.filter((s) => s.status === "declined");
    if (declined.length === 0) return "No declined submissions in the portfolio.";
    const s = declined[0];
    return `**${declined.length} declined:**\n\n${summarizeSubmission(s)}`;
  }

  if (q.includes("in review") || q.includes("review")) {
    const inReview = submissions.filter((s) => s.status === "in_review");
    return `**${inReview.length} file(s) in review:**\n\n${inReview
      .map(
        (s) =>
          `• ${s.insuredName} — ${formatCurrency(s.premiumEstimate)} · ${s.readiness.overall}% ready`
      )
      .join("\n")}`;
  }

  if (q.includes("missing") || q.includes("document")) {
    const withMissing = submissions.filter((s) =>
      s.missingItems.some((m) => m.status !== "received")
    );
    let response = `**Pending documents** across ${withMissing.length} file(s):\n\n`;
    for (const s of withMissing) {
      for (const m of s.missingItems.filter((x) => x.status !== "received")) {
        response += `• **${s.insuredName}** — ${m.fieldName}: ${m.reasonRequired} (${m.severity})\n`;
      }
    }
    return response;
  }

  if (q.includes("summarize") || q.includes("summary") || q.includes("tell me about")) {
    const names = [
      "harbor street",
      "harbor",
      "clean office",
      "contractor",
      "nightlife",
      "low confidence",
    ];
    for (const name of names) {
      if (q.includes(name)) {
        const s = submissions.find((sub) =>
          sub.insuredName.toLowerCase().includes(name)
        );
        if (s) return summarizeSubmission(s);
      }
    }
  }

  for (const s of submissions) {
    const firstWord = s.insuredName.split(" ")[0].toLowerCase();
    if (
      q.includes(firstWord) ||
      q.includes(s.referenceNumber.toLowerCase()) ||
      q.includes(s.insuredName.toLowerCase())
    ) {
      return summarizeSubmission(s);
    }
  }

  if (q.includes("how many") || q.includes("count")) {
    return `Portfolio snapshot:
• ${stats.total} total submissions
• ${stats.inReview} in review
• ${stats.pendingInfo} pending info
• ${stats.quoted} quoted
• ${stats.declined} declined
• ${stats.openContradictions} open contradictions`;
  }

  return `I couldn't find a specific match for that question. Try asking about:

• Pipeline premium or quote rate
• A specific insured (e.g. "Harbor Street Social")
• Open contradictions or missing documents
• Readiness scores or quoted submissions

*Note: This is a prototype assistant using fictional seeded data — not live AI.*`;
}
