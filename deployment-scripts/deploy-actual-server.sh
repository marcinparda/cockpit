#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

required_vars=("ACTUAL_SERVER_PASSWORD")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo -e "${RED}Error: Required environment variable $var is not set${NC}"
        exit 1
    fi
done

echo -e "${YELLOW}Pulling actual-server image...${NC}"
docker pull actualbudget/actual-server:latest

echo -e "${YELLOW}Stopping existing actual container...${NC}"
docker rm -f actual 2>/dev/null || true

docker network create actual_network 2>/dev/null || true
docker volume create actual_data 2>/dev/null || true

echo -e "${YELLOW}Starting actual container...${NC}"
docker run -d \
  --name actual \
  --network actual_network \
  --restart always \
  -p 5006:5006 \
  -v actual_data:/data \
  actualbudget/actual-server:latest

echo -e "${YELLOW}Waiting for actual to come up...${NC}"
for i in $(seq 1 30); do
    if docker exec actual wget -q -O- http://localhost:5006 >/dev/null 2>&1; then
        break
    fi
    sleep 2
done

echo -e "${YELLOW}Setting actual server password...${NC}"
printf '%s\n%s\n' "${ACTUAL_SERVER_PASSWORD}" "${ACTUAL_SERVER_PASSWORD}" | \
  docker exec -i actual node /app/src/scripts/reset-password.js || \
  echo -e "${RED}Warning: could not auto-set password (may already be set, or script path changed) — verify manually via web UI on port 5006${NC}"

echo -e "${GREEN}actual server deployed on port 5006${NC}"
