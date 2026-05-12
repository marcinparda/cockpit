#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

required_vars=("OPEN_ROUTER_KEY" "LITELLM_MASTER_KEY" "LANGFUSE_PUBLIC_KEY" "LANGFUSE_SECRET_KEY" "LANGFUSE_HOST")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo -e "${RED}Error: Required environment variable $var is not set${NC}"
        exit 1
    fi
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${YELLOW}Pulling LiteLLM image...${NC}"
docker pull docker.litellm.ai/berriai/litellm:main-stable

echo -e "${YELLOW}Stopping existing LiteLLM container...${NC}"
docker rm -f litellm 2>/dev/null || true

docker network create cockpit_network_prod 2>/dev/null || true

echo -e "${YELLOW}Copying LiteLLM config...${NC}"
mkdir -p "${HOME}/.litellm"
cp "${SCRIPT_DIR}/litellm/config.yaml" "${HOME}/.litellm/config.yaml"

echo -e "${YELLOW}Starting LiteLLM container...${NC}"
docker run -d \
  --name litellm \
  --network cockpit_network_prod \
  --restart always \
  -p 4000:4000 \
  -v "${HOME}/.litellm/config.yaml:/app/config.yaml" \
  -e OPENROUTER_API_KEY="${OPEN_ROUTER_KEY}" \
  -e LITELLM_MASTER_KEY="${LITELLM_MASTER_KEY}" \
  -e LANGFUSE_PUBLIC_KEY="${LANGFUSE_PUBLIC_KEY}" \
  -e LANGFUSE_SECRET_KEY="${LANGFUSE_SECRET_KEY}" \
  -e LANGFUSE_HOST="${LANGFUSE_HOST}" \
  -e LITELLM_LOCAL_MODEL_COST_MAP="True" \
  docker.litellm.ai/berriai/litellm:main-stable \
  --config /app/config.yaml --port 4000

echo -e "${GREEN}LiteLLM deployed on port 4000${NC}"
