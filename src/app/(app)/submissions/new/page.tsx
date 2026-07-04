"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import Link from "next/link";

export default function NewSubmissionPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="New Submission"
        description="Intake form for broker-submitted commercial underwriting files (demo)."
      />
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Submission intake</CardTitle>
          <CardDescription>
            In demo mode, submissions are pre-seeded. This form illustrates the
            intake workflow without persisting new records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-4 text-sm">
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
                Demo intake received. In production, this would create a new
                submission and trigger document extraction. Use the inbox to
                review existing synthetic submissions.
              </p>
              <Link href="/submissions">
                <Button>Go to inbox</Button>
              </Link>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
            >
              <div>
                <label className="text-sm font-medium">Insured name</label>
                <Input required placeholder="Legal business name" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Broker firm</label>
                <Input required placeholder="Brokerage name" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Line of business</label>
                <Input placeholder="e.g. General Liability" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Effective date</label>
                <Input type="date" className="mt-1" />
              </div>
              <Button type="submit">Submit intake (demo)</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
