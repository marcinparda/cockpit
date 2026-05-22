# Implementation Plan: Habit Tracker App

## Overview

Total Steps: ~110
Task Groups: 9
Expected Tests: 34–58 (2–8 per implementation group + up to 10 in testing review)
Coverage Gate: ≥ 80% lines/functions/branches/statements (both cockpit-api and cockpit-app)

---

## Implementation Steps

---

### Task Group 1: Backend Foundation — Enums, Models, Migrations
**Dependencies:** None
**Estimated Steps:** 11

- [x] 1.0 Complete backend database foundation
  - [x] 1.1 Write 4 tests for ORM models and migration structure
    - Test `Habit` model instantiation with all required fields
    - Test `HabitEntry` unique constraint `(habit_id, logged_at)` is defined on model
    - Test `HabitCategory` unique constraint `(user_id, name)` is defined on model
    - Test `UserHabitSettings` unique `user_id` constraint is defined on model
    - Tests location: `cockpit-api/src/tests/habits/test_models.py`
  - [x] 1.2 Add `HABITS = "habits"` to `Features` enum
    - File: `cockpit-api/src/services/authorization/permissions/enums.py`
    - Append after existing feature entries; no other changes
  - [x] 1.3 Create `cockpit-api/src/services/habits/__init__.py` (empty)
  - [x] 1.4 Create `cockpit-api/src/services/habits/models.py`
    - All 6 ORM models extending `BaseModel` from `cockpit-api/src/common/models.py`
    - Use `Mapped[T]` + `mapped_column()` everywhere; never bare `Column()`
    - UUID PKs with `server_default=text('uuid_generate_v4()')`
    - Models: `Habit`, `HabitCategory`, `HabitEntry`, `HabitStreakFreeze`, `UserHabitSettings`, `PresetHabit`
    - All indexes, constraints, and FK relationships as specified in spec Data Models section
    - PostgreSQL ENUM columns use `sa.Enum(..., name='habit_type', create_type=False)` (migration creates types)
  - [x] 1.5 Create Alembic migration 1: schema (`a1b2c3d4e5f8_add_habits_tables.py`)
    - Create 3 PostgreSQL ENUMs first: `habit_type`, `frequency_type_enum`, `streak_mode_enum`
    - Create 6 tables in dependency order: `habit_categories` → `habits` → `habit_entries` → `habit_streak_freezes` → `user_habit_settings` → `preset_habits`
    - All FK indexes, UNIQUE constraints, and composite indexes from spec
    - `downgrade()`: drop tables in reverse order, then drop ENUMs
    - Follow header/structure of `cockpit-api/alembic/versions/05eac51d9014_*.py`
  - [x] 1.6 Create Alembic migration 2: permissions seed (`b2c3d4e5f6a9_add_habits_permissions.py`)
    - Insert `features` row: `name='habits'`
    - Insert 4 permissions rows: create/read/update/delete for habits feature
    - Assign all 4 to all users with admin role (pattern from `f9c1d2e3f4a5_assign_all_permissions_to_admin_users.py`)
    - `downgrade()`: remove inserted permissions and feature row
  - [x] 1.7 Create Alembic migration 3: preset seed (`c3d4e5f6a7b9_seed_preset_habits.py`)
    - Insert ~25 `preset_habits` rows across 5 categories: Health / Fitness / Mindfulness / Learning / Productivity
    - Realistic icons (Lucide icon name strings), colors (hex), types, default frequencies
    - `downgrade()`: delete all inserted preset rows by id
  - [x] 1.8 Create `cockpit-api/src/tests/habits/__init__.py` (empty)
  - [x] 1.9 Ensure models tests pass
    - Run: `cd cockpit-api && poetry run pytest src/tests/habits/test_models.py -v`
    - All 4 model structure tests pass

**Acceptance Criteria:**
- 4 model structure tests pass
- `Features.HABITS` enum value exists
- 3 Alembic migration files present with reversible `downgrade()`
- All 6 ORM models use `Mapped[T]` + `mapped_column()`

---

### Task Group 2: Backend Streak Service (Pure Functions)
**Dependencies:** Group 1
**Estimated Steps:** 8

- [x] 2.0 Complete streak_service.py with full unit test coverage
  - [x] 2.1 Write 8 tests for streak calculation logic
    - Test soft mode: one missed day does NOT break streak
    - Test soft mode: two consecutive missed days break streak
    - Test hard mode: one missed day breaks streak
    - Test none mode: always returns `current_streak = 0`
    - Test freeze: freeze date counts as neither completion nor miss; does not reset grace
    - Test weekly frequency: freeze covers entire ISO week
    - Test `best_streak` returns max of running count vs `habit.best_streak`
    - Test N-day custom interval frequency
    - Tests location: `cockpit-api/src/tests/habits/test_streak_service.py`
  - [x] 2.2 Create `cockpit-api/src/services/habits/streak_service.py`
    - `StreakResult` dataclass: `current_streak: int`, `best_streak: int`, `last_period_completed: bool`
    - `calculate_streak(habit, logged_dates, freeze_dates, today=None) -> StreakResult`
    - `_build_required_periods(habit, from_date, to_date) -> list[date]` — private helper
    - `_is_period_completed(period, logged_dates, frequency_type, frequency_value) -> bool` — private helper
    - Algorithm: build periods backward from today; walk checking completion/freeze/break per streak_mode
    - Soft grace flag resets on any completed period
    - No database access, no FastAPI imports — pure functions only
  - [x] 2.3 Ensure streak service tests pass
    - Run: `cd cockpit-api && poetry run pytest src/tests/habits/test_streak_service.py -v`
    - All 8 tests pass

**Acceptance Criteria:**
- 8 streak service tests pass
- `streak_service.py` has zero database or FastAPI imports
- All 3 streak modes (soft/hard/none) and all frequency types covered by tests

---

### Task Group 3: Backend Repository, Service, Router, Push Notifications
**Dependencies:** Groups 1, 2
**Estimated Steps:** 18

- [x] 3.0 Complete backend service layer and API endpoints
  - [x] 3.1 Write 6 tests for service and router behaviour
    - Test `POST /api/v1/habits/{id}/entries` upsert: second POST for same `(habit_id, logged_at)` updates, not duplicates
    - Test freeze quota: 2nd freeze in month succeeds, 3rd raises HTTP 422
    - Test type validation: `numeric_value` on boolean habit raises HTTP 422
    - Test unauthenticated `GET /api/v1/habits` returns 401
    - Test unauthenticated `POST /api/v1/habits` returns 401
    - Test `GET /api/v1/presets` returns 401 for unauthenticated request
    - Tests location: `cockpit-api/src/tests/habits/test_router.py`
  - [x] 3.2 Create `cockpit-api/src/services/habits/schemas.py`
    - Pydantic v2 request/response schemas for all entities
    - `HabitCreate`, `HabitUpdate`, `HabitResponse`, `HabitCategoryCreate`, `HabitCategoryResponse`
    - `HabitEntryCreate`, `HabitEntryResponse`, `StreakResponse`, `StatsResponse`
    - `UserHabitSettingsUpdate`, `UserHabitSettingsResponse`, `VapidPublicKeyResponse`
    - `PresetHabitResponse`
  - [x] 3.3 Create `cockpit-api/src/services/habits/repository.py`
    - Async SQLAlchemy queries only; no business logic
    - All CRUD operations for Habit, HabitCategory, HabitEntry, HabitStreakFreeze, UserHabitSettings
    - Entry upsert using raw `pg_insert().on_conflict_do_update()` (index_elements: `['habit_id', 'logged_at']`)
    - Fetch logged dates and freeze dates for streak calculation (return plain `list[date]`)
    - Stats queries: today completion count, weekly aggregates, streak ranking
    - Parameterized queries only — no string interpolation
  - [x] 3.4 Create `cockpit-api/src/services/habits/service.py`
    - Business logic, validation, streak update coordination
    - On entry creation: call `streak_service.calculate_streak()`, update `habit.best_streak` if new high
    - Freeze quota enforcement: count freezes in current calendar month; reject if already 2
    - Type validation: boolean habits reject `numeric_value`/`text_value`; numeric rejects `text_value`; etc.
    - All data scoped by `user_id` — service always passes `user_id` to repository
    - Sort order handling for categories and habits (reorder via individual PATCH calls)
  - [x] 3.5 Create `cockpit-api/src/services/habits/push_notification_service.py`
    - `async def send_due_push_notifications(db: AsyncSession) -> None`
    - Queries habits with `reminder_time` matching current minute in each habit's `timezone`
    - Sends push via `pywebpush` `webpush()` with VAPID keys from `settings`
    - Follows `token_cleanup_service` pattern (standalone async function, called by scheduler)
    - Add `pywebpush` to `cockpit-api/pyproject.toml` dependencies
  - [x] 3.6 Add VAPID config to `cockpit-api/src/core/config.py`
    - `VAPID_PRIVATE_KEY: str = ""` and `VAPID_PUBLIC_KEY: str = ""`
    - Use pydantic-settings `BaseSettings` pattern (existing pattern in config.py)
  - [x] 3.7 Create `cockpit-api/src/services/habits/router.py`
    - All endpoints with `require_permission(Features.HABITS, Actions.READ/CREATE/UPDATE/DELETE)` dependencies
    - `get_current_user` and `get_db` injected via `Depends()`
    - `async def` for all route functions
    - Endpoints:
      - `GET /habits` — list user's habits (filter by archived)
      - `POST /habits` — create habit
      - `GET /habits/{id}` — get habit detail with current streak
      - `PATCH /habits/{id}` — update (name, color, icon, sort_order, archived, category, reminder_time, timezone)
      - `DELETE /habits/{id}` — delete habit
      - `GET /habits/{id}/entries` — list entries (date range query params)
      - `POST /habits/{id}/entries` — upsert entry for a date
      - `DELETE /habits/{id}/entries/{entry_id}` — delete entry
      - `GET /habits/{id}/streak` — get current streak
      - `POST /habits/{id}/freezes` — apply streak freeze
      - `GET /habits/categories` — list categories
      - `POST /habits/categories` — create category
      - `PATCH /habits/categories/{id}` — update category (name, color, sort_order)
      - `DELETE /habits/categories/{id}` — delete category
      - `GET /habits/stats/today` — today completion %
      - `GET /habits/stats/weekly` — weekly bar chart data
      - `GET /habits/stats/streaks` — streak ranking
      - `GET /habits/stats/monthly-highlights` — monthly highlights
      - `GET /habits/settings` — get user push settings
      - `PATCH /habits/settings` — update push subscription / enable notifications
      - `GET /habits/settings/vapid-public-key` — return `{"public_key": settings.VAPID_PUBLIC_KEY}`
      - `GET /presets` — list preset habits
  - [x] 3.8 Register habits router in `cockpit-api/src/main.py`
    - Add: `from src.services.habits.router import router as habits_router`
    - Add: `app.include_router(habits_router, prefix="/api/v1")`
    - Place after existing router imports and mounts
  - [x] 3.9 Register push notification job in `cockpit-api/src/core/scheduler.py`
    - Add `_register_habits_push_task(self)` method to `TaskScheduler`
    - Job: `CronTrigger(minute='*')` calling `send_due_push_notifications(db)`
    - Call `self._register_habits_push_task()` in `start()` after token cleanup block
  - [x] 3.10 Ensure backend tests pass
    - Run: `cd cockpit-api && poetry run pytest src/tests/habits/ -v`
    - All 14 tests pass (4 model + 8 streak + 6 router/service)

**Acceptance Criteria:**
- 14 total backend tests pass
- All endpoints return 401 for unauthenticated requests
- Entry upsert uses `pg_insert().on_conflict_do_update()`
- Freeze quota enforced at 2/month in service layer
- Push notification job registered in scheduler

---

### Task Group 4: Frontend App Scaffold
**Dependencies:** Group 3 (backend must exist for API integration)
**Estimated Steps:** 13

- [x] 4.0 Complete Nx React app scaffold with auth and routing
  - [x] 4.1 Write 3 tests for app scaffold
    - Test `app.tsx` redirects to login (mocking 401 `useUser` response) — no habits UI rendered
    - Test `app.tsx` renders `<Outlet />` when `useUser` returns valid user
    - Test `BottomNav.tsx` renders 4 tabs with correct labels and links
    - Tests location: `cockpit-app/apps/habits/src/__tests__/`
  - [x] 4.2 Scaffold Nx app at `cockpit-app/apps/habits/`
    - `project.json` with `tags: ["scope:habits", "type:app"]` — copy cockpit pattern
    - `vite.config.ts` with port 4208, `@cockpit-app/*` path aliases, `@tailwindcss/vite` plugin
    - `index.html`, `tsconfig.json` (strict: true, ES2022)
    - Add Recharts to `cockpit-app/package.json` if not present
    - Verify `lucide-react`, `@dnd-kit/core`, `@dnd-kit/sortable` already in `package.json`
  - [x] 4.3 Create `apps/habits/src/main.tsx`
    - `QueryClientProvider` wrapping root with `tanstackQueryClient`
    - `ThemeProvider` (if cockpit uses one)
    - Service Worker registration: `navigator.serviceWorker.register('/sw.js')`
    - `Toaster` component mount
  - [x] 4.4 Create `apps/habits/src/app/app.tsx`
    - Auth guard using `useUser` hook from `@cockpit-app/react-shared-data-access`
    - Unauthenticated state → call `logout()` → redirect to login (cockpit app pattern)
    - Authenticated state → render `<RouterProvider>` / `<Outlet />`
  - [x] 4.5 Create `apps/habits/src/app/router.tsx`
    - React Router v6 with routes: `/` → `TodayPage`, `/habits` → `HabitsPage`, `/stats` → `StatsPage`, `/settings` → `SettingsPage`, `/habits/:id` → `HabitDetailPage`
  - [x] 4.6 Create `apps/habits/src/components/BottomNav.tsx`
    - 4-tab sticky bottom nav: Today (Home icon), Habits (List icon), Stats (BarChart icon), Settings (Settings icon)
    - Active tab highlighted; uses React Router `NavLink`
    - Mobile-first: full-width sticky bottom, `z-50`
  - [x] 4.7 Create `apps/habits/src/api/endpoints.ts`
    - SCREAMING_SNAKE_CASE endpoint constants for all API paths
    - `HABITS_ENDPOINTS`, `CATEGORIES_ENDPOINTS`, `ENTRIES_ENDPOINTS`, `STATS_ENDPOINTS`, `SETTINGS_ENDPOINTS`, `PRESETS_ENDPOINTS`
  - [x] 4.8 Create `apps/habits/src/api/schemas.ts`
    - Zod schemas for all API response/request shapes matching backend schemas
    - `HabitSchema`, `HabitCategorySchema`, `HabitEntrySchema`, `StreakResponseSchema`, `StatsSchema`, `PresetHabitSchema`, `UserHabitSettingsSchema`
  - [x] 4.9 Add `habitsUrl` to environments
    - File: `cockpit-app/libs/shared/utils/src/lib/environments/environments.ts`
    - Add `habitsUrl: 'http://localhost:4208'` to environments object
  - [x] 4.10 Create stub page components (render placeholder `<div>` only)
    - `apps/habits/src/pages/TodayPage.tsx`
    - `apps/habits/src/pages/HabitsPage.tsx`
    - `apps/habits/src/pages/StatsPage.tsx`
    - `apps/habits/src/pages/SettingsPage.tsx`
    - `apps/habits/src/pages/HabitDetailPage.tsx`
  - [x] 4.11 Create `apps/habits/public/sw.js`
    - Handles `push` event: calls `self.registration.showNotification()` with `event.data.json()`
    - Minimal implementation — no caching logic
  - [x] 4.12 Ensure scaffold tests pass
    - Run: `cd cockpit-app && npx nx test habits --testPathPattern='__tests__'`
    - All 3 scaffold tests pass

**Acceptance Criteria:**
- 3 scaffold tests pass
- App builds without errors: `npx nx build habits`
- Auth guard pattern matches cockpit app
- All 5 routes defined
- `sw.js` present in `public/`

---

### Task Group 5: Frontend Today View + Check-in UX
**Dependencies:** Group 4
**Estimated Steps:** 16

- [x] 5.0 Complete Today tab with habit grid and all 3 check-in types
  - [x] 5.1 Write 6 tests for Today view components
    - Test `HabitTile` renders with correct `habit.color` as border when uncompleted
    - Test `HabitTile` shows streak badge only when `streak_mode !== 'none'`
    - Test `HabitTile` completed state: filled background + checkmark class applied
    - Test `TodayPage` groups habits by category in correct order
    - Test `TodayPage` shows empty state when habits array is empty
    - Test `TodayPage` shows all-done state when all habits have entries for today
    - Tests location: `cockpit-app/apps/habits/src/__tests__/today.spec.tsx`
  - [x] 5.2 Create `apps/habits/src/api/hooks/useHabits.ts`
    - `useQuery` calling `GET /api/v1/habits` via `fetcher()` with `HabitSchema.array()`
    - Cache key: `['habits']`
  - [x] 5.3 Create `apps/habits/src/api/hooks/useEntryMutations.ts`
    - `useMutation` for `POST /api/v1/habits/:id/entries` (upsert entry)
    - `useMutation` for `DELETE /api/v1/habits/:id/entries/:entryId`
    - Invalidates `['habits']` and `['habit', id]` on success
  - [x] 5.4 Create `apps/habits/src/components/StreakBadge.tsx`
    - Flame icon (Lucide) + streak count
    - Small badge positioned top-right of tile
    - Hidden when `streak_mode === 'none'` or `current_streak === 0`
  - [x] 5.5 Create `apps/habits/src/icons/index.ts`
    - Export map: `Record<string, LucideIcon>` keyed by icon name string
    - Curated ~30 Lucide icons: Running, Moon, Droplets, Activity, Heart, Dumbbell, Book, Coffee, Music, Brain, Sun, Star, Zap, Target, Clock, Bike, Flame, Leaf, Pencil, Camera, Pill, Apple, Glasses, Meditation, Walk, Smile, Water, Code, Sleep, Journal
    - Import each from `lucide-react` and re-export in map
  - [x] 5.6 Create `apps/habits/src/components/HabitTile.tsx`
    - 80×80px tile (Tailwind `w-20 h-20`)
    - Icon (32px centered) from `icons/index.ts` by `habit.icon` key
    - Truncated name (12px, 1 line, ellipsis)
    - `StreakBadge` top-right corner
    - Uncompleted: muted bg + `habit.color` outline border
    - Completed: `habit.color` filled bg + checkmark overlay
    - CSS `transition-colors duration-300`
    - `onClick` triggers entry mutation (boolean = toggle, others = open Sheet)
    - `onLongPress` (300ms threshold) navigates to `/habits/:id`
  - [x] 5.7 Create `apps/habits/src/components/HabitSheet.tsx`
    - Bottom Sheet dispatcher for check-in types
    - Numeric (50vh): number input + target progress bar + confirm button
    - Text diary (90vh): auto-focused textarea + auto-save on blur + character count
    - Both types call `useEntryMutations` on confirm/save
    - Uses shadcn Sheet from `@cockpit-app/shared-react-ui` (or inline if not available)
  - [x] 5.8 Create `apps/habits/src/components/ConfettiAnimation.tsx`
    - CSS/canvas confetti burst triggered when all habits completed
    - Short animation (1-2 seconds), then unmounts
  - [x] 5.9 Implement `apps/habits/src/pages/TodayPage.tsx`
    - Sticky header: today's date + completion counter `N/M`
    - Habit grid grouped by category (habits without category in "Uncategorized" group)
    - `HabitTile` grid: `grid-cols-4` on mobile
    - Empty state when no habits
    - All-done state (all M habits logged): show `ConfettiAnimation` once, then celebration message
    - Loads today's entries alongside habits to compute completed set
  - [x] 5.10 Ensure Today view tests pass
    - Run: `cd cockpit-app && npx nx test habits --testPathPattern='today'`
    - All 6 tests pass

**Acceptance Criteria:**
- 6 Today view tests pass
- All 3 check-in types functional (boolean toggle, numeric Sheet, text Sheet)
- Habit grid groups by category
- Empty and all-done states render correctly
- Long-press navigates to detail page

---

### Task Group 6: Frontend Habits Management Tab
**Dependencies:** Group 5
**Estimated Steps:** 16

- [x] 6.0 Complete Habits tab with CRUD, categories, and drag-to-reorder
  - [x] 6.1 Write 5 tests for Habits tab components
    - Test `HabitCreationSheet` Quick Add form validation: name required, type required
    - Test `HabitCreationSheet` Browse Templates tab pre-fills form fields (does not auto-add)
    - Test `IconPicker` renders curated icon list and calls `onSelect` on click
    - Test `SortableHabitRow` renders drag handle and habit name
    - Test `HabitsPage` shows archive toggle and filters correctly
    - Tests location: `cockpit-app/apps/habits/src/__tests__/habits.spec.tsx`
  - [x] 6.2 Create `apps/habits/src/api/hooks/useCategories.ts`
    - `useQuery` for `GET /api/v1/habits/categories`
    - Mutations: create, update, delete category
    - All mutations invalidate `['categories']`
  - [x] 6.3 Create `apps/habits/src/api/hooks/useHabitMutations.ts`
    - `useMutation` for create, update, delete, archive (PATCH `is_archived: true`) habit
    - `useMutation` for PATCH `sort_order` (called per-item after drag)
    - All invalidate `['habits']`
  - [x] 6.4 Create `apps/habits/src/api/hooks/usePresets.ts`
    - `useQuery` for `GET /api/v1/presets` with `PresetHabitSchema.array()`
    - Cache key: `['presets']`
  - [x] 6.5 Create `apps/habits/src/components/IconPicker.tsx`
    - Horizontal scroll row of icons from `icons/index.ts`
    - Selected icon highlighted with `habit.color` border
    - `onSelect(iconKey: string)` callback
  - [x] 6.6 Create `apps/habits/src/components/HabitCreationSheet.tsx`
    - 85vh bottom Sheet with two tabs: Quick Add | Browse Templates
    - Quick Add: name input, type select (boolean/numeric/text), icon picker, color picker (8 hex swatches), category select, frequency select, target value (numeric only), reminder time, streak mode select
    - Browse Templates: grid of `PresetHabit` cards; click pre-fills Quick Add form (does NOT create habit)
    - Form validation: name required (max 100 chars), type required
    - On submit: calls `useHabitMutations` create, closes Sheet, invalidates habits
    - Edit mode: pre-fills from existing habit, PATCH on submit
  - [x] 6.7 Create `apps/habits/src/components/SortableHabitRow.tsx`
    - `useSortable` hook from `@dnd-kit/sortable`
    - Drag handle (GripVertical Lucide icon) on left
    - Habit icon + name + category badge
    - Archive / edit action menu
  - [x] 6.8 Create `apps/habits/src/components/SortableCategoryGroup.tsx`
    - `DndContext` + `SortableContext` wrapper per category group
    - Full group drag (category header is draggable)
    - `onDragEnd`: call PATCH `sort_order` for each reordered item individually
  - [x] 6.9 Implement `apps/habits/src/pages/HabitsPage.tsx`
    - Active habits list grouped by category using `SortableCategoryGroup` + `SortableHabitRow`
    - Archive toggle button to show/hide archived habits
    - FAB or header button → opens `HabitCreationSheet` in create mode
    - Drag-to-reorder categories (full group) AND habits within a category
    - Each drag-end sends individual PATCH `/{id}` with new `sort_order`
  - [x] 6.10 Ensure Habits tab tests pass
    - Run: `cd cockpit-app && npx nx test habits --testPathPattern='habits'`
    - All 5 tests pass

**Acceptance Criteria:**
- 5 Habits tab tests pass
- Quick Add form validated (name + type required)
- Browse Templates pre-fills form, does not auto-create
- Drag-to-reorder works for categories and habits within a category
- Each reorder sends individual PATCH per item

---

### Task Group 7: Frontend Stats, Settings, Push Notifications
**Dependencies:** Group 5
**Estimated Steps:** 12

- [x] 7.0 Complete Stats screen, Settings screen, and push notification subscription
  - [x] 7.1 Write 4 tests for Stats and Settings
    - Test `StatsPage` renders today completion % from API data
    - Test `StatsPage` renders weekly bar chart component
    - Test `SettingsPage` push toggle calls `PATCH /api/v1/habits/settings` on change
    - Test `useSettings` hook parses response with `UserHabitSettingsSchema`
    - Tests location: `cockpit-app/apps/habits/src/__tests__/stats-settings.spec.tsx`
  - [x] 7.2 Create `apps/habits/src/api/hooks/useStats.ts`
    - `useQuery` for today stats, weekly, streak ranking, monthly highlights
    - Separate query keys: `['stats', 'today']`, `['stats', 'weekly']`, `['stats', 'streaks']`, `['stats', 'monthly']`
  - [x] 7.3 Create `apps/habits/src/api/hooks/useSettings.ts`
    - `useQuery` for `GET /api/v1/habits/settings`
    - `useMutation` for `PATCH /api/v1/habits/settings`
  - [x] 7.4 Create `apps/habits/src/api/hooks/useFreezeMutations.ts`
    - `useMutation` for `POST /api/v1/habits/{id}/freezes`
    - Invalidates `['habit', id]` and `['habits']` on success
  - [x] 7.5 Implement `apps/habits/src/pages/StatsPage.tsx`
    - Today's completion % (large number display)
    - Weekly bar chart using Recharts `BarChart` (one bar per day, height = completion %)
    - Streak ranking: sorted list of habits by current streak, flame icon + count
    - Monthly highlights: longest streak this month, most consistent habit
  - [x] 7.6 Implement `apps/habits/src/pages/SettingsPage.tsx`
    - Push notifications toggle (on/off)
    - When toggled on: fetch VAPID public key (`GET /api/v1/habits/settings/vapid-public-key`), call `navigator.serviceWorker.ready.pushManager.subscribe()`, PATCH settings with subscription
    - Timezone display (read-only, shows detected timezone)
    - Notifications permission prompt handled before subscription
  - [x] 7.7 Ensure Stats and Settings tests pass
    - Run: `cd cockpit-app && npx nx test habits --testPathPattern='stats-settings'`
    - All 4 tests pass

**Acceptance Criteria:**
- 4 stats/settings tests pass
- Stats screen renders completion %, weekly chart, streak ranking, monthly highlights
- Settings push toggle triggers full subscription flow (VAPID fetch → subscribe → PATCH)
- Push subscription sent to backend with correct format

---

### Task Group 8: Frontend Habit Detail Page + Graphs
**Dependencies:** Groups 5, 7
**Estimated Steps:** 13

- [x] 8.0 Complete per-habit detail page with type-appropriate graphs
  - [x] 8.1 Write 4 tests for detail page and graph components
    - Test `HeatmapCalendar` renders correct number of cells for a 12-week range
    - Test `LineBarChart` renders with provided data (smoke test, no crash)
    - Test `HabitDetailPage` shows freeze button with correct remaining count
    - Test `HabitDetailPage` renders correct graph component based on `habit.type`
    - Tests location: `cockpit-app/apps/habits/src/__tests__/detail.spec.tsx`
  - [x] 8.2 Create `apps/habits/src/api/hooks/useHabitDetail.ts`
    - `useQuery` for `GET /api/v1/habits/:id` with streak included
    - Cache key: `['habit', id]`
  - [x] 8.3 Create `apps/habits/src/api/hooks/useHabitEntries.ts`
    - `useQuery` for `GET /api/v1/habits/:id/entries` with date range params
    - Cache key: `['habit', id, 'entries', dateRange]`
  - [x] 8.4 Create `apps/habits/src/api/hooks/useHabitStreak.ts`
    - `useQuery` for `GET /api/v1/habits/:id/streak`
    - Cache key: `['habit', id, 'streak']`
  - [x] 8.5 Create `apps/habits/src/components/HeatmapCalendar.tsx`
    - GitHub contribution-style heatmap for boolean habits
    - CSS grid: 12 weeks × 7 days = 84 cells
    - Cell color intensity based on completion (filled / empty / partial)
    - Plain CSS grid implementation (no additional library)
  - [x] 8.6 Create `apps/habits/src/components/LineBarChart.tsx`
    - Recharts `ComposedChart` with `Bar` (daily value) + `Line` (rolling average)
    - Reference line at `habit.target_value`
    - For numeric habits
  - [x] 8.7 Implement `apps/habits/src/pages/HabitDetailPage.tsx`
    - Header: habit icon + name + color + edit button (opens `HabitCreationSheet` in edit mode)
    - Streak section: current streak + best streak + streak mode badge
    - Freeze button: "Apply Freeze" with remaining count `(2 - used this month)` shown; calls `useFreezeMutations`
    - Time range selector: 5 options (1W / 1M / 3M / 6M / 1Y)
    - Graph section: renders `HeatmapCalendar` for boolean, `LineBarChart` for numeric, text diary timeline for text
    - Entry log: recent entries list with date, value, delete button
  - [x] 8.8 Ensure detail page tests pass
    - Run: `cd cockpit-app && npx nx test habits --testPathPattern='detail'`
    - All 4 tests pass

**Acceptance Criteria:**
- 4 detail page tests pass
- Boolean habit shows `HeatmapCalendar`, numeric shows `LineBarChart`, text shows timeline
- Freeze button shows remaining count and calls freeze mutation
- Time range selector changes graph data range
- Edit button opens `HabitCreationSheet` pre-filled

---

### Task Group 9: Integration, Cockpit Card, Docker, CI/CD
**Dependencies:** All previous groups
**Estimated Steps:** 10

- [x] 9.0 Complete integration, deployment artifacts, and cockpit card
  - [x] 9.1 Write 3 integration tests
    - Test cockpit `apps.tsx` includes habits entry in `ALL_APPS` with correct `feature: 'habits'`
    - Test `environments.ts` exports `habitsUrl`
    - Test Docker build completes without error (shell test: `docker build --dry-run` or verify `Dockerfile` syntax)
    - Tests location: `cockpit-app/apps/cockpit/src/__tests__/habits-integration.spec.ts`
  - [x] 9.2 Add habits entry to cockpit apps grid
    - File: `cockpit-app/apps/cockpit/src/app/apps/apps.tsx`
    - Add to `ALL_APPS` array:
      ```typescript
      {
        name: 'Habits',
        description: 'Track your daily habits with streaks, graphs, and push reminders.',
        url: environments.habitsUrl,
        Icon: Activity,
        feature: 'habits',
        action: 'read',
      }
      ```
    - Add `import { Activity } from 'lucide-react'` if not already imported
  - [x] 9.3 Create `cockpit-app/apps/habits/Dockerfile`
    - Copy cockpit Dockerfile verbatim
    - Change `dist/apps/cockpit` → `dist/apps/habits`
    - Change `cockpit.conf` → `habits.conf`
  - [x] 9.4 Create `cockpit-app/apps/habits/nginx/habits.conf`
    - Copy `cockpit-app/apps/cockpit/nginx/cockpit.conf` verbatim
    - Same SPA `try_files` fallback config
  - [x] 9.5 Add habits block to `.github/workflows/app-deploy.yml`
    - Check step + build-and-push step after store section (~lines 179–180)
    - Image: `ghcr.io/${{ github.repository }}-habits:latest` and `...-habits:${{ github.sha }}`
    - Platform: `linux/arm64`
    - Context: `./cockpit-app`, file: `./cockpit-app/apps/habits/Dockerfile`
  - [x] 9.6 Add `[habits]="4208"` to `deployment-scripts/deploy-apps.sh`
    - In the `declare -A apps` block
    - Correct port: 4208 (spec) not 4206 (gap-analysis had a typo)
  - [x] 9.7 Run full backend test suite
    - Run: `cd cockpit-api && poetry run pytest src/tests/ -v`
    - All existing tests still pass (regression check)
    - Habits tests: 14 total pass
  - [x] 9.8 Run full frontend test suite for habits app
    - Run: `cd cockpit-app && npx nx test habits --coverage`
    - All 22 habits tests pass
    - Coverage report generated (verify ≥ 80% threshold met)
  - [x] 9.9 Verify habits app builds
    - Run: `cd cockpit-app && npx nx build habits`
    - Build completes without errors
    - `dist/apps/habits/` directory created with `sw.js` included
  - [x] 9.10 Ensure integration tests pass
    - Run: `cd cockpit-app && npx nx test cockpit --testPathPattern='habits-integration'`
    - All 3 integration tests pass

**Acceptance Criteria:**
- 3 integration tests pass
- Cockpit apps grid shows Habits card
- Dockerfile and nginx.conf present and correct
- CI/CD workflow updated with habits block
- `deploy-apps.sh` updated with port 4208
- Full backend suite passes without regression
- Full habits frontend test suite passes
- `npx nx build habits` succeeds

---

### Task Group 10: Test Review and Gap Analysis
**Dependencies:** All previous groups (1–9)
**Estimated Steps:** 5

- [x] 10.0 Review and fill critical test gaps
  - [x] 10.1 Review all tests from groups 1–9 (22 frontend + 14 backend = 36 existing tests)
  - [x] 10.2 Analyze gaps for the habits feature specifically:
    - Any streak edge case not covered (e.g. custom_days_per_week with gaps)
    - Any API endpoint not covered by tests
    - Any UI state not covered (loading skeletons, error states)
    - Coverage report output from Group 9 to identify uncovered branches
  - [x] 10.3 Write up to 10 additional strategic tests targeting:
    - Backend: `streak_service` for `custom_days_per_week` frequency edge case
    - Backend: `service.py` user_id scoping (habit belonging to other user returns 404)
    - Frontend: `HabitSheet` numeric type renders target progress bar
    - Frontend: `HabitSheet` text type auto-saves on blur
    - Frontend: `SettingsPage` renders error when push permission denied
    - Frontend: `useHabitMutations` archive mutation sends `PATCH` with `is_archived: true`
  - [x] 10.4 Run full test suite for both projects
    - Run: `cd cockpit-api && poetry run pytest src/tests/ --cov=src --cov-report=term`
    - Run: `cd cockpit-app && npx nx run-many --target=test --all --coverage`
    - All feature tests pass (36 + up to 10 additional = up to 46 total)
    - Backend coverage ≥ 80% for habits service
    - Frontend coverage ≥ 80% for habits app

**Acceptance Criteria:**
- All feature tests pass (~36–46 total)
- No more than 10 additional tests added in this group
- Both projects meet ≥ 80% coverage gate
- No regressions in non-habits tests

---

## Execution Order

1. Group 1: Backend Foundation — Enums, Models, Migrations (11 steps, no dependencies)
2. Group 2: Backend Streak Service (8 steps, depends on 1)
3. Group 3: Backend Repository, Service, Router, Push Notifications (18 steps, depends on 1, 2)
4. Group 4: Frontend App Scaffold (13 steps, depends on 3)
5. Group 5: Frontend Today View + Check-in UX (16 steps, depends on 4)
6. Group 6: Frontend Habits Management Tab (16 steps, depends on 5)
7. Group 7: Frontend Stats, Settings, Push Notifications (12 steps, depends on 5)
8. Group 8: Frontend Habit Detail Page + Graphs (13 steps, depends on 5, 7)
9. Group 9: Integration, Cockpit Card, Docker, CI/CD (10 steps, depends on 1–8)
10. Group 10: Test Review and Gap Analysis (5 steps, depends on 1–9)

---

## Test Count Summary

| Group | Tests Written | Cumulative |
|-------|-------------|------------|
| 1 — Backend Foundation | 4 | 4 |
| 2 — Streak Service | 8 | 12 |
| 3 — Backend Service/Router | 6 | 18 |
| 4 — Frontend Scaffold | 3 | 21 |
| 5 — Today View | 6 | 27 |
| 6 — Habits Tab | 5 | 32 |
| 7 — Stats + Settings | 4 | 36 |
| 8 — Detail + Graphs | 4 | 40 |
| 9 — Integration | 3 | 43 |
| 10 — Gap Analysis | up to 10 | up to 53 |

Expected total: **43–53 tests**. All must pass before marking complete.

---

## Standards Compliance

Follow standards from `.maister/docs/standards/`:

**Global (always applicable)**
- `global/coding-style.md` — 2-space indentation, UTF-8, final newline, no trailing whitespace
- `global/minimal-implementation.md` — no speculative abstractions, no future stubs
- `global/conventions.md` — conventional commits, feature branch, no dead code
- `global/error-handling.md` — typed exceptions, fail-fast validation
- `global/containers.md` — `nginx:alpine`, `linux/arm64`, multi-stage for Python API

**Backend**
- `standards/backend/architecture.md` — strict 3-layer (router → service → repository), no cross-layer skipping
- `standards/backend/models.md` — `Mapped[T]` + `mapped_column()`, UUID PKs, TimestampMixin
- `standards/backend/queries.md` — parameterized queries only, no string interpolation
- `standards/backend/migrations.md` — always reversible with `downgrade()`, one logical change per file
- `standards/backend/api.md` — `/api/v1/` prefix, `fastapi.status` constants, `HTTPException` in service layer

**Frontend**
- `standards/frontend/architecture.md` — `@cockpit-app/*` aliases, never relative cross-boundary imports, `tags` in `project.json`
- `standards/frontend/components.md` — Zod schema on all API responses via `fetcher()`, TanStack Query for server state, SCREAMING_SNAKE_CASE endpoint constants
- `standards/frontend/file-naming.md` — PascalCase for `.tsx`, camelCase for `.ts`, `use` prefix on hooks
- `standards/frontend/typescript.md` — `strict: true`, `interface` for object shapes, `type` for unions/Zod-inferred

**Testing**
- `standards/testing/test-writing.md` — pytest `asyncio_mode=auto`, Vitest + jsdom, `.spec.ts(x)` suffix, ≥ 80% coverage

---

## Notes

- **Test-Driven**: Each group starts with 2–8 tests before implementation code
- **Run Incrementally**: After each group, run only that group's new tests — not the entire suite
- **Mark Progress**: Check off steps as completed using the checkboxes above
- **Reuse First**: All shared utilities (`fetcher`, `baseApi`, `useUser`, `logout`, `Button`, etc.) come from existing libs — never duplicate
- **Port**: 4208 (confirmed in spec; gap-analysis had a typo of 4206 — ignore that)
- **Entry Upsert**: Must use `pg_insert().on_conflict_do_update()` — not `session.add()` (SQLModel limitation)
- **VAPID keys**: Required in GitHub Secrets before production push notifications work; app functions without them (notifications disabled)
- **Service Worker**: First SW in the codebase — register in `main.tsx`, handle `push` event in `sw.js`
- **Drag-to-reorder**: Habits tab only — not on Today tab. Each reorder sends individual PATCH per item, no bulk endpoint
