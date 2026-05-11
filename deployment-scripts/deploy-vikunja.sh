#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

required_vars=("VIKUNJA_DB_NAME" "VIKUNJA_DB_USER" "VIKUNJA_DB_PASSWORD" "VIKUNJA_DB_ROOT_PASSWORD")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo -e "${RED}Error: Required environment variable $var is not set${NC}"
        exit 1
    fi
done

DATA_DIR="${HOME}/vikunja"
mkdir -p "${DATA_DIR}/db" "${DATA_DIR}/files"

docker network create vikunja_default 2>/dev/null || true

echo -e "${YELLOW}Pulling images...${NC}"
docker pull mariadb:10
docker pull vikunja/vikunja:latest

echo -e "${YELLOW}Stopping existing containers...${NC}"
docker rm -f vikunja vikunja-db 2>/dev/null || true

echo -e "${YELLOW}Starting MariaDB...${NC}"
docker run -d \
  --name vikunja-db \
  --network vikunja_default \
  --restart always \
  -e MYSQL_ROOT_PASSWORD="${VIKUNJA_DB_ROOT_PASSWORD}" \
  -e MYSQL_DATABASE="${VIKUNJA_DB_NAME}" \
  -e MYSQL_USER="${VIKUNJA_DB_USER}" \
  -e MYSQL_PASSWORD="${VIKUNJA_DB_PASSWORD}" \
  -v "${DATA_DIR}/db:/var/lib/mysql" \
  mariadb:10 \
  --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci

echo -e "${YELLOW}Waiting for MariaDB to be ready...${NC}"
for i in $(seq 1 30); do
    docker exec vikunja-db mysqladmin ping -h localhost --silent 2>/dev/null && break
    sleep 2
done

echo -e "${YELLOW}Starting Vikunja...${NC}"
docker run -d \
  --name vikunja \
  --network vikunja_default \
  --restart always \
  -p 3456:3456 \
  -e VIKUNJA_DATABASE_HOST=vikunja-db \
  -e VIKUNJA_DATABASE_TYPE=mysql \
  -e VIKUNJA_DATABASE_DATABASE="${VIKUNJA_DB_NAME}" \
  -e VIKUNJA_DATABASE_USER="${VIKUNJA_DB_USER}" \
  -e VIKUNJA_DATABASE_PASSWORD="${VIKUNJA_DB_PASSWORD}" \
  -v "${DATA_DIR}/files:/app/vikunja/files" \
  vikunja/vikunja:latest

echo -e "${GREEN}Vikunja deployed on port 3456${NC}"
