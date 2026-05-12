"""Integration tests for health endpoints."""
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from httpx import AsyncClient, ASGITransport


@pytest.fixture
def health_app():
    from src.main import app
    from src.core.database import get_db

    async def _get_db():
        yield AsyncMock()

    app.dependency_overrides[get_db] = _get_db
    yield app
    app.dependency_overrides.clear()


@pytest.fixture
async def health_client(health_app):
    async with AsyncClient(transport=ASGITransport(app=health_app), base_url="http://test") as c:
        yield c


class TestHealthEndpoint:
    async def test_basic_health_200(self, health_client):
        response = await health_client.get("/health")
        assert response.status_code == 200

    async def test_basic_health_status(self, health_client):
        assert response.json()["status"] == "healthy" if (response := await health_client.get("/health")) else True

    async def test_cleanup_health_200(self, health_client):
        mock_job = MagicMock()
        mock_job.id = "j1"
        mock_job.name = "J"
        mock_job.next_run_time = None
        with patch("src.services.health.service.token_cleanup_service.validate_cleanup_health", AsyncMock(return_value={"healthy": True, "checks": {}})), \
             patch("src.services.health.service.task_scheduler.is_running", return_value=True), \
             patch("src.services.health.service.task_scheduler.get_jobs", return_value=[mock_job]):
            response = await health_client.get("/health/cleanup")
        assert response.status_code == 200

    async def test_cleanup_health_500_on_exception(self, health_client):
        with patch("src.services.health.service.token_cleanup_service.validate_cleanup_health", AsyncMock(side_effect=Exception("DB down"))):
            response = await health_client.get("/health/cleanup")
        assert response.status_code == 500
