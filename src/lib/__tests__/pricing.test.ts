import { describe, expect, it } from "vitest";
import {
  BROKER_COMMISSION_RATIO,
  calculateCombinedRatio,
  calculateExperienceModifier,
  calculateExposurePremium,
  calculateScheduleModifier,
  calculateTechnicalPremium,
  buildHarborStreetPricing,
  EXPERIENCE_MODIFIER_MAX,
  EXPERIENCE_MODIFIER_MIN,
  SCHEDULE_CREDIT_CAP,
  SCHEDULE_DEBIT_CAP,
} from "@/lib/pricing";

describe("calculateExposurePremium", () => {
  it("applies base rate per thousand", () => {
    expect(calculateExposurePremium(5_100_000, 2.5, 10_000)).toBe(12_750);
  });

  it("enforces minimum premium", () => {
    expect(calculateExposurePremium(100_000, 2.5, 15_000)).toBe(15_000);
  });
});

describe("calculateScheduleModifier", () => {
  it("caps credits and debits", () => {
    const mod = calculateScheduleModifier(
      [{ pct: -0.4 }],
      [{ pct: 0.8 }]
    );
    expect(mod).toBe(1 + SCHEDULE_CREDIT_CAP + SCHEDULE_DEBIT_CAP);
  });

  it("sums permitted adjustments", () => {
    expect(calculateScheduleModifier([{ pct: -0.1 }], [{ pct: 0.15 }])).toBe(1.05);
  });
});

describe("calculateExperienceModifier", () => {
  it("applies credibility weighting", () => {
    const mod = calculateExperienceModifier(0.5, 1.4);
    expect(mod).toBeGreaterThanOrEqual(EXPERIENCE_MODIFIER_MIN);
    expect(mod).toBeLessThanOrEqual(EXPERIENCE_MODIFIER_MAX);
  });

  it("respects caps", () => {
    expect(calculateExperienceModifier(1, 3)).toBe(EXPERIENCE_MODIFIER_MAX);
    expect(calculateExperienceModifier(1, 0.1)).toBe(EXPERIENCE_MODIFIER_MIN);
  });
});

describe("calculateTechnicalPremium", () => {
  it("calculates loss-cost premium", () => {
    const premium = calculateTechnicalPremium({
      expectedLoss: 28_000,
      lossAdjustmentExpense: 4_200,
      fixedExpense: 2_500,
      acquisitionExpenseRatio: 0.15,
      operatingExpenseRatio: 0.12,
      premiumTaxRatio: 0.03,
      reinsuranceCostRatio: 0.04,
      profitAndContingencyRatio: 0.08,
    });
    expect(premium).toBeGreaterThan(30_000);
  });

  it("rejects invalid expense ratios", () => {
    expect(() =>
      calculateTechnicalPremium({
        expectedLoss: 1,
        lossAdjustmentExpense: 1,
        fixedExpense: 1,
        acquisitionExpenseRatio: 0.5,
        operatingExpenseRatio: 0.5,
        premiumTaxRatio: 0.5,
        reinsuranceCostRatio: 0.5,
        profitAndContingencyRatio: 0.5,
      })
    ).toThrow();
  });
});

describe("calculateCombinedRatio", () => {
  it("sums loss and expense ratios", () => {
    const result = calculateCombinedRatio(20_000, 7_500, 6_000, 2_000, 50_000);
    expect(result.lossRatio).toBeCloseTo(0.4);
    expect(result.combinedRatio).toBeCloseTo(0.71);
  });
});

describe("buildHarborStreetPricing", () => {
  it("produces indicative pricing near expected range", () => {
    const result = buildHarborStreetPricing(
      ["Material unresolved contradictions block firm quote"],
      []
    );
    expect(result.exposurePremium).toBe(15_000);
    expect(result.targetPremium).toBeGreaterThan(50_000);
    expect(result.targetPremium).toBeLessThan(60_000);
    expect(result.pricingStatus).toBe("referral_required");
    expect(result.blockers.length).toBeGreaterThan(0);
  });

  it("does not add debit solely for contradictions in schedule", () => {
    const withBlockers = buildHarborStreetPricing(["test blocker"], []);
    const without = buildHarborStreetPricing([], []);
    expect(withBlockers.scheduleModifier).toBe(without.scheduleModifier);
  });
});

describe("expected underwriting contribution", () => {
  it("derives contribution from selected premium", () => {
    const p = buildHarborStreetPricing([], []);
    const expected =
      p.selectedPremium -
      p.expectedLossAndLAE -
      p.brokerCommission -
      p.operatingExpense -
      p.reinsuranceAndCapacityCost;
    expect(Math.abs(p.expectedUnderwritingContribution - expected)).toBeLessThanOrEqual(1);
  });
});

describe("below-minimum referral", () => {
  it("flags status when selected below minimum", () => {
    const p = buildHarborStreetPricing([], []);
    expect(p.selectedPremium).toBeGreaterThanOrEqual(p.minimumPremium);
  });
});
