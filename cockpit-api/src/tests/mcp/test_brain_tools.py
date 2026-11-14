"""MCP brain tools through a real in-memory MCP client session."""
import json
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from mcp.shared.memory import create_connected_server_and_client_session

from src.core.config import settings
from src.services.mcp.server import mcp
from src.tests.factories import make_note_file


@pytest.fixture
def vault(tmp_path: Path, monkeypatch) -> Path:
    monkeypatch.setattr(settings, "BRAIN_NOTES_PATH", str(tmp_path))
    return tmp_path


@pytest.fixture(autouse=True)
def _no_search_index():
    with patch("src.services.brain.service.search_index.upsert_note", AsyncMock()), \
         patch("src.services.brain.service.search_index.delete_note", AsyncMock()):
        yield


async def call(name: str, args: dict):
    async with create_connected_server_and_client_session(mcp._mcp_server) as client:
        return await client.call_tool(name, args)


BRAIN_TOOLS = ["brain_search_notes", "brain_get_note", "brain_query_notes", "brain_list_notes", "brain_list_folders",
               "brain_resolve", "brain_get_links", "brain_create_note", "brain_update_note", "brain_patch_note",
               "brain_append_to_section", "brain_delete_note", "brain_batch"]
READ_ONLY = {"brain_search_notes", "brain_get_note", "brain_query_notes", "brain_list_notes", "brain_list_folders",
             "brain_resolve", "brain_get_links"}


class TestToolDeclarations:
    async def test_every_brain_tool_has_output_schema_and_annotations(self):
        async with create_connected_server_and_client_session(mcp._mcp_server) as client:
            tools = {t.name: t for t in (await client.list_tools()).tools}
        for name in BRAIN_TOOLS:
            t = tools[name]
            assert t.outputSchema, name
            assert t.annotations is not None, name
            assert bool(t.annotations.readOnlyHint) == (name in READ_ONLY), name
        assert tools["brain_delete_note"].annotations.destructiveHint is True
        assert tools["brain_update_note"].annotations.idempotentHint is True
        assert tools["brain_create_note"].annotations.destructiveHint is False

    async def test_descriptions_no_longer_claim_three_types_or_git_push(self):
        async with create_connected_server_and_client_session(mcp._mcp_server) as client:
            tools = {t.name: t for t in (await client.list_tools()).tools}
        for name in BRAIN_TOOLS:
            d = tools[name].description
            assert "'context', 'reference', or 'note'" not in d
            assert "pushes to git" not in d.lower()
        assert "ALL-OR-NOTHING" in tools["brain_batch"].description
        assert "MERGE" in tools["brain_update_note"].description


class TestStructuredResults:
    async def test_list_is_one_structured_payload_not_a_stream(self, vault):
        for i in range(3):
            make_note_file(vault, f"n{i}.md", title=f"N{i}", type="skill")
        r = await call("brain_list_notes", {})
        assert not r.isError and len(r.content) == 1
        assert [i["path"] for i in r.structuredContent["items"]] == ["n0.md", "n1.md", "n2.md"]
        assert json.loads(r.content[0].text) == r.structuredContent

    async def test_get_note_exposes_properties_and_version(self, vault):
        make_note_file(vault, "s.md", title="S", type="skill", claimed_level="3")
        r = await call("brain_get_note", {"path": "s.md"})
        assert r.structuredContent["properties"] == {"claimed_level": 3}
        assert r.structuredContent["version"] and r.structuredContent["created_source"] == "file_time"

    async def test_query_tool(self, vault):
        make_note_file(vault, "g/a.md", title="A", type="skill", claimed_level="3")
        make_note_file(vault, "g/b.md", title="B", type="skill", claimed_level="1")
        r = await call("brain_query_notes", {"folder": "g", "type": "skill", "fields": ["claimed_level"],
                                             "where": [{"key": "claimed_level", "op": "gt", "value": 2}]})
        assert r.structuredContent["items"] == [{"path": "g/a.md", "claimed_level": 3}]

    async def test_errors_share_one_shape(self, vault):
        r = await call("brain_get_note", {"path": "missing.md"})
        assert r.isError
        assert r.structuredContent["error"]["code"] == "not_found"
        assert set(r.structuredContent["error"]) == {"code", "message", "details"}
        r = await call("brain_get_note", {"path": "../etc/passwd"})
        assert r.isError and r.structuredContent["error"]["code"] == "invalid_path"

    async def test_version_conflict_error_has_current_content(self, vault):
        make_note_file(vault, "s.md", title="S")
        r = await call("brain_update_note", {"path": "s.md", "title": "X", "if_version": "stale"})
        err = r.structuredContent["error"]
        assert r.isError and err["code"] == "version_conflict"
        assert err["details"]["current_version"] and "title: S" in err["details"]["current_content"]

    async def test_old_style_create_and_update_still_work(self, vault):
        r = await call("brain_create_note", {"path": "n", "title": "N", "body": "hi", "type": "weird-type", "tags": ["a"]})
        assert not r.isError and r.structuredContent["type"] == "weird-type"
        r = await call("brain_update_note", {"path": "n", "title": "N2"})
        assert r.structuredContent["title"] == "N2" and r.structuredContent["tags"] == ["a"]

    async def test_delete_reports_trash(self, vault):
        make_note_file(vault, "d.md", title="D")
        r = await call("brain_delete_note", {"path": "d.md"})
        assert r.structuredContent == {"success": True, "path": "d.md", "trashed_to": ".trash/d.md"}

    async def test_invalid_batch_args_return_structured_error(self, vault):
        r = await call("brain_batch", {"ops": []})
        assert r.isError and r.structuredContent["error"]["code"] == "invalid_op"


class TestSkillGraphSession:
    async def test_end_to_end(self, vault):
        make_note_file(vault, "kb/skill graph/SSE (skill).md", body="# SSE\n\n## Verification log\n\n| date | level |\n|---|---|\n",
                       title="SSE (skill)", type="skill", claimed_level="3", current_level="2", target_level="4", priority="high",
                       requires='["[[HTTP (skill)]]", "[[Streams (skill)]]"]')
        for n in ("HTTP", "Streams"):
            make_note_file(vault, f"kb/skill graph/{n} (skill).md", title=f"{n} (skill)", type="skill", claimed_level="2")
        # 1. query
        q = await call("brain_query_notes", {"folder": "kb/skill graph", "type": "skill",
                       "fields": ["claimed_level", "current_level", "target_level", "priority", "requires"]})
        assert q.structuredContent["total"] == 3
        sse = next(i for i in q.structuredContent["items"] if i["path"].endswith("SSE (skill).md"))
        # 2. resolve requires
        paths = []
        for link in sse["requires"]:
            r = await call("brain_resolve", {"link": link})
            paths.append(r.structuredContent["path"])
        assert paths == ["kb/skill graph/HTTP (skill).md", "kb/skill graph/Streams (skill).md"]
        # 3. one batch
        v = (await call("brain_get_note", {"path": sse["path"]})).structuredContent["version"]
        r = await call("brain_batch", {"ops": [
            {"op": "update", "path": sse["path"], "properties": {"current_level": 3, "last_verified": "2026-11-13"}, "if_version": v},
            {"op": "append", "path": sse["path"], "heading": "## Verification log", "text": "| 2026-11-13 | 3 |"},
            {"op": "update", "path": paths[0], "properties": {"needs_recheck": True}},
            {"op": "update", "path": paths[1], "properties": {"needs_recheck": True}},
        ]})
        assert not r.isError and len(r.structuredContent["results"]) == 4
        flagged = await call("brain_query_notes", {"type": "skill", "where": [{"key": "needs_recheck", "op": "eq", "value": True}]})
        assert flagged.structuredContent["total"] == 2
        # stale version now rejected
        again = await call("brain_update_note", {"path": sse["path"], "title": "x", "if_version": v})
        assert again.isError and again.structuredContent["error"]["code"] == "version_conflict"
