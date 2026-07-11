from __future__ import annotations

"""Formal tool registry with schemas, permissions, and audit requirements."""

from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional


@dataclass
class ToolSpec:
    name: str
    description: str
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]
    permission_level: str  # read | write | execute | communicate
    approval_required: bool
    timeout_seconds: int = 10
    retry_policy: Dict[str, Any] = field(default_factory=lambda: {"max_retries": 2, "backoff_seconds": 0.1})
    audit_required: bool = True
    handler: Optional[Callable[..., Dict[str, Any]]] = None


class ToolRegistry:
    def __init__(self) -> None:
        self._tools: Dict[str, ToolSpec] = {}

    def register(self, spec: ToolSpec) -> None:
        self._tools[spec.name] = spec

    def get(self, name: str) -> ToolSpec:
        if name not in self._tools:
            raise KeyError(f"Unknown tool: {name}. Agent must not invent tools.")
        return self._tools[name]

    def list_tools(self) -> List[ToolSpec]:
        return list(self._tools.values())

    def invoke(self, name: str, **kwargs: Any) -> Dict[str, Any]:
        spec = self.get(name)
        if spec.handler is None:
            raise RuntimeError(f"Tool {name} has no handler")
        last_error: Optional[Exception] = None
        retries = int(spec.retry_policy.get("max_retries", 0))
        for attempt in range(retries + 1):
            try:
                result = spec.handler(**kwargs)
                result.setdefault("_tool", name)
                result.setdefault("_attempt", attempt + 1)
                return result
            except Exception as exc:  # noqa: BLE001 — tools must surface failures
                last_error = exc
                if attempt >= retries:
                    break
        raise RuntimeError(f"Tool {name} failed after retries: {last_error}")


_REGISTRY: Optional[ToolRegistry] = None


def get_registry() -> ToolRegistry:
    global _REGISTRY
    if _REGISTRY is None:
        from tools import register_all_tools

        _REGISTRY = ToolRegistry()
        register_all_tools(_REGISTRY)
    return _REGISTRY
