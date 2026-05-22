"""Seed preset habits across 5 categories

Revision ID: c3d4e5f6a7b9
Revises: b2c3d4e5f6a9
Create Date: 2026-05-21 00:02:00.000000

"""
from typing import Sequence, Union
from datetime import datetime
from uuid import uuid4

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b9'
down_revision: Union[str, None] = 'b2c3d4e5f6a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# ~25 preset habits across 5 categories
PRESET_HABITS = [
    # Health
    {"category_key": "health", "name": "Drink Water", "icon": "droplets", "color": "#3B82F6", "type": "numeric", "default_frequency_type": "daily", "default_target_value": 8.0, "default_target_unit": "glasses", "sort_order": 0},
    {"category_key": "health", "name": "Sleep 8 Hours", "icon": "moon", "color": "#6366F1", "type": "boolean", "default_frequency_type": "daily", "default_target_value": None, "default_target_unit": None, "sort_order": 1},
    {"category_key": "health", "name": "Take Vitamins", "icon": "pill", "color": "#F59E0B", "type": "boolean", "default_frequency_type": "daily", "default_target_value": None, "default_target_unit": None, "sort_order": 2},
    {"category_key": "health", "name": "No Alcohol", "icon": "wine-off", "color": "#EF4444", "type": "boolean", "default_frequency_type": "daily", "default_target_value": None, "default_target_unit": None, "sort_order": 3},
    {"category_key": "health", "name": "Healthy Eating", "icon": "salad", "color": "#22C55E", "type": "boolean", "default_frequency_type": "daily", "default_target_value": None, "default_target_unit": None, "sort_order": 4},
    # Fitness
    {"category_key": "fitness", "name": "Exercise", "icon": "dumbbell", "color": "#F97316", "type": "boolean", "default_frequency_type": "daily", "default_target_value": None, "default_target_unit": None, "sort_order": 0},
    {"category_key": "fitness", "name": "Walk Steps", "icon": "footprints", "color": "#84CC16", "type": "numeric", "default_frequency_type": "daily", "default_target_value": 10000.0, "default_target_unit": "steps", "sort_order": 1},
    {"category_key": "fitness", "name": "Run", "icon": "person-running", "color": "#F97316", "type": "numeric", "default_frequency_type": "weekly", "default_target_value": 5.0, "default_target_unit": "km", "sort_order": 2},
    {"category_key": "fitness", "name": "Strength Training", "icon": "zap", "color": "#EF4444", "type": "boolean", "default_frequency_type": "weekly", "default_target_value": None, "default_target_unit": None, "sort_order": 3},
    {"category_key": "fitness", "name": "Stretching", "icon": "activity", "color": "#A78BFA", "type": "boolean", "default_frequency_type": "daily", "default_target_value": None, "default_target_unit": None, "sort_order": 4},
    # Mindfulness
    {"category_key": "mindfulness", "name": "Meditate", "icon": "brain", "color": "#8B5CF6", "type": "numeric", "default_frequency_type": "daily", "default_target_value": 10.0, "default_target_unit": "minutes", "sort_order": 0},
    {"category_key": "mindfulness", "name": "Gratitude Journal", "icon": "heart", "color": "#EC4899", "type": "boolean", "default_frequency_type": "daily", "default_target_value": None, "default_target_unit": None, "sort_order": 1},
    {"category_key": "mindfulness", "name": "Deep Breathing", "icon": "wind", "color": "#06B6D4", "type": "boolean", "default_frequency_type": "daily", "default_target_value": None, "default_target_unit": None, "sort_order": 2},
    {"category_key": "mindfulness", "name": "Digital Detox", "icon": "smartphone-off", "color": "#6B7280", "type": "boolean", "default_frequency_type": "daily", "default_target_value": None, "default_target_unit": None, "sort_order": 3},
    {"category_key": "mindfulness", "name": "Nature Walk", "icon": "trees", "color": "#22C55E", "type": "boolean", "default_frequency_type": "weekly", "default_target_value": None, "default_target_unit": None, "sort_order": 4},
    # Learning
    {"category_key": "learning", "name": "Read", "icon": "book-open", "color": "#3B82F6", "type": "numeric", "default_frequency_type": "daily", "default_target_value": 30.0, "default_target_unit": "minutes", "sort_order": 0},
    {"category_key": "learning", "name": "Practice Language", "icon": "languages", "color": "#F59E0B", "type": "boolean", "default_frequency_type": "daily", "default_target_value": None, "default_target_unit": None, "sort_order": 1},
    {"category_key": "learning", "name": "Online Course", "icon": "graduation-cap", "color": "#6366F1", "type": "numeric", "default_frequency_type": "daily", "default_target_value": 20.0, "default_target_unit": "minutes", "sort_order": 2},
    {"category_key": "learning", "name": "Practice Instrument", "icon": "music", "color": "#EC4899", "type": "numeric", "default_frequency_type": "daily", "default_target_value": 30.0, "default_target_unit": "minutes", "sort_order": 3},
    {"category_key": "learning", "name": "Write", "icon": "pencil", "color": "#84CC16", "type": "boolean", "default_frequency_type": "daily", "default_target_value": None, "default_target_unit": None, "sort_order": 4},
    # Productivity
    {"category_key": "productivity", "name": "Plan Day", "icon": "list-checks", "color": "#F97316", "type": "boolean", "default_frequency_type": "daily", "default_target_value": None, "default_target_unit": None, "sort_order": 0},
    {"category_key": "productivity", "name": "Deep Work", "icon": "timer", "color": "#6366F1", "type": "numeric", "default_frequency_type": "daily", "default_target_value": 2.0, "default_target_unit": "hours", "sort_order": 1},
    {"category_key": "productivity", "name": "No Social Media", "icon": "ban", "color": "#EF4444", "type": "boolean", "default_frequency_type": "daily", "default_target_value": None, "default_target_unit": None, "sort_order": 2},
    {"category_key": "productivity", "name": "Review Goals", "icon": "target", "color": "#22C55E", "type": "boolean", "default_frequency_type": "weekly", "default_target_value": None, "default_target_unit": None, "sort_order": 3},
    {"category_key": "productivity", "name": "Clear Inbox", "icon": "inbox", "color": "#3B82F6", "type": "boolean", "default_frequency_type": "daily", "default_target_value": None, "default_target_unit": None, "sort_order": 4},
]

_inserted_ids: list[str] = []


def upgrade() -> None:
    """Insert preset habit rows."""
    connection = op.get_bind()
    now = datetime.now()

    for preset in PRESET_HABITS:
        row_id = str(uuid4())
        connection.execute(
            sa.text(
                "INSERT INTO preset_habits "
                "(id, name, icon, color, type, category_key, default_frequency_type, "
                "default_target_value, default_target_unit, sort_order, created_at, updated_at) "
                "VALUES (:id, :name, :icon, :color, :type, :category_key, :default_frequency_type, "
                ":default_target_value, :default_target_unit, :sort_order, :ca, :ua)"
            ),
            {
                "id": row_id,
                "name": preset["name"],
                "icon": preset["icon"],
                "color": preset["color"],
                "type": preset["type"],
                "category_key": preset["category_key"],
                "default_frequency_type": preset["default_frequency_type"],
                "default_target_value": preset["default_target_value"],
                "default_target_unit": preset["default_target_unit"],
                "sort_order": preset["sort_order"],
                "ca": now,
                "ua": now,
            },
        )
        _inserted_ids.append(row_id)


def downgrade() -> None:
    """Delete all seeded preset rows by matching name and category_key."""
    connection = op.get_bind()
    for preset in PRESET_HABITS:
        connection.execute(
            sa.text(
                "DELETE FROM preset_habits WHERE name = :name AND category_key = :category_key"
            ),
            {"name": preset["name"], "category_key": preset["category_key"]},
        )
