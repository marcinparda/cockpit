#!/bin/bash

# Required environment variables: GITHUB_TOKEN, GITHUB_ACTOR
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [[ -z "$GITHUB_TOKEN" || -z "$GITHUB_ACTOR" ]]; then
  echo -e "${RED}Error: GITHUB_TOKEN and GITHUB_ACTOR must be set.${NC}"
  exit 1
fi

OWNER="${OWNER:-marcinparda}"
REPO="${REPO:-cockpit}"

echo -e "${YELLOW}Logging in to GitHub Container Registry...${NC}"
echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin

declare -A apps=(
  [login]="4202"
  [cockpit]="4203"
  [cv]="4204"
  [store]="4205"
  [storybook]="4207"
)

for app in "${!apps[@]}"; do
  port="${apps[$app]}"
  image="ghcr.io/$OWNER/$REPO-$app:latest"
  container="$app"

  echo -e "${YELLOW}Tagging current image as previous for rollback ($app)...${NC}"
  docker tag "$image" "ghcr.io/$OWNER/$REPO-$app:previous" 2>/dev/null || true

  echo -e "${YELLOW}Pulling latest image for $container...${NC}"
  docker pull "$image"

  echo -e "${YELLOW}Stopping existing container $container...${NC}"
  docker stop "$container" 2>/dev/null || true
  docker rm "$container" 2>/dev/null || true

  echo -e "${YELLOW}Starting $container on port $port:80...${NC}"
  docker run -d \
    --name "$container" \
    --restart unless-stopped \
    -p "$port:80" \
    "$image"

  echo -e "${YELLOW}Health check for $container...${NC}"
  healthy=false
  for i in $(seq 1 30); do
    if curl -sf "http://localhost:$port/" > /dev/null 2>&1; then
      echo -e "${GREEN}$container is healthy${NC}"
      healthy=true
      break
    fi
    sleep 3
  done

  if [ "$healthy" = false ]; then
    echo -e "${RED}$container failed health check, rolling back...${NC}"
    docker rm -f "$container" 2>/dev/null || true
    docker run -d \
      --name "$container" \
      --restart unless-stopped \
      -p "$port:80" \
      "ghcr.io/$OWNER/$REPO-$app:previous" || true
    exit 1
  fi
done

docker image prune -a -f

echo -e "${GREEN}All app deployments completed successfully${NC}"
