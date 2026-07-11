from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "enrichment" / "companies.json"


def lookup_company_enrichment(
    insured_name: str = "",
    state: str = "",
) -> Dict[str, Any]:
    companies = _load()
    key = (insured_name or "").strip().lower()
    match: Optional[Dict[str, Any]] = None
    for item in companies:
        if key and key in item.get("name", "").lower():
            match = item
            break

    if match is None:
        match = {
            "name": insured_name or "Unknown",
            "industry": "unknown",
            "years_in_business": None,
            "location_risk": "moderate",
            "catastrophe_exposure": "low",
            "public_description": "No public record found in synthetic store.",
            "building_information": {},
            "registration_status": "unknown",
            "source": "synthetic_default",
        }

    enrichment = {
        **match,
        "queried_state": state,
        "labeled_as": "enriched_external_data",
        "not_broker_provided": True,
        "source": match.get("source", "synthetic_company_store"),
        "retrieval_timestamp": datetime.utcnow().isoformat() + "Z",
        "confidence": 0.8 if match.get("source") != "synthetic_default" else 0.4,
    }
    return {"enrichment": enrichment}


def _load() -> list:
    if DATA_PATH.exists():
        return json.loads(DATA_PATH.read_text())
    return []
