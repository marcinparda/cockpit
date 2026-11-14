from src.services.brain.json_types import JsonMap


class BrainError(Exception):
    """Structured brain error: stable `code`, human `message`, machine `details`."""

    code = "error"

    def __init__(self, code: str | None = None, message: str = "", details: JsonMap | None = None):
        if code is not None:
            self.code = code
        self.message = message or self.code
        self.details: JsonMap = details or {}
        super().__init__(self.message)

    def to_dict(self) -> JsonMap:
        """Error as the `{code, message, details}` shape returned by MCP tools and REST."""
        return {"code": self.code, "message": self.message, "details": self.details}


_STATUS = {
    "not_found": 404,
    "already_exists": 409,
    "version_conflict": 409,
    "invalid_path": 400,
}


class NoteNotFound(BrainError, FileNotFoundError):
    """Note path does not exist; also a FileNotFoundError so REST handlers keep working."""

    code = "not_found"

    def __init__(self, path: str):
        BrainError.__init__(self, "not_found", f"Note not found: {path}", {"path": path})


class NoteExists(BrainError, FileExistsError):
    """Note path already taken; also a FileExistsError so REST handlers keep working."""

    code = "already_exists"

    def __init__(self, path: str):
        BrainError.__init__(self, "already_exists", f"Note already exists: {path}", {"path": path})


def http_status_for(exc: BrainError) -> int:
    """HTTP status for a brain error code (422 for codes without a specific mapping)."""
    return _STATUS.get(exc.code, 422)
