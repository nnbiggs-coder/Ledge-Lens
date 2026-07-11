from __future__ import annotations

"""Model provider abstraction — mock by default; Bedrock/Anthropic/OpenAI/Azure/local later."""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class ModelProvider(ABC):
    name: str
    version: str

    @abstractmethod
    def complete(self, prompt: str, *, system: str = "", temperature: float = 0.0) -> str:
        raise NotImplementedError

    @abstractmethod
    def classify(self, text: str, labels: list) -> Dict[str, Any]:
        raise NotImplementedError


class MockModelProvider(ModelProvider):
    """Deterministic mock model — no paid APIs required."""

    name = "mock"
    version = "mock-deterministic-v1"

    def complete(self, prompt: str, *, system: str = "", temperature: float = 0.0) -> str:
        # Never invent chain-of-thought; return concise operational text only.
        lowered = prompt.lower()
        if "classify" in lowered:
            return "classification:determined_from_rules"
        if "recommend" in lowered:
            return "recommendation:derived_from_state"
        return "ok"

    def classify(self, text: str, labels: list) -> Dict[str, Any]:
        text_l = (text or "").lower()
        scores = []
        for label in labels:
            score = 0.2
            for token in str(label).lower().replace("_", " ").split():
                if token in text_l:
                    score += 0.25
            scores.append({"label": label, "score": min(0.95, score)})
        scores.sort(key=lambda x: x["score"], reverse=True)
        best = scores[0] if scores else {"label": "unknown", "score": 0.0}
        return {
            "label": best["label"],
            "confidence": best["score"],
            "alternatives": scores[1:3],
            "provider": self.name,
            "version": self.version,
        }


class BedrockProvider(ModelProvider):
    name = "bedrock"
    version = "unconfigured"

    def complete(self, prompt: str, *, system: str = "", temperature: float = 0.0) -> str:
        raise NotImplementedError("Amazon Bedrock provider is a future integration stub.")

    def classify(self, text: str, labels: list) -> Dict[str, Any]:
        raise NotImplementedError("Amazon Bedrock provider is a future integration stub.")


class AnthropicProvider(ModelProvider):
    name = "anthropic"
    version = "unconfigured"

    def complete(self, prompt: str, *, system: str = "", temperature: float = 0.0) -> str:
        raise NotImplementedError("Anthropic provider is a future integration stub.")

    def classify(self, text: str, labels: list) -> Dict[str, Any]:
        raise NotImplementedError("Anthropic provider is a future integration stub.")


class OpenAIProvider(ModelProvider):
    name = "openai"
    version = "unconfigured"

    def complete(self, prompt: str, *, system: str = "", temperature: float = 0.0) -> str:
        raise NotImplementedError("OpenAI provider is a future integration stub.")

    def classify(self, text: str, labels: list) -> Dict[str, Any]:
        raise NotImplementedError("OpenAI provider is a future integration stub.")


class AzureOpenAIProvider(ModelProvider):
    name = "azure_openai"
    version = "unconfigured"

    def complete(self, prompt: str, *, system: str = "", temperature: float = 0.0) -> str:
        raise NotImplementedError("Azure OpenAI provider is a future integration stub.")

    def classify(self, text: str, labels: list) -> Dict[str, Any]:
        raise NotImplementedError("Azure OpenAI provider is a future integration stub.")


class LocalModelProvider(ModelProvider):
    name = "local"
    version = "unconfigured"

    def complete(self, prompt: str, *, system: str = "", temperature: float = 0.0) -> str:
        raise NotImplementedError("Local model provider is a future integration stub.")

    def classify(self, text: str, labels: list) -> Dict[str, Any]:
        raise NotImplementedError("Local model provider is a future integration stub.")


_PROVIDERS = {
    "mock": MockModelProvider,
    "bedrock": BedrockProvider,
    "anthropic": AnthropicProvider,
    "openai": OpenAIProvider,
    "azure_openai": AzureOpenAIProvider,
    "local": LocalModelProvider,
}


def get_provider(name: str = "mock") -> ModelProvider:
    cls = _PROVIDERS.get(name, MockModelProvider)
    return cls()
