"""Unit tests for authentication tokens service."""
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from jose import JWTError

from src.services.authentication.tokens import service


class TestCreateAccessTokenJwt:
    def test_creates_valid_jwt(self):
        token = service.create_access_token_jwt({"sub": str(uuid.uuid4())})
        assert len(token.split(".")) == 3

    def test_includes_jti_claim(self):
        from src.core.config import settings
        from jose import jwt
        token = service.create_access_token_jwt({"sub": "user-id"})
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        assert "jti" in payload

    def test_unique_jti_per_token(self):
        from src.core.config import settings
        from jose import jwt
        t1 = service.create_access_token_jwt({"sub": "user-id"})
        t2 = service.create_access_token_jwt({"sub": "user-id"})
        p1 = jwt.decode(t1, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        p2 = jwt.decode(t2, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        assert p1["jti"] != p2["jti"]


class TestCreateRefreshTokenJwt:
    def test_creates_valid_jwt(self):
        token = service.create_refresh_token_jwt({"sub": str(uuid.uuid4())})
        assert len(token.split(".")) == 3

    def test_has_refresh_token_type(self):
        from src.core.config import settings
        from jose import jwt
        token = service.create_refresh_token_jwt({"sub": "user-id"})
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        assert payload["token_type"] == "refresh"


class TestValidateTokenFormat:
    def test_valid_jwt_passes(self):
        token = service.create_access_token_jwt({"sub": "user"})
        service._validate_token_format(token)

    def test_empty_token_raises(self):
        with pytest.raises(JWTError):
            service._validate_token_format("")

    def test_malformed_token_raises(self):
        with pytest.raises(JWTError):
            service._validate_token_format("not.valid")


class TestExtractTokenId:
    def test_extracts_jti(self):
        token = service.create_access_token_jwt({"sub": "user-id"})
        jti = service.extract_token_id(token)
        assert jti is not None

    def test_returns_none_for_invalid(self):
        assert service.extract_token_id("invalid-token") is None


class TestParseTokenPayload:
    def test_parses_valid_token(self):
        user_id = str(uuid.uuid4())
        token = service.create_access_token_jwt({"sub": user_id})
        payload = service.parse_token_payload(token)
        assert payload["sub"] == user_id

    def test_raises_for_invalid(self):
        with pytest.raises(JWTError):
            service.parse_token_payload("bad.token.here")


class TestIsAccessTokenValid:
    async def test_returns_false_when_not_found(self, mock_db):
        with patch("src.services.authentication.tokens.service.repository.get_access_token_by_jti", AsyncMock(return_value=None)):
            assert await service.is_access_token_valid(mock_db, "jti") is False

    async def test_returns_false_when_revoked(self, mock_db):
        token = MagicMock()
        token.is_revoked = True
        token.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=1)
        with patch("src.services.authentication.tokens.service.repository.get_access_token_by_jti", AsyncMock(return_value=token)):
            assert await service.is_access_token_valid(mock_db, "jti") is False

    async def test_returns_false_when_expired(self, mock_db):
        token = MagicMock()
        token.is_revoked = False
        token.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=1)
        with patch("src.services.authentication.tokens.service.repository.get_access_token_by_jti", AsyncMock(return_value=token)):
            assert await service.is_access_token_valid(mock_db, "jti") is False

    async def test_returns_true_for_valid(self, mock_db):
        token = MagicMock()
        token.is_revoked = False
        token.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=1)
        with patch("src.services.authentication.tokens.service.repository.get_access_token_by_jti", AsyncMock(return_value=token)):
            assert await service.is_access_token_valid(mock_db, "jti") is True


class TestInvalidateToken:
    async def test_returns_false_for_invalid_jwt(self, mock_db):
        assert await service.invalidate_token("not-a-jwt", mock_db) is False

    async def test_invalidates_access_token(self, mock_db):
        access_token = service.create_access_token_jwt({"sub": "user"})
        with patch("src.services.authentication.tokens.service.repository.update_access_token_revoked_status", AsyncMock(return_value=True)):
            assert await service.invalidate_token(access_token, mock_db) is True

    async def test_invalidates_refresh_token(self, mock_db):
        refresh_token = service.create_refresh_token_jwt({"sub": "user"})
        with patch("src.services.authentication.tokens.service.repository.update_refresh_token_revoked_status", AsyncMock(return_value=True)):
            assert await service.invalidate_token(refresh_token, mock_db) is True


class TestCreateTokensWithStorage:
    async def test_creates_and_stores_both_tokens(self, mock_db):
        with patch("src.services.authentication.tokens.service.repository.create_access_token_record", AsyncMock(return_value=MagicMock())), \
             patch("src.services.authentication.tokens.service.repository.create_refresh_token_record", AsyncMock(return_value=MagicMock())):
            access, refresh = await service.create_tokens_with_storage(uuid.uuid4(), "u@e.com", mock_db)
        assert len(access.split(".")) == 3
        assert len(refresh.split(".")) == 3
