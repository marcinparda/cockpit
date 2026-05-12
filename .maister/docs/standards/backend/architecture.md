## Backend Architecture Standards

### Strict 3-Layer Service Structure
Every service domain follows: `router.py` (HTTP/FastAPI decorators) → `service.py` (business logic, raises HTTPException) → `repository.py` (async SQLAlchemy queries). Routers call service only; services call repository only. No cross-layer skipping.

```
users/
├── router.py     # calls service.*
├── service.py    # calls repository.*
├── repository.py # DB queries only
├── models.py
└── schemas.py
```

### Import Service Module, Not Individual Functions
When calling across layers, import the module itself.

```python
# Correct
from src.services.authentication.sessions import service
await service.login_user(...)

# Wrong
from src.services.authentication.sessions.service import login_user
```

### `require_permission` on All Business Endpoints
All business endpoints use the `require_permission` dependency injected into the route handler. Source: `cockpit-api/docs/ARCHITECTURE.md`.

```python
@router.get("/notes")
async def list_notes(
    _: User = Depends(require_permission(Features.BRAIN, Actions.READ))
):
```

### `Depends()` for DB Sessions and Auth
Database sessions and authentication always injected via `Depends()`. Never manually instantiated in endpoint bodies.

```python
async def list_users(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user)
):
```

### `async def` for All Service, Repository, and Router Functions
All three layers are fully async. Private helpers with no I/O may be plain `def`.

### New Feature Database Workflow
(1) Create model, (2) add to `Features` enum, (3) `alembic revision --autogenerate`, (4) add feature-action pairs to permissions migration, (5) apply migration.
