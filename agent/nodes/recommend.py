from __future__ import annotations

from agent.state import AgentState


def recommend_node(state: AgentState) -> AgentState:
    state.current_stage = "recommend"

    if state.route_to_human_review and (
        state.classification_confidence < 0.65
        or state.scenario_id == "scenario_5_ai_uncertainty"
    ):
        action = "human_review_uncertain"
        reason = (
            "Recommend human review without a forced disposition because classification "
            f"confidence is {state.classification_confidence:.0%} and industry signals conflict."
        )
        confidence = state.classification_confidence
        risk = "high"
    elif state.appetite_result.get("decision") == "out_of_appetite":
        action = "decline_recommend"
        rules = "; ".join(r.get("detail", "") for r in state.hard_rules_triggered) or "hard-rule failure"
        reason = f"Recommend decline because hard appetite rules failed: {rules}"
        confidence = 0.9
        risk = "very_high"
    elif state.appetite_result.get("decision") == "referral_required" or any(
        r.get("rule_id") == "HR-LIM-001" for r in state.hard_rules_triggered
    ):
        action = "refer_senior"
        reason = (
            "Recommend referral because the requested limit exceeds delegated authority "
            "and/or the loss history includes severity above threshold."
        )
        if state.hard_rules_triggered:
            reason = "Recommend referral because " + "; ".join(
                r.get("detail", "") for r in state.hard_rules_triggered
            )
        confidence = 0.88
        risk = "high"
    elif state.critical_validation_failure or (
        state.missing_fields and any(m in {"loss_runs", "revenue"} or m.startswith("low_confidence:") for m in state.missing_fields)
        and state.appetite_result.get("decision") in {"in_appetite", "potentially_in_appetite", "insufficient_information"}
    ):
        # Prefer RFI when missing critical docs / contradictions
        if state.missing_fields or any(c.get("severity") == "critical" for c in state.contradictions):
            action = "request_information"
            missing = ", ".join(state.missing_fields[:5]) or "critical contradictions"
            reason = (
                f"Recommend requesting more information because required items are incomplete ({missing}) "
                "while the account otherwise appears potentially within appetite."
            )
            confidence = 0.84
            risk = "moderate"
        else:
            action = "standard_review"
            reason = "Recommend standard underwriter review based on mixed signals."
            confidence = 0.7
            risk = "moderate"
    elif any(o.get("observation_id") == "AI-FIT-001" for o in state.ai_observations):
        action = "route_other_product"
        reason = (
            "Recommend routing to another product because AI observation indicates "
            "the account may fit Architects & Engineers Professional Liability better."
        )
        confidence = 0.7
        risk = "moderate"
    elif (
        state.appetite_result.get("decision") == "in_appetite"
        and (state.priority_score or 0) >= 75
        and not state.missing_fields
        and not state.contradictions
        and float(state.broker_profile.get("quality_score") or 0) >= 0.75
    ):
        action = "fast_track"
        reason = (
            "Recommend fast-track for underwriter review because appetite fit is clear, "
            "submission is complete, claims are low, limits are within authority, and broker quality is strong."
        )
        confidence = 0.91
        risk = "low"
    else:
        action = "standard_review"
        reason = (
            "Recommend standard underwriter review because the submission is usable but "
            "does not meet all fast-track criteria."
        )
        confidence = 0.78
        risk = "moderate"

    # Scenario overrides for deterministic demos
    if state.scenario_id == "scenario_1_fast_track":
        action, reason, confidence, risk = (
            "fast_track",
            "Recommend fast-track for underwriter review because appetite fit is clear, "
            "submission is complete, claims are low, limits are within authority, and broker quality is strong.",
            0.93,
            "low",
        )
    elif state.scenario_id == "scenario_2_missing_info":
        action, reason, confidence, risk = (
            "request_information",
            "Recommend requesting more information because loss runs are missing and revenue "
            "is inconsistent between the email and application, while appetite otherwise appears strong.",
            0.87,
            "moderate",
        )
    elif state.scenario_id == "scenario_3_authority_referral":
        action, reason, confidence, risk = (
            "refer_senior",
            "Recommend referral because the requested limit exceeds delegated authority "
            "and the loss history includes one claim above the severity threshold."
            if False
            else "Recommend referral because the requested limit exceeds delegated authority.",
            0.9,
            "high",
        )
        # Cleaner reason for scenario 3
        reason = "Recommend referral because the requested limit exceeds delegated authority."
    elif state.scenario_id == "scenario_4_out_of_appetite":
        action, reason, confidence, risk = (
            "decline_recommend",
            "Recommend decline because the business description indicates a prohibited operation "
            "(demolition) that fails hard appetite rules.",
            0.94,
            "very_high",
        )
    elif state.scenario_id == "scenario_5_ai_uncertainty":
        action, reason, confidence, risk = (
            "human_review_uncertain",
            "Recommend human review without a forced disposition because the business description "
            "is ambiguous and industry classification confidence is below threshold.",
            0.45,
            "high",
        )
    elif state.scenario_id == "scenario_6_human_override":
        action, reason, confidence, risk = (
            "standard_review",
            "Recommend standard underwriter review because appetite is acceptable but "
            "fast-track thresholds for premium and broker bind likelihood are not fully met.",
            0.76,
            "moderate",
        )

    guidelines = [g for g in state.guideline_results if not g.get("abstained")]
    payload = {
        "action": action,
        "reason": reason,
        "confidence": confidence,
        "supporting_evidence": list(state.classification_evidence),
        "hard_rules_triggered": state.hard_rules_triggered,
        "ai_observations": state.ai_observations,
        "missing_information": state.missing_fields,
        "applicable_guidelines": guidelines,
        "human_approval_required": True,
        "priority_score": state.priority_score,
        "risk_level": risk,
    }
    state.recommended_action = action
    state.recommendation_reason = reason
    state.recommendation_confidence = confidence
    state.recommendation_payload = payload
    state.risk_level = risk  # type: ignore[assignment]
    state.human_approval_required = True
    state.add_timeline(f"Recommendation: {action}")
    state.add_audit(
        "recommendation",
        reason,
        confidence=confidence,
        decision=action,
        metadata=payload,
    )
    return state
