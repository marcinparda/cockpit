# Implementation Plan: Enforce Locked/Exact Package Versions

## Overview
Total Steps: 14
Task Groups: 3
Expected Tests: 8-16

## Implementation Steps

### Task Group 1: Prevention Layer (.npmrc)
**Dependencies:** None
**Estimated Steps:** 4

- [x] 1.0 Complete prevention layer
  - [x] 1.1 Write 2 focused tests for .npmrc enforcement
    - Test: `cat cockpit-app/.npmrc` contains `save-exact=true`
    - Test: `npm config get save-exact --prefix cockpit-app` returns `true`
  - [x] 1.2 Create `cockpit-app/.npmrc` with content `save-exact=true`
    - Single line, no trailing whitespace, final newline present
    - Applies only to `cockpit-app/` directory tree; does not affect `cockpit-api/`
  - [x] 1.3 Ensure prevention layer tests pass
    - Run only the 2 tests written in 1.1
    - Confirm `.npmrc` is readable and contains the expected setting

**Acceptance Criteria:**
- `cockpit-app/.npmrc` exists and contains `save-exact=true`
- The 2 tests pass

---

### Task Group 2: Remediation Layer (Migration of 112 violations)
**Dependencies:** Group 1
**Estimated Steps:** 8

- [x] 2.0 Complete remediation layer
  - [x] 2.1 Write 4 focused tests for post-migration state
    - Test: `grep -cE '": "[\^~]' cockpit-app/package.json` returns `0`
    - Test: `grep -cE '": "[\^~]' cockpit-app/libs/shared/utils/package.json` returns `0`
    - Test: `grep -cE '": "[\^~]' cockpit-app/libs/shared/types/api-types/package.json` returns `0`
    - Test: `grep -cE '": "[\^~]' cockpit-app/libs/shared/data-access/react/package.json cockpit-app/libs/shared/data-access/common/package.json` returns `0`
  - [x] 2.2 Edit `cockpit-app/package.json` — strip 105 violations (92 `^`, 13 `~`) + update to resolved versions
    - Replace every `"^X.Y.Z"` → `"X.Y.Z"` and `"~X.Y.Z"` → `"X.Y.Z"` in dependency value positions
    - Updated 53 versions to match lockfile resolved versions (e.g. Angular 19.0.0 → 19.2.14)
  - [x] 2.3 Edit `cockpit-app/libs/shared/utils/package.json` — strip 3 `^` violations (tslib 2.3.0 → 2.8.1)
  - [x] 2.4 Edit `cockpit-app/libs/shared/types/api-types/package.json` — strip 1 `^` violation (tslib 2.3.0 → 2.8.1)
  - [x] 2.5 Edit `cockpit-app/libs/shared/data-access/react/package.json` — strip 2 `^` violations (@tanstack/react-query 5.83.0 → 5.84.1)
  - [x] 2.6 Edit `cockpit-app/libs/shared/data-access/common/package.json` — strip 1 `^` violation (no version change needed)
  - [x] 2.7 Regenerate lockfile: `npm install --package-lock-only --legacy-peer-deps` from `cockpit-app/`
    - Zero `version` or `resolved` field changes confirmed
    - Structural cleanup only (75 deduplicated entries removed, 6 added)
  - [x] 2.8 Ensure remediation tests pass
    - All 4 grep tests: 0 violations each

**Acceptance Criteria:**
- All 4 grep tests return 0 matches
- `npm install --package-lock-only` lockfile diff shows only `specifiers` field changes
- No `resolved` URL or `version` field regressions in lockfile

---

### Task Group 3: Enforcement Layer (CI gate)
**Dependencies:** Groups 1, 2
**Estimated Steps:** 5

- [x] 3.0 Complete enforcement layer
  - [x] 3.1 Write 2 focused tests for CI gate behavior (violation detected + clean state exits 0)
  - [x] 3.2 Read `.github/workflows/app-checks.yml` — `npm ci` step located as `Install dependencies`
  - [x] 3.3 Add `Validate exact package versions` step before `Install dependencies`
    - Uses `find cockpit-app -name package.json -not -path '*/node_modules/*' -not -path '*/dist/*'`
    - working-directory: . (overrides job default of cockpit-app)
    - Reports file:specifier pairs on failure, exits 1
  - [x] 3.4 Verified no false positives (URLs, exact semver, no engines/peerDeps in current files)
  - [x] 3.5 Both enforcement tests pass

**Acceptance Criteria:**
- The 2 tests pass (positive detection + clean-state exit 0)
- CI step is positioned before `npm ci` in `app-checks.yml`
- Step uses `find` not glob for file discovery (per audit finding)
- Step uses `--exclude-dir` flags to avoid node_modules and dist

---

## Execution Order

1. Prevention Layer (.npmrc) — 4 steps
2. Remediation Layer (Migration) — 8 steps, depends on 1
3. Enforcement Layer (CI gate) — 5 steps, depends on 1 and 2

## Standards Compliance

Follow standards from `.maister/docs/standards/`:
- `global/minimal-implementation.md` — no new scripts, ESLint plugins, or pre-commit hooks; CI grep is the minimum viable gate
- `global/conventions.md` — minimal dependencies; CI step uses shell built-ins only
- `global/coding-style.md` — `.npmrc` has no indentation; CI YAML uses 2-space indentation consistent with existing `app-checks.yml`
- `global/formatting.md` — final newline required in `.npmrc`; no trailing whitespace

## Notes

- Test-Driven: Each group starts with 2-4 tests before implementation
- Run Incrementally: Only run the new tests after each group — do NOT run the full test suite between groups
- Mark Progress: Check off steps as completed
- Reuse First: `app-checks.yml` job scaffolding already exists; insert one step only
- Audit Finding: Use `find cockpit-app -name package.json -not -path '*/node_modules/*'` (not glob) per gap analysis
- Audit Finding: Add `--exclude-dir=node_modules --exclude-dir=dist` to any grep commands
- Lockfile Safety: If `npm install --package-lock-only` changes any `resolved` URL or `version` value (not just `specifiers`), stop and investigate before committing
