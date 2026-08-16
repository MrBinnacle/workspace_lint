# How mature disciplines represent incomplete verification

**Method.** Nine research passes (five domain scouts, one direct-prior-art scout, one unconstrained wildcard, two follow-ups) run 2026-08-16 under `cite-verified-research-sweep`. Roughly 66 claims produced. **16 keystone claims were adversarially re-verified against re-fetched primary sources by two separate verifiers: 6 CONFIRMED, 9 PARTIAL, 1 MISATTRIBUTED, 0 fabricated.** The remaining ~50 claims are unverified and are marked as such wherever used.

Raw scout reports, verbatim and unedited, are in `docs/research/sweep-raw/`. The two verification reports are there too. This document contains the conclusions; that directory contains the evidence, including every scout's dissent section.

---

## How to treat this document

This is the prior-art record, not a decision. It was produced by sessions that read standards and schemas but have never run a line of this product's code against a real Notion workspace.

Each recommendation below is labelled **Revisable** with a specific `Revisit if:` naming the evidence that would overturn it, or **Verified fact** where a primary source was confirmed word for word. Verified facts are not orders — they are facts. What the project does about them is a design decision that belongs to whoever holds the implementation evidence.

Two things here are non-negotiable and are not design choices: the citation hazards in §6, which are a copyright matter, and the instruction not to restate a claim that verification falsified.

---

## 1. The artifact exists. It is not an audit report.

The sweep's opening hypothesis was that financial audit solved the coverage manifest. **That hypothesis is false and the audit scout falsified its own brief.** An audit report never enumerates what was examined. PCAOB AS 3105.45 actively forbids it on a disclaimer:

> "The auditor should not identify the procedures that were performed nor include the paragraph describing the characteristics of an audit (that is, the scope paragraph of the auditor's standard report); to do so may tend to overshadow the disclaimer."
> — PCAOB AS 3105.45. **CONFIRMED**, paragraph number confirmed.

The enumerative artifact lives in research reporting instead. Three independent standards converged on the same shape — a staged funnel with per-stage counts and per-stage reasons:

- **CONSORT** item 13a/13b (renumbered 22b in CONSORT 2025) requires, for each group, the numbers assigned, treated and analysed, and "losses and exclusions after randomisation, together with reasons." Guidance states plainly that a category label will not do: *"Simply stating 'protocol deviation' is insufficient."*
- **PRISMA** item 16b requires that studies which appeared to meet inclusion criteria but were excluded be **cited individually** with reasons — not counted in aggregate.
- **STROBE** item 13 carries the same staged structure for observational studies.

*Status: fetched by the scout from CONSORT and PRISMA primary sources; **not** re-verified by an independent verifier. STROBE is search-summary only.*

**Recommendation — Revisable.** Model the coverage manifest as a staged funnel: declared roots → resolved → fetched → rules evaluated, with every drop-out carrying a specific machine-readable cause and a named resource. Forbid generic reasons; `skipped: error` is the banned form. *Revisit if:* implementation shows the stage boundaries do not correspond to anything the Notion API actually distinguishes.

### What is genuinely required elsewhere

Two verified requirements, and they are narrower than the sweep first reported:

- **ISO 19011:2018, clause 6.5.1, item k) — MANDATORY.** Every audit report must state: *"audits by nature are a sampling exercise; as such there is a risk that the audit evidence examined is not representative."* **CONFIRMED.**
- **Balance-sheet reconciliation — required field list.** Macquarie University's procedure, clause 10, requires as separate items: *"supporting documentation … to substantiate the entire closing balance (not just movement in the period)"*, *"a list of all Reconciling Items, with supporting documentation"*, and *"a list of Unreconciled Items, with explanatory notes and documented action plan for investigation, including the specific task(s) required to be completed, the resources required, and the timeframe for resolution"*. **PARTIAL** — fields confirmed, scout's wording corrected.

The reconciliation split is the sharper of the two. It separates **explained gaps** (cause known, support attached) from **unexplained gaps** (cause not yet known). A rate-limit is an explained gap. A 404 on a declared root is an unexplained gap. One `incomplete` bucket loses that distinction.

**Recommendation — Revisable.** Print a standing sampling-risk statement in every report, not only degraded ones. Split the manifest's gap section in two: explained and unexplained. *Revisit if:* user testing shows the standing disclaimer trains readers to ignore the manifest — see §5.

---

## 2. The four-outcome enum is one dimension short and mixes two axes

Four scouts, none briefed on ISA 705, independently found it. That convergence is the signal.

**ISA 705 (Revised) models the outcome as two axes: nature × pervasiveness.** The grammar is mandated:

> Para. 17: known misstatement → *"except for the effects of the matter(s)"*. Inability to obtain sufficient appropriate audit evidence → *"except for the **possible** effects of the matter(s)"*. **CONFIRMED**, para. 17.

Pervasiveness has an operational definition, which is what makes the second axis computable rather than vibes:

> Para. 5(a): effects are pervasive when they *"(i) Are not confined to specific elements, accounts or items of the financial statements; (ii) If so confined, represent or could represent a substantial proportion of the financial statements; or (iii) In relation to disclosures, are fundamental to users' understanding of the financial statements."* **CONFIRMED**, para. 5(a).

**XCCDF** has run nine result values in production since 2005 — `pass, fail, error, unknown, notapplicable, notchecked, notselected, informational, fixed` — and `unknown` results are explicitly *"not to be scored"*. **PARTIAL**: the values are confirmed, but XCCDF 1.1.2 carries no per-value docstrings (all text is one prose block on the simpleType), and XCCDF 1.2 rewrote every description while keeping the same nine values. **Any quotation must carry a version label.**

Against that vocabulary, the project's current enum conflates:

| Project value | XCCDF distinguishes |
| --- | --- |
| `inapplicable` | `notapplicable` (rule does not fit this target) vs `notselected` (rule out of scope) |
| `incomplete` | `notchecked` (never attempted) vs `error` / `unknown` (attempted, failed) |

And a third distinction the standards treat as structural rather than as metadata: **scope exclusion is declared before the run; evidence unavailability is discovered during it.** One belongs in the scope declaration, the other in the manifest. OSCAL enforces exactly this separation — its exclusion machinery (`include-all`, `exclude-control`, `exclude-subject`) lives in the assessment *plan*, never in the results.

**Recommendation — Revisable, and it supersedes part of ADR-0003.** Replace the flat four-value enum with two orthogonal fields — conformity and evidence-sufficiency — and move `inapplicable` out of the outcome enum into the scope declaration. Add a report-level disposition equivalent to a disclaimer, so a scan whose gaps are pervasive can refuse to render a summary verdict at all. Adopt the XCCDF rule that a non-verdict never enters a scoring denominator. *Revisit if:* a report drafted against real Notion data shows two of the split values never diverge in practice — the `scout-itassurance` report proposes exactly this test, using a workspace with a deliberately unshared subtree.

---

## 3. The convergent negative: everyone emits coverage, nobody binds it

Four tools across two unrelated ecosystems, checked at schema level:

| Tool | Emits non-execution signal | Binds the verdict to it |
| --- | --- | --- |
| Semgrep | `scanned_and_skipped`, 17-value `skip_reason` enum including `insufficient_permissions` | No — advisory; exit code does not key on findings by default |
| dbt | `TestStatus` includes `skipped`; `RunStatus` includes `skipped`, `partial success` | No — skipping without an upstream error exits 0 |
| Great Expectations | `exception_info` with `raised_exception` | No — worse, it merges "could not evaluate" into "failed" |
| Soda | four outcomes including `error`; distinct exit codes 3 and 4 for runtime issues | **Partially** — but `error` means the check was malformed, not the data unreachable, and there is no coverage artifact |

Semgrep's schema was independently verified. **PARTIAL**: the enum is 17 values with mixed casing (`Nonexistent_file`, `Gitignore_patterns_match`, `Dotfile`), not the 8 the scout reported. The nine omitted values are the valuable half — they separate *excluded by policy* from *failed to analyse*, which is the same distinction §2 says the project's enum loses. pip-audit's `-S/--strict` — *"fail the entire audit if dependency collection fails on any dependency (default: False)"* — is **CONFIRMED** and opt-in.

**Finding.** The novelty claim survives and is now better evidenced than before the sweep. It is also narrower than the project has been stating it. Nobody makes verdict validity a function of how much of a **user-declared** set was actually reached. That is a composition of two shipped behaviours plus a default-flip — not an invention. State it that way.

### The motivating example

Great Expectations computes `success_percent` over `evaluated_expectations`, not declared ones. An expectation that never ran is absent from the denominator. **A suite in which half the expectations never executed can report 100%.**

That is this product's thesis, shipping today, in a widely used tool, producing a number that is wrong rather than merely incomplete. It is a better opening example than anything in the static-analysis literature. *Status: fetched from the GX source file; not independently re-verified.*

---

## 4. Corrections to standing claims in this repository

Three claims currently in `PRODUCT.md`, `CONTEXT.md` or `docs/adr/` are wrong or overstated. They should be corrected before the 72-hour proof, because two of them determine what the proof measures.

**4.1 — The SARIF claim is refuted. `PRODUCT.md` must be restated.**
Current text says no SARIF object expresses analysis scope or coverage. Verified against the machine-readable schema: `result.kind` is a six-value enum `["notApplicable","pass","fail","review","open","informational"]`; `invocation.executionSuccessful` is a required boolean; `invocation.toolExecutionNotifications` carries *"runtime conditions detected by the tool during the analysis"*; `artifact.roles` includes `analysisTarget`. **PARTIAL** — the primitives exist and are normative.
Correct statement: *SARIF carries per-result and per-artifact not-analysed primitives, but defines no run-level coverage aggregate.* Build on the four primitives rather than inventing parallel ones.
Note also, from the wildcard scout and independently confirmed by the verifier: Semgrep routes coverage through its **native** schema rather than SARIF. If this project ever exports SARIF, the manifest does not survive the export. Decide that now, not at integration time.

**4.2 — The OSCAL negative holds, but the current phrasing overclaims.**
The verifier grepped the full 148KB metaschema for twelve candidate tokens. No assessment outcome means not-assessed, not-applicable, or unable-to-assess. But `finding-target status/@state` is the only closed enum; `observation/@type` and risk `status` both carry `allow-other="yes"`, and `finding-target` has a `reason` flag whose values include `other` — *"Some other event took place that is not a pass or a fail."*
Safe formulation, verbatim from the verifier: *"OSCAL defines no outcome value for not-assessed, not-applicable, or unable-to-assess. The binary `satisfied`/`not-satisfied` state is closed; the adjacent `reason` and `type` vocabularies are open, so the gap is a definitional absence, not a prohibition."*
Consequence for ADR-0003: the OSCAL observation/finding split remains adoptable, but `incomplete` cannot be inherited from OSCAL. It must be defined, and XCCDF is the better donor.

**4.3 — Delete the plan-tier rate limits from every model.**
Notion publishes *"an average of three requests per second"* per connection, and states the workspace ceiling is *"scaled to the workspace's plan"* with **no tier table**. **PARTIAL** — the 10/25/50/100 req/s figures came from third-party blogs and have no vendor backing.
This bears directly on the kill criterion *"a warm scan exceeds three minutes on the reference scope"*. At 3 req/s, three minutes is roughly 540 requests. That is the budget the 72-hour proof must live inside, and it is far tighter than the blog figures implied.

---

## 5. The strongest arguments against the product

Recorded because a prior-art document that only collects supporting evidence is not prior art. All three are **unverified** and come from the fenced wildcard pass.

1. **The boundary may be unnameable.** A Notion integration sees only what a human explicitly shared with it. "What I could not see" may reduce to "everything you did not give me" — which the customer already knew and the tool cannot size. Partially answered: the verifier confirmed Notion's admin content search is a **search**, not an enumeration, so the first-party threat is narrower than reported and the wedge survives. Not answered: whether a boundary the tool cannot size is worth paying for.
2. **Readers discount the limitations half.** Audit expectation-gap research suggests readers retain the opinion paragraph and treat qualifying language as secondary. The differentiator may be the half nobody reads.
3. **The nearest legal discipline declined to require this.** Sedona holds an eDiscovery process *"need not be perfect, nor even the best available option, and it does not have to identify all discoverable ESI"*; FRCP 26(g) requires reasonable inquiry, not completeness.

A fourth, from ISAE 3000 (search summary only, and it cuts the other way): where a scope limitation would force a disclaimer, the practitioner *"shall not accept such an engagement as an assurance engagement"*. The transplant is a **pre-flight refusal** — if declared roots are visibly inaccessible before the scan runs, refuse to produce a report rather than produce a disclaimed one.

---

## 6. Citation hazards — non-negotiable

**The ISO 19011:2018 text used in this sweep was read from an unauthorised copy.** The hosting site reproduces the complete standard including its intact copyright page, which forbids *"posting on the internet or an intranet, without prior written permission"*. The wording and clause numbers are genuine and were verified against it. The URL must not appear in any published artifact. Cite "ISO 19011:2018, clause 6.5.1" and link the ISO catalogue, or do not cite it.

The same applies to the squarespace-hosted ISA 705 mirror. Cite "ISA 705 (Revised), para. 5(a)" / "para. 17" and point at IAASB. Paragraph numbers were cross-confirmed against a second copy hosted by IRBA, South Africa's audit regulator.

Standards reached only through consultancy paraphrase, and therefore not citable at clause level: ISO 9001, ISO 13485, EIA-649, ISO 10007, MIL-STD-973, AICPA AT-C 320.

---

## 7. Corrections ledger

| # | Claim as first reported | Verdict | Correction |
| --- | --- | --- | --- |
| 1 | ISO 19011 §6.5.1 *requires* reporting areas not covered | MISATTRIBUTED | Optional. It is in the "can also include… as appropriate" list. Item k) sampling risk *is* mandatory. |
| 2 | No SARIF object expresses analysis scope or coverage | PARTIAL | Four primitives exist. The gap is the run-level aggregate only. |
| 3 | Notion admin search enumerates all workspace content | PARTIAL | It is a search, not an enumeration. Enterprise-only, does reach private pages, CSV exports the result set. |
| 4 | Notion rate limits scale 10/25/50/100 req/s by plan | PARTIAL | Not published. Only 3 req/s per connection is documented; workspace ceiling undisclosed. |
| 5 | Semgrep `skip_reason` has 8 values | PARTIAL | 17 values, mixed casing. The 9 omitted carry the policy-exclusion vs analysis-failure split. |
| 6 | XCCDF values carry per-value docstrings | PARTIAL | 1.1.2 has one prose block, no per-value annotations. 1.2 rewrote all text. Version-label required. |
| 7 | OSCAL has no representation for unassessed | PARTIAL | True but overstated. Adjacent enums are open; it is a definitional absence, not a prohibition. |
| 8 | Financial audit solved the coverage manifest | FALSIFIED BY ITS OWN SCOUT | Audit solved the `incomplete` outcome. It has no enumerative artifact and AS 3105.45 forbids one on a disclaimer. |
| 9 | Macquarie clause 10 field wording | PARTIAL | "a list of **all** Reconciling Items, **with supporting documentation**"; "documented action plan", not "a documented action plan". |
| 10 | WA auditor: *unknown* deposits go to suspense | PARTIAL | The subject is *unrecorded* deposits. Quoted clause otherwise correct. |
| 11 | dbt `skipped` affects the exit code | REFUTED BY ITS OWN SCOUT | Emitted per node, zero verdict weight. Skipping without an upstream error exits 0. |
| 12 | "Configuration drift" is a CM term of art | NEGATIVE | Zero occurrences in the full text of MIL-HDBK-61A or DOE-STD-1073. Use *discrepancy* and *as-found*. |

**Source-level catch worth recording.** The verifier fetched the OASIS SARIF prose specification and received a `result.kind` enum containing `diagnostic` and `initialState` — values that do not exist in the schema. It then refused to accept that same fetch's section numbers, on the grounds that a source which fabricated one answer cannot confirm another. SARIF section numbers in this document are therefore unverified; the schema is cited instead.

---

## 8. Open questions and next actions

1. **Decide the outcome model before the 72-hour proof.** It determines what the proof has to measure. Needs an ADR that supersedes part of ADR-0003.
2. **Correct `PRODUCT.md`**: the SARIF claim (§4.1) and the rate-limit assumptions (§4.3).
3. **Test whether the split values ever diverge.** Draft one report using the XCCDF vocabulary, run it against a workspace containing a deliberately unshared subtree, and check whether any two values collapse in practice.
4. **Resolve empirically, do not assume:** whether Semgrep's `skipped` is verbose-gated. The CLI reference does not say.
5. **Consider Configuration Status Accounting.** MIL-HDBK-61A shows audit outputs flowing back into a standing record of what is under management. If the manifest is produced per-scan and discarded, coverage claims cannot be checked over time — only asserted once. *Unverified; from the configuration-management scout.*
6. **Re-verify before use in an ADR:** MIL-HDBK-61A Fig 8-3, CONSORT 13a/13b, PRISMA 16b, STROBE 13, ISAE 3000, and the Soda exit-code table. All are fetched-but-unverified or search-summary only.
