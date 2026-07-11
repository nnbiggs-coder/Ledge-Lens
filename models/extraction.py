from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class FieldProvenance(BaseModel):
    source_document: str
    source_excerpt: str
    extraction_method: str = "deterministic_parser"
    page_or_section: Optional[str] = None


class ExtractedField(BaseModel):
    name: str
    value: object
    confidence: float
    provenance: FieldProvenance

    def as_dict(self) -> dict:
        return {
            "name": self.name,
            "value": self.value,
            "confidence": self.confidence,
            "source_document": self.provenance.source_document,
            "source_excerpt": self.provenance.source_excerpt,
            "extraction_method": self.provenance.extraction_method,
            "page_or_section": self.provenance.page_or_section,
        }


class Contradiction(BaseModel):
    field: str
    description: str
    severity: str  # info | warning | critical
    values: List[dict] = Field(default_factory=list)
    recommended_resolution: str = ""
    sources: List[str] = Field(default_factory=list)
