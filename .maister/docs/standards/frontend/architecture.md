## Frontend Architecture Standards

### Unidirectional Nx Library Dependency Flow
Strict dependency direction enforced by ESLint `@nx/enforce-module-boundaries`. Flow: `util → data-access → ui → feature → app`. Lower layers must not import from higher layers.

```
type:util       — no internal deps
type:data-access — can import util
type:ui          — can import data-access, util
type:feature     — can import ui, data-access, util
app              — can import anything
```

### Nx Library Tags Required
Every library must have both `type:*` (util/data-access/ui/feature) and `scope:*` (shared/cockpit/login/cv/store) tags. Source: `eslint.config.mjs` depConstraints.

### Apps Are Thin Composition Entry Points
Apps only wire providers, routing, and top-level composition. Business logic lives in libs, not in app-level code. Source: `cockpit-app/docs/ARCHITECTURE.md`.

### OpenAPI-Generated TypeScript Types
All apps use `@cockpit-app/api-types` generated from the live API's OpenAPI spec. Refresh with `make app-update-types`. Never manually write types that duplicate API response shapes. Source: `cockpit-app/CLAUDE.md`.

### Run Tasks via Nx, Not Underlying Tooling
Always use `nx run`, `nx run-many`, `nx affected` instead of calling vite/jest/eslint directly. Source: `cockpit-app/CLAUDE.md`.

```sh
nx run cockpit:build      # correct
nx run-many --target=test # correct
vite build                # wrong
```

### Remove Nx Library with Generator
`nx g @nx/workspace:remove --projectName=<name>`. Never `rm -rf` + manual edits — the generator updates project.json, workspace graph, and tsconfig.base.json atomically. Source: `cockpit-app/CLAUDE.md`.

### Cookie-Based Auth with `credentials: 'include'`
All fetch calls use `credentials: 'include'` so HttpOnly cookies are sent automatically. Fetcher catches 401 → POST refresh → retry. Source: `cockpit-app/docs/ARCHITECTURE.md`.
