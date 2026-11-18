"""Tests for the entries-by-date-range endpoint and the shared completion rule."""
import uuid
from datetime import date
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from src.tests.factories import make_habit_entry


@pytest.fixture
async def admin_client(mock_db, mock_admin_user) -> AsyncClient:
    """Client authenticated as an admin (passes every permission check)."""
    from src.main import app
    from src.core.database import get_db
    from src.services.authentication.dependencies import get_current_user

    async def _get_db():
        yield mock_db

    async def _get_current_user():
        return mock_admin_user

    app.dependency_overrides[get_db] = _get_db
    app.dependency_overrides[get_current_user] = _get_current_user
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
async def unauthenticated_client(mock_db) -> AsyncClient:
    from src.main import app
    from src.core.database import get_db

    async def _get_db():
        yield mock_db

    app.dependency_overrides[get_db] = _get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


class TestListAllEntries:
    async def test_returns_entries_across_habits_with_habit_id(
        self, admin_client: AsyncClient, mock_admin_user
    ):
        e1 = make_habit_entry(user_id=mock_admin_user.id, logged_at=date(2026, 5, 20), boolean_value=True)
        e2 = make_habit_entry(user_id=mock_admin_user.id, logged_at=date(2026, 5, 21), boolean_value=False)
        for e in (e1, e2):
            e.numeric_unit = None

        with patch(
            "src.services.habits.router.repository.list_entries_for_user",
            AsyncMock(return_value=[e2, e1]),
        ) as mocked:
            response = await admin_client.get(
                "/api/v1/habits/entries",
                params={"start_date": "2026-05-20", "end_date": "2026-05-21"},
            )

        assert response.status_code == 200
        body = response.json()
        assert [row["habit_id"] for row in body] == [str(e2.habit_id), str(e1.habit_id)]
        assert body[0]["boolean_value"] is False
        args = mocked.call_args.args
        assert args[1] == mock_admin_user.id
        assert args[2:] == (date(2026, 5, 20), date(2026, 5, 21))

    async def test_same_start_and_end_date_is_accepted(self, admin_client: AsyncClient):
        with patch(
            "src.services.habits.router.repository.list_entries_for_user",
            AsyncMock(return_value=[]),
        ):
            response = await admin_client.get(
                "/api/v1/habits/entries",
                params={"start_date": "2026-05-21", "end_date": "2026-05-21"},
            )
        assert response.status_code == 200
        assert response.json() == []

    async def test_end_before_start_returns_422(self, admin_client: AsyncClient):
        response = await admin_client.get(
            "/api/v1/habits/entries",
            params={"start_date": "2026-05-22", "end_date": "2026-05-21"},
        )
        assert response.status_code == 422

    async def test_missing_dates_returns_422(self, admin_client: AsyncClient):
        response = await admin_client.get("/api/v1/habits/entries")
        assert response.status_code == 422

    async def test_unauthenticated_returns_401(self, unauthenticated_client: AsyncClient):
        response = await unauthenticated_client.get(
            "/api/v1/habits/entries",
            params={"start_date": "2026-05-20", "end_date": "2026-05-21"},
        )
        assert response.status_code == 401

    async def test_query_is_scoped_to_user_and_inclusive_range(self):
        from sqlalchemy.dialects import postgresql
        from src.services.habits import repository

        db = AsyncMock()
        result = MagicMock()
        result.scalars.return_value.all.return_value = []
        db.execute = AsyncMock(return_value=result)

        await repository.list_entries_for_user(
            db, uuid.uuid4(), date(2026, 5, 20), date(2026, 5, 21)
        )

        sql = str(db.execute.call_args.args[0].compile(dialect=postgresql.dialect()))
        assert "habit_entries.user_id =" in sql
        assert "habit_entries.logged_at >=" in sql
        assert "habit_entries.logged_at <=" in sql


class TestCompletionRuleInQueries:
    """Every completion query must exclude boolean 'not done' entries."""

    @pytest.mark.parametrize(
        "name,args",
        [
            ("get_logged_dates", (uuid.uuid4(), uuid.uuid4())),
            ("get_all_logged_dates_for_user", (uuid.uuid4(),)),
            ("count_completed_today", (uuid.uuid4(), date(2026, 5, 21))),
            ("get_weekly_completion_counts", (uuid.uuid4(), date(2026, 5, 15), date(2026, 5, 21))),
        ],
    )
    async def test_query_excludes_not_done_boolean_entries(self, name, args):
        from sqlalchemy.dialects import postgresql
        from src.services.habits import repository

        db = AsyncMock()
        result = MagicMock()
        result.all.return_value = []
        result.scalars.return_value.all.return_value = []
        result.scalar_one.return_value = 0
        db.execute = AsyncMock(return_value=result)

        await getattr(repository, name)(db, *args)

        sql = str(db.execute.call_args.args[0].compile(dialect=postgresql.dialect()))
        assert "boolean_value IS DISTINCT FROM false" in sql
