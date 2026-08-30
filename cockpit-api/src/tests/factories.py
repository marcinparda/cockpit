"""Mock-data factory functions for tests.

Each `make_*` function builds a FRESH object on every call (no shared mutable
module-level defaults). Overrides are applied last so they always win, e.g.:

    user = make_user(email="x@y.com")
"""
import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock

from src.services.redis_store.schemas import StoreEnvelope, StoreMeta


def make_role(**overrides) -> MagicMock:
    """Build a fresh mock Role."""
    defaults = {
        "id": uuid.uuid4(),
        "name": "User",
        "description": "Standard user role",
    }
    defaults.update(overrides)

    role = MagicMock()
    for key, value in defaults.items():
        setattr(role, key, value)
    return role


def make_admin_role(**overrides) -> MagicMock:
    """Build a fresh mock Admin role."""
    defaults = {
        "id": uuid.uuid4(),
        "name": "Admin",
        "description": "Administrator role",
    }
    defaults.update(overrides)
    return make_role(**defaults)


def make_user(**overrides) -> MagicMock:
    """Build a fresh mock User (non-admin by default)."""
    role = overrides.pop("role", None) or make_role()

    created_at = MagicMock()
    created_at.isoformat.return_value = "2024-01-01T00:00:00"

    defaults = {
        "id": uuid.uuid4(),
        "email": f"user-{uuid.uuid4().hex[:8]}@example.com",
        "is_active": True,
        "password_hash": "$2b$04$testhashedpasswordvalue1234567890",
        "role_id": role.id,
        "role": role,
        "password_changed": False,
        "created_at": created_at,
    }
    defaults.update(overrides)

    user = MagicMock()
    for key, value in defaults.items():
        setattr(user, key, value)
    return user


def make_admin_user(**overrides) -> MagicMock:
    """Build a fresh mock admin User."""
    role = overrides.pop("role", None) or make_admin_role()

    defaults = {
        "email": f"admin-{uuid.uuid4().hex[:8]}@example.com",
        "password_hash": "$2b$04$adminhashedpasswordvalue123456789",
        "role": role,
        "role_id": role.id,
    }
    defaults.update(overrides)
    return make_user(**defaults)


def make_habit(**overrides) -> MagicMock:
    """Build a fresh mock Habit."""
    defaults = {
        "id": uuid.uuid4(),
        "user_id": uuid.uuid4(),
        "type": "boolean",
        "best_streak": 0,
        "streak_mode": "soft",
        "frequency_type": "daily",
        "frequency_value": None,
    }
    defaults.update(overrides)

    habit = MagicMock()
    for key, value in defaults.items():
        setattr(habit, key, value)
    return habit


def make_habit_entry(**overrides) -> MagicMock:
    """Build a fresh mock HabitEntry."""
    defaults = {
        "id": uuid.uuid4(),
        "habit_id": uuid.uuid4(),
        "user_id": uuid.uuid4(),
        "logged_at": None,
        "boolean_value": None,
        "numeric_value": None,
        "text_value": None,
    }
    defaults.update(overrides)

    entry = MagicMock()
    for key, value in defaults.items():
        setattr(entry, key, value)
    return entry


def make_store_envelope(
    key: str = "p:c:k",
    data: dict | None = None,
    version: int = 1,
    **meta_overrides,
) -> StoreEnvelope:
    """Build a fresh StoreEnvelope for the redis_store service/router tests.

    Extra kwargs (e.g. `type`, `tags`) override StoreMeta fields.
    """
    if data is None:
        data = {"x": 1}
    now = datetime.now(timezone.utc)

    meta_defaults = {
        "key": key,
        "type": "json",
        "version": version,
        "created_at": now,
        "updated_at": now,
        "tags": [],
    }
    meta_defaults.update(meta_overrides)

    return StoreEnvelope(meta=StoreMeta(**meta_defaults), data=data)
