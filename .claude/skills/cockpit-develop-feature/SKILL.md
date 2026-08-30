---
name: cockpit-develop-feature
description: Orchestrates this repo's full SDLC for a new feature or non-trivial change — cockpit-grill-me → cockpit-plan-slices → slice-by-slice implementation → cockpit-fresh-review → manual QA → merge. Use whenever building a feature, not for a one-line/trivial fix.
---

# SDLC: Develop Feature

Purpose: run the repo's actual process for feature work end to end, in order, without skipping steps for convenience. This skill doesn't do the work itself — it invokes the right skill at each step and enforces the handoffs between them.

## When to use

Any non-trivial feature/change: new functionality, a refactor big enough to touch multiple files/layers, anything where "what does done look like" isn't already obvious. For a bug fix, use `cockpit-fix-bug` instead. For a genuinely trivial one-liner, skip this — but if in doubt, don't skip it; ambiguity found via `cockpit-grill-me` is cheap, ambiguity found mid-implementation isn't.

## Process

1. **Grill.** Invoke `cockpit-grill-me`. Produces `docs/tasks/<type>/<date>-<slug>/spec.md`. Do not proceed to planning until this exists and the user has confirmed it captures the real requirement.
2. **Plan.** Invoke `cockpit-plan-slices` against that `spec.md`. Produces `plan.md` — small, ordered, independently-testable vertical slices next to it.
3. **Implement, one slice at a time.** Each slice: small enough to commit/review on its own, don't batch multiple slices into one diff. Write tests per slice (see `docs/standards/testing/`). Update `work-log.md` in the task folder as you go — what was done, what deviated from plan.md and why.
   - **Stay interactive.** This repo does not use AFK/parallel-agent mode — implement in this session, checking in with the user between slices rather than dispatching background agents to build multiple slices unsupervised.
   - If dispatching any subagent for a sub-piece of a slice (e.g. a scoped investigation), its prompt must explicitly say: *"if this introduces a pattern not already documented in `docs/standards/`, note it in your summary."* Subagents start with zero context and won't read this policy unprompted.
4. **Fresh review.** Once all slices are implemented, invoke `cockpit-fresh-review` in a clean session/subagent (not this one — self-review from the implementing context defeats the point). It checks the diff against `spec.md`'s definition of done and `plan.md`'s per-slice expectations, appends findings to `work-log.md`.
5. **Manual QA.** Human checks it actually works. For UI changes, run the app in a browser (see the `run` skill) — don't rely on tests alone to confirm the feature behaves correctly.
6. **Docs + merge.** Before merge: fold any new pattern/convention discovered along the way into `docs/standards/` directly (never into an `AGENTS.md` — those are pointer-only, see `docs/CONTRIBUTING.md`). If `docs/standards/AGENTS.md` needs updating because a file was added/removed, do that too. Then merge.

## Guardrails

- Don't let any step get silently skipped because the task "feels simple" — that judgment call belongs to the user, not the implementer. If you think a step is overkill for this task, say so and ask before skipping it.
- Every task folder lives at `docs/tasks/<type>/<date>-<slug>/` — `type` is `development`, `migration`, `product-design`, or a new one if none fits (see `docs/CONTRIBUTING.md`).
- No separate verification/report files outside `work-log.md` — everything about this task's execution goes there.
