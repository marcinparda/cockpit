## Components

### Single Responsibility
Each component should do one thing well.

### Reusability
Design components to work across different contexts with configurable props.

### Composability
Build complex UIs by combining smaller components rather than creating monoliths.

### Clear Interface
Define explicit, documented props with sensible defaults.

### Encapsulation
Keep implementation details private; expose only what's necessary.

### Consistent Naming
Use descriptive names that indicate purpose and follow team conventions.

### Local State
Keep state as close to where it's used as possible; lift only when needed.

### Minimal Props
If a component needs many props, consider composition or splitting it.

### Documentation
Document usage, props, and examples to help team adoption.

## Project React Component Patterns

### Named Function Declarations
Export React components as named function declarations (not arrow functions, not class components). Props typed with `<ComponentName>Props` interface, destructured in signature.

```tsx
interface AppCardProps { title: string; url: string; }
export function AppCard({ title, url }: AppCardProps) { ... }
```

### TanStack Query for All Server State
All data fetching via `useQuery`/`useMutation` in thin custom hooks. Central `queryKeys` const object for all query keys. Source: confirmed in useUser.ts, usePresets.ts, usePermissions.ts.

### Zod Schema Validation on All API Responses
Every API call goes through `fetcher()` which requires a Zod schema. No raw fetch without schema. ZodError caught and rethrown with `[ZOD ERROR]` prefix. Source: `fetcher.ts`, `baseApi.ts`.

```ts
export const currentUserSchema = z.object({ ... }).transform(data => data as UserInfoResponse);
baseApi.getRequest(AUTHENTICATION_ENDPOINTS.user(), currentUserSchema);
```

### Endpoint Constants as SCREAMING_SNAKE_CASE Objects
API endpoint paths in dedicated `endpoints.ts` as typed const objects with arrow function entries. Never hardcode paths inline.

```ts
export const AUTHENTICATION_ENDPOINTS = {
  login: () => '/api/v1/authentication/sessions/login',
} as const;
```
