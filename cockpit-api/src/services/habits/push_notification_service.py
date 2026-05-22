"""Push notification service for habit reminders.

Queries habits whose reminder_time matches the current minute in the habit's
timezone and sends a Web Push notification via pywebpush.
"""

import json
import logging
from datetime import datetime, timezone

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.database import async_session_maker
from src.services.habits.models import Habit, UserHabitSettings

logger = logging.getLogger(__name__)


async def send_due_push_notifications(db: AsyncSession) -> None:
    """Send push notifications for habits whose reminder_time matches now.

    Queries habits with reminder_time set, converts now to each habit's
    timezone, and sends a push if the current HH:MM matches reminder_time.
    Silently skips if VAPID keys are not configured.
    """
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        logger.debug("VAPID keys not configured — skipping push notifications")
        return

    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        logger.warning("pywebpush not installed — skipping push notifications")
        return

    now_utc = datetime.now(tz=timezone.utc)

    # Fetch habits that have a reminder_time configured
    result = await db.execute(
        select(Habit).where(
            and_(
                Habit.reminder_time.isnot(None),
                Habit.is_archived == False,  # noqa: E712
            )
        )
    )
    habits = result.scalars().all()

    for habit in habits:
        try:
            tz_name = habit.timezone or "UTC"
            import zoneinfo

            try:
                tz = zoneinfo.ZoneInfo(tz_name)
            except Exception:
                tz = timezone.utc

            local_now = now_utc.astimezone(tz)
            if (
                local_now.hour != habit.reminder_time.hour
                or local_now.minute != habit.reminder_time.minute
            ):
                continue

            # Fetch user settings for push subscription
            settings_result = await db.execute(
                select(UserHabitSettings).where(
                    and_(
                        UserHabitSettings.user_id == habit.user_id,
                        UserHabitSettings.notifications_enabled == True,  # noqa: E712
                        UserHabitSettings.push_subscription.isnot(None),
                    )
                )
            )
            user_settings = settings_result.scalars().first()
            if not user_settings or not user_settings.push_subscription:
                continue

            subscription_info = user_settings.push_subscription
            payload = json.dumps(
                {
                    "title": "Habit reminder",
                    "body": f"Time to complete: {habit.name}",
                }
            )

            webpush(
                subscription_info=subscription_info,
                data=payload,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": "mailto:admin@cockpit"},
            )
            logger.info(
                "Push notification sent for habit %s (user %s)",
                habit.id,
                habit.user_id,
            )
        except Exception as exc:
            logger.error(
                "Failed to send push for habit %s: %s",
                habit.id,
                exc,
                exc_info=True,
            )
