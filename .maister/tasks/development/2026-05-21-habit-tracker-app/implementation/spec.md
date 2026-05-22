# Specification: Habit Tracker App

## Goal

Build a full-stack habit tracker app (`habits.parda.me`) as a new Nx React app within `cockpit-app` and a new FastAPI service within `cockpit-api`, supporting three habit types (boolean, numeric, text diary) with forgiving streak mechanics, per-habit graphs, a stats screen, push notifications, and multi-user data isolation.

## User Stories

- As Marcin, I want to open the app at 21:00, scan my habit grid, and log all habits in under 2 minutes so I can maintain daily streaks without friction.
- As Piotr, I want to configure numeric habits with precise targets and view weekly trend charts so I can track and adjust my training goals.
- As any user, I want soft streak mode to forgive a single missed day so a streak break doesn't cause me to abandon my habits.
- As any user, I want push notifications at a per-habit time so I remember to log habits I might forget.

## Core Requirements

1. Nx React app scaffolded at `cockpit-app/apps/habits/` with React 19, Vite 6, Tailwind CSS v4, shadcn/ui, TanStack Query, Recharts, Zod, @dnd-kit
2. FastAPI service at `cockpit-api/src/services/habits/` with strict 3-layer structure (router → service → repository)
3. Six PostgreSQL tables: `habits`, `habit_categories`, `habit_entries`, `habit_streak_freezes`, `user_habit_settings`, `preset_habits`
4. Four-tab bottom navigation (Today, Habits, Stats, Settings); mobile-first, Lighthouse ≥ 80
5. Today view: Daylio-style 80×80px icon grid grouped by category; tap = check-in per type; long-press = navigate to detail
6. Three habit types with distinct check-in UX: boolean (one-tap with color fill animation), numeric (bottom Sheet with number input + target progress), text diary (90vh Sheet with auto-focused textarea + auto-save)
7. Lucide React icons for habit icons — icon key = Lucide icon name string (e.g. `'running'`, `'moon'`, `'droplets'`). IconPicker shows a curated subset of ~30 Lucide icons. `lucide-react` is already in package.json. Store key as `String(50)` in DB.
8. Drag-to-reorder on Habits tab only (not Today tab): categories (full group drag) AND habits within a category — using @dnd-kit/sortable (already installed). PATCH `/{id}` with `sort_order` for each reordered item individually (no bulk endpoint).
9. Per-habit streak modes: soft (1-miss grace, default), hard, none — streak freeze 2/month enforced in service layer
10. Per-habit detail page with type-appropriate graph (heatmap / line+bar / timeline) and 5 time range options
11. Stats screen: today's completion %, weekly bar chart, streak ranking, monthly highlights
12. Habit creation Sheet with Quick Add and Browse Templates tabs; preset library seeded via Alembic migration
13. User-defined categories with color picker (8 swatches)
14. Browser push notifications via `pywebpush` + APScheduler minute-interval job
15. All data scoped by `user_id`; cookie-based auth with `credentials: 'include'`; unauthenticated → 401 → redirect to login
16. Add habits card to cockpit Apps/Services grid (`cockpit-app/apps/cockpit/src/app/apps/apps.tsx`)
17. `HABITS = "habits"` added to `Features` enum; Alembic migrations for tables + permissions seed + preset seed
18. Docker container: `nginx:alpine`, `linux/arm64`, port 4208, SPA `try_files` fallback
19. CI/CD: habits block in `app-deploy.yml` + `[habits]="4208"` in `deploy-apps.sh`

## Visual Design

No pixel-perfect mockups provided. Design follows the Daylio-style icon grid pattern (referenced in product-design context). Key layout principles:
- Mobile-first: sticky bottom tab bar (4 tabs), no top navbar on mobile
- Today grid: 80×80px tiles, icon (32px centered) + truncated name (12px) + streak badge (top-right)
- Uncompleted tile: muted background, `habit.color` outline border
- Completed tile: `habit.color` filled background + checkmark overlay + CSS 300ms transition
- Bottom Sheet height: numeric = 50vh, text = 90vh, creation = 85vh
- Fidelity: approximate — match layout and interaction described in feature-spec; visual polish secondary

## Reusable Components

### Existing Code to Leverage

**Frontend**

| Component | File Path | How to Use |
|---|---|---|
| `fetcher()` | `cockpit-app/libs/shared/data-access/common/src/lib/api/fetcher.ts` | Wrap all API calls; handles 401 refresh + redirect |
| `getRequest / postRequest / patchRequest / deleteRequest` | `cockpit-app/libs/shared/data-access/common/src/lib/api/baseApi.ts` | Use as HTTP verb helpers in `apps/habits/src/api/` |
| TanStack Query client + `useUser` hook | `cockpit-app/libs/shared/data-access/react/src/` | Auth check on app init; reuse `tanstackQueryClient` setup |
| `Button`, `Card`, `Input`, `Select`, `AlertDialog`, `Toaster`, `Badge`, `Skeleton`, `Label`, `Separator`, `Tooltip` | `cockpit-app/libs/shared/ui/react/src/lib/` — import from `@cockpit-app/shared-react-ui` | All standard UI primitives; import via `@cockpit-app/shared-react-ui` |
| `logout()` | `cockpit-app/libs/shared/data-access/common/src/lib/authentication/service.ts` — import from `@cockpit-app/common-shared-data-access` | Auth logout on 401 |
| `environments` | `cockpit-app/libs/shared/utils/src/lib/environments/environments.ts` — import from `@cockpit-app/shared-utils` | `environments.apiUrl` for all API requests; add `habitsUrl` |
| `cn()` | `cockpit-app/libs/shared/utils/src/lib/cn.ts` — import from `@cockpit-app/shared-utils` | Tailwind class merging |
| cockpit `app.tsx` pattern | `cockpit-app/apps/cockpit/src/app/app.tsx` | Auth guard + user check pattern for `apps/habits/src/app/app.tsx` |
| cockpit `Dockerfile` | `cockpit-app/apps/cockpit/Dockerfile` | Copy verbatim; change path to `dist/apps/habits` and conf to `habits.conf` |
| cockpit `nginx.conf` | `cockpit-app/apps/cockpit/nginx/cockpit.conf` | Copy verbatim as `apps/habits/nginx/habits.conf` |
| cockpit `project.json` | `cockpit-app/apps/cockpit/project.json` | Use as template for `apps/habits/project.json` tags pattern |
| `@dnd-kit/core`, `@dnd-kit/sortable` | Already in `cockpit-app/package.json` | Drag-to-reorder for categories + habits |
| Apps grid page | `cockpit-app/apps/cockpit/src/app/apps/apps.tsx` | Add habits entry to `ALL_APPS` array |

**Backend**

| Component | File Path | How to Use |
|---|---|---|
| `BaseModel` (TimestampMixin + Base) | `cockpit-api/src/common/models.py` | All 6 new ORM models extend `BaseModel` |
| `require_permission(feature, action)` | `cockpit-api/src/services/authorization/permissions/dependencies.py` | Dependency on all habits router endpoints |
| `get_current_user` | `cockpit-api/src/services/authentication/dependencies.py` | Inject authenticated user in router functions |
| `get_db` | `cockpit-api/src/core/database.py` | Inject `AsyncSession` |
| `Features` enum | `cockpit-api/src/services/authorization/permissions/enums.py` | Add `HABITS = "habits"` |
| `TaskScheduler._register_token_cleanup_task` pattern | `cockpit-api/src/core/scheduler.py` | Add `_register_habits_push_task` method following same pattern |
| Alembic migration structure | `cockpit-api/alembic/versions/05eac51d9014_*.py` | Follow same header, `upgrade()` / `downgrade()` structure |
| Permissions seed migration | `cockpit-api/alembic/versions/f9c1d2e3f4a5_assign_all_permissions_to_admin_users.py` | Pattern for seeding `HABITS` CRUD permissions to admin users |
| Users service 3-layer structure | `cockpit-api/src/services/users/{router,service,repository,models,schemas}.py` | Template for habits service files |

### New Components Required

**Frontend — new (no reusable equivalent exists)**

- `apps/habits/src/` — entire React app (no existing habits app)
- `apps/habits/src/components/HabitTile.tsx` — 80×80px tile with color fill animation; no generic tile in shared-react-ui
- `apps/habits/src/components/HabitSheet.tsx` — bottom Sheet orchestrator for all 3 check-in types; type-specific sub-sheets
- `apps/habits/src/components/HeatmapCalendar.tsx` — GitHub contribution-style heatmap; not available in shared-react-ui; built with Recharts or plain CSS grid
- `apps/habits/src/components/LineBarChart.tsx` — combined line + bar chart with reference line; Recharts ComposedChart
- `apps/habits/src/components/HabitCreationSheet.tsx` — 85vh Sheet with Quick Add + Browse Templates tabs; too habit-specific for shared lib
- `apps/habits/src/components/IconPicker.tsx` — horizontal scroll row of custom SVG icons; new SVG icon library (30+ icons)
- `apps/habits/src/components/SortableHabitRow.tsx` / `SortableCategoryGroup.tsx` — @dnd-kit wrappers for drag reorder
- `apps/habits/public/sw.js` — Service Worker for Web Push subscription; first SW in codebase
- `cockpit-api/src/services/habits/streak_service.py` — pure-function streak calculator; isolated module, testable without DB
- `cockpit-api/src/services/habits/push_notification_service.py` — standalone pywebpush module (follows `token_cleanup_service` pattern)

**Backend — new (no existing habits service)**

- `cockpit-api/src/services/habits/{router,service,repository,models,schemas,streak_service,push_notification_service}.py`
- Three Alembic migrations: (1) schema — ENUMs + 6 tables, (2) permissions seed — `HABITS` CRUD for all users, (3) preset seed — `preset_habits` rows

## Technical Approach

### Frontend App Structure

```
cockpit-app/apps/habits/src/
  main.tsx                          # Vite entry, QueryClientProvider + ThemeProvider
  app/
    app.tsx                         # Auth guard (useUser + logout pattern from cockpit app)
    router.tsx                      # React Router: / → Today, /habits, /stats, /settings, /habits/:id
  components/
    BottomNav.tsx                   # 4-tab sticky bottom nav
    HabitTile.tsx                   # 80×80px tile, color fill CSS transition
    HabitSheet.tsx                  # Check-in sheet dispatcher (boolean=undo only, numeric, text)
    HeatmapCalendar.tsx             # Boolean habit graph
    LineBarChart.tsx                # Numeric habit graph (Recharts ComposedChart)
    HabitCreationSheet.tsx          # Create/edit habit (Quick Add + Browse Templates tabs)
    IconPicker.tsx                  # Custom SVG icon scroll row
    SortableCategoryGroup.tsx       # @dnd-kit DndContext + SortableContext wrapper per category
    SortableHabitRow.tsx            # useSortable hook for drag handle on Habits tab
    ConfettiAnimation.tsx           # All-done confetti burst
    StreakBadge.tsx                 # Flame icon + count badge
  pages/
    TodayPage.tsx                   # Today view: sticky header + grouped grid
    HabitsPage.tsx                  # Habits list tab + archive toggle + drag-to-reorder categories
    HabitDetailPage.tsx             # Detail: header + graph + entry log + streak section
    StatsPage.tsx                   # Stats: today summary + weekly chart + streak ranking + highlights
    SettingsPage.tsx                # Push notifications toggle + timezone
  api/
    endpoints.ts                    # HABITS_ENDPOINTS, CATEGORIES_ENDPOINTS, STATS_ENDPOINTS constants (SCREAMING_SNAKE_CASE)
    schemas.ts                      # Zod schemas for all API response/request shapes
    hooks/
      useHabits.ts                  # useQuery: GET /api/v1/habits
      useHabitDetail.ts             # useQuery: GET /api/v1/habits/:id
      useHabitEntries.ts            # useQuery: GET /api/v1/habits/:id/entries
      useHabitStreak.ts             # useQuery: GET /api/v1/habits/:id/streak
      useHabitMutations.ts          # useMutation: create, update, delete, archive
      useEntryMutations.ts          # useMutation: log entry (POST), delete entry (DELETE)
      useFreezeMutations.ts         # useMutation: apply freeze
      useCategories.ts              # useQuery + mutations for categories
      usePresets.ts                 # useQuery: GET /api/v1/presets
      useStats.ts                   # useQuery: today, weekly, streaks, monthly-highlights
      useSettings.ts                # useQuery + mutation for push settings
  icons/
    index.ts                        # Exports SVG icon map keyed by icon key string
    [30+ SVG icon files]
```

### Frontend Integration Rules

- All path aliases use `@cockpit-app/*` — never relative cross-boundary imports
- Zod schema validation on every API response via `fetcher()` — never skip `responseDataSchema`
- TanStack Query handles all server state; no local useState for remote data
- `credentials: 'include'` on all requests via shared `fetcher()`
- `environments.apiUrl` for all API base URLs; add `habitsUrl: 'http://localhost:4208'` to environments
- File naming: PascalCase for `.tsx` components, camelCase for non-component `.ts` files
- Hooks prefixed `use` — `useHabits`, `useHabitDetail`, etc.
- Endpoint constants as SCREAMING_SNAKE_CASE objects in `api/endpoints.ts`

### Backend Service Structure

```
cockpit-api/src/services/habits/
  __init__.py
  models.py           # 6 SQLModel ORM models — see Data Models section
  schemas.py          # Pydantic v2 request/response schemas
  repository.py       # Async SQLAlchemy queries only; no business logic
  service.py          # Business logic, validation, streak updates, freeze quota enforcement
  router.py           # FastAPI router; all endpoints; require_permission dependencies
  streak_service.py   # Pure functions: calculate_streak(habit, logged_dates, freeze_dates) → StreakResult
  push_notification_service.py  # send_push_notifications(db) called by scheduler job
```

**`cockpit-api/src/services/authorization/permissions/enums.py`** — add `HABITS = "habits"` to `Features` enum.

**`cockpit-api/src/main.py`** — add after existing router imports:
```python
from src.services.habits.router import router as habits_router
```
And mount:
```python
app.include_router(habits_router, prefix="/api/v1")
```

**`cockpit-api/src/core/scheduler.py`** — add `_register_habits_push_task` method to `TaskScheduler`. Job uses `CronTrigger(minute='*')` (every minute). Add call in `start()` after token cleanup block (no settings flag needed — always register).

### Data Models (ORM Signatures)

All models extend `BaseModel` from `cockpit-api/src/common/models.py`. Use `Mapped[T]` + `mapped_column()` always.

**`Habit`** (`habits` table):
- `id: Mapped[UUID]` — PK, `server_default=text('uuid_generate_v4()')`
- `user_id: Mapped[UUID]` — FK → `users.id`, NOT NULL, indexed
- `name: Mapped[str]` — `String(100)`, NOT NULL
- `icon: Mapped[str]` — `String(50)`, NOT NULL (SVG icon key)
- `color: Mapped[Optional[str]]` — `String(7)` (hex)
- `type: Mapped[str]` — Enum column: `'boolean'|'numeric'|'text'`
- `frequency_type: Mapped[str]` — Enum: `'daily'|'weekly'|'custom_days_per_week'|'custom_interval'`, default `'daily'`
- `frequency_value: Mapped[Optional[int]]`
- `target_value: Mapped[Optional[float]]`
- `target_unit: Mapped[Optional[str]]` — `String(20)`
- `streak_mode: Mapped[str]` — Enum: `'none'|'soft'|'hard'`, default `'soft'`
- `reminder_time: Mapped[Optional[time]]` — `Time` column
- `timezone: Mapped[Optional[str]]` — `String(50)`
- `category_id: Mapped[Optional[UUID]]` — FK → `habit_categories.id`, nullable
- `is_archived: Mapped[bool]` — NOT NULL, default `False`
- `sort_order: Mapped[int]` — NOT NULL, default `0`
- `best_streak: Mapped[int]` — NOT NULL, default `0` (denormalized; updated on entry creation)
- Indexes: `(user_id)`, `(user_id, category_id)`, `(user_id, is_archived)`

**`HabitCategory`** (`habit_categories`): `id`, `user_id` (FK, indexed), `name String(50)`, `color String(7)`, `sort_order int`, `created_at`. UNIQUE `(user_id, name)`.

**`HabitEntry`** (`habit_entries`): `id`, `habit_id` (FK, indexed), `user_id` (FK, indexed), `logged_at Date NOT NULL`, `created_at`, `boolean_value Bool nullable`, `numeric_value Float nullable`, `numeric_unit String(20) nullable`, `text_value Text nullable`. UNIQUE `(habit_id, logged_at)`. Indexes: `(habit_id, logged_at DESC)`, `(user_id, logged_at DESC)`.

**`HabitStreakFreeze`** (`habit_streak_freezes`): `id`, `habit_id` (FK, indexed), `user_id` (FK), `freeze_date Date NOT NULL`, `created_at`. UNIQUE `(habit_id, freeze_date)`.

**`UserHabitSettings`** (`user_habit_settings`): `id`, `user_id` (FK, UNIQUE), `push_subscription JSONB nullable`, `notifications_enabled Bool NOT NULL default False`, `created_at`, `updated_at`.

**`PresetHabit`** (`preset_habits`): `id`, `name String(100)`, `icon String(50)`, `color String(7)`, `type` (same Enum), `category_key String(50)`, `default_frequency_type` (Enum), `default_target_value Float nullable`, `default_target_unit String(20) nullable`, `sort_order int`.

### PostgreSQL ENUMs

Create these native PostgreSQL ENUMs in the schema migration (before table creation):
- `habit_type` — `('boolean', 'numeric', 'text')`
- `frequency_type_enum` — `('daily', 'weekly', 'custom_days_per_week', 'custom_interval')`
- `streak_mode_enum` — `('none', 'soft', 'hard')`

Use `sa.Enum(..., name='habit_type', create_type=True)` in `mapped_column()`.

### Entry Upsert

Use raw SQLAlchemy `insert().on_conflict_do_update()` in `repository.py` for `POST /api/v1/habits/{id}/entries`. Do not use SQLModel's ORM `session.add()` — SQLModel does not support `ON CONFLICT` natively.

```python
from sqlalchemy.dialects.postgresql import insert as pg_insert
stmt = pg_insert(HabitEntry).values(...).on_conflict_do_update(
    index_elements=['habit_id', 'logged_at'],
    set_={...}
)
```

### Streak Service (`streak_service.py`)

Pure functions — no database access, no FastAPI dependencies. Importable standalone for unit tests.

```python
@dataclass
class StreakResult:
    current_streak: int
    best_streak: int
    last_period_completed: bool

def calculate_streak(
    habit: Habit,
    logged_dates: list[date],
    freeze_dates: list[date],
    today: date | None = None,
) -> StreakResult: ...

def _build_required_periods(habit: Habit, from_date: date, to_date: date) -> list[date]: ...
def _is_period_completed(period: date, logged_dates: set[date], frequency_type: str, frequency_value: int | None) -> bool: ...
```

Algorithm: build required periods backward from `today`; walk periods checking completion/freeze/break rules per `streak_mode`. `best_streak` = max of running count vs stored `habit.best_streak`; service layer updates `habit.best_streak` after each entry creation only (never decremented on entry deletion — best_streak is a historical high-water mark).

**Soft streak grace semantics**: Grace flag resets on any completed period. A freeze date counts as neither a completion nor a miss — it does not reset grace state. For weekly habits: a `freeze_date` covers the ISO week containing that date (the entire week is treated as frozen if one date in that week is in `freeze_dates`).

**GET /api/v1/presets authentication**: Requires `require_permission(Features.HABITS, Actions.READ)` — consistent with all other habits endpoints. The "no auth needed" note in the original feature-spec referred to not needing a special permission, not a truly public endpoint.

### Push Notification Service (`push_notification_service.py`)

```python
async def send_due_push_notifications(db: AsyncSession) -> None:
    """Query habits with reminder_time matching current minute in their timezone; send push via pywebpush."""
```

Called by scheduler job every minute. Uses `pywebpush` `webpush()` function with VAPID keys from `settings`. VAPID keys added to `cockpit-api/src/core/config.py` as `VAPID_PRIVATE_KEY: str` and `VAPID_PUBLIC_KEY: str`.

**VAPID public key delivery to frontend**: Add `GET /api/v1/habits/settings/vapid-public-key` endpoint that returns `{"public_key": settings.VAPID_PUBLIC_KEY}`. Frontend fetches this at push subscription time. No Vite build-time secret required. Add `VAPID_PRIVATE_KEY` and `VAPID_PUBLIC_KEY` to GitHub Secrets before production deployment.

### Alembic Migrations (3 files, ordered)

1. **Schema migration** (`XXXX_add_habits_tables.py`): Create ENUMs then 6 tables. `downgrade()` drops tables then ENUMs.
2. **Permissions seed** (`XXXX_add_habits_permissions.py`): Insert `features` row `name='habits'` + 4 permissions rows (create/read/update/delete). Assign all 4 to all admin-role users. Pattern from `f9c1d2e3f4a5_assign_all_permissions_to_admin_users.py`.
3. **Preset seed** (`XXXX_seed_preset_habits.py`): Insert ~25 preset rows across 5 categories (Health/Fitness/Mindfulness/Learning/Productivity). `downgrade()` deletes preset rows.

### Cockpit Card Addition

File: `cockpit-app/apps/cockpit/src/app/apps/apps.tsx`

Add to `ALL_APPS` array:
```typescript
{
  name: 'Habits',
  description: 'Track your daily habits with streaks, graphs, and push reminders.',
  url: environments.habitsUrl,
  Icon: Activity,  // from lucide-react
  feature: 'habits',
  action: 'read',
},
```

Add `habitsUrl: 'http://localhost:4208'` to `cockpit-app/libs/shared/utils/src/lib/environments/environments.ts`.

Import `Activity` from `lucide-react` in apps.tsx.

### Service Worker (`apps/habits/public/sw.js`)

Handles `push` events from browser Push API. Displays notification using `self.registration.showNotification()`. Minimal implementation — no caching needed. This is the first Service Worker in the codebase; register it in `apps/habits/src/main.tsx` via `navigator.serviceWorker.register('/sw.js')`.

### Docker + CI/CD

**`cockpit-app/apps/habits/Dockerfile`** — copy from cockpit:
```dockerfile
FROM nginx:alpine
COPY /dist/apps/habits /usr/share/nginx/html
COPY apps/habits/nginx/habits.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**`cockpit-app/apps/habits/nginx/habits.conf`** — copy cockpit.conf verbatim (same `try_files` SPA config).

**`.github/workflows/app-deploy.yml`** — add block after store section (lines ~179–180):
```yaml
- name: Check if habits build output exists
  id: habits_exists
  run: |
    if [ -d "dist/apps/habits" ]; then
      echo "exists=true" >> $GITHUB_OUTPUT
    else
      echo "exists=false" >> $GITHUB_OUTPUT
    fi
- name: Build and push Docker image for habits
  if: steps.habits_exists.outputs.exists == 'true'
  uses: docker/build-push-action@v6
  with:
    context: ./cockpit-app
    file: ./cockpit-app/apps/habits/Dockerfile
    push: true
    tags: |
      ghcr.io/${{ github.repository }}-habits:latest
      ghcr.io/${{ github.repository }}-habits:${{ github.sha }}
    platforms: linux/arm64
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

**`deployment-scripts/deploy-apps.sh`** — add to `declare -A apps` block:
```bash
[habits]="4208"
```

## Implementation Guidance

### Testing Approach

Follow project testing patterns:
- Backend: pytest with `asyncio_mode=auto`, tests in `cockpit-api/src/tests/habits/` directory (create `__init__.py`)
- Frontend: Vitest + jsdom, `.spec.ts(x)` co-located with source or in `__tests__/`, `@testing-library/react`
- 80% coverage gate enforced in CI — plan tests alongside each implementation group

**Priority test targets** (2–6 tests per step group):

| Step Group | Test Focus |
|---|---|
| streak_service.py | Pure function unit tests — soft break, hard break, freeze, weekly/N-day frequency, best_streak update |
| repository.py entry upsert | Unit test ON CONFLICT behavior — first insert creates, second insert updates |
| service.py freeze quota | Test 2/month limit enforcement — 2nd freeze passes, 3rd raises 422 |
| service.py type validation | Invalid column combos raise HTTP 422 (e.g. numeric_value on boolean habit) |
| router.py auth | Unauthenticated requests → 401 |
| HabitTile.tsx | Renders with correct color, shows streak badge only when streak_mode != 'none', tap triggers mutation |
| TodayPage.tsx | Groups by category, shows empty state when no habits, all-done state at N/N |
| HabitCreationSheet.tsx | Quick Add form validation, Browse Templates pre-fills form fields |
| useHabits / useEntryMutations | Zod schema parses response shape; mutation calls correct endpoint |

### Standards Compliance

- `cockpit-api/src/services/habits/` — follows backend architecture standard (3-layer, no layer skipping): `.maister/docs/standards/backend/architecture.md`
- All ORM models use `Mapped[T]` + `mapped_column()` per models standard: `.maister/docs/standards/backend/models.md`
- Repository uses parameterized queries only (no string interpolation): `.maister/docs/standards/backend/queries.md`
- All Alembic migrations are reversible with `downgrade()`: `.maister/docs/standards/backend/migrations.md`
- Frontend path aliases `@cockpit-app/*` — no relative cross-boundary imports: `.maister/docs/standards/frontend/architecture.md`
- Zod schema validation on all API responses via `fetcher()`: `.maister/docs/standards/frontend/components.md`
- PascalCase `.tsx` component files, camelCase `.ts` non-component files: `.maister/docs/standards/frontend/file-naming.md`
- `tags: ["scope:habits", "type:app"]` in `project.json`: `.maister/docs/standards/frontend/architecture.md`
- No speculative abstractions, no future stubs: `.maister/docs/standards/global/minimal-implementation.md`

## Out of Scope

- Mood tracking
- Vikunja / brain notes integration
- Native mobile app (PWA only)
- Social / sharing features
- Agent tab in habits app (standalone app, no cockpit sidebar)
- Per-habit graphs exported to PDF
- Habit templates created by users (user presets)

## Success Criteria

1. All daily habits logged in under 2 minutes on mobile (end-of-day batch)
2. All 3 habit types render with correct check-in UX and graph
3. Soft streak mode: single missed day does not break streak; second consecutive miss breaks it
4. Streak freeze: 2nd application in a month succeeds; 3rd is rejected with 422
5. Stats screen shows today's completion %, weekly bar chart, streak ranking
6. Browse Templates tab pre-fills Quick Add form without one-tap-adding
7. Push notification delivered within 1 minute of `reminder_time` in habit's timezone
8. All API endpoints return 401 for unauthenticated requests
9. Lighthouse mobile performance score ≥ 80
10. CI coverage gate passes (≥ 80% lines/functions/branches/statements for both apps)
11. Docker image builds for `linux/arm64` and deploys to `habits.parda.me` via existing CI/CD pipeline
