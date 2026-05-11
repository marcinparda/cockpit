# Production Stack (Raspberry Pi)

> If you need info about prod containers or networking — read this file.

Deployed via `./deploy-api.sh`. No compose file used in prod — containers started with `docker run` directly.

| Container            | Port | Notes                                     |
| -------------------- | ---- | ----------------------------------------- |
| `cockpit_api_prod`   | 8000 | main API + MCP                            |
| `cockpit_db_prod`    | —    | PostgreSQL 15, internal only              |
| `cockpit_redis_prod` | —    | Redis Stack, internal only                |
| `actual-http-api`    | 5007 | Actual Budget HTTP wrapper                |
| `open-webui`         | 4206 | Open WebUI, uses OpenRouter + cockpit MCP |

`open-webui` connects to cockpit MCP at `http://cockpit_api_prod:8000/mcp` within `cockpit_network_prod`.
