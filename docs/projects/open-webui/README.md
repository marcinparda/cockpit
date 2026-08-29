# open-webui

Chat UI for LLMs. External service, not part of the `cockpit-app` monorepo.

- **Port**: 4206 (prod container `open-webui`)
- **LLM routing**: through `litellm` to OpenRouter (same as Hermes)
- **MCP**: connects to the `cockpit-api` MCP server at `http://cockpit_api_prod:8000/mcp` within the `cockpit_network_prod` Docker network, giving it access to Vikunja/Actual/brain-notes tools

See [`docs/backend/PRODUCTION_STACK.md`](../../backend/PRODUCTION_STACK.md) for the network/connection detail and [`../litellm/README.md`](../litellm/README.md) for the LLM gateway.
