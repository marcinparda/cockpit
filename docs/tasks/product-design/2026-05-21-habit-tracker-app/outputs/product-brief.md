# Product Brief — Habit Tracker App
**habits.parda.me** · cockpit-app Nx monorepo · v1

---

## Layer 0: Core Brief

### Problem Statement
A self-hosted habit tracker that's fast enough to use at the end of each day on a phone. Core problem: friction in daily logging and hard streak resets cause abandonment. Supports three habit types (boolean check-off, numeric measurement, text diary) with type-appropriate UX, meaningful progress visualization per habit and across all habits, and a forgiving streak model.

### Target Users
- **Marcin** (primary): tracks health/mindfulness/growth, end-of-day batch session ~90s, all 3 habit types
- **Piotr** (secondary): power customizer, mostly numeric habits with targets, mid-day + evening logging

### Feature Overview
| Feature | Description |
|---|---|
| Today view | Daylio-style icon grid; tap to complete; grouped by category |
| 3 habit types | Boolean (one-tap), Numeric (popup with optional target), Text diary (text modal) |
| Streaks | Per-habit: soft (1-miss grace) / hard / none modes + streak freeze (2/month) |
| Habit creation | Quick Add sheet (name/icon/type/frequency) + Browse Templates tab |
| Categories | User-defined, colored, drag-to-reorder |
| Per-habit graphs | Heatmap (boolean), line+bar chart (numeric), timeline (text) + time range switcher |
| Stats screen | Today's %, weekly completion chart, streak ranking, monthly highlights |
| Push notifications | Browser Web Push, per-habit reminder time |
| Multi-user | All data scoped per user_id; existing cockpit-api auth |

### Constraints
1. Mobile-first; primarily phone use
2. React 19 + Vite 6 + Tailwind CSS v4 + shadcn/ui in Nx monorepo (`apps/habits`)
3. FastAPI backend (new service in `cockpit-api/src/services/habits/`), PostgreSQL
4. Cookie-based auth; redirect to `/login` app for unauthenticated requests
5. Check-in in < 10 seconds per habit; all habits in < 2 minutes
6. No mood tracking; standalone v1 (no Vikunja/brain notes integration)
7. Docker on Raspberry Pi (`linux/arm64`), `habits.parda.me`

### Success Criteria
1. All daily habits logged in under 2 minutes (end-of-day batch)
2. 3 habit types each with correct check-in UX and graph
3. Per-habit graph with week/month/3-month/year/all-time range switcher
4. Stats screen: today's completion % + weekly chart + streak ranking
5. Preset library + custom habit creation with user-defined categories
6. Streak freeze (2/month) + soft mode (1-miss grace) + hard mode opt-in
7. Flexible frequency: daily / weekly / N×/week / every N days
8. Browser push notifications per habit
9. Multi-user: all data isolated per user_id

### Acceptance Criteria
- [ ] Icon grid renders all today's habits grouped by category
- [ ] Boolean tap completes habit in 1 tap with animation; long-press undoes
- [ ] Numeric tap opens bottom sheet with number input and optional target progress
- [ ] Text tap opens 90vh sheet with auto-focused textarea and auto-save
- [ ] Habit detail shows type-appropriate graph with 5 time range options
- [ ] Stats screen shows today's %, weekly bars, streak ranking
- [ ] Streak streak mode selectable per habit; soft mode grace works correctly
- [ ] Streak freeze applies and is counted against 2/month quota
- [ ] Browser push notification delivered at habit's reminder time
- [ ] Creating a habit from Browse Templates pre-fills Quick Add form
- [ ] All data operations fail gracefully when unauthenticated (redirect)
- [ ] App passes Lighthouse mobile score ≥ 80

---

## Layer 1: Persona Summary

**Marcin — The Self-Optimizer**
Tracks health (running, sleep, water), mindfulness (screen time, meditation), and personal growth (reading, journaling). Opens app once at ~21:00, scans grid, marks done in ~90 seconds. Reviews monthly heatmaps to spot patterns. Needs all 3 habit types; values speed above all.

**Piotr — The Power Customizer**
Mostly numeric habits with precise targets (reps, time, weight). May log mid-day post-workout. Wants full control over frequency and target configuration. Reviews weekly trend charts to adjust training goals.

*Full persona cards with user journeys: `analysis/personas.md`*

---

## Layer 2: Design Decisions

| Area | Decision | Trade-off |
|---|---|---|
| Data schema | Single `habit_entries` table, nullable typed columns | Wider table → simpler aggregation, one repo |
| Home view | Icon grid + bottom sheet for value entry | Less metadata per tile → fastest batch session |
| Streak model | Per-habit configurable (soft default) | 3 code paths → forgiving defaults + opt-in hard |
| Creation flow | Blank slate + Quick Add + Browse Templates | No onboarding funnel → simpler, same path always |
| Visualization | Per-habit detail + dedicated Stats screen | More v1 scope → complete visualization story |

*Full alternatives with pros/cons: `analysis/alternatives.md` and `analysis/design-decisions.md`*

---

## Layer 3: Key Technical Decisions

- **Graph library**: Recharts (React-native, Tailwind-compatible)
- **Streak calculation**: server-side in `streak_service.py` (isolated, testable pure functions)
- **Push notifications**: `pywebpush` library + APScheduler job in `core/scheduler.py`
- **Entry upsert**: `ON CONFLICT (habit_id, logged_at) DO UPDATE` for re-logging
- **Day boundary**: client sends `logged_at` as user-local date string; server stores verbatim
- **Preset seeding**: `preset_habits` table, populated via Alembic seed migration

---

## References

| Document | Description |
|---|---|
| `analysis/design-context.md` | Unified context: project docs, user vision, UX research |
| `analysis/ux-research.md` | Habit tracker UX patterns & best practices (web research) |
| `analysis/problem-statement.md` | Problem, constraints, success criteria, assumptions |
| `analysis/personas.md` | Persona cards + user journeys |
| `analysis/alternatives.md` | Full decision area alternatives with pros/cons |
| `analysis/design-decisions.md` | Selected directions + rationale |
| `analysis/feature-spec.md` | Complete 8-section feature specification (implementation-ready) |
