"""Unit tests for Vikunja client."""
from unittest.mock import AsyncMock, MagicMock, patch
import httpx
from src.services.vikunja.client import get_vikunja_token, make_vikunja_client


class TestGetVikunjaToken:
    async def test_returns_cached_bytes_from_redis(self):
        redis = AsyncMock()
        redis.get = AsyncMock(return_value=b"cached-token")
        assert await get_vikunja_token(redis) == "cached-token"

    async def test_returns_cached_str_from_redis(self):
        redis = AsyncMock()
        redis.get = AsyncMock(return_value="str-token")
        assert await get_vikunja_token(redis) == "str-token"

    async def test_fetches_and_caches_when_miss(self):
        redis = AsyncMock()
        redis.get = AsyncMock(return_value=None)
        redis.set = AsyncMock()
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"token": "fresh"}
        mock_resp.raise_for_status = MagicMock()
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=mock_resp)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        with patch("src.services.vikunja.client.httpx.AsyncClient", return_value=mock_client):
            token = await get_vikunja_token(redis)
        assert token == "fresh"
        redis.set.assert_called_once()

    async def test_fetches_without_redis(self):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"token": "direct"}
        mock_resp.raise_for_status = MagicMock()
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=mock_resp)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        with patch("src.services.vikunja.client.httpx.AsyncClient", return_value=mock_client):
            token = await get_vikunja_token(None)
        assert token == "direct"


class TestMakeVikunjaClient:
    def test_creates_async_client(self):
        client = make_vikunja_client("my-token")
        assert isinstance(client, httpx.AsyncClient)
