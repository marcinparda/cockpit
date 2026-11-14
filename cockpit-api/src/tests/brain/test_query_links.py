"""Metadata query, link resolution, link graph."""
import time
from pathlib import Path

import pytest

from src.services.brain import links, service
from src.services.brain.errors import BrainError
from src.services.brain.schemas import PropertyCondition as C
from src.tests.factories import make_note_file


@pytest.fixture
def vault(tmp_path: Path) -> Path:
    make_note_file(tmp_path, "g/SSE (skill).md", body="See [[HTTP (skill)|http]] and [[Streams (skill)#Intro]].\n",
                   title="SSE", type="skill", claimed_level="3", current_level="2.5", priority="high",
                   needs_recheck="true", requires='["[[HTTP (skill)]]", "[[Streams (skill)]]"]')
    make_note_file(tmp_path, "g/HTTP (skill).md", title="HTTP", type="skill", claimed_level="4", priority="low",
                   needs_recheck="false", aliases="[Hypertext]")
    make_note_file(tmp_path, "g/Streams (skill).md", title="Streams", type="skill", claimed_level="1")
    make_note_file(tmp_path, "other/Case 1.md", body="Used [[SSE (skill)]] in prod. `[[Ignored]]`\n```\n[[AlsoIgnored]]\n```\n",
                   title="Case 1", type="case", evidence='["[[SSE (skill)]]"]', tags="[prod]")
    make_note_file(tmp_path, "notes/HTTP (skill).md", title="HTTP dup", type="note")
    return tmp_path


class TestQuery:
    async def test_folder_type_fields(self, vault):
        r = await service.query_notes(str(vault), folder="g", type="skill", fields=["claimed_level", "requires"])
        assert [i["path"] for i in r["items"]] == ["g/HTTP (skill).md", "g/SSE (skill).md", "g/Streams (skill).md"]
        assert r["items"][1]["claimed_level"] == 3 and r["items"][1]["requires"][0] == "[[HTTP (skill)]]"
        assert r["total"] == 3 and r["next_cursor"] is None

    async def test_default_fields(self, vault):
        r = await service.query_notes(str(vault), folder="other")
        assert r["items"] == [{"path": "other/Case 1.md", "title": "Case 1", "type": "case"}]

    async def test_folder_is_prefix_on_segment_boundary(self, vault):
        make_note_file(vault, "gx/n.md", title="N")
        r = await service.query_notes(str(vault), folder="g")
        assert all(i["path"].startswith("g/") for i in r["items"])

    @pytest.mark.parametrize("cond,expected", [
        (C(key="claimed_level", op="eq", value=3), ["SSE"]),
        (C(key="claimed_level", op="eq", value="3"), []),
        (C(key="claimed_level", op="neq", value=3), ["HTTP", "Streams"]),
        (C(key="priority", op="in", value=["high", "low"]), ["HTTP", "SSE"]),
        (C(key="priority", op="exists"), ["HTTP", "SSE"]),
        (C(key="priority", op="missing"), ["Streams"]),
        (C(key="claimed_level", op="lt", value=3), ["Streams"]),
        (C(key="claimed_level", op="gt", value=3), ["HTTP"]),
        (C(key="current_level", op="gt", value=2), ["SSE"]),
        (C(key="needs_recheck", op="eq", value=True), ["SSE"]),
        (C(key="requires", op="contains", value="[[HTTP (skill)]]"), ["SSE"]),
        (C(key="aliases", op="contains", value="Hypertext"), ["HTTP"]),
    ])
    async def test_conditions(self, vault, cond, expected):
        r = await service.query_notes(str(vault), folder="g", where=[cond], fields=["title"])
        assert sorted(i["title"] for i in r["items"]) == sorted(expected)

    async def test_conditions_are_anded(self, vault):
        r = await service.query_notes(str(vault), type="skill", where=[C(key="priority", op="exists"), C(key="claimed_level", op="gt", value=3)])
        assert [i["path"] for i in r["items"]] == ["g/HTTP (skill).md"]

    async def test_tag_filter(self, vault):
        r = await service.query_notes(str(vault), tag="#prod")
        assert [i["path"] for i in r["items"]] == ["other/Case 1.md"]

    async def test_pagination_walks_all_pages_without_duplicates(self, vault):
        seen, cursor = [], None
        while True:
            r = await service.query_notes(str(vault), limit=2, cursor=cursor)
            seen += [i["path"] for i in r["items"]]
            assert r["total"] == 5
            cursor = r["next_cursor"]
            if not cursor:
                break
        assert len(seen) == 5 == len(set(seen)) and seen == sorted(seen)

    async def test_invalid_cursor(self, vault):
        with pytest.raises(BrainError) as e:
            await service.query_notes(str(vault), cursor="garbage")
        assert e.value.code == "invalid_cursor"

    async def test_limit_is_clamped(self, vault):
        r = await service.query_notes(str(vault), limit=10_000)
        assert len(r["items"]) == 5

    async def test_unknown_field_is_null(self, vault):
        r = await service.query_notes(str(vault), folder="other", fields=["nope"])
        assert r["items"][0]["nope"] is None

    async def test_sees_changes_after_write(self, vault):
        await service.query_notes(str(vault))  # warm cache
        (vault / "g" / "Streams (skill).md").write_text("---\ntitle: Streams\ntype: skill\nclaimed_level: 9\n---\n")
        r = await service.query_notes(str(vault), where=[C(key="claimed_level", op="eq", value=9)])
        assert len(r["items"]) == 1

    async def test_thousand_notes_cold_scan_is_fast(self, tmp_path):
        for i in range(1000):
            make_note_file(tmp_path, f"d{i % 20}/n{i}.md", body=f"body {i} [[n{(i + 1) % 1000}]]\n", title=f"N{i}", type="skill", claimed_level=str(i % 5))
        t = time.perf_counter()
        r = await service.query_notes(str(tmp_path), type="skill", where=[C(key="claimed_level", op="gt", value=2)], limit=500)
        cold = time.perf_counter() - t
        t = time.perf_counter()
        await service.query_notes(str(tmp_path), type="skill")
        warm = time.perf_counter() - t
        assert r["total"] == 400
        assert cold < 5 and warm < 1, (cold, warm)


class TestLinkParsing:
    def test_alias_and_heading_stripped(self):
        assert links.parse_target("Note#Heading|alias") == ("Note", "Heading", "alias")
        assert links.parse_target("Note#^block") == ("Note", None, None)

    def test_code_ignored_and_embed_flagged(self):
        found = links.extract_body_links("a [[X]] `[[Y]]`\n```\n[[Z]]\n```\n![[img.png]]")
        assert [(l.target, l.embed) for l in found] == [("X", False), ("img.png", True)]

    def test_property_links_carry_source_key(self):
        found = links.extract_property_links({"requires": ["[[A]]", "plain"], "n": 3, "evidence": {"k": "[[B|b]]"}})
        assert [(l.target, l.source) for l in found] == [("A", "frontmatter:requires"), ("B", "frontmatter:evidence")]


class TestResolve:
    async def test_basename_shortest_path_wins(self, vault):
        r = await service.resolve_link(str(vault), "[[HTTP (skill)]]")
        assert r["path"] == "notes/HTTP (skill).md" or r["path"] == "g/HTTP (skill).md"
        assert r["ambiguous"] is True and set(r["matches"]) == {"g/HTTP (skill).md", "notes/HTTP (skill).md"}

    async def test_from_path_prefers_same_folder(self, vault):
        r = await service.resolve_link(str(vault), "HTTP (skill)", from_path="g/SSE (skill).md")
        assert r["path"] == "g/HTTP (skill).md"

    async def test_ignores_alias_and_heading_and_case(self, vault):
        r = await service.resolve_link(str(vault), "[[streams (SKILL)#Intro|s]]")
        assert r["path"] == "g/Streams (skill).md" and r["resolved_by"] == "basename" and not r["ambiguous"]

    async def test_path_suffix(self, vault):
        assert (await service.resolve_link(str(vault), "g/HTTP (skill)"))["path"] == "g/HTTP (skill).md"
        assert (await service.resolve_link(str(vault), "other/Case 1.md"))["resolved_by"] == "path"

    async def test_alias_then_title(self, vault):
        assert (await service.resolve_link(str(vault), "Hypertext"))["resolved_by"] == "alias"
        make_note_file(vault, "t/file-name.md", title="Fancy Title")
        r = await service.resolve_link(str(vault), "Fancy Title")
        assert r["path"] == "t/file-name.md" and r["resolved_by"] == "title"

    async def test_unresolved(self, vault):
        r = await service.resolve_link(str(vault), "[[Nothing]]")
        assert r["path"] is None and r["matches"] == []


class TestGetLinks:
    async def test_outgoing_includes_frontmatter_and_body(self, vault):
        r = await service.get_links(str(vault), "g/SSE (skill).md", "out")
        by_source = {(l["target"], l["source"]): l for l in r["outgoing"]}
        assert by_source[("HTTP (skill)", "frontmatter:requires")]["resolved_path"] == "g/HTTP (skill).md"
        assert ("Streams (skill)", "body") in by_source and ("HTTP (skill)", "body") in by_source
        assert r["incoming"] == []

    async def test_incoming_backlinks_include_frontmatter(self, vault):
        r = await service.get_links(str(vault), "g/SSE (skill).md", "in")
        assert sorted((l["from_path"], l["source"]) for l in r["incoming"]) == [
            ("other/Case 1.md", "body"), ("other/Case 1.md", "frontmatter:evidence")]

    async def test_dependents_of_prerequisite(self, vault):
        r = await service.get_links(str(vault), "g/HTTP (skill).md", "in")
        assert {l["from_path"] for l in r["incoming"]} == {"g/SSE (skill).md"}

    async def test_missing_note_and_bad_direction(self, vault):
        with pytest.raises(FileNotFoundError):
            await service.get_links(str(vault), "nope.md")
        with pytest.raises(BrainError):
            await service.get_links(str(vault), "g/SSE (skill).md", "sideways")
