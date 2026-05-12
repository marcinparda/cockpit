# Cockpit

Personal agent platform — self-hosted on Raspberry Pi (arm64).

| Project                        | Stack                                           | What                                                                   |
| ------------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------- |
| [`cockpit-api/`](cockpit-api/) | Python · FastAPI · PostgreSQL · Redis           | REST API + MCP server. Integrates Vikunja, Actual Budget, brain notes. |
| [`cockpit-app/`](cockpit-app/) | Nx · React 19 · Angular 19 · Tailwind · PrimeNG | Multi-app frontend monorepo (login, cockpit, cv, store). Storybook for UI docs. |

## Architecture at a Glance

**API** — Modular monolith, layered per service: `router → service → repository`. Async SQLAlchemy, Alembic migrations, RBAC permissions.
→ [`cockpit-api/docs/ARCHITECTURE.md`](cockpit-api/docs/ARCHITECTURE.md)

**App** — Nx enforce-module-boundaries with strict layer direction: `types → data-access → ui → feature → app`. Cookie-based auth, TanStack Query (React), Angular signals.
→ [`cockpit-app/docs/ARCHITECTURE.md`](cockpit-app/docs/ARCHITECTURE.md)

**Deployment** — Docker containers on Raspberry Pi, no docker-compose in prod. nginx:alpine for apps, CI via `nx affected`.
→ [`AGENTS.md`](AGENTS.md) (prod stack & ports)

## Where to Look

| Topic                                 | File                                                                                   |
| ------------------------------------- | -------------------------------------------------------------------------------------- |
| Production containers & ports         | [`AGENTS.md`](AGENTS.md)                                                               |
| API architecture & DB patterns        | [`cockpit-api/docs/ARCHITECTURE.md`](cockpit-api/docs/ARCHITECTURE.md)                 |
| API dev commands (run, migrate, test) | [`cockpit-api/docs/DEVELOPMENT_COMMANDS.md`](cockpit-api/docs/DEVELOPMENT_COMMANDS.md) |
| MCP tools & resources                 | [`cockpit-api/docs/MCP_SERVER.md`](cockpit-api/docs/MCP_SERVER.md)                     |
| Upstream API specs (Vikunja, Actual)  | [`cockpit-api/docs/UPSTREAM_APIS.md`](cockpit-api/docs/UPSTREAM_APIS.md)               |
| LLM proxy & observability             | [`docs/LITELLM_SETUP.md`](docs/LITELLM_SETUP.md)                                      |
| App architecture & lib layout         | [`cockpit-app/docs/ARCHITECTURE.md`](cockpit-app/docs/ARCHITECTURE.md)                 |
| CI/CD pipelines                       | [`.github/`](.github/)                                                                 |
| GitHub Secrets reference              | [`AGENTS.md`](AGENTS.md)                                                               |

## Development

Root Makefile orchestrates both projects:

```bash
make install          # install deps for API + App
make run              # start API (docker, detached) + all frontend apps
make test             # run all tests
```

Full API dev commands: [`cockpit-api/docs/DEVELOPMENT_COMMANDS.md`](cockpit-api/docs/DEVELOPMENT_COMMANDS.md)

## Enforced Practices

- **Deployment**: Every merge to `master` auto-deploys affected projects via path-triggered GitHub Actions. No manual deploys.
- **Backup**: Database volumes (`~/vikunja/db`, PostgreSQL) must have scheduled backups on the Pi. Verify restore periodically.
- **Testing**: Target **80% coverage** (not yet enforced — will be gated in CI once reached). Write tests for new code.
- **Type safety**: API types auto-generated from OpenAPI spec → shared across all apps. No manual type duplication.
- **Boundaries**: Nx module boundary rules enforced at lint time. No cross-layer imports.
- **Permissions**: All business endpoints require `require_permission` dependency. No unprotected routes.

## Disclaimer

This is a **personal project** built for my specific use cases. You're welcome to fork it and get inspired, but be aware:

- The setup is tightly coupled to a Raspberry Pi deployment behind Cloudflare Tunnel — replicating it is time-consuming.
- It's not a general-purpose framework or template.
- I don't accept unsolicited PRs. If you'd like to contribute an improvement, contact me first so we can agree on scope before any code is written.
