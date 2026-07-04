import { Badge } from "@/components/ui/badge";
import type { SubmissionStatus } from "@/types";
import { submissionStatusLabels } from "@/lib/submissions";

const statusVariant: Record<
  SubmissionStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "outline",
  in_review: "default",
  pending_info: "secondary",
  quoted: "secondary",
  declined: "destructive",
  bound: "default",
};

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <Badge variant={statusVariant[status]}>{submissionStatusLabels[status]}</Badge>
  );
}
