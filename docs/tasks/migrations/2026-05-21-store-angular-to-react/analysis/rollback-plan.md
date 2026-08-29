# Rollback Plan

## Migration Type
Code migration (frontend-only big-bang rewrite). No data migration. No database changes.

## Rollback Method
**Git revert** — the Angular source is preserved in git history.

Since this is a big-bang rewrite on a single app with zero consumers:
1. All Angular source files will be deleted and replaced with React files in commits
2. To roll back: `git revert` the migration commits, or `git checkout <pre-migration-commit> -- cockpit-app/apps/store/`

## No Dual-Run Required
- Zero consumers depend on the store app
- No API contract changes (same backend endpoints)
- Rollback is always available via git

## Pre-Migration Checkpoint
Before starting implementation:
- Ensure git is clean: `git stash` any uncommitted changes
- Tag the pre-migration commit: `git tag pre-store-migration`
- This tag enables: `git checkout pre-store-migration -- cockpit-app/apps/store/`

## Package.json Rollback
If Angular packages are removed and rollback is needed:
- The git history preserves the original package.json
- `git checkout pre-store-migration -- cockpit-app/package.json`
- `npm install` (or the workspace's install command) to restore node_modules

## Rollback Trigger Conditions
Roll back if:
- React app fails to build after migration
- CI pipeline fails and issues cannot be fixed within 1 iteration
- Critical auth/permission functionality broken and unfixable

## Notes
- No data at risk (frontend-only rewrite)
- Backend API unchanged
- Other apps (cockpit, login, cv) unaffected
