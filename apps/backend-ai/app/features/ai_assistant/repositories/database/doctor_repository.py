from supabase import Client


class DoctorRepository:
    """Read-only repository for doctor statistics."""

    TABLE_NAME = "doctors"
    SCHEMA_NAME = "medical"

    def __init__(self, client: Client) -> None:
        self.client = client

    def count_by_specialty(
        self,
        specialty: str | None = None,
        status: str | None = None,
    ) -> int:
        query = (
            self.client.schema(self.SCHEMA_NAME)
            .table(self.TABLE_NAME)
            .select("id", count="exact", head=True)
        )

        if specialty is not None:
            query = query.eq("specialty", specialty)

        if status is not None:
            query = query.eq("status", status)

        response = query.execute()

        return response.count or 0
