"""Tests for habits service — covers CRUD paths, stats, category, settings, and user scoping."""
import uuid
from datetime import date
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from src.services.habits import service
from src.tests.factories import make_habit as _make_habit_factory


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_habit(habit_id: uuid.UUID, user_id: uuid.UUID, habit_type: str = "boolean") -> MagicMock:
    return _make_habit_factory(id=habit_id, user_id=user_id, type=habit_type)


# ---------------------------------------------------------------------------
# _get_habit_or_404 — user scoping
# ---------------------------------------------------------------------------

class TestGetHabitOr404:
    async def test_returns_404_when_habit_belongs_to_other_user(self, mock_db):
        """A habit that exists but belongs to a different user returns 404."""
        habit_id = uuid.uuid4()
        requesting_user_id = uuid.uuid4()
        other_user_id = uuid.uuid4()

        mock_habit = _make_habit(habit_id, other_user_id)

        with patch(
            "src.services.habits.service.repository.get_habit_by_id",
            AsyncMock(return_value=mock_habit),
        ):
            with pytest.raises(HTTPException) as exc_info:
                await service.get_habit(mock_db, habit_id, requesting_user_id)

        assert exc_info.value.status_code == 404

    async def test_returns_404_when_habit_does_not_exist(self, mock_db):
        """A non-existent habit returns 404."""
        habit_id = uuid.uuid4()
        user_id = uuid.uuid4()

        with patch(
            "src.services.habits.service.repository.get_habit_by_id",
            AsyncMock(return_value=None),
        ):
            with pytest.raises(HTTPException) as exc_info:
                await service.get_habit(mock_db, habit_id, user_id)

        assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# create_habit / update_habit / delete_habit
# ---------------------------------------------------------------------------

class TestHabitCRUD:
    async def test_create_habit_returns_persisted_habit(self, mock_db):
        """create_habit calls repository and returns the saved habit."""
        user_id = uuid.uuid4()
        mock_created = MagicMock()
        mock_created.id = uuid.uuid4()

        data = MagicMock()
        data.name = "Read"
        data.icon = "book"
        data.type = "boolean"
        data.color = "#aabbcc"
        data.frequency_type = "daily"
        data.frequency_value = None
        data.target_value = None
        data.target_unit = None
        data.streak_mode = "soft"
        data.reminder_time = None
        data.timezone = "UTC"
        data.category_id = None
        data.sort_order = 0

        with patch(
            "src.services.habits.service.repository.create_habit",
            AsyncMock(return_value=mock_created),
        ):
            result = await service.create_habit(mock_db, user_id, data)

        assert result is mock_created

    async def test_update_habit_applies_fields_and_saves(self, mock_db):
        """update_habit sets fields on the habit and calls repository.update_habit."""
        habit_id = uuid.uuid4()
        user_id = uuid.uuid4()
        mock_habit = _make_habit(habit_id, user_id)
        mock_updated = MagicMock()

        data = MagicMock()
        data.model_dump = MagicMock(return_value={"name": "New Name"})

        with (
            patch(
                "src.services.habits.service.repository.get_habit_by_id",
                AsyncMock(return_value=mock_habit),
            ),
            patch(
                "src.services.habits.service.repository.update_habit",
                AsyncMock(return_value=mock_updated),
            ),
        ):
            result = await service.update_habit(mock_db, habit_id, user_id, data)

        assert result is mock_updated

    async def test_delete_habit_calls_repository_delete(self, mock_db):
        """delete_habit fetches the habit and calls repository.delete_habit."""
        habit_id = uuid.uuid4()
        user_id = uuid.uuid4()
        mock_habit = _make_habit(habit_id, user_id)

        with (
            patch(
                "src.services.habits.service.repository.get_habit_by_id",
                AsyncMock(return_value=mock_habit),
            ),
            patch(
                "src.services.habits.service.repository.delete_habit",
                AsyncMock(),
            ) as mock_delete,
        ):
            await service.delete_habit(mock_db, habit_id, user_id)

        mock_delete.assert_called_once()


# ---------------------------------------------------------------------------
# delete_entry — entry not found
# ---------------------------------------------------------------------------

class TestDeleteEntry:
    async def test_delete_entry_returns_404_when_entry_missing(self, mock_db):
        """delete_entry raises 404 when the entry does not exist."""
        habit_id = uuid.uuid4()
        entry_id = uuid.uuid4()
        user_id = uuid.uuid4()
        mock_habit = _make_habit(habit_id, user_id)

        with (
            patch(
                "src.services.habits.service.repository.get_habit_by_id",
                AsyncMock(return_value=mock_habit),
            ),
            patch(
                "src.services.habits.service.repository.get_entry_by_id",
                AsyncMock(return_value=None),
            ),
        ):
            with pytest.raises(HTTPException) as exc_info:
                await service.delete_entry(mock_db, habit_id, entry_id, user_id)

        assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

class TestStats:
    async def test_get_today_stats_returns_zero_when_no_habits(self, mock_db):
        """get_today_stats returns 0% when there are no active habits."""
        user_id = uuid.uuid4()

        with (
            patch(
                "src.services.habits.service.repository.count_completed_today",
                AsyncMock(return_value=0),
            ),
            patch(
                "src.services.habits.service.repository.count_active_habits",
                AsyncMock(return_value=0),
            ),
        ):
            result = await service.get_today_stats(mock_db, user_id)

        assert result["completion_pct"] == 0.0
        assert result["completed"] == 0
        assert result["total"] == 0

    async def test_get_today_stats_calculates_percentage(self, mock_db):
        """get_today_stats calculates completion percentage correctly."""
        user_id = uuid.uuid4()

        with (
            patch(
                "src.services.habits.service.repository.count_completed_today",
                AsyncMock(return_value=3),
            ),
            patch(
                "src.services.habits.service.repository.count_active_habits",
                AsyncMock(return_value=4),
            ),
        ):
            result = await service.get_today_stats(mock_db, user_id)

        assert result["completion_pct"] == 75.0

    async def test_get_streak_ranking_delegates_to_repository(self, mock_db):
        """get_streak_ranking returns whatever repository.get_streak_ranking returns."""
        user_id = uuid.uuid4()
        mock_habits = [MagicMock(), MagicMock()]

        with patch(
            "src.services.habits.service.repository.get_streak_ranking",
            AsyncMock(return_value=mock_habits),
        ):
            result = await service.get_streak_ranking(mock_db, user_id)

        assert result is mock_habits


# ---------------------------------------------------------------------------
# Category CRUD
# ---------------------------------------------------------------------------

class TestCategoryCRUD:
    async def test_update_category_returns_404_when_category_missing(self, mock_db):
        """update_category raises 404 when category does not exist."""
        category_id = uuid.uuid4()
        user_id = uuid.uuid4()
        data = MagicMock()

        with patch(
            "src.services.habits.service.repository.get_category_by_id",
            AsyncMock(return_value=None),
        ):
            with pytest.raises(HTTPException) as exc_info:
                await service.update_category(mock_db, category_id, user_id, data)

        assert exc_info.value.status_code == 404

    async def test_delete_category_returns_404_when_category_missing(self, mock_db):
        """delete_category raises 404 when category does not exist."""
        category_id = uuid.uuid4()
        user_id = uuid.uuid4()

        with patch(
            "src.services.habits.service.repository.get_category_by_id",
            AsyncMock(return_value=None),
        ):
            with pytest.raises(HTTPException) as exc_info:
                await service.delete_category(mock_db, category_id, user_id)

        assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

class TestSettings:
    async def test_get_settings_creates_defaults_when_missing(self, mock_db):
        """get_settings calls upsert_settings when no settings row exists."""
        user_id = uuid.uuid4()
        default_settings = MagicMock()

        with (
            patch(
                "src.services.habits.service.repository.get_settings",
                AsyncMock(return_value=None),
            ),
            patch(
                "src.services.habits.service.repository.upsert_settings",
                AsyncMock(return_value=default_settings),
            ) as mock_upsert,
        ):
            result = await service.get_settings(mock_db, user_id)

        mock_upsert.assert_called_once()
        assert result is default_settings

    async def test_update_settings_delegates_to_repository(self, mock_db):
        """update_settings passes kwargs from model_dump to repository.upsert_settings."""
        user_id = uuid.uuid4()
        updated = MagicMock()
        data = MagicMock()
        data.model_dump = MagicMock(return_value={"notification_enabled": True})

        with patch(
            "src.services.habits.service.repository.upsert_settings",
            AsyncMock(return_value=updated),
        ):
            result = await service.update_settings(mock_db, user_id, data)

        assert result is updated


# ---------------------------------------------------------------------------
# Remaining service paths for coverage
# ---------------------------------------------------------------------------

class TestRemainingPaths:
    async def test_list_habits_delegates_to_repository(self, mock_db):
        """list_habits returns whatever repository.list_habits returns."""
        user_id = uuid.uuid4()
        mock_habits = [MagicMock()]

        with patch(
            "src.services.habits.service.repository.list_habits",
            AsyncMock(return_value=mock_habits),
        ):
            result = await service.list_habits(mock_db, user_id)

        assert result is mock_habits

    async def test_list_entries_delegates_to_repository(self, mock_db):
        """list_entries fetches habit for ownership check then lists entries."""
        habit_id = uuid.uuid4()
        user_id = uuid.uuid4()
        mock_habit = _make_habit(habit_id, user_id)
        mock_entries = [MagicMock()]

        with (
            patch(
                "src.services.habits.service.repository.get_habit_by_id",
                AsyncMock(return_value=mock_habit),
            ),
            patch(
                "src.services.habits.service.repository.list_entries",
                AsyncMock(return_value=mock_entries),
            ),
        ):
            result = await service.list_entries(mock_db, habit_id, user_id)

        assert result is mock_entries

    async def test_get_streak_returns_streak_response(self, mock_db):
        """get_streak returns a StreakResponse with calculated values."""
        habit_id = uuid.uuid4()
        user_id = uuid.uuid4()
        mock_habit = _make_habit(habit_id, user_id)

        with (
            patch(
                "src.services.habits.service.repository.get_habit_by_id",
                AsyncMock(return_value=mock_habit),
            ),
            patch(
                "src.services.habits.service.repository.get_logged_dates",
                AsyncMock(return_value=[]),
            ),
            patch(
                "src.services.habits.service.repository.get_freeze_dates",
                AsyncMock(return_value=[]),
            ),
        ):
            result = await service.get_streak(mock_db, habit_id, user_id)

        assert result.current_streak == 0
        assert result.best_streak == 0

    async def test_list_categories_delegates_to_repository(self, mock_db):
        """list_categories returns whatever repository.list_categories returns."""
        user_id = uuid.uuid4()
        mock_cats = [MagicMock()]

        with patch(
            "src.services.habits.service.repository.list_categories",
            AsyncMock(return_value=mock_cats),
        ):
            result = await service.list_categories(mock_db, user_id)

        assert result is mock_cats

    async def test_create_category_returns_persisted_category(self, mock_db):
        """create_category creates a HabitCategory and calls repository.create_category."""
        user_id = uuid.uuid4()
        mock_created = MagicMock()
        data = MagicMock()
        data.name = "Health"
        data.color = "#aabbcc"
        data.sort_order = 0

        with patch(
            "src.services.habits.service.repository.create_category",
            AsyncMock(return_value=mock_created),
        ):
            result = await service.create_category(mock_db, user_id, data)

        assert result is mock_created

    async def test_update_category_success_path(self, mock_db):
        """update_category updates fields and persists when category exists."""
        category_id = uuid.uuid4()
        user_id = uuid.uuid4()
        mock_category = MagicMock()
        mock_updated = MagicMock()

        data = MagicMock()
        data.name = "Updated"
        data.color = "#112233"
        data.sort_order = 1

        with (
            patch(
                "src.services.habits.service.repository.get_category_by_id",
                AsyncMock(return_value=mock_category),
            ),
            patch(
                "src.services.habits.service.repository.update_category",
                AsyncMock(return_value=mock_updated),
            ),
        ):
            result = await service.update_category(mock_db, category_id, user_id, data)

        assert result is mock_updated

    async def test_get_weekly_stats_returns_seven_days(self, mock_db):
        """get_weekly_stats returns a list of 7 day entries."""
        user_id = uuid.uuid4()

        with patch(
            "src.services.habits.service.repository.get_weekly_completion_counts",
            AsyncMock(return_value=[]),
        ):
            result = await service.get_weekly_stats(mock_db, user_id)

        assert len(result) == 7
        for entry in result:
            assert "date" in entry
            assert "count" in entry

    async def test_get_monthly_highlights_returns_month_key(self, mock_db):
        """get_monthly_highlights returns a dict with month and total_entries."""
        user_id = uuid.uuid4()

        with patch(
            "src.services.habits.service.repository.get_weekly_completion_counts",
            AsyncMock(return_value=[(date.today(), 3), (date.today(), 2)]),
        ):
            result = await service.get_monthly_highlights(mock_db, user_id)

        assert "month" in result
        assert result["total_entries"] == 5

    async def test_list_presets_delegates_to_repository(self, mock_db):
        """list_presets returns whatever repository.list_presets returns."""
        mock_presets = [MagicMock(), MagicMock()]

        with patch(
            "src.services.habits.service.repository.list_presets",
            AsyncMock(return_value=mock_presets),
        ):
            result = await service.list_presets(mock_db)

        assert result is mock_presets

    async def test_validate_entry_type_text_value_not_allowed_for_boolean(self, mock_db):
        """Providing text_value for a boolean habit raises HTTP 422."""
        habit_id = uuid.uuid4()
        user_id = uuid.uuid4()
        mock_habit = _make_habit(habit_id, user_id, "boolean")

        with patch(
            "src.services.habits.service.repository.get_habit_by_id",
            AsyncMock(return_value=mock_habit),
        ):
            with pytest.raises(HTTPException) as exc_info:
                await service.upsert_entry(
                    mock_db, habit_id, user_id, date.today(), text_value="hello"
                )

        assert exc_info.value.status_code == 422

    async def test_delete_entry_success_path(self, mock_db):
        """delete_entry calls repository.delete_entry when entry exists."""
        habit_id = uuid.uuid4()
        entry_id = uuid.uuid4()
        user_id = uuid.uuid4()
        mock_habit = _make_habit(habit_id, user_id)
        mock_entry = MagicMock()

        mock_delete = AsyncMock()
        with (
            patch(
                "src.services.habits.service.repository.get_habit_by_id",
                AsyncMock(return_value=mock_habit),
            ),
            patch(
                "src.services.habits.service.repository.get_entry_by_id",
                AsyncMock(return_value=mock_entry),
            ),
            patch(
                "src.services.habits.service.repository.delete_entry",
                mock_delete,
            ),
        ):
            await service.delete_entry(mock_db, habit_id, entry_id, user_id)

        mock_delete.assert_called_once_with(mock_db, mock_entry)

    async def test_delete_category_success_path(self, mock_db):
        """delete_category calls repository.delete_category when category exists."""
        category_id = uuid.uuid4()
        user_id = uuid.uuid4()
        mock_category = MagicMock()

        mock_delete = AsyncMock()
        with (
            patch(
                "src.services.habits.service.repository.get_category_by_id",
                AsyncMock(return_value=mock_category),
            ),
            patch(
                "src.services.habits.service.repository.delete_category",
                mock_delete,
            ),
        ):
            await service.delete_category(mock_db, category_id, user_id)

        mock_delete.assert_called_once_with(mock_db, mock_category)

    async def test_upsert_entry_updates_best_streak_when_improved(self, mock_db):
        """upsert_entry calls update_habit_best_streak when the new streak exceeds stored best."""
        from datetime import timedelta

        habit_id = uuid.uuid4()
        user_id = uuid.uuid4()
        today = date.today()
        logged_at = today

        mock_habit = _make_habit(habit_id, user_id)
        mock_habit.best_streak = 0  # current stored best
        mock_entry = MagicMock()

        # Provide a logged date so calculate_streak returns current_streak = 1
        logged_dates = [today]

        mock_update_best_streak = AsyncMock(return_value=mock_habit)

        with (
            patch(
                "src.services.habits.service.repository.get_habit_by_id",
                AsyncMock(return_value=mock_habit),
            ),
            patch(
                "src.services.habits.service.repository.upsert_entry",
                AsyncMock(return_value=mock_entry),
            ),
            patch(
                "src.services.habits.service.repository.get_logged_dates",
                AsyncMock(return_value=logged_dates),
            ),
            patch(
                "src.services.habits.service.repository.get_freeze_dates",
                AsyncMock(return_value=[]),
            ),
            patch(
                "src.services.habits.service.repository.update_habit_best_streak",
                mock_update_best_streak,
            ),
        ):
            result = await service.upsert_entry(
                mock_db, habit_id, user_id, logged_at, boolean_value=True
            )

        assert result is mock_entry
        mock_update_best_streak.assert_called_once()
