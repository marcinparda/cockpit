# Cockpit Monorepo

Personal agent platform. Two projects:

- **`cockpit-api/`** — Python/FastAPI backend. MCP server, REST API, integrates Vikunja, Actual Budget, brain notes. Deployed as Docker container on Raspberry Pi.
- **`cockpit-app/`** — Nx monorepo of React/Vue web apps (login, cockpit, cv, store, agent). Each app deployed as separate Docker container on Raspberry Pi.

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

## Per-project docs (always read proper one before working in the codebase):

- `cockpit-api/CLAUDE.md` — API architecture, DB patterns, MCP tools, dev commands
- `cockpit-app/CLAUDE.md` — Nx workspace, API type generation, app structure

## Coding Standards & Conventions

Read @.maister/docs/INDEX.md before starting any task. It indexes the project's coding standards and conventions:
- Coding standards organized by domain (frontend, backend, testing, etc.)
- Project vision, tech stack, and architecture decisions

Follow standards in `.maister/docs/standards/` when writing code — they represent team decisions. If standards conflict with the task, ask the user.

### Standards Evolution

When you notice recurring patterns, fixes, or conventions during implementation that aren't yet captured in standards — suggest adding them. Examples:
- A bug fix reveals a pattern that should be standardized (e.g., "always validate X before Y")
- PR review feedback identifies a convention the team wants enforced
- The same type of fix is needed across multiple files
- A new library/pattern is adopted that should be documented

When this happens, briefly suggest the standard to the user. If approved, invoke `/maister:standards-update` with the identified pattern.

## Maister Workflows

This project uses the maister plugin for structured development workflows. When any `/maister:*` command is invoked, execute it via the Skill tool immediately — do not skip workflows for "straightforward" tasks. The user chose the workflow intentionally; complexity assessment is the workflow's job.
