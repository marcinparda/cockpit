# Phase 1 Clarifications

## Q1: Lib structure for data-access code
**Answer**: Inline in `apps/habits/src/`
**Impact**: All API hooks, endpoint constants, Zod schemas, and TanStack Query hooks stay inside the app. No new `libs/habits/` lib created.

## Q2: APScheduler availability
**Answer**: Already configured at `cockpit-api/src/core/scheduler.py` (AsyncIOScheduler with CronTrigger, lifespan-managed). Habits can register APScheduler jobs for push notification delivery directly.

## Q3: Feature-spec.md usage
**Answer**: Use `analysis/feature-spec.md` from product-design folder as-is. Phase 5 spec-creator enriches with technical implementation details without rewriting requirements.
