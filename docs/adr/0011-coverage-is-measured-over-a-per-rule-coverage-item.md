# ADR-0011: Coverage is measured over a per-rule coverage item, and the coverage ratio is a vector

- **Status:** Accepted
- **Date:** 2026-08-17
- **Closes:** issue #36.
- **Supersedes:** ADR-0005 decision 4's definition of the coverage ratio — *"resources evaluated
  over resources in the applicable set"*; ADR-0008 decision 4's referent for `--min-coverage`; and
  the coverage clause of ADR-0008 decision 2's exit-`0` invariant. **Neither ADR is edited.** Every
  other part of both stands, including ADR-0005 decision 4's prohibition on publishing either ratio
  alone, which this ADR strengthens rather than relaxes.
- **Generalises:** ADR-0008 decision 5, which already stated *"The pair, not the resource, is the
  unit"* — for the baseline only, without generalising it.
- **Observed evidence:** `docs/proof/results-ref001-live.md` §3 — the applicable set was built from
  `child_page` alone, a `child_database` was invisible, and coverage read **2/2 — 100%** over a root
  with three children. Run 2026-08-17, eight read-only calls, `Notion-Version: 2026-03-11`.
- **Documented evidence:** `retrieve a property item` is a separate endpoint
  (`docs/research/notion-api-documented.md` §3 and the Pages endpoint list); rollup, relation and
  formula values carry their own incomplete states (`docs/research/notion-api-practice.md` §"Complete
  relation/rollup/formula handling").
- **Prior art:** Paul Ammann and Jeff Offutt, *Introduction to Software Testing*, 2nd edition,
  Cambridge University Press, 2016, chapter 5; author slide deck slides 3, 8, 15 and 17, read from
  the copy hosted for Cornell CS 5154, 2021 spring
  (`https://www.cs.cornell.edu/courses/cs5154/2021sp/resources/IntroToMDTD.pdf`, fetched
  2026-08-17). NISTIR 7275 Revision 4, *Specification for the Extensible Configuration Checklist
  Description Format (XCCDF) Version 1.2*, March 2012, §7.2.3.5.2, §7.3.2.2 Table 40, §7.3.2.3,
  §7.3.2.5 and Appendix B
  (`https://csrc.nist.gov/files/pubs/ir/7275/r4/upd1/final/docs/nistir-7275r4_updated-march-2012_clean.pdf`,
  fetched 2026-08-17).
- **Not checked, and named because the term is borrowed:** ISO/IEC/IEEE 29119-4:2021 and the ISTQB
  glossary both define a term *coverage item*. **Neither was read.** `iso.org` and
  `glossary.istqb.org` each returned HTTP 403 on 2026-08-17, and the freely indexed complete copies
  are unauthorised, which the citation constraint in ADR-0005 forbids using. The word is adopted on
  the strength of Ammann and Offutt's model. No clause number from either source appears in this
  document, and none may be added without reading it.

## How to treat this document

You are not being given orders. This is the output of a session that had the glossary, the ten
prior ADRs, the proof record and a prior-art sweep, and that **had no toolchain, no source code and
no live workspace**. It ran no scan. It computed no coverage figure against real data. Every number
below is arithmetic over a model, not an observation.

You are inside the code and the live workspace. On anything empirical that is better evidence than
this document has.

Each decision below is labelled **revisable** or **non-negotiable**, and every revisable one carries
a `Revisit if:` naming the evidence that reopens it and who can reach it. You are licensed and
encouraged to:

- Contradict decision 2's unit assignments if the API shows a rule's applicable set has a different
  shape. Decision 2 is the most empirical claim here and the least evidenced.
- Restructure decision 3's report layout if the vector is unreadable in a terminal.
- Reject decision 5's empty-vector byte if a real configuration produces it routinely and `3` turns
  out to be the wrong signal.

You should not:

- Reintroduce a single scalar coverage figure computed by pooling counts across rules. That is the
  defect this ADR exists to close, it is marked non-negotiable in the decision status, and it is the
  Great Expectations failure ADR-0005 decision 4 already prohibits.
- Silently deviate. Scope is the operator's call. Surface the disagreement with the reasoning.

## Context

`CONTEXT.md` defines the applicable set as *"the in-scope **resources** a rule's preconditions
fit"*, and ADR-0005 decision 4 inherits the same noun: *"the **coverage ratio** — resources
evaluated over resources in the applicable set."*

Writing `docs/spec/REF001-link-recognition.md` broke that. `REF001`'s applicable set is the set of
internal references found in fetched block content. The glossary already names that object, and the
name is not `Resource`:

> **Edge** — A parent, child, relation, mention, hyperlink, or configured dependency.

`Resource` is enumerated as *"a page, database, data source, block, property, or user."* A hyperlink
is not in that list. Issue #36 filed the mismatch rather than correcting it, and named a second
rule the glossary does not fit: `UNQ001`, whose denominator is neither a resource nor an edge.

### The failure this prevents is on the record, in this repository, from one run

`docs/proof/results-ref001-live.md` §3: the applicable set was constructed from `child_page`
results, a `child_database` was therefore invisible, and the coverage figure read **2/2 — 100%** over
a declared root holding three children. The denominator was built from what the code could name. A
denominator built that way reports its highest confidence exactly where the tool is weakest.

Whether that principle binds every rule is issue #35 and is **not** decided here. This ADR decides
the narrower thing #35 depends on: what a denominator is a count *of*.

### The literature was never opened, and it settles the question

A `grep` over `docs/` for `coverage criteri|test requirement|coverage item|Ammann|Offutt|29119|
scoring model|pairwise` returns one line, in a raw scout file, about XCCDF result values. Across ten
ADRs and ten research files, the field that formalised the coverage denominator had not been read.

**Ammann and Offutt give the model.** A *coverage criterion* is *"a rule or collection of rules that
impose test requirements on a test set"*; a *test requirement* is *"a specific element of a software
artifact that a test case must satisfy or cover"*; and coverage level is *"the ratio of the number of
test requirements satisfied by T to the size of TR"* (slides 8 and 17). The requirements are drawn
from the criterion's own structure — *"input space, graphs, logical expressions, syntax"* (slide 3).
**The unit varies by criterion, by construction.** There is no shared denominator to find.

They also state the boundary this project reached independently: *"Detecting infeasible test
requirements is **undecidable** for most test criteria. Thus, 100% coverage is **impossible** in
practice"* (slide 15).

**XCCDF gives the aggregation, and gives it as a correction it had to make.** In XCCDF 1.2's default
model, a Rule's score is `100 * rule_score / rule_count` computed over *that Rule's own* results, and
the Rule then contributes to its parent with **count 1** (§7.3.2.2, Table 40, sub-step
`Score.Default.Rule`). §7.2.3.5.2 establishes why a Rule has more than one result at all: a Rule
applying to system components yields one `rule-result` per component.

The decisive line is in Appendix B's list of changes from 1.1.4:

> The pre-defined scoring models have been modified to compute scores **per Rule** rather than **per
> rule-result**.

A standard shipped the pooled version, found that rules with many instances dominated the total, and
changed to normalising inside the rule before aggregating. This project is about to make the same
mistake for the first time. The remedy is nine years old.

XCCDF also declines to make aggregation canonical: it defines four scoring models, and notes of the
flat model that *"scores between different target systems may not be directly comparable because the
maximum score can vary"* (§7.3.2.3). Aggregating heterogeneous check results is a stated policy, not
an arithmetic given.

### The repository already contains the answer, applied once

ADR-0008 decision 5, on the `resolved` baseline state:

> The pair, not the resource, is the unit.

That is this ADR's decision 1, reached for one purpose and not generalised. This ADR is less an
invention than a promotion.

## Decision

### 1. Every rule declares a coverage item, and its coverage is measured over that

**Coverage item** — the unit a rule's applicable set is a set of. It is declared by the rule, it is
recorded in the coverage manifest, and it is printed with any figure computed over it.

The applicable set is the set of coverage items the rule's preconditions fit. The evaluated set is
the coverage items the rule actually judged. Both were already defined; only their element type
changes, and it changes from a fixed one to a declared one.

The five-stage funnel of ADR-0005 decision 5 is unchanged and still stages *resources*. Resources
are what the scan fetches. Coverage items are what a rule counts. A rule's coverage items are
derived from resources that reached the `fetched` stage, so the funnel remains the upstream record
and the coverage item is the downstream unit. Collapsing the two is what produced the defect.

### 2. The four shipping rules' coverage items, including one correction to issue #36

| Rule | Coverage item | Glossary term |
| --- | --- | --- |
| `SYS001` | A resource in the manifest. | `Resource` |
| `REF001` | An internal reference discovered in fetched block content. | `Edge` |
| `REQ001` | A **(resource, declared required property)** pair. | pair of `Resource` and a configured property |
| `UNQ001` | An **unordered pair of resources** within one uniqueness scope. | pair of `Resource` |

**Issue #36's own table records `REQ001`'s unit as `Resource`. That is wrong, and this is the
correction.** `REQ001` tests *a selected resource lacks a required property value*. A property value
can fail independently of the page carrying it: `retrieve a property item` is its own endpoint, and
rollup, relation and formula values carry their own incomplete states. A page read successfully with
two of three required properties resolvable is two-thirds evaluated, not evaluated.

This is marked **documented, not observed.** No live call has yet produced a page whose property was
individually unreadable. Confirming or refuting it is named in the Revisit-if.

**The `REQ001` error is the argument against issue #36's option 3.** Option 3 leaves each spec to
state its own denominator in prose. That is the current state, and the current state produced a
wrong unit assignment *inside the issue written to argue about unit assignments*. A convention that
cannot survive its own filing is not a convention.

### 3. `UNQ001` is quadratic, and a resource-denominated figure overstates it

`UNQ001`'s invariant quantifies over pairs: no two members of a uniqueness scope share a declared
unique value. Its coverage item is therefore an unordered pair, and reading *k* of *n* resources
evaluates `C(k,2)` of `C(n,2)` pairs.

| Resources read | Resource-denominated figure | Pair coverage, `k(k−1) / n(n−1)` | Overstatement |
| --- | --- | --- | --- |
| 90 of 100 | 90.0% | 4005 / 4950 = **80.9%** | 9.1 points |
| 50 of 100 | 50.0% | 1225 / 4950 = **24.7%** | 25.3 points |

The asymmetry is the point. A duplicate found inside the read subset is a sound finding and stays
one. A `conforms` verdict from the read subset is much weaker than the resource count suggests,
because the single unread page collides with any of the ninety read ones just as easily as with any
one of them.

Publishing 90% where the evidence supports 80.9% is a system reporting success over an unverified
state. That is the defect class recorded as `product-identity-false-green` in
`.claude/state/store.json`, arriving inside the coverage machinery built to detect it. Stating the
unit is what makes it visible; the arithmetic was always true.

### 4. The coverage ratio is a vector, and its headline figure is the minimum

**A rule publishes a coverage figure over its own coverage item. The report publishes the set of
them.** There is no coverage figure computed by pooling counts across rules, because counts of
different things do not add.

The headline figure is the **minimum over the vector**. Two reasons, and the first is already
binding law here:

1. **A mean or a pooled count lets a well-covered rule mask a badly covered one.** That is the Great
   Expectations defect ADR-0005 decision 4 already names and prohibits — *"a suite in which half the
   expectations never executed can report 100%. The number is not incomplete; it is wrong."* Under a
   mean, `REF001` at 12% and three rules at 100% publishes 78%.
2. **XCCDF already ships this aggregation as a named model.** The absolute model *"gives a score of
   1 only when all applicable Rules in the benchmark pass, and 0 otherwise"* (§7.3.2.5). Minimum is
   that shape with the threshold made continuous.

**The minimum is never published without the vector.** This extends ADR-0005 decision 4's rule
rather than replacing it: a single number that hides which rule produced it is exactly the figure
that ADR-0005 prohibits publishing alone. The prohibition now has two clauses — no ratio without the
other ratio, and no headline coverage figure without the per-rule vector that produced it.

### 5. `--min-coverage` is a floor on every rule, not on an aggregate

ADR-0008 decision 4 makes `--min-coverage` an operator tolerance defaulting to `100`, and makes it
incapable of relaxing a `disclaimed` disposition. **Both properties are unchanged.** Only the
referent changes.

**The threshold applies to each rule's own coverage figure independently. The evidence axis trips at
exit `3` if any rule falls below it.** Equivalently, it is compared against the minimum of the
vector, which is the same predicate stated the other way.

ADR-0008 decision 2's exit-`0` invariant is restated accordingly, and it is restated here rather
than edited there:

> Exit `0` asserts two things and no others — no new unsuppressed finding, and **every rule's**
> coverage at or above the declared threshold. No third condition may ever produce `0`.

The default `--min-coverage 100` is unaffected: under it, any gap in any rule trips the axis, which
is what fail-on-gaps already meant. The non-negotiable third bullet of ADR-0008 decision 4 —
a threshold can never suppress a `disclaimed` disposition, and exit `2` is unconditional — is
unchanged and is restated as non-negotiable below.

### 6. An empty applicable set leaves the vector, and an empty vector cannot exit `0`

A rule whose applicable set is empty has an undefined ratio. It is **excluded from the vector and
from the minimum**, not scored zero. This follows XCCDF's `Score.Default.Rule` — *"if rule_count is
0, set this Rule's score and count to 0"*, meaning the rule contributes nothing rather than
contributing a failure — and it matches ADR-0005 decision 1, where conformity is **absent** when the
evaluated set is empty rather than being a third enum value. The model composes; that is a check on
it, not a coincidence.

If **every** rule's applicable set is empty the vector is empty, there is no coverage figure, and
the scan judged nothing. **That must not produce exit `0`.** It produces exit `3` with the specific
cause `no_applicable_subject`.

The byte is `3` rather than a new number because of the project's own deletion test — *a value is
distinct when its remedy is distinct*. The operator's remedy for a scan that judged nothing is the
remedy for a coverage gap: fix the configuration or widen the scope. A remedy that duplicates
another's earns no new value, so it takes the existing byte and a distinct machine-readable cause,
which ADR-0005 decision 5 constraint 2 requires anyway.

## Consequences

**Gained: the largest overstatement in the model is now visible and is stated as a number.**
`UNQ001` at 90% resource coverage was going to publish 90% and mean 80.9%. Nothing in the repository
would have caught that, because every document said the denominator was resources.

**Gained: `REQ001`'s unit is corrected before any code exists.** The correction cost one table row
here. After implementation it would have cost a schema change to the manifest and a baseline
migration, because the coverage item is part of what a finding's anchor is computed against.

**Gained: the coverage manifest and the coverage figure stop being the same object.** The funnel
stages resources; the vector counts coverage items. That separation is what lets `REF001` report
against references while the funnel still reports against pages.

**Paid: the report's headline gets wider, again.** ADR-0005 already doubled the output contract from
a scalar to a pair plus a disposition plus a five-stage manifest. This adds a per-rule vector with a
named unit per row. A four-rule v0.1 now prints four coverage figures over four different nouns, and
`UNQ001`'s will be the ugly one. That is the honest shape and it is also the harder one to read.

**Paid: no cross-workspace coverage comparison.** Two scans with different rule selections produce
vectors that are not comparable, and the minimum is comparable only in the weak sense that both are
minima. XCCDF says the same of its flat model. A future dashboard wanting one trend line does not
get one from this model without an explicitly declared aggregation.

**Paid: `UNQ001`'s figure will look alarming and will be correct.** An operator reading 24.7% where
half the scope was read will believe the tool is broken. The remedy is report copy, not arithmetic,
and writing that copy is real work this ADR creates and does not do.

**Rejected by consequence.** Any single coverage percentage computed by pooling counts across rules.
Any coverage figure printed without its unit. Any headline coverage number printed without the
vector. Any `--min-coverage` comparison against a mean. Any rule shipping without a declared
coverage item.

**Not decided here.** Whether a rule's applicable set may ever be derived from the subset the tool
can handle is issue #35, and it is a different question — #35 is about how the denominator is
*built*, this ADR is about what it is a count *of*. Whether the coverage vector is stored across
runs remains the deferred Configuration Status Accounting question from ADR-0005.

**Evidential standing.** Decisions 1, 4, 5 and 6 rest on Ammann and Offutt and on the XCCDF
specification, both fetched and quoted from their own documents on 2026-08-17, plus one observation
in this repository's own proof record. Decision 3 is arithmetic and can be checked with a
calculator. **Decision 2 is the weak one:** three of its four unit assignments are reasoned from
documentation rather than observed, and the `REQ001` row contradicts a table in issue #36 on
documented evidence alone. An implementer with a live workspace outranks it.

## Decision status

- **Revisable with new evidence — decision 2's unit assignments.** *Revisit if:* a live scan shows a
  rule's applicable set has a different shape than the table states. Specifically for `REQ001`:
  fetch a page whose required property is a rollup or formula in an incomplete state and observe
  whether the property fails independently of the page. If it cannot, `REQ001`'s coverage item
  collapses back to `Resource` and this ADR's correction to issue #36 is itself wrong.
- **Revisable with new evidence — decision 4's choice of minimum as the headline.** *Revisit if:* a
  real report shows the minimum is always produced by the same rule, in which case the headline is
  that rule's figure wearing a disguise and the vector should be printed without a headline at all.
- **Revisable with new evidence — decision 6's `no_applicable_subject` byte.** *Revisit if:* an
  ordinary configuration produces an empty vector routinely, which would make exit `3` a nuisance
  signal rather than an action signal.
- **Non-negotiable — no pooled scalar.** No coverage figure may be computed by summing counts of
  different coverage items. This is ADR-0005 decision 4's existing prohibition applied to its own
  denominator, and better evidence about the API does not bear on it.
- **Non-negotiable — a threshold can never suppress a disclaimer.** ADR-0008 decision 4's third
  bullet stands unchanged. `--min-coverage 0` is not a route to a green build over a scan that does
  not know what it missed. Exit `2` is unconditional.

## Revisit if

**A rule appears whose coverage item is not finitely enumerable.** Every unit in decision 2 can be
counted. A rule quantifying over an unbounded construction — paths through a relation graph, for
instance — would have a denominator that cannot be sized, which is ADR-0005 decision 3's
unbounded-gap condition arriving in the denominator rather than in the numerator. The disposition
machinery would need to reach the vector.

**The `UNQ001` pair model turns out to be the wrong idealisation.** The arithmetic assumes any unread
resource can collide with any read one. If uniqueness scopes are always small in practice, or if
Notion's own uniqueness constraints bound the collision set, the quadratic decay is real but
irrelevant, and reporting it prominently costs reader trust for nothing.

**ISO/IEC/IEEE 29119-4 is read and defines `coverage item` incompatibly.** The term is borrowed
without its source. If the standard's definition conflicts with decision 1, the term is wrong here
even if the model is right, and the model should be renamed rather than the standard ignored.

**A fifth rule ships and its coverage item duplicates an existing one exactly.** If three rules turn
out to share a unit, the per-rule declaration is carrying less weight than the ceremony costs, and a
small closed set of unit types beats a free declaration.
