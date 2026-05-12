"""Unit tests for brain search index."""
from pathlib import Path
import pytest
from src.services.brain import search


@pytest.fixture
async def search_db(tmp_path: Path) -> str:
    notes_path = str(tmp_path)
    await search.init_index(notes_path)
    return notes_path


class TestInitIndex:
    async def test_creates_index_dir(self, tmp_path):
        await search.init_index(str(tmp_path))
        assert (tmp_path / ".index").exists()

    async def test_idempotent(self, tmp_path):
        path = str(tmp_path)
        await search.init_index(path)
        await search.init_index(path)


class TestRebuildIndex:
    async def test_rebuilds(self, search_db):
        await search.rebuild_index(search_db, [
            {"path": "a.md", "title": "Alpha", "body": "alpha", "tags": [], "type": "note"},
        ])

    async def test_replaces_data(self, search_db):
        await search.rebuild_index(search_db, [{"path": "old.md", "title": "Old", "body": "old", "tags": [], "type": "note"}])
        await search.rebuild_index(search_db, [{"path": "new.md", "title": "New", "body": "new content", "tags": [], "type": "note"}])
        results = await search.search(search_db, "new", None, None)
        assert len(results) == 1


class TestUpsertNote:
    async def test_inserts(self, search_db):
        await search.upsert_note(search_db, {"path": "t.md", "title": "T", "body": "test body", "tags": [], "type": "note"})
        assert len(await search.search(search_db, "test", None, None)) == 1

    async def test_updates(self, search_db):
        await search.upsert_note(search_db, {"path": "t.md", "title": "Old", "body": "old text", "tags": [], "type": "note"})
        await search.upsert_note(search_db, {"path": "t.md", "title": "New", "body": "new text", "tags": [], "type": "note"})
        assert len(await search.search(search_db, "new", None, None)) == 1


class TestSearch:
    async def test_matches_query(self, search_db):
        await search.rebuild_index(search_db, [
            {"path": "a.md", "title": "Python", "body": "python programming", "tags": [], "type": "note"},
            {"path": "b.md", "title": "Go", "body": "go programming", "tags": [], "type": "note"},
        ])
        results = await search.search(search_db, "python", None, None)
        assert any(r["path"] == "a.md" for r in results)

    async def test_filters_by_type(self, search_db):
        await search.rebuild_index(search_db, [
            {"path": "n.md", "title": "N", "body": "shared", "tags": [], "type": "note"},
            {"path": "t.md", "title": "T", "body": "shared", "tags": [], "type": "task"},
        ])
        results = await search.search(search_db, "shared", "task", None)
        assert all(r["type"] == "task" for r in results)

    async def test_filters_by_tag(self, search_db):
        await search.rebuild_index(search_db, [
            {"path": "a.md", "title": "A", "body": "content", "tags": ["python"], "type": "note"},
            {"path": "b.md", "title": "B", "body": "content", "tags": ["go"], "type": "note"},
        ])
        results = await search.search(search_db, "content", None, "python")
        assert all("python" in r["tags"] for r in results)

    async def test_no_match(self, search_db):
        await search.rebuild_index(search_db, [{"path": "a.md", "title": "A", "body": "alpha", "tags": [], "type": "note"}])
        assert await search.search(search_db, "zzznomatch", None, None) == []


class TestDeleteNote:
    async def test_deletes(self, search_db):
        await search.upsert_note(search_db, {"path": "d.md", "title": "D", "body": "delete me", "tags": [], "type": "note"})
        await search.delete_note(search_db, "d.md")
        assert len(await search.search(search_db, "delete", None, None)) == 0
