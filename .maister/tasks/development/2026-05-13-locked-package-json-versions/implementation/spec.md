# Specification: Enforce Locked/Exact Package Versions in cockpit-app

## Goal

Prevent non-exact version specifiers (`^`, `~`, `>=`, `<=`, `>`, `<`, `*`) from entering cockpit-app package.json files by migrating all 112 existing violations, adding `.npmrc` to enforce exact saves, and gating PRs with a CI check.

## User Stories

- As a developer, I want `npm install <pkg>` to write exact versions so I never accidentally introduce a range specifier.
- As a maintainer, I want PRs to fail automatically when a non-exact version is added so the rule is enforced without manual review.

## Core Requirements

1. Create `cockpit-app/.npmrc` with `save-exact=true` to prevent npm from writing caret or tilde prefixes on future installs.
2. Strip all `^` and `~` prefixes from the 112 non-exact specifiers across 5 package.json files, leaving only the bare semver string (e.g. `^19.0.0` → `19.0.0`).
3. Regenerate `cockpit-app/package-lock.json` with `npm install --package-lock-only` and verify zero resolved-version drift against the previous lockfile.
4. Add a CI validation step to `.github/workflows/app-checks.yml` that:
   - Greps all cockpit-app package.json files for range specifiers (`^`, `~`, `>=`, `<=`, `>`, `<`, `*`) inside `dependencies`, `devDependencies`, and `peerDependencies` values.
   - Prints a clear list of each violation (file + specifier) on failure.
   - Exits non-zero so the PR is blocked.
   - Runs before the existing `npm ci` install step so the check is fast and does not require a successful install.

## Reusable Components

### Existing Code to Leverage

- `.github/workflows/app-checks.yml` — add a new step to this file; all checkout, Node setup, and job scaffolding already exists. The new step inserts before the `npm ci` install step so it costs no install time.
- `cockpit-app/package-lock.json` (lockfileVersion 3) — already present and used by `npm ci`; `npm install --package-lock-only` refreshes it without installing to `node_modules`.

### New Components Required

- `cockpit-app/.npmrc` — does not exist; must be created. No equivalent config exists in the repo. This is the standard npm mechanism for enforcing `save-exact` globally in a project directory.
- CI grep validation step — no version-specifier gate exists anywhere in the workflow. A shell `grep` step is the minimal approach; no external action or plugin is needed.

## Technical Approach

**Layer 1 — .npmrc (prevention)**

Create `cockpit-app/.npmrc` containing:

```
save-exact=true
```

This file is read by npm for all operations in the `cockpit-app/` directory tree. It does not affect `cockpit-api/`.

**Layer 2 — Migration (remediation)**

Perform a mechanical find-and-replace across the 5 affected files:

| File | Violations |
|------|-----------|
| `cockpit-app/package.json` | 105 (92 `^`, 13 `~`) |
| `cockpit-app/libs/shared/utils/package.json` | 3 (`^`) |
| `cockpit-app/libs/shared/types/api-types/package.json` | 1 (`^`) |
| `cockpit-app/libs/shared/data-access/react/package.json` | 2 (`^`) |
| `cockpit-app/libs/shared/data-access/common/package.json` | 1 (`^`) |

Pattern to strip: any `^` or `~` character that immediately precedes a digit in a version value. Internal monorepo refs (`0.0.1` or `*`) that are already exact or intentional workspace markers must not be altered.

After editing, run `npm install --package-lock-only` from `cockpit-app/` and diff the resulting `package-lock.json` against the previous version. If any `resolved` URL or `version` field changes, investigate before committing — the specifier strip should not change what npm resolves.

**Layer 3 — CI gate (enforcement)**

Insert a new step into `.github/workflows/app-checks.yml` before the `Install dependencies` step. The step must:

1. Use a `grep` command (or inline shell script) targeting all `package.json` files under `cockpit-app/` (including lib subdirectories).
2. Search version value fields only — avoid false positives from keys, URLs, or `engines`/`peerDependencies` fields where ranges may be intentional. The recommended approach is to grep the raw JSON for patterns like `": "[\^~><=*]` inside dependency blocks, or use `jq` to extract only dependency values before checking.
3. Print each offending `file:specifier` pair on failure.
4. Exit 0 when no violations found, exit 1 when any found.

The step has no dependencies on Node.js setup or `npm ci` and can run immediately after checkout.

## Implementation Guidance

### File Edit Order

1. Create `cockpit-app/.npmrc`.
2. Edit `cockpit-app/package.json` (largest file — 105 violations).
3. Edit each lib `package.json` (4 files, 7 violations total).
4. Run `npm install --package-lock-only` and verify lockfile diff.
5. Add CI step to `app-checks.yml`.

### Testing Approach

Each step group should have 2-8 focused tests. Suggested verifications:

- **Step group 1 (.npmrc + migration)**: After editing, run `grep -rE '"[\^~><=*]' cockpit-app/package.json cockpit-app/libs/*/package.json` locally and confirm zero output. Run `git diff cockpit-app/package-lock.json` and confirm only `specifiers` fields changed (resolved versions are stable).
- **Step group 2 (CI gate)**: Add a temporary `^1.0.0` entry to a test branch to confirm the CI step catches it and prints the file+specifier. Remove afterward.

### Standards Compliance

- `standards/global/minimal-implementation.md` — no new scripts, ESLint plugins, or pre-commit hooks; CI grep step is the minimum viable gate.
- `standards/global/conventions.md` — minimal dependencies; the CI step uses shell built-ins only.
- `standards/global/coding-style.md` — `.npmrc` has no indentation; CI step shell code uses 2-space indentation consistent with YAML convention in `app-checks.yml`.

## Out of Scope

- `cockpit-api/` — uses Poetry, no `package.json`.
- Local `npm run lint:versions` script — CI gate is sufficient.
- ESLint plugin for package.json validation — grep approach is sufficient.
- Pre-commit hooks (no Husky in project).
- `engines` or `peerDependencies` ranges that are semantically intentional — the CI grep must not flag these if they legitimately require ranges (confirm during implementation).

## Success Criteria

- `grep -rE '": "[\^~><=]' cockpit-app/package.json cockpit-app/libs/*/package.json` returns no output on the merged branch.
- `cockpit-app/.npmrc` exists and contains `save-exact=true`.
- `npm install --package-lock-only` in `cockpit-app/` produces no resolved-version changes (lockfile diff shows only `specifiers` field changes, not `version` or `resolved`).
- A PR adding `"some-pkg": "^1.0.0"` to any cockpit-app package.json causes `app-checks.yml` to fail with a message identifying the violation.
- All existing CI checks (lint, build, test) continue to pass after lockfile regeneration.
