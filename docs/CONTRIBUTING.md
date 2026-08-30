# Writing Documentation

Where a new doc file goes in `docs/`, and what belongs in it. Read before adding anything here.

## Folder logic

`docs/` has one rule: **separate what a thing *is* from how to *write code* for it.**

| Folder | Contains | Does NOT contain |
|---|---|---|
| `docs/standards/` | Coding conventions, architecture rules, "how to write/add code" — global or per-domain (`global/`, `frontend/`, `backend/`, `testing/`) | Facts about a specific service/app, task history |
| `docs/projects/<name>/` | Facts about one app/service: what it is, its purpose, ports, stack. `cockpit/` covers the whole monorepo + main app (vision, tech stack, architecture); every other app/service (`cv/`, `habits/`, `login/`, `store/`, `litellm/`, `actual/`, `vikunja/`) gets its own sibling folder | Coding conventions (→ `standards/`) |
| `docs/backend/` | `cockpit-api`-specific reference docs: detailed architecture, MCP server, upstream API specs, dev commands | General backend conventions (→ `standards/backend/`) |
| `docs/deployment/` | CI/CD, production stack, secrets — deployment mechanics that apply repo-wide | Per-app Dockerfile conventions (→ `standards/global/containers.md`) |
| `docs/tasks/` | Per-task history: `spec.md` → `plan.md` → `work-log.md`, one folder per task | Standing conventions (→ `standards/`) |
| `docs/ontology/` | Ontology/graph config artifacts (scripts, seed data, JSON) | — |

Module `AGENTS.md` files (root, `cockpit-api/AGENTS.md`, `cockpit-app/AGENTS.md`) are *not* documentation — they're short pointer files. They may only state what a module is (purpose, stack, ports) and link into `docs/`. Never write conventions or "how to write code here" content directly into an `AGENTS.md` — that always goes in `docs/standards/`.

## Deciding where a new file goes

Ask, in order:

1. **Is it a rule for how code should be written/structured, applying whenever someone touches this domain?** → `docs/standards/<domain>/`. Add to an existing file if the topic fits; create a new file only if it doesn't.
2. **Is it a fact about the whole project/monorepo (why it exists, what stack, what it's for) or about the main `cockpit` app specifically?** → `docs/projects/cockpit/`.
3. **Is it a fact specific to one other app or external service** (ports, purpose, integration points)? → `docs/projects/<name>/` (e.g. `docs/projects/habits/`, `docs/projects/vikunja/`). For deeper module-specific reference docs beyond a short README (endpoint lists, MCP tool catalogues) — e.g. `cockpit-api` — those live in a dedicated top-level folder instead (`docs/backend/`).
4. **Is it about deploying/running the whole repo in production?** → `docs/deployment/`.
5. **Is it the record of one specific task's work?** → `docs/tasks/<type>/<date>-<slug>/`, per the `cockpit-grill-me` → `cockpit-plan-slices` → `cockpit-fresh-review` flow in [`onboarding.md`](../onboarding.md).

If a new file doesn't fit any existing folder, that's a signal to think about the split before adding one — don't create a folder for a single one-off file when an existing one already covers the domain.

## Rules

- No duplication: a fact or rule lives in exactly one file. Other files link to it, they don't restate it.
- `docs/standards/AGENTS.md` must be updated whenever a standards file is added, removed, or its scope changes materially — it's the entry point, keep it accurate. Every first-level `docs/` subfolder has its own `AGENTS.md` index; update it the same way when that folder's files change.
- Cross-link with relative paths, not absolute repo paths — docs get read from checked-out clones at arbitrary locations.
- Keep `docs/projects/cockpit/` and per-module reference docs (`docs/backend/`, etc.) factual and current — they describe what *is*, so they go stale silently if not updated alongside the code they describe. When you notice one is stale, fix it as part of the change that made it stale, don't leave it for later.
