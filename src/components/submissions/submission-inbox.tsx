"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SubmissionCard } from "@/components/submissions/submission-card";
import { ReadinessBadge } from "@/components/submissions/readiness-badge";
import { SubmissionStatusBadge } from "@/components/submissions/submission-status-badge";
import {
  formatCurrency,
  formatDate,
  lineOfBusinessLabels,
  searchSubmissions,
  submissionStatusLabels,
} from "@/lib/submissions";
import type { Submission, SubmissionStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubmissionInboxProps {
  submissions: Submission[];
}

const statusFilters: Array<SubmissionStatus | "all"> = [
  "all",
  "in_review",
  "pending_info",
  "quoted",
  "declined",
];

export function SubmissionInbox({ submissions }: SubmissionInboxProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "all">(
    "all"
  );

  const filtered = useMemo(() => {
    let results = searchSubmissions(submissions, query);
    if (statusFilter !== "all") {
      results = results.filter((s) => s.status === statusFilter);
    }
    return results;
  }, [submissions, query, statusFilter]);

  return (
    <Card className="glass-card">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-xl">Submission Inbox</CardTitle>
            <CardDescription className="mt-1.5 max-w-xl">
              Search and filter commercial submissions. Prioritize by status,
              premium exposure, and readiness score.
            </CardDescription>
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search insured, broker, ref…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 rounded-xl pl-9"
              aria-label="Search submissions"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          {statusFilters.map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-8 rounded-full px-3 text-xs",
                statusFilter === status && "shadow-sm"
              )}
              onClick={() => setStatusFilter(status)}
            >
              {status === "all" ? "All" : submissionStatusLabels[status]}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            {filtered.length} of {submissions.length} submissions
          </span>
          {query || statusFilter !== "all" ? (
            <Badge variant="secondary" className="font-normal">
              Filtered
            </Badge>
          ) : null}
        </div>

        {filtered.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed text-muted-foreground">
            No submissions match your filters.
          </div>
        ) : (
          <>
            {/* Mobile & tablet cards */}
            <div className="grid gap-4 md:hidden">
              {filtered.map((submission) => (
                <SubmissionCard key={submission.id} submission={submission} />
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-xl border md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Reference</TableHead>
                    <TableHead>Insured</TableHead>
                    <TableHead>Broker</TableHead>
                    <TableHead>Line</TableHead>
                    <TableHead>Underwriter</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Issues</TableHead>
                    <TableHead className="text-right">Premium</TableHead>
                    <TableHead className="text-right">Readiness</TableHead>
                    <TableHead className="text-right">Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((submission) => {
                    const openContradictions = submission.contradictions.filter(
                      (c) => c.status === "open"
                    ).length;
                    const pendingMissing = submission.missingItems.filter(
                      (m) => m.status !== "received"
                    ).length;

                    return (
                      <TableRow
                        key={submission.id}
                        className="hover:bg-muted/30"
                      >
                        <TableCell className="font-mono text-sm">
                          {submission.referenceNumber}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate font-medium">
                          {submission.insuredName}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {submission.brokerName}
                            </span>
                            <span className="max-w-[140px] truncate text-xs text-muted-foreground">
                              {submission.brokerFirm}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {lineOfBusinessLabels[submission.lineOfBusiness]}
                        </TableCell>
                        <TableCell>{submission.assignedUnderwriter}</TableCell>
                        <TableCell>
                          <SubmissionStatusBadge status={submission.status} />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {openContradictions > 0 ? (
                              <Badge variant="destructive" className="font-mono">
                                {openContradictions}C
                              </Badge>
                            ) : null}
                            {pendingMissing > 0 ? (
                              <Badge variant="secondary" className="font-mono">
                                {pendingMissing}M
                              </Badge>
                            ) : null}
                            {openContradictions === 0 &&
                            pendingMissing === 0 ? (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatCurrency(submission.premiumEstimate)}
                        </TableCell>
                        <TableCell className="text-right">
                          <ReadinessBadge score={submission.readiness.overall} />
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatDate(submission.submittedAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
