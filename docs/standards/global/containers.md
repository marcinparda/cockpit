## Container and Deployment Standards

### Multi-Stage Docker Build for Python API
Builder stage installs Poetry + deps; slim production stage copies venv and runs app. Source: `cockpit-api/Dockerfile`.

### Nginx Alpine for Frontend Apps
Frontend Docker images use `nginx:alpine` base serving static build output. Source: `cockpit-app/apps/cockpit/Dockerfile`.

### `linux/arm64` Docker Target
All Docker images must target `linux/arm64` for deployment on Raspberry Pi. Source: `docs/standards/frontend/architecture.md`.

### Independent Container Per App
Each frontend app and the API deploy as separate Docker containers. Docker Compose orchestrates on Raspberry Pi. Source: `CLAUDE.md`, `architecture.md`.

### SPA Nginx `try_files` Fallback
Frontend nginx config must include `try_files $uri $uri/ /index.html` for SPA client-side routing. Source: `docs/standards/frontend/architecture.md`.

### `nx affected` for CI Builds
CI uses `nx affected` to detect changed apps and only rebuild those. Source: `docs/standards/frontend/architecture.md`.
