"""Unit tests for users service."""
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi import HTTPException
from src.services.users import service


class TestGetUserById:
    async def test_raises_404_when_not_found(self, mock_db):
        with patch("src.services.users.service.repository.get_user_by_id", AsyncMock(return_value=None)):
            with pytest.raises(HTTPException) as exc:
                await service.get_user_by_id(mock_db, uuid.uuid4())
            assert exc.value.status_code == 404

    async def test_returns_user(self, mock_db, mock_user):
        with patch("src.services.users.service.repository.get_user_by_id", AsyncMock(return_value=mock_user)):
            assert await service.get_user_by_id(mock_db, mock_user.id) is mock_user


class TestGetUserByEmail:
    async def test_returns_none(self, mock_db):
        with patch("src.services.users.service.repository.get_user_by_email", AsyncMock(return_value=None)):
            assert await service.get_user_by_email(mock_db, "no@e.com") is None

    async def test_returns_user(self, mock_db, mock_user):
        with patch("src.services.users.service.repository.get_user_by_email", AsyncMock(return_value=mock_user)):
            assert await service.get_user_by_email(mock_db, mock_user.email) is mock_user


class TestGetAllUsers:
    async def test_delegates_to_repo(self, mock_db, mock_user):
        with patch("src.services.users.service.repository.get_all_users", AsyncMock(return_value=[mock_user])):
            result = await service.get_all_users(mock_db)
        assert len(result) == 1


class TestCreateUser:
    async def test_raises_400_on_duplicate_email(self, mock_db, mock_user):
        with patch("src.services.users.service.repository.get_user_by_email", AsyncMock(return_value=mock_user)):
            with pytest.raises(HTTPException) as exc:
                await service.create_user(mock_db, mock_user.email, uuid.uuid4(), uuid.uuid4())
            assert exc.value.status_code == 400

    async def test_raises_404_when_role_not_found(self, mock_db):
        with patch("src.services.users.service.repository.get_user_by_email", AsyncMock(return_value=None)), \
             patch("src.services.users.service.repository.get_role_by_id", AsyncMock(return_value=None)):
            with pytest.raises(HTTPException) as exc:
                await service.create_user(mock_db, "new@e.com", uuid.uuid4(), uuid.uuid4(), "Secure@Pass1")
            assert exc.value.status_code == 404

    async def test_creates_user(self, mock_db, mock_user, mock_role):
        with patch("src.services.users.service.repository.get_user_by_email", AsyncMock(return_value=None)), \
             patch("src.services.users.service.repository.get_role_by_id", AsyncMock(return_value=mock_role)), \
             patch("src.services.users.service.repository.save_user", AsyncMock(return_value=mock_user)):
            assert await service.create_user(mock_db, "new@e.com", mock_role.id, uuid.uuid4(), "Secure@Pass1") is mock_user


class TestUpdateUser:
    async def test_raises_404_when_not_found(self, mock_db):
        with patch("src.services.users.service.repository.get_user_by_id", AsyncMock(return_value=None)):
            with pytest.raises(HTTPException) as exc:
                await service.update_user(mock_db, uuid.uuid4())
            assert exc.value.status_code == 404

    async def test_raises_400_on_email_conflict(self, mock_db, mock_user):
        with patch("src.services.users.service.repository.get_user_by_id", AsyncMock(return_value=mock_user)), \
             patch("src.services.users.service.repository.get_user_by_email", AsyncMock(return_value=MagicMock())):
            with pytest.raises(HTTPException) as exc:
                await service.update_user(mock_db, mock_user.id, email="other@e.com")
            assert exc.value.status_code == 400

    async def test_updates_user(self, mock_db, mock_user):
        updated = MagicMock()
        with patch("src.services.users.service.repository.get_user_by_id", AsyncMock(return_value=mock_user)), \
             patch("src.services.users.service.repository.update_user", AsyncMock(return_value=updated)):
            assert await service.update_user(mock_db, mock_user.id, is_active=False) is updated


class TestDeleteUser:
    async def test_raises_404(self, mock_db):
        with patch("src.services.users.service.repository.get_user_by_id", AsyncMock(return_value=None)):
            with pytest.raises(HTTPException) as exc:
                await service.delete_user(mock_db, uuid.uuid4())
            assert exc.value.status_code == 404

    async def test_deletes(self, mock_db, mock_user):
        with patch("src.services.users.service.repository.get_user_by_id", AsyncMock(return_value=mock_user)), \
             patch("src.services.users.service.repository.delete_user_record", AsyncMock()):
            assert await service.delete_user(mock_db, mock_user.id) is True


class TestChangeUserPassword:
    async def test_raises_400_wrong_password(self, mock_db, mock_user):
        with patch("src.services.users.service.repository.get_user_by_id", AsyncMock(return_value=mock_user)), \
             patch("src.services.users.service.passwords_service.verify_password", return_value=False):
            with pytest.raises(HTTPException) as exc:
                await service.change_user_password(mock_db, mock_user.id, "wrong", "New@Pass1")
            assert exc.value.status_code == 400

    async def test_changes_password(self, mock_db, mock_user):
        with patch("src.services.users.service.repository.get_user_by_id", AsyncMock(return_value=mock_user)), \
             patch("src.services.users.service.passwords_service.verify_password", return_value=True), \
             patch("src.services.users.service.passwords_service.validate_password_strength", return_value=(True, [])), \
             patch("src.services.users.service.passwords_service.hash_password", return_value="new_hash"), \
             patch("src.services.users.service.repository.update_user", AsyncMock(return_value=mock_user)):
            assert await service.change_user_password(mock_db, mock_user.id, "correct", "New@Pass1") is True


class TestAssignPermissionsToUser:
    async def test_raises_404_permissions_not_found(self, mock_db, mock_user):
        with patch("src.services.users.service.repository.get_permissions_by_ids", AsyncMock(return_value=[])):
            with pytest.raises(HTTPException) as exc:
                await service.assign_permissions_to_user(mock_db, mock_user.id, [uuid.uuid4()])
            assert exc.value.status_code == 404

    async def test_raises_400_already_assigned(self, mock_db, mock_user):
        with patch("src.services.users.service.repository.get_permissions_by_ids", AsyncMock(return_value=[MagicMock()])), \
             patch("src.services.users.service.repository.get_existing_user_permissions", AsyncMock(return_value=[MagicMock()])):
            with pytest.raises(HTTPException) as exc:
                await service.assign_permissions_to_user(mock_db, mock_user.id, [uuid.uuid4()])
            assert exc.value.status_code == 400

    async def test_assigns(self, mock_db, mock_user):
        saved = [MagicMock()]
        with patch("src.services.users.service.repository.get_permissions_by_ids", AsyncMock(return_value=[MagicMock()])), \
             patch("src.services.users.service.repository.get_existing_user_permissions", AsyncMock(return_value=[])), \
             patch("src.services.users.service.repository.save_user_permissions", AsyncMock(return_value=saved)):
            assert await service.assign_permissions_to_user(mock_db, mock_user.id, [uuid.uuid4()]) == saved


class TestGenerateTemporaryPassword:
    def test_default_length(self):
        assert len(service.generate_temporary_password()) == 12

    def test_custom_length(self):
        assert len(service.generate_temporary_password(16)) == 16

    def test_unique(self):
        assert service.generate_temporary_password() != service.generate_temporary_password()
