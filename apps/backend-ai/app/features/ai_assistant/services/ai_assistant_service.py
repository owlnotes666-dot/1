from app.core.config import settings
from app.core.providers import (
    ProviderMessage,
    get_ai_provider,
)
from app.features.ai_assistant.prompts.system import SYSTEM_PROMPT
from app.features.ai_assistant.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ChatUsage,
)
from app.features.ai_assistant.services.guardrails import (
    check_user_message,
    check_ai_response,
)


class AIAssistantService:

    def __init__(self) -> None:
        self.provider = get_ai_provider()

    async def generate_response(
        self,
        request: ChatRequest,
    ) -> ChatResponse:

        # 1. Check user input
        input_check = check_user_message(request.message)

        if not input_check.is_allowed:
            raise ValueError("Invalid user message.")

        # 2. Handle emergency situations
        if input_check.is_emergency:
            return ChatResponse(
                conversation_id=request.conversation_id,
                message=(
                    "Your symptoms may indicate a medical emergency. "
                    "Please contact your local emergency services "
                    "immediately. Do not delay seeking professional "
                    "medical care."
                ),
                provider="system",
                model="emergency-response",
            )

        # 3. Handle suspected prompt injection
        if input_check.prompt_injection_suspected:
            return ChatResponse(
                conversation_id=request.conversation_id,
                message=(
                    "I cannot follow instructions that attempt to "
                    "override my safety guidelines. I can help with "
                    "general medical information."
                ),
                provider="system",
                model="guardrails",
            )

        # 4. Prepare model messages
        messages = [
            ProviderMessage(
                role="system",
                content=SYSTEM_PROMPT,
            ),
            ProviderMessage(
                role="user",
                content=request.message,
            ),
        ]

        # 5. Call AI provider
        provider_response = await self.provider.generate(
            messages=messages,
            model=settings.ai_model,
            max_tokens=1024,
            temperature=0.2,
        )

        # 6. Inspect AI output
        output_check = check_ai_response(
            provider_response.content
        )

        if not output_check.is_safe:
            return ChatResponse(
                conversation_id=request.conversation_id,
                message=(
                    "I’m unable to provide a reliable response "
                    "to this request. Please consult a qualified "
                    "healthcare professional when appropriate."
                ),
                provider="system",
                model="output-guardrails",
            )

        # 7. Prepare usage information
        usage = None

        if provider_response.usage:
            usage = ChatUsage(
                prompt_tokens=provider_response.usage.get(
                    "prompt_tokens", 0
                ),
                completion_tokens=provider_response.usage.get(
                    "completion_tokens", 0
                ),
                total_tokens=provider_response.usage.get(
                    "total_tokens", 0
                ),
            )

        # 8. Return final response
        return ChatResponse(
            conversation_id=request.conversation_id,
            message=output_check.content,
            provider=settings.ai_provider,
            model=provider_response.model,
            usage=usage,
        )