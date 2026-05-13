# Scope Clarifications

## Decision: Migration scope

**Chosen**: Migrate all + global CI gate
- Strip ^ and ~ from all 112 violations across 5 files
- Regenerate lockfile with `npm install --package-lock-only`
- Add CI gate that checks all cockpit-app package.json files on every run
- Full enforcement from day one

## Defaults applied

- Lockfile integrity check: run `npm install --package-lock-only`, diff before committing
- Library package.json files: included in scope (full enforcement)
- Local npm check script: add `lint:versions` to package.json scripts
