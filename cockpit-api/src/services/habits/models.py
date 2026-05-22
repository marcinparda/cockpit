"""ORM models for the habits service."""

from datetime import date, time
from typing import Optional
from uuid import UUID

import sqlalchemy as sa
from sqlalchemy import (
    Boolean,
    Date,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    Time,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.common.models import BaseModel


class HabitCategory(BaseModel):
    """User-defined category for grouping habits."""

    __tablename__ = "habit_categories"
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_habit_categories_user_name"),
        Index("ix_habit_categories_user_id", "user_id"),
    )

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
        init=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    color: Mapped[Optional[str]] = mapped_column(String(7), nullable=True, default=None)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relationships
    habits: Mapped[list["Habit"]] = relationship(
        "Habit", back_populates="category", cascade="all, delete-orphan", init=False
    )


class Habit(BaseModel):
    """Core habit definition for a user."""

    __tablename__ = "habits"
    __table_args__ = (
        Index("ix_habits_user_id", "user_id"),
        Index("ix_habits_user_category", "user_id", "category_id"),
        Index("ix_habits_user_archived", "user_id", "is_archived"),
    )

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
        init=False,
    )
    # Non-default required fields first (dataclass ordering requirement)
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    icon: Mapped[str] = mapped_column(String(50), nullable=False)
    type: Mapped[str] = mapped_column(
        sa.Enum("boolean", "numeric", "text", name="habit_type", create_type=False),
        nullable=False,
    )
    # Fields with defaults follow
    color: Mapped[Optional[str]] = mapped_column(String(7), nullable=True, default=None)
    frequency_type: Mapped[str] = mapped_column(
        sa.Enum(
            "daily",
            "weekly",
            "custom_days_per_week",
            "custom_interval",
            name="frequency_type_enum",
            create_type=False,
        ),
        nullable=False,
        default="daily",
    )
    frequency_value: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
    target_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=None)
    target_unit: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, default=None)
    streak_mode: Mapped[str] = mapped_column(
        sa.Enum("none", "soft", "hard", name="streak_mode_enum", create_type=False),
        nullable=False,
        default="soft",
    )
    reminder_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True, default=None)
    timezone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default=None)
    category_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("habit_categories.id"),
        nullable=True,
        default=None,
    )
    is_archived: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    best_streak: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relationships
    category: Mapped[Optional["HabitCategory"]] = relationship(
        "HabitCategory", back_populates="habits", init=False
    )
    entries: Mapped[list["HabitEntry"]] = relationship(
        "HabitEntry", back_populates="habit", cascade="all, delete-orphan", init=False
    )
    streak_freezes: Mapped[list["HabitStreakFreeze"]] = relationship(
        "HabitStreakFreeze", back_populates="habit", cascade="all, delete-orphan", init=False
    )


class HabitEntry(BaseModel):
    """A single logged entry for a habit on a given date."""

    __tablename__ = "habit_entries"
    __table_args__ = (
        UniqueConstraint("habit_id", "logged_at", name="uq_habit_entries_habit_date"),
        Index("ix_habit_entries_habit_logged_at", "habit_id", "logged_at"),
        Index("ix_habit_entries_user_logged_at", "user_id", "logged_at"),
    )

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
        init=False,
    )
    habit_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("habits.id"),
        nullable=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    logged_at: Mapped[date] = mapped_column(Date, nullable=False)
    boolean_value: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True, default=None)
    numeric_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=None)
    numeric_unit: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, default=None)
    text_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)

    # Relationships
    habit: Mapped["Habit"] = relationship("Habit", back_populates="entries", init=False)


class HabitStreakFreeze(BaseModel):
    """A streak freeze protecting a habit's streak on a specific date."""

    __tablename__ = "habit_streak_freezes"
    __table_args__ = (
        UniqueConstraint("habit_id", "freeze_date", name="uq_habit_streak_freezes_habit_date"),
        Index("ix_habit_streak_freezes_habit_id", "habit_id"),
    )

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
        init=False,
    )
    habit_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("habits.id"),
        nullable=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    freeze_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Relationships
    habit: Mapped["Habit"] = relationship("Habit", back_populates="streak_freezes", init=False)


class UserHabitSettings(BaseModel):
    """Per-user settings for the habits feature."""

    __tablename__ = "user_habit_settings"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
        init=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        unique=True,
    )
    push_subscription: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True, default=None)
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class PresetHabit(BaseModel):
    """System-defined preset habit templates."""

    __tablename__ = "preset_habits"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
        init=False,
    )
    # Non-default required fields first (dataclass ordering requirement)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    icon: Mapped[str] = mapped_column(String(50), nullable=False)
    type: Mapped[str] = mapped_column(
        sa.Enum("boolean", "numeric", "text", name="habit_type", create_type=False),
        nullable=False,
    )
    category_key: Mapped[str] = mapped_column(String(50), nullable=False)
    # Fields with defaults follow
    color: Mapped[Optional[str]] = mapped_column(String(7), nullable=True, default=None)
    default_frequency_type: Mapped[str] = mapped_column(
        sa.Enum(
            "daily",
            "weekly",
            "custom_days_per_week",
            "custom_interval",
            name="frequency_type_enum",
            create_type=False,
        ),
        nullable=False,
        default="daily",
    )
    default_target_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=None)
    default_target_unit: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, default=None)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
