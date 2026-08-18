# `docs/research/` — index

Thirteen files. **One line per file: the question it answers, and what it refutes.**
<!-- claim: count glob="docs/research/*.md" exclude="INDEX.md" equals=13 -->


This exists because a reading list that names a directory does not tell you which file answers your
question. That is **Shape C** in `docs/agents/domain.md` — *"the evidence was in the repo, indexed,
and simply not read"* — and no method rule catches it, because grep finds nothing when you do not
know what to grep for. Issue #54.

**Trust tier is `documented` for every file here** — what a primary source states. It beats an ADR's
assertion and it is beaten by `docs/proof/`. Two exceptions are called out below.

## The index

| File | The question it answers | What it refutes or settles |
| --- | --- | --- |
| `notion-api-documented.md` | What does the vendor document about the public API at `2026-03-11`? | The endpoint index behind ADR-0002: **no endpoint enumerates a connection's grant.** |
| `notion-api-practice.md` | What do practitioners observe that the docs do not promise? | **§4.5 refutes ADR-0006 decision 2's search row** — `SearchResponse` carries `request_status`. Corrected by ADR-0007. One of the two files in issue #25's count. |
| `notion-live-probe.md` | What did the API actually return under paired identical reads? | Evidence for ADR-0004: a fresh `X-Amz-Signature` per read, and `request_id` as the only other drifting field. **See the provenance note below — this file holds observations.** |
| `notion-developer-platform.md` | Workers, the CLI, and the credential models. | Closes the **research half of #27**. Its own §9 lists what documentation cannot settle; the observation half is still open. |
| `notion-user-pain.md` | What structurally breaks in real workspaces? | The demand-side pain evidence. Skipped for a whole session once — the incident behind `domain.md`'s Shape C. |
| `solo-segment-evidence.md` | What do solo and small-team users say? | Fills the hole left when the pain sweep was blocked at Reddit, G2 and Capterra. **Its verdicts are produced by a blocked crawler, not by an absence in the world.** |
| `competitive-landscape.md` | Who else sells this, and what does none of them do? | **§4 independently refutes ADR-0006 decision 2's search row.** The second file in #25's count. Also: no competitor fails a run on incomplete coverage. |
| `static-analysis-prior-art.md` | How did static analysis already solve identity, baselines, incompleteness and determinism? | The source of ADR-0010's matchkey hierarchy and ADR-0008's exit-status shape. Reframes the PRD's ESLint anchor. |
| `coverage-artifact-prior-art.md` | How do mature disciplines represent **incomplete** verification? | **Refutes "no SARIF object expresses analysis scope or coverage"** — four normative primitives exist (ADR-0005 decision 6). Source of the ISA 705 pair, the XCCDF split and the CONSORT/PRISMA funnel. |
| `unseen-population-sizing.md` | **How large is the gap?** Can an unobserved population be sized? | **Holds ADR-0005 decision 3's claim and replaces its stated reason.** No upper bound is estimable; every estimator needs a frequency-of-frequencies distribution a cursor-paginated read cannot produce. |
| `frame-completeness-prior-art.md` | **May the frame be called sufficient?** — the prior question to the one above. | The outcome model was **one component short**: coverage error had no axis. Source of ADR-0013. Bias runs in the flattering direction (Kosinski & Barnhart 2003). |
| `name-and-legal.md` | Is `workspace-lint` available, and what are the trademark boundaries? | The evidence behind **issue #8**. Not legal advice; marks where a lawyer is genuinely required. |
| `documented-claim-drift-prior-art.md` | A document asserts a fact, the system changes, nothing detects it. What exists, and where is it mature? | **Refutes the reflex design.** The software field builds *probabilistic* traceability recovery because links were never declared; aerospace and nuclear **configuration management** declares a baseline and pays at write time instead. Manual compliance evaluation runs to 25% of assessment effort even where a regulator mandates it. Behind **#62**. ACM/IEEE and IAEA **not checked**. |

`sweep-raw/` holds the verbatim scout reports and the two verification reports behind
`coverage-artifact-prior-art.md`, including every scout's dissent section. It is evidence for that
file, not a fourteenth entry.

## Two files whose tier needs a word

**`notion-live-probe.md` holds observations but sits in the documented tier, and that is not a
misfiling.** `docs/proof/` records the fixture under the **read-only REST integration**. This probe
ran through an **OAuth connector returning unsigned file descriptors** — ADR-0004 states the caveat
and says outright that it "does not clear the REST path." Two different credential paths, so the
observations are not interchangeable. Read it as documented evidence about a path the product does
not use, and do not promote a claim from it into a REST claim.

**`unseen-population-sizing.md` and `frame-completeness-prior-art.md` answer different questions and
are easy to confuse.** The first asks *how big is the gap* and finds it unmeasurable. The second asks
*may the frame be called sufficient* and finds the model had no axis for the question. The second
nearly got written as a duplicate of the first during the ADR-0013 sweep; one line of index would have
prevented the near-miss, which is why this file exists.

## Keeping this honest

**An index nobody updates is worse than a known absence**, because it asserts a completeness it does
not have — the defect class this product exists to detect, arriving in its own documentation. ~~Adding a
file to `docs/research/` without adding a row here is the failure mode.~~ **That is not the failure mode
that fired.** See below.

**DRIFT INSTANCE 1 — 2026-08-18, and the row discipline is not what broke.** `documented-claim-drift-prior-art.md`
was added in commit `ef6a237` **with its table row**. What did not move was the **header scalar**: line 3
went on reading "Twelve files" over a thirteen-row table, and line 33 went on calling `sweep-raw/` "not a
thirteenth entry" once a thirteenth existed. The same stale count had propagated to `PRODUCT.md`,
`CONTEXT.md`, `docs/agents/domain.md` and `.claude/state/checkpoint.md` — **five documents on one
number** — and was corrected in the #61 pass.

**The lesson is narrower and worse than the one this section stated.** The prescribed discipline —
add a row when you add a file — **held**. A hand-kept count that duplicates a fact the table already
carries is what broke, and it broke silently because nothing reads the header against the table.
A generated index removes the scalar rather than reminding anyone to update it.

***Revisit if:*** this file drifts from the directory **a second time**. At two, the honest fix is a
generated index or a check in the suite, not a hand-maintained list — the same conclusion issue #55
reached about `tsconfig.json`, for the same reason. **The counter now stands at one and is recorded
rather than reset**; a fix that clears the drift without recording it would leave the next session
believing this is the first.
