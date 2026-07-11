from __future__ import annotations

from agent.state import AgentState
from tools.registry import get_registry


def appetite_node(state: AgentState) -> AgentState:
    state.current_stage = "appetite"
    registry = get_registry()
    result = registry.invoke(
        "evaluate_appetite",
        product=state.detected_product or "",
        extracted_data=state.extracted_fields,
        enrichment_data=state.enrichment_data,
        broker_profile=state.broker_profile,
    )
    state.appetite_result = result
    state.hard_rules_triggered = result.get("hard_rules", [])
    state.ai_observations = result.get("ai_observations", [])
    state.completed_tool_calls.append({"tool": "evaluate_appetite", "output": result})
    state.add_audit(
        "tool_call",
        f"Appetite evaluation completed: {result.get('decision')}",
        tool_name="evaluate_appetite",
        tool_output=result,
        decision=result.get("decision"),
    )
    state.add_timeline(f"Appetite evaluation completed ({result.get('decision')})")
    if result.get("decision") == "referral_required":
        state.add_timeline("Senior referral identified")
    elif result.get("decision") == "out_of_appetite":
        state.add_timeline("Out-of-appetite hard rule triggered")
    return state
