#!/bin/bash

# Deploys extra services: Hermes, actual-http-api, Open WebUI, Vikunja.
# Triggered manually — not part of the automatic API/app CI pipelines.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Deploying LiteLLM ==="
bash "${SCRIPT_DIR}/deploy-litellm.sh"

echo "=== Deploying Hermes ==="
bash "${SCRIPT_DIR}/deploy-hermes.sh"

echo "=== Deploying actual-http-api ==="
bash "${SCRIPT_DIR}/deploy-actual.sh"

echo "=== Deploying Open WebUI ==="
bash "${SCRIPT_DIR}/deploy-open-webui.sh"

echo "=== Deploying Vikunja ==="
bash "${SCRIPT_DIR}/deploy-vikunja.sh"

echo "=== All extras deployed ==="
