"use client";

import Link from "next/link";
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
} from "@/lib/submissions";
import type { Submission } from "@/types";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecentSubmissionsProps {
  submissions: Submission[];
}

export function RecentSubmissions({ submissions }: RecentSubmissionsProps) {
  const recent = [...submissions]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5);

  return (
    <Card className="glass-card col-span-full">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates across the underwriting portfolio
          </CardDescription>
        </div>
        <Link href="/submissions">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            View all submissions
            <ArrowRight />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {/* Mobile card list */}
        <div className="space-y-3 md:hidden">
              {recent.map((submission) => (
                <Link
                  key={submission.id}
                  href={`/submissions/${submission.id}`}
                  className="block rounded-xl border border-border/60 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{submission.insuredName}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {submission.referenceNumber}
                  </p>
                </div>
                <SubmissionStatusBadge status={submission.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Premium</p>
                  <p className="font-semibold tabular-nums">
                    {formatCurrency(submission.premiumEstimate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Readiness</p>
                  <div className="mt-0.5 flex justify-end">
                    <ReadinessBadge score={submission.readiness.overall} />
                  </div>
                </div>
              </div>
                </Link>
              ))}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Insured</TableHead>
                <TableHead>Line</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Premium</TableHead>
                <TableHead className="text-right">Readiness</TableHead>
                <TableHead className="text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((submission) => (
                <TableRow key={submission.id} className="hover:bg-muted/40">
                  <TableCell className="font-mono text-sm">
                    <Link href={`/submissions/${submission.id}`} className="hover:underline">
                      {submission.referenceNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/submissions/${submission.id}`} className="hover:underline">
                      {submission.insuredName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lineOfBusinessLabels[submission.lineOfBusiness]}
                  </TableCell>
                  <TableCell>
                    <SubmissionStatusBadge status={submission.status} />
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatCurrency(submission.premiumEstimate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ReadinessBadge score={submission.readiness.overall} />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDate(submission.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
