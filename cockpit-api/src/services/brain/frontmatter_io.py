"""Lossless YAML-frontmatter editing.

Frontmatter is split into top-level key *blocks* (text). Only blocks whose value actually
changes are re-serialized; every other byte of the file stays as the user wrote it
(key order, quoting, comments, list style, body).
"""
import datetime as dt
import re
from dataclasses import dataclass
from io import StringIO

from ruamel.yaml import YAML
from ruamel.yaml.error import YAMLError
from ruamel.yaml.scalarstring import DoubleQuotedScalarString

from src.services.brain.errors import BrainError
from src.services.brain.json_types import JsonMap, JsonValue

_FENCE = "---"


@dataclass
class Parts:
    """A note file split into its frontmatter fences, frontmatter text and body (`join()` restores the file)."""

    open: str = ""
    fm: str = ""
    close: str = ""
    rest: str = ""
    has_fm: bool = False

    def join(self) -> str:
        """Reassemble the original file text."""
        if not self.has_fm:
            return self.rest
        return self.open + self.fm + self.close + self.rest


def _is_fence(line: str) -> bool:
    """True for a `---` fence line (trailing whitespace allowed)."""
    return line.rstrip("\r\n \t") == _FENCE


def split_document(text: str) -> Parts:
    """Split a note into frontmatter and body; no frontmatter (or an unterminated one) means all body."""
    lines = text.splitlines(keepends=True)
    if not lines or not _is_fence(lines[0]):
        return Parts(rest=text)
    for i in range(1, len(lines)):
        if _is_fence(lines[i]):
            return Parts(
                open=lines[0],
                fm="".join(lines[1:i]),
                close=lines[i],
                rest="".join(lines[i + 1:]),
                has_fm=True,
            )
    return Parts(rest=text)


def _jsonable(value: object) -> JsonValue:
    """Convert a parsed YAML value to a JSON-shaped one (dates become ISO strings)."""
    if isinstance(value, (dt.datetime, dt.date, dt.time)):
        return value.isoformat()
    if isinstance(value, dict):
        return {str(k): _jsonable(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_jsonable(v) for v in value]
    if value is None or isinstance(value, (str, bool, int, float)):
        return value
    return str(value)


def parse_properties(fm_text: str) -> JsonMap:
    """All frontmatter keys → plain values (dates as ISO strings), in file order."""
    if not fm_text.strip():
        return {}
    try:
        # ruamel ships no type information: the loaded document is untyped until _jsonable normalizes it
        data: object = YAML(typ="safe", pure=True).load(fm_text)
    except YAMLError as e:
        raise BrainError("invalid_frontmatter", f"Invalid YAML frontmatter: {e}") from e
    if data is None:
        return {}
    if not isinstance(data, dict):
        raise BrainError("invalid_frontmatter", "Frontmatter must be a YAML mapping")
    return {str(k): _jsonable(v) for k, v in data.items()}


_QUOTED_KEY = re.compile(r'^(?:"((?:[^"\\]|\\.)*)"|\'((?:[^\']|\'\')*)\')\s*:(?:\s|$)')
_PLAIN_KEY = re.compile(r"^(.+?)\s*:(?:\s|$)")


def _block_key(line: str) -> str | None:
    """Top-level key that starts on this line, or None for continuation/comment/blank lines."""
    if not line or line[0] in " \t#\r\n" or line.startswith("- ") or line.rstrip() == "-":
        return None
    m = _QUOTED_KEY.match(line)
    if m:
        return m.group(1) if m.group(1) is not None else m.group(2).replace("''", "'")
    m = _PLAIN_KEY.match(line)
    return m.group(1) if m else None


@dataclass
class _Block:
    """One top-level frontmatter entry as text; `key` is None for leading comments/blank lines."""

    key: str | None
    text: str


def _split_blocks(fm_text: str) -> list[_Block]:
    """Split frontmatter text into top-level key blocks; continuation lines stay with their key."""
    blocks: list[_Block] = []
    for line in fm_text.splitlines(keepends=True):
        key = _block_key(line)
        if key is not None or not blocks:
            blocks.append(_Block(key, line))
        else:
            blocks[-1].text += line
    return blocks


_DATE_LIKE = re.compile(r"^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$")


def _prepare(value: JsonValue) -> object:
    """Shape a value for ruamel's dumper: quoted wikilinks, real date objects (so they dump unquoted)."""
    if isinstance(value, str):
        if value.startswith("[["):
            return DoubleQuotedScalarString(value)
        if _DATE_LIKE.match(value):  # real date objects dump unquoted, so Obsidian shows a Date property, not text
            try:
                return dt.date.fromisoformat(value) if len(value) == 10 else dt.datetime.fromisoformat(value)
            except ValueError:
                return value
        return value
    if isinstance(value, list):
        return [_prepare(v) for v in value]
    if isinstance(value, dict):
        return {str(k): _prepare(v) for k, v in value.items()}
    return value


def _serialize_block(key: str, value: JsonValue) -> str:
    """YAML text of one `key: value` block in Obsidian's list style (`  - item`)."""
    y = YAML()
    y.indent(mapping=2, sequence=4, offset=2)
    y.width = 10**9
    y.allow_unicode = True
    y.default_flow_style = False
    buf = StringIO()
    y.dump({key: _prepare(value)}, buf)
    out = buf.getvalue()
    return out if out.endswith("\n") else out + "\n"


def _same(a: JsonValue, b: JsonValue) -> bool:
    """Equality that also compares types (1 vs True vs 1.0 vs "1" differ), recursively."""
    if type(a) is not type(b):
        return False
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(_same(x, y) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict):
        return list(a) == list(b) and all(_same(a[k], b[k]) for k in a)
    return a == b


def apply_changes(fm_text: str, set_props: JsonMap, remove: list[str]) -> str:
    """Set/remove top-level keys; untouched blocks, and keys set to their current value, stay byte-identical."""
    clash = sorted(set(set_props) & set(remove))
    if clash:
        clash_keys: list[JsonValue] = [*clash]
        raise BrainError("invalid_op", f"Keys both set and removed: {clash}", {"keys": clash_keys})
    if not set_props and not remove:
        return fm_text
    remove_set = set(remove)
    blocks = [b for b in _split_blocks(fm_text) if b.key not in remove_set]
    for key, value in set_props.items():
        existing = next((b for b in blocks if b.key == key), None)
        if existing is not None:
            try:
                current = parse_properties(existing.text)
            except BrainError:
                current = {}
            if key in current and _same(current[key], _jsonable(value)):
                continue
            existing.text = _serialize_block(key, value)
        else:
            if blocks and not blocks[-1].text.endswith("\n"):
                blocks[-1].text += "\n"
            blocks.append(_Block(key, _serialize_block(key, value)))
    return "".join(b.text for b in blocks)


def update_text(text: str, set_props: JsonMap, remove: list[str], body: str | None) -> str:
    """Apply property changes and/or a body replacement to a whole note file."""
    parts = split_document(text)
    if not parts.has_fm and (set_props or remove):
        parts = Parts(open="---\n", fm="", close="---\n", rest=text, has_fm=True)
    if parts.has_fm and (set_props or remove):
        new_fm = apply_changes(parts.fm, set_props, remove)
        if "\r\n" in parts.open:
            new_fm = re.sub(r"(?<!\r)\n", "\r\n", new_fm)
        parts.fm = new_fm
    if body is not None:
        lead_match = re.match(r"(?:\r?\n)*", parts.rest)
        lead = lead_match.group() if lead_match else ""
        eol = "\r\n" if "\r\n" in parts.rest or "\r\n" in parts.open else "\n"
        parts.rest = lead + body.rstrip("\r\n") + eol
    return parts.join()
