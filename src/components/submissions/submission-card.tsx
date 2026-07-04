import { Badge } from "@/components/ui/badge";
import { SubmissionStatusBadge } from "@/components/submissions/submission-status-badge";
import { ReadinessBadge } from "@/components/submissions/readiness-badge";
import {
  formatCurrency,
  formatDate,
  lineOfBusinessLabels,
} from "@/lib/submissions";
import type { Submission } from "@/types";
import { AlertCircle, FileWarning } from "lucide-react";

interface SubmissionCardProps {
  submission: Submission;
}

export function SubmissionCard({ submission }: SubmissionCardProps) {
  const openContradictions = submission.contradictions.filter(
    (c) => c.status === "open"
  ).length;
  const pendingMissing = submission.missingItems.filter(
    (m) => m.status !== "received"
  ).length;

  return (
    <article className="rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{submission.insuredName}</p>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {submission.referenceNumber}
          </p>
        </div>
        <SubmissionStatusBadge status={submission.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Premium</p>
          <p className="font-semibold tabular-nums">
            {formatCurrency(submission.premiumEstimate)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Readiness</p>
          <div className="mt-1">
            <ReadinessBadge score={submission.readiness.overall} />
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Line</p>
          <p className="truncate text-sm">
            {lineOfBusinessLabels[submission.lineOfBusiness]}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Underwriter</p>
          <p className="truncate text-sm">{submission.assignedUnderwriter}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
        <p className="mr-auto text-xs text-muted-foreground">
          {submission.brokerName} · {formatDate(submission.submittedAt)}
        </p>
        {openContradictions > 0 ? (
          <Badge variant="destructive" className="gap-1 font-normal">
            <AlertCircle className="size-3" />
            {openContradictions} conflict{openContradictions !== 1 ? "s" : ""}
          </Badge>
        ) : null}
        {pendingMissing > 0 ? (
          <Badge variant="secondary" className="gap-1 font-normal">
            <FileWarning className="size-3" />
            {pendingMissing} missing
          </Badge>
        ) : null}
      </div>
    </article>
  );
}
