# Cockpit Monorepo

Personal agent platform. Two projects:

- **`cockpit-api/`** — Python/FastAPI backend. MCP server, REST API, integrates Vikunja, Actual Budget, brain notes. Deployed as Docker container on Raspberry Pi. See [`cockpit-api/AGENTS.md`](cockpit-api/AGENTS.md).
- **`cockpit-app/`** — Nx monorepo of React/Vue web apps (login, cockpit, cv, store, habits). Each app deployed as separate Docker container on Raspberry Pi. See [`cockpit-app/AGENTS.md`](cockpit-app/AGENTS.md).

## Makefile

Root `Makefile` wraps both projects. Read it when you need to run some commands.

## Documentation

All docs live under [`docs/`](docs/). See [`docs/AGENTS.md`](docs/AGENTS.md) for high-level map of what's inside (standards, projects, backend, deployment, agents, adr, ontology) and [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) for where new documentation belongs and how to slice it into the right folder.

Module `AGENTS.md` files (this file, `cockpit-api/AGENTS.md`, `cockpit-app/AGENTS.md`) only describe what each module _is_ — its purpose, frameworks, ports, and pointers into `docs/`. All coding conventions and "how to write code here" rules live in `docs/standards/` — check there first, don't duplicate rules per-module.

If you notice a recurring pattern, fix, or convention during implementation that isn't yet captured in standards — add it to the relevant `docs/standards/` file directly, or note it in the task's `work-log.md` for later promotion.

## AI Workflow

Work is tracked in **GitHub Issues** (`marcinparda/cockpit`), driven by the Matt Pocock skills (vendored in `.claude/skills/`). Read [`onboarding.md`](onboarding.md) for the flow. Past task history lives in closed issues labelled `archive` (originals at git tag `pre-github-workflow`).

## Agent skills

### Issue tracker

GitHub Issues via `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.
