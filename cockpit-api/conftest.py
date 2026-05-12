"""Root conftest — sets env vars before any module import during collection."""
import os

os.environ.setdefault("DB_USER", "test")
os.environ.setdefault("DB_PASSWORD", "test")
os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_NAME", "test_db")
os.environ.setdefault("DB_PORT", "5432")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-testing-only-minimum-length")
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("BCRYPT_ROUNDS", "4")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")
os.environ.setdefault("MCP_API_KEY", "test-mcp-key")
