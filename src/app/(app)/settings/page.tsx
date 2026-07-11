"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { getGovernance, getUseCases } from "@/lib/agent-api";

export default function SettingsPage() {
  const [gov, setGov] = useState<Record<string, unknown> | null>(null);
  const [useCases, setUseCases] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getGovernance(), getUseCases()])
      .then(([g, u]) => {
        setGov(g);
        setUseCases(u);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load governance"));
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Vendor governance"
        description="Model provider, retention, and approved use cases. Prototype does not claim legal compliance."
      />
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {gov && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Configuration</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            {Object.entries(gov)
              .filter(([k]) => k !== "fairness_test_placeholder")
              .map(([k, v]) => (
                <div key={k} className="border-b border-border pb-2">
                  <dt className="text-xs uppercase text-muted-foreground">{k.replaceAll("_", " ")}</dt>
                  <dd className="text-sm">{Array.isArray(v) ? v.join(", ") : String(v)}</dd>
                </div>
              ))}
          </dl>
          <div className="text-sm">
            <div className="font-medium">Fairness test placeholder</div>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-xs">
              {JSON.stringify(gov.fairness_test_placeholder, null, 2)}
            </pre>
          </div>
        </section>
      )}
      {useCases && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Use-case classification</h2>
          <p className="text-sm">
            Classification: <strong>{String(useCases.classification)}</strong> — supports underwriting
            decisions.
          </p>
          <p className="text-sm text-muted-foreground">{String(useCases.banner)}</p>
          <ul className="list-disc pl-5 text-sm">
            {((useCases.key_messages as string[]) || []).map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
