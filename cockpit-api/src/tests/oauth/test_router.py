"""Tests for OAuth router: login form escaping and redirect encoding."""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.core.database import get_db
from src.services.oauth.router import _login_form_html, router

PAYLOAD = '"><script>alert(1)</script>'
ESCAPED = "&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"


@pytest.fixture
def client():
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_db] = lambda: MagicMock()
    return TestClient(app, follow_redirects=False)


def _form_kwargs(**overrides):
    kwargs = dict(
        client_id="cid",
        redirect_uri="https://e.com/cb",
        response_type="code",
        code_challenge="ch",
        code_challenge_method="S256",
        scope="",
        state="",
    )
    kwargs.update(overrides)
    return kwargs


class TestLoginFormEscaping:
    @pytest.mark.parametrize("field", ["state", "scope", "client_id", "redirect_uri"])
    def test_payload_is_escaped(self, field):
        html = _login_form_html(**_form_kwargs(**{field: PAYLOAD}))
        assert PAYLOAD not in html
        assert "<script>alert(1)</script>" not in html
        assert ESCAPED in html

    def test_normal_state_unchanged(self):
        html = _login_form_html(**_form_kwargs(state="abc123"))
        assert 'name="state" value="abc123"' in html

    def test_get_authorize_escapes_state(self, client):
        with patch("src.services.oauth.router.oauth_service.validate_authorize_request", AsyncMock()):
            resp = client.get(
                "/oauth/authorize",
                params={
                    "client_id": "cid",
                    "redirect_uri": "https://e.com/cb",
                    "response_type": "code",
                    "code_challenge": "ch",
                    "state": PAYLOAD,
                },
            )
        assert PAYLOAD not in resp.text
        assert ESCAPED in resp.text


class TestRedirectStateEncoding:
    def _post(self, client, state):
        user = MagicMock(id="11111111-1111-1111-1111-111111111111")
        with patch("src.services.oauth.router.oauth_service.validate_authorize_request", AsyncMock()), \
             patch("src.services.oauth.router.sessions_service.authenticate_user", AsyncMock(return_value=user)), \
             patch("src.services.oauth.router.oauth_service.create_auth_code", AsyncMock(return_value="CODE")):
            return client.post(
                "/oauth/authorize",
                data={
                    "client_id": "cid",
                    "redirect_uri": "https://e.com/cb",
                    "response_type": "code",
                    "code_challenge": "ch",
                    "state": state,
                    "email": "a@b.c",
                    "password": "pw",
                },
            )

    def test_state_is_percent_encoded(self, client):
        resp = self._post(client, "x&code=evil")
        assert resp.status_code == 302
        assert resp.headers["location"] == "https://e.com/cb?code=CODE&state=x%26code%3Devil"

    def test_normal_state_passes_through(self, client):
        resp = self._post(client, "abc123")
        assert resp.headers["location"] == "https://e.com/cb?code=CODE&state=abc123"
