#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

required_vars=("OPEN_ROUTER_KEY" "HERMES_API_KEY" "MCP_API_KEY")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo -e "${RED}Error: Required environment variable $var is not set${NC}"
        exit 1
    fi
done

echo -e "${YELLOW}Pulling Hermes image...${NC}"
docker pull nousresearch/hermes-agent:latest

echo -e "${YELLOW}Stopping existing Hermes container...${NC}"
docker rm -f hermes 2>/dev/null || true

docker network create cockpit_network_prod 2>/dev/null || true

echo -e "${YELLOW}Writing Hermes config...${NC}"
mkdir -p "${HOME}/.hermes"
cat > "${HOME}/.hermes/config.yaml" << EOF
model:
  default: "${HERMES_MODEL:-openai/gpt-4o-mini}"
  provider: "auto"
  base_url: "https://openrouter.ai/api/v1"
EOF

cat > "${HOME}/.hermes/cli-config.yaml" << EOF
mcp_servers:
  cockpit:
    url: http://cockpit_api_prod:8000/mcp
    headers:
      Authorization: "Bearer ${MCP_API_KEY}"
EOF

echo -e "${YELLOW}Starting Hermes container...${NC}"
docker run -d \
  --name hermes \
  --network cockpit_network_prod \
  --restart always \
  -p 8642:8642 \
  -v "${HOME}/.hermes:/opt/data" \
  -e HERMES_UID=$(id -u) \
  -e HERMES_GID=$(id -g) \
  -e API_SERVER_HOST=0.0.0.0 \
  -e API_SERVER_PORT=8642 \
  -e API_SERVER_KEY="${HERMES_API_KEY}" \
  -e OPENROUTER_API_KEY="${OPEN_ROUTER_KEY}" \
  nousresearch/hermes-agent:latest \
  gateway run

echo -e "${GREEN}Hermes deployed on port 8642${NC}"
