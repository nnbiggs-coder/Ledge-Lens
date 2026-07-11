from __future__ import annotations

from agent.prompts import GUIDELINE_QUESTION_TEMPLATES
from agent.state import AgentState
from tools.registry import get_registry


def guidance_node(state: AgentState) -> AgentState:
    state.current_stage = "guidance"
    registry = get_registry()
    product = state.detected_product or "general_liability"
    questions = [q.format(product=product) for q in GUIDELINE_QUESTION_TEMPLATES[:4]]

    results = []
    for question in questions:
        result = registry.invoke(
            "retrieve_underwriting_guidance",
            question=question,
            product=product,
            submission_context={
                "extracted_fields": state.extracted_fields,
                "appetite": state.appetite_result,
            },
        )
        results.append(result)
        state.completed_tool_calls.append(
            {"tool": "retrieve_underwriting_guidance", "input": question, "output": result}
        )
        state.add_audit(
            "tool_call",
            f"Guideline retrieval: {'abstained' if result.get('abstained') else 'cited'}",
            tool_name="retrieve_underwriting_guidance",
            tool_input={"question": question},
            tool_output=result,
            confidence=result.get("confidence"),
        )

    state.guideline_results = results
    cited = sum(1 for r in results if not r.get("abstained"))
    state.add_timeline(f"Guideline retrieval completed ({cited} cited, {len(results) - cited} abstained)")
    return state
