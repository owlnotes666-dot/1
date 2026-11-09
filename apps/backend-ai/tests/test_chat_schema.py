import pytest
from pydantic import ValidationError

from app.features.ai_assistant.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ChatUsage,
)


def test_valid_chat_request():
    request = ChatRequest(
        message="Hello AI Assistant"
    )

    assert request.message == "Hello AI Assistant"
    assert request.conversation_id is None


def test_chat_request_trims_whitespace():
    request = ChatRequest(
        message="   Hello AI   "
    )

    assert request.message == "Hello AI"


def test_empty_message_is_rejected():
    with pytest.raises(ValidationError):
        ChatRequest(message="   ")


def test_message_over_max_length_is_rejected():
    with pytest.raises(ValidationError):
        ChatRequest(message="a" * 8001)


def test_valid_chat_response():
    response = ChatResponse(
        message="Hello!",
        provider="openrouter",
        model="test-model",
        usage=ChatUsage(
            prompt_tokens=10,
            completion_tokens=20,
            total_tokens=30,
        ),
    )

    assert response.message == "Hello!"
    assert response.provider == "openrouter"
    assert response.usage.total_tokens == 30