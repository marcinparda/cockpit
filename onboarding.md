# AI SDLC — Onboarding

For new/returning devs (human or AI) working in this repo. Explains how AI is used here, what's available, and how to run the dev loop for a new feature/fix.

## Why this exists

This repo used to run on the Maister Claude Code plugin for standards + task orchestration. It's been replaced with a lightweight, repo-owned setup modeled on Matt Pocock's AI coding workflow: small composable skills instead of a process-owning framework, plain markdown instead of plugin-internal state, everything versioned in the repo instead of living in plugin config.

## How AI is configured here

- **`AGENTS.md`** — one per module (root, `cockpit-api/`, `cockpit-app/`). Each only describes what that module _is_ (purpose, stack, ports) and points to reference docs in `docs/`. Claude Code reads these natively; loaded root-first, module files pulled in only when you're working in that area.
- **`docs/standards/`** — all "how to write code here" rules: coding style, architecture, testing, per-domain (global/frontend/backend/testing). Start at [`INDEX.md`](docs/standards/INDEX.md). This is the _only_ place conventions live — module `AGENTS.md` files never duplicate this.
- **`docs/projects/`** — per-app/service facts (not conventions). `cockpit/` covers the whole monorepo + main app (vision, tech stack, architecture); sibling folders (`cv/`, `habits/`, `login/`, `store/`, `litellm/`, `actual/`, `vikunja/`) each describe one other app or external service.
- **`docs/tasks/`** — history of every task worked on, spec → plan → work-log per task. Old maister-era tasks were migrated here too (see below).
- **`docs/backend/`** — reference docs specific to `cockpit-api/` (architecture detail, MCP server, upstream API specs, dev commands).
- **`docs/CONTRIBUTING.md`** — where new documentation belongs and how to slice it into the right folder. Read this before adding any new file under `docs/`.
- **`.claude/skills/`** — the workflow skills (below).

## Skills

| Skill                  | When                                    | Does                                                                                                                           |
| ---------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `sdlc-develop-feature` | Starting any non-trivial feature/change | Orchestrates the full SDLC below end to end                                                                                    |
| `sdlc-fix-bug`         | Starting a bug fix                      | Orchestrates the (lighter) bug-fix SDLC end to end                                                                             |
| `grill-me`             | Start of any non-trivial task           | Interrogates requirements, exposes hidden decisions, writes `spec.md`                                                          |
| `plan-slices`          | After grill-me                          | Breaks spec into small vertical-slice (tracer bullet) issues, writes `plan.md`                                                 |
| `fresh-review`         | After implementation                    | Reviews the diff against spec/plan in a **clean session** (not the one that wrote the code), appends findings to `work-log.md` |

No AFK/parallel-agent mode here (Pocock's Sandcastle) — deliberately skipped, keep it interactive. If subagents are used anyway, each subagent prompt must explicitly say: "if this introduces a pattern not already documented in `docs/standards/`, note it in your summary." Subagents start with zero context and won't read this file or `AGENTS.md` unprompted, so the doc-update policy has to be spelled out per-dispatch or it gets silently skipped.

## SDLC walkthrough — starting new work

Use the orchestrator skill for the kind of work at hand instead of invoking the individual steps by hand:

- **`sdlc-develop-feature`** — new functionality or any non-trivial change.
- **`sdlc-fix-bug`** — bug fixes.

Each walks the full process for that kind of work (grill/diagnose → plan → implement → fresh-review → manual QA → docs + merge) and enforces the handoffs between steps, including keeping subagent dispatch interactive and making sure new conventions actually get written back to `docs/standards/`.

## Task types

`docs/tasks/<type>/` — use whichever type fits: `development` (new features/fixes), `migration` (rewrites/moves), `product-design` (exploratory/pre-spec work). Add new types as needed — this isn't enforced by tooling, just convention.

## What got migrated from maister

Existing task history (habit-tracker-app development, store-angular-to-react migration, locked-package-json-versions, habit-tracker-app product-design) was copied into `docs/tasks/` as-is — spec/plan/work-log/verification content kept, maister's internal `orchestrator-state.yml` files dropped (meaningless without the plugin). These are read as history/reference, not as templates — new tasks follow the simpler spec→plan→work-log structure above.
