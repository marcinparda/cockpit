# hermes

Hermes Agent gateway. External service, not part of the `cockpit-app` monorepo.

- **Port**: 8642 (prod container `hermes`)
- **Role**: agent gateway routed through `litellm` to OpenRouter
- **Model config**: exposed via `cockpit-api` MCP tools `hermes_get_model` / `hermes_set_model` (get/set the OpenRouter model ID Hermes uses, restarts Hermes on change) — see [`docs/backend/MCP_SERVER.md`](../../backend/MCP_SERVER.md)

See [`../litellm/README.md`](../litellm/README.md) for how requests reach the underlying LLM.
