"""Unit tests for authorization permissions service."""
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
from src.services.authorization.permissions import service
from src.services.authorization.permissions.enums import Actions, Features


class TestHasUserPermission:
    async def test_returns_false_when_not_found(self, mock_db):
        with patch("src.services.authorization.permissions.service.users_repository.get_user_by_id", AsyncMock(return_value=None)):
            assert await service.has_user_permission(mock_db, uuid.uuid4(), Features.USERS, Actions.READ) is False

    async def test_returns_false_when_inactive(self, mock_db, mock_user):
        mock_user.is_active = False
        with patch("src.services.authorization.permissions.service.users_repository.get_user_by_id", AsyncMock(return_value=mock_user)):
            assert await service.has_user_permission(mock_db, mock_user.id, Features.USERS, Actions.READ) is False

    async def test_admin_has_all_permissions(self, mock_db, mock_admin_user):
        with patch("src.services.authorization.permissions.service.users_repository.get_user_by_id", AsyncMock(return_value=mock_admin_user)):
            assert await service.has_user_permission(mock_db, mock_admin_user.id, Features.USERS, Actions.READ) is True

    async def test_returns_false_when_feature_not_found(self, mock_db, mock_user):
        mock_user.role.name = "User"
        with patch("src.services.authorization.permissions.service.users_repository.get_user_by_id", AsyncMock(return_value=mock_user)), \
             patch("src.services.authorization.permissions.service.repository.get_feature_by_name", AsyncMock(return_value=None)):
            assert await service.has_user_permission(mock_db, mock_user.id, Features.USERS, Actions.READ) is False

    async def test_returns_true_when_permission_exists(self, mock_db, mock_user):
        mock_user.role.name = "User"
        with patch("src.services.authorization.permissions.service.users_repository.get_user_by_id", AsyncMock(return_value=mock_user)), \
             patch("src.services.authorization.permissions.service.repository.get_feature_by_name", AsyncMock(return_value=MagicMock())), \
             patch("src.services.authorization.permissions.service.repository.get_action_by_name", AsyncMock(return_value=MagicMock())), \
             patch("src.services.authorization.permissions.service.repository.get_permission_by_feature_action", AsyncMock(return_value=MagicMock())), \
             patch("src.services.authorization.permissions.service.user_permissions_repository.get_user_permission_by_user_and_permission", AsyncMock(return_value=MagicMock())):
            assert await service.has_user_permission(mock_db, mock_user.id, Features.USERS, Actions.READ) is True


class TestGetUserPermissions:
    async def test_returns_empty_when_not_found(self, mock_db):
        with patch("src.services.authorization.permissions.service.users_repository.get_user_by_id", AsyncMock(return_value=None)):
            assert await service.get_user_permissions(mock_db, uuid.uuid4()) == []

    async def test_admin_gets_all(self, mock_db, mock_admin_user):
        with patch("src.services.authorization.permissions.service.users_repository.get_user_by_id", AsyncMock(return_value=mock_admin_user)), \
             patch("src.services.authorization.permissions.service.repository.get_all_permissions", AsyncMock(return_value=[MagicMock(), MagicMock()])):
            assert len(await service.get_user_permissions(mock_db, mock_admin_user.id)) == 2

    async def test_regular_user_gets_own(self, mock_db, mock_user):
        mock_user.role.name = "User"
        with patch("src.services.authorization.permissions.service.users_repository.get_user_by_id", AsyncMock(return_value=mock_user)), \
             patch("src.services.authorization.permissions.service.user_permissions_repository.get_permissions_by_user_id", AsyncMock(return_value=[MagicMock()])):
            assert len(await service.get_user_permissions(mock_db, mock_user.id)) == 1
