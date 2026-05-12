## Models

### Clear Naming
Use singular names for models and plural for tables (or follow framework conventions).

### Timestamps
Include created and updated timestamps for auditing and debugging.

### Database Constraints
Enforce data rules at the database level (NOT NULL, UNIQUE, foreign keys).

### Appropriate Types
Choose data types that match purpose and size requirements.

### Index Foreign Keys
Index foreign key columns and frequently queried fields.

### Multi-Layer Validation
Validate at both model and database levels for defense in depth.

### Clear Relationships
Define relationships with appropriate cascade behaviors and naming.

### Practical Normalization
Balance normalization with query performance needs.

## Project ORM Patterns

### `Mapped[]` for All ORM Columns
Every ORM column uses `Mapped[T]` + `mapped_column()`. Never use bare `Column()`. Required for MyPy + SQLAlchemy plugin.

```python
# Correct
id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text('uuid_generate_v4()'), init=False)
email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)

# Wrong
id = Column(PG_UUID(as_uuid=True), primary_key=True)
```

### UUID Primary Keys with uuid_generate_v4()
All models use UUID primary keys. Source: `cockpit-api/docs/ARCHITECTURE.md`.

### TimestampMixin for All Models
All models inherit from `BaseModel` which provides `created_at` and `updated_at` via `TimestampMixin`. Timestamp columns use `init=False`.

### snake_case for All Python Files, Fixed Service Module Names
Service domains have fixed internal filenames: `router.py`, `service.py`, `repository.py`, `schemas.py`, `models.py`, `dependencies.py`. 100% snake_case confirmed across all Python files.
