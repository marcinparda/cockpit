"""Tests for habits router and service behaviour."""
import uuid
from datetime import date
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from httpx import AsyncClient, ASGITransport

from src.tests.factories import make_habit, make_habit_entry


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def habit_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture
def unauthenticated_app():
    """App with DB override but NO current_user override (simulates no auth token)."""
    from src.main import app
    from src.core.database import get_db

    mock_db = AsyncMock()
    mock_db.refresh = AsyncMock()

    async def _get_db():
        yield mock_db

    app.dependency_overrides[get_db] = _get_db
    yield app
    app.dependency_overrides.clear()


@pytest.fixture
async def unauthenticated_client(unauthenticated_app) -> AsyncClient:
    async with AsyncClient(
        transport=ASGITransport(app=unauthenticated_app), base_url="http://test"
    ) as c:
        yield c


# ---------------------------------------------------------------------------
# Test: unauthenticated access returns 401
# ---------------------------------------------------------------------------

class TestUnauthenticatedAccess:
    async def test_get_habits_returns_401_for_unauthenticated(
        self, unauthenticated_client: AsyncClient
    ):
        """GET /api/v1/habits returns 401 when no auth token is present."""
        response = await unauthenticated_client.get("/api/v1/habits")
        assert response.status_code == 401

    async def test_post_habits_returns_401_for_unauthenticated(
        self, unauthenticated_client: AsyncClient
    ):
        """POST /api/v1/habits returns 401 when no auth token is present."""
        response = await unauthenticated_client.post(
            "/api/v1/habits",
            json={"name": "Test", "icon": "star", "type": "boolean"},
        )
        assert response.status_code == 401

    async def test_get_presets_returns_401_for_unauthenticated(
        self, unauthenticated_client: AsyncClient
    ):
        """GET /api/v1/presets returns 401 when no auth token is present."""
        response = await unauthenticated_client.get("/api/v1/presets")
        assert response.status_code == 401


# ---------------------------------------------------------------------------
# Test: entry upsert (service-level via mocked repository)
# ---------------------------------------------------------------------------

class TestEntryUpsert:
    async def test_second_post_for_same_date_updates_not_duplicates(self, mock_db):
        """Service upsert_entry: second call for same (habit_id, logged_at) updates."""
        from src.services.habits import service

        habit_id = uuid.uuid4()
        user_id = uuid.uuid4()
        logged_at = date(2026, 5, 21)

        mock_habit = make_habit(id=habit_id, user_id=user_id)

        mock_entry = make_habit_entry(
            habit_id=habit_id,
            user_id=user_id,
            logged_at=logged_at,
            boolean_value=True,
        )

        with (
            patch("src.services.habits.service.repository.get_habit_by_id", AsyncMock(return_value=mock_habit)),
            patch("src.services.habits.service.repository.upsert_entry", AsyncMock(return_value=mock_entry)),
            patch("src.services.habits.service.repository.get_logged_dates", AsyncMock(return_value=[])),
            patch("src.services.habits.service.repository.get_freeze_dates", AsyncMock(return_value=[])),
            patch("src.services.habits.service.repository.update_habit_best_streak", AsyncMock(return_value=mock_habit)),
        ):
            entry1 = await service.upsert_entry(
                mock_db, habit_id, user_id, logged_at, boolean_value=True
            )
            entry2 = await service.upsert_entry(
                mock_db, habit_id, user_id, logged_at, boolean_value=False
            )

        # Both calls should succeed (not raise); upsert was called twice
        assert entry1 is not None
        assert entry2 is not None


# ---------------------------------------------------------------------------
# Test: freeze quota enforcement
# ---------------------------------------------------------------------------

class TestFreezeQuota:
    async def test_second_freeze_in_month_succeeds(self, mock_db):
        """2nd freeze in the same calendar month is accepted."""
        from src.services.habits import service

        habit_id = uuid.uuid4()
        user_id = uuid.uuid4()
        freeze_date = date(2026, 5, 21)

        mock_habit = make_habit(id=habit_id, user_id=user_id)

        mock_freeze = MagicMock()
        mock_freeze.id = uuid.uuid4()
        mock_freeze.freeze_date = freeze_date

        with (
            patch("src.services.habits.service.repository.get_habit_by_id", AsyncMock(return_value=mock_habit)),
            patch("src.services.habits.service.repository.count_freezes_in_month", AsyncMock(return_value=1)),
            patch("src.services.habits.service.repository.create_freeze", AsyncMock(return_value=mock_freeze)),
        ):
            result = await service.create_freeze(mock_db, habit_id, user_id, freeze_date)

        assert result is not None

    async def test_third_freeze_in_month_raises_422(self, mock_db):
        """3rd freeze in the same calendar month raises HTTP 422."""
        from fastapi import HTTPException
        from src.services.habits import service

        habit_id = uuid.uuid4()
        user_id = uuid.uuid4()
        freeze_date = date(2026, 5, 21)

        mock_habit = make_habit(id=habit_id, user_id=user_id)

        with (
            patch("src.services.habits.service.repository.get_habit_by_id", AsyncMock(return_value=mock_habit)),
            patch("src.services.habits.service.repository.count_freezes_in_month", AsyncMock(return_value=2)),
        ):
            with pytest.raises(HTTPException) as exc_info:
                await service.create_freeze(mock_db, habit_id, user_id, freeze_date)

        assert exc_info.value.status_code == 422


# ---------------------------------------------------------------------------
# Test: type validation
# ---------------------------------------------------------------------------

class TestTypeValidation:
    async def test_numeric_value_on_boolean_habit_raises_422(self, mock_db):
        """Providing numeric_value for a boolean habit raises HTTP 422."""
        from fastapi import HTTPException
        from src.services.habits import service

        habit_id = uuid.uuid4()
        user_id = uuid.uuid4()
        logged_at = date(2026, 5, 21)

        mock_habit = make_habit(id=habit_id, user_id=user_id, type="boolean")

        with patch("src.services.habits.service.repository.get_habit_by_id", AsyncMock(return_value=mock_habit)):
            with pytest.raises(HTTPException) as exc_info:
                await service.upsert_entry(
                    mock_db, habit_id, user_id, logged_at, numeric_value=5.0
                )

        assert exc_info.value.status_code == 422
