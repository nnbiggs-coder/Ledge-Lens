import type { EvidenceReference } from "./evidence";

export type ExposureBasis =
  | "revenue"
  | "payroll"
  | "employees"
  | "locations"
  | "vehicles"
  | "square_feet"
  | "occupancy"
  | "subcontractor_cost";

export type PricingStatus =
  | "indicative"
  | "review_required"
  | "referral_required"
  | "quote_ready";

export type PricingFactorCategory =
  | "class"
  | "territory"
  | "operations"
  | "management"
  | "premises"
  | "safety"
  | "security"
  | "claims"
  | "coverage"
  | "portfolio"
  | "market";

export interface ExposureRate {
  id: string;
  classCode: string;
  coverage: string;
  exposureBasis: ExposureBasis;
  ratePerUnit: number;
  unitSize: number;
  minimumPremium: number;
}

export interface PricingFactor {
  id: string;
  name: string;
  category: PricingFactorCategory;
  factorType: "multiplier" | "percentage" | "fixed_amount";
  value: number;
  rationale: string;
  evidenceRequired: boolean;
  minimum?: number;
  maximum?: number;
}

export interface AppliedPricingFactor {
  factorId: string;
  name: string;
  inputValue?: string | number;
  factorValue: number;
  dollarImpact: number;
  rationale: string;
  evidence: EvidenceReference[];
  appliedBy: "rule" | "underwriter" | "seeded";
  requiresHumanConfirmation: boolean;
  overrideReason?: string;
}

export interface TechnicalPriceInput {
  expectedLoss: number;
  lossAdjustmentExpense: number;
  fixedExpense: number;
  acquisitionExpenseRatio: number;
  operatingExpenseRatio: number;
  premiumTaxRatio: number;
  reinsuranceCostRatio: number;
  profitAndContingencyRatio: number;
}

export interface PricingWaterfallStep {
  id: string;
  label: string;
  startingAmount: number;
  factorLabel?: string;
  factorValue?: number;
  dollarImpact: number;
  resultingAmount: number;
  rationale: string;
  evidence: EvidenceReference[];
  appliedBy: "rule" | "underwriter" | "seeded";
}

export interface PricingResult {
  exposurePremium: number;
  classAdjustedPremium: number;
  scheduleModifier: number;
  experienceModifier: number;
  coverageModifier: number;
  ratingModelPremium: number;
  expectedLossTechnicalPremium: number;
  credibilityWeight: number;
  blendedTechnicalPremium: number;
  portfolioModifier: number;
  marketModifier: number;
  fees: number;
  minimumPremium: number;
  targetPremium: number;
  selectedPremium: number;
  quoteRangeLow: number;
  quoteRangeHigh: number;
  expectedLossAndLAE: number;
  brokerCommission: number;
  operatingExpense: number;
  reinsuranceAndCapacityCost: number;
  expectedUnderwritingContribution: number;
  expectedLossRatio: number;
  expectedExpenseRatio: number;
  expectedCombinedRatio: number;
  pricingStatus: PricingStatus;
  blockers: string[];
  waterfall: PricingWaterfallStep[];
  appliedFactors: AppliedPricingFactor[];
  pricingConfidence: number;
}

export type PricingOverrideReasonCode =
  | "competitive_match"
  | "strategic_broker_relationship"
  | "improved_deductible"
  | "reduced_coverage"
  | "improved_terms"
  | "portfolio_diversification"
  | "multi_policy_opportunity"
  | "management_approval"
  | "data_correction"
  | "underwriter_judgment"
  | "other";
