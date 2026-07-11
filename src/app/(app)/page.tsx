"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listSubmissions, type QueueItem } from "@/lib/agent-api";

export default function AgentQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSubmissions();
      setItems(data.submissions);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "API unavailable. Start the agent API on port 8000."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 5000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Queue"
        description="AI interprets. Automation executes. Underwriters decide."
      >
        <Button variant="outline" onClick={() => void refresh()}>
          Refresh
        </Button>
        <Button render={<Link href="/scenarios" />}>Load demo scenario</Button>
      </PageHeader>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          {error}
          <div className="mt-1 text-muted-foreground">
            Run <code className="text-xs">.venv/bin/uvicorn api.main:app --reload --port 8000</code>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Submission</TableHead>
              <TableHead>Broker</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Recommendation</TableHead>
              <TableHead>Approval</TableHead>
              <TableHead>Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground">
                  Loading queue…
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground">
                  No agent runs yet. Open Demo Scenarios to start the five-minute walkthrough.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.submission_id}>
                  <TableCell>
                    <Link
                      href={`/agent/${item.submission_id}`}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {item.insured || item.submission_id}
                    </Link>
                    <div className="text-xs text-muted-foreground">{item.submission_id}</div>
                  </TableCell>
                  <TableCell>{item.broker || "—"}</TableCell>
                  <TableCell>{item.product || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.stage || "—"}</Badge>
                  </TableCell>
                  <TableCell>{item.risk_level || "—"}</TableCell>
                  <TableCell>{item.recommended_action || "—"}</TableCell>
                  <TableCell>{item.approval_status || "—"}</TableCell>
                  <TableCell>
                    {item.priority_score != null ? Math.round(item.priority_score) : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
