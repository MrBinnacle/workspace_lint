# ADR-0017: A measurement is a counted fact, and counting stays inside ADR-0001

- **Status:** Accepted
- **Date:** 2026-08-22
- **Closes:** issue #140.
- **Supersedes:** nothing. ADR-0001, ADR-0005, ADR-0011, ADR-0012 and ADR-0013 all stand as written.
  This ADR adds a report class the model never had, in the same way ADR-0013 added a component the
  outcome model never had.
- **Extends:** ADR-0001 decision 4. That decision rejected inferring an invariant the operator never
  declared, and `PRODUCT.md` states the line it draws — *counting stays inside that decision; scoring
  leaves it.* The line was prose. This ADR makes it mechanical.
- **Corrects:** nothing in `docs/research/`.
- **Evidence:** ADR-0001 decision 4; ADR-0011 decisions 2 and 4; ADR-0013 decisions 3 and 5;
  `docs/research/metric-aggregation-prior-art.md`; `docs/research/result-taxonomy-prior-art.md`;
  `docs/proof/results-real-roots-rest.md`; `docs/proof/dispositions-real-roots.md`;
  `docs/inputs/decay-causal-synthesis-2026-08-16.md`; issues #70, #139, #140

## Context

The policy-free decay report is the product's entry point, and its kill criterion is stated in
`PRODUCT.md` → "Kill criteria": *the policy-free surface returns nothing a workspace owner recognises
as a defect worth repairing.* Three of the six countable signals that section lists exist nowhere in
the build, so the criterion cannot fire honestly — a noise verdict would indict an unfinished build
rather than the entry point.

Building those three raised a question the repository had answered only in prose. `PRODUCT.md` says
*"'This database has 47 rollups and no writes in 180 days' is a measured structural fact with a link
attached. 'This database is too complex' is a judgement the product does not make."* That sentence is
correct and it is not a test. A reviewer holding it cannot mechanically decide whether a proposed
report line crosses the line, and issue #70 decision 4 asked whether ADR-0001 has to be reopened to
answer that. It does not. The boundary follows from decision 4 already; what was missing was a form
the gate can hold.

Issue #70's research thread — recorded in `docs/research/metric-aggregation-prior-art.md` and
`docs/research/result-taxonomy-prior-art.md` — settled the shape, and spec #139 resolved it into
buildable form. This ADR promotes that boundary from a comment thread into canon, because a decision
that lives only in a thread is re-argued from taste by the next session.

**This ADR decides measurements only.** The `undeclared-invariant` observation tier is issue #101, it
is frozen, and nothing here decides it. Decision 4 below states the contrast between the two
explicitly so that a later session cannot read this ADR as having settled #101 by implication.

## Decision

### 1. A Measurement is a fourth report class, decided rather than inherited

A **Measurement** is a counted fact or an observed timestamp about a resource the scan reached,
published with a named unit, a link, and the set it was computed over. It makes no conformity claim.

It joins findings, gaps and residuals as a class of its own, with its own field on the scan result and
its own section in the report. No renderer may merge it into a findings table and no exporter may sum
across classes — the same construction ADR-0013 decision 1 used for residuals, and for the same
reason: two things in one table are two things a reader will reasonably add up.

**A measurement is not a Rule, and the definition settles it rather than a preference.** `CONTEXT.md`
defines a Rule as executable logic that tests one invariant. Edit age, per-database object counts and
write recency test no invariant — there is no correct value to conform to. Giving one a rule ID would
force it to declare a coverage item and enter a conformity ratio for a claim that cannot be stated.

### 2. Eight operational rules. A number appears in the policy-free report only if it satisfies all eight

Recorded verbatim in substance from issue #70's thread of 2026-08-18.

1. **Named unit.** A countable resource type or a time span, named in the output.
2. **Linked.** Every number resolves to a link or a set of links. The falsifier is that a reader opens
   the target and recounts.
3. **One unit per number.** Sums are over a single unit. No number combines two.
4. **No division, with one existing exception.** No ratio, no percentage, no per-database
   normalisation. A ratio is admissible only where **the operator supplied the denominator** — which
   is why the coverage manifest survives this rule, per ADR-0002.
5. **No distribution summary standing in for the items.** No mean, median or percentile in place of
   the rows.
6. **Sorting is allowed; ranking is not.** A table may be sorted and the header must name the sort
   key. No positional numbering, and no judgement vocabulary — "worst", "unhealthy", "at risk",
   "bloated" — which is the judgement re-entering as adjectives.
7. **No score surface.** No letter grade, star count, 0–100 index, GPA, or colour with implied
   valence. Green/yellow/red is a score with the numerals removed.
8. **No threshold on this surface.** A threshold exists only as a declared rule with a rule ID.

Rule 8 is a reframe and not a restriction. This product already has the mechanism for an
operator-declared threshold: a **configured rule** under ADR-0001 decision 4. "Fail when rollups
exceed 20" gets a rule ID, lives in the config file, emits a violation, and belongs to framing 3.
Nothing new is needed and nothing is reopened. What must not happen is a threshold on the policy-free
surface, which exists because the tool must return something before it asks for anything — and a
threshold on a surface that asks for nothing must ship with a default, which is shipping a judgement.

### 3. The gate test: every aggregate must be arithmetically reconstructible from the rows printed beside it

**This is the decision to implement first, and it subsumes rules 3, 4, 5 and 7.** Print the rows,
print the column sum, and a reader can verify the sum. Print a rating and nothing verifies it.

The test is mechanical, so the gate holds it as an assertion rather than a review item: recompute each
printed total from the printed rows and compare. It is the same shape as `CHECK-claims.ts` — a figure
that declares its own falsifier.

It also answers the strongest objection to itself, which is that a total is a compression and
compression is where judgement hides. That objection proves too much: under it the report could not
say how many databases it scanned. **The distinguishing property is not compression but
recoverability.**

Worked examples, carried from the thread so the test has a calibration set:

| Output | Verdict | Why |
| --- | --- | --- |
| "Projects DB: 47 rollups, 12 relations, 8 formulas. Last edited 2026-02-19." | **Pass** | Rules 1 and 2. Each figure recounts. |
| "214 rollups across 37 databases." | **Pass**, if the 37 rows print beside it | Rule 3; recoverable. |
| "Average 5.8 rollups per database." | **Fail** | Rules 4 and 5. The denominator is the tool's, and the mean hides the 47. |
| "Maintenance load: 89/100." | **Fail** | Rules 3, 4 and 7. Not recoverable, not calibrated, not falsifiable. |
| "Top 5 most complex databases." | **Fail** | Rule 6. "Complex" is ADR-0001's rejected construct. |
| "Databases sorted by rollup count (descending)." | **Pass** | Rule 6. The header names the key; the reader draws the conclusion. |
| "3 databases exceed your configured rollup limit (20)." | **Fail** on this surface; **pass** as a declared rule | Rule 8 and the reframe above. |
| "Reached 37 of 40 declared roots. 3 unreached: …" | **Pass** | Rule 4's exception — the operator supplied the 40. |

### 4. A measurement reaches the exit byte through no channel at any level

A measurement contributes nothing to the exit byte. It has no coverage item, no applicable set, no row
in the coverage vector, and no place in any ratio.

**And it has no rule-level channel either, which is the operative half.** ADR-0011 decision 2 gives
each rule a coverage item and ADR-0012 decision 2 makes the byte compare the coverage vector, so a
report class that owns a rule ID reaches the byte through that rule's row whether or not it emits a
finding. A measurement owns no rule ID, so that route does not exist for it.

⚠ **This is the contrast with issue #101 and it is the reason this decision is written out rather than
assumed.** The `undeclared-invariant` tier under discussion there is a tier *of a rule* and therefore
has a rule-level channel to guard. A measurement does not. The two are different questions, and #101
stays frozen and undecided by this ADR.

*Revisit if:* an implementation finds a channel by which a measurement reaches the byte that this
decision did not name. That is a defect in this ADR and must be surfaced, not patched quietly.

### 5. The Measurements section may never be silently empty

Every measurement prints either its rows plus the set it was computed over, or a **"not computed" line
naming its cause**. The section always renders.

The grounds are observed in someone else's deployment. Baca et al., DOI `10.1002/spe.2109`: a static
analysis tool at Ericsson *"had been abandoned after it stopped reporting faults; this was caused by an
expired license that was not discovered before this study was done."* A tool silently stopped analysing
and nobody noticed, because **a quiet report and an absent report look identical.** That is `SYS001`'s
reason for existing, arriving at a section that is not a rule.

The boundary this control makes legible is live today and not hypothetical: run 1 enumerated fourteen
databases and entered none of them (`docs/proof/results-real-roots-rest.md`). A measurement over
database schemas therefore prints its cause rather than a blank, and a reader can tell a boundary from
a pass.

### 6. A zero is scoped to the scanned set or it is not printed

"0 inbound references" may be asserted over the set this run reached and never over the workspace. An
unscoped zero is negation as failure — *it is not currently believed that* — wearing the clothes of a
measurement, and this repository has already paid for that sentence type four times in one direction
(`docs/research/vendor-assumption-drift-prior-art.md` §4, and `slice/negation.ts` is the check that
came out of it).

### 7. Every measurement carries a stable key, and the key is what answers the strongest objection

Each measurement has a stable identifier and a named unit, so a measurement emitted today can become a
declared rule condition tomorrow with no change to the measuring code. Promotion tooling is out of
scope; key stability is owed now.

**This is not housekeeping — it is the whole answer to the counter-evidence.** Sadowski et al.,
*"Lessons from building static analysis tools at Google"*, CACM 61(4), DOI `10.1145/3188720`, records
that Google removed the non-blocking warning tier because developers ignored it, and defines the cost:
*"an issue is an effective false positive if developers did not take positive action after seeing
it."* By that definition a metric line with no threshold, no fix and no promotion path is an effective
false positive by construction. The 2009 Fixit numbers price it — 3,954 FindBugs warnings reviewed,
44% producing a filed bug report, **16% fixed**.

That objection lands, and it lands here rather than being noted and set aside. What defuses it is the
promotion path: SonarQube's design shows what a metric is *for* — a metric plus a comparison operator
plus an error value is a gate condition. A measurement with a stable key becomes a declared condition
with no change to the measuring code. **Without a stable key it can never be promoted and the
objection is permanent.**

## Consequences

- The report gains a Measurements section that is structurally separate from findings and can never be
  silently empty.
- The gate gains one mechanical test — reconstructibility — that any future report line is checked
  against instead of argued about.
- ADR-0001 is not reopened, and adding a score, a grade, a threshold default or a ranking to this
  surface now requires an ADR that supersedes **this** one as well as reopening ADR-0001.
- A measurement whose input the scan does not fetch prints its cause. That makes the value of a wider
  read grant legible in the report itself rather than in a ticket.

## Revisit if

- **A benchmark corpus of 100+ real workspaces exists.** Thresholds become calibratable the way the SIG
  model's risk classes were, and the rejected option — an operator-configured threshold on this surface
  — reopens on evidence. Until then it cannot: `docs/research/metric-aggregation-prior-art.md` records
  that the Maintainability Index coefficients were fitted once over C and Pascal programs in 1992/94
  and have never been refitted, and that three peer-reviewed aggregates over the same twenty programs
  disagree with each other (Strečanský et al., DOI `10.1155/2020/2976564`).
- **Gate 4 finds owners cannot read the counts.** If technically capable owners see "47 rollups" and
  ask "so what?", the failure is that the counts are not tied to a repair decision. ⛔ **The honest fix
  is better linking and context, not a score, and this ADR pre-registers that so the score can be
  recognised when it is proposed as the remedy.**
- **A signal turns out to need a declared tolerance to be worth printing.** That signal is then a
  configured rule with a rule ID and it leaves this surface rather than bending it.

## Citation hygiene, carried from the sweep

- **The Goodhart aphorism is not Goodhart's wording.** *"When a measure becomes a target, it ceases to
  be a good measure"* is Marilyn Strathern's 1997 compression. Attribute it to Strathern, with no page
  number — the wording was not read first-hand.
- **Austin 1996 is not cited here.** The publisher's page returns an error page. Mordal et al.,
  DOI `10.1002/smr.1558` §2.1, carries the same argument first-hand and in the software domain.
- **Sjøberg et al. 2012 and Vasilescu et al. 2011 are not cited for any figure.** Metadata verified,
  findings not read.
- **Standing bias, named:** the Tornhill & Borg validation of CodeScene's Code Health is authored by
  CodeScene's founder and evaluates CodeScene. It is the strongest published defence of scoring and it
  is not independent.
