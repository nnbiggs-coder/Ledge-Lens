import type { AuditEvent, Submission } from "@/types";
import { buildInitialSubmissions } from "@/data/seed";
import { calculateReadinessScore } from "@/lib/readiness";
import { evaluateAllRules, getPricingBlockers } from "@/lib/rules-engine";
import { buildCleanOfficePricing, buildHarborStreetPricing } from "@/lib/pricing";
import { restaurantAppetiteRules } from "@/data/rules-restaurant";

const DEMO_USER = "Demo Underwriter";

function createAuditEvent(
  partial: Omit<AuditEvent, "id" | "timestamp" | "user">
): AuditEvent {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    user: DEMO_USER,
    ...partial,
  };
}

function recalculateSubmission(sub: Submission): Submission {
  const ruleEvaluations = evaluateAllRules(restaurantAppetiteRules, sub);
  const blockers = getPricingBlockers(sub, ruleEvaluations);
  let pricing = sub.pricing;
  if (sub.demoProfile === "harbor_street") {
    pricing = buildHarborStreetPricing(blockers, sub.documents.map((d) => ({
      documentId: d.id, documentName: d.name, excerpt: d.name, confidence: 90,
    })));
  } else if (sub.demoProfile === "clean_office") {
    pricing = buildCleanOfficePricing(blockers, sub.documents.map((d) => ({
      documentId: d.id, documentName: d.name, excerpt: d.name, confidence: 95,
    })));
    if (blockers.length === 0 && sub.contradictions.every((c) => c.status !== "open")) {
      pricing.pricingStatus = "quote_ready";
    }
  }
  const updated: Submission = {
    ...sub,
    ruleEvaluations,
    pricing,
    updatedAt: new Date().toISOString(),
    premiumEstimate: pricing.selectedPremium,
    readiness: { overall: 0, completeness: 0, consistency: 0, appetiteAlignment: 0, dataConfidence: 0, documentationQuality: 0, label: "", deductions: [], contributors: [], blockers: [], lastCalculated: "", changedAfterOverride: false },
  };
  updated.readiness = calculateReadinessScore(updated, true);
  return updated;
}

export type DemoAction =
  | { type: "RESET_DEMO" }
  | { type: "CONFIRM_FIELD"; submissionId: string; fieldId: string }
  | { type: "CORRECT_FIELD"; submissionId: string; fieldId: string; value: string; reason: string }
  | { type: "RESOLVE_CONTRADICTION"; submissionId: string; contradictionId: string; resolvedValue: string; note: string }
  | { type: "WAIVE_MISSING"; submissionId: string; itemId: string; reason: string }
  | { type: "SELECT_PREMIUM"; submissionId: string; premium: number; reasonCode: string; explanation: string }
  | { type: "SET_RECOMMENDED_ACTION"; submissionId: string; action: Submission["recommendedAction"] };

export interface DemoState {
  submissions: Submission[];
  auditLog: AuditEvent[];
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "RESET_DEMO":
      return {
        submissions: buildInitialSubmissions(),
        auditLog: [
          createAuditEvent({
            action: "demo_data_reset",
            objectAffected: "All submissions",
            afterValue: "Restored to seed state",
            submissionId: "all",
            sourceType: "system",
          }),
        ],
      };

    case "CONFIRM_FIELD": {
      const submissions = state.submissions.map((s) => {
        if (s.id !== action.submissionId) return s;
        const fields = s.extractedFields.map((f) =>
          f.id === action.fieldId ? { ...f, verificationStatus: "confirmed" as const } : f
        );
        return recalculateSubmission({ ...s, extractedFields: fields });
      });
      return {
        submissions,
        auditLog: [
          ...state.auditLog,
          createAuditEvent({
            action: "field_confirmed",
            objectAffected: action.fieldId,
            afterValue: "confirmed",
            submissionId: action.submissionId,
            sourceType: "human",
          }),
        ],
      };
    }

    case "CORRECT_FIELD": {
      const submissions = state.submissions.map((s) => {
        if (s.id !== action.submissionId) return s;
        const fields = s.extractedFields.map((f) =>
          f.id === action.fieldId
            ? { ...f, normalizedValue: action.value, verificationStatus: "corrected" as const }
            : f
        );
        return recalculateSubmission({ ...s, extractedFields: fields });
      });
      return {
        submissions,
        auditLog: [
          ...state.auditLog,
          createAuditEvent({
            action: "field_corrected",
            objectAffected: action.fieldId,
            afterValue: action.value,
            reason: action.reason,
            submissionId: action.submissionId,
            sourceType: "human",
          }),
        ],
      };
    }

    case "RESOLVE_CONTRADICTION": {
      const submissions = state.submissions.map((s) => {
        if (s.id !== action.submissionId) return s;
        const contradictions = s.contradictions.map((c) =>
          c.id === action.contradictionId
            ? { ...c, status: "resolved" as const, resolvedValue: action.resolvedValue, resolutionNote: action.note }
            : c
        );
        return recalculateSubmission({ ...s, contradictions });
      });
      return {
        submissions,
        auditLog: [
          ...state.auditLog,
          createAuditEvent({
            action: "contradiction_resolved",
            objectAffected: action.contradictionId,
            afterValue: action.resolvedValue,
            reason: action.note,
            submissionId: action.submissionId,
            sourceType: "human",
          }),
        ],
      };
    }

    case "WAIVE_MISSING": {
      const submissions = state.submissions.map((s) => {
        if (s.id !== action.submissionId) return s;
        const missingItems = s.missingItems.map((m) =>
          m.id === action.itemId ? { ...m, status: "waived" as const } : m
        );
        return recalculateSubmission({ ...s, missingItems });
      });
      return {
        submissions,
        auditLog: [
          ...state.auditLog,
          createAuditEvent({
            action: "missing_item_waived",
            objectAffected: action.itemId,
            reason: action.reason,
            submissionId: action.submissionId,
            sourceType: "human",
          }),
        ],
      };
    }

    case "SELECT_PREMIUM": {
      const submissions = state.submissions.map((s) => {
        if (s.id !== action.submissionId) return s;
        const belowMin = action.premium < s.pricing.minimumPremium;
        const pricing = {
          ...s.pricing,
          selectedPremium: action.premium,
          blockers: belowMin
            ? [...s.pricing.blockers, "Selected premium below minimum — senior approval required"]
            : s.pricing.blockers,
          pricingStatus: belowMin ? ("referral_required" as const) : s.pricing.pricingStatus,
        };
        return recalculateSubmission({ ...s, pricing });
      });
      return {
        submissions,
        auditLog: [
          ...state.auditLog,
          createAuditEvent({
            action: belowMin(action.premium, state, action.submissionId) ? "below_minimum_referral" : "premium_selected",
            objectAffected: "selectedPremium",
            afterValue: String(action.premium),
            reason: `${action.reasonCode}: ${action.explanation}`,
            submissionId: action.submissionId,
            sourceType: "human",
          }),
        ],
      };
    }

    case "SET_RECOMMENDED_ACTION": {
      const submissions = state.submissions.map((s) =>
        s.id === action.submissionId ? { ...s, recommendedAction: action.action } : s
      );
      return {
        submissions,
        auditLog: [
          ...state.auditLog,
          createAuditEvent({
            action: "workflow_status_changed",
            objectAffected: "recommendedAction",
            afterValue: action.action,
            submissionId: action.submissionId,
            sourceType: "human",
          }),
        ],
      };
    }

    default:
      return state;
  }
}

function belowMin(premium: number, state: DemoState, submissionId: string): boolean {
  const sub = state.submissions.find((s) => s.id === submissionId);
  return sub ? premium < sub.pricing.minimumPremium : false;
}

export function createInitialDemoState(): DemoState {
  return {
    submissions: buildInitialSubmissions(),
    auditLog: [
      createAuditEvent({
        action: "submission_created",
        objectAffected: "Demo portfolio",
        afterValue: "5 submissions loaded",
        submissionId: "all",
        sourceType: "system",
      }),
    ],
  };
}
