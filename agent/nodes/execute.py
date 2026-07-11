from __future__ import annotations

from agent.state import AgentState
from tools.registry import get_registry


def execute_node(state: AgentState) -> AgentState:
    state.current_stage = "execute"

    if state.human_decision not in {"approve", "override", "modify"}:
        state.errors.append("Execution blocked: no approving human decision.")
        state.add_audit("execution_blocked", "Execution requires approve/override/modify.")
        state.workflow_complete = True
        return state

    action = state.human_final_action or state.recommended_action
    registry = get_registry()
    results = {}

    # Simulated core-system update
    socotra = registry.invoke(
        "create_socotra_submission",
        approved_submission={
            "submission_id": state.submission_id,
            "idempotency_key": state.submission_id,
            "insured_name": state.extracted_fields.get("insured_name"),
            "product": state.detected_product,
            "action": action,
        },
    )
    results["socotra"] = socotra
    state.completed_tool_calls.append({"tool": "create_socotra_submission", "output": socotra})
    state.add_audit(
        "tool_call",
        f"Simulated Socotra update: {socotra.get('socotra_id')}",
        tool_name="create_socotra_submission",
        tool_output=socotra,
    )
    state.add_timeline(f"Simulated Socotra record {socotra.get('socotra_id')} created")

    # Draft communications where relevant
    if action == "request_information":
        draft = registry.invoke(
            "draft_broker_email",
            purpose="request_information",
            missing_information=state.missing_fields,
            tone="professional",
            insured_name=str(state.extracted_fields.get("insured_name") or "the insured"),
            broker_name=str(state.extracted_fields.get("broker_name") or "Broker"),
        )
        results["broker_draft"] = draft
        state.drafted_communications.append(draft)
        state.completed_tool_calls.append({"tool": "draft_broker_email", "output": draft})
        state.add_audit(
            "tool_call",
            "Broker RFI email drafted (not sent)",
            tool_name="draft_broker_email",
            tool_output=draft,
        )
        state.add_timeline("Broker request-for-information email drafted (not sent)")
    elif action == "decline_recommend":
        draft = registry.invoke(
            "draft_broker_email",
            purpose="decline",
            missing_information=[],
            insured_name=str(state.extracted_fields.get("insured_name") or "the insured"),
            broker_name=str(state.extracted_fields.get("broker_name") or "Broker"),
        )
        results["broker_draft"] = draft
        state.drafted_communications.append(draft)
        state.completed_tool_calls.append({"tool": "draft_broker_email", "output": draft})
        state.add_audit(
            "tool_call",
            "Decline email drafted (not sent)",
            tool_name="draft_broker_email",
            tool_output=draft,
        )
        state.add_timeline("Decline response drafted (not sent)")
    elif action == "refer_senior":
        draft = registry.invoke(
            "draft_broker_email",
            purpose="referral_notice",
            insured_name=str(state.extracted_fields.get("insured_name") or "the insured"),
            broker_name=str(state.extracted_fields.get("broker_name") or "Broker"),
        )
        results["broker_draft"] = draft
        state.drafted_communications.append(draft)
        results["workflow_task"] = {
            "task_type": "senior_referral",
            "assignee": "senior_underwriter",
            "status": "created",
            "reversible": True,
        }
        state.add_timeline("Senior referral task created")
    elif action in {"fast_track", "standard_review"}:
        results["workflow_task"] = {
            "task_type": "quote_preparation" if action == "fast_track" else "underwriting_review",
            "assignee": "underwriter_queue",
            "status": "created",
            "priority": state.priority_score,
            "reversible": True,
        }
        state.add_timeline(f"Workflow task created: {results['workflow_task']['task_type']}")
    elif action == "route_other_product":
        results["workflow_task"] = {
            "task_type": "product_reroute",
            "target_product": "architects_engineers_pl",
            "status": "created",
            "reversible": True,
        }
        state.add_timeline("Routed to alternate product queue")

    results["follow_up_reminder"] = {
        "due_hours": 48,
        "status": "scheduled",
        "reversible": True,
    }
    state.execution_results = results
    state.add_audit("execution", "Approved workflow actions executed in simulated systems.", metadata=results)
    return state
