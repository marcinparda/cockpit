# CI/CD

Two independent pipelines triggered by path:

- `cockpit-api/**` → "Deploy API" workflow → builds `ghcr.io/marcinparda/cockpit:latest` → SSH deploys to Pi
- `cockpit-app/**` → "Deploy App" workflow → builds per-app images → SSH deploys to Pi
- Manual → "Deploy Extras" workflow → deploys LiteLLM, actual-http-api, Vikunja
- Scheduled (Sunday 3 AM UTC) → "Weekly Backup" workflow → SSH to Pi, runs `backup.sh` → dumps all DBs + data to `~/backups/`

Deploy scripts on Pi: `~/deployment-scripts/*.sh`. Env vars passed via `/tmp/deploy.env`.
