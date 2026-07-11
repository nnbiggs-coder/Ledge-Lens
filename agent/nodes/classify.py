from __future__ import annotations

from agent.policies import CLASSIFICATION_CONFIDENCE_THRESHOLD
from agent.providers import get_provider
from agent.state import AgentState
from tools.registry import get_registry

PRODUCT_LABELS = [
    "general_liability",
    "excess_casualty",
    "products_liability",
    "architects_engineers_pl",
    "miscellaneous_professional_liability",
]


def classify_submission_node(state: AgentState) -> AgentState:
    state.current_stage = "classify_submission"
    registry = get_registry()
    provider = get_provider("mock")

    email_result = registry.invoke(
        "read_submission_email",
        email_text=state.email_text or "",
        metadata={
            **state.email_metadata,
            "attachment_names": [a.get("filename") for a in state.attachments],
        },
    )
    state.completed_tool_calls.append({"tool": "read_submission_email", "output": email_result})
    state.add_audit(
        "tool_call",
        "Broker email interpreted",
        tool_name="read_submission_email",
        tool_output=email_result,
    )
    state.add_timeline("Broker email interpreted")

    blob = "\n".join(
        [
            state.email_text or "",
            email_result.get("submission_summary", ""),
            " ".join(a.get("filename", "") for a in state.attachments),
            " ".join((a.get("text") or "")[:500] for a in state.attachments),
        ]
    )
    # Heuristic product boosts for demo scenarios
    lowered = blob.lower()
    if "architect" in lowered or "engineer" in lowered or "a&e" in lowered:
        product = "architects_engineers_pl"
        confidence = 0.9
        evidence = ["Business language indicates A&E professional services"]
    elif "excess" in lowered or "umbrella" in lowered:
        product = "excess_casualty"
        confidence = 0.88
        evidence = ["Email/attachments reference excess/umbrella"]
    elif "product liability" in lowered or "products liability" in lowered:
        product = "products_liability"
        confidence = 0.86
        evidence = ["Products liability referenced"]
    elif "miscellaneous professional" in lowered or "misc e&o" in lowered:
        product = "miscellaneous_professional_liability"
        confidence = 0.84
        evidence = ["Miscellaneous professional liability referenced"]
    else:
        classified = provider.classify(blob, PRODUCT_LABELS)
        product = classified["label"]
        confidence = classified["confidence"]
        evidence = ["Mock provider classification from email and attachment text"]
        if "general liability" in lowered or "gl " in lowered or "acord" in lowered:
            product = "general_liability"
            confidence = max(confidence, 0.82)

    # Ambiguity scenario
    if "ambiguous business description" in lowered or state.scenario_id == "scenario_5_ai_uncertainty":
        confidence = 0.42
        evidence = ["Ambiguous business description; conflicting industry signals"]
        state.classification_alternatives = [
            {"product": "general_liability", "confidence": 0.42},
            {"product": "products_liability", "confidence": 0.40},
        ]
        state.route_to_human_review = True

    industry = email_result.get("insured")
    # Prefer explicit industry markers
    for marker, label in [
        ("construction", "construction"),
        ("software", "technology"),
        ("manufactur", "manufacturing"),
        ("architect", "professional_services"),
        ("engineer", "professional_services"),
        ("demolition", "construction_demolition"),
        ("cannabis", "cannabis"),
    ]:
        if marker in lowered:
            industry = label
            break

    kind = "new_business"
    if "renewal" in lowered:
        kind = "renewal"
    elif "endorsement" in lowered:
        kind = "endorsement"

    urgency = "normal"
    if "urgent" in lowered or "asap" in lowered or "needed today" in lowered:
        urgency = "high"

    state.detected_product = product
    state.detected_industry = industry if isinstance(industry, str) else "unknown"
    state.submission_kind = kind
    state.classification_confidence = confidence
    state.classification_evidence = evidence
    if not state.classification_alternatives:
        alts = [p for p in PRODUCT_LABELS if p != product][:2]
        state.classification_alternatives = [{"product": a, "confidence": round(confidence - 0.2, 2)} for a in alts]

    if confidence < CLASSIFICATION_CONFIDENCE_THRESHOLD:
        state.route_to_human_review = True
        state.add_timeline("Classification confidence below threshold — routing to human review")
        state.add_audit(
            "routing",
            "Low classification confidence; human review required.",
            confidence=confidence,
            decision="human_review",
        )
    else:
        state.add_timeline(f"Submission classified as {product} ({confidence:.0%})")
        state.add_audit(
            "classification",
            f"Classified product={product}, kind={kind}, urgency={urgency}",
            confidence=confidence,
            sources=evidence,
        )

    if email_result.get("broker") and "broker_name" not in state.extracted_fields:
        state.extracted_fields["broker_name"] = email_result["broker"]
        state.field_confidence["broker_name"] = 0.8
        state.field_sources["broker_name"] = ["broker_email"]
        state.field_excerpts["broker_name"] = email_result.get("submission_summary", "")[:120]
        state.field_methods["broker_name"] = "email_parse"

    if email_result.get("insured") and "insured_name" not in state.extracted_fields:
        state.extracted_fields["insured_name"] = email_result["insured"]
        state.field_confidence["insured_name"] = 0.75
        state.field_sources["insured_name"] = ["broker_email"]
        state.field_excerpts["insured_name"] = str(email_result["insured"])
        state.field_methods["insured_name"] = "email_parse"

    return state
