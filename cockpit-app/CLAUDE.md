# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CockpitApp is a multi-application monorepo built with Nx that includes several web applications with a comprehensive type-safe API integration system.

### Deployment

- See .github dir

## Architecture

**For app structure, lib layout, auth flow, state management, build system, or deployment — read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) first.**

## UI Design System

- **Component primitives**: `@cockpit-app/shared-react-ui` — shadcn/ui-style, Radix UI + Tailwind + CVA. See [`libs/shared/ui/react/README.md`](libs/shared/ui/react/README.md) for how to add components.
- **Page-level blocks**: Sourced from [shadcnui-blocks](https://www.shadcnui-blocks.com/blocks) — inspect the preview HTML (use Playwright or devtools), then adapt in app code using primitives from the shared lib.
- **Dark mode**: System preference detected in `index.html` via `prefers-color-scheme`, applied as `.dark` class. All components use CSS variables that swap in `.dark`.
- **Tailwind CSS v4**: CSS-native config in each app's `styles.css` — no `tailwind.config.js`.

## Storybook

- `npx nx run react-ui:storybook` — dev server for `@cockpit-app/shared-react-ui` components
- `npx nx run react-ui:build-storybook` — static build → `dist/storybook/react-ui`
- Deployed as `cockpit-storybook` container on port **4207**
- Config: `libs/shared/ui/react/.storybook/`

## API Integration Pattern

The codebase uses a centralized API types system:

1. OpenAPI specification is fetched from the live API (`https://api.parda.me/openapi.json`)
2. TypeScript interfaces are generated using `openapi-typescript`
3. Generated types to `@cockpit-app/api-types` are used across all applications for type-safe API calls
4. Each app handles API calls through their respective data access patterns (React Query for React, custom services for Vue)

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
