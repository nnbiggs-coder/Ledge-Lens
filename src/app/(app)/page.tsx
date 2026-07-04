import { PageHeader } from "@/components/layout/page-header";
import { PortfolioSummary } from "@/components/dashboard/portfolio-summary";
import { PremiumChart } from "@/components/dashboard/premium-chart";
import { RecentSubmissions } from "@/components/dashboard/recent-submissions";
import { ReadinessChart } from "@/components/dashboard/readiness-chart";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { StatusChart } from "@/components/dashboard/status-chart";
import { submissions } from "@/data/seed";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Executive Dashboard"
        description="Portfolio-level view of premium exposure, underwriting readiness, and pipeline health for commercial submissions."
      >
        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/5 text-emerald-700">
          Live portfolio
        </Badge>
      </PageHeader>

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
