"""Unit tests for streak_service.py — pure function streak calculation."""
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Optional

import pytest


@dataclass
class HabitStub:
  """Minimal habit-like object for testing streak logic."""
  streak_mode: str
  frequency_type: str
  frequency_value: Optional[int] = None
  best_streak: int = 0


class TestSoftStreakMode:
  def test_soft_one_missed_day_does_not_break_streak(self):
    """Soft mode: a single missed day should not break the streak (grace period)."""
    from src.services.habits.streak_service import calculate_streak

    habit = HabitStub(streak_mode="soft", frequency_type="daily")
    today = date(2026, 5, 21)
    # Completed 3 days ago, skipped yesterday, no completion today
    logged_dates = [today - timedelta(days=2)]
    result = calculate_streak(habit, logged_dates, [], today=today)
    assert result.current_streak >= 1

  def test_soft_two_consecutive_missed_days_break_streak(self):
    """Soft mode: two consecutive missed days should break the streak."""
    from src.services.habits.streak_service import calculate_streak

    habit = HabitStub(streak_mode="soft", frequency_type="daily")
    today = date(2026, 5, 21)
    # Completed 5 days ago, then two consecutive missed days before yesterday
    logged_dates = [today - timedelta(days=4)]
    result = calculate_streak(habit, logged_dates, [], today=today)
    assert result.current_streak == 0


class TestHardStreakMode:
  def test_hard_one_missed_day_breaks_streak(self):
    """Hard mode: a single missed day should immediately break the streak."""
    from src.services.habits.streak_service import calculate_streak

    habit = HabitStub(streak_mode="hard", frequency_type="daily")
    today = date(2026, 5, 21)
    # Completed 3 days ago but missed yesterday
    logged_dates = [today - timedelta(days=2)]
    result = calculate_streak(habit, logged_dates, [], today=today)
    assert result.current_streak == 0


class TestNoneStreakMode:
  def test_none_mode_always_returns_zero_current_streak(self):
    """None mode should always return current_streak=0 regardless of completions."""
    from src.services.habits.streak_service import calculate_streak

    habit = HabitStub(streak_mode="none", frequency_type="daily")
    today = date(2026, 5, 21)
    # Complete every day for 10 days — streak should still be 0
    logged_dates = [today - timedelta(days=i) for i in range(10)]
    result = calculate_streak(habit, logged_dates, [], today=today)
    assert result.current_streak == 0
    assert result.last_period_completed is False


class TestFreezeDates:
  def test_freeze_date_does_not_break_soft_streak(self):
    """A freeze date counts as neither completion nor miss; grace state is preserved."""
    from src.services.habits.streak_service import calculate_streak

    habit = HabitStub(streak_mode="soft", frequency_type="daily")
    today = date(2026, 5, 21)
    # Completed 2 days ago, yesterday was frozen — streak should survive
    logged_dates = [today - timedelta(days=2)]
    freeze_dates = [today - timedelta(days=1)]
    result = calculate_streak(habit, logged_dates, freeze_dates, today=today)
    assert result.current_streak >= 1

  def test_weekly_freeze_covers_entire_iso_week(self):
    """A freeze date in a weekly habit covers the entire ISO week it falls in."""
    from src.services.habits.streak_service import calculate_streak

    habit = HabitStub(streak_mode="soft", frequency_type="weekly")
    # Use a Monday so the freeze week is unambiguous
    # Week of 2026-05-11 (Mon) to 2026-05-17 (Sun)
    week_monday = date(2026, 5, 11)
    # Freeze on Wednesday of that week
    freeze_date = date(2026, 5, 13)
    today = date(2026, 5, 21)
    # Complete the week before; this past week is frozen — streak must survive
    logged_dates = [date(2026, 5, 4)]  # completed the prior week
    result = calculate_streak(habit, logged_dates, [freeze_date], today=today)
    assert result.current_streak >= 1


class TestBestStreak:
  def test_best_streak_returns_max_of_running_and_stored(self):
    """best_streak is max(running current streak, habit.best_streak)."""
    from src.services.habits.streak_service import calculate_streak

    habit = HabitStub(streak_mode="hard", frequency_type="daily", best_streak=10)
    today = date(2026, 5, 21)
    # Only 2 consecutive completions — running streak < stored best
    logged_dates = [today - timedelta(days=i) for i in range(2)]
    result = calculate_streak(habit, logged_dates, [], today=today)
    assert result.best_streak == 10


class TestCustomIntervalFrequency:
  def test_custom_interval_frequency_counted_per_interval(self):
    """Custom interval: one completion every frequency_value days counts as not missed."""
    from src.services.habits.streak_service import calculate_streak

    habit = HabitStub(streak_mode="hard", frequency_type="custom_interval", frequency_value=3)
    today = date(2026, 5, 21)
    # Complete every 3 days: today-0, today-3, today-6
    logged_dates = [today - timedelta(days=i * 3) for i in range(4)]
    result = calculate_streak(habit, logged_dates, [], today=today)
    assert result.current_streak >= 3


class TestCustomDaysPerWeekFrequency:
  def test_custom_days_per_week_meets_requirement(self):
    """custom_days_per_week: completing required days within ISO week counts as done."""
    from src.services.habits.streak_service import calculate_streak

    # Require 3 days per week; provide 3 completions in the same ISO week
    habit = HabitStub(streak_mode="hard", frequency_type="custom_days_per_week", frequency_value=3)
    # Use a known Monday so the ISO week is predictable
    monday = date(2026, 5, 18)  # Monday
    logged_dates = [monday, monday + timedelta(days=1), monday + timedelta(days=2)]
    today = monday + timedelta(days=4)  # Friday same week
    result = calculate_streak(habit, logged_dates, [], today=today)
    assert result.current_streak >= 1

  def test_custom_days_per_week_below_requirement_breaks_streak(self):
    """custom_days_per_week: fewer completions than required breaks the streak."""
    from src.services.habits.streak_service import calculate_streak

    habit = HabitStub(streak_mode="hard", frequency_type="custom_days_per_week", frequency_value=3)
    monday = date(2026, 5, 18)
    # Only 1 completion this week — below requirement of 3
    logged_dates = [monday]
    today = monday + timedelta(days=7)  # Next Monday (week is over)
    result = calculate_streak(habit, logged_dates, [], today=today)
    assert result.current_streak == 0


class TestUnknownFrequencyType:
  def test_unknown_frequency_type_returns_zero_streak(self):
    """Unknown frequency_type: _is_period_completed returns False → no streak."""
    from src.services.habits.streak_service import calculate_streak

    habit = HabitStub(streak_mode="hard", frequency_type="unknown_type")
    today = date(2026, 5, 21)
    logged_dates = [today]
    result = calculate_streak(habit, logged_dates, [], today=today)
    assert result.current_streak == 0
