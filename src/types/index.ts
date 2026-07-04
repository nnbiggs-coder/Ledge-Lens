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
  | "excess_casualty";

export type SeverityLevel = "low" | "medium" | "high" | "critical";

export type ContradictionStatus = "open" | "resolved" | "waived";

export type MissingItemStatus = "pending" | "requested" | "received";

export type MissingItemPriority = "low" | "medium" | "high";

export type RuleSeverity = "info" | "warning" | "blocking";

export interface EvidenceReference {
  id: string;
  documentName: string;
  pageNumber?: number;
  section?: string;
  excerpt: string;
  confidence: number;
}

export interface Contradiction {
  id: string;
  field: string;
  description: string;
  severity: SeverityLevel;
  values: { source: string; value: string }[];
  evidenceRefIds: string[];
  status: ContradictionStatus;
}

export interface MissingItem {
  id: string;
  category: string;
  description: string;
  required: boolean;
  priority: MissingItemPriority;
  status: MissingItemStatus;
}

export interface ReadinessScore {
  overall: number;
  completeness: number;
  consistency: number;
  compliance: number;
  documentation: number;
  lastCalculated: string;
}

export interface UnderwritingRule {
  id: string;
  name: string;
  category: string;
  description: string;
  condition: string;
  action: string;
  severity: RuleSeverity;
  enabled: boolean;
  lastUpdated: string;
}

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
  evidenceReferences: EvidenceReference[];
  notes?: string;
}
