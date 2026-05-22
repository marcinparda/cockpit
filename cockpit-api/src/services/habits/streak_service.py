"""Pure-function streak calculation for habits.

No database access, no FastAPI imports. Accepts plain habit-like objects.
"""
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Protocol, Optional


class HabitLike(Protocol):
  """Structural type: any object with the habit streak fields."""
  streak_mode: str
  frequency_type: str
  frequency_value: Optional[int]
  best_streak: int


@dataclass
class StreakResult:
  current_streak: int
  best_streak: int
  last_period_completed: bool


def calculate_streak(
  habit: HabitLike,
  logged_dates: list[date],
  freeze_dates: list[date],
  today: date | None = None,
) -> StreakResult:
  """Calculate the current and best streak for a habit.

  Args:
    habit: Object with streak_mode, frequency_type, frequency_value, best_streak.
    logged_dates: Dates on which the habit was completed.
    freeze_dates: Dates protected by a streak freeze.
    today: Reference date (defaults to date.today()).

  Returns:
    StreakResult with current_streak, best_streak, last_period_completed.
  """
  if today is None:
    today = date.today()

  if habit.streak_mode == "none":
    return StreakResult(
      current_streak=0,
      best_streak=habit.best_streak,
      last_period_completed=False,
    )

  logged_set: set[date] = set(logged_dates)
  freeze_set: set[date] = set(freeze_dates)

  # Build required periods from far enough back to today
  # We look back enough periods to detect a full break
  lookback = _lookback_periods(habit)
  from_date = _period_start(habit, today, lookback)
  periods = _build_required_periods(habit, from_date, today)

  current_streak = 0
  used_grace = False
  last_period_completed = False

  # The most recent period (today or the current week anchor) is "in progress".
  # If the user hasn't completed it yet, do not treat it as a miss —
  # they may still complete it before the period ends.
  # Determine the current in-progress period anchor.
  current_period = _current_period_anchor(habit, today)

  for i, period in enumerate(reversed(periods)):
    # Skip the current in-progress period if incomplete — not yet a miss
    if period == current_period:
      completed_now = _is_period_completed(
        period, logged_set, habit.frequency_type, habit.frequency_value
      )
      last_period_completed = completed_now
      if completed_now:
        current_streak += 1
      # Whether completed or not, the current period is not a "miss" yet
      continue

    is_frozen = _is_period_frozen(period, freeze_set, habit.frequency_type)

    if is_frozen:
      # Frozen period: skip — does not count as completion or miss,
      # does not reset grace state
      continue

    completed = _is_period_completed(
      period, logged_set, habit.frequency_type, habit.frequency_value
    )

    if completed:
      current_streak += 1
      used_grace = False
    else:
      if habit.streak_mode == "soft" and not used_grace:
        used_grace = True
        # Grace: do not increment but do not break yet
      else:
        # Hard mode miss, or second consecutive miss in soft mode
        break

  best = max(current_streak, habit.best_streak)
  return StreakResult(
    current_streak=current_streak,
    best_streak=best,
    last_period_completed=last_period_completed,
  )


def _build_required_periods(habit: HabitLike, from_date: date, to_date: date) -> list[date]:
  """Return required period anchor dates between from_date and to_date (inclusive).

  For daily/custom_interval: one anchor per day (or every N days).
  For weekly/custom_days_per_week: one anchor per ISO week Monday.
  """
  periods: list[date] = []
  frequency_type = habit.frequency_type

  if frequency_type == "daily":
    current = from_date
    while current <= to_date:
      periods.append(current)
      current += timedelta(days=1)

  elif frequency_type in ("weekly", "custom_days_per_week"):
    # Anchor = Monday of each ISO week
    current = from_date - timedelta(days=from_date.weekday())  # Monday of from_date's week
    while current <= to_date:
      periods.append(current)
      current += timedelta(weeks=1)

  elif frequency_type == "custom_interval":
    interval = habit.frequency_value or 1
    current = from_date
    while current <= to_date:
      periods.append(current)
      current += timedelta(days=interval)

  return periods


def _is_period_completed(
  period: date,
  logged_dates: set[date],
  frequency_type: str,
  frequency_value: int | None,
) -> bool:
  """Return True if the period has sufficient completions in logged_dates."""
  if frequency_type == "daily":
    return period in logged_dates

  if frequency_type == "weekly":
    # Any completion in the ISO week counts
    week_dates = _iso_week_dates(period)
    return any(d in logged_dates for d in week_dates)

  if frequency_type == "custom_days_per_week":
    required = frequency_value or 1
    week_dates = _iso_week_dates(period)
    count = sum(1 for d in week_dates if d in logged_dates)
    return count >= required

  if frequency_type == "custom_interval":
    # Any completion within [period, period + interval - 1] counts
    interval = frequency_value or 1
    return any(period <= d < period + timedelta(days=interval) for d in logged_dates)

  return False


def _is_period_frozen(period: date, freeze_set: set[date], frequency_type: str) -> bool:
  """Return True if the period is protected by a freeze date."""
  if frequency_type in ("weekly", "custom_days_per_week"):
    week_dates = _iso_week_dates(period)
    return any(d in freeze_set for d in week_dates)
  return period in freeze_set


def _iso_week_dates(monday: date) -> list[date]:
  """Return all 7 dates of the ISO week starting on monday."""
  return [monday + timedelta(days=i) for i in range(7)]


def _lookback_periods(habit: HabitLike) -> int:
  """Determine how many periods to look back to detect a streak break."""
  # For soft mode we need at least 3 (two misses + one completed)
  # Add generous buffer so the full streak is measurable
  return 365


def _current_period_anchor(habit: HabitLike, today: date) -> date:
  """Return the anchor date for the period that contains today."""
  if habit.frequency_type in ("weekly", "custom_days_per_week"):
    return today - timedelta(days=today.weekday())  # Monday of this week
  if habit.frequency_type == "custom_interval":
    # The anchor is today itself; interval periods are built from far_back
    # We rely on _build_required_periods aligning a period to today
    # Find the most recent anchor <= today
    interval = habit.frequency_value or 1
    lookback = _lookback_periods(habit)
    from_date = today - timedelta(days=lookback * interval)
    periods = _build_required_periods(habit, from_date, today)
    return periods[-1] if periods else today
  return today


def _period_start(habit: HabitLike, today: date, lookback: int) -> date:
  """Compute the start date for period generation."""
  if habit.frequency_type in ("weekly", "custom_days_per_week"):
    return today - timedelta(weeks=lookback)
  if habit.frequency_type == "custom_interval":
    interval = habit.frequency_value or 1
    return today - timedelta(days=lookback * interval)
  return today - timedelta(days=lookback)
