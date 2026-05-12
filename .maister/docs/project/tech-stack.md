# Technology Stack

## Overview
This document describes the technology choices and rationale for Cockpit — a personal agent platform monorepo combining a Python/FastAPI backend with a multi-framework Nx frontend.

## Languages

### TypeScript / JavaScript (5.8 / ES2024)
- **Usage**: ~65% of codebase
- **Rationale**: Type-safe frontend across React, Vue, and Angular apps; shared API types generated from OpenAPI spec ensure frontend-backend consistency
- **Key Features Used**: Strict mode, path aliases, decorators (Angular), template literals, async/await

### Python (3.12+)
- **Usage**: ~35% of codebase
- **Rationale**: FastAPI's async-first model fits IO-heavy integrations (Vikunja, Actual Budget, Redis, MCP); strong typing via MyPy + Pydantic
- **Key Features Used**: async/await, type hints, dataclasses, context managers, decorators

## Frameworks

### Frontend
- **React 19** — Main cockpit dashboard and login app. Latest concurrent features.
- **Vue 3.5** — CV/portfolio app. Composition API with Pinia state management.
- **Angular 19** — Store app. Component-based with standalone components.
- **Nx 21** — Monorepo orchestrator. Enforces module boundaries, manages build caching, runs affected targets.

### Backend
- **FastAPI 0.110+** — REST API + MCP server. Async-first, OpenAPI auto-generation, dependency injection.
- **SQLModel** — ORM combining SQLAlchemy + Pydantic. Type-safe DB models that double as API schemas.
- **Alembic 1.15+** — Database migrations.
- **APScheduler 3.11** — Background task scheduling (sync jobs, periodic data refresh).

### Testing
- **pytest 8.4+ / pytest-asyncio** — Backend unit and integration tests
- **Vitest 3** — Frontend unit tests (Vite-native, fast)
- **Jest** — Secondary frontend test runner (legacy config present)
- **Playwright** — E2E browser testing
- **React Testing Library** — Component testing for React apps

## Database

### PostgreSQL (primary)
- **Type**: Relational
- **ORM/Client**: SQLModel (SQLAlchemy core)
- **Rationale**: Reliable, full-featured relational DB; suits structured data (users, tasks, transactions)

### Redis 5.0+
- **Type**: In-memory key-value
- **Client**: redis-py async
- **Rationale**: Session caching, rate limiting, ephemeral state

### SQLite (local/async)
- **Type**: Embedded relational
- **Usage**: Local async operations, Actual Budget integration

## Build Tools & Package Management

| Tool | Scope | Purpose |
|------|-------|---------|
| **npm** | Frontend | Package management, script runner |
| **Poetry** | Backend | Python dependency management with lock file |
| **Vite 6** | Frontend | Primary bundler (all apps except Angular) |
| **Nx 21** | Frontend | Build orchestration, caching, affected detection |
| **Make** | Root | Unified task runner delegating to both sub-projects |

## Infrastructure

### Containerization
- **Docker** — Each app and the API deployed as separate containers
- **Docker Compose** — Dev (`docker-compose.yml`) and prod (`docker-compose.prod.yml`) configurations

### CI/CD
- **GitHub Actions** — Separate workflows for API and App:
  - `api-checks.yml` / `app-checks.yml` — lint, typecheck, test on PR
  - `api-deploy.yml` / `app-deploy.yml` — build & push Docker images to `ghcr.io`
  - `*-deploy-to-production.yml` — SSH deploy to Raspberry Pi
  - `app-validate-types.yml` + scheduled type check — OpenAPI type sync validation

### Hosting
- **Raspberry Pi** — Self-hosted production target. Docker containers managed via SSH deployment scripts.
- **ghcr.io** — Container registry for Docker images

### LLM Gateway & Observability
- **LiteLLM** — Unified LLM proxy. Routes Claude Code/Kiro (Pro subscription OAuth passthrough) and OpenRouter traffic. Config-file only (no DB).
- **Langfuse Cloud** — LLM observability. Receives traces from LiteLLM for cost tracking, latency analysis, and request logging. Free tier (50k observations/month).

## Development Tools

### Linting & Formatting
- **ESLint 9** (flat config) — Frontend linting with Nx module boundary enforcement
- **Prettier 3.6** — Code formatting with Tailwind CSS plugin (2-space indent, single quotes)
- **MyPy** — Python static type checking (strict mode)

### Type Checking
- **TypeScript** strict mode throughout all frontend apps
- **MyPy** strict on backend
- **OpenAPI type generation** — `make app-update-types` syncs TypeScript types from live API spec

## Key Dependencies

### Frontend
| Package | Version | Role |
|---------|---------|------|
| react | 19 | UI framework |
| vue | 3.5 | UI framework |
| @angular/core | 19 | UI framework |
| @tanstack/react-query | 5.83 | Server state management |
| pinia | 3 | Vue state management |
| tailwindcss | 4.1 | Utility CSS |
| @radix-ui/* | latest | Accessible UI primitives |
| @dnd-kit/core | latest | Drag-and-drop |
| lucide-react | latest | Icons |
| primevue / primeng | latest | Component libraries |

### Backend
| Package | Version | Role |
|---------|---------|------|
| fastapi | 0.110+ | Web framework |
| sqlmodel | latest | ORM |
| alembic | 1.15+ | DB migrations |
| python-jose | latest | JWT auth |
| bcrypt | latest | Password hashing |
| redis | 5.0+ | Cache client |
| mcp | 1.9+ | Model Context Protocol server |
| apscheduler | 3.11 | Background scheduling |
| openai | latest | AI/LLM integration |
| httpx | latest | Async HTTP client |

## Version Management
- Frontend: `package.json` with `package-lock.json` (npm lockfile)
- Backend: `pyproject.toml` with `poetry.lock`
- Node version: 20+ (specified in CI)
- Python version: 3.12+ (specified in pyproject.toml)

---
*Last Updated*: 2026-05-12
*Auto-detected*: All tech stack entries, versions, directory structure, CI/CD config
*User-provided*: Project description, primary goals
