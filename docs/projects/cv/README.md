# cv

React 19 CV/portfolio site. Part of the `cockpit-app` Nx monorepo (`apps/cv/`).

- **Port**: 4204 (prod container `cv`, image `ghcr.io/marcinparda/cockpit-cv:latest`)
- **Framework**: React 19, TanStack Query for server state
- **Deployment**: independent Docker container (`nginx:alpine`, SPA fallback), `linux/arm64`, rebuilt on `nx affected` when changed

All apps in the monorepo (`cockpit`, `login`, `cv`, `store`, `habits`) are React 19. See [`../cockpit/architecture.md`](../cockpit/architecture.md) for the full monorepo layout and [`docs/standards/frontend/architecture.md`](../../standards/frontend/architecture.md) for cross-app conventions.
