# Gap Analysis: Enforce Locked/Exact Package Versions

**Risk Level**: Low-Medium
**Estimated Effort**: Low

## Task Characteristics

- has_reproducible_defect: false
- modifies_existing_code: true
- creates_new_entities: true (.npmrc, CI validation step)
- involves_data_operations: false
- ui_heavy: false

## Gaps

### Gap 1 — .npmrc save-exact=true (absent)
`cockpit-app/.npmrc` does not exist. Every `npm install <pkg>` writes `^x.y.z` by default.

### Gap 2 — 112 existing non-exact specifiers

| File | ^ | ~ | Total |
|------|---|---|-------|
| cockpit-app/package.json | 92 | 13 | 105 |
| libs/shared/utils/package.json | 3 | 0 | 3 |
| libs/shared/types/api-types/package.json | 1 | 0 | 1 |
| libs/shared/data-access/react/package.json | 2 | 0 | 2 |
| libs/shared/data-access/common/package.json | 1 | 0 | 1 |

**Total: 112 violations across 5 files.**

### Gap 3 — No CI gate
`app-checks.yml` has no step validating version specifier format.

## Decisions Needed

### Critical

**1. Migrate existing violations or enforce-forward-only?**
- Option A: Migrate all 112 + add global CI gate (recommended)
- Option B: CI gate on changed files only (git diff); leave existing as-is
- Option C: Global CI gate with temporary allowlist

### Important

**2. Lockfile integrity after migration**
- Option A (default): Run `npm install --package-lock-only`, diff lockfile before committing

**3. Library package.json scope**
- Option A (default): Include lib files in migration + CI gate (full enforcement)
- Option B: Exclude lib files

**4. Add local npm check script**
- Option A (default): Add `"lint:versions"` script to package.json
- Option B: CI gate only
