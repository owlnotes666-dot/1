from uuid import uuid4
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

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


class FakeAIAssistantService:
    async def generate_response(
        self,
        request,
        user_id=None,
        ip_address=None,
    ):
        return ChatResponse(
            conversation_id=request.conversation_id,
            message="A medical dashboard helps organize healthcare information.",
            provider="openrouter",
            model="test-model",
        )


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
