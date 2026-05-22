# Migration Requirements

## Scope
Full rewrite of cockpit-app/apps/store/ from Angular 19 to React 19.
Big-bang strategy: replace all Angular source files in one migration.

## App Identity
- Nx project name: `store` (unchanged)
- Dev server port: 4205 (unchanged)
- Build output: `dist/apps/store` (unchanged)
- Docker + nginx configs: preserve same port/container setup

## Feature Scope
Replicate all active features from the Angular app:
- Hierarchical key browser: prefix → category → key tree (sidebar)
- Entry detail/edit panel: view, edit, create modes
- Monaco JSON editor: embedded in entry panel
- Inline add prefix/category in tree (not a modal)
- Delete confirmation dialog (AlertDialog)
- Toast notifications for operations (Toaster)
- Auth guard: redirect to login if not authenticated
- Permission guard: require redis_store:read permission

DO NOT port:
- StoreToolbarComponent (unused in Angular app)
- patchKey endpoint (implemented but never called)

## Authentication
- Cookie-based auth, credentials: 'include'
- Use existing shared lib primitives: useUser(), usePermissions(), PermissionGuard, fetcher.ts
- 401 handling: fetcher.ts auto-refreshes token then redirects to login (already handled)

## API Types
- Use @cockpit-app/api-types for any OpenAPI-generated types
- Write Zod schemas for store-specific types (StoreEnvelope, StoreMeta, etc.) since they are not yet in api-types

## Test Requirements
- Target: ≥80% lines/functions/branches/statements (CI threshold)
- Framework: Vitest + jsdom + @testing-library/react
- Co-locate .spec.tsx files with components
- Priority: API functions (pure async), hooks (TanStack Query renderHook), EntryPanel form, KeyList tree logic

## Cleanup
- Remove Angular + PrimeNG packages from cockpit-app/package.json after rewrite
- Packages to remove: @angular/*, primeng, primeicons, zone.js, @angular-devkit/*
- Remove Angular tsconfig compiler options from tsconfig.base.json if present

## Rollback Plan
- Git: the Angular source is in git history — rollback = revert commits
- No data migration involved (frontend-only rewrite)
- No dual-run needed (zero consumers)

## Standards
- Follow .maister/docs/standards/frontend/ (file naming, components, CSS, TypeScript, architecture)
- 2-space indentation, single quotes, final newline required
- Named function declarations (not arrow functions for components)
- ComponentNameProps interface for all component props
