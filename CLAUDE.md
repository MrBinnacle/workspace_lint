# workspace_lint

A local, read-only CLI that tests a Notion workspace against explicit structural rules. Read `CONTEXT.md` before proposing anything — it holds the glossary, the principles, the v0.1 rule catalog, and the non-goals.

This repository is canonical. External planning artifacts (Notion pages, memos, drafts) are inputs. They do not override `CONTEXT.md` or the ADRs in `docs/adr/`.

Pre-build: no source code exists yet. The next gate is the 72-hour API proof described in `CONTEXT.md`.

## Agent skills

### Issue tracker

Issues live as GitHub issues, driven by the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` at the repo root plus `docs/adr/`. See `docs/agents/domain.md`.
