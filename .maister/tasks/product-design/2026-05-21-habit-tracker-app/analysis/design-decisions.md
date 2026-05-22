# Design Decisions

## Selected Approach

A mobile-first habit tracker with a Daylio-style icon grid check-in, three habit types with type-specific UX, a forgiving per-habit streak model, and both per-habit graphs and a cross-habit stats screen.

## Key Decisions Per Area

### 1. Data Architecture — Single Table, Nullable Typed Columns
`habit_entries` table with `boolean_value`, `numeric_value`, `numeric_unit`, `text_value` columns. Only the columns matching the habit type are populated; the rest are NULL. Single repository, native SQL aggregation for numeric trends.

**Trade-off accepted**: Slightly wider table vs simpler aggregation queries and single codebase.
**Rejected**: JSONB (weak TypeScript types, ugly aggregation), separate tables (3 repos + UNION queries).

### 2. Home View — Icon Grid + Bottom Sheet
Full-screen icon grid. Tap boolean = instant complete with animation. Tap numeric/text = shadcn Sheet slides up for value entry. Progress bar at top. Category grouping in the grid.

**Trade-off accepted**: Less metadata per tile vs fastest possible batch check-in session.
**Rejected**: Hybrid grid/list toggle (antipattern, maintenance cost), list view (slower scan).

### 3. Streak Model — Per-Habit Configurable, Soft Default
Three modes: `none` / `soft` (1-miss grace, default) / `hard` (strict). Text-diary habits default to `none`. Streak counter shown for soft/hard modes. Single missed day in soft mode marks heatmap but doesn't reset streak. Second consecutive miss resets.

**Trade-off accepted**: 3 code paths in streak service vs forgiving defaults + opt-in accountability.
**Rejected**: Hard streak only (too harsh), strength score (removes streak motivation mechanic).

### 4. Habit Creation — Blank Slate + Quick Add + Browse Templates
FAB on home screen opens shadcn Sheet with two tabs:
- **Quick Add**: name + icon picker + type selector + optional frequency/target (defaults applied)
- **Browse Templates**: preset library organized by category (Health/Fitness/Mindfulness/Learning/Productivity); one-tap to add

No onboarding funnel. Empty-state illustration handles blank-slate anxiety.

**Trade-off accepted**: No forced onboarding guidance vs simpler implementation, same creation path on every use.
**Rejected**: Preset-first funnel (extra state machine), wizard (too slow for mobile).

### 5. Visualization — Per-Habit Detail + Dedicated Stats Screen
Both built in v1:
- **Per-habit detail page**: type-appropriate graph (heatmap for boolean, line+bar for numeric, timeline for text) + time range switcher (week/month/3mo/year) + entry log + streak stats
- **Stats screen** (bottom nav tab): today's completion %, weekly completion bar chart per habit, streak summary across all habits

**Trade-off accepted**: More v1 scope vs complete visualization story for both personas.
**Rejected**: Per-habit only (insufficient cross-habit overview), stats screen only (no drill-down).

## Trade-offs Accepted (Summary)

1. Wider entry table (nullable columns) for simpler queries
2. Smaller tiles with less metadata for faster check-in speed
3. More streak service complexity for per-habit forgiveness control
4. No guided onboarding for simpler, consistent creation flow
5. More v1 scope for complete visualization (both overview + detail)
