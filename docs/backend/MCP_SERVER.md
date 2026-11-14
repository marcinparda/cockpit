# MCP Server

> If you need info about adding MCP tools or resources — read this file.

MCP server mounted at `/mcp` (Streamable HTTP). Auth: `Authorization: Bearer <token>` where token is the static `MCP_API_KEY` or a valid OAuth access token (`src/services/mcp/auth.py`).

Tools registered in `src/services/mcp/tools/`: `budget`, `tasks`, `cv`, `brain`.
Resources registered in `src/services/mcp/resources/`: `brain`.

When adding MCP tools: add a `register_*_tools(mcp)` call in `src/services/mcp/server.py`.

## Brain tools

Brain notes are Markdown files in `BRAIN_NOTES_PATH` (an Obsidian vault). The app only reads/writes files — **no git commit/push/pull anywhere**; syncing is handled outside the app. Tools live in `tools/brain.py`, logic in `src/services/brain/`.

| Tool | Use for |
|---|---|
| `brain_query_notes` | Bulk metadata read: `folder` (recursive prefix), `type`, `tag`, `where` conditions (`eq/neq/in/exists/missing/lt/gt/contains`), `fields` projection, `limit` (default 50, max 500) + `cursor`. Returns `{items, next_cursor, total}` |
| `brain_list_notes` | Same engine, no conditions (kept for compatibility); default fields path/title/type |
| `brain_get_note` | One note: body, `properties` (all frontmatter except title/tags/type/aliases), `version`, timestamp sources |
| `brain_search_notes` | FTS5 over title, body, tags and frontmatter values |
| `brain_resolve` / `brain_get_links` | Obsidian-style link resolution; out/in links incl. links inside frontmatter values |
| `brain_create_note` / `brain_update_note` | Single-note write. `properties` **merge**, `null` = empty value, `remove_properties` deletes keys, `body` replaces whole body |
| `brain_patch_note` | Exact-match body edits, each `old` must occur exactly once |
| `brain_append_to_section` | Append under a markdown heading (e.g. a table row) |
| `brain_batch` | Several ops all-or-nothing |
| `brain_delete_note` | Moves to `.trash/` (recoverable) |

Rules when changing brain code:

- **Every write goes through `service.apply_batch`.** It validates all ops in memory first, re-checks that files did not change on disk, writes via temp file + `os.replace`, and rolls back on any failure. Single-note tools are a batch of one.
- **Lossless frontmatter:** never round-trip frontmatter through a parser/dumper. `frontmatter_io.apply_changes` rewrites only the top-level key blocks whose value changed; all other bytes stay as the user wrote them.
- **Optimistic concurrency:** `version` = first 16 hex chars of sha256 of the file bytes. Writes accept `if_version`; mismatch → `version_conflict` with `current_version` and `current_content` in `details`.
- **Paths:** every user path goes through `brain/paths.py` (rejects absolute, `..`, any dot-segment such as `.git`/`.obsidian`/`.trash`/`.index`, and symlink escapes). `.md` is appended when missing.
- **Errors:** raise `BrainError(code, message, details)`. MCP tools return `{"error": {code, message, details}}` with `isError=true`; REST maps codes to HTTP status (`not_found` 404, `already_exists`/`version_conflict` 409, `invalid_path` 400, else 422).
- **Output:** each tool declares an `outputSchema` (`ToolOut` models in `tools/brain.py`, all fields optional so the error shape validates too) and returns `structuredContent` plus the same compact JSON in the text block.
- **Timestamps:** `created_at` = frontmatter `created`/`created_at`, else file time; `updated_at` = frontmatter `updated`/`updated_at`/`modified`, else file mtime; `created_source`/`updated_source` say which. Writes bump `updated`/`updated_at` only if that key already exists.
- **Types are free strings** (known: `note, concept, tool, person, source, hardware, reference, skill, skill-domain, case, context`). The `brain://notes` resource still treats `context`/`reference` as proactive.
- `.index/search.db` (FTS) lives inside the vault; keep `.index/` in the vault's `.gitignore`.
