"""remove_actual_budget_feature

Revision ID: c1d2e3f4a5b6
Revises: b2c3d4e5f6a7
Create Date: 2026-05-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

FEATURE_NAME = "actual_budget"


def upgrade() -> None:
    connection = op.get_bind()
    feature_row = connection.execute(
        sa.text("SELECT id FROM features WHERE name = :name"), {"name": FEATURE_NAME}
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


def downgrade() -> None:
    from datetime import datetime
    from uuid import uuid4

    connection = op.get_bind()
    now = datetime.now()
    existing = connection.execute(
        sa.text("SELECT id FROM features WHERE name = :name"), {"name": FEATURE_NAME}
    ).fetchone()
    if existing:
        return
    feature_id = str(uuid4())
    connection.execute(
        sa.text("INSERT INTO features (id, name, created_at, updated_at) VALUES (:id, :name, :ca, :ua)"),
        {"id": feature_id, "name": FEATURE_NAME, "ca": now, "ua": now},
    )
    actions = connection.execute(sa.text("SELECT id FROM actions")).fetchall()
    perm_ids = []
    for action_row in actions:
        perm_id = str(uuid4())
        connection.execute(
            sa.text("INSERT INTO permissions (id, feature_id, action_id, created_at, updated_at) VALUES (:id, :fid, :aid, :ca, :ua)"),
            {"id": perm_id, "fid": feature_id, "aid": action_row[0], "ca": now, "ua": now},
        )
        perm_ids.append(perm_id)
    admin_users = connection.execute(
        sa.text("SELECT u.id FROM users u JOIN user_roles ur ON u.role_id = ur.id WHERE ur.name = 'Admin'")
    ).fetchall()
    for user_row in admin_users:
        for pid in perm_ids:
            connection.execute(
                sa.text("INSERT INTO user_permissions (id, user_id, permission_id, created_at, updated_at) VALUES (:id, :uid, :pid, :ca, :ua)"),
                {"id": str(uuid4()), "uid": user_row[0], "pid": pid, "ca": now, "ua": now},
            )
