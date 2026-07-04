import type { Contradiction, MissingItem, Submission } from "@/types";

function groupByCategory<T extends { category: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }
  return map;
}

export function generateBrokerEmail(submission: Submission): string {
  const openMissing = submission.missingItems.filter(
    (m) => m.status === "open" || m.status === "requested"
  );
  const openContradictions = submission.contradictions.filter(
    (c) => c.status === "open"
  );
  const referralRules = submission.ruleEvaluations.filter(
    (r) => r.result === "refer" || r.result === "fail"
  );
  const pricingBlockers = submission.pricing.blockers;
  const lowConfidence = submission.extractedFields.filter(
    (f) => f.confidence < 70 && f.verificationStatus === "unreviewed"
  );

  const lines: string[] = [];

  lines.push(`Subject: Information Request — ${submission.insuredName} (${submission.referenceNumber})`);
  lines.push("");
  lines.push(`Dear ${submission.brokerName},`);
  lines.push("");
  lines.push(
    `Thank you for submitting ${submission.insuredName} for our review. We are evaluating the account for ${submission.effectiveDate.slice(0, 4)} coverage and need additional clarification on several items before we can proceed.`
  );
  lines.push("");

  if (openContradictions.length > 0) {
    lines.push("DOCUMENT CLARIFICATIONS");
    lines.push("");
    for (const c of sortBySeverity(openContradictions)) {
      lines.push(`• ${contradictionQuestion(c)}`);
    }
    lines.push("");
  }

  if (openMissing.length > 0) {
    lines.push("MISSING INFORMATION");
    lines.push("");
    const grouped = groupByCategory(openMissing);
    for (const [, items] of grouped) {
      for (const m of sortMissingBySeverity(items)) {
        lines.push(`• ${m.brokerQuestion}`);
      }
    }
    lines.push("");
  }

  if (referralRules.length > 0) {
    lines.push("UNDERWRITING CLARIFICATIONS");
    lines.push("");
    for (const rule of referralRules.slice(0, 5)) {
      lines.push(`• ${appetiteQuestion(rule.explanation)}`);
    }
    lines.push("");
  }

  if (pricingBlockers.length > 0) {
    lines.push("PRICING / EXPOSURE ITEMS");
    lines.push("");
    for (const blocker of pricingBlockers.slice(0, 4)) {
      lines.push(`• ${sanitizeBlocker(blocker)}`);
    }
    lines.push("");
  }

  if (lowConfidence.length > 0) {
    lines.push("CONFIRMATION REQUESTED");
    lines.push("");
    for (const field of lowConfidence.slice(0, 3)) {
      lines.push(
        `• Please confirm ${humanizeField(field.fieldName)} as ${String(field.normalizedValue ?? "shown in submission")} and note the supporting source document.`
      );
    }
    lines.push("");
  }

  if (
    openMissing.length === 0 &&
    openContradictions.length === 0 &&
    referralRules.length === 0
  ) {
    lines.push(
      "We have no outstanding critical items at this time. Please let us know if there are any updates to the submission."
    );
    lines.push("");
  }

  lines.push(
    "Please reply with the requested information and any supporting documents at your earliest convenience. We appreciate your partnership."
  );
  lines.push("");
  lines.push("Regards,");
  lines.push(submission.assignedUnderwriter);
  lines.push("LedgeLens Underwriting (Synthetic Demo)");

  return lines.join("\n");
}

function contradictionQuestion(c: Contradiction): string {
  const templates: Record<string, string> = {
    annualRevenue:
      "We noted different annual revenue figures across the submitted materials. Please confirm the current annual revenue and provide the supporting source used for the final figure.",
    alcoholSalesPct:
      "The alcohol sales percentage varies between documents. Please confirm the current alcohol sales as a percentage of total revenue.",
    closingTime:
      "Operating hours differ between the application and other sources. Please confirm the latest closing time for the premises.",
    liveEntertainment:
      "Submitted materials indicate different information regarding live entertainment. Please confirm whether live entertainment is provided and describe the frequency.",
    openClaims:
      "Claims information differs between the application and loss runs. Please confirm the current open claim count and status.",
    numberOfLocations:
      "The number of locations differs between documents. Please provide a complete location schedule confirming all operating locations.",
  };

  return (
    templates[c.fieldName] ??
    `We noted conflicting information for ${humanizeField(c.fieldName)} (${c.normalizedValueA} vs. ${c.normalizedValueB}). Please confirm the correct value and supporting source.`
  );
}

function appetiteQuestion(explanation: string): string {
  return explanation.replace(
    /Potentially outside appetite[^.]*\.\s*/i,
    ""
  ).replace(/require(s)? referral/i, "requires clarification");
}

function sanitizeBlocker(blocker: string): string {
  return blocker
    .replace(/Potentially outside appetite[^.]*\./gi, "")
    .replace(/senior referral/gi, "additional review")
    .trim();
}

function humanizeField(field: string): string {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function severityRank(severity: string): number {
  return { critical: 0, high: 1, medium: 2, low: 3 }[severity] ?? 4;
}

function sortBySeverity<T extends { severity: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => severityRank(a.severity) - severityRank(b.severity)
  );
}

function sortMissingBySeverity(items: MissingItem[]): MissingItem[] {
  return sortBySeverity(items);
}
