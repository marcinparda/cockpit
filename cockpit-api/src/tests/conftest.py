"""Shared test fixtures for cockpit-api."""
import uuid
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
def user_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture
def role_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture
def mock_role(role_id: uuid.UUID) -> MagicMock:
    role = MagicMock()
    role.id = role_id
    role.name = "User"
    return role


@pytest.fixture
def mock_admin_role() -> MagicMock:
    role = MagicMock()
    role.id = uuid.uuid4()
    role.name = "Admin"
    return role


@pytest.fixture
def mock_user(user_id: uuid.UUID, mock_role: MagicMock) -> MagicMock:
    user = MagicMock()
    user.id = user_id
    user.email = "test@example.com"
    user.is_active = True
    user.password_hash = "$2b$04$testhashedpasswordvalue1234567890"
    user.role_id = mock_role.id
    user.role = mock_role
    user.password_changed = False
    created_at = MagicMock()
    created_at.isoformat.return_value = "2024-01-01T00:00:00"
    user.created_at = created_at
    return user


@pytest.fixture
def mock_admin_user(mock_admin_role: MagicMock) -> MagicMock:
    user = MagicMock()
    user.id = uuid.uuid4()
    user.email = "admin@example.com"
    user.is_active = True
    user.password_hash = "$2b$04$adminhashedpasswordvalue123456789"
    user.role_id = mock_admin_role.id
    user.role = mock_admin_role
    user.password_changed = False
    return user


@pytest.fixture
def mock_db() -> AsyncMock:
    db = AsyncMock(spec=AsyncSession)
    db.refresh = AsyncMock()
    return db


@pytest.fixture
def override_get_db(mock_db: AsyncMock):
    async def _get_db() -> AsyncGenerator[AsyncSession, None]:
        yield mock_db
    return _get_db


@pytest.fixture
def override_get_current_user(mock_user: MagicMock):
    async def _get_current_user():
        return mock_user
    return _get_current_user


@pytest.fixture
def test_app(override_get_db, override_get_current_user):
    from src.main import app
    from src.core.database import get_db
    from src.services.authentication.dependencies import get_current_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    yield app

    app.dependency_overrides.clear()


@pytest.fixture
async def client(test_app) -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(
        transport=ASGITransport(app=test_app), base_url="http://test"
    ) as c:
        yield c


@pytest.fixture
def mock_redis():
    from fakeredis.aioredis import FakeRedis
    return FakeRedis()
