from __future__ import annotations

import hashlib
from datetime import datetime
from typing import Any, Dict, List

from agent.planner import build_plan
from agent.state import AgentState
from agent.validators import detect_prompt_injection
from tools.registry import get_registry


def intake_node(state: AgentState) -> AgentState:
    state.current_stage = "intake"
    state.started_at = state.started_at or (datetime.utcnow().isoformat() + "Z")

    if detect_prompt_injection(state.email_text or ""):
        state.errors.append("Potential prompt-injection content detected in email; sanitized path engaged.")
        state.add_audit(
            "security",
            "Prompt-injection pattern detected; continuing with deterministic tools only.",
            decision="sanitize",
        )

    attachments: List[Dict[str, Any]] = []
    for raw in state.attachments:
        filename = raw.get("filename") or "unnamed.txt"
        text = raw.get("text") or ""
        content_hash = hashlib.sha256((filename + text).encode()).hexdigest()
        readable = bool(text.strip()) and not raw.get("unsupported")
        unsupported = bool(raw.get("unsupported")) or filename.lower().endswith((".exe", ".bin"))
        attachments.append(
            {
                "filename": filename,
                "content_hash": content_hash,
                "media_type": raw.get("media_type", "text/plain"),
                "size_bytes": len(text.encode()),
                "readable": readable and not unsupported,
                "unsupported": unsupported,
                "document_type": "unknown",
                "document_confidence": 0.0,
                "evidence": [],
                "text": text if readable and not unsupported else "",
                "pages_or_sections": [],
            }
        )
    state.attachments = attachments

    plan = build_plan()
    state.current_plan = plan
    state.planned_tool_calls = list(plan["steps"])

    unreadable = [a["filename"] for a in attachments if not a["readable"]]
    state.add_timeline("Submission received")
    state.add_audit(
        "intake",
        f"Intake complete for {state.submission_id}; {len(attachments)} attachments registered.",
        metadata={"unreadable": unreadable, "plan_steps": len(plan["steps"])},
    )
    if unreadable:
        state.add_timeline(f"Unreadable/unsupported attachments: {', '.join(unreadable)}")
    return state
