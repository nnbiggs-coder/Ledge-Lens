from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4


def calculate_priority_score(factors: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Transparent weighted priority score. No black-box model."""
    factors = factors or {}

    weights = {
        "appetite_fit": 25,
        "submission_completeness": 15,
        "expected_premium": 15,
        "broker_quality": 15,
        "likelihood_to_bind": 10,
        "portfolio_fit": 10,
        "risk_quality": 10,
    }

    # Normalized inputs 0..1
    values = {
        "appetite_fit": float(factors.get("appetite_fit", 0.7)),
        "submission_completeness": float(factors.get("submission_completeness", 0.7)),
        "expected_premium": float(factors.get("expected_premium", 0.5)),
        "broker_quality": float(factors.get("broker_quality", 0.6)),
        "likelihood_to_bind": float(factors.get("likelihood_to_bind", 0.5)),
        "portfolio_fit": float(factors.get("portfolio_fit", 0.6)),
        "risk_quality": float(factors.get("risk_quality", 0.6)),
    }

    # Optional visible adjustments from time sensitivity / workload / referral complexity
    adjustments = {
        "time_sensitivity": float(factors.get("time_sensitivity", 0.0)) * 3,  # up to +3
        "underwriter_workload": -float(factors.get("underwriter_workload", 0.0)) * 2,  # up to -2
        "referral_complexity": -float(factors.get("referral_complexity", 0.0)) * 3,  # up to -3
    }

    factor_scores = {}
    total = 0.0
    lines: List[str] = []
    for name, weight in weights.items():
        earned = round(values[name] * weight, 1)
        factor_scores[name] = {"earned": earned, "max": weight, "input": values[name]}
        total += earned
        label = name.replace("_", " ").title()
        lines.append(f"{label:<28} {earned:>4}/{weight}")

    adj_total = sum(adjustments.values())
    total = max(0.0, min(100.0, round(total + adj_total, 1)))
    factor_scores["adjustments"] = adjustments

    explanation = "\n".join(lines + [f"{'Total':<28} {total:>4}/100"])
    return {
        "total_score": total,
        "factor_scores": factor_scores,
        "explanation": explanation,
    }


def record_outcome(
    outcome: Optional[Dict[str, Any]] = None,
    prior_state: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    outcome = outcome or {}
    prior_state = prior_state or {}
    record = {
        "outcome_id": str(uuid4()),
        "submission_id": outcome.get("submission_id") or prior_state.get("submission_id"),
        "status": outcome.get("status"),
        "premium": outcome.get("premium"),
        "time_to_quote_hours": outcome.get("time_to_quote_hours"),
        "underwriter_effort_hours": outcome.get("underwriter_effort_hours"),
        "claim_count": outcome.get("claim_count"),
        "incurred_losses": outcome.get("incurred_losses"),
        "renewal_status": outcome.get("renewal_status"),
        "loss_ratio": outcome.get("loss_ratio"),
        "recorded_at": datetime.utcnow().isoformat() + "Z",
        "notes": outcome.get("notes", ""),
    }

    learning = _learning_metrics(record, prior_state)
    return {"outcome_record": record, "learning_metrics": learning}


def _learning_metrics(record: Dict[str, Any], prior_state: Dict[str, Any]) -> Dict[str, Any]:
    priority = prior_state.get("priority_score")
    recommended = prior_state.get("recommended_action")
    human = prior_state.get("human_decision")
    override = prior_state.get("override_reason")
    product = prior_state.get("detected_product")

    insights: List[str] = []
    metrics: Dict[str, Any] = {
        "priority_was_justified": None,
        "override_outperformed": None,
        "conversion_signal": None,
    }

    status = record.get("status")
    premium = record.get("premium") or 0
    loss_ratio = record.get("loss_ratio")

    if human == "override" and status == "bound" and (loss_ratio is None or loss_ratio < 0.5):
        metrics["override_outperformed"] = True
        insights.append(
            f"Human override outperformed the agent recommendation ({recommended}). "
            f"The current scoring weight for broker quality may be too high for "
            f"{product or 'this product'} submissions. Review recommended."
        )

    if priority is not None:
        if status == "bound" and priority >= 70:
            metrics["priority_was_justified"] = True
            insights.append("High triage priority aligned with a bound account.")
        elif status in {"declined", "not_bound"} and priority >= 80:
            metrics["priority_was_justified"] = False
            insights.append("High triage priority did not convert — review scoring weights.")

    if status == "bound" and premium:
        metrics["conversion_signal"] = "positive"
    elif status in {"declined", "not_bound"}:
        metrics["conversion_signal"] = "negative"

    metrics["insights"] = insights
    metrics["recommendation_text"] = insights[0] if insights else (
        "Insufficient outcome history for a learning recommendation."
    )
    return metrics
