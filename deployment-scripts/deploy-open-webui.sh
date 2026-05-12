#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

required_vars=("LITELLM_MASTER_KEY" "HERMES_API_KEY")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo -e "${RED}Error: Required environment variable $var is not set${NC}"
        exit 1
    fi
done

echo -e "${YELLOW}Pulling Open WebUI image...${NC}"
docker pull ghcr.io/open-webui/open-webui:main

echo -e "${YELLOW}Stopping existing open-webui container...${NC}"
docker rm -f open-webui 2>/dev/null || true

docker network create cockpit_network_prod 2>/dev/null || true
docker volume create open_webui_data 2>/dev/null || true

echo -e "${YELLOW}Starting Open WebUI container...${NC}"
docker run -d \
  --name open-webui \
  --network cockpit_network_prod \
  --restart always \
  -p 4206:8080 \
  -v open_webui_data:/app/backend/data \
  -e OPENAI_API_BASE_URLS="http://litellm:4000/v1;http://hermes:8642/v1" \
  -e OPENAI_API_KEYS="${LITELLM_MASTER_KEY};${HERMES_API_KEY}" \
  -e ENABLE_SIGNUP=true \
  ghcr.io/open-webui/open-webui:main

echo -e "${GREEN}Open WebUI deployed on port 4206${NC}"
