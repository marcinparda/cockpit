#!/bin/bash

# Deploys extra services: actual-http-api, Vikunja.
# Triggered manually — not part of the automatic API/app CI pipelines.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Deploying LiteLLM ==="
bash "${SCRIPT_DIR}/deploy-litellm.sh"

echo "=== Deploying actual (server) ==="
bash "${SCRIPT_DIR}/deploy-actual-server.sh"

echo "=== Deploying actual-http-api ==="
bash "${SCRIPT_DIR}/deploy-actual.sh"

echo "=== Deploying Vikunja ==="
bash "${SCRIPT_DIR}/deploy-vikunja.sh"

echo "=== All extras deployed ==="
