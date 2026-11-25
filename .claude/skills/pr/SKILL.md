---
name: pr
description: "Open or update a pull request on marcinparda/cockpit: implementation-review body, conventional title, marcinparda as assignee, labels picked from the repo's own label list."
disable-model-invocation: true
---

Open a pull request for the current branch, or update the one that exists. `$ARGUMENTS` is an optional issue number the PR closes.

Uses the `gh` CLI (`docs/agents/issue-tracker.md`).

## 1. Write the body

Write it from the diff (and the issue's Agent Brief when there is one) to `<scratchpad>/pr-body.md`. Order:

1. `## Summary`: one or two lines, then `Closes #<n>` on its own line when an issue is given.
2. `## Implementation review`: one bullet per acceptance criterion, ticked against the brief, each naming the files and the seam that proves it. Then the decisions taken and their trade-offs, anything the brief left open, any deviation from the brief, and what stays out of scope. Without an issue, list what the change does instead of criteria.
3. `## Using simpler words`: the same change explained for a learner. Plain language, every term of art defined on first use, one concrete example with real values from this change (a before/after, or a walk through one input), and an everyday analogy where one fits. It adds understanding the review above lacks; it does not repeat the review shorter.
4. `## Test plan`: the commands run and their results.

End the body with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

Done when every acceptance criterion has a bullet that cites a file, and the simpler-words example uses values from this diff.

## 2. Pick labels

Read the live list, never a remembered one:

```
gh label list --repo marcinparda/cockpit --limit 100
```

Choose from it by each label's description:

- One **category** label that fits the change (`bug`, `enhancement`, `documentation`, ...).
- Every **project** label (description starts `Project:`) whose area the diff touches.
- When an issue is given, start from its labels (`gh issue view <n> --json labels`) and drop workflow labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`): they describe issue state, not the PR.

Use only labels that exist in the list.

## 3. Open the PR

```
git push -u origin HEAD
gh pr create --base master --title "<conventional title>" --body-file <scratchpad>/pr-body.md \
  --assignee marcinparda --label "<label>" --label "<label>"
```

- Title in conventional-commit style: `fix(habits): ...`.
- Assignee is `marcinparda` unless the user names someone else.
- Merge closes the issue through `Closes #<n>`; closing by hand is never needed.

## 4. Update an existing PR

When the PR is already open, edit the body file and run `gh pr edit <pr> --body-file <scratchpad>/pr-body.md`. Add missing labels with `--add-label` and a missing assignee with `--add-assignee marcinparda`.

Done when `gh pr view <pr> --json assignees,labels,body` shows the assignee, the labels and the full body.
