## Python Language Standards

### Python 3.12 Minimum
`requires-python = >=3.12`. Source: `pyproject.toml`, `Dockerfile`.

### Full Type Hints on All Function Signatures
All parameters and return types annotated. Use `Optional[T]` (legacy) or `T | None` (3.10+ style) — both coexist but type hints are universal.

```python
async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
async def list_notes(path: str, filter: str | None) -> list[NoteMeta]:
```

### MyPy Strict Optional
`strict_optional = true`, `warn_unused_ignores`, `warn_redundant_casts`, `warn_unreachable`, `show_error_codes`. SQLAlchemy plugin required: `sqlalchemy.ext.mypy.plugin`. Source: `pyproject.toml [tool.mypy]`.

### Poetry for Dependency Management
Dependencies managed with Poetry (`pyproject.toml` + `poetry.lock`). Source: `pyproject.toml`, `Dockerfile`.

### `pydantic-settings BaseSettings` for App Config
Application config uses `pydantic_settings.BaseSettings` with `UPPER_SNAKE_CASE` field names. Module-level `settings` singleton exported for import throughout.

```python
class Settings(BaseSettings):
    POSTGRES_USER: str
    JWT_SECRET_KEY: str = '...'
settings = Settings(POSTGRES_USER=os.getenv('DB_USER'), ...)
```

### Pydantic v2 for Schemas, SQLAlchemy BaseModel for ORM
`schemas.py` files use `pydantic.BaseModel` with v2 patterns (`model_config`, `@field_validator` + `@classmethod`, `model_validate`). ORM models inherit from `src.common.models.BaseModel`. Never mix the two.

```python
class UserCreate(UserBase):  # pydantic
    @field_validator('password')
    @classmethod
    def validate_password(cls, v): ...

class User(BaseModel):  # src.common.models.BaseModel (SQLAlchemy)
    ...
SimpleUserResponse.model_validate(user, from_attributes=True)
```
