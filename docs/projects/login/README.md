# login

React 19 authentication gate. Part of the `cockpit-app` Nx monorepo (`apps/login/`).

- **Port**: 4202 (prod container `login`, image `ghcr.io/marcinparda/cockpit-login:latest`)
- **State**: `useState` — minimal local state
- **Role**: fronts cookie-based session login for the other apps. `POST /api/v1/authentication/sessions/login` on `cockpit-api` sets HttpOnly session + refresh cookies; other apps redirect here on 401 with `?redirect_uri=<original>`
- **Deployment**: independent Docker container (`nginx:alpine`, SPA fallback), `linux/arm64`

See [`docs/standards/frontend/architecture.md`](../../standards/frontend/architecture.md) for the full auth flow (`credentials: 'include'`, refresh-then-retry on 401).
