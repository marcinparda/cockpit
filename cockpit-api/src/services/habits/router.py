"""HTTP router for the habits service."""

from datetime import date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.database import get_db
from src.services.authorization.permissions.dependencies import require_permission
from src.services.authorization.permissions.enums import Actions, Features
from src.services.habits import repository, service
from src.services.habits.streak_service import calculate_streak
from src.services.habits.schemas import (
    HabitCategoryCreate,
    HabitCategoryResponse,
    HabitCreate,
    HabitEntryCreate,
    HabitEntryResponse,
    HabitResponse,
    HabitStreakFreezeResponse,
    HabitUpdate,
    PresetHabitResponse,
    StreakResponse,
    UserHabitSettingsResponse,
    UserHabitSettingsUpdate,
    VapidPublicKeyResponse,
)
from src.services.users.models import User

router = APIRouter()


# ---------------------------------------------------------------------------
# Presets (mounted at /presets in main.py with prefix /api/v1)
# ---------------------------------------------------------------------------

@router.get("/presets", response_model=List[PresetHabitResponse])
async def list_presets(
    _: User = Depends(require_permission(Features.HABITS, Actions.READ)),
    db: AsyncSession = Depends(get_db),
) -> List[PresetHabitResponse]:
    """List all preset habit templates."""
    presets = await service.list_presets(db)
    return [PresetHabitResponse.model_validate(p) for p in presets]


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

@router.get("/habits/stats/today")
async def get_today_stats(
    current_user: User = Depends(require_permission(Features.HABITS, Actions.READ)),
    db: AsyncSession = Depends(get_db),
):
    """Today's habit completion stats."""
    return await service.get_today_stats(db, UUID(str(current_user.id)))


@router.get("/habits/stats/weekly")
async def get_weekly_stats(
    current_user: User = Depends(require_permission(Features.HABITS, Actions.READ)),
    db: AsyncSession = Depends(get_db),
):
    """Weekly bar chart data (last 7 days)."""
    return await service.get_weekly_stats(db, UUID(str(current_user.id)))


@router.get("/habits/stats/streaks", response_model=List[HabitResponse])
async def get_streak_ranking(
    current_user: User = Depends(require_permission(Features.HABITS, Actions.READ)),
    db: AsyncSession = Depends(get_db),
) -> List[HabitResponse]:
    """Streak ranking — top habits by current_streak desc."""
    user_id = UUID(str(current_user.id))
    habits = await service.get_streak_ranking(db, user_id)
    all_logged = await repository.get_all_logged_dates_for_user(db, user_id)
    all_freezes = await repository.get_all_freeze_dates_for_user(db, user_id)
    result: list[HabitResponse] = []
    for h in habits:
        r = HabitResponse.model_validate(h)
        streak_result = calculate_streak(h, all_logged.get(h.id, []), all_freezes.get(h.id, []))
        r.current_streak = streak_result.current_streak
        r.best_streak = streak_result.best_streak
        result.append(r)
    result.sort(key=lambda x: x.current_streak, reverse=True)
    return result


@router.get("/habits/stats/monthly-highlights")
async def get_monthly_highlights(
    current_user: User = Depends(require_permission(Features.HABITS, Actions.READ)),
    db: AsyncSession = Depends(get_db),
):
    """Monthly highlights."""
    return await service.get_monthly_highlights(db, UUID(str(current_user.id)))


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

@router.get("/habits/settings/vapid-public-key", response_model=VapidPublicKeyResponse)
async def get_vapid_public_key(
    _: User = Depends(require_permission(Features.HABITS, Actions.READ)),
) -> VapidPublicKeyResponse:
    """Return the VAPID public key for Web Push registration."""
    return VapidPublicKeyResponse(public_key=settings.VAPID_PUBLIC_KEY)


@router.get("/habits/settings", response_model=UserHabitSettingsResponse)
async def get_settings(
    current_user: User = Depends(require_permission(Features.HABITS, Actions.READ)),
    db: AsyncSession = Depends(get_db),
) -> UserHabitSettingsResponse:
    """Get current user's push notification settings."""
    s = await service.get_settings(db, UUID(str(current_user.id)))
    return UserHabitSettingsResponse.model_validate(s)


@router.patch("/habits/settings", response_model=UserHabitSettingsResponse)
async def update_settings(
    data: UserHabitSettingsUpdate,
    current_user: User = Depends(require_permission(Features.HABITS, Actions.UPDATE)),
    db: AsyncSession = Depends(get_db),
) -> UserHabitSettingsResponse:
    """Update push subscription / notifications_enabled."""
    s = await service.update_settings(db, UUID(str(current_user.id)), data)
    return UserHabitSettingsResponse.model_validate(s)


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------

@router.get("/habits/categories", response_model=List[HabitCategoryResponse])
async def list_categories(
    current_user: User = Depends(require_permission(Features.HABITS, Actions.READ)),
    db: AsyncSession = Depends(get_db),
) -> List[HabitCategoryResponse]:
    """List habit categories."""
    cats = await service.list_categories(db, UUID(str(current_user.id)))
    return [HabitCategoryResponse.model_validate(c) for c in cats]


@router.post(
    "/habits/categories",
    response_model=HabitCategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_category(
    data: HabitCategoryCreate,
    current_user: User = Depends(require_permission(Features.HABITS, Actions.CREATE)),
    db: AsyncSession = Depends(get_db),
) -> HabitCategoryResponse:
    """Create a new habit category."""
    cat = await service.create_category(db, UUID(str(current_user.id)), data)
    return HabitCategoryResponse.model_validate(cat)


@router.patch("/habits/categories/{category_id}", response_model=HabitCategoryResponse)
async def update_category(
    category_id: UUID,
    data: HabitCategoryCreate,
    current_user: User = Depends(require_permission(Features.HABITS, Actions.UPDATE)),
    db: AsyncSession = Depends(get_db),
) -> HabitCategoryResponse:
    """Update a habit category."""
    cat = await service.update_category(
        db, category_id, UUID(str(current_user.id)), data
    )
    return HabitCategoryResponse.model_validate(cat)


@router.delete(
    "/habits/categories/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_category(
    category_id: UUID,
    current_user: User = Depends(require_permission(Features.HABITS, Actions.DELETE)),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a habit category."""
    await service.delete_category(db, category_id, UUID(str(current_user.id)))


# ---------------------------------------------------------------------------
# Habits CRUD
# ---------------------------------------------------------------------------

@router.get("/habits", response_model=List[HabitResponse])
async def list_habits(
    archived: Optional[str] = Query(
        "false",
        description="Filter: 'false' (default), 'true', or 'all'",
    ),
    current_user: User = Depends(require_permission(Features.HABITS, Actions.READ)),
    db: AsyncSession = Depends(get_db),
) -> List[HabitResponse]:
    """List habits for the current user."""
    archived_filter: Optional[bool]
    if archived == "all":
        archived_filter = None
    elif archived == "true":
        archived_filter = True
    else:
        archived_filter = False

    user_id = UUID(str(current_user.id))
    habits = await service.list_habits(db, user_id, archived=archived_filter)
    today_entries = await repository.get_today_entries_by_habit(db, user_id, date.today())
    categories = await repository.list_categories(db, user_id)
    category_names = {c.id: c.name for c in categories}
    all_logged = await repository.get_all_logged_dates_for_user(db, user_id)
    all_freezes = await repository.get_all_freeze_dates_for_user(db, user_id)
    result: list[HabitResponse] = []
    for h in habits:
        r = HabitResponse.model_validate(h)
        entry = today_entries.get(h.id)
        if entry:
            r.today_entry = HabitEntryResponse.model_validate(entry)
        if h.category_id:
            r.category_name = category_names.get(h.category_id)
        streak_result = calculate_streak(
            h,
            all_logged.get(h.id, []),
            all_freezes.get(h.id, []),
        )
        r.current_streak = streak_result.current_streak
        r.best_streak = streak_result.best_streak
        result.append(r)
    return result


@router.post("/habits", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
async def create_habit(
    data: HabitCreate,
    current_user: User = Depends(require_permission(Features.HABITS, Actions.CREATE)),
    db: AsyncSession = Depends(get_db),
) -> HabitResponse:
    """Create a new habit."""
    habit = await service.create_habit(db, UUID(str(current_user.id)), data)
    return HabitResponse.model_validate(habit)


@router.get("/habits/{habit_id}", response_model=HabitResponse)
async def get_habit(
    habit_id: UUID,
    current_user: User = Depends(require_permission(Features.HABITS, Actions.READ)),
    db: AsyncSession = Depends(get_db),
) -> HabitResponse:
    """Get a single habit."""
    habit = await service.get_habit(db, habit_id, UUID(str(current_user.id)))
    return HabitResponse.model_validate(habit)


@router.patch("/habits/{habit_id}", response_model=HabitResponse)
async def update_habit(
    habit_id: UUID,
    data: HabitUpdate,
    current_user: User = Depends(require_permission(Features.HABITS, Actions.UPDATE)),
    db: AsyncSession = Depends(get_db),
) -> HabitResponse:
    """Partially update a habit."""
    habit = await service.update_habit(db, habit_id, UUID(str(current_user.id)), data)
    return HabitResponse.model_validate(habit)


@router.delete("/habits/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_habit(
    habit_id: UUID,
    current_user: User = Depends(require_permission(Features.HABITS, Actions.DELETE)),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a habit."""
    await service.delete_habit(db, habit_id, UUID(str(current_user.id)))


# ---------------------------------------------------------------------------
# Entries
# ---------------------------------------------------------------------------

@router.get("/habits/{habit_id}/entries", response_model=List[HabitEntryResponse])
async def list_entries(
    habit_id: UUID,
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    current_user: User = Depends(require_permission(Features.HABITS, Actions.READ)),
    db: AsyncSession = Depends(get_db),
) -> List[HabitEntryResponse]:
    """List entries for a habit."""
    entries = await service.list_entries(
        db, habit_id, UUID(str(current_user.id)), from_date, to_date
    )
    return [HabitEntryResponse.model_validate(e) for e in entries]


@router.post(
    "/habits/{habit_id}/entries",
    response_model=HabitEntryResponse,
    status_code=status.HTTP_200_OK,
)
async def upsert_entry(
    habit_id: UUID,
    data: HabitEntryCreate,
    current_user: User = Depends(require_permission(Features.HABITS, Actions.CREATE)),
    db: AsyncSession = Depends(get_db),
) -> HabitEntryResponse:
    """Upsert a habit entry for a given date."""
    entry = await service.upsert_entry(
        db,
        habit_id=habit_id,
        user_id=UUID(str(current_user.id)),
        logged_at=data.logged_at,
        boolean_value=data.boolean_value,
        numeric_value=data.numeric_value,
        numeric_unit=data.numeric_unit,
        text_value=data.text_value,
    )
    return HabitEntryResponse.model_validate(entry)


@router.delete(
    "/habits/{habit_id}/entries/{entry_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_entry(
    habit_id: UUID,
    entry_id: UUID,
    current_user: User = Depends(require_permission(Features.HABITS, Actions.DELETE)),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a habit entry."""
    await service.delete_entry(db, habit_id, entry_id, UUID(str(current_user.id)))


# ---------------------------------------------------------------------------
# Streak
# ---------------------------------------------------------------------------

@router.get("/habits/{habit_id}/streak", response_model=StreakResponse)
async def get_streak(
    habit_id: UUID,
    current_user: User = Depends(require_permission(Features.HABITS, Actions.READ)),
    db: AsyncSession = Depends(get_db),
) -> StreakResponse:
    """Get current streak for a habit."""
    return await service.get_streak(db, habit_id, UUID(str(current_user.id)))


# ---------------------------------------------------------------------------
# Streak freeze
# ---------------------------------------------------------------------------

@router.post(
    "/habits/{habit_id}/freezes",
    response_model=HabitStreakFreezeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_freeze(
    habit_id: UUID,
    freeze_date: date = Query(...),
    current_user: User = Depends(require_permission(Features.HABITS, Actions.CREATE)),
    db: AsyncSession = Depends(get_db),
):
    """Apply a streak freeze for a specific date."""
    freeze = await service.create_freeze(
        db, habit_id, UUID(str(current_user.id)), freeze_date
    )
    return freeze
