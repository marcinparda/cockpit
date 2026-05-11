# Architecture

> If you need info about app structure, lib layout, API integration, auth flow, or build system — read this file.

## Overall Architecture

**Multi-framework Nx monorepo** — four independent single-page applications sharing code via Nx libraries. Three apps use React 19, one uses Angular 19.

```
cockpit-app/
├── apps/
│   ├── cockpit/     # React 19 — main dashboard/launcher (port 4203)
│   ├── login/       # React 19 — auth gate (port 4202)
│   ├── cv/          # React 19 — CV editor (port 4204)
│   └── store/       # Angular 19 — key-value store browser (port 4205)
└── libs/
    ├── cockpit/ui/                    # Cockpit-specific React layout components
    ├── shared/types/api-types/        # Auto-generated OpenAPI types + Zod schemas
    ├── shared/data-access/common/     # Framework-agnostic API layer (fetch, auth)
    ├── shared/data-access/react/      # React-specific hooks (useUser, QueryClient)
    ├── shared/ui/react/               # Primitive React components (Radix UI / shadcn-style)
    └── shared/utils/                  # environments, cn(), logger, predicates
```

## Layered Architecture

Based on Nx [enforce-module-boundaries](https://nx.dev/docs/features/enforce-module-boundaries) — projects are tagged with `type:` and `scope:` dimensions, and ESLint enforces dependency direction at lint time.

Libs follow a strict dependency direction — lower layers must not import from higher layers:

```
Layer 0 — types/utils   (no internal deps)        → type:util
Layer 1 — data-access   (can import: types/utils)  → type:data-access
Layer 2 — ui            (can import: 0, 1)          → type:ui
Layer 3 — feature       (can import: 0, 1, 2)       → type:feature
Layer 4 — apps          (can import: anything)      → type:app
```

| Layer | Nx tag | Libs |
|-------|--------|------|
| types/utils | `type:util` | `@cockpit-app/api-types`, `@cockpit-app/shared-utils` |
| data-access | `type:data-access` | `@cockpit-app/common-shared-data-access`, `@cockpit-app/shared-react-data-access` |
| ui | `type:ui` | `@cockpit-app/shared-react-ui`, `@cockpit-app/cockpit-ui` |
| feature | `type:feature` | *(none yet — future app-specific feature libs)* |
| apps | `type:app` | `apps/*` |

Libs are also split by scope — **shared** libs (under `libs/shared/`) may be imported by any lib or app at the same or higher layer. **App-specific** libs (e.g. `libs/cockpit/ui/`) may only be imported by their own app (`scope:cockpit` vs `scope:shared`).

**Rule:** `data-access` cannot import `ui`. `shared-utils` cannot import `shared-react-data-access`. A shared lib cannot import an app-specific lib.

### Apps as compositions

Apps are thin entry points — they compose building blocks from libs rather than implementing logic directly. `apps/cockpit` is the canonical example:

- Layout and components → `@cockpit-app/cockpit-ui`
- Server state (current user) → `@cockpit-app/shared-react-data-access`
- Auth actions (logout) → `@cockpit-app/common-shared-data-access`
- URLs → `@cockpit-app/shared-utils`

The app itself only wires providers, routing, and top-level composition. Business logic lives in libs.

All `@cockpit-app/*` path aliases are declared in `tsconfig.base.json`.

## Apps

### `apps/cockpit` — Dashboard

React 19 + React Router DOM 6 + TanStack Query v5.

Entry: `apps/cockpit/src/main.tsx` — wraps app in `QueryClientProvider + BrowserRouter + TooltipProvider`.

Shows authenticated user info via `useUser()`. If no user returned, calls `logout()` and shows skeleton. Renders nav with "Apps" and "Dashboard" links, then app cards via `AppCard` from `@cockpit-app/cockpit-ui`.

### `apps/login` — Auth Gate

React 19, no router.

Entry: `apps/login/src/main.tsx` — on mount calls `isLoggedIn()`. If authenticated, `window.location.replace(cockpitUrl)`. Otherwise renders split-panel `LoginForm`.

`login(email, password)` POSTs to `/api/v1/authentication/sessions/login` — API sets HttpOnly cookies.

### `apps/cv` — CV Editor

React 19 + TanStack Query v5.

Entry: `apps/cv/src/main.tsx`. Single page, no router. Falls back to `https://parda.me/cv.pdf` if unauthenticated or on error.

Fetches 8 CV sections in parallel via `GET /api/v1/store/{prefix}/{category}/{key}`. Supports named "presets" layered over a "base" preset. `useCVData` hook uses `useQuery` + `useMutation` with in-memory dirty tracking.

### `apps/store` — Store Browser

Angular 19 + Angular Router + Angular HttpClient + PrimeNG 19.

Entry: `apps/store/src/main.ts` — `bootstrapApplication(AppComponent, appConfig)`.

Lazy-loads `STORE_ROUTES`. All routes protected by `authGuard` which calls `AuthService.checkSession()`. Includes Monaco Editor for JSON editing. Uses `authInterceptor` (HttpInterceptorFn) to clone every request with `withCredentials: true` and redirect to login on 401.

Build: Angular CLI / Webpack (`@angular-devkit/build-angular:browser`) — not Vite.

## Libraries

### `@cockpit-app/api-types` (`libs/shared/types/api-types`)

Auto-generated OpenAPI types.

### `@cockpit-app/common-shared-data-access` (`libs/shared/data-access/common`)

Framework-agnostic HTTP layer used by all apps.

### `@cockpit-app/shared-react-data-access` (`libs/shared/data-access/react`)

React-specific data access.

### `@cockpit-app/shared-react-ui` (`libs/shared/ui/react`)

Primitive React components built on Radix UI (shadcn/ui-style)

### `@cockpit-app/shared-utils` (`libs/shared/utils`)

## Auth Flow

Cookie-based sessions with refresh token:

1. **Login**: `POST /api/v1/authentication/sessions/login` → API sets HttpOnly cookies (session + refresh token)
2. **Requests**: all fetch calls use `credentials: 'include'` — cookies sent automatically
3. **401 (React apps)**: `fetcher` catches 401 → `POST /api/v1/authentication/tokens/refresh` → retry original request. If refresh also fails and `withRedirect=true` → `logout()` then redirect to `loginUrl?redirect_uri=<current>`
4. **401 (Angular store)**: `authInterceptor` catches 401 → `authService.redirectToLogin()` (no refresh attempt)
5. **Session check**: `authGuard` (Angular) calls `GET /api/v1/authentication/sessions/me` before allowing navigation

## State Management

| App     | Pattern                                                                           |
| ------- | --------------------------------------------------------------------------------- |
| cockpit | TanStack Query for server state only                                              |
| login   | `useState` — minimal local state                                                  |
| cv      | TanStack Query + `useState` for in-memory CV data + `useRef` for load tracking    |
| store   | Angular signals / RxJS `Observable` from `HttpClient`, DI-based services. No NgRx |

## Styling

**React apps**: Tailwind CSS v4 via `@tailwindcss/vite` plugin — no `tailwind.config.js`, config is CSS-native. Design tokens as CSS custom properties in `:root` / `.dark`. Radix UI primitives + `cn()` utility.

**Angular store**: PrimeNG 19 with Aura theme preset. Global CSS + `primeicons.css`.

Nx 21 with plugins: `@nx/vite`, `@nx/eslint`, `@nx/playwright`, `@nx/react/router-plugin`.

Path aliases for all `@cockpit-app/*` imports defined in `tsconfig.base.json`.

## Deployment

Each app has `apps/{name}/Dockerfile`:

- Base: `nginx:alpine`
- Copy `dist/apps/{name}` → `/usr/share/nginx/html`
- Nginx config: `try_files $uri $uri/ /index.html` (SPA fallback)
- Target platform: `linux/arm64` (Raspberry Pi)

Images pushed to `ghcr.io/{owner}/cockpit-{appname}:{sha}` and `:latest`.

CI uses `nx affected` — only changed apps rebuild on each push to `master`.
