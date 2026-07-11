from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from agent.graph import resume_agent, run_agent
from agent.logging_config import configure_logging
from agent.policies import (
    ACCOUNTABILITY_BANNER,
    KEY_MESSAGES,
    USE_CASE_CLASSIFICATION,
)
from agent.state import AgentState
from api.db import init_db, list_events, list_states, load_state, save_state
from data.submissions.scenarios import all_scenarios, get_scenario

configure_logging()

app = FastAPI(
    title="Ledgebrook Submission Intelligence Agent",
    description=(
        "Synthetic prototype. AI interprets. Automation executes. Underwriters decide. "
        + ACCOUNTABILITY_BANNER
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AttachmentIn(BaseModel):
    filename: str
    text: str = ""
    media_type: str = "text/plain"
    unsupported: bool = False


class SubmissionCreate(BaseModel):
    email_text: str
    email_metadata: Dict[str, Any] = Field(default_factory=dict)
    attachments: List[AttachmentIn] = Field(default_factory=list)
    scenario_id: Optional[str] = None


class ApproveRequest(BaseModel):
    user: str = "underwriter"
    decision: str = "approve"
    final_action: Optional[str] = None
    override_reason: Optional[str] = None
    evidence_reviewed: List[str] = Field(default_factory=list)


class OutcomeRequest(BaseModel):
    status: str
    premium: Optional[float] = None
    time_to_quote_hours: Optional[float] = None
    underwriter_effort_hours: Optional[float] = None
    claim_count: Optional[int] = None
    incurred_losses: Optional[float] = None
    renewal_status: Optional[str] = None
    loss_ratio: Optional[float] = None
    notes: str = ""


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok", "banner": ACCOUNTABILITY_BANNER}


@app.get("/agent/use-cases")
def use_cases() -> Dict[str, Any]:
    return {
        "classification": USE_CASE_CLASSIFICATION,
        "banner": ACCOUNTABILITY_BANNER,
        "key_messages": KEY_MESSAGES,
        "human_oversight_required_for": [
            "decline_communication",
            "referral_conclusion",
            "quote_progression",
            "core_system_update",
            "external_communication",
        ],
        "references_conceptual": [
            "NAIC Model Bulletin on AI Systems",
            "NIST AI Risk Management Framework",
            "Human-in-the-loop controls",
        ],
        "compliance_claim": "This prototype does not claim legal compliance.",
    }


@app.get("/agent/governance")
def governance() -> Dict[str, Any]:
    return {
        "model_provider": "mock",
        "model_version": "mock-deterministic-v1",
        "data_retention_days": 90,
        "training_data_policy": "no_customer_data_used_for_training",
        "region": "us-east-1",
        "last_validation": "2026-07-01",
        "approved_use_cases": ["submission_intake_decision_support"],
        "fairness_test_placeholder": {
            "features_used": ["revenue", "state", "product", "claims", "broker_quality"],
            "potential_proxy_features": ["zip_code"],
            "outcome_differences": "not_computed_in_prototype",
            "override_patterns": "tracked_in_episodic_memory",
        },
    }


@app.get("/agent/metrics")
def metrics() -> Dict[str, Any]:
    states = list_states()
    if not states:
        return {
            "submission_count": 0,
            "avg_processing_time_ms": None,
            "recommendation_acceptance_rate": None,
            "override_rate": None,
            "tool_failure_rate": 0,
            "abstention_rate": None,
            "avg_extraction_confidence": None,
            "hallucination_incidents": 0,
            "cost_per_submission": 0,
            "model_drift_indicators": "n/a_mock_provider",
        }

    complete = [s for s in states if s.get("workflow_complete")]
    elapsed = [s["elapsed_ms"] for s in complete if s.get("elapsed_ms") is not None]
    accepted = sum(1 for s in complete if s.get("human_decision") == "approve")
    overrides = sum(1 for s in complete if s.get("human_decision") == "override")
    decided = sum(1 for s in complete if s.get("human_decision") in {"approve", "override", "modify", "reject"})

    confidences: List[float] = []
    abstentions = 0
    guideline_total = 0
    for s in states:
        confidences.extend(list((s.get("field_confidence") or {}).values()))
        for g in s.get("guideline_results") or []:
            guideline_total += 1
            if g.get("abstained"):
                abstentions += 1

    return {
        "submission_count": len(states),
        "avg_processing_time_ms": (sum(elapsed) / len(elapsed)) if elapsed else None,
        "recommendation_acceptance_rate": (accepted / decided) if decided else None,
        "override_rate": (overrides / decided) if decided else None,
        "tool_failure_rate": 0,
        "abstention_rate": (abstentions / guideline_total) if guideline_total else None,
        "avg_extraction_confidence": (sum(confidences) / len(confidences)) if confidences else None,
        "hallucination_incidents": 0,
        "cost_per_submission": 0,
        "model_drift_indicators": "n/a_mock_provider",
        "banner": ACCOUNTABILITY_BANNER,
    }


@app.get("/scenarios")
def scenarios() -> List[Dict[str, Any]]:
    return [
        {
            "scenario_id": s["scenario_id"],
            "title": s["title"],
            "description": s["description"],
            "expected_action": s["expected_action"],
        }
        for s in all_scenarios()
    ]


@app.post("/submissions")
def create_submission(body: SubmissionCreate) -> Dict[str, Any]:
    submission_id = f"SUB-{uuid4().hex[:10].upper()}"
    state = AgentState(
        submission_id=submission_id,
        scenario_id=body.scenario_id,
        email_text=body.email_text,
        email_metadata=body.email_metadata,
        attachments=[a.model_dump() for a in body.attachments],
        current_stage="received",
        started_at=datetime.utcnow().isoformat() + "Z",
    )
    payload = state.model_dump()
    save_state(payload)
    return {"submission_id": submission_id, "state": payload, "banner": ACCOUNTABILITY_BANNER}


@app.post("/submissions/from-scenario/{scenario_id}")
def create_from_scenario(scenario_id: str) -> Dict[str, Any]:
    try:
        scenario = get_scenario(scenario_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    body = SubmissionCreate(
        email_text=scenario["email_text"],
        email_metadata=scenario.get("email_metadata", {}),
        attachments=[AttachmentIn(**a) for a in scenario.get("attachments", [])],
        scenario_id=scenario_id,
    )
    return create_submission(body)


@app.get("/submissions")
def get_submissions() -> Dict[str, Any]:
    states = list_states()
    queue = []
    for s in states:
        queue.append(
            {
                "submission_id": s.get("submission_id"),
                "scenario_id": s.get("scenario_id"),
                "broker": (s.get("extracted_fields") or {}).get("broker_name")
                or (s.get("email_metadata") or {}).get("broker"),
                "insured": (s.get("extracted_fields") or {}).get("insured_name")
                or (s.get("email_metadata") or {}).get("insured"),
                "product": s.get("detected_product"),
                "stage": s.get("current_stage"),
                "risk_level": s.get("risk_level"),
                "recommended_action": s.get("recommended_action"),
                "approval_status": (
                    "awaiting"
                    if s.get("awaiting_human")
                    else s.get("human_decision") or "not_started"
                ),
                "errors": s.get("errors") or [],
                "priority_score": s.get("priority_score"),
                "workflow_complete": s.get("workflow_complete"),
            }
        )
    return {"submissions": queue, "banner": ACCOUNTABILITY_BANNER}


@app.get("/submissions/{submission_id}")
def get_submission(submission_id: str) -> Dict[str, Any]:
    state = load_state(submission_id)
    if not state:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"state": state, "banner": ACCOUNTABILITY_BANNER}


@app.post("/submissions/{submission_id}/run")
def run_submission(submission_id: str) -> Dict[str, Any]:
    state = load_state(submission_id)
    if not state:
        raise HTTPException(status_code=404, detail="Submission not found")
    result = run_agent(state)
    payload = result.model_dump()
    save_state(payload)
    return {"state": payload, "banner": ACCOUNTABILITY_BANNER}


@app.post("/submissions/{submission_id}/pause")
def pause_submission(submission_id: str) -> Dict[str, Any]:
    state = load_state(submission_id)
    if not state:
        raise HTTPException(status_code=404, detail="Submission not found")
    state["pause_requested"] = True
    save_state(state)
    return {"state": state, "banner": ACCOUNTABILITY_BANNER}


@app.post("/submissions/{submission_id}/resume")
def resume_submission(submission_id: str) -> Dict[str, Any]:
    raw = load_state(submission_id)
    if not raw:
        raise HTTPException(status_code=404, detail="Submission not found")
    agent_state = AgentState.model_validate(raw)
    agent_state.pause_requested = False
    if agent_state.awaiting_human and not agent_state.human_decision:
        raise HTTPException(status_code=400, detail="Cannot resume: still awaiting human decision")
    result = resume_agent(agent_state)
    payload = result.model_dump()
    save_state(payload)
    return {"state": payload, "banner": ACCOUNTABILITY_BANNER}


@app.post("/submissions/{submission_id}/approve")
def approve_submission(submission_id: str, body: ApproveRequest) -> Dict[str, Any]:
    raw = load_state(submission_id)
    if not raw:
        raise HTTPException(status_code=404, detail="Submission not found")
    agent_state = AgentState.model_validate(raw)
    if not agent_state.awaiting_human and agent_state.current_stage not in {"approval", "recommend"}:
        # Allow approval if waiting or at gate
        if agent_state.workflow_complete:
            raise HTTPException(status_code=400, detail="Workflow already complete")

    agent_state.human_user = body.user
    agent_state.human_decision = body.decision
    agent_state.human_final_action = body.final_action or agent_state.recommended_action
    agent_state.override_reason = body.override_reason
    agent_state.awaiting_human = False

    if body.decision == "override" and not body.override_reason:
        raise HTTPException(status_code=400, detail="override_reason is required when decision is override")

    result = resume_agent(agent_state)
    payload = result.model_dump()
    save_state(payload)
    return {"state": payload, "banner": ACCOUNTABILITY_BANNER}


@app.post("/submissions/{submission_id}/override")
def override_submission(submission_id: str, body: ApproveRequest) -> Dict[str, Any]:
    body.decision = "override"
    if not body.override_reason:
        raise HTTPException(status_code=400, detail="override_reason is required")
    return approve_submission(submission_id, body)


@app.post("/submissions/{submission_id}/investigate")
def investigate_submission(submission_id: str, body: ApproveRequest) -> Dict[str, Any]:
    body.decision = "investigate"
    return approve_submission(submission_id, body)


@app.post("/submissions/{submission_id}/outcome")
def record_submission_outcome(submission_id: str, body: OutcomeRequest) -> Dict[str, Any]:
    raw = load_state(submission_id)
    if not raw:
        raise HTTPException(status_code=404, detail="Submission not found")
    agent_state = AgentState.model_validate(raw)
    agent_state.outcome = {
        "submission_id": submission_id,
        **body.model_dump(),
    }
    # Re-run learn node logic via tool
    from agent.nodes.learn import learn_node

    result = learn_node(agent_state)
    payload = result.model_dump()
    save_state(payload)
    return {"state": payload, "banner": ACCOUNTABILITY_BANNER}


@app.get("/submissions/{submission_id}/events")
def submission_events(submission_id: str) -> Dict[str, Any]:
    if not load_state(submission_id):
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"events": list_events(submission_id), "banner": ACCOUNTABILITY_BANNER}


# Alias for main module path
def create_app() -> FastAPI:
    return app
