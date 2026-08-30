# docs/

All project documentation lives here, one tree, no per-module doc folders.

**Read [`CONTRIBUTING.md`](CONTRIBUTING.md) first** — where new docs belong and how folders are sliced.

## Folders

Every folder below has its own `AGENTS.md` pointer index — read that first when entering the folder.

- [`standards/`](standards/AGENTS.md) — coding conventions, "how to write code here" (global, frontend, backend, testing).
- [`projects/`](projects/AGENTS.md) — facts about each app/service (purpose, ports, stack): `cockpit`, `cv`, `habits`, `login`, `store`, `litellm`, `actual`, `vikunja`.
- [`backend/`](backend/AGENTS.md) — `cockpit-api`-specific reference: architecture, MCP server, upstream API specs, dev commands.
- [`deployment/`](deployment/AGENTS.md) — CI/CD, production stack, GitHub secrets — repo-wide deployment mechanics.
- [`tasks/`](tasks/AGENTS.md) — per-task history (`spec.md` → `plan.md` → `work-log.md`).
- [`ontology/`](ontology/AGENTS.md) — ontology/graph config artifacts (scripts, seed data, JSON).

Module `AGENTS.md` files (root, `cockpit-api/`, `cockpit-app/`) are pointer files only — they link here, never restate content.
