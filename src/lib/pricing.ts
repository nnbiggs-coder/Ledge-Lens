import type {
  AppliedPricingFactor,
  EvidenceReference,
  PricingResult,
  PricingWaterfallStep,
  Submission,
  TechnicalPriceInput,
} from "@/types";
import { normalizeCurrency } from "./normalize";

export const SCHEDULE_CREDIT_CAP = -0.25;
export const SCHEDULE_DEBIT_CAP = 0.5;
export const EXPERIENCE_MODIFIER_MIN = 0.75;
export const EXPERIENCE_MODIFIER_MAX = 1.75;
export const BROKER_COMMISSION_RATIO = 0.15;
export const OPERATING_EXPENSE_RATIO = 0.12;
export const REINSURANCE_COST_RATIO = 0.04;

export interface PricingInputs {
  exposureAmount: number;
  baseRatePerThousand: number;
  minimumPremium: number;
  classFactor: number;
  territoryFactor: number;
  alcoholFactor: number;
  locationFactor: number;
  scheduleDebits: { name: string; pct: number; rationale: string }[];
  scheduleCredits: { name: string; pct: number; rationale: string }[];
  experienceModifier: number;
  credibilityWeight: number;
  coverageLimitFactor: number;
  excessPremium: number;
  fees: number;
  portfolioModifier: number;
  marketModifier: number;
  technicalInput: TechnicalPriceInput;
  blockers: string[];
  evidence: EvidenceReference[];
}

export function calculateExposurePremium(
  exposureAmount: number,
  ratePerThousand: number,
  minimumPremium: number
): number {
  const raw = (exposureAmount / 1000) * ratePerThousand;
  return Math.max(raw, minimumPremium);
}

export function calculateScheduleModifier(
  credits: { pct: number }[],
  debits: { pct: number }[]
): number {
  const totalCredit = credits.reduce((s, c) => s + c.pct, 0);
  const totalDebit = debits.reduce((s, d) => s + d.pct, 0);
  const cappedCredit = Math.max(totalCredit, SCHEDULE_CREDIT_CAP);
  const cappedDebit = Math.min(totalDebit, SCHEDULE_DEBIT_CAP);
  return 1 + cappedCredit + cappedDebit;
}

export function calculateExperienceModifier(
  credibility: number,
  actualToExpected: number
): number {
  const raw = credibility * actualToExpected + (1 - credibility) * 1.0;
  return Math.min(
    EXPERIENCE_MODIFIER_MAX,
    Math.max(EXPERIENCE_MODIFIER_MIN, raw)
  );
}

export function calculateTechnicalPremium(input: TechnicalPriceInput): number {
  const variableRatio =
    input.acquisitionExpenseRatio +
    input.operatingExpenseRatio +
    input.premiumTaxRatio +
    input.reinsuranceCostRatio +
    input.profitAndContingencyRatio;

  if (variableRatio >= 1) {
    throw new Error("Combined variable expense ratios must remain below 100%");
  }

  const numerator =
    input.expectedLoss + input.lossAdjustmentExpense + input.fixedExpense;
  return numerator / (1 - variableRatio);
}

export function calculateCombinedRatio(
  expectedLossAndLAE: number,
  commission: number,
  operatingExpense: number,
  reinsuranceCost: number,
  selectedPremium: number
): { lossRatio: number; expenseRatio: number; combinedRatio: number } {
  if (selectedPremium <= 0) {
    return { lossRatio: 0, expenseRatio: 0, combinedRatio: 0 };
  }
  const lossRatio = expectedLossAndLAE / selectedPremium;
  const expenseRatio =
    (commission + operatingExpense + reinsuranceCost) / selectedPremium;
  return {
    lossRatio,
    expenseRatio,
    combinedRatio: lossRatio + expenseRatio,
  };
}

export function determinePricingStatus(
  blockers: string[],
  hasReferral: boolean,
  belowMinimum: boolean
): PricingResult["pricingStatus"] {
  if (blockers.length > 0 || belowMinimum) return "referral_required";
  if (hasReferral) return "review_required";
  return "indicative";
}

export function calculatePricing(inputs: PricingInputs): PricingResult {
  const waterfall: PricingWaterfallStep[] = [];
  const appliedFactors: AppliedPricingFactor[] = [];
  const evidence = inputs.evidence;

  let amount = calculateExposurePremium(
    inputs.exposureAmount,
    inputs.baseRatePerThousand,
    inputs.minimumPremium
  );
  waterfall.push({
    id: "exposure",
    label: "Exposure premium",
    startingAmount: 0,
    factorLabel: `$${inputs.baseRatePerThousand}/$1,000 on ${inputs.exposureAmount.toLocaleString()}`,
    dollarImpact: amount,
    resultingAmount: amount,
    rationale: `Exposure amount / unit × base rate (minimum ${inputs.minimumPremium})`,
    evidence,
    appliedBy: "seeded",
  });

  const classAdjusted =
    amount * inputs.classFactor * inputs.territoryFactor * inputs.alcoholFactor * inputs.locationFactor;
  const classImpact = classAdjusted - amount;
  waterfall.push({
    id: "class",
    label: "Class & territory adjustment",
    startingAmount: amount,
    factorLabel: `Class ${inputs.classFactor} × Territory ${inputs.territoryFactor} × Alcohol ${inputs.alcoholFactor} × Locations ${inputs.locationFactor}`,
    factorValue: inputs.classFactor * inputs.territoryFactor,
    dollarImpact: classImpact,
    resultingAmount: classAdjusted,
    rationale: "Restaurant/bar class, territory, alcohol, and multi-location factors",
    evidence,
    appliedBy: "rule",
  });
  amount = classAdjusted;

  const scheduleMod = calculateScheduleModifier(
    inputs.scheduleCredits,
    inputs.scheduleDebits
  );
  const scheduleAmount = amount * scheduleMod;
  const scheduleImpact = scheduleAmount - amount;
  waterfall.push({
    id: "schedule",
    label: "Schedule rating",
    startingAmount: amount,
    factorLabel: `Modifier ${scheduleMod.toFixed(3)}`,
    factorValue: scheduleMod,
    dollarImpact: scheduleImpact,
    resultingAmount: scheduleAmount,
    rationale: `Schedule modifier capped at ${SCHEDULE_CREDIT_CAP * 100}% credit / +${SCHEDULE_DEBIT_CAP * 100}% debit`,
    evidence,
    appliedBy: "rule",
  });
  amount = scheduleAmount;

  const expMod = Math.min(
    EXPERIENCE_MODIFIER_MAX,
    Math.max(EXPERIENCE_MODIFIER_MIN, inputs.experienceModifier)
  );
  const expAmount = amount * expMod;
  waterfall.push({
    id: "experience",
    label: "Experience rating",
    startingAmount: amount,
    factorLabel: `Modifier ${expMod.toFixed(2)}`,
    factorValue: expMod,
    dollarImpact: expAmount - amount,
    resultingAmount: expAmount,
    rationale: "Credibility-weighted actual-to-expected loss ratio",
    evidence,
    appliedBy: "rule",
  });
  amount = expAmount;

  const coverageAmount = amount * inputs.coverageLimitFactor + inputs.excessPremium;
  waterfall.push({
    id: "coverage",
    label: "Coverage & limit adjustment",
    startingAmount: amount,
    factorLabel: `Limit factor ${inputs.coverageLimitFactor}`,
    dollarImpact: coverageAmount - amount,
    resultingAmount: coverageAmount,
    rationale: "Primary limit factor plus synthetic excess layer premium",
    evidence,
    appliedBy: "seeded",
  });
  amount = coverageAmount;
  const ratingModelPremium = amount;

  let technicalPremium: number;
  try {
    technicalPremium = calculateTechnicalPremium(inputs.technicalInput);
  } catch {
    technicalPremium = ratingModelPremium;
  }

  waterfall.push({
    id: "technical",
    label: "Expected-loss technical premium",
    startingAmount: ratingModelPremium,
    dollarImpact: technicalPremium - ratingModelPremium,
    resultingAmount: technicalPremium,
    rationale: "Loss + LAE + fixed expense divided by (1 − variable expense ratios)",
    evidence,
    appliedBy: "rule",
  });

  const credibility = inputs.credibilityWeight;
  const blended =
    ratingModelPremium * (1 - credibility) + technicalPremium * credibility;
  waterfall.push({
    id: "blend",
    label: "Credibility blend",
    startingAmount: ratingModelPremium,
    factorLabel: `${((1 - credibility) * 100).toFixed(0)}% rating / ${(credibility * 100).toFixed(0)}% loss-cost`,
    dollarImpact: blended - ratingModelPremium,
    resultingAmount: blended,
    rationale: "Blends exposure rating model with experience/loss-cost model",
    evidence,
    appliedBy: "rule",
  });
  amount = blended;

  const portfolioAmount = amount * inputs.portfolioModifier;
  waterfall.push({
    id: "portfolio",
    label: "Portfolio adjustment",
    startingAmount: amount,
    factorValue: inputs.portfolioModifier,
    dollarImpact: portfolioAmount - amount,
    resultingAmount: portfolioAmount,
    rationale: "Controlled synthetic portfolio factor",
    evidence,
    appliedBy: "seeded",
  });
  amount = portfolioAmount;

  const marketAmount = amount * inputs.marketModifier;
  waterfall.push({
    id: "market",
    label: "Market adjustment",
    startingAmount: amount,
    factorValue: inputs.marketModifier,
    dollarImpact: marketAmount - amount,
    resultingAmount: marketAmount,
    rationale: "Controlled commercial market adjustment",
    evidence,
    appliedBy: "seeded",
  });
  amount = marketAmount;

  const withFees = amount + inputs.fees;
  waterfall.push({
    id: "fees",
    label: "Fees",
    startingAmount: amount,
    dollarImpact: inputs.fees,
    resultingAmount: withFees,
    rationale: "Policy fees and filing charges",
    evidence,
    appliedBy: "seeded",
  });

  const targetPremium = Math.round(withFees);
  const minimumPremium = Math.round(targetPremium * 0.92);
  const selectedPremium = targetPremium;
  const quoteRangeLow = Math.round(selectedPremium * 0.95);
  const quoteRangeHigh = Math.round(selectedPremium * 1.05);

  const expectedLossAndLAE =
    inputs.technicalInput.expectedLoss + inputs.technicalInput.lossAdjustmentExpense;
  const brokerCommission = selectedPremium * BROKER_COMMISSION_RATIO;
  const operatingExpense = selectedPremium * OPERATING_EXPENSE_RATIO;
  const reinsuranceCost = selectedPremium * REINSURANCE_COST_RATIO;
  const contribution =
    selectedPremium -
    expectedLossAndLAE -
    brokerCommission -
    operatingExpense -
    reinsuranceCost;

  const ratios = calculateCombinedRatio(
    expectedLossAndLAE,
    brokerCommission,
    operatingExpense,
    reinsuranceCost,
    selectedPremium
  );

  const hasReferral = inputs.blockers.some((b) =>
    b.toLowerCase().includes("referral")
  );
  const belowMinimum = selectedPremium < minimumPremium;
  const pricingStatus = determinePricingStatus(
    inputs.blockers,
    hasReferral,
    belowMinimum
  );

  const confirmedInputs = 5;
  const totalInputs = 8;
  const pricingConfidence = Math.round(
    (confirmedInputs / totalInputs) * 100 -
      inputs.blockers.length * 8
  );

  return {
    exposurePremium: Math.round(
      calculateExposurePremium(
        inputs.exposureAmount,
        inputs.baseRatePerThousand,
        inputs.minimumPremium
      )
    ),
    classAdjustedPremium: Math.round(classAdjusted),
    scheduleModifier: scheduleMod,
    experienceModifier: expMod,
    coverageModifier: inputs.coverageLimitFactor,
    ratingModelPremium: Math.round(ratingModelPremium),
    expectedLossTechnicalPremium: Math.round(technicalPremium),
    credibilityWeight: credibility,
    blendedTechnicalPremium: Math.round(blended),
    portfolioModifier: inputs.portfolioModifier,
    marketModifier: inputs.marketModifier,
    fees: inputs.fees,
    minimumPremium,
    targetPremium,
    selectedPremium,
    quoteRangeLow,
    quoteRangeHigh,
    expectedLossAndLAE: Math.round(expectedLossAndLAE),
    brokerCommission: Math.round(brokerCommission),
    operatingExpense: Math.round(operatingExpense),
    reinsuranceAndCapacityCost: Math.round(reinsuranceCost),
    expectedUnderwritingContribution: Math.round(contribution),
    expectedLossRatio: ratios.lossRatio,
    expectedExpenseRatio: ratios.expenseRatio,
    expectedCombinedRatio: ratios.combinedRatio,
    pricingStatus,
    blockers: inputs.blockers,
    waterfall,
    appliedFactors,
    pricingConfidence: Math.max(0, Math.min(100, pricingConfidence)),
  };
}

export function getExposureAmount(submission: Submission): number {
  const revenueField = submission.extractedFields.find(
    (f) => f.fieldName === "annualRevenue" && f.verificationStatus !== "rejected"
  );
  if (revenueField?.normalizedValue != null) {
    const val = normalizeCurrency(String(revenueField.normalizedValue));
    if (val) return val;
  }
  const confirmed = submission.extractedFields.find(
    (f) => f.fieldName === "annualRevenueConfirmed"
  );
  if (confirmed?.normalizedValue != null) {
    return Number(confirmed.normalizedValue);
  }
  return 0;
}

export function buildHarborStreetPricing(
  blockers: string[],
  evidence: EvidenceReference[]
): PricingResult {
  return calculatePricing({
    exposureAmount: 5_100_000,
    baseRatePerThousand: 2.5,
    minimumPremium: 15_000,
    classFactor: 1.2,
    territoryFactor: 1.0,
    alcoholFactor: 1.15,
    locationFactor: 1.05,
    scheduleDebits: [
      { name: "Late-night operations", pct: 0.1, rationale: "Closing after 1:00 a.m." },
      { name: "Live entertainment", pct: 0.12, rationale: "Live music advertised" },
      { name: "Open A&B claim", pct: 0.15, rationale: "Open assault-and-battery claim" },
    ],
    scheduleCredits: [
      { name: "Documented security", pct: -0.03, rationale: "Security personnel documented" },
    ],
    experienceModifier: 1.18,
    credibilityWeight: 0.3,
    coverageLimitFactor: 1.2,
    excessPremium: 16_500,
    fees: 1_250,
    portfolioModifier: 1.0,
    marketModifier: 1.0,
    technicalInput: {
      expectedLoss: 28_000,
      lossAdjustmentExpense: 4_200,
      fixedExpense: 2_500,
      acquisitionExpenseRatio: 0.15,
      operatingExpenseRatio: 0.12,
      premiumTaxRatio: 0.03,
      reinsuranceCostRatio: 0.04,
      profitAndContingencyRatio: 0.08,
    },
    blockers,
    evidence,
  });
}

export function buildCleanOfficePricing(
  blockers: string[],
  evidence: EvidenceReference[]
): PricingResult {
  return calculatePricing({
    exposureAmount: 2_400_000,
    baseRatePerThousand: 0.85,
    minimumPremium: 5_000,
    classFactor: 0.95,
    territoryFactor: 1.0,
    alcoholFactor: 1.0,
    locationFactor: 1.0,
    scheduleDebits: [],
    scheduleCredits: [{ name: "Clean loss history", pct: -0.1, rationale: "5-year clean loss runs" }],
    experienceModifier: 0.85,
    credibilityWeight: 0.6,
    coverageLimitFactor: 1.0,
    excessPremium: 0,
    fees: 750,
    portfolioModifier: 1.0,
    marketModifier: 0.98,
    technicalInput: {
      expectedLoss: 8_500,
      lossAdjustmentExpense: 1_200,
      fixedExpense: 1_800,
      acquisitionExpenseRatio: 0.15,
      operatingExpenseRatio: 0.12,
      premiumTaxRatio: 0.03,
      reinsuranceCostRatio: 0.03,
      profitAndContingencyRatio: 0.08,
    },
    blockers,
    evidence,
  });
}
