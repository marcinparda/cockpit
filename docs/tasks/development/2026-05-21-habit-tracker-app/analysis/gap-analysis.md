# Gap Analysis: Habit Tracker App

## Summary
- **Risk Level**: Medium
- **Estimated Effort**: High
- **Detected Characteristics**: modifies_existing_code, creates_new_entities, involves_data_operations, ui_heavy

## Task Characteristics
- Has reproducible defect: no
- Modifies existing code: yes (3 existing files + 2 CI/CD files)
- Creates new entities: yes (entire habits service, habits app, 6 DB tables)
- Involves data operations: yes (CRUD on habits, entries, categories, freezes, settings, presets)
- UI heavy: yes (Today grid, Habit detail, Stats, Settings, creation Sheet)

## Gaps Identified

### Missing — Backend
- `cockpit-api/src/services/habits/` — entire service (router, service, repository, models, schemas, streak_service)
- 6 new tables: habits, habit_categories, habit_entries, habit_streak_freezes, user_habit_settings, preset_habits
- `Features.HABITS` enum value in enums.py
- Alembic schema migration + permissions seed migration + preset seed migration
- `pywebpush` dependency (not in pyproject.toml)
- Push notification job in core/scheduler.py

### Missing — Frontend
- `cockpit-app/apps/habits/` — entire Nx React app
- `apps/habits/Dockerfile` + `nginx/habits.conf`
- Recharts dependency (not in package.json)
- Service Worker (`apps/habits/public/sw.js`) for Web Push subscription

### Missing — CI/CD
- Habits app block in `.github/workflows/app-deploy.yml`
- Habits entry in `deployment-scripts/deploy-apps.sh` port map

### Integration Points (existing files to modify)
1. `enums.py`: add `HABITS = "habits"`
2. `scheduler.py`: add push notification job registration
3. `main.py`: import and mount habits router at `/api/v1/`
4. `app-deploy.yml`: add habits build/push block
5. `deploy-apps.sh`: add `[habits]="4206"` to port map

## Decisions
See scope-clarifications.md for resolved decisions.

## Risk Assessment
- Complexity Risk: Medium (streak_service.py branching complexity)
- Integration Risk: Low (all changes additive)
- Regression Risk: Low (no existing logic modified)
- Coverage Risk: Medium-High (80% CI gate; streak logic + animated UI components)
- Deployment Risk: Low-Medium (pywebpush new dependency; Service Worker new pattern)

## Recommendations
1. Start with Alembic migrations (PostgreSQL ENUMs before ORM models)
2. Implement streak_service.py as isolated pure functions with full test coverage first
3. Service Worker (sw.js) needs deliberate design — new pattern for this codebase
4. Use raw SQLAlchemy `insert().on_conflict_do_update()` for habit entry upsert (SQLModel limitation)
5. Plan tests alongside implementation due to 80% CI gate
