import type { Submission, UnderwriterBriefing } from "@/types";
import { calculateReadinessScore } from "@/lib/readiness";
import { buildCleanOfficePricing, buildHarborStreetPricing } from "@/lib/pricing";
import { evaluateAllRules, getPricingBlockers } from "@/lib/rules-engine";
import { restaurantAppetiteRules } from "@/data/rules-restaurant";
import {
  harborStreetContradictions,
  harborStreetDocuments,
  harborStreetFields,
  harborStreetMissing,
} from "@/data/submissions/harbor-street-social";
import {
  cleanOfficeSubmission,
  contractorSubmission,
  lowConfidenceSubmission,
  nightlifeSubmission,
} from "@/data/submissions/other-submissions";

function buildBriefing(sub: Partial<Submission> & { insuredName: string }): UnderwriterBriefing {
  return {
    executiveSummary: `Underwriting review for ${sub.insuredName}. This is a synthetic demonstration briefing — not a final underwriting decision.`,
    businessProfile: `${sub.insuredName} — ${sub.lineOfBusiness?.replace(/_/g, " ") ?? "commercial"} account submitted via ${sub.brokerFirm ?? "broker"}.`,
    coverageRequested: "Commercial general liability, liquor liability, and excess liability as applicable.",
    positiveCharacteristics: ["Established broker relationship", "Complete application on file"],
    materialExposures: sub.contradictions?.length
      ? [`${sub.contradictions.filter((c) => c.status === "open").length} open contradiction(s)`]
      : ["None identified"],
    lossHistorySummary: "See loss runs and claims fields for detail.",
    dataQualityConcerns: sub.missingItems?.length
      ? [`${sub.missingItems.length} missing item(s)`]
      : [],
    missingInformation: sub.missingItems?.map((m) => m.fieldName) ?? [],
    appetiteAssessment: "See appetite rule evaluation tab.",
    pricingSummary: "See pricing tab for indicative technical premium.",
    expectedEconomics: "See expected economics panel.",
    recommendedAction: "See recommended action in workspace header.",
    humanJudgmentQuestions: [
      "Has the underwriter confirmed all material facts?",
      "Are appetite exceptions documented with rationale?",
    ],
    generatedAt: new Date().toISOString(),
  };
}

function assembleSubmission(
  base: Omit<Submission, "readiness" | "ruleEvaluations" | "pricing" | "briefing" | "recommendedAction">
): Submission {
  const partial = { ...base, contradictions: base.contradictions, missingItems: base.missingItems };
  const ruleEvaluations = evaluateAllRules(restaurantAppetiteRules, partial as Submission);
  const blockers = getPricingBlockers(partial as Submission, ruleEvaluations);

  let pricing;
  if (base.demoProfile === "harbor_street") {
    pricing = buildHarborStreetPricing(blockers, harborStreetDocuments.map((d) => ({
      documentId: d.id, documentName: d.name, excerpt: d.name, confidence: 90,
    })));
  } else if (base.demoProfile === "clean_office") {
    pricing = buildCleanOfficePricing([], base.documents.map((d) => ({
      documentId: d.id, documentName: d.name, excerpt: d.name, confidence: 95,
    })));
    if (blockers.length === 0) pricing.pricingStatus = "quote_ready";
  } else {
    pricing = buildHarborStreetPricing(
      [...blockers, "Indicative pricing only — insufficient data for firm quote"],
      base.documents.map((d) => ({ documentId: d.id, documentName: d.name, excerpt: d.name, confidence: 70 }))
    );
    pricing.pricingStatus = base.demoProfile === "nightlife_outside_appetite"
      ? "referral_required"
      : "indicative";
    pricing.blockers = [...blockers, "Firm quote blocked pending resolution of material issues"];
  }

  const submission: Submission = {
    ...base,
    ruleEvaluations,
    pricing,
    briefing: buildBriefing({ ...base, contradictions: base.contradictions, missingItems: base.missingItems }),
    recommendedAction:
      pricing.pricingStatus === "quote_ready" ? "proceed_to_quote" :
      base.demoProfile === "nightlife_outside_appetite" ? "decline_recommended" :
      "request_information",
    readiness: { overall: 0, completeness: 0, consistency: 0, appetiteAlignment: 0, dataConfidence: 0, documentationQuality: 0, label: "", deductions: [], contributors: [], blockers: [], lastCalculated: "", changedAfterOverride: false },
  };
  submission.readiness = calculateReadinessScore(submission);
  submission.premiumEstimate = submission.pricing.selectedPremium;
  return submission;
}

export function buildInitialSubmissions(): Submission[] {
  const harborStreet = assembleSubmission({
    id: "sub-harbor-street",
    referenceNumber: "LL-2026-00545",
    insuredName: "Harbor Street Social LLC",
    brokerName: "Elena Vasquez",
    brokerFirm: "Atlantic Wholesale Risk Partners",
    lineOfBusiness: "restaurant_entertainment",
    effectiveDate: "2026-08-01",
    expirationDate: "2027-08-01",
    premiumEstimate: 0,
    status: "in_review",
    assignedUnderwriter: "Marcus Chen",
    submittedAt: "2026-06-01T09:00:00Z",
    updatedAt: "2026-07-02T14:00:00Z",
    demoProfile: "harbor_street",
    documents: harborStreetDocuments,
    extractedFields: harborStreetFields,
    contradictions: harborStreetContradictions,
    missingItems: harborStreetMissing,
    notes: "Complex restaurant/bar with multiple contradictions and referral issues.",
  });

  const cleanOffice = assembleSubmission({
    ...cleanOfficeSubmission,
    lineOfBusiness: "general_liability",
  } as Omit<Submission, "readiness" | "ruleEvaluations" | "pricing" | "briefing" | "recommendedAction">);

  const contractor = assembleSubmission({
    ...contractorSubmission,
    lineOfBusiness: "general_liability",
  } as Omit<Submission, "readiness" | "ruleEvaluations" | "pricing" | "briefing" | "recommendedAction">);

  const nightlife = assembleSubmission({
    ...nightlifeSubmission,
    lineOfBusiness: "restaurant_entertainment",
  } as Omit<Submission, "readiness" | "ruleEvaluations" | "pricing" | "briefing" | "recommendedAction">);

  const lowConf = assembleSubmission({
    ...lowConfidenceSubmission,
    lineOfBusiness: "general_liability",
  } as Omit<Submission, "readiness" | "ruleEvaluations" | "pricing" | "briefing" | "recommendedAction">);

  return [harborStreet, cleanOffice, contractor, nightlife, lowConf];
}

export const initialSubmissions = buildInitialSubmissions();
