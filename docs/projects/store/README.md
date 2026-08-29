# store

React 19 key-value store browser. Part of the `cockpit-app` Nx monorepo (`apps/store/`).

- **Port**: 4205 (prod container `store`, image `ghcr.io/marcinparda/cockpit-store:latest`)
- **State**: TanStack Query + `useReducer` for tree state
- **History**: migrated from Angular 19 to React 19 — see [`docs/tasks/migrations/2026-05-21-store-angular-to-react/`](../../tasks/migrations/2026-05-21-store-angular-to-react/)
- **Deployment**: independent Docker container (`nginx:alpine`, SPA fallback), `linux/arm64`

Same pattern as `cockpit` (Vite + TanStack Query + shadcn/ui + Tailwind CSS v4). See [`../cockpit/architecture.md`](../cockpit/architecture.md) for the full monorepo layout.
