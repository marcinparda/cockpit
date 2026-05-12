"""Unit tests for health service."""
from unittest.mock import AsyncMock, MagicMock, patch
from src.services.health.service import HealthService


class TestGetBasicHealth:
    async def test_returns_healthy(self):
        result = await HealthService.get_basic_health()
        assert result.status == "healthy"


class TestGetCleanupHealth:
    async def test_returns_healthy(self):
        mock_job = MagicMock()
        mock_job.id = "j1"
        mock_job.name = "Job"
        mock_job.next_run_time = None
        with patch("src.services.health.service.token_cleanup_service.validate_cleanup_health", AsyncMock(return_value={"healthy": True, "checks": {}})), \
             patch("src.services.health.service.task_scheduler.is_running", return_value=True), \
             patch("src.services.health.service.task_scheduler.get_jobs", return_value=[mock_job]):
            result = await HealthService.get_cleanup_health()
        assert result.status == "healthy"
        assert result.scheduler.running is True

    async def test_returns_unhealthy(self):
        with patch("src.services.health.service.token_cleanup_service.validate_cleanup_health", AsyncMock(return_value={"healthy": False, "checks": {}})), \
             patch("src.services.health.service.task_scheduler.is_running", return_value=False), \
             patch("src.services.health.service.task_scheduler.get_jobs", return_value=[]):
            result = await HealthService.get_cleanup_health()
        assert result.status == "unhealthy"
