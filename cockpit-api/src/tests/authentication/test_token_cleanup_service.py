"""Unit tests for token cleanup service."""
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from src.services.authentication.tokens import token_cleanup_service as service


def _make_ctx(mock_db):
    ctx = MagicMock()
    ctx.__aenter__ = AsyncMock(return_value=mock_db)
    ctx.__aexit__ = AsyncMock(return_value=None)
    return ctx


class TestCleanupExpiredTokens:
    async def test_returns_stats(self, mock_db):
        with patch("src.services.authentication.tokens.token_cleanup_service.token_cleanup_repository.delete_expired_access_tokens", AsyncMock(return_value=5)), \
             patch("src.services.authentication.tokens.token_cleanup_service.token_cleanup_repository.delete_expired_refresh_tokens", AsyncMock(return_value=3)):
            result = await service.cleanup_expired_tokens(mock_db)
        assert result["expired_access_tokens_deleted"] == 5
        assert result["expired_refresh_tokens_deleted"] == 3


class TestCleanupOldRevokedTokens:
    async def test_uses_default_retention(self, mock_db):
        with patch("src.services.authentication.tokens.token_cleanup_service.token_cleanup_repository.delete_old_revoked_access_tokens", AsyncMock(return_value=0)), \
             patch("src.services.authentication.tokens.token_cleanup_service.token_cleanup_repository.delete_old_revoked_refresh_tokens", AsyncMock(return_value=0)):
            result = await service.cleanup_old_revoked_tokens(mock_db)
        assert "retention_days" in result

    async def test_uses_custom_retention(self, mock_db):
        with patch("src.services.authentication.tokens.token_cleanup_service.token_cleanup_repository.delete_old_revoked_access_tokens", AsyncMock(return_value=0)), \
             patch("src.services.authentication.tokens.token_cleanup_service.token_cleanup_repository.delete_old_revoked_refresh_tokens", AsyncMock(return_value=0)):
            result = await service.cleanup_old_revoked_tokens(mock_db, retention_days=14)
        assert result["retention_days"] == 14


class TestGetTokenStatistics:
    async def test_returns_complete_stats(self, mock_db):
        with patch("src.services.authentication.tokens.token_cleanup_service.token_cleanup_repository.count_access_tokens_total", AsyncMock(return_value=100)), \
             patch("src.services.authentication.tokens.token_cleanup_service.token_cleanup_repository.count_access_tokens_active", AsyncMock(return_value=80)), \
             patch("src.services.authentication.tokens.token_cleanup_service.token_cleanup_repository.count_access_tokens_revoked", AsyncMock(return_value=10)), \
             patch("src.services.authentication.tokens.token_cleanup_service.token_cleanup_repository.count_access_tokens_expired", AsyncMock(return_value=10)), \
             patch("src.services.authentication.tokens.token_cleanup_service.token_cleanup_repository.count_refresh_tokens_total", AsyncMock(return_value=50)), \
             patch("src.services.authentication.tokens.token_cleanup_service.token_cleanup_repository.count_refresh_tokens_active", AsyncMock(return_value=40)), \
             patch("src.services.authentication.tokens.token_cleanup_service.token_cleanup_repository.count_refresh_tokens_revoked", AsyncMock(return_value=5)), \
             patch("src.services.authentication.tokens.token_cleanup_service.token_cleanup_repository.count_refresh_tokens_expired", AsyncMock(return_value=5)):
            result = await service.get_token_statistics(mock_db)
        assert result["access_tokens"]["total"] == 100
        assert result["refresh_tokens"]["total"] == 50


class TestComprehensiveTokenCleanup:
    async def test_returns_success(self, mock_db):
        now = datetime.now(timezone.utc)
        expired = {"expired_access_tokens_deleted": 5, "expired_refresh_tokens_deleted": 3, "cleanup_time": now}
        revoked = {"old_revoked_access_tokens_deleted": 2, "old_revoked_refresh_tokens_deleted": 1, "retention_days": 7, "cutoff_date": now, "cleanup_time": now}
        with patch("src.services.authentication.tokens.token_cleanup_service.async_session_maker", return_value=_make_ctx(mock_db)), \
             patch("src.services.authentication.tokens.token_cleanup_service.cleanup_expired_tokens", AsyncMock(return_value=expired)), \
             patch("src.services.authentication.tokens.token_cleanup_service.cleanup_old_revoked_tokens", AsyncMock(return_value=revoked)):
            result = await service.comprehensive_token_cleanup()
        assert result["success"] is True
        assert result["total_deleted"] == 11

    async def test_handles_exception(self):
        ctx = MagicMock()
        ctx.__aenter__ = AsyncMock(side_effect=Exception("DB error"))
        ctx.__aexit__ = AsyncMock(return_value=None)
        with patch("src.services.authentication.tokens.token_cleanup_service.async_session_maker", return_value=ctx):
            result = await service.comprehensive_token_cleanup()
        assert result["success"] is False


class TestGetCleanupStatistics:
    async def test_returns_success(self, mock_db):
        stats = {"access_tokens": {"total": 10}, "refresh_tokens": {"total": 5}}
        with patch("src.services.authentication.tokens.token_cleanup_service.async_session_maker", return_value=_make_ctx(mock_db)), \
             patch("src.services.authentication.tokens.token_cleanup_service.get_token_statistics", AsyncMock(return_value=stats)):
            result = await service.get_cleanup_statistics()
        assert result["success"] is True

    async def test_returns_error_on_failure(self):
        ctx = MagicMock()
        ctx.__aenter__ = AsyncMock(side_effect=Exception("fail"))
        ctx.__aexit__ = AsyncMock(return_value=None)
        with patch("src.services.authentication.tokens.token_cleanup_service.async_session_maker", return_value=ctx):
            result = await service.get_cleanup_statistics()
        assert result["success"] is False


class TestValidateCleanupHealth:
    async def test_returns_healthy(self, mock_db):
        stats = {"access_tokens": {"total": 10}, "refresh_tokens": {"total": 5}}
        with patch("src.services.authentication.tokens.token_cleanup_service.async_session_maker", return_value=_make_ctx(mock_db)), \
             patch("src.services.authentication.tokens.token_cleanup_service.get_token_statistics", AsyncMock(return_value=stats)):
            result = await service.validate_cleanup_health()
        assert result["healthy"] is True

    async def test_returns_unhealthy_on_failure(self):
        ctx = MagicMock()
        ctx.__aenter__ = AsyncMock(side_effect=Exception("down"))
        ctx.__aexit__ = AsyncMock(return_value=None)
        with patch("src.services.authentication.tokens.token_cleanup_service.async_session_maker", return_value=ctx):
            result = await service.validate_cleanup_health()
        assert result["healthy"] is False


class TestDailyTokenCleanupTask:
    async def test_returns_success(self):
        health = {"healthy": True, "checks": {}}
        cleanup = {"success": True, "total_deleted": 10, "duration": 0.5, "expired_cleanup": {}, "revoked_cleanup": {}, "end_time": datetime.now(timezone.utc), "start_time": datetime.now(timezone.utc)}
        with patch("src.services.authentication.tokens.token_cleanup_service.validate_cleanup_health", AsyncMock(return_value=health)), \
             patch("src.services.authentication.tokens.token_cleanup_service.comprehensive_token_cleanup", AsyncMock(return_value=cleanup)):
            result = await service.daily_token_cleanup_task()
        assert result["success"] is True

    async def test_fails_when_health_check_fails(self):
        with patch("src.services.authentication.tokens.token_cleanup_service.validate_cleanup_health", AsyncMock(return_value={"healthy": False, "checks": {}})):
            result = await service.daily_token_cleanup_task()
        assert result["success"] is False


class TestManualTokenCleanup:
    async def test_dry_run(self):
        with patch("src.services.authentication.tokens.token_cleanup_service.get_cleanup_statistics", AsyncMock(return_value={"success": True, "statistics": {}})):
            result = await service.manual_token_cleanup(dry_run=True)
        assert result["dry_run"] is True
        assert result["success"] is True

    async def test_actual_cleanup(self):
        cleanup = {"success": True, "total_deleted": 5, "end_time": datetime.now(timezone.utc), "start_time": datetime.now(timezone.utc), "duration": 0.1}
        with patch("src.services.authentication.tokens.token_cleanup_service.comprehensive_token_cleanup", AsyncMock(return_value=cleanup)):
            result = await service.manual_token_cleanup(dry_run=False)
        assert result["success"] is True

    async def test_handles_exception(self):
        with patch("src.services.authentication.tokens.token_cleanup_service.get_cleanup_statistics", AsyncMock(side_effect=Exception("err"))):
            result = await service.manual_token_cleanup(dry_run=True)
        assert result["success"] is False
