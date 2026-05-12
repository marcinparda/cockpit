"""Unit tests for roles service."""
import uuid
from unittest.mock import AsyncMock, patch
import pytest
from fastapi import HTTPException
from src.services.authorization.roles import service


class TestGetRoleById:
    async def test_returns_none(self, mock_db):
        with patch("src.services.authorization.roles.service.repository.get_role_by_id", AsyncMock(return_value=None)):
            assert await service.get_role_by_id(mock_db, uuid.uuid4()) is None

    async def test_returns_role(self, mock_db, mock_role):
        with patch("src.services.authorization.roles.service.repository.get_role_by_id", AsyncMock(return_value=mock_role)):
            assert await service.get_role_by_id(mock_db, mock_role.id) is mock_role


class TestGetRoleByName:
    async def test_returns_none(self, mock_db):
        with patch("src.services.authorization.roles.service.repository.get_role_by_name", AsyncMock(return_value=None)):
            assert await service.get_role_by_name(mock_db, "none") is None

    async def test_returns_role(self, mock_db, mock_role):
        with patch("src.services.authorization.roles.service.repository.get_role_by_name", AsyncMock(return_value=mock_role)):
            assert await service.get_role_by_name(mock_db, mock_role.name) is mock_role


class TestGetAllRoles:
    async def test_returns_all(self, mock_db, mock_role, mock_admin_role):
        with patch("src.services.authorization.roles.service.repository.get_all_roles", AsyncMock(return_value=[mock_role, mock_admin_role])):
            assert len(await service.get_all_roles(mock_db)) == 2


class TestGetUserRolesById:
    async def test_raises_when_user_not_found(self, mock_db):
        with patch("src.services.authorization.roles.service.users_service.get_user_by_id", AsyncMock(side_effect=HTTPException(status_code=404))):
            with pytest.raises(HTTPException):
                await service.get_user_roles_by_id(mock_db, uuid.uuid4())

    async def test_returns_role(self, mock_db, mock_user, mock_role):
        with patch("src.services.authorization.roles.service.users_service.get_user_by_id", AsyncMock(return_value=mock_user)), \
             patch("src.services.authorization.roles.service.repository.get_role_by_id", AsyncMock(return_value=mock_role)):
            result = await service.get_user_roles_by_id(mock_db, mock_user.id)
        assert len(result) == 1
        assert result[0] is mock_role
