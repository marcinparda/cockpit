## API Design

### RESTful Principles
Use resource-based URLs with appropriate HTTP methods (GET, POST, PUT, PATCH, DELETE).

### Consistent Naming
Use lowercase, hyphenated or underscored names consistently across endpoints.

### Versioning
Implement versioning (URL path or headers) to manage breaking changes.

### Plural Nouns
Use plural nouns for resources (`/users`, `/products`).

### Limited Nesting
Keep URL nesting to 2-3 levels maximum for readability.

### Query Parameters
Use query parameters for filtering, sorting, and pagination.

### Proper Status Codes
Return appropriate HTTP status codes (200, 201, 400, 404, 500).

### Rate Limit Headers
Include rate limit information in response headers.

## Project API Patterns

### `/api/v1/` URL Prefix on All Endpoints
All REST endpoints prefixed `/api/v1/`. Registered centrally in `main.py` via `include_router()`. Observed: `/api/v1/users`, `/api/v1/authentication`, `/api/v1/brain`, `/api/v1/authorization`.

### `fastapi.status` Constants for HTTP Status Codes
Use `status.HTTP_201_CREATED`, `status.HTTP_204_NO_CONTENT` etc. instead of raw integers.

```python
@router.post('/', status_code=status.HTTP_201_CREATED)
```

### `HTTPException` in Service Layer
Service functions raise `fastapi.HTTPException` directly. No custom exception subclasses. Repository returns `None` for not-found; service checks and raises.

```python
if not user:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
```
