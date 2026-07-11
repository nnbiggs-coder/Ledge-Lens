from __future__ import annotations

"""Responsible AI policies and thresholds."""

from typing import FrozenSet

# Use-case classification: high risk — supports underwriting decisions.
USE_CASE_CLASSIFICATION = "high_risk_underwriting_decision_support"

CLASSIFICATION_CONFIDENCE_THRESHOLD = 0.65
FIELD_CONFIDENCE_THRESHOLD = 0.70
GUIDELINE_ABSTENTION_THRESHOLD = 0.55

CRITICAL_FIELDS = frozenset(
    {
        "insured_name",
        "state",
        "revenue",
        "requested_limits",
        "claim_count",
        "total_incurred_losses",
        "business_description",
    }
)

# Features forbidden in appetite / priority scoring (fairness).
PROTECTED_FEATURES: FrozenSet[str] = frozenset(
    {
        "race",
        "ethnicity",
        "religion",
        "national_origin",
        "gender",
        "sex",
        "age",
        "disability",
        "marital_status",
        "sexual_orientation",
    }
)

PROXY_FEATURES_TO_MONITOR = frozenset(
    {
        "zip_code",
        "census_tract",
        "first_name",
        "surname",
    }
)

ACTIONS_REQUIRING_APPROVAL = frozenset(
    {
        "decline_recommend",
        "refer_senior",
        "fast_track",
        "standard_review",
        "request_information",
        "route_other_product",
        "create_socotra_submission",
        "draft_broker_email",
    }
)

ACCOUNTABILITY_BANNER = (
    "The agent prepares and recommends. The underwriter remains accountable."
)

KEY_MESSAGES = [
    "AI interprets. Automation executes. Underwriters decide.",
    "The agent prepares the work; it does not own the risk.",
    "Every extracted fact has a source.",
    "Every material action has an accountable human.",
    "The goal is decision-ready underwriting, not autonomous underwriting.",
    "Faster intake is useful. Better portfolio decisions create lasting advantage.",
    "Every underwriting decision should improve the next one.",
]

# Soft max delegated limit for prototype (USD occurrence).
DELEGATED_AUTHORITY_LIMIT = 2_000_000
SEVERITY_CLAIM_THRESHOLD = 250_000

EXCLUDED_STATES = frozenset({"AK", "HI"})
EXCLUDED_INDUSTRIES = frozenset(
    {
        "cannabis",
        "firearms manufacturing",
        "adult entertainment",
        "asbestos abatement",
    }
)
EXCLUDED_OPERATIONS = frozenset(
    {
        "demolition",
        "crane operations",
        "underground mining",
        "fireworks manufacturing",
    }
)

MAX_TOOL_RETRIES = 2
TOOL_DEFAULT_TIMEOUT_SECONDS = 10
