# Plan: Replace Maister plugin with repo-owned AI SDLC

Executed as one continuous session rather than pre-sliced — recorded here after the fact, grouped into the slices it naturally fell into.

## Slice 1: Root + module AGENTS.md, content boundary
- What: new root `AGENTS.md`, `cockpit-api/AGENTS.md`, `cockpit-app/AGENTS.md` (renamed from `CLAUDE.md`), with any conventions content moved out into `docs/standards/`.
- Files: `AGENTS.md`, `cockpit-api/AGENTS.md`, `cockpit-app/AGENTS.md`, `docs/standards/frontend/architecture.md`.
- Verified: grep for convention-shaped content (Nx guidelines, API integration pattern) left in `AGENTS.md` files — none found outside the Nx auto-maintained block (kept in `cockpit-app/AGENTS.md`, pointed to from standards instead of duplicated).
- Depends on: none.

## Slice 2: Migrate standards + project docs, task history
- What: copy `.maister/docs/{standards,project}` and `.maister/tasks/` into the repo, drop `orchestrator-state.yml`, rewrite `INDEX.md`.
- Files: `docs/standards/**`, `docs/project/**`, `docs/tasks/**`.
- Verified: `find` confirmed all 4 pre-existing task folders present with spec/plan/work-log/verification content intact, no `orchestrator-state.yml`.
- Depends on: none.

## Slice 3: New skills + onboarding doc
- What: `grill-me`, `plan-slices`, `fresh-review` skills; `onboarding.md` walkthrough.
- Files: `.claude/skills/grill-me/SKILL.md`, `.claude/skills/plan-slices/SKILL.md`, `.claude/skills/fresh-review/SKILL.md`, `onboarding.md`.
- Verified: skills follow SKILL.md frontmatter convention (name/description), reference correct `docs/tasks/` paths.
- Depends on: slice 2 (paths skills reference).

## Slice 4: Remove Maister
- What: delete `.maister/`, remove plugin from `.claude/settings.json`, delete old `CLAUDE.md` files.
- Files: `.claude/settings.json`.
- Verified: `git status` showed all `.maister/**` as deleted; repo-wide case-insensitive grep for "maister" clean outside `.worktrees/` and the deliberate historical mentions (migrated task folders, onboarding.md's "What got migrated" section).
- Depends on: slices 1-3 (nothing left referencing `.maister/`).

## Slice 5: Merge cockpit-app/docs/ARCHITECTURE.md into standards
- What: `cockpit-app/docs/ARCHITECTURE.md` was stale (described `store` as Angular 19, missing `habits` app entirely). Merged its still-valid reference content (app inventory, state management table, deployment) into `docs/standards/frontend/architecture.md`, correcting the stale facts, then deleted the file.
- Files: `docs/standards/frontend/architecture.md`, deleted `cockpit-app/docs/ARCHITECTURE.md`.
- Verified: fixed resulting broken links in `cockpit-app/AGENTS.md` and `README.md`.
- Depends on: slice 2.

## Slice 6: Unify docs/ tree
- What: `.ai/docs/{standards,project,tasks}` and `cockpit-api/docs/*` had no reason to sit in separate trees from root `docs/` — moved everything under one root `docs/`, split by purpose (`standards/`, `project/`, `backend/`, `deployment/`, `tasks/`, `ontology/`). `.ai/onboarding.md` moved to repo-root `onboarding.md`.
- Files: `docs/standards/**`, `docs/project/**`, `docs/tasks/**`, `docs/backend/**`, `onboarding.md`, plus every file with a relative link into the old paths (`AGENTS.md` ×3, `README.md`, `docs/standards/INDEX.md`, `docs/standards/{frontend/architecture.md,frontend/css.md,backend/architecture.md,backend/models.md,global/containers.md}`).
- Also corrected residual stale facts caught during the merge: `docs/project/vision.md` and `docs/project/architecture.md` still referenced Angular and a 4-app inventory; corrected to match current 5-app, all-React-except-cv state.
- New: `docs/CONTRIBUTING.md` — decision tree for where a new doc file belongs, referenced from `docs/standards/INDEX.md`, `onboarding.md`, root `AGENTS.md`.
- Verified: repo-wide grep for `.ai/docs`, `.ai/onboarding`, `cockpit-api/docs`, `cockpit-app/docs` — zero hits.
- Depends on: slices 1-5.

## Not done
- Nothing committed yet — all changes are working-tree only pending user confirmation.
- `docs/project/tech-stack.md` not fully re-verified against current `package.json` (e.g. lingering `primevue`/`primeng` mentions) — flagged, not fixed, out of scope for this pass.
