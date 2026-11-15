from uuid import uuid4

import pytest

from app.features.ai_assistant.services.temporary_file_storage import (
    TemporaryFileStorage,
)


@pytest.fixture
def storage():
    return TemporaryFileStorage()


def test_add_and_get_file_context(storage):
    conversation_id = uuid4()

    storage.add_file(
        conversation_id,
        "report.txt",
        "Medical report content",
    )

    context = storage.get_context(conversation_id)

    assert "File: report.txt" in context
    assert "Medical report content" in context


def test_get_uploaded_filenames(storage):
    conversation_id = uuid4()

    storage.add_file(conversation_id, "report.txt", "Report")
    storage.add_file(conversation_id, "notes.md", "Notes")

    filenames = storage.get_files(conversation_id)

    assert filenames == ["report.txt", "notes.md"]


def test_conversations_are_isolated(storage):
    first_conversation = uuid4()
    second_conversation = uuid4()

    storage.add_file(
        first_conversation,
        "first.txt",
        "First conversation content",
    )

    assert storage.get_context(second_conversation) == ""
    assert storage.get_files(second_conversation) == []


def test_reject_empty_content(storage):
    with pytest.raises(ValueError, match="empty"):
        storage.add_file(uuid4(), "empty.txt", "   ")


def test_maximum_files_per_conversation(storage):
    conversation_id = uuid4()

    for index in range(storage.MAX_FILES_PER_CONVERSATION):
        storage.add_file(
            conversation_id,
            f"file-{index}.txt",
            f"Content {index}",
        )

    with pytest.raises(ValueError, match="Maximum 5 files"):
        storage.add_file(
            conversation_id,
            "extra.txt",
            "Extra content",
        )


def test_maximum_total_text_length(storage, monkeypatch):
    monkeypatch.setattr(
        TemporaryFileStorage,
        "MAX_TOTAL_TEXT_LENGTH",
        10,
    )

    conversation_id = uuid4()

    storage.add_file(
        conversation_id,
        "first.txt",
        "123456",
    )

    with pytest.raises(ValueError, match="200,000 character limit"):
        storage.add_file(
            conversation_id,
            "second.txt",
            "12345",
        )


def test_clear_conversation(storage):
    conversation_id = uuid4()

    storage.add_file(
        conversation_id,
        "report.txt",
        "Medical report",
    )

    storage.clear(conversation_id)

    assert storage.get_context(conversation_id) == ""
    assert storage.get_files(conversation_id) == []


def test_expired_conversation_is_removed(storage, monkeypatch):
    current_time = [1000.0]

    monkeypatch.setattr(
        "app.features.ai_assistant.services.temporary_file_storage.time.monotonic",
        lambda: current_time[0],
    )

    storage.add_file(
        uuid4(),
        "report.txt",
        "Medical report",
    )

    conversation_id = next(iter(storage._storage))

    current_time[0] += storage.TTL_SECONDS + 1

    assert storage.get_context(conversation_id) == ""
    assert conversation_id not in storage._storage


def test_upload_refreshes_expiration(storage, monkeypatch):
    current_time = [1000.0]

    monkeypatch.setattr(
        "app.features.ai_assistant.services.temporary_file_storage.time.monotonic",
        lambda: current_time[0],
    )

    conversation_id = uuid4()

    storage.add_file(
        conversation_id,
        "first.txt",
        "First file",
    )

    current_time[0] += 20 * 60

    storage.add_file(
        conversation_id,
        "second.txt",
        "Second file",
    )

    current_time[0] += 20 * 60

    assert "First file" in storage.get_context(conversation_id)
    assert "Second file" in storage.get_context(conversation_id)