from uuid import UUID

from app.features.ai_assistant.repositories.knowledge_article_repository import (
    KnowledgeArticleRepository,
)
from app.features.ai_assistant.repositories.knowledge_chunk_repository import (
    KnowledgeChunkRepository,
)
from app.features.ai_assistant.services.rag.document_processing_service import (
    DocumentProcessingService,
)


class KnowledgeIngestionService:
    def __init__(
        self,
        article_repository: KnowledgeArticleRepository,
        chunk_repository: KnowledgeChunkRepository,
        document_processor: DocumentProcessingService,
    ):
        self.article_repository = article_repository
        self.chunk_repository = chunk_repository
        self.document_processor = document_processor

    async def ingest_article(self, article_id: UUID) -> dict:
        # 1. Fetch published article
        article = self.article_repository.get_published_article(article_id)

        if article is None:
            raise ValueError("Published knowledge article not found.")

        # 2. Process article content and generate embeddings
        chunks = await self.document_processor.process_document(
            article["content"]
        )

        if not chunks:
            raise ValueError("Article content produced no chunks.")

        # 3. Replace existing chunks atomically through RPC
        self.chunk_repository.replace_article_chunks(
            article_id=article_id,
            chunks=chunks,
        )

        return {
            "article_id": str(article_id),
            "title": article["title"],
            "chunks_created": len(chunks),
            "status": "indexed",
        }