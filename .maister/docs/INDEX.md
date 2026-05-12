# Documentation Index

**IMPORTANT**: Read this file at the beginning of any development task to understand available documentation and standards.

## Quick Reference

### Project Documentation
Project-level documentation covering vision, goals, architecture, and technology choices.

### Technical Standards
Coding standards, conventions, and best practices organized by domain: global, frontend, backend, and testing.

---

## Project Documentation

Located in `.maister/docs/project/`

#### Vision (`project/vision.md`)
Self-hosted personal agent platform consolidating task management, finance, notes, CV, and AI workflows into a unified dashboard on a Raspberry Pi. Single-user. Active goals: extend existing apps, improve test coverage, improve observability, stabilize production.

#### Technology Stack (`project/tech-stack.md`)
Full breakdown of language choices (TypeScript 5.8, Python 3.12+), frameworks (React 19, Vue 3.5, Angular 19, FastAPI, SQLModel, Alembic), databases (PostgreSQL, Redis, SQLite), build tools (Nx 21, Vite 6, Poetry, Make), infrastructure (Docker, GitHub Actions, Raspberry Pi), linting/formatting (ESLint 9, Prettier, MyPy), and all key dependency versions.

#### Architecture (`project/architecture.md`)
Modular fullstack monorepo pattern. Backend: FastAPI with strict 3-layer service structure (router → service → repository). Frontend: Nx apps (cockpit/login/React, cv/Vue, store/Angular) with enforced unidirectional lib dependency flow (util → data-access → ui → feature). Type-safe bridge via OpenAPI-generated types. LLM gateway: LiteLLM proxy routes all AI traffic (Claude Code, Kiro, Hermes, Open WebUI) with Langfuse Cloud observability. Deployment: independent Docker containers on Raspberry Pi via GitHub Actions SSH pipeline.

---

## Technical Standards

### Global Standards

Located in `.maister/docs/standards/global/`

#### Coding Style (`standards/global/coding-style.md`)
Naming consistency, automatic formatting, descriptive names, focused functions, uniform indentation, no dead code, DRY principle, no speculative backward compatibility. Project-specific: 2-space indentation (spaces not tabs), UTF-8 encoding, final newline required, no trailing whitespace (except Markdown).

#### Commenting (`standards/global/commenting.md`)
Self-documenting code, sparse comments only for non-obvious logic, no change-log comments in code.

#### Containers and Deployment (`standards/global/containers.md`)
Multi-stage Docker build for Python API (Poetry builder + slim production), nginx:alpine for frontend apps, linux/arm64 target for Raspberry Pi, independent container per app, SPA nginx try_files fallback for client-side routing, nx affected for CI builds.

#### Conventions (`standards/global/conventions.md`)
Predictable file structure, up-to-date documentation, clean version control (conventional commits, feature branches), environment variables for secrets, minimal dependencies, code review process, testing standards before merge, feature flags, changelog maintenance, no speculative code.

#### Error Handling (`standards/global/error-handling.md`)
Clear user-facing messages, fail-fast validation, typed exceptions, centralized error boundaries, graceful degradation, retry with exponential backoff, resource cleanup in finally blocks.

#### Formatting (`standards/global/formatting.md`)
2-space indentation with spaces (not tabs), UTF-8 encoding, final newline required in all files, no trailing whitespace (Markdown files excepted).

#### Minimal Implementation (`standards/global/minimal-implementation.md`)
Build only what is called, delete exploration artifacts, no future stubs or placeholder functions, no speculative abstractions (factories/strategies/adapters), review before commit, treat dead code as debt.

#### Validation (`standards/global/validation.md`)
Server-side validation always required, client-side for UX feedback only, validate early and reject fast, field-specific error messages, allowlists over blocklists, type/format/range checks, input sanitization against injection, business-rule validation at appropriate layer, consistent enforcement across all entry points.

---

### Frontend Standards

Located in `.maister/docs/standards/frontend/`

#### Accessibility (`standards/frontend/accessibility.md`)
Semantic HTML elements, full keyboard navigation with visible focus, 4.5:1 color contrast, alt text and form labels, screen reader verification, ARIA for complex widgets, ordered heading structure, focus management in dynamic content and SPAs.

#### Architecture (`standards/frontend/architecture.md`)
Unidirectional Nx library dependency flow (util → data-access → ui → feature → app) enforced by ESLint @nx/enforce-module-boundaries, required type:* and scope:* tags on all libraries, apps as thin composition entry points, OpenAPI-generated @cockpit-app/api-types, nx run/nx run-many/nx affected over direct tooling, nx generator for library removal, cookie-based auth with credentials: 'include'.

#### Components (`standards/frontend/components.md`)
Single responsibility, reusable and composable design, explicit props with sensible defaults, encapsulation of internals, consistent naming, local state before lifting, minimal prop surface, documented usage. Project patterns: named function declarations with ComponentNameProps interface, TanStack Query for all server state, Zod schema validation on all API responses via fetcher(), endpoint constants as SCREAMING_SNAKE_CASE objects in endpoints.ts.

#### CSS (`standards/frontend/css.md`)
Single consistent methodology (Tailwind/BEM/CSS Modules), use framework patterns as intended, design tokens for colors/spacing/typography, minimize custom CSS, production purging/tree-shaking. Project stack: Vite 6 bundler, plain CSS default style format, Tailwind CSS v4 via @tailwindcss/vite with CSS-native config and CSS custom properties.

#### File Naming (`standards/frontend/file-naming.md`)
PascalCase for React component .tsx files (AppCard.tsx, Button.tsx), camelCase for non-component files (fetcher.ts, baseApi.ts, queryKeys.ts), hooks always prefixed with use (useUser.ts, usePermissions.ts), no kebab-case in .ts/.tsx source files.

#### Formatting (`standards/frontend/formatting.md`)
Single quotes for TypeScript/JavaScript strings, Tailwind CSS classes auto-sorted by prettier-plugin-tailwindcss (never manually order), Vue SFC script/style blocks indented (vueIndentScriptAndStyle: true).

#### Responsive Design (`standards/frontend/responsive.md`)
Mobile-first progressive enhancement, consistent breakpoints (mobile/tablet/desktop), fluid percentage-based layouts, relative units (rem/em), cross-device testing, 44x44px minimum touch targets, mobile-optimized assets, readable typography at all breakpoints, content priority on small screens.

#### TypeScript Configuration (`standards/frontend/typescript.md`)
strict: true plus noImplicitOverride/noImplicitReturns/noPropertyAccessFromIndexSignature/noFallthroughCasesInSwitch, ES2022 target and module format, forceConsistentCasingInFileNames, @cockpit-app/* path aliases for all cross-library imports (never relative paths across boundaries), interface for object shapes and component props, type for unions/aliases/Zod-inferred types.

---

### Backend Standards

Located in `.maister/docs/standards/backend/`

#### API Design (`standards/backend/api.md`)
RESTful resource-based URLs, lowercase hyphenated/underscored naming, URL versioning, plural nouns for resources, max 2-3 levels of nesting, query parameters for filtering/sorting/pagination, correct HTTP status codes, rate-limit response headers. Project patterns: /api/v1/ prefix on all endpoints, fastapi.status constants for status codes, HTTPException raised in service layer only.

#### Architecture (`standards/backend/architecture.md`)
Strict 3-layer structure (router.py → service.py → repository.py) with no cross-layer skipping, import service module not individual functions, require_permission dependency on all business endpoints, Depends() for DB sessions and auth injection, async def for all three layers, new feature workflow (model → Features enum → alembic autogenerate → permissions migration → apply).

#### Database Migrations (`standards/backend/migrations.md`)
Always reversible with rollback, single logical change per migration, zero-downtime awareness, schema and data migrations separated, concurrent index creation on large tables, descriptive migration names, migrations committed and never modified after deployment.

#### Models (`standards/backend/models.md`)
Singular model names / plural table names, created/updated timestamps, database-level constraints (NOT NULL, UNIQUE, FKs), appropriate column types, indexed foreign keys and query columns, validation at model and database layers, clear relationships with cascade behaviors, balanced normalization vs. performance. Project ORM patterns: Mapped[T] + mapped_column() always (never bare Column()), UUID primary keys with uuid_generate_v4(), TimestampMixin via BaseModel, snake_case filenames with fixed service module names.

#### Python Language (`standards/backend/python.md`)
Python 3.12 minimum, full type hints on all function signatures (Optional[T] or T | None), mypy strict_optional with SQLAlchemy plugin, Poetry for dependency management, pydantic-settings BaseSettings for app config with UPPER_SNAKE_CASE fields, Pydantic v2 for schemas and SQLAlchemy BaseModel for ORM (never mix).

#### Database Queries (`standards/backend/queries.md`)
Parameterized queries always (never string interpolation), eager loading to avoid N+1, select only needed columns, strategic indexing for WHERE/JOIN/ORDER BY, transactions for related operations, query timeouts, caching for expensive/frequent queries.

---

### Testing Standards

Located in `.maister/docs/standards/testing/`

#### Test Writing (`standards/testing/test-writing.md`)
Test observable behavior not implementation details, descriptive test names (shouldReturnErrorWhenUserNotFound pattern), mock external dependencies (DBs, APIs, services), fast unit tests (milliseconds), risk-based prioritization, balance coverage with velocity, critical path coverage, edge case depth proportional to risk. Project setup: Vitest with jsdom for React/Vite apps, @vitest/coverage-v8, .spec.ts(x) suffix preferred, describe/it/expect with @testing-library/react co-located with source, pytest asyncio_mode=auto (no explicit markers), Playwright for E2E.

---

## How to Use This Documentation

1. **Start Here**: Always read this INDEX.md first to understand what documentation exists
2. **Project Context**: Read relevant project documentation before starting work
3. **Standards**: Reference appropriate standards when writing code
4. **Keep Updated**: Update documentation when making significant changes
5. **Customize**: Adapt all documentation to your project's specific needs

## Updating Documentation

- Project documentation should be updated when goals, tech stack, or architecture changes
- Technical standards should be updated when team conventions evolve
- Always update INDEX.md when adding, removing, or significantly changing documentation
