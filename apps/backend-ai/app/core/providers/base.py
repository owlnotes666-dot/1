from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Literal


MessageRole = Literal["system", "user", "assistant"]


@dataclass
class ProviderMessage:
    role: MessageRole
    content: str


@dataclass
class ProviderResponse:
    content: str
    model: str
    usage: dict[str, int | float] | None = None


class BaseAIProvider(ABC):
    """Common interface for all AI providers."""

    @abstractmethod
    async def generate(
        self,
        messages: list[ProviderMessage],
        model: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> ProviderResponse:
        """Generate an AI response from a list of messages."""
        raise NotImplementedError