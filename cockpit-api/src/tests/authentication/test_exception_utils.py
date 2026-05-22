"""Tests for authentication exception handling utilities."""
import pytest
from fastapi import HTTPException

from src.services.authentication.exception_utils import handle_auth_exceptions


class TestHandleAuthExceptions:
    async def test_reraises_http_exception_unchanged(self):
        """HTTPException is re-raised without wrapping."""
        @handle_auth_exceptions("Test")
        async def raises_http():
            raise HTTPException(status_code=404, detail="Not found")

        with pytest.raises(HTTPException) as exc_info:
            await raises_http()

        assert exc_info.value.status_code == 404

    async def test_wraps_unexpected_exception_as_500(self):
        """Non-HTTP exceptions are wrapped as 500 Internal Server Error."""
        @handle_auth_exceptions("MyService")
        async def raises_value_error():
            raise ValueError("Something went wrong internally")

        with pytest.raises(HTTPException) as exc_info:
            await raises_value_error()

        assert exc_info.value.status_code == 500
        assert "MyService" in exc_info.value.detail
