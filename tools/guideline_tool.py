from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from agent.policies import GUIDELINE_ABSTENTION_THRESHOLD

GUIDELINES_DIR = Path(__file__).resolve().parents[1] / "data" / "guidelines"


def retrieve_underwriting_guidance(
    question: str = "",
    product: str = "",
    submission_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Simple local vector-store substitute: keyword overlap RAG with mandatory citations."""
    submission_context = submission_context or {}
    corpus = _load_corpus()
    if not corpus:
        return _abstain(question, "No approved guideline documents available.")

    q_tokens = _tokens(f"{question} {product}")
    scored: List[Dict[str, Any]] = []
    for doc in corpus:
        if product and doc.get("product") not in {product, "all", None, ""}:
            # Still allow cross-product general docs
            if doc.get("product") not in {"all", product}:
                overlap_penalty = 0.15
            else:
                overlap_penalty = 0.0
        else:
            overlap_penalty = 0.0

        for passage in doc.get("passages", []):
            p_tokens = _tokens(passage.get("text", "") + " " + passage.get("section", ""))
            overlap = len(q_tokens & p_tokens)
            if overlap == 0:
                continue
            score = min(0.95, 0.4 + 0.08 * overlap - overlap_penalty)
            scored.append(
                {
                    "score": score,
                    "document": doc.get("document"),
                    "section": passage.get("section"),
                    "page": passage.get("page"),
                    "text": passage.get("text"),
                }
            )

    scored.sort(key=lambda x: x["score"], reverse=True)
    top = scored[:3]

    if not top or top[0]["score"] < GUIDELINE_ABSTENTION_THRESHOLD:
        return _abstain(question, "Insufficient guideline evidence to answer.")

    citations = [
        {
            "document": t["document"],
            "section": t["section"],
            "page": t["page"],
            "excerpt": t["text"][:280],
            "confidence": round(t["score"], 3),
        }
        for t in top
    ]
    answer = (
        f"Based on approved guidelines: {top[0]['text'][:400]} "
        f"(See {top[0]['document']}, {top[0]['section']}, p.{top[0]['page']}.)"
    )
    return {
        "answer": answer,
        "citations": citations,
        "confidence": round(top[0]["score"], 3),
        "abstained": False,
        "question": question,
    }


def _abstain(question: str, reason: str) -> Dict[str, Any]:
    return {
        "answer": None,
        "citations": [],
        "confidence": 0.0,
        "abstained": True,
        "abstention_reason": reason,
        "question": question,
    }


def _load_corpus() -> List[Dict[str, Any]]:
    docs: List[Dict[str, Any]] = []
    if not GUIDELINES_DIR.exists():
        return docs
    for path in GUIDELINES_DIR.glob("*.json"):
        docs.append(json.loads(path.read_text()))
    return docs


def _tokens(text: str) -> set:
    stop = {
        "the",
        "a",
        "an",
        "is",
        "are",
        "for",
        "to",
        "of",
        "and",
        "or",
        "what",
        "does",
        "this",
        "may",
        "be",
        "in",
        "on",
    }
    return {t for t in re.findall(r"[a-z0-9_]+", text.lower()) if t not in stop and len(t) > 2}
