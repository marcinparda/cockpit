# Spec: Replace Maister plugin with repo-owned AI SDLC

## Problem
Repo depended on Maister Claude Code plugin for coding standards (`.maister/docs/`) and task tracking (`.maister/tasks/`), plus a `CLAUDE.md` forcing `/maister:*` workflow. Standards existed in two places (plugin docs + module `CLAUDE.md` files), diverging as one got edited and not the other.

## Goal
Lightweight, repo-portable AI SDLC: nested `AGENTS.md` files (module identity + pointers only), small composable skills (grill-me → plan-slices → fresh-review) instead of a process-owning plugin, one unified `docs/` tree as the sole home for facts and conventions, task history preserved.

## Scope

In:
- Remove `.maister/` and plugin references (`.claude/settings.json`, root/module `CLAUDE.md`).
- Migrate `.maister/docs/{standards,project}` and `.maister/tasks/` into the repo, drop plugin-internal `orchestrator-state.yml`.
- Root + module `AGENTS.md` files, content-boundary rule enforced (module files = identity/facts/pointers, `docs/standards/` = all conventions).
- New skills: `grill-me`, `plan-slices`, `fresh-review` (explicitly no AFK/parallel "Sandcastle" mode).
- `onboarding.md` for new/returning devs.
- Unify `docs/`, `cockpit-app/docs/`, `cockpit-api/docs/` into one root `docs/` tree; merge `cockpit-app/docs/ARCHITECTURE.md` into `docs/standards/frontend/architecture.md` (stale content corrected in the process).
- `docs/CONTRIBUTING.md` documenting where new doc files belong.

Out:
- `.worktrees/habits-app`, `.worktrees/store-rewrite` — untouched.
- Any AFK/parallel-agent workflow (Pocock's Sandcastle) — deliberately excluded.

## Decisions
- **AGENTS.md over CLAUDE.md**: Claude Code reads `AGENTS.md` natively — no need for a duplicate `CLAUDE.md` per directory.
- **Content boundary**: module `AGENTS.md` = what a module *is* (purpose, stack, ports) + pointers; `docs/standards/` = every "how to write code" rule, regardless of which module. Prevents the original duplication problem from recurring.
- **One `docs/` tree, not `.ai/docs/` + per-module `docs/`**: `.ai/docs/` had little to do with "AI" specifically — it was just docs, so it, `cockpit-app/docs/`, and `cockpit-api/docs/` were unified under root `docs/`, split by purpose (`standards/`, `project/`, `backend/`, `deployment/`, `tasks/`, `ontology/`) rather than by which folder happened to hold them before.
- **Task history kept as reference, not template**: old Maister task folders (deep analysis/verification subfolder trees) copied into `docs/tasks/` as-is for history; new tasks use a flatter `spec.md` → `plan.md` → `work-log.md` structure.
- **No Sandcastle**: fresh-review runs in a clean session by design, but stays interactive — no unattended parallel-agent mode.

## Constraints
- Must not touch `.worktrees/*`.
- No duplicated standards content between module `AGENTS.md` files and `docs/standards/`.

## Definition of done
- No file references `.maister/`, `.ai/docs/`, `cockpit-api/docs/`, or `cockpit-app/docs/` (verified via repo-wide grep, excluding `.worktrees/`).
- `docs/standards/INDEX.md` accurately indexes all standards/project docs.
- Root `AGENTS.md`, `cockpit-api/AGENTS.md`, `cockpit-app/AGENTS.md` exist, contain no coding-convention content.
- `.claude/skills/{grill-me,plan-slices,fresh-review}/SKILL.md` exist and are invocable.
- `onboarding.md` and `docs/CONTRIBUTING.md` exist at their documented paths.
