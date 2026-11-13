from supabase import Client


class PatientRepository:
    """Read-only repository for patient statistics."""

    TABLE_NAME = "patients"
    SCHEMA_NAME = "medical"

    def __init__(self, client: Client) -> None:
        self.client = client

    def count_by_status(self, status: str | None = None) -> int:
        query = (
            self.client.schema(self.SCHEMA_NAME)
            .table(self.TABLE_NAME)
            .select("id", count="exact", head=True)
        )

        if status is not None:
            query = query.eq("status", status)

        response = query.execute()

        return response.count or 0