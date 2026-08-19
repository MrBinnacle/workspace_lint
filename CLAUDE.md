# workspace_lint

A local, read-only CLI that tests a Notion workspace against explicit structural rules.

**Read `CONTEXT.md` before proposing anything** — the glossary, the principles, the v0.1 rule catalog and the non-goals. This repository is canonical, and its decision surfaces are `CONTEXT.md`, `PRODUCT.md`, `docs/adr/` and `docs/spec/`. A Notion page, memo or draft is an input and never overrides one.

Building. Source is on `main` in `slice/` — a private, unpublishable package, deliberately not `src/` until #8 settles the npm name. Three of the four v0.1 rules are built: `SYS001`, `REF001` and `REQ001`.
<!-- claim: exists path="slice/scan.ts" -->
<!-- claim: exists path="slice/sys001.ts" -->
<!-- claim: exists path="slice/ref001.ts" -->
<!-- claim: exists path="slice/req001.ts" -->
<!-- claim: absent path="slice/unq001.ts" -->
<!-- claim: absent path="slice/src" -->

Gate, and it is one command: `cd slice && npm run check`. Offline, no network, no token. The typecheck runs first and the chain is `&&`, so a type error stops the gate before any assertion runs. It was not always so — until #60 closed, `npm run check` ran no compiler and a tree that did not compile printed `ALL CHECKS PASS` at exit 0. `CHECK-suite-registration.ts` TEST 4 is the control that keeps the compiler in the chain.

**The gate reads this file back.** `CHECK-claims.ts` evaluates the `<!-- claim: ... -->` comments here and in five other documents, and a false claim turns the gate red (#62). Its header states what the three kinds cover and what they cannot. **An unannotated sentence is unchecked**, so write the checkable form or expect the sentence to rot: this file asserted a blocker `#59` never had, and no gate caught it. Extending the kinds to status claims is #103.

## Where the answers live

**Domain docs — `docs/agents/domain.md`.** Read it before asserting a factual claim, before writing
or citing an ADR or spec, and before naming a domain concept. It holds the read order, the evidence
ladder, the three method rules, the citation standard and the source ladder. **Evidence outranks
assertion, and an ADR is an assertion** — two ADRs have contradicted a file already in this repo
(#25), and `docs/proof/` beats documentation on any question of fact.

**Issue tracker — `docs/agents/issue-tracker.md`.** Issues are GitHub issues, driven by the `gh` CLI.
Read it before filing, triaging, closing or picking up work; it carries the frontier query that names
which ticket is next.

**Triage labels — `docs/agents/triage-labels.md`.** The five canonical triage roles.

Commit scope names the surface changed — `state`, `slice`, `rule`, `spec`, `adr`, `context`, `agents`,
`triage`, `claude`. `git log --format=%s` is the live list.
