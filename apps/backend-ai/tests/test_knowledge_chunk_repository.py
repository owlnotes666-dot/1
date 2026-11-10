from unittest.mock import MagicMock

from app.features.ai_assistant.repositories.knowledge_chunk_repository import (
    KnowledgeChunkRepository,
)


def create_mock_supabase():
    client = MagicMock()
    query = MagicMock()

    client.schema.return_value.table.return_value = query
    query.delete.return_value.eq.return_value.execute.return_value = None
    query.insert.return_value.execute.return_value = None

    return client, query


def test_replace_article_chunks():
    client, query = create_mock_supabase()

    repository = KnowledgeChunkRepository(client)

    article_id = "11111111-1111-4111-8111-111111111111"

    chunks = [
        {
            "chunk_index": 0,
            "content": "First chunk",
            "embedding": [0.1] * 1024,
        },
        {
            "chunk_index": 1,
            "content": "Second chunk",
            "embedding": [0.2] * 1024,
        },
    ]

    repository.replace_article_chunks(article_id, chunks)

    assert client.schema.call_count == 2

    for schema_call in client.schema.call_args_list:
        assert schema_call.args == ("medical",)

    assert client.schema.return_value.table.call_count == 2

    for table_call in client.schema.return_value.table.call_args_list:
        assert table_call.args == ("knowledge_article_chunks",)

    query.delete.assert_called_once()
    query.delete.return_value.eq.assert_called_once_with(
        "article_id",
        article_id,
    )

    inserted_rows = query.insert.call_args.args[0]

    assert len(inserted_rows) == 2
    assert inserted_rows[0]["article_id"] == article_id
    assert inserted_rows[0]["content"] == "First chunk"
    assert inserted_rows[1]["chunk_index"] == 1


def test_replace_article_chunks_with_empty_list():
    client, query = create_mock_supabase()

    repository = KnowledgeChunkRepository(client)

    repository.replace_article_chunks(
        "11111111-1111-4111-8111-111111111111",
        [],
    )

    query.delete.assert_called_once()
    query.insert.assert_not_called()
