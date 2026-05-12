"""Unit tests for authentication sessions service."""
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi import HTTPException
from src.services.authentication.sessions import service


class TestAuthenticateUser:
    async def test_returns_none_when_not_found(self, mock_db):
        with patch("src.services.authentication.sessions.service.users_service.get_user_by_email", AsyncMock(return_value=None)):
            assert await service.authenticate_user(mock_db, "no@e.com", "pass") is None

    async def test_returns_none_when_inactive(self, mock_db, mock_user):
        mock_user.is_active = False
        with patch("src.services.authentication.sessions.service.users_service.get_user_by_email", AsyncMock(return_value=mock_user)):
            assert await service.authenticate_user(mock_db, mock_user.email, "pass") is None

    async def test_returns_none_on_wrong_password(self, mock_db, mock_user):
        with patch("src.services.authentication.sessions.service.users_service.get_user_by_email", AsyncMock(return_value=mock_user)), \
             patch("src.services.authentication.sessions.service.passwords_service.verify_password", return_value=False):
            assert await service.authenticate_user(mock_db, mock_user.email, "wrong") is None

    async def test_returns_user_on_valid_credentials(self, mock_db, mock_user):
        with patch("src.services.authentication.sessions.service.users_service.get_user_by_email", AsyncMock(return_value=mock_user)), \
             patch("src.services.authentication.sessions.service.passwords_service.verify_password", return_value=True):
            assert await service.authenticate_user(mock_db, mock_user.email, "correct") is mock_user


class TestLoginUser:
    async def test_raises_401_on_bad_credentials(self, mock_db):
        with patch("src.services.authentication.sessions.service.authenticate_user", AsyncMock(return_value=None)):
            with pytest.raises(HTTPException) as exc:
                await service.login_user(mock_db, "bad@e.com", "bad", MagicMock())
            assert exc.value.status_code == 401

    async def test_sets_cookies_on_success(self, mock_db, mock_user):
        mock_response = MagicMock()
        with patch("src.services.authentication.sessions.service.authenticate_user", AsyncMock(return_value=mock_user)), \
             patch("src.services.authentication.sessions.service.tokens_service.create_tokens_with_storage", AsyncMock(return_value=("acc", "ref"))), \
             patch("src.services.authentication.sessions.service.set_auth_cookies") as mock_set:
            result = await service.login_user(mock_db, mock_user.email, "correct", mock_response)
        mock_set.assert_called_once_with(mock_response, "acc", "ref")
        assert result.detail == "Login successful"


class TestLogout:
    async def test_invalidates_tokens_and_clears_cookies(self, mock_db):
        with patch("src.services.authentication.sessions.service.tokens_service.invalidate_token", AsyncMock(return_value=True)) as mock_inv, \
             patch("src.services.authentication.sessions.service.clear_auth_cookies") as mock_clear:
            result = await service.logout(MagicMock(), "acc", "ref", mock_db)
        assert mock_inv.call_count == 2
        mock_clear.assert_called_once()
        assert result.detail == "Logout successful"

    async def test_handles_no_tokens(self, mock_db):
        with patch("src.services.authentication.sessions.service.tokens_service.invalidate_token", AsyncMock()) as mock_inv, \
             patch("src.services.authentication.sessions.service.clear_auth_cookies"):
            await service.logout(MagicMock(), None, None, mock_db)
        mock_inv.assert_not_called()
