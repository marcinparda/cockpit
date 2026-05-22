"""Async SQLAlchemy repository for the habits service.

No business logic — pure DB query layer.
"""

from datetime import date
from typing import Optional, Sequence
from uuid import UUID

from sqlalchemy import and_, delete, func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from src.services.habits.models import (
    Habit,
    HabitCategory,
    HabitEntry,
    HabitStreakFreeze,
    PresetHabit,
    UserHabitSettings,
)


# ---------------------------------------------------------------------------
# Habit CRUD
# ---------------------------------------------------------------------------

async def get_habit_by_id(db: AsyncSession, habit_id: UUID) -> Optional[Habit]:
    """Get a single habit by primary key."""
    result = await db.execute(select(Habit).where(Habit.id == habit_id))
    return result.scalars().first()


async def list_habits(
    db: AsyncSession,
    user_id: UUID,
    archived: Optional[bool] = False,
) -> Sequence[Habit]:
    """List habits for a user, optionally filtering by archived status."""
    stmt = select(Habit).where(Habit.user_id == user_id)
    if archived is not None:
        stmt = stmt.where(Habit.is_archived == archived)
    stmt = stmt.order_by(Habit.sort_order, Habit.name)
    result = await db.execute(stmt)
    return result.scalars().all()


async def create_habit(db: AsyncSession, habit: Habit) -> Habit:
    """Persist a new Habit record."""
    db.add(habit)
    await db.commit()
    await db.refresh(habit)
    return habit


async def update_habit(db: AsyncSession, habit: Habit) -> Habit:
    """Commit pending changes to a Habit record."""
    await db.commit()
    await db.refresh(habit)
    return habit


async def update_habit_best_streak(db: AsyncSession, habit: Habit, best_streak: int) -> Habit:
    """Update the best_streak field on a habit."""
    habit.best_streak = best_streak
    await db.commit()
    await db.refresh(habit)
    return habit


async def delete_habit(db: AsyncSession, habit: Habit) -> None:
    """Delete a habit (cascades to entries and freezes)."""
    await db.delete(habit)
    await db.commit()


# ---------------------------------------------------------------------------
# Entry CRUD + upsert
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
    """Insert or update an entry for (habit_id, logged_at) using PostgreSQL upsert."""
    values = {
        "habit_id": habit_id,
        "user_id": user_id,
        "logged_at": logged_at,
        "boolean_value": boolean_value,
        "numeric_value": numeric_value,
        "numeric_unit": numeric_unit,
        "text_value": text_value,
    }
    stmt = (
        pg_insert(HabitEntry)
        .values(**values)
        .on_conflict_do_update(
            index_elements=["habit_id", "logged_at"],
            set_={
                "boolean_value": boolean_value,
                "numeric_value": numeric_value,
                "numeric_unit": numeric_unit,
                "text_value": text_value,
            },
        )
        .returning(HabitEntry)
    )
    result = await db.execute(stmt)
    await db.commit()
    entry = result.scalars().first()
    return entry  # type: ignore[return-value]


async def list_entries(
    db: AsyncSession,
    habit_id: UUID,
    user_id: UUID,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
) -> Sequence[HabitEntry]:
    """List entries for a habit within an optional date range."""
    stmt = select(HabitEntry).where(
        and_(HabitEntry.habit_id == habit_id, HabitEntry.user_id == user_id)
    )
    if from_date is not None:
        stmt = stmt.where(HabitEntry.logged_at >= from_date)
    if to_date is not None:
        stmt = stmt.where(HabitEntry.logged_at <= to_date)
    stmt = stmt.order_by(HabitEntry.logged_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_entry_by_id(
    db: AsyncSession, entry_id: UUID, user_id: UUID
) -> Optional[HabitEntry]:
    """Get a single entry by primary key, scoped to user."""
    result = await db.execute(
        select(HabitEntry).where(
            and_(HabitEntry.id == entry_id, HabitEntry.user_id == user_id)
        )
    )
    return result.scalars().first()


async def delete_entry(db: AsyncSession, entry: HabitEntry) -> None:
    """Delete an entry record."""
    await db.delete(entry)
    await db.commit()


async def get_logged_dates(
    db: AsyncSession, habit_id: UUID, user_id: UUID
) -> list[date]:
    """Return all logged_at dates for a habit (for streak calculation)."""
    result = await db.execute(
        select(HabitEntry.logged_at).where(
            and_(HabitEntry.habit_id == habit_id, HabitEntry.user_id == user_id)
        )
    )
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# Streak freezes
# ---------------------------------------------------------------------------

async def get_freeze_dates(
    db: AsyncSession, habit_id: UUID, user_id: UUID
) -> list[date]:
    """Return all freeze_date values for a habit (for streak calculation)."""
    result = await db.execute(
        select(HabitStreakFreeze.freeze_date).where(
            and_(
                HabitStreakFreeze.habit_id == habit_id,
                HabitStreakFreeze.user_id == user_id,
            )
        )
    )
    return list(result.scalars().all())


async def count_freezes_in_month(
    db: AsyncSession, habit_id: UUID, user_id: UUID, year: int, month: int
) -> int:
    """Count freeze records for a habit in the given calendar month."""
    result = await db.execute(
        select(func.count(HabitStreakFreeze.id)).where(
            and_(
                HabitStreakFreeze.habit_id == habit_id,
                HabitStreakFreeze.user_id == user_id,
                func.extract("year", HabitStreakFreeze.freeze_date) == year,
                func.extract("month", HabitStreakFreeze.freeze_date) == month,
            )
        )
    )
    return result.scalar_one()


async def create_freeze(
    db: AsyncSession, freeze: HabitStreakFreeze
) -> HabitStreakFreeze:
    """Persist a new streak freeze record."""
    db.add(freeze)
    await db.commit()
    await db.refresh(freeze)
    return freeze


# ---------------------------------------------------------------------------
# Category CRUD
# ---------------------------------------------------------------------------

async def list_categories(
    db: AsyncSession, user_id: UUID
) -> Sequence[HabitCategory]:
    """List all habit categories for a user."""
    result = await db.execute(
        select(HabitCategory)
        .where(HabitCategory.user_id == user_id)
        .order_by(HabitCategory.sort_order, HabitCategory.name)
    )
    return result.scalars().all()


async def get_category_by_id(
    db: AsyncSession, category_id: UUID, user_id: UUID
) -> Optional[HabitCategory]:
    """Get a single category by primary key, scoped to user."""
    result = await db.execute(
        select(HabitCategory).where(
            and_(
                HabitCategory.id == category_id,
                HabitCategory.user_id == user_id,
            )
        )
    )
    return result.scalars().first()


async def create_category(
    db: AsyncSession, category: HabitCategory
) -> HabitCategory:
    """Persist a new category."""
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


async def update_category(
    db: AsyncSession, category: HabitCategory
) -> HabitCategory:
    """Commit pending changes to a category record."""
    await db.commit()
    await db.refresh(category)
    return category


async def delete_category(db: AsyncSession, category: HabitCategory) -> None:
    """Delete a category record."""
    await db.delete(category)
    await db.commit()


# ---------------------------------------------------------------------------
# Stats queries
# ---------------------------------------------------------------------------

async def count_completed_today(
    db: AsyncSession, user_id: UUID, today: date
) -> int:
    """Count how many of the user's habits have an entry for today."""
    result = await db.execute(
        select(func.count(HabitEntry.id)).where(
            and_(HabitEntry.user_id == user_id, HabitEntry.logged_at == today)
        )
    )
    return result.scalar_one()


async def count_active_habits(db: AsyncSession, user_id: UUID) -> int:
    """Count non-archived habits for the user."""
    result = await db.execute(
        select(func.count(Habit.id)).where(
            and_(Habit.user_id == user_id, Habit.is_archived == False)  # noqa: E712
        )
    )
    return result.scalar_one()


async def get_weekly_completion_counts(
    db: AsyncSession, user_id: UUID, from_date: date, to_date: date
) -> list[tuple[date, int]]:
    """Return (logged_at, count) pairs for each day in the date range."""
    result = await db.execute(
        select(HabitEntry.logged_at, func.count(HabitEntry.id))
        .where(
            and_(
                HabitEntry.user_id == user_id,
                HabitEntry.logged_at >= from_date,
                HabitEntry.logged_at <= to_date,
            )
        )
        .group_by(HabitEntry.logged_at)
        .order_by(HabitEntry.logged_at)
    )
    return list(result.all())


async def get_streak_ranking(
    db: AsyncSession, user_id: UUID, limit: int = 10
) -> Sequence[Habit]:
    """Return habits ordered by best_streak descending."""
    result = await db.execute(
        select(Habit)
        .where(and_(Habit.user_id == user_id, Habit.is_archived == False))  # noqa: E712
        .order_by(Habit.best_streak.desc())
        .limit(limit)
    )
    return result.scalars().all()


# ---------------------------------------------------------------------------
# User habit settings
# ---------------------------------------------------------------------------

async def get_settings(
    db: AsyncSession, user_id: UUID
) -> Optional[UserHabitSettings]:
    """Get user habit settings record."""
    result = await db.execute(
        select(UserHabitSettings).where(UserHabitSettings.user_id == user_id)
    )
    return result.scalars().first()


async def upsert_settings(
    db: AsyncSession, user_id: UUID, **kwargs
) -> UserHabitSettings:
    """Create or update user habit settings."""
    settings = await get_settings(db, user_id)
    if settings is None:
        settings = UserHabitSettings(user_id=user_id)
        db.add(settings)

    for key, value in kwargs.items():
        if value is not None:
            setattr(settings, key, value)

    await db.commit()
    await db.refresh(settings)
    return settings


# ---------------------------------------------------------------------------
# Preset habits
# ---------------------------------------------------------------------------

async def list_presets(db: AsyncSession) -> Sequence[PresetHabit]:
    """Return all preset habit templates."""
    result = await db.execute(
        select(PresetHabit).order_by(PresetHabit.sort_order, PresetHabit.name)
    )
    return result.scalars().all()


async def get_today_entries_by_habit(
    db: AsyncSession, user_id: UUID, today: date
) -> dict[UUID, HabitEntry]:
    """Return a mapping of habit_id → today's entry for all the user's habits."""
    result = await db.execute(
        select(HabitEntry).where(
            and_(HabitEntry.user_id == user_id, HabitEntry.logged_at == today)
        )
    )
    return {entry.habit_id: entry for entry in result.scalars().all()}


async def get_all_logged_dates_for_user(
    db: AsyncSession, user_id: UUID
) -> dict[UUID, list[date]]:
    """Return all logged_at dates grouped by habit_id for a user. Single query."""
    result = await db.execute(
        select(HabitEntry.habit_id, HabitEntry.logged_at).where(
            HabitEntry.user_id == user_id
        )
    )
    mapping: dict[UUID, list[date]] = {}
    for habit_id, logged_at in result.all():
        mapping.setdefault(habit_id, []).append(logged_at)
    return mapping


async def get_all_freeze_dates_for_user(
    db: AsyncSession, user_id: UUID
) -> dict[UUID, list[date]]:
    """Return all freeze_dates grouped by habit_id for a user. Single query."""
    result = await db.execute(
        select(HabitStreakFreeze.habit_id, HabitStreakFreeze.freeze_date).where(
            HabitStreakFreeze.user_id == user_id
        )
    )
    mapping: dict[UUID, list[date]] = {}
    for habit_id, freeze_date in result.all():
        mapping.setdefault(habit_id, []).append(freeze_date)
    return mapping
