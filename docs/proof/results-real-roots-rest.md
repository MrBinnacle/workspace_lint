# Five real roots through the REST port — no green anywhere, and the refuted predictions are the result

- **Date:** 2026-08-22. Session S036. Run 1 of the verdict sprint; `#117` Route 1.
- **Pre-registration:** `docs/proof/prereg-real-roots-rest.md`, committed at `15b57f7` **before**
  the first scan. Run order, floor, read protocol and all seven predictions predate every number
  below.
- **Instrument:** `slice/` at `main@3e1722b`, gate exit 0 at session start. Per root:
  `npx tsx cli.ts scan --config ../wl.config.json --deterministic`, one root per config, alias
  equal to the role label, `minCoverage` 1.0.

⛔ **THIS DOCUMENT IDENTIFIES NOTHING IN THE SUBJECT WORKSPACE.** Roots are ROOT-A through ROOT-E
and dead targets are TARGET-1 through TARGET-5, per the pre-registration's redaction rule. The raw
reports were kept out of the repository deliberately; **a future session must not "improve" this
file by adding identifiers.**

## 1. The five runs

| run | root | children | of them databases | refs discovered | refs evaluated | REF001 findings | SYS001 vector | requests | wall | exit |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: |
| 1 | ROOT-A | 19 | 10 | 38 | 37 | 3 | 10/20 (50.0%) | 87 | 21.1 s | 3 |
| 2 | ROOT-B | 5 | 1 | 15 | 12 | 2 | 5/6 (83.3%) | 25 | 6.1 s | 3 |
| 3 | ROOT-C | 20 | 0 | 79 | 77 | 2 (+1 SYS001) | 20/21 (95.2%) | 281 | 73.5 s | **2** |
| 4 | ROOT-D | 1 | 1 | 0 | — | 0 | 1/2 (50.0%) | 3 | 0.6 s | 3 |
| 5 | ROOT-E | 2 | 2 | 0 | — | 0 | 1/3 (33.3%) | 3 | 0.6 s | 3 |
| Σ | | **47** | **14** | **132** | **126** | **7** | | **399** | 101.9 s | |

**No root exited 0.** Five of five runs end non-green: four at exit 3 (bounded gaps below the 1.0
floor), one at exit 2.

## 2. The densities — within one workspace, never a population rate

- **Unresolvable internal references: 7 findings over 126 evaluated references (5.6%), on 5
  unique targets.** Every root that had references at all (3 of 5) produced at least one.
- **TARGET-1 is dead from three different roots.** The single most-referenced unresolvable target
  in the sample is referenced by ROOT-A, ROOT-B and ROOT-C alike. REF001's wording is the whole
  claim: *absent or inaccessible, indistinguishable* — nothing here is written as "deleted".
- **Databases: 14 of 47 enumerated children (29.8%), and the slice can enter none of them.** The
  three databases under ROOT-D and ROOT-E — the two the operator named as prime decay surfaces
  plus one sibling — are exactly the recorded bounded gaps of runs 4 and 5.

## 3. Predictions scored — three hold, four refuted, and the refuted four carry the information

| # | registered | outcome |
| --- | --- | --- |
| P1 | ROOT-A: 18–22 children, ≥8 databases, exit 3 | **HOLDS** (19, 10, exit 3). Shape identical to `results-first-real-workspace.md` — 10/20 at 50.0%, 87 vs 85 requests — *consistent with replication*, which is the strongest wording the redacted record permits. |
| P2 | ROOT-B: ≤8 children, exactly one database, exit 3 | **HOLDS** (5, 1, exit 3). |
| P3 | ROOT-C exits 0 — the only green | **REFUTED — exit 2.** Not by a stale view or a hidden database: one deeply nested child page **exhausted the block-tree budget of 40 requests at depth 0**, an UNBOUNDED gap. The registered rethink clause fires: the tool produced no green on any real root sampled, and the floor's meaning at 1.0 on organic content is now a live question. |
| P4 | ROOT-D/E: ≤4 resources each, every child a database, exit 3 | **HOLDS** (1 and 2 children, all databases, both exit 3). |
| P5 | Dead references rare: ≥1 but <5 across all runs | **REFUTED, high side** — 7 findings / 5 unique targets. ⚠ The pre-registration never said which of those two counts P5 uses; that ambiguity is a pre-registration defect, recorded here rather than resolved in whichever direction flatters. High side is refuted under both. |
| P6 | Databases ≥40% of enumerated children (refuted <30%) | **REFUTED at 29.8%** — by two tenths of a point, and honestly: ROOT-C's twenty page-children diluted the fraction. The boundary claim survives in absolute terms (14 databases, 0 enterable) but the registered threshold does not. |
| P7 | Every run <3 min AND five passes <300 requests | **REFUTED on requests: 399.** The time half held (worst 73.5 s). ROOT-C alone cost 281 requests — reference density, not resource count, drives cost, which the estimate (85 requests for 20 resources) never priced. |

## 4. What the instrument did that no fixture ever forced

1. **Exit 2 by unbounded gap was reached live for the first time.** The state record held that
   condition (b) "cannot be forced against a read-only connection" and existed offline-only. Real
   nesting depth forced it through a path no fixture modelled: the per-resource block-tree request
   budget. A page-only hub — the one root predicted green — is where it fired.
2. **A `400 validation_error` reference-target class exists.** Two link targets under ROOT-C
   failed retrieval with 400, not 404. The report recorded both as bounded gaps (evidence
   unreached), not findings — the correct side of REF001's line — but no spec names this class.
3. **Reference density, not resource count, is the cost driver.** 281 of 399 total requests were
   one root's. Any future request-budget claim must be stated per reference, not per resource.
4. **The scan is fast on real content.** 101.9 s of wall for all five deterministic passes,
   read-only throughout, well inside the three-minute kill-criterion clause per root.

## 5. What happens next, per the pre-registration

The operator reads the five `--show-titles` copies **cold** — no agent annotation — and
dispositions each of the 7 REF001 findings and 1 SYS001 finding into REPAIR / NOISE / CANT-TELL
with a one-line reason. The bins land in `docs/proof/dispositions-real-roots.md` under the same
redaction rule. Nothing in this file anticipates that reading.

## 6. What this run cannot establish

- **Not a population rate.** 5.6% is a density over 126 evaluated references in one workspace.
- **Not the kill-criterion verdict** — the policy-free counters are unbuilt; run 2 owns it.
- **Not the databases' contents.** 14 enumerated, 0 entered; that is `#51`, whose deferred runs
  stand registered.
- **Not a buyer signal.** `#29` is untouched.
