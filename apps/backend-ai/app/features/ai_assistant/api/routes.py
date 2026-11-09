from fastapi import APIRouter, Depends, HTTPException, status, Request

from app.core.dependencies.auth import (
    AuthenticatedUser,
    get_current_user,
)
from app.core.providers.exceptions import ProviderConfigurationError
from app.features.ai_assistant.schemas.chat import (
    ChatRequest,
    ChatResponse,
)
from app.features.ai_assistant.services.ai_assistant_service import (
    AIAssistantService,
)

from app.core.rate_limit import limiter


router = APIRouter(
    prefix="/ai-assistant",
    tags=["AI Assistant"],
)


def get_ai_assistant_service() -> AIAssistantService:
    try:
        return AIAssistantService()
    except ProviderConfigurationError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not configured.",
        ) from None


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat(
    request: Request,
    chat_request: ChatRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    ai_service: AIAssistantService = Depends(
        get_ai_assistant_service
    ),
) -> ChatResponse:
    try:
        return await ai_service.generate_response(
            request=chat_request,
            user_id=current_user.id,
            ip_address=(
                request.client.host
                if request.client
                else None
            ),
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid message.",
        ) from None
