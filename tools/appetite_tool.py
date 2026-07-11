from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from agent.policies import (
    DELEGATED_AUTHORITY_LIMIT,
    EXCLUDED_INDUSTRIES,
    EXCLUDED_OPERATIONS,
    EXCLUDED_STATES,
    PROTECTED_FEATURES,
    SEVERITY_CLAIM_THRESHOLD,
)

RULES_PATH = Path(__file__).resolve().parents[1] / "data" / "appetite" / "rules.json"


def evaluate_appetite(
    product: str = "",
    extracted_data: Optional[Dict[str, Any]] = None,
    appetite_rules: Optional[Dict[str, Any]] = None,
    enrichment_data: Optional[Dict[str, Any]] = None,
    broker_profile: Optional[Dict[str, Any]] = None,
    portfolio_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    extracted_data = extracted_data or {}
    enrichment_data = enrichment_data or {}
    broker_profile = broker_profile or {}
    portfolio_context = portfolio_context or _default_portfolio()
    rules = appetite_rules or _load_rules()

    # Fairness: refuse protected features
    used_features = set(extracted_data.keys())
    forbidden = used_features & set(PROTECTED_FEATURES)
    if forbidden:
        return {
            "decision": "insufficient_information",
            "triggered_rules": [],
            "referral_conditions": [],
            "hard_rules": [],
            "ai_observations": [],
            "portfolio_considerations": [],
            "rationale": f"Blocked: protected features present ({sorted(forbidden)}).",
            "fairness_block": True,
        }

    hard_rules: List[Dict[str, Any]] = []
    ai_observations: List[Dict[str, Any]] = []
    portfolio: List[Dict[str, Any]] = []
    referral_conditions: List[str] = []

    state = str(extracted_data.get("state") or "").upper()
    industry = str(
        extracted_data.get("industry")
        or enrichment_data.get("industry")
        or extracted_data.get("business_description")
        or ""
    ).lower()
    operations = str(extracted_data.get("business_description") or "").lower()
    revenue = _num(extracted_data.get("revenue"))
    limits = _parse_limit(extracted_data.get("requested_limits"))
    largest_loss = _num(extracted_data.get("largest_loss"))
    claim_count = int(_num(extracted_data.get("claim_count")))

    if state in EXCLUDED_STATES or state in set(rules.get("excluded_states", [])):
        hard_rules.append(
            {
                "rule_id": "HR-STATE-001",
                "name": "Excluded state",
                "detail": f"State {state} is outside approved appetite.",
            }
        )

    for excl in list(EXCLUDED_INDUSTRIES) + list(rules.get("excluded_industries", [])):
        if excl.lower() in industry:
            hard_rules.append(
                {
                    "rule_id": "HR-IND-001",
                    "name": "Excluded industry",
                    "detail": f"Industry/operation matches excluded class: {excl}.",
                }
            )

    for excl in list(EXCLUDED_OPERATIONS) + list(rules.get("excluded_operations", [])):
        if excl.lower() in operations:
            hard_rules.append(
                {
                    "rule_id": "HR-OPS-001",
                    "name": "Prohibited operation",
                    "detail": f"Business description indicates prohibited operation: {excl}.",
                }
            )

    rev_min = rules.get("revenue_min", 500_000)
    rev_max = rules.get("revenue_max", 100_000_000)
    if revenue and (revenue < rev_min or revenue > rev_max):
        hard_rules.append(
            {
                "rule_id": "HR-REV-001",
                "name": "Revenue outside approved range",
                "detail": f"Revenue ${revenue:,.0f} outside ${rev_min:,.0f}-${rev_max:,.0f}.",
            }
        )

    authority = rules.get("delegated_authority_limit", DELEGATED_AUTHORITY_LIMIT)
    if limits and limits > authority:
        hard_rules.append(
            {
                "rule_id": "HR-LIM-001",
                "name": "Requested limit above authority",
                "detail": f"Requested limit ${limits:,.0f} exceeds delegated authority ${authority:,.0f}.",
            }
        )
        referral_conditions.append("Limit exceeds delegated authority — senior referral required.")

    if largest_loss and largest_loss >= SEVERITY_CLAIM_THRESHOLD:
        hard_rules.append(
            {
                "rule_id": "HR-CLM-001",
                "name": "Excessive claim severity",
                "detail": f"Largest loss ${largest_loss:,.0f} exceeds severity threshold.",
            }
        )
        referral_conditions.append("Loss severity above threshold.")

    supported = set(rules.get("supported_products", []))
    if product and supported and product not in supported:
        hard_rules.append(
            {
                "rule_id": "HR-PROD-001",
                "name": "Unsupported product",
                "detail": f"Product {product} is not in the approved product set.",
            }
        )

    # AI-supported observations (heuristic, labeled separately)
    if claim_count >= 3:
        ai_observations.append(
            {
                "observation_id": "AI-FREQ-001",
                "detail": "Claim frequency appears elevated relative to comparable accounts.",
                "confidence": 0.7,
            }
        )
    if "hazard" in operations or "roofing" in operations or "scaffolding" in operations:
        ai_observations.append(
            {
                "observation_id": "AI-HAZ-001",
                "detail": "Business description suggests a higher-hazard activity.",
                "confidence": 0.72,
            }
        )
    quality = float(broker_profile.get("quality_score") or 0.6)
    if quality < 0.5:
        ai_observations.append(
            {
                "observation_id": "AI-BRK-001",
                "detail": "Submission quality may be lower than expected for this broker.",
                "confidence": 0.65,
            }
        )
    if extracted_data.get("risk_control_details"):
        ai_observations.append(
            {
                "observation_id": "AI-RC-001",
                "detail": "Risk controls may mitigate an otherwise adverse characteristic.",
                "confidence": 0.6,
            }
        )
    if product == "general_liability" and "engineer" in operations:
        ai_observations.append(
            {
                "observation_id": "AI-FIT-001",
                "detail": "The account may fit Architects & Engineers Professional Liability better.",
                "confidence": 0.68,
            }
        )

    state_conc = portfolio_context.get("state_concentration", {}).get(state, 0)
    if state_conc and state_conc > 0.25:
        portfolio.append(
            {
                "factor": "state_concentration",
                "detail": f"Current {state} concentration is {state_conc:.0%} of portfolio.",
            }
        )
    portfolio.append(
        {
            "factor": "broker_relationship",
            "detail": f"Broker quality score {quality:.2f}; bind rate {broker_profile.get('bind_rate', 'n/a')}.",
        }
    )
    portfolio.append(
        {
            "factor": "expected_premium",
            "detail": f"Estimated premium signal from prior premium: {extracted_data.get('prior_premium', 'unknown')}.",
        }
    )

    decision = _decide(hard_rules, referral_conditions, ai_observations, extracted_data)
    rationale = _rationale(decision, hard_rules, referral_conditions, ai_observations)

    return {
        "decision": decision,
        "triggered_rules": hard_rules,
        "referral_conditions": referral_conditions,
        "hard_rules": hard_rules,
        "ai_observations": ai_observations,
        "portfolio_considerations": portfolio,
        "rationale": rationale,
        "fairness_block": False,
    }


def _decide(hard_rules, referral_conditions, ai_observations, extracted) -> str:
    out_ids = {"HR-STATE-001", "HR-IND-001", "HR-OPS-001", "HR-PROD-001"}
    if any(r["rule_id"] in out_ids for r in hard_rules):
        return "out_of_appetite"
    if any(r["rule_id"] == "HR-LIM-001" for r in hard_rules):
        return "referral_required"
    if any(r["rule_id"] == "HR-CLM-001" for r in hard_rules):
        return "referral_required"
    if any(r["rule_id"] == "HR-REV-001" for r in hard_rules):
        return "potentially_in_appetite"
    required = ["insured_name", "revenue", "state", "business_description"]
    if any(not extracted.get(f) for f in required):
        return "insufficient_information"
    if len(ai_observations) >= 2:
        return "potentially_in_appetite"
    return "in_appetite"


def _rationale(decision, hard_rules, referral_conditions, ai_observations) -> str:
    parts = [f"Appetite decision: {decision}."]
    if hard_rules:
        parts.append("Hard rules: " + "; ".join(r["detail"] for r in hard_rules))
    if referral_conditions:
        parts.append("Referral: " + "; ".join(referral_conditions))
    if ai_observations:
        parts.append("AI observations: " + "; ".join(o["detail"] for o in ai_observations))
    return " ".join(parts)


def _parse_limit(raw: Any) -> Optional[float]:
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        return float(raw)
    text = str(raw).replace("$", "").replace(",", "")
    if "/" in text:
        text = text.split("/")[0].strip()
    try:
        return float(text)
    except ValueError:
        return None


def _num(v: Any) -> float:
    if v is None:
        return 0.0
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(str(v).replace(",", "").replace("$", ""))
    except ValueError:
        return 0.0


def _load_rules() -> Dict[str, Any]:
    if RULES_PATH.exists():
        return json.loads(RULES_PATH.read_text())
    return {
        "excluded_states": list(EXCLUDED_STATES),
        "excluded_industries": list(EXCLUDED_INDUSTRIES),
        "excluded_operations": list(EXCLUDED_OPERATIONS),
        "revenue_min": 500_000,
        "revenue_max": 100_000_000,
        "delegated_authority_limit": DELEGATED_AUTHORITY_LIMIT,
        "supported_products": [
            "general_liability",
            "excess_casualty",
            "products_liability",
            "architects_engineers_pl",
            "miscellaneous_professional_liability",
        ],
    }


def _default_portfolio() -> Dict[str, Any]:
    return {
        "state_concentration": {"CA": 0.18, "TX": 0.22, "NY": 0.12, "FL": 0.15},
        "industry_concentration": {"construction": 0.2, "professional_services": 0.25},
        "underwriter_capacity": "available",
        "product_growth_targets": ["architects_engineers_pl", "miscellaneous_professional_liability"],
    }
