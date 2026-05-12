"""Unit tests for OAuth service."""
import uuid, hashlib, base64
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi import HTTPException
from src.services.oauth import service
from src.services.oauth.schemas import ClientRegistrationRequest


class TestVerifyPkce:
    def _challenge(self, verifier: str) -> str:
        digest = hashlib.sha256(verifier.encode("ascii")).digest()
        return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")

    def test_valid_pkce(self):
        v = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
        assert service._verify_pkce(v, self._challenge(v), "S256") is True

    def test_invalid_verifier(self):
        assert service._verify_pkce("wrong", "anychallenge", "S256") is False

    def test_unsupported_method(self):
        assert service._verify_pkce("v", "c", "plain") is False


class TestNowNaive:
    def test_returns_naive(self):
        assert service._now_naive().tzinfo is None


class TestRegisterClient:
    async def test_creates_client(self, mock_db):
        with patch("src.services.oauth.service.repository.create_oauth_client", AsyncMock()):
            result = await service.register_client(mock_db, ClientRegistrationRequest(
                client_name="App", redirect_uris=["https://e.com/cb"],
                grant_types=["authorization_code"], response_types=["code"],
                token_endpoint_auth_method="none",
            ))
        assert result.client_name == "App"
        assert len(result.client_id) > 0


class TestValidateAuthorizeRequest:
    async def test_raises_400_non_code_type(self, mock_db):
        with pytest.raises(HTTPException) as exc:
            await service.validate_authorize_request(mock_db, "cid", "https://e.com", "token", "ch", "S256")
        assert exc.value.status_code == 400

    async def test_raises_400_non_s256(self, mock_db):
        with pytest.raises(HTTPException) as exc:
            await service.validate_authorize_request(mock_db, "cid", "https://e.com", "code", "ch", "plain")
        assert exc.value.status_code == 400

    async def test_raises_400_empty_challenge(self, mock_db):
        with pytest.raises(HTTPException) as exc:
            await service.validate_authorize_request(mock_db, "cid", "https://e.com", "code", "", "S256")
        assert exc.value.status_code == 400

    async def test_raises_400_client_not_found(self, mock_db):
        with patch("src.services.oauth.service.repository.get_oauth_client_by_client_id", AsyncMock(return_value=None)):
            with pytest.raises(HTTPException) as exc:
                await service.validate_authorize_request(mock_db, "bad", "https://e.com", "code", "ch", "S256")
            assert exc.value.status_code == 400

    async def test_raises_400_redirect_mismatch(self, mock_db):
        import json
        client = MagicMock()
        client.is_active = True
        client.redirect_uris = json.dumps(["https://other.com"])
        with patch("src.services.oauth.service.repository.get_oauth_client_by_client_id", AsyncMock(return_value=client)):
            with pytest.raises(HTTPException) as exc:
                await service.validate_authorize_request(mock_db, "cid", "https://e.com", "code", "ch", "S256")
            assert exc.value.status_code == 400

    async def test_returns_client(self, mock_db):
        import json
        client = MagicMock()
        client.is_active = True
        client.redirect_uris = json.dumps(["https://e.com/cb"])
        with patch("src.services.oauth.service.repository.get_oauth_client_by_client_id", AsyncMock(return_value=client)):
            result = await service.validate_authorize_request(mock_db, "cid", "https://e.com/cb", "code", "ch", "S256")
        assert result is client


class TestCreateAuthCode:
    async def test_returns_code(self, mock_db):
        client = MagicMock()
        client.client_id = uuid.uuid4()
        with patch("src.services.oauth.service.repository.create_authorization_code", AsyncMock()):
            code = await service.create_auth_code(mock_db, client, uuid.uuid4(), "https://e.com", "read", "ch", "S256")
        assert len(code) > 10


class TestExchangeCodeForToken:
    def _verifier_challenge(self):
        v = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
        digest = hashlib.sha256(v.encode("ascii")).digest()
        c = base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
        return v, c

    async def test_raises_400_not_found(self, mock_db):
        with patch("src.services.oauth.service.repository.get_authorization_code", AsyncMock(return_value=None)):
            with pytest.raises(HTTPException) as exc:
                await service.exchange_code_for_token(mock_db, "code", "https://e.com", "cid", "v")
            assert exc.value.status_code == 400

    async def test_raises_400_already_used(self, mock_db):
        ac = MagicMock()
        ac.is_used = True
        ac.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=5)
        with patch("src.services.oauth.service.repository.get_authorization_code", AsyncMock(return_value=ac)):
            with pytest.raises(HTTPException):
                await service.exchange_code_for_token(mock_db, "code", "https://e.com", "cid", "v")

    async def test_raises_400_expired(self, mock_db):
        ac = MagicMock()
        ac.is_used = False
        ac.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=1)
        with patch("src.services.oauth.service.repository.get_authorization_code", AsyncMock(return_value=ac)):
            with pytest.raises(HTTPException):
                await service.exchange_code_for_token(mock_db, "code", "https://e.com", "cid", "v")

    async def test_raises_400_client_mismatch(self, mock_db):
        ac = MagicMock()
        ac.is_used = False
        ac.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=5)
        ac.client_id = "other"
        with patch("src.services.oauth.service.repository.get_authorization_code", AsyncMock(return_value=ac)):
            with pytest.raises(HTTPException):
                await service.exchange_code_for_token(mock_db, "code", "https://e.com", "cid", "v")

    async def test_raises_400_redirect_mismatch(self, mock_db):
        ac = MagicMock()
        ac.is_used = False
        ac.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=5)
        ac.client_id = "cid"
        ac.redirect_uri = "https://other.com"
        with patch("src.services.oauth.service.repository.get_authorization_code", AsyncMock(return_value=ac)):
            with pytest.raises(HTTPException):
                await service.exchange_code_for_token(mock_db, "code", "https://e.com", "cid", "v")

    async def test_raises_400_pkce_fail(self, mock_db):
        ac = MagicMock()
        ac.is_used = False
        ac.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=5)
        ac.client_id = "cid"
        ac.redirect_uri = "https://e.com"
        ac.code_challenge = "expected"
        ac.code_challenge_method = "S256"
        with patch("src.services.oauth.service.repository.get_authorization_code", AsyncMock(return_value=ac)):
            with pytest.raises(HTTPException):
                await service.exchange_code_for_token(mock_db, "code", "https://e.com", "cid", "wrong_verifier")

    async def test_success(self, mock_db):
        v, c = self._verifier_challenge()
        ac = MagicMock()
        ac.is_used = False
        ac.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=5)
        ac.client_id = "cid"
        ac.redirect_uri = "https://e.com/cb"
        ac.code_challenge = c
        ac.code_challenge_method = "S256"
        ac.user_id = str(uuid.uuid4())
        ac.scope = "read"
        with patch("src.services.oauth.service.repository.get_authorization_code", AsyncMock(return_value=ac)), \
             patch("src.services.oauth.service.repository.mark_authorization_code_used", AsyncMock()), \
             patch("src.services.oauth.service.repository.create_oauth_access_token", AsyncMock()):
            result = await service.exchange_code_for_token(mock_db, "code", "https://e.com/cb", "cid", v)
        assert result.access_token
        assert result.token_type == "Bearer"


class TestRefreshOAuthToken:
    async def test_raises_400_not_found(self, mock_db):
        with patch("src.services.oauth.service.repository.get_oauth_access_token_by_refresh_token", AsyncMock(return_value=None)):
            with pytest.raises(HTTPException) as exc:
                await service.refresh_oauth_token(mock_db, "bad")
            assert exc.value.status_code == 400

    async def test_raises_400_revoked(self, mock_db):
        r = MagicMock()
        r.refresh_token_is_revoked = True
        with patch("src.services.oauth.service.repository.get_oauth_access_token_by_refresh_token", AsyncMock(return_value=r)):
            with pytest.raises(HTTPException):
                await service.refresh_oauth_token(mock_db, "revoked")

    async def test_raises_400_expired(self, mock_db):
        r = MagicMock()
        r.refresh_token_is_revoked = False
        r.refresh_token_expires_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=1)
        with patch("src.services.oauth.service.repository.get_oauth_access_token_by_refresh_token", AsyncMock(return_value=r)):
            with pytest.raises(HTTPException):
                await service.refresh_oauth_token(mock_db, "expired")

    async def test_success(self, mock_db):
        r = MagicMock()
        r.refresh_token_is_revoked = False
        r.refresh_token_expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=7)
        r.token = "old"
        r.client_id = str(uuid.uuid4())
        r.user_id = str(uuid.uuid4())
        r.scope = "read"
        with patch("src.services.oauth.service.repository.get_oauth_access_token_by_refresh_token", AsyncMock(return_value=r)), \
             patch("src.services.oauth.service.repository.revoke_oauth_access_token_and_refresh", AsyncMock()), \
             patch("src.services.oauth.service.repository.create_oauth_access_token", AsyncMock()):
            result = await service.refresh_oauth_token(mock_db, "valid")
        assert result.access_token
        assert result.token_type == "Bearer"
