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
    <Card>
      <CardHeader>
        <CardTitle>Status Distribution</CardTitle>
        <CardDescription>Current pipeline breakdown by submission status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status]}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0];
                  return (
                    <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-md">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-muted-foreground">
                        {item.value} submission{item.value !== 1 ? "s" : ""}
                      </p>
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
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
