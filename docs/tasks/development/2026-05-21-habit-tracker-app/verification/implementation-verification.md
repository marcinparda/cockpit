# Implementation Verification Report

**Date**: 2026-05-22
**Task**: Habit Tracker App (habits.parda.me)
**Overall Status**: ❌ Failed — Critical Issues Require Fixes

---

## Executive Summary

The backend implementation is structurally sound: 3-layer FastAPI service, 251 tests passing, 80.03% coverage, correct auth enforcement, working streak logic, and valid Docker/CI/CD artifacts. The frontend UI components render correctly and 53 tests pass. However, **the entire frontend-to-backend integration layer is broken** — every API call goes to the wrong host (habits frontend port instead of the API server), plus 4+ endpoint paths are wrong, causing 100% of data operations to fail at runtime.

---

## Verification Results

| Check | Status | Notes |
|---|---|---|
| Implementation plan completion | ✅ 100% | All 110 steps marked complete |
| Test suite (backend) | ✅ 251 tests, 80.03% | Verified during implementation |
| Test suite (frontend) | ⚠️ 53 tests, 80.59% functions | API hooks excluded from coverage |
| Standards compliance | ⚠️ Mostly compliant | Endpoint constants deviate from spec |
| Code review | ❌ 8 critical, 6 warnings | Frontend-backend API contracts mismatched |
| Pragmatic review | ❌ 6 critical bugs | Not over-engineered, but bugs present |
| Production readiness | ❌ NO-GO, 3 blockers | Duplicate route, VAPID keys, SW error handling |
| Reality check | ❌ 0% API connectivity | All data operations fail at runtime |

---

## Critical Issues

### CRIT-1 (Blocker): All API hooks use relative URLs — calls go to habits frontend, not API server

**Affects**: 100% of app functionality
**Files**: All 11 files in `cockpit-app/apps/habits/src/api/hooks/`

Every hook calls `fetcher({ url: ENDPOINT })` with a relative URL. The shared `fetcher()` passes the URL directly to `fetch()` with no base URL prepending. In browser, relative URLs resolve against the page origin (`localhost:4208` or `habits.parda.me`), not the API server.

**Fix**: Prefix all endpoint URLs with `environments.apiUrl`. Simplest approach: in every hook, import `environments` from `@cockpit-app/shared-utils` and change:
```typescript
// Before:
fetcher({ url: HABITS_ENDPOINTS.LIST, ... })
// After:
fetcher({ url: `${environments.apiUrl}${HABITS_ENDPOINTS.LIST}`, ... })
```
Or create a `habitsApi.ts` wrapper that adds the base URL automatically (mirrors `baseApi.ts`).

---

### CRIT-2 (Blocker): Endpoint path mismatches — categories, settings, presets all 404

**Files**: `cockpit-app/apps/habits/src/api/endpoints.ts`

| Constant | Current (wrong) | Correct |
|---|---|---|
| `CATEGORIES_ENDPOINTS.*` | `/api/v1/habit-categories` | `/api/v1/habits/categories` |
| `SETTINGS_ENDPOINTS.GET/UPDATE` | `/api/v1/habit-settings` | `/api/v1/habits/settings` |
| `PRESETS_ENDPOINTS.LIST` | `/api/v1/habit-presets` | `/api/v1/presets` |

**Fix**: Update path strings in `endpoints.ts`.

---

### CRIT-3 (Blocker): Duplicate `GET /habits/stats/today` route — first handler is broken

**File**: `cockpit-api/src/services/habits/router.py` lines 52–59

First handler re-imports `User` class as `_`, shadowing the injected user, then calls `_.id` on the class (not an instance). FastAPI uses the first registered handler, causing `AttributeError` on every today stats request.

**Fix**: Delete lines 52–59 (the broken `stats_today` function). The second handler `get_today_stats` (lines 62–68) is correct.

---

### CRIT-4: Frontend Zod schemas mismatched with backend responses

Multiple schemas don't match what the backend actually returns:

| Schema | Field mismatch |
|---|---|
| `StreakResponseSchema` | `longest_streak` → `best_streak`; missing `last_period_completed`; extra `habit_id` |
| `HabitEntrySchema` | `date` → `logged_at`; `value` → `boolean_value`/`numeric_value`/`text_value` |
| `TodayStatsSchema` | `completion_percentage` → `completion_pct` |
| `WeeklyStatItemSchema` | `day`/`completion_percentage` → `date`/`count` |
| `StreakRankingItemSchema` | `habit_id`/`habit_name` → `id`/`name` from `HabitResponse` |
| `PresetHabitSchema` | `frequency`/`category`/`unit` → `default_frequency_type`/`category_key`/`default_target_unit` |
| `UserHabitSettingsSchema` | `notification_enabled` → `notifications_enabled` |

**Fix**: Align each schema with the actual `schemas.py` Pydantic response model.

---

### CRIT-5: Freeze endpoint — frontend sends JSON body, backend expects query parameter

**Files**: `apps/habits/src/api/hooks/useFreezeMutations.ts` vs `router.py` line 334

Backend: `freeze_date: date = Query(...)` — reads from query string.
Frontend: sends `{ start_date, end_date }` as JSON body — backend ignores body, returns 422 for missing query param.

**Fix**: Change `useFreezeMutations` to append `?freeze_date=YYYY-MM-DD` to the URL.

---

### CRIT-6: Router freeze endpoint declares `response_model=HabitEntryResponse` but returns `HabitStreakFreeze`

**File**: `cockpit-api/src/services/habits/router.py` line 335

FastAPI will raise a serialization error trying to validate a freeze object against entry response schema.

**Fix**: Add `HabitStreakFreezeResponse` schema to `schemas.py` and use it as `response_model`.

---

## Warnings

| # | Issue | File | Fix |
|---|---|---|---|
| W1 | `VAPID_PRIVATE_KEY`/`PUBLIC_KEY` not in `.env.template` or `GITHUB_SECRETS.md` | `cockpit-api/.env.template` | Add both keys; document generation steps |
| W2 | VAPID keys may not be read from env at runtime due to `Settings` constructor pattern | `cockpit-api/src/core/config.py` | Read via `getenv()` and pass to constructor |
| W3 | SW registration has no `.catch()` — silent failure | `apps/habits/src/main.tsx:9` | Add `.catch(err => console.error(...))` |
| W4 | `sw.js` missing `notificationclick` handler | `apps/habits/public/sw.js` | Add `clients.openWindow('/today')` handler |
| W5 | API hooks excluded from coverage threshold | `vite.config.mts` | Remove hooks from exclude list; add integration tests |
| W6 | `upsert_settings` `None` guard prevents clearing push subscription | `repository.py` | Remove `if value is not None` guard |
| W7 | `useMemo` used for side effects in `TodayPage.tsx` | `TodayPage.tsx:80-85` | Replace with `useEffect` |
| W8 | Dead endpoint constants in `endpoints.ts` | `endpoints.ts` | Remove `ENTRIES_ENDPOINTS.LIST/CREATE/UPDATE/DELETE`, `PRESETS_ENDPOINTS.APPLY` |
| W9 | Dead `_ENTRY_TYPE_RULES` dict in `service.py` | `service.py:34-38` | Delete unused dict |
| W10 | `StatsResponse(BaseModel)` in `schemas.py` unused | `schemas.py:127-129` | Delete |

---

## Issues NOT Present

- ✅ No SQL injection risks — all queries use SQLAlchemy ORM or bound parameters
- ✅ All router endpoints use `require_permission(Features.HABITS, ...)` — auth enforced
- ✅ Backend streak logic is correct and well-tested (8 unit tests)
- ✅ Alembic migrations are reversible with `downgrade()`
- ✅ Docker/CI/CD artifacts are correct (Dockerfile, nginx.conf, app-deploy.yml, deploy-apps.sh)
- ✅ No over-engineering — 3-layer backend and TanStack Query match project conventions
- ✅ VAPID keys not hardcoded — stored as env vars

---

## Recommended Fix Order

1. **CRIT-1**: Add `environments.apiUrl` base to all hooks (~1 hour)
2. **CRIT-2**: Fix endpoint path strings in `endpoints.ts` (~30 min)
3. **CRIT-3**: Delete broken duplicate route in `router.py` (~5 min)
4. **CRIT-4**: Align all mismatched Zod schemas with backend responses (~45 min)
5. **CRIT-5**: Fix freeze mutation to use query param instead of JSON body (~15 min)
6. **CRIT-6**: Add `HabitStreakFreezeResponse` schema, fix router `response_model` (~15 min)
7. **W1-W2**: VAPID key documentation and env wiring (~15 min)
8. **W3-W4**: Service worker error handling and notification click handler (~10 min)

Total estimated fix time: ~3 hours

---

## Structured Output

```yaml
status: "failed"
report_path: "verification/implementation-verification.md"

issue_counts:
  critical: 6
  warning: 10
  info: 0

issues:
  - source: "code_review"
    severity: "critical"
    description: "All 11 API hooks use relative URLs — calls hit habits frontend (4208), not API server"
    location: "cockpit-app/apps/habits/src/api/hooks/ (all files)"
    fixable: true
    suggestion: "Prefix all fetcher URLs with environments.apiUrl from @cockpit-app/shared-utils"

  - source: "completeness"
    severity: "critical"
    description: "CATEGORIES_ENDPOINTS, SETTINGS_ENDPOINTS, PRESETS_ENDPOINTS paths don't match backend routes"
    location: "cockpit-app/apps/habits/src/api/endpoints.ts"
    fixable: true
    suggestion: "Fix paths: habit-categories → habits/categories, habit-settings → habits/settings, habit-presets → presets"

  - source: "production_readiness"
    severity: "critical"
    description: "Duplicate GET /habits/stats/today route — first handler crashes with AttributeError"
    location: "cockpit-api/src/services/habits/router.py:52-59"
    fixable: true
    suggestion: "Delete lines 52-59 (stats_today function)"

  - source: "code_review"
    severity: "critical"
    description: "6 Zod schemas in frontend don't match backend response shapes — parse errors on all affected queries"
    location: "cockpit-app/apps/habits/src/api/schemas.ts + useStats.ts"
    fixable: true
    suggestion: "Align StreakResponseSchema, HabitEntrySchema, TodayStatsSchema, WeeklyStatItemSchema, StreakRankingItemSchema, PresetHabitSchema with backend Pydantic models"

  - source: "code_review"
    severity: "critical"
    description: "Freeze mutation sends JSON body; backend expects freeze_date as query param — returns 422"
    location: "cockpit-app/apps/habits/src/api/hooks/useFreezeMutations.ts"
    fixable: true
    suggestion: "Change to append ?freeze_date=YYYY-MM-DD as query string"

  - source: "code_review"
    severity: "critical"
    description: "Freeze router endpoint uses HabitEntryResponse as response_model but returns HabitStreakFreeze"
    location: "cockpit-api/src/services/habits/router.py:335"
    fixable: true
    suggestion: "Add HabitStreakFreezeResponse schema and use as response_model"
```
