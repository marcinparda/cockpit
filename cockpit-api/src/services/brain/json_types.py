"""Recursive JSON-shaped value types shared by the brain modules (frontmatter values, error details, payloads)."""
from collections.abc import Iterable
from typing import Any

type JsonValue = str | int | float | bool | None | list[JsonValue] | dict[str, JsonValue]
type JsonMap = dict[str, JsonValue]

# Any, not JsonValue: pydantic renders the recursive JsonValue alias as $defs/$ref inside every MCP/REST schema,
# which some MCP clients handle poorly. Use JsonPayload only in pydantic models and tool signatures exposed over MCP/REST;
# internal code uses JsonValue/JsonMap.
JsonPayload = Any


def as_json_list(items: Iterable[JsonValue]) -> list[JsonValue]:
    """Copy items into a `list[JsonValue]` (a plain `list[str]` is not accepted where JsonValue is expected: lists are invariant)."""
    return list(items)
