"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { formatCurrency, getPremiumByLineOfBusiness } from "@/lib/submissions";
import type { Submission } from "@/types";

const COLORS = [
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-1)",
  "var(--chart-4)",
  "var(--chart-5)",
];

interface PremiumChartProps {
  submissions: Submission[];
}

export function PremiumChart({ submissions }: PremiumChartProps) {
  const data = getPremiumByLineOfBusiness(submissions);

  return (
    <Card className="glass-card col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Premium by Line of Business</CardTitle>
        <CardDescription>
          Estimated premium distribution across the active portfolio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full sm:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                className="stroke-border/60"
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="shortLine"
                width={90}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-lg">
                      <p className="font-medium">{item.line}</p>
                      <p className="mt-1 font-mono tabular-nums text-primary">
                        {formatCurrency(item.premium)}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="premium" radius={[0, 6, 6, 0]} barSize={22}>
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
