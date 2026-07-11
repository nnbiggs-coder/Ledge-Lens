"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { listSubmissions, getSubmission } from "@/lib/agent-api";

type AuditRow = {
  submission_id: string;
  timestamp?: string;
  stage?: string;
  event_type?: string;
  message?: string;
  actor?: string;
  decision?: string;
};

export default function AuditLogPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const queue = await listSubmissions();
        const all: AuditRow[] = [];
        for (const item of queue.submissions.slice(0, 20)) {
          const detail = await getSubmission(item.submission_id);
          const events = (detail.state.audit_events as AuditRow[]) || [];
          for (const e of events) {
            all.push({ ...e, submission_id: item.submission_id });
          }
        }
        all.sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
        setRows(all);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load audit events");
      }
    }
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description="Every action, source, confidence score and decision is recorded."
      />
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          {error}
        </div>
      )}
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={`${row.submission_id}-${i}`} className="border-b border-border/70 py-2 text-sm">
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{row.timestamp ? new Date(row.timestamp).toLocaleString() : "—"}</span>
              <Link href={`/agent/${row.submission_id}`} className="underline">
                {row.submission_id}
              </Link>
              <span>{row.stage}</span>
              <span>{row.event_type}</span>
              <span>{row.actor}</span>
              {row.decision ? <span>decision: {row.decision}</span> : null}
            </div>
            <div>{row.message}</div>
          </div>
        ))}
        {!rows.length && !error && (
          <p className="text-sm text-muted-foreground">No audit events yet.</p>
        )}
      </div>
    </div>
  );
}
