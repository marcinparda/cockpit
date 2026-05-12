# Deployment Overview

End-to-end explanation of how code gets from `git push` to running containers on Raspberry Pi.

---

## Architecture Summary

```
Developer pushes to master
        │
        ├─ cockpit-api/** changed ──► "Deploy API" workflow
        │                                    │
        │                                    ▼
        │                           Builds arm64 Docker image
        │                           Pushes to ghcr.io/marcinparda/cockpit:latest
        │                                    │
        │                                    ▼
        │                           "Deploy API to Production" workflow (triggered by above)
        │                                    │
        └─ cockpit-app/** changed ──► "Deploy App" workflow
                                            │
                                            ▼
                                   Builds per-app arm64 images
                                   Pushes to ghcr.io/marcinparda/cockpit-{app}:latest
                                            │
                                            ▼
                                   "Deploy App to Production" (reusable workflow)
                                            │
                            ───────────────┘
                            │
                            ▼
                   SSH via Cloudflare Tunnel
                   Copy deployment-scripts/*.sh to Pi
                   Write secrets to /tmp/deploy.env
                   Run deploy-*.sh on Pi (nohup background)
                   Poll /tmp/deploy.exit for result
                            │
                            ▼
                   Containers running on Raspberry Pi
```

---

## Pipeline Breakdown

### Pipeline 1: API (`cockpit-api/**`)

**Trigger:** push to `master` with changes in `cockpit-api/`

**Step 1 — `api-deploy.yml` (Deploy API)**
1. Runs `api-checks.yml` (linting/tests) as a prerequisite job
2. Builds `ghcr.io/marcinparda/cockpit:latest` targeting the `production` stage in `cockpit-api/Dockerfile`
3. Pushes to GitHub Container Registry (GHCR) for `linux/arm64` (Pi's architecture)
4. Tags: `latest`, `master`, `sha-<commit>`

**Step 2 — `api-deploy-to-production.yml` (Deploy API to Production)**
- Triggers automatically when "Deploy API" workflow completes successfully on `master`
- Can also be triggered manually via `workflow_dispatch`

### Pipeline 2: Apps (`cockpit-app/**`)

**Trigger:** push to `master` with changes in `cockpit-app/`

**`app-deploy.yml` (Deploy App)** — single workflow, two jobs:

**Job 1 — `build-test-and-push`:**
1. Replaces `environments.ts` with secret `ENVIRONMENTS` (contains API URLs per environment)
2. Finds the last successful run SHA → uses Nx `affected` to only build/test/lint changed apps
3. Builds changed apps, pushes per-app images: `ghcr.io/marcinparda/cockpit-{login,cockpit,cv,store}:latest`
4. Only pushes Docker image if `dist/apps/{name}/` was produced by the build

**Job 2 — `deploy-to-raspberry`:**
- Calls reusable workflow `app-deploy-to-production.yml` after build job succeeds

**`app-deploy-all.yml` (Deploy All Apps)** — manual-only variant:
- Same as above but skips `affected` logic; builds all four apps unconditionally

### Pipeline 3: Extras (manual only)

**`deploy-extras.yml`** — `workflow_dispatch` only, deploys:
- Hermes (AI agent gateway)
- actual-http-api (Actual Budget HTTP wrapper)
- Open WebUI
- Vikunja (task management)

---

## How the Production Deploy Works

Every "deploy to production" workflow (API, App, Extras) follows the same pattern:

### 1. SSH via Cloudflare Tunnel

GitHub Actions cannot reach the Pi directly. SSH goes through Cloudflare Access:

```
GitHub Actions Runner
  → installs cloudflared
  → SSH config: ProxyCommand = cloudflared access ssh --hostname <tunnel-domain>
  → connects to Pi as $RASPBERRY_PI_USERNAME
```

Secrets used: `RASPBERRY_PI_SSH_KEY`, `SSH_KNOWN_HOSTS`, `RASPBERRY_PI_USERNAME`, `CLOUDFLARE_TUNNEL_DOMAIN`

### 2. Copy Deployment Scripts

```bash
scp deployment-scripts/*.sh pi:~/deployment-scripts/
```

All scripts from `deployment-scripts/` in the repo are copied to the Pi before each deploy. This keeps the scripts version-controlled and always in sync with the repo state at deploy time.

### 3. Write Secrets to `/tmp/deploy.env`

GitHub secrets are written to `/tmp/deploy.env` on the Pi (chmod 600). The env file is deleted after the script finishes:

```bash
# API pipeline format (uses export):
export DB_USER='...'
export JWT_SECRET_KEY='...'

# App pipeline format (plain key=value, sourced with set -a):
GITHUB_TOKEN=...
GITHUB_ACTOR=...
```

### 4. Launch Deploy in Background

```bash
nohup bash -c 'source /tmp/deploy.env && ~/deployment-scripts/deploy-api.sh \
  > /tmp/deploy.log 2>&1; \
  echo $? > /tmp/deploy.exit; \
  rm -f /tmp/deploy.env' &
```

The deploy runs detached (`nohup`, `disown`) so SSH disconnect doesn't kill it.

### 5. Poll for Result

GitHub Actions polls every 10 seconds for up to 30 minutes:

```bash
[ -f /tmp/deploy.exit ] && echo done:$(cat /tmp/deploy.exit) || echo running
```

- `done:0` → success
- `done:non-zero` → failure (prints last 50 lines of `/tmp/deploy.log`)
- Timeout → workflow fails

---

## Deployment Scripts

Located in `deployment-scripts/` in the repo root, copied to `~/deployment-scripts/` on Pi at deploy time.

### `deploy-api.sh`

Deploys the full API stack. Steps:
1. Validates all required env vars are set (fails fast if any missing)
2. `docker login` to GHCR using `GITHUB_TOKEN` / `GITHUB_ACTOR`
3. Tags current `cockpit:latest` as `cockpit:previous` (rollback target)
4. Pulls `ghcr.io/marcinparda/cockpit:latest`
5. Removes existing `cockpit_api_prod`, `cockpit_redis_prod`, `cockpit_db_prod` containers
6. Creates `cockpit_network_prod` Docker network (idempotent)
7. Creates named volumes for Postgres and Redis data (idempotent)
8. Starts Redis Stack with password, appended-only persistence
9. Starts PostgreSQL 15, waits for health check to pass
10. Starts API container with all env vars injected, mounts:
    - `$BRAIN_NOTES_PATH` (brain notes directory on Pi filesystem)
    - `~/.hermes` → `/opt/hermes` (Hermes config)
    - `/var/run/docker.sock` (API can manage Docker containers)
11. Connects `cockpit_api_prod` to `vikunja_default` and `actual_network` (cross-network service discovery)
12. Polls `http://localhost:8000/health` up to 30 times (3s intervals)
13. Verifies all three containers are running

**Rollback:** if something fails, the `:previous` tag is available to manually re-run with the old image.

### `deploy-apps.sh`

Deploys frontend apps. Steps (for each of `login`, `cockpit`, `cv`, `store`):
1. Tags current `:latest` as `:previous` (rollback target)
2. Pulls `ghcr.io/marcinparda/cockpit-{app}:latest`
3. Stops and removes existing container
4. Runs new container on its port (4202–4205), serving on port 80 inside
5. Health checks `http://localhost:{port}/` up to 30 times (3s intervals)
6. **Auto-rollback:** if health check fails, restarts from `:previous` image
7. Prunes old images after all apps deploy

### `deploy-extras.sh`

Orchestrator — calls the four sub-scripts in sequence:
```bash
deploy-hermes.sh → deploy-actual.sh → deploy-open-webui.sh → deploy-vikunja.sh
```

### `deploy-hermes.sh`

Deploys Hermes AI agent gateway:
- Writes `~/.hermes/config.yaml` (model: openrouter, default model configurable via `HERMES_MODEL`)
- Writes `~/.hermes/cli-config.yaml` (MCP server pointing to `cockpit_api_prod:8000/mcp`)
- Runs `nousresearch/hermes-agent:latest` on port 8642, attached to `cockpit_network_prod`

### `deploy-actual.sh`

Deploys Actual Budget HTTP API wrapper:
- Creates `actual_network` Docker network
- Connects existing `actual` container (Actual Budget server) to `actual_network`
- Runs `jhonderson/actual-http-api:latest` on port 5007
- Connects to both `actual_network` and `cockpit_network_prod` (so API can reach it)

### `deploy-open-webui.sh`

Deploys Open WebUI:
- Runs `ghcr.io/open-webui/open-webui:main` on port 4206
- Configured with two OpenAI-compatible API backends:
  - `https://openrouter.ai/api/v1` (external models)
  - `http://hermes:8642/v1` (local Hermes agent, reachable via `cockpit_network_prod`)

### `deploy-vikunja.sh`

Deploys Vikunja task management stack:
- Creates `vikunja_default` Docker network
- Starts MariaDB 10 with bind-mount at `~/vikunja/db`
- Waits for MariaDB ready (`mysqladmin ping`)
- Starts Vikunja on port 3456 with bind-mount at `~/vikunja/files`

### `backup.sh`

Weekly backup of all databases and data. Triggered by `scheduled-backup.yml` (cron: Sunday 3 AM UTC). Steps:
1. PostgreSQL full dump (`pg_dumpall`) → `~/backups/postgres_<date>.sql.gz`
2. Redis snapshot (`BGSAVE` + copy `.rdb`) → `~/backups/redis_<date>.rdb.gz`
3. Vikunja MariaDB dump (`mysqldump`) → `~/backups/vikunja_db_<date>.sql.gz`
4. Vikunja files archive → `~/backups/vikunja_files_<date>.tar.gz`
5. Brain notes archive → `~/backups/brain_notes_<date>.tar.gz`
6. Deletes backups older than 28 days

Required env vars: `DB_USER`, `DB_PASSWORD`, `REDIS_PASSWORD`, `VIKUNJA_DB_USER`, `VIKUNJA_DB_PASSWORD`, `VIKUNJA_DB_NAME`, `BRAIN_NOTES_PATH`

### `restore.sh`

Restores a single service from its latest backup. Interactive — prompts for confirmation before overwriting.

Usage: `~/deployment-scripts/restore.sh <service>`

Services: `postgres`, `redis`, `vikunja-db`, `vikunja-files`, `brain`

Required env vars: same as `backup.sh` (only the vars relevant to the chosen service).

---

## Docker Network Topology

```
cockpit_network_prod
├── cockpit_api_prod  (port 8000)
├── cockpit_redis_prod
├── hermes            (port 8642)
├── open-webui        (port 4206)
└── actual-http-api   (port 5007)
        │
        └── also on actual_network
                └── actual (Actual Budget server)

vikunja_default
├── vikunja           (port 3456)
└── vikunja-db        (MariaDB, internal)

cockpit_api_prod is also connected to:
├── vikunja_default   (to reach vikunja:3456)
└── actual_network    (to reach actual-http-api:5007)

Frontend apps (no network — standalone):
├── login     (port 4202)
├── cockpit   (port 4203)
├── cv        (port 4204)
└── store     (port 4205)
```

---

## Data Persistence

| What | How |
|---|---|
| PostgreSQL data | Docker volume `cockpit-api_cockpit_postgres_data_prod` |
| Redis data | Docker volume `cockpit-api_cockpit_redis_data_prod` |
| Vikunja DB | Bind mount `~/vikunja/db` |
| Vikunja file attachments | Bind mount `~/vikunja/files` |
| Actual HTTP API data | Docker volume `actual_http_api_data` |
| Open WebUI data | Docker volume `open_webui_data` |
| Brain notes | Bind mount at `$BRAIN_NOTES_PATH` (Pi filesystem path) |
| Hermes config | Bind mount `~/.hermes` |

---

## Related Files

| File | Purpose |
|---|---|
| [PRODUCTION_STACK.md](PRODUCTION_STACK.md) | Container list, ports, images |
| [CICD.md](CICD.md) | Pipeline quick-reference |
| [GITHUB_SECRETS.md](GITHUB_SECRETS.md) | All required GitHub secrets |
| `.github/workflows/api-deploy.yml` | Build + push API image |
| `.github/workflows/api-deploy-to-production.yml` | SSH deploy API to Pi |
| `.github/workflows/app-deploy.yml` | Build + push app images (affected only) |
| `.github/workflows/app-deploy-all.yml` | Build + push all apps (manual) |
| `.github/workflows/app-deploy-to-production.yml` | Reusable SSH deploy for apps |
| `.github/workflows/deploy-extras.yml` | Manual deploy of extras |
| `deployment-scripts/deploy-api.sh` | Run on Pi: full API stack |
| `deployment-scripts/deploy-apps.sh` | Run on Pi: all frontend apps |
| `deployment-scripts/deploy-extras.sh` | Run on Pi: extras orchestrator |
| `deployment-scripts/deploy-hermes.sh` | Run on Pi: Hermes |
| `deployment-scripts/deploy-actual.sh` | Run on Pi: Actual HTTP API |
| `deployment-scripts/deploy-open-webui.sh` | Run on Pi: Open WebUI |
| `deployment-scripts/deploy-vikunja.sh` | Run on Pi: Vikunja + MariaDB |
| `deployment-scripts/backup.sh` | Run on Pi: weekly backup of all DBs and data |
| `deployment-scripts/restore.sh` | Run on Pi: restore a single service from latest backup |
| `.github/workflows/scheduled-backup.yml` | Weekly cron: SSH to Pi and run backup |
