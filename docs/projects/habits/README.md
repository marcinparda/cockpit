# habits

React 19 habit tracker. Part of the `cockpit-app` Nx monorepo (`apps/habits/`).

- **Port**: 4208 (prod container `habits`, image `ghcr.io/marcinparda/cockpit-habits:latest`, `habits.parda.me`)
- **State**: TanStack Query for server state; service worker registered for push notifications
- **Deployment**: independent Docker container (`nginx:alpine`, SPA fallback), `linux/arm64`

Same pattern as `cockpit` (Vite + TanStack Query + shadcn/ui + Tailwind CSS v4), plus a service worker for push. See [`../cockpit/architecture.md`](../cockpit/architecture.md) for the full monorepo layout and [`docs/standards/frontend/architecture.md`](../../standards/frontend/architecture.md) for cross-app conventions.
