# Feature Specification — Habit Tracker App

---

## Section 1: Data Models

### habits
```sql
habits
  id: UUID PK (uuid_generate_v4())
  user_id: UUID FK → users.id NOT NULL
  name: VARCHAR(100) NOT NULL
  icon: VARCHAR(50) NOT NULL          -- emoji or icon key (e.g. "🏃" or "running")
  color: VARCHAR(7)                   -- hex color e.g. "#22c55e"
  type: ENUM('boolean','numeric','text') NOT NULL
  frequency_type: ENUM('daily','weekly','custom_days_per_week','custom_interval') NOT NULL DEFAULT 'daily'
  frequency_value: INT                -- NULL for daily; N for N-times/week or every-N-days
  target_value: FLOAT                 -- optional; numeric habits only
  target_unit: VARCHAR(20)            -- e.g. 'hours', 'glasses', 'km'
  streak_mode: ENUM('none','soft','hard') NOT NULL DEFAULT 'soft'
  -- text habits default to 'none' (set in service layer on creation)
  reminder_time: TIME                 -- optional; local time for push notification
  timezone: VARCHAR(50)               -- user timezone for day boundary (e.g. 'Europe/Warsaw')
  category_id: UUID FK → habit_categories.id  -- nullable
  is_archived: BOOL NOT NULL DEFAULT false
  sort_order: INT NOT NULL DEFAULT 0
  created_at: TIMESTAMP NOT NULL DEFAULT now()
  updated_at: TIMESTAMP NOT NULL DEFAULT now()

INDEX: habits(user_id)
INDEX: habits(user_id, category_id)
INDEX: habits(user_id, is_archived)
```

### habit_categories
```sql
habit_categories
  id: UUID PK
  user_id: UUID FK → users.id NOT NULL
  name: VARCHAR(50) NOT NULL
  color: VARCHAR(7)
  sort_order: INT NOT NULL DEFAULT 0
  created_at: TIMESTAMP NOT NULL DEFAULT now()

UNIQUE(user_id, name)
INDEX: habit_categories(user_id)
```

### habit_entries
```sql
habit_entries
  id: UUID PK
  habit_id: UUID FK → habits.id NOT NULL
  user_id: UUID FK → users.id NOT NULL
  logged_at: DATE NOT NULL            -- user-local date the entry belongs to
  created_at: TIMESTAMP NOT NULL      -- actual server timestamp of creation
  -- value columns: only one group populated per entry, based on habit.type
  boolean_value: BOOL
  numeric_value: FLOAT
  numeric_unit: VARCHAR(20)
  text_value: TEXT

UNIQUE(habit_id, logged_at)           -- one entry per habit per day; use upsert (ON CONFLICT DO UPDATE)
INDEX: habit_entries(habit_id, logged_at DESC)
INDEX: habit_entries(user_id, logged_at DESC)
```

### habit_streak_freezes
```sql
habit_streak_freezes
  id: UUID PK
  habit_id: UUID FK → habits.id NOT NULL
  user_id: UUID FK → users.id NOT NULL
  freeze_date: DATE NOT NULL
  created_at: TIMESTAMP NOT NULL

UNIQUE(habit_id, freeze_date)
INDEX: habit_streak_freezes(habit_id)
```

### user_habit_settings

```sql
user_habit_settings
  id: UUID PK
  user_id: UUID FK → users.id NOT NULL UNIQUE
  push_subscription: JSONB            -- Web Push API PushSubscription object
  notifications_enabled: BOOL NOT NULL DEFAULT false
  created_at: TIMESTAMP NOT NULL
  updated_at: TIMESTAMP NOT NULL
```

### preset_habits (system table, seeded, no user_id)
```sql
preset_habits
  id: UUID PK
  name: VARCHAR(100) NOT NULL
  icon: VARCHAR(50) NOT NULL
  color: VARCHAR(7)
  type: ENUM('boolean','numeric','text') NOT NULL
  category_key: VARCHAR(50) NOT NULL  -- 'Health'|'Fitness'|'Mindfulness'|'Learning'|'Productivity'
  default_frequency_type: ENUM NOT NULL DEFAULT 'daily'
  default_target_value: FLOAT
  default_target_unit: VARCHAR(20)
  sort_order: INT NOT NULL DEFAULT 0
```

---

## Section 2: Habit Types & Check-In UX

### Habit Types

| Type | Completion criteria | Data stored | Default streak_mode |
|---|---|---|---|
| `boolean` | Entry exists for that day | `boolean_value = true` | `soft` |
| `numeric` | Entry exists; if `target_value` set → `numeric_value >= target_value`; if no target → entry exists | `numeric_value`, `numeric_unit` | `soft` |
| `text` | Entry exists with non-empty `text_value` | `text_value` | `none` |

Service layer enforces: only the correct nullable columns populated based on `habit.type`. Invalid combinations raise HTTP 422.

### Check-In Interactions

#### Boolean Habit Tile
1. Single tap → `POST /api/v1/habits/{id}/entries` with `{logged_at: today, boolean_value: true}`
2. Tile fills with `habit.color` + check icon animation (CSS transition, 300ms)
3. Completion bar updates (X/N today)
4. No confirmation dialog
5. **Undo**: long-press on completed tile → bottom confirmation sheet → `DELETE /api/v1/habits/{id}/entries/{logged_at}` → tile returns to unchecked

#### Numeric Habit Tile
1. Tap → shadcn `Sheet` slides up from bottom (50vh)
2. Header: `habit.icon` + `habit.name`
3. If `target_value`: progress bar + label (e.g. "3 / 8 glasses")
4. Large `<input type="number">` with +/− step buttons + numpad keyboard
5. Unit label inline if `target_unit` set
6. "Log" button → `POST /api/v1/habits/{id}/entries` → sheet closes → tile fills
7. Re-tapping already-logged tile: sheet opens pre-filled (upsert on save)

#### Text Habit Tile
1. Tap → shadcn `Sheet` (90vh) slides up
2. Auto-focused `<textarea>` with placeholder "What happened today?"
3. Auto-save on sheet dismiss if content non-empty
4. "Save" button also saves
5. Re-tapping re-opens with existing text for editing (upsert on save)

### Day Boundary
- "Today" = current date in `habit.timezone` (e.g. `Europe/Warsaw`)
- Client sends `logged_at` as `YYYY-MM-DD` (user's local date); server stores verbatim
- Grace period is client-controlled: client may send yesterday's date between 00:00–02:00 local time; server accepts any date ≤ today

### Re-logging Rules
- Numeric and text: re-tap → sheet pre-filled → save → `ON CONFLICT (habit_id, logged_at) DO UPDATE SET ...`
- Boolean: undo via long-press only; re-tap on completed tile = no-op

---

## Section 3: Home View & Navigation

### App Shell — Bottom Navigation
4 tabs (bottom bar, mobile-first):
1. **Today** — home, daily check-in grid
2. **Habits** — full habit list + management
3. **Stats** — cross-habit overview
4. **Settings** — notifications, timezone, account

No top navbar on mobile. Tab bar sticky at bottom with shadcn icons; active tab uses `habit` accent color.

### Today View (Home)

**Header** (sticky):
- Left: date label ("Thursday, 21 May")
- Right: completion bar + label ("6 / 8 today") with animated progress fill

**Grid body** (scrollable):
- Habits grouped by category; each group has a category label row (color dot + category name)
- Habit tile: 80×80px card
  - Large icon (centered, 32px)
  - Habit name (12px, below icon, truncated at 1 line)
  - Streak badge (top-right corner): streak count + flame icon; hidden if `streak_mode = 'none'`
  - Uncompleted: muted background, outline border in `habit.color`
  - Completed: filled background in `habit.color`, checkmark overlay
- Completed tiles animate to bottom of their category group (CSS transition)
- Tap → check-in interaction per type (see Section 2)
- Long-press → navigate to habit detail page

**All-done state**: confetti burst animation + "All done for today!" banner when completion reaches N/N.

**Empty state** (zero habits): centered illustration + "Start building habits" heading + "Add your first habit" CTA button.

### Floating Action Button (FAB)
- Positioned bottom-right, 16px above tab bar
- Opens habit creation Sheet (see Section 4)

### Habits Tab
- Full list of non-archived habits grouped by category
- Each row: icon (24px) + name + type chip (`boolean`/`numeric`/`text`) + streak count + `⋮` overflow menu
- Overflow menu: Edit | Archive | Delete (with confirmation)
- "Add category" button at bottom of list
- Drag-to-reorder: touch-friendly drag handle on each row; reorder within category only; updates `sort_order`
- "Show archived" toggle at bottom; archived habits shown in a separate section

### Navigation Flow
| From | Action | Result |
|---|---|---|
| Today | Tap tile | Check-in (instant or sheet) |
| Today | Long-press tile | Navigate to habit detail |
| Today | FAB | Open creation Sheet |
| Habits | Tap row | Navigate to habit detail |
| Habits | `⋮` → Edit | Open creation Sheet (pre-filled) |
| Stats | Tap habit row | Navigate to habit detail |

---

## Section 4: Habit Creation & Preset Library

### Creation Sheet
shadcn `Sheet` component, slides from bottom (~85vh). Two tabs at top: **Quick Add** | **Browse Templates**.

#### Quick Add Tab
Fields (in order):
1. **Icon picker**: horizontal scroll row of 30+ emoji options + "Custom emoji" freetext input
2. **Name**: `<input type="text">` required, max 100 chars
3. **Type**: 3 radio buttons — Boolean | Numeric | Text diary
4. **Frequency**: segmented control — Daily | Weekly | X/week | Every N days
   - "X/week": number stepper 1–7
   - "Every N days": day stepper 2–90
5. **Target** *(numeric type only)*: number input + unit text input (optional; e.g. "30" + "min")
6. **Category**: dropdown of user's categories + "New category..." option (inline mini-form: name + color swatch)
7. **Color**: 8 preset swatches (selectable; default = first unused swatch)
8. **Reminder**: time picker (optional; no date, just time — e.g. 21:00)
9. **Streak mode**: 3-option toggle — Soft | Hard | None; auto-selected default: `none` for Text, `soft` for Boolean/Numeric
10. **"Create Habit"** button → `POST /api/v1/habits` → sheet closes → habit appears in Today grid

#### Browse Templates Tab
- 5 category sections (accordion or flat): Health / Fitness / Mindfulness / Learning / Productivity
- Each section: horizontal scroll row of preset cards (icon + name, 64×64px)
- Tap preset card → populates Quick Add tab fields with preset defaults → switches to Quick Add tab
- User reviews/modifies before creating (never one-tap-adds; always reviews defaults)

### Edit Habit
- Same Sheet component, pre-filled. Opened from `⋮` → Edit on Habits tab.
- All fields editable **except `type`** (immutable after creation — changing type would invalidate entry history)
- `PATCH /api/v1/habits/{id}` on save

### Delete Habit
- `⋮` → Delete → confirmation Sheet: "Delete {name}? This will permanently delete all {N} logged entries."
- `DELETE /api/v1/habits/{id}` (cascades: entries, streak freezes)

### Archive Habit
- `⋮` → Archive → `PATCH /api/v1/habits/{id}` with `{is_archived: true}`
- Hides from Today grid and default Habits list; entries preserved
- Unarchive from "Show archived" section on Habits tab

### Category Management
- Create: "New category..." in dropdown → inline mini-form (name text + 8-color picker) → `POST /api/v1/categories`
- Edit: tap category label row on Habits tab → inline rename + color picker → `PATCH /api/v1/categories/{id}`
- Delete: only if no habits assigned to it; button disabled with tooltip "Remove habits from this category first"

---

## Section 5: Streak Mechanics

### Streak Modes

| Mode | Counter shown | Break condition |
|---|---|---|
| `soft` | Yes | 2+ consecutive missed required periods |
| `hard` | Yes | 1 missed required period |
| `none` | No | Never calculated |

### Streak Calculation (server-side, `streak_service.py`)

**Inputs**: `habit`, `logged_dates: list[date]`, `freeze_dates: list[date]`

**Algorithm**:
1. Build ordered list of "required periods" backward from today based on `frequency_type`:
   - `daily` → each calendar day
   - `weekly` → each ISO week (≥1 completion required)
   - `custom_days_per_week` (N) → each week (≥N completions required)
   - `custom_interval` (every N days) → each Nth day since `habit.created_at`
2. Walk backward through required periods:
   - Period has entry → streak++, continue
   - Period date in `freeze_dates` → skip (freeze applied), streak continues
   - Period has no entry AND no freeze:
     - `hard` → BREAK
     - `soft`, first consecutive miss → mark grace, continue
     - `soft`, second consecutive miss → BREAK
3. Return `{current_streak, best_streak, last_period_completed: bool}`

**Best streak** = stored in a separate daily-updated computation or re-computed from full history. Store in `habits.best_streak INT` column (denormalized, updated on each entry creation).

### Streak Freeze

- UI: habit detail page → "Apply freeze" → date picker (defaults to today or yesterday) → `POST /api/v1/habits/{id}/freezes`
- Limit: max 2 freeze uses per calendar month per habit (enforced in service layer)
- Display: "Freeze: 1/2 used this month" on habit detail page
- Cannot freeze a date that already has an entry
- Cannot freeze a future date

### Streak Display


- Today view tile: 🔥 flame icon + streak number, top-right corner of tile; hidden if `streak_mode = 'none'`
- Habit detail: "Current streak: N days" + "Best streak: N days" section below graph
- Non-daily habits: display "X weeks" not "X days"
- Milestones at 7 / 30 / 100 days (weeks for non-daily): confetti animation + banner toast "🔥 30-day streak!"
- Never show shaming copy on streak break; show: "Your previous streak was N days. Start a new one today."

---

## Section 6: Per-Habit Detail Page & Graphs

### Page Layout
Navigated to via long-press on Today tile or tap on Habits tab row.

**Header**: large icon + habit name + category chip + type badge + streak summary ("🔥 14 days · Best: 42")

**Time Range Switcher**: segmented control — Week | Month | 3 Months | Year | All time. Default: Month. Changing range re-fetches entries for that window.

### Graphs by Type

#### Boolean Habit
- Calendar heatmap (GitHub contribution-grid style): each day = 16×16px square
  - Filled with `habit.color`: completed
  - Muted gray: missed (required period with no entry)
  - Light outline: future / not yet due
  - ❄️ overlay: streak freeze applied
- Tap square → popover: date + "Completed" / "Missed" + streak freeze status
- Grid shows weeks as rows, days as columns (Mon–Sun), month labels above

#### Numeric Habit
- Line chart (primary): `numeric_value` on Y axis, date on X axis, dots on each logged day
  - If `target_value` set: dashed horizontal reference line labeled with target + unit
- Bar chart (secondary, below line chart): daily values as bars (same date range)
- Tap bar/dot → popover: date + `{numeric_value} {numeric_unit}` + "Target: X" + above/below indicator
- Days with no entry: gap in line, no bar

#### Text Diary Habit
- No graph
- Chronological scrollable timeline:
  - Date header row (bold)
  - Entry text preview (3-line truncated)
  - Tap entry → full-screen modal: date + full text + "Edit" + "Delete"

### Entry Log (all types)
- Below graph: scrollable list, newest first
- Each row: date (relative: "Yesterday") + value (✓ / "5.5 hours" / text preview)
- Tap row → same detail popover/modal as graph tap
- 20 entries per page; "Load more" pagination

### Streak Section (below entry log)
- "Current streak: N days" / "N weeks" for non-daily
- "Best streak: N days"
- Streak mode chip + gear icon → inline picker (Soft / Hard / None)
- "Apply streak freeze" → date picker → `POST /api/v1/habits/{id}/freezes`
- "Freezes this month: 1 / 2 used"

### API Endpoints Used
- `GET /api/v1/habits/{id}` — metadata + streak stats
- `GET /api/v1/habits/{id}/entries?from={date}&to={date}` — entries for range
- `GET /api/v1/habits/{id}/streak` — current + best streak

---

## Section 7: Stats Screen

Third tab in bottom nav. Cross-habit overview. Read-only (no logging from this screen).

### Today's Summary Card
- Large percentage: "75% complete" (completed / total active habits)
- Sub-label: "6 of 8 habits done"
- Progress ring visualization (arc from 0 to completion %)
- Tapping the card does nothing (it's a summary, not a navigation trigger)

### Weekly Overview (this ISO week)
- Horizontal bar chart: one bar per active habit
- Bar height: this week's completion rate (0–100%)
- Bar color: `habit.color`
- X axis: habit icon + name (rotated 45° if many habits)
- Tap bar → navigate to that habit's detail page
- Badge on bar: current streak count

### Streak Summary
- Ranked list: all active habits sorted by `current_streak` descending
- Each row: habit icon (24px) + name + streak count + flame icon + streak mode chip
- Tap row → habit detail page
- Zero-streak habits shown at bottom (motivator to re-engage)

### This Month Highlights
Three stat chips (pills):
1. 🏆 "Best streak: {habit name} — N days"
2. 📈 "Most consistent: {habit name} — N/M days this month"
3. ⚠️ "Needs attention: {habit name} — last done N days ago"

### API Endpoints Used
- `GET /api/v1/stats/today` → `{total, completed, percentage}`
- `GET /api/v1/stats/weekly` → `[{habit_id, habit_name, habit_color, habit_icon, completion_rate, streak}]`
- `GET /api/v1/stats/streaks` → `[{habit_id, habit_name, ..., current_streak, streak_mode}]` sorted desc
- `GET /api/v1/stats/monthly-highlights` → `{best_streak, most_consistent, needs_attention}` each `{habit_id, habit_name, value}`

---

## Section 8: Backend API & Auth

### Authentication
- Cookie-based session auth; all endpoints require valid session cookie
- Unauthenticated requests → 401; frontend redirects to `/login` app
- All endpoints use `require_permission(Features.HABITS)` dependency (same pattern as other services)
- Frontend: `credentials: 'include'` on all API calls via TanStack Query fetcher

### API Module Structure
```
cockpit-api/src/services/habits/
  router.py           # FastAPI router, mounts at /api/v1/
  service.py          # Business logic, validation, orchestration
  repository.py       # SQLAlchemy queries
  models.py           # SQLModel ORM models
  schemas.py          # Pydantic v2 request/response schemas
  streak_service.py   # Isolated streak calculation (pure functions, testable)
```

### Endpoints

```
# Habits CRUD
GET    /api/v1/habits                        → list habits + today's entry status for each
POST   /api/v1/habits                        → create habit
GET    /api/v1/habits/{id}                   → habit detail + streak stats
PATCH  /api/v1/habits/{id}                   → update habit (type field immutable)
DELETE /api/v1/habits/{id}                   → delete + cascade entries + freezes

# Entries
POST   /api/v1/habits/{id}/entries           → log/upsert entry (ON CONFLICT habit_id+logged_at)
DELETE /api/v1/habits/{id}/entries/{date}    → delete entry (undo for boolean)
GET    /api/v1/habits/{id}/entries           → list entries (?from=&to=&page=&limit=20)

# Streak
GET    /api/v1/habits/{id}/streak            → {current_streak, best_streak, last_period_completed}
POST   /api/v1/habits/{id}/freezes           → apply freeze {freeze_date: date}
GET    /api/v1/habits/{id}/freezes           → list freezes (for quota display)

# Categories
GET    /api/v1/categories                    → list user's categories
POST   /api/v1/categories                    → create
PATCH  /api/v1/categories/{id}               → update name/color/sort_order
DELETE /api/v1/categories/{id}               → delete (only if no habits assigned)

# Presets
GET    /api/v1/presets                       → all presets grouped by category_key (no auth needed)

# Stats
GET    /api/v1/stats/today                   → {total, completed, percentage}
GET    /api/v1/stats/weekly                  → [{habit_id, habit_icon, habit_color, completion_rate, streak}]
GET    /api/v1/stats/streaks                 → [{habit_id, ...current_streak, streak_mode}] desc
GET    /api/v1/stats/monthly-highlights      → {best_streak, most_consistent, needs_attention}

# Settings + Push
GET    /api/v1/habits/settings               → {push_subscription, notifications_enabled}
PUT    /api/v1/habits/settings               → save push subscription + toggle
POST   /api/v1/habits/notifications/send     → internal; called by scheduler
```

### Permissions
- Add `HABITS = "habits"` to `Features` enum
- Run Alembic migration to seed permission record for existing users

### Push Notifications
- Library: `pywebpush`
- Client: `Notification.requestPermission()` → `serviceWorker.pushManager.subscribe()` → POST subscription to settings endpoint
- Scheduler job (APScheduler in `core/scheduler.py`): runs every minute, queries habits where `reminder_time` matches current time (in habit's timezone), sends push via pywebpush to subscribed users

### Nx App Scaffolding
```bash
nx generate @nx/react:app habits \
  --directory=apps/habits \
  --bundler=vite \
  --style=css \
  --routing=true \
  --e2eTestRunner=none
```
Dependencies to install: `shadcn/ui`, `@tanstack/react-query`, `recharts`, `zod`, `web-vitals`

Tailwind CSS v4 setup: same pattern as `apps/cockpit/` (copy `@tailwindcss/vite` config)

Docker: `apps/habits/Dockerfile` — `nginx:alpine`, `linux/arm64` target, SPA `try_files` fallback, deploys to `habits.parda.me`

