import { describe, expect, it } from "vitest";
import { buildInitialSubmissions } from "@/data/seed";
import { calculateReadinessScore, isQuoteReady } from "@/lib/readiness";
import { evaluateAllRules, getPricingBlockers } from "@/lib/rules-engine";
import { restaurantAppetiteRules } from "@/data/rules-restaurant";
import { demoReducer, createInitialDemoState } from "@/context/demo-store";
import { generateBrokerEmail } from "@/lib/broker-request";

describe("Harbor Street Social workflow", () => {
  const submissions = buildInitialSubmissions();
  const harbor = submissions.find((s) => s.demoProfile === "harbor_street")!;
  const cleanOffice = submissions.find((s) => s.demoProfile === "clean_office")!;

  it("loads Harbor Street with contradictions and blockers", () => {
    expect(harbor.insuredName).toBe("Harbor Street Social LLC");
    expect(harbor.contradictions.filter((c) => c.status === "open").length).toBeGreaterThanOrEqual(5);
    expect(isQuoteReady(harbor)).toBe(false);
    expect(harbor.pricing.pricingStatus).not.toBe("quote_ready");
  });

  it("evaluates appetite rules deterministically", () => {
    const evaluations = evaluateAllRules(restaurantAppetiteRules, harbor);
    expect(evaluations.some((e) => e.result === "refer" || e.result === "fail")).toBe(true);
    const blockers = getPricingBlockers(harbor, evaluations);
    expect(blockers.some((b) => b.toLowerCase().includes("contradiction"))).toBe(true);
  });

  it("calculates readiness below quote-ready threshold", () => {
    const score = calculateReadinessScore(harbor);
    expect(score.overall).toBeLessThan(85);
    expect(score.blockers.length).toBeGreaterThan(0);
  });

  it("clean office is quote ready", () => {
    expect(cleanOffice.readiness.overall).toBeGreaterThan(90);
    expect(cleanOffice.pricing.pricingStatus).toBe("quote_ready");
  });

  it("resolving contradiction recalculates readiness", () => {
    let state = createInitialDemoState();
    const contradiction = harbor.contradictions[0];
    state = {
      ...state,
      submissions: state.submissions.map((s) =>
        s.id === harbor.id ? harbor : s
      ),
    };
    const before = state.submissions.find((s) => s.id === harbor.id)!.readiness.overall;
    state = demoReducer(state, {
      type: "RESOLVE_CONTRADICTION",
      submissionId: harbor.id,
      contradictionId: contradiction.id,
      resolvedValue: "$5,100,000",
      note: "Confirmed with broker",
    });
    const after = state.submissions.find((s) => s.id === harbor.id)!;
    expect(after.readiness.overall).toBeGreaterThanOrEqual(before);
    expect(state.auditLog.some((e) => e.action === "contradiction_resolved")).toBe(true);
  });

  it("premium selection creates audit event", () => {
    let state = createInitialDemoState();
    const sub = state.submissions.find((s) => s.id === harbor.id)!;
    state = demoReducer(state, {
      type: "SELECT_PREMIUM",
      submissionId: sub.id,
      premium: sub.pricing.minimumPremium - 1000,
      reasonCode: "competitive_match",
      explanation: "Strategic broker relationship",
    });
    expect(state.auditLog.some((e) => e.action === "below_minimum_referral")).toBe(true);
  });

  it("generates broker email without exposing internal rules", () => {
    const email = generateBrokerEmail(harbor);
    expect(email).toContain("Harbor Street Social LLC");
    expect(email).toContain("revenue");
    expect(email.toLowerCase()).not.toContain("rule-rst");
    expect(email.toLowerCase()).not.toContain("schedule modifier");
  });

  it("pricing waterfall is populated", () => {
    expect(harbor.pricing.waterfall.length).toBeGreaterThan(5);
    expect(harbor.pricing.blendedTechnicalPremium).toBeGreaterThan(0);
  });
});
