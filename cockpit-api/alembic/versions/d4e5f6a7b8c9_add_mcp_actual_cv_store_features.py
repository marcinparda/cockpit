"""Add mcp, actual, cv, store features; drop stale utils feature

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b9
Create Date: 2026-11-19 00:00:00.000000

"""
from typing import Sequence, Union
from datetime import datetime
from uuid import uuid4

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

NEW_FEATURES = ['mcp', 'actual', 'cv', 'store']
STALE_FEATURES = ['utils']
ACTIONS = ['create', 'read', 'update', 'delete']


def _seed_feature(connection: sa.engine.Connection, feature_name: str, now: datetime) -> str:
    existing = connection.execute(
        sa.text("SELECT id FROM features WHERE name = :name"), {"name": feature_name}
    ).fetchone()
    if existing:
        return str(existing[0])

    feature_id = str(uuid4())
    connection.execute(
        sa.text("INSERT INTO features (id, name, created_at, updated_at) VALUES (:id, :name, :ca, :ua)"),
        {"id": feature_id, "name": feature_name, "ca": now, "ua": now},
    )
    return feature_id


def _seed_permissions(connection: sa.engine.Connection, feature_id: str, now: datetime) -> list[str]:
    perm_ids = []
    for action_name in ACTIONS:
        action_row = connection.execute(
            sa.text("SELECT id FROM actions WHERE name = :name"), {"name": action_name}
        ).fetchone()
        if action_row is None:
            continue
        action_id = action_row[0]
        existing = connection.execute(
            sa.text("SELECT id FROM permissions WHERE feature_id = :fid AND action_id = :aid"),
            {"fid": feature_id, "aid": action_id},
        ).fetchone()
        if existing:
            perm_ids.append(str(existing[0]))
            continue
        perm_id = str(uuid4())
        connection.execute(
            sa.text("INSERT INTO permissions (id, feature_id, action_id, created_at, updated_at) VALUES (:id, :fid, :aid, :ca, :ua)"),
            {"id": perm_id, "fid": feature_id, "aid": action_id, "ca": now, "ua": now},
        )
        perm_ids.append(perm_id)
    return perm_ids


def _assign_to_admins(connection: sa.engine.Connection, perm_ids: list[str], now: datetime) -> None:
    admin_users = connection.execute(
        sa.text("SELECT u.id FROM users u JOIN user_roles ur ON u.role_id = ur.id WHERE ur.name = 'Admin'")
    ).fetchall()
    for user_row in admin_users:
        uid = user_row[0]
        for pid in perm_ids:
            already = connection.execute(
                sa.text("SELECT id FROM user_permissions WHERE user_id = :uid AND permission_id = :pid"),
                {"uid": uid, "pid": pid},
            ).fetchone()
            if already:
                continue
            connection.execute(
                sa.text("INSERT INTO user_permissions (id, user_id, permission_id, created_at, updated_at) VALUES (:id, :uid, :pid, :ca, :ua)"),
                {"id": str(uuid4()), "uid": uid, "pid": pid, "ca": now, "ua": now},
            )


def _remove_feature(connection: sa.engine.Connection, feature_name: str) -> None:
    feature_row = connection.execute(
        sa.text("SELECT id FROM features WHERE name = :name"), {"name": feature_name}
    ).fetchone()
    if feature_row is None:
        return

    feature_id = feature_row[0]
    perm_ids = [r[0] for r in connection.execute(
        sa.text("SELECT id FROM permissions WHERE feature_id = :fid"), {"fid": feature_id}
    ).fetchall()]

    for pid in perm_ids:
        connection.execute(sa.text("DELETE FROM user_permissions WHERE permission_id = :pid"), {"pid": pid})

    connection.execute(sa.text("DELETE FROM permissions WHERE feature_id = :fid"), {"fid": feature_id})
    connection.execute(sa.text("DELETE FROM features WHERE id = :fid"), {"fid": feature_id})


def upgrade() -> None:
    """Insert mcp/actual/cv/store features with 4 permissions each, assign to admins; drop utils."""
    connection = op.get_bind()
    now = datetime.now()
    for name in NEW_FEATURES:
        feature_id = _seed_feature(connection, name, now)
        perm_ids = _seed_permissions(connection, feature_id, now)
        _assign_to_admins(connection, perm_ids, now)
    for name in STALE_FEATURES:
        _remove_feature(connection, name)


def downgrade() -> None:
    """Remove the new features. The stale utils feature is intentionally not restored."""
    connection = op.get_bind()
    for name in NEW_FEATURES:
        _remove_feature(connection, name)
