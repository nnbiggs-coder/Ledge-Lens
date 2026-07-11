from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


RecommendedAction = Literal[
    "fast_track",
    "standard_review",
    "request_information",
    "refer_senior",
    "route_other_product",
    "decline_recommend",
    "human_review_uncertain",
]


class Recommendation(BaseModel):
    action: RecommendedAction
    reason: str
    confidence: float
    supporting_evidence: List[str] = Field(default_factory=list)
    hard_rules_triggered: List[dict] = Field(default_factory=list)
    ai_observations: List[dict] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    applicable_guidelines: List[dict] = Field(default_factory=list)
    human_approval_required: bool = True
    priority_score: Optional[float] = None
    risk_level: Literal["low", "moderate", "high", "very_high"] = "moderate"


class HumanDecision(BaseModel):
    user: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    decision: Literal["approve", "modify", "reject", "override", "investigate", "stop"]
    final_action: Optional[RecommendedAction] = None
    override_reason: Optional[str] = None
    evidence_reviewed: List[str] = Field(default_factory=list)
    approval_authority: str = "underwriter"
