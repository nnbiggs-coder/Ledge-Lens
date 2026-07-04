import type { LineOfBusiness, Submission, SubmissionStatus } from "@/types";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

export function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export const lineOfBusinessLabels: Record<LineOfBusiness, string> = {
  general_liability: "General Liability",
  commercial_property: "Commercial Property",
  workers_comp: "Workers' Comp",
  professional_liability: "Professional Liability",
  excess_casualty: "Excess Casualty",
};

export const submissionStatusLabels: Record<SubmissionStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  pending_info: "Pending Info",
  quoted: "Quoted",
  declined: "Declined",
  bound: "Bound",
};

export function searchSubmissions(
  items: Submission[],
  query: string
): Submission[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;

  return items.filter((submission) => {
    const haystack = [
      submission.referenceNumber,
      submission.insuredName,
      submission.brokerName,
      submission.brokerFirm,
      submission.assignedUnderwriter,
      lineOfBusinessLabels[submission.lineOfBusiness],
      submissionStatusLabels[submission.status],
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}

export function countOpenContradictions(submissions: Submission[]): number {
  return submissions.reduce(
    (total, submission) =>
      total +
      submission.contradictions.filter((c) => c.status === "open").length,
    0
  );
}

export function averageReadiness(submissions: Submission[]): number {
  if (submissions.length === 0) return 0;
  const sum = submissions.reduce((acc, s) => acc + s.readiness.overall, 0);
  return Math.round(sum / submissions.length);
}

export function getDashboardStats(submissions: Submission[]) {
  const inReview = submissions.filter((s) => s.status === "in_review").length;
  const pendingInfo = submissions.filter(
    (s) => s.status === "pending_info"
  ).length;
  const quoted = submissions.filter((s) => s.status === "quoted").length;
  const declined = submissions.filter((s) => s.status === "declined").length;

  const totalPipelinePremium = submissions.reduce(
    (sum, s) => sum + s.premiumEstimate,
    0
  );
  const quotedPremium = submissions
    .filter((s) => s.status === "quoted")
    .reduce((sum, s) => sum + s.premiumEstimate, 0);
  const activePremium = submissions
    .filter((s) => !["declined", "bound"].includes(s.status))
    .reduce((sum, s) => sum + s.premiumEstimate, 0);
  const avgDealSize =
    submissions.length > 0
      ? Math.round(totalPipelinePremium / submissions.length)
      : 0;
  const quoteRate =
    submissions.length > 0
      ? Math.round((quoted / submissions.length) * 100)
      : 0;

  return {
    total: submissions.length,
    inReview,
    pendingInfo,
    quoted,
    declined,
    openContradictions: countOpenContradictions(submissions),
    avgReadiness: averageReadiness(submissions),
    totalPipelinePremium,
    quotedPremium,
    activePremium,
    avgDealSize,
    quoteRate,
  };
}

export function getPremiumByLineOfBusiness(submissions: Submission[]) {
  const totals = new Map<LineOfBusiness, number>();

  for (const submission of submissions) {
    const current = totals.get(submission.lineOfBusiness) ?? 0;
    totals.set(
      submission.lineOfBusiness,
      current + submission.premiumEstimate
    );
  }

  return Array.from(totals.entries()).map(([lob, premium]) => ({
    line: lineOfBusinessLabels[lob],
    premium,
    shortLine: lineOfBusinessLabels[lob].replace("Commercial ", "C. "),
  }));
}

export interface ExecutiveHeadline {
  statement: string;
  detail: string;
  tone: "positive" | "caution" | "neutral";
}

export function getExecutiveHeadline(
  submissions: Submission[]
): ExecutiveHeadline {
  const stats = getDashboardStats(submissions);

  if (stats.openContradictions > 0 && stats.avgReadiness < 70) {
    return {
      statement: `${stats.openContradictions} open contradictions are holding back a ${stats.avgReadiness}% readiness portfolio.`,
      detail: `Prioritize document reconciliation across ${formatCurrency(stats.activePremium)} in active premium before releasing additional quotes.`,
      tone: "caution",
    };
  }

  if (stats.openContradictions > 0) {
    return {
      statement: `Resolve ${stats.openContradictions} cross-document contradiction${stats.openContradictions !== 1 ? "s" : ""} to de-risk the pipeline.`,
      detail: `${stats.inReview + stats.pendingInfo} files remain in review or pending info across ${formatCurrency(stats.activePremium)} of active premium.`,
      tone: "caution",
    };
  }

  if (stats.quoted > 0 && stats.quotedPremium > 0) {
    return {
      statement: `${formatCurrency(stats.quotedPremium)} is quoted and ready for bind consideration.`,
      detail: `Portfolio readiness averages ${stats.avgReadiness}% with ${stats.quoteRate}% quote conversion across ${stats.total} submissions.`,
      tone: "positive",
    };
  }

  if (stats.pendingInfo > 0) {
    return {
      statement: `${stats.pendingInfo} submission${stats.pendingInfo !== 1 ? "s" : ""} awaiting broker documentation.`,
      detail: `Closing outstanding items could unlock progress on ${formatCurrency(stats.activePremium)} of in-flight premium.`,
      tone: "neutral",
    };
  }

  return {
    statement: `Portfolio is tracking at ${stats.avgReadiness}% average readiness across ${formatCurrency(stats.activePremium)} in active premium.`,
    detail: `${stats.inReview} files in underwriting review · ${stats.quoted} quoted · ${stats.declined} declined this period.`,
    tone: "neutral",
  };
}
