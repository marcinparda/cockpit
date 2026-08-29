# actual

Actual Budget — personal finance tracker. External service, not part of the `cockpit-app` monorepo.

- **`actual`** — 5006, `actualbudget/actual-server:latest` (the Actual Budget server itself)
- **`actual-http-api`** — 5007, HTTP wrapper exposing Actual's API for integration
- **Integration**: `cockpit-api` talks to it via the `actual-http-api` wrapper; MCP tools cover accounts, categories, payees, transactions (create/update/delete/batch/search) — see [`docs/backend/MCP_SERVER.md`](../../backend/MCP_SERVER.md) and [`docs/backend/UPSTREAM_APIS.md`](../../backend/UPSTREAM_APIS.md) (full OpenAPI spec at `docs/backend/actual-budget.openapi.json`)
