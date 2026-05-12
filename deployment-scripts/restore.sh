#!/bin/bash
# Restore a specific service from the latest backup
# Usage: ./restore.sh <service>
# Services: postgres, redis, vikunja-db, vikunja-files, brain

set -euo pipefail

BACKUP_DIR="${HOME}/backups"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

usage() {
    echo -e "Usage: $0 <service>"
    echo -e "Services: postgres, redis, vikunja-db, vikunja-files, brain"
    exit 1
}

[[ $# -lt 1 ]] && usage

latest() { ls -t "${BACKUP_DIR}"/$1 2>/dev/null | head -1; }

case "$1" in
    postgres)
        FILE=$(latest "postgres_*.sql.gz")
        [[ -z "$FILE" ]] && { echo -e "${RED}No PostgreSQL backup found${NC}"; exit 1; }
        echo -e "${YELLOW}Restoring PostgreSQL from: $(basename "$FILE")${NC}"
        echo -e "${RED}WARNING: This will overwrite the current database!${NC}"
        read -p "Continue? [y/N] " -r && [[ $REPLY =~ ^[Yy]$ ]] || exit 0
        gunzip -c "$FILE" | docker exec -i cockpit_db_prod psql -U "${DB_USER:-cockpit}"
        echo -e "${GREEN}PostgreSQL restored${NC}"
        ;;
    redis)
        FILE=$(latest "redis_*.rdb.gz")
        [[ -z "$FILE" ]] && { echo -e "${RED}No Redis backup found${NC}"; exit 1; }
        echo -e "${YELLOW}Restoring Redis from: $(basename "$FILE")${NC}"
        read -p "Continue? [y/N] " -r && [[ $REPLY =~ ^[Yy]$ ]] || exit 0
        docker exec cockpit_redis_prod redis-cli -a "${REDIS_PASSWORD}" --no-auth-warning SHUTDOWN NOSAVE 2>/dev/null || true
        sleep 2
        gunzip -c "$FILE" > /tmp/restore_dump.rdb
        docker cp /tmp/restore_dump.rdb cockpit_redis_prod:/var/lib/redis-stack/dump.rdb
        rm /tmp/restore_dump.rdb
        docker start cockpit_redis_prod
        echo -e "${GREEN}Redis restored${NC}"
        ;;
    vikunja-db)
        FILE=$(latest "vikunja_db_*.sql.gz")
        [[ -z "$FILE" ]] && { echo -e "${RED}No Vikunja DB backup found${NC}"; exit 1; }
        echo -e "${YELLOW}Restoring Vikunja MariaDB from: $(basename "$FILE")${NC}"
        echo -e "${RED}WARNING: This will overwrite the Vikunja database!${NC}"
        read -p "Continue? [y/N] " -r && [[ $REPLY =~ ^[Yy]$ ]] || exit 0
        gunzip -c "$FILE" | docker exec -i vikunja-db mysql -u "${VIKUNJA_DB_USER:-vikunja}" -p"${VIKUNJA_DB_PASSWORD}" "${VIKUNJA_DB_NAME:-vikunja}"
        echo -e "${GREEN}Vikunja MariaDB restored${NC}"
        ;;
    vikunja-files)
        FILE=$(latest "vikunja_files_*.tar.gz")
        [[ -z "$FILE" ]] && { echo -e "${RED}No Vikunja files backup found${NC}"; exit 1; }
        echo -e "${YELLOW}Restoring Vikunja files from: $(basename "$FILE")${NC}"
        read -p "Continue? [y/N] " -r && [[ $REPLY =~ ^[Yy]$ ]] || exit 0
        tar xzf "$FILE" -C "${HOME}/vikunja"
        echo -e "${GREEN}Vikunja files restored${NC}"
        ;;
    brain)
        FILE=$(latest "brain_notes_*.tar.gz")
        [[ -z "$FILE" ]] && { echo -e "${RED}No Brain notes backup found${NC}"; exit 1; }
        echo -e "${YELLOW}Restoring Brain notes from: $(basename "$FILE")${NC}"
        read -p "Continue? [y/N] " -r && [[ $REPLY =~ ^[Yy]$ ]] || exit 0
        tar xzf "$FILE" -C "$(dirname "${BRAIN_NOTES_PATH}")"
        echo -e "${GREEN}Brain notes restored${NC}"
        ;;
    *)
        usage
        ;;
esac
