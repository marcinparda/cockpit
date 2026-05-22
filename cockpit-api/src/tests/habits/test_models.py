"""Unit tests for habit ORM model structure."""
import uuid
from sqlalchemy import UniqueConstraint, Index
from sqlalchemy.orm import class_mapper

import pytest


class TestHabitModel:
    def test_habit_instantiation_with_required_fields(self):
        """Habit model can be instantiated with all required fields."""
        from src.services.habits.models import Habit

        habit = Habit(
            user_id=uuid.uuid4(),
            name="Drink Water",
            icon="droplets",
            type="boolean",
        )

        assert habit.name == "Drink Water"
        assert habit.icon == "droplets"
        assert habit.type == "boolean"
        assert habit.is_archived is False
        assert habit.sort_order == 0
        assert habit.best_streak == 0

    def test_habit_entry_unique_constraint_habit_id_logged_at(self):
        """HabitEntry model defines UNIQUE(habit_id, logged_at) constraint."""
        from src.services.habits.models import HabitEntry

        table = HabitEntry.__table__
        unique_constraints = [
            c for c in table.constraints
            if isinstance(c, UniqueConstraint)
        ]
        constrained_cols = {
            frozenset(col.name for col in uc.columns)
            for uc in unique_constraints
        }
        assert frozenset({"habit_id", "logged_at"}) in constrained_cols, (
            "HabitEntry must have UNIQUE(habit_id, logged_at) constraint"
        )

    def test_habit_category_unique_constraint_user_id_name(self):
        """HabitCategory model defines UNIQUE(user_id, name) constraint."""
        from src.services.habits.models import HabitCategory

        table = HabitCategory.__table__
        unique_constraints = [
            c for c in table.constraints
            if isinstance(c, UniqueConstraint)
        ]
        constrained_cols = {
            frozenset(col.name for col in uc.columns)
            for uc in unique_constraints
        }
        assert frozenset({"user_id", "name"}) in constrained_cols, (
            "HabitCategory must have UNIQUE(user_id, name) constraint"
        )

    def test_user_habit_settings_unique_user_id(self):
        """UserHabitSettings model defines UNIQUE(user_id) constraint."""
        from src.services.habits.models import UserHabitSettings

        table = UserHabitSettings.__table__
        # Check either via unique constraint or unique column attribute
        col = table.c.get("user_id")
        assert col is not None, "UserHabitSettings must have user_id column"

        has_unique_constraint = any(
            isinstance(c, UniqueConstraint) and
            len(c.columns) == 1 and
            list(c.columns)[0].name == "user_id"
            for c in table.constraints
        )
        has_unique_column = col.unique is True
        assert has_unique_constraint or has_unique_column, (
            "UserHabitSettings must have UNIQUE constraint on user_id"
        )
