"""Unit tests for redis_store dependencies."""
from unittest.mock import AsyncMock, patch


class TestGetRedisClient:
    async def test_yields_and_closes(self):
        from src.services.redis_store.dependencies import get_redis_client
        mock_client = AsyncMock()
        mock_client.aclose = AsyncMock()
        with patch("src.services.redis_store.dependencies.Redis.from_url", return_value=mock_client):
            gen = get_redis_client()
            client = await gen.__anext__()
            assert client is mock_client
            try:
                await gen.__anext__()
            except StopAsyncIteration:
                pass
        mock_client.aclose.assert_called_once()
