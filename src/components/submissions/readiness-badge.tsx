import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function getReadinessTone(score: number): string {
  if (score >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (score >= 60) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}

export function ReadinessBadge({ score }: { score: number }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-mono tabular-nums", getReadinessTone(score))}
    >
      {score}%
    </Badge>
  );
}
