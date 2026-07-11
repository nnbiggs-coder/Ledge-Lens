from __future__ import annotations

from agent.state import AgentState
from tools.registry import get_registry


def triage_node(state: AgentState) -> AgentState:
    state.current_stage = "triage"
    registry = get_registry()

    appetite = state.appetite_result.get("decision")
    appetite_fit = {
        "in_appetite": 1.0,
        "potentially_in_appetite": 0.7,
        "referral_required": 0.55,
        "insufficient_information": 0.35,
        "out_of_appetite": 0.1,
    }.get(appetite, 0.5)

    required = ["insured_name", "revenue", "state", "business_description", "requested_limits", "loss_runs"]
    present = 0
    for r in required:
        if r == "loss_runs":
            if any(a.get("document_type") == "loss_run" for a in state.attachments) or state.extracted_fields.get(
                "claim_count"
            ) is not None:
                present += 1
        elif state.extracted_fields.get(r) not in (None, ""):
            present += 1
    completeness = present / len(required)

    prior_premium = float(state.extracted_fields.get("prior_premium") or 0)
    expected_premium = min(1.0, prior_premium / 100_000) if prior_premium else 0.45
    broker_quality = float(state.broker_profile.get("quality_score") or 0.6)
    bind_rate = float(state.broker_profile.get("bind_rate") or 0.3)
    risk_quality = 0.8
    if state.hard_rules_triggered:
        risk_quality -= 0.15 * min(3, len(state.hard_rules_triggered))
    if float(state.extracted_fields.get("largest_loss") or 0) > 100_000:
        risk_quality -= 0.2
    risk_quality = max(0.1, min(1.0, risk_quality))

    portfolio_fit = 0.75 if appetite in {"in_appetite", "potentially_in_appetite"} else 0.4
    referral_complexity = 1.0 if appetite == "referral_required" else 0.2 if state.missing_fields else 0.0
    time_sensitivity = 1.0 if "urgent" in (state.email_text or "").lower() else 0.2

    factors = {
        "appetite_fit": appetite_fit,
        "submission_completeness": completeness,
        "expected_premium": expected_premium,
        "broker_quality": broker_quality,
        "likelihood_to_bind": bind_rate,
        "portfolio_fit": portfolio_fit,
        "risk_quality": risk_quality,
        "time_sensitivity": time_sensitivity,
        "underwriter_workload": 0.3,
        "referral_complexity": referral_complexity,
    }
    result = registry.invoke("calculate_priority_score", factors=factors)
    state.priority_score = result["total_score"]
    state.priority_breakdown = result
    state.completed_tool_calls.append({"tool": "calculate_priority_score", "output": result})
    state.add_audit(
        "tool_call",
        f"Priority score calculated: {result['total_score']}/100",
        tool_name="calculate_priority_score",
        tool_output=result,
    )
    state.add_timeline(f"Priority score {result['total_score']}/100")
    return state
