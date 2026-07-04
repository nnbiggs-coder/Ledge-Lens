"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { lineOfBusinessLabels } from "@/lib/submissions";
import type { Submission } from "@/types";

interface ReadinessChartProps {
  submissions: Submission[];
}

export function ReadinessChart({ submissions }: ReadinessChartProps) {
  const data = submissions.map((s) => ({
    name: s.referenceNumber.replace("LL-2026-", ""),
    readiness: s.readiness.overall,
    insured: s.insuredName.split(" ")[0],
    lob: lineOfBusinessLabels[s.lineOfBusiness],
  }));

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Readiness by Submission</CardTitle>
        <CardDescription>
          Overall readiness scores across the active submission portfolio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-md">
                      <p className="font-medium">{item.insured}</p>
                      <p className="text-muted-foreground">{item.lob}</p>
                      <p className="mt-1 font-mono tabular-nums">
                        Readiness: {item.readiness}%
                      </p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="readiness"
                fill="var(--chart-2)"
                radius={[4, 4, 0, 0]}
                name="Readiness"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
