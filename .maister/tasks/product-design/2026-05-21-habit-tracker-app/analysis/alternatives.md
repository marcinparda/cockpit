# Design Alternatives — Habit Tracker App

Generated from: `analysis/design-context.md`, `analysis/problem-statement.md`, `analysis/personas.md`

---

## Decision Area 1: Data Architecture for Habit Entries

### Why This Decision Matters

The habit entry table is the most-written and most-queried table in the system. The three habit types (boolean, numeric, text-diary) have fundamentally different payloads. The schema choice determines query complexity, type safety, migration surface, and how cleanly the 3-layer backend architecture can express per-type logic. A wrong choice here is expensive to reverse post-launch.

---

### Alternative 1A: Single Table with JSONB Value Column

One `habit_entries` table. Columns: `id`, `habit_id`, `user_id`, `logged_at`, `value JSONB`. Boolean entries store `{"done": true}`, numeric store `{"amount": 5.5, "unit": "km"}`, text store `{"text": "Felt great today"}`.

**Pros**
- One migration, one repository class, one API endpoint (`POST /habits/{id}/entries`)
- Adding new habit types in the future requires no schema change
- JSONB indexing in PostgreSQL is mature; value fields can be indexed with GIN if needed
- Repository `create_entry` and `get_entries` are uniform regardless of type

**Cons**
- No database-level type enforcement on the value payload — invalid JSON shapes are only caught at the service layer
- Queries that filter or aggregate on value (e.g. numeric trend over time) require JSONB operators (`->`, `->>`) which are less readable and harder to optimize than native columns
- OpenAPI schema for entry value becomes `object` or a discriminated union, complicating generated TypeScript types
- Type-specific validation logic in the service layer is implicit — easy to omit for a new contributor

**Best when**: The team expects many future habit types, or the value shapes are genuinely unpredictable.

---

### Alternative 1B: Separate Tables per Habit Type

Three tables: `boolean_entries(id, habit_id, user_id, logged_at, done bool)`, `numeric_entries(id, habit_id, user_id, logged_at, amount float, unit varchar)`, `text_entries(id, habit_id, user_id, logged_at, content text)`.

**Pros**
- Full database-level type enforcement; impossible to store a text value in a boolean entry
- Per-type queries are simple, readable, and index-friendly (e.g. `SELECT amount FROM numeric_entries WHERE habit_id = ? AND logged_at >= ?`)
- Service layer validation is naturally separated by type
- OpenAPI schemas are precise discriminated types — TypeScript types are clean

**Cons**
- Three tables means three repositories, three sets of API endpoints, or a routing layer that dispatches by habit type
- Cross-type queries (e.g. "all entries for today across all habit types for this user") require UNION or a denormalized view
- Adding a new habit type requires a new migration and new repository
- The habit model must carry `type` as an enum to route operations correctly — this is necessary regardless, but the coupling is more explicit here

**Best when**: Type-specific querying and aggregation are core product features and query performance is critical.

---

### Alternative 1C: Single Table with Typed Nullable Columns

One `habit_entries` table with: `id`, `habit_id`, `user_id`, `logged_at`, `boolean_value bool`, `numeric_value float`, `numeric_unit varchar`, `text_value text`. For a given entry, only the column(s) matching the habit type are populated; the rest are NULL.

**Pros**
- Single table — no UNION queries needed for cross-type views
- Native PostgreSQL column types — aggregation (`AVG`, `SUM`) works without JSONB operators
- Simple schema, straightforward Alembic migration
- Adding a CHECK constraint per row (enforced by a DB trigger or service rule) provides reasonable safety

**Cons**
- Nullable semantics require discipline: `numeric_value IS NULL` could mean "not yet logged" or "this is a boolean habit" — requires `habit.type` to disambiguate
- Three nullable column groups make the table wider and slightly wasteful for storage
- No intrinsic constraint that prevents writing both `boolean_value` and `numeric_value` on the same row without an explicit CHECK constraint

**Best when**: Team wants single-table simplicity without JSONB and can enforce per-type rules cleanly in the service layer.

---

### Recommendation: Alternative 1C — Single Table with Typed Nullable Columns

For a self-hosted app with three known, stable habit types and a 3-layer backend, the nullable columns approach is the best balance. Aggregation queries for numeric trend charts are native SQL without JSONB operators. Cross-type queries (today's completions across all habits) are a single SELECT. The service layer already owns type dispatch — it validates that `numeric_value` is set when `habit.type == 'numeric'` and raises `HTTPException` otherwise, the same as it would for the JSONB case but with cleaner code. The schema is easy for a future contributor to read.

Separate tables (1B) would be justified if numeric aggregation queries were performance-critical at scale, but on a Raspberry Pi with one or two users, this is not the concern. JSONB (1A) is justified for open-ended schema evolution, but three fixed types do not warrant that complexity.

---

## Decision Area 2: Home View Check-In Interaction Model

### Why This Decision Matters

This is the screen users open every day. Marcin's stated goal is a 90-second batch session, checking off 6-8 habits. The interaction model determines how fast and reliable that session is on a phone. A wrong choice adds friction that compounds daily and drives abandonment — the core problem the app is designed to solve.

---

### Alternative 2A: Icon Grid Only (Daylio-style)

A full-screen scrollable grid of habit tiles (icon + name + streak). Tapping a boolean tile instantly marks it done with a fill animation. Tapping a numeric or text tile opens a bottom sheet for value entry. Completed tiles move to a "done" section or dim in place. A progress bar at the top shows today's completion.

**Pros**
- Fastest path to completion for Marcin's end-of-day batch use case: all habits visible at once, minimum taps
- Visual scan is fast — icons communicate status at a glance before text is read
- Consistent with the Daylio model that was explicitly cited as the inspiration
- Bottom sheet for value entry keeps context without a full navigation push
- Simplest implementation: one screen, one view model, one query

**Cons**
- Grid layout shows less metadata per tile (no target, no last value, no best streak) unless tapped
- Less suited for Piotr's power-customizer use case where seeing current vs. target at a glance matters
- Ordering and grouping (by category, by completion status) is less obvious in a grid than a list

**Best when**: The primary use case is fast daily logging with 6-12 habits and the user knows their habits by icon.

---

### Alternative 2B: Hybrid Grid + List Toggle

A toggle button (grid icon / list icon) persisted in local state. Grid mode is the default (same as 2A). List mode shows each habit as a row: icon + name + streak + last value + progress bar toward target. Both modes support the same tap-to-log interaction.

**Pros**
- Serves both Marcin (grid for speed) and Piotr (list for data density)
- List mode makes targets and current values visible without opening a detail screen
- Toggle state persists — each user gets their preferred mode without a settings screen

**Cons**
- Two layouts to maintain and test; twice the CSS surface area
- The toggle adds a decision point for new users who don't know which mode to pick
- In practice, most users settle on one mode and the other is dead code — violates minimal implementation standard
- Grid + list toggle is a well-known UX antipattern in mobile apps where users rarely switch

**Best when**: The user base is large and varied enough that both modes are actively used.

---

### Alternative 2C: Single Scrollable List with Chunked Sections

A vertical list, no grid toggle. Habits grouped into two sections: "Today" (pending) and "Done" (completed, collapsed by default). Each row: icon + name + streak number + inline quick-action button (checkmark for boolean, `+` for numeric, pen for text). Tapping the row opens detail; tapping the action button logs without opening detail.

**Pros**
- More metadata density per habit than a grid tile without requiring a mode switch
- Separating pending from done makes the remaining work clear at a glance
- Inline action button matches the "check-in < 10s" goal for boolean and numeric increment
- Familiar list UI — no learning curve for new users
- Accessible: screen readers handle list semantics better than a custom icon grid

**Cons**
- Slower visual scan than a grid for users who have many habits — more scrolling required
- The list grows linearly with habit count; a grid is more space-efficient on small screens
- Less "satisfying" tap interaction than a large icon tile fill animation
- Inline action button for numeric habits (`+`) only works for increment-by-1; a different value still requires a bottom sheet

**Best when**: Habits have meaningful metadata to show inline, or the user has more than ~15 habits.

---

### Recommendation: Alternative 2A — Icon Grid Only

Marcin's primary journey is explicit: open app, scan grid, tap 4-5 icons, enter 1-2 values, close app. The icon grid is the fastest path for this flow and was named as the inspiration. At 6-12 habits (the realistic v1 range for both personas), a grid fits on one screen without scrolling on a modern phone. The bottom sheet for numeric/text entry is the standard mobile pattern — already solved by shadcn/ui's `Sheet` component.

The hybrid toggle (2B) adds maintenance cost for a feature Piotr's use case only marginally benefits from — he can see target progress on the habit detail screen. The list approach (2C) is more accessible but slower for the primary use case. Build the grid first; if a list view becomes genuinely needed, it can be added in a later version without a schema change.

---

## Decision Area 3: Streak Model Design

### Why This Decision Matters

Streak mechanics are cited in the UX research as the highest-leverage retention mechanic. The model chosen also determines the complexity of the streak calculation service and the semantics displayed to users. A hard binary model is easy to understand and implement but brittle. A softer model is more forgiving but harder to explain and calculate.

---

### Alternative 3A: Hard Streak — Binary Pass/Fail per Period

A habit has a "current streak" counter. Each day (or frequency period) the habit is either completed (streak increments) or missed (streak resets to 0). Streak freeze: up to 2 per month, applied manually, prevents reset for that day. Grace period: completions logged before 2am local time count for the previous day.

**Pros**
- Semantically simple: users understand "X days in a row" immediately
- Calculation is a single backward scan from today: count consecutive completed periods
- Streak freeze is a discrete, explicit forgiveness mechanic
- Matching the mental model most users bring from other apps (Duolingo, Streaks, Habitica)

**Cons**
- One missed day resets to 0 — even with freeze, the "broken" feeling is psychologically harsh
- Streaks for non-daily habits (3x/week) are ambiguous: does missing one of three sessions break the streak?
- No partial credit for habits logged late in the same session

**Best when**: Users are disciplined and want hard accountability, or the habit type maps cleanly to a daily yes/no (meditation, no alcohol).

---

### Alternative 3B: Habit Strength Score — Rolling 0-100% Average

Instead of a streak counter, each habit has a "strength score" calculated as the completion rate over a rolling window (default: last 28 days). Boolean habits: completed days / total days. Numeric habits: days where value met target / total days. Score displayed as a percentage and a color band (green/yellow/red). No reset — the score always reflects recent behavior.

**Pros**
- Fundamentally forgiving: missing one day barely moves a 28-day score
- Handles non-daily frequencies cleanly (completions / required sessions in window)
- Numeric habits with targets have a natural success criterion
- Encourages getting back on track rather than starting over after a miss

**Cons**
- Users must learn what the score means — less intuitive than "14 day streak"
- Removes the emotional high of maintaining a long streak, which is a core motivator for many users
- The calculation is more complex: requires a rolling window query per habit per page load
- Does not visually communicate "I've been doing this for months" the way a streak counter does

**Best when**: The user explicitly wants a forgiving, non-gamified tracker focused on trend rather than achievement.

---

### Alternative 3C: Per-Habit Configurable Model with Forgiving Defaults

Each habit has a `streak_mode` setting: `none` (no streak), `hard` (binary), or `soft` (hard streak + automatic 1-miss-per-30-days grace before reset). Default is `soft`. Streak counter shown for `hard` and `soft` modes; no counter for `none`. A missed day in `soft` mode shows a visual mark on the heatmap but does not break the streak. The second consecutive miss breaks it.

**Pros**
- Forgiving by default — addresses the core pain point without sacrificing the streak motivation mechanic
- Power users (Piotr) can switch to `hard` mode for habits where strict accountability is desired
- `none` mode is appropriate for text-diary habits where streaks are meaningless
- A single-miss grace period is easy to explain: "one missed day won't break your streak"

**Cons**
- Three modes means three code paths in the streak calculation service
- UI must surface which mode is active and allow changing it — adds to habit settings screen complexity
- The `soft` mode's single-miss grace may still feel harsh for users who batch-log after a hectic week

**Best when**: The user base is varied (some want hard accountability, some want forgiveness) and per-habit customization matches their workflow.

---

### Recommendation: Alternative 3C — Per-Habit Configurable with Forgiving Defaults

The problem statement explicitly calls for a "forgiving streak model" and the success criteria list "streak with freeze and forgiveness model." Alternative 3A (hard streak) satisfies the retention mechanic but not the forgiveness requirement. Alternative 3B (strength score) is forgiving but removes the streak motivation that the UX research identifies as highest-leverage.

3C resolves the tension: the default `soft` mode gives users a streak counter (motivation) with a single-miss grace (forgiveness). Text-diary habits default to `none` because a diary streak is semantically awkward. Piotr's numeric workout habits can be set to `hard` for strict accountability. The calculation complexity is manageable: `soft` mode is `hard` mode with a "forgiveness applied" flag stored on the entry to mark single-miss gaps.

---

## Decision Area 4: Habit Creation Flow

### Why This Decision Matters

The creation flow is the first friction point after landing on the app. For Marcin (knows what he wants, wants it fast) and Piotr (wants precise configuration), a poor creation flow means habits are never created or poorly configured. The preset library reduces blank-slate anxiety for new users; the question is how to integrate presets and custom creation without making either path feel secondary.

---

### Alternative 4A: Preset-First Onboarding Funnel

On first app launch (zero habits), show a category browser full-screen: Health / Fitness / Mindfulness / Learning / Productivity. User picks categories, selects presets, confirms. The funnel only runs once; subsequent habit creation goes directly to a creation sheet. Presets are always reachable from a "Browse templates" button in the habit list toolbar.

**Pros**
- Eliminates blank-slate anxiety for new users — they see options before seeing an empty screen
- Category browsing is low-commitment: users tap what looks interesting, no form fields required
- Presets come with icon, color, type, and frequency pre-configured — getting started is fast
- Aligns with UX research finding: category picker during onboarding reduces drop-off

**Cons**
- The funnel only helps once; returning users creating a new habit still need to find the creation entry point
- Forces preset exposure even if the user already knows exactly what custom habits they want (Piotr)
- Onboarding funnels require a separate UX state machine: "has user completed onboarding?" stored in user settings

**Best when**: The user base includes non-technical users who benefit from structured guidance.

---

### Alternative 4B: Blank Slate with Quick-Add and Browse

A bottom-anchored FAB (floating action button) on the home screen opens a creation sheet with two tabs: "Quick Add" (name + icon + type picker, all other settings defaulted) and "Browse Templates" (same preset library as 4A, accessible any time). No special onboarding funnel — first launch shows the empty home screen with a prominent empty-state illustration and a "Add your first habit" button that opens the creation sheet.

**Pros**
- No onboarding state to manage — the creation flow is the same on first use and tenth use
- Power users (Piotr) can jump straight to Quick Add or browse templates without a forced funnel
- The empty-state illustration replaces the onboarding funnel for blank-slate anxiety
- Simpler implementation: one creation sheet, two tabs, no first-run detection logic

**Cons**
- Empty state on first launch may feel more intimidating than a guided category picker
- Users must actively discover the "Browse Templates" tab — it is not automatically surfaced
- "Quick Add" with defaults means users may not realize they can configure frequency, color, or targets until they edit the habit later

**Best when**: The primary users are technical and confident (both Marcin and Piotr fit this profile), and simplicity of implementation is valued.

---

### Alternative 4C: Wizard-Style Guided Creation

A multi-step wizard for every habit creation: Step 1 — choose type (boolean / numeric / text); Step 2 — name + icon + color; Step 3 — frequency; Step 4 — optional target (numeric only). Preset habits are pre-filled starting at Step 1. A "Skip" button on each step applies the default.

**Pros**
- Ensures users configure all meaningful fields — no habit created with unreviewed defaults
- Clear progressive disclosure: type first, then appearance, then schedule
- Works equally well for presets (pre-filled) and custom habits (blank)

**Cons**
- Multiple screens per creation is slow — violates the speed-first principle of the app
- Most returning users already know what they want; the wizard forces extra taps
- "Skip" buttons on every step suggest the steps are optional — why have them?
- Wizard patterns are associated with enterprise software, not mobile consumer apps

**Best when**: Users regularly need to configure all settings and the configuration is complex enough to warrant step-by-step guidance.

---

### Recommendation: Alternative 4B — Blank Slate with Quick-Add and Browse

Both personas are technical users who know what they want to track. The preset-first funnel (4A) adds complexity (first-run state, onboarding UX branch) for a benefit that primarily helps non-technical first-time users. The wizard (4C) is too slow for the speed-first philosophy of the app.

4B gives Marcin a fast path (name, icon, type, done) and Piotr a browsable template library from the same creation sheet. The empty-state illustration handles blank-slate anxiety without a funnel. Implementation is minimal: one `Sheet` component with two tabs. Presets are available on every habit creation, not just the first session, which is the more useful behavior.

---

## Decision Area 5: Graph and Visualization Strategy

### Why This Decision Matters

Graphs are the feedback loop that keeps users returning beyond the daily check-in. The question is whether to expose graphs per-habit only (simpler, scoped) or also via a dedicated stats screen (more powerful, more complex to build and maintain). Over-building visualization in v1 risks shipping a half-finished product; under-building means the app lacks the progress signal that sustains motivation.

---

### Alternative 5A: Per-Habit Detail Page Only

Each habit has a detail screen accessible by tapping the habit name or a detail icon. The detail screen shows: the habit's graph (type-appropriate), a time range switcher (week / month / 3 months / year), a scrollable entry log below the graph, and streak stats (current, best, last period). No cross-habit overview or dashboard stats.

**Pros**
- Focused scope: one graph type per habit, implemented well
- No aggregation queries across habits — all data is scoped to one `habit_id`
- Matches the UX research finding: "graphs are per-habit, not global" for v1
- Implementation is one reusable `HabitDetailPage` component parameterized by habit type
- Fastest to build and ship; covers the primary review use case for both personas

**Cons**
- Marcin's weekly review requires tapping into each habit individually — no "how am I doing overall" view
- Piotr cannot compare progress across related numeric habits (e.g. cardio time vs. weight)
- The home view's completion bar is the only cross-habit signal, which is thin

**Best when**: Shipping fast is the priority and per-habit review is sufficient for the primary use case.

---

### Alternative 5B: Dedicated Stats Screen

A separate "Stats" tab in the bottom nav. Shows: today's completion rate, weekly completion rate per habit (bar chart), a combined heatmap of all habits, and a "top streak" leaderboard across the user's habits. Each chart is non-interactive (no drill-down); users navigate to the habit detail page for per-habit graphs.

**Pros**
- Provides the cross-habit "how am I doing" signal that per-habit detail cannot
- Weekly completion bar chart is useful for Marcin's weekly review without opening individual habits
- The combined heatmap is a motivating visual of overall consistency

**Cons**
- Aggregation queries are more complex: completion rate across N habits, combined heatmap, streak leaderboard
- The stats screen has no drill-down interaction — it is a read-only summary that cannot replace the habit detail page
- Both the stats screen and the habit detail page must be built and maintained
- More routes, more components, more query logic

**Best when**: The app has a dedicated "review" use case distinct from the daily check-in session.

---

### Alternative 5C: Stats Screen + Per-Habit Detail (Both)

Build both: a Stats tab for cross-habit overview and a habit detail page for per-habit graphs. Stats tab: today's completion %, weekly completion bar chart, per-habit streak summary. Habit detail: type-appropriate graph with time range switcher and entry log.

**Pros**
- Complete visualization story: both overview and drill-down
- Serves Marcin's quick weekly scan (stats tab) and his monthly pattern review (habit detail)
- Serves Piotr's cross-habit comparison (stats tab) and his per-habit target tracking (habit detail)

**Cons**
- Largest implementation scope of the three options
- Two graph surfaces risk inconsistency if one is better-maintained than the other
- For v1 with one or two users, the stats screen may be underused relative to its build cost

**Best when**: Both cross-habit overview and per-habit drill-down are validated as needed before build.

---

### Recommendation: Alternative 5A — Per-Habit Detail Page Only, with Home View Completion Signal

Build per-habit detail pages for v1. Augment the home view with a persistent "today: 6/8" completion bar (already in the UX research findings) so the cross-habit signal is available on every session without a separate Stats tab.

The stats screen (5B and 5C) is a strong candidate for v2 once usage patterns are known — weekly completion charts and combined heatmaps are high-value but non-trivial to build correctly. For a self-hosted app with two users, shipping a focused v1 (per-habit graphs, clear home view completion signal) is more valuable than a half-finished stats screen. The completion bar on the home view satisfies the "overall progress" need without a second route.

If the stats screen is added in v2, no schema changes are required — all the data exists, only new query logic and a new page component are needed.

---

## Summary Table

| Decision Area | Chosen Direction | Key Trade-off Accepted |
|---|---|---|
| Data architecture | Single table, nullable typed columns | Slightly wider table in exchange for simple aggregation and single repository |
| Check-in interaction | Icon grid with bottom sheet for value entry | Less metadata density per tile in exchange for fastest tap-to-log path |
| Streak model | Per-habit configurable, soft default | Three code paths in streak service in exchange for forgiving defaults with opt-in hard mode |
| Habit creation | Blank slate + Quick Add + Browse Templates tab | No guided onboarding funnel in exchange for simpler implementation and same creation path on every use |
| Visualization | Per-habit detail only + home completion bar | No cross-habit stats screen in exchange for focused v1 scope |
