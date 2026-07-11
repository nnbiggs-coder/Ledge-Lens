from __future__ import annotations

"""Build and run the Submission Intelligence Agent graph."""

from typing import Any, Dict, Optional

from agent.graph_runtime import END, StateGraph
from agent.nodes import (
    appetite_node,
    approval_node,
    classify_documents_node,
    classify_submission_node,
    enrich_node,
    execute_node,
    extract_fields_node,
    guidance_node,
    intake_node,
    learn_node,
    recommend_node,
    triage_node,
    validate_node,
)
from agent.state import AgentState


def _after_validate(state: AgentState) -> str:
    if state.stop_requested:
        return "stop"
    if state.critical_validation_failure:
        return "human"
    return "continue"


def _after_classify(state: AgentState) -> str:
    if state.route_to_human_review and state.classification_confidence < 0.65:
        # Still continue through extraction for observability, but flag for uncertain recommendation
        return "continue"
    return "continue"


def _after_approval(state: AgentState) -> str:
    if state.awaiting_human:
        return "wait"
    if state.human_decision == "investigate":
        return "investigate"
    if state.human_decision in {"approve", "override", "modify"}:
        return "execute"
    return "stop"


def build_graph() -> Any:
    graph = StateGraph(AgentState)
    graph.add_node("intake", intake_node)
    graph.add_node("classify_submission", classify_submission_node)
    graph.add_node("classify_documents", classify_documents_node)
    graph.add_node("extract", extract_fields_node)
    graph.add_node("validate", validate_node)
    graph.add_node("enrich", enrich_node)
    graph.add_node("appetite", appetite_node)
    graph.add_node("guidance", guidance_node)
    graph.add_node("triage", triage_node)
    graph.add_node("recommend", recommend_node)
    graph.add_node("approval", approval_node)
    graph.add_node("execute", execute_node)
    graph.add_node("learn", learn_node)

    graph.set_entry_point("intake")
    graph.add_edge("intake", "classify_submission")
    graph.add_conditional_edges(
        "classify_submission",
        _after_classify,
        {"continue": "classify_documents", "human": "recommend"},
    )
    graph.add_edge("classify_documents", "extract")
    graph.add_edge("extract", "validate")
    graph.add_conditional_edges(
        "validate",
        _after_validate,
        {
            "continue": "enrich",
            "human": "recommend",
            "stop": END,
        },
    )
    graph.add_edge("enrich", "appetite")
    graph.add_edge("appetite", "guidance")
    graph.add_edge("guidance", "triage")
    graph.add_edge("triage", "recommend")
    graph.add_edge("recommend", "approval")
    graph.add_conditional_edges(
        "approval",
        _after_approval,
        {
            "wait": END,
            "execute": "execute",
            "investigate": "enrich",
            "stop": "learn",
        },
    )
    graph.add_edge("execute", "learn")
    graph.add_edge("learn", END)
    return graph.compile()


def run_agent(initial_state: Dict[str, Any], *, stop_before: Optional[str] = None) -> AgentState:
    compiled = build_graph()
    return compiled.invoke(initial_state, stop_before=stop_before)


def resume_agent(state: AgentState) -> AgentState:
    compiled = build_graph()
    # Re-enter at approval with human decision already set
    state.awaiting_human = False
    state.pause_requested = False
    return compiled.resume(state, from_node="approval")
