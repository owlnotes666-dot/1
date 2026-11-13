from supabase import Client


class StaffRepository:
    """Read-only repository for staff statistics."""

    TABLE_NAME = "staff"
    SCHEMA_NAME = "medical"

    def __init__(self, client: Client) -> None:
        self.client = client

    def count_staff(
        self,
        role: str | None = None,
        status: str | None = None,
    ) -> int:
        query = (
            self.client.schema(self.SCHEMA_NAME)
            .table(self.TABLE_NAME)
            .select("id", count="exact", head=True)
        )

        if role is not None:
            query = query.eq("role", role)

        if status is not None:
            query = query.eq("status", status)

        response = query.execute()

        return response.count or 0