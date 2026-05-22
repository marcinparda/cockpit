"""Pydantic v2 request/response schemas for the habits service."""

from datetime import date, time
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Category schemas
# ---------------------------------------------------------------------------

class HabitCategoryCreate(BaseModel):
    name: str
    color: Optional[str] = None
    sort_order: int = 0


class HabitCategoryResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    color: Optional[str] = None
    sort_order: int

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Habit schemas
# ---------------------------------------------------------------------------

class HabitCreate(BaseModel):
    name: str
    icon: str
    type: str  # boolean | numeric | text
    color: Optional[str] = None
    frequency_type: str = "daily"
    frequency_value: Optional[int] = None
    target_value: Optional[float] = None
    target_unit: Optional[str] = None
    streak_mode: str = "soft"
    reminder_time: Optional[time] = None
    timezone: Optional[str] = None
    category_id: Optional[UUID] = None
    sort_order: int = 0


class HabitUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    frequency_type: Optional[str] = None
    frequency_value: Optional[int] = None
    target_value: Optional[float] = None
    target_unit: Optional[str] = None
    streak_mode: Optional[str] = None
    reminder_time: Optional[time] = None
    timezone: Optional[str] = None
    category_id: Optional[UUID] = None
    is_archived: Optional[bool] = None
    sort_order: Optional[int] = None


class HabitResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    icon: str
    type: str
    color: Optional[str] = None
    frequency_type: str
    frequency_value: Optional[int] = None
    target_value: Optional[float] = None
    target_unit: Optional[str] = None
    streak_mode: str
    reminder_time: Optional[time] = None
    timezone: Optional[str] = None
    category_id: Optional[UUID] = None
    is_archived: bool
    sort_order: int
    best_streak: int
    current_streak: int = 0
    category_name: Optional[str] = None
    today_entry: Optional["HabitEntryResponse"] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Entry schemas
# ---------------------------------------------------------------------------

class HabitEntryCreate(BaseModel):
    logged_at: date
    boolean_value: Optional[bool] = None
    numeric_value: Optional[float] = None
    numeric_unit: Optional[str] = None
    text_value: Optional[str] = None


class HabitEntryResponse(BaseModel):
    id: UUID
    habit_id: UUID
    user_id: UUID
    logged_at: date
    boolean_value: Optional[bool] = None
    numeric_value: Optional[float] = None
    numeric_unit: Optional[str] = None
    text_value: Optional[str] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Streak schemas
# ---------------------------------------------------------------------------

class StreakResponse(BaseModel):
    current_streak: int
    best_streak: int
    last_period_completed: bool


# ---------------------------------------------------------------------------
# Settings schemas
# ---------------------------------------------------------------------------

class UserHabitSettingsUpdate(BaseModel):
    push_subscription: Optional[dict] = None
    notifications_enabled: Optional[bool] = None


class UserHabitSettingsResponse(BaseModel):
    id: UUID
    user_id: UUID
    push_subscription: Optional[dict] = None
    notifications_enabled: bool

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# VAPID schema
# ---------------------------------------------------------------------------

class VapidPublicKeyResponse(BaseModel):
    public_key: str


# ---------------------------------------------------------------------------
# Streak freeze schema
# ---------------------------------------------------------------------------

class HabitStreakFreezeResponse(BaseModel):
    id: UUID
    habit_id: UUID
    user_id: UUID
    freeze_date: date

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Preset schema
# ---------------------------------------------------------------------------

class PresetHabitResponse(BaseModel):
    id: UUID
    name: str
    icon: str
    type: str
    category_key: str
    color: Optional[str] = None
    default_frequency_type: str
    default_target_value: Optional[float] = None
    default_target_unit: Optional[str] = None
    sort_order: int

    model_config = {"from_attributes": True}
