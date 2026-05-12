# Production Stack (Raspberry Pi)

Deployed via SSH through Cloudflare Tunnel. No docker-compose in prod — raw `docker run`.

| Container            | Port | Source                                       |
| -------------------- | ---- | -------------------------------------------- |
| `cockpit_api_prod`   | 8000 | `ghcr.io/marcinparda/cockpit:latest`         |
| `cockpit_db_prod`    | —    | PostgreSQL 15 (internal)                     |
| `cockpit_redis_prod` | —    | Redis Stack (internal)                       |
| `actual-http-api`    | 5007 | Actual Budget HTTP wrapper                   |
| `litellm`            | 4000 | LiteLLM proxy (routes to Anthropic/OpenRouter, logs to Langfuse Cloud) |
| `open-webui`         | 4206 | Open WebUI                                   |
| `hermes`             | 8642 | Hermes Agent gateway                         |
| `login`              | 4202 | `ghcr.io/marcinparda/cockpit-login:latest`   |
| `cockpit`            | 4203 | `ghcr.io/marcinparda/cockpit-cockpit:latest` |
| `cv`                 | 4204 | `ghcr.io/marcinparda/cockpit-cv:latest`      |
| `store`              | 4205 | `ghcr.io/marcinparda/cockpit-store:latest`   |
| `storybook`          | 4207 | `ghcr.io/marcinparda/cockpit-storybook:latest` |
| `vikunja`            | 3456 | `vikunja/vikunja:latest`                     |
| `vikunja-db`         | —    | MariaDB 10 (internal, `vikunja_default` net) |

Data volumes: `~/vikunja/db` (MariaDB), `~/vikunja/files` (attachments).
