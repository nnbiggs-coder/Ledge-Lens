import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardStats } from "@/lib/submissions";
import type { Submission } from "@/types";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  submissions: Submission[];
}

const iconStyles = [
  "bg-blue-500/10 text-blue-700",
  "bg-emerald-500/10 text-emerald-700",
  "bg-amber-500/10 text-amber-700",
  "bg-violet-500/10 text-violet-700",
];

export function StatsCards({ submissions }: StatsCardsProps) {
  const stats = getDashboardStats(submissions);

  const cards = [
    {
      title: "Open Files",
      value: stats.total.toString(),
      description: `${stats.inReview} in review · ${stats.pendingInfo} awaiting info`,
      icon: ClipboardList,
      trend: "Stable volume",
    },
    {
      title: "Portfolio Readiness",
      value: `${stats.avgReadiness}%`,
      description: "Weighted composite across all dimensions",
      icon: Gauge,
      trend: stats.avgReadiness >= 70 ? "On track" : "Needs attention",
      highlight: stats.avgReadiness >= 70,
    },
    {
      title: "Open Contradictions",
      value: stats.openContradictions.toString(),
      description: "Document conflicts blocking clean quote",
      icon: AlertTriangle,
      trend: stats.openContradictions > 0 ? "Action required" : "Clear",
      alert: stats.openContradictions > 0,
    },
    {
      title: "Quoted & Pending Bind",
      value: stats.quoted.toString(),
      description: `${stats.declined} declined this period`,
      icon: CheckCircle2,
      trend: "Revenue opportunity",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <Card
          key={card.title}
          className="glass-card group transition-shadow hover:shadow-md"
        >
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <span
                className={cn(
                  "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  card.alert
                    ? "bg-destructive/10 text-destructive"
                    : card.highlight
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {card.trend}
              </span>
            </div>
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                iconStyles[index]
              )}
            >
              <card.icon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
              {card.value}
            </div>
            <CardDescription className="mt-2 leading-relaxed">
              {card.description}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
