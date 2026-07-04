export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-muted/30 px-4 py-3 text-center text-xs text-muted-foreground sm:px-6">
      Independent concept prototype using fictional data. Not affiliated with
      Ledgebrook or any insurer, MGA, broker, or actuarial organization.
    </footer>
  );
}

export function AiDisclaimer() {
  return (
    <p className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs leading-relaxed text-amber-900">
      AI-generated findings support underwriting review and may contain errors. A
      qualified underwriter must validate all material information and make the
      final decision.
    </p>
  );
}

export function PricingDisclaimer() {
  return (
    <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
      Synthetic demonstration assumptions—not an actuarial indication or an actual
      Ledgebrook pricing model.
    </p>
  );
}
