import functools
import json
from collections.abc import Awaitable, Callable
from datetime import datetime
from typing import Any

from mcp.server.fastmcp import FastMCP
from mcp.types import CallToolResult, TextContent, ToolAnnotations
from pydantic import BaseModel, ValidationError

from src.services.brain.errors import BrainError
from src.services.brain.json_types import JsonMap, JsonPayload, as_json_list
from src.services.brain.schemas import Edit, Note, NoteOp, PropertyCondition


class ErrorBody(BaseModel):
    """Error payload shared by every brain tool result."""
    code: str
    message: str
    details: dict[str, JsonPayload] = {}


class ToolOut(BaseModel):
    """Every brain tool returns this shape on failure: {"error": {code, message, details}} with isError=true."""

    error: ErrorBody | None = None


class NoteOut(ToolOut):
    """A note (mirrors the `Note` schema); every field is optional so the error shape validates against the same schema."""

    path: str | None = None
    title: str | None = None
    tags: list[str] | None = None
    type: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    aliases: list[str] | None = None
    created_source: str | None = None
    updated_source: str | None = None
    version: str | None = None
    body: str | None = None
    properties: dict[str, JsonPayload] | None = None


class QueryOut(ToolOut):
    """Result of brain_query_notes / brain_list_notes: one page of items."""
    items: list[dict[str, JsonPayload]] | None = None
    next_cursor: str | None = None
    total: int | None = None


class SearchOut(ToolOut):
    items: list[dict[str, JsonPayload]] | None = None


class FoldersOut(ToolOut):
    folders: list[str] | None = None


class DeleteOut(ToolOut):
    success: bool | None = None
    path: str | None = None
    trashed_to: str | None = None


class BatchOut(ToolOut):
    results: list[dict[str, JsonPayload]] | None = None


class ResolveOut(ToolOut):
    link: str | None = None
    path: str | None = None
    title: str | None = None
    resolved_by: str | None = None
    ambiguous: bool | None = None
    matches: list[str] | None = None


class LinksOut(ToolOut):
    path: str | None = None
    outgoing: list[dict[str, JsonPayload]] | None = None
    incoming: list[dict[str, JsonPayload]] | None = None


def _ok(data: JsonMap) -> Any:  # Any: returns CallToolResult, but tools are annotated with their output model so FastMCP derives outputSchema
    # Full compact JSON in the text block too: MCP clients that ignore structuredContent still get the data.
    """Success result: structuredContent plus the same compact JSON in the text block (for clients that ignore structuredContent)."""
    return CallToolResult(
        content=[TextContent(type="text", text=json.dumps(data, separators=(",", ":"), ensure_ascii=False, default=str))],
        structuredContent=data,
        isError=False,
    )


def _err(exc: BrainError) -> CallToolResult:
    """Failure result: `{error: {code, message, details}}` with isError=true."""
    data = {"error": exc.to_dict()}
    return CallToolResult(
        content=[TextContent(type="text", text=json.dumps(data, separators=(",", ":"), ensure_ascii=False, default=str))],
        structuredContent=data,
        isError=True,
    )


def _safe[**P](fn: Callable[P, Awaitable[Any]]) -> Callable[P, Awaitable[Any]]:
    """Decorator: turn BrainError and validation errors into structured error results instead of raising."""

    @functools.wraps(fn)
    async def wrapper(*args: P.args, **kwargs: P.kwargs) -> Any:  # Any: see _ok
        """Run the tool, mapping errors to results."""
        try:
            return await fn(*args, **kwargs)
        except BrainError as e:
            return _err(e)
        except ValidationError as e:
            return _err(BrainError("invalid_op", "Invalid arguments", {"errors": json.loads(e.json())}))

    return wrapper


READ = ToolAnnotations(readOnlyHint=True, openWorldHint=False)


def _write(destructive: bool, idempotent: bool) -> ToolAnnotations:
    """Annotations for a write tool (destructive / idempotent hints)."""
    return ToolAnnotations(readOnlyHint=False, destructiveHint=destructive, idempotentHint=idempotent, openWorldHint=False)


def register_brain_tools(mcp: FastMCP) -> None:
    """Register every brain_* tool on `mcp`."""
    from src.services.brain import service as brain_service
    from src.services.brain.schemas import NoteCreate, NoteUpdate
    from src.core.config import settings

    root = lambda: settings.BRAIN_NOTES_PATH  # noqa: E731

    def note_data(note: Note) -> dict[str, JsonPayload]:
        """Note → JSON-safe dict for structuredContent."""
        return note.model_dump(mode="json")

    @mcp.tool(annotations=READ)
    @_safe
    async def brain_search_notes(query: str, type_filter: str | None = None, tag_filter: str | None = None) -> QueryOut:
        """Full-text search over note title, body, tags and frontmatter values. Returns up to 100 notes with excerpts, best match first.

        Use brain_query_notes instead when you need exact metadata filters (levels, priority, folder).

        Args:
            query: Search terms. Plain words work; special characters are handled.
            type_filter: Only notes of this type (free string, e.g. 'skill', 'concept', 'tool', 'person', 'source', 'hardware', 'reference', 'note', 'case').
            tag_filter: Only notes having this tag.
        """
        results = await brain_service.search_notes(root(), query, type_filter, tag_filter)
        return _ok({"items": [r.model_dump(mode="json") for r in results]})

    @mcp.tool(annotations=READ)
    @_safe
    async def brain_get_note(path: str) -> NoteOut:
        """Read one note: body, all frontmatter `properties` (every key except title/tags/type/aliases) and `version`.

        Pass the returned `version` as `if_version` when you later write this note, so you never overwrite edits made in Obsidian meanwhile.

        Args:
            path: Vault-relative path, e.g. 'programming/knowledge base/skill graph/SSE (skill).md'. '.md' is optional.
        """
        return _ok(note_data(await brain_service.get_note(root(), path)))

    @mcp.tool(annotations=READ)
    @_safe
    async def brain_query_notes(
        folder: str | None = None,
        type: str | None = None,
        tag: str | None = None,
        where: list[PropertyCondition] | None = None,
        fields: list[str] | None = None,
        limit: int = 50,
        cursor: str | None = None,
    ) -> QueryOut:
        """Bulk-read note metadata filtered by folder, type, tag and frontmatter conditions — one call instead of N brain_get_note calls.

        Returns {items, next_cursor, total}. Pass next_cursor back as `cursor` for the next page. Sorted by path.
        Each item has `path` plus the requested `fields` (default: title, type). `fields` may name built-ins
        (title, type, tags, aliases, created_at, updated_at, version) or any frontmatter key (e.g. claimed_level, requires).
        `where` conditions are ANDed; each is {key, op, value}: ops eq, neq, in (value is a list), exists, missing (null/empty counts as missing),
        lt, gt (numbers or ISO dates/strings), contains (list membership or substring). Numbers compare as numbers, "3" != 3.

        Example — all skills with their levels:
        {"folder": "programming/knowledge base/skill graph", "type": "skill",
         "fields": ["claimed_level", "current_level", "target_level", "priority", "requires"],
         "where": [{"key": "needs_recheck", "op": "eq", "value": true}], "limit": 200}

        Args:
            folder: Folder prefix, recursive (e.g. 'programming/knowledge base'). Omit for the whole vault.
            type: Exact note type.
            tag: Tag (with or without '#').
            where: Property conditions.
            fields: Fields to return per item.
            limit: Page size, default 50, max 500.
            cursor: Opaque cursor from a previous call.
        """
        return _ok(await brain_service.query_notes(root(), folder, type, tag, where, fields, limit, cursor))

    @mcp.tool(annotations=READ)
    @_safe
    async def brain_list_notes(
        path_filter: str | None = None,
        type_filter: str | None = None,
        tag_filter: str | None = None,
        limit: int = 50,
        cursor: str | None = None,
        fields: list[str] | None = None,
    ) -> QueryOut:
        """List notes (metadata only, paginated). Same engine as brain_query_notes without property conditions.

        Returns {items, next_cursor, total}; default fields are path, title, type — ask for more via `fields`.

        Args:
            path_filter: Folder prefix, recursive (e.g. 'health').
            type_filter: Exact note type (free string, e.g. 'skill', 'concept', 'note').
            tag_filter: Tag.
            limit: Page size, default 50, max 500.
            cursor: Cursor from a previous call.
            fields: Fields to return per item (built-ins or frontmatter keys).
        """
        return _ok(await brain_service.query_notes(root(), path_filter, type_filter, tag_filter, None, fields, limit, cursor))

    @mcp.tool(annotations=READ)
    @_safe
    async def brain_list_folders() -> FoldersOut:
        """List all folders in the vault that contain notes."""
        return _ok({"folders": as_json_list(await brain_service.list_folders(root()))})

    @mcp.tool(annotations=READ)
    @_safe
    async def brain_resolve(link: str, from_path: str | None = None) -> ResolveOut:
        """Resolve a wikilink, title or alias to a note path the way Obsidian does (shortest path wins).

        Accepts '[[SSE (skill)]]', 'SSE (skill)', 'folder/SSE (skill)', '[[Note#Heading|alias]]' — heading and alias parts are ignored.
        Order: path, file name, alias, title. `ambiguous` is true when several notes match; `matches` lists them best first.

        Example: {"link": "[[SSE (skill)]]"} → {"path": "programming/.../SSE (skill).md", "resolved_by": "basename"}

        Args:
            link: Wikilink text, title or alias.
            from_path: Optional note the link appears in; same-folder notes win ties.
        """
        return _ok(await brain_service.resolve_link(root(), link, from_path))

    @mcp.tool(annotations=READ)
    @_safe
    async def brain_get_links(path: str, direction: str = "both") -> LinksOut:
        """Link graph of one note, including links inside frontmatter properties (requires, evidence, used_with...), not only the body.

        `outgoing`: links in this note, each with resolved_path (null = unresolved) and `source` ('body' or 'frontmatter:<key>').
        `incoming`: backlinks — notes linking here, with from_path and source. Use for prerequisites (outgoing 'requires') and dependents (incoming).

        Args:
            path: Note path.
            direction: 'out', 'in' or 'both' (default).
        """
        return _ok(await brain_service.get_links(root(), path, direction))

    @mcp.tool(annotations=_write(destructive=False, idempotent=False))
    @_safe
    async def brain_create_note(
        path: str,
        title: str,
        body: str,
        type: str = "note",
        tags: list[str] | None = None,
        aliases: list[str] | None = None,
        properties: dict[str, JsonPayload] | None = None,
    ) -> NoteOut:
        """Create a note file. Fails with already_exists if the path is taken. Only saves the file (no git commit/push).

        `properties` are extra frontmatter keys, e.g. {"claimed_level": 2, "requires": ["[[HTTP (skill)]]"]}; null becomes empty YAML.
        To create several notes atomically use brain_batch.

        Args:
            path: Vault-relative path, e.g. 'health/new-note.md'.
            title: Note title.
            body: Markdown body.
            type: Free string, e.g. note, concept, tool, person, source, hardware, reference, skill, skill-domain, case, context.
            tags: Tags.
            aliases: Aliases.
            properties: Extra frontmatter keys (not title/type/tags/aliases).
        """
        content = NoteCreate(title=title, body=body, type=type, tags=tags or [], aliases=aliases or [], properties=properties or {})
        return _ok(note_data(await brain_service.create_note(root(), path, content)))

    @mcp.tool(annotations=_write(destructive=True, idempotent=True))
    @_safe
    async def brain_update_note(
        path: str,
        title: str | None = None,
        body: str | None = None,
        type: str | None = None,
        tags: list[str] | None = None,
        aliases: list[str] | None = None,
        properties: dict[str, JsonPayload] | None = None,
        remove_properties: list[str] | None = None,
        if_version: str | None = None,
    ) -> NoteOut:
        """Update a note. Only the fields you pass change; every other frontmatter key and byte is preserved.

        properties MERGE into the frontmatter (keys you don't mention stay untouched; null sets an empty value);
        remove_properties deletes keys. Passing `body` REPLACES the whole body — prefer brain_patch_note (edit a passage)
        or brain_append_to_section (add a table row) for body changes; use brain_batch to change several notes atomically.
        Pass `if_version` (from brain_get_note) to fail with version_conflict instead of overwriting concurrent edits.
        Only saves the file (no git commit/push).

        Example: {"path": "x/SSE (skill).md", "properties": {"current_level": 3, "last_verified": "2026-11-13"}, "if_version": "ab12..."}

        Args:
            path: Note path.
            title: New title.
            body: New full body (replaces everything).
            type: New type.
            tags: New tags (replaces the list).
            aliases: New aliases (replaces the list).
            properties: Frontmatter keys to set/merge.
            remove_properties: Frontmatter keys to delete.
            if_version: Version you read; write is rejected if the note changed since.
        """
        content = NoteUpdate(title=title, body=body, type=type, tags=tags, aliases=aliases,
                             properties=properties, remove_properties=remove_properties, if_version=if_version)
        return _ok(note_data(await brain_service.update_note(root(), path, content)))

    @mcp.tool(annotations=_write(destructive=True, idempotent=False))
    @_safe
    async def brain_patch_note(
        path: str,
        edits: list[Edit],
        if_version: str | None = None,
        properties: dict[str, JsonPayload] | None = None,
        remove_properties: list[str] | None = None,
    ) -> NoteOut:
        """Edit part of a note's body by exact text replacement — no need to resend the whole note.

        Each edit {old, new}: `old` must match the body exactly ONCE (else the whole patch fails, nothing is written,
        and the error lists every failing edit with reason not_found/ambiguous). Edits apply in order.
        Optionally merge `properties` in the same write. Only saves the file (no git commit/push).

        Example: {"path": "a.md", "edits": [{"old": "status: TODO", "new": "status: done"}]}

        Args:
            path: Note path.
            edits: List of {old, new}.
            if_version: Version you read; reject if changed.
            properties: Frontmatter keys to merge in the same write.
            remove_properties: Frontmatter keys to delete.
        """
        return _ok(note_data(await brain_service.patch_note(
            root(), path, edits, if_version, properties, remove_properties)))

    @mcp.tool(annotations=_write(destructive=False, idempotent=False))
    @_safe
    async def brain_append_to_section(path: str, heading: str, text: str, if_version: str | None = None) -> NoteOut:
        """Append text under a markdown heading, after the section's last non-blank line (e.g. add a row to a table).

        Heading match is case-insensitive; include '#' marks ('## Verification log') to pin the level. Fails with section_not_found
        (listing available headings) or ambiguous_section. Only saves the file (no git commit/push).

        Example: {"path": "x/SSE (skill).md", "heading": "## Verification log", "text": "| 2026-11-13 | 3 | solid |"}

        Args:
            path: Note path.
            heading: Heading text, optionally with leading '#'s.
            text: Text to append (one or more lines).
            if_version: Version you read; reject if changed.
        """
        return _ok(note_data(await brain_service.append_to_section(root(), path, heading, text, if_version)))

    @mcp.tool(annotations=_write(destructive=True, idempotent=False))
    @_safe
    async def brain_delete_note(path: str, if_version: str | None = None) -> DeleteOut:
        """Delete a note by moving it to the vault's `.trash/` folder (Obsidian-style, recoverable). Only saves files (no git).

        Args:
            path: Note path.
            if_version: Version you read; reject if changed.
        """
        r = await brain_service.delete_note(root(), path, if_version)
        return _ok({"success": True, "path": r["path"], "trashed_to": r["trashed_to"]})

    @mcp.tool(annotations=_write(destructive=True, idempotent=False))
    @_safe
    async def brain_batch(ops: list[NoteOp]) -> BatchOut:
        """Apply several note operations ALL-OR-NOTHING: every op is validated first and files are written only if all succeed
        (rolled back on any write failure). Ops run in order, so later ops see earlier ones (e.g. create then append).
        Only saves files (no git commit/push). Use this for multi-note changes instead of many single calls.

        Each op: {op: create|update|patch|append|delete, path, ...}. Fields per op:
        create: title, body, [type, tags, aliases, properties] | update: [title, body, type, tags, aliases, properties, remove_properties]
        patch: edits=[{old,new}] | append: heading, text | delete: —. update/patch/append also accept properties/remove_properties;
        all non-create ops accept if_version. properties merge (null = empty value).
        On failure the error details name the failing `op_index` and, for version_conflict, the current version and content.

        Example — a verification session in one atomic call:
        [{"op":"update","path":"s/SSE (skill).md","properties":{"current_level":3,"last_verified":"2026-11-13"},"if_version":"ab12"},
         {"op":"append","path":"s/SSE (skill).md","heading":"## Verification log","text":"| 2026-11-13 | 3 |"},
         {"op":"update","path":"s/HTTP (skill).md","properties":{"needs_recheck":true,"recheck_reason":"SSE probe"}}]

        Args:
            ops: Operations, applied in order.
        """
        results = await brain_service.apply_batch(root(), ops)
        return _ok({"results": as_json_list(results)})
