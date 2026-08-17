# workspace-lint

A local, read-only CLI that tests a Notion workspace against explicit structural rules.

Run one command. Get a reproducible report: which declared rules no longer hold, the evidence for each defect, a direct link to the affected resource, and one plain repair action.

Working tagline: *CI for Notion workspaces.*

The tool tests rules you declare. It does not judge workspace quality, and it does not infer intent, ownership, or canon from prose.

**This file is not canonical.** [`CONTEXT.md`](CONTEXT.md), [`PRODUCT.md`](PRODUCT.md) and [`docs/adr/`](docs/adr/) are. Where this README and an ADR disagree, the ADR is right and this file is the defect — which has already happened once, in four places at once (issue #39).

## Status

**Building, at n=1.** Source exists on the branch `build/t3-ref001`, in `slice/` — a deliberately private, unpublishable package. It is **not** on `main` and it is **not** `src/`, because naming a tree `src/` claims it is the product tree and that claim is due the same day [issue #8](../../issues/8), the npm name, lands.

Both pre-build gates are **closed**, and nothing gates the build:

| Gate | Status |
| --- | --- |
| **1 — the demand test** | **Closed 2026-08-17**, on owner research rather than a five-team send. It chose an entry point and **did not establish a price.** |
| **2 — the 72-hour API proof** | **Closed 2026-08-17.** It was circular as filed: six of its nine checks required the build it existed to gate. Its checks are **build-acceptance criteria**, not pre-build gates. Results in [`docs/proof/`](docs/proof/). |

Stop condition, unchanged and not triggered: stop the project if the scan cannot produce a coverage manifest **against declared roots** and stable findings without write access or an LLM.

> The declared-root qualifier is load-bearing. ADR-0002 settled that completeness *against the workspace* is impossible — no endpoint enumerates a connection's grant — so a stop condition written without it stops the project on a settled fact. This was the **third** surface to carry the unqualified wording; `PRODUCT.md` and `CONTEXT.md` were corrected first.

## Two ideas that carry the product

**A partial scan cannot pass.** Notion's API only returns what has been shared with your connection. A green report over half a workspace is a lie, so coverage is part of the result: the report states its access boundary, and the run's exit byte is a function of how much of the declared scope was reached.

**Unknown is not broken.** Notion answers 404 for both "this object is gone" and "you cannot see this object". The report keeps those apart — `confirmed` findings are proved, `indeterminate` findings say what could not be established and why.

**And a third the product has had to learn.** A clean byte is not proof of a covered workspace. `GET /v1/blocks/{id}/children` carries no truncation signal, so a permission-filtered child list and a complete one are identical in the response. Every run therefore publishes a **residual** naming each enumeration it could not verify, and the count prints on the same line as the exit byte. See [ADR-0013](docs/adr/0013-an-unattested-enumeration-is-a-named-residual-not-a-gap.md).

## Rules in v0.1

Two built-in, six configured.

| ID | Checks | Mode |
| --- | --- | --- |
| `SYS001` | A declared root or applicable resource was not evaluated | Built-in |
| `REF001` | Internal target is archived, trashed, or unreachable | Built-in |
| `REQ001` | Selected resource lacks a required property value | Configured |
| `UNQ001` | Declared unique value occurs more than once | Configured |
| `SCH001` | Peer data sources have incompatible schemas | Configured |
| `REL001` | Relation violates its allowed target contract | Configured |
| `DEP001` | Active resource points to an inactive dependency | Configured |
| `CAN001` | One boundary holds more than one canonical marker | Configured |

`SYS001` is the **finding identity for a coverage gap** and does not carry the run-failure decision. Do not restate it as "scan result is incomplete" — incompleteness is now a field on every rule and a disposition on the report (ADR-0005 decision 4, and `CONTEXT.md`'s settled defaults, which name that exact re-widening as the thing not to do).

`SYS001` and `REF001` are built and running. The other six are deferred, not cut.

Six of eight need configuration, so a first run reports coverage and little else until you declare an invariant. That cost is deliberate — see [ADR-0001](docs/adr/0001-linter-not-entropy-engine.md).

## Intended command surface

Provisional beyond `scan`, which exists.

```bash
workspace-lint scan                                  # coverage + built-in checks
workspace-lint scan --config workspace-lint.yml      # full policy scan
workspace-lint baseline create --config workspace-lint.yml
workspace-lint explain REQ001
```

## Exit codes

**Reproduced from [ADR-0008](docs/adr/0008-exit-status-is-a-priority-signal-and-resolved-is-a-coverage-claim.md) decision 2 as amended, not paraphrased.** A paraphrase is what drifted last time, and this table is amended rather than quoted because two later ADRs changed rows in it — quoting ADR-0008 alone would ship a superseded contract, which is the same defect wearing a citation.

| Code | Condition | Summary verdict rendered |
| --- | --- | --- |
| `4` | The scan did not run as declared: usage error, invalid configuration, authentication failure, internal error. | No |
| `2` | Disposition is `disclaimed` — a declared root was never reached, or any gap is unbounded. | No |
| `3` | Coverage is below the declared threshold for at least one rule. | Yes |
| `1` | At least one finding is `new` and not suppressed. Evidence is complete. | Yes |
| `0` | No new unsuppressed finding, and **every rule's** coverage is at or above the declared threshold. | Yes |

Precedence: `4` > `2` > `3` > `1` > `0`.

Two amendments are folded into the rows above. [ADR-0011](docs/adr/0011-coverage-is-measured-over-a-per-rule-coverage-item.md) decision 5 makes the threshold a floor on **every rule**, so the byte compares the weakest row of the coverage vector rather than a pooled figure. [ADR-0012](docs/adr/0012-the-exit-byte-compares-the-vector-minimum-and-the-slice-owns-the-verdict.md) decision 7 removes the `gaps exist` conjunct from the exit-`3` predicate — with it, a sub-threshold rule holding an empty gap list exited `0` while the reason string claimed every rule had cleared the threshold.

**Exit `0` asserts two things and no others:** no new unsuppressed finding, and every rule at or above the declared threshold. No third condition may ever produce `0`.

## Name

`workspace-lint` is taken on npm — a security holding package at `0.0.1-security`, no maintainers. The npm package name must differ or be disputed with npm support. The repository name is unaffected. Open as [issue #8](../../issues/8); evidence in [`docs/research/name-and-legal.md`](docs/research/name-and-legal.md).

## Documents

Read in this order. The order is the point: **evidence outranks assertion, and an ADR is an assertion.**

| Path | What it holds | Authority on a question of fact |
| --- | --- | --- |
| [CONTEXT.md](CONTEXT.md) | Glossary, principles, rule catalog, non-goals. | Canonical |
| [PRODUCT.md](PRODUCT.md) | The user, the job, the gates, the kill criteria. | Canonical |
| [docs/adr/](docs/adr/) | Accepted decisions. **Never edited in place**; a superseding ADR is the only instrument. | Binding on behaviour, not on fact |
| [docs/spec/](docs/spec/) | Behavioural specs, per-rule and per-slice. Edited in place. Never supersedes an ADR. | Binding on behaviour, not on fact |
| [docs/research/](docs/research/) | What primary sources state. **Start at [INDEX.md](docs/research/INDEX.md).** | Beats an ADR's assertion |
| [docs/proof/](docs/proof/) | What the API actually did when asked. | **Highest.** Beats documentation |
| [docs/inputs/](docs/inputs/) | External artifacts that seeded the project. | **None.** Read, never cite as authority |
| [CLAUDE.md](CLAUDE.md) · [docs/agents/](docs/agents/) | Project grounding, issue tracker, triage labels, doc layout. | — |

This repository is canonical. External planning artifacts are inputs to it, not authorities over it.

## Development

Node and TypeScript, and **no ADR records that choice** — it is the working assumption the build has been running on, not a decision. `slice/` pins TypeScript 7.0.2 and uses `tsx` to run; the only runtime dependency is `@notionhq/client`.

```bash
cd slice
npm run typecheck     # tsc --noEmit
npm run check         # the full offline suite: no network, no token, no .env
```

The offline suite is the gate. It runs every rule against a hand-built fake of the Notion surface, and it includes **mutation checks** — each disables a mechanism and confirms the corresponding control goes red, scored on the process exit code. A control that passes with its mechanism bypassed tested nothing.

`.gitignore` covers Node, Python and Rust; trim it once the stack is an actual decision rather than an assumption.
