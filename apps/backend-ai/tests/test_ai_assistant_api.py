
from uuid import uuid4
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.core.providers.base import ProviderResponse, ProviderToolCall

from app.main import app
from app.core.dependencies.auth import (
    AuthenticatedUser,
    get_current_user,
)
from app.features.ai_assistant.api.routes import (
    get_ai_assistant_service,
)
from app.features.ai_assistant.schemas.chat import (
    ChatResponse,
)

from app.core.rate_limit import limiter

from app.features.ai_assistant.services.ai_assistant_service import (
    AIAssistantService,
)

from app.core.dependencies.auth import get_current_admin

from app.features.ai_assistant.services.rag.knowledge_ingestion_service import (
    KnowledgeIngestionService,
)

from app.features.ai_assistant.api.routes import (
    get_knowledge_ingestion_service,
)


class FakeAIAssistantService:
    async def generate_response(
        self,
        request,
        user_id=None,
        ip_address=None,
        use_provider_stream=False,
    ):
        return ChatResponse(
            conversation_id=request.conversation_id,
            message="A medical dashboard helps organize healthcare information.",
            provider="openrouter",
            model="test-model",
        )


class FakeKnowledgeIngestionService:
    async def ingest_article(self, article_id):
        return {
            "article_id": str(article_id),
            "title": "Diabetes Overview",
            "chunks_created": 3,
            "status": "indexed",
        }


@pytest.fixture
def client():
    app.dependency_overrides.clear()

    app.dependency_overrides[
        get_ai_assistant_service
    ] = lambda: FakeAIAssistantService()

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def test_chat_requires_authentication(client):
    response = client.post(
        "/api/v1/ai-assistant/chat",
        json={"message": "What is a medical dashboard?"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Authentication required."


def test_authenticated_user_can_chat(client):
    user = AuthenticatedUser(
        id=uuid4(),
        email="demo@example.com",
    )

    app.dependency_overrides[get_current_user] = lambda: user

    response = client.post(
        "/api/v1/ai-assistant/chat",
        json={"message": "What is a medical dashboard?"},
    )

    assert response.status_code == 200
    assert (
        response.json()["message"]
        == "A medical dashboard helps organize healthcare information."
    )
    assert response.json()["provider"] == "openrouter"


def test_chat_rejects_invalid_message(client):
    user = AuthenticatedUser(
        id=uuid4(),
        email="demo@example.com",
    )

    app.dependency_overrides[get_current_user] = lambda: user

    response = client.post(
        "/api/v1/ai-assistant/chat",
        json={"message": "   "},
    )

    assert response.status_code == 422


def test_chat_rate_limit(client):
    user = AuthenticatedUser(
        id=uuid4(),
        email="demo@example.com",
    )

    app.dependency_overrides[get_current_user] = lambda: user

    # Use a separate IP to isolate this test.
    with TestClient(
        app,
        client=("198.51.100.25", 12345),
    ) as rate_limit_client:

        responses = []

        for _ in range(11):
            response = rate_limit_client.post(
                "/api/v1/ai-assistant/chat",
                json={
                    "message": "What is a medical dashboard?"
                },
            )
            responses.append(response)

    assert all(
        response.status_code == 200
        for response in responses[:10]
    )

    assert responses[10].status_code == 429


def test_rate_limit_exceeded_is_audited(client):
    user = AuthenticatedUser(
        id=uuid4(),
        email="demo@example.com",
    )

    app.dependency_overrides[get_current_user] = lambda: user

    with patch(
        "app.main.audit_security_event"
    ) as mock_audit:

        with TestClient(
            app,
            client=("198.51.100.30", 12345),
        ) as rate_limit_client:

            responses = []

            for _ in range(11):
                response = rate_limit_client.post(
                    "/api/v1/ai-assistant/chat",
                    json={
                        "message": "What is a medical dashboard?"
                    },
                )
                responses.append(response)

    assert responses[10].status_code == 429

    mock_audit.assert_called_once_with(
        event_name="rate_limit_exceeded",
        ip_address="198.51.100.30",
    )


@pytest.mark.asyncio
async def test_chat_returns_web_sources(client, monkeypatch):
    from unittest.mock import AsyncMock, MagicMock

    user = AuthenticatedUser(
        id=uuid4(),
        email="demo@example.com",
    )

    app.dependency_overrides[get_current_user] = lambda: user

    # Mock input guardrails
    monkeypatch.setattr(
        "app.features.ai_assistant.services.ai_assistant_service.check_user_message",
        lambda message: SimpleNamespace(
            is_allowed=True,
            is_emergency=False,
            prompt_injection_suspected=False,
        ),
    )

    monkeypatch.setattr(
        "app.features.ai_assistant.services.ai_assistant_service.inspect_pii",
        lambda message: SimpleNamespace(
            contains_pii=False,
            redacted_content=message,
        ),
    )

    monkeypatch.setattr(
        "app.features.ai_assistant.services.ai_assistant_service.detect_prompt_injection",
        AsyncMock(return_value=False),
    )

    # Mock output guardrails
    monkeypatch.setattr(
        "app.features.ai_assistant.services.ai_assistant_service.check_ai_response",
        lambda content: SimpleNamespace(
            is_safe=True,
            content=content,
        ),
    )

    monkeypatch.setattr(
        "app.features.ai_assistant.services.ai_assistant_service.detect_unsafe_output",
        AsyncMock(return_value=False),
    )

    # Mock LLM provider
    provider = MagicMock()

    provider.generate = AsyncMock(
        side_effect=[
            ProviderResponse(
                content=None,
                model="test-model",
                tool_calls=[
                    ProviderToolCall(
                        id="call_search_1",
                        name="search_web",
                        arguments={
                            "query": "diabetes treatment guidelines"
                        },
                    )
                ],
            ),
            ProviderResponse(
                content=(
                    "According to the available web sources, "
                    "diabetes treatment depends on individual "
                    "clinical circumstances."
                ),
                model="test-model",
                usage={
                    "prompt_tokens": 100,
                    "completion_tokens": 40,
                    "total_tokens": 140,
                },
            ),
        ]
    )

    monkeypatch.setattr(
        "app.features.ai_assistant.services.ai_assistant_service.get_ai_provider",
        lambda: provider,
    )

    # Mock Tavily search executor
    web_search_executor = MagicMock()

    web_search_executor.execute = AsyncMock(
        return_value={
            "query": "diabetes treatment guidelines",
            "results": [
                {
                    "title": "Diabetes Clinical Guidelines",
                    "url": "https://example.com/diabetes-guidelines",
                    "content": "Clinical guidelines overview.",
                    "score": 0.95,
                }
            ],
        }
    )

    # Use the real AI Assistant service
    ai_service = AIAssistantService(
        web_search_executor=web_search_executor,
    )

    app.dependency_overrides[
        get_ai_assistant_service
    ] = lambda: ai_service

    response = client.post(
        "/api/v1/ai-assistant/chat",
        json={
            "message": "Search for diabetes treatment guidelines."
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "diabetes treatment depends" in data["message"]

    assert len(data["web_sources"]) == 1

    assert data["web_sources"][0]["title"] == (
        "Diabetes Clinical Guidelines"
    )

    assert data["web_sources"][0]["url"] == (
        "https://example.com/diabetes-guidelines"
    )

    assert data["web_sources"][0]["score"] == 0.95

    web_search_executor.execute.assert_awaited_once_with(
        name="search_web",
        arguments={
            "query": "diabetes treatment guidelines"
        },
    )

    assert provider.generate.await_count == 2
