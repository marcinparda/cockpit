# @cockpit-app/shared-react-ui

Shared React component library — shadcn/ui-style primitives built on Radix UI + Tailwind CSS + CVA.

## Usage

```tsx
import { Button, Input, Label, Card } from '@cockpit-app/shared-react-ui';
```

## Adding a new component

1. **Find the component** on [shadcn/ui](https://ui.shadcn.com/docs/components) or [shadcnui-blocks](https://www.shadcnui-blocks.com/blocks).

2. **Create the folder:**
   ```
   libs/shared/ui/react/src/lib/ComponentName/
   ├── ComponentName.tsx
   ├── ComponentName.spec.tsx
   └── ComponentName.stories.tsx
   ```

3. **Adapt the component** to match project conventions:
   - Import `cn` from `@cockpit-app/shared-utils`
   - Use `data-slot` attribute for identification
   - Use `React.ComponentProps<'element'>` for prop typing
   - Use CVA for variants when needed
   - Use Radix UI primitives (`@radix-ui/react-*`) for accessible behavior

4. **Export** from `libs/shared/ui/react/src/index.ts`:
   ```ts
   export * from './lib/ComponentName/ComponentName';
   ```

5. **Install Radix deps** if needed (e.g. `@radix-ui/react-dialog`) — use exact versions.

## Existing components

| Component | Radix dep | Notes |
|-----------|-----------|-------|
| Button | `@radix-ui/react-slot` | CVA variants: default, destructive, outline, secondary, ghost, link |
| Input | — | Standard input with shadcn styling |
| Label | `@radix-ui/react-label` | Form label |
| Card | — | Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription, CardAction |
| Badge | — | Inline badge/tag |
| Separator | — | Divider |
| Skeleton | — | Loading placeholder |
| Tooltip | `@radix-ui/react-tooltip` | Tooltip with provider |
| TypographyH1 | — | Heading |
| TypographyP | — | Paragraph |
| TypographySmall | — | Small text |

## Using page-level blocks

For full page layouts (login, signup, pricing, etc.), browse [shadcnui-blocks](https://www.shadcnui-blocks.com/blocks). These are **not** added to this lib — they're composed directly in app code using primitives from this lib.

Workflow:
1. Find a block on shadcnui-blocks (e.g. `login-03`)
2. Inspect the preview with browser devtools or Playwright to get the HTML structure
3. Adapt the markup in your app component, using `Button`, `Input`, `Label` etc. from this lib
4. Add any missing primitive components to this lib if needed

## Running tests

```bash
nx test react-ui
```

## Storybook

```bash
nx run react-ui:storybook        # dev server
nx run react-ui:build-storybook   # static build
```
