from __future__ import annotations

import hashlib
from datetime import datetime
from typing import Any, Dict, Optional

# In-memory simulated Socotra store for idempotency
_SOCOTRA_STORE: Dict[str, Dict[str, Any]] = {}


def create_socotra_submission(approved_submission: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Simulated Socotra integration — idempotent, reversible flag, fully synthetic."""
    approved_submission = approved_submission or {}
    submission_id = approved_submission.get("submission_id") or "unknown"
    idempotency_key = approved_submission.get("idempotency_key") or submission_id

    if idempotency_key in _SOCOTRA_STORE:
        existing = _SOCOTRA_STORE[idempotency_key]
        return {
            **existing,
            "idempotent_replay": True,
            "message": "Existing simulated Socotra record returned (idempotent).",
        }

    socotra_id = "SOC-" + hashlib.sha256(idempotency_key.encode()).hexdigest()[:10].upper()
    record = {
        "socotra_id": socotra_id,
        "submission_id": submission_id,
        "status": "created",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "reversible": True,
        "simulated": True,
        "payload_snapshot": {
            "insured": approved_submission.get("insured_name"),
            "product": approved_submission.get("product"),
            "action": approved_submission.get("action"),
        },
        "idempotent_replay": False,
        "message": "Simulated Socotra submission record created. Not a production system.",
    }
    _SOCOTRA_STORE[idempotency_key] = record
    return record


def get_socotra_store() -> Dict[str, Dict[str, Any]]:
    return dict(_SOCOTRA_STORE)


def reset_socotra_store() -> None:
    _SOCOTRA_STORE.clear()
