# Scope Clarifications

## Critical Decisions

### Port assignment
**Decision**: Port 4206 for habits container
**Applies to**: deploy-apps.sh port map, Vite dev server, Dockerfile EXPOSE, nginx config

### Push notifications
**Decision**: Add pywebpush to pyproject.toml; implement browser push in v1
**Applies to**: cockpit-api/src/services/habits/push_notification_service.py (new), pyproject.toml

### Scheduler DB session pattern
**Decision**: Standalone push_notification_service module (matches token_cleanup_service pattern)
**Applies to**: cockpit-api/src/core/scheduler.py (calls push_notification_service), habits backend

## Important Decisions

### GET /api/v1/presets authentication
**Decision**: Require auth (consistent with all other habits endpoints)
**Applies to**: habits router — presets endpoint uses require_permission(Features.HABITS, Actions.READ)

### best_streak storage
**Decision**: Denormalized column on habits table, updated on each entry write
**Applies to**: habits models.py (best_streak: int column), streak_service.py (update logic)

### Cockpit dashboard card
**Decision**: Add habits card to cockpit app (apps/cockpit/) in this task
**Applies to**: apps/cockpit/src/app/app.tsx or app cards component — add habits.parda.me entry
**Note**: Scope expanded from default

### Recharts version
**Decision**: Pin to latest stable at implementation time (verify before adding)
**Applies to**: cockpit-app/package.json

## Scope Expansion
- **+1 change**: Add habits entry to cockpit app cards (apps/cockpit/src/) — small additive change
