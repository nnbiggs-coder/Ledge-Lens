import type { EvidenceReference } from "./evidence";
import type { ExtractedField } from "./fields";
import type { SubmissionDocument } from "./evidence";
import type { RuleEvaluation } from "./rules";
import type { PricingResult } from "./pricing";
import type { AuditEvent } from "./audit";

export type SubmissionStatus =
  | "draft"
  | "in_review"
  | "pending_info"
  | "quoted"
  | "declined"
  | "bound";

export type LineOfBusiness =
  | "general_liability"
  | "commercial_property"
  | "workers_comp"
  | "professional_liability"
  | "excess_casualty"
  | "restaurant_entertainment";

export type MissingItemStatus = "open" | "requested" | "received" | "waived";

export interface MissingItem {
  id: string;
  fieldName: string;
  category: string;
  reasonRequired: string;
  severity: "low" | "medium" | "high" | "critical";
  relatedRuleId?: string;
  brokerQuestion: string;
  status: MissingItemStatus;
}

export type ContradictionStatus =
  | "open"
  | "resolved"
  | "accepted"
  | "dismissed";

export interface Contradiction {
  id: string;
  fieldName: string;
  normalizedValueA: string;
  normalizedValueB: string;
  evidenceA: EvidenceReference;
  evidenceB: EvidenceReference;
  severity: "low" | "medium" | "high" | "critical";
  explanation: string;
  underwritingImpact: string;
  recommendedResolution: string;
  status: ContradictionStatus;
  resolvedValue?: string;
  resolutionNote?: string;
}

export interface ReadinessDeduction {
  label: string;
  points: number;
  category: string;
}

export interface ReadinessContributor {
  label: string;
  points: number;
  category: string;
}

export interface ReadinessScore {
  overall: number;
  completeness: number;
  consistency: number;
  appetiteAlignment: number;
  dataConfidence: number;
  documentationQuality: number;
  label: string;
  deductions: ReadinessDeduction[];
  contributors: ReadinessContributor[];
  blockers: string[];
  lastCalculated: string;
  changedAfterOverride: boolean;
}

export interface UnderwriterBriefing {
  executiveSummary: string;
  businessProfile: string;
  coverageRequested: string;
  positiveCharacteristics: string[];
  materialExposures: string[];
  lossHistorySummary: string;
  dataQualityConcerns: string[];
  missingInformation: string[];
  appetiteAssessment: string;
  pricingSummary: string;
  expectedEconomics: string;
  recommendedAction: string;
  humanJudgmentQuestions: string[];
  generatedAt: string;
}

export type RecommendedAction =
  | "proceed_to_quote"
  | "request_information"
  | "refer_to_senior"
  | "decline_recommended"
  | "hold_for_review";

export interface Submission {
  id: string;
  referenceNumber: string;
  insuredName: string;
  brokerName: string;
  brokerFirm: string;
  lineOfBusiness: LineOfBusiness;
  effectiveDate: string;
  expirationDate: string;
  premiumEstimate: number;
  status: SubmissionStatus;
  assignedUnderwriter: string;
  submittedAt: string;
  updatedAt: string;
  readiness: ReadinessScore;
  contradictions: Contradiction[];
  missingItems: MissingItem[];
  documents: SubmissionDocument[];
  extractedFields: ExtractedField[];
  ruleEvaluations: RuleEvaluation[];
  pricing: PricingResult;
  briefing: UnderwriterBriefing;
  recommendedAction: RecommendedAction;
  notes?: string;
  demoProfile: string;
}

// Legacy compatibility aliases
export type { EvidenceReference } from "./evidence";
export type { UnderwritingRule } from "./rules";
