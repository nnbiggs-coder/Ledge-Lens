"use client";

import { PageHeader } from "@/components/layout/page-header";
import { SubmissionInbox } from "@/components/submissions/submission-inbox";
import { useDemo } from "@/context/demo-provider";
import { getDashboardStats, formatCurrency } from "@/lib/submissions";

export function SubmissionsPageContent() {
  const { state } = useDemo();
  const stats = getDashboardStats(state.submissions);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Submission Inbox"
        description="Review, search, and triage incoming commercial underwriting files by status and financial exposure."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-card px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total files
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pipeline premium
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {formatCurrency(stats.activePremium)}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Avg. readiness
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {stats.avgReadiness}%
          </p>
        </div>
      </div>
      <SubmissionInbox submissions={state.submissions} />
    </div>
  );
}
