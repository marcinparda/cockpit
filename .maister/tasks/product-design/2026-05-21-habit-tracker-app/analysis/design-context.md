# Design Context — Habit Tracker App

## 1. Project Context

### Platform
Cockpit is a self-hosted personal productivity platform on Raspberry Pi. Single-developer, multi-user (shared family/personal accounts). The habit tracker is a new first-class app in the cockpit ecosystem, accessible at `habits.parda.me`.

### Existing Infrastructure (usable by habit app)
- **Authentication**: Cookie-based auth via `cockpit-api`. Users table already exists. Login flow handled by the `login` app — habit app just redirects unauthenticated users there.
- **API**: FastAPI backend at `cockpit-api`. New habit endpoints follow the same 3-layer pattern (router → service → repository). `/api/v1/habits/` prefix.
- **Frontend monorepo**: Nx workspace at `cockpit-app/`. New app scaffolded as `apps/habits/`. Shared libs available: `@cockpit-app/api-types`, shared `data-access`, `ui`.
- **Deployment**: Docker container per app. GitHub Actions builds image, SSH deploys to Raspberry Pi. Nginx routes `habits.parda.me` to the container.

### Tech Stack for Habits App
- **Frontend**: React 19 + Vite 6 + Tailwind CSS v4 + shadcn/ui
- **Backend**: Python/FastAPI (existing cockpit-api, new service module)
- **Database**: PostgreSQL (existing, via Alembic migrations)
- **Auth**: Cookie-based, `credentials: 'include'` on all fetch calls
- **State**: TanStack Query for server state
- **Types**: OpenAPI-generated `@cockpit-app/api-types`

---

## 2. User Vision (from conversation)

### Core Concept
A personal habit tracker where each user owns their own habits. Inspired by Daylio's icon-grid check-in UI but **without mood tracking**. The app focuses on logging activities and seeing progress over time.

### Habit Types
Three distinct types, each with different data entry UX and graph types:

| Type | Description | Data entry | Graph |
|---|---|---|---|
| **Boolean** | Did you do it today / this week / custom range? | One-tap icon | Heatmap / streak chain |
| **Numeric** | Count or measure something (hours programmed, km run) | Number popup on tap | Line trend / bar chart |
| **Text/Diary** | Write a note or diary entry | Text popup on tap | Chronological timeline |

### Check-in UI
Daylio-style icon grid on the home/daily view. Tapping a boolean habit marks it done instantly. Tapping a numeric/text habit opens a popup to enter the value. After logging, the entry appears in the habit's history.

**Explicitly excluded**: Mood tracking ("how are you doing" prompt).

### Preset Library
Built-in preset habits (running, sleep early, wake up early, eat healthy, etc.) that users can add to their list. Users can also create fully custom habits with name, icon, type, and frequency.

### Graphs & History
Each habit has its own graph/timeline view. Graphs support time range selection (week / month / 3 months / year). Clicking an entry in the graph opens a popup showing the logged data (value or text). Numeric habits show trend lines; text habits show a scrollable timeline.

### Multi-user
Each logged-in user has their own independent set of habits, entries, and streaks. Uses the existing `users` table in `cockpit-api`.

---

## 3. UX Research Findings (key takeaways)

### Check-In Flow
- One-tap boolean completion with fill animation — **no confirmation dialog**
- Numeric habits: `+1` button on tile for incremental; bottom sheet for specific value
- Text habits: full-screen or large bottom sheet modal with auto-save
- **Target: check-in in under 10 seconds**

### Streak Mechanics
- Streak counter is the highest-leverage retention mechanic
- Include: streak freeze (1–2/month), grace period (2–3h past midnight), forgiveness model
- Never reset with shaming copy — celebrate what was achieved
- Surface both **current streak** and **best streak**

### Progress Visualization
- **Calendar heatmap** (GitHub-style) — works for all types as consistency view
- Boolean → heatmap + streak chain
- Numeric → line trend + daily bar chart
- Text → chronological timeline (no graph)
- Default time range: **month**; offer week / 3-month / year / all-time

### Preset Library
- Category picker during onboarding (Health / Fitness / Mindfulness / Learning)
- Presets come with icon, color, frequency, reminder pre-set; user overrides
- Separate "Browse templates" from "Create custom" as two entry points

### Anti-patterns to Avoid
- Hard streak reset with shaming copy
- UTC midnight resets (use user-local timezone)
- No undo on accidental completion
- Capping numeric input at target value

---

## 4. Key Design Implications

1. **Habit type is first-class** — the type determines both the check-in interaction and the graph type. The data model must carry this distinction cleanly.
2. **Speed of daily check-in is critical** — the home view must show all today's habits and let the user complete them with minimal taps.
3. **Graphs are per-habit, not global** — each habit has its own detail screen with its graph. No cross-habit analytics required in v1.
4. **Multi-user is straightforward** — all queries filter by `user_id`. No sharing or social features needed.
5. **Preset library reduces onboarding friction** — new users shouldn't start with a blank screen.
6. **Auth is a solved problem** — redirect to `/login` app for unauthenticated requests; no auth UI needed in the habits app.
7. **shadcn/ui + Tailwind v4** — use shadcn's Sheet, Dialog, and Popover for entry modals; use Recharts (already common in React ecosystems) for graphs.

---

## 5. Open Questions (to explore in Problem Exploration)

- What frequencies beyond daily should be supported? (3x/week, custom, weekly)
- Should habits have a target/goal value for numeric types, or just track?
- Notifications: push? Local browser? Or skip for v1?
- Categories/tags: user-defined or fixed list?
- Should streaks count for non-daily habits, and how?
- What does "done for today" reset at? Midnight user-local? Configurable?
