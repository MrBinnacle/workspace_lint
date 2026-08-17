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

Canonical: `CONTEXT.md` and `PRODUCT.md` at the repo root, plus `docs/adr/`.

**Evidence outranks assertion, and an ADR is an assertion.** `docs/research/` holds what primary
sources state; `docs/proof/` holds what the API actually did and beats documentation. Read both
*before* asserting a factual claim, not after — two ADRs have contradicted evidence already in this
repo (issue #25), a third asserted into a silence a reference page would have filled, and on
2026-08-17 the two files holding the session's largest finding went unread because neither directory
was named here. `docs/inputs/` is external and never authority.

Read order, the three method rules, and the citation standard: `docs/agents/domain.md`.
