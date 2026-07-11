from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class AuditEvent(BaseModel):
    event_id: str
    submission_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    stage: str
    event_type: str
    message: str
    actor: str = "agent"
    confidence: Optional[float] = None
    tool_name: Optional[str] = None
    tool_input: Optional[Dict[str, Any]] = None
    tool_output: Optional[Dict[str, Any]] = None
    decision: Optional[str] = None
    sources: list = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
