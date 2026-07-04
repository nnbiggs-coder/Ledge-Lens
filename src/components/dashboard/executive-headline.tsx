import { getExecutiveHeadline } from "@/lib/submissions";
import type { Submission } from "@/types";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExecutiveHeadlineBannerProps {
  submissions: Submission[];
}

const toneStyles = {
  positive: {
    container:
      "border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 via-emerald-50/50 to-background",
    icon: "bg-emerald-500/15 text-emerald-700",
    label: "text-emerald-800",
    Icon: CheckCircle2,
  },
  caution: {
    container:
      "border-amber-200/80 bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-background",
    icon: "bg-amber-500/15 text-amber-700",
    label: "text-amber-800",
    Icon: AlertTriangle,
  },
  neutral: {
    container:
      "border-primary/20 bg-gradient-to-r from-primary/5 via-background to-background",
    icon: "bg-primary/10 text-primary",
    label: "text-primary",
    Icon: Info,
  },
};

export function ExecutiveHeadlineBanner({
  submissions,
}: ExecutiveHeadlineBannerProps) {
  const headline = getExecutiveHeadline(submissions);
  const style = toneStyles[headline.tone];
  const Icon = style.Icon;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border px-5 py-5 sm:px-6 sm:py-6",
        style.container
      )}
      aria-label="Executive key message"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            style.icon
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-widest",
              style.label
            )}
          >
            Key message
          </p>
          <h2 className="text-lg font-semibold leading-snug tracking-tight text-foreground sm:text-xl lg:text-2xl">
            {headline.statement}
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {headline.detail}
          </p>
        </div>
      </div>
    </section>
  );
}
