from __future__ import annotations

"""Constrained planner — selects only from the approved tool catalog."""

from typing import Any, Dict, List

APPROVED_TOOLS = [
    "read_submission_email",
    "classify_document",
    "extract_insurance_fields",
    "lookup_broker_profile",
    "lookup_company_enrichment",
    "evaluate_appetite",
    "retrieve_underwriting_guidance",
    "calculate_priority_score",
    "create_socotra_submission",
    "draft_broker_email",
    "record_human_decision",
    "record_outcome",
]

DEFAULT_PLAN_STEPS = [
    {
        "step": 1,
        "tool": "read_submission_email",
        "reason": "Identify the broker request and referenced attachments",
    },
    {
        "step": 2,
        "tool": "classify_document",
        "reason": "Determine which attachments contain required underwriting data",
    },
    {
        "step": 3,
        "tool": "extract_insurance_fields",
        "reason": "Create a structured submission record with provenance",
    },
    {
        "step": 4,
        "tool": "lookup_company_enrichment",
        "reason": "Enrich the account with simulated external data",
    },
    {
        "step": 5,
        "tool": "lookup_broker_profile",
        "reason": "Retrieve broker history for triage context",
    },
    {
        "step": 6,
        "tool": "evaluate_appetite",
        "reason": "Apply hard appetite rules and portfolio considerations",
    },
    {
        "step": 7,
        "tool": "retrieve_underwriting_guidance",
        "reason": "Retrieve cited underwriting guideline passages",
    },
    {
        "step": 8,
        "tool": "calculate_priority_score",
        "reason": "Produce a transparent triage priority score",
    },
]


def build_plan(goal: str = "Prepare submission for underwriting review") -> Dict[str, Any]:
    """Return a machine-readable constrained plan. Never invents tools."""
    steps: List[Dict[str, Any]] = []
    for step in DEFAULT_PLAN_STEPS:
        if step["tool"] not in APPROVED_TOOLS:
            raise ValueError(f"Planner attempted unapproved tool: {step['tool']}")
        steps.append(dict(step))
    return {
        "goal": goal,
        "steps": steps,
        "approval_required_before_execution": True,
        "approved_tool_catalog": list(APPROVED_TOOLS),
    }


def validate_tool_name(tool_name: str) -> bool:
    return tool_name in APPROVED_TOOLS
