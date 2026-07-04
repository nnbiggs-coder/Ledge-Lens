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

  return {
    total: submissions.length,
    inReview,
    pendingInfo,
    quoted,
    openContradictions: countOpenContradictions(submissions),
    avgReadiness: averageReadiness(submissions),
  };
}
