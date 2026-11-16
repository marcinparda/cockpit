# The Vault is plain Markdown files; the API never syncs or commits

The Brain reads and writes Markdown files in the Obsidian Vault (`BRAIN_NOTES_PATH`) directly. There is no notes table in Postgres, and the API performs no git commit, push or pull; syncing happens outside the app.

## Considered options

- **Notes in Postgres**: easier querying and concurrency. Rejected because the Vault must stay a normal Obsidian vault the owner edits by hand, and a database copy would drift from it.
- **API-managed git sync**: gives history and conflict handling. Rejected as extra failure modes on a Raspberry Pi; sync is handled outside the app.

## Consequences

- Writes go through one batch path with in-memory validation, on-disk change re-check, temp-file plus atomic replace, and rollback. Concurrency uses a content-hash `version`.
- Frontmatter is edited losslessly; only changed top-level keys are rewritten.
- Search is a derived index (`.index/search.db`) inside the Vault, not a source of truth.
- Deletes move files to `.trash/`.
