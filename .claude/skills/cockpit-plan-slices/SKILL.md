---
name: cockpit-plan-slices
description: Break a spec.md into small vertical-slice (tracer bullet) issues and write plan.md. Use after cockpit-grill-me, before implementation.
---

# Plan Slices

Purpose: turn `spec.md` into a small, ordered set of vertical slices — each slice crosses every layer it touches (DB → API → UI, or whatever layers apply) and is independently implementable, testable, and committable. Not a single big-bang plan, not horizontal layer-by-layer batching.

## Process

1. Read the task's `spec.md` (in `.ai/docs/tasks/<type>/<date>-<slug>/`).
2. Read the relevant module `AGENTS.md` (root, `cockpit-api/AGENTS.md`, `cockpit-app/AGENTS.md`) and `docs/standards/AGENTS.md` for the domains this task touches — don't invent patterns that already exist.
3. Identify the smallest end-to-end slice that produces observable behavior (a tracer bullet) — implement and verify that first, before adding the next slice.
4. Break remaining scope into further slices, ordered by dependency. Each slice should be small enough to review in one sitting.
5. For each slice: what changes, which files/layers, what tests prove it works, any open question that needs a decision before starting.

## Output

Write `plan.md` next to `spec.md`:

```
.ai/docs/tasks/<type>/<date>-<slug>/plan.md
```

`plan.md` structure — one section per slice:
- **Slice N: <name>**
  - What it does (observable behavior)
  - Files/layers touched
  - Tests that prove it works
  - Dependencies on earlier slices

Next step: implement slice by slice, writing progress to `work-log.md` in the same folder as you go. After implementation, hand off to `cockpit-fresh-review` — run in a new/clean session, not this one.
