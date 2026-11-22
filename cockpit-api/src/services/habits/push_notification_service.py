"""Daily habit reminder via Web Push.

Each user may configure one daily reminder (time of day + IANA timezone) in
their habit settings. A scheduler job calls ``send_due_push_notifications``
every minute; a user is notified at most once per local day, and only when a
due Habit is still not completed today.
"""

import asyncio
import json
import logging
from datetime import date, datetime, timedelta, timezone
from typing import Optional
from uuid import UUID
from zoneinfo import ZoneInfo

from pywebpush import WebPushException, webpush
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.services.habits.models import Habit, HabitEntry, UserHabitSettings
from src.services.habits.repository import COMPLETED_ENTRY

logger = logging.getLogger(__name__)

# The scheduler ticks every minute; tolerate a late tick up to this long.
SEND_WINDOW = timedelta(minutes=5)
GONE_STATUS_CODES = {404, 410}
PAYLOAD = {"title": "Habit reminder", "body": "Time to log your habits"}


def _resolve_tz(name: Optional[str]) -> ZoneInfo:
    try:
        return ZoneInfo(name or "UTC")
    except Exception:
        logger.warning("Invalid timezone %r — falling back to UTC", name)
        return ZoneInfo("UTC")


def _is_reminder_time(local_now: datetime, user_settings: UserHabitSettings) -> bool:
    """True when local_now is within SEND_WINDOW after the configured time."""
    target = datetime.combine(
        local_now.date(), user_settings.reminder_time, tzinfo=local_now.tzinfo
    )
    return timedelta(0) <= local_now - target < SEND_WINDOW


async def _has_unlogged_due_habit(
    db: AsyncSession, user_id: UUID, today: date
) -> Optional[bool]:
    """True if some due Habit has no completed Entry today; None if none are due.

    Due today = every non-archived Habit, matching the Today page and stats.
    """
    habit_ids = (
        await db.execute(
            select(Habit.id).where(
                and_(Habit.user_id == user_id, Habit.is_archived == False)  # noqa: E712
            )
        )
    ).scalars().all()
    if not habit_ids:
        return None
    done_ids = set(
        (
            await db.execute(
                select(HabitEntry.habit_id).where(
                    and_(
                        HabitEntry.user_id == user_id,
                        HabitEntry.logged_at == today,
                        COMPLETED_ENTRY,
                    )
                )
            )
        ).scalars().all()
    )
    return any(hid not in done_ids for hid in habit_ids)


async def _send(db: AsyncSession, user_settings: UserHabitSettings, local_date: date) -> None:
    user_id = user_settings.user_id
    try:
        # webpush is synchronous (requests) — keep it off the event loop.
        await asyncio.to_thread(
            webpush,
            subscription_info=user_settings.push_subscription,
            data=json.dumps(PAYLOAD),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": settings.VAPID_CONTACT},
        )
    except WebPushException as exc:
        status = getattr(exc.response, "status_code", None)
        body = getattr(exc.response, "text", None)
        if status in GONE_STATUS_CODES:
            logger.warning(
                "Push subscription gone (HTTP %s) for user %s — clearing", status, user_id
            )
            user_settings.push_subscription = None
            user_settings.notifications_enabled = False
            await db.commit()
        else:
            logger.error(
                "Push failed for user %s: status=%s body=%s error=%s",
                user_id, status, body, exc,
            )
        return
    except Exception:
        logger.error("Push failed for user %s", user_id, exc_info=True)
        return

    user_settings.last_reminder_sent_on = local_date
    await db.commit()
    logger.info("Daily habit reminder sent to user %s", user_id)


async def send_due_push_notifications(
    db: AsyncSession, now: Optional[datetime] = None
) -> None:
    """Send the daily reminder to every user whose reminder time has come."""
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        logger.debug("VAPID keys not configured — skipping reminders")
        return

    now_utc = now or datetime.now(tz=timezone.utc)
    rows = (
        await db.execute(
            select(UserHabitSettings).where(UserHabitSettings.reminder_time.isnot(None))
        )
    ).scalars().all()
    logger.debug("Reminder check: %d user(s) with a reminder configured", len(rows))

    for user_settings in rows:
        user_id = user_settings.user_id
        try:
            local_now = now_utc.astimezone(_resolve_tz(user_settings.timezone))
            local_date = local_now.date()

            if not user_settings.notifications_enabled:
                logger.debug("Reminder skipped for user %s: notifications disabled", user_id)
            elif not user_settings.push_subscription:
                logger.debug("Reminder skipped for user %s: no subscription", user_id)
            elif not _is_reminder_time(local_now, user_settings):
                logger.debug("Reminder skipped for user %s: not due yet", user_id)
            elif user_settings.last_reminder_sent_on == local_date:
                logger.debug("Reminder skipped for user %s: already sent today", user_id)
            else:
                unlogged = await _has_unlogged_due_habit(db, user_id, local_date)
                if unlogged is None:
                    logger.info("Reminder skipped for user %s: no due habits", user_id)
                elif not unlogged:
                    logger.info("Reminder skipped for user %s: all habits logged", user_id)
                else:
                    await _send(db, user_settings, local_date)
        except Exception:
            logger.error("Reminder failed for user %s", user_id, exc_info=True)
