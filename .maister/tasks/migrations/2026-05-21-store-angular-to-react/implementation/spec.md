# Specification: Migrate Store App from Angular 19 to React 19

## Goal

Replace the Angular 19 store app with a React 19 + Vite + TanStack Query + shadcn/ui + Tailwind CSS v4 implementation that preserves full feature parity (Redis key-value tree browser, entry detail/edit/create panel, Monaco JSON editor) while conforming to the established React patterns used in the cockpit app.

## User Stories

- As a user, I can browse Redis keys organized by prefix and category in a collapsible tree sidebar
- As a user, I can view, edit, and delete an existing store entry with Monaco JSON editor
- As a user, I can create a new store entry by selecting or typing a prefix, category, and key name
- As a user, I can add new prefix and category nodes directly in the tree without leaving the page
- As a user, I receive toast feedback after successful save, create, and delete operations
- As a user, I am redirected to login if unauthenticated and blocked from the page if I lack `redis_store:read` permission

## Core Requirements

1. Rewrite the store app shell (index.html, main.tsx, app.tsx, providers.tsx, styles.css) to the React/Vite pattern matching the cockpit app
2. Replace Angular build config (project.json, vite.config.mts, tsconfig files) with React/Vite equivalents preserving Nx project name `store` and dev port `4205`
3. Implement store API layer: endpoints constants, Zod schemas, async API functions using `baseApi`, and TanStack Query hooks
4. Implement `MonacoEditor` as a forwardRef React component exposing `getValue()` via `useImperativeHandle`
5. Implement `KeyList` with lazy-load tree (prefixes → categories → keys), inline add prefix, inline add category, and tree sync on external create/delete
6. Implement `EntryPanel` for view/edit/create modes with Monaco editor, type/tags editing, delete confirmation dialog, and resolve toggle
7. Implement `StoreBrowserPage` as the auth-gated top-level page composing `KeyList` and `EntryPanel`
8. Add three new shared UI components to `libs/shared/ui/react/src/lib/`: `Select`, `AlertDialog`, `Toaster`
9. Export new shared components from `libs/shared/ui/react/src/index.ts`
10. Install missing npm packages: `@monaco-editor/react`, `sonner`, `@radix-ui/react-select`, `@radix-ui/react-alert-dialog`
11. Delete all Angular source files and remove Angular/PrimeNG packages from `cockpit-app/package.json`
12. Update `cockpit-app/CLAUDE.md`, `.maister/docs/project/tech-stack.md`, and `.maister/docs/project/architecture.md` to reflect React store

## Reusable Components

### Existing Code to Leverage

- `cockpit-app/apps/cockpit/vite.config.mts` — template for store `vite.config.mts` (swap port to 4205, paths, cacheDir)
- `cockpit-app/apps/cockpit/tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json` — copy verbatim as store tsconfig base (identical shape needed)
- `cockpit-app/apps/cockpit/index.html` — template for store `index.html` (change title to "Store", keep dark-mode script structure)
- `cockpit-app/apps/cockpit/src/main.tsx` — template for store `src/main.tsx` (identical pattern, swap App import)
- `cockpit-app/apps/cockpit/src/styles.css` — copy as store `src/styles.css` (update `@source` paths, keep all CSS custom properties and `@theme inline` block verbatim)
- `cockpit-app/apps/cockpit/src/app/providers.tsx` — copy as store `src/app/providers.tsx` (identical: QueryClientProvider + BrowserRouter + TooltipProvider)
- `cockpit-app/apps/cockpit/project.json` — template for store `project.json` React/Vite targets (name stays `store`, tags `scope:store`)
- `@cockpit-app/shared-react-data-access` exports `useUser`, `usePermissions`, `useHasPermission` — use directly in `StoreBrowserPage`
- `@cockpit-app/shared-react-feature` exports `PermissionGuard` — use in `StoreBrowserPage`
- `@cockpit-app/shared-react-ui` exports `Button`, `Input`, `Badge`, `Skeleton`, `Separator` — use directly in store components; no new instances of these needed
- `@cockpit-app/common-shared-data-access` exports `baseApi`, `fetcher` — use in store `api.ts`
- `libs/shared/data-access/common/src/lib/authorization/schemas.ts` — reference Zod object/array patterns when writing store schemas
- `libs/shared/data-access/common/src/lib/authorization/endpoints.ts` — reference `as const` endpoint object pattern for `STORE_ENDPOINTS`

### New Components Required

- **`Select` / `AlertDialog` / `Toaster`** in `libs/shared/ui/react/src/lib/` — not present in shared UI index; `@radix-ui/react-select`, `@radix-ui/react-alert-dialog`, and `sonner` are not yet installed; these are general-purpose primitives that belong in shared UI alongside existing Radix-backed components (Button, Skeleton etc.)
- **`MonacoEditor.tsx`** in store app — app-specific; needs `forwardRef` + `useImperativeHandle` for imperative `getValue()` call from `EntryPanel`; `@monaco-editor/react` is not yet installed
- **`KeyList.tsx`** in store app — app-specific tree-state component with lazy-load, inline add flows, and external key sync via props
- **`EntryPanel.tsx`** in store app — app-specific form panel covering view/edit/create modes; no generic equivalent exists
- **`StoreBrowserPage.tsx`** in store app — app-specific page composition; no generic equivalent exists
- **Store API layer** (`endpoints.ts`, `schemas.ts`, `api.ts`, `hooks.ts`) — store-specific API surface; no overlap with existing shared API modules

## Technical Approach

The store app becomes a thin React/Vite application with the same structural shape as `cockpit`. All cross-cutting concerns (auth, permissions, query client, base fetch) are handled by existing shared libraries. The store app only adds its own feature module under `src/app/features/store/`.

Key integration points:
- `StoreBrowserPage` calls `useUser()` from `@cockpit-app/shared-react-data-access` for auth check; if `isLoading` show Skeleton, if `!userInfo` call `logout()` and redirect
- `PermissionGuard` from `@cockpit-app/shared-react-feature` wraps the page body with `feature="redis_store" action="read"`
- All API calls use `baseApi.getRequest / putRequest / deleteRequest` from `@cockpit-app/common-shared-data-access`
- All query responses validated by Zod schemas before use
- `KeyList` manages its own tree state with `useReducer`; it receives `deletedKey` and `createdKey` props from `StoreBrowserPage` and synchronises the in-memory tree in `useEffect` without re-fetching
- `EntryPanel` holds a `useRef<MonacoEditorRef>` and calls `editorRef.current.getValue()` imperatively on save/create to extract JSON from Monaco
- `Toaster` from `sonner` is rendered once at the root of `StoreBrowserPage`; `toast.success()` / `toast.error()` called after mutations

## File Structure

```
cockpit-app/apps/store/
├── Dockerfile                        (keep unchanged)
├── nginx/store.conf                  (keep unchanged)
├── public/favicon.ico                (keep unchanged)
├── index.html                        (rewrite — React entry)
├── project.json                      (rewrite — Vite/React targets)
├── vite.config.mts                   (rewrite — Vite React config)
├── tsconfig.json                     (rewrite — React tsconfig root)
├── tsconfig.app.json                 (rewrite — React app tsconfig)
├── tsconfig.spec.json                (rewrite — React spec tsconfig)
├── setupTests.ts                     (new — Vitest setup)
├── src/
│   ├── favicon.ico                   (keep)
│   ├── index.html                    (delete — entry moves to root)
│   ├── main.tsx                      (rewrite — React root render)
│   ├── styles.css                    (rewrite — Tailwind v4 CSS-native)
│   └── app/
│       ├── app.tsx                   (rewrite — BrowserRouter Routes)
│       ├── app.spec.tsx              (new — basic render test)
│       ├── providers.tsx             (new — QueryClient + BrowserRouter + TooltipProvider)
│       └── features/
│           └── store/
│               ├── api/
│               │   ├── endpoints.ts  (new — STORE_ENDPOINTS constants)
│               │   ├── schemas.ts    (new — Zod schemas)
│               │   ├── api.ts        (new — async API functions)
│               │   └── hooks.ts      (new — TanStack Query hooks)
│               └── components/
│                   ├── MonacoEditor.tsx      (new)
│                   ├── MonacoEditor.spec.tsx (new)
│                   ├── KeyList.tsx           (new)
│                   ├── KeyList.spec.tsx      (new)
│                   ├── EntryPanel.tsx        (new)
│                   ├── EntryPanel.spec.tsx   (new)
│                   ├── StoreBrowserPage.tsx  (new)
│                   └── StoreBrowserPage.spec.tsx (new)
```

New shared UI components:
```
cockpit-app/libs/shared/ui/react/src/lib/
├── Select/
│   └── Select.tsx
├── AlertDialog/
│   └── AlertDialog.tsx
└── Toaster/
    └── Toaster.tsx
```

## Implementation Guidance

### Build Config Changes

**`index.html`** (at app root, not `src/`):
- Title: "Store"
- Inline dark-mode script: check `localStorage.getItem('theme')` and add `class="dark"` to `<html>` if value is `'dark'`
- `<link rel="stylesheet" href="/src/styles.css" />`
- `<div id="root"></div>` + `<script type="module" src="/src/main.tsx"></script>`

**`vite.config.mts`**:
- Mirror `apps/cockpit/vite.config.mts` exactly; change: `cacheDir` to `../../node_modules/.vite/apps/store`, `server.port` to `4205`, `preview.port` to `4305`, `build.outDir` to `../../dist/apps/store`, coverage `reportsDirectory` to `../../coverage/apps/store`
- `@source` paths in `styles.css` must reference `../../../libs/shared/ui/**` (same as cockpit)
- Coverage `exclude` list: `['src/main.tsx', 'src/app/providers.tsx']`

**`tsconfig.json`** / **`tsconfig.app.json`** / **`tsconfig.spec.json`**:
- Copy cockpit tsconfig files verbatim; no structural differences needed

**`project.json`**:
- Keep `"name": "store"`, `"tags": ["scope:store", "type:app"]`
- Replace Angular executor targets with Vite targets matching cockpit `project.json` pattern (build, serve at port 4205, test via `@nx/vite:test`)

**`src/styles.css`**:
- Copy cockpit `styles.css` verbatim
- Change `@source` line for app to: `@source "./**/*.{ts,tsx,js,jsx,html,css}";`
- Remove cockpit-specific `@source` for `libs/cockpit/ui` — replace with store source only

### New Shared UI Components

**`Select/Select.tsx`** (`@cockpit-app/shared-react-ui`):
- Wraps `@radix-ui/react-select` primitives
- Exports: `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue`
- `SelectTrigger` takes optional `className`; renders `<SelectPrimitive.Trigger>` with chevron icon
- `SelectContent` wraps `<SelectPrimitive.Content>` with `position="popper"` scroll area
- `SelectItem` wraps `<SelectPrimitive.Item>` with check indicator
- Style with Tailwind; follow the same pattern as existing `Button.tsx` in shared UI (named export function, explicit props interface)

**`AlertDialog/AlertDialog.tsx`** (`@cockpit-app/shared-react-ui`):
- Wraps `@radix-ui/react-alert-dialog` primitives
- Exports: `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`
- Style overlays and content with Tailwind; `AlertDialogAction` uses destructive variant styles

**`Toaster/Toaster.tsx`** (`@cockpit-app/shared-react-ui`):
- Wraps `Toaster` from `sonner`
- Export name: `Toaster`
- Pass `richColors` prop; no additional customisation needed
- Export `toast` re-export from `sonner` so callers import toast from the shared lib

**`libs/shared/ui/react/src/index.ts`** additions:
```
export * from './lib/Select/Select';
export * from './lib/AlertDialog/AlertDialog';
export * from './lib/Toaster/Toaster';
```

### Store API Layer

**`api/endpoints.ts`**:
```
export const STORE_ENDPOINTS = {
  prefixes: () => '/api/v1/store/',
  categories: (prefix: string) => `/api/v1/store/${prefix}`,
  keys: (prefix: string, category: string) => `/api/v1/store/${prefix}/${category}`,
  entry: (prefix: string, category: string, key: string) =>
    `/api/v1/store/${prefix}/${category}/${key}`,
  resolve: (prefix: string, category: string, key: string) =>
    `/api/v1/store/resolve/${prefix}/${category}/${key}`,
} as const;
```

**`api/schemas.ts`** — Zod schemas:
- `storeMetaSchema`: object with `key: z.string()`, `type: z.string()`, `version: z.number()`, `created_at: z.string()`, `updated_at: z.string()`, `tags: z.array(z.string())`
- `storeEnvelopeSchema`: object with `meta: storeMetaSchema`, `data: z.unknown()`
- `storeWriteRequestSchema`: object with `type: z.string()`, `tags: z.array(z.string()).optional()`, `data: z.unknown()`
- `storePrefixesSchema`: `z.array(z.string())`
- `storeCategoriesSchema`: `z.array(z.string())`
- `storeKeysSchema`: `z.array(z.string())`
- Export inferred types: `type StoreMeta = z.infer<typeof storeMetaSchema>`, `type StoreEnvelope = z.infer<typeof storeEnvelopeSchema>`, `type StoreWriteRequest = z.infer<typeof storeWriteRequestSchema>`

**`api/api.ts`** — async functions using `baseApi`:
- `getStorePrefixes(): Promise<string[]>` — `baseApi.getRequest(STORE_ENDPOINTS.prefixes(), storePrefixesSchema)`
- `getStoreCategories(prefix: string): Promise<string[]>` — `baseApi.getRequest(STORE_ENDPOINTS.categories(prefix), storeCategoriesSchema)`
- `getStoreKeys(prefix: string, category: string): Promise<string[]>` — `baseApi.getRequest(STORE_ENDPOINTS.keys(prefix, category), storeKeysSchema)`
- `getStoreEntry(prefix: string, category: string, key: string): Promise<StoreEnvelope>` — `baseApi.getRequest(STORE_ENDPOINTS.entry(prefix, category, key), storeEnvelopeSchema)`
- `resolveStoreEntry(prefix: string, category: string, key: string): Promise<StoreEnvelope>` — `baseApi.getRequest(STORE_ENDPOINTS.resolve(prefix, category, key), storeEnvelopeSchema)`
- `createOrUpdateStoreEntry(prefix: string, category: string, key: string, body: StoreWriteRequest): Promise<StoreEnvelope>` — `baseApi.putRequest(STORE_ENDPOINTS.entry(prefix, category, key), storeEnvelopeSchema, body)`
- `deleteStoreEntry(prefix: string, category: string, key: string): Promise<void>` — `baseApi.deleteRequest(STORE_ENDPOINTS.entry(prefix, category, key), z.void())`

**`api/hooks.ts`** — TanStack Query hooks:
- `useStorePrefixes()` — `useQuery({ queryKey: ['store', 'prefixes'], queryFn: getStorePrefixes })`
- `useStoreCategories(prefix: string)` — `useQuery({ queryKey: ['store', 'categories', prefix], queryFn: () => getStoreCategories(prefix), enabled: !!prefix })`
- `useStoreKeys(prefix: string, category: string)` — `useQuery({ queryKey: ['store', 'keys', prefix, category], queryFn: () => getStoreKeys(prefix, category), enabled: !!prefix && !!category })`
- `useStoreEntry(prefix: string, category: string, key: string)` — `useQuery({ queryKey: ['store', 'entry', prefix, category, key], queryFn: () => getStoreEntry(prefix, category, key), enabled: !!prefix && !!category && !!key })`
- `useCreateOrUpdateStoreEntry()` — `useMutation({ mutationFn: ({ prefix, category, key, body }) => createOrUpdateStoreEntry(prefix, category, key, body) })`
- `useDeleteStoreEntry()` — `useMutation({ mutationFn: ({ prefix, category, key }) => deleteStoreEntry(prefix, category, key) })`

Note: `KeyList` does NOT use hooks for lazy loading. It calls the API functions directly (not hooks) inside tree event handlers so it can manage exact loading state per node. Hooks are used only in `EntryPanel` (useStoreEntry for initial load, mutations for save/delete) and `StoreBrowserPage` (no direct hooks, delegates to EntryPanel).

### Component Specifications

**`MonacoEditor.tsx`**:

Props interface:
```typescript
interface MonacoEditorProps {
  value: string;
  readOnly: boolean;
  onChange?: (value: string) => void;
}
export type MonacoEditorRef = { getValue(): string };
```

- `forwardRef<MonacoEditorRef, MonacoEditorProps>` wrapping `Editor` from `@monaco-editor/react`
- `useImperativeHandle(ref, () => ({ getValue: () => editorRef.current?.getValue() ?? '' }))` where `editorRef` is `useRef` typed to Monaco editor instance obtained via `onMount` callback
- Editor options: `language: 'json'`, `theme: 'vs-dark'`, `readOnly: props.readOnly`, `minimap: { enabled: false }`, `wordWrap: 'on'`
- `onChange` callback wired to Monaco `onChange` event; fires with current value string

**`KeyList.tsx`**:

Props interface:
```typescript
interface KeyListProps {
  selectedKey: string | null;
  deletedKey: string | null;
  createdKey: string | null;
  onKeySelected: (key: string) => void;
  onCreate: (ctx?: { prefix: string; category: string }) => void;
}
```

State shape managed by `useReducer`:
```typescript
interface CategoryNode {
  name: string;
  keys: string[];
  expanded: boolean;
  loading: boolean;
}
interface PrefixNode {
  name: string;
  categories: CategoryNode[];
  expanded: boolean;
  loading: boolean;
  addingCategory: boolean;
  newCategoryInput: string;
}
type TreeState = {
  prefixNodes: PrefixNode[];
  loadingPrefixes: boolean;
  addingPrefix: boolean;
  newPrefixInput: string;
};
```

Reducer actions: `SET_PREFIXES`, `SET_LOADING_PREFIXES`, `TOGGLE_PREFIX`, `SET_CATEGORIES`, `TOGGLE_CATEGORY`, `SET_KEYS`, `START_ADD_PREFIX`, `CONFIRM_ADD_PREFIX`, `CANCEL_ADD_PREFIX`, `START_ADD_CATEGORY`, `CONFIRM_ADD_CATEGORY`, `CANCEL_ADD_CATEGORY`, `REMOVE_KEY`, `ADD_KEY`

Behaviour:
- On mount: call `getStorePrefixes()` directly (not hook), dispatch `SET_PREFIXES`
- `togglePrefix`: if not expanded and categories not loaded, call `getStoreCategories(prefix)` directly, dispatch `SET_CATEGORIES`; otherwise toggle `expanded`
- `toggleCategory`: if not expanded and keys not loaded, call `getStoreKeys(prefix, category)` directly, dispatch `SET_KEYS`; otherwise toggle `expanded`
- `useEffect([deletedKey])`: dispatch `REMOVE_KEY` when `deletedKey` changes and is non-null
- `useEffect([createdKey])`: dispatch `ADD_KEY` when `createdKey` changes and is non-null; `ADD_KEY` adds the key to the correct category node only if that category is currently expanded
- Inline add prefix: `START_ADD_PREFIX` shows an `<Input>` row at the bottom of prefix list; Enter/blur `CONFIRM_ADD_PREFIX`; Escape `CANCEL_ADD_PREFIX`
- Inline add category: `START_ADD_CATEGORY` on a PrefixNode shows an `<Input>` row inside that prefix; Enter/blur `CONFIRM_ADD_CATEGORY`; Escape `CANCEL_ADD_CATEGORY`
- Prefix/category/key rows render with lucide icons: `Server` for prefix, `Folder` for category, `Key` for key item; `ChevronRight` / `ChevronDown` for expand state
- `Skeleton` from shared UI for loading states
- `Separator` between prefix nodes
- `Plus` button on each category row triggers `onCreate({ prefix, category })`; `Plus` button at bottom of prefix list triggers inline add prefix flow

**`EntryPanel.tsx`**:

Props interface:
```typescript
interface EntryPanelProps {
  visible: boolean;
  mode: 'view' | 'create';
  envelope: StoreEnvelope | null;
  currentPrefix?: string;
  currentCategory?: string;
  onClose: () => void;
  onSaved: (envelope: StoreEnvelope) => void;
  onDeleted: (key: string) => void;
}
```

View mode local state: `editMode: boolean`, `editType: string`, `editTags: string[]`, `resolveMode: boolean`, `saving: boolean`, `deleting: boolean`, `error: string | null`, `jsonValue: string`

Create mode local state: `newPrefix: string`, `newCategory: string`, `newKey: string`, `newType: string`, `newTags: string[]`, `newJson: string` (initial `'{}'`)

Imperative ref: `const editorRef = useRef<MonacoEditorRef>(null)`

`useEffect` on `[envelope]`: when `envelope` changes (view mode), set `jsonValue = JSON.stringify(envelope.data, null, 2)`, reset `editType`, `editTags`, `editMode`, `resolveMode`, `error`

`useEffect` on `[mode, currentPrefix, currentCategory]`: when `mode === 'create'`, reset create-mode fields; `newPrefix = currentPrefix ?? ''`, `newCategory = currentCategory ?? ''`

Save handler (view/edit mode):
1. Call `editorRef.current.getValue()`, attempt `JSON.parse`; on failure set `error` and return
2. Call `createOrUpdateStoreEntry` mutation with `{ prefix, category, key, body: { type: editType, tags: editTags, data: parsedData } }`
3. On success: call `onSaved(envelope)`, reset `editMode`

Create handler:
1. Validate `newPrefix`, `newCategory`, `newKey` are non-empty; set `error` if not
2. Call `editorRef.current.getValue()`, attempt `JSON.parse`; on failure set `error` and return
3. Call `createOrUpdateStoreEntry` mutation; on success: call `onSaved(envelope)`, call `onClose()`

Delete handler:
- Opens `AlertDialog`; on confirm calls `deleteStoreEntry` mutation; on success: `onDeleted(key)`, `onClose()`

Resolve toggle:
- When toggling on: call `resolveStoreEntry(prefix, category, key)` directly (not mutation) and update `jsonValue` with resolved data
- When toggling off: reset `jsonValue` to `JSON.stringify(envelope.data, null, 2)`

Type dropdown: `Select` from shared UI; options `['object', 'string', 'number', 'boolean', 'array', 'cv_section']`

Tags editing: comma-separated `Input` (read and split on comma); displayed as `Badge` components in view mode

`MonacoEditor` rendered with `readOnly={!editMode}` in view mode; always `readOnly={false}` in create mode

**`StoreBrowserPage.tsx`**:

No props.

Local state: `selectedKey: string | null`, `panelVisible: boolean`, `panelMode: 'view' | 'create'`, `currentEnvelope: StoreEnvelope | null`, `currentPrefix: string`, `currentCategory: string`, `deletedKey: string | null`, `createdKey: string | null`

Auth guard (mirrors cockpit `app.tsx` pattern):
```typescript
const { isLoading, data: userInfo } = useUser();
if (isLoading) return <AppSkeleton />;
if (!userInfo) { logout(); return <AppSkeleton />; }
```

`AppSkeleton` is a local component (same pattern as `cockpit-app/apps/cockpit/src/app/skeleton.tsx`).

Permission guard wraps the main layout: `<PermissionGuard feature="redis_store" action="read">`.

Layout: `<div className="flex h-screen overflow-hidden">` — left panel `<KeyList>` fixed width `w-72` with `overflow-y-auto`; right panel `flex-1 overflow-y-auto` renders `<EntryPanel>` when `panelVisible`

Event wiring:
- `onKeySelected(key)`: parse key parts (`prefix:category:keyName`), call `getStoreEntry` directly, set `currentEnvelope`, set `panelMode='view'`, `panelVisible=true`
- `onCreate(ctx?)`: set `panelMode='create'`, `currentPrefix = ctx?.prefix ?? ''`, `currentCategory = ctx?.category ?? ''`, `panelVisible=true`, `currentEnvelope=null`
- `onSaved(envelope)`: `toast.success('Saved')`, set `createdKey = envelope.meta.key`, clear after next render tick (set to null in `useEffect` after notify)
- `onDeleted(key)`: `toast.success('Deleted')`, set `deletedKey = key`, clear `selectedKey`, `panelVisible=false`
- `onClose`: `panelVisible=false`

`<Toaster richColors />` rendered at the top level of the page (outside PermissionGuard).

### App Shell

**`src/app/app.tsx`**:
```typescript
import { Route, Routes } from 'react-router-dom';
import StoreBrowserPage from './features/store/components/StoreBrowserPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StoreBrowserPage />} />
    </Routes>
  );
}
```

**`src/app/app.spec.tsx`**:
- Render `<App />` wrapped in `MemoryRouter` + `QueryClientProvider`; assert it mounts without crashing

**`src/app/providers.tsx`**:
Copy `cockpit/src/app/providers.tsx` verbatim (identical dependency set).

### Cleanup

Files to delete under `cockpit-app/apps/store/src/`:
- `main.ts` (replaced by `main.tsx`)
- `test-setup.ts` (replaced by `setupTests.ts`)
- `src/index.html` (entry point moves to app root `index.html`)
- `app/app.component.ts`
- `app/app.config.ts`
- `app/app.routes.ts`
- `app/features/auth/` (entire directory — auth.service.ts, auth.guard.ts, auth.interceptor.ts, permission.guard.ts, permission.service.ts)
- `app/features/store/services/store-api.service.ts`
- `app/features/store/models/` (entire directory)
- `app/features/store/components/store-toolbar/` (entire directory)
- `app/features/store/components/key-list/key-list.component.*`
- `app/features/store/components/entry-panel/entry-panel.component.*`
- `app/features/store/components/monaco-editor/monaco-editor.component.ts`
- `app/features/store/pages/store-browser-page/` (entire directory)
- `app/features/store/store.routes.ts`

Packages to remove from `cockpit-app/package.json` (dependencies and devDependencies):
- All `@angular/*` packages
- `primeng`, `primeicons`
- `zone.js`
- All `@angular-devkit/*` packages
- `ngx-monaco-editor-v2` or equivalent Angular Monaco wrapper
- Any `@ngrx/*` packages if present
- `@primeng/*` if present as separate scoped packages

Packages to add to `cockpit-app/package.json`:
- `@monaco-editor/react`
- `sonner`
- `@radix-ui/react-select`
- `@radix-ui/react-alert-dialog`

Documentation updates:
- `cockpit-app/CLAUDE.md`: remove references to Angular store; add note that store app is React/Vite matching cockpit pattern
- `.maister/docs/project/tech-stack.md`: remove Angular 19 from frontend frameworks; update store app entry to React 19 + Vite
- `.maister/docs/project/architecture.md`: update store app description from Angular standalone to React SPA matching cockpit pattern
- `docs/deployment/` files: review for Angular/store references; update if found

### Testing Approach

Each implementation step group targets 2-8 focused tests. Test files are co-located with components (`.spec.tsx` suffix). Tests use Vitest + jsdom + `@testing-library/react`.

Coverage thresholds: ≥80% lines/functions/branches/statements (CI enforced). Coverage `exclude` list must include `src/main.tsx` and `src/app/providers.tsx`.

**API functions** (`api.ts` and `schemas.ts` — 6 tests):
- `getStorePrefixes` returns parsed array on success
- `getStorePrefixes` throws on HTTP error
- `storeEnvelopeSchema.parse` accepts valid envelope shape
- `storeEnvelopeSchema.parse` throws ZodError on missing `meta.key`
- `createOrUpdateStoreEntry` calls `baseApi.putRequest` with correct endpoint and body
- `deleteStoreEntry` calls `baseApi.deleteRequest` with correct endpoint

**`MonacoEditor.spec.tsx`** (3 tests):
- Renders without crashing when given `value` and `readOnly`
- `forwardRef` ref exposes `getValue()` that returns current editor content
- `onChange` callback fires when Monaco value changes

**`KeyList.spec.tsx`** (6 tests):
- Renders prefix list returned by `getStorePrefixes`
- Shows Skeleton while prefixes are loading
- Expands prefix and shows categories after click
- Expands category and shows keys after click
- Calls `onKeySelected` when a key is clicked
- Inline add prefix: renders input row on Plus click, dispatches new prefix node on Enter

**`EntryPanel.spec.tsx`** (6 tests):
- View mode: renders key, type, tags, and Monaco editor when `envelope` provided
- Edit mode: toggling edit enables Monaco editor and shows Save button
- Create mode: shows prefix/category/key inputs and empty Monaco editor
- Save: calls `createOrUpdateStoreEntry` mutation with correct args on Save button click
- Delete confirmation: AlertDialog renders; on confirm calls `deleteStoreEntry` mutation
- `onClose` called when close button clicked

**`StoreBrowserPage.spec.tsx`** (4 tests):
- Shows Skeleton when `useUser` returns `isLoading: true`
- Calls `logout` and shows Skeleton when `useUser` returns no user data
- Renders `KeyList` and no panel when user is authenticated
- `PermissionGuard` is rendered with `feature="redis_store" action="read"`

**`app.spec.tsx`** (1 test):
- App mounts without crashing and renders `StoreBrowserPage` route

### Standards Compliance

- **`standards/frontend/file-naming.md`**: PascalCase `.tsx` for all component files; camelCase for `endpoints.ts`, `schemas.ts`, `api.ts`, `hooks.ts`
- **`standards/frontend/components.md`**: named function declarations, `ComponentNameProps` interface, TanStack Query for all server state, Zod on all API responses via `fetcher()`
- **`standards/frontend/typescript.md`**: `strict: true`, `interface` for prop shapes, `type` for Zod-inferred types, `@cockpit-app/*` path aliases for cross-lib imports
- **`standards/frontend/css.md`**: Tailwind CSS v4 via `@tailwindcss/vite`, CSS-native config, no custom CSS outside design tokens
- **`standards/frontend/formatting.md`**: single quotes, Tailwind class order via `prettier-plugin-tailwindcss`
- **`standards/global/minimal-implementation.md`**: no speculative abstractions, no future-proofing stubs; `StoreToolbarComponent` and `patchKey` endpoint deliberately excluded
- **`standards/global/validation.md`**: all API responses validated by Zod schema in `fetcher()` before use
- **`standards/testing/test-writing.md`**: `.spec.tsx` suffix, `describe/it/expect`, `@testing-library/react`, mock external dependencies, ≥80% coverage thresholds

## Out of Scope

- `StoreToolbarComponent` — not ported (confirmed out of scope)
- `patchKey` endpoint — not ported (confirmed out of scope)
- Tags editing as a chip/token input with individual add/remove (comma-separated Input is sufficient for MVP)
- Pagination or virtual scrolling in KeyList
- Keyboard navigation for tree nodes beyond standard focus order
- Any new backend changes

## Success Criteria

- Store app runs at `http://localhost:4205` and displays the key-value tree browser
- Unauthenticated users are redirected to login; users without `redis_store:read` permission are rejected via PermissionGuard
- All existing Redis keys are browsable; entries can be viewed, edited, created, and deleted
- Monaco editor loads and renders JSON; `getValue()` returns current content on save
- Inline add prefix and inline add category flows work without page reload
- Tree updates in-memory after create/delete without re-fetching the full prefix list
- Toast notifications appear on save, create, and delete
- `npm run test -- --project=store` passes with ≥80% coverage
- `npm run build -- --project=store` produces a production bundle without Angular-related packages
- No Angular, PrimeNG, or zone.js packages remain in `package.json`
