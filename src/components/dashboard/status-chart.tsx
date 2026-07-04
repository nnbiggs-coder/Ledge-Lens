"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { submissionStatusLabels } from "@/lib/submissions";
import type { Submission, SubmissionStatus } from "@/types";

const STATUS_COLORS: Record<SubmissionStatus, string> = {
  draft: "var(--chart-5)",
  in_review: "var(--chart-2)",
  pending_info: "var(--chart-4)",
  quoted: "var(--chart-1)",
  declined: "var(--destructive)",
  bound: "var(--chart-3)",
};

interface StatusChartProps {
  submissions: Submission[];
}

export function StatusChart({ submissions }: StatusChartProps) {
  const counts = submissions.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(counts).map(([status, count]) => ({
    name: submissionStatusLabels[status as SubmissionStatus],
    value: count,
    status: status as SubmissionStatus,
  }));

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Pipeline Status</CardTitle>
        <CardDescription>Current distribution by underwriting stage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[240px] w-full sm:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0];
                  return (
                    <div className="rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-lg">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-muted-foreground">
                        {item.value} file{item.value !== 1 ? "s" : ""}
                      </p>
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={40}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
