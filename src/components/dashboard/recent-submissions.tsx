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
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>
            Latest activity across the underwriting portfolio
          </CardDescription>
        </div>
        <Link href="/submissions">
          <Button variant="outline" size="sm">
            View inbox
            <ArrowRight />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
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
              <TableRow key={submission.id}>
                <TableCell className="font-mono text-sm">
                  {submission.referenceNumber}
                </TableCell>
                <TableCell className="font-medium">
                  {submission.insuredName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {lineOfBusinessLabels[submission.lineOfBusiness]}
                </TableCell>
                <TableCell>
                  <SubmissionStatusBadge status={submission.status} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
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
      </CardContent>
    </Card>
  );
}
