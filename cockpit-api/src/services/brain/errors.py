from typing import Any


class BrainError(Exception):
    """Structured brain error: stable `code`, human `message`, machine `details`."""

    code = "error"
    http_status = 422

    def __init__(self, code: str | None = None, message: str = "", details: dict[str, Any] | None = None):
        if code is not None:
            self.code = code
        self.message = message or self.code
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> dict[str, Any]:
        return {"code": self.code, "message": self.message, "details": self.details}


_STATUS = {
    "not_found": 404,
    "already_exists": 409,
    "version_conflict": 409,
    "invalid_path": 400,
}


class NoteNotFound(BrainError, FileNotFoundError):
    code = "not_found"

    def __init__(self, path: str):
        BrainError.__init__(self, "not_found", f"Note not found: {path}", {"path": path})


class NoteExists(BrainError, FileExistsError):
    code = "already_exists"

    def __init__(self, path: str):
        BrainError.__init__(self, "already_exists", f"Note already exists: {path}", {"path": path})


def http_status_for(exc: BrainError) -> int:
    return _STATUS.get(exc.code, 422)
