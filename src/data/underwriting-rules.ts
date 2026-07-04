import type { UnderwritingRule } from "@/types";

export const underwritingRules: UnderwritingRule[] = [
  {
    id: "rule-001",
    name: "Minimum GL Limits",
    category: "Coverage Limits",
    description:
      "General liability submissions must request at least $1M per occurrence.",
    condition: "lineOfBusiness = general_liability AND perOccurrenceLimit < 1000000",
    action: "Flag for senior underwriter review",
    severity: "blocking",
    enabled: true,
    lastUpdated: "2026-03-15T10:00:00Z",
  },
  {
    id: "rule-002",
    name: "Loss History Window",
    category: "Loss Experience",
    description:
      "Five-year loss runs are required for accounts with premium above $50K.",
    condition: "premiumEstimate > 50000 AND lossRunsYears < 5",
    action: "Request missing loss runs from broker",
    severity: "warning",
    enabled: true,
    lastUpdated: "2026-02-28T14:30:00Z",
  },
  {
    id: "rule-003",
    name: "Sprinkler Verification",
    category: "Property",
    description:
      "Commercial property risks over $5M TIV require sprinkler system confirmation.",
    condition: "lineOfBusiness = commercial_property AND tiv > 5000000",
    action: "Require sprinkler certificate or inspection report",
    severity: "blocking",
    enabled: true,
    lastUpdated: "2026-01-10T09:15:00Z",
  },
  {
    id: "rule-004",
    name: "Prior Carrier Gap",
    category: "Eligibility",
    description:
      "Coverage gaps exceeding 30 days require written explanation.",
    condition: "priorCoverageGapDays > 30",
    action: "Add gap letter to required documents",
    severity: "warning",
    enabled: true,
    lastUpdated: "2025-12-01T16:45:00Z",
  },
  {
    id: "rule-005",
    name: "Hazardous Operations",
    category: "Risk Classification",
    description:
      "Submissions referencing demolition or asbestos work trigger referral.",
    condition: "operations CONTAINS 'demolition' OR operations CONTAINS 'asbestos'",
    action: "Route to specialty underwriting queue",
    severity: "blocking",
    enabled: true,
    lastUpdated: "2026-04-01T11:20:00Z",
  },
];
