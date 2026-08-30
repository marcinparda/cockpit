---
name: sdlc-fix-bug
description: Orchestrates this repo's SDLC for a bug fix — root-cause debugging → lightweight spec → fix → fresh-review → manual QA → merge. Use whenever fixing a bug that isn't a one-line/obvious typo fix.
---

# SDLC: Fix Bug

Purpose: run the repo's process for bug fixes end to end. Lighter than `sdlc-develop-feature` — a bug fix rarely needs slice planning — but still requires finding the actual root cause, recording it, and getting a clean-session review before merge.

## When to use

Any bug fix that isn't trivially obvious (a genuine typo, an off-by-one you can see and verify in seconds). If reproducing or diagnosing the bug takes more than a glance, use this. For new functionality, use `sdlc-develop-feature` instead.

## Process

1. **Diagnose.** Invoke `superpowers:systematic-debugging` to find the actual root cause — don't patch symptoms. Reproduce the bug first; don't fix what you haven't reproduced.
2. **Record the fix scope.** Invoke `grill-me` to produce `docs/tasks/<type>/<date>-<slug>/spec.md` — for a bug fix this should stay short: what's broken, root cause found in step 1, the fix approach, what "done" means (repro no longer fails + no regression). `type` is usually `development` unless the fix is part of a larger migration.
   - Skip `plan-slices` for a single-file/single-layer fix — go straight to implementation. If the fix genuinely spans multiple layers (e.g. DB migration + API + UI), invoke `plan-slices` against the spec first.
3. **Implement.** Fix the root cause, not just the reported symptom. Add a regression test that fails before the fix and passes after — this is the definition of done for a bug fix, not optional. Update `work-log.md` in the task folder.
   - Stay interactive — no unsupervised parallel-agent dispatch for the fix itself (see `sdlc-develop-feature` guardrails, same rule applies here).
4. **Fresh review.** Invoke `fresh-review` in a clean session/subagent. Check the fix against `spec.md`'s root cause and definition of done, confirm the regression test actually would have caught the original bug, check for any similar instances of the same root cause elsewhere in the codebase.
5. **Manual QA.** Human confirms the original repro is actually fixed, not just that the new test passes.
6. **Docs + merge.** If the root cause reveals a standards gap (e.g. a pattern that should have prevented this class of bug), add it to `docs/standards/` directly. Then merge.

## Guardrails

- Never fix a bug you haven't reproduced and root-caused — a fix that "should work" without a failing-then-passing test is not done.
- Any subagent dispatched during diagnosis or fix must be told explicitly to flag new `docs/standards/`-worthy patterns in its summary — it won't infer that policy on its own.
- Task folder and work-log conventions are identical to `sdlc-develop-feature` — see that skill for the folder layout.
