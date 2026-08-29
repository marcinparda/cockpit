# Cockpit Monorepo

Personal agent platform. Two projects:

- **`cockpit-api/`** — Python/FastAPI backend. MCP server, REST API, integrates Vikunja, Actual Budget, brain notes. Deployed as Docker container on Raspberry Pi. See [`cockpit-api/AGENTS.md`](cockpit-api/AGENTS.md).
- **`cockpit-app/`** — Nx monorepo of React/Vue web apps (login, cockpit, cv, store, habits). Each app deployed as separate Docker container on Raspberry Pi. See [`cockpit-app/AGENTS.md`](cockpit-app/AGENTS.md).

## Makefile

Root `Makefile` wraps both projects. Key targets:

- `make run` — start API (detached) + all apps
- `make api-*` — delegates to `cockpit-api/Makefile` (up, down, restart, logs, migrate, test)
- `make app-*` — delegates to `cockpit-app/` npm scripts (run, build, test, update-types)
- `make install` / `make test` — run both projects

### Deployment

- [docs/deployment/OVERVIEW.md](docs/deployment/OVERVIEW.md) — end-to-end deployment: pipelines, SSH mechanism, scripts, Docker networks, data persistence
- [docs/deployment/PRODUCTION_STACK.md](docs/deployment/PRODUCTION_STACK.md) — containers, ports, images, data volumes on Raspberry Pi
- [docs/deployment/CICD.md](docs/deployment/CICD.md) — pipelines quick-reference
- [docs/deployment/GITHUB_SECRETS.md](docs/deployment/GITHUB_SECRETS.md) — all required GitHub secrets by category

## Documentation

All docs live under [`docs/`](docs/) — one tree, no per-module doc folders. Read [`docs/standards/INDEX.md`](docs/standards/INDEX.md) before starting any task: it indexes coding standards/conventions (global, frontend, backend, testing) and project docs (vision, tech stack, architecture). See [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) for where new documentation belongs and how to slice it into the right folder.

Module `AGENTS.md` files (this file, `cockpit-api/AGENTS.md`, `cockpit-app/AGENTS.md`) only describe what each module _is_ — its purpose, frameworks, ports, and pointers into `docs/`. All coding conventions and "how to write code here" rules live in `docs/standards/` — check there first, don't duplicate rules per-module.

If you notice a recurring pattern, fix, or convention during implementation that isn't yet captured in standards — add it to the relevant `docs/standards/` file directly, or note it in the task's `work-log.md` for later promotion.

## AI Workflow

New/returning to this repo? Read [`onboarding.md`](onboarding.md) — explains the AI SDLC, available skills, and task workflow. Task history lives in [`docs/tasks/`](docs/tasks/). (Must-read for agents)
