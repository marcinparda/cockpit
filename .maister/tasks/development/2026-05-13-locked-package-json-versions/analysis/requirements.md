# Requirements

## Initial Description

Enforce rule to keep only locked/exact versions in package.json (no *, ^ etc)

## Q&A

**Q: Scope — cockpit-app only?**
A: Yes, cockpit-app only. cockpit-api uses Poetry, no package.json.

**Q: CI workflow target?**
A: app-checks.yml — already runs on every PR.

**Q: Local script?**
A: Skip — CI only. No local npm script needed.

**Q: Existing code to reuse?**
A: No — start fresh.

## Functional Requirements

1. Create `cockpit-app/.npmrc` with `save-exact=true` — prevents npm from writing `^`/`~` on future installs
2. Strip `^` and `~` from all 112 non-exact specifiers across 5 package.json files:
   - cockpit-app/package.json (105 violations)
   - cockpit-app/libs/shared/utils/package.json (3)
   - cockpit-app/libs/shared/types/api-types/package.json (1)
   - cockpit-app/libs/shared/data-access/react/package.json (2)
   - cockpit-app/libs/shared/data-access/common/package.json (1)
3. Regenerate lockfile: `npm install --package-lock-only` in cockpit-app/
4. Add CI validation step to `.github/workflows/app-checks.yml` that:
   - Greps all cockpit-app package.json files for `^`, `~`, `>=`, `<=`, `>`, `<`, `*` version prefixes
   - Fails with clear error message listing violations
   - Runs before or alongside existing lint/build steps

## Out of Scope

- No local npm script
- No cockpit-api changes
- No ESLint plugin (CI grep is sufficient)
- No pre-commit hooks (no Husky)

## Technical Considerations

- After stripping specifiers, lockfile must be diffed to confirm zero resolved-version drift
- CI grep must avoid false positives (e.g., version ranges in `engines` or `peerDependencies` fields may be intentional — confirm whether peerDependencies should also be locked)
- `.npmrc` affects all npm operations in cockpit-app/ directory
