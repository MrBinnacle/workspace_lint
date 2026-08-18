# workspace_lint

A local, read-only CLI that tests a Notion workspace against explicit structural rules. Read `CONTEXT.md` before proposing anything — it holds the glossary, the principles, the v0.1 rule catalog, and the non-goals.

This repository is canonical. External planning artifacts (Notion pages, memos, drafts) are inputs. They do not override `CONTEXT.md` or the ADRs in `docs/adr/`.

Building. Source is on `main` in `slice/` — a private, unpublishable package, deliberately not `src/` until #8 settles the npm name. Two of the four v0.1 rules are built: `SYS001` and `REF001`. `REQ001` and `UNQ001` are #58 and #59. Both pre-build gates closed on 2026-08-17 and nothing gates the build.
<!-- claim: exists path="slice/scan.ts" -->
<!-- claim: exists path="slice/sys001.ts" -->
<!-- claim: exists path="slice/ref001.ts" -->
<!-- claim: absent path="slice/req001.ts" -->
<!-- claim: absent path="slice/unq001.ts" -->
<!-- claim: absent path="slice/src" -->

Gate, and it is one command: `cd slice && npm run check` typechecks the tree and then runs 676 offline assertions, with no network and no token. The typecheck runs first and the chain is `&&`, so a type error stops the gate before any assertion runs. It was not always so — until #60 closed, `npm run check` ran no compiler and a tree that did not compile printed `ALL CHECKS PASS` at exit 0. `CHECK-suite-registration.ts` TEST 4 is the control that keeps the compiler in the chain.

**The gate now reads this file back.** `CHECK-claims.ts` evaluates the `<!-- claim: ... -->` comments in this and five other documents (#62). A claim states what would falsify it — a file count, a path that must exist or must not — and the gate fails when one is false. The sentence above about which rules are built is checked that way. **An unannotated sentence is unchecked, and most sentences are unannotated**; tracker-backed status ("gate 2 is open") and identifier claims are deferred, with reasons in the suite's header.

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
