from __future__ import annotations

"""Deterministic validators for contradictions and missing fields."""

from datetime import datetime
from typing import Any, Dict, List, Tuple

from agent.policies import CRITICAL_FIELDS, FIELD_CONFIDENCE_THRESHOLD


def detect_prompt_injection(text: str) -> bool:
    from agent.prompts import INJECTION_PATTERNS

    lowered = (text or "").lower()
    return any(p in lowered for p in INJECTION_PATTERNS)


def validate_submission(
    extracted: Dict[str, Any],
    field_confidence: Dict[str, float],
    field_sources: Dict[str, List[str]],
    attachments: List[Dict[str, Any]],
) -> Tuple[List[str], List[Dict[str, Any]], str, bool]:
    """Return missing_fields, contradictions, severity, critical_failure."""
    missing: List[str] = []
    contradictions: List[Dict[str, Any]] = []

    required = [
        "insured_name",
        "business_description",
        "state",
        "revenue",
        "requested_limits",
        "requested_effective_date",
        "broker_name",
    ]
    for field in required:
        if field not in extracted or extracted[field] in (None, "", []):
            missing.append(field)

    doc_types = {a.get("document_type") for a in attachments}
    if "loss_run" not in doc_types and extracted.get("claim_count") is None:
        missing.append("loss_runs")

    # Revenue conflict between email and application
    email_rev = extracted.get("revenue_email")
    app_rev = extracted.get("revenue")
    if email_rev is not None and app_rev is not None and email_rev != app_rev:
        contradictions.append(
            {
                "field": "revenue",
                "description": "Revenue differs between email and application.",
                "severity": "critical",
                "values": [
                    {"source": "email", "value": email_rev},
                    {"source": "application", "value": app_rev},
                ],
                "recommended_resolution": "Confirm revenue with broker before quoting.",
                "sources": field_sources.get("revenue", []) + field_sources.get("revenue_email", []),
            }
        )

    email_limit = extracted.get("requested_limits_email")
    app_limit = extracted.get("requested_limits")
    if email_limit and app_limit and email_limit != app_limit:
        contradictions.append(
            {
                "field": "requested_limits",
                "description": "Requested limit differs between application and email.",
                "severity": "warning",
                "values": [
                    {"source": "email", "value": email_limit},
                    {"source": "application", "value": app_limit},
                ],
                "recommended_resolution": "Clarify requested limits with broker.",
                "sources": field_sources.get("requested_limits", []),
            }
        )

    eff = extracted.get("requested_effective_date")
    if eff:
        try:
            eff_dt = datetime.fromisoformat(str(eff).replace("Z", ""))
            if eff_dt.date() < datetime.utcnow().date():
                contradictions.append(
                    {
                        "field": "requested_effective_date",
                        "description": "Effective date is already in the past.",
                        "severity": "warning",
                        "values": [{"source": "application", "value": eff}],
                        "recommended_resolution": "Request updated effective date.",
                        "sources": field_sources.get("requested_effective_date", []),
                    }
                )
        except ValueError:
            pass

    claim_count = extracted.get("claim_count")
    total_incurred = extracted.get("total_incurred_losses")
    largest = extracted.get("largest_loss")
    if (
        claim_count is not None
        and total_incurred is not None
        and largest is not None
        and claim_count > 0
        and largest > total_incurred
    ):
        contradictions.append(
            {
                "field": "total_incurred_losses",
                "description": "Claim totals do not reconcile: largest loss exceeds total incurred.",
                "severity": "critical",
                "values": [
                    {"source": "loss_run", "value": f"largest={largest}"},
                    {"source": "loss_run", "value": f"total={total_incurred}"},
                ],
                "recommended_resolution": "Request corrected loss runs.",
                "sources": field_sources.get("largest_loss", []),
            }
        )

    state = extracted.get("state")
    address = str(extracted.get("address", ""))
    if state and address and f", {state}" not in address and f" {state} " not in f" {address} ":
        # Soft check — only flag if address embeds a different 2-letter state token
        import re

        embedded = re.findall(r"\b([A-Z]{2})\b", address)
        if embedded and state not in embedded:
            contradictions.append(
                {
                    "field": "state",
                    "description": "State conflicts with address.",
                    "severity": "warning",
                    "values": [
                        {"source": "application", "value": state},
                        {"source": "address", "value": address},
                    ],
                    "recommended_resolution": "Confirm insured location.",
                    "sources": field_sources.get("state", []),
                }
            )

    for field in CRITICAL_FIELDS:
        conf = field_confidence.get(field)
        if conf is not None and conf < FIELD_CONFIDENCE_THRESHOLD:
            if field not in missing:
                missing.append(f"low_confidence:{field}")

    severities = [c["severity"] for c in contradictions]
    if "critical" in severities:
        severity = "critical"
        critical = True
    elif "warning" in severities or missing:
        severity = "warning"
        critical = False
    else:
        severity = "ok"
        critical = False

    return missing, contradictions, severity, critical
