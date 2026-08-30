---
name: cockpit-read-docs
description: Find and read the docs relevant to the current job before acting. Starts at docs/AGENTS.md and drills into the right subfolder's AGENTS.md. Use at the start of any task touching this repo's code or docs.
---

# Read Docs

Purpose: don't guess conventions or facts that are already written down. Read `docs/AGENTS.md` first, then follow its pointers to whichever subfolder actually matches the current job.

## Process

1. Read [`docs/AGENTS.md`](../../../docs/AGENTS.md) — top-level map of `docs/`.
2. Identify which subfolder(s) match the job at hand:
   - Writing/reviewing code, conventions, "how should this be structured" → `docs/standards/AGENTS.md`
   - Facts about a specific app/service (ports, purpose, stack) → `docs/projects/AGENTS.md`
   - `cockpit-api` internals (architecture, MCP server, upstream APIs, dev commands) → `docs/backend/AGENTS.md`
   - Deploying, CI/CD, prod containers, secrets → `docs/deployment/AGENTS.md`
   - Task history / what was done before on a similar task → `docs/tasks/AGENTS.md`
   - Ontology/graph config → `docs/ontology/AGENTS.md`
3. Read that subfolder's `AGENTS.md`, then open the specific file(s) it points to that match the job — don't stop at the index, read the actual content.
4. If nothing in `docs/` covers it, say so explicitly rather than inventing a convention.

Don't read every file in `docs/` — only the ones the job at hand actually touches.
