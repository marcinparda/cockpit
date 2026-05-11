# CLAUDE.md

Guidance for Claude Code when working in `cockpit-api/`.

## Development Commands

**If you need to run development commands (start app, DB migrations, tests, deps) — read [`docs/DEVELOPMENT_COMMANDS.md`](docs/DEVELOPMENT_COMMANDS.md) first.**

## Upstream API Documentation

Upstream API specs are in `docs/`:

- `docs/actual-budget.openapi.json` — Actual HTTP API full OpenAPI 3.1.0 spec (fetched from live raspberry instance)
- `docs/vikunja.openapi.json` — Vikunja full Swagger 2.0 spec (fetched from GitHub main)
- `docs/UPSTREAM_APIS.md` — quick endpoint index for both APIs

When proxying a new endpoint: check `docs/UPSTREAM_APIS.md` for the endpoint, then read the OpenAPI JSON for exact request/response schemas.

To refresh specs when upstream updates:

```bash
./docs/update-upstream-docs.sh
```

## Architecture

Modular monolith. Each service uses layered architecture: `router.py` → `service.py` → `repository.py`.

**For models, migrations, permissions, import conventions, or full architecture detail — read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) first.**

## MCP Server

**If you need to add or modify MCP tools or resources — read [`docs/MCP_SERVER.md`](docs/MCP_SERVER.md) first.**

## Production Stack

**If you need to understand prod containers, ports, or networking — read [`docs/PRODUCTION_STACK.md`](docs/PRODUCTION_STACK.md) first.**
