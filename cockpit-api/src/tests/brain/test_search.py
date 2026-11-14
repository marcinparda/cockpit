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


class TestFrontmatterSearchAndRobustness:
    async def test_frontmatter_values_are_searchable(self, search_db):
        await search.upsert_note(search_db, {"path": "s.md", "title": "S", "body": "x", "tags": [], "type": "skill",
                                             "props": "high priority platypus"})
        assert len(await search.search(search_db, "platypus", None, None)) == 1

    async def test_special_characters_do_not_crash(self, search_db):
        await search.upsert_note(search_db, {"path": "s.md", "title": "SSE skill", "body": "streams", "tags": [], "type": "skill"})
        for q in ['[[SSE (skill)]]', 'a-b', 'foo:bar', '"unbalanced', 'SSE (skill)']:
            await search.search(search_db, q, None, None)

    async def test_old_schema_is_migrated(self, tmp_path):
        import aiosqlite
        (tmp_path / ".index").mkdir()
        async with aiosqlite.connect(str(tmp_path / ".index" / "search.db")) as c:
            await c.execute("CREATE VIRTUAL TABLE notes_fts USING fts5(path UNINDEXED, title, body, tags, type UNINDEXED)")
            await c.commit()
        await search.init_index(str(tmp_path))
        await search.upsert_note(str(tmp_path), {"path": "a.md", "title": "A", "body": "b", "tags": [], "type": "note", "props": "zz"})
        assert len(await search.search(str(tmp_path), "zz", None, None)) == 1

    async def test_thousand_notes_search_is_fast(self, search_db):
        import time
        await search.rebuild_index(search_db, [
            {"path": f"n{i}.md", "title": f"Note {i}", "body": f"lorem ipsum dolor {i} " * 50, "tags": ["t"], "type": "note", "props": f"level {i % 5}"}
            for i in range(1000)])
        t = time.perf_counter()
        for _ in range(10):
            await search.search(search_db, "ipsum", None, None)
        assert (time.perf_counter() - t) / 10 < 0.5
