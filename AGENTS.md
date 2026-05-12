# Cockpit Monorepo

Personal agent platform. Two projects:

- **`cockpit-api/`** — Python/FastAPI backend. MCP server, REST API, integrates Vikunja, Actual Budget, brain notes. Deployed as Docker container on Raspberry Pi.
- **`cockpit-app/`** — Nx monorepo of React/Vue web apps (login, cockpit, cv, store, agent). Each app deployed as separate Docker container on Raspberry Pi.

## Production Stack (Raspberry Pi)

Deployed via SSH through Cloudflare Tunnel. No docker-compose in prod — raw `docker run`.

| Container            | Port | Source                                       |
| -------------------- | ---- | -------------------------------------------- |
| `cockpit_api_prod`   | 8000 | `ghcr.io/marcinparda/cockpit:latest`         |
| `cockpit_db_prod`    | —    | PostgreSQL 15 (internal)                     |
| `cockpit_redis_prod` | —    | Redis Stack (internal)                       |
| `actual-http-api`    | 5007 | Actual Budget HTTP wrapper                   |
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

## CI/CD

Two independent pipelines triggered by path:

- `cockpit-api/**` → "Deploy API" workflow → builds `ghcr.io/marcinparda/cockpit:latest` → SSH deploys to Pi
- `cockpit-app/**` → "Deploy App" workflow → builds per-app images → SSH deploys to Pi
- Manual → "Deploy Extras" workflow → deploys Hermes, actual-http-api, Open WebUI, Vikunja

Deploy scripts on Pi: `~/deployment-scripts/*.sh`. Env vars passed via `/tmp/deploy.env`.

## GitHub Secrets (required on MarcinParda/cockpit)

SSH: `RASPBERRY_PI_SSH_KEY`, `SSH_KNOWN_HOSTS`, `RASPBERRY_PI_USERNAME`, `CLOUDFLARE_TUNNEL_DOMAIN`

API: `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_NAME`, `DB_PORT`, `CORS_ORIGINS`, `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `JWT_EXPIRE_HOURS`, `BCRYPT_ROUNDS`, `COOKIE_DOMAIN`, `REDIS_PASSWORD`, `VIKUNJA_USERNAME`, `VIKUNJA_PASSWORD`, `ACTUAL_HTTP_API_KEY`, `ACTUAL_BUDGET_SYNC_ID`, `OPEN_ROUTER_KEY`, `SERPER_API_KEY`, `BRAIN_NOTES_PATH`, `BRAIN_GIT_REMOTE`, `MCP_API_KEY`, `HERMES_API_KEY`, `OAUTH_SERVER_URL`

Extras: `OPEN_ROUTER_KEY`, `HERMES_API_KEY`, `MCP_API_KEY`, `ACTUAL_HTTP_API_KEY`, `VIKUNJA_DB_NAME`, `VIKUNJA_DB_USER`, `VIKUNJA_DB_PASSWORD`, `VIKUNJA_DB_ROOT_PASSWORD`

App: `ENVIRONMENTS` (full environments.ts content)

## Per-project docs

- `cockpit-api/CLAUDE.md` — API architecture, DB patterns, MCP tools, dev commands
- `cockpit-app/CLAUDE.md` — Nx workspace, API type generation, app structure
