from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class AgentState(BaseModel):
    """Shared agent state passed through every graph node."""

    submission_id: str
    current_stage: str = "intake"
    scenario_id: Optional[str] = None

    email_text: Optional[str] = None
    email_metadata: Dict[str, Any] = Field(default_factory=dict)
    attachments: List[Dict[str, Any]] = Field(default_factory=list)

    detected_product: Optional[str] = None
    detected_industry: Optional[str] = None
    submission_kind: Optional[str] = None
    classification_confidence: float = 0.0
    classification_evidence: List[str] = Field(default_factory=list)
    classification_alternatives: List[Dict[str, Any]] = Field(default_factory=list)

    extracted_fields: Dict[str, Any] = Field(default_factory=dict)
    field_confidence: Dict[str, float] = Field(default_factory=dict)
    field_sources: Dict[str, List[str]] = Field(default_factory=dict)
    field_excerpts: Dict[str, str] = Field(default_factory=dict)
    field_methods: Dict[str, str] = Field(default_factory=dict)

    missing_fields: List[str] = Field(default_factory=list)
    contradictions: List[Dict[str, Any]] = Field(default_factory=list)
    validation_severity: Optional[str] = None

    enrichment_data: Dict[str, Any] = Field(default_factory=dict)
    broker_profile: Dict[str, Any] = Field(default_factory=dict)

    appetite_result: Dict[str, Any] = Field(default_factory=dict)
    guideline_results: List[Dict[str, Any]] = Field(default_factory=list)

    hard_rules_triggered: List[Dict[str, Any]] = Field(default_factory=list)
    ai_observations: List[Dict[str, Any]] = Field(default_factory=list)

    priority_score: Optional[float] = None
    priority_breakdown: Dict[str, Any] = Field(default_factory=dict)
    recommended_action: Optional[str] = None
    recommendation_reason: Optional[str] = None
    recommendation_confidence: float = 0.0
    recommendation_payload: Dict[str, Any] = Field(default_factory=dict)

    risk_level: Literal["low", "moderate", "high", "very_high"] = "moderate"

    human_approval_required: bool = True
    awaiting_human: bool = False
    human_decision: Optional[str] = None
    human_final_action: Optional[str] = None
    override_reason: Optional[str] = None
    human_user: Optional[str] = None

    planned_tool_calls: List[Dict[str, Any]] = Field(default_factory=list)
    completed_tool_calls: List[Dict[str, Any]] = Field(default_factory=list)
    current_plan: Dict[str, Any] = Field(default_factory=dict)

    execution_results: Dict[str, Any] = Field(default_factory=dict)
    drafted_communications: List[Dict[str, Any]] = Field(default_factory=list)

    errors: List[str] = Field(default_factory=list)
    audit_events: List[Dict[str, Any]] = Field(default_factory=list)
    timeline: List[Dict[str, Any]] = Field(default_factory=list)

    pause_requested: bool = False
    stop_requested: bool = False
    route_to_human_review: bool = False
    critical_validation_failure: bool = False

    outcome: Optional[Dict[str, Any]] = None
    learning_insights: List[Dict[str, Any]] = Field(default_factory=list)

    workflow_complete: bool = False
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    elapsed_ms: Optional[int] = None

    def add_timeline(self, message: str, stage: Optional[str] = None) -> None:
        from datetime import datetime

        self.timeline.append(
            {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "stage": stage or self.current_stage,
                "message": message,
            }
        )

    def add_audit(
        self,
        event_type: str,
        message: str,
        *,
        confidence: Optional[float] = None,
        tool_name: Optional[str] = None,
        tool_input: Optional[Dict[str, Any]] = None,
        tool_output: Optional[Dict[str, Any]] = None,
        decision: Optional[str] = None,
        sources: Optional[list] = None,
        metadata: Optional[Dict[str, Any]] = None,
        actor: str = "agent",
    ) -> None:
        import uuid
        from datetime import datetime

        event = {
            "event_id": str(uuid.uuid4()),
            "submission_id": self.submission_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "stage": self.current_stage,
            "event_type": event_type,
            "message": message,
            "actor": actor,
            "confidence": confidence,
            "tool_name": tool_name,
            "tool_input": tool_input,
            "tool_output": tool_output,
            "decision": decision,
            "sources": sources or [],
            "metadata": metadata or {},
        }
        self.audit_events.append(event)
