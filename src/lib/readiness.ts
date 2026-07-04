import type {
  Contradiction,
  MissingItem,
  ReadinessScore,
  RuleEvaluation,
  Submission,
} from "@/types";

const WEIGHTS = {
  completeness: 30,
  consistency: 25,
  appetiteAlignment: 20,
  dataConfidence: 15,
  documentationQuality: 10,
} as const;

function readinessLabel(score: number): string {
  if (score >= 85) return "Ready for underwriting review";
  if (score >= 70) return "Review recommended";
  if (score >= 50) return "Additional information required";
  if (score >= 25) return "Material deficiencies";
  return "Not ready";
}

export function calculateReadinessScore(
  submission: Submission,
  changedAfterOverride = false
): ReadinessScore {
  const deductions: ReadinessScore["deductions"] = [];
  const contributors: ReadinessScore["contributors"] = [];
  const blockers: string[] = [];

  const totalMissing = submission.missingItems.filter(
    (m) => m.status !== "received" && m.status !== "waived"
  );
  const criticalMissing = totalMissing.filter((m) => m.severity === "critical");
  const openContradictions = submission.contradictions.filter(
    (c) => c.status === "open"
  );
  const materialContradictions = openContradictions.filter(
    (c) => c.severity === "high" || c.severity === "critical"
  );
  const failedRules = submission.ruleEvaluations.filter(
    (r) => r.result === "fail" || r.result === "refer"
  );
  const declineRules = submission.ruleEvaluations.filter(
    (r) => r.result === "fail"
  );
  const unreviewedFields = submission.extractedFields.filter(
    (f) => f.verificationStatus === "unreviewed"
  );
  const lowConfidenceFields = submission.extractedFields.filter(
    (f) => f.confidence < 70
  );

  // Completeness (30)
  let completeness = 30;
  for (const item of totalMissing) {
    const pts =
      item.severity === "critical"
        ? 8
        : item.severity === "high"
          ? 5
          : item.severity === "medium"
            ? 3
            : 1;
    completeness -= pts;
    deductions.push({
      label: `Missing: ${item.fieldName}`,
      points: pts,
      category: "completeness",
    });
  }
  if (criticalMissing.length > 0) {
    blockers.push(
      `${criticalMissing.length} critical missing field(s) prevent quote-ready status`
    );
  }
  completeness = Math.max(0, completeness);
  if (totalMissing.length === 0) {
    contributors.push({
      label: "All required fields present",
      points: 5,
      category: "completeness",
    });
  }

  // Consistency (25)
  let consistency = 25;
  for (const c of openContradictions) {
    const pts =
      c.severity === "critical"
        ? 10
        : c.severity === "high"
          ? 7
          : c.severity === "medium"
            ? 4
            : 2;
    consistency -= pts;
    deductions.push({
      label: `Contradiction: ${c.fieldName}`,
      points: pts,
      category: "consistency",
    });
  }
  if (materialContradictions.length > 0) {
    blockers.push(
      "Material contradictions involving revenue, alcohol, locations, operations, or claims prevent quote-ready status"
    );
  }
  consistency = Math.max(0, consistency);

  // Appetite alignment (20)
  let appetiteAlignment = 20;
  for (const rule of failedRules) {
    const pts = rule.result === "fail" ? 6 : 3;
    appetiteAlignment -= pts;
    deductions.push({
      label: `Rule: ${rule.ruleId}`,
      points: pts,
      category: "appetiteAlignment",
    });
  }
  if (declineRules.length > 0) {
    blockers.push(
      "Potentially outside appetite—underwriter confirmation required"
    );
  }
  appetiteAlignment = Math.max(0, appetiteAlignment);

  // Data confidence (15)
  let dataConfidence = 15;
  const confidencePenalty = Math.min(
    10,
    unreviewedFields.length * 1 + lowConfidenceFields.length * 2
  );
  if (confidencePenalty > 0) {
    dataConfidence -= confidencePenalty;
    deductions.push({
      label: "Unconfirmed or low-confidence extractions",
      points: confidencePenalty,
      category: "dataConfidence",
    });
  }
  dataConfidence = Math.max(0, dataConfidence);

  // Documentation quality (10)
  let documentationQuality = 10;
  const lossRunField = submission.extractedFields.find(
    (f) => f.fieldName === "lossRunsYears"
  );
  if (lossRunField && Number(lossRunField.normalizedValue) < 5) {
    documentationQuality -= 4;
    deductions.push({
      label: "Incomplete loss runs",
      points: 4,
      category: "documentationQuality",
    });
    blockers.push("Incomplete loss runs prevent quote-ready status");
  }
  documentationQuality = Math.max(0, documentationQuality);

  const overall = Math.round(
    completeness +
      consistency +
      appetiteAlignment +
      dataConfidence +
      documentationQuality
  );

  return {
    overall,
    completeness,
    consistency,
    appetiteAlignment,
    dataConfidence,
    documentationQuality,
    label: readinessLabel(overall),
    deductions,
    contributors,
    blockers,
    lastCalculated: new Date().toISOString(),
    changedAfterOverride,
  };
}

export function evaluateQuoteBlockers(submission: Submission): string[] {
  const blockers = [...submission.readiness.blockers];
  if (submission.pricing.blockers.length > 0) {
    blockers.push(...submission.pricing.blockers);
  }
  return [...new Set(blockers)];
}

export function isQuoteReady(submission: Submission): boolean {
  return (
    submission.pricing.pricingStatus === "quote_ready" &&
    evaluateQuoteBlockers(submission).length === 0
  );
}
