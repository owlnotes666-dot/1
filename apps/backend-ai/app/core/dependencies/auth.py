import logging
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase_auth.errors import AuthApiError
from pydantic import BaseModel

from app.core.supabase import get_supabase_client
from app.core.security_audit import audit_security_event


logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer(auto_error=False)


class AuthenticatedUser(BaseModel):
    id: UUID
    email: str | None = None


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
) -> AuthenticatedUser:

    ip_address = (
        request.client.host if request.client else None
    )

    if credentials is None:
        audit_security_event(
            event_name="authentication_failed",
            ip_address=ip_address,
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if credentials.scheme.lower() != "bearer":
        audit_security_event(
            event_name="authentication_failed",
            ip_address=ip_address,
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        supabase = get_supabase_client()

        response = supabase.auth.get_user(
            jwt=credentials.credentials
        )

        user = response.user

        if user is None:
            audit_security_event(
                event_name="authentication_failed",
                ip_address=ip_address,
            )

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired access token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return AuthenticatedUser(
            id=UUID(str(user.id)),
            email=user.email,
        )

    except AuthApiError:
        audit_security_event(
            event_name="authentication_failed",
            ip_address=ip_address,
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    except HTTPException:
        raise

    except Exception:
        logger.error(
            "Unexpected error occurred during user authentication."
        )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is temporarily unavailable.",
        ) from None
