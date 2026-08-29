"""Unit tests for authorization permissions dependencies."""
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException

from src.services.authorization.permissions.dependencies import require_admin_role, require_permission
from src.services.authorization.permissions.enums import Actions, Features


class TestRequirePermission:
    async def test_admin_bypasses_check(self, mock_db, mock_admin_user):
        checker = require_permission(Features.USERS, Actions.READ)
        result = await checker(current_user=mock_admin_user, db=mock_db)
        assert result is mock_admin_user
        mock_db.refresh.assert_awaited_once()

    async def test_allows_when_permission_granted(self, mock_db, mock_user):
        checker = require_permission(Features.USERS, Actions.READ)
        with patch(
            "src.services.authorization.permissions.dependencies.permissions_service.has_user_permission",
            AsyncMock(return_value=True),
        ):
            result = await checker(current_user=mock_user, db=mock_db)
        assert result is mock_user

    async def test_raises_403_when_permission_denied(self, mock_db, mock_user):
        checker = require_permission(Features.USERS, Actions.READ)
        with patch(
            "src.services.authorization.permissions.dependencies.permissions_service.has_user_permission",
            AsyncMock(return_value=False),
        ):
            with pytest.raises(HTTPException) as exc:
                await checker(current_user=mock_user, db=mock_db)
        assert exc.value.status_code == 403


class TestRequireAdminRole:
    async def test_allows_admin(self, mock_db, mock_admin_user):
        result = await require_admin_role(current_user=mock_admin_user, db=mock_db)
        assert result is mock_admin_user

    async def test_raises_403_when_not_admin(self, mock_db, mock_user):
        with pytest.raises(HTTPException) as exc:
            await require_admin_role(current_user=mock_user, db=mock_db)
        assert exc.value.status_code == 403
