"""Unit tests for MCP API key middleware."""
from unittest.mock import AsyncMock, MagicMock, patch
from starlette.responses import JSONResponse
from src.services.mcp.auth import MCPAPIKeyMiddleware


async def _inner(scope, receive, send):
    response = JSONResponse({"ok": True})
    await response(scope, receive, send)


def _scope(headers: dict | None = None) -> dict:
    raw = [(k.encode(), v.encode()) for k, v in (headers or {}).items()]
    return {"type": "http", "method": "GET", "path": "/mcp", "query_string": b"", "headers": raw}


class TestMCPAPIKeyMiddleware:
    async def test_passes_non_http_scope(self):
        mw = MCPAPIKeyMiddleware(_inner, "secret")
        await mw({"type": "lifespan"}, AsyncMock(), AsyncMock())

    async def test_rejects_no_auth(self):
        mw = MCPAPIKeyMiddleware(_inner, "secret")
        responses = []
        async def send(msg): responses.append(msg)
        await mw(_scope(), AsyncMock(), send)
        assert next(r for r in responses if r["type"] == "http.response.start")["status"] == 401

    async def test_accepts_valid_api_key(self):
        mw = MCPAPIKeyMiddleware(_inner, "secret")
        responses = []
        async def send(msg): responses.append(msg)
        await mw(_scope({"authorization": "Bearer secret"}), AsyncMock(), send)
        assert next(r for r in responses if r["type"] == "http.response.start")["status"] == 200

    async def test_rejects_wrong_key(self):
        mw = MCPAPIKeyMiddleware(_inner, "secret")
        responses = []
        async def send(msg): responses.append(msg)
        with patch.object(mw, "_validate_oauth_token", AsyncMock(return_value=False)):
            await mw(_scope({"authorization": "Bearer wrong"}), AsyncMock(), send)
        assert next(r for r in responses if r["type"] == "http.response.start")["status"] == 401

    async def test_accepts_valid_oauth_token(self):
        mw = MCPAPIKeyMiddleware(_inner, "secret")
        responses = []
        async def send(msg): responses.append(msg)
        with patch.object(mw, "_validate_oauth_token", AsyncMock(return_value=True)):
            await mw(_scope({"authorization": "Bearer oauth-tok"}), AsyncMock(), send)
        assert next(r for r in responses if r["type"] == "http.response.start")["status"] == 200

    async def test_empty_key_falls_through_to_oauth(self):
        mw = MCPAPIKeyMiddleware(_inner, "")
        responses = []
        async def send(msg): responses.append(msg)
        with patch.object(mw, "_validate_oauth_token", AsyncMock(return_value=True)):
            await mw(_scope({"authorization": "Bearer any"}), AsyncMock(), send)
        assert next(r for r in responses if r["type"] == "http.response.start")["status"] == 200
