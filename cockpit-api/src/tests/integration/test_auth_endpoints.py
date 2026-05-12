"""Integration tests for authentication endpoints."""
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from httpx import AsyncClient, ASGITransport


@pytest.fixture
def auth_app():
    from src.main import app
    from src.core.database import get_db

    mock_db = AsyncMock()
    mock_db.refresh = AsyncMock()

    async def _get_db():
        yield mock_db

    app.dependency_overrides[get_db] = _get_db
    yield app, mock_db
    app.dependency_overrides.clear()


@pytest.fixture
async def auth_client(auth_app):
    app, mock_db = auth_app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c, mock_db


class TestLoginEndpoint:
    async def test_returns_200_on_valid_credentials(self, auth_client):
        client, _ = auth_client
        mock_user = MagicMock()
        mock_user.id = uuid.uuid4()
        mock_user.email = "u@e.com"
        mock_user.is_active = True
        mock_user.password_hash = "$2b$04$x"
        with patch("src.services.authentication.sessions.service.users_service.get_user_by_email", AsyncMock(return_value=mock_user)), \
             patch("src.services.authentication.sessions.service.passwords_service.verify_password", return_value=True), \
             patch("src.services.authentication.tokens.service.repository.create_access_token_record", AsyncMock(return_value=MagicMock())), \
             patch("src.services.authentication.tokens.service.repository.create_refresh_token_record", AsyncMock(return_value=MagicMock())):
            response = await client.post("/api/v1/authentication/sessions/login", json={"email": "u@e.com", "password": "Pass@123"})
        assert response.status_code == 200

    async def test_returns_401_on_bad_credentials(self, auth_client):
        client, _ = auth_client
        with patch("src.services.authentication.sessions.service.users_service.get_user_by_email", AsyncMock(return_value=None)):
            response = await client.post("/api/v1/authentication/sessions/login", json={"email": "bad@e.com", "password": "wrong"})
        assert response.status_code == 401

    async def test_sets_access_token_cookie(self, auth_client):
        client, _ = auth_client
        mock_user = MagicMock()
        mock_user.id = uuid.uuid4()
        mock_user.email = "u@e.com"
        mock_user.is_active = True
        mock_user.password_hash = "$2b$04$x"
        with patch("src.services.authentication.sessions.service.users_service.get_user_by_email", AsyncMock(return_value=mock_user)), \
             patch("src.services.authentication.sessions.service.passwords_service.verify_password", return_value=True), \
             patch("src.services.authentication.tokens.service.repository.create_access_token_record", AsyncMock(return_value=MagicMock())), \
             patch("src.services.authentication.tokens.service.repository.create_refresh_token_record", AsyncMock(return_value=MagicMock())):
            response = await client.post("/api/v1/authentication/sessions/login", json={"email": "u@e.com", "password": "Pass@123"})
        assert "access_token" in response.cookies


class TestLogoutEndpoint:
    async def test_returns_200(self, auth_client):
        client, _ = auth_client
        response = await client.post("/api/v1/authentication/sessions/logout")
        assert response.status_code == 200


class TestMeEndpoint:
    async def test_returns_401_without_auth(self, auth_client):
        client, _ = auth_client
        response = await client.get("/api/v1/authentication/sessions/me")
        assert response.status_code == 401

    async def test_returns_user_when_authenticated(self, auth_client):
        client, _ = auth_client
        from src.main import app
        from src.services.authentication.dependencies import get_current_user
        mock_user = MagicMock()
        mock_user.id = uuid.uuid4()
        mock_user.email = "me@e.com"
        mock_user.is_active = True
        mock_user.password_changed = False
        mock_user.created_at.isoformat.return_value = "2024-01-01T00:00:00"
        app.dependency_overrides[get_current_user] = lambda: mock_user
        try:
            response = await client.get("/api/v1/authentication/sessions/me")
        finally:
            del app.dependency_overrides[get_current_user]
        assert response.status_code == 200
        assert response.json()["email"] == "me@e.com"


class TestTokenRefreshEndpoint:
    async def test_returns_400_without_cookie(self, auth_client):
        client, _ = auth_client
        response = await client.post("/api/v1/authentication/tokens/refresh")
        assert response.status_code == 400

    async def test_returns_400_with_invalid_format(self, auth_client):
        client, _ = auth_client
        client.cookies.set("refresh_token", "not-valid")
        response = await client.post("/api/v1/authentication/tokens/refresh")
        assert response.status_code == 400
