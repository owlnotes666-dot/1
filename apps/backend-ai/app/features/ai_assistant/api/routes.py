import time
from uuid import UUID
import json
import logging

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse

from app.core.dependencies.auth import (
    AuthenticatedUser,
    get_current_user,
    get_current_admin,
)
from app.core.rate_limit import limiter


from app.features.ai_assistant.schemas.chat import (
    ChatRequest,
    ChatResponse,
)
from app.features.ai_assistant.services.ai_assistant_service import (
    AIAssistantService,
)
from app.features.ai_assistant.services.rag.knowledge_ingestion_service import (
    KnowledgeIngestionService,
)
from app.features.ai_assistant.api.dependencies import (
    get_knowledge_ingestion_service,
    get_ai_assistant_service,
)


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/ai-assistant",
    tags=["AI Assistant"],
)


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


@router.post("/chat/stream")
@limiter.limit("10/minute")
async def chat_stream(
    request: Request,
    chat_request: ChatRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    ai_service: AIAssistantService = Depends(
        get_ai_assistant_service
    ),
):
    async def event_generator():
        try:
            response = await ai_service.generate_response(
                request=chat_request,
                user_id=current_user.id,
                ip_address=(
                    request.client.host
                    if request.client
                    else None
                ),
                use_provider_stream=True,
            )

            metadata = response.model_dump(
                mode="json",
                exclude={"message"},
            )

            yield (
                f"event: metadata\n"
                f"data: {json.dumps(metadata)}\n\n"
            )

            message = response.message
            chunk_size = 24

            for index in range(0, len(message), chunk_size):
                chunk = message[index:index + chunk_size]

                logger.info(
                    "SSE chunk sent | index=%s | time=%.3f",
                    index,
                    time.perf_counter(),
                )
                print(
                    f"SSE CHUNK SENT: index={index}, length={len(chunk)}", flush=True)
                yield (
                    f"event: chunk\n"
                    f"data: {json.dumps({'content': chunk}, ensure_ascii=False)}\n\n"
                )

            yield "event: done\ndata: {}\n\n"

        except ValueError:
            error = {
                "message": "Invalid message."
            }

            yield (
                f"event: error\n"
                f"data: {json.dumps(error)}\n\n"
            )

        except Exception:
            logger.exception("AI streaming request failed.")

            error = {
                "message": "The AI service is temporarily unavailable."
            }

            yield (
                f"event: error\n"
                f"data: {json.dumps(error)}\n\n"
            )

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.post("/knowledge/{article_id}/ingest")
async def ingest_knowledge_article(
    article_id: UUID,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
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


@router.delete("/knowledge/{article_id}/index")
async def remove_knowledge_article_index(
    article_id: UUID,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    ingestion_service: KnowledgeIngestionService = Depends(
        get_knowledge_ingestion_service
    ),
):
    try:
        return ingestion_service.remove_article_index(article_id)

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Knowledge article index removal failed.",
        ) from None


@router.post("/knowledge/ingest-all")
@limiter.limit("2/minute")
async def ingest_all_knowledge_articles(
    request: Request,
    current_admin: AuthenticatedUser = Depends(get_current_admin),
    ingestion_service: KnowledgeIngestionService = Depends(
        get_knowledge_ingestion_service
    ),
):
    try:
        return await ingestion_service.ingest_all_articles()

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Bulk knowledge ingestion failed.",
        ) from None
