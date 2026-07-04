import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function getReadinessTone(score: number): string {
  if (score >= 80)
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (score >= 60) return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-red-200 bg-red-50 text-red-800";
}

export function ReadinessBadge({ score }: { score: number }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-xs font-semibold tabular-nums",
        getReadinessTone(score)
      )}
    >
      {score}%
    </Badge>
  );
}
