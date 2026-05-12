## Backup & Operations Standards

### Backup Strategy
- Weekly automated backups via GitHub Actions (`scheduled-backup.yml`, Sunday 3 AM UTC)
- All backups stored on Pi at `~/backups/` with 28-day retention (auto-pruned)
- Script: `deployment-scripts/backup.sh`, executed over SSH via Cloudflare Tunnel

### What Gets Backed Up
| Data | Method | Output |
|------|--------|--------|
| PostgreSQL (`cockpit_db_prod`) | `pg_dumpall` | `.sql.gz` |
| Redis (`cockpit_redis_prod`) | `BGSAVE` + copy `.rdb` | `.rdb.gz` |
| Vikunja MariaDB (`vikunja-db`) | `mysqldump` | `.sql.gz` |
| Vikunja files (`~/vikunja/files`) | `tar` | `.tar.gz` |
| Brain notes (`$BRAIN_NOTES_PATH`) | `tar` | `.tar.gz` |

### Conventions for Backup Scripts
- Use `set -euo pipefail` for strict error handling
- Compress all outputs with gzip
- Name files with ISO date: `<service>_YYYY-MM-DD_HHMM.<ext>.gz`
- Log success/failure per step; don't abort entire script on single service failure
- Secrets come from GitHub Actions secrets, passed as env vars over SSH
