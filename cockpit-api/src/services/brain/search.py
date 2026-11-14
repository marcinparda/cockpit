import asyncio
import logging
from pathlib import Path

import aiosqlite

logger = logging.getLogger(__name__)

_DB_RELATIVE = ".index/search.db"


def _db_path(notes_path: str) -> str:
    return str(Path(notes_path) / _DB_RELATIVE)


async def init_index(notes_path: str) -> None:
    db = _db_path(notes_path)
    Path(db).parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(db) as conn:
        async with conn.execute("PRAGMA table_info(notes_fts)") as cur:
            cols = [r[1] for r in await cur.fetchall()]
        if cols and "props" not in cols:  # old schema without frontmatter column: rebuilt at startup
            await conn.execute("DROP TABLE notes_fts")
        await conn.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
                path UNINDEXED,
                title,
                body,
                tags,
                type UNINDEXED,
                props
            )
        """)
        await conn.commit()


async def rebuild_index(notes_path: str, notes: list[dict]) -> None:
    db = _db_path(notes_path)
    async with aiosqlite.connect(db) as conn:
        await conn.execute("DELETE FROM notes_fts")
        await conn.executemany(
            "INSERT INTO notes_fts(path, title, body, tags, type, props) VALUES (?, ?, ?, ?, ?, ?)",
            [(n["path"], n["title"], n["body"], " ".join(n["tags"]), n["type"], n.get("props", "")) for n in notes],
        )
        await conn.commit()


async def upsert_note(notes_path: str, note: dict) -> None:
    db = _db_path(notes_path)
    async with aiosqlite.connect(db) as conn:
        await conn.execute("DELETE FROM notes_fts WHERE path = ?", (note["path"],))
        await conn.execute(
            "INSERT INTO notes_fts(path, title, body, tags, type, props) VALUES (?, ?, ?, ?, ?, ?)",
            (note["path"], note["title"], note["body"], " ".join(note["tags"]), note["type"], note.get("props", "")),
        )
        await conn.commit()


async def delete_note(notes_path: str, path: str) -> None:
    db = _db_path(notes_path)
    async with aiosqlite.connect(db) as conn:
        await conn.execute("DELETE FROM notes_fts WHERE path = ?", (path,))
        await conn.commit()


async def search(notes_path: str, query: str, type_filter: str | None, tag_filter: str | None) -> list[dict]:
    db = _db_path(notes_path)
    sql = "SELECT path, title, snippet(notes_fts, 2, '[', ']', '...', 20) as excerpt, tags, type FROM notes_fts WHERE notes_fts MATCH ?"
    params: list = [query]
    if type_filter:
        sql += " AND type = ?"
        params.append(type_filter)
    if tag_filter:
        sql += " AND tags LIKE ?"
        params.append(f"%{tag_filter}%")
    sql += " ORDER BY rank LIMIT 100"
    async with aiosqlite.connect(db) as conn:
        conn.row_factory = aiosqlite.Row
        try:
            async with conn.execute(sql, params) as cursor:
                rows = await cursor.fetchall()
        except aiosqlite.OperationalError:
            # query has FTS syntax characters ([[x]], -, :, quotes): retry as plain quoted terms
            params[0] = " ".join('"' + t.replace('"', '""') + '"' for t in query.split())
            async with conn.execute(sql, params) as cursor:
                rows = await cursor.fetchall()
    return [dict(r) for r in rows]
