from huggingface_hub import AsyncInferenceClient

from app.core.config import settings
from app.core.providers.base import (
    BaseAIProvider,
    ProviderMessage,
    ProviderResponse,
)


class HuggingFaceProvider(BaseAIProvider):
    """Hugging Face Inference Provider implementation."""

    def __init__(self) -> None:
        token = (
            settings.hf_token.get_secret_value()
            if settings.hf_token
            else None
        )

        self.client = AsyncInferenceClient(
            token=token,
            timeout=60,
        )

    async def generate(
        self,
        messages: list[ProviderMessage],
        model: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> ProviderResponse:

        response = await self.client.chat_completion(
            messages=[
                {
                    "role": message.role,
                    "content": message.content,
                }
                for message in messages
            ],
            model=model,
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