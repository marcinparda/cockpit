# Work log — brain MCP tools for structured Obsidian notes

Goal: make `brain_*` MCP tools usable by agents for a skill graph (custom frontmatter, bulk query, link graph, atomic multi-note edits). Branch `feat/brain-mcp-structured-notes`, nothing committed. Docs: [`docs/backend/MCP_SERVER.md`](../../../backend/MCP_SERVER.md).

## Decisions taken (user asleep; defaults assumed)

Given by the user: add `ruamel.yaml`; **no git logic at all** (no commit/push/pull — writes only save files); OAuth/auth hardening is a separate task; work unattended and list assumptions.

Assumed by me:

1. "One commit" requirement became "one atomic file write": batch is all-or-nothing with rollback.
2. Delete moves to `.trash/` (user preference stated), name collisions get a timestamp suffix.
3. `created`/`updated` sources without git: frontmatter → file time (`min(mtime, ctime)`) / mtime. File time is still unreliable after sync; only a frontmatter `created` is stable. New notes created through the API get a `created` key.
4. Text block of every tool result = full compact JSON (not a short summary), because clients that ignore `structuredContent` would otherwise see no data.
5. `brain_list_notes` / `brain_search_notes` return `{items, …}` instead of a bare list (required to fix the "stream of objects" problem) — **breaking for callers that expected a list**. Errors changed from `{"error": "string"}` to `{"error": {code, message, details}}` + `isError`.
6. `brain_list_notes` default fields are `path,title,type` (context saving) instead of full metadata; default limit 50.
7. Version = 16 hex chars of sha256 over file bytes.
8. Date-like strings (`2026-11-13`) are written unquoted so Obsidian shows Date properties; datetimes are written in YAML timestamp form (space separator).
9. Updating a note bumps `updated`/`updated_at` only when that key already exists (legacy notes from the old API have `updated_at`).
10. `properties` may not contain `title/type/tags/aliases` (dedicated params) → `invalid_op`.
11. Any path segment starting with `.` is rejected for reads and writes (covers `.git`, `.obsidian`, `.trash`, `.index`); dot-dirs are skipped in listings.
12. `.md` suffix is now appended (old code used `with_suffix`, which turned `Node.js` into `Node.md`).
13. FTS index gained a `props` column (frontmatter values); old index schema is dropped and rebuilt at startup. Search results ordered by rank, max 100. FTS syntax errors fall back to quoted terms instead of failing.
14. Link resolution order: path suffix → file name → alias → title; ties: same folder as `from_path`, then fewest segments, then alphabetical.
15. `brain_query_notes` extra op `contains`; `null`/empty/missing all count as "missing".
16. REST router untouched except a `BrainError` → HTTP handler in `main.py`; new fields flow in via shared schemas.

## Follow-up: typing and docstrings (PR review)

- Replaced `Any` in `links.py`, `frontmatter_io.py`, `errors.py`, `notes_index.py` and `service.py` with recursive `JsonValue`/`JsonMap` aliases (`brain/json_types.py`, PEP 695). mypy on the brain package went from errors to clean, except `router.py:41` (existed before this work, FastAPI `= ...` default idiom).
- `Any` remains only as `JsonPayload` (pydantic/MCP-facing schemas and tool signatures), because pydantic renders the recursive alias as `$defs/$ref` in every tool schema; the reason is commented at its definition. `_ok`/`_safe` return `Any` with a comment (tools are annotated with their output model so FastMCP derives `outputSchema`, but return `CallToolResult`).
- `NoteOut` is now an explicit class instead of `create_model`.
- `patch_note` takes `list[Edit]`.
- New standards: "Avoid `Any`" in `docs/standards/backend/python.md`, "Docstring every function whose name isn't explicit" in `docs/standards/global/commenting.md`. Applied to every function/class in the PR's brain modules and MCP tool file (AST check: only `__init__`, `get_note`, `list_notes`, `list_folders`, `create_note`, `append_to_section`, `search_notes`, `NoteCreate`, `FolderTree` have none, by the "explicit name" exemption).

## Check and report (answers)

- **Auth on `/mcp`:** Bearer token = static `MCP_API_KEY` (`==` compare, not constant time) or OAuth access token (PKCE S256, exact redirect_uri match, expiry/revocation checked). Weak points (NOT changed, separate task): open dynamic client registration (`POST /oauth/clients`, no auth); login form interpolates `state/scope/client_id/redirect_uri` unescaped into HTML (reflected XSS) and `state` is not URL-encoded in the redirect; `/oauth/authorize` password attempts only get the generic 100/min rate limit; OAuth tokens are not scope-limited and MCP ignores the per-feature permissions the REST API enforces, so any valid token reaches finances, tasks and notes; access tokens appear to be looked up by raw value (likely stored unhashed — not verified).
- **Path safety:** was absent (absolute paths and `..` escaped the vault: arbitrary `.md` read/write/delete). Fixed, tested incl. symlink escapes.
- **Delete:** was hard `unlink`; now `.trash/`.
- **Git/sync:** old code committed/pushed in a fire-and-forget task and swallowed push errors; nothing ever pulled. Removed per user decision. Concurrent edits are now guarded by `if_version` and a last-moment on-disk re-check; an edit made in Obsidian/Syncthing during a batch aborts it with `version_conflict`. Syncthing conflict files (`*.sync-conflict-*`) are ordinary notes to this code.
- **Search:** FTS5 over title/body/tags, now plus frontmatter values. 1000 notes × ~1 KB: index rebuild 0.84 s (startup), FTS query ~10 ms, end-to-end `search_notes` 8 ms.
- **Other tool groups (not changed):** `actual_*`, `vikunja_*`, CV tools all return `Any` (no `outputSchema`/`structuredContent`), have no annotations (read-only/destructive hints missing, incl. `*_delete_*`), return lists as multiple content blocks, signal failures via raised `raise_for_status()` exceptions (generic text) except `vikunja_get_tasks` which returns `{"error": …}`. Pagination: `vikunja_get_tasks` has `page/per_page`; `actual_search_transactions`, `actual_list_categories/payees/accounts`, `vikunja_list_*` are unbounded.

## Things found that were not asked for

- Old `create/update` wrote `created_at`/`updated_at` into every note's frontmatter (polluting Obsidian properties).
- `.index/search.db` sat inside the vault and was swept up by the old `git add -A` — keep `.index/` in the vault `.gitignore` now that you commit by hand.
- Vault files with invalid YAML are listed (with defaults) instead of breaking listings; writes to them touching frontmatter fail with `invalid_frontmatter`.
- Startup `rebuild_search_index` runs on the event loop thread pool now (no longer blocks).

## Verification

- 400 tests pass, total coverage 83.6% (gate 80%). New: frontmatter round-trip fixture, patch/append, batch atomicity (mid-write failure rollback, external edit detected, create+delete, invalid path), concurrency, path safety, query, links, search, REST status mapping, MCP in-memory client (schemas, annotations, structured results, errors, skill-graph session).
- MCP Inspector CLI against a real HTTP server with Bearer auth: tools/list, query (levels + requires), resolve, one 3-op batch (update + append row + flag prerequisite; files verified on disk, other frontmatter byte-identical), traversal path → structured `invalid_path`.
- Timings (1000 notes): cold query 0.78 s, warm 0.02 s, backlinks 0.04 s.

## Follow-ups

- Auth hardening task (see above).
- Optional: apply the same structured-output/annotation treatment to `actual_*`, `vikunja_*`, CV tools.
- Optional: REST endpoints for query/links/batch (only MCP exposes them today).
