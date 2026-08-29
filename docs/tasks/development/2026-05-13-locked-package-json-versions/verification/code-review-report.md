# Code Review Report

**Date**: 2026-05-13
**Status**: Issues Found — 0 critical, 4 warnings, 3 info

## Warnings

### W1 — Grep pattern misses x-wildcard and hyphen ranges
- Location: `.github/workflows/app-checks.yml:34`
- Pattern `[\^~><=*]` misses `1.x`, `1.2.x`, `1.2.3 - 2.3.4`, `||` OR operator
- Fix: add `x` to class; add separate pass for `||`; or use `semver.valid()` in Node

### W2 — Specifier extraction can produce empty diagnostic line
- Location: `.github/workflows/app-checks.yml:37`
- `$specifier` empty if inner grep fails → outputs `path:` with no specifier
- Fix: guard with `[ -n "$specifier" ]`, fall back to raw `$line`

### W3 — `detect_violations` return code conflicts with `set -euo pipefail`
- Location: `.github/scripts/test-validate-pkg-versions.sh:12`
- Suppressed with `|| true` which also hides real errors
- Fix: use a variable or file to signal violations instead of return code

### W4 — Test mutates real committed source file
- Location: `.github/scripts/test-validate-pkg-versions.sh:33`
- Interrupted run leaves `shared/utils/package.json` corrupted permanently
- Fix: copy file to `mktemp -d`, inject violation there, clean up after

## Info

### I1 — `.npmrc` purpose not documented
- Location: `cockpit-app/.npmrc:1`
- Add comment explaining why both `.npmrc` and CI check coexist

### I2 — `working-directory: .` override undocumented
- Location: `.github/workflows/app-checks.yml:30`
- Add comment: "Must run from repo root — find targets cockpit-app/ explicitly"

### I3 — `@testing-library/jest-dom` under `dependencies` (pre-existing)
- Location: `cockpit-app/libs/shared/data-access/react/package.json:12`
- Should be `devDependencies`; separate PR
