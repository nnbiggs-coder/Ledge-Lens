export type AuditSourceType = "system" | "rule" | "ai" | "human";

export type AuditAction =
  | "submission_created"
  | "document_added"
  | "field_extracted"
  | "field_confirmed"
  | "field_corrected"
  | "field_rejected"
  | "contradiction_identified"
  | "contradiction_resolved"
  | "missing_item_waived"
  | "appetite_rule_evaluated"
  | "rule_overridden"
  | "readiness_recalculated"
  | "pricing_calculated"
  | "pricing_factor_changed"
  | "premium_selected"
  | "below_minimum_referral"
  | "briefing_generated"
  | "broker_request_generated"
  | "workflow_status_changed"
  | "demo_data_reset";

export interface AuditEvent {
  id: string;
  timestamp: string;
  user: string;
  action: AuditAction;
  objectAffected: string;
  beforeValue?: string;
  afterValue?: string;
  reason?: string;
  submissionId: string;
  sourceType: AuditSourceType;
}
