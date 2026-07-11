from __future__ import annotations

"""Synthetic demo scenarios for the Submission Intelligence Agent."""

from typing import Any, Dict, List


def all_scenarios() -> List[Dict[str, Any]]:
    return [
        scenario_1_fast_track(),
        scenario_2_missing_info(),
        scenario_3_authority_referral(),
        scenario_4_out_of_appetite(),
        scenario_5_ai_uncertainty(),
        scenario_6_human_override(),
    ]


def get_scenario(scenario_id: str) -> Dict[str, Any]:
    for s in all_scenarios():
        if s["scenario_id"] == scenario_id:
            return s
    raise KeyError(f"Unknown scenario: {scenario_id}")


def scenario_1_fast_track() -> Dict[str, Any]:
    return {
        "scenario_id": "scenario_1_fast_track",
        "title": "Clean fast-track submission",
        "expected_action": "fast_track",
        "description": "Strong broker, complete package, clear appetite fit, low claims, normal limits.",
        "email_text": """From: Jordan Lee <jlee@harborpeak.example>
Subject: New GL submission — Cedar Grove Property Services LLC

Hi Underwriting,

Please find a complete General Liability submission for Cedar Grove Property Services LLC (TX).
Insured: Cedar Grove Property Services LLC
Broker: Harbor Peak Brokerage
Requested action: quote
Effective Date target: 2026-09-01
[EMAIL_REVENUE] $4,200,000
[EMAIL_LIMITS] $1,000,000/$2,000,000

Attachments: CedarGrove_ACORD.pdf, CedarGrove_LossRuns.pdf, CedarGrove_Supplemental.pdf

Thanks,
Jordan Lee
Harbor Peak Brokerage
""",
        "email_metadata": {"broker": "Harbor Peak Brokerage", "insured": "Cedar Grove Property Services LLC"},
        "attachments": [
            {
                "filename": "CedarGrove_ACORD.pdf",
                "text": """ACORD Application for Insurance
Named Insured: Cedar Grove Property Services LLC
DBA: Cedar Grove Cleaning
Address: 1200 Commerce Blvd, Dallas, TX 75201
State: TX
Business Description: Commercial janitorial services for office campuses
NAICS: 561720
Revenue: $4,200,000
Payroll: $1,100,000
Years in Business: 14
Effective Date: 2026-09-01
Requested Limits: $1,000,000 / $2,000,000
Deductible: $5,000
Prior Carrier: Contour Specialty
Prior Premium: $48,500
Broker: Harbor Peak Brokerage
Broker Contact: Jordan Lee jlee@harborpeak.example
Risk Control: Documented safety training and incident reporting program
""",
            },
            {
                "filename": "CedarGrove_LossRuns.pdf",
                "text": """Loss Run — Claims Experience
Named Insured: Cedar Grove Property Services LLC
Claim Count: 1
Total Incurred: $12,400
Largest Loss: $12,400
Loss history period: 2021-2025 complete
""",
            },
            {
                "filename": "CedarGrove_Supplemental.pdf",
                "text": """Supplemental Application
Additional Underwriting Questions completed.
Safety Program: Yes — weekly toolbox talks.
""",
            },
        ],
    }


def scenario_2_missing_info() -> Dict[str, Any]:
    return {
        "scenario_id": "scenario_2_missing_info",
        "title": "Missing information",
        "expected_action": "request_information",
        "description": "Missing loss runs, inconsistent revenue, strong appetite otherwise.",
        "email_text": """From: Ava Chen <achen@summitwholesale.example>
Subject: GL — Lakeside Facilities Management

Please quote General Liability for Lakeside Facilities Management in Florida.
Insured: Lakeside Facilities Management
Broker: Summit Wholesale Partners
[EMAIL_REVENUE] $3,100,000
[EMAIL_LIMITS] $1,000,000/$2,000,000

We are still collecting loss runs and will send ASAP.

Attachments: Lakeside_ACORD.pdf
""",
        "email_metadata": {"broker": "Summit Wholesale Partners", "insured": "Lakeside Facilities Management"},
        "attachments": [
            {
                "filename": "Lakeside_ACORD.pdf",
                "text": """ACORD Application for Insurance
Named Insured: Lakeside Facilities Management
Address: 88 Bayfront Ave, Tampa, FL 33602
State: FL
Business Description: Facilities maintenance for commercial properties
Revenue: $2,400,000
Years in Business: 11
Effective Date: 2026-10-15
Requested Limits: $1,000,000 / $2,000,000
Prior Carrier: Atlas Mutual
Prior Premium: $36,000
Broker: Summit Wholesale Partners
""",
            }
        ],
    }


def scenario_3_authority_referral() -> Dict[str, Any]:
    return {
        "scenario_id": "scenario_3_authority_referral",
        "title": "Authority referral",
        "expected_action": "refer_senior",
        "description": "Good risk but requested limit above delegated authority.",
        "email_text": """From: Jordan Lee <jlee@harborpeak.example>
Subject: Excess / high limit GL — Nova Components Inc

Need terms for Nova Components Inc (OH). Strong account, low frequency.
Insured: Nova Components Inc
Broker: Harbor Peak Brokerage
[EMAIL_LIMITS] $5,000,000/$5,000,000

Attachments: Nova_ACORD.pdf, Nova_LossRuns.pdf
""",
        "email_metadata": {"broker": "Harbor Peak Brokerage", "insured": "Nova Components Inc"},
        "attachments": [
            {
                "filename": "Nova_ACORD.pdf",
                "text": """ACORD Application for Insurance
Named Insured: Nova Components Inc
Address: 500 Industrial Pkwy, Columbus, OH 43215
State: OH
Business Description: Component manufacturer for industrial equipment
NAICS: 333999
Revenue: $28,000,000
Years in Business: 22
Effective Date: 2026-11-01
Requested Limits: $5,000,000 / $5,000,000
Deductible: $25,000
Prior Carrier: Northbridge
Prior Premium: $210,000
Broker: Harbor Peak Brokerage
Risk Control: ISO-aligned quality and safety program
""",
            },
            {
                "filename": "Nova_LossRuns.pdf",
                "text": """Loss Run
Claim Count: 2
Total Incurred: $95,000
Largest Loss: $70,000
""",
            },
        ],
    }


def scenario_4_out_of_appetite() -> Dict[str, Any]:
    return {
        "scenario_id": "scenario_4_out_of_appetite",
        "title": "Out-of-appetite risk",
        "expected_action": "decline_recommend",
        "description": "Excluded demolition operation — clear hard-rule failure.",
        "email_text": """From: Sam Ortiz <sortiz@northline.example>
Subject: GL submission — IronSpan Demolition Co

Please consider General Liability for IronSpan Demolition Co (AZ).
Insured: IronSpan Demolition Co
Broker: Northline Specialty

Attachments: IronSpan_ACORD.pdf
""",
        "email_metadata": {"broker": "Northline Specialty", "insured": "IronSpan Demolition Co"},
        "attachments": [
            {
                "filename": "IronSpan_ACORD.pdf",
                "text": """ACORD Application for Insurance
Named Insured: IronSpan Demolition Co
Address: 14 Quarry Rd, Phoenix, AZ 85003
State: AZ
Business Description: Structural demolition contractor — wrecking and site clearing
Revenue: $6,500,000
Years in Business: 6
Effective Date: 2026-08-01
Requested Limits: $1,000,000 / $2,000,000
Prior Carrier: Nonrenewed
Prior Premium: $190,000
Broker: Northline Specialty
Claim Count: 4
Total Incurred Losses: $620,000
Largest Loss: $310,000
""",
            }
        ],
    }


def scenario_5_ai_uncertainty() -> Dict[str, Any]:
    return {
        "scenario_id": "scenario_5_ai_uncertainty",
        "title": "AI uncertainty",
        "expected_action": "human_review_uncertain",
        "description": "Ambiguous business description and conflicting industry classification.",
        "email_text": """From: Priya Nair <pnair@cascaderisk.example>
Subject: Need help classifying — Ambiguous Ventures LLC

Not sure if this is GL or products. Ambiguous business description.
Insured: Ambiguous Ventures LLC
Broker: Cascade Risk Intermediaries

Attachments: Ambiguous_ACORD.pdf
""",
        "email_metadata": {"broker": "Cascade Risk Intermediaries", "insured": "Ambiguous Ventures LLC"},
        "attachments": [
            {
                "filename": "Ambiguous_ACORD.pdf",
                "text": """ACORD Application for Insurance
Named Insured: Ambiguous Ventures LLC
Address: 9 Market Street, Chicago, IL 60601
State: IL
Business Description: Ambiguous business description — retail storefront with light assembly and occasional product distribution; industry classification conflicting between retail and manufacturing
Revenue: $1,800,000
Years in Business: 3
Effective Date: 2026-12-01
Requested Limits: $1,000,000 / $2,000,000
Broker: Cascade Risk Intermediaries
""",
            }
        ],
    }


def scenario_6_human_override() -> Dict[str, Any]:
    return {
        "scenario_id": "scenario_6_human_override",
        "title": "Human override with positive outcome",
        "expected_action": "standard_review",
        "description": "Agent recommends standard review; senior may fast-track; bind performs well.",
        "email_text": """From: Ava Chen <achen@summitwholesale.example>
Subject: A&E PL — Brightline Design Group

Architects & Engineers professional liability submission for Brightline Design Group (CA).
Insured: Brightline Design Group
Broker: Summit Wholesale Partners
[EMAIL_LIMITS] $1,000,000/$1,000,000

Attachments: Brightline_ACORD.pdf, Brightline_LossRuns.pdf, Brightline_Supplemental.pdf
""",
        "email_metadata": {"broker": "Summit Wholesale Partners", "insured": "Brightline Design Group"},
        "attachments": [
            {
                "filename": "Brightline_ACORD.pdf",
                "text": """ACORD Application for Insurance
Named Insured: Brightline Design Group
Address: 400 Market St, San Francisco, CA 94105
State: CA
Business Description: Architecture and engineering design firm for commercial interiors
NAICS: 541310
Revenue: $7,800,000
Years in Business: 9
Effective Date: 2026-09-15
Requested Limits: $1,000,000 / $1,000,000
Prior Carrier: DesignPro
Prior Premium: $62,000
Broker: Summit Wholesale Partners
Broker Contact: Ava Chen
Risk Control: Peer review and contract limitation of liability on all projects
""",
            },
            {
                "filename": "Brightline_LossRuns.pdf",
                "text": """Loss Run
Claim Count: 0
Total Incurred: $0
Largest Loss: $0
""",
            },
            {
                "filename": "Brightline_Supplemental.pdf",
                "text": """Supplemental Application
A&E supplemental completed. Design-build: No.
""",
            },
        ],
        "suggested_outcome": {
            "status": "bound",
            "premium": 58000,
            "time_to_quote_hours": 6,
            "underwriter_effort_hours": 1.5,
            "claim_count": 0,
            "incurred_losses": 0,
            "loss_ratio": 0.12,
            "renewal_status": "renewed",
            "notes": "Senior underwriter fast-tracked over agent standard_review; account performed well.",
        },
    }
