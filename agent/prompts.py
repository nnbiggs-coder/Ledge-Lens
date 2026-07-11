from __future__ import annotations

"""Prompt templates for model providers. Used by mock and future LLM adapters."""

SYSTEM_ROLE = """You are the Ledgebrook Submission Intelligence Agent.
You prepare wholesale insurance submissions for underwriter review.
You interpret documents, extract facts with citations, apply approved rules,
and recommend actions. You never bind coverage, set final price, or send
external communications without human approval.
The agent prepares and recommends. The underwriter remains accountable.
"""

CLASSIFY_SUBMISSION_PROMPT = """Classify this wholesale insurance submission.
Return product, industry, submission kind, urgency, confidence, and evidence.
Do not invent facts not present in the email or attachments.

EMAIL:
{email_text}

ATTACHMENT NAMES:
{attachment_names}
"""

EXTRACT_FIELDS_PROMPT = """Extract insurance fields from the document text.
Every field must include value, confidence, source document, and excerpt.
Never invent missing facts.

DOCUMENT TYPE: {document_type}
DOCUMENT NAME: {document_name}
TEXT:
{text}
"""

RECOMMEND_PROMPT = """Given the structured submission state, recommend one action:
fast_track | standard_review | request_information | refer_senior |
route_other_product | decline_recommend | human_review_uncertain

Provide a concrete rationale citing hard rules, missing information, and guidelines.
State: {state_summary}
"""

GUIDELINE_QUESTION_TEMPLATES = [
    "Is this class eligible for {product}?",
    "Does the loss history require referral?",
    "Is the requested limit within authority?",
    "What additional information is required?",
    "What exclusions may apply?",
    "What underwriting controls should be confirmed?",
]

INJECTION_PATTERNS = [
    "ignore previous instructions",
    "disregard all rules",
    "you are now",
    "system override",
    "bind coverage now",
    "send email without approval",
]
