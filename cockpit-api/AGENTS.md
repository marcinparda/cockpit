# AGENTS.md

Guidance for AI agents when working in `cockpit-api/`.

Python/FastAPI backend. MCP server + REST API integrating Vikunja, Actual Budget, and brain notes. Modular monolith — see [`docs/standards/backend/architecture.md`](../docs/standards/backend/architecture.md) for the layered architecture rules (this repo follows router → service → repository strictly).

## Development Commands

**If you need to run development commands (start app, DB migrations, tests, deps) — read [`docs/backend/DEVELOPMENT_COMMANDS.md`](../docs/backend/DEVELOPMENT_COMMANDS.md) first.**

## Upstream API Documentation

Upstream API specs are in [`docs/backend/`](../docs/backend/):

- `docs/backend/actual-budget.openapi.json` — Actual HTTP API full OpenAPI 3.1.0 spec (fetched from live raspberry instance)
- `docs/backend/vikunja.openapi.json` — Vikunja full Swagger 2.0 spec (fetched from GitHub main)
- `docs/backend/UPSTREAM_APIS.md` — quick endpoint index for both APIs

When proxying a new endpoint: check `docs/backend/UPSTREAM_APIS.md` for the endpoint, then read the OpenAPI JSON for exact request/response schemas.

To refresh specs when upstream updates:

```bash
../docs/backend/update-upstream-docs.sh
```

## Architecture Reference

For models, migrations, permissions, import conventions, or full architecture detail — read [`docs/backend/ARCHITECTURE.md`](../docs/backend/ARCHITECTURE.md) first. For the coding-standards version of the 3-layer rule, see [`docs/standards/backend/architecture.md`](../docs/standards/backend/architecture.md).

## MCP Server

**If you need to add or modify MCP tools or resources — read [`docs/backend/MCP_SERVER.md`](../docs/backend/MCP_SERVER.md) first.**

## Production Stack

**If you need to understand prod containers, ports, or networking — read [`docs/backend/PRODUCTION_STACK.md`](../docs/backend/PRODUCTION_STACK.md) first.**
