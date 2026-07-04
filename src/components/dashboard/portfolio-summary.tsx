import { formatCurrency, getDashboardStats } from "@/lib/submissions";
import type { Submission } from "@/types";
import { DollarSign, TrendingUp } from "lucide-react";

interface PortfolioSummaryProps {
  submissions: Submission[];
}

export function PortfolioSummary({ submissions }: PortfolioSummaryProps) {
  const stats = getDashboardStats(submissions);

  return (
    <section className="glass-card metric-gradient relative overflow-hidden rounded-2xl border p-5 sm:p-6 lg:p-8">
      <div className="absolute -top-16 -right-16 size-48 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-12 -left-12 size-40 rounded-full bg-[var(--chart-3)]/10 blur-3xl" />

      <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <TrendingUp className="size-3.5" />
            Q3 2026 Portfolio View
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Active pipeline premium
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl lg:text-5xl">
              {formatCurrency(stats.activePremium)}
            </p>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Financial controller view across {stats.total} open submissions.
            Monitor premium exposure, quote conversion, and underwriting
            readiness before bind decisions.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-xl border border-border/60 bg-background/70 p-4">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <DollarSign className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                Quoted
              </span>
            </div>
            <p className="text-xl font-bold tabular-nums sm:text-2xl">
              {formatCurrency(stats.quotedPremium)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.quoted} account{stats.quoted !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/70 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Avg. deal size
            </p>
            <p className="text-xl font-bold tabular-nums sm:text-2xl">
              {formatCurrency(stats.avgDealSize)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Per submission</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/70 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Quote rate
            </p>
            <p className="text-xl font-bold tabular-nums sm:text-2xl">
              {stats.quoteRate}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Of portfolio</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/70 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Readiness
            </p>
            <p className="text-xl font-bold tabular-nums sm:text-2xl">
              {stats.avgReadiness}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Portfolio avg.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
