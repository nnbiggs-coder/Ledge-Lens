"use client";

import { PageHeader } from "@/components/layout/page-header";
import { useDemo } from "@/context/demo-provider";
import { formatDateTime } from "@/lib/submissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";

export function AuditLogContent() {
  const { state } = useDemo();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...state.auditLog].reverse();
    return state.auditLog
      .filter(
        (e) =>
          e.action.includes(q) ||
          e.objectAffected.toLowerCase().includes(q) ||
          e.submissionId.toLowerCase().includes(q) ||
          (e.reason?.toLowerCase().includes(q) ?? false)
      )
      .reverse();
  }, [state.auditLog, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Immutable record of underwriting decisions, system events, and human overrides."
      />
      <Input
        placeholder="Search actions, objects, submission…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-md"
      />
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Events ({filtered.length})</CardTitle>
          <CardDescription>All portfolio and submission-level audit events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit events match your search.</p>
          ) : (
            filtered.map((e) => (
              <div
                key={e.id}
                className="rounded-lg border border-border/60 px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium capitalize">
                    {e.action.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{e.sourceType}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(e.timestamp)}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {e.user} · {e.objectAffected}
                  {e.beforeValue ? ` · was ${e.beforeValue}` : ""}
                  {e.afterValue ? ` → ${e.afterValue}` : ""}
                </p>
                {e.reason ? (
                  <p className="mt-1 text-xs italic text-muted-foreground">{e.reason}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  Submission: {e.submissionId}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
