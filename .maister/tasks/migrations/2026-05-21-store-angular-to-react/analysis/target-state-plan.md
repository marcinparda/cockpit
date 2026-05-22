# Target State Plan — Store App Angular → React Migration

**Date**: 2026-05-21
**Status**: Ready for implementation

---

## Executive Summary

The Angular store app is a small, self-contained Redis key-value browser (1 page, 3 active components, 8 API endpoints). Zero consumers exist, so the migration carries no breakage risk to other apps. The React monorepo already provides all cross-cutting infrastructure (auth, permissions, fetcher, shared UI primitives). The primary work is: replacing the Angular build config and source files with a Vite/React equivalent, installing `@monaco-editor/react`, adding 5 shadcn/ui components to the shared UI lib, and rewriting 4 source files. Recommended strategy: **big-bang** — the scope is small enough that incremental is unnecessary overhead. Estimated effort: medium (2-3 days for careful implementation with tests).

---

## Target App Structure (React File Tree)

```
apps/store/
├── project.json                   # Replace: Angular executor → @nx/vite:build + serve
├── tsconfig.json                  # Replace: Angular → React (jsx: react-jsx)
├── tsconfig.app.json              # Replace: Angular → Vite/React
├── tsconfig.spec.json             # New: Vitest spec config
├── vite.config.mts                # Replace: analogjs → @vitejs/plugin-react + tailwindcss()
├── setupTests.ts                  # New: Vitest setup file
├── src/
│   ├── index.html                 # Replace: Angular bootstrap → React root div
│   ├── main.tsx                   # Replace: Angular bootstrapApplication → ReactDOM.createRoot
│   ├── styles.css                 # Replace: Angular/PrimeNG → Tailwind v4 CSS-native config
│   ├── favicon.ico                # Keep as-is
│   └── app/
│       ├── app.tsx                # New: Auth guard (useUser) + PermissionGuard wrapper
│       ├── providers.tsx          # New: QueryClientProvider + BrowserRouter + TooltipProvider
│       ├── store/
│       │   ├── endpoints.ts       # New: SCREAMING_SNAKE_CASE endpoint constants
│       │   ├── schemas.ts         # New: Zod schemas for StoreEnvelope, StoreMeta, etc.
│       │   ├── api.ts             # New: fetcher() wrappers for all 8 endpoints
│       │   ├── queryKeys.ts       # New: TanStack Query key factories
│       │   ├── hooks/
│       │   │   ├── useListPrefixes.ts      # New: GET /
│       │   │   ├── useListCategories.ts    # New: GET /{prefix}
│       │   │   ├── useListKeys.ts          # New: GET /{prefix}/{category}
│       │   │   ├── useGetEntry.ts          # New: GET /{prefix}/{category}/{key}
│       │   │   ├── useResolveEntry.ts      # New: GET /resolve/{prefix}/{category}/{key}
│       │   │   ├── usePutEntry.ts          # New: PUT mutation
│       │   │   └── useDeleteEntry.ts       # New: DELETE mutation
│       │   ├── components/
│       │   │   ├── MonacoEditor.tsx        # New: @monaco-editor/react wrapper
│       │   │   ├── KeyList.tsx             # New: prefix → category → key tree
│       │   │   └── EntryPanel.tsx          # New: view/edit/create panel
│       │   └── pages/
│       │       └── StoreBrowserPage.tsx    # New: top-level page, state orchestration
```

### Files to Delete (Angular source)

```
apps/store/src/main.ts                                         (replaced by main.tsx)
apps/store/src/test-setup.ts                                   (replaced by setupTests.ts)
apps/store/src/app/app.component.ts
apps/store/src/app/app.config.ts
apps/store/src/app/app.routes.ts
apps/store/src/app/features/                                   (entire directory)
```

---

## Feature-by-Feature Gap List

### Gap 1: Build configuration

| Dimension | Angular (current) | React (target) | Action |
|-----------|-------------------|----------------|--------|
| Bundler | `@angular-devkit/build-angular:browser` | `@nx/vite:build` with `@vitejs/plugin-react` | Rewrite `project.json`, `vite.config.mts` |
| Test runner | `@nx/vite:test` + `@analogjs/vite-plugin-angular` | `@nx/vite:test` + `jsdom` + `@testing-library/react` | Update `vite.config.mts`, add `setupTests.ts` |
| CSS | `styles.css` importing `primeicons.css` | Tailwind v4 CSS-native (same pattern as cockpit app) | Replace `styles.css` |
| Monaco assets | Copied from `node_modules/monaco-editor/min` via Angular asset config | Handled by `@monaco-editor/react` (no static copy needed) | Remove asset copy config |
| TSConfig | Angular-flavored, no JSX | `jsx: react-jsx`, Vitest types | Replace both `tsconfig.json` and `tsconfig.app.json` |
| Port | 4205 | 4205 (keep) | Set in `vite.config.mts` |

**Reuse**: `vite.config.mts` from the cockpit app is the exact template, change port to 4205 and `outDir` to `../../dist/apps/store`.

---

### Gap 2: App shell + auth

| Angular | React target | Source |
|---------|--------------|--------|
| `main.ts` + `bootstrapApplication` | `main.tsx` + `ReactDOM.createRoot` | Rewrite, template from cockpit |
| `app.config.ts` (providers, interceptors) | `providers.tsx` (QueryClientProvider + BrowserRouter + TooltipProvider) | Reuse cockpit pattern verbatim |
| `authGuard` CanActivateFn | `useUser()` in `app.tsx` → redirect if no user | Reuse cockpit `app.tsx` pattern |
| `permissionGuard('redis_store', 'read')` | `<PermissionGuard feature="redis_store" action="read">` | `@cockpit-app/shared-react-feature` (already exists) |
| `auth.interceptor` (withCredentials, 401) | `fetcher.ts` handles both | `@cockpit-app/common-shared-data-access` (already exists) |
| `auth.service.ts`, `permission.service.ts` | No equivalents needed | Deleted |

**Reuse**: `PermissionGuard`, `useUser`, `fetcher`, `logout` from shared libs — no new auth code.

---

### Gap 3: API layer

| Angular | React target | Notes |
|---------|--------------|-------|
| `StoreApiService` (RxJS Observables) | `api.ts` (async functions via `fetcher`) | Full rewrite |
| Angular `HttpClient` with `withCredentials` | `fetcher()` from `@cockpit-app/common-shared-data-access` | Drop-in |
| `store.models.ts` (TypeScript interfaces) | `schemas.ts` (Zod schemas + inferred types) | Rewrite; `patchKey` omitted (unused in UI) |
| No caching layer | TanStack Query hooks with `staleTime` | New |
| No query keys | `queryKeys.ts` factory | New |

**Endpoints to cover** (same 8 as Angular, minus `patchKey` which has no UI usage):

```
STORE_ENDPOINTS = {
  LIST_PREFIXES:      '/api/v1/store/',
  LIST_CATEGORIES:    '/api/v1/store/:prefix',
  LIST_KEYS:          '/api/v1/store/:prefix/:category',
  GET_ENTRY:          '/api/v1/store/:prefix/:category/:key',
  RESOLVE_ENTRY:      '/api/v1/store/resolve/:prefix/:category/:key',
  PUT_ENTRY:          '/api/v1/store/:prefix/:category/:key',
  DELETE_ENTRY:       '/api/v1/store/:prefix/:category/:key',
}
```

Note: `patchKey` exists in the Angular service but is never called from any component. **Do not implement** (minimal-implementation standard).

---

### Gap 4: KeyList component

| Angular feature | React equivalent | Notes |
|-----------------|-----------------|-------|
| Component class + HTML template | `KeyList.tsx` function component | Full rewrite |
| `@Input selectedKey`, `deletedKey`, `createdKey` | Props `selectedKey`, `deletedKey`, `createdKey` | Direct mapping |
| `@Output keySelected`, `create` | Callbacks `onKeySelected`, `onCreate` | Direct mapping |
| `ngOnInit` → `loadPrefixes()` | `useListPrefixes()` TanStack Query hook | API call via hook, not imperative |
| `ngOnChanges` → `removeKeyFromTree` / `addKeyToTree` | `useEffect` with deps on `deletedKey`/`createdKey` + local state updates | Same logic, React idiom |
| `PrefixNode`, `CategoryNode` interfaces | Same interfaces, in component file | Keep |
| Lazy-load categories on prefix expand | `useListCategories()` called on demand, stored in local state | Same UX |
| Lazy-load keys on category expand | `useListKeys()` called on demand, stored in local state | Same UX |
| Inline add prefix input (addingPrefix state) | `useState(addingPrefix)` + conditional `<Input>` row | Same UX |
| Inline add category input per prefix | Local state per prefix node | Same UX |
| PrimeNG Skeleton | `<Skeleton>` from `@cockpit-app/shared-react-ui` | Already exists |
| PrimeNG Button | `<Button>` from `@cockpit-app/shared-react-ui` | Already exists |
| PrimeNG InputText | `<Input>` from `@cockpit-app/shared-react-ui` | Already exists |
| `pi pi-server`, `pi pi-folder`, `pi pi-key` icons | Lucide React icons: `Server`, `Folder`, `Key`, `Plus`, `ChevronRight`, `ChevronDown` | lucide-react already in package.json |
| PrimeNG Message (error) | Inline error with Tailwind | No component needed |

---

### Gap 5: EntryPanel component

| Angular feature | React equivalent | Notes |
|-----------------|-----------------|-------|
| Component class + HTML template | `EntryPanel.tsx` function component | Full rewrite |
| `@Input visible`, `mode`, `envelope`, `currentPrefix`, `currentCategory` | Props | Direct mapping |
| `@Output saved`, `deleted`, `visibleChange` | Callbacks `onSaved`, `onDeleted`, `onClose` | Direct mapping |
| `@ViewChild(MonacoEditor)` + `monacoEditor.getValue()` | `useRef<{ getValue: () => string }>()` on `MonacoEditor` with `useImperativeHandle` | Same imperative read pattern |
| `ngOnChanges` → sync edit state from envelope | `useEffect([envelope, mode])` | Same logic |
| View mode: key title + version badge | `<Badge>` from shared UI | Already exists |
| View mode: Edit / Delete buttons | `<Button>` variants | Already exists |
| Edit mode: Save / Cancel buttons | `<Button>` variants | Already exists |
| Meta grid: Type display/edit | `<Select>` from shared UI | **MISSING — must add** |
| Meta grid: Created/Updated dates | `new Intl.DateTimeFormat().format(new Date(iso))` | No pipe equivalent needed |
| Meta grid: Tags display | `<Badge>` per tag | Already exists |
| Meta grid: Tags edit (Chips) | Controlled tag input: `<Input>` + Enter key → append to array, Badge × to remove | No Chips component needed; implement inline |
| Toggle resolve / raw view | `<Button variant="outline">` with toggle state | Button already exists |
| PrimeNG ConfirmDialog | `<AlertDialog>` from shared UI | **MISSING — must add** |
| Monaco editor (AMD) | `<MonacoEditor>` React component wrapper | New component using `@monaco-editor/react` |
| Create mode: prefix/category/key/type fields | `<Input>` + `<Label>` + `<Select>` | Input, Label already exist; Select missing |
| Error display | Inline `<p>` with destructive text class | No component needed |
| PrimeNG Tag (version) | `<Badge>` | Already exists |
| `saving` / `deleting` loading state | `isPending` from TanStack mutation + Button `disabled` | Standard pattern |

---

### Gap 6: MonacoEditor component

| Angular feature | React equivalent | Notes |
|-----------------|-----------------|-------|
| AMD loader from `assets/monaco-editor/min/vs/` | `@monaco-editor/react` package | Install needed |
| `@Input value`, `readOnly` | Props `value`, `readOnly` | Direct mapping |
| `@Output valueChange` | Callback `onChange` | Direct mapping |
| `getValue()` imperative method (`@ViewChild`) | `useImperativeHandle` + `forwardRef` exposing `getValue()` | React imperative handle pattern |
| Monaco `json` language + format-on-type | Same options passed to `@monaco-editor/react` | Same config |

---

### Gap 7: StoreBrowserPage

| Angular feature | React equivalent | Notes |
|-----------------|-----------------|-------|
| `selectedKey`, `deletedKey`, `createdKey` state | `useState` | Direct |
| `panelVisible`, `panelMode`, `currentEnvelope` state | `useState` | Direct |
| `currentPrefix`, `currentCategory` state | `useState` | Direct |
| `onKeySelected` → `storeApi.getKey()` | TanStack Query `useGetEntry()` with `selectedKey` as query key | Declarative, not imperative |
| PrimeNG Toast (MessageService) | shadcn/ui `Toaster` + `toast()` calls | **MISSING — must add** |
| `onSaved` → show success toast | `toast.success(...)` | New |
| `onDeleted` → show info toast | `toast.success(...)` or `toast()` | New |
| Error on key fetch → show error toast | `toast.error(...)` | New |
| Layout: sidebar + panel side by side | `flex` with Tailwind | CSS-only, no component needed |

---

## Missing npm Packages

| Package | Version | Reason |
|---------|---------|--------|
| `@monaco-editor/react` | `^4.7.0` | React wrapper for Monaco; replaces AMD loader approach |

Note: `monaco-editor` is already installed at `0.55.1`. `@monaco-editor/react` will use it as a peer dep. Check peer dep compatibility before pinning version.

---

## Missing shadcn/ui Components (add to `libs/shared/ui/react/src/lib/`)

| Component | shadcn/ui slug | Used by | Priority |
|-----------|---------------|---------|----------|
| `Select` | `select` | EntryPanel (type dropdown in view/edit/create) | Critical |
| `AlertDialog` | `alert-dialog` | EntryPanel (delete confirmation) | Critical |
| `Toaster` + `toast` | `sonner` | StoreBrowserPage (success/error notifications) | Critical |
| `ScrollArea` | `scroll-area` | KeyList sidebar (overflow scroll on long key lists) | Important |
| `Textarea` | `textarea` | Not required — Monaco editor covers JSON editing | Not needed |

Notes:
- `Sheet` / `ResizablePanelGroup` are NOT needed because the clarified decision is to use inline flex layout.
- `Textarea` is NOT needed because Monaco handles all editing.
- `ScrollArea`: if the sidebar uses `overflow-y-auto` via Tailwind directly, this can be deferred to Nice-to-have.
- `sonner` (the package backing shadcn/ui Toaster) is not currently in `package.json` — it must be added alongside the component.

**Required new package**: `sonner` (for Toaster).

---

## Radix UI Packages Needed

| Package | Required by | Status |
|---------|------------|--------|
| `@radix-ui/react-select` | Select component | Not in package.json — must install |
| `@radix-ui/react-alert-dialog` | AlertDialog component | Not in package.json — must install |
| `@radix-ui/react-scroll-area` | ScrollArea component (if added) | Not in package.json |

---

## Migration Strategy: Big-Bang

**Recommendation**: Big-bang (full rewrite in one pass).

**Rationale**:
- Zero consumers — no other apps import from store. No compatibility surface to protect.
- Scope is small: 1 page, 3 active components, 8 endpoints, 0 existing tests.
- Angular and React cannot coexist in the same app directory in a meaningful incremental way; any "incremental" approach would still require replacing the entire build config upfront.
- The feature set is 1:1 mappable with no ambiguity.

**Incremental is NOT recommended** because:
- It would require maintaining two build systems simultaneously.
- No user traffic risk mitigates the overhead (single-user personal platform).
- The migration can be validated in a single PR.

---

## Implementation Sequence

### Phase 1 — Environment setup (no functional code)
1. Add `@monaco-editor/react` to `cockpit-app/package.json`
2. Add `sonner` to `cockpit-app/package.json`
3. Add `@radix-ui/react-select` and `@radix-ui/react-alert-dialog` to `cockpit-app/package.json`
4. Add `Select` component to `libs/shared/ui/react/src/lib/Select/` following existing pattern (shadcn/ui codegen or manual copy)
5. Add `AlertDialog` component to `libs/shared/ui/react/src/lib/AlertDialog/`
6. Add `Toaster` component to `libs/shared/ui/react/src/lib/Toaster/` (re-exports `sonner` with project styling)
7. Export all new components from `libs/shared/ui/react/src/index.ts`
8. Replace `apps/store/project.json` with Vite/React targets
9. Replace `apps/store/vite.config.mts` (remove `@analogjs/vite-plugin-angular`, add `@vitejs/plugin-react` + `tailwindcss()`)
10. Replace `apps/store/tsconfig.json` and `tsconfig.app.json` with React equivalents
11. Add `apps/store/setupTests.ts`

### Phase 2 — App shell
12. Replace `apps/store/src/index.html` (Angular `<app-root>` → `<div id="root">`)
13. Replace `apps/store/src/main.ts` → `main.tsx`
14. Replace `apps/store/src/styles.css` with Tailwind v4 CSS-native config
15. Create `apps/store/src/app/providers.tsx`
16. Create `apps/store/src/app/app.tsx` with `useUser` + `PermissionGuard`

### Phase 3 — API layer
17. Create `apps/store/src/app/store/endpoints.ts`
18. Create `apps/store/src/app/store/schemas.ts` (Zod)
19. Create `apps/store/src/app/store/api.ts`
20. Create `apps/store/src/app/store/queryKeys.ts`
21. Create TanStack Query hooks (7 hooks)

### Phase 4 — Components (bottom-up)
22. Create `MonacoEditor.tsx` with `useImperativeHandle`
23. Create `EntryPanel.tsx`
24. Create `KeyList.tsx`
25. Create `StoreBrowserPage.tsx`

### Phase 5 — Tests
26. Write `.spec.tsx` for each component (target ≥80% coverage)

### Phase 6 — Cleanup
27. Delete all Angular source files listed above
28. Run `nx run store:build` and `nx run store:test` to verify

---

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| `@monaco-editor/react` peer dep conflict with `monaco-editor@0.55.1` | Low | Check peer deps before installing; likely compatible |
| Missing Radix UI packages break shared UI lib build | Low | Install before adding components; run `nx build react-ui` to verify |
| `useImperativeHandle` for Monaco getValue() missed | Medium | Explicit in implementation notes; standard React pattern |
| Tag input (Chips replacement) UX divergence | Low | Simple controlled array pattern; no edge cases |
| Toaster (`sonner`) not styled to match theme | Low | Wrap in shared Toaster component with CSS variable tokens |
| TanStack Query staleTime vs Angular `shareReplay(1)` | Low | Set `staleTime: 30_000` on list queries; mutations invalidate |
| Coverage gap: 0 tests today, 80% required by CI | Medium | Write tests during Phase 5; mock `fetcher`, `@monaco-editor/react` |
| Angular `patchKey` API method omitted | None | Verified unused in UI; minimal-implementation standard applies |

---

## Summary of All Gaps

| # | Gap | Type | Effort |
|---|-----|------|--------|
| 1 | Build config (project.json, vite.config.mts, tsconfigs) | Config rewrite | Small |
| 2 | App shell (main.tsx, providers.tsx, app.tsx, styles.css, index.html) | New files | Small |
| 3 | API layer (endpoints, schemas, api.ts, queryKeys, 7 hooks) | New files | Small-Medium |
| 4 | MonacoEditor.tsx with imperative handle | New component | Small |
| 5 | KeyList.tsx (tree UI with lazy loading and inline inputs) | New component | Medium |
| 6 | EntryPanel.tsx (view/edit/create, tags, type select, delete confirm) | New component | Medium |
| 7 | StoreBrowserPage.tsx (state orchestration, toast calls) | New page | Small |
| 8 | Install @monaco-editor/react | Dependency | Trivial |
| 9 | Install sonner + @radix-ui/react-select + @radix-ui/react-alert-dialog | Dependencies | Trivial |
| 10 | Add Select to shared UI lib | New shared component | Small |
| 11 | Add AlertDialog to shared UI lib | New shared component | Small |
| 12 | Add Toaster to shared UI lib | New shared component | Small |
| 13 | Delete Angular source files | Cleanup | Trivial |
| 14 | Write tests for 80% coverage threshold | Tests | Medium |

**Total gaps**: 14
