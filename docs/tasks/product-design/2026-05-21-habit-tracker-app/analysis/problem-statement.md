# Problem Statement

## Core Problem
Marcin needs a self-hosted habit tracker that's fast enough to use at the end of each day on a phone. The core problem with existing habit trackers is friction — both in logging (too many taps) and in recovery (hard streak resets trigger abandonment). The app must support three distinct habit types (boolean check-off, numeric measurement, text diary) with appropriate data entry UX for each, deliver meaningful progress visualization per habit and across all habits, and be forgiving by design.

## Constraints

1. **Mobile-first**: Primarily phone use. End-of-day batch session.
2. **Tech stack**: React 19 + Vite 6 + Tailwind CSS v4 + shadcn/ui in Nx monorepo (`cockpit-app`)
3. **Backend**: FastAPI (`cockpit-api`), PostgreSQL, existing cookie-based auth
4. **Speed**: Check-in must complete in < 10 seconds per habit
5. **No mood tracking**: Explicitly excluded
6. **Standalone v1**: No integration with Vikunja, brain notes, or other cockpit services
7. **Self-hosted**: Docker on Raspberry Pi, single developer

## Success Criteria

1. All daily habits logged in under 2 minutes (end-of-day session)
2. 3 habit types with type-appropriate check-in UX and graph:
   - Boolean → one-tap, heatmap + streak chain
   - Numeric → popup with optional target, line/bar chart
   - Text/diary → text modal, chronological timeline
3. Per-habit graph with week / month / 3-month / year time range switcher
4. Overview page: today's completion % + weekly summary
5. Preset library + custom habit creation with user-defined categories
6. Streak with freeze and forgiveness model; streak toggle per habit
7. Flexible frequency: daily / weekly / Nx per week / custom interval
8. Browser push notifications (per-habit reminder time)
9. Multi-user: all data scoped per user_id (existing users table)
10. Mobile-first responsive UI (shadcn/ui + Tailwind CSS v4)

## Key Assumptions

- Users are self-hosted: no public-facing onboarding concerns
- Single primary user (Marcin) but data model supports multiple accounts
- Auth is handled by existing login app; habits app redirects unauthenticated requests
- Day boundary: midnight in user's local timezone
- Preset habits are system-wide defaults; users can add them to their list
- Categories are user-created per account (not shared across users)
