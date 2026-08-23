# Run 2 — the counters rendered on the same five roots, and one executed repair visible in three places

- **Date:** 2026-08-22. Session S041. Run 2 of the verdict sprint — the kill-criterion read.
- **Pre-registration:** `docs/proof/prereg-run2-kill-criterion-read.md`, committed at `ad69ab1`
  **before** the first scan. Predictions P1–P7 and the three-branch adjudication procedure
  predate every number below.
- **Instrument:** `slice/` at `main@8d23fe8`, gate exit 0 at session start (16 suites). Per root:
  `npx tsx cli.ts scan --config ../wl.config.json --deterministic`, one root per config, alias
  equal to the role label, `minCoverage` 1.0. Positive control held on all five runs: every
  declared root's own retrieve succeeded.

⛔ **THIS DOCUMENT IDENTIFIES NOTHING IN THE SUBJECT WORKSPACE.** Role labels ROOT-A–E and
TARGET-1–5 are run 1's; no new TARGET label was needed. **A future session must not "improve"
this file by adding identifiers.**

## 1. The five runs

| run | root | children | of them databases | refs in coverage | refs evaluated | REF001 findings | SYS001 vector | requests | wall | exit |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: |
| 1 | ROOT-A | 19 | 10 | 39 | 37 | 2 | 10/20 (50.0%) | 87 | 21.9 s | 3 |
| 2 | ROOT-B | 5 | 1 | 15 | 12 | 2 | 5/6 (83.3%) | 25 | 5.7 s | 3 |
| 3 | ROOT-C | 20 | 0 | 79 | 77 | 2 (+1 SYS001 unbounded) | 20/21 (95.2%) | 281 | 72.9 s | **2** |
| 4 | ROOT-D | 1 | 1 | 0 | — | 0 | 1/2 (50.0%) | 3 | 0.5 s | 3 |
| 5 | ROOT-E | 2 | 2 | 0 | — | 0 | 1/3 (33.3%) | 3 | 0.9 s | 3 |
| Σ | | **47** | **14** | **133** | **126** | **6** | | **399** | 101.9 s | |

Request total **identical to run 1: 399.** The counters cost zero API requests, by construction —
they are derived from the manifest the scan already builds.

## 2. The executed repair, visible in three places

Between the runs, one repair was executed and verified
(`dispositions-real-roots.md`, verification table): TARGET-3's dead mention under ROOT-A was
repointed at a live surface. Run 2 sees it three times, without being told:

1. **The TARGET-3 finding is gone.** ROOT-A: 2 REF001 findings (TARGET-1, TARGET-2), was 3.
2. **One more reference is in ROOT-A's coverage denominator: 39, was 38.** The replacement
   mention is a new internal reference.
3. **Its target is a database inside ROOT-A's own child set** — recorded as a bounded gap
   (`target-kind-not-retrievable`), never a finding, which is the correct side of REF001's line —
   and it is the **only nonzero row in the whole inbound-references measurement**: run 1's report
   showed no reference landing on any reached database; run 2 shows exactly one, and it is the
   repair.

The honest consequence travels with it: **repairing a dead link made ROOT-A's REF001 coverage
ratio go down** — 37/38 (97.4%) to 37/39 (94.9%) — because the live replacement target is a
database this slice cannot enter. A reader who prices #51 should price this: on today's build,
every repair that repoints prose at a database converts a finding into a permanent coverage gap.

## 3. The Measurements section, as actually rendered

The kill-read surface, per report:

- **Last edited** — `computed` on all five reports, and **every table has exactly one row: the
  declared root.** The `over` line says why, honestly (ROOT-A: "1 of 20 reached resource(s)"):
  `GET /v1/pages` runs for the declared root, reference targets and rule hydration only, and a
  policy-free run hydrates nothing, while reference targets sit in the references unit. **The
  flagship edit-age counter, on a policy-free scan of this build, measures the root and nothing
  else.** The denominator is printed and true; the signal is one timestamp per report.
- **Inbound references per reached database** — `computed` on ROOT-A/B/D/E, `computed: false` on
  ROOT-C with the no-data-source cause. Rows: ROOT-A 9 zeros and the one repair row; ROOT-B its
  single database at 1 (something in the hub points at it); ROOT-D/E all zeros — **the two roots
  the operator named as prime decay surfaces show every database with nothing in its own subtree
  pointing at it**, over a denominator of a one- and a two-child scan.
- **The three maintenance-load lines** — `computed: false` on all five reports, three distinct
  causes, each naming its endpoint and its actual obstacle.

Rendered shape of the section: on the page-only root the section is **four uncomputed paragraphs
to a one-row table**; on the database roots, two computed tables (one of them one-row) above
three uncomputed paragraphs. Whether that reads as honest disclosure or as noise is the
registered density question and belongs to the operator's cold read, not to this file.

## 4. Predictions scored — five hold, one refuted, one pending the read

| # | registered | outcome |
| --- | --- | --- |
| P1 | Same-day replication: children/databases (19/10, 5/1, 20/0, 1/1, 2/2), exits (3,3,2,3,3) | **HOLDS**, every figure. ROOT-C exited 2 through the same block-tree budget exhaustion on the same child (#136's reproduction, as registered). |
| P2 | ROOT-A: exactly 2 REF001 findings, TARGET-3 absent, no new unresolvable target | **HOLDS.** The repair's replacement reference appeared as a bounded gap, not a finding — the branch P2 named did not fire. |
| P3 | Measurements render on all five, never silently empty; computed/uncomputed states as registered | **HOLDS**, all fifteen states as registered. |
| P4 | Inbound counts mostly zero: ≥7 of 10 ROOT-A rows zero; ≤3 total landing across runs | **HOLDS** — 9 of 10, and the total across all runs is 2 (one of them the repair). |
| P5 | On ≥1 root, oldest and newest retrieved timestamps differ by >90 days | **REFUTED, structurally.** Every last-edited table has one row, so no spread exists to measure on any root. The registered refuted-branch fires at its strongest: the retrieved set is not "too small or too recent" — it is the declared root alone, on every policy-free run this build can produce. |
| P6 | Zero added requests; total within 359–439; every run <3 min | **HOLDS** — 399 requests, identical to run 1; worst wall 72.9 s. |
| P7 | ≥1 of 5 Measurements bins SIGNAL; ≤1 CANT-TELL | **PENDING** the operator's cold read. |

## 5. What happens next, per the pre-registration

The operator reads the five `--show-titles` copies cold, bins new/changed findings and the five
Measurements sections, and answers the density question in his own words. Bins land in
`docs/proof/dispositions-run2.md`; the adjudication branch (SURVIVES / SURVIVES-NARROW / KILL)
is then read off the procedure registered in the pre-registration, not re-derived.

One fact for that adjudication is already fixed by §3 and no bin can move it: **two of the six
countable signals PRODUCT.md lists — edit age beyond the root, and every per-database count —
render as denominator-honest boundary text on this build**, and a third (inbound references) is
structurally 0-or-1. The cold read decides whether what remains is signal; it cannot decide that
the boundary lines are rows.

## 6. What this run cannot establish

- **Not a population rate.** Every figure is a density inside one workspace.
- **Not the databases' contents** — #51; its deferred runs stand registered.
- **Not the target-status distinction** — #135's anonymity defect reproduces here by design;
  its cost was measured in run 1's verification layer.
- **Not a buyer signal.** #29 is untouched.
