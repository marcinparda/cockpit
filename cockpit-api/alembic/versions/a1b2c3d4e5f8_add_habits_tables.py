"""Add habits tables and PostgreSQL ENUMs

Revision ID: a1b2c3d4e5f8
Revises: c1d2e3f4a5b6
Create Date: 2026-05-21 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f8'
down_revision: Union[str, None] = 'c1d2e3f4a5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create PostgreSQL ENUMs and all habits tables."""

    # 1. Create PostgreSQL ENUM types (idempotent via DO blocks)
    op.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE habit_type AS ENUM ('boolean', 'numeric', 'text');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """))
    op.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE frequency_type_enum AS ENUM ('daily', 'weekly', 'custom_days_per_week', 'custom_interval');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """))
    op.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE streak_mode_enum AS ENUM ('none', 'soft', 'hard');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """))

    # 2. Create tables in dependency order

    # habit_categories (no FK deps on habits)
    op.create_table(
        'habit_categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('color', sa.String(7), nullable=True),
        sa.Column('sort_order', sa.Integer, nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'name', name='uq_habit_categories_user_name'),
    )
    op.create_index('ix_habit_categories_user_id', 'habit_categories', ['user_id'])

    # habits
    op.create_table(
        'habits',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('icon', sa.String(50), nullable=False),
        sa.Column('type', postgresql.ENUM('boolean', 'numeric', 'text', name='habit_type', create_type=False), nullable=False),
        sa.Column('color', sa.String(7), nullable=True),
        sa.Column('frequency_type', postgresql.ENUM('daily', 'weekly', 'custom_days_per_week', 'custom_interval', name='frequency_type_enum', create_type=False), nullable=False, server_default='daily'),
        sa.Column('frequency_value', sa.Integer, nullable=True),
        sa.Column('target_value', sa.Float, nullable=True),
        sa.Column('target_unit', sa.String(20), nullable=True),
        sa.Column('streak_mode', postgresql.ENUM('none', 'soft', 'hard', name='streak_mode_enum', create_type=False), nullable=False, server_default='soft'),
        sa.Column('reminder_time', sa.Time, nullable=True),
        sa.Column('timezone', sa.String(50), nullable=True),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('habit_categories.id'), nullable=True),
        sa.Column('is_archived', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('sort_order', sa.Integer, nullable=False, server_default='0'),
        sa.Column('best_streak', sa.Integer, nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_habits_user_id', 'habits', ['user_id'])
    op.create_index('ix_habits_user_category', 'habits', ['user_id', 'category_id'])
    op.create_index('ix_habits_user_archived', 'habits', ['user_id', 'is_archived'])

    # habit_entries
    op.create_table(
        'habit_entries',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('habit_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('habits.id'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('logged_at', sa.Date, nullable=False),
        sa.Column('boolean_value', sa.Boolean, nullable=True),
        sa.Column('numeric_value', sa.Float, nullable=True),
        sa.Column('numeric_unit', sa.String(20), nullable=True),
        sa.Column('text_value', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('habit_id', 'logged_at', name='uq_habit_entries_habit_date'),
    )
    op.create_index('ix_habit_entries_habit_logged_at', 'habit_entries', ['habit_id', 'logged_at'])
    op.create_index('ix_habit_entries_user_logged_at', 'habit_entries', ['user_id', 'logged_at'])

    # habit_streak_freezes
    op.create_table(
        'habit_streak_freezes',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('habit_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('habits.id'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('freeze_date', sa.Date, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('habit_id', 'freeze_date', name='uq_habit_streak_freezes_habit_date'),
    )
    op.create_index('ix_habit_streak_freezes_habit_id', 'habit_streak_freezes', ['habit_id'])

    # user_habit_settings
    op.create_table(
        'user_habit_settings',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, unique=True),
        sa.Column('push_subscription', postgresql.JSONB, nullable=True),
        sa.Column('notifications_enabled', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )

    # preset_habits
    op.create_table(
        'preset_habits',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('icon', sa.String(50), nullable=False),
        sa.Column('type', postgresql.ENUM('boolean', 'numeric', 'text', name='habit_type', create_type=False), nullable=False),
        sa.Column('category_key', sa.String(50), nullable=False),
        sa.Column('color', sa.String(7), nullable=True),
        sa.Column('default_frequency_type', postgresql.ENUM('daily', 'weekly', 'custom_days_per_week', 'custom_interval', name='frequency_type_enum', create_type=False), nullable=False, server_default='daily'),
        sa.Column('default_target_value', sa.Float, nullable=True),
        sa.Column('default_target_unit', sa.String(20), nullable=True),
        sa.Column('sort_order', sa.Integer, nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    """Drop habits tables in reverse dependency order, then drop ENUMs."""

    op.drop_table('preset_habits')
    op.drop_table('user_habit_settings')
    op.drop_index('ix_habit_streak_freezes_habit_id', table_name='habit_streak_freezes')
    op.drop_table('habit_streak_freezes')
    op.drop_index('ix_habit_entries_user_logged_at', table_name='habit_entries')
    op.drop_index('ix_habit_entries_habit_logged_at', table_name='habit_entries')
    op.drop_table('habit_entries')
    op.drop_index('ix_habits_user_archived', table_name='habits')
    op.drop_index('ix_habits_user_category', table_name='habits')
    op.drop_index('ix_habits_user_id', table_name='habits')
    op.drop_table('habits')
    op.drop_index('ix_habit_categories_user_id', table_name='habit_categories')
    op.drop_table('habit_categories')

    # Drop ENUMs
    sa.Enum(name='streak_mode_enum').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='frequency_type_enum').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='habit_type').drop(op.get_bind(), checkfirst=True)
