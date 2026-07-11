from __future__ import annotations

from agent.state import AgentState
from agent.validators import validate_submission


def validate_node(state: AgentState) -> AgentState:
    state.current_stage = "validate"
    missing, contradictions, severity, critical = validate_submission(
        state.extracted_fields,
        state.field_confidence,
        state.field_sources,
        state.attachments,
    )
    state.missing_fields = missing
    state.contradictions = contradictions
    state.validation_severity = severity
    state.critical_validation_failure = critical
    if critical:
        state.route_to_human_review = True
        state.add_timeline("Critical contradiction detected — automated path paused for human review")
        state.add_audit(
            "validation",
            "Critical validation failure",
            decision="human_review",
            metadata={"contradictions": contradictions, "missing": missing},
        )
    else:
        state.add_timeline(
            f"Validation complete: {len(missing)} missing, {len(contradictions)} contradictions ({severity})"
        )
        state.add_audit(
            "validation",
            "Validation checks completed",
            metadata={"missing": missing, "contradictions": contradictions, "severity": severity},
        )
    return state
