from __future__ import annotations

"""Working, episodic, and semantic memory layers."""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
EPISODIC_PATH = ROOT / "data" / "outcomes" / "episodic_memory.json"
GUIDELINES_DIR = ROOT / "data" / "guidelines"
APPETITE_PATH = ROOT / "data" / "appetite" / "rules.json"


class WorkingMemory:
    """Holds the current submission AgentState only."""

    def __init__(self) -> None:
        self._current: Optional[Dict[str, Any]] = None

    def set(self, state: Dict[str, Any]) -> None:
        self._current = state

    def get(self) -> Optional[Dict[str, Any]]:
        return self._current


class EpisodicMemory:
    """Prior submissions, recommendations, human decisions, outcomes — not facts about a new insured."""

    def __init__(self, path: Path = EPISODIC_PATH) -> None:
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text("[]")

    def _load(self) -> List[Dict[str, Any]]:
        return json.loads(self.path.read_text())

    def _save(self, items: List[Dict[str, Any]]) -> None:
        self.path.write_text(json.dumps(items, indent=2))

    def record_episode(self, episode: Dict[str, Any]) -> Dict[str, Any]:
        items = self._load()
        episode = {**episode, "episode_id": episode.get("episode_id") or str(uuid4())}
        # Explicit boundary: episodic facts are historical, not transferable insured facts
        episode["memory_type"] = "episodic"
        episode["do_not_treat_as_current_insured_fact"] = True
        items.append(episode)
        self._save(items)
        return episode

    def list_by_broker(self, broker_name: str) -> List[Dict[str, Any]]:
        key = (broker_name or "").lower()
        return [
            e
            for e in self._load()
            if key and key in str(e.get("broker_name", "")).lower()
        ]

    def list_all(self) -> List[Dict[str, Any]]:
        return self._load()


class SemanticMemory:
    """Guidelines, appetite rules, product definitions, approved procedures."""

    def retrieve_guidelines(self, product: Optional[str] = None) -> List[Dict[str, Any]]:
        docs = []
        if not GUIDELINES_DIR.exists():
            return docs
        for path in GUIDELINES_DIR.glob("*.json"):
            doc = json.loads(path.read_text())
            doc["_source_path"] = str(path)
            if product and doc.get("product") not in {product, "all", None, ""}:
                continue
            docs.append(doc)
        return docs

    def retrieve_appetite_rules(self) -> Dict[str, Any]:
        if APPETITE_PATH.exists():
            rules = json.loads(APPETITE_PATH.read_text())
            rules["_source_path"] = str(APPETITE_PATH)
            return rules
        return {}


class MemoryFacade:
    def __init__(self) -> None:
        self.working = WorkingMemory()
        self.episodic = EpisodicMemory()
        self.semantic = SemanticMemory()
