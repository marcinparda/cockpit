"""Brain notes service: files in a vault dir. No git logic here — syncing is handled outside the app."""
import asyncio
import base64
import json
import logging
import os
import shutil
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from src.services.brain import body_edit
from src.services.brain import frontmatter_io as fio
from src.services.brain import notes_index
from src.services.brain import search as search_index
from src.services.brain.errors import BrainError, NoteExists, NoteNotFound
from src.services.brain.links import LinkResolver
from src.services.brain.notes_index import NoteRecord, version_of
from src.services.brain.paths import TRASH_DIR, iter_note_files, normalize_folder, resolve_note
from src.services.brain.schemas import (
    Note,
    NoteCreate,
    NoteMeta,
    NoteOp,
    NoteSearchResult,
    NoteUpdate,
    PropertyCondition,
)

logger = logging.getLogger(__name__)

_write_lock = threading.Lock()
RESERVED_KEYS = ("title", "type", "tags", "aliases")
BUILTIN_FIELDS = ("path", "title", "type", "tags", "aliases", "created_at", "created_source",
                  "updated_at", "updated_source", "version")
DEFAULT_FIELDS = ["path", "title", "type"]
DEFAULT_LIMIT = 50
MAX_LIMIT = 500


# ---------------------------------------------------------------- records → schemas

def _to_meta(rec: NoteRecord) -> NoteMeta:
    return NoteMeta(
        path=rec.path, title=rec.title, tags=rec.tags, type=rec.type, aliases=rec.aliases,
        created_at=rec.created_at, updated_at=rec.updated_at,
        created_source=rec.created_source, updated_source=rec.updated_source, version=rec.version,
    )


def _to_note(rec: NoteRecord, text: str) -> Note:
    body = fio.split_document(text).rest.strip()
    return Note(**_to_meta(rec).model_dump(), body=body, properties=rec.properties)


def _read_text(full: Path) -> str | None:
    try:
        return full.read_bytes().decode("utf-8")
    except FileNotFoundError:
        return None
    except UnicodeDecodeError as e:
        raise BrainError("not_text", f"Note is not valid UTF-8: {full.name}", {"error": str(e)}) from e


# ---------------------------------------------------------------- reads

async def get_note(notes_path: str, path: str) -> Note:
    full, rel = resolve_note(notes_path, path)
    text = await asyncio.to_thread(_read_text, full)
    if text is None:
        raise NoteNotFound(rel)
    rec = await asyncio.to_thread(notes_index.read_record, notes_path, rel)
    return _to_note(rec, text)


def _scan(notes_path: str) -> list[NoteRecord]:
    return notes_index.scan(notes_path)


def _in_folder(rel: str, folder: str) -> bool:
    return not folder or rel.startswith(folder + "/")


async def list_notes(notes_path: str, path_filter: str | None, type_filter: str | None, tag_filter: str | None) -> list[NoteMeta]:
    folder = normalize_folder(path_filter or "")
    records = await asyncio.to_thread(_scan, notes_path)
    tag = (tag_filter or "").lstrip("#")
    return [
        _to_meta(r) for r in records
        if _in_folder(r.path, folder) and (not type_filter or r.type == type_filter) and (not tag or tag in r.tags)
    ]


def _builtin(rec: NoteRecord, name: str) -> Any:
    if name in ("created_at", "updated_at"):
        return getattr(rec, name).isoformat()
    return getattr(rec, name)


def _get_field(rec: NoteRecord, name: str) -> tuple[bool, Any]:
    if name in BUILTIN_FIELDS:
        return True, _builtin(rec, name)
    if name in rec.all_props:
        return True, rec.all_props[name]
    return False, None


def _num(v: Any) -> float | None:
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        try:
            return float(v)
        except ValueError:
            return None
    return None


def _compare(actual: Any, expected: Any, op: str) -> bool:
    a, e = _num(actual), _num(expected)
    if a is not None and e is not None and not (isinstance(actual, str) and isinstance(expected, str)):
        return a < e if op == "lt" else a > e
    if isinstance(actual, str) and isinstance(expected, str):
        return actual < expected if op == "lt" else actual > expected
    return False


def _eq(a: Any, b: Any) -> bool:
    """Type-aware equality: 3 == 3.0, but "3" != 3 and True != 1."""
    if isinstance(a, bool) or isinstance(b, bool):
        return isinstance(a, bool) and isinstance(b, bool) and a == b
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return a == b
    return type(a) is type(b) and a == b


def _matches(rec: NoteRecord, cond: PropertyCondition) -> bool:
    present, actual = _get_field(rec, cond.key)
    empty = (not present) or actual is None or actual == "" or actual == []
    op = cond.op
    if op == "exists":
        return not empty
    if op == "missing":
        return empty
    if op == "neq":
        return not present or actual != cond.value
    if not present:
        return False
    if op == "eq":
        return _eq(actual, cond.value)
    if op == "in":
        options = cond.value if isinstance(cond.value, list) else [cond.value]
        if isinstance(actual, list):
            return any(_eq(x, o) for x in actual for o in options)
        return any(_eq(actual, o) for o in options)
    if op == "contains":
        if isinstance(actual, list):
            return cond.value in actual
        return isinstance(actual, str) and str(cond.value).lower() in actual.lower()
    if op in ("lt", "gt"):
        return _compare(actual, cond.value, op)
    return False


def _encode_cursor(after: str) -> str:
    return base64.urlsafe_b64encode(json.dumps({"after": after}).encode()).decode()


def _decode_cursor(cursor: str) -> str:
    try:
        return json.loads(base64.urlsafe_b64decode(cursor.encode()))["after"]
    except Exception as e:
        raise BrainError("invalid_cursor", "Cursor is invalid; restart without a cursor") from e


async def query_notes(
    notes_path: str,
    folder: str | None = None,
    type: str | None = None,
    tag: str | None = None,
    where: list[PropertyCondition] | None = None,
    fields: list[str] | None = None,
    limit: int | None = None,
    cursor: str | None = None,
) -> dict[str, Any]:
    folder_n = normalize_folder(folder or "")
    limit_n = max(1, min(limit or DEFAULT_LIMIT, MAX_LIMIT))
    fields_n = fields or DEFAULT_FIELDS
    tag_n = (tag or "").lstrip("#")
    after = _decode_cursor(cursor) if cursor else None
    records = await asyncio.to_thread(_scan, notes_path)
    matched = [
        r for r in records
        if _in_folder(r.path, folder_n)
        and (not type or r.type == type)
        and (not tag_n or tag_n in r.tags)
        and all(_matches(r, c) for c in (where or []))
    ]
    page = [r for r in matched if after is None or r.path > after][:limit_n + 1]
    has_more = len(page) > limit_n
    page = page[:limit_n]
    items = []
    for r in page:
        row: dict[str, Any] = {"path": r.path}
        for f in fields_n:
            row[f] = _get_field(r, f)[1]
        items.append(row)
    return {
        "items": items,
        "next_cursor": _encode_cursor(page[-1].path) if has_more and page else None,
        "total": len(matched),
    }


async def list_folders(notes_path: str) -> list[str]:
    def work() -> list[str]:
        folders = set()
        for _full, rel in iter_note_files(notes_path):
            if "/" in rel:
                folders.add(rel.rsplit("/", 1)[0])
        return sorted(folders)

    return await asyncio.to_thread(work)


# ---------------------------------------------------------------- link graph

def _resolver(records: list[NoteRecord]) -> LinkResolver:
    return LinkResolver((r.path, r.title, r.aliases) for r in records)


async def resolve_link(notes_path: str, link: str, from_path: str | None = None) -> dict[str, Any]:
    records = await asyncio.to_thread(_scan, notes_path)
    res = _resolver(records).resolve(link, from_path)
    by_path = {r.path: r for r in records}
    return {
        "link": link,
        "path": res.path,
        "title": by_path[res.path].title if res.path else None,
        "resolved_by": res.resolved_by,
        "ambiguous": res.ambiguous,
        "matches": res.matches,
    }


async def get_links(notes_path: str, path: str, direction: str = "both") -> dict[str, Any]:
    if direction not in ("out", "in", "both"):
        raise BrainError("invalid_op", "direction must be 'out', 'in' or 'both'", {"direction": direction})
    _full, rel = resolve_note(notes_path, path)
    records = await asyncio.to_thread(_scan, notes_path)
    by_path = {r.path: r for r in records}
    if rel not in by_path:
        raise NoteNotFound(rel)
    resolver = _resolver(records)
    out: list[dict[str, Any]] = []
    incoming: list[dict[str, Any]] = []
    if direction in ("out", "both"):
        seen = set()
        for link in by_path[rel].links:
            key = (link.target, link.heading, link.source)
            if key in seen:
                continue
            seen.add(key)
            res = resolver.resolve(link.target, rel)
            out.append({**link.to_dict(), "resolved_path": res.path, "resolved_by": res.resolved_by, "ambiguous": res.ambiguous})
    if direction in ("in", "both"):
        for rec in records:
            if rec.path == rel:
                continue
            seen = set()
            for link in rec.links:
                key = (link.target, link.heading, link.source)
                if key in seen:
                    continue
                if resolver.resolve(link.target, rec.path).path == rel:
                    seen.add(key)
                    incoming.append({"from_path": rec.path, "from_title": rec.title, **link.to_dict()})
    return {"path": rel, "outgoing": out, "incoming": incoming}


# ---------------------------------------------------------------- writes (atomic batch)

def _check_version(op: NoteOp, text: str, rel: str) -> None:
    if op.if_version and op.if_version != version_of(text):
        raise BrainError(
            "version_conflict",
            f"{rel} changed since you read it (yours {op.if_version}, current {version_of(text)}). Re-read and redo the edit.",
            {"path": rel, "current_version": version_of(text), "your_version": op.if_version, "current_content": text},
        )


def _bump_updated(text: str, set_props: dict[str, Any]) -> dict[str, Any]:
    parts = fio.split_document(text)
    if not parts.has_fm:
        return set_props
    try:
        existing = fio.parse_properties(parts.fm)
    except BrainError:
        return set_props
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    for key in ("updated", "updated_at"):
        if key in existing and key not in set_props:
            return {**set_props, key: now}
    return set_props


def _validate_props(props: dict[str, Any] | None) -> dict[str, Any]:
    props = props or {}
    clash = [k for k in props if k in RESERVED_KEYS]
    if clash:
        raise BrainError("invalid_op", f"Use the dedicated parameters for {clash}, not properties", {"keys": clash})
    return props


def _new_note_text(op: NoteOp) -> str:
    if op.title is None or op.body is None:
        raise BrainError("invalid_op", "create requires title and body")
    props = _validate_props(op.properties)
    base: dict[str, Any] = {"title": op.title, "type": op.type or "note", "tags": op.tags or [], "aliases": op.aliases or []}
    if "created" not in props and "created_at" not in props:
        base["created"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    return fio.update_text("", {**base, **props}, [], op.body)


def _edit_text(op: NoteOp, text: str) -> str:
    set_props = _validate_props(op.properties)
    remove = list(op.remove_properties or [])
    if op.op == "update":
        direct = {k: v for k, v in (("title", op.title), ("type", op.type), ("tags", op.tags), ("aliases", op.aliases)) if v is not None}
        set_props = {**direct, **set_props}
        new = fio.update_text(text, set_props, remove, op.body)
    elif op.op == "patch":
        if not op.edits:
            raise BrainError("invalid_op", "patch requires a non-empty edits list")
        new = body_edit.patch_body(text, [(e.old, e.new) for e in op.edits])
        new = fio.update_text(new, set_props, remove, None)
    else:  # append
        if op.heading is None or op.text is None:
            raise BrainError("invalid_op", "append requires heading and text")
        new = body_edit.append_to_section(text, op.heading, op.text)
        new = fio.update_text(new, set_props, remove, None)
    if new != text:
        bumped = _bump_updated(new, {})
        if bumped:
            new = fio.update_text(new, bumped, [], None)
    return new


def _atomic_write(full: Path, data: bytes) -> None:
    tmp = full.with_name(f".{full.name}.tmp-{uuid.uuid4().hex[:8]}")
    try:
        tmp.write_bytes(data)
        os.replace(tmp, full)
    finally:
        if tmp.exists():
            tmp.unlink()


def _trash_destination(root: str, rel: str) -> Path:
    dest = Path(root) / TRASH_DIR / rel
    if dest.exists():
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        dest = dest.with_name(f"{dest.stem} {stamp}{dest.suffix}")
    return dest


def _apply_ops_sync(root: str, ops: list[NoteOp]) -> list[dict[str, Any]]:
    if not ops:
        raise BrainError("invalid_op", "ops is empty")
    with _write_lock:
        original: dict[str, str | None] = {}
        overlay: dict[str, str | None] = {}
        fulls: dict[str, Path] = {}
        results: list[dict[str, Any]] = []
        for i, op in enumerate(ops):
            try:
                full, rel = resolve_note(root, op.path)
                fulls[rel] = full
                if rel in overlay:
                    cur = overlay[rel]
                else:
                    cur = _read_text(full)
                    original[rel] = cur
                if op.op == "create":
                    if cur is not None:
                        raise NoteExists(rel)
                    new: str | None = _new_note_text(op)
                    results.append({"op": "create", "path": rel})
                else:
                    if cur is None:
                        raise NoteNotFound(rel)
                    _check_version(op, cur, rel)
                    if op.op == "delete":
                        new = None
                        results.append({"op": "delete", "path": rel, "trashed_to": None})
                    else:
                        new = _edit_text(op, cur)
                        results.append({"op": op.op, "path": rel})
                overlay[rel] = new
                results[-1]["version"] = version_of(new) if new is not None else None
            except BrainError as e:
                # keep the exception class (NoteNotFound/NoteExists stay FileNotFoundError/FileExistsError for REST)
                e.message = f"Operation #{i} ({op.op} {op.path}) failed: {e.message} No changes were written."
                e.details = {**e.details, "op_index": i, "op": op.op, "path": op.path}
                e.args = (e.message,)
                raise

        for rel, text in original.items():  # last-moment check: file untouched since we read it
            now = _read_text(fulls[rel])
            if now != text:
                raise BrainError(
                    "version_conflict",
                    f"{rel} was modified on disk while the batch was running. No changes were written.",
                    {"path": rel, "current_version": version_of(now) if now is not None else None, "current_content": now},
                )

        journal: list[tuple[str, Path, Any]] = []
        try:
            for rel, text in overlay.items():
                if original.get(rel) == text:
                    continue
                full = fulls[rel]
                if text is None:
                    dest = _trash_destination(root, rel)
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(full), str(dest))
                    journal.append(("move", dest, full))
                    for r in results:
                        if r["op"] == "delete" and r["path"] == rel:
                            r["trashed_to"] = str(dest.relative_to(root))
                else:
                    full.parent.mkdir(parents=True, exist_ok=True)
                    _atomic_write(full, text.encode("utf-8"))
                    journal.append(("write", full, original[rel]))
        except Exception as e:
            for kind, target, extra in reversed(journal):
                try:
                    if kind == "move":
                        shutil.move(str(target), str(extra))
                    elif extra is None:
                        target.unlink(missing_ok=True)
                    else:
                        _atomic_write(target, extra.encode("utf-8"))
                except Exception:
                    logger.exception("Rollback step failed for %s", target)
            raise BrainError("write_failed", f"Writing failed and was rolled back: {e}", {"error": str(e)}) from e
        for rel in overlay:
            notes_index.invalidate(root, rel)
        return results


def _props_text(props: dict[str, Any]) -> str:
    out: list[str] = []

    def walk(v: Any) -> None:
        if isinstance(v, dict):
            for x in v.values():
                walk(x)
        elif isinstance(v, list):
            for x in v:
                walk(x)
        elif v is not None:
            out.append(str(v).replace("[[", " ").replace("]]", " "))

    walk(props)
    return " ".join(out)


async def _reindex(notes_path: str, results: list[dict[str, Any]]) -> None:
    for r in results:
        try:
            if r["op"] == "delete":
                await search_index.delete_note(notes_path, r["path"])
                continue
            note = await get_note(notes_path, r["path"])
            await search_index.upsert_note(notes_path, {
                "path": note.path, "title": note.title, "body": note.body, "tags": note.tags,
                "type": note.type, "props": _props_text(note.properties),
            })
        except Exception as e:
            logger.warning("search reindex failed for %s: %s", r["path"], e)


async def apply_batch(notes_path: str, ops: list[NoteOp]) -> list[dict[str, Any]]:
    """All-or-nothing: validate every op, then write; on any failure nothing is left changed."""
    results = await asyncio.to_thread(_apply_ops_sync, notes_path, ops)
    await _reindex(notes_path, results)
    return results


async def create_note(notes_path: str, path: str, content: NoteCreate) -> Note:
    op = NoteOp(op="create", path=path, title=content.title, body=content.body, type=content.type,
                tags=content.tags, aliases=content.aliases, properties=content.properties or None)
    results = await apply_batch(notes_path, [op])
    return await get_note(notes_path, results[0]["path"])


async def update_note(notes_path: str, path: str, content: NoteUpdate) -> Note:
    op = NoteOp(op="update", path=path, **content.model_dump())
    results = await apply_batch(notes_path, [op])
    return await get_note(notes_path, results[0]["path"])


async def patch_note(notes_path: str, path: str, edits: list[dict[str, str]], if_version: str | None = None,
                     properties: dict[str, Any] | None = None, remove_properties: list[str] | None = None) -> Note:
    op = NoteOp(op="patch", path=path, edits=edits, if_version=if_version, properties=properties, remove_properties=remove_properties)
    results = await apply_batch(notes_path, [op])
    return await get_note(notes_path, results[0]["path"])


async def append_to_section(notes_path: str, path: str, heading: str, text: str, if_version: str | None = None) -> Note:
    op = NoteOp(op="append", path=path, heading=heading, text=text, if_version=if_version)
    results = await apply_batch(notes_path, [op])
    return await get_note(notes_path, results[0]["path"])


async def delete_note(notes_path: str, path: str, if_version: str | None = None) -> dict[str, Any]:
    results = await apply_batch(notes_path, [NoteOp(op="delete", path=path, if_version=if_version)])
    return results[0]


# ---------------------------------------------------------------- search

async def search_notes(notes_path: str, query: str, type_filter: str | None, tag_filter: str | None) -> list[NoteSearchResult]:
    rows = await search_index.search(notes_path, query, type_filter, tag_filter)
    results = []
    for row in rows:
        try:
            note = await get_note(notes_path, row["path"])
            results.append(NoteSearchResult(**note.model_dump(exclude={"body", "properties"}), excerpt=row["excerpt"]))
        except Exception:
            pass
    return results


async def rebuild_search_index(notes_path: str) -> None:
    def work() -> list[dict[str, Any]]:
        notes = []
        for full, rel in iter_note_files(notes_path):
            try:
                data = full.read_bytes()
                rec = notes_index.build_record(rel, data, full.stat())
                body = fio.split_document(data.decode("utf-8")).rest
                notes.append({"path": rec.path, "title": rec.title, "body": body, "tags": rec.tags,
                              "type": rec.type, "props": _props_text(rec.properties)})
            except Exception as e:
                logger.warning("Skipping %s during index rebuild: %s", rel, e)
        return notes

    notes = await asyncio.to_thread(work)
    await search_index.rebuild_index(notes_path, notes)
    logger.info("Search index rebuilt with %d notes", len(notes))
