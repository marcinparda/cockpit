#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [[ -z "$ACTUAL_HTTP_API_KEY" ]]; then
    echo -e "${RED}Error: ACTUAL_HTTP_API_KEY is not set${NC}"
    exit 1
fi

echo -e "${YELLOW}Pulling actual-http-api image...${NC}"
docker pull jhonderson/actual-http-api:latest

echo -e "${YELLOW}Stopping existing actual-http-api container...${NC}"
docker rm -f actual-http-api 2>/dev/null || true

docker network create actual_network 2>/dev/null || true
docker network connect actual_network actual 2>/dev/null || true
docker volume create actual_http_api_data 2>/dev/null || true

echo -e "${YELLOW}Starting actual-http-api container...${NC}"
docker run -d \
  --name actual-http-api \
  --network actual_network \
  --restart always \
  -p 5007:5007 \
  -v actual_http_api_data:/data \
  -e API_KEY="${ACTUAL_HTTP_API_KEY}" \
  -e ACTUAL_DATA_DIR=/data \
  jhonderson/actual-http-api:latest

docker network connect cockpit_network_prod actual-http-api 2>/dev/null || true

echo -e "${GREEN}actual-http-api deployed on port 5007${NC}"
