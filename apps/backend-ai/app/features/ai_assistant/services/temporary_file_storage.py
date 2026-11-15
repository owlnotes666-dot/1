import time
from threading import Lock
from uuid import UUID


class TemporaryFileStorage:
    TTL_SECONDS = 30 * 60  # 30 minutes

    MAX_FILES_PER_CONVERSATION = 5
    MAX_TOTAL_TEXT_LENGTH = 200_000

    def __init__(self) -> None:
        self._storage: dict[UUID, dict] = {}
        self._lock = Lock()

    def _cleanup_expired(self) -> None:
        now = time.monotonic()

        expired_conversations = [
            conversation_id
            for conversation_id, data in self._storage.items()
            if data["expires_at"] <= now
        ]

        for conversation_id in expired_conversations:
            del self._storage[conversation_id]

    def add_file(
        self,
        conversation_id: UUID,
        filename: str,
        text: str,
    ) -> None:
        if not text.strip():
            raise ValueError("File content cannot be empty.")

        with self._lock:
            self._cleanup_expired()

            now = time.monotonic()
            data = self._storage.get(conversation_id)

            if data is None:
                data = {
                    "files": [],
                    "expires_at": now + self.TTL_SECONDS,
                }
                self._storage[conversation_id] = data

            files = data["files"]

            if len(files) >= self.MAX_FILES_PER_CONVERSATION:
                raise ValueError(
                    "Maximum 5 files are allowed per conversation."
                )

            current_length = sum(
                len(file["text"])
                for file in files
            )

            if current_length + len(text) > self.MAX_TOTAL_TEXT_LENGTH:
                raise ValueError(
                    "Total extracted text exceeds the 200,000 character limit."
                )

            files.append({
                "filename": filename,
                "text": text,
            })

            # Refresh expiration after each successful upload.
            data["expires_at"] = now + self.TTL_SECONDS

    def get_context(
        self,
        conversation_id: UUID,
    ) -> str:
        with self._lock:
            self._cleanup_expired()

            data = self._storage.get(conversation_id)

            if data is None:
                return ""

            return "\n\n".join(
                f"File: {file['filename']}\n{file['text']}"
                for file in data["files"]
            )

    def get_files(
        self,
        conversation_id: UUID,
    ) -> list[str]:
        with self._lock:
            self._cleanup_expired()

            data = self._storage.get(conversation_id)

            if data is None:
                return []

            return [
                file["filename"]
                for file in data["files"]
            ]

    def clear(
        self,
        conversation_id: UUID,
    ) -> None:
        with self._lock:
            self._storage.pop(conversation_id, None)

    def cleanup_expired(self) -> None:
        with self._lock:
            self._cleanup_expired()
