"""Unit tests for authentication dependencies."""
import uuid
from unittest.mock import AsyncMock, patch
import pytest
from fastapi import HTTPException
from src.services.authentication.dependencies import get_current_user


class TestGetCurrentUser:
    async def test_raises_401_when_no_token(self, mock_db):
        with pytest.raises(HTTPException) as exc:
            await get_current_user(access_token=None, db=mock_db)
        assert exc.value.status_code == 401

    async def test_raises_401_on_invalid_token(self, mock_db):
        with patch("src.services.authentication.dependencies.tokens_service.verify_token", AsyncMock(side_effect=Exception("bad"))):
            with pytest.raises(HTTPException) as exc:
                await get_current_user(access_token="bad.token.here", db=mock_db)
        assert exc.value.status_code == 401

    async def test_raises_401_when_user_not_found(self, mock_db):
        with patch("src.services.authentication.dependencies.tokens_service.verify_token", AsyncMock(return_value={"sub": str(uuid.uuid4())})), \
             patch("src.services.authentication.dependencies.users_service.get_user_by_id", AsyncMock(return_value=None)):
            with pytest.raises(HTTPException) as exc:
                await get_current_user(access_token="valid.token.here", db=mock_db)
        assert exc.value.status_code == 401

    async def test_raises_401_when_inactive(self, mock_db, mock_user):
        mock_user.is_active = False
        with patch("src.services.authentication.dependencies.tokens_service.verify_token", AsyncMock(return_value={"sub": str(mock_user.id)})), \
             patch("src.services.authentication.dependencies.users_service.get_user_by_id", AsyncMock(return_value=mock_user)):
            with pytest.raises(HTTPException) as exc:
                await get_current_user(access_token="valid.token.here", db=mock_db)
        assert exc.value.status_code == 401

    async def test_returns_user_on_valid_token(self, mock_db, mock_user):
        mock_user.is_active = True
        with patch("src.services.authentication.dependencies.tokens_service.verify_token", AsyncMock(return_value={"sub": str(mock_user.id)})), \
             patch("src.services.authentication.dependencies.users_service.get_user_by_id", AsyncMock(return_value=mock_user)):
            result = await get_current_user(access_token="valid.token.here", db=mock_db)
        assert result is mock_user
