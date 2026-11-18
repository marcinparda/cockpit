"""Streak behaviour when 'not done' entries are excluded from logged_dates,
and when past entries are added, changed or removed."""
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Optional

from src.services.habits.streak_service import calculate_streak

TODAY = date(2026, 5, 21)  # Thursday


@dataclass
class HabitStub:
  streak_mode: str = "hard"
  frequency_type: str = "daily"
  frequency_value: Optional[int] = None
  best_streak: int = 0


def _days_ago(*offsets: int) -> list[date]:
  return [TODAY - timedelta(days=d) for d in offsets]


class TestPastEntryChangesStreak:
  def test_backdating_completion_into_gap_revives_streak(self):
    base = _days_ago(0, 1, 3, 4)  # gap two days ago
    assert calculate_streak(HabitStub(), base, [], today=TODAY).current_streak == 2
    revived = calculate_streak(HabitStub(), base + _days_ago(2), [], today=TODAY)
    assert revived.current_streak == 5

  def test_backdating_starts_new_streak_after_total_break(self):
    assert calculate_streak(HabitStub(), [], [], today=TODAY).current_streak == 0
    result = calculate_streak(HabitStub(), _days_ago(0, 1), [], today=TODAY)
    assert result.current_streak == 2

  def test_removing_past_completion_shortens_streak(self):
    full = _days_ago(0, 1, 2, 3, 4)
    shortened = _days_ago(0, 1, 3, 4)
    assert calculate_streak(HabitStub(), full, [], today=TODAY).current_streak == 5
    assert calculate_streak(HabitStub(), shortened, [], today=TODAY).current_streak == 2

  def test_best_streak_stays_high_water_mark(self):
    result = calculate_streak(HabitStub(best_streak=5), _days_ago(0), [], today=TODAY)
    assert result.current_streak == 1
    assert result.best_streak == 5


class TestNotDoneEntries:
  def test_daily_not_done_yesterday_breaks_streak(self):
    logged = _days_ago(0, 2)  # yesterday 'not done', so absent
    assert calculate_streak(HabitStub(), logged, [], today=TODAY).current_streak == 1

  def test_daily_not_done_today_does_not_break_streak_yet(self):
    result = calculate_streak(HabitStub(), _days_ago(1, 2), [], today=TODAY)
    assert result.current_streak == 2
    assert result.last_period_completed is False

  def test_weekly_not_done_current_week_does_not_break_streak(self):
    habit = HabitStub(frequency_type="weekly")
    logged = [TODAY - timedelta(weeks=1), TODAY - timedelta(weeks=2)]
    assert calculate_streak(habit, logged, [], today=TODAY).current_streak == 2

  def test_weekly_not_done_past_week_breaks_streak(self):
    habit = HabitStub(frequency_type="weekly")
    logged = [TODAY, TODAY - timedelta(weeks=2)]
    assert calculate_streak(habit, logged, [], today=TODAY).current_streak == 1

  def test_custom_days_per_week_short_week_is_a_miss(self):
    habit = HabitStub(frequency_type="custom_days_per_week", frequency_value=3)
    last_monday = date(2026, 5, 11)
    logged = [last_monday, last_monday + timedelta(days=1)]  # third was 'not done'
    assert calculate_streak(habit, logged, [], today=TODAY).current_streak == 0

  def test_custom_days_per_week_current_week_in_progress_not_a_miss(self):
    habit = HabitStub(frequency_type="custom_days_per_week", frequency_value=2)
    last_monday = date(2026, 5, 11)
    logged = [last_monday, last_monday + timedelta(days=1)]
    assert calculate_streak(habit, logged, [], today=TODAY).current_streak == 1

  def test_custom_interval_not_done_ended_period_is_a_miss(self):
    habit = HabitStub(frequency_type="custom_interval", frequency_value=3)
    logged = _days_ago(0, 6)  # the period in between has no completion
    assert calculate_streak(habit, logged, [], today=TODAY).current_streak == 1
