"""Vault path safety: every user-supplied path goes through here."""
import os
from pathlib import Path
from typing import Iterator

from src.services.brain.errors import BrainError

TRASH_DIR = ".trash"


def _invalid(path: str, reason: str) -> BrainError:
    """Build the `invalid_path` error for `path` with a human-readable reason."""
    return BrainError("invalid_path", f"Invalid path {path!r}: {reason}", {"path": path, "reason": reason})


def normalize_rel(path: str) -> str:
    """Validate a vault-relative path and return it normalized with forward slashes and `.md` suffix."""
    if not isinstance(path, str) or not path.strip():
        raise _invalid(str(path), "empty path")
    if "\x00" in path:
        raise _invalid(path, "NUL byte")
    p = path.replace("\\", "/")
    if p.startswith("/") or (len(p) > 1 and p[1] == ":"):
        raise _invalid(path, "absolute paths are not allowed")
    parts = [s for s in p.split("/") if s not in ("", ".")]
    if not parts:
        raise _invalid(path, "empty path")
    for seg in parts:
        if seg == "..":
            raise _invalid(path, "'..' traversal is not allowed")
        if seg.startswith("."):
            raise _invalid(path, f"hidden/system folder or file {seg!r} is not allowed (.git, .obsidian, .trash, .index)")
    rel = "/".join(parts)
    if not rel.endswith(".md"):
        rel += ".md"
    return rel


def normalize_folder(folder: str) -> str:
    """Validate a folder prefix. Returns '' for the vault root."""
    f = (folder or "").replace("\\", "/").strip()
    if f.startswith("/") or "\x00" in f:
        raise _invalid(folder, "absolute paths are not allowed")
    parts = [s for s in f.split("/") if s not in ("", ".")]
    for seg in parts:
        if seg == ".." or seg.startswith("."):
            raise _invalid(folder, "traversal or hidden folders are not allowed")
    return "/".join(parts)


def resolve_note(root: str, path: str) -> tuple[Path, str]:
    """Return (absolute file path, normalized rel path); rejects symlink escapes."""
    rel = normalize_rel(path)
    real_root = Path(os.path.realpath(root))
    full = real_root / rel
    real_full = Path(os.path.realpath(full))
    try:
        real_full.relative_to(real_root)
    except ValueError:
        raise _invalid(path, "resolves outside the notes root (symlink escape)")
    return full, rel


def iter_note_files(root: str) -> Iterator[tuple[Path, str]]:
    """Yield (abs path, rel path) of every *.md in the vault; skips dot-dirs and escaping symlinks."""
    real_root = os.path.realpath(root)
    for dirpath, dirnames, filenames in os.walk(root, followlinks=False):
        dirnames[:] = sorted(d for d in dirnames if not d.startswith("."))
        for name in sorted(filenames):
            if not name.endswith(".md") or name.startswith("."):
                continue
            full = os.path.join(dirpath, name)
            if os.path.islink(full):
                target = os.path.realpath(full)
                if not (target == real_root or target.startswith(real_root + os.sep)):
                    continue
            rel = os.path.relpath(full, root).replace(os.sep, "/")
            yield Path(full), rel
