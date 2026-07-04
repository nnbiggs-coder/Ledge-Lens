export function DisclaimerBanner() {
  return (
    <div
      role="note"
      className="flex items-center justify-center gap-2 border-b border-amber-200/80 bg-gradient-to-r from-amber-50 via-amber-50/90 to-amber-50 px-4 py-2 text-center text-xs sm:text-sm text-amber-900"
    >
      <span className="inline-block size-1.5 shrink-0 rounded-full bg-amber-500" />
      Independent concept prototype using fictional data. Not affiliated with
      Ledgebrook or any insurer, MGA or broker.
    </div>
  );
}
