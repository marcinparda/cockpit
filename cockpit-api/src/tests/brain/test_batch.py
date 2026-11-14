"""Atomic batch behaviour."""
import os
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

from src.services.brain import service
from src.services.brain.errors import BrainError
from src.services.brain.schemas import NoteOp
from src.tests.factories import make_note_file

SKILL = "---\ntitle: SSE\ntype: skill\ncurrent_level: 1\nneeds_recheck: false\nrequires: [\"[[HTTP (skill)]]\"]\n---\n# SSE\n\n## Verification log\n\n| date | level |\n|---|---|\n"


@pytest.fixture
def vault(tmp_path: Path) -> Path:
    return tmp_path


@pytest.fixture(autouse=True)
def _no_search_index():
    with patch("src.services.brain.service.search_index.upsert_note", AsyncMock()), \
         patch("src.services.brain.service.search_index.delete_note", AsyncMock()):
        yield


def _snapshot(vault: Path) -> dict[str, str]:
    return {str(p.relative_to(vault)): p.read_text() for p in vault.rglob("*") if p.is_file()}


class TestBatch:
    async def test_skill_graph_verification_session_in_one_batch(self, vault):
        make_note_file(vault, "g/SSE (skill).md", body="# SSE\n\n## Verification log\n\n| date | level |\n|---|---|\n",
                       title="SSE", type="skill", current_level="1", requires='["[[HTTP (skill)]]"]')
        for name in ("HTTP", "Streams"):
            make_note_file(vault, f"g/{name} (skill).md", title=f"{name} (skill)", type="skill", needs_recheck="false")
        results = await service.apply_batch(str(vault), [
            NoteOp(op="update", path="g/SSE (skill).md", properties={"current_level": 3, "last_verified": "2026-11-13"}),
            NoteOp(op="append", path="g/SSE (skill).md", heading="## Verification log", text="| 2026-11-13 | 3 |"),
            NoteOp(op="update", path="g/HTTP (skill).md", properties={"needs_recheck": True, "recheck_reason": "SSE probe"}),
            NoteOp(op="update", path="g/Streams (skill).md", properties={"needs_recheck": True}),
        ])
        assert [r["op"] for r in results] == ["update", "append", "update", "update"]
        sse = await service.get_note(str(vault), "g/SSE (skill).md")
        assert sse.properties["current_level"] == 3 and sse.properties["last_verified"] == "2026-11-13"
        assert sse.body.rstrip().endswith("| 2026-11-13 | 3 |")
        assert sse.properties["requires"] == ["[[HTTP (skill)]]"]
        http = await service.get_note(str(vault), "g/HTTP (skill).md")
        assert http.properties["needs_recheck"] is True

    async def test_failure_in_later_op_writes_nothing(self, vault):
        make_note_file(vault, "a.md", title="A", n="1")
        before = _snapshot(vault)
        with pytest.raises(BrainError) as e:
            await service.apply_batch(str(vault), [
                NoteOp(op="update", path="a.md", properties={"n": 2}),
                NoteOp(op="create", path="b.md", title="B", body="x"),
                NoteOp(op="patch", path="a.md", edits=[{"old": "not there", "new": "x"}]),
            ])
        assert e.value.code == "patch_failed" and e.value.details["op_index"] == 2
        assert _snapshot(vault) == before

    async def test_version_conflict_on_any_op_aborts_all(self, vault):
        make_note_file(vault, "a.md", title="A")
        make_note_file(vault, "b.md", title="B")
        before = _snapshot(vault)
        with pytest.raises(BrainError) as e:
            await service.apply_batch(str(vault), [
                NoteOp(op="update", path="a.md", title="A2"),
                NoteOp(op="update", path="b.md", title="B2", if_version="stale"),
            ])
        assert e.value.code == "version_conflict" and e.value.details["op_index"] == 1
        assert _snapshot(vault) == before

    async def test_write_failure_mid_batch_rolls_back(self, vault):
        make_note_file(vault, "a.md", title="A")
        make_note_file(vault, "b.md", title="B")
        before = _snapshot(vault)
        real_replace = os.replace
        calls = {"n": 0}

        def flaky(src, dst):
            calls["n"] += 1
            if calls["n"] == 2:
                raise OSError("disk full")
            return real_replace(src, dst)

        with patch("src.services.brain.service.os.replace", flaky):
            with pytest.raises(BrainError) as e:
                await service.apply_batch(str(vault), [
                    NoteOp(op="update", path="a.md", title="A2"),
                    NoteOp(op="update", path="b.md", title="B2"),
                    NoteOp(op="create", path="c.md", title="C", body="x"),
                ])
        assert e.value.code == "write_failed"
        assert _snapshot(vault) == before  # a restored, c never created, no temp files left

    async def test_later_ops_see_earlier_ops(self, vault):
        await service.apply_batch(str(vault), [
            NoteOp(op="create", path="n.md", title="N", body="## Log\n"),
            NoteOp(op="append", path="n.md", heading="## Log", text="row 1"),
            NoteOp(op="append", path="n.md", heading="## Log", text="row 2"),
        ])
        assert (await service.get_note(str(vault), "n.md")).body.endswith("row 1\nrow 2")

    async def test_create_then_delete_in_one_batch_leaves_nothing(self, vault):
        await service.apply_batch(str(vault), [
            NoteOp(op="create", path="t.md", title="T", body="x"),
            NoteOp(op="delete", path="t.md"),
        ])
        assert _snapshot(vault) == {}

    async def test_empty_batch_rejected(self, vault):
        with pytest.raises(BrainError):
            await service.apply_batch(str(vault), [])

    async def test_external_edit_between_read_and_write_is_detected(self, vault):
        make_note_file(vault, "a.md", title="A")
        real = service._edit_text

        def sneaky(op, text):
            out = real(op, text)
            (vault / "a.md").write_text("---\ntitle: edited in obsidian\n---\n")
            return out

        with patch("src.services.brain.service._edit_text", sneaky):
            with pytest.raises(BrainError) as e:
                await service.apply_batch(str(vault), [NoteOp(op="update", path="a.md", title="A2")])
        assert e.value.code == "version_conflict"
        assert "edited in obsidian" in (vault / "a.md").read_text()

    async def test_invalid_path_in_batch_aborts_all(self, vault):
        with pytest.raises(BrainError) as e:
            await service.apply_batch(str(vault), [
                NoteOp(op="create", path="ok.md", title="OK", body="x"),
                NoteOp(op="create", path="../evil.md", title="E", body="x"),
            ])
        assert e.value.code == "invalid_path"
        assert _snapshot(vault) == {}

    async def test_batch_calls_no_git(self, vault):
        with patch.dict("sys.modules", {"git": None}):  # import git would raise
            await service.apply_batch(str(vault), [NoteOp(op="create", path="n.md", title="N", body="x")])
        assert (vault / "n.md").exists()
