# Requirements

## Initial Description
Build a new habit tracker app (habits.parda.me) in the cockpit-app Nx monorepo. React 19 + Vite 6 + Tailwind v4 + shadcn/ui frontend. FastAPI backend. 3 habit types, Daylio-style icon grid, forgiving streaks, push notifications, multi-user.

## Q&A (Phase 1 Clarifications)
- **Lib structure**: Inline in apps/habits/src/ (no new libs)
- **APScheduler**: Already configured at core/scheduler.py — habits registers additional jobs
- **Spec source**: Use product-design feature-spec.md as-is; spec-creator enriches with technical details

## Q&A (Phase 5 Requirements)
- **Cockpit card**: Add habits card to the Apps/Services grid page (where Vikunja, Actual etc. live)
- **Habit icons**: Custom SVG icon library (not emoji picker)
- **Drag-to-reorder**: Both categories AND habits within a category (full drag-to-reorder)

## Scope Decisions
- Port 4206
- pywebpush in v1
- Standalone push_notification_service module
- Auth required on GET /api/v1/presets (consistent with other endpoints)
- Denormalized best_streak column on habits table
- Recharts pinned to latest stable

## Functional Requirements Summary
1. Nx app scaffolding at apps/habits/ with React 19 + Vite 6 + Tailwind v4 + shadcn/ui
2. FastAPI service at cockpit-api/src/services/habits/ with 3-layer structure
3. 6 DB tables: habits, habit_categories, habit_entries, habit_streak_freezes, user_habit_settings, preset_habits
4. 3 habit types: boolean (one-tap), numeric (popup + target), text diary (90vh modal auto-save)
5. Today view: Daylio-style icon grid, grouped by category, category drag-to-reorder + habits within category drag-to-reorder
6. Custom SVG icon library for habit icons (not emoji)
7. Streak modes: soft (1-miss grace, default), hard, none — per-habit configurable; streak freeze 2/month
8. Per-habit graphs: heatmap (boolean), line+bar (numeric), timeline (text) — 5 time ranges
9. Stats screen: today %, weekly chart, streak ranking
10. Preset habit library + custom habit creation
11. User-defined categories with color
12. Browser push notifications (pywebpush + APScheduler job)
13. Multi-user scoped by user_id
14. Mobile-first (Lighthouse ≥ 80)
15. Add habits card to cockpit Apps/Services grid page

## Reusability Opportunities
- cockpit-app/apps/cockpit/ — direct app scaffold template
- cockpit-api/src/services/users/ — FastAPI 3-layer template
- cockpit-api/src/core/scheduler.py — APScheduler (extend with push job)
- @cockpit-app/shared-react-ui — shadcn/ui components (Card, Button, Sheet, Select, AlertDialog, Toaster)
- @cockpit-app/shared-react-data-access — fetcher + TanStack Query setup
- @dnd-kit/core + @dnd-kit/sortable — already installed in package.json

## Scope Boundaries
**In scope**: All features listed above for v1
**Out of scope**: Mood tracking, Vikunja/brain notes integration, native mobile app, social features

## Visual Assets
- Daylio screenshot referenced in product-design context
- Full UX research and feature spec at .maister/tasks/product-design/2026-05-21-habit-tracker-app/analysis/feature-spec.md
