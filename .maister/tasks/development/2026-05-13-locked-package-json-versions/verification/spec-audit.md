# Specification Audit: Enforce Locked/Exact Package Versions

**Verdict**: MOSTLY COMPLIANT — implementable but 2 critical/high defects need fixing

## Critical Issues (1)

**1. Broken glob in success criteria**
- Spec uses `cockpit-app/libs/*/package.json` — this glob matches nothing (files are 2 levels deep)
- Fix: use `find cockpit-app -name package.json -not -path '*/node_modules/*'` or explicit paths
- Same broken glob appears in Testing Approach section

## High Issues (1)

**2. CI grep missing node_modules exclusion**
- Without `--exclude-dir=node_modules`, grep scans thousands of node_modules package.json files → false positives, unusable
- Fix: add `--exclude-dir=node_modules --exclude-dir=dist` to grep command

## Medium Issues (2)

**3. CI step placement ambiguous** — spec says both "after checkout" and "before npm ci"; pick one definitive insertion point

**4. CI gate scope vs migration table** — migration table is 5 files (with violations only), but CI gate must cover all 8 package.json files — add clarifying note

## Low Issues (1)

**5. `*` workspace marker exception** — spec mentions `*` as workspace marker but no such patterns exist in this repo; scenario is hypothetical

## Clarifications

- Q1: Should CI grep defensively exclude `engines`/`peerDependencies` fields even though none exist today?
- Q2: Who resolves the peerDependencies range decision — implementer silently or escalate?

## Verdict

Fix the glob and add node_modules exclusion before or during implementation. All other items are minor.
