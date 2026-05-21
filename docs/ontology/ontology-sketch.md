# Cockpit Ontology Sketch

Questions this ontology must answer:

- Which endpoints does each router expose?
- What entities does each service own?
- Which frontend pages call which API endpoints?
- What external integrations does each module depend on?
- Which MCP tools map to which backend services?
- What permissions guard each endpoint?
- What type of users can access what apps?
- How is frontend connected to backend in each app?
- What architecture pattern is used?
- How are users created?
- How to create a new app according to standards?
- How to create a new endpoint according to standards?
- What capabilities does MCP expose?
- Explain the auth process.
- How are apps connected to each other?
- How does the deployment process work?
- How to deploy a new app?
- What is the purpose of each app?
- What are tasks in Vikunja?
- How are users created for external apps (Vikunja, Actual Budget)?
- Do we have one API for all apps?
- What are CVs and CV-presets?
- What is Redis used for?
- How can a user get additional permissions?

---

## Node Types

### Platform Layer
- **System** — the cockpit monorepo as a whole
- **Monorepo** — cockpit-api (Python) + cockpit-app (Nx)

### Backend
- **BackendAPI** — single FastAPI app (`cockpit-api`), serves all frontend apps
- **ServiceModule** — a bounded module under `src/services/` (authentication, authorization, brain, health, mcp, oauth, redis_store, users, vikunja)
- **Router** — FastAPI APIRouter within a ServiceModule
- **Endpoint** — a single HTTP route (method + path)
- **Service** — business logic layer (`service.py`) within a ServiceModule
- **Repository** — data access layer (`repository.py`) within a ServiceModule
- **DBModel** — SQLModel ORM class mapped to a DB table (User, Permission, UserPermission, UserRole, OAuthClient, OAuthAuthorizationCode, AccessToken, RefreshToken, OAuthAccessToken, Feature, Action)
- **Permission** — named capability (e.g. `brain:read`, `vikunja:write`)
- **Role** — named set of permissions (e.g. `admin`, `user`)

### Auth & Session
- **AuthFlow** — cookie-based session auth (login → access token in HttpOnly cookie + refresh token)
- **OAuthFlow** — OAuth2 authorization code flow (for MCP clients)
- **Session** — active user session (AccessToken + RefreshToken in DB)
- **RedisStore** — key-value store; used for MCP OAuth tokens, Vikunja token cache

### MCP Layer
- **MCPServer** — FastMCP server mounted at `/mcp` in cockpit-api
- **MCPTool** — individual callable tool registered on MCPServer
- **MCPResource** — readable resource registered on MCPServer (brain notes)

### External Integrations
- **ExternalService** — external system cockpit integrates with
  - Vikunja (task management)
  - Actual Budget HTTP API (personal finance)
  - LiteLLM proxy (LLM routing)
  - Hermes agent (AI assistant, local config)
  - Git (brain notes persistence)

### Frontend
- **FrontendApp** — an Nx app (cockpit, login, cv, store)
- **Page** — a routed view within a FrontendApp
- **Component** — reusable UI element within a FrontendApp or NxLib
- **NxLib** — shared library (shared/ui/react, shared/data-access, shared/types/api-types, cockpit/ui)
- **ApiTypes** — OpenAPI-generated TypeScript types in `shared/types/api-types`

### Deployment
- **Container** — Docker container running on Raspberry Pi
- **CIPipeline** — GitHub Actions workflow
- **Registry** — GitHub Container Registry (ghcr.io/marcinparda/*)
- **DeployTarget** — Raspberry Pi host

### Domain Objects
- **VikunjaProject** — project in Vikunja
- **VikunjaTask** — task within a VikunjaProject
- **BrainNote** — markdown note in the brain notes git repo
- **CVPreset** — tailored CV variant stored in redis_store (name + sections dict)
- **CVSection** — named section within a CVPreset (summary, experience, skills, etc.)
- **BudgetAccount** — account in Actual Budget
- **BudgetTransaction** — transaction within a BudgetAccount

---

## Relationship Types

| From | Relationship | To |
|------|-------------|-----|
| System | contains | Monorepo (cockpit-api, cockpit-app) |
| Monorepo (cockpit-api) | exposes | BackendAPI |
| Monorepo (cockpit-app) | contains | FrontendApp |
| BackendAPI | includes | ServiceModule |
| ServiceModule | has | Router |
| ServiceModule | has | Service |
| ServiceModule | has | Repository |
| ServiceModule | owns | DBModel |
| Router | exposes | Endpoint |
| Endpoint | guardedBy | Permission |
| Endpoint | delegatesTo | Service |
| Service | uses | Repository |
| Repository | persists | DBModel |
| Service | calls | ExternalService |
| BackendAPI | mounts | MCPServer |
| MCPServer | registers | MCPTool |
| MCPServer | registers | MCPResource |
| MCPTool | calls | Service |
| MCPTool | calls | ExternalService |
| User | hasRole | Role |
| Role | grants | Permission |
| User | hasExtra | Permission |
| FrontendApp | calls | Endpoint |
| FrontendApp | uses | NxLib |
| FrontendApp | uses | ApiTypes |
| FrontendApp | contains | Page |
| Page | contains | Component |
| NxLib | contains | Component |
| ApiTypes | generatedFrom | BackendAPI |
| FrontendApp | deployedAs | Container |
| BackendAPI | deployedAs | Container |
| Container | builtBy | CIPipeline |
| Container | pushedTo | Registry |
| Container | runningOn | DeployTarget |
| CIPipeline | triggers | CIPipeline |
| MCPTool | manages | VikunjaProject |
| MCPTool | manages | VikunjaTask |
| MCPTool | manages | BrainNote |
| MCPTool | manages | BudgetAccount |
| MCPTool | manages | BudgetTransaction |
| MCPTool | manages | CVPreset |
| CVPreset | contains | CVSection |
| Service | reads | RedisStore |
| Service | writes | RedisStore |
| AuthFlow | issues | Session |
| OAuthFlow | issues | OAuthAccessToken |
| FrontendApp | authenticatedVia | AuthFlow |
| MCPServer | authenticatedVia | OAuthFlow |

---

## App → Purpose Mapping

| App | Purpose | Auth required |
|-----|---------|---------------|
| login | Authentication UI (login, password change) | No (public) |
| cockpit | Personal dashboard (task overview, app links) | Yes |
| cv | CV editor and preset manager | Yes |
| store | Redis key-value store browser | Yes |

## Service Module → Responsibility

| Module | Owns | External? |
|--------|------|-----------|
| authentication | sessions, tokens, passwords | No |
| authorization | roles, permissions, user-permissions | No |
| users | user CRUD | No |
| oauth | OAuth2 client/token flows for MCP | No |
| brain | markdown note CRUD | Git (external) |
| redis_store | generic key-value store | Redis |
| vikunja | task proxy | Vikunja API |
| health | health check | No |
| mcp | MCP server + tools | Vikunja, Actual, Git, LiteLLM |

## MCP Tool Groups

| Group | Tools |
|-------|-------|
| brain | brain_search_notes, brain_get_note, brain_list_notes, brain_list_folders, brain_create_note, brain_update_note, brain_delete_note |
| budget | actual_list_accounts, actual_create_account, actual_list_categories, actual_list_payees, actual_search_transactions, actual_create_transaction, actual_batch_create_transactions, actual_update_transaction, actual_delete_transaction |
| tasks | vikunja_list_projects, vikunja_get_tasks, vikunja_create_task, vikunja_update_task, vikunja_delete_task, vikunja_assign_user_to_task, vikunja_remove_assignee, vikunja_list_users |
| cv | search_company, get_cv_base_preset, preview_cv_preset, save_cv_preset |
| hermes | hermes_get_model, hermes_set_model |
