# Architecture

> If you need info about overall architecture, DB design, permissions, or import conventions — read this file.

## Overall Architecture

**Modular monolith** — single deployable unit, code split into independent service modules under `src/services/`.

**Layered architecture per service** — each service module follows a strict 3-layer structure:

| File | Layer | Responsibility |
|------|-------|---------------|
| `router.py` | Transport | FastAPI routes, request/response parsing, HTTP status codes, dependency injection |
| `service.py` | Business logic | Orchestrates use cases, calls repository, enforces business rules |
| `repository.py` | Data access | Raw DB queries via SQLAlchemy, no business logic |

Supporting files per service: `models.py` (ORM), `schemas.py` (Pydantic), `__init__.py`.

**Rule:** routers call service functions only; service functions call repository functions only. No cross-layer skipping.

Example service layout (`src/services/users/`):
```
users/
├── router.py      # GET/POST /users — calls service.*
├── service.py     # onboard_new_user, get_user_by_id, ... — calls repository.*
├── repository.py  # DB queries
├── models.py      # User ORM model
└── schemas.py     # UserCreate, UserSchema, ...
```

## Service Exceptions

Some services intentionally deviate from the standard 3-layer structure:

| Service | Deviation | Reason |
|---------|-----------|--------|
| `brain/` | No `repository.py`, no `models.py`. Has `search.py` instead. | File-based storage (markdown files), no DB entities. |
| `vikunja/` | No `service.py`, no `repository.py`, no `models.py`. Has `client.py` instead. | External API proxy only — all data lives in Vikunja, not local DB. |
| `health/` | No `repository.py`, no `models.py`. | Health checks only, no DB entities. |
| `mcp/` | Flat `tools/` and `resources/` structure, no layers. | MCP protocol wrapper — calls other services' modules directly. |
| `redis_store/` | No `models.py`. Has `repository.py` + `service.py` (Redis, not SQLAlchemy). | Redis-backed store, no ORM entities. |
| `authentication/` | Top-level aggregator module with sub-modules (`sessions/`, `tokens/`, `passwords/`). Each sub-module follows the 3-layer structure. | Split to keep auth concerns separate. |

## Database Design

- **Primary Keys**: All models use UUID primary keys with PostgreSQL's `uuid_generate_v4()`
- **Timestamps**: All models inherit from `BaseModel` which provides `created_at` and `updated_at` fields
- **Relationships**: Proper SQLAlchemy relationships with cascade delete where appropriate
- **Async Operations**: Fully async database operations using SQLAlchemy's async engine
- **Use Mapped for models**: SQLAlchemy's `Mapped` generic type for type-safe ORM models

## Database Changes

When adding new features:

1. Create the database model in the appropriate service submodule (e.g., `src/services/agent/models.py`)
2. Add the feature to `Features` enum in `src/services/authorization/permissions/enums.py`
3. Create migration: `alembic revision --autogenerate -m "add_new_feature"`
4. Update permissions by adding feature-action pairs to the permissions migration
5. Apply migration: `alembic upgrade head`

## Permission-Protected Endpoints

All business endpoints should use permission checks via the `require_permission` dependency. Example usage:

```python
from src.services.authorization.permissions.dependencies import require_permission
from src.services.authorization.permissions.enums import Actions, Features

@router.get("/protected-endpoint")
async def protected_endpoint(
    current_user: User = Depends(require_permission(Features.AGENT, Actions.READ))
):
    # Endpoint logic here
```

## Imports

When importing service/repository modules:

- Correct: `from src.services.authentication.sessions import service`
- Incorrect: `from src.services.authentication.sessions.service import login_user`
