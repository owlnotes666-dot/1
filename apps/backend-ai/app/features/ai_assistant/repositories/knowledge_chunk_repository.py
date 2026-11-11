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

        (
            self.client.schema("medical")
            .rpc(
                "replace_knowledge_article_chunks",
                {
                    "p_article_id": str(article_id),
                    "p_chunks": chunks,
                },
            )
            .execute()
        )
