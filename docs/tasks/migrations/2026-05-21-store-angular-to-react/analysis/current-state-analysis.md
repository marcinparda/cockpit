# Current State Analysis — Store App Angular → React Migration

**Date**: 2026-05-21
**Task**: Migrate Angular store app to React 19 + Vite + TanStack Query + shadcn/ui + Tailwind CSS v4

---

## Summary

The Angular store app is a well-scoped Redis key-value browser with three primary UI components (key tree sidebar, entry/edit panel, Monaco JSON editor) backed by a dedicated REST API service. The React ecosystem in the monorepo (cockpit, login apps plus shared libs) provides mature, directly reusable patterns for auth, permissions, data fetching, and UI components, making this a straightforward rewrite rather than a novel architecture problem. One external dependency (`@monaco-editor/react`) needs to be installed, and several shadcn/ui components need to be added to the shared UI library.

---

## Store App: Pages & Routes

**Root routes** (`app.routes.ts`):
```
/    → STORE_ROUTES (lazy-loaded)
       Guards: authGuard + permissionGuard('redis_store', 'read')
**   → redirect to ''
```

**Feature routes** (`store.routes.ts`):
```
/    → StoreBrowserPageComponent (single page, no sub-routes)
```

**Result**: One page — the store browser. Navigation is handled entirely in-component (sidebar tree → panel).

---

## Component Tree

```
StoreBrowserPageComponent (page)
├── KeyListComponent (sidebar)         — prefix → category → key tree browser
├── EntryPanelComponent (detail panel) — view / edit / create modes
│   └── MonacoEditorComponent          — JSON editor (Monaco, AMD loader)
└── <p-toast> (PrimeNG notifications)
```

### StoreBrowserPageComponent
- Top-level state owner: `selectedKey`, `panelVisible`, `panelMode ('view'|'create')`, `currentEnvelope`, `currentPrefix`, `currentCategory`
- Orchestrates events between KeyList (`keySelected`, `create`) and EntryPanel (`saved`, `deleted`)
- Injects: `StoreApiService`, `MessageService` (PrimeNG toast)

### KeyListComponent
- Lazy-loaded 3-level tree: prefix → category → key
- `@Input`: `selectedKey`, `deletedKey`, `createdKey`; `@Output`: `keySelected`, `create`
- Inline add prefix/category (optimistic UI, no immediate API call)
- PrimeNG: ButtonModule, SkeletonModule, InputTextModule, MessageModule

### EntryPanelComponent
- Dual mode: view/edit (existing entry) + create (new entry)
- Edit: `@ViewChild(MonacoEditorComponent)` + `getValue()` for imperative read
- Create: form with prefix, category, key, type select, tags chips, JSON editor
- Delete: PrimeNG `ConfirmationService` dialog
- PrimeNG: ButtonModule, TagModule, ToggleButtonModule, InputTextModule, ChipsModule, ConfirmDialogModule, SelectModule

### MonacoEditorComponent
- Loads Monaco via AMD loader from `assets/monaco-editor/min/vs/`
- `@Input`: `value`, `readOnly`; `@Output`: `valueChange`; public `getValue()` for ViewChild access
- **Replace with**: `@monaco-editor/react` (not yet installed in monorepo)

### StoreToolbarComponent
- **UNUSED** — not imported anywhere. Delete on migration.

---

## API Layer

**StoreApiService** — `/api/v1/store`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List prefixes |
| GET | `/{prefix}` | List categories |
| GET | `/{prefix}/{category}` | List keys |
| GET | `/{prefix}/{category}/{key}` | Get entry |
| GET | `/resolve/{prefix}/{category}/{key}` | Get resolved entry |
| PUT | `/{prefix}/{category}/{key}` | Create or replace entry |
| PATCH | `/{prefix}/{category}/{key}` | Partial update |
| DELETE | `/{prefix}/{category}/{key}` | Delete entry |

**Data models**:
```typescript
interface StoreMeta {
  key: string;           // "prefix:category:key"
  type: string;          // 'object'|'string'|'number'|'boolean'|'array'|'cv_section'
  version: number;
  created_at: string;    // ISO 8601
  updated_at: string;    // ISO 8601
  tags: string[];
}
interface StoreEnvelope { meta: StoreMeta; data: unknown; }
interface StoreWriteRequest { type: string; tags?: string[]; data: unknown; }
interface StorePatchRequest { data: unknown; }
```

---

## Auth Patterns

### Angular (current)
- `authGuard`: CanActivateFn — GET `/api/v1/authentication/sessions/me`, redirect on 401
- `permissionGuard`: factory CanActivateFn — GET `/api/v1/authorization/user-permissions/me`, checks `feature.name + action.name`
- `auth.interceptor`: HttpInterceptorFn — adds `withCredentials: true`, catches 401 → redirect
- `AuthService`, `PermissionService`: injectable singletons

### React equivalent (already in monorepo)
- `useUser()` hook from `@cockpit-app/shared-react-data-access` — TanStack Query, calls sessions/me
- `usePermissions()` hook — calls user-permissions/me
- `PermissionGuard` component from `@cockpit-app/shared-react-feature` — declarative permission gate
- `fetcher.ts` from `@cockpit-app/common-shared-data-access` — handles `credentials: 'include'`, 401 refresh+redirect

---

## React Target Patterns (Reference Apps)

### Entry point (`main.tsx`)
```tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>
);
```

### Providers (`providers.tsx`)
```tsx
<QueryClientProvider client={tanstackQueryClient}>
  <BrowserRouter>
    <TooltipProvider>
      {children}
    </TooltipProvider>
  </BrowserRouter>
</QueryClientProvider>
```

### Vite config
- Plugins: `react()`, `tailwindcss()`, `nxViteTsPaths()`, `nxCopyAssetsPlugin(['*.md'])`
- Port: 4205 (store's existing port)
- Coverage: Vitest + jsdom, 80% threshold

### Tailwind CSS v4 (CSS-native, no config file)
```css
@import 'tailwindcss' source(none);
@source ".../**/*.{ts,tsx}";
@theme inline { --color-background: var(--background); ... }
```

### Path aliases (tsconfig.base.json)
```
@cockpit-app/api-types              → libs/shared/types/api-types/src/index.ts
@cockpit-app/common-shared-data-access → libs/shared/data-access/common/src/index.ts
@cockpit-app/shared-react-data-access  → libs/shared/data-access/react/src/index.ts
@cockpit-app/shared-react-feature      → libs/shared/feature/react/src/index.ts
@cockpit-app/shared-react-ui           → libs/shared/ui/react/src/index.ts
@cockpit-app/shared-utils              → libs/shared/utils/src/index.ts
@cockpit-app/cockpit-ui                → libs/cockpit/ui/src/index.ts
```

---

## Gaps: Missing Dependencies

| Gap | Resolution |
|-----|-----------|
| `@monaco-editor/react` not installed | Add to cockpit-app/package.json |
| shadcn/ui `Select` missing from shared UI lib | Add manually following existing pattern |
| shadcn/ui `ScrollArea` missing | Add manually |
| shadcn/ui `Textarea` missing | Add manually |
| shadcn/ui `AlertDialog` missing | Add manually |
| shadcn/ui `Sheet` or inline panel missing | Add manually (or use inline panel without Sheet) |
| shadcn/ui `ResizablePanelGroup` missing | Add manually (or use CSS flex) |

---

## Angular → React Mapping

| Angular | React Equivalent |
|---------|-----------------|
| `@Component` standalone | Function component `.tsx` |
| `@Input`/`@Output` | Props + callbacks |
| `[(ngModel)]` | `useState` controlled inputs |
| `@ViewChild(MonacoEditor)` | `useRef` |
| `ngOnInit/ngOnChanges/ngOnDestroy` | `useEffect` |
| `@for` / `@if` templates | `.map()` / ternary / `&&` |
| `| date:'medium'` pipe | `new Intl.DateTimeFormat()` or date-fns |
| `CanActivateFn` guard | `ProtectedRoute` wrapper or `useUser()` check |
| `HttpInterceptorFn` + `withCredentials` | `fetcher.ts` (already handles) |
| `@Injectable` service + RxJS | `async` functions + TanStack Query |
| `shareReplay(1)` caching | TanStack Query `staleTime` |
| PrimeNG Toast | `sonner` or shared notification pattern |
| PrimeNG ConfirmDialog | shadcn/ui `AlertDialog` |
| PrimeNG Select | shadcn/ui `Select` |
| PrimeNG Chips (tags) | Badge + controlled input or Combobox |
| PrimeNG ToggleButton | shadcn/ui `Button` with toggle variant |
| PrimeNG Skeleton | shadcn/ui `Skeleton` (already in shared UI) |
| Monaco AMD loader | `@monaco-editor/react` |

---

## Complexity Assessment

| Factor | Assessment |
|--------|-----------|
| Component count | 4 components + 1 page (small scope) |
| Consumers | **0** — fully self-contained, zero breakage risk |
| Logic complexity | KeyList tree state (moderate), EntryPanel form (moderate) |
| External dep gaps | 1 npm package + 5-6 shadcn/ui components (mechanical) |
| Test baseline | 0 existing tests — start fresh, target ≥80% |
| **Overall** | **Low-medium** |

---

## Recommended Implementation Sequence

1. **Environment setup**: install `@monaco-editor/react`, add missing shadcn/ui components, update Vite/tsconfig/project.json configs
2. **App shell**: `main.tsx`, `providers.tsx`, `app.tsx` with auth guard + permission guard, `styles.css`, `index.html`
3. **API layer**: `endpoints.ts`, `schemas.ts` (Zod), `api.ts` (baseApi wrappers), TanStack Query hooks
4. **Components** (bottom-up): `MonacoEditor.tsx` → `EntryPanel.tsx` → `KeyList.tsx` → `StoreBrowserPage.tsx`
5. **Cleanup**: delete Angular source files, update docs
