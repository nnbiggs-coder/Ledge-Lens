from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "brokers" / "brokers.json"


def lookup_broker_profile(broker_name: str = "") -> Dict[str, Any]:
    brokers = _load()
    key = (broker_name or "").strip().lower()
    profile = None
    for item in brokers:
        names = [item.get("name", "").lower(), *(a.lower() for a in item.get("aliases", []))]
        if key and any(key in n or n in key for n in names if n):
            profile = item
            break
    if profile is None:
        profile = {
            "name": broker_name or "Unknown Broker",
            "submission_count": 12,
            "quote_rate": 0.55,
            "bind_rate": 0.28,
            "average_response_time_hours": 36,
            "historical_portfolio_quality": "average",
            "quality_score": 0.6,
            "source": "synthetic_default",
        }
    return {
        "profile": profile,
        "source": "synthetic_broker_store",
        "retrieval_timestamp": _now(),
        "confidence": 0.85 if profile.get("source") != "synthetic_default" else 0.5,
    }


def _load() -> list:
    if DATA_PATH.exists():
        return json.loads(DATA_PATH.read_text())
    return []


def _now() -> str:
    from datetime import datetime

    return datetime.utcnow().isoformat() + "Z"
