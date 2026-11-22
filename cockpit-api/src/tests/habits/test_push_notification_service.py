"""Tests for the daily habit reminder job."""
import uuid
from datetime import date, datetime, time, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pywebpush import WebPushException

from src.services.habits import push_notification_service as svc

MODULE = "src.services.habits.push_notification_service"


def _scalars_result(values):
    result = MagicMock()
    result.scalars.return_value.all.return_value = values
    return result


def _settings(**overrides) -> MagicMock:
    defaults = {
        "user_id": uuid.uuid4(),
        "notifications_enabled": True,
        "push_subscription": {"endpoint": "https://push.example/abc", "keys": {}},
        "reminder_time": time(9, 0),
        "timezone": "UTC",
        "last_reminder_sent_on": None,
    }
    defaults.update(overrides)
    s = MagicMock()
    for k, v in defaults.items():
        setattr(s, k, v)
    return s


@pytest.fixture(autouse=True)
def vapid_config():
    with patch(f"{MODULE}.settings") as cfg:
        cfg.VAPID_PRIVATE_KEY = "priv"
        cfg.VAPID_PUBLIC_KEY = "pub"
        cfg.VAPID_CONTACT = "mailto:admin@parda.me"
        yield cfg


@pytest.fixture
def run(mock_db):
    """Run the job with the given settings rows and unlogged-habit outcome."""

    async def _run(rows, now, unlogged=True, webpush_mock=None):
        mock_db.execute = AsyncMock(return_value=_scalars_result(rows))
        wp = webpush_mock or MagicMock()
        with patch(f"{MODULE}.webpush", wp), patch(
            f"{MODULE}._has_unlogged_due_habit", AsyncMock(return_value=unlogged)
        ):
            await svc.send_due_push_notifications(mock_db, now=now)
        return wp

    return _run


UTC_9 = datetime(2026, 11, 22, 9, 0, tzinfo=timezone.utc)


class TestSend:
    async def test_sends_at_reminder_time_and_records_date(self, run):
        s = _settings()
        wp = await run([s], UTC_9)
        wp.assert_called_once()
        assert wp.call_args.kwargs["vapid_claims"] == {"sub": "mailto:admin@parda.me"}
        assert s.last_reminder_sent_on == date(2026, 11, 22)

    async def test_non_utc_timezone(self, run):
        s = _settings(timezone="Europe/Warsaw")  # UTC+1 in November
        wp = await run([s], datetime(2026, 11, 22, 8, 0, tzinfo=timezone.utc))
        wp.assert_called_once()
        assert s.last_reminder_sent_on == date(2026, 11, 22)

    async def test_not_sent_at_utc_time_for_non_utc_user(self, run):
        wp = await run([_settings(timezone="Europe/Warsaw")], UTC_9)
        wp.assert_not_called()

    async def test_late_tick_within_window_still_sends(self, run):
        wp = await run([_settings()], datetime(2026, 11, 22, 9, 3, tzinfo=timezone.utc))
        wp.assert_called_once()

    async def test_before_and_long_after_window_skipped(self, run):
        for minute_now in (datetime(2026, 11, 22, 8, 59, tzinfo=timezone.utc),
                           datetime(2026, 11, 22, 9, 10, tzinfo=timezone.utc)):
            wp = await run([_settings()], minute_now)
            wp.assert_not_called()

    async def test_once_per_local_day(self, run):
        s = _settings()
        wp = await run([s], UTC_9)
        wp = await run([s], datetime(2026, 11, 22, 9, 1, tzinfo=timezone.utc), webpush_mock=wp)
        assert wp.call_count == 1


class TestSkips:
    async def test_notifications_disabled(self, run):
        wp = await run([_settings(notifications_enabled=False)], UTC_9)
        wp.assert_not_called()

    async def test_no_subscription(self, run):
        wp = await run([_settings(push_subscription=None)], UTC_9)
        wp.assert_not_called()

    async def test_all_habits_logged(self, run):
        wp = await run([_settings()], UTC_9, unlogged=False)
        wp.assert_not_called()

    async def test_no_due_habits(self, run):
        wp = await run([_settings()], UTC_9, unlogged=None)
        wp.assert_not_called()

    async def test_no_vapid_keys(self, run, vapid_config):
        vapid_config.VAPID_PRIVATE_KEY = ""
        wp = await run([_settings()], UTC_9)
        wp.assert_not_called()


class TestFailures:
    @pytest.mark.parametrize("status", [404, 410])
    async def test_gone_subscription_cleared(self, run, status):
        s = _settings()
        resp = MagicMock(status_code=status, text="gone")
        wp = MagicMock(side_effect=WebPushException("gone", response=resp))
        await run([s], UTC_9, webpush_mock=wp)
        assert s.push_subscription is None
        assert s.notifications_enabled is False
        assert s.last_reminder_sent_on is None

    async def test_other_error_logged_and_keeps_subscription(self, run, caplog):
        s = _settings()
        resp = MagicMock(status_code=500, text="boom")
        wp = MagicMock(side_effect=WebPushException("fail", response=resp))
        with caplog.at_level("ERROR"):
            await run([s], UTC_9, webpush_mock=wp)
        assert s.push_subscription is not None
        assert s.notifications_enabled is True
        assert s.last_reminder_sent_on is None
        assert "status=500" in caplog.text and "body=boom" in caplog.text

    async def test_one_user_failure_does_not_stop_others(self, run):
        bad, good = _settings(), _settings()
        wp = MagicMock(side_effect=[RuntimeError("x"), None])
        await run([bad, good], UTC_9, webpush_mock=wp)
        assert good.last_reminder_sent_on == date(2026, 11, 22)


class TestUnloggedDueHabit:
    async def test_none_when_no_habits(self, mock_db):
        mock_db.execute = AsyncMock(return_value=_scalars_result([]))
        assert await svc._has_unlogged_due_habit(mock_db, uuid.uuid4(), date.today()) is None

    async def test_false_when_all_done(self, mock_db):
        a, b = uuid.uuid4(), uuid.uuid4()
        mock_db.execute = AsyncMock(
            side_effect=[_scalars_result([a, b]), _scalars_result([a, b])]
        )
        assert await svc._has_unlogged_due_habit(mock_db, uuid.uuid4(), date.today()) is False

    async def test_true_when_one_missing(self, mock_db):
        a, b = uuid.uuid4(), uuid.uuid4()
        mock_db.execute = AsyncMock(
            side_effect=[_scalars_result([a, b]), _scalars_result([a])]
        )
        assert await svc._has_unlogged_due_habit(mock_db, uuid.uuid4(), date.today()) is True


class TestSettingsSchema:
    def test_valid_timezone_and_time(self):
        from src.services.habits.schemas import UserHabitSettingsUpdate

        u = UserHabitSettingsUpdate(reminder_time="08:30", timezone="Europe/Warsaw")
        assert u.reminder_time == time(8, 30)

    def test_invalid_timezone_rejected(self):
        from pydantic import ValidationError
        from src.services.habits.schemas import UserHabitSettingsUpdate

        with pytest.raises(ValidationError):
            UserHabitSettingsUpdate(timezone="Mars/Olympus")

    def test_explicit_null_clears_reminder(self):
        from src.services.habits.schemas import UserHabitSettingsUpdate

        u = UserHabitSettingsUpdate(reminder_time=None)
        assert u.model_dump(exclude_unset=True) == {"reminder_time": None}
