from __future__ import annotations

from typing import Any, Dict, List, Optional


def draft_broker_email(
    purpose: str = "request_information",
    missing_information: Optional[List[str]] = None,
    tone: str = "professional",
    insured_name: str = "the insured",
    broker_name: str = "Broker",
) -> Dict[str, Any]:
    """Draft only — never sends automatically."""
    missing_information = missing_information or []
    missing_block = "\n".join(f"- {m}" for m in missing_information) or "- (none listed)"

    if purpose == "decline":
        subject = f"Submission update — {insured_name}"
        body = (
            f"Dear {broker_name},\n\n"
            f"Thank you for the opportunity to review {insured_name}. "
            f"Based on our current appetite guidelines, we are unable to offer terms at this time.\n\n"
            f"This is a draft only and has not been sent.\n\n"
            f"Regards,\nUnderwriting"
        )
    elif purpose == "referral_notice":
        subject = f"Referral in progress — {insured_name}"
        body = (
            f"Dear {broker_name},\n\n"
            f"We are referring the {insured_name} submission for senior underwriter review. "
            f"We will follow up shortly.\n\n"
            f"This is a draft only and has not been sent.\n\n"
            f"Regards,\nUnderwriting"
        )
    else:
        subject = f"Additional information needed — {insured_name}"
        body = (
            f"Dear {broker_name},\n\n"
            f"Thank you for submitting {insured_name}. To continue our review, please provide:\n"
            f"{missing_block}\n\n"
            f"This is a draft only and has not been sent.\n\n"
            f"Regards,\nUnderwriting"
        )

    return {
        "draft": {"subject": subject, "body": body, "tone": tone, "purpose": purpose},
        "sent": False,
        "requires_human_send": True,
        "message": "Broker email drafted. External send is blocked until human approval and explicit send action.",
    }
