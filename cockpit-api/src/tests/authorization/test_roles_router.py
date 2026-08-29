"""Unit tests for roles router."""
from unittest.mock import AsyncMock, MagicMock, patch

from src.services.authorization.roles import router


class TestGetCurrentUserRoles:
    async def test_returns_mapped_roles(self, mock_db, mock_user):
        role = MagicMock()
        role.id = mock_user.role.id
        role.name = "User"
        role.description = "Standard user role"
        with patch(
            "src.services.authorization.roles.router.roles_service.get_user_roles_by_id",
            AsyncMock(return_value=[role]),
        ):
            result = await router.get_current_user_roles(current_user=mock_user, db=mock_db)
        assert len(result) == 1
        assert result[0].name == "User"


class TestListAllRoles:
    async def test_returns_all_roles(self, mock_db, mock_admin_user):
        role = MagicMock()
        role.id = mock_admin_user.role.id
        role.name = "Admin"
        role.description = "Administrator role"
        with patch(
            "src.services.authorization.roles.router.roles_service.get_all_roles",
            AsyncMock(return_value=[role]),
        ):
            result = await router.list_all_roles(admin_user=mock_admin_user, db=mock_db)
        assert len(result) == 1
        assert result[0].name == "Admin"
