from __future__ import annotations

from agent.state import AgentState
from tools.registry import get_registry


def extract_fields_node(state: AgentState) -> AgentState:
    state.current_stage = "extract"
    registry = get_registry()
    field_count = 0
    low_conf = 0

    # Include email as a source document
    sources = [
        {
            "filename": "broker_email",
            "text": state.email_text or "",
            "document_type": "email",
        }
    ] + [
        a
        for a in state.attachments
        if a.get("readable") and not a.get("unsupported")
    ]

    for source in sources:
        result = registry.invoke(
            "extract_insurance_fields",
            document_text=source.get("text") or "",
            document_name=source.get("filename") or "document",
            document_type=source.get("document_type") or "unknown",
        )
        state.completed_tool_calls.append(
            {"tool": "extract_insurance_fields", "input": source.get("filename"), "output_count": len(result["fields"])}
        )
        for field in result["fields"]:
            name = field["name"]
            # Prefer higher-confidence values; never store without provenance
            existing_conf = state.field_confidence.get(name, -1)
            if field["confidence"] >= existing_conf:
                state.extracted_fields[name] = field["value"]
                state.field_confidence[name] = field["confidence"]
                state.field_sources[name] = [field["source_document"]]
                state.field_excerpts[name] = field["source_excerpt"]
                state.field_methods[name] = field["extraction_method"]
            else:
                sources_list = state.field_sources.get(name, [])
                if field["source_document"] not in sources_list:
                    sources_list.append(field["source_document"])
                    state.field_sources[name] = sources_list
            field_count += 1
            if field["confidence"] < 0.7:
                low_conf += 1

        state.add_audit(
            "tool_call",
            f"Extracted fields from {source.get('filename')}",
            tool_name="extract_insurance_fields",
            tool_output={"field_count": len(result["fields"])},
        )

    state.add_timeline(f"{len(state.extracted_fields)} unique fields extracted ({field_count} extractions)")
    if low_conf:
        state.add_timeline(f"{low_conf} field extractions below confidence threshold")
    return state
