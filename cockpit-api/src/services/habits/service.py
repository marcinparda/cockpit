"""Business logic for the habits service."""

from datetime import date
from typing import Optional, Sequence
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.services.habits import repository
from src.services.habits.models import (
    Habit,
    HabitCategory,
    HabitEntry,
    HabitStreakFreeze,
    PresetHabit,
    UserHabitSettings,
)
from src.services.habits.schemas import (
    HabitCategoryCreate,
    HabitCreate,
    HabitEntryResponse,
    HabitResponse,
    HabitUpdate,
    StreakResponse,
    UserHabitSettingsUpdate,
)
from src.services.habits.streak_service import calculate_streak

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

_FORBIDDEN_FIELDS: dict[str, list[str]] = {
    "boolean": ["numeric_value", "text_value"],
    "numeric": ["text_value"],
    "text": ["numeric_value"],
}


def _validate_entry_type(
    habit_type: str,
    boolean_value: Optional[bool],
    numeric_value: Optional[float],
    text_value: Optional[str],
) -> None:
    """Raise HTTP 422 if the entry values are incompatible with the habit type."""
    forbidden = _FORBIDDEN_FIELDS.get(habit_type, [])
    values = {"numeric_value": numeric_value, "text_value": text_value}
    for field in forbidden:
        if values.get(field) is not None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Field '{field}' is not allowed for habit type '{habit_type}'",
            )
    if habit_type == "boolean" and numeric_value is not None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Field 'numeric_value' is not allowed for habit type 'boolean'",
        )


async def _get_habit_or_404(db: AsyncSession, habit_id: UUID, user_id: UUID) -> Habit:
    habit = await repository.get_habit_by_id(db, habit_id)
    if not habit or habit.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found",
        )
    return habit


# ---------------------------------------------------------------------------
# Habit CRUD
# ---------------------------------------------------------------------------

async def list_habits(
    db: AsyncSession,
    user_id: UUID,
    archived: Optional[bool] = False,
) -> Sequence[Habit]:
    return await repository.list_habits(db, user_id, archived=archived)


async def get_habit(db: AsyncSession, habit_id: UUID, user_id: UUID) -> Habit:
    return await _get_habit_or_404(db, habit_id, user_id)


async def create_habit(
    db: AsyncSession, user_id: UUID, data: HabitCreate
) -> Habit:
    habit = Habit(
        user_id=user_id,
        name=data.name,
        icon=data.icon,
        type=data.type,
        color=data.color,
        frequency_type=data.frequency_type,
        frequency_value=data.frequency_value,
        target_value=data.target_value,
        target_unit=data.target_unit,
        streak_mode=data.streak_mode,
        reminder_time=data.reminder_time,
        timezone=data.timezone,
        category_id=data.category_id,
        sort_order=data.sort_order,
    )
    return await repository.create_habit(db, habit)


async def update_habit(
    db: AsyncSession, habit_id: UUID, user_id: UUID, data: HabitUpdate
) -> Habit:
    habit = await _get_habit_or_404(db, habit_id, user_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(habit, field, value)
    return await repository.update_habit(db, habit)


async def delete_habit(db: AsyncSession, habit_id: UUID, user_id: UUID) -> None:
    habit = await _get_habit_or_404(db, habit_id, user_id)
    await repository.delete_habit(db, habit)


# ---------------------------------------------------------------------------
# Entry upsert / delete
# ---------------------------------------------------------------------------

async def upsert_entry(
    db: AsyncSession,
    habit_id: UUID,
    user_id: UUID,
    logged_at: date,
    boolean_value: Optional[bool] = None,
    numeric_value: Optional[float] = None,
    numeric_unit: Optional[str] = None,
    text_value: Optional[str] = None,
) -> HabitEntry:
    habit = await _get_habit_or_404(db, habit_id, user_id)

    _validate_entry_type(habit.type, boolean_value, numeric_value, text_value)

    entry = await repository.upsert_entry(
        db,
        habit_id=habit_id,
        user_id=user_id,
        logged_at=logged_at,
        boolean_value=boolean_value,
        numeric_value=numeric_value,
        numeric_unit=numeric_unit,
        text_value=text_value,
    )

    # Recalculate streak and update best_streak if necessary
    logged_dates = await repository.get_logged_dates(db, habit_id, user_id)
    freeze_dates = await repository.get_freeze_dates(db, habit_id, user_id)
    streak_result = calculate_streak(habit, logged_dates, freeze_dates)

    if streak_result.best_streak > habit.best_streak:
        await repository.update_habit_best_streak(db, habit, streak_result.best_streak)

    return entry


async def list_entries(
    db: AsyncSession,
    habit_id: UUID,
    user_id: UUID,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
) -> Sequence[HabitEntry]:
    await _get_habit_or_404(db, habit_id, user_id)
    return await repository.list_entries(db, habit_id, user_id, from_date, to_date)


async def delete_entry(
    db: AsyncSession, habit_id: UUID, entry_id: UUID, user_id: UUID
) -> None:
    await _get_habit_or_404(db, habit_id, user_id)
    entry = await repository.get_entry_by_id(db, entry_id, user_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )
    await repository.delete_entry(db, entry)


# ---------------------------------------------------------------------------
# Streak
# ---------------------------------------------------------------------------

async def get_streak(
    db: AsyncSession, habit_id: UUID, user_id: UUID
) -> StreakResponse:
    habit = await _get_habit_or_404(db, habit_id, user_id)
    logged_dates = await repository.get_logged_dates(db, habit_id, user_id)
    freeze_dates = await repository.get_freeze_dates(db, habit_id, user_id)
    result = calculate_streak(habit, logged_dates, freeze_dates)
    return StreakResponse(
        current_streak=result.current_streak,
        best_streak=result.best_streak,
        last_period_completed=result.last_period_completed,
    )


# ---------------------------------------------------------------------------
# Streak freeze
# ---------------------------------------------------------------------------

async def create_freeze(
    db: AsyncSession,
    habit_id: UUID,
    user_id: UUID,
    freeze_date: date,
) -> HabitStreakFreeze:
    habit = await _get_habit_or_404(db, habit_id, user_id)

    count = await repository.count_freezes_in_month(
        db, habit_id, user_id, freeze_date.year, freeze_date.month
    )
    if count >= 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Maximum of 2 streak freezes per calendar month already used",
        )

    freeze = HabitStreakFreeze(
        habit_id=habit_id,
        user_id=user_id,
        freeze_date=freeze_date,
    )
    return await repository.create_freeze(db, freeze)


# ---------------------------------------------------------------------------
# Category CRUD
# ---------------------------------------------------------------------------

async def list_categories(
    db: AsyncSession, user_id: UUID
) -> Sequence[HabitCategory]:
    return await repository.list_categories(db, user_id)


async def create_category(
    db: AsyncSession, user_id: UUID, data: HabitCategoryCreate
) -> HabitCategory:
    category = HabitCategory(
        user_id=user_id,
        name=data.name,
        color=data.color,
        sort_order=data.sort_order,
    )
    return await repository.create_category(db, category)


async def update_category(
    db: AsyncSession, category_id: UUID, user_id: UUID, data: HabitCategoryCreate
) -> HabitCategory:
    category = await repository.get_category_by_id(db, category_id, user_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    category.name = data.name
    if data.color is not None:
        category.color = data.color
    category.sort_order = data.sort_order
    return await repository.update_category(db, category)


async def delete_category(
    db: AsyncSession, category_id: UUID, user_id: UUID
) -> None:
    category = await repository.get_category_by_id(db, category_id, user_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    await repository.delete_category(db, category)


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

async def get_today_stats(db: AsyncSession, user_id: UUID) -> dict:
    today = date.today()
    completed = await repository.count_completed_today(db, user_id, today)
    total = await repository.count_active_habits(db, user_id)
    pct = round(completed / total * 100, 1) if total > 0 else 0.0
    return {"completed": completed, "total": total, "completion_pct": pct}


async def get_weekly_stats(db: AsyncSession, user_id: UUID) -> list:
    from datetime import timedelta

    today = date.today()
    from_date = today - timedelta(days=6)
    counts = await repository.get_weekly_completion_counts(db, user_id, from_date, today)
    count_map = {row[0]: row[1] for row in counts}
    return [
        {
            "date": str(from_date + timedelta(days=i)),
            "count": count_map.get(from_date + timedelta(days=i), 0),
        }
        for i in range(7)
    ]


async def get_streak_ranking(db: AsyncSession, user_id: UUID) -> Sequence[Habit]:
    return await repository.get_streak_ranking(db, user_id)


async def get_monthly_highlights(db: AsyncSession, user_id: UUID) -> dict:
    """Return a simple monthly summary."""
    from datetime import timedelta

    today = date.today()
    first_of_month = today.replace(day=1)
    counts = await repository.get_weekly_completion_counts(
        db, user_id, first_of_month, today
    )
    total_entries = sum(row[1] for row in counts)
    return {"month": today.strftime("%Y-%m"), "total_entries": total_entries}


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

async def get_settings(
    db: AsyncSession, user_id: UUID
) -> UserHabitSettings:
    settings = await repository.get_settings(db, user_id)
    if settings is None:
        settings = await repository.upsert_settings(db, user_id)
    return settings


async def update_settings(
    db: AsyncSession, user_id: UUID, data: UserHabitSettingsUpdate
) -> UserHabitSettings:
    update_kwargs = data.model_dump(exclude_unset=True)
    return await repository.upsert_settings(db, user_id, **update_kwargs)


# ---------------------------------------------------------------------------
# Presets
# ---------------------------------------------------------------------------

async def list_presets(db: AsyncSession) -> Sequence[PresetHabit]:
    return await repository.list_presets(db)
