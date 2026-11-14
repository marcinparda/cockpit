from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class NoteMeta(BaseModel):
    path: str
    title: str
    tags: list[str]
    type: str = Field(description="Free-form note type, e.g. note, concept, tool, person, source, hardware, reference, skill, skill-domain, case, context")
    created_at: datetime
    updated_at: datetime
    aliases: list[str]
    created_source: str | None = Field(default=None, description="Where created_at came from: 'frontmatter' or 'file_time'")
    updated_source: str | None = Field(default=None, description="Where updated_at came from: 'frontmatter' or 'file_mtime'")
    version: str | None = Field(default=None, description="Content hash; pass back as if_version to detect concurrent edits")


class Note(NoteMeta):
    body: str
    properties: dict[str, Any] = Field(default_factory=dict, description="All other frontmatter keys (everything except title, tags, type, aliases)")


class NoteCreate(BaseModel):
    title: str
    body: str
    tags: list[str] = []
    type: str = "note"
    aliases: list[str] = []
    properties: dict[str, Any] = {}


class NoteUpdate(BaseModel):
    title: str | None = None
    body: str | None = None
    tags: list[str] | None = None
    type: str | None = None
    aliases: list[str] | None = None
    properties: dict[str, Any] | None = None
    remove_properties: list[str] | None = None
    if_version: str | None = None


class NoteSearchResult(NoteMeta):
    excerpt: str


class FolderTree(BaseModel):
    folders: list[str]


class Edit(BaseModel):
    old: str = Field(description="Exact text to replace; must occur exactly once in the body")
    new: str


class NoteOp(BaseModel):
    """One operation inside brain_batch. Required fields per op:
    create: path,title,body | update: path | patch: path,edits | append: path,heading,text | delete: path.
    update/patch/append also accept properties/remove_properties; all non-create ops accept if_version."""

    op: Literal["create", "update", "patch", "append", "delete"]
    path: str
    title: str | None = None
    body: str | None = None
    type: str | None = None
    tags: list[str] | None = None
    aliases: list[str] | None = None
    properties: dict[str, Any] | None = None
    remove_properties: list[str] | None = None
    edits: list[Edit] | None = None
    heading: str | None = None
    text: str | None = None
    if_version: str | None = None


class PropertyCondition(BaseModel):
    key: str = Field(description="Property name, or a built-in field: path, title, type, tags, aliases, created_at, updated_at")
    op: Literal["eq", "neq", "in", "exists", "missing", "lt", "gt", "contains"] = "eq"
    value: Any = None
