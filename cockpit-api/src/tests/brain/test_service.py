"""Brain service: CRUD, lossless properties, concurrency, path safety."""
import os
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

from src.services.brain import service
from src.services.brain.errors import BrainError
from src.services.brain.schemas import NoteCreate, NoteUpdate
from src.tests.factories import make_note_file

RICH = """---
title: SSE
type: skill
claimed_level: 3
priority: high
needs_recheck: false
recheck_reason:
requires: ["[[HTTP (skill)]]"]
zeta: 'single quoted'   # keep me
tags: [a, b]
aliases: []
---

# SSE

## Verification log

| date | level |
|---|---|
| 2026-01-01 | 2 |
"""


@pytest.fixture
def vault(tmp_path: Path) -> Path:
    return tmp_path


@pytest.fixture
def notes_path(vault: Path) -> str:
    return str(vault)


@pytest.fixture(autouse=True)
def _no_search_index():
    with patch("src.services.brain.service.search_index.upsert_note", AsyncMock()), \
         patch("src.services.brain.service.search_index.delete_note", AsyncMock()):
        yield


class TestPropertiesAreLossless:
    async def test_update_keeps_custom_properties_regression(self, vault, notes_path):
        """Old update_note rebuilt frontmatter from 6 keys and silently dropped the rest."""
        (vault / "s.md").write_text(RICH)
        await service.update_note(notes_path, "s.md", NoteUpdate(title="SSE 2"))
        text = (vault / "s.md").read_text()
        for needle in ['claimed_level: 3', 'priority: high', 'needs_recheck: false', 'recheck_reason:',
                       '"[[HTTP (skill)]]"', "zeta: 'single quoted'   # keep me"]:
            assert needle in text
        assert text.endswith(RICH.split("---\n", 2)[2])

    async def test_update_only_changes_given_lines(self, vault, notes_path):
        (vault / "s.md").write_text(RICH)
        await service.update_note(notes_path, "s.md", NoteUpdate(properties={"claimed_level": 4}))
        assert (vault / "s.md").read_text() == RICH.replace("claimed_level: 3", "claimed_level: 4")

    async def test_get_note_returns_properties_and_version(self, vault, notes_path):
        (vault / "s.md").write_text(RICH)
        note = await service.get_note(notes_path, "s.md")
        assert note.properties["claimed_level"] == 3
        assert note.properties["recheck_reason"] is None
        assert note.properties["requires"] == ["[[HTTP (skill)]]"]
        assert "title" not in note.properties and "tags" not in note.properties
        assert note.type == "skill" and note.version

    async def test_merge_null_and_remove(self, vault, notes_path):
        (vault / "s.md").write_text(RICH)
        note = await service.update_note(notes_path, "s.md", NoteUpdate(
            properties={"priority": None, "new_key": 1}, remove_properties=["zeta"]))
        assert note.properties["priority"] is None
        assert note.properties["new_key"] == 1
        assert "zeta" not in note.properties
        assert note.properties["claimed_level"] == 3

    async def test_type_is_free_string(self, vault, notes_path):
        note = await service.create_note(notes_path, "x", NoteCreate(title="X", body="b", type="skill-domain"))
        assert note.type == "skill-domain"

    async def test_reserved_keys_rejected_in_properties(self, vault, notes_path):
        with pytest.raises(BrainError) as e:
            await service.create_note(notes_path, "x", NoteCreate(title="X", body="b", properties={"type": "a"}))
        assert e.value.code == "invalid_op"

    async def test_create_does_not_write_timestamp_noise(self, vault, notes_path):
        await service.create_note(notes_path, "x", NoteCreate(title="X", body="b", properties={"claimed_level": 1}))
        text = (vault / "x.md").read_text()
        assert "created_at" not in text and "updated_at" not in text
        assert "claimed_level: 1" in text and "created:" in text

    async def test_updated_key_bumped_only_if_present(self, vault, notes_path):
        make_note_file(vault, "a.md", title="A", updated_at="2020-01-01T00:00:00+00:00")
        make_note_file(vault, "b.md", title="B")
        await service.update_note(notes_path, "a.md", NoteUpdate(title="A2"))
        await service.update_note(notes_path, "b.md", NoteUpdate(title="B2"))
        assert "2020-01-01" not in (vault / "a.md").read_text()
        assert "updated" not in (vault / "b.md").read_text()

    async def test_dotted_filename_keeps_dots(self, vault, notes_path):
        await service.create_note(notes_path, "tools/Node.js", NoteCreate(title="Node", body="b"))
        assert (vault / "tools" / "Node.js.md").exists()


class TestTimestamps:
    async def test_frontmatter_created_wins_and_is_reported(self, vault, notes_path):
        make_note_file(vault, "a.md", title="A", created="2025-05-05T10:00:00")
        note = await service.get_note(notes_path, "a.md")
        assert note.created_at.year == 2025 and note.created_source == "frontmatter"

    async def test_created_is_stable_across_calls_without_frontmatter(self, vault, notes_path):
        """Old code returned now() each call when frontmatter lacked created_at."""
        make_note_file(vault, "a.md", title="A")
        first = await service.get_note(notes_path, "a.md")
        listed = (await service.list_notes(notes_path, None, None, None))[0]
        second = await service.get_note(notes_path, "a.md")
        assert first.created_at == listed.created_at == second.created_at
        assert first.created_source == "file_time" and first.updated_source == "file_mtime"


class TestOptimisticConcurrency:
    async def test_matching_version_succeeds(self, vault, notes_path):
        (vault / "s.md").write_text(RICH)
        v = (await service.get_note(notes_path, "s.md")).version
        note = await service.update_note(notes_path, "s.md", NoteUpdate(title="New", if_version=v))
        assert note.title == "New" and note.version != v

    async def test_stale_version_fails_with_current_state_and_writes_nothing(self, vault, notes_path):
        (vault / "s.md").write_text(RICH)
        v = (await service.get_note(notes_path, "s.md")).version
        edited = RICH.replace("priority: high", "priority: low")
        (vault / "s.md").write_text(edited)  # user edits in Obsidian
        with pytest.raises(BrainError) as e:
            await service.update_note(notes_path, "s.md", NoteUpdate(title="New", if_version=v))
        assert e.value.code == "version_conflict"
        assert e.value.details["current_content"] == edited
        assert e.value.details["current_version"] != v
        assert (vault / "s.md").read_text() == edited

    async def test_delete_respects_if_version(self, vault, notes_path):
        (vault / "s.md").write_text(RICH)
        with pytest.raises(BrainError) as e:
            await service.delete_note(notes_path, "s.md", if_version="deadbeef")
        assert e.value.code == "version_conflict"
        assert (vault / "s.md").exists()


class TestErrors:
    async def test_not_found_is_filenotfound_for_rest_compat(self, notes_path):
        with pytest.raises(FileNotFoundError):
            await service.get_note(notes_path, "missing")
        with pytest.raises(FileNotFoundError):
            await service.update_note(notes_path, "missing", NoteUpdate(title="x"))

    async def test_exists_is_fileexists_for_rest_compat(self, vault, notes_path):
        make_note_file(vault, "e.md", title="E")
        with pytest.raises(FileExistsError):
            await service.create_note(notes_path, "e", NoteCreate(title="E", body="b"))


class TestDelete:
    async def test_moves_to_trash_not_hard_delete(self, vault, notes_path):
        make_note_file(vault, "d/n.md", title="N")
        r = await service.delete_note(notes_path, "d/n.md")
        assert not (vault / "d" / "n.md").exists()
        assert (vault / ".trash" / "d" / "n.md").exists()
        assert r["trashed_to"] == ".trash/d/n.md"

    async def test_trash_name_collision_keeps_both(self, vault, notes_path):
        make_note_file(vault, "n.md", title="One")
        await service.delete_note(notes_path, "n.md")
        make_note_file(vault, "n.md", title="Two")
        await service.delete_note(notes_path, "n.md")
        assert len(list((vault / ".trash").glob("n*.md"))) == 2

    async def test_trashed_notes_not_listed(self, vault, notes_path):
        make_note_file(vault, "n.md", title="One")
        await service.delete_note(notes_path, "n.md")
        assert await service.list_notes(notes_path, None, None, None) == []


class TestPathSafety:
    @pytest.mark.parametrize("bad", [
        "/etc/passwd", "../outside", "a/../../outside", "..", ".git/config", ".obsidian/app.json",
        ".trash/x", ".index/search.db", "a/.git/hooks/x", "C:/x", "a\\..\\..\\b", "", "\x00x",
    ])
    async def test_rejects_bad_paths_on_every_entry_point(self, notes_path, bad):
        with pytest.raises(BrainError) as e:
            await service.get_note(notes_path, bad)
        assert e.value.code == "invalid_path"
        with pytest.raises(BrainError):
            await service.create_note(notes_path, bad, NoteCreate(title="x", body="b"))
        with pytest.raises(BrainError):
            await service.delete_note(notes_path, bad)

    async def test_symlinked_dir_escape_rejected(self, vault, notes_path, tmp_path_factory):
        outside = tmp_path_factory.mktemp("outside")
        (outside / "secret.md").write_text("---\ntitle: S\n---\nsecret")
        os.symlink(outside, vault / "link")
        with pytest.raises(BrainError) as e:
            await service.get_note(notes_path, "link/secret.md")
        assert e.value.code == "invalid_path"
        with pytest.raises(BrainError):
            await service.create_note(notes_path, "link/new.md", NoteCreate(title="x", body="b"))
        assert not (outside / "new.md").exists()

    async def test_symlinked_file_escape_hidden_from_listing(self, vault, notes_path, tmp_path_factory):
        outside = tmp_path_factory.mktemp("outside2")
        (outside / "secret.md").write_text("---\ntitle: S\n---\nsecret")
        os.symlink(outside / "secret.md", vault / "leak.md")
        assert await service.list_notes(notes_path, None, None, None) == []

    async def test_bad_folder_filter_rejected(self, notes_path):
        with pytest.raises(BrainError):
            await service.list_notes(notes_path, "../x", None, None)


class TestListAndFolders:
    async def test_list_filters(self, vault, notes_path):
        make_note_file(vault, "a.md", title="A", type="note", tags="[py]")
        make_note_file(vault, "sub/b.md", title="B", type="task", tags="[]")
        assert len(await service.list_notes(notes_path, None, None, None)) == 2
        assert [n.path for n in await service.list_notes(notes_path, None, "task", None)] == ["sub/b.md"]
        assert [n.path for n in await service.list_notes(notes_path, None, None, "py")] == ["a.md"]
        assert [n.path for n in await service.list_notes(notes_path, "sub", None, None)] == ["sub/b.md"]

    async def test_list_folders(self, vault, notes_path):
        make_note_file(vault, "root.md", title="R")
        make_note_file(vault, "sub/n.md", title="S")
        assert await service.list_folders(notes_path) == ["sub"]

    async def test_invalid_yaml_note_is_listed_not_fatal(self, vault, notes_path):
        (vault / "bad.md").write_text("---\na: [unclosed\n---\nbody")
        notes = await service.list_notes(notes_path, None, None, None)
        assert [n.path for n in notes] == ["bad.md"]
