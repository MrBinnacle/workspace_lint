# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v` — `gh` does this automatically when run inside a clone.

## ⛔ A commit body can close an issue by accident, and it has done so four times

**GitHub parses `<keyword> #<number>` in any merged commit body or PR body as a closing directive.**
The keywords are `close`, `closes`, `closed`, `fix`, `fixes`, `fixed`, `resolve`, `resolves`,
`resolved`. Prose that merely *describes* a closure is indistinguishable from an instruction to
perform one, because the parser reads the two adjacent tokens and nothing else.

**This is not hypothetical here.** Four issues in this repository were closed by narrative sentences
in state-file commit messages — never by anyone deciding to close them:

| merge | issue auto-closed | lag |
|---|---|---|
| PR #41 `2026-08-17T15:21:53Z` | **#10** | +2s |
| PR #72 `2026-08-18T05:03:27Z` | **#73** +1s, **#7** +2s | |
| PR #104 `2026-08-19T02:44:58Z` | **#70** | +2s |

The #70 case is the clearest. Commit `71d26ed` said *"Five isolated SME seats **resolved #70**
decision 1"* — a true, careful sentence naming exactly one of four decisions. The parser matched
`resolved #70`, closed the whole ticket as `COMPLETED`, and decisions 2, 3 and 4 left the board.

### Two rules

1. **Word order.** Put the reference before the verb when you are describing, not directing:
   ✅ `#70 decision 1 was resolved` · ✅ `per #70` · ✅ `the ruling on #70`
   ⛔ `resolved #70` · ⛔ `closes #7` · ⛔ `fixed #10`
   A closing keyword immediately followed by a reference must appear **only** when you intend the
   close — which is the normal case in a feature PR body and the rare case in a state-file commit.
2. **Before merging anything, grep your own message:**
   `git log -1 --pretty=%B | grep -oiE "(clos(e|es|ed)|fix(es|ed)?|resolv(e|es|ed))[[:space:]]+#[0-9]+"`
   Everything it prints will close on merge. If that is not what you meant, amend before pushing.

### And the attribution does not tell you what happened

⛔ **An auto-close is credited to the person who merged, with `stateReason: COMPLETED`** — exactly
like a deliberate close. In this repository every timeline actor is `MrBinnacle`, which is at once
the maintainer's account, the identity `gh` writes as, and the merger. **`actor` cannot distinguish
a human decision from a parser accident**, and reading it as the former cost three sessions of
maintainer attention on #70 before anyone checked the merge timestamps.

**The tell is the lag.** An auto-close lands one to two seconds after a merge. When an issue's
closure is surprising, compare `closedAt` against the merge times of PRs that landed in the same
minute before assuming a person meant it.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` then keep only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` (drop `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either — resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --label wayfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (`gh api` on the sub-issues endpoint). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: GitHub's **native issue dependencies** — the canonical, UI-visible representation. Add an edge with `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, _not_ the `#number` or `node_id`). GitHub reports `issue_dependencies_summary.blocked_by` (open blockers only — the live gate). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Frontier query**: list the map's open children (`gh issue list --state open`, scoped to the map's sub-issues / task list), drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me` — the session's first write.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.
