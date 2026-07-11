from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from agent.memory import MemoryFacade
from agent.state import AgentState


def learn_node(state: AgentState) -> AgentState:
    state.current_stage = "learn"
    memory = MemoryFacade()

    # Persist episodic memory of this run (not transferable insured facts)
    memory.episodic.record_episode(
        {
            "submission_id": state.submission_id,
            "scenario_id": state.scenario_id,
            "broker_name": state.extracted_fields.get("broker_name"),
            "product": state.detected_product,
            "recommended_action": state.recommended_action,
            "human_decision": state.human_decision,
            "override_reason": state.override_reason,
            "priority_score": state.priority_score,
            "outcome": state.outcome,
            "learning_insights": state.learning_insights,
        }
    )
    memory.working.set(state.model_dump())

    if state.outcome:
        from tools.registry import get_registry

        registry = get_registry()
        result = registry.invoke(
            "record_outcome",
            outcome=state.outcome,
            prior_state={
                "submission_id": state.submission_id,
                "priority_score": state.priority_score,
                "recommended_action": state.recommended_action,
                "human_decision": state.human_decision,
                "override_reason": state.override_reason,
                "detected_product": state.detected_product,
            },
        )
        state.completed_tool_calls.append({"tool": "record_outcome", "output": result})
        learning = result.get("learning_metrics", {})
        insight = {
            "insight_id": str(uuid4()),
            "submission_id": state.submission_id,
            "category": "portfolio_learning",
            "message": learning.get("recommendation_text"),
            "recommendation": learning.get("recommendation_text"),
            "supporting_metrics": learning,
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
        state.learning_insights.append(insight)
        state.add_audit(
            "learning",
            insight["message"] or "Outcome recorded",
            tool_name="record_outcome",
            tool_output=result,
        )
        state.add_timeline("Outcome recorded and learning insight generated")

    state.completed_at = datetime.utcnow().isoformat() + "Z"
    if state.started_at:
        try:
            start = datetime.fromisoformat(state.started_at.replace("Z", ""))
            end = datetime.fromisoformat(state.completed_at.replace("Z", ""))
            state.elapsed_ms = int((end - start).total_seconds() * 1000)
        except ValueError:
            pass

    state.workflow_complete = True
    state.current_stage = "complete"
    state.add_timeline("Agent run complete")
    state.add_audit("complete", "Workflow complete. Underwriter remains accountable.")
    return state
