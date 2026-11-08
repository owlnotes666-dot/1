from openai import AsyncOpenAI

from app.core.config import settings
from app.core.providers.base import (
    BaseAIProvider,
    ProviderMessage,
    ProviderResponse,
)


class OpenRouterProvider(BaseAIProvider):
    """OpenRouter AI Provider implementation."""

    def __init__(self) -> None:
        api_key = (
            settings.openrouter_api_key.get_secret_value()
            if settings.openrouter_api_key
            else None
        )

        self.client = AsyncOpenAI(
            api_key=api_key or "missing-api-key",
            base_url="https://openrouter.ai/api/v1",
            timeout=60,
        )

    async def generate(
        self,
        messages: list[ProviderMessage],
        model: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> ProviderResponse:

        response = await self.client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": message.role,
                    "content": message.content,
                }
                for message in messages
            ],
            max_tokens=max_tokens,
            temperature=temperature,
        )

        content = response.choices[0].message.content

        usage = None

        if response.usage:
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            }

        return ProviderResponse(
            content=content or "",
            model=response.model or model,
            usage=usage,
        )
