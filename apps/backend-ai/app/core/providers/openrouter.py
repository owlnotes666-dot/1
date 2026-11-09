
import httpx
from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AsyncOpenAI,
    AuthenticationError,
    RateLimitError,
)

from app.core.config import settings
from app.core.providers.base import (
    BaseAIProvider,
    ProviderMessage,
    ProviderResponse,
)
from app.core.providers.exceptions import (
    ProviderAuthenticationError,
    ProviderConnectionError,
    ProviderRateLimitError,
    ProviderResponseError,
    ProviderTimeoutError,
    ProviderUnavailableError,
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
        try:
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

            if not response.choices:
                raise ProviderResponseError(
                    "The provider returned no response choices."
                )

            content = response.choices[0].message.content

            if not content or not content.strip():
                raise ProviderResponseError(
                    "The provider returned an empty response."
                )

            usage = None

            if response.usage:
                usage = {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                }

            return ProviderResponse(
                content=content,
                model=response.model or model,
                usage=usage,
            )

        except AuthenticationError as exc:
            raise ProviderAuthenticationError(
                "OpenRouter authentication failed."
            ) from exc

        except RateLimitError as exc:
            raise ProviderRateLimitError(
                "OpenRouter rate limit exceeded."
            ) from exc

        except APITimeoutError as exc:
            raise ProviderTimeoutError(
                "OpenRouter request timed out."
            ) from exc

        except APIConnectionError as exc:
            raise ProviderConnectionError(
                "Could not connect to OpenRouter."
            ) from exc

        except APIStatusError as exc:
            if exc.status_code >= 500:
                raise ProviderUnavailableError(
                    "OpenRouter is temporarily unavailable."
                ) from exc

            raise ProviderResponseError(
                f"OpenRouter returned an unexpected status: {exc.status_code}."
            ) from exc

        except httpx.TimeoutException as exc:
            raise ProviderTimeoutError(
                "OpenRouter request timed out."
            ) from exc

        except httpx.ConnectError as exc:
            raise ProviderConnectionError(
                "Could not connect to OpenRouter."
            ) from exc
