## Frontend File Naming Conventions

### PascalCase for React Component Files
All `.tsx` component files use PascalCase. Example: `AppCard.tsx`, `Button.tsx`, `PermissionGuard.tsx`.

### camelCase for Non-Component Files
Hooks, services, utils, config, endpoints, schemas use camelCase. Example: `useUser.ts`, `fetcher.ts`, `baseApi.ts`, `queryKeys.ts`.

### Hooks Prefixed with `use`
Hook files always use `use` prefix in camelCase. Example: `useUser.ts`, `usePresets.ts`, `usePermissions.ts`.

### No kebab-case for TypeScript/TSX Files
Zero kebab-case `.ts`/`.tsx` source files — confirmed across all sampled directories.
