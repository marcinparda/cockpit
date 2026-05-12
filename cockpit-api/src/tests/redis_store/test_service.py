"""Unit tests for redis_store service."""
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi import HTTPException
from src.services.redis_store import service
from src.services.redis_store.schemas import StoreEnvelope, StoreKeyCreate, StoreKeyPatch, StoreMeta


def _envelope(key: str, data: dict, version: int = 1) -> StoreEnvelope:
    now = datetime.now(timezone.utc)
    return StoreEnvelope(meta=StoreMeta(key=key, type="json", version=version, created_at=now, updated_at=now, tags=[]), data=data)


class TestBuildRedisKey:
    def test_format(self):
        assert service._build_redis_key("p", "c", "k") == "p:c:k"


class TestGetKey:
    async def test_raises_404_when_missing(self, mock_redis):
        with patch("src.services.redis_store.service.repository.get_key", AsyncMock(return_value=None)):
            with pytest.raises(HTTPException) as exc:
                await service.get_key(mock_redis, "p", "c", "k")
            assert exc.value.status_code == 404

    async def test_returns_envelope(self, mock_redis):
        env = _envelope("p:c:k", {"x": 1})
        with patch("src.services.redis_store.service.repository.get_key", AsyncMock(return_value=env)):
            assert (await service.get_key(mock_redis, "p", "c", "k")).data == {"x": 1}


class TestPutKey:
    async def test_creates_with_version_1(self, mock_redis):
        with patch("src.services.redis_store.service.repository.get_key", AsyncMock(return_value=None)), \
             patch("src.services.redis_store.service.repository.set_key", AsyncMock()):
            result = await service.put_key(mock_redis, "p", "c", "k", StoreKeyCreate(data={"x": 1}, type="json", tags=[]))
        assert result.meta.version == 1

    async def test_increments_version(self, mock_redis):
        existing = _envelope("p:c:k", {"x": 1}, version=1)
        with patch("src.services.redis_store.service.repository.get_key", AsyncMock(return_value=existing)), \
             patch("src.services.redis_store.service.repository.set_key", AsyncMock()):
            result = await service.put_key(mock_redis, "p", "c", "k", StoreKeyCreate(data={"x": 2}, type="json", tags=[]))
        assert result.meta.version == 2


class TestPatchKey:
    async def test_raises_404_when_missing(self, mock_redis):
        with patch("src.services.redis_store.service.repository.get_key", AsyncMock(return_value=None)):
            with pytest.raises(HTTPException) as exc:
                await service.patch_key(mock_redis, "p", "c", "k", StoreKeyPatch(data={"b": 2}))
            assert exc.value.status_code == 404

    async def test_merges_dict(self, mock_redis):
        existing = _envelope("p:c:k", {"a": 1})
        with patch("src.services.redis_store.service.repository.get_key", AsyncMock(return_value=existing)), \
             patch("src.services.redis_store.service.repository.set_key", AsyncMock()):
            result = await service.patch_key(mock_redis, "p", "c", "k", StoreKeyPatch(data={"b": 2}))
        assert result.data == {"a": 1, "b": 2}


class TestDeleteKey:
    async def test_raises_404(self, mock_redis):
        with patch("src.services.redis_store.service.repository.delete_key", AsyncMock(return_value=False)):
            with pytest.raises(HTTPException) as exc:
                await service.delete_key(mock_redis, "p", "c", "k")
            assert exc.value.status_code == 404

    async def test_deletes(self, mock_redis):
        with patch("src.services.redis_store.service.repository.delete_key", AsyncMock(return_value=True)):
            await service.delete_key(mock_redis, "p", "c", "k")


class TestListKeys:
    async def test_returns_keys(self, mock_redis):
        with patch("src.services.redis_store.service.repository.list_keys", AsyncMock(return_value=["p:c:k1", "p:c:k2"])):
            assert len(await service.list_keys(mock_redis, "p", "c")) == 2


class TestResolveKey:
    async def test_raises_404_when_base_missing(self, mock_redis):
        with patch("src.services.redis_store.service.repository.get_key", AsyncMock(return_value=None)):
            with pytest.raises(HTTPException):
                await service.resolve_key(mock_redis, "ov", "c", "k")

    async def test_returns_base_when_no_override(self, mock_redis):
        base = _envelope("base:c:k", {"base": True})
        async def _get(client, key):
            return base if "base" in key else None
        with patch("src.services.redis_store.service.repository.get_key", _get):
            result = await service.resolve_key(mock_redis, "ov", "c", "k")
        assert result.data == {"base": True}

    async def test_merges_override(self, mock_redis):
        base = _envelope("base:c:k", {"a": 1, "b": 2})
        ov = _envelope("ov:c:k", {"b": 99})
        async def _get(client, key):
            return base if "base" in key else ov
        with patch("src.services.redis_store.service.repository.get_key", _get):
            result = await service.resolve_key(mock_redis, "ov", "c", "k")
        assert result.data == {"a": 1, "b": 99}


class TestListPrefixes:
    async def test_returns_unique_prefixes(self, mock_redis):
        with patch("src.services.redis_store.service.repository.list_all_keys", AsyncMock(return_value=["p1:c:k", "p2:c:k", "p1:c:k2"])):
            assert sorted(await service.list_prefixes(mock_redis)) == ["p1", "p2"]


class TestListCategories:
    async def test_returns_unique_categories(self, mock_redis):
        with patch("src.services.redis_store.service.repository.list_keys", AsyncMock(return_value=["p:c1:k", "p:c2:k"])):
            assert sorted(await service.list_categories(mock_redis, "p")) == ["c1", "c2"]
