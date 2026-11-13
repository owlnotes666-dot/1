from typing import Any


DATABASE_TOOLS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "get_patient_statistics",
            "description": (
                "Get aggregate patient statistics. "
                "Can filter by patient status."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": ["string", "null"],
                        "enum": ["Active", "Inactive", None],
                        "description": "Optional patient status filter.",
                    }
                },
                "required": ["status"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_doctor_statistics",
            "description": (
                "Get aggregate doctor statistics. "
                "Can filter by specialty and status."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "specialty": {
                        "type": ["string", "null"],
                        "description": "Optional doctor specialty filter.",
                    },
                    "status": {
                        "type": ["string", "null"],
                        "enum": ["Active", "Inactive", None],
                        "description": "Optional doctor status filter.",
                    },
                },
                "required": ["specialty", "status"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_appointment_statistics",
            "description": (
                "Get aggregate appointment statistics. "
                "Can filter by appointment status and date."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": ["string", "null"],
                        "description": "Optional appointment status filter.",
                    },
                    "appointment_date": {
                        "type": ["string", "null"],
                        "format": "date",
                        "description": "Optional date in YYYY-MM-DD format.",
                    },
                },
                "required": ["status", "appointment_date"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_staff_statistics",
            "description": (
                "Get aggregate staff statistics. "
                "Can filter by role and status."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "role": {
                        "type": ["string", "null"],
                        "description": "Optional staff role filter.",
                    },
                    "status": {
                        "type": ["string", "null"],
                        "enum": ["Active", "Inactive", None],
                        "description": "Optional staff status filter.",
                    },
                },
                "required": ["role", "status"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_medical_record_statistics",
            "description": (
                "Get aggregate medical record statistics. "
                "Can filter by record status."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": ["string", "null"],
                        "description": "Optional medical record status filter.",
                    }
                },
                "required": ["status"],
                "additionalProperties": False,
            },
        },
    },
]


def get_database_tools() -> list[dict[str, Any]]:
    """Return the available read-only database tool definitions."""
    return DATABASE_TOOLS.copy()