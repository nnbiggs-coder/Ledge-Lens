import type {
  Contradiction,
  ExtractedField,
  MissingItem,
  SubmissionDocument,
} from "@/types";

export const harborStreetDocuments: SubmissionDocument[] = [
  { id: "doc-hss-app", name: "Commercial Insurance Application", type: "application", uploadedAt: "2026-06-01T10:00:00Z", pageCount: 12 },
  { id: "doc-hss-supp", name: "Restaurant Supplemental Questionnaire", type: "supplemental", uploadedAt: "2026-06-01T10:05:00Z", pageCount: 6 },
  { id: "doc-hss-exp", name: "Exposure Spreadsheet", type: "spreadsheet", uploadedAt: "2026-06-02T09:00:00Z", pageCount: 2 },
  { id: "doc-hss-loss", name: "Loss Runs (3 years)", type: "loss_runs", uploadedAt: "2026-06-02T11:00:00Z", pageCount: 8 },
  { id: "doc-hss-web", name: "Website Snapshot", type: "website", uploadedAt: "2026-06-03T14:00:00Z" },
  { id: "doc-hss-loc", name: "Location Schedule", type: "schedule", uploadedAt: "2026-06-03T15:00:00Z", pageCount: 3 },
];

export const harborStreetFields: ExtractedField[] = [
  { id: "f-hss-name", fieldName: "legalBusinessName", category: "Business Identity", normalizedValue: "Harbor Street Social LLC", originalValue: "Harbor Street Social LLC", dataType: "string", confidence: 98, sourceDocumentId: "doc-hss-app", sourceDocumentName: "Commercial Insurance Application", pageNumber: 1, evidenceText: "Legal name: Harbor Street Social LLC", extractionMethod: "seeded", verificationStatus: "confirmed" },
  { id: "f-hss-rev-app", fieldName: "annualRevenue", category: "Financial", normalizedValue: 3800000, originalValue: "$3.8 million", dataType: "currency", confidence: 94, sourceDocumentId: "doc-hss-app", sourceDocumentName: "Commercial Insurance Application", pageNumber: 4, evidenceText: "Annual gross revenue: $3.8 million", extractionMethod: "ai", verificationStatus: "unreviewed" },
  { id: "f-hss-rev-exp", fieldName: "annualRevenueExposure", category: "Financial", normalizedValue: 5100000, originalValue: "$5,100,000", dataType: "currency", confidence: 96, sourceDocumentId: "doc-hss-exp", sourceDocumentName: "Exposure Spreadsheet", evidenceText: "Total revenue: $5,100,000", extractionMethod: "ai", verificationStatus: "unreviewed" },
  { id: "f-hss-rev-pricing", fieldName: "annualRevenueConfirmed", category: "Financial", normalizedValue: 5100000, originalValue: "$5,100,000 (pricing basis)", dataType: "currency", confidence: 72, sourceDocumentId: "doc-hss-exp", sourceDocumentName: "Exposure Spreadsheet", evidenceText: "Revenue used for indicative pricing per underwriter guidance", extractionMethod: "rule", verificationStatus: "unreviewed" },
  { id: "f-hss-alc-app", fieldName: "alcoholSalesPctApp", category: "Operations", normalizedValue: 15, originalValue: "15%", dataType: "percentage", confidence: 92, sourceDocumentId: "doc-hss-app", sourceDocumentName: "Commercial Insurance Application", evidenceText: "Alcohol sales: 15% of total revenue", extractionMethod: "ai", verificationStatus: "unreviewed" },
  { id: "f-hss-alc-supp", fieldName: "alcoholSalesPct", category: "Operations", normalizedValue: 38, originalValue: "38%", dataType: "percentage", confidence: 95, sourceDocumentId: "doc-hss-supp", sourceDocumentName: "Restaurant Supplemental Questionnaire", evidenceText: "Alcohol sales approximately 38% of revenue", extractionMethod: "ai", verificationStatus: "unreviewed" },
  { id: "f-hss-close-app", fieldName: "closingTimeApp", category: "Operations", normalizedValue: "midnight", originalValue: "Midnight", dataType: "string", confidence: 90, sourceDocumentId: "doc-hss-app", sourceDocumentName: "Commercial Insurance Application", evidenceText: "Closing time: Midnight", extractionMethod: "ai", verificationStatus: "unreviewed" },
  { id: "f-hss-close-web", fieldName: "closingTime", category: "Operations", normalizedValue: "2:00 a.m.", originalValue: "2:00 a.m.", dataType: "string", confidence: 88, sourceDocumentId: "doc-hss-web", sourceDocumentName: "Website Snapshot", evidenceText: "Open until 2:00 a.m. Friday and Saturday", extractionMethod: "ai", verificationStatus: "unreviewed" },
  { id: "f-hss-live-app", fieldName: "liveEntertainmentApp", category: "Operations", normalizedValue: false, originalValue: "No", dataType: "boolean", confidence: 91, sourceDocumentId: "doc-hss-app", sourceDocumentName: "Commercial Insurance Application", evidenceText: "Live entertainment: No", extractionMethod: "ai", verificationStatus: "unreviewed" },
  { id: "f-hss-live-web", fieldName: "liveEntertainment", category: "Operations", normalizedValue: true, originalValue: "Yes", dataType: "boolean", confidence: 93, sourceDocumentId: "doc-hss-web", sourceDocumentName: "Website Snapshot", evidenceText: "Live music three nights per week", extractionMethod: "ai", verificationStatus: "unreviewed" },
  { id: "f-hss-claims-app", fieldName: "openClaimsApp", category: "Claims", normalizedValue: 0, originalValue: "0", dataType: "number", confidence: 89, sourceDocumentId: "doc-hss-app", sourceDocumentName: "Commercial Insurance Application", evidenceText: "Open claims: None", extractionMethod: "ai", verificationStatus: "unreviewed" },
  { id: "f-hss-claims-loss", fieldName: "openClaims", category: "Claims", normalizedValue: 1, originalValue: "1", dataType: "number", confidence: 97, sourceDocumentId: "doc-hss-loss", sourceDocumentName: "Loss Runs (3 years)", evidenceText: "1 open assault and battery claim", extractionMethod: "ai", verificationStatus: "unreviewed" },
  { id: "f-hss-ab", fieldName: "openAssaultBatteryClaim", category: "Claims", normalizedValue: true, originalValue: "Yes", dataType: "boolean", confidence: 97, sourceDocumentId: "doc-hss-loss", sourceDocumentName: "Loss Runs (3 years)", evidenceText: "Open A&B claim — incident date 2025-11-14", extractionMethod: "ai", verificationStatus: "unreviewed" },
  { id: "f-hss-loc-app", fieldName: "numberOfLocationsApp", category: "Premises", normalizedValue: 1, originalValue: "1", dataType: "number", confidence: 94, sourceDocumentId: "doc-hss-app", sourceDocumentName: "Commercial Insurance Application", evidenceText: "Number of locations: 1", extractionMethod: "ai", verificationStatus: "unreviewed" },
  { id: "f-hss-loc-sch", fieldName: "numberOfLocations", category: "Premises", normalizedValue: 2, originalValue: "2", dataType: "number", confidence: 96, sourceDocumentId: "doc-hss-loc", sourceDocumentName: "Location Schedule", evidenceText: "Location 1: 120 Harbor Street; Location 2: 88 Pier Avenue", extractionMethod: "ai", verificationStatus: "unreviewed" },
  { id: "f-hss-loss-yrs", fieldName: "lossRunsYears", category: "Claims", normalizedValue: 3, originalValue: "3", dataType: "number", confidence: 99, sourceDocumentId: "doc-hss-loss", sourceDocumentName: "Loss Runs (3 years)", evidenceText: "Loss runs cover 2023–2025", extractionMethod: "rule", verificationStatus: "confirmed" },
  { id: "f-hss-occ", fieldName: "maxOccupancy", category: "Premises", normalizedValue: null, originalValue: null, dataType: "number", confidence: 0, sourceDocumentId: "doc-hss-app", sourceDocumentName: "Commercial Insurance Application", evidenceText: "Not found", extractionMethod: "ai", verificationStatus: "unreviewed" },
  { id: "f-hss-sec", fieldName: "securityPersonnel", category: "Security", normalizedValue: true, originalValue: "Yes", dataType: "boolean", confidence: 85, sourceDocumentId: "doc-hss-supp", sourceDocumentName: "Restaurant Supplemental Questionnaire", evidenceText: "Security personnel on weekends", extractionMethod: "ai", verificationStatus: "unreviewed" },
  { id: "f-hss-armed", fieldName: "armedSecurity", category: "Security", normalizedValue: null, originalValue: "Unknown", dataType: "boolean", confidence: 40, sourceDocumentId: "doc-hss-supp", sourceDocumentName: "Restaurant Supplemental Questionnaire", evidenceText: "Armed/unarmed status not confirmed", extractionMethod: "ai", verificationStatus: "unreviewed" },
  { id: "f-hss-yrs", fieldName: "yearsInBusiness", category: "Business Identity", normalizedValue: 6, originalValue: "6", dataType: "number", confidence: 95, sourceDocumentId: "doc-hss-app", sourceDocumentName: "Commercial Insurance Application", evidenceText: "Year established: 2020", extractionMethod: "seeded", verificationStatus: "confirmed" },
  { id: "f-hss-limit", fieldName: "excessLimit", category: "Coverage", normalizedValue: 5000000, originalValue: "$5,000,000", dataType: "currency", confidence: 98, sourceDocumentId: "doc-hss-app", sourceDocumentName: "Commercial Insurance Application", evidenceText: "Requested excess limit: $5,000,000", extractionMethod: "seeded", verificationStatus: "confirmed" },
];

export const harborStreetContradictions: Contradiction[] = [
  {
    id: "c-hss-001", fieldName: "annualRevenue", normalizedValueA: "$3,800,000", normalizedValueB: "$5,100,000",
    evidenceA: { documentId: "doc-hss-app", documentName: "Commercial Insurance Application", pageNumber: 4, excerpt: "Annual gross revenue: $3.8 million", confidence: 94 },
    evidenceB: { documentId: "doc-hss-exp", documentName: "Exposure Spreadsheet", excerpt: "Total revenue: $5,100,000", confidence: 96 },
    severity: "critical", explanation: "Application and exposure spreadsheet report different annual revenue figures.",
    underwritingImpact: "Revenue drives GL and liquor liability premium; material variance affects pricing confidence.",
    recommendedResolution: "Request broker confirmation of current annual revenue with supporting financial statement.",
    status: "open",
  },
  {
    id: "c-hss-002", fieldName: "alcoholSalesPct", normalizedValueA: "15%", normalizedValueB: "38%",
    evidenceA: { documentId: "doc-hss-app", documentName: "Commercial Insurance Application", excerpt: "Alcohol sales: 15%", confidence: 92 },
    evidenceB: { documentId: "doc-hss-supp", documentName: "Restaurant Supplemental Questionnaire", excerpt: "Alcohol sales approximately 38%", confidence: 95 },
    severity: "high", explanation: "Alcohol sales percentage differs materially between application and supplemental.",
    underwritingImpact: "Alcohol mix affects liquor liability appetite and schedule rating.",
    recommendedResolution: "Confirm actual alcohol sales percentage for most recent 12 months.",
    status: "open",
  },
  {
    id: "c-hss-003", fieldName: "closingTime", normalizedValueA: "Midnight", normalizedValueB: "2:00 a.m.",
    evidenceA: { documentId: "doc-hss-app", documentName: "Commercial Insurance Application", excerpt: "Closing time: Midnight", confidence: 90 },
    evidenceB: { documentId: "doc-hss-web", documentName: "Website Snapshot", excerpt: "Open until 2:00 a.m. Friday and Saturday", confidence: 88 },
    severity: "medium", explanation: "Application states midnight closing; website advertises 2:00 a.m. hours.",
    underwritingImpact: "Late-night operations require referral per appetite guidelines.",
    recommendedResolution: "Confirm standard and weekend closing times.",
    status: "open",
  },
  {
    id: "c-hss-004", fieldName: "liveEntertainment", normalizedValueA: "No", normalizedValueB: "Yes",
    evidenceA: { documentId: "doc-hss-app", documentName: "Commercial Insurance Application", excerpt: "Live entertainment: No", confidence: 91 },
    evidenceB: { documentId: "doc-hss-web", documentName: "Website Snapshot", excerpt: "Live music three nights per week", confidence: 93 },
    severity: "high", explanation: "Application denies live entertainment; website advertises live music.",
    underwritingImpact: "Live entertainment requires supplemental questionnaire and schedule debit.",
    recommendedResolution: "Confirm entertainment schedule, type, and crowd control measures.",
    status: "open",
  },
  {
    id: "c-hss-005", fieldName: "openClaims", normalizedValueA: "0", normalizedValueB: "1",
    evidenceA: { documentId: "doc-hss-app", documentName: "Commercial Insurance Application", excerpt: "Open claims: None", confidence: 89 },
    evidenceB: { documentId: "doc-hss-loss", documentName: "Loss Runs (3 years)", excerpt: "1 open assault and battery claim", confidence: 97 },
    severity: "critical", explanation: "Application states no open claims; loss runs show open A&B claim.",
    underwritingImpact: "Open A&B claim requires referral and experience rating debit.",
    recommendedResolution: "Request updated loss runs and claim status letter.",
    status: "open",
  },
  {
    id: "c-hss-006", fieldName: "numberOfLocations", normalizedValueA: "1", normalizedValueB: "2",
    evidenceA: { documentId: "doc-hss-app", documentName: "Commercial Insurance Application", excerpt: "Number of locations: 1", confidence: 94 },
    evidenceB: { documentId: "doc-hss-loc", documentName: "Location Schedule", excerpt: "Two locations listed", confidence: 96 },
    severity: "high", explanation: "Application lists one location; location schedule shows two.",
    underwritingImpact: "Multi-location exposure affects premium and requires complete schedule.",
    recommendedResolution: "Confirm all operating locations and provide schedule for each.",
    status: "open",
  },
];

export const harborStreetMissing: MissingItem[] = [
  { id: "m-hss-001", fieldName: "maxOccupancy", category: "Premises", reasonRequired: "Required for premises hazard evaluation and capacity-related liability assessment.", severity: "critical", relatedRuleId: "rule-rst-009", brokerQuestion: "Please provide the maximum occupancy for each location, including any outdoor seating areas.", status: "open" },
  { id: "m-hss-002", fieldName: "lossRuns5Year", category: "Claims", reasonRequired: "Five years of currently valued loss runs are required per underwriting guidelines.", severity: "critical", relatedRuleId: "rule-rst-001", brokerQuestion: "Please provide five years of currently valued loss runs for Harbor Street Social LLC.", status: "requested" },
  { id: "m-hss-003", fieldName: "armedSecurityStatus", category: "Security", reasonRequired: "Security personnel mentioned but armed/unarmed status not confirmed.", severity: "high", relatedRuleId: "rule-rst-005", brokerQuestion: "Please confirm whether security personnel are armed or unarmed, including hours of coverage.", status: "open" },
  { id: "m-hss-004", fieldName: "entertainmentSupplemental", category: "Operations", reasonRequired: "Live entertainment indicated on website; supplemental questionnaire required.", severity: "medium", relatedRuleId: "rule-rst-004", brokerQuestion: "Please complete the live entertainment supplemental questionnaire, including performance schedule and crowd control procedures.", status: "open" },
];
