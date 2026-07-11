from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional
from uuid import uuid4


def record_human_decision(decision: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    decision = decision or {}
    record = {
        "decision_id": str(uuid4()),
        "submission_id": decision.get("submission_id"),
        "user": decision.get("user", "underwriter"),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "decision": decision.get("decision"),
        "final_action": decision.get("final_action"),
        "override_reason": decision.get("override_reason"),
        "evidence_reviewed": decision.get("evidence_reviewed", []),
        "approval_authority": decision.get("approval_authority", "underwriter"),
    }
    audit_event = {
        "event_id": str(uuid4()),
        "event_type": "human_decision",
        "message": f"Human decision recorded: {record['decision']}",
        "actor": record["user"],
        "decision": record["decision"],
        "metadata": record,
    }
    return {"decision_record": record, "audit_event": audit_event}
