# ADR-0005: Outcome splits into conformity and evidence sufficiency; the coverage manifest is a staged funnel

- **Status:** Accepted
- **Date:** 2026-08-16
- **Supersedes:** ADR-0003 decision 2 (the four-valued outcome enum), ADR-0003 decision 3 (`incomplete` fails the run), and the final paragraph of ADR-0003's Consequences (the SARIF coverage claim). ADR-0003 is not edited; those three parts are superseded here.
- **Corrects:** the sentence "no SARIF object expresses analysis scope or coverage", which is refuted. It stands in `PRODUCT.md`, in ADR-0002's Consequences, and in ADR-0003's Consequences.
- **Evidence:** `docs/research/coverage-artifact-prior-art.md` §1, §2, §3, §4

## Context

ADR-0003 gave rules a four-valued outcome — `pass`, `violation`, `incomplete`, `inapplicable` — taken from axe-core. A nine-pass cross-domain sweep found that enum to be one dimension short and to mix two axes. Four scouts, none briefed on it, independently arrived at ISA 705.

The defect is demonstrable without any external standard. Take REF001 over a declared root holding 40 pages. Six pages are never fetched; the other 34 are read and every internal link in them resolves. The rule must now report one value. `pass` asserts something the scan did not establish. `incomplete` discards something the scan did establish. Neither is true, and the true statement — *nothing was wrong in the 34 I read, and 6 of 40 were not read* — is inexpressible.

That statement is the product. A model that cannot express it cannot ship it.

Three further defects follow from the same collapse:

1. **`incomplete` merges two conditions with different remedies.** A resource that was never fetched is an access or budget problem: the operator shares more, or raises the request budget. A resource that was fetched but could not be judged is a rule or data problem: sharing more pages changes nothing. XCCDF has separated these since 2005 — `notchecked` against `error`/`unknown`.
2. **`inapplicable` mixes a pre-run declaration with an in-run discovery.** A rule the operator excluded from scope is known before the scan starts. A rule whose precondition does not fit a resource is discovered while the scan runs. XCCDF separates them as `notselected` and `notapplicable`. OSCAL puts the entire exclusion machinery — `include-all`, `exclude-control`, `exclude-subject` — in the assessment *plan*, never in the results.
3. **Pervasiveness has nowhere to live.** ISA 705 escalates a qualified opinion to a disclaimer when the evidence gaps are pervasive, at which point the auditor states no opinion at all. A per-rule enum has no way to say "the gaps are so broad that the summary verdict should not be rendered." ADR-0002 decision 2 already contains one special case of this — an unreachable declared root is a hard coverage failure — with no general form behind it.

One design rule governs every choice below: **a value earns its place only if it changes what the operator does next.** Values that merely label a state are omitted.

## Decision

### 1. Outcome is a pair, not an enum

An outcome is two orthogonal fields.

**Conformity** — did the invariant hold across the resources the rule actually judged?

| Value | Meaning |
| --- | --- |
| `conforms` | No violation was found in the evaluated set. |
| `violates` | At least one violation was found. Carries the findings. |

Conformity is **absent** when the evaluated set is empty. It is not a third enum value. A verdict that was never formed is not a verdict; serialise it as null or omit the field. This is XCCDF's `notchecked` position and it is the honest one — OSCAL's binary `satisfied`/`not-satisfied` has no such state, which is why `incomplete` cannot be inherited from OSCAL and is defined here instead.

**Evidence sufficiency** — did the evaluated set cover everything the rule applied to?

| Value | Meaning | Operator's remedy |
| --- | --- | --- |
| `sufficient` | Every applicable resource was fetched and judged. | None. |
| `unreached` | One or more applicable resources were never fetched. | Widen access, or raise the request budget. |
| `undecidable` | Every applicable resource was fetched; the rule could not judge one or more of them. | Neither sharing more nor re-running helps. Fix the rule, the configuration, or the data. |

The two fields are independent, and all four populated combinations occur:

| Conformity | Evidence | Report sentence |
| --- | --- | --- |
| `conforms` | `sufficient` | Clean, and complete. |
| `conforms` | `unreached` / `undecidable` | Nothing wrong in what was judged; *n* of *m* applicable resources were not. |
| `violates` | `sufficient` | These defects, and no unexamined remainder. |
| `violates` | `unreached` / `undecidable` | These defects, **and** an unexamined remainder that may hold more. |
| absent | `unreached` / `undecidable` | No verdict. Nothing was judged. |

This is ISA 705's mandated grammar. Para. 17 requires "except for the effects of the matter(s)" for a proved misstatement and "except for the **possible** effects of the matter(s)" for an inability to obtain sufficient appropriate evidence. Row 4 is the second sentence; row 3 is the first. (Cite ISA 705 (Revised) by paragraph and point at IAASB — see the citation constraint below.)

Where two conditions co-occur, `unreached` takes precedence over `undecidable`. The per-resource detail lives in the manifest, so the field is a disposition, and a disposition needs a total order for a CI gate to key on. `unreached` dominates because it means the scope was not covered, and coverage is the claim this product exists to make.

**Evidence sufficiency is not certainty.** `certainty` describes a finding the rule made: did the API prove this defect? Evidence sufficiency describes findings the rule may have failed to make: were there applicable resources it could not evaluate? A rule can be `certainty: confirmed` on every finding it produced and still be `unreached`. It can be `sufficient` and still produce `indeterminate` findings, because Notion returns 404 for both absent and inaccessible. The axes never collapse into one another. `certainty` and `target state` are unchanged by this ADR.

### 2. `inapplicable` is deleted, and its two meanings are relocated

Neither is an outcome.

- **Operator-declared exclusion** moves to the **scope declaration** in configuration. A rule that was not selected is reported as not selected. It is never given an outcome, because it never ran.
- **Precondition mismatch** becomes an **applicability filter** on the (rule, resource) pair, recorded in the manifest as an explained, non-defect exclusion. The resource leaves that rule's applicable set, and therefore leaves its coverage denominator.

Both must appear in the report. A rule that silently vanishes because it was not selected hides the fact that it did not run. ISO 19011:2018 clause 6.5.1 lists "any areas within the audit scope not covered, with related justifications" in its optional set — the clause is introduced by "The audit report **can also** include or refer to the following, **as appropriate**", so this is adopted by choice, not because a standard requires it.

### 3. The report carries a disposition, and can refuse to render a summary verdict

Three values, at the report level, not the rule level.

| Value | Condition | Behaviour |
| --- | --- | --- |
| `unqualified` | Every rule is `sufficient`, and every rule `conforms`. | Full summary verdict. |
| `qualified` | Violations or gaps exist, and the gaps are confined. | Full summary verdict, with the gaps stated. |
| `disclaimed` | The gaps are pervasive. | **No summary verdict is rendered.** The manifest and the findings are still printed. |

**Gaps are pervasive when either holds:**

- **(a)** a declared root was never reached at all, or
- **(b)** any gap is unbounded — the scan cannot state how many resources it missed.

Condition (a) is the general form of ADR-0002 decision 2, which already made an unreachable declared root a hard coverage failure exiting `2`. This ADR does not change that exit code; it names the principle underneath it.

Condition (b) is the Notion-specific one and it is the reason a percentage threshold was rejected. When enumeration of a page's children truncates — pagination exhausted, request budget spent — the scan knows it stopped but not how much remains. An unbounded gap cannot be sized, and a gap that cannot be sized cannot be shown to be confined. ISA 705 para. 5(a) defines pervasive effects as those that "are not confined to specific elements, accounts or items"; an unbounded gap is definitionally unconfined.

A ratio threshold was considered and rejected. Any percentage would be an invention with no evidence behind it, and it would be computed over a denominator the scan has just admitted it cannot establish.

ISA 705's `adverse` opinion is deliberately **not** adopted. It separates from `qualified` on a materiality judgement, and materiality is a human judgement this CLI cannot compute. Under the governing design rule, `adverse` would not change what the operator does next, so it is not a value.

### 4. No ratio is published without the coverage figure that bounds it

A rule with no conformity claim is excluded from the conformity ratio, following XCCDF's rule that `unknown` results are not to be scored. XCCDF 1.1.2 and 1.2 both carry the same nine values (`pass, fail, error, unknown, notapplicable, notchecked, notselected, informational, fixed`); 1.2 rewrote every description, so any quotation must carry a version label and none is quoted here.

Exclusion alone is not sufficient, and the failure mode is shipping today. Great Expectations computes `success_percent` over *evaluated* expectations rather than declared ones, so an expectation that never ran is absent from the denominator. A suite in which half the expectations never executed can report 100%. The number is not incomplete; it is wrong.

The rule is therefore stronger than exclusion. **Two figures are published together or not at all:**

- the **conformity ratio** — conforming rules over rules that reached a conformity claim, and
- the **coverage ratio** — resources evaluated over resources in the applicable set.

Printing the first without the second is the Great Expectations defect. It is prohibited.

ADR-0003 decision 3 made `incomplete` fail the run by default. That disposition moves here: the run's exit status is a function of the report disposition and the coverage ratio, not of a per-rule outcome value. The default remains fail-on-gaps; only its home changes.

### 5. The coverage manifest is a five-stage funnel

Modelled on the enumerative artifact in research reporting, not on the audit report. Financial audit was the sweep's opening hypothesis and it was falsified by its own scout: an audit report never enumerates what was examined, and PCAOB AS 3105.45 actively forbids it on a disclaimer — "The auditor should not identify the procedures that were performed."

The enumerative artifact lives in CONSORT, PRISMA and STROBE, which converged independently on a staged funnel with per-stage counts and per-stage reasons.

| Stage | Passes when | Drop-out cause examples |
| --- | --- | --- |
| **Declared** | The operator named the resource in configuration. | — |
| **Resolved** | The identifier is valid and the object type is known. | 404 on a declared root; ambiguous alias. |
| **Enumerated** | The resource's descendants were listed to completion. | Pagination truncated; request budget exhausted. **The only source of unbounded gaps.** |
| **Fetched** | The resource's content was retrieved. | 404; permission; rate limit. |
| **Evaluated** | Every applicable rule reached a judgement. | `undecidable` causes. |

The enumeration stage is separate from fetching because it is where unbounded gaps arise, and unbounded gaps drive the `disclaimed` disposition. Collapsing the two stages would hide the one signal the disposition depends on.

Three constraints on drop-out records:

1. **Every drop-out names its resource.** PRISMA item 16b requires studies excluded despite appearing to meet the criteria to be cited individually, not counted in aggregate. The one permitted exception is the unbounded enumeration gap, which by definition cannot name what it did not list; it names the parent whose enumeration truncated and marks the gap unbounded.
2. **Every drop-out carries a specific machine-readable cause. Generic causes are banned.** CONSORT's guidance states it plainly: "Simply stating 'protocol deviation' is insufficient." `skipped: error` is the banned form. Semgrep's `skip_reason` enum runs to 17 values with mixed casing, and the nine values beyond the obvious eight are the valuable half — they separate excluded-by-policy from failed-to-analyse.
3. **Gaps are split into explained and unexplained.** A rate limit is explained: the cause is known and the evidence is attached. A 404 on a declared root is unexplained: Notion returns the same status for absent and for inaccessible, so the cause is not yet known. This follows the reconciliation split in Macquarie University's balance-sheet procedure, clause 10, which requires "a list of all Reconciling Items, with supporting documentation" as a separate item from "a list of Unreconciled Items, with explanatory notes and documented action plan for investigation".

**Every report prints a standing sampling-risk statement**, not only degraded ones. ISO 19011:2018 clause 6.5.1 item k) makes this mandatory for audit reports — "audits by nature are a sampling exercise; as such there is a risk that the audit evidence examined is not representative." It is the one thing in that clause that is required rather than optional.

### 6. The SARIF claim is corrected

The refuted sentence is: *no SARIF object expresses analysis scope or coverage.* Verified against `sarif-schema-2.1.0.json`, four normative primitives exist:

- `result.kind` — a six-value enum: `notApplicable`, `pass`, `fail`, `review`, `open`, `informational`
- `invocation.executionSuccessful` — a required boolean
- `invocation.toolExecutionNotifications` — "runtime conditions detected by the tool during the analysis"
- `artifact.roles` — includes `analysisTarget`

**The correct statement is narrower: SARIF carries per-result and per-artifact not-analysed primitives, but defines no run-level coverage aggregate.**

Build the eventual export on those four primitives rather than on parallel inventions: `artifact.roles: analysisTarget` carries the applicable set, `invocation.executionSuccessful` carries the report disposition, `toolExecutionNotifications` carries drop-out causes. The five-stage funnel has no SARIF home and stays native. Semgrep reached the same resolution independently — it routes coverage through its own schema, not through SARIF — so a SARIF export loses the manifest. That is a known, accepted export loss, decided now rather than at integration time.

**A source-level caution attaches to this.** The per-value semantics of `result.kind` are asserted nowhere here. A verifier fetched the OASIS SARIF prose specification and received a `result.kind` enum containing `diagnostic` and `initialState`, values that do not exist in the schema. It then refused to trust that same source's section numbers. The enum values above come from the machine-readable schema; no SARIF section number is cited in this ADR for that reason.

## Consequences

**Gained.** The product's central sentence — nothing was wrong in what I read, and here is exactly what I did not read — is now expressible, and it was not before. Every element is transplanted rather than invented: the two-axis outcome from ISA 705, the split of `incomplete` from XCCDF, the removal of `inapplicable` from the results document from OSCAL, the funnel from CONSORT and PRISMA, the sampling disclosure from ISO 19011, the explained/unexplained split from reconciliation practice.

**The novelty claim gets narrower and better evidenced.** Four tools across two ecosystems — Semgrep, dbt, Great Expectations, Soda — emit a non-execution signal and none binds the verdict to it. What is unclaimed is making verdict validity a function of how much of a **user-declared** set was reached. That is a composition of two shipped behaviours plus a default flip, not an invention, and it should be stated that way in `PRODUCT.md`.

**Paid: the output contract roughly doubles in width.** Two fields where there was one, plus a report disposition, plus a five-stage manifest with typed causes. Every consumer — the CI gate, the baseline, the SARIF exporter, the human reader — now reads a pair where it read a scalar. Report layout gets harder: a two-axis result does not fit a one-column status table.

**Paid: a v0.1 with two rules and a five-stage manifest is a strange-looking product.** The manifest is now more elaborate than the rule catalogue it reports on. That is the intended shape — ADR-0002 established that coverage is the wedge — but it inverts the usual proportion and first-run users will notice.

**SYS001 changes job and must be restated.** "Scan result is incomplete" is no longer a rule outcome, because incompleteness is now a field on every rule and a disposition on the report. SYS001 survives as the **finding identity** for a coverage gap — it gives each gap a stable ID that a baseline can reference and a CI gate can name. It no longer carries the run-failure decision; decision 4 does. The catalogue entry in `CONTEXT.md` is restated accordingly.

**Rejected by consequence.** Any report that prints a pass rate on its own. Any drop-out recorded with a generic cause. Any collapse of evidence sufficiency into finding certainty — the two answer different questions and the report needs both.

**Deferred, not decided: Configuration Status Accounting.** MIL-HDBK-61A shows audit outputs flowing back into a standing record of what is under management. If the manifest is produced per scan and discarded, coverage claims can be asserted once but never checked over time. This is a storage decision, not a model decision, and its source is unverified. It is recorded as an open question, not adopted.

**Evidential standing of this ADR.** Decisions 1, 2 and 3 rest on primary sources that were adversarially re-verified: ISA 705 paras. 5(a) and 17, the XCCDF value list, the OSCAL metaschema negative, the SARIF schema, PCAOB AS 3105.45, ISO 19011 clause 6.5.1 item k), and the Semgrep enum. Decision 5's funnel shape rests on CONSORT item 13a/13b (renumbered 22b in CONSORT 2025), PRISMA item 16b and STROBE item 13, which were **fetched by a scout but not independently re-verified**; STROBE is search-summary only. The shape is adopted on the strength of three independent standards converging, not on any single citation. Re-verify the clause numbers before quoting them in anything published.

**Citation constraint, and it is a copyright matter, not a style preference.** The ISO 19011:2018 text was read from a site hosting a complete unauthorised copy including its intact copyright page, which forbids exactly that posting. The ISA 705 text was read from an unofficial mirror. Cite both by clause or paragraph number and link the ISO catalogue or IAASB. Neither URL may appear in any published artifact.

## Revisit if

**Two of the split values never diverge against real data.** Draft one report using this vocabulary and run it against a workspace containing a deliberately unshared subtree. If `unreached` and `undecidable` never separate in practice, collapse evidence sufficiency to `sufficient | insufficient` and push the whole cause taxonomy into the manifest. This test belongs in the 72-hour proof.

**The funnel's stage boundaries do not correspond to anything the Notion API distinguishes.** If enumeration and fetching cannot be separated in practice, condition (b) of the pervasiveness predicate loses its input and the disposition needs a different trigger.

**A pervasively gapped scan turns out to be the normal case rather than the exception.** If `disclaimed` fires on most real workspaces, a tool that usually refuses to render a verdict is not a usable tool, and the declared-root model of ADR-0002 needs revisiting before this one does.

**Readers discount the limitations half.** Audit expectation-gap research suggests readers retain the opinion and treat qualifying language as secondary. If user testing shows the standing sampling-risk statement trains readers to skip the manifest, the disclosure becomes noise and must be redesigned rather than repeated.

**SARIF 2.2 or a successor adds a run-level coverage aggregate.** That would close the one gap decision 6 identifies, make export lossless, and raise the value of adopting the schema natively rather than as a design source. ADR-0003's Revisit-if said the same thing about a scope object; the correction in decision 6 narrows what would have to ship.
