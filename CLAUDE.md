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
