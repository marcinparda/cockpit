"""Parsed-note records with an mtime-keyed cache (fast metadata queries over ~1000 notes)."""
import hashlib
import logging
import os
import threading
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from src.services.brain import frontmatter_io as fio
from src.services.brain.errors import BrainError
from src.services.brain.json_types import JsonMap, JsonValue
from src.services.brain.links import Link, extract_body_links, extract_property_links
from src.services.brain.paths import iter_note_files

logger = logging.getLogger(__name__)

SURFACED = ("title", "tags", "type", "aliases")
_CREATED_KEYS = ("created", "created_at")
_UPDATED_KEYS = ("updated", "updated_at", "modified")


def version_of(data: bytes | str) -> str:
    """Short content hash of a note's bytes; the optimistic-concurrency token exposed as `version`."""
    raw = data.encode("utf-8") if isinstance(data, str) else data
    return hashlib.sha256(raw).hexdigest()[:16]


@dataclass
class NoteRecord:
    """Everything parsed from one note file (cached by mtime): metadata, frontmatter, timestamps with sources, version, links."""
    path: str
    title: str
    type: str
    tags: list[str]
    aliases: list[str]
    all_props: JsonMap
    created_at: datetime
    created_source: str
    updated_at: datetime
    updated_source: str
    version: str
    links: list[Link] = field(default_factory=list)
    parse_error: str | None = None

    @property
    def properties(self) -> JsonMap:
        """Frontmatter keys not already surfaced as dedicated fields (title, tags, type, aliases)."""
        return {k: v for k, v in self.all_props.items() if k not in SURFACED}


def _as_list(value: JsonValue) -> list[str]:
    """Normalize a tags/aliases value (list, comma/space-separated string or scalar) to a list of strings."""
    if value is None:
        return []
    if isinstance(value, (list, tuple)):
        return [str(v) for v in value if v is not None]
    if isinstance(value, str):
        return [s.strip() for s in value.replace(",", " ").split() if s.strip()] if value.strip() else []
    return [str(value)]


def _parse_dt(value: JsonValue) -> datetime | None:
    """Parse an ISO date/datetime value to an aware UTC datetime, or None if it is not one."""
    if value is None or isinstance(value, bool):
        return None
    try:
        dtv = datetime.fromisoformat(str(value).strip().replace("Z", "+00:00"))
    except ValueError:
        return None
    return dtv if dtv.tzinfo else dtv.replace(tzinfo=timezone.utc)


def _frontmatter_time(props: JsonMap, keys: tuple[str, ...]) -> datetime | None:
    """First parseable timestamp among `keys` in the frontmatter, or None."""
    for k in keys:
        dtv = _parse_dt(props.get(k))
        if dtv:
            return dtv
    return None


def build_record(rel: str, data: bytes, st: os.stat_result) -> NoteRecord:
    """Parse one note file's bytes and stat into a NoteRecord (timestamps: frontmatter first, then file times)."""
    text = data.decode("utf-8")
    parts = fio.split_document(text)
    error = None
    props: JsonMap = {}
    if parts.has_fm:
        try:
            props = fio.parse_properties(parts.fm)
        except BrainError as e:
            error = e.message
    stem = rel.rsplit("/", 1)[-1][:-3]
    title = props.get("title")
    created = _frontmatter_time(props, _CREATED_KEYS)
    updated = _frontmatter_time(props, _UPDATED_KEYS)
    file_created = datetime.fromtimestamp(min(st.st_mtime, st.st_ctime), tz=timezone.utc)
    file_updated = datetime.fromtimestamp(st.st_mtime, tz=timezone.utc)
    links = extract_property_links(props) + extract_body_links(parts.rest)
    return NoteRecord(
        path=rel,
        title=str(title) if title not in (None, "") else stem,
        type=str(props.get("type") or "note"),
        tags=_as_list(props.get("tags")),
        aliases=_as_list(props.get("aliases") if props.get("aliases") is not None else props.get("alias")),
        all_props=props,
        created_at=created or file_created,
        created_source="frontmatter" if created else "file_time",
        updated_at=updated or file_updated,
        updated_source="frontmatter" if updated else "file_mtime",
        version=version_of(data),
        links=links,
        parse_error=error,
    )


_cache: dict[str, dict[str, tuple[int, int, NoteRecord]]] = {}
_cache_lock = threading.Lock()


def invalidate(root: str, rel: str | None = None) -> None:
    """Drop cached records for one note (or the whole vault when `rel` is None) after a write."""
    with _cache_lock:
        if rel is None:
            _cache.pop(root, None)
        else:
            _cache.get(root, {}).pop(rel, None)


def read_record(root: str, rel: str) -> NoteRecord:
    """Parse a note fresh from disk and refresh its cache entry."""
    full = Path(root) / rel
    st = full.stat()
    rec = build_record(rel, full.read_bytes(), st)
    with _cache_lock:
        _cache.setdefault(root, {})[rel] = (st.st_mtime_ns, st.st_size, rec)
    return rec


def scan(root: str) -> list[NoteRecord]:
    """All notes sorted by path. Unchanged files (mtime+size) come from the cache."""
    with _cache_lock:
        cached = dict(_cache.get(root, {}))
    fresh: dict[str, tuple[int, int, NoteRecord]] = {}
    for full, rel in iter_note_files(root):
        try:
            st = full.stat()
            hit = cached.get(rel)
            if hit and hit[0] == st.st_mtime_ns and hit[1] == st.st_size:
                fresh[rel] = hit
                continue
            rec = build_record(rel, full.read_bytes(), st)
            fresh[rel] = (st.st_mtime_ns, st.st_size, rec)
        except Exception as e:  # unreadable / non-utf8 file: skip, never break listings
            logger.warning("Skipping %s: %s", rel, e)
    with _cache_lock:
        _cache[root] = fresh
    return [v[2] for _, v in sorted(fresh.items())]
