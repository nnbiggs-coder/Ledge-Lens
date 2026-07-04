"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
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
import { ReadinessBadge } from "@/components/submissions/readiness-badge";
import { SubmissionStatusBadge } from "@/components/submissions/submission-status-badge";
import {
  formatCurrency,
  formatDate,
  lineOfBusinessLabels,
  searchSubmissions,
} from "@/lib/submissions";
import type { Submission } from "@/types";
import { Badge } from "@/components/ui/badge";

interface SubmissionInboxProps {
  submissions: Submission[];
}

export function SubmissionInbox({ submissions }: SubmissionInboxProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => searchSubmissions(submissions, query),
    [submissions, query]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Submission Inbox</CardTitle>
            <CardDescription>
              Search by reference, insured, broker, underwriter, line or status
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search submissions…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              aria-label="Search submissions"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing {filtered.length} of {submissions.length} submissions
          </span>
          {query ? (
            <Badge variant="secondary" className="font-normal">
              Filtered
            </Badge>
          ) : null}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
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
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-24 text-center text-muted-foreground"
                >
                  No submissions match your search.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((submission) => {
                const openContradictions = submission.contradictions.filter(
                  (c) => c.status === "open"
                ).length;
                const pendingMissing = submission.missingItems.filter(
                  (m) => m.status !== "received"
                ).length;

                return (
                  <TableRow key={submission.id}>
                    <TableCell className="font-mono text-sm">
                      {submission.referenceNumber}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {submission.insuredName}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{submission.brokerName}</span>
                        <span className="text-xs text-muted-foreground">
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
                        {openContradictions === 0 && pendingMissing === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
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
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
