from __future__ import annotations

from agent.state import AgentState
from tools.registry import get_registry


def enrich_node(state: AgentState) -> AgentState:
    state.current_stage = "enrich"
    # After an investigate loop, clear the prior decision so the next approval gate waits.
    if state.human_decision == "investigate":
        state.human_decision = None
        state.human_final_action = None
        state.override_reason = None
    registry = get_registry()

    insured = str(state.extracted_fields.get("insured_name") or "")
    st = str(state.extracted_fields.get("state") or "")
    broker = str(state.extracted_fields.get("broker_name") or state.email_metadata.get("broker") or "")

    enrichment = registry.invoke("lookup_company_enrichment", insured_name=insured, state=st)
    state.enrichment_data = enrichment.get("enrichment", {})
    state.completed_tool_calls.append({"tool": "lookup_company_enrichment", "output": enrichment})
    state.add_audit(
        "tool_call",
        "Company enrichment completed",
        tool_name="lookup_company_enrichment",
        tool_output=enrichment,
        confidence=state.enrichment_data.get("confidence"),
    )
    state.add_timeline("Company enrichment completed")

    # Conflict check vs submitted data
    enr_industry = str(state.enrichment_data.get("industry") or "").lower()
    biz = str(state.extracted_fields.get("business_description") or "").lower()
    if enr_industry and biz and enr_industry not in biz and biz not in enr_industry:
        state.enrichment_data["conflicts_with_submission"] = True
        state.enrichment_data["conflict_detail"] = (
            f"Enrichment industry '{enr_industry}' differs from submitted description."
        )
    else:
        state.enrichment_data["conflicts_with_submission"] = False

    broker_result = registry.invoke("lookup_broker_profile", broker_name=broker)
    state.broker_profile = broker_result.get("profile", {})
    state.completed_tool_calls.append({"tool": "lookup_broker_profile", "output": broker_result})
    state.add_audit(
        "tool_call",
        "Broker profile retrieved",
        tool_name="lookup_broker_profile",
        tool_output=broker_result,
    )
    state.add_timeline("Broker history retrieved")
    return state
