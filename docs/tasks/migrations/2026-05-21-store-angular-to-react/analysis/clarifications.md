# Migration Clarifications

## Monaco Editor
**Decision**: Add `@monaco-editor/react` to cockpit-app/package.json
**Reason**: Direct React wrapper for Monaco, matches existing Angular behavior exactly.

## Notifications
**Decision**: Add shadcn/ui Toaster component
**Reason**: Consistent with project's shadcn component approach, uses Radix primitives.

## Add Prefix/Category UX
**Decision**: Keep inline inputs in tree
**Reason**: Replicate existing UX exactly — inline input row appears in the tree on click.

## Entry Panel Layout
**Decision**: Keep inline side panel
**Reason**: Replicate existing layout: key list sidebar + detail panel side by side with flex.
