"use client";

import { PageHeader } from "@/components/layout/page-header";
import { ExecutiveHeadlineBanner } from "@/components/dashboard/executive-headline";
import { PortfolioSummary } from "@/components/dashboard/portfolio-summary";
import { PremiumChart } from "@/components/dashboard/premium-chart";
import { RecentSubmissions } from "@/components/dashboard/recent-submissions";
import { ReadinessChart } from "@/components/dashboard/readiness-chart";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { StatusChart } from "@/components/dashboard/status-chart";
import { useDemo } from "@/context/demo-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";

export function DashboardContent() {
  const { state } = useDemo();
  const { submissions } = state;
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Executive Dashboard"
        description="Portfolio-level view of premium exposure, underwriting readiness, and pipeline health for commercial submissions."
      >
        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/5 text-emerald-700">
          Synthetic demo portfolio
        </Badge>
        <Button variant="outline" size="sm" onClick={() => setShowHowItWorks(true)}>
          How this works
        </Button>
      </PageHeader>

      {showHowItWorks ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>How LedgeLens works</CardTitle>
              <CardDescription className="mt-2 max-w-2xl text-sm leading-relaxed">
                LedgeLens reviews a commercial insurance application, organizes the information,
                identifies missing or conflicting facts, checks the risk against underwriting rules,
                and estimates an explainable indicative price. It helps the underwriter work faster,
                but the underwriter remains responsible for the final decision.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowHowItWorks(false)}>
              Close
            </Button>
          </CardHeader>
        </Card>
      ) : null}

      <ExecutiveHeadlineBanner submissions={submissions} />
      <PortfolioSummary submissions={submissions} />
      <StatsCards submissions={submissions} />

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <PremiumChart submissions={submissions} />
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-1 lg:grid-cols-1 lg:gap-6">
          <StatusChart submissions={submissions} />
          <ReadinessChart submissions={submissions} />
        </div>
      </div>

      <RecentSubmissions submissions={submissions} />
    </div>
  );
}
