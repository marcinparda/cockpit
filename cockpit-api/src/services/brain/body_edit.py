"""Body-only edits: exact-match patching and append-under-heading."""
import re

from src.services.brain import frontmatter_io as fio
from src.services.brain.errors import BrainError

_HEADING = re.compile(r"^(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$")
_FENCE_LINE = re.compile(r"^\s{0,3}(```|~~~)")


def patch_body(text: str, edits: list[tuple[str, str]]) -> str:
    """Apply edits sequentially to the body. Each `old` must occur exactly once at its turn.

    All edits are checked; if any fail, nothing is applied and every failure is listed.
    """
    parts = fio.split_document(text)
    body = parts.rest
    failed = []
    for i, (old, new) in enumerate(edits):
        if not old:
            failed.append({"index": i, "reason": "empty_old", "occurrences": 0})
            continue
        n = body.count(old)
        if n != 1:
            failed.append({
                "index": i,
                "reason": "not_found" if n == 0 else "ambiguous",
                "occurrences": n,
                "old_preview": old[:80],
            })
            continue
        body = body.replace(old, new, 1)
    if failed:
        first = failed[0]
        raise BrainError(
            "patch_failed",
            f"{len(failed)} of {len(edits)} edits failed (first: edit #{first['index']} {first['reason']}, "
            f"{first['occurrences']} occurrences). Each 'old' must match the body exactly once. Nothing was changed.",
            {"failed_edits": failed},
        )
    parts.rest = body
    return parts.join()


def _headings(lines: list[str]) -> list[tuple[int, int, str]]:
    """(line index, level, text) for headings outside fenced code."""
    out, in_fence = [], False
    for i, line in enumerate(lines):
        if _FENCE_LINE.match(line):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        m = _HEADING.match(line.rstrip("\r\n"))
        if m:
            out.append((i, len(m.group(1)), m.group(2).strip()))
    return out


def append_to_section(text: str, heading: str, add: str) -> str:
    """Append `add` after the last non-blank line of the section under `heading`.

    `heading` may include hashes ('## Verification log') to pin the level, or be bare text.
    """
    if not add.strip():
        raise BrainError("invalid_op", "append text is empty")
    parts = fio.split_document(text)
    lines = parts.rest.splitlines(keepends=True)
    wanted = heading.strip()
    level = None
    m = re.match(r"^(#{1,6})[ \t]+(.*)$", wanted)
    if m:
        level, wanted = len(m.group(1)), m.group(2).strip()
    heads = _headings(lines)
    matches = [h for h in heads if h[2].casefold() == wanted.casefold() and (level is None or h[1] == level)]
    if not matches:
        raise BrainError("section_not_found", f"Heading not found: {heading!r}",
                         {"heading": heading, "available_headings": [f"{'#' * h[1]} {h[2]}" for h in heads]})
    if len(matches) > 1:
        raise BrainError("ambiguous_section", f"Heading {heading!r} matches {len(matches)} sections; include the '#' level or make it unique",
                         {"heading": heading, "levels": [h[1] for h in matches]})
    start, lvl, _ = matches[0]
    end = len(lines)
    for idx, hl, _t in heads:
        if idx > start and hl <= lvl:
            end = idx
            break
    last = start
    for i in range(start + 1, end):
        if lines[i].strip():
            last = i
    eol = "\r\n" if any(l.endswith("\r\n") for l in lines) or "\r\n" in parts.open else "\n"
    chunk = add.rstrip("\r\n").replace("\r\n", "\n").replace("\n", eol) + eol
    if last == start:
        chunk = eol + chunk  # empty section: blank line after the heading
    if not lines[last].endswith("\n"):
        lines[last] += eol
    lines.insert(last + 1, chunk)
    parts.rest = "".join(lines)
    return parts.join()
