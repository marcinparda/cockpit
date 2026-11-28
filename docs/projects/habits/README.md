# habits

React 19 habit tracker. Part of the `cockpit-app` Nx monorepo (`apps/habits/`).

- **Port**: 4208 (prod container `habits`, image `ghcr.io/marcinparda/cockpit-habits:latest`, `habits.parda.me`)
- **State**: TanStack Query for server state; service worker registered for push notifications
- **Deployment**: independent Docker container (`nginx:alpine`, SPA fallback), `linux/arm64`
- **Layout**: `App` wraps everything in `RequireUser` (`shared-react-feature`; no session → redirect to Login). `AppLayout` renders the shared **App shell** (`AppShell` from `shared-react-ui`, `UserMenu` in its user area) around all routes (content capped at 1920px, centered). Nav items live in `app/navItems.tsx`; the shell shows them in the header from `md:` up and as a fixed bottom nav below `md:`. The logo links to the Dashboard.

- **Code layout**: the App folder holds only providers (`main.tsx`) and composition (`app/`: `RequireUser`, router, `AppLayout`, nav items). Pages and data-connected sheets live in `habits-feature` (`libs/habits/feature`), presentational components plus icon/colour sets and date helpers in `habits-ui` (`libs/habits/ui`, pure), and schemas, endpoints, hooks, `fetchVapidPublicKey` and mock factories in `habits-data-access` (`libs/habits/data-access`). Sheets use the shared `Sheet` (Radix Dialog: Escape/overlay close, focus trap); buttons, inputs, selects and textareas come from `shared-react-ui`.

Same pattern as `cockpit` (Vite + TanStack Query + shadcn/ui + Tailwind CSS v4), plus a service worker for push. See [`../cockpit/architecture.md`](../cockpit/architecture.md) for the full monorepo layout and [`docs/standards/frontend/architecture.md`](../../standards/frontend/architecture.md) for cross-app conventions.

## Today page

Row list grouped by category, built on the shared `LogRow` (`@cockpit-app/shared-react-ui`, presentational: icon, title, 3-state `done | notDone | unset`, ✗/✓ + row-click callbacks). Habit rules live in `TodayPage` (`habits-feature`):

- **Day selector**: `DayStrip` (`habits-ui`) (Mon–Sun strip, `‹ ›`, "Today" jump, future days disabled, per-day full/partial/empty). Selected day drives header label, `x/y`, all-done banner, confetti and every `logged_at`.
- **Dates**: built from local parts (`habits-ui` `utils/date.ts`), never `toISOString()` (UTC off-by-one).
- **Data**: one `GET /api/v1/habits/entries?start_date&end_date` per visible week (`useEntriesByRange`, key `['habits','entries',start,end]`, refreshed by entry mutations via `['habits']`).
- **✓/✗**: boolean ✓ → `boolean_value:true`, ✗ → `false`, tapping the active button deletes the Entry. Numeric/text ✓ opens `HabitSheet` for the selected date; ✗ upserts `boolean_value:false` (API accepts it on any type, counts as not done) and **replaces** any existing numeric/text value.
- Row tap opens the Habit detail page (no long-press).

## Habit detail heatmap

`HeatmapCalendar` (`habits-ui`) is a grid of buttons (weeks set by the period) (`role="gridcell"`), shown for every Habit type. Per-date state is `done | notDone | unlogged` (done = filled, not done = solid red, unlogged = faint grey); days after today (rest of the current week) are not rendered. `HabitDetailPage` (`habits-feature`) owns the rules:

- **Period**: 6M/1Y = 26/52 weeks (default 1Y). The period sets cells shown, fetched range (`heatmapRange(weeks)`), chart and entry list. Cells are a fixed 20px for every period; the grid is right-aligned and wider periods scroll horizontally, pinned to the latest week.
- **Boolean click**: cycles unlogged → done (`boolean_value:true`) → not done (`false`) → unlogged (delete Entry).
- **Numeric/text click**: opens `HabitSheet` for that date.
- Mutations invalidate `['habits']` and `['habit', id]`, refreshing heatmap, streak and Today page.

## Daily reminder

One push per user per day, configured on the Settings page next to the Push toggle (`SettingsPage` in `habits-feature`): a time input (clearable) and an IANA timezone. The timezone defaults to the browser's the first time a time is saved. Both persist via `PATCH /api/v1/habits/settings` (`reminder_time`, `timezone`; `null` clears) on `user_habit_settings`; there are no per-Habit reminder fields.

- **Scheduler**: `core/scheduler.py` runs `push_notification_service.send_due_push_notifications` every minute. It iterates users with a reminder time and sends when notifications are enabled, a push subscription is stored, local time is within 5 minutes after the reminder time (tolerates a late tick) and `last_reminder_sent_on` is not today's local date (that column enforces once per local day).
- **Skip rules**: no push when every due Habit (non-archived) already has a done Entry today, or none are due. Each skip is logged with its reason (INFO for habits-based skips, DEBUG for the rest); sends are logged at INFO.
- **Send path**: `pywebpush` runs in `asyncio.to_thread`. HTTP 404/410 from the push service clears the subscription and disables notifications; other failures log status and body and leave state untouched (retried on the next tick inside the window).
- **Client**: `public/sw.js` shows the notification; clicking opens `/today`.
- **VAPID config**: `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, and `VAPID_CONTACT` (the `sub` claim, default `mailto:admin@parda.me`). See [`docs/deployment/GITHUB_SECRETS.md`](../../deployment/GITHUB_SECRETS.md).
- **Scaling note**: the per-minute poll over all users with a reminder time is deliberate for a single-user/small deployment (simple, self-healing after restarts, safe with multiple workers thanks to `last_reminder_sent_on`). For many users, rebuild it as per-user scheduled jobs (`CronTrigger` in the user's timezone, registered on startup and on settings changes) or narrow the query by due window, and add catch-up for sends missed during restarts.
