from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


DocumentType = Literal[
    "acord_application",
    "supplemental_application",
    "loss_run",
    "prior_policy",
    "statement_of_values",
    "claims_document",
    "risk_control",
    "spreadsheet",
    "email",
    "other",
    "unknown",
]

ProductType = Literal[
    "general_liability",
    "excess_casualty",
    "products_liability",
    "architects_engineers_pl",
    "miscellaneous_professional_liability",
    "unknown",
]

SubmissionKind = Literal["new_business", "renewal", "endorsement", "unknown"]


class AttachmentManifest(BaseModel):
    filename: str
    content_hash: str
    media_type: str = "text/plain"
    size_bytes: int = 0
    readable: bool = True
    unsupported: bool = False
    document_type: DocumentType = "unknown"
    document_confidence: float = 0.0
    evidence: List[str] = Field(default_factory=list)
    text: str = ""
    pages_or_sections: List[str] = Field(default_factory=list)


class ClassificationResult(BaseModel):
    product: ProductType = "unknown"
    industry: Optional[str] = None
    line_of_business: Optional[str] = None
    submission_kind: SubmissionKind = "unknown"
    broker_name: Optional[str] = None
    urgency: Literal["low", "normal", "high", "critical"] = "normal"
    confidence: float = 0.0
    evidence: List[str] = Field(default_factory=list)
    alternatives: List[Dict[str, Any]] = Field(default_factory=list)
    complete_enough: bool = True


class SubmissionRecord(BaseModel):
    submission_id: str
    scenario_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    email_text: str = ""
    email_metadata: Dict[str, Any] = Field(default_factory=dict)
    attachments: List[AttachmentManifest] = Field(default_factory=list)
    classification: Optional[ClassificationResult] = None
    status: str = "received"
