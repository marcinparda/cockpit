"""Unit tests for user_permissions service."""
from src.services.authorization.user_permissions import schemas as up_schemas
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
from src.services.authorization.user_permissions import service


class TestGetUserPermissions:
    async def test_delegates(self, mock_db):
        with patch("src.services.authorization.user_permissions.service.repository.get_permissions_by_user_id", AsyncMock(return_value=[MagicMock()])):
            assert len(await service.get_user_permissions(mock_db, uuid.uuid4())) == 1


class TestDeleteUserPermission:
    async def test_returns_false_when_not_found(self, mock_db):
        with patch("src.services.authorization.user_permissions.service.repository.get_user_permission", AsyncMock(return_value=None)):
            assert await service.delete_user_permission(mock_db, uuid.uuid4(), uuid.uuid4()) is False

    async def test_deletes_and_returns_true(self, mock_db):
        with patch("src.services.authorization.user_permissions.service.repository.get_user_permission", AsyncMock(return_value=MagicMock())), \
             patch("src.services.authorization.user_permissions.service.repository.delete_user_permission", AsyncMock()):
            assert await service.delete_user_permission(mock_db, uuid.uuid4(), uuid.uuid4()) is True


class TestGetUserPermission:
    async def test_returns_perm(self, mock_db):
        perm = MagicMock()
        with patch("src.services.authorization.user_permissions.service.repository.get_user_permission", AsyncMock(return_value=perm)):
            assert await service.get_user_permission(mock_db, uuid.uuid4(), uuid.uuid4()) is perm

    async def test_returns_none(self, mock_db):
        with patch("src.services.authorization.user_permissions.service.repository.get_user_permission", AsyncMock(return_value=None)):
            assert await service.get_user_permission(mock_db, uuid.uuid4(), uuid.uuid4()) is None
