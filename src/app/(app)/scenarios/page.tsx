"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { createFromScenario, listScenarios, runSubmission } from "@/lib/agent-api";

type Scenario = {
  scenario_id: string;
  title: string;
  description: string;
  expected_action: string;
};

export default function ScenariosPage() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listScenarios()
      .then(setScenarios)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load scenarios"));
  }, []);

  async function start(scenarioId: string) {
    setBusy(scenarioId);
    setError(null);
    try {
      const created = await createFromScenario(scenarioId);
      const ran = await runSubmission(created.submission_id);
      router.push(`/agent/${ran.state.submission_id as string}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start scenario");
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demo Scenarios"
        description="Five-minute guided demonstration. The agent prepares the work; it does not own the risk."
      />
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          {error}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {scenarios.map((s, idx) => (
          <div key={s.scenario_id} className="space-y-3 border-b border-border pb-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Scenario {idx + 1}
            </div>
            <h2 className="text-lg font-semibold">{s.title}</h2>
            <p className="text-sm text-muted-foreground">{s.description}</p>
            <p className="text-sm">
              Expected: <span className="font-medium">{s.expected_action}</span>
            </p>
            <Button disabled={busy === s.scenario_id} onClick={() => void start(s.scenario_id)}>
              {busy === s.scenario_id ? "Running agent…" : "Start agent"}
            </Button>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Or return to the <Link href="/" className="underline">agent queue</Link>.
      </p>
    </div>
  );
}
