from fastapi import APIRouter, Depends, HTTPException, status, Request
from uuid import UUID

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


from app.features.ai_assistant.services.rag.knowledge_ingestion_service import (
    KnowledgeIngestionService,
)
from app.features.ai_assistant.api.dependencies import (
    get_knowledge_ingestion_service,
)


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


@router.post("/knowledge/{article_id}/ingest")
async def ingest_knowledge_article(
    article_id: UUID,
    ingestion_service: KnowledgeIngestionService = Depends(
        get_knowledge_ingestion_service
    ),
):
    try:
        return await ingestion_service.ingest_article(article_id)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from None

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Knowledge article ingestion failed.",
        ) from None
