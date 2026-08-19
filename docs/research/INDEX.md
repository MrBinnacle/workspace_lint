# `docs/research/` — index

**One line per file: the question it answers, and what it refutes.** The count is carried by the
claim below and is deliberately not written out in prose — see "Keeping this honest".
<!-- claim: count glob="docs/research/*.md" exclude="INDEX.md" equals=21 -->


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
| `claim-in-document-store-prior-art.md` | Does anything evaluate an assertion written **inside** a document store against that store's own live data? | **Refutes #69's moat claim.** Di Iorio et al., *Constrained Wiki* (2012), defines the predicate and prototyped it twice. SharePoint **cannot express** the assertion — vendor-stated. The mechanism is mature in dbt and Great Expectations, which keep assertion and data in **two** systems. What is unoccupied is the one-system collapse. **See the note below: this is a null result on named routes.** |
| `zero-config-naming-prior-art.md` | What does "zero-config" mean in shipped tooling, and what do those tools still require? | **No surveyed tool requires zero input**; thirteen checked, claim against minimum input. The term is overloaded inside this repository — ADR-0001 rejects "zero-config inference" while `PRODUCT.md` names the entry point after it. Behind **#70**. |
| `result-taxonomy-prior-art.md` | How does the field separate a finding from an observation, and a rule from a metric? | SARIF §3.27.9's six `kind` values; `informational` ≠ `review`. **SARIF contains `metric` zero times.** SonarQube gates on **metrics, never on issues**. Every surveyed non-failing tier ships its own escalation switch. Counter-evidence included: Google deleted the warning tier. Behind **#70**. |
| `metric-aggregation-prior-art.md` | Where is the line between counting and scoring, operationally? | **Operator-set thresholds are not a third option** — Beller et al., 168,214 projects, 80%+ of configs never change after creation. Convergent validity fails across MI, SIG and SQALE. The Maintainability Index has not been recalibrated since 1994. Eight buildable rules and a reconstructibility test. Behind **#70**. |
| `executable-spec-adoption-prior-art.md` | Who authors executable specifications, and do inline assertions survive? | **Two questions, see the note below.** The Gherkin promise was never audited — surveys show 60.7% developers, 1.8% business analysts. Suppression false-positive rate is **4–5%**; a third of suppressions silence a claim the team agrees with. The failure mode is **freezing, not deletion**. Behind **#69**. |
| `inconclusive-verdict-prior-art.md` | Does any assertion system distinguish "failed" from "could not be evaluated"? | **Closes half of the checkpoint's standing NOT CHECKED** — Razniewski & Nutt (VLDB 2011) is free at `vldb.org` and now read. SMT-LIB's `unknown` + `:reason-unknown` is the design; **budget exhaustion may never return a refutation**. Does not contradict `static-analysis-prior-art.md`. Behind **#69** and **#71**. |
| `non-notion-tool-fit-2026-08-19.md` | Which non-Notion tools best fit the current coverage-verifier shape? | Settles the practical pivot order: Jira first, then GitHub/Linear, with Slack and document stores as evidence connectors rather than primary products. |
| `vendor-assumption-drift-prior-art.md` | Our written model of a vendor API drifts, nothing detects it, and the errors ran one direction. What exists? | **Refutes contract testing as the frame** — Pact's own FAQ excludes public APIs, and BDCT and Spring Cloud Contract were chased and excluded too. **Refutes "make the agent cite sources" as sufficient** — 51.5% of cited sentences fully supported, and abstention fails ~40% of the time. **Nothing covers negative capability claims**, which all four of our reversals were. AGM is semantics; **TMS is the mechanism**, and 9 locators in ~180 assertions is why retraction never propagated. Directional bias is a separate literature (Cooke seed questions). Behind **#124**, **#125**, and the SME instrument. |

`sweep-raw/` holds verbatim scout reports — the two verification reports behind
`coverage-artifact-prior-art.md` including every scout's dissent section, and the three behind
`vendor-assumption-drift-prior-art.md` (`contract-testing.md`, `grounded-claim-verification.md`,
`belief-revision-and-calibration.md`) including every blocked-route table. **It is evidence for the
files above, never an entry of its own** — the ordinal that used to end this sentence was a hand-kept
scalar of exactly the kind DRIFT INSTANCE 1 records, and it is removed rather than incremented.

## Four files whose tier or scope needs a word

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

**`claim-in-document-store-prior-art.md` records a null result on named routes, and the distinction
between its two halves is the file's whole value.** For SharePoint the vendor states the limit in its
own words — *"Calculated fields can only operate on their own row"* — and that is **evidence of
absence**. For Notion, Confluence and the wikis, five and six routes returned nothing, and that is
**absence of evidence**: the routes see published packages, public repositories and listed marketplace
apps, and they cannot see a script inside a company. Coda is recorded as blocked at HTTP 403/404, not
as absent. Do not collapse the three into "nobody does this."

**`executable-spec-adoption-prior-art.md` answers two questions, not one**, and the index's one-line
rule bends for it. Question 1 is who authors executable specifications; question 2 is whether inline
assertions survive. They are kept in one file because both were produced by one sweep against one
literature, and splitting them would put half of a shared blocked-routes table in each half.

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

**2026-08-19 — the two hand-kept scalars in this file are GONE, not updated.** Adding
`vendor-assumption-drift-prior-art.md` would have required editing three numbers: the claim, the
header's "Twenty files", and the `sweep-raw/` ordinal. Only the **claim** is checked by the gate; the
other two were the unchecked mirrors that produced DRIFT INSTANCE 1. Both are deleted and the claim
now carries the count alone — G-010, *keep a pointer, never a mirror*. **This is not a second drift
instance; the counter stays at one.**

***Revisit if:*** this file drifts from the directory **a second time**. At two, the honest fix is a
generated index or a check in the suite, not a hand-maintained list — the same conclusion issue #55
reached about `tsconfig.json`, for the same reason. **The counter now stands at one and is recorded
rather than reset**; a fix that clears the drift without recording it would leave the next session
believing this is the first.
