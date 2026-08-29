# AGENTS.md

Guidance for AI agents when working in `cockpit-app/`.

CockpitApp is a multi-application Nx monorepo of web apps with a shared, type-safe API integration system.

## Apps

| App | Stack |
|---|---|
| cockpit | React 19 + Vite + TanStack Query + shadcn/ui + Tailwind CSS v4 |
| login | React 19 + Vite + TanStack Query + shadcn/ui + Tailwind CSS v4 |
| habits | React 19 + Vite + TanStack Query + shadcn/ui + Tailwind CSS v4 (port 4208, habits.parda.me) |
| store | React 19 + Vite + TanStack Query + shadcn/ui + Tailwind CSS v4 (same pattern as cockpit) |
| cv | Vue 3.5 + Vite + Pinia |

### Deployment
See `.github/` dir.

## Architecture Reference

For app structure, lib layout, auth flow, state management, build system, deployment, Nx dependency-flow rules, component patterns, and UI design system — see [`docs/standards/frontend/architecture.md`](../docs/standards/frontend/architecture.md) and [`components.md`](../docs/standards/frontend/components.md).

## Storybook

- `npx nx run react-ui:storybook` — dev server for `@cockpit-app/shared-react-ui` components
- `npx nx run react-ui:build-storybook` — static build → `dist/storybook/react-ui`
- Deployed as `cockpit-storybook` container on port **4207**
- Config: `libs/shared/ui/react/.storybook/`

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors
- To remove an Nx library, use `nx g @nx/workspace:remove --projectName=<name>` — never `rm -rf` + manual edits; the generator handles project.json, workspace graph, and tsconfig.base.json atomically

<!-- nx configuration end-->
