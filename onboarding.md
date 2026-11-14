# AI SDLC — Onboarding

For new/returning devs (human or AI) working in this repo. Work is tracked in **GitHub Issues** and driven by Matt Pocock's skills. No process-owning plugin, no task files in the repo. Decision record: [`docs/adr/0001-github-issues-as-work-tracker.md`](docs/adr/0001-github-issues-as-work-tracker.md).

## What lives where

| Where | What |
|---|---|
| GitHub Issues (`marcinparda/cockpit`) | Specs, tickets, bugs, progress, finished-work history |
| `CONTEXT.md` (root, created lazily) | Domain glossary only, no implementation detail |
| `docs/adr/` | Hard-to-reverse decisions that were a real trade-off |
| `docs/standards/` | All "how to write code here" rules |
| `docs/projects/`, `docs/backend/`, `docs/deployment/` | Facts about apps, the API, deployment |
| `docs/agents/` | Config the skills read: issue tracker, triage labels, domain-doc layout |
| `AGENTS.md` (root, `cockpit-api/`, `cockpit-app/`) | Pointer files: what a module is, links into `docs/` |

Old task history (`docs/tasks/`, maister era) was backfilled as closed issues labelled `archive` (#78–#83). Originals: git tag `pre-github-workflow`. Vikunja is for personal/household tasks only, not repo work.

## Skills

Matt Pocock's skills are vendored in [`.claude/skills/`](.claude/skills/README.md), so any clone has them. Some are user-only: type `/name` yourself.

| Step | Skill | Result |
|---|---|---|
| Stress-test an idea, build the domain model | `/grill-with-docs` (or `/grilling` for plain interrogation) | decisions, updates `CONTEXT.md` and ADRs |
| Write the spec | `/to-spec` | spec issue on GitHub |
| Slice it | `/to-tickets` | tracer-bullet ticket issues with blocking links |
| Sort incoming issues | `/triage` | triage labels applied |
| Build | `/implement` (drives `/tdd`, ends with `/code-review`) | commits on a branch |
| Review | `/code-review` | standards + spec review of the diff |
| Hard bug | `/diagnosing-bugs` | root cause, regression test |
| Big, fuzzy chunk of work | `/wayfinder` | map issue + decision tickets |
| Not sure which | `/ask-matt` | router |

Also available: `/prototype`, `/research`, `/codebase-design`, `/improve-codebase-architecture`, `/resolving-merge-conflicts`, `/handoff`.

## The loop

1. Idea or bug → `/grill-with-docs` (new feature) or `/diagnosing-bugs` (bug).
2. `/to-spec`, then `/to-tickets`. Tickets that are fully specified get `ready-for-agent`.
3. `/implement #<ticket>` per ticket: TDD, PR with `Closes #<n>`.
4. `/code-review`, merge. The issue closes itself; the issue thread is the work log.

Before touching code, read the relevant `AGENTS.md` and `docs/standards/` for the domain (see [`docs/AGENTS.md`](docs/AGENTS.md)).

## Working from a phone

Start a Claude Code session on the repo from the Claude app, then type e.g. `/implement #123` or `/to-spec` with your idea. The skills come from the repo's `.claude/skills/`. Agents start only when you start a session; nothing picks up `ready-for-agent` issues on its own yet.
