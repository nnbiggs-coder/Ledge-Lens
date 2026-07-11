from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class OutcomeRecord(BaseModel):
    submission_id: str
    status: Literal["quoted", "declined", "bound", "not_bound"]
    premium: Optional[float] = None
    time_to_quote_hours: Optional[float] = None
    underwriter_effort_hours: Optional[float] = None
    claim_count: Optional[int] = None
    incurred_losses: Optional[float] = None
    renewal_status: Optional[str] = None
    loss_ratio: Optional[float] = None
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    notes: str = ""


class LearningInsight(BaseModel):
    insight_id: str
    submission_id: str
    category: str
    message: str
    recommendation: str
    supporting_metrics: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
