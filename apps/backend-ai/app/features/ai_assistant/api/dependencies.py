from fastapi import Depends, HTTPException, status

from app.core.dependencies.auth import (
    AuthenticatedUser,
    get_current_admin,
)
from app.core.supabase import get_supabase_user_client

from app.features.ai_assistant.repositories.knowledge_article_repository import (
    KnowledgeArticleRepository,
)
from app.features.ai_assistant.repositories.knowledge_chunk_repository import (
    KnowledgeChunkRepository,
)
from app.features.ai_assistant.services.rag.document_processing_service import (
    DocumentProcessingService,
)
from app.features.ai_assistant.services.rag.knowledge_ingestion_service import (
    KnowledgeIngestionService,
)


def get_knowledge_ingestion_service(
    current_admin: AuthenticatedUser = Depends(get_current_admin),
) -> KnowledgeIngestionService:

    if current_admin.access_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    client = get_supabase_user_client(
        current_admin.access_token.get_secret_value()
    )

    article_repository = KnowledgeArticleRepository(client)
    chunk_repository = KnowledgeChunkRepository(client)
    document_processor = DocumentProcessingService()

    return KnowledgeIngestionService(
        article_repository=article_repository,
        chunk_repository=chunk_repository,
        document_processor=document_processor,
    )