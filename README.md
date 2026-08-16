# workspace_lint

## Status

Scaffolded, not yet built. The repository currently contains agent configuration and nothing else — no source code, no build, no tests.

The project's purpose is not yet written down. Define it before the first feature ticket, either in this section or in `CONTEXT.md`.

## What is here

| Path                            | Purpose                                                        |
| ------------------------------- | -------------------------------------------------------------- |
| `CLAUDE.md`                     | Project grounding read by Claude Code on every session.          |
| `docs/agents/issue-tracker.md`  | Where issues live: GitHub Issues, driven by the `gh` CLI.        |
| `docs/agents/triage-labels.md`  | The five triage label strings used on this repo's issues.        |
| `docs/agents/domain.md`         | Domain-doc layout: single-context, root `CONTEXT.md` + `docs/adr/`. |

## Issue tracking

Issues live at https://github.com/MrBinnacle/workspace_lint/issues.

Five triage labels exist on the repo: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Their meanings are in `docs/agents/triage-labels.md`.

## Development

No toolchain is chosen yet. `.gitignore` covers Node, Python, and Rust artifacts so the first commit of real code does not drag build output into the repository. Trim the sections that do not apply once the stack is settled.
