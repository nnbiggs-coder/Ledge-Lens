"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  approveSubmission,
  getSubmission,
  recordOutcome,
  runSubmission,
  type AgentState,
} from "@/lib/agent-api";

export default function AgentRunPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [state, setState] = useState<AgentState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [finalAction, setFinalAction] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await getSubmission(id);
      setState(data.state);
      setFinalAction(String(data.state.recommended_action || ""));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [id]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 4000);
    return () => clearInterval(timer);
  }, [refresh]);

  const timeline = useMemo(() => {
    const events = (state?.timeline as { timestamp?: string; message?: string }[]) || [];
    return events;
  }, [state]);

  async function onRun() {
    setBusy(true);
    try {
      const data = await runSubmission(id);
      setState(data.state);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDecision(decision: string) {
    setBusy(true);
    try {
      const data = await approveSubmission(id, {
        user: "uw.demo",
        decision,
        final_action: finalAction || undefined,
        override_reason: decision === "override" ? overrideReason : undefined,
      });
      setState(data.state);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Decision failed");
    } finally {
      setBusy(false);
    }
  }

  async function onOutcome() {
    setBusy(true);
    try {
      const data = await recordOutcome(id, {
        status: "bound",
        premium: 58000,
        time_to_quote_hours: 6,
        underwriter_effort_hours: 1.5,
        claim_count: 0,
        incurred_losses: 0,
        loss_ratio: 0.12,
        renewal_status: "renewed",
        notes: "Demo outcome recorded for learning.",
      });
      setState(data.state);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Outcome failed");
    } finally {
      setBusy(false);
    }
  }

  if (!state && !error) {
    return <div className="text-sm text-muted-foreground">Loading agent run…</div>;
  }

  const fields = (state?.extracted_fields as Record<string, unknown>) || {};
  const sources = (state?.field_sources as Record<string, string[]>) || {};
  const confidence = (state?.field_confidence as Record<string, number>) || {};
  const plan = state?.current_plan as { goal?: string; steps?: { step: number; tool: string; reason: string }[] } | undefined;
  const appetite = state?.appetite_result as Record<string, unknown> | undefined;
  const guidelines = (state?.guideline_results as Record<string, unknown>[]) || [];
  const priority = state?.priority_breakdown as { explanation?: string; total_score?: number } | undefined;
  const execution = state?.execution_results as Record<string, unknown> | undefined;
  const drafts = (state?.drafted_communications as { draft?: { subject?: string; body?: string } }[]) || [];
  const insights = (state?.learning_insights as { message?: string }[]) || [];
  const toolCalls = (state?.completed_tool_calls as { tool?: string }[]) || [];

  return (
    <div className="space-y-8">
      <PageHeader
        title={String(fields.insured_name || state?.submission_id || "Agent run")}
        description={`${String(state?.detected_product || "—")} · Stage: ${String(state?.current_stage)} · ${String(state?.submission_id)}`}
      >
        <Button variant="outline" disabled={busy} onClick={() => void onRun()}>
          Re-run agent
        </Button>
      </PageHeader>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Recommendation</h2>
        <p className="text-sm leading-relaxed">{String(state?.recommendation_reason || "—")}</p>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span>Action: {String(state?.recommended_action || "—")}</span>
          <span>Confidence: {Number(state?.recommendation_confidence || 0).toFixed(2)}</span>
          <span>Risk: {String(state?.risk_level)}</span>
          <span>Priority: {priority?.total_score ?? "—"}/100</span>
        </div>
      </section>

      {Boolean(state?.awaiting_human) && (
        <section className="space-y-3 border border-border p-4">
          <h2 className="text-lg font-semibold">Human approval</h2>
          <p className="text-sm text-muted-foreground">
            Every material action has an accountable human. Approve, override, investigate further, or stop.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              placeholder="Final action (optional override target)"
              value={finalAction}
              onChange={(e) => setFinalAction(e.target.value)}
            />
            <Input
              placeholder="Override reason (required for override)"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => void onDecision("approve")}>
              Approve
            </Button>
            <Button
              disabled={busy || !overrideReason}
              variant="secondary"
              onClick={() => void onDecision("override")}
            >
              Override
            </Button>
            <Button disabled={busy} variant="outline" onClick={() => void onDecision("investigate")}>
              Investigate further
            </Button>
            <Button disabled={busy} variant="destructive" onClick={() => void onDecision("stop")}>
              Stop
            </Button>
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Execution timeline</h2>
          <ol className="space-y-2 text-sm">
            {timeline.map((t, i) => (
              <li key={`${t.timestamp}-${i}`} className="flex gap-3">
                <span className="w-36 shrink-0 font-mono text-xs text-muted-foreground">
                  {t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : "—"}
                </span>
                <span>{t.message}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Agent plan</h2>
          <p className="text-sm text-muted-foreground">{plan?.goal}</p>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {(plan?.steps || []).map((s) => (
              <li key={s.step}>
                <span className="font-medium">{s.tool}</span> — {s.reason}
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted-foreground">
            Tools called: {toolCalls.map((t) => t.tool).filter(Boolean).join(", ") || "none"}
          </p>
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Structured data (every extracted fact has a source)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-3">Field</th>
                <th className="py-2 pr-3">Value</th>
                <th className="py-2 pr-3">Confidence</th>
                <th className="py-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(fields).map((key) => (
                <tr key={key} className="border-b border-border/60">
                  <td className="py-2 pr-3 font-medium">{key}</td>
                  <td className="py-2 pr-3">{String(fields[key])}</td>
                  <td className="py-2 pr-3">{confidence[key]?.toFixed?.(2) ?? "—"}</td>
                  <td className="py-2 text-muted-foreground">
                    {(sources[key] || []).join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Appetite (rules vs AI observations)</h2>
          <p className="text-sm">Decision: {String(appetite?.decision || "—")}</p>
          <p className="text-sm text-muted-foreground">{String(appetite?.rationale || "")}</p>
          <div className="text-sm">
            <div className="font-medium">Hard rules</div>
            <ul className="list-disc pl-5">
              {((appetite?.hard_rules as { detail?: string }[]) || []).map((r, i) => (
                <li key={i}>{r.detail}</li>
              ))}
              {!((appetite?.hard_rules as unknown[]) || []).length && <li>None</li>}
            </ul>
          </div>
          <div className="text-sm">
            <div className="font-medium">AI observations</div>
            <ul className="list-disc pl-5">
              {((appetite?.ai_observations as { detail?: string }[]) || []).map((r, i) => (
                <li key={i}>{r.detail}</li>
              ))}
              {!((appetite?.ai_observations as unknown[]) || []).length && <li>None</li>}
            </ul>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Priority score</h2>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-muted/40 p-3 font-mono text-xs">
            {priority?.explanation || "—"}
          </pre>
        </section>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Guideline citations</h2>
        <ul className="space-y-3 text-sm">
          {guidelines.map((g, i) => (
            <li key={i} className="border-b border-border/60 pb-2">
              <div className="font-medium">{String(g.question || "Question")}</div>
              {g.abstained ? (
                <div className="text-muted-foreground">Abstained — {String(g.abstention_reason)}</div>
              ) : (
                <>
                  <div>{String(g.answer)}</div>
                  <div className="text-xs text-muted-foreground">
                    Citations:{" "}
                    {((g.citations as { document?: string; section?: string; page?: number }[]) || [])
                      .map((c) => `${c.document} §${c.section} p.${c.page}`)
                      .join("; ")}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      {(execution || drafts.length > 0) && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Executed actions (simulated)</h2>
          {execution?.socotra ? (
            <p className="text-sm">
              Socotra: {JSON.stringify(execution.socotra)} — simulated only, reversible where flagged.
            </p>
          ) : null}
          {drafts.map((d, i) => (
            <pre key={i} className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-xs">
              {d.draft?.subject}
              {"\n\n"}
              {d.draft?.body}
            </pre>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Outcomes & learning</h2>
        <p className="text-sm text-muted-foreground">
          Every underwriting decision should improve the next one. Record downstream outcomes without auto-retraining.
        </p>
        <Button disabled={busy} variant="outline" onClick={() => void onOutcome()}>
          Record demo bound outcome
        </Button>
        {insights.map((insight, i) => (
          <p key={i} className="text-sm italic">
            {insight.message}
          </p>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Source documents</h2>
        <ul className="text-sm">
          {((state?.attachments as { filename?: string; document_type?: string; document_confidence?: number }[]) || []).map(
            (a) => (
              <li key={a.filename}>
                {a.filename} — {a.document_type} ({Number(a.document_confidence || 0).toFixed(2)})
              </li>
            )
          )}
        </ul>
        <div className="text-sm text-muted-foreground">
          Missing: {((state?.missing_fields as string[]) || []).join(", ") || "none"}
        </div>
      </section>
    </div>
  );
}
