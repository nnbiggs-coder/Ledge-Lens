import type {
  EvidenceReference,
  RuleEvaluation,
  Submission,
  UnderwritingRule,
} from "@/types";
import { normalizeCurrency, normalizePercentage, normalizeTime } from "./normalize";

function getFieldValue(
  submission: Submission,
  fieldName: string
): string | number | boolean | null {
  const field = submission.extractedFields.find(
    (f) => f.fieldName === fieldName
  );
  return field?.normalizedValue ?? null;
}

function makeEvaluation(
  rule: UnderwritingRule,
  result: RuleEvaluation["result"],
  submissionValue: string | undefined,
  explanation: string,
  evidence: EvidenceReference[],
  requiresHumanReview: boolean
): RuleEvaluation {
  return {
    ruleId: rule.id,
    result,
    submissionValue,
    explanation,
    evidence,
    requiresHumanReview,
  };
}

export function evaluateRule(
  rule: UnderwritingRule,
  submission: Submission
): RuleEvaluation {
  const evidence = submission.documents.slice(0, 1).map((d) => ({
    documentId: d.id,
    documentName: d.name,
    excerpt: "Referenced in rule evaluation",
    confidence: 90,
  }));

  if (!rule.active) {
    return makeEvaluation(rule, "not_applicable", undefined, "Rule is inactive", [], false);
  }

  switch (rule.id) {
    case "rule-rst-001": {
      const years = Number(getFieldValue(submission, "lossRunsYears") ?? 0);
      if (years >= 5) {
        return makeEvaluation(rule, "pass", String(years), "Five years of loss runs provided", evidence, false);
      }
      return makeEvaluation(
        rule,
        "fail",
        String(years),
        `Only ${years} year(s) of loss runs provided; five years required`,
        evidence,
        true
      );
    }
    case "rule-rst-002": {
      const alc = normalizePercentage(String(getFieldValue(submission, "alcoholSalesPct") ?? ""));
      if (alc === null) return makeEvaluation(rule, "unknown", undefined, "Alcohol sales percentage not found", evidence, true);
      if (alc > 50) {
        return makeEvaluation(
          rule,
          "fail",
          `${alc}%`,
          "Potentially outside appetite—underwriter confirmation required. Alcohol sales above 50%.",
          evidence,
          true
        );
      }
      if (alc > 25) {
        return makeEvaluation(rule, "refer", `${alc}%`, "Alcohol sales above 25% require senior referral", evidence, true);
      }
      return makeEvaluation(rule, "pass", `${alc}%`, "Alcohol sales within standard appetite", evidence, false);
    }
    case "rule-rst-003": {
      const closeTime = String(getFieldValue(submission, "closingTime") ?? "");
      const minutes = normalizeTime(closeTime);
      if (minutes !== null && minutes > 60) {
        return makeEvaluation(rule, "refer", closeTime, "Operations after 1:00 a.m. require referral", evidence, true);
      }
      return makeEvaluation(rule, "pass", closeTime || "Unknown", "Operating hours within standard appetite", evidence, false);
    }
    case "rule-rst-004": {
      const live = getFieldValue(submission, "liveEntertainment");
      if (live === true) {
        return makeEvaluation(rule, "refer", "Yes", "Live entertainment requires supplemental questionnaire", evidence, true);
      }
      return makeEvaluation(rule, "pass", "No", "No live entertainment indicated", evidence, false);
    }
    case "rule-rst-005": {
      const armed = getFieldValue(submission, "armedSecurity");
      if (armed === true) {
        return makeEvaluation(
          rule,
          "fail",
          "Armed",
          "Potentially outside appetite—underwriter confirmation required. Armed security indicated.",
          evidence,
          true
        );
      }
      const security = getFieldValue(submission, "securityPersonnel");
      if (security === true) {
        return makeEvaluation(rule, "refer", "Unarmed", "Unarmed security requires referral", evidence, true);
      }
      return makeEvaluation(rule, "pass", "None", "No security concerns", evidence, false);
    }
    case "rule-rst-006": {
      const openClaims = Number(getFieldValue(submission, "openClaims") ?? 0);
      const abClaim = getFieldValue(submission, "openAssaultBatteryClaim");
      if (abClaim === true || openClaims > 0) {
        return makeEvaluation(rule, "refer", String(openClaims), "Open assault-and-battery or other open claims require referral", evidence, true);
      }
      return makeEvaluation(rule, "pass", "0", "No open A&B claims", evidence, false);
    }
    case "rule-rst-007": {
      const revenue = normalizeCurrency(String(getFieldValue(submission, "annualRevenue") ?? ""));
      if (revenue !== null && revenue > 10_000_000) {
        return makeEvaluation(rule, "refer", `$${revenue.toLocaleString()}`, "Revenue above $10M requires referral", evidence, true);
      }
      return makeEvaluation(rule, "pass", revenue ? `$${revenue.toLocaleString()}` : "Unknown", "Revenue within referral threshold", evidence, false);
    }
    case "rule-rst-008": {
      const years = Number(getFieldValue(submission, "yearsInBusiness") ?? 0);
      if (years < 3) {
        return makeEvaluation(rule, "refer", String(years), "Fewer than three years of operating history require referral", evidence, true);
      }
      return makeEvaluation(rule, "pass", String(years), "Operating history acceptable", evidence, false);
    }
    case "rule-rst-009": {
      const occupancy = getFieldValue(submission, "maxOccupancy");
      if (occupancy === null || occupancy === "") {
        return makeEvaluation(rule, "fail", undefined, "Maximum occupancy is missing", evidence, true);
      }
      return makeEvaluation(rule, "pass", String(occupancy), "Maximum occupancy provided", evidence, false);
    }
    case "rule-rst-010": {
      const limit = normalizeCurrency(String(getFieldValue(submission, "excessLimit") ?? ""));
      if (limit !== null && limit > 5_000_000) {
        return makeEvaluation(rule, "refer", `$${limit.toLocaleString()}`, "Excess limits above $5M require senior approval", evidence, true);
      }
      return makeEvaluation(rule, "pass", limit ? `$${limit.toLocaleString()}` : "N/A", "Limits within authority", evidence, false);
    }
    case "rule-rst-011": {
      const locations = Number(getFieldValue(submission, "numberOfLocations") ?? 1);
      if (locations > 2) {
        return makeEvaluation(rule, "refer", String(locations), "More than two locations require complete location schedule", evidence, true);
      }
      if (locations > 1) {
        return makeEvaluation(rule, "refer", String(locations), "Multiple locations require location schedule verification", evidence, true);
      }
      return makeEvaluation(rule, "pass", String(locations), "Location count acceptable", evidence, false);
    }
    case "rule-rst-012": {
      const material = submission.contradictions.filter(
        (c) => c.status === "open" && (c.severity === "high" || c.severity === "critical")
      );
      if (material.length > 0) {
        return makeEvaluation(
          rule,
          "fail",
          String(material.length),
          "Material contradictions prevent quote-ready status",
          evidence,
          true
        );
      }
      return makeEvaluation(rule, "pass", "0", "No material contradictions", evidence, false);
    }
    default:
      return makeEvaluation(rule, "unknown", undefined, "Rule not implemented in demo engine", evidence, false);
  }
}

export function evaluateAllRules(
  rules: UnderwritingRule[],
  submission: Submission
): RuleEvaluation[] {
  return rules.filter((r) => r.active).map((r) => evaluateRule(r, submission));
}

export function getPricingBlockers(
  submission: Submission,
  evaluations: RuleEvaluation[]
): string[] {
  const blockers: string[] = [];
  const openMaterial = submission.contradictions.filter(
    (c) =>
      c.status === "open" &&
      ["annualRevenue", "alcoholSalesPct", "numberOfLocations", "liveEntertainment", "openClaims"].includes(
        c.fieldName
      )
  );
  if (openMaterial.length > 0) {
    blockers.push("Material unresolved contradictions block firm quote");
  }
  const criticalMissing = submission.missingItems.filter(
    (m) => m.severity === "critical" && m.status !== "received" && m.status !== "waived"
  );
  if (criticalMissing.length > 0) {
    blockers.push("Missing material exposure data — indicative range only");
  }
  for (const ev of evaluations) {
    if (ev.result === "fail" || ev.result === "refer") {
      blockers.push(ev.explanation);
    }
  }
  return [...new Set(blockers)];
}
