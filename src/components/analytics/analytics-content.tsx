"use client";

import { PageHeader } from "@/components/layout/page-header";
import { useDemo } from "@/context/demo-provider";
import { formatRatio } from "@/lib/normalize";
import { formatCurrency } from "@/lib/submissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function AnalyticsContent() {
  const { state } = useDemo();
  const { submissions } = state;

  const avgReadiness =
    submissions.length > 0
      ? Math.round(
          submissions.reduce((s, sub) => s + sub.readiness.overall, 0) /
            submissions.length
        )
      : 0;

  const avgMissing =
    submissions.length > 0
      ? (
          submissions.reduce(
            (s, sub) =>
              s +
              sub.missingItems.filter((m) => m.status !== "received").length,
            0
          ) / submissions.length
        ).toFixed(1)
      : "0";

  const avgContradictions =
    submissions.length > 0
      ? (
          submissions.reduce(
            (s, sub) =>
              s + sub.contradictions.filter((c) => c.status === "open").length,
            0
          ) / submissions.length
        ).toFixed(1)
      : "0";

  const missingFieldCounts = new Map<string, number>();
  for (const sub of submissions) {
    for (const m of sub.missingItems) {
      missingFieldCounts.set(
        m.fieldName,
        (missingFieldCounts.get(m.fieldName) ?? 0) + 1
      );
    }
  }
  const topMissing = [...missingFieldCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([field, count]) => ({ field, count }));

  const referralReasons = new Map<string, number>();
  for (const sub of submissions) {
    for (const ev of sub.ruleEvaluations) {
      if (ev.result === "refer" || ev.result === "fail") {
        referralReasons.set(
          ev.explanation.slice(0, 60),
          (referralReasons.get(ev.explanation.slice(0, 60)) ?? 0) + 1
        );
      }
    }
  }
  const topReferrals = [...referralReasons.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const manualReviewPct = Math.round(
    (submissions.filter(
      (s) =>
        s.readiness.overall < 70 ||
        s.pricing.pricingStatus !== "quote_ready"
    ).length /
      Math.max(submissions.length, 1)) *
      100
  );

  const brokerReadiness = new Map<string, { total: number; count: number }>();
  for (const sub of submissions) {
    const entry = brokerReadiness.get(sub.brokerFirm) ?? { total: 0, count: 0 };
    entry.total += sub.readiness.overall;
    entry.count += 1;
    brokerReadiness.set(sub.brokerFirm, entry);
  }
  const readinessByBroker = [...brokerReadiness.entries()].map(
    ([broker, { total, count }]) => ({
      broker: broker.length > 20 ? broker.slice(0, 18) + "…" : broker,
      readiness: Math.round(total / count),
    })
  );

  const avgTechnical =
    submissions.length > 0
      ? Math.round(
          submissions.reduce(
            (s, sub) => s + sub.pricing.blendedTechnicalPremium,
            0
          ) / submissions.length
        )
      : 0;

  const avgSelected =
    submissions.length > 0
      ? Math.round(
          submissions.reduce((s, sub) => s + sub.pricing.selectedPremium, 0) /
            submissions.length
        )
      : 0;

  const avgVariance =
    avgTechnical > 0
      ? (((avgSelected - avgTechnical) / avgTechnical) * 100).toFixed(1)
      : "0";

  const avgCombined =
    submissions.length > 0
      ? submissions.reduce(
          (s, sub) => s + sub.pricing.expectedCombinedRatio,
          0
        ) / submissions.length
      : 0;

  const belowTargetPct = Math.round(
    (submissions.filter((s) => s.pricing.selectedPremium < s.pricing.targetPremium)
      .length /
      Math.max(submissions.length, 1)) *
      100
  );

  const auditEvents = state.auditLog;
  const humanEvents = auditEvents.filter((e) => e.sourceType === "human").length;
  const overrideRate =
    auditEvents.length > 0
      ? Math.round((humanEvents / auditEvents.length) * 100)
      : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Analytics"
        description="Synthetic portfolio analytics for underwriting performance and pipeline health."
      >
        <Badge variant="outline">Synthetic demo data</Badge>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Avg. readiness" value={`${avgReadiness}%`} />
        <MetricCard label="Avg. missing items" value={String(avgMissing)} />
        <MetricCard label="Avg. contradictions" value={String(avgContradictions)} />
        <MetricCard label="Manual review required" value={`${manualReviewPct}%`} />
        <MetricCard label="Avg. technical premium" value={formatCurrency(avgTechnical)} />
        <MetricCard label="Avg. selected premium" value={formatCurrency(avgSelected)} />
        <MetricCard label="Quote-to-technical variance" value={`${avgVariance}%`} />
        <MetricCard label="Avg. combined ratio" value={formatRatio(avgCombined)} />
        <MetricCard label="Quotes below target" value={`${belowTargetPct}%`} />
        <MetricCard label="Override rate" value={`${overrideRate}%`} />
        <MetricCard label="AI acceptance (demo)" value="72%" />
        <MetricCard label="Avg. processing time" value="2.4 days" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Readiness by broker</CardTitle>
            <CardDescription>Synthetic demo — average readiness score</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={readinessByBroker}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="broker" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="readiness" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Most common missing fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {topMissing.length === 0 ? (
              <p className="text-muted-foreground">No missing fields recorded.</p>
            ) : (
              topMissing.map((m) => (
                <div key={m.field} className="flex justify-between border-b border-border/40 py-1">
                  <span>{m.field}</span>
                  <Badge variant="secondary">{m.count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Most common referral reasons</CardTitle>
          <CardDescription>From deterministic appetite rule evaluations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {topReferrals.map(([reason, count]) => (
            <div key={reason} className="flex justify-between gap-4 border-b border-border/40 py-2">
              <span className="text-muted-foreground">{reason}…</span>
              <Badge variant="outline">{count}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
