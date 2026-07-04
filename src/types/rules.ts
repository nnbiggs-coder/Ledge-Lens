import type { EvidenceReference } from "./evidence";

export type RuleConditionType =
  | "threshold"
  | "presence"
  | "absence"
  | "range"
  | "document"
  | "ai_assessment";

export type RuleOperator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "greater_than_or_equal"
  | "less_than"
  | "less_than_or_equal"
  | "contains"
  | "not_contains";

export type RuleOutcome = "pass" | "refer" | "decline" | "request_information";

export interface UnderwritingRule {
  id: string;
  name: string;
  category: string;
  description: string;
  conditionType: RuleConditionType;
  fieldName?: string;
  operator?: RuleOperator;
  value?: string | number | boolean;
  outcome: RuleOutcome;
  severity: "low" | "medium" | "high" | "critical";
  rationale: string;
  active: boolean;
}

export type RuleEvaluationResult =
  | "pass"
  | "fail"
  | "refer"
  | "unknown"
  | "not_applicable";

export interface RuleEvaluation {
  ruleId: string;
  result: RuleEvaluationResult;
  submissionValue?: string;
  explanation: string;
  evidence: EvidenceReference[];
  requiresHumanReview: boolean;
}
