from __future__ import annotations

from tools.appetite_tool import evaluate_appetite
from tools.audit_tool import record_human_decision
from tools.broker_tool import lookup_broker_profile
from tools.communication_tool import draft_broker_email
from tools.document_tool import classify_document, extract_insurance_fields, read_submission_email
from tools.enrichment_tool import lookup_company_enrichment
from tools.guideline_tool import retrieve_underwriting_guidance
from tools.portfolio_tool import calculate_priority_score, record_outcome
from tools.registry import ToolRegistry, ToolSpec
from tools.socotra_tool import create_socotra_submission


def register_all_tools(registry: ToolRegistry) -> None:
    registry.register(
        ToolSpec(
            name="read_submission_email",
            description="Interpret broker email and referenced attachments",
            input_schema={"email_text": "str", "metadata": "dict"},
            output_schema={
                "broker": "str",
                "insured": "str",
                "requested_action": "str",
                "submission_summary": "str",
                "referenced_attachments": "list",
            },
            permission_level="read",
            approval_required=False,
            handler=read_submission_email,
        )
    )
    registry.register(
        ToolSpec(
            name="classify_document",
            description="Classify an attachment by underwriting document type",
            input_schema={"file_metadata": "dict", "extracted_text": "str"},
            output_schema={"document_type": "str", "confidence": "float", "evidence": "list"},
            permission_level="read",
            approval_required=False,
            handler=classify_document,
        )
    )
    registry.register(
        ToolSpec(
            name="extract_insurance_fields",
            description="Extract insurance fields with provenance",
            input_schema={"document_text": "str", "target_schema": "list", "document_name": "str"},
            output_schema={"fields": "list"},
            permission_level="read",
            approval_required=False,
            handler=extract_insurance_fields,
        )
    )
    registry.register(
        ToolSpec(
            name="lookup_broker_profile",
            description="Retrieve simulated broker performance history",
            input_schema={"broker_name": "str"},
            output_schema={"profile": "dict"},
            permission_level="read",
            approval_required=False,
            handler=lookup_broker_profile,
        )
    )
    registry.register(
        ToolSpec(
            name="lookup_company_enrichment",
            description="Retrieve simulated external company enrichment",
            input_schema={"insured_name": "str", "state": "str"},
            output_schema={"enrichment": "dict"},
            permission_level="read",
            approval_required=False,
            handler=lookup_company_enrichment,
        )
    )
    registry.register(
        ToolSpec(
            name="evaluate_appetite",
            description="Evaluate product appetite using hard rules and observations",
            input_schema={"product": "str", "extracted_data": "dict", "appetite_rules": "dict"},
            output_schema={"decision": "str", "triggered_rules": "list", "referral_conditions": "list"},
            permission_level="read",
            approval_required=False,
            handler=evaluate_appetite,
        )
    )
    registry.register(
        ToolSpec(
            name="retrieve_underwriting_guidance",
            description="RAG over synthetic underwriting guidelines with citations",
            input_schema={"question": "str", "product": "str", "submission_context": "dict"},
            output_schema={"answer": "str", "citations": "list", "confidence": "float", "abstained": "bool"},
            permission_level="read",
            approval_required=False,
            handler=retrieve_underwriting_guidance,
        )
    )
    registry.register(
        ToolSpec(
            name="calculate_priority_score",
            description="Transparent weighted priority score 0-100",
            input_schema={"factors": "dict"},
            output_schema={"total_score": "float", "factor_scores": "dict", "explanation": "str"},
            permission_level="read",
            approval_required=False,
            handler=calculate_priority_score,
        )
    )
    registry.register(
        ToolSpec(
            name="create_socotra_submission",
            description="Simulated Socotra submission create/update (idempotent)",
            input_schema={"approved_submission": "dict"},
            output_schema={"socotra_id": "str", "status": "str", "timestamp": "str"},
            permission_level="write",
            approval_required=True,
            handler=create_socotra_submission,
        )
    )
    registry.register(
        ToolSpec(
            name="draft_broker_email",
            description="Draft broker communication — never sends automatically",
            input_schema={"purpose": "str", "missing_information": "list", "tone": "str"},
            output_schema={"draft": "str", "sent": "bool"},
            permission_level="communicate",
            approval_required=True,
            handler=draft_broker_email,
        )
    )
    registry.register(
        ToolSpec(
            name="record_human_decision",
            description="Record underwriter approval/override decision",
            input_schema={"decision": "dict"},
            output_schema={"decision_record": "dict", "audit_event": "dict"},
            permission_level="write",
            approval_required=False,
            handler=record_human_decision,
        )
    )
    registry.register(
        ToolSpec(
            name="record_outcome",
            description="Record downstream quote/bind/loss outcomes and learning metrics",
            input_schema={"outcome": "dict", "prior_state": "dict"},
            output_schema={"outcome_record": "dict", "learning_metrics": "dict"},
            permission_level="write",
            approval_required=False,
            handler=record_outcome,
        )
    )


__all__ = ["register_all_tools", "ToolRegistry", "ToolSpec"]
