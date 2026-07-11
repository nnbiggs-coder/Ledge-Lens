from __future__ import annotations

from agent.state import AgentState
from tools.registry import get_registry


def classify_documents_node(state: AgentState) -> AgentState:
    state.current_stage = "classify_documents"
    registry = get_registry()
    classified = []
    for attachment in state.attachments:
        if attachment.get("unsupported") or not attachment.get("readable"):
            attachment["document_type"] = "unknown"
            attachment["document_confidence"] = 0.0
            attachment["evidence"] = ["Unreadable or unsupported attachment"]
            classified.append(attachment)
            continue
        result = registry.invoke(
            "classify_document",
            file_metadata={"filename": attachment.get("filename")},
            extracted_text=attachment.get("text") or "",
        )
        attachment["document_type"] = result["document_type"]
        attachment["document_confidence"] = result["confidence"]
        attachment["evidence"] = result.get("evidence", [])
        attachment["pages_or_sections"] = result.get("pages_or_sections", [])
        state.completed_tool_calls.append(
            {"tool": "classify_document", "input": attachment.get("filename"), "output": result}
        )
        state.add_audit(
            "tool_call",
            f"Document classified: {attachment.get('filename')} → {result['document_type']}",
            tool_name="classify_document",
            confidence=result["confidence"],
            tool_output=result,
        )
        classified.append(attachment)

    state.attachments = classified
    state.add_timeline(f"{len(classified)} attachments classified")
    return state
