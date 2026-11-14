
from unittest.mock import AsyncMock, MagicMock
from types import SimpleNamespace

import httpx
import pytest
from openai import (
    APIConnectionError,
    APITimeoutError,
    AuthenticationError,
    RateLimitError,
)

from app.core.providers.exceptions import (
    ProviderAuthenticationError,
    ProviderConnectionError,
    ProviderRateLimitError,
    ProviderTimeoutError,
)
from app.core.providers.openrouter import OpenRouterProvider

from openai import APIStatusError

from app.core.providers.exceptions import (
    ProviderResponseError,
    ProviderUnavailableError,
)


@pytest.fixture
def provider():
    instance = OpenRouterProvider()
    instance.client.chat.completions.create = AsyncMock()
    return instance


@pytest.fixture
def messages():
    from app.core.providers.base import ProviderMessage

    return [
        ProviderMessage(
            role="user",
            content="Explain medical dashboards.",
        )
    ]


class MockAsyncStream:
    def __init__(self, chunks):
        self.chunks = chunks

    def __aiter__(self):
        async def iterator():
            for chunk in self.chunks:
                yield chunk

        return iterator()


@pytest.mark.anyio
async def test_authentication_error(provider, messages):
    provider.client.chat.completions.create.side_effect = AuthenticationError(
        message="Unauthorized",
        response=httpx.Response(
            status_code=401,
            request=httpx.Request("POST", "https://openrouter.ai/api/v1"),
        ),
        body=None,
    )

    with pytest.raises(ProviderAuthenticationError):
        await provider.generate(messages, "test-model")


@pytest.mark.anyio
async def test_rate_limit_error(provider, messages):
    provider.client.chat.completions.create.side_effect = RateLimitError(
        message="Rate limit exceeded",
        response=httpx.Response(
            status_code=429,
            request=httpx.Request("POST", "https://openrouter.ai/api/v1"),
        ),
        body=None,
    )

    with pytest.raises(ProviderRateLimitError):
        await provider.generate(messages, "test-model")


@pytest.mark.anyio
async def test_timeout_error(provider, messages):
    provider.client.chat.completions.create.side_effect = APITimeoutError(
        request=httpx.Request(
            "POST",
            "https://openrouter.ai/api/v1",
        )
    )

    with pytest.raises(ProviderTimeoutError):
        await provider.generate(messages, "test-model")


@pytest.mark.anyio
async def test_connection_error(provider, messages):
    provider.client.chat.completions.create.side_effect = APIConnectionError(
        request=httpx.Request(
            "POST",
            "https://openrouter.ai/api/v1",
        )
    )

    with pytest.raises(ProviderConnectionError):
        await provider.generate(messages, "test-model")


@pytest.mark.anyio
async def test_provider_unavailable_error(provider, messages):
    provider.client.chat.completions.create.side_effect = APIStatusError(
        message="Internal Server Error",
        response=httpx.Response(
            status_code=503,
            request=httpx.Request(
                "POST",
                "https://openrouter.ai/api/v1",
            ),
        ),
        body=None,
    )

    with pytest.raises(ProviderUnavailableError):
        await provider.generate(messages, "test-model")


@pytest.mark.anyio
async def test_invalid_provider_response(provider, messages):
    response = MagicMock()
    response.choices = []

    provider.client.chat.completions.create.return_value = response

    with pytest.raises(ProviderResponseError):
        await provider.generate(messages, "test-model")


@pytest.mark.anyio
async def test_empty_provider_response(provider, messages):
    response = MagicMock()
    response.choices = [MagicMock()]
    response.choices[0].message.content = ""

    provider.client.chat.completions.create.return_value = response

    with pytest.raises(ProviderResponseError):
        await provider.generate(messages, "test-model")


@pytest.mark.anyio
async def test_generate_stream_collects_text(provider, messages):
    chunks = [
        SimpleNamespace(
            model="test-model",
            choices=[
                SimpleNamespace(
                    delta=SimpleNamespace(
                        content="Hello ",
                        tool_calls=None,
                    )
                )
            ],
            usage=None,
        ),
        SimpleNamespace(
            model="test-model",
            choices=[
                SimpleNamespace(
                    delta=SimpleNamespace(
                        content="world!",
                        tool_calls=None,
                    )
                )
            ],
            usage=None,
        ),
        SimpleNamespace(
            model="test-model",
            choices=[],
            usage=SimpleNamespace(
                prompt_tokens=10,
                completion_tokens=5,
                total_tokens=15,
            ),
        ),
    ]

    provider.client.chat.completions.create.return_value = (
        MockAsyncStream(chunks)
    )

    response = await provider.generate_stream(
        messages=messages,
        model="test-model",
    )

    assert response.content == "Hello world!"
    assert response.model == "test-model"
    assert response.usage == {
        "prompt_tokens": 10,
        "completion_tokens": 5,
        "total_tokens": 15,
    }
    assert response.tool_calls == []

    provider.client.chat.completions.create.assert_called_once()

    call_kwargs = (
        provider.client.chat.completions.create.call_args.kwargs
    )
    assert call_kwargs["stream"] is True


@pytest.mark.anyio
async def test_generate_stream_collects_tool_calls(provider, messages):
    chunks = [
        SimpleNamespace(
            model="test-model",
            choices=[
                SimpleNamespace(
                    delta=SimpleNamespace(
                        content=None,
                        tool_calls=[
                            SimpleNamespace(
                                index=0,
                                id="call_123",
                                function=SimpleNamespace(
                                    name="search_web",
                                    arguments='{"query":',
                                ),
                            )
                        ],
                    )
                )
            ],
            usage=None,
        ),
        SimpleNamespace(
            model="test-model",
            choices=[
                SimpleNamespace(
                    delta=SimpleNamespace(
                        content=None,
                        tool_calls=[
                            SimpleNamespace(
                                index=0,
                                id=None,
                                function=SimpleNamespace(
                                    name=None,
                                    arguments='"medical AI"}',
                                ),
                            )
                        ],
                    )
                )
            ],
            usage=None,
        ),
    ]

    provider.client.chat.completions.create.return_value = (
        MockAsyncStream(chunks)
    )

    response = await provider.generate_stream(
        messages=messages,
        model="test-model",
        tools=[{"type": "function"}],
    )

    assert response.content is None
    assert len(response.tool_calls) == 1

    tool_call = response.tool_calls[0]

    assert tool_call.id == "call_123"
    assert tool_call.name == "search_web"
    assert tool_call.arguments == {
        "query": "medical AI",
    }
