from uuid import UUID

from supabase import Client


class KnowledgeArticleRepository:
    TABLE_NAME = "knowledge_articles"

    def __init__(self, client: Client):
        self.client = client

    def get_published_article(self, article_id: UUID) -> dict | None:
        response = (
            self.client.schema("medical")
            .table(self.TABLE_NAME)
            .select("id, title, content, status")
            .eq("id", str(article_id))
            .eq("status", "Published")
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]