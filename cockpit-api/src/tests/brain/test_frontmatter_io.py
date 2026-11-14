"""Lossless frontmatter round-trip tests."""
import pytest

from src.services.brain import frontmatter_io as fio
from src.services.brain.errors import BrainError

FIXTURE = """---
title: SSE
type: skill
claimed_level: 3
current_level: 2.5
priority: high
needs_recheck: false
recheck_reason:
last_verified: 2026-03-01
requires: ["[[HTTP (skill)]]", "[[Streams (skill)]]"]
evidence:
  - "[[Case 1 (case)]]"
  - plain text
used_with:
- "[[Redis (skill)]]"
zeta: 'single quoted'   # trailing comment
as_string: "7"
tags: [a, b]
aliases: []
---

# SSE

Body with [[Link]] text.
"""


def _split(text: str):
    parts = fio.split_document(text)
    assert parts.has_fm
    return parts


class TestSplitDocument:
    def test_roundtrip_join_is_identical(self):
        assert fio.split_document(FIXTURE).join() == FIXTURE

    def test_no_frontmatter(self):
        parts = fio.split_document("just body\n")
        assert not parts.has_fm
        assert parts.rest == "just body\n"
        assert parts.join() == "just body\n"

    def test_triple_dash_inside_value_is_not_a_fence(self):
        text = "---\ntitle: a---b\n---\nbody\n"
        parts = fio.split_document(text)
        assert parts.fm == "title: a---b\n"
        assert parts.rest == "body\n"

    def test_unterminated_frontmatter_is_treated_as_body(self):
        parts = fio.split_document("---\ntitle: x\nno end\n")
        assert not parts.has_fm

    def test_crlf_preserved(self):
        text = "---\r\ntitle: x\r\n---\r\nbody\r\n"
        assert fio.split_document(text).join() == text


class TestParseProperties:
    def test_value_types(self):
        props = fio.parse_properties(_split(FIXTURE).fm)
        assert props["claimed_level"] == 3 and isinstance(props["claimed_level"], int)
        assert props["current_level"] == 2.5
        assert props["needs_recheck"] is False
        assert props["recheck_reason"] is None
        assert props["as_string"] == "7"
        assert props["requires"] == ["[[HTTP (skill)]]", "[[Streams (skill)]]"]
        assert props["evidence"] == ["[[Case 1 (case)]]", "plain text"]
        assert props["used_with"] == ["[[Redis (skill)]]"]

    def test_date_becomes_iso_string(self):
        props = fio.parse_properties(_split(FIXTURE).fm)
        assert props["last_verified"] == "2026-03-01"

    def test_key_order_preserved(self):
        props = fio.parse_properties(_split(FIXTURE).fm)
        assert list(props)[:4] == ["title", "type", "claimed_level", "current_level"]

    def test_invalid_yaml_raises_brain_error(self):
        with pytest.raises(BrainError) as exc:
            fio.parse_properties("a: [unclosed\n")
        assert exc.value.code == "invalid_frontmatter"

    def test_empty_frontmatter(self):
        assert fio.parse_properties("") == {}


class TestApplyChanges:
    def test_noop_returns_identical_text(self):
        fm = _split(FIXTURE).fm
        assert fio.apply_changes(fm, {}, []) == fm

    def test_setting_same_value_keeps_bytes(self):
        fm = _split(FIXTURE).fm
        assert fio.apply_changes(fm, {"claimed_level": 3, "zeta": "single quoted"}, []) == fm

    def test_changed_value_does_not_touch_other_lines(self):
        fm = _split(FIXTURE).fm
        out = fio.apply_changes(fm, {"current_level": 4}, [])
        assert out == fm.replace("current_level: 2.5\n", "current_level: 4\n")

    def test_int_stays_int_and_string_stays_string(self):
        out = fio.apply_changes("a: 1\n", {"n": 5, "s": "5", "b": True, "z": None}, [])
        props = fio.parse_properties(out)
        assert props["n"] == 5 and isinstance(props["n"], int)
        assert props["s"] == "5"
        assert props["b"] is True
        assert props["z"] is None and "z" in props

    def test_new_keys_appended_in_order(self):
        out = fio.apply_changes("a: 1\n", {"x": 1, "y": 2}, [])
        assert list(fio.parse_properties(out)) == ["a", "x", "y"]

    def test_wikilinks_are_double_quoted(self):
        out = fio.apply_changes("a: 1\n", {"requires": ["[[SSE (skill)]]", "[[B]]"]}, [])
        assert '"[[SSE (skill)]]"' in out
        assert fio.parse_properties(out)["requires"] == ["[[SSE (skill)]]", "[[B]]"]

    def test_replacing_multiline_block_replaces_whole_block(self):
        fm = _split(FIXTURE).fm
        out = fio.apply_changes(fm, {"evidence": ["[[New]]"]}, [])
        props = fio.parse_properties(out)
        assert props["evidence"] == ["[[New]]"]
        assert props["used_with"] == ["[[Redis (skill)]]"]
        assert "plain text" not in out

    def test_replacing_column_zero_list_block(self):
        fm = _split(FIXTURE).fm
        out = fio.apply_changes(fm, {"used_with": []}, [])
        props = fio.parse_properties(out)
        assert props["used_with"] == []
        assert props["zeta"] == "single quoted"

    def test_remove_key(self):
        fm = _split(FIXTURE).fm
        out = fio.apply_changes(fm, {}, ["evidence", "missing_key"])
        props = fio.parse_properties(out)
        assert "evidence" not in props
        assert props["used_with"] == ["[[Redis (skill)]]"]

    def test_unrelated_comment_line_survives(self):
        fm = _split(FIXTURE).fm
        out = fio.apply_changes(fm, {"priority": "low"}, [])
        assert "# trailing comment" in out

    def test_set_and_remove_same_key_is_error(self):
        with pytest.raises(BrainError) as exc:
            fio.apply_changes("a: 1\n", {"a": 2}, ["a"])
        assert exc.value.code == "invalid_op"

    def test_string_that_looks_like_other_type_survives(self):
        out = fio.apply_changes("", {"v": "true", "d": "2026-01-01", "n": "null"}, [])
        props = fio.parse_properties(out)
        assert props == {"v": "true", "d": "2026-01-01", "n": "null"}


class TestUpdateText:
    def test_adds_frontmatter_when_missing(self):
        out = fio.update_text("body\n", set_props={"type": "skill"}, remove=[], body=None)
        assert out.startswith("---\ntype: skill\n---\n")
        assert out.endswith("body\n")

    def test_body_untouched_when_only_props_change(self):
        out = fio.update_text(FIXTURE, set_props={"current_level": 4}, remove=[], body=None)
        assert out.endswith(FIXTURE.split("---\n", 2)[2])

    def test_body_replaced_keeps_frontmatter_and_lead(self):
        out = fio.update_text(FIXTURE, set_props={}, remove=[], body="New body")
        assert out.startswith(FIXTURE.split("---\n", 2)[0] + "---\n")
        assert out.rstrip("\n").endswith("New body")
        assert fio.parse_properties(fio.split_document(out).fm) == fio.parse_properties(_split(FIXTURE).fm)


class TestDateStrings:
    def test_date_like_strings_are_written_unquoted(self):
        out = fio.apply_changes("", {"last_verified": "2026-11-13", "at": "2026-11-13T10:00:00+00:00"}, [])
        assert "last_verified: 2026-11-13\n" in out
        assert "at: 2026-11-13 10:00:00+00:00\n" in out  # YAML timestamp, space-separated
        assert fio.parse_properties(out) == {"last_verified": "2026-11-13", "at": "2026-11-13T10:00:00+00:00"}
