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

### Frontend libraries

**Shared UI**:
The lib `shared-react-ui` holding generic components used by two or more Apps. Pure: imports no data-access.
_Avoid_: component library, design system

**App shell**:
The shared frame around every App's pages: header (logo to the Dashboard, App name, nav, user area, theme toggle) plus a bottom nav on phones. `AppShell` is pure and lives in Shared UI; it takes the App name, nav items and user-area and actions slots. `RequireUser` and `UserMenu` (Shared feature) fill the user area.
_Avoid_: layout (per-App), navbar

**App UI**:
The lib `libs/<app>/ui` holding presentational components used by one App. Pure like Shared UI; created only when the App needs it. Moves to Shared UI once a second App needs the component.
_Avoid_: components folder, local components

**App feature**:
The lib `libs/<app>/feature` holding data-connected containers of one App: they use data-access hooks and compose App UI and Shared UI. Created only when the App needs it. Unrelated to the Feature in a Permission.
_Avoid_: feature (bare), container lib, smart components

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
A Feature and Action pair (e.g. `habits` + `read`; a Feature here is an API permission area, not an App feature lib) that a User is allowed to perform.
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
One Markdown file in the Vault, with optional frontmatter (title, type, properties).
_Avoid_: page, document, file

**Note type**:
The free-string `type` in a Note's frontmatter (e.g. `concept`, `tool`, `person`, `source`). Not a closed set.
_Avoid_: category, kind

**Proactive note**:
A Note of type `context` or `reference`, which the `brain://notes` MCP resource surfaces to agents as standing background context.
_Avoid_: pinned note, system note

**Link**:
A `[[wikilink]]` from one Note to another, written either in frontmatter or in the body. Notes are the nodes of the Vault's graph; Links are what connect them.
_Avoid_: reference, backlink (a backlink is a Link seen from its target)

**Relation**:
What a Link means: the frontmatter key that holds it (e.g. `part_of`, `depends_on`). A Link in the body has the relation `body`.
_Avoid_: edge label, link type

**Edge**:
A Link in a frontmatter value; its key is its Relation.
_Avoid_: typed edge, property link

**Mention**:
A Link in the body of a Note. It records that one Note refers to another and nothing more.
_Avoid_: untyped edge, plain link

**Base relation**:
One of the four general Relations used before inventing anything new: `related` (mutual), `part_of`, `depends_on`, `sources`.
_Avoid_: core relation, default relation

**Specific relation**:
A Relation for a case a Base relation is too vague for (e.g. `instructor`, `recommended_by`, `evidence`). Used only once listed in the vocabulary.
_Avoid_: custom relation, ad hoc relation

**Relation vocabulary**:
The set of Relations allowed in the Vault, kept in the "Edges" section of the Vault's `README.md`, which is its single source of truth. A Relation not listed there is added there first.
_Avoid_: edge list, schema

### Habits

**Habit**:
A recurring behavior a User tracks, with a value type (`boolean`, `numeric`, `text`), a frequency and a Streak mode.
_Avoid_: goal, routine

**Entry**:
One logged result of a Habit on a date. A boolean Entry is _done_ (`true`), _not done_ (`false`) or _not logged_ (no row); only _done_ counts as completion for Streaks and stats, so _not done_ and _not logged_ behave identically (a _not done_ in a period still in progress is not yet a miss). Numeric and text Entries always count as completion.
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

**Daily reminder**:
The single push notification a User may schedule per day, set in Settings as a time of day plus an IANA timezone (off until a time is chosen). Sent at most once per local day, and skipped when every due Habit (non-archived) already has a done Entry today or no Habit is due. Not per Habit.
_Avoid_: habit reminder, per-habit reminder, alarm

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
- Targets of an Edge are unrestricted: any Note type may point to any other.
- The Brain owns the Vault; Tasks, Projects and the Budget belong to external services, not the API.
- A Habit has many Entries and Streak freezes; a User's Habits may start from a Preset habit copy.
- AI traffic routed through LiteLLM is logged to Langfuse.
