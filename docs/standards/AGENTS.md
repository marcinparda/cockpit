# Documentation Index

**IMPORTANT**: Read this file at the beginning of any development task to understand available documentation and standards. This is a pointer index only — content lives in each linked file, not here. See [`../CONTRIBUTING.md`](../CONTRIBUTING.md) for where new docs belong.

## Project Documentation

Located in [`docs/projects/`](../projects/). `cockpit/` covers the whole monorepo + main app (vision, tech stack, architecture). Every other app/service has its own sibling folder: in-monorepo apps `cv/`, `habits/`, `login/`, `store/`; external services `litellm/`, `actual/`, `vikunja/`.

## Technical Standards

### Global (`docs/standards/global/`)

- [`coding-style.md`](global/coding-style.md)
- [`commenting.md`](global/commenting.md)
- [`containers.md`](global/containers.md)
- [`conventions.md`](global/conventions.md)
- [`error-handling.md`](global/error-handling.md)
- [`formatting.md`](global/formatting.md)
- [`minimal-implementation.md`](global/minimal-implementation.md)
- [`validation.md`](global/validation.md)

### Frontend (`docs/standards/frontend/`)

- [`accessibility.md`](frontend/accessibility.md)
- [`architecture.md`](frontend/architecture.md)
- [`components.md`](frontend/components.md)
- [`css.md`](frontend/css.md)
- [`file-naming.md`](frontend/file-naming.md)
- [`formatting.md`](frontend/formatting.md)
- [`responsive.md`](frontend/responsive.md)
- [`typescript.md`](frontend/typescript.md)

### Backend (`docs/standards/backend/`)

- [`api.md`](backend/api.md)
- [`architecture.md`](backend/architecture.md)
- [`migrations.md`](backend/migrations.md)
- [`models.md`](backend/models.md)
- [`operations.md`](backend/operations.md)
- [`python.md`](backend/python.md)
- [`queries.md`](backend/queries.md)

### Testing (`docs/standards/testing/`)

- [`test-writing.md`](testing/test-writing.md)

## Updating Documentation

- Add/remove a file here whenever a standards file is added, removed, or renamed — this list must stay accurate.
- Don't restate a file's content here; link to it. If you find yourself summarizing, delete the summary.
- New patterns discovered during implementation go directly into the relevant standards file, or into the task's `work-log.md` for later promotion.
