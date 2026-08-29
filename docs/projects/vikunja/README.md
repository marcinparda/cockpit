# vikunja

Task management. External service, not part of the `cockpit-app` monorepo.

- **`vikunja`** — 3456, `vikunja/vikunja:latest`
- **`vikunja-db`** — MariaDB 10 (internal, `vikunja_default` network)
- **Data volumes**: `~/vikunja/db` (MariaDB), `~/vikunja/files` (attachments)
- **Integration**: `cockpit-api` proxies it via MCP tools (list/create/update/delete tasks and projects, assign users) — see [`docs/backend/MCP_SERVER.md`](../../backend/MCP_SERVER.md) and [`docs/backend/UPSTREAM_APIS.md`](../../backend/UPSTREAM_APIS.md) (full Swagger spec at `docs/backend/vikunja.openapi.json`)
