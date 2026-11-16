# Cockpit

Self-hosted personal platform that consolidates tasks, finance, notes, habits, CV and AI-assisted workflows behind one login. Built for a single owner, with the user model deliberately kept multi-user-capable.

## Language

### Platform

**Cockpit**:
The whole platform: the API, all Apps and the external services they integrate.
_Avoid_: cockpit-app (as a name for the platform), the monorepo

**Dashboard**:
The App at `apps/cockpit`, the main entry point for tasks, budget, notes and the agent.
_Avoid_: cockpit app, main app

**App**:
One independently deployed frontend under `apps/` (Dashboard, Login, CV, Store, Habits).
_Avoid_: frontend, project, site

**API**:
The Cockpit backend (`cockpit-api`): REST endpoints plus the MCP server.
_Avoid_: backend, server, cockpit-api (as a conceptual name)

**CV**:
The App that shows the owner's public CV to anonymous visitors and the private app to a logged-in user.
_Avoid_: portfolio

### Users and access

**Authentication**:
Proving who a user is via the Login App and cookie sessions. Distinct from OAuth, which is only one flow the API exposes for external clients.
_Avoid_: auth (in prose), OAuth (as a synonym)

**Session**:
A cookie-based login (HttpOnly session and refresh cookies) used by Apps.
_Avoid_: token (bare), JWT

**Access token**:
An OAuth token issued to an external client (e.g. Claude) so it can call the MCP server.
_Avoid_: token (bare), session

**MCP API key**:
The single static bearer secret (`MCP_API_KEY`) that grants access to the MCP server.
_Avoid_: API key, token

**Permission**:
A Feature and Action pair (e.g. `habits` + `read`) that a User is allowed to perform.
_Avoid_: access right, scope

**Role**:
A named bundle of Permissions. A User may also hold Permissions directly, outside any Role.
_Avoid_: group

### Knowledge

**Brain**:
The knowledge subsystem of Cockpit: the Vault plus the API tools and endpoints that read and write it.
_Avoid_: notes service, notes repo

**Vault**:
The Obsidian folder of Markdown files that the Brain operates on. Synced outside the app.
_Avoid_: brain folder, notes directory

**Note**:
One Markdown file in the Vault, with optional frontmatter (title, tags, type, properties).
_Avoid_: page, document, file

**Note type**:
The free-string `type` in a Note's frontmatter (e.g. `concept`, `tool`, `person`, `source`). Not a closed set.
_Avoid_: category, kind

**Proactive note**:
A Note of type `context` or `reference`, which the `brain://notes` MCP resource surfaces to agents as standing background context.
_Avoid_: pinned note, system note

### Habits

**Habit**:
A recurring behavior a User tracks, with a value type (`boolean`, `numeric`, `text`), a frequency and a Streak mode.
_Avoid_: goal, routine

**Entry**:
One logged result of a Habit on a date.
_Avoid_: log, check-in, completion

**Streak**:
The count of consecutive completed periods of a Habit, governed by its Streak mode.
_Avoid_: chain, run

**Streak mode**:
How missed periods affect a Streak: `none` (no streak tracked), `hard` (any miss breaks it) or `soft` (a miss is forgiven once per allowance window).
_Avoid_: strictness, difficulty

**Streak freeze**:
A period the User marks (e.g. a vacation) during which missed Entries do not break the Streak.
_Avoid_: pause, vacation mode, skip

**Habit category**:
A user-defined grouping of Habits.
_Avoid_: tag, folder

**Preset habit**:
A built-in template that is copied into a User's own Habits. Not a live link.
_Avoid_: default habit, template habit

### AI and integrations

**Agent**:
Any AI client acting on Cockpit through the MCP server (today Claude Code; could be Pi or others). Not a Cockpit component.
_Avoid_: assistant, bot, agent app

**MCP tool**:
A callable action the MCP server exposes to an Agent (e.g. `brain_create_note`, `vikunja_create_task`).
_Avoid_: function, endpoint

**MCP resource**:
Read-only data the MCP server exposes to an Agent (e.g. `brain://notes`).
_Avoid_: tool, endpoint

**Redis store**:
The key-value data kept in Redis and browsed through the Store App.
_Avoid_: store (bare), cache, KV store

**LiteLLM**:
The self-hosted LLM gateway on the Raspberry Pi through which AI traffic is routed.
_Avoid_: proxy, LLM router

**Langfuse**:
The observability service LiteLLM logs to; planned to feed Cockpit dashboards.
_Avoid_: tracing, analytics

### External services

**Task**:
A unit of work stored in Vikunja. Cockpit holds no tasks itself.
_Avoid_: todo, ticket (reserved for GitHub issues)

**Project**:
A Vikunja grouping of Tasks.
_Avoid_: list, board

**Budget**:
The personal finances kept in Actual Budget (accounts, categories, payees, transactions), reached through the `actual-http-api` wrapper.
_Avoid_: finance, money

**Raspberry Pi**:
The single home host where all Cockpit containers and external services run.
_Avoid_: server, prod box

## Relationships

- Cockpit is built for one owner today; the User, Role and Permission model stays so multi-user remains possible.
- Every App authenticates through a Session created by the Login App; external Agents use an Access token or the MCP API key instead.
- An Agent reaches the Brain, Tasks, Budget and CV only through MCP tools and MCP resources.
- The Brain owns the Vault; Tasks, Projects and the Budget belong to external services, not the API.
- A Habit has many Entries and Streak freezes; a User's Habits may start from a Preset habit copy.
- AI traffic routed through LiteLLM is logged to Langfuse.
