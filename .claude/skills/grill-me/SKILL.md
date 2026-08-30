---
name: grill-me
description: Interrogate requirements for a new feature/fix/task before any planning or code. Produces spec.md in a new .ai/docs/tasks/ folder. Use at the start of any non-trivial task, before plan-slices.
---

# Grill Me

Purpose: expose hidden decisions and align on a shared design concept *before* a plan or any code exists. Do not skip to planning or implementation from this skill — that's `plan-slices`.

## Process

1. Ask the user what they want to build/fix and why. Don't accept a vague answer — push until the actual problem and desired outcome are concrete.
2. Interrogate, one question at a time (or via `AskUserQuestion` for multi-choice decisions):
   - What's explicitly in scope vs. out of scope?
   - What existing code/patterns should this reuse? (Check `.ai/docs/standards/` and the relevant module's `AGENTS.md` first — don't ask the user things you can find yourself.)
   - What are the edge cases / failure modes that matter here?
   - Any constraints (deadline, backward compatibility, performance, who else is affected)?
   - What does "done" look like — how will this be verified?
3. Surface trade-offs you see, even if not asked. Don't silently pick one.
4. Keep going until there's nothing left that would surprise you mid-implementation.

## Output

Determine task type (`development`, `migration`, `product-design`, or similar) and slug. Create:

```
.ai/docs/tasks/<type>/<YYYY-MM-DD>-<slug>/spec.md
```

`spec.md` structure:
- **Problem** — what's broken/missing and why it matters
- **Goal** — the outcome, in concrete terms
- **Scope** — explicitly in / explicitly out
- **Decisions** — resolved trade-offs from the grilling, with the *why*
- **Constraints** — anything that limits the approach
- **Definition of done** — how this gets verified

This is a destination marker, not a rigid contract — expect it to need small updates as implementation reveals things. Don't over-polish it.

Next step: hand off to `plan-slices` with this spec.md.
