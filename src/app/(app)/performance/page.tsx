"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { getMetrics } from "@/lib/agent-api";

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMetrics()
      .then(setMetrics)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load metrics"));
  }, []);

  const rows = metrics
    ? Object.entries(metrics).filter(([k]) => k !== "banner")
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent performance"
        description="Faster intake is useful. Better portfolio decisions create lasting advantage."
      />
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          {error}
        </div>
      )}
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(([key, value]) => (
          <div key={key} className="border-b border-border pb-3">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {key.replaceAll("_", " ")}
            </dt>
            <dd className="mt-1 text-lg font-semibold">
              {value == null ? "—" : typeof value === "number" ? Number(value).toFixed(3) : String(value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
