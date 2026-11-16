# Tasks and finance stay in Vikunja and Actual Budget

Cockpit does not own task or finance data. Tasks and Projects live in Vikunja, the Budget lives in Actual Budget; the API proxies them (Vikunja via a client, Actual via the `actual-http-api` wrapper) and exposes them as MCP tools.

## Considered options

- **Own tables for tasks and transactions in Postgres**: tighter integration and one data store. Rejected as rebuilding mature tools whose own apps the owner still uses.
- **Embed the upstream UIs only, no API proxy**: no Agent access. Rejected because Agents need these through MCP.

## Consequences

- The `vikunja` service has only a client and no models or repository. Postgres holds no task or transaction data.
- Upstream API changes can break Cockpit; upstream OpenAPI specs are vendored in `docs/backend/` and refreshed by script.
- Upstream availability is a runtime dependency for the related tools.
