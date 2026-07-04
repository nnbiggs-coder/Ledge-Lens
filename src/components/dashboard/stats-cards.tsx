import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardStats } from "@/lib/submissions";
import type { Submission } from "@/types";
import { AlertTriangle, ClipboardList, FileSearch, Gauge } from "lucide-react";

interface StatsCardsProps {
  submissions: Submission[];
}

export function StatsCards({ submissions }: StatsCardsProps) {
  const stats = getDashboardStats(submissions);

  const cards = [
    {
      title: "Active Submissions",
      value: stats.total.toString(),
      description: `${stats.inReview} in review · ${stats.pendingInfo} pending info`,
      icon: ClipboardList,
    },
    {
      title: "Avg. Readiness",
      value: `${stats.avgReadiness}%`,
      description: "Composite score across all open files",
      icon: Gauge,
    },
    {
      title: "Open Contradictions",
      value: stats.openContradictions.toString(),
      description: "Cross-document conflicts requiring resolution",
      icon: AlertTriangle,
    },
    {
      title: "Quoted",
      value: stats.quoted.toString(),
      description: "Awaiting broker bind confirmation",
      icon: FileSearch,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{card.value}</div>
            <CardDescription className="mt-1">{card.description}</CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
