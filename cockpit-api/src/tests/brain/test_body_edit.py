"""Patch and append-to-section."""
import pytest

from src.services.brain import body_edit
from src.services.brain.errors import BrainError

NOTE = """---
title: T
---
# T

## Verification log

| date | level |
|---|---|
| 2026-01-01 | 2 |

## Other

text
"""


class TestPatchBody:
    def test_replaces_exactly_once(self):
        out = body_edit.patch_body(NOTE, [("text", "changed")])
        assert out == NOTE.replace("text\n", "changed\n")

    def test_frontmatter_is_never_touched(self):
        out = body_edit.patch_body(NOTE, [("# T\n", "# U\n")])
        assert out.startswith("---\ntitle: T\n---\n# U")

    def test_not_found_lists_edit(self):
        with pytest.raises(BrainError) as e:
            body_edit.patch_body(NOTE, [("text", "x"), ("missing", "y")])
        assert e.value.code == "patch_failed"
        assert e.value.details["failed_edits"] == [
            {"index": 1, "reason": "not_found", "occurrences": 0, "old_preview": "missing"}]

    def test_ambiguous_is_rejected(self):
        with pytest.raises(BrainError) as e:
            body_edit.patch_body(NOTE, [("|", "x")])
        assert e.value.details["failed_edits"][0]["reason"] == "ambiguous"

    def test_all_failures_reported_and_nothing_applied(self):
        with pytest.raises(BrainError) as e:
            body_edit.patch_body(NOTE, [("nope", "a"), ("text", "b"), ("|", "c")])
        assert [f["index"] for f in e.value.details["failed_edits"]] == [0, 2]

    def test_sequential_edits_see_previous_results(self):
        out = body_edit.patch_body(NOTE, [("text", "one"), ("one", "two")])
        assert out.endswith("two\n")

    def test_old_text_in_frontmatter_is_not_matched(self):
        with pytest.raises(BrainError):
            body_edit.patch_body(NOTE, [("title: T", "title: U")])

    def test_empty_old_rejected(self):
        with pytest.raises(BrainError):
            body_edit.patch_body(NOTE, [("", "x")])


class TestAppendToSection:
    def test_appends_table_row_after_last_row(self):
        out = body_edit.append_to_section(NOTE, "## Verification log", "| 2026-11-13 | 3 |")
        assert "| 2026-01-01 | 2 |\n| 2026-11-13 | 3 |\n\n## Other" in out

    def test_bare_heading_text_matches_case_insensitive(self):
        out = body_edit.append_to_section(NOTE, "verification LOG", "| x | y |")
        assert "| x | y |\n\n## Other" in out

    def test_last_section_at_eof(self):
        out = body_edit.append_to_section(NOTE, "Other", "more")
        assert out.endswith("text\nmore\n")

    def test_missing_heading_lists_available(self):
        with pytest.raises(BrainError) as e:
            body_edit.append_to_section(NOTE, "## Nope", "x")
        assert e.value.code == "section_not_found"
        assert "## Other" in e.value.details["available_headings"]

    def test_ambiguous_heading(self):
        text = "# A\n\n## Log\n\na\n\n## Log\n\nb\n"
        with pytest.raises(BrainError) as e:
            body_edit.append_to_section(text, "Log", "x")
        assert e.value.code == "ambiguous_section"

    def test_level_disambiguates(self):
        text = "# Log\n\na\n\n## Log\n\nb\n"
        out = body_edit.append_to_section(text, "## Log", "x")
        assert out.endswith("b\nx\n")

    def test_heading_inside_code_fence_ignored(self):
        text = "# A\n\n```\n## Log\n```\n\n## Log\n\nrow\n"
        out = body_edit.append_to_section(text, "## Log", "x")
        assert out.endswith("row\nx\n")

    def test_empty_section_gets_blank_line(self):
        out = body_edit.append_to_section("## Log\n## Next\n", "## Log", "x")
        assert out == "## Log\n\nx\n## Next\n"

    def test_no_trailing_newline_in_file(self):
        out = body_edit.append_to_section("## Log\nrow", "## Log", "x")
        assert out == "## Log\nrow\nx\n"

    def test_empty_text_rejected(self):
        with pytest.raises(BrainError):
            body_edit.append_to_section(NOTE, "## Other", "  ")
