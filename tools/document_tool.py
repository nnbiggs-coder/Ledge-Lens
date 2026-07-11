from __future__ import annotations

import hashlib
import re
from typing import Any, Dict, List, Optional


DOCUMENT_KEYWORDS = {
    "acord_application": ["acord", "application for insurance", "named insured", "policy number"],
    "supplemental_application": ["supplemental", "supplemental application", "additional underwriting"],
    "loss_run": ["loss run", "loss history", "claims experience", "incurred"],
    "prior_policy": ["prior policy", "expiring policy", "policy schedule", "carrier:"],
    "statement_of_values": ["statement of values", "sov", "building value", "tiv"],
    "claims_document": ["claim number", "date of loss", "claimant", "reserve"],
    "risk_control": ["risk control", "loss control", "safety program", "inspection"],
    "spreadsheet": [".xlsx", ".csv", "worksheet", "column"],
}


def read_submission_email(email_text: str = "", metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    metadata = metadata or {}
    text = email_text or ""

    broker = metadata.get("broker") or _first_match(
        text, [r"From:\s*(.+)", r"Broker:\s*(.+)", r"Regards,\s*(.+)"]
    )
    insured = metadata.get("insured") or _first_match(
        text, [r"Insured:\s*(.+)", r"Named Insured:\s*(.+)", r"regarding\s+(.+?)(?:\.|,|\n)"]
    )
    requested_action = "quote"
    lowered = text.lower()
    if "renewal" in lowered:
        requested_action = "renewal_quote"
    elif "endorsement" in lowered:
        requested_action = "endorsement"
    elif "indication" in lowered:
        requested_action = "indication"

    attachments = metadata.get("attachment_names") or _extract_attachment_refs(text)
    summary = text.strip().split("\n")[0][:240] if text.strip() else "No email body provided"

    return {
        "broker": (broker or "Unknown Broker").strip(),
        "insured": (insured or "Unknown Insured").strip(),
        "requested_action": requested_action,
        "submission_summary": summary,
        "referenced_attachments": attachments,
    }


def classify_document(
    file_metadata: Optional[Dict[str, Any]] = None,
    extracted_text: str = "",
) -> Dict[str, Any]:
    file_metadata = file_metadata or {}
    name = (file_metadata.get("filename") or "").lower()
    text = (extracted_text or "").lower()
    blob = f"{name}\n{text}"

    best_type = "unknown"
    best_score = 0.0
    evidence: List[str] = []

    for doc_type, keywords in DOCUMENT_KEYWORDS.items():
        hits = [k for k in keywords if k in blob]
        score = min(0.99, 0.35 + 0.2 * len(hits))
        if hits and score > best_score:
            best_score = score
            best_type = doc_type
            evidence = [f"Matched keyword: {h}" for h in hits[:3]]

    if name.endswith((".xlsx", ".xls", ".csv")):
        best_type = "spreadsheet"
        best_score = max(best_score, 0.9)
        evidence = ["Filename extension indicates spreadsheet"]

    if best_type == "unknown" and text.strip():
        best_type = "other"
        best_score = 0.4
        evidence = ["Unstructured text present; type uncertain"]

    pages = []
    if "page" in text:
        pages = re.findall(r"page\s+(\d+)", text, flags=re.I)[:5]

    return {
        "document_type": best_type,
        "confidence": round(best_score, 3),
        "evidence": evidence,
        "pages_or_sections": [f"page {p}" for p in pages],
        "file_source": file_metadata.get("filename"),
    }


FIELD_PATTERNS = {
    "insured_name": [r"Named Insured:\s*(.+)", r"Insured:\s*(.+)"],
    "dba_name": [r"DBA:\s*(.+)", r"Doing Business As:\s*(.+)"],
    "business_description": [r"Business Description:\s*(.+)", r"Operations:\s*(.+)"],
    "industry_code": [r"NAICS:\s*(\d+)", r"SIC:\s*(\d+)"],
    "state": [r"State:\s*([A-Z]{2})\b", r"\b([A-Z]{2})\s+\d{5}\b"],
    "address": [r"Address:\s*(.+)"],
    "revenue": [r"Revenue:\s*\$?([\d,]+)", r"Annual Sales:\s*\$?([\d,]+)"],
    "payroll": [r"Payroll:\s*\$?([\d,]+)"],
    "years_in_business": [r"Years in Business:\s*(\d+)", r"Established:\s*(\d+)"],
    "requested_effective_date": [r"Effective Date:\s*([\d\-]+)"],
    "requested_limits": [r"Requested Limits?:\s*\$?([\d,/\$\s]+)", r"Limits?:\s*\$?([\d,]+)\s*/\s*\$?([\d,]+)"],
    "deductible": [r"Deductible:\s*\$?([\d,]+)"],
    "prior_carrier": [r"Prior Carrier:\s*(.+)", r"Expiring Carrier:\s*(.+)"],
    "prior_premium": [r"Prior Premium:\s*\$?([\d,]+)", r"Expiring Premium:\s*\$?([\d,]+)"],
    "claim_count": [r"Claim Count:\s*(\d+)", r"Number of Claims:\s*(\d+)"],
    "total_incurred_losses": [r"Total Incurred:\s*\$?([\d,]+)", r"Total Incurred Losses:\s*\$?([\d,]+)"],
    "largest_loss": [r"Largest Loss:\s*\$?([\d,]+)"],
    "broker_name": [r"Broker:\s*(.+)", r"Producer:\s*(.+)"],
    "broker_contact": [r"Broker Contact:\s*(.+)", r"Contact:\s*(.+)"],
    "risk_control_details": [r"Risk Control:\s*(.+)", r"Safety Program:\s*(.+)"],
    "revenue_email": [r"\[EMAIL_REVENUE\]\s*\$?([\d,]+)"],
    "requested_limits_email": [r"\[EMAIL_LIMITS\]\s*(.+)"],
}


def extract_insurance_fields(
    document_text: str = "",
    target_schema: Optional[List[str]] = None,
    document_name: str = "document",
    document_type: str = "unknown",
) -> Dict[str, Any]:
    text = document_text or ""
    schema = target_schema or list(FIELD_PATTERNS.keys())
    fields: List[Dict[str, Any]] = []

    for name in schema:
        patterns = FIELD_PATTERNS.get(name, [])
        value = None
        excerpt = ""
        for pattern in patterns:
            m = re.search(pattern, text, flags=re.IGNORECASE)
            if m:
                raw = m.group(1).strip()
                if name in {
                    "revenue",
                    "payroll",
                    "prior_premium",
                    "total_incurred_losses",
                    "largest_loss",
                    "deductible",
                    "revenue_email",
                }:
                    value = _to_number(raw)
                elif name in {"years_in_business", "claim_count"}:
                    value = int(re.sub(r"[^\d]", "", raw) or 0)
                elif name == "requested_limits" and m.lastindex and m.lastindex >= 2:
                    value = f"{m.group(1).strip()}/{m.group(2).strip()}"
                else:
                    value = raw.rstrip(".")
                excerpt = m.group(0)[:200]
                break

        if value is None:
            continue

        confidence = 0.92 if document_type in {"acord_application", "loss_run", "supplemental_application"} else 0.8
        if name.endswith("_email"):
            confidence = 0.75
        if "ambiguous" in text.lower() and name in {"business_description", "industry_code"}:
            confidence = 0.45

        fields.append(
            {
                "name": name,
                "value": value,
                "confidence": confidence,
                "source_document": document_name,
                "source_excerpt": excerpt,
                "extraction_method": "deterministic_regex",
                "page_or_section": document_type,
            }
        )

    return {"fields": fields, "document_hash": hashlib.sha256(text.encode()).hexdigest()[:16]}


def _to_number(raw: str) -> float:
    return float(re.sub(r"[^\d.]", "", raw) or 0)


def _first_match(text: str, patterns: List[str]) -> Optional[str]:
    for pattern in patterns:
        m = re.search(pattern, text, flags=re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return None


def _extract_attachment_refs(text: str) -> List[str]:
    return re.findall(r"[\w\-]+\.(?:pdf|xlsx?|csv|png|jpg|docx)", text, flags=re.IGNORECASE)
