import { PageHeader } from "@/components/layout/page-header";
import { RecentSubmissions } from "@/components/dashboard/recent-submissions";
import { ReadinessChart } from "@/components/dashboard/readiness-chart";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { StatusChart } from "@/components/dashboard/status-chart";
import { submissions } from "@/data/seed";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Portfolio overview for commercial underwriting submissions"
      />
      <StatsCards submissions={submissions} />
      <div className="grid gap-4 lg:grid-cols-3">
        <ReadinessChart submissions={submissions} />
        <StatusChart submissions={submissions} />
      </div>
      <RecentSubmissions submissions={submissions} />
    </div>
  );
}
