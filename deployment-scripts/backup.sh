#!/bin/bash
# Weekly backup script for Cockpit production databases and data
# Backs up: PostgreSQL, Redis, Vikunja MariaDB, Vikunja files, Brain notes

set -euo pipefail

BACKUP_DIR="${HOME}/backups"
DATE=$(date +%Y-%m-%d_%H%M)
RETENTION_DAYS=28

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

mkdir -p "${BACKUP_DIR}"

log() { echo -e "${GREEN}[$(date +%H:%M:%S)] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +%H:%M:%S)] $1${NC}"; }
err() { echo -e "${RED}[$(date +%H:%M:%S)] $1${NC}" >&2; }

# --- PostgreSQL ---
log "Backing up PostgreSQL (cockpit_db_prod)..."
if docker exec cockpit_db_prod pg_dumpall -U "${DB_USER:-cockpit}" \
    | gzip > "${BACKUP_DIR}/postgres_${DATE}.sql.gz"; then
    log "PostgreSQL backup complete"
else
    err "PostgreSQL backup FAILED"
fi

# --- Redis ---
log "Backing up Redis (cockpit_redis_prod)..."
docker exec cockpit_redis_prod redis-cli -a "${REDIS_PASSWORD}" --no-auth-warning BGSAVE >/dev/null 2>&1
sleep 2
if docker cp cockpit_redis_prod:/var/lib/redis-stack/dump.rdb "${BACKUP_DIR}/redis_${DATE}.rdb"; then
    gzip -f "${BACKUP_DIR}/redis_${DATE}.rdb"
    log "Redis backup complete"
else
    err "Redis backup FAILED"
fi

# --- Vikunja MariaDB ---
log "Backing up Vikunja MariaDB (vikunja-db)..."
if docker exec vikunja-db mysqldump -u "${VIKUNJA_DB_USER:-vikunja}" \
    -p"${VIKUNJA_DB_PASSWORD}" "${VIKUNJA_DB_NAME:-vikunja}" \
    | gzip > "${BACKUP_DIR}/vikunja_db_${DATE}.sql.gz"; then
    log "Vikunja MariaDB backup complete"
else
    err "Vikunja MariaDB backup FAILED"
fi

# --- Vikunja files ---
log "Backing up Vikunja files..."
if tar czf "${BACKUP_DIR}/vikunja_files_${DATE}.tar.gz" -C "${HOME}/vikunja" files 2>/dev/null; then
    log "Vikunja files backup complete"
else
    warn "Vikunja files backup skipped (directory not found)"
fi

# --- Brain notes ---
if [[ -n "${BRAIN_NOTES_PATH:-}" && -d "${BRAIN_NOTES_PATH}" ]]; then
    log "Backing up Brain notes..."
    tar czf "${BACKUP_DIR}/brain_notes_${DATE}.tar.gz" -C "$(dirname "${BRAIN_NOTES_PATH}")" "$(basename "${BRAIN_NOTES_PATH}")"
    log "Brain notes backup complete"
fi

# --- Cleanup old backups ---
log "Removing backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -mtime +${RETENTION_DAYS} -delete

# --- Summary ---
log "Backup complete! Files in ${BACKUP_DIR}:"
ls -lh "${BACKUP_DIR}"/*_${DATE}* 2>/dev/null
