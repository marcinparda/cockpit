"""Unit tests for brain service."""
from pathlib import Path
from unittest.mock import AsyncMock, patch
import pytest
from src.services.brain import service
from src.services.brain.schemas import NoteCreate, NoteUpdate


@pytest.fixture
def notes_path(tmp_path: Path) -> str:
    return str(tmp_path)


class TestNoteFilePath:
    def test_adds_md_extension(self, notes_path):
        assert str(service._note_file(notes_path, "note")).endswith(".md")

    def test_keeps_existing_md(self, notes_path):
        assert str(service._note_file(notes_path, "note.md")).endswith("note.md")


class TestListNotes:
    async def test_empty_dir(self, notes_path):
        assert await service.list_notes(notes_path, None, None, None) == []

    async def test_returns_notes(self, notes_path, tmp_path):
        (tmp_path / "a.md").write_text("---\ntitle: A\ntags: []\ntype: note\n---\nBody")
        result = await service.list_notes(notes_path, None, None, None)
        assert len(result) == 1

    async def test_filters_by_type(self, notes_path, tmp_path):
        (tmp_path / "n.md").write_text("---\ntitle: N\ntags: []\ntype: note\n---\nBody")
        (tmp_path / "t.md").write_text("---\ntitle: T\ntags: []\ntype: task\n---\nBody")
        result = await service.list_notes(notes_path, None, "task", None)
        assert len(result) == 1

    async def test_filters_by_tag(self, notes_path, tmp_path):
        (tmp_path / "tagged.md").write_text("---\ntitle: T\ntags: [py]\ntype: note\n---\nBody")
        (tmp_path / "untagged.md").write_text("---\ntitle: U\ntags: []\ntype: note\n---\nBody")
        result = await service.list_notes(notes_path, None, None, "py")
        assert len(result) == 1


class TestGetNote:
    async def test_raises_when_not_found(self, notes_path):
        with pytest.raises(FileNotFoundError):
            await service.get_note(notes_path, "missing")

    async def test_returns_note(self, notes_path, tmp_path):
        (tmp_path / "found.md").write_text("---\ntitle: Found\ntags: []\ntype: note\n---\nContent")
        result = await service.get_note(notes_path, "found.md")
        assert result.title == "Found"


class TestCreateNote:
    async def test_creates_file(self, notes_path, tmp_path):
        with patch("src.services.brain.service.search_index.upsert_note", AsyncMock()), \
             patch("src.services.brain.service.asyncio.create_task"):
            result = await service.create_note(notes_path, "new", NoteCreate(title="New", tags=[], type="note", aliases=[], body="Hi"))
        assert (tmp_path / "new.md").exists()
        assert result.title == "New"

    async def test_raises_when_exists(self, notes_path, tmp_path):
        (tmp_path / "exists.md").write_text("---\ntitle: E\ntags: []\ntype: note\n---\nBody")
        with pytest.raises(FileExistsError):
            await service.create_note(notes_path, "exists", NoteCreate(title="E", tags=[], type="note", aliases=[], body="body"))


class TestUpdateNote:
    async def test_raises_when_not_found(self, notes_path):
        with pytest.raises(FileNotFoundError):
            await service.update_note(notes_path, "missing", NoteUpdate(title="Updated"))

    async def test_updates_note(self, notes_path, tmp_path):
        (tmp_path / "upd.md").write_text("---\ntitle: Orig\ntags: []\ntype: note\n---\nBody")
        with patch("src.services.brain.service.search_index.upsert_note", AsyncMock()), \
             patch("src.services.brain.service.asyncio.create_task"):
            result = await service.update_note(notes_path, "upd.md", NoteUpdate(title="Updated"))
        assert result.title == "Updated"


class TestDeleteNote:
    async def test_raises_when_not_found(self, notes_path):
        with pytest.raises(FileNotFoundError):
            await service.delete_note(notes_path, "missing")

    async def test_deletes_file(self, notes_path, tmp_path):
        f = tmp_path / "del.md"
        f.write_text("---\ntitle: D\ntags: []\ntype: note\n---\nBody")
        with patch("src.services.brain.service.search_index.delete_note", AsyncMock()), \
             patch("src.services.brain.service.asyncio.create_task"):
            await service.delete_note(notes_path, "del.md")
        assert not f.exists()


class TestListFolders:
    async def test_empty_for_flat(self, notes_path, tmp_path):
        (tmp_path / "root.md").write_text("---\ntitle: R\ntags: []\ntype: note\n---\nBody")
        assert await service.list_folders(notes_path) == []

    async def test_returns_subdirs(self, notes_path, tmp_path):
        sub = tmp_path / "sub"
        sub.mkdir()
        (sub / "n.md").write_text("---\ntitle: S\ntags: []\ntype: note\n---\nBody")
        assert "sub" in await service.list_folders(notes_path)
