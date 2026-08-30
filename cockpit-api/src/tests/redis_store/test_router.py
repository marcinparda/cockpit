"""Unit tests for redis_store router."""
from unittest.mock import AsyncMock, patch

from src.services.redis_store import router
from src.services.redis_store.schemas import StoreKeyCreate, StoreKeyPatch
from src.tests.factories import make_store_envelope as _envelope


class TestListPrefixes:
    async def test_delegates_to_service(self, mock_redis):
        with patch("src.services.redis_store.router.service.list_prefixes", AsyncMock(return_value=["p1"])):
            assert await router.list_prefixes(mock_redis) == ["p1"]


class TestListCategories:
    async def test_delegates_to_service(self, mock_redis):
        with patch("src.services.redis_store.router.service.list_categories", AsyncMock(return_value=["c1"])):
            assert await router.list_categories("p", mock_redis) == ["c1"]


class TestResolveKey:
    async def test_delegates_to_service(self, mock_redis):
        env = _envelope("p:c:k", {"x": 1})
        with patch("src.services.redis_store.router.service.resolve_key", AsyncMock(return_value=env)):
            assert (await router.resolve_key("p", "c", "k", mock_redis)).data == {"x": 1}


class TestListKeys:
    async def test_delegates_to_service(self, mock_redis):
        with patch("src.services.redis_store.router.service.list_keys", AsyncMock(return_value=["k1"])):
            assert await router.list_keys("p", "c", mock_redis) == ["k1"]


class TestGetKey:
    async def test_delegates_to_service(self, mock_redis):
        env = _envelope("p:c:k", {"x": 1})
        with patch("src.services.redis_store.router.service.get_key", AsyncMock(return_value=env)):
            assert (await router.get_key("p", "c", "k", mock_redis)).data == {"x": 1}


class TestPutKey:
    async def test_delegates_to_service(self, mock_redis):
        env = _envelope("p:c:k", {"x": 1})
        body = StoreKeyCreate(data={"x": 1}, type="json", tags=[])
        with patch("src.services.redis_store.router.service.put_key", AsyncMock(return_value=env)):
            assert (await router.put_key("p", "c", "k", body, mock_redis)).data == {"x": 1}


class TestPatchKey:
    async def test_delegates_to_service(self, mock_redis):
        env = _envelope("p:c:k", {"x": 2})
        body = StoreKeyPatch(data={"x": 2})
        with patch("src.services.redis_store.router.service.patch_key", AsyncMock(return_value=env)):
            assert (await router.patch_key("p", "c", "k", body, mock_redis)).data == {"x": 2}


class TestDeleteKey:
    async def test_delegates_to_service(self, mock_redis):
        with patch("src.services.redis_store.router.service.delete_key", AsyncMock()) as mocked:
            await router.delete_key("p", "c", "k", mock_redis)
        mocked.assert_awaited_once_with(mock_redis, "p", "c", "k")
