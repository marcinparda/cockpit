# Production Stack (Raspberry Pi)

> If you need info about prod containers or networking — read this file.

Deployed via `./deploy-api.sh`. No compose file used in prod — containers started with `docker run` directly.

| Container            | Port | Notes                                     |
| -------------------- | ---- | ----------------------------------------- |
| `cockpit_api_prod`   | 8000 | main API + MCP                            |
| `cockpit_db_prod`    | —    | PostgreSQL 15, internal only              |
| `cockpit_redis_prod` | —    | Redis Stack, internal only                |
| `actual-http-api`    | 5007 | Actual Budget HTTP wrapper                |
| `litellm`            | 4000 | LLM proxy, routes to Anthropic/OpenRouter, logs to Langfuse Cloud |
| `open-webui`         | 4206 | Open WebUI, uses LiteLLM + cockpit MCP    |

`open-webui` connects to cockpit MCP at `http://cockpit_api_prod:8000/mcp` within `cockpit_network_prod`.

`litellm` is the LLM gateway for all services. Hermes and Open WebUI route through it. External clients (Claude Code, Kiro) reach it via `https://litellm.parda.me`.
