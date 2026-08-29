# Codebase Analysis Report

**Date**: 2026-05-13
**Task**: Enforce rule to keep only locked/exact versions in package.json (no ^, ~, *, or ranges)

---

## Summary

Zero enforcement currently exists for version specifier strictness. 82% of dependencies across the main package.json use non-exact specifiers (71% caret, 10% tilde), with no .npmrc, no ESLint plugin, no CI validation, and no pre-commit hooks in place. The task requires introducing enforcement at one or more layers to prevent new non-exact versions from being added and optionally migrating existing ones.

---

## Files Identified

### Primary Files

**cockpit-app/package.json** (~129 deps)
- Main Nx workspace package.json with 92 caret (^), 13 tilde (~), 24 exact specifiers
- The primary file to remediate and protect

**cockpit-app/libs/cockpit/ui/package.json**
**cockpit-app/libs/shared/data-access/common/package.json**
**cockpit-app/libs/shared/data-access/react/package.json**
**cockpit-app/libs/shared/feature/react/package.json**
**cockpit-app/libs/shared/types/api-types/package.json**
**cockpit-app/libs/shared/ui/react/package.json**
**cockpit-app/libs/shared/utils/package.json**
- Library-level package.json files; use caret on external deps, exact (0.0.1) for internal monorepo refs

### Related Files

**cockpit-app/.npmrc** — absent; adding `save-exact=true` prevents npm from writing caret prefixes on future installs

**cockpit-app/package-lock.json** — lockfileVersion 3; used via `npm ci` in CI; pins resolved versions but not authoring-time specifiers

**.github/workflows/app-checks.yml**, **app-deploy-all.yml** — use `npm ci`; no version-specifier validation

---

## Current State

No enforcement layer exists. Any developer running `npm install <pkg>` writes a caret-prefixed entry by default. There is no hook, script, lint rule, or CI gate to catch or reject this.

**Flow**: Developer runs `npm install` → npm writes `^x.y.z` to package.json → no gate → PR merges → non-exact specifier in codebase.

### Enforcement Inventory

| Mechanism | Status |
|-----------|--------|
| `.npmrc` with `save-exact=true` | ❌ Missing |
| ESLint rule for package.json | ❌ Missing |
| CI validation step | ❌ Missing |
| Pre-commit hook | ❌ Missing (no Husky) |
| Custom script | ❌ Missing |
| package-lock.json | ✅ Exists (pins resolved, not specifiers) |

---

## Risk Level: Low-Medium

Low for enforcement mechanism itself. Medium risk from touching 105 version specifiers — use `npm install --package-lock-only` after migration to avoid resolved version drift.

---

## Recommendations

**Layer 1 — Prevent new violations**: Add `save-exact=true` to `cockpit-app/.npmrc`. Zero risk, immediate benefit.

**Layer 2 — Migrate existing**: Strip `^` and `~` from all 105 affected entries across 8 package.json files. Run `npm install --package-lock-only` to verify lockfile consistency.

**Layer 3 — CI gate**: Add validation step to `app-checks.yml` that greps all package.json files for range specifiers and fails the build.

**Recommended order**: Layer 1 → Layer 2 → Layer 3.
