# The inconclusive verdict: how other fields say "I could not decide"

**Evidence class: documented.** This file records what primary sources state. No Notion response was
involved. Nothing here outranks `docs/proof/`.

Sweep date 2026-08-18. Run for issue **#69**, and it closes half of a standing NOT CHECKED recorded in
`.claude/state/checkpoint.md`.

## The question this sweep answers

Does any assertion system distinguish **"the assertion failed"** from **"the assertion could not be
evaluated"**?

`docs/research/static-analysis-prior-art.md` established as a negative result that no surveyed
static-analysis tool fails a build on partial analysis coverage. That result **stands and is not
contradicted here.** It was looking in the right field for its own question and the wrong field for
this one. Formal verification and decision procedures solved this decades ago.

`WebSearch` was not used — exhausted at 200/200. Retrievals are `WebFetch`, `curl`, the arXiv API and
pypdf extraction.

## Provenance convention

**[opened]** — the source was fetched and the text containing the quotation was read.
**[abstract only]** — the abstract was read, not the full text.

---

## 1. SMT-LIB 2.6 — the design worth copying

**[opened]** `https://smt-lib.org/papers/smt-lib-reference-v2.6-r2021-05-12.pdf`, fetched 2026-08-18,
HTTP 200, 104 pages, extracted with pypdf.

The response grammar, §3.9.1 and Appendix B:

```
⟨check_sat_response⟩ ::= sat | unsat | unknown
⟨reason-unknown⟩     ::= memout | incomplete | ⟨s_expr⟩
```

`unknown` is **not an error**. `error` is a separate production in the same grammar. The standard
therefore distinguishes **four** outcomes where a naive design has two: the property holds, the
property is refuted, the property could not be decided, and the request was malformed.

§4.1, on `:reason-unknown` — this is the transferable part:

> The response is a pair of the form (:reason-unknown r) where r is an element of ⟨reason_unknown⟩
> giving a short reason why the solver could not successfully check satisfiability… Two predefined
> s-expressions are **memout**, for out of memory, and **incomplete**, which indicates that the solver
> knows it is incomplete for the class of formulas containing the most recent check query.

Two mechanisms transfer directly:

- **The inconclusive verdict carries a machine-readable cause**, drawn from a small predefined
  vocabulary with an escape hatch for tool-specific reasons. A scanner needs exactly this split: *the
  rate limit stopped me* versus *this claim names a property type I cannot evaluate*.
- **`incomplete` is a self-report of structural blindness.** The solver states that it knows it cannot
  decide this class. That is the declared-denominator idea expressed as a verdict rather than as
  configuration.

§4.1, on `:reproducible-resource-limit`:

> it is required that the invocation of a check command return **unknown** whenever the solver is
> unable to determine the satisfiability of the formulas in the current context within the current
> resource limit… Furthermore, the returned result should depend deterministically on n

**Budget exhaustion may never be reported as a refutation.** Under Notion's roughly 3 requests per
second per connection, that rule is not optional for any claim evaluator this product ships. It also
binds determinism to the limit, which is the same discipline `Normalization` enforces on responses.

## 2. Three-valued runtime verification — inconclusiveness from missing observations

All three **[abstract only]**, retrieved verbatim through the arXiv API, HTTP 200.

**Leucker, arXiv `2507.04830v1`, 2025-07-07** — LTL3 lineage, by one of its authors:

> This paper introduces a three valued version of LTrL, indicating whether the so-far observed
> execution of the concurrent system is one of correct, incorrect or **inconclusive**, together with a
> suitable monitor synthesis procedure.

**Basin, Klaedtke & Zălinescu, arXiv `1707.05555v1`, 2017-07-18** — the closer analogue, because its
inconclusiveness comes from *missing observations* rather than from an unfinished prefix:

> Our approach targets systems whose components communicate with the monitors over unreliable
> channels, where messages can be delayed or lost… We present its underlying theory based on a new
> three-valued semantics that is well suited to soundly and completely reason online about event
> streams in the presence of message delay or loss.

**Basin, Klaedtke & Zălinescu, arXiv `1909.11593v1`, 2019-09-24**, the journal extension:

> The logic's main novelty is a new three-valued semantics that is well suited for runtime
> verification as it **accounts for partial knowledge about a system's behavior.**

"Accounts for partial knowledge" is the property this product needs. A Notion 404 means either *the
page does not exist* or *the connection cannot see it* — partial knowledge, not a refutation. This
literature has a soundness-and-completeness result for reasoning under exactly that condition.

**Route not taken, named.** The canonical citation is Bauer, Leucker & Schallhart, *"Runtime
Verification for LTL and TLTL"*, TOSEM 2011, DOI `10.1145/2000799.2000800`. Unpaywall reports
`is_oa: false`, no OA location. **It was not opened and is not cited.**

## 3. Razniewski & Nutt, VLDB 2011 — no longer NOT CHECKED

**[opened]** `http://www.vldb.org/pvldb/vol4/p749-razniewski.pdf`, fetched 2026-08-18, HTTP 200, 12
pages, extracted with pypdf. *Proceedings of the VLDB Endowment* Vol. 4 No. 11.

`.claude/state/checkpoint.md` records this paper as *"the closest formal analogue"* to this product's
coverage model and as NOT CHECKED, out of reach with `WebSearch` exhausted. **The VLDB proceedings are
free at `vldb.org`. The paywall assumption was wrong.**

The motivating case, §1 — a governance problem, not a database-theory toy:

> consider a problem arising in the management of school data in the province of Bolzano, Italy… The
> IT department of the provincial school administration runs a database for storing school data, which
> is maintained in a **decentralized manner, as each school is responsible for its own data**. Since
> there are numerous schools in this province, the overall database is **notoriously incomplete**.
> However, periodically the statistics department of the province queries the school database to
> generate statistical reports… It is therefore important that these statistics are correct.
> Therefore, the IT department is interested in **finding out which data has to be complete in order to
> guarantee correctness of the statistics, and on which basis the guarantees can be given.**

A decentralised store many people write into, known to be incomplete, queried to produce reports that
decisions rest on. That is a Notion workspace and a coverage manifest, described in 2011.

The abstract:

> completeness of a database can be described in two ways: by **table completeness (TC)** statements,
> which say that certain parts of a relation are complete, and by **query completeness (QC)**
> statements, which say that the set of answers of a query is complete. We identify as core problem to
> decide whether table completeness entails query completeness (TC-QC). We develop decision procedures
> and assess the complexity of TC-QC inferences… **weakest preconditions for query completeness can be
> expressed in terms of table completeness statements, which means that these statements identify
> precisely the parts of a database that are critical for the completeness of a query.**

**What transfers.** A declared root plus the coverage manifest's staged record is a table-completeness
statement — *this part was reached*. A rule's evidence-sufficiency claim is a query-completeness
statement — *this rule's answer is complete over its applicable set*. ADR-0011 already computes the
second from the first, per rule, over that rule's own coverage item. This paper is the formal version
of that computation.

**What this repository does not have.** The weakest-precondition result computes, for a given query,
the minimal set of "this part must be complete" facts the answer depends on. Applied here: given a rule
and a declared scope, compute the minimal set of resources whose complete enumeration the rule's
verdict actually rests on. That is strictly more informative than the current funnel, which reports
what dropped out after the fact. **Whether it is affordable under a roughly 3 requests-per-second
budget is unknown and is not claimed here.** Issue **#71**.

**It does not disturb ADR-0013.** Decision 3 holds that the missing component may never be rendered as
a number. This paper computes *which parts must be complete*, not *how much is missing*. If anything it
supports the distinction — a decision procedure over declared completeness statements is what you build
when the unknown quantity is not estimable.

## 4. Nagios — the deployed instance, and the cautionary one

**[opened]** `https://nagios-plugins.org/doc/guidelines.html`, fetched 2026-08-18, HTTP 200.

| Value | Status | Description |
| --- | --- | --- |
| 0 | OK | "The plugin **was able to check the service** and it appeared to be functioning properly" |
| 1 | Warning | "was able to check the service, but it appeared to be above some 'warning' threshold or did not appear to be working properly" |
| 2 | Critical | "detected that either the service was not running or it was above some 'critical' threshold" |
| 3 | Unknown | "Invalid command line arguments were supplied to the plugin or low-level failures internal to the plugin that prevent it from performing the specified operation" |

Two observations, and the second is a warning rather than a model.

- The OK description defines success as a **conjunction** — the check ran *and* it passed. That is the
  correct shape.
- **UNKNOWN here means the plugin broke, not that the target was unobservable.** It does not cover *I
  reached the target but could not determine its state*. The guidelines page states nothing about what
  a monitoring system does with UNKNOWN; in deployed practice it is widely routed away from paging.
  **Nagios establishes that a fourth state is operationally viable at scale. It is not a model for what
  that state should mean.**

## 5. What this recommends

A claim evaluator carries **four** outcomes, not two: `pass`, `fail`, `unknown`, and a separate
malformed-input path. `unknown` carries a reason from a small closed vocabulary with an escape hatch.
**Budget exhaustion and an ambiguous 404 may never produce `fail`.**

That maps onto vocabulary this repository already has. `unknown` with a resource-limit cause is an
Evidence-sufficiency statement, not a Conformity statement — the pair that ADR-0005 decision 1
established, arriving from a second field.

## 6. Still NOT CHECKED, with routes

- **Motro, "Integrity = Validity + Completeness", TODS 1989.** Never searched in this pass. It is the
  other half of the checkpoint's standing note and it remains open.
- **Vacuity detection in model checking** — Beer et al., CAV 1997; Kupferman & Vardi, STTT 2003. No
  search run.
- **SQL / ISO IEC 9075 three-valued logic.** No fetch attempted. That SQL has a third truth value is
  common knowledge; **no clause number is asserted here because none was opened.**
- **RV-Monitor specifically**, as distinct from the LTL3 semantics literature. Not searched.
- **Bauer, Leucker & Schallhart, TOSEM 2011.** Closed access, `is_oa: false`.
