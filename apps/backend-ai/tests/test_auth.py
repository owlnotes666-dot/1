
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.core.dependencies.auth import get_current_user


@pytest.fixture
def valid_credentials():
    return HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials="test-access-token",
    )


@pytest.fixture
def mock_supabase():
    with patch(
        "app.core.dependencies.auth.get_supabase_client"
    ) as mock_client:
        yield mock_client


def test_authentication_without_token():
    with pytest.raises(HTTPException) as exc:
        get_current_user(credentials=None)

    assert exc.value.status_code == 401
    assert exc.value.detail == "Authentication required."


def test_successful_authentication(
    valid_credentials,
    mock_supabase,
):
    user_id = uuid4()

    mock_user = MagicMock()
    mock_user.id = str(user_id)
    mock_user.email = "demo@example.com"

    mock_supabase.return_value.auth.get_user.return_value.user = mock_user

    result = get_current_user(valid_credentials)

    assert result.id == user_id
    assert result.email == "demo@example.com"

    mock_supabase.return_value.auth.get_user.assert_called_once_with(
        jwt="test-access-token"
    )


def test_authentication_when_user_is_missing(
    valid_credentials,
    mock_supabase,
):
    mock_supabase.return_value.auth.get_user.return_value.user = None

    with pytest.raises(HTTPException) as exc:
        get_current_user(valid_credentials)

    assert exc.value.status_code == 401
    assert exc.value.detail == "Invalid or expired access token."


def test_authentication_service_unavailable(
    valid_credentials,
    mock_supabase,
):
    mock_supabase.return_value.auth.get_user.side_effect = RuntimeError(
        "Internal authentication error"
    )

    with pytest.raises(HTTPException) as exc:
        get_current_user(valid_credentials)

    assert exc.value.status_code == 503
    assert (
        exc.value.detail
        == "Authentication service is temporarily unavailable."
    )
