# GitHub Issues are the source of truth for work

Specs (PRDs), tickets, bugs and task history live in GitHub Issues of `marcinparda/cockpit`, driven by the Matt Pocock skills. Repo files hold only durable knowledge: `CONTEXT.md`, `docs/adr/`, `docs/standards/`, `docs/projects/`.

## Considered options

- **`docs/tasks/<type>/<date>-<slug>/{spec,plan,work-log}.md` (previous setup)**: no status, no links between slices, stale quickly, 6 MB of history agents had to search past. Replaced.
- **Vikunja**: stays for personal/household tasks only; not used for repo work.

## Consequences

- Old task history was backfilled as closed issues labelled `archive` (#78–#83); originals remain readable at git tag `pre-github-workflow`.
- Agents read work items with `gh issue view`, not from files.
