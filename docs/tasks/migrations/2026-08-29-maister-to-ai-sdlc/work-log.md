# Work Log: Replace Maister plugin with repo-owned AI SDLC

## 2026-08-29

- Removed `.maister/` (root only, worktrees untouched), removed plugin entry from `.claude/settings.json`, deleted old `CLAUDE.md` files (root, `cockpit-api/`, `cockpit-app/`).
- Created root `AGENTS.md`, `cockpit-api/AGENTS.md`, `cockpit-app/AGENTS.md` — content-boundary rule applied: module files carry identity/facts/pointers only, all conventions live in `docs/standards/`.
- Migrated `.maister/docs/{standards,project}` and `.maister/tasks/` into the repo (initially under `.ai/docs/`), dropped `orchestrator-state.yml` files, rewrote `INDEX.md`.
- Added `.claude/skills/{grill-me,plan-slices,fresh-review}/SKILL.md` and `onboarding.md`.
- Merged stale `cockpit-app/docs/ARCHITECTURE.md` into `docs/standards/frontend/architecture.md` (corrected: `store` is React 19 not Angular, added missing `habits` app), then deleted it. Fixed the resulting broken links in `cockpit-app/AGENTS.md` and `README.md`, plus 4 stray `Source:` refs inside `docs/standards/*` files that pointed at the deleted file.
- Unified doc trees: `.ai/docs/*` → `docs/*`, `cockpit-api/docs/*` → `docs/backend/*`, `.ai/onboarding.md` → repo-root `onboarding.md`. Fixed every relative link across `AGENTS.md` (×3), `README.md`, and `docs/standards/*` that pointed at the old locations. Corrected stale Angular/4-app mentions found in `docs/project/{vision,architecture}.md` while touching them.
- Wrote `docs/CONTRIBUTING.md` (decision tree for where new docs belong) and linked it from `docs/standards/INDEX.md`, `onboarding.md`, root `AGENTS.md`.
- Verification: repo-wide grep (excluding `.worktrees/`, `node_modules/`, `.git/`) for `maister`, `.ai/docs`, `.ai/onboarding`, `cockpit-api/docs`, `cockpit-app/docs` — all clean except deliberate historical mentions in migrated task folders and `onboarding.md`'s "What got migrated from maister" section.

## Fresh Review — pending

Not yet run in a clean session. Do this before merge, per the SDLC in `onboarding.md`.

## Status

Ready for fresh-review + manual QA. Not yet committed — pending user go-ahead.
