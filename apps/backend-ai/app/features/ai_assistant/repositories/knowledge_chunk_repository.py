from uuid import UUID

from supabase import Client


class KnowledgeChunkRepository:
    TABLE_NAME = "knowledge_article_chunks"

    def __init__(self, client: Client):
        self.client = client

    def replace_article_chunks(
        self,
        article_id: UUID,
        chunks: list[dict],
    ) -> None:
        article_id_str = str(article_id)

        (
            self.client.schema("medical")
            .table(self.TABLE_NAME)
            .delete()
            .eq("article_id", article_id_str)
            .execute()
        )

        if not chunks:
            return

        rows = [
            {
                "article_id": article_id_str,
                "chunk_index": chunk["chunk_index"],
                "content": chunk["content"],
                "embedding": chunk["embedding"],
            }
            for chunk in chunks
        ]

        (
            self.client.schema("medical")
            .table(self.TABLE_NAME)
            .insert(rows)
            .execute()
        )