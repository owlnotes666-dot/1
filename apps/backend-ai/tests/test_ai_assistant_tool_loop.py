from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core.providers.base import ProviderResponse, ProviderToolCall
from app.features.ai_assistant.services.ai_assistant_service import (
    AIAssistantService,
)


@pytest.mark.asyncio
async def test_admin_can_execute_database_tool(monkeypatch):
    provider = MagicMock()
    provider.generate = AsyncMock(
        side_effect=[
            ProviderResponse(
                content=None,
                model="test-model",
                tool_calls=[
                    ProviderToolCall(
                        id="call_123",
                        name="get_patient_statistics",
                        arguments={"status": "Active"},
                    )
                ],
            ),
            ProviderResponse(
                content="There are 10 active patients.",
                model="test-model",
                usage={
                    "prompt_tokens": 20,
                    "completion_tokens": 10,
                    "total_tokens": 30,
                },
            ),
        ]
    )

    monkeypatch.setattr(
        "app.features.ai_assistant.services.ai_assistant_service.get_ai_provider",
        lambda: provider,
    )

    tool_executor = MagicMock()
    tool_executor.execute.return_value = {"total": 10}

    service = AIAssistantService(tool_executor=tool_executor)

    from app.core.providers.base import ProviderMessage

    messages = [
        ProviderMessage(role="user", content="How many active patients?")
    ]

    response, usage = await service._generate_with_tools(messages)

    assert response.content == "There are 10 active patients."
    assert usage["total_tokens"] == 30

    tool_executor.execute.assert_called_once_with(
        tool_name="get_patient_statistics",
        arguments={"status": "Active"},
    )

    assert provider.generate.await_count == 2


@pytest.mark.asyncio
async def test_demo_cannot_access_database_tools(monkeypatch):
    provider = MagicMock()
    provider.generate = AsyncMock(
        return_value=ProviderResponse(
            content="I can help with general medical knowledge.",
            model="test-model",
            usage={"prompt_tokens": 10,
                   "completion_tokens": 8, "total_tokens": 18},
        )
    )

    monkeypatch.setattr(
        "app.features.ai_assistant.services.ai_assistant_service.get_ai_provider",
        lambda: provider,
    )

    service = AIAssistantService(tool_executor=None)

    from app.core.providers.base import ProviderMessage

    messages = [
        ProviderMessage(role="user", content="How many active patients?")
    ]

    response, usage = await service._generate_with_tools(messages)

    assert response.content == "I can help with general medical knowledge."
    assert usage["total_tokens"] == 18

    provider.generate.assert_awaited_once()

    call_kwargs = provider.generate.await_args.kwargs
    assert call_kwargs["tools"] is None


@pytest.mark.asyncio
async def test_multiple_database_tool_calls(monkeypatch):
    provider = MagicMock()
    provider.generate = AsyncMock(
        side_effect=[
            ProviderResponse(
                content=None,
                model="test-model",
                tool_calls=[
                    ProviderToolCall(
                        id="call_1",
                        name="get_patient_statistics",
                        arguments={"status": "Active"},
                    ),
                    ProviderToolCall(
                        id="call_2",
                        name="get_doctor_statistics",
                        arguments={"specialty": None, "status": "Active"},
                    ),
                ],
            ),
            ProviderResponse(
                content="There are 10 active patients and 5 active doctors.",
                model="test-model",
            ),
        ]
    )

    monkeypatch.setattr(
        "app.features.ai_assistant.services.ai_assistant_service.get_ai_provider",
        lambda: provider,
    )

    tool_executor = MagicMock()
    tool_executor.execute.side_effect = [
        {"total": 10},
        {"total": 5},
    ]

    service = AIAssistantService(tool_executor=tool_executor)

    from app.core.providers.base import ProviderMessage

    messages = [
        ProviderMessage(
            role="user", content="Show active patient and doctor counts.")
    ]

    response, _ = await service._generate_with_tools(messages)

    assert response.content == (
        "There are 10 active patients and 5 active doctors."
    )

    assert tool_executor.execute.call_count == 2
    assert provider.generate.await_count == 2

    tool_messages = [
        message for message in messages if message.role == "tool"
    ]

    assert len(tool_messages) == 2
    assert tool_messages[0].tool_call_id == "call_1"
    assert tool_messages[1].tool_call_id == "call_2"


@pytest.mark.asyncio
async def test_tool_call_limit_is_enforced(monkeypatch):
    provider = MagicMock()
    provider.generate = AsyncMock(
        return_value=ProviderResponse(
            content=None,
            model="test-model",
            tool_calls=[
                ProviderToolCall(
                    id=f"call_{index}",
                    name="get_patient_statistics",
                    arguments={"status": "Active"},
                )
                for index in range(6)
            ],
        )
    )

    monkeypatch.setattr(
        "app.features.ai_assistant.services.ai_assistant_service.get_ai_provider",
        lambda: provider,
    )

    tool_executor = MagicMock()
    service = AIAssistantService(tool_executor=tool_executor)

    from app.core.providers.base import ProviderMessage
    from app.core.providers.exceptions import ProviderResponseError

    messages = [
        ProviderMessage(role="user", content="Get patient statistics.")
    ]

    with pytest.raises(
        ProviderResponseError,
        match="Maximum tool calls per round exceeded",
    ):
        await service._generate_with_tools(messages)

    tool_executor.execute.assert_not_called()


@pytest.mark.asyncio
async def test_max_tool_rounds_are_enforced(monkeypatch):
    provider = MagicMock()
    provider.generate = AsyncMock(
        return_value=ProviderResponse(
            content=None,
            model="test-model",
            tool_calls=[
                ProviderToolCall(
                    id="call_1",
                    name="get_patient_statistics",
                    arguments={"status": "Active"},
                )
            ],
        )
    )

    monkeypatch.setattr(
        "app.features.ai_assistant.services.ai_assistant_service.get_ai_provider",
        lambda: provider,
    )

    tool_executor = MagicMock()
    tool_executor.execute.return_value = {"total": 10}

    service = AIAssistantService(tool_executor=tool_executor)

    from app.core.providers.base import ProviderMessage
    from app.core.providers.exceptions import ProviderResponseError

    messages = [
        ProviderMessage(role="user", content="Get patient statistics.")
    ]

    with pytest.raises(
        ProviderResponseError,
        match="Maximum tool execution rounds exceeded",
    ):
        await service._generate_with_tools(messages)

    assert provider.generate.await_count == service.MAX_TOOL_ROUNDS + 1
    assert tool_executor.execute.call_count == service.MAX_TOOL_ROUNDS


@pytest.mark.asyncio
async def test_tool_execution_error_is_sanitized(monkeypatch):
    from app.core.providers.base import ProviderMessage
    from app.features.ai_assistant.services.database_agent.tool_executor import (
        ToolExecutionError,
    )

    provider = MagicMock()
    provider.generate = AsyncMock(
        side_effect=[
            ProviderResponse(
                content=None,
                model="test-model",
                tool_calls=[
                    ProviderToolCall(
                        id="call_1",
                        name="get_patient_statistics",
                        arguments={"status": "Invalid"},
                    )
                ],
            ),
            ProviderResponse(
                content="I couldn't retrieve the requested statistics.",
                model="test-model",
            ),
        ]
    )

    monkeypatch.setattr(
        "app.features.ai_assistant.services.ai_assistant_service.get_ai_provider",
        lambda: provider,
    )

    tool_executor = MagicMock()
    tool_executor.execute.side_effect = ToolExecutionError(
        "Internal database details must not be exposed."
    )

    service = AIAssistantService(tool_executor=tool_executor)

    messages = [
        ProviderMessage(role="user", content="Get patient statistics.")
    ]

    response, _ = await service._generate_with_tools(messages)

    assert response.content == "I couldn't retrieve the requested statistics."

    tool_result = messages[-1]
    assert tool_result.role == "tool"
    assert "The requested database operation was rejected." in tool_result.content
    assert "Internal database details" not in tool_result.content


@pytest.mark.asyncio
async def test_sequential_tool_calls_across_rounds(monkeypatch):
    from app.core.providers.base import ProviderMessage

    provider = MagicMock()
    provider.generate = AsyncMock(
        side_effect=[
            ProviderResponse(
                content=None,
                model="test-model",
                tool_calls=[
                    ProviderToolCall(
                        id="call_1",
                        name="get_patient_statistics",
                        arguments={"status": "Active"},
                    )
                ],
            ),
            ProviderResponse(
                content=None,
                model="test-model",
                tool_calls=[
                    ProviderToolCall(
                        id="call_2",
                        name="get_doctor_statistics",
                        arguments={"specialty": None, "status": "Active"},
                    )
                ],
            ),
            ProviderResponse(
                content="There are 10 active patients and 5 active doctors.",
                model="test-model",
            ),
        ],
    )

    monkeypatch.setattr(
        "app.features.ai_assistant.services.ai_assistant_service.get_ai_provider",
        lambda: provider,
    )

    tool_executor = MagicMock()
    tool_executor.execute.side_effect = [
        {"total": 10},
        {"total": 5},
    ]

    service = AIAssistantService(tool_executor=tool_executor)

    messages = [
        ProviderMessage(
            role="user",
            content="How many active patients and doctors are there?",
        )
    ]

    response, _ = await service._generate_with_tools(messages)

    assert response.content == (
        "There are 10 active patients and 5 active doctors."
    )

    assert provider.generate.await_count == 3
    assert tool_executor.execute.call_count == 2

    tool_messages = [
        message for message in messages if message.role == "tool"
    ]

    assert len(tool_messages) == 2
    assert tool_messages[0].tool_call_id == "call_1"
    assert tool_messages[1].tool_call_id == "call_2"
