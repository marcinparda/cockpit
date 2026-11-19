import importlib.util
from pathlib import Path

from src.services.authorization.permissions.enums import Features

MIGRATION = (
    Path(__file__).resolve().parents[3]
    / "alembic/versions/d4e5f6a7b8c9_add_mcp_actual_cv_store_features.py"
)


def test_features_include_gated_services():
    values = {f.value for f in Features}
    assert {"mcp", "actual", "cv", "store"} <= values
    assert "utils" not in values and "agent" not in values


def test_migration_seeds_new_features_and_drops_utils():
    spec = importlib.util.spec_from_file_location("feature_migration", MIGRATION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    assert set(module.NEW_FEATURES) == {"mcp", "actual", "cv", "store"}
    assert set(module.NEW_FEATURES) <= {f.value for f in Features}
    assert module.STALE_FEATURES == ["utils"]
    assert module.down_revision == "c3d4e5f6a7b9"
