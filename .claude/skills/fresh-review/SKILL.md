---
name: fresh-review
description: Review a diff/branch against a task's spec.md and plan.md, run in a clean session with no prior implementation context. Appends findings to work-log.md. Use after implementation, before merge/QA.
---

# Fresh Review

Purpose: catch what the implementing session couldn't see because it was too close to its own work. Must run in a session that did **not** write the code being reviewed — self-review from the same context defeats the point.

## Process

1. Identify the task folder: `.ai/docs/tasks/<type>/<date>-<slug>/`. Read `spec.md` and `plan.md` there.
2. Identify the diff to review (branch, PR, or working-tree changes) — don't assume, ask if unclear.
3. Read the actual diff. Check against `spec.md`'s definition of done and `plan.md`'s per-slice test expectations — not just "does this look reasonable."
4. Check against the relevant `.ai/docs/standards/` files for the domains touched (don't re-derive standards from scratch — they're already written down).
5. Look for: unhandled edge cases named in spec.md but not covered, scope creep beyond spec.md, missing tests for a slice, standards violations.
6. Run tests/lint if available in this environment.

## Output

Append a `## Fresh Review — <date>` section to `work-log.md` in the task folder:
- What was checked
- Findings (if any), each tied to a spec/plan requirement or a standards doc
- Verdict: ready for manual QA, or blockers to fix first

No separate verification report files — this goes straight into `work-log.md`. Next step: manual QA by the human, then merge.
