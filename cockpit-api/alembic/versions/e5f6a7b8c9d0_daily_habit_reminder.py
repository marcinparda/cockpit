"""Move habit reminder to per-user daily reminder in settings

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-11-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('user_habit_settings', sa.Column('reminder_time', sa.Time(), nullable=True))
    op.add_column('user_habit_settings', sa.Column('timezone', sa.String(length=64), nullable=True))
    op.add_column('user_habit_settings', sa.Column('last_reminder_sent_on', sa.Date(), nullable=True))
    op.drop_column('habits', 'reminder_time')
    op.drop_column('habits', 'timezone')


def downgrade() -> None:
    op.add_column('habits', sa.Column('timezone', sa.String(length=50), nullable=True))
    op.add_column('habits', sa.Column('reminder_time', sa.Time(), nullable=True))
    op.drop_column('user_habit_settings', 'last_reminder_sent_on')
    op.drop_column('user_habit_settings', 'timezone')
    op.drop_column('user_habit_settings', 'reminder_time')
