## TypeScript Configuration Standards

### TypeScript Strict Mode
Enable `strict: true` plus `noImplicitOverride`, `noImplicitReturns`, `noPropertyAccessFromIndexSignature`, `noFallthroughCasesInSwitch`. Source: `tsconfig.base.json`.

### ES2022 Target
Compile to ES2022 module format. Source: `tsconfig.base.json` target/module: ES2022.

### Consistent File Name Casing
`forceConsistentCasingInFileNames: true`. Source: `tsconfig.base.json`.

### Path Aliases for Cross-Library Imports
Always use `@cockpit-app/*` path aliases for cross-library imports. Never use relative paths across library boundaries. Aliases declared in `tsconfig.base.json`. Source: `tsconfig.base.json` paths, confirmed in 15+ call sites.

```ts
// Correct
import { cn } from '@cockpit-app/shared-utils';
// Wrong
import { cn } from '../../shared/utils/src';
```

### `interface` for Object Shapes, `type` for Aliases
Use `interface` for component props, hook return types, structured data. Use `type` for unions, simple aliases, and Zod-inferred types.

```ts
interface AppCardProps { title: string; description: string; }
export type UserRole = z.infer<typeof rolesResponseSchema>[number];
```
