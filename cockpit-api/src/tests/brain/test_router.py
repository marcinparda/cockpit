"""REST brain router: new fields flow through and BrainError maps to HTTP statuses."""
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.core.config import settings
from src.main import brain_error_handler
from src.services.brain.errors import BrainError
from src.services.brain.router import router
from src.tests.factories import make_note_file


@pytest.fixture
def client(tmp_path: Path, monkeypatch):
    monkeypatch.setattr(settings, "BRAIN_NOTES_PATH", str(tmp_path))
    app = FastAPI()
    app.include_router(router)
    app.add_exception_handler(BrainError, brain_error_handler)
    for route in router.routes:  # each route has its own require_permission(...) closure: bypass them all
        for dep in route.dependant.dependencies:
            app.dependency_overrides[dep.call] = lambda: None
    with patch("src.services.brain.service.search_index.upsert_note", AsyncMock()), \
         patch("src.services.brain.service.search_index.delete_note", AsyncMock()):
        yield TestClient(app), tmp_path


def test_properties_roundtrip_and_conflict(client):
    c, vault = client
    r = c.post("/notes", params={"path": "a"}, json={"title": "A", "body": "b", "properties": {"claimed_level": 2}})
    assert r.status_code == 201 and r.json()["properties"]["claimed_level"] == 2
    v = r.json()["version"]
    assert c.put("/notes/a.md", json={"properties": {"claimed_level": 3}, "if_version": v}).status_code == 200
    stale = c.put("/notes/a.md", json={"title": "x", "if_version": v})
    assert stale.status_code == 409 and stale.json()["error"]["code"] == "version_conflict"


def test_status_mapping(client):
    c, vault = client
    assert c.get("/notes/missing.md").status_code == 404
    make_note_file(vault, "e.md", title="E")
    assert c.post("/notes", params={"path": "e"}, json={"title": "E", "body": "b"}).status_code == 409
    assert c.get("/notes", params={"path": "../x"}).status_code == 400
    assert c.delete("/notes/e.md").status_code == 204
    assert (vault / ".trash" / "e.md").exists()
