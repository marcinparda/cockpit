"""Lossless YAML-frontmatter editing.

Frontmatter is split into top-level key *blocks* (text). Only blocks whose value actually
changes are re-serialized; every other byte of the file stays as the user wrote it
(key order, quoting, comments, list style, body).
"""
import datetime as dt
import re
from dataclasses import dataclass
from io import StringIO
from typing import Any

from ruamel.yaml import YAML
from ruamel.yaml.error import YAMLError
from ruamel.yaml.scalarstring import DoubleQuotedScalarString

from src.services.brain.errors import BrainError

_FENCE = "---"


@dataclass
class Parts:
    open: str = ""
    fm: str = ""
    close: str = ""
    rest: str = ""
    has_fm: bool = False

    def join(self) -> str:
        if not self.has_fm:
            return self.rest
        return self.open + self.fm + self.close + self.rest


def _is_fence(line: str) -> bool:
    return line.rstrip("\r\n \t") == _FENCE


def split_document(text: str) -> Parts:
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


def _jsonable(value: Any) -> Any:
    if isinstance(value, (dt.datetime, dt.date, dt.time)):
        return value.isoformat()
    if isinstance(value, dict):
        return {str(k): _jsonable(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_jsonable(v) for v in value]
    return value


def parse_properties(fm_text: str) -> dict[str, Any]:
    """All frontmatter keys → plain Python values (dates as ISO strings), in file order."""
    if not fm_text.strip():
        return {}
    try:
        data = YAML(typ="safe", pure=True).load(fm_text)
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
    if not line or line[0] in " \t#\r\n" or line.startswith("- ") or line.rstrip() == "-":
        return None
    m = _QUOTED_KEY.match(line)
    if m:
        return m.group(1) if m.group(1) is not None else m.group(2).replace("''", "'")
    m = _PLAIN_KEY.match(line)
    return m.group(1) if m else None


def _split_blocks(fm_text: str) -> list[list]:
    """[[key|None, text], ...] — None key = leading comments/blank lines."""
    blocks: list[list] = []
    for line in fm_text.splitlines(keepends=True):
        key = _block_key(line)
        if key is not None or not blocks:
            blocks.append([key, line])
        else:
            blocks[-1][1] += line
    return blocks


_DATE_LIKE = re.compile(r"^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$")


def _prepare(value: Any) -> Any:
    if isinstance(value, str):
        if value.startswith("[["):
            return DoubleQuotedScalarString(value)
        if _DATE_LIKE.match(value):  # real date objects dump unquoted, so Obsidian shows a Date property, not text
            try:
                return dt.date.fromisoformat(value) if len(value) == 10 else dt.datetime.fromisoformat(value)
            except ValueError:
                return value
        return value
    if isinstance(value, (list, tuple)):
        return [_prepare(v) for v in value]
    if isinstance(value, dict):
        return {str(k): _prepare(v) for k, v in value.items()}
    if value is None or isinstance(value, (bool, int, float)):
        return value
    return str(value)


def _serialize_block(key: str, value: Any) -> str:
    y = YAML()
    y.indent(mapping=2, sequence=4, offset=2)
    y.width = 10**9
    y.allow_unicode = True
    y.default_flow_style = False
    buf = StringIO()
    y.dump({key: _prepare(value)}, buf)
    out = buf.getvalue()
    return out if out.endswith("\n") else out + "\n"


def _same(a: Any, b: Any) -> bool:
    if type(a) is not type(b):
        return False
    if isinstance(a, list):
        return len(a) == len(b) and all(_same(x, y) for x, y in zip(a, b))
    if isinstance(a, dict):
        return list(a) == list(b) and all(_same(a[k], b[k]) for k in a)
    return a == b


def apply_changes(fm_text: str, set_props: dict[str, Any], remove: list[str]) -> str:
    clash = sorted(set(set_props) & set(remove))
    if clash:
        raise BrainError("invalid_op", f"Keys both set and removed: {clash}", {"keys": clash})
    if not set_props and not remove:
        return fm_text
    blocks = _split_blocks(fm_text)
    remove_set = set(remove)
    blocks = [b for b in blocks if b[0] not in remove_set]
    for key, value in set_props.items():
        existing = next((b for b in blocks if b[0] == key), None)
        if existing is not None:
            try:
                current = parse_properties(existing[1]).get(key, object())
            except BrainError:
                current = object()
            if _same(current, _jsonable(value)):
                continue
            existing[1] = _serialize_block(key, value)
        else:
            if blocks and not blocks[-1][1].endswith("\n"):
                blocks[-1][1] += "\n"
            blocks.append([key, _serialize_block(key, value)])
    return "".join(b[1] for b in blocks)


def update_text(text: str, set_props: dict[str, Any], remove: list[str], body: str | None) -> str:
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
        lead = re.match(r"(?:\r?\n)*", parts.rest).group()
        eol = "\r\n" if "\r\n" in parts.rest or "\r\n" in parts.open else "\n"
        parts.rest = lead + body.rstrip("\r\n") + eol
    return parts.join()
