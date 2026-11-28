## Frontend Architecture Standards

### Unidirectional Nx Library Dependency Flow
Strict dependency direction enforced by ESLint `@nx/enforce-module-boundaries`. Flow: `util → data-access → ui → feature → app`. Lower layers must not import from higher layers.

```
Layer 0 — types/utils   (no internal deps)        → type:util
Layer 1 — data-access   (can import: 0)            → type:data-access
Layer 2 — ui            (can import: 0)            → type:ui
Layer 3 — feature       (can import: 0, 1, 2, 3) → type:feature  (3 = other feature libs)
Layer 4 — apps          (can import: anything)     → type:app
```

| Layer | Nx tag | Libs |
|-------|--------|------|
| types/utils | `type:util` | `@cockpit-app/api-types`, `@cockpit-app/shared-utils` |
| data-access | `type:data-access` | `@cockpit-app/common-shared-data-access`, `@cockpit-app/shared-react-data-access` |
| ui | `type:ui` | `@cockpit-app/shared-react-ui` (Shared UI), `@cockpit-app/cockpit-ui` and future `@cockpit-app/<app>-ui` (App UI, `libs/<app>/ui`) |
| feature | `type:feature` | `@cockpit-app/shared-react-feature` (shared), future `@cockpit-app/<app>-feature` (App feature, `libs/<app>/feature`) |
| apps | `type:app` | `apps/*` |

### Nx Library Tags Required
Every library must have both `type:*` (util/data-access/ui/feature) and `scope:*` (shared/cockpit/login/cv/store/habits) tags. Source: `eslint.config.mjs` depConstraints.

Libs are also split by scope — **shared** libs (under `libs/shared/`) may be imported by any lib or app at the same or higher layer. **App-specific** libs (e.g. `libs/cockpit/ui/`) may only be imported by their own app.

**Rule:** `data-access` cannot import `ui`. `shared-utils` cannot import `shared-react-data-access`. A shared lib cannot import an app-specific lib.

### UI and Feature Libraries
| Library | Tags | Holds |
|---------|------|-------|
| Shared UI (`shared-react-ui`) | `scope:shared`, `type:ui` | Generic components used by two or more Apps, incl. the `AppShell` every App renders inside |
| Shared feature (`shared-react-feature`) | `scope:shared`, `type:feature` | Data-connected components used by two or more Apps: `PermissionGuard`, `RequireUser`, `UserMenu` |
| App UI (`libs/<app>/ui`) | `scope:<app>`, `type:ui` | Presentational components used by one App |
| App feature (`libs/<app>/feature`) | `scope:<app>`, `type:feature` | Data-connected containers: use data-access hooks, compose UI |
| App (`apps/<app>`) | `scope:<app>`, `type:app` | Routing and providers only |

- **Creation:** App UI and App feature libs are created only when an App needs them, not up front.
- **Discovery and promotion:** before creating a component, search Shared UI and every App UI lib. A component belongs in Shared UI as soon as two Apps use it: if it exists in another App's lib, move it to Shared UI and reuse it there. Never copy it.
- **ui purity:** a ui component may hold local UI state (open/closed, active tab). It must not import data-access, call the API or hold domain rules. This holds in every scope and is lint-enforced (`type:ui` may depend only on `type:ui` and `type:util`). Why: [ADR 0005](../../adr/0005-ui-libs-are-pure-in-every-scope.md).

### Apps Are Thin Composition Entry Points
Apps only wire providers, routing, and top-level composition. Business logic lives in libs, not in app-level code. Apps compose building blocks from libs rather than implementing logic directly — `apps/cockpit` is the canonical example: layout/components → `@cockpit-app/cockpit-ui`, server state → `@cockpit-app/shared-react-data-access`, auth actions → `@cockpit-app/common-shared-data-access`, URLs → `@cockpit-app/shared-utils`.

All `@cockpit-app/*` path aliases are declared in `tsconfig.base.json`.

### OpenAPI-Generated TypeScript Types
All apps use `@cockpit-app/api-types` (`libs/shared/types/api-types`, auto-generated OpenAPI types + Zod schemas). Refresh with `make app-update-types`. Never manually write types that duplicate API response shapes.

### Nx Tooling
Run tasks via `nx`, not underlying tooling directly, and use the Nx MCP tools. See the "General Guidelines for working with Nx" section in [`cockpit-app/AGENTS.md`](../../../cockpit-app/AGENTS.md) (auto-maintained by Nx — canonical copy lives there, don't duplicate).

### Cookie-Based Auth with `credentials: 'include'`
Cookie-based sessions with refresh token, all apps are React now (no Angular exceptions):

1. **Login**: `POST /api/v1/authentication/sessions/login` → API sets HttpOnly cookies (session + refresh token)
2. **Requests**: all fetch calls use `credentials: 'include'` — cookies sent automatically
3. **401**: `fetcher` catches 401 → `POST /api/v1/authentication/tokens/refresh` → retry original request. If refresh also fails and `withRedirect=true` → `logoutAndRedirect()`
4. **Logout**: always call `logoutAndRedirect()` (`common-shared-data-access`): it ends the session, then redirects to `loginUrl?redirect_uri=<current>` even if the API call fails. Bare `logout()` only ends the session and leaves the user on a dead page.

## App Inventory (reference)

```
cockpit-app/
├── apps/
│   ├── cockpit/     # React 19 — main dashboard/launcher (port 4203)
│   ├── login/       # React 19 — auth gate (port 4202)
│   ├── cv/          # React 19 — CV editor (port 4204)
│   ├── store/       # React 19 — key-value store browser (port 4205)
│   └── habits/      # React 19 — habit tracker (port 4208, habits.parda.me)
└── libs/
    ├── cockpit/ui/                    # Cockpit App UI (scope:cockpit, type:ui)
    ├── <app>/ui/, <app>/feature/      # App UI / App feature, created only when the App needs them
    ├── shared/types/api-types/        # Auto-generated OpenAPI types + Zod schemas
    ├── shared/data-access/common/     # Framework-agnostic API layer (fetch, auth)
    ├── shared/data-access/react/      # React-specific hooks (useUser, QueryClient)
    ├── shared/ui/react/               # Primitive React components (Radix UI / shadcn-style)
    ├── shared/feature/react/          # Shared feature libs (scope:shared, type:feature)
    └── shared/utils/                  # environments, cn(), logger, predicates
```

Note: `store` was migrated from Angular 19 to React 19 (see GitHub issue #81) — all apps are React 19.

### State Management by App

| App     | Pattern                                                                        |
| ------- | ------------------------------------------------------------------------------ |
| cockpit | TanStack Query for server state only                                           |
| login   | `useState` — minimal local state                                               |
| cv      | TanStack Query for server state                                                |
| store   | TanStack Query + `useReducer` for tree state                                   |
| habits  | TanStack Query, service worker registered for push notifications               |

### Deployment

Each app has `apps/{name}/Dockerfile`:

- Base: `nginx:alpine`
- Copy `dist/apps/{name}` → `/usr/share/nginx/html`
- Nginx config: `try_files $uri $uri/ /index.html` (SPA fallback)
- Target platform: `linux/arm64` (Raspberry Pi)

Images pushed to `ghcr.io/{owner}/cockpit-{appname}:{sha}` and `:latest`. CI uses `nx affected` — only changed apps rebuild on each push to `master`.

### Adding a New Component to `@cockpit-app/shared-react-ui`
See [`libs/shared/ui/react/README.md`](../../../cockpit-app/libs/shared/ui/react/README.md).
