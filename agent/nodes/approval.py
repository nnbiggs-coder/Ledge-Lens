from __future__ import annotations

from agent.state import AgentState
from tools.registry import get_registry


def approval_node(state: AgentState) -> AgentState:
    state.current_stage = "approval"

    if state.stop_requested:
        state.workflow_complete = True
        state.add_timeline("Execution stopped before approval")
        return state

    if not state.human_decision:
        state.awaiting_human = True
        state.add_timeline("Awaiting underwriter approval")
        state.add_audit(
            "approval_gate",
            "Human approval required before material workflow actions.",
            decision="awaiting_human",
        )
        return state

    # Human decision already present (resume path)
    state.awaiting_human = False
    registry = get_registry()
    result = registry.invoke(
        "record_human_decision",
        decision={
            "submission_id": state.submission_id,
            "user": state.human_user or "underwriter",
            "decision": state.human_decision,
            "final_action": state.human_final_action or state.recommended_action,
            "override_reason": state.override_reason,
            "evidence_reviewed": [
                "recommendation",
                "appetite_result",
                "guideline_citations",
                "priority_breakdown",
            ],
            "approval_authority": "underwriter",
        },
    )
    state.completed_tool_calls.append({"tool": "record_human_decision", "output": result})
    state.add_audit(
        "human_decision",
        f"Underwriter decision: {state.human_decision}",
        actor=state.human_user or "underwriter",
        decision=state.human_decision,
        tool_name="record_human_decision",
        tool_output=result,
        metadata={"override_reason": state.override_reason},
    )
    state.add_timeline(f"Human decision recorded: {state.human_decision}")

    if state.human_decision in {"reject", "stop"}:
        state.workflow_complete = True
        state.current_stage = "stopped"
        state.add_timeline("Workflow closed without execution")
    elif state.human_decision == "investigate":
        state.add_timeline("Further investigation requested — returning to enrichment")
    return state
