# System Architecture

## Overview
Cockpit is a fullstack monorepo: a Python/FastAPI backend and an Nx-managed multi-framework frontend, both deployed as separate Docker containers on a Raspberry Pi. The backend exposes a REST API and MCP server; the frontend consists of independent apps each serving a distinct purpose.

## Architecture Pattern
**Pattern**: Modular fullstack monorepo with layered backend services and scope-isolated frontend apps

The backend follows a strict 3-layer pattern per service. The frontend enforces unidirectional dependency flow across library types via Nx module boundaries.

## System Structure

### Backend — `cockpit-api/`
- **Location**: `cockpit-api/src/`
- **Purpose**: FastAPI REST API, MCP server, integrations with external services
- **Layer Pattern** (per service):
  ```
  router.py  →  service.py  →  repository.py
  (HTTP)        (business)      (DB queries)
  ```
- **Services**: `auth`, `brain`, `vikunja`, `oauth`, `redis`, `mcp`, `health`, `users`, `authorization`
- **Core Modules**: `core/config.py`, `core/database.py`, `core/scheduler.py`, `core/logging.py`
- **Common**: `common/models/` (shared Pydantic schemas), `common/middleware/` (JWT, rate limiting)
- **Key Files**: `src/main.py` (app entry), `alembic/` (migrations), `pyproject.toml`

### Frontend — `cockpit-app/`
- **Location**: `cockpit-app/apps/` and `cockpit-app/libs/`
- **Purpose**: Nx monorepo with 4 independent web apps sharing common libraries
- **Apps**:
  - `apps/cockpit/` — React 19: main dashboard (tasks, budget, notes, agent)
  - `apps/login/` — React 19: authentication flow
  - `apps/cv/` — Vue 3.5: CV/portfolio site
  - `apps/store/` — Angular 19: commerce/content app
- **Lib Layer Hierarchy** (strict, enforced by ESLint):
  ```
  util  →  data-access  →  ui  →  feature
  ```
- **Shared Libraries** (`libs/shared/`):
  - `types/` — `@cockpit-app/api-types`: OpenAPI-generated TypeScript types
  - `data-access/` — React Query hooks, API service clients
  - `ui/` — Shared React component library
  - `feature/` — Shared feature modules
  - `utils/` — Pure utility functions
- **Cockpit-specific** (`libs/cockpit/`): Dashboard-specific UI components

### Deployment — `deployment-scripts/`
- **Location**: `deployment-scripts/`, `.github/workflows/`
- **Purpose**: CI/CD pipelines and SSH deployment scripts to Raspberry Pi
- **Key Files**: `*-deploy.yml` (build + push), `*-deploy-to-production.yml` (SSH pull + restart)

## Data Flow

```
Browser App
    │
    ▼
cockpit-app (React/Vue/Angular)
    │  HTTP REST (JWT)
    ▼
cockpit-api (FastAPI)
    ├── PostgreSQL (primary data: users, tasks, notes)
    ├── Redis (sessions, cache, rate limits)
    └── External APIs:
        ├── Vikunja (task management)
        ├── Actual Budget (finance)
        └── LiteLLM proxy → OpenRouter (AI/LLM features)

Claude Code / Kiro (dev tools)
    │  OAuth passthrough
    ▼
LiteLLM proxy (port 4000)
    ├── Anthropic API (Claude models)
    ├── OpenRouter (other models)
    └── Langfuse Cloud (observability)
```

**Type Safety Bridge**: API → OpenAPI spec → `make app-update-types` → `@cockpit-app/api-types` → all frontend apps

## External Integrations
| Service | Protocol | Purpose |
|---------|----------|---------|
| Vikunja | REST API | Task management |
| Actual Budget | SQLite/HTTP | Personal finance |
| LiteLLM | REST API (proxy) | Unified LLM gateway (routes to Anthropic/OpenRouter) |
| Langfuse Cloud | REST API | LLM observability, tracing, cost tracking |
| OpenRouter | REST API | Multi-model LLM provider (via LiteLLM) |
| Redis | TCP | Caching, sessions, rate limiting |
| MCP Server | stdio/HTTP | Model Context Protocol (AI tooling) |

## Database Schema
- Managed via Alembic migrations in `cockpit-api/alembic/`
- Models defined with SQLModel in `cockpit-api/src/services/*/` (co-located with service)
- All DB columns use `Mapped[]` type annotations (enforced convention)

## Configuration
- Backend: `.env` file loaded via `pydantic-settings` in `core/config.py`
- Frontend: Vite env vars (`VITE_*`) per app
- Secrets: GitHub Actions secrets for CI/CD (documented in `docs/deployment/GITHUB_SECRETS.md`)
- Docker: Environment variables injected at container runtime

## Deployment Architecture

```
GitHub Actions
    │
    ├── PR: lint + typecheck + test
    ├── Merge to main: build Docker image → push to ghcr.io
    ├── Manual trigger: SSH to Raspberry Pi → docker pull + restart
    └── Weekly cron: SSH to Pi → backup all DBs + data to ~/backups/
```

- Each app is an independent Docker container
- Docker Compose manages container orchestration on Raspberry Pi
- Data persisted via Docker volumes (PostgreSQL data, Actual Budget files)
- Reverse proxy (Nginx or Traefik) assumed at Raspberry Pi for routing

---
*Based on codebase analysis performed 2026-05-12*
