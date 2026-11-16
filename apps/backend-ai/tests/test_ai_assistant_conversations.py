from uuid import uuid4
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core.providers.base import ProviderResponse
from app.features.ai_assistant.schemas.chat import ChatRequest
from app.features.ai_assistant.services.ai_assistant_service import (
    AIAssistantService,
)


@pytest.fixture
def admin_id():
    return uuid4()


@pytest.fixture
def conversation_id():
    return uuid4()


@pytest.fixture
def repository(admin_id, conversation_id):
    repo = MagicMock()

    repo.create_conversation.return_value = {
        "id": str(conversation_id),
        "owner_id": str(admin_id),
        "title": "Test question",
    }

    repo.get_conversation.return_value = {
        "id": str(conversation_id),
        "owner_id": str(admin_id),
        "title": "Test conversation",
    }

    return repo


@pytest.fixture
def provider(monkeypatch):
    mock_provider = MagicMock()

    mock_provider.generate = AsyncMock(
        return_value=ProviderResponse(
            content="This is a safe medical information response.",
            model="test-model",
            usage={
                "prompt_tokens": 20,
                "completion_tokens": 10,
                "total_tokens": 30,
            },
        )
    )

    monkeypatch.setattr(
        "app.features.ai_assistant.services.ai_assistant_service.get_ai_provider",
        lambda: mock_provider,
    )

    return mock_provider


@pytest.fixture
def safe_guardrails(monkeypatch):
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
            contains_pii=True,
            redacted_content="Patient information was redacted.",
        ),
    )

    monkeypatch.setattr(
        "app.features.ai_assistant.services.ai_assistant_service.detect_prompt_injection",
        AsyncMock(return_value=False),
    )

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


@pytest.mark.asyncio
async def test_admin_new_conversation_is_created_and_saved(
    admin_id,
    conversation_id,
    repository,
    provider,
    safe_guardrails,
):
    service = AIAssistantService(
        conversation_repository=repository,
    )

    response = await service.generate_response(
        request=ChatRequest(
            message="My patient information is confidential."
        ),
        user_id=admin_id,
    )

    assert response.conversation_id == conversation_id

    repository.create_conversation.assert_called_once_with(
        owner_id=admin_id,
        title="Patient information was redacted.",
    )

    assert repository.save_message.call_count == 2

    first_saved_message = repository.save_message.call_args_list[0].kwargs
    second_saved_message = repository.save_message.call_args_list[1].kwargs

    assert first_saved_message["role"] == "user"
    assert first_saved_message["content"] == (
        "Patient information was redacted."
    )

    assert second_saved_message["role"] == "assistant"
    assert second_saved_message["content"] == (
        "This is a safe medical information response."
    )

    repository.update_conversation.assert_called_once()

    provider.generate.assert_awaited_once()


@pytest.mark.asyncio
async def test_admin_existing_conversation_is_reused(
    admin_id,
    conversation_id,
    repository,
    provider,
    safe_guardrails,
):
    service = AIAssistantService(
        conversation_repository=repository,
    )

    response = await service.generate_response(
        request=ChatRequest(
            message="Continue this conversation.",
            conversation_id=conversation_id,
        ),
        user_id=admin_id,
    )

    assert response.conversation_id == conversation_id

    repository.get_conversation.assert_called_once_with(
        conversation_id
    )

    repository.create_conversation.assert_not_called()

    assert repository.save_message.call_count == 2


@pytest.mark.asyncio
async def test_admin_cannot_access_another_users_conversation(
    admin_id,
    conversation_id,
    repository,
    provider,
    safe_guardrails,
):
    repository.get_conversation.return_value = {
        "id": str(conversation_id),
        "owner_id": str(uuid4()),
        "title": "Another user's conversation",
    }

    service = AIAssistantService(
        conversation_repository=repository,
    )

    with pytest.raises(ValueError, match="Conversation not found"):
        await service.generate_response(
            request=ChatRequest(
                message="Try to access another conversation.",
                conversation_id=conversation_id,
            ),
            user_id=admin_id,
        )

    repository.save_message.assert_not_called()
    provider.generate.assert_not_awaited()


@pytest.mark.asyncio
async def test_admin_cannot_continue_nonexistent_conversation(
    admin_id,
    conversation_id,
    repository,
    provider,
    safe_guardrails,
):
    repository.get_conversation.return_value = None

    service = AIAssistantService(
        conversation_repository=repository,
    )

    with pytest.raises(ValueError, match="Conversation not found"):
        await service.generate_response(
            request=ChatRequest(
                message="Continue missing conversation.",
                conversation_id=conversation_id,
            ),
            user_id=admin_id,
        )

    repository.create_conversation.assert_not_called()
    repository.save_message.assert_not_called()
    provider.generate.assert_not_awaited()