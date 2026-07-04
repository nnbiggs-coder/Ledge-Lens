"use client";

import Link from "next/link";
import { useState } from "react";
import { useSubmission } from "@/context/demo-provider";
import { PageHeader } from "@/components/layout/page-header";
import { AiDisclaimer, PricingDisclaimer } from "@/components/layout/disclaimers";
import { SubmissionStatusBadge } from "@/components/submissions/submission-status-badge";
import { ReadinessBadge } from "@/components/submissions/readiness-badge";
import { formatCurrency, formatDate, lineOfBusinessLabels } from "@/lib/submissions";
import { formatRatio } from "@/lib/normalize";
import { generateBrokerEmail } from "@/lib/broker-request";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Submission } from "@/types";
import { ArrowLeft, Check, Copy } from "lucide-react";

const TABS = [
  "Overview", "Documents", "Missing Info", "Contradictions",
  "Appetite", "Readiness", "Briefing", "Broker Request", "Pricing", "Audit",
] as const;

type Tab = (typeof TABS)[number];

export function SubmissionWorkspace({ id }: { id: string }) {
  const { submission, dispatch } = useSubmission(id);
  const [tab, setTab] = useState<Tab>("Overview");
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolveValue, setResolveValue] = useState("");
  const [resolveNote, setResolveNote] = useState("");
  const [premiumInput, setPremiumInput] = useState("");
  const [premiumReason, setPremiumReason] = useState("");
  const [brokerEmail, setBrokerEmail] = useState("");
  const [copied, setCopied] = useState(false);

  if (!submission) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Submission not found.</p>
        <Link href="/submissions"><Button variant="outline">Back to inbox</Button></Link>
      </div>
    );
  }

  const openContradictions = submission.contradictions.filter((c) => c.status === "open");
  const openMissing = submission.missingItems.filter((m) => m.status === "open" || m.status === "requested");
  const quoteBlocked = submission.pricing.blockers.length > 0 || openContradictions.some((c) => c.severity === "critical" || c.severity === "high");

  function handleGenerateBrokerEmail() {
    setBrokerEmail(generateBrokerEmail(submission!));
    setTab("Broker Request");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/submissions"><Button variant="ghost" size="sm"><ArrowLeft /> Inbox</Button></Link>
      </div>

      <PageHeader title={submission.insuredName} description={`${submission.referenceNumber} · ${lineOfBusinessLabels[submission.lineOfBusiness]}`}>
        <SubmissionStatusBadge status={submission.status} />
        <ReadinessBadge score={submission.readiness.overall} />
      </PageHeader>

      {quoteBlocked ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Firm quote blocked.</strong> Material unresolved issues prevent quote-ready status. Indicative pricing remains visible for review.
        </div>
      ) : submission.pricing.pricingStatus === "quote_ready" ? (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <strong>Quote ready</strong> — pending underwriter confirmation. Human judgment required before bind.
        </div>
      ) : null}

      <AiDisclaimer />

      {/* Tab nav */}
      <div className="flex flex-wrap gap-1 border-b border-border pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm transition-colors",
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <OverviewTab submission={submission} />}
      {tab === "Documents" && <DocumentsTab submission={submission} />}
      {tab === "Missing Info" && <MissingTab submission={submission} dispatch={dispatch} />}
      {tab === "Contradictions" && (
        <ContradictionsTab
          submission={submission}
          resolveId={resolveId}
          setResolveId={setResolveId}
          resolveValue={resolveValue}
          setResolveValue={setResolveValue}
          resolveNote={resolveNote}
          setResolveNote={setResolveNote}
          dispatch={dispatch}
        />
      )}
      {tab === "Appetite" && <AppetiteTab submission={submission} />}
      {tab === "Readiness" && <ReadinessTab submission={submission} />}
      {tab === "Briefing" && <BriefingTab submission={submission} />}
      {tab === "Broker Request" && (
        <BrokerTab
          brokerEmail={brokerEmail}
          setBrokerEmail={setBrokerEmail}
          copied={copied}
          setCopied={setCopied}
          onGenerate={handleGenerateBrokerEmail}
        />
      )}
      {tab === "Pricing" && <PricingTab submission={submission} premiumInput={premiumInput} setPremiumInput={setPremiumInput} premiumReason={premiumReason} setPremiumReason={setPremiumReason} dispatch={dispatch} />}
      {tab === "Audit" && <AuditTab submissionId={submission.id} />}
    </div>
  );
}

function OverviewTab({ submission }: { submission: Submission }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="glass-card">
        <CardHeader><CardTitle>Risk Profile</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Broker" value={`${submission.brokerName} · ${submission.brokerFirm}`} />
          <Row label="Underwriter" value={submission.assignedUnderwriter} />
          <Row label="Effective" value={formatDate(submission.effectiveDate)} />
          <Row label="Premium (selected)" value={formatCurrency(submission.pricing.selectedPremium)} />
          <Row label="Readiness" value={`${submission.readiness.overall}% — ${submission.readiness.label}`} />
        </CardContent>
      </Card>
      <Card className="glass-card">
        <CardHeader><CardTitle>Extracted Fields</CardTitle><CardDescription>{submission.extractedFields.length} fields</CardDescription></CardHeader>
        <CardContent>
          <div className="max-h-64 space-y-2 overflow-y-auto text-sm">
            {submission.extractedFields.slice(0, 8).map((f) => (
              <div key={f.id} className="flex justify-between gap-2 border-b border-border/40 pb-1">
                <span className="text-muted-foreground">{f.fieldName}</span>
                <span className="font-medium">{String(f.normalizedValue ?? "Unknown")}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentsTab({ submission }: { submission: Submission }) {
  return (
    <Card className="glass-card">
      <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {submission.documents.map((d) => (
          <div key={d.id} className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
            <div>
              <p className="font-medium">{d.name}</p>
              <p className="text-xs text-muted-foreground">{d.type} · {formatDate(d.uploadedAt)}</p>
            </div>
            {d.pageCount ? <Badge variant="outline">{d.pageCount} pages</Badge> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MissingTab({ submission, dispatch }: { submission: Submission; dispatch: ReturnType<typeof useSubmission>["dispatch"] }) {
  return (
    <Card className="glass-card">
      <CardHeader><CardTitle>Missing Information</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {submission.missingItems.map((m) => (
          <div key={m.id} className="rounded-lg border border-border/60 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{m.fieldName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{m.reasonRequired}</p>
                <p className="mt-2 text-sm italic">&ldquo;{m.brokerQuestion}&rdquo;</p>
              </div>
              <Badge variant={m.severity === "critical" ? "destructive" : "secondary"}>{m.severity}</Badge>
            </div>
            {m.status !== "waived" && m.status !== "received" ? (
              <Button size="sm" variant="outline" className="mt-3" onClick={() => dispatch({ type: "WAIVE_MISSING", submissionId: submission.id, itemId: m.id, reason: "Underwriter waived pending broker response" })}>
                Waive (demo)
              </Button>
            ) : (
              <Badge className="mt-3">{m.status}</Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ContradictionsTab({
  submission, resolveId, setResolveId, resolveValue, setResolveValue, resolveNote, setResolveNote, dispatch,
}: {
  submission: Submission;
  resolveId: string | null;
  setResolveId: (id: string | null) => void;
  resolveValue: string;
  setResolveValue: (v: string) => void;
  resolveNote: string;
  setResolveNote: (v: string) => void;
  dispatch: ReturnType<typeof useSubmission>["dispatch"];
}) {
  return (
    <div className="space-y-4">
      {submission.contradictions.map((c) => (
        <Card key={c.id} className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{c.fieldName}</CardTitle>
              <Badge variant={c.status === "open" ? "destructive" : "secondary"}>{c.status}</Badge>
            </div>
            <CardDescription>{c.explanation}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <EvidenceBox label="Source A" value={c.normalizedValueA} evidence={c.evidenceA} />
              <EvidenceBox label="Source B" value={c.normalizedValueB} evidence={c.evidenceB} />
            </div>
            <p className="text-sm"><strong>Impact:</strong> {c.underwritingImpact}</p>
            <p className="text-sm"><strong>Resolution:</strong> {c.recommendedResolution}</p>
            {c.status === "open" && (
              resolveId === c.id ? (
                <div className="space-y-2 rounded-lg border border-border p-3">
                  <Input placeholder="Resolved value" value={resolveValue} onChange={(e) => setResolveValue(e.target.value)} />
                  <Input placeholder="Resolution note" value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} />
                  <Button size="sm" onClick={() => {
                    dispatch({ type: "RESOLVE_CONTRADICTION", submissionId: submission.id, contradictionId: c.id, resolvedValue: resolveValue, note: resolveNote });
                    setResolveId(null);
                  }}>Confirm resolution</Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setResolveId(c.id)}>Resolve contradiction</Button>
              )
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EvidenceBox({ label, value, evidence }: { label: string; value: string; evidence: { documentName: string; excerpt: string; pageNumber?: number } }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
      <p className="font-medium">{label}: {value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{evidence.documentName}{evidence.pageNumber ? ` p.${evidence.pageNumber}` : ""}</p>
      <p className="mt-1 italic">&ldquo;{evidence.excerpt}&rdquo;</p>
    </div>
  );
}

function AppetiteTab({ submission }: { submission: Submission }) {
  return (
    <Card className="glass-card">
      <CardHeader><CardTitle>Appetite Rule Evaluation</CardTitle><CardDescription>Deterministic synthetic rules — declines are recommendations only</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        {submission.ruleEvaluations.map((ev) => (
          <div key={ev.ruleId} className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3 text-sm">
            <div>
              <p className="font-medium">{ev.ruleId}</p>
              <p className="text-muted-foreground">{ev.explanation}</p>
              {ev.result === "fail" && <p className="mt-1 text-xs text-amber-700">Potentially outside appetite—underwriter confirmation required.</p>}
            </div>
            <Badge variant={ev.result === "pass" ? "secondary" : "destructive"}>{ev.result}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ReadinessTab({ submission }: { submission: Submission }) {
  const r = submission.readiness;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{r.overall}% — {r.label}</CardTitle>
          <CardDescription>Calculated {formatDate(r.lastCalculated)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Completeness (30)" value={`${r.completeness}`} />
          <Row label="Consistency (25)" value={`${r.consistency}`} />
          <Row label="Appetite alignment (20)" value={`${r.appetiteAlignment}`} />
          <Row label="Data confidence (15)" value={`${r.dataConfidence}`} />
          <Row label="Documentation (10)" value={`${r.documentationQuality}`} />
        </CardContent>
      </Card>
      <Card className="glass-card">
        <CardHeader><CardTitle>Blockers & Deductions</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {r.blockers.map((b) => <p key={b} className="text-amber-700">• {b}</p>)}
          {r.deductions.map((d) => <p key={d.label} className="text-muted-foreground">−{d.points} {d.label}</p>)}
        </CardContent>
      </Card>
    </div>
  );
}

function BriefingTab({ submission }: { submission: Submission }) {
  const b = submission.briefing;
  return (
    <Card className="glass-card">
      <CardHeader><CardTitle>Underwriter Briefing</CardTitle><CardDescription>AI-assisted — not a final decision</CardDescription></CardHeader>
      <CardContent className="prose prose-sm max-w-none space-y-4 text-sm">
        <Section title="Executive Summary" content={b.executiveSummary} />
        <Section title="Business Profile" content={b.businessProfile} />
        <Section title="Coverage Requested" content={b.coverageRequested} />
        <Section title="Appetite Assessment" content={b.appetiteAssessment} />
        <Section title="Pricing Summary" content={submission.pricing.pricingStatus + " — " + formatCurrency(submission.pricing.selectedPremium)} />
        <div>
          <p className="font-semibold">Human Judgment Questions</p>
          <ul className="mt-1 list-disc pl-5">{b.humanJudgmentQuestions.map((q) => <li key={q}>{q}</li>)}</ul>
        </div>
      </CardContent>
    </Card>
  );
}

function BrokerTab({ brokerEmail, setBrokerEmail, copied, setCopied, onGenerate }: {
  brokerEmail: string; setBrokerEmail: (v: string) => void; copied: boolean; setCopied: (v: boolean) => void; onGenerate: () => void;
}) {
  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div><CardTitle>Broker Information Request</CardTitle><CardDescription>Editable professional email template</CardDescription></div>
        <Button size="sm" onClick={onGenerate}>Generate</Button>
      </CardHeader>
      <CardContent>
        <textarea
          className="min-h-64 w-full rounded-xl border border-input bg-background p-4 text-sm"
          value={brokerEmail}
          onChange={(e) => setBrokerEmail(e.target.value)}
          placeholder="Click Generate to create broker request email…"
        />
        {brokerEmail ? (
          <Button size="sm" variant="outline" className="mt-3" onClick={() => { navigator.clipboard.writeText(brokerEmail); setCopied(true); }}>
            {copied ? <><Check /> Copied</> : <><Copy /> Copy to clipboard</>}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function PricingTab({ submission, premiumInput, setPremiumInput, premiumReason, setPremiumReason, dispatch }: {
  submission: Submission; premiumInput: string; setPremiumInput: (v: string) => void;
  premiumReason: string; setPremiumReason: (v: string) => void;
  dispatch: ReturnType<typeof useSubmission>["dispatch"];
}) {
  const p = submission.pricing;
  const statusLabel = { indicative: "Indicative price", review_required: "Review required", referral_required: "Referral required", quote_ready: "Quote ready" }[p.pricingStatus];

  return (
    <div className="space-y-6">
      <PricingDisclaimer />
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm font-medium">{statusLabel}</div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Technical premium", p.blendedTechnicalPremium],
          ["Target premium", p.targetPremium],
          ["Minimum acceptable", p.minimumPremium],
          ["Selected premium", p.selectedPremium],
          ["Quote range", `${formatCurrency(p.quoteRangeLow)} – ${formatCurrency(p.quoteRangeHigh)}`],
          ["Expected combined ratio", formatRatio(p.expectedCombinedRatio)],
          ["UW contribution", formatCurrency(p.expectedUnderwritingContribution)],
          ["Pricing confidence", `${p.pricingConfidence}%`],
        ].map(([label, val]) => (
          <div key={String(label)} className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-lg font-bold tabular-nums">{typeof val === "number" ? formatCurrency(val) : val}</p>
          </div>
        ))}
      </div>

      {p.blockers.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader><CardTitle className="text-base">Quote Blockers</CardTitle></CardHeader>
          <CardContent>{p.blockers.map((b) => <p key={b} className="text-sm">• {b}</p>)}</CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardHeader><CardTitle>Pricing Waterfall</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-2">Step</th><th>Start</th><th>Impact</th><th>Result</th><th>By</th></tr></thead>
            <tbody>
              {p.waterfall.map((step) => (
                <tr key={step.id} className="border-b border-border/40">
                  <td className="py-2 font-medium">{step.label}</td>
                  <td className="tabular-nums">{formatCurrency(step.startingAmount)}</td>
                  <td className="tabular-nums">{formatCurrency(step.dollarImpact)}</td>
                  <td className="tabular-nums">{formatCurrency(step.resultingAmount)}</td>
                  <td><Badge variant="outline">{step.appliedBy}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle>Expected Economics</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <Row label="Gross premium" value={formatCurrency(p.selectedPremium)} />
          <Row label="Expected losses & LAE" value={formatCurrency(p.expectedLossAndLAE)} />
          <Row label="Broker commission" value={formatCurrency(p.brokerCommission)} />
          <Row label="Operating expense" value={formatCurrency(p.operatingExpense)} />
          <Row label="Reinsurance / capacity" value={formatCurrency(p.reinsuranceAndCapacityCost)} />
          <Row label="UW contribution" value={formatCurrency(p.expectedUnderwritingContribution)} />
          <Row label="Loss ratio" value={formatRatio(p.expectedLossRatio)} />
          <Row label="Expense ratio" value={formatRatio(p.expectedExpenseRatio)} />
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle>Underwriter Premium Selection</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Technical premium: estimated risk-based price before commercial adjustments. Selected premium: price chosen by underwriter.</p>
          <Input type="number" placeholder={`Selected premium (min ${p.minimumPremium})`} value={premiumInput} onChange={(e) => setPremiumInput(e.target.value)} />
          <Input placeholder="Override reason" value={premiumReason} onChange={(e) => setPremiumReason(e.target.value)} />
          <Button size="sm" onClick={() => dispatch({ type: "SELECT_PREMIUM", submissionId: submission.id, premium: Number(premiumInput), reasonCode: "underwriter_judgment", explanation: premiumReason || "Underwriter adjustment" })}>
            Apply selected premium
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AuditTab({ submissionId }: { submissionId: string }) {
  const { auditLog } = useSubmission(submissionId);
  return (
    <Card className="glass-card">
      <CardHeader><CardTitle>Audit Log</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {auditLog.length === 0 ? <p className="text-sm text-muted-foreground">No events yet.</p> : auditLog.map((e) => (
          <div key={e.id} className="rounded-lg border border-border/40 px-3 py-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="font-medium">{e.action.replace(/_/g, " ")}</span>
              <span className="text-xs text-muted-foreground">{formatDate(e.timestamp)}</span>
            </div>
            <p className="text-muted-foreground">{e.objectAffected}{e.afterValue ? ` → ${e.afterValue}` : ""}</p>
            {e.reason ? <p className="text-xs italic">{e.reason}</p> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-border/30 py-1"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}

function Section({ title, content }: { title: string; content: string }) {
  return <div><p className="font-semibold">{title}</p><p className="mt-1 text-muted-foreground">{content}</p></div>;
}
