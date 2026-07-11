export function DisclaimerBanner() {
  return (
    <div className="space-y-0">
      <div
        role="note"
        className="border-b border-sky-200 bg-sky-50 px-4 py-2 text-center text-sm font-medium text-sky-950"
      >
        The agent prepares and recommends. The underwriter remains accountable.
      </div>
      <div
        role="note"
        className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-900"
      >
        Synthetic prototype only — fictional data and simulated integrations. Not connected to
        Ledgebrook production systems.
      </div>
    </div>
  );
}
