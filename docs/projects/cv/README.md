# cv

Vue 3.5 + Pinia CV/portfolio site. Part of the `cockpit-app` Nx monorepo (`apps/cv/`).

- **Port**: 4204 (prod container `cv`, image `ghcr.io/marcinparda/cockpit-cv:latest`)
- **Framework**: Vue 3.5, Pinia for state
- **Deployment**: independent Docker container (`nginx:alpine`, SPA fallback), `linux/arm64`, rebuilt on `nx affected` when changed

Only non-React app in the monorepo — everything else (`cockpit`, `login`, `store`, `habits`) is React 19. See [`../cockpit/architecture.md`](../cockpit/architecture.md) for the full monorepo layout and [`docs/standards/frontend/architecture.md`](../../standards/frontend/architecture.md) for cross-app conventions.
