"""Wikilink extraction and Obsidian-style resolution."""
import re
from dataclasses import dataclass
from typing import Any, Iterable

_WIKILINK = re.compile(r"(!?)\[\[([^\[\]\n]+?)\]\]")
_FENCED = re.compile(r"(^|\n)(```|~~~).*?(\n(```|~~~)[^\n]*|\Z)", re.S)
_INLINE_CODE = re.compile(r"`[^`\n]*`")


@dataclass(frozen=True)
class Link:
    target: str
    heading: str | None
    alias: str | None
    embed: bool
    source: str  # "body" | "frontmatter:<key>"

    def to_dict(self) -> dict[str, Any]:
        return {"target": self.target, "heading": self.heading, "alias": self.alias,
                "embed": self.embed, "source": self.source}


def parse_target(inner: str) -> tuple[str, str | None, str | None]:
    """'Note#Heading|alias' → ('Note', 'Heading', 'alias'); block refs (^id) are dropped."""
    alias = None
    if "|" in inner:
        inner, alias = inner.split("|", 1)
        alias = alias.strip() or None
    heading = None
    if "#" in inner:
        inner, heading = inner.split("#", 1)
        heading = heading.strip() or None
        if heading and heading.startswith("^"):
            heading = None
    return inner.strip(), heading, alias


def _scan(text: str, source: str) -> list[Link]:
    out = []
    for m in _WIKILINK.finditer(text):
        target, heading, alias = parse_target(m.group(2))
        if target:
            out.append(Link(target, heading, alias, bool(m.group(1)), source))
    return out


def extract_body_links(body: str) -> list[Link]:
    text = _FENCED.sub(" ", body)
    text = _INLINE_CODE.sub(" ", text)
    return _scan(text, "body")


def extract_property_links(properties: dict[str, Any]) -> list[Link]:
    out: list[Link] = []

    def walk(value: Any, key: str) -> None:
        if isinstance(value, str):
            out.extend(_scan(value, f"frontmatter:{key}"))
        elif isinstance(value, list):
            for v in value:
                walk(v, key)
        elif isinstance(value, dict):
            for v in value.values():
                walk(v, key)

    for k, v in properties.items():
        walk(v, k)
    return out


def _strip_md(name: str) -> str:
    return name[:-3] if name.lower().endswith(".md") else name


@dataclass
class Resolution:
    path: str | None
    resolved_by: str | None
    matches: list[str]

    @property
    def ambiguous(self) -> bool:
        return len(self.matches) > 1


class LinkResolver:
    """records: iterable of (path, title, aliases)."""

    def __init__(self, records: Iterable[tuple[str, str, list[str]]]):
        self._paths: list[str] = []
        self._by_alias: dict[str, list[str]] = {}
        self._by_title: dict[str, list[str]] = {}
        for path, title, aliases in records:
            self._paths.append(path)
            for a in aliases:
                self._by_alias.setdefault(str(a).lower(), []).append(path)
            if title:
                self._by_title.setdefault(title.lower(), []).append(path)
        self._lower = {p: _strip_md(p).lower() for p in self._paths}
        self._by_base: dict[str, list[str]] = {}
        for p, low in self._lower.items():
            self._by_base.setdefault(low.rsplit("/", 1)[-1], []).append(p)

    @staticmethod
    def _rank(paths: list[str], from_path: str | None) -> list[str]:
        folder = from_path.rsplit("/", 1)[0] if from_path and "/" in from_path else ""

        def key(p: str) -> tuple:
            p_folder = p.rsplit("/", 1)[0] if "/" in p else ""
            return (0 if p_folder == folder else 1, p.count("/"), p.lower())

        return sorted(paths, key=key)

    def resolve(self, raw: str, from_path: str | None = None) -> Resolution:
        stripped = raw.strip().removeprefix("!").removeprefix("[[").removesuffix("]]")
        name, _, _ = parse_target(stripped)
        name =_strip_md(name.replace("\\", "/").strip("/")).lower()
        if not name:
            return Resolution(None, None, [])
        if "/" in name:
            hits = [p for p, low in self._lower.items() if low == name or low.endswith("/" + name)]
            by = "path"
        else:
            hits = list(self._by_base.get(name, []))
            by = "basename"
        if not hits:
            hits, by = list(self._by_alias.get(name, [])), "alias"
        if not hits:
            hits, by = list(self._by_title.get(name, [])), "title"
        if not hits:
            return Resolution(None, None, [])
        ranked = self._rank(hits, from_path)
        return Resolution(ranked[0], by, ranked)
