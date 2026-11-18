# habits

React 19 habit tracker. Part of the `cockpit-app` Nx monorepo (`apps/habits/`).

- **Port**: 4208 (prod container `habits`, image `ghcr.io/marcinparda/cockpit-habits:latest`, `habits.parda.me`)
- **State**: TanStack Query for server state; service worker registered for push notifications
- **Deployment**: independent Docker container (`nginx:alpine`, SPA fallback), `linux/arm64`
- **Layout**: `AppLayout` wraps all routes (content capped at 1920px, centered). Nav items live in `components/navItems.tsx`; below `md:` a fixed `BottomNav` is shown, from `md:` up a `HeaderNav` replaces it.

Same pattern as `cockpit` (Vite + TanStack Query + shadcn/ui + Tailwind CSS v4), plus a service worker for push. See [`../cockpit/architecture.md`](../cockpit/architecture.md) for the full monorepo layout and [`docs/standards/frontend/architecture.md`](../../standards/frontend/architecture.md) for cross-app conventions.

## Today page

Row list grouped by category, built on the shared `LogRow` (`@cockpit-app/shared-react-ui`, presentational: icon, title, 3-state `done | notDone | unset`, ✗/✓ + row-click callbacks). Habit rules live in `pages/TodayPage.tsx`:

- **Day selector**: `components/DayStrip` (Mon–Sun strip, `‹ ›`, "Today" jump, future days disabled, per-day full/partial/empty). Selected day drives header label, `x/y`, all-done banner, confetti and every `logged_at`.
- **Dates**: built from local parts (`utils/date.ts`), never `toISOString()` (UTC off-by-one).
- **Data**: one `GET /api/v1/habits/entries?start_date&end_date` per visible week (`useEntriesByRange`, key `['habits','entries',start,end]`, refreshed by entry mutations via `['habits']`).
- **✓/✗**: boolean ✓ → `boolean_value:true`, ✗ → `false`, tapping the active button deletes the Entry. Numeric/text ✓ opens `HabitSheet` for the selected date; ✗ upserts `boolean_value:false` (API accepts it on any type, counts as not done) and **replaces** any existing numeric/text value.
- Row tap opens the Habit detail page (no long-press).

## Habit detail heatmap

`components/HeatmapCalendar` is a grid of buttons (weeks set by the period) (`role="gridcell"`), shown for every Habit type. Per-date state is `done | notDone | unlogged` (done = filled, not done = solid red, unlogged = faint grey); future cells are disabled. `pages/HabitDetailPage.tsx` owns the rules:

- **Period**: 1M/3M/6M/1Y/2Y/3Y/6Y = 5/13/26/52/104/156/312 weeks (default 3M). The period sets cells shown, fetched range (`heatmapRange(weeks)`), chart and entry list. Cells are a fixed 20px for every period (3M fits a 375px phone); longer periods scroll horizontally, pinned to the latest week.
- **Boolean click**: cycles unlogged → done (`boolean_value:true`) → not done (`false`) → unlogged (delete Entry).
- **Numeric/text click**: opens `HabitSheet` for that date.
- Mutations invalidate `['habits']` and `['habit', id]`, refreshing heatmap, streak and Today page.
