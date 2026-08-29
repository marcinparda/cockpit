# Implementation Plan: Migrate Store App from Angular 19 to React 19

## Overview

Total Steps: 63
Task Groups: 9 (A–I) + 1 Testing Group (J)
Expected Tests: 26 implementation tests + up to 10 additional = ~26–36 total

## Implementation Steps

---

### Task Group A: Environment Setup
**Dependencies:** None
**Estimated Steps:** 8

- [x] A.0 Complete environment setup
  - [x] A.1 Write 2 build verification tests
    - Test 1: `nx build store` exits 0 (smoke build)
    - Test 2: `nx test store` exits 0 with zero test files (empty suite passes before any spec files exist)
    - These are CI-style shell assertions, not unit tests; record expected commands for executor to run after A.7
  - [x] A.2 Install npm packages
    - Run: `npm install @monaco-editor/react sonner @radix-ui/react-select @radix-ui/react-alert-dialog` from `cockpit-app/`
    - Verify entries appear in `cockpit-app/package.json` dependencies
  - [x] A.3 Rewrite `cockpit-app/apps/store/vite.config.mts`
    - Copy `cockpit-app/apps/cockpit/vite.config.mts`; change:
      - `cacheDir` → `../../node_modules/.vite/apps/store`
      - `server.port` → `4205`
      - `preview.port` → `4305`
      - `build.outDir` → `../../dist/apps/store`
      - coverage `reportsDirectory` → `../../coverage/apps/store`
      - coverage `exclude` → `['src/main.tsx', 'src/app/providers.tsx']`
  - [x] A.4 Rewrite tsconfig files
    - `cockpit-app/apps/store/tsconfig.json` — copy from `apps/cockpit/tsconfig.json` verbatim
    - `cockpit-app/apps/store/tsconfig.app.json` — copy from `apps/cockpit/tsconfig.app.json` verbatim
    - `cockpit-app/apps/store/tsconfig.spec.json` — copy from `apps/cockpit/tsconfig.spec.json` verbatim
  - [x] A.5 Rewrite `cockpit-app/apps/store/project.json`
    - Keep `"name": "store"`, `"tags": ["scope:store", "type:app"]`
    - Copy Vite executor targets from `apps/cockpit/project.json`: `build`, `serve` (port 4205), `test` (`@nx/vite:test`)
    - Remove all Angular executor targets (`@angular-devkit/*`)
  - [x] A.6 Rewrite `cockpit-app/apps/store/index.html`
    - Copy `apps/cockpit/index.html` as template
    - Change `<title>` to `"Store"`
    - Keep inline dark-mode `localStorage.getItem('theme')` script verbatim
    - Set `<link rel="stylesheet" href="/src/styles.css" />`
    - Set `<script type="module" src="/src/main.tsx"></script>`
  - [x] A.7 Create `cockpit-app/apps/store/src/main.tsx`
    - Copy `apps/cockpit/src/main.tsx` verbatim; only change import of `App` to `./app/app`
  - [x] A.8 Create `cockpit-app/apps/store/src/styles.css`
    - Copy `apps/cockpit/src/styles.css` verbatim
    - Change app-scoped `@source` line to: `@source "./**/*.{ts,tsx,js,jsx,html,css}";`
    - Remove any `@source` lines referencing cockpit-specific lib paths (keep shared UI `@source`)
  - [x] A.9 Create `cockpit-app/apps/store/setupTests.ts`
    - Copy `apps/cockpit/setupTests.ts` verbatim (Vitest setup for jsdom)
  - [x] A.10 Verify group A tests pass
    - Run `nx build store` — expect exit 0
    - Run `nx test store` — expect exit 0 (no test files yet is fine)

**Acceptance Criteria:**
- `nx build store` produces output in `dist/apps/store` without Angular-related errors
- `nx test store` runs the Vitest runner without configuration errors
- No Angular executor references remain in `project.json`

---

### Task Group B: Shared UI Components
**Dependencies:** None (can run in parallel with A)
**Estimated Steps:** 8

- [x] B.0 Complete shared UI components
  - [x] B.1 Write 7 unit tests across the three components
    - `Select.spec.tsx` (2 tests):
      - Renders `SelectTrigger` with placeholder text visible
      - Selecting an option calls `onValueChange` with the selected value
    - `AlertDialog.spec.tsx` (2 tests):
      - Renders trigger button; dialog content hidden before trigger click
      - Clicking `AlertDialogAction` calls the provided `onClick` handler
    - `Toaster.spec.tsx` (3 tests):
      - `Toaster` component renders without crashing
      - `toast.success('msg')` call does not throw
      - Re-export: `toast` imported from `@cockpit-app/shared-react-ui` equals sonner's `toast`
    - Place spec files alongside each component in `libs/shared/ui/react/src/lib/`
  - [x] B.2 Create `libs/shared/ui/react/src/lib/Select/Select.tsx`
    - Wraps `@radix-ui/react-select` primitives
    - Named exports: `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue`
    - `SelectTrigger`: `React.forwardRef` with `className?: string`; renders `<SelectPrimitive.Trigger>` with `ChevronDown` lucide icon
    - `SelectContent`: renders `<SelectPrimitive.Content position="popper">` wrapping a scroll area
    - `SelectItem`: renders `<SelectPrimitive.Item>` with `CheckIcon` lucide check indicator
    - Tailwind classes; `SelectTriggerProps` / `SelectItemProps` explicit interfaces
  - [x] B.3 Create `libs/shared/ui/react/src/lib/AlertDialog/AlertDialog.tsx`
    - Wraps `@radix-ui/react-alert-dialog` primitives
    - Named exports: `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`
    - `AlertDialogContent` includes overlay with semi-transparent background via Tailwind
    - `AlertDialogAction` uses destructive variant styles (red background)
    - `AlertDialogCancel` uses outline/ghost variant styles
  - [x] B.4 Create `libs/shared/ui/react/src/lib/Toaster/Toaster.tsx`
    - Wraps `Toaster` from `sonner`; passes `richColors` prop
    - Export: `export function Toaster() { return <SonnerToaster richColors />; }`
    - Re-export: `export { toast } from 'sonner';`
  - [x] B.5 Add exports to `libs/shared/ui/react/src/index.ts`
    - Append:
      ```
      export * from './lib/Select/Select';
      export * from './lib/AlertDialog/AlertDialog';
      export * from './lib/Toaster/Toaster';
      ```
  - [x] B.6 Ensure group B tests pass
    - Run: `nx test shared-react-ui` — expect 7 new tests pass
    - Run `nx build shared-react-ui` — expect no TypeScript errors

**Acceptance Criteria:**
- All 7 tests pass
- `Select`, `AlertDialog`, `Toaster`, and `toast` are importable from `@cockpit-app/shared-react-ui`
- No TypeScript errors in shared UI lib build

---

### Task Group C: App Shell
**Dependencies:** A
**Estimated Steps:** 5

- [x] C.0 Complete app shell
  - [x] C.1 Write 1 test for app shell
    - `app.spec.tsx` (1 test):
      - Render `<App />` wrapped in `MemoryRouter` + `QueryClientProvider`; assert it mounts without crashing (no thrown error, no uncaught promise rejection)
    - Note: `StoreBrowserPage` will be mocked in this test (`vi.mock('./features/store/components/StoreBrowserPage')`) to avoid transitive auth/API deps
  - [x] C.2 Create `cockpit-app/apps/store/src/app/providers.tsx`
    - Copy `apps/cockpit/src/app/providers.tsx` verbatim
    - Must include: `QueryClientProvider`, `BrowserRouter`, `TooltipProvider`
  - [x] C.3 Create `cockpit-app/apps/store/src/app/app.tsx`
    - ```typescript
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
  - [x] C.4 Create `cockpit-app/apps/store/src/app/app.spec.tsx`
    - Test file for the 1 test described in C.1
    - Use `vi.mock` to stub `StoreBrowserPage` with a `<div data-testid="store-page" />`
    - Wrap with `MemoryRouter` + test `QueryClientProvider`
  - [x] C.5 Ensure group C test passes
    - Run `nx test store` (scoped to `app.spec.tsx`): expect 1 test passes

**Acceptance Criteria:**
- 1 test passes
- App shell renders without TypeScript errors
- `providers.tsx` wires `QueryClientProvider` + `BrowserRouter` + `TooltipProvider`

---

### Task Group D: Store API Layer
**Dependencies:** A
**Estimated Steps:** 7

- [x] D.0 Complete store API layer
  - [x] D.1 Write 6 API tests
    - `api.spec.ts` (or `schemas.spec.ts`) co-located in `src/app/features/store/api/`:
      1. `getStorePrefixes` returns parsed `string[]` when fetch resolves with valid JSON
      2. `getStorePrefixes` throws on HTTP error response
      3. `storeEnvelopeSchema.parse` accepts valid envelope `{ meta: { key, type, version, created_at, updated_at, tags }, data: {} }`
      4. `storeEnvelopeSchema.parse` throws `ZodError` when `meta.key` is missing
      5. `createOrUpdateStoreEntry` calls `baseApi.putRequest` with `STORE_ENDPOINTS.entry(p, c, k)` and correct body
      6. `deleteStoreEntry` calls `baseApi.deleteRequest` with `STORE_ENDPOINTS.entry(p, c, k)`
    - Mock `baseApi` using `vi.mock('@cockpit-app/common-shared-data-access')`
  - [x] D.2 Create `src/app/features/store/api/endpoints.ts`
    - Exact content per spec:
      ```typescript
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
  - [x] D.3 Create `src/app/features/store/api/schemas.ts`
    - `storeMetaSchema`, `storeEnvelopeSchema`, `storeWriteRequestSchema`, `storePrefixesSchema`, `storeCategoriesSchema`, `storeKeysSchema`
    - Exported inferred types: `StoreMeta`, `StoreEnvelope`, `StoreWriteRequest`
    - Reference pattern: `libs/shared/data-access/common/src/lib/authorization/schemas.ts`
  - [x] D.4 Create `src/app/features/store/api/api.ts`
    - All 7 async functions per spec: `getStorePrefixes`, `getStoreCategories`, `getStoreKeys`, `getStoreEntry`, `resolveStoreEntry`, `createOrUpdateStoreEntry`, `deleteStoreEntry`
    - Import `baseApi` from `@cockpit-app/common-shared-data-access`
    - Import `STORE_ENDPOINTS` from `./endpoints`
    - Import Zod schemas from `./schemas`
  - [x] D.5 Create `src/app/features/store/api/hooks.ts`
    - All 6 TanStack Query hooks per spec: `useStorePrefixes`, `useStoreCategories`, `useStoreKeys`, `useStoreEntry`, `useCreateOrUpdateStoreEntry`, `useDeleteStoreEntry`
    - `enabled` guards on all queries that require prefix/category/key to be non-empty
    - Note: `KeyList` calls API functions directly, not hooks — hooks used only by `EntryPanel`
  - [x] D.6 Ensure group D tests pass
    - Run `nx test store` (scoped to `api/` files): expect 6 tests pass

**Acceptance Criteria:**
- All 6 tests pass
- No TypeScript errors (`strict: true`)
- All Zod schemas validate API responses before use
- `STORE_ENDPOINTS` covers all 5 endpoint patterns from spec

---

### Task Group E: MonacoEditor Component
**Dependencies:** A
**Estimated Steps:** 5

- [x] E.0 Complete MonacoEditor component
  - [x] E.1 Write 3 MonacoEditor tests
    - `MonacoEditor.spec.tsx`:
      1. Renders without crashing given `value=""` and `readOnly={false}`
      2. `forwardRef` ref exposes `getValue()` that returns current editor content (mock `@monaco-editor/react` Editor to call `onMount` with a mock instance)
      3. `onChange` prop is called when the Monaco editor fires its onChange event
    - Mock `@monaco-editor/react` with `vi.mock` to avoid actual Monaco loading in jsdom
  - [x] E.2 Create `src/app/features/store/components/MonacoEditor/MonacoEditor.tsx`
    - Props interface:
      ```typescript
      interface MonacoEditorProps {
        value: string;
        readOnly: boolean;
        onChange?: (value: string) => void;
      }
      export type MonacoEditorRef = { getValue(): string };
      ```
    - `forwardRef<MonacoEditorRef, MonacoEditorProps>`
    - `editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)`
    - `useImperativeHandle(ref, () => ({ getValue: () => editorRef.current?.getValue() ?? '' }))`
    - `onMount` callback: `editorRef.current = editor`
    - Editor options: `language: 'json'`, `theme: 'vs-dark'`, `readOnly: props.readOnly`, `minimap: { enabled: false }`, `wordWrap: 'on'`
  - [x] E.3 Create `src/app/features/store/components/MonacoEditor/MonacoEditor.spec.tsx`
    - Test file for the 3 tests described in E.1
  - [x] E.4 Ensure group E tests pass
    - Run `nx test store` (scoped to `MonacoEditor.spec.tsx`): expect 3 tests pass

**Acceptance Criteria:**
- All 3 tests pass
- `MonacoEditorRef` type exported for use by `EntryPanel`
- `getValue()` returns empty string (not `undefined`) if editor not yet mounted
- Component compiles with `strict: true`

---

### Task Group F: KeyList Component
**Dependencies:** D, E
**Estimated Steps:** 7

- [x] F.0 Complete KeyList component
  - [x] F.1 Write 6 KeyList tests
    - `KeyList.spec.tsx`:
      1. Renders prefix list returned by mocked `getStorePrefixes`
      2. Shows `Skeleton` while prefixes are loading (mock `getStorePrefixes` to return a never-resolving promise)
      3. Expands a prefix and shows categories after clicking its row (mock `getStoreCategories`)
      4. Expands a category and shows keys after clicking its row (mock `getStoreKeys`)
      5. Calls `onKeySelected` with the key string when a key row is clicked
      6. Inline add prefix: Plus button click shows Input row; typing a name and pressing Enter adds a new prefix node
    - Mock `getStorePrefixes`, `getStoreCategories`, `getStoreKeys` from `../api/api` with `vi.mock`
    - Provide `onKeySelected`, `onCreate` as `vi.fn()` props
  - [x] F.2 Create `src/app/features/store/components/KeyList/KeyList.tsx`
    - Props interface per spec; `useReducer` with `TreeState` and all 13 reducer actions per spec
    - On mount: call `getStorePrefixes()` directly (async), dispatch `SET_PREFIXES` and `SET_LOADING_PREFIXES`
    - `togglePrefix`: lazy-load categories via `getStoreCategories(prefix)` if not yet loaded
    - `toggleCategory`: lazy-load keys via `getStoreKeys(prefix, category)` if not yet loaded
    - `useEffect([deletedKey])`: dispatch `REMOVE_KEY`
    - `useEffect([createdKey])`: dispatch `ADD_KEY` (only affects expanded category nodes)
    - Lucide icons: `Server` (prefix), `Folder` (category), `Key` (key), `ChevronRight`/`ChevronDown` (expand state), `Plus` (add buttons)
    - Reuse: `Skeleton`, `Separator` from `@cockpit-app/shared-react-ui`
    - Reuse: `Input` from `@cockpit-app/shared-react-ui` for inline add rows
  - [x] F.3 Create `src/app/features/store/components/KeyList/KeyList.spec.tsx`
    - Test file for the 6 tests described in F.1
  - [x] F.4 Ensure group F tests pass
    - Run `nx test store` (scoped to `KeyList.spec.tsx`): expect 6 tests pass

**Acceptance Criteria:**
- All 6 tests pass
- `useReducer` state shape matches spec (`TreeState`, `PrefixNode`, `CategoryNode`)
- No TanStack Query hooks used inside KeyList (direct API function calls only)
- Tree updates in-memory without re-fetching full prefix list after create/delete

---

### Task Group G: EntryPanel Component
**Dependencies:** D, E, B
**Estimated Steps:** 7

- [x] G.0 Complete EntryPanel component
  - [x] G.1 Write 6 EntryPanel tests
    - `EntryPanel.spec.tsx`:
      1. View mode: renders key, type, tags as `Badge` components, and Monaco editor when `envelope` prop provided
      2. Edit mode: clicking Edit button enables Monaco editor (`readOnly={false}`) and shows Save button
      3. Create mode (`mode='create'`): shows prefix/category/key inputs and Monaco with empty `{}`
      4. Save: calls `createOrUpdateStoreEntry` mutation with correct `prefix/category/key` and JSON body on Save button click
      5. Delete confirmation: `AlertDialog` renders; clicking confirm calls `deleteStoreEntry` mutation
      6. `onClose` is called when close button is clicked
    - Mock `useCreateOrUpdateStoreEntry`, `useDeleteStoreEntry` from `../api/hooks`
    - Mock `MonacoEditor` component with `vi.mock` returning a `<textarea>` forwardRef stub
  - [x] G.2 Create `src/app/features/store/components/EntryPanel/EntryPanel.tsx`
    - Props interface per spec; all local state per spec
    - `editorRef = useRef<MonacoEditorRef>(null)`
    - `useEffect([envelope])`: sync `jsonValue`, reset edit state
    - `useEffect([mode, currentPrefix, currentCategory])`: reset create-mode fields
    - Save handler: `JSON.parse(editorRef.current.getValue())` → error if invalid; call mutation on success
    - Create handler: validate non-empty prefix/category/key; call mutation on success
    - Delete handler: `AlertDialog` confirm → call delete mutation
    - Resolve toggle: call `resolveStoreEntry` directly; update `jsonValue`
    - Type dropdown: `Select` with options `['object', 'string', 'number', 'boolean', 'array', 'cv_section']`
    - Tags: comma-split `Input`; displayed as `Badge` in view mode
    - Reuse: `Button`, `Input`, `Badge` from `@cockpit-app/shared-react-ui`
    - Reuse: `Select`, `AlertDialog` primitives from `@cockpit-app/shared-react-ui`
  - [x] G.3 Create `src/app/features/store/components/EntryPanel/EntryPanel.spec.tsx`
    - Test file for the 6 tests described in G.1
  - [x] G.4 Ensure group G tests pass
    - Run `nx test store` (scoped to `EntryPanel.spec.tsx`): expect 6 tests pass

**Acceptance Criteria:**
- All 6 tests pass
- `MonacoEditorRef` typed correctly with `useRef<MonacoEditorRef>`
- `AlertDialog` used for delete confirmation (not browser `confirm()`)
- JSON parse error shown inline (not thrown); `error` state displayed to user

---

### Task Group H: StoreBrowserPage + Angular Cleanup
**Dependencies:** C, F, G, B
**Rollback note:** Angular file deletions are irreversible without `git revert`; commit group H's non-destructive work (page creation + package.json changes) first, then delete Angular files in a separate commit so rollback is clean.
**Estimated Steps:** 10

- [x] H.0 Complete StoreBrowserPage and cleanup
  - [x] H.1 Write 4 StoreBrowserPage tests
    - `StoreBrowserPage.spec.tsx`:
      1. Shows `AppSkeleton` when `useUser` returns `{ isLoading: true }`
      2. Calls `logout()` and shows `AppSkeleton` when `useUser` returns `{ isLoading: false, data: null }`
      3. Renders `KeyList` and no `EntryPanel` when user is authenticated (mock `useUser` to return valid user)
      4. `PermissionGuard` is rendered with props `feature="redis_store"` and `action="read"`
    - Mock `useUser` from `@cockpit-app/shared-react-data-access`
    - Mock `KeyList` and `EntryPanel` with `vi.mock` stubs
    - Mock `PermissionGuard` from `@cockpit-app/shared-react-feature` and assert it received correct props
  - [x] H.2 Create `src/app/features/store/pages/StoreBrowserPage/StoreBrowserPage.tsx`
    - (Spec places this under `components/`; use `pages/StoreBrowserPage/` per file structure in spec — follow spec's file structure section)
    - Local state per spec: `selectedKey`, `panelVisible`, `panelMode`, `currentEnvelope`, `currentPrefix`, `currentCategory`, `deletedKey`, `createdKey`
    - Auth guard: `useUser()` → Skeleton or logout redirect
    - `AppSkeleton` local component matching cockpit pattern
    - `PermissionGuard` wrapping main layout
    - Layout: `<div className="flex h-screen overflow-hidden">` with `<KeyList>` (`w-72 overflow-y-auto`) + `<EntryPanel>` (right panel, shown when `panelVisible`)
    - Event handlers: `onKeySelected`, `onCreate`, `onSaved`, `onDeleted`, `onClose` per spec
    - `onKeySelected`: parse `prefix:category:keyName` from key string; call `getStoreEntry` directly; set `currentEnvelope`
    - `onSaved`: `toast.success('Saved')`, set `createdKey`, clear in next `useEffect` tick
    - `onDeleted`: `toast.success('Deleted')`, set `deletedKey`, clear `selectedKey`, `panelVisible=false`
    - `<Toaster richColors />` at top level (outside `PermissionGuard`)
    - Import `toast` from `@cockpit-app/shared-react-ui`
  - [x] H.3 Create `src/app/features/store/pages/StoreBrowserPage/StoreBrowserPage.spec.tsx`
    - Test file for the 4 tests described in H.1
  - [x] H.4 Update `src/app/app.tsx` import path
    - Change import to `./features/store/pages/StoreBrowserPage/StoreBrowserPage`
  - [x] H.5 Ensure StoreBrowserPage tests pass
    - Run `nx test store` (full suite): expect all tests pass across A–H groups (~26 tests total)
  - [x] H.6 Delete Angular source files (commit after H.5 passes)
    - Delete the following from `cockpit-app/apps/store/src/`:
      - `main.ts`
      - `test-setup.ts`
      - `src/index.html` (entry point is now root `index.html`)
      - `app/app.component.ts`
      - `app/app.config.ts`
      - `app/app.routes.ts`
      - `app/features/auth/` (entire directory)
      - `app/features/store/services/store-api.service.ts`
      - `app/features/store/models/` (entire directory)
      - `app/features/store/components/store-toolbar/` (entire directory)
      - `app/features/store/components/key-list/key-list.component.*`
      - `app/features/store/components/entry-panel/entry-panel.component.*`
      - `app/features/store/components/monaco-editor/monaco-editor.component.ts`
      - `app/features/store/pages/store-browser-page/` (entire directory)
      - `app/features/store/store.routes.ts`
    - Rollback: `git revert HEAD` if issues found post-deletion
  - [x] H.7 Remove Angular/PrimeNG packages from `cockpit-app/package.json`
    - Remove from dependencies and devDependencies:
      - All `@angular/*` packages
      - `primeng`, `primeicons`
      - `zone.js`
      - All `@angular-devkit/*` packages
      - `ngx-monaco-editor-v2` (or equivalent Angular Monaco wrapper)
      - Any `@ngrx/*` packages if present
      - `@primeng/*` scoped packages if present
    - Run `npm install` (or `npm ci`) in `cockpit-app/` to update `package-lock.json`
  - [x] H.8 Verify clean build after cleanup
    - Run `nx build store` — expect clean build, no Angular-related package errors
    - Run `nx test store` — expect all tests still pass
    - Confirm no `zone.js`, `@angular/*`, `primeng` imports anywhere in `apps/store/`

**Acceptance Criteria:**
- All 4 StoreBrowserPage tests pass
- Full `nx test store` suite (~26 tests) passes
- `nx build store` succeeds without Angular-related errors
- No Angular, PrimeNG, or zone.js packages remain in `package.json`
- All listed Angular source files are deleted

---

### Task Group I: Documentation Updates
**Dependencies:** H
**Estimated Steps:** 5

- [x] I.0 Complete documentation updates
  - [x] I.1 Update `cockpit-app/CLAUDE.md`
    - Remove any section or bullet referencing Angular store
    - Add note that `apps/store/` is a React 19 + Vite app matching the cockpit app pattern
    - Update any port references for store (still 4205, no change needed)
  - [x] I.2 Update `.maister/docs/project/tech-stack.md`
    - Remove Angular 19 from frontend frameworks list
    - Update store app entry to: React 19 + Vite + TanStack Query + shadcn/ui + Tailwind CSS v4
    - Add `@monaco-editor/react`, `sonner`, `@radix-ui/react-select`, `@radix-ui/react-alert-dialog` to dependencies list if not already present
  - [x] I.3 Update `.maister/docs/project/architecture.md`
    - Update store app description: from "Angular 19 standalone SPA" to "React 19 SPA matching cockpit pattern"
    - Note shared UI additions (Select, AlertDialog, Toaster now in `libs/shared/ui/react/`)
  - [x] I.4 Review and update `docs/deployment/` files
    - Check `docs/deployment/OVERVIEW.md`, `PRODUCTION_STACK.md`, `CICD.md` for Angular/store references
    - Update any found (container image names, build commands) to reflect Vite/React
    - If no Angular references found, note "reviewed, no changes needed" in work log
  - [x] I.5 Review `.maister/docs/INDEX.md`
    - Update tech-stack.md and architecture.md summary lines if Angular store was mentioned

**Acceptance Criteria:**
- No Angular references remain in any updated documentation file
- Tech stack doc accurately lists React 19 as the store framework
- Deployment docs are consistent with the new build output paths

---

### Task Group J: Test Review and Gap Analysis
**Dependencies:** A, B, C, D, E, F, G, H (all implementation groups)
**Estimated Steps:** 4

- [x] J.0 Review and fill critical test gaps
  - [x] J.1 Review all tests from groups A–H (expected ~26 tests)
    - Review: `app.spec.tsx` (1), API tests (6), `MonacoEditor.spec.tsx` (3), `KeyList.spec.tsx` (6), `EntryPanel.spec.tsx` (6), `StoreBrowserPage.spec.tsx` (4)
    - Note coverage gaps for THIS feature only (not shared libs)
  - [x] J.2 Analyze gaps
    - Check coverage report: `nx test store --coverage`
    - Identify uncovered branches in `KeyList` reducer, `EntryPanel` mode transitions, `StoreBrowserPage` event handlers
    - Focus on: error states (JSON parse failure), edge cases (empty tree, no matching category for `ADD_KEY`)
  - [x] J.3 Write up to 10 additional strategic tests
    - Target uncovered branches identified in J.2
    - Example candidates:
      - `EntryPanel`: JSON parse error sets `error` state visible to user
      - `KeyList`: `deletedKey` `useEffect` dispatches `REMOVE_KEY` and key disappears from tree
      - `KeyList`: `createdKey` `useEffect` adds key only to expanded category
      - `StoreBrowserPage`: `onSaved` sets `createdKey` and clears it after tick
      - `StoreBrowserPage`: `onDeleted` sets `deletedKey`, clears `selectedKey`, hides panel
    - Stop at 10 maximum; do not add tests beyond 36 total
  - [x] J.4 Run full feature test suite
    - Run `nx test store --coverage`
    - Expect: all tests pass, ≥80% coverage on lines/functions/branches/statements
    - If coverage fails, add 1-2 tests targeting the failing threshold; do not exceed 36 total

**Acceptance Criteria:**
- All feature tests pass (≥26, ≤36 total)
- Coverage ≥80% lines/functions/branches/statements
- No more than 10 additional tests added in this group
- `nx build store` still passes after all test additions

---

## Execution Order

1. Group A: Environment Setup (7 steps) + Group B: Shared UI Components (7 steps) — run in parallel
2. Group C: App Shell (4 steps) — depends on A
3. Group D: Store API Layer (6 steps) — depends on A (can run in parallel with C)
4. Group E: MonacoEditor Component (4 steps) — depends on A (can run in parallel with C, D)
5. Group F: KeyList Component (6 steps) — depends on D, E
6. Group G: EntryPanel Component (6 steps) — depends on D, E, B
7. Group H: StoreBrowserPage + Cleanup (9 steps) — depends on C, F, G, B
8. Group I: Documentation Updates (4 steps) — depends on H
9. Group J: Test Review and Gap Analysis (4 steps) — depends on all implementation groups

## Standards Compliance

Follow standards from `.maister/docs/standards/`:

- `global/coding-style.md` — 2-space indentation, UTF-8, final newline, no trailing whitespace
- `global/minimal-implementation.md` — no speculative abstractions; StoreToolbarComponent and patchKey endpoint deliberately excluded
- `global/validation.md` — all API responses validated by Zod schema before use
- `frontend/file-naming.md` — PascalCase `.tsx` for component files; camelCase for `endpoints.ts`, `schemas.ts`, `api.ts`, `hooks.ts`
- `frontend/components.md` — named function declarations, `ComponentNameProps` interface, TanStack Query for server state, Zod on all API responses
- `frontend/typescript.md` — `strict: true`, `interface` for prop shapes, `type` for Zod-inferred types, `@cockpit-app/*` path aliases across lib boundaries
- `frontend/css.md` — Tailwind CSS v4 via `@tailwindcss/vite`, CSS-native config
- `frontend/formatting.md` — single quotes, prettier-plugin-tailwindcss class order
- `frontend/architecture.md` — Nx `@cockpit-app/*` aliases for all cross-library imports; no relative paths across lib boundaries
- `testing/test-writing.md` — `.spec.tsx` suffix, `describe/it/expect`, `@testing-library/react`, mock external dependencies, ≥80% coverage thresholds

## Notes

- Test-Driven: Each group starts with 2–8 tests written before implementation
- Run Incrementally: Only run the new group's tests after each group, not the full suite (until Group J)
- Mark Progress: Check off steps as completed
- Reuse First: Prioritize existing components from spec (cockpit app shell, shared react UI, baseApi, useUser, PermissionGuard)
- Rollback: Angular file deletions in H.6 are the only irreversible step — commit non-destructive work first, deletions second
- Parallel Opportunity: Groups A and B have no dependencies and can be executed concurrently
- Direct API Calls in KeyList: `KeyList` calls `getStorePrefixes`/`getStoreCategories`/`getStoreKeys` directly (not via TanStack Query hooks) to control per-node loading state via `useReducer`
- Monaco Mocking: All tests involving `MonacoEditor` must mock `@monaco-editor/react` to avoid actual Monaco loading in jsdom
