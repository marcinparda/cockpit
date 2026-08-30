# MCP Server

> If you need info about adding MCP tools or resources — read this file.

MCP server mounted at `/mcp` (Streamable HTTP). Auth: `Authorization: Bearer <MCP_API_KEY>`.

Tools registered in `src/services/mcp/tools/`: `budget`, `tasks`, `cv`, `brain`.
Resources registered in `src/services/mcp/resources/`: `brain`.

When adding MCP tools: add a `register_*_tools(mcp)` call in `src/services/mcp/server.py`.

## Brain note type → MCP exposure

| type | MCP exposure |
|---|---|
| `context` | Resource (proactive) + Tool |
| `reference` | Resource + Tool |
| `note` | Tool only (reactive search) |
