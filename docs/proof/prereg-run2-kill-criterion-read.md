# Pre-registration — run 2 of the verdict sprint: the kill-criterion read

**Registered 2026-08-22, committed BEFORE the first scan.** Session S041. Instrument: `slice/` at
`main@8d23fe8`, gate exit 0 at session start — 16 suites, typecheck first. The Measurements set
(#140–#145) is complete on this instrument; run 1 (`prereg-real-roots-rest.md`,
`results-real-roots-rest.md`) ran earlier the same day on `main@3e1722b`, before the counters
existed.

This repository is public. **No identifier, title, or URL from the subject workspace appears in
this file or in the result file that follows it.** Roots keep their run-1 role labels ROOT-A
through ROOT-E; dead targets keep TARGET-1 through TARGET-5, and any new unresolvable target is
assigned the next TARGET number. The label→resource mapping is held outside the repository. **A
future session must not "improve" either file by adding identifiers.**

## How to treat this document

The predictions and the adjudication procedure below are **fixed at commit, before any report
exists** — that is what a pre-registration is, and correcting them after the data is aiming the
instrument after reading the target. Where a prediction turns out ambiguous (run 1's P5 was), the
ambiguity is recorded in the results file as a pre-registration defect, never resolved in the
flattering direction. The bins, the density reading and the kill verdict itself are the
**operator's**, taken in his own words; nothing here decides them for him.

## What run 2 is, and what it is not

Run 1 could not fire the kill criterion: the policy-free counters were unbuilt. They are built
now, so this run is the **kill-criterion read** — `PRODUCT.md` → "Kill criteria", the criterion
that replaced the demand-test criterion on 2026-08-17: *"the policy-free surface returns nothing
a workspace owner recognises as a defect worth repairing … If a first run against a real decayed
workspace produces a report its owner reads as noise, the entry point has failed."*

It is also a **same-day replication**: same five roots, same registered order, same 1.0 floor,
same method. Two things changed between run 1 and run 2, and both are named here so the results
file cannot discover them:

1. **The instrument.** The Measurements section now renders — per report: a last-edited table
   over the retrieved set, an inbound-references-per-reached-database table, and three
   `computed: false` boundary lines whose causes name three different obstacles (schema call
   authorized but unbuilt; view call needing no missing grant; row call ask-first and not
   granted).
2. **The workspace.** One repair was executed after run 1's dispositions: TARGET-3's dead
   mention under ROOT-A was repointed at a live surface, verified by read-back
   (`dispositions-real-roots.md`, verification table).

## Method

Identical to run 1, per root in the registered order ROOT-A → ROOT-E:

1. Write the gitignored `wl.config.json` by hand — one root, alias equal to the role label,
   `minCoverage` **1.0**.
2. `npx tsx cli.ts scan --config ../wl.config.json --deterministic` — the committed numbers come
   from this pass. Exit byte, request count and wall time recorded per run.
3. A second pass with `--show-titles`, written to `.scratch/`, **for the operator's cold read
   only. It is never committed and never quoted.**
4. No `--oracle` — no oracle row exists for a real root.

**Positive control, unchanged:** the declared root's own retrieve must succeed in the same run.
A run whose root retrieve fails is an instrument failure and is recorded as one.

## The read protocol — extended for the counters, fixed before any report exists

The operator reads the five `--show-titles` copies **cold** — no agent annotation before the
read.

- **Findings** (REF001 / SYS001) are binned REPAIR / NOISE / CANT-TELL exactly as in run 1.
  **A finding identical to run 1's — same rule, same target, same root — inherits its run-1 bin
  and is not re-read**; only new or changed findings are binned. Run 2's question is the
  counters, and re-billing the operator for unchanged rows would measure his patience, not the
  report.
- **The Measurements section is binned once per report** — five bins — into:
  - **SIGNAL** — the section names at least one thing the operator would act on this sitting,
    and he names it;
  - **NOISE** — he recognises everything in it and would act on none of it;
  - **CANT-TELL** — the section does not give enough to decide. **As in run 1, CANT-TELL is a
    defect of the report, not of the workspace, and its count is a product measurement.**
- **The density question, asked explicitly after the five bins.** Each report renders three
  boundary paragraphs against at most two computed tables. The operator answers, in his own
  words: does that ratio read as honest disclosure, or as noise between him and the numbers?
  Flagged on #143 and #145; **this is the felt-surface call the S040 close reserved for the
  operator, and it is recorded verbatim, not summarised.**

Bins and reasons land in `docs/proof/dispositions-run2.md`, same redaction rule. The run-1
verification-layer discipline stands: any REPAIR bin on a reference target is checked through
the second credential path before an edit is proposed, and **every published acceptance figure
names its layer** — run 1's cold-read and verified figures differed 4-of-6 to 1-of-6, and a
future claim quoting one as the other would be false.

## The adjudication procedure — registered before the data

The criterion is adjudicated over the **union of run-1 and run-2 evidence**, because both runs
read the same policy-free surface and run 1's record already exists: at the verified layer the
surface returned one genuinely dead reference its owner repaired the same sitting (TARGET-3).
A clean KILL therefore cannot be manufactured by run 2's bins alone, and pretending otherwise
would be re-running a test whose half is already scored. Three outcomes, fixed now:

- **SURVIVES** — at least one of the five Measurements bins is SIGNAL, and run 1's verified
  repair stands. The completed surface adds recognised value beyond the reference half.
- **SURVIVES-NARROW** — zero Measurements bins are SIGNAL. The entry point survives on the
  reference/coverage half only, and the counters — the content #70 decisions 2–4 and five
  tickets were spent building — read as noise to the one owner sampled. **This outcome obliges
  a filed ticket on the counter surface, not silence**, and any later claim that the policy-free
  counters carry the entry point must cite this outcome against itself.
- **KILL** — the operator, reading the completed surface cold, states in his own words that the
  surface as a whole is noise notwithstanding the run-1 repair record. That is his values call
  on his own workspace; no bin arithmetic reaches it for him. If he does not volunteer it, it
  did not happen.

n=1 discipline, unchanged: the one owner is the operator, every rate below is a density inside
one workspace, and no outcome here is a claim about workspaces in general.

## Predictions, registered before the first scan

Where the honest direction is the embarrassing one, the prediction takes it.

| # | Prediction | Refuted if |
| --- | --- | --- |
| **P1** | **Same-day replication:** each root's child count and database count equal run 1's (19/10, 5/1, 20/0, 1/1, 2/2) and the exit bytes are (3, 3, 2, 3, 3). | Any figure differs. Whether that is workspace drift or instrument regression is diagnosed from the run record, not assumed. |
| **P2** | **The repair is visible to the product:** ROOT-A produces exactly 2 REF001 findings (run 1: 3), TARGET-3 absent, and **no new unresolvable target appears on ROOT-A**. | 3 findings (the repair did not reach this subtree's reference set); or a new target appears (the repair traded a dead link for an out-of-grant one — the #135 indistinguishability cost, measured by the product this time). |
| **P3** | **The Measurements section renders on all five reports, never silently empty:** last-edited `computed` on all five; inbound-references `computed` on A, B, D, E and `computed: false` on C with the no-data-source cause; the three maintenance-load lines `computed: false` on all five, each naming its own distinct obstacle. | Any section absent (ADR-0017 decision 5 violation — instrument defect), or any computed/uncomputed state differs from this row. |
| **P4** | **The inbound counts are mostly zero — the embarrassing direction:** on ROOT-A at least 7 of 10 database rows read 0 inbound references from the scanned set, and the total landing on reached databases across all five runs is ≤ 3. | Databases are richly referenced (≥ 4 total), which would weaken the orphan-structure story the counter exists to surface. |
| **P5** | **The age counter has spread to show:** on at least one root, the oldest and newest last-edited timestamps in the retrieved set differ by more than 90 days. | No root shows > 90 days of spread — the retrieved set (root, reference targets, rule-hydrated resources) is then too small or too recent for the age counter to show anything on this workspace, and that boundary is priced honestly in the results. |
| **P6** | **The counters are free:** measurements add zero API requests; the five deterministic passes total within ±10% of run 1's 399 (359–439); every run completes warm under 3 minutes. | Any run over 3 minutes, or the total outside the band. |
| **P7** | **The read:** at least 1 of the 5 Measurements bins is SIGNAL, and at most 1 is CANT-TELL. | Zero SIGNAL (the SURVIVES-NARROW branch fires); or ≥ 2 CANT-TELL (the completed report's defect rate dominates its signal, and #135's class of anonymity defect extends to the counters). |

## What run 2 can decide, registered as a closed list

**Can decide:** which adjudication branch fires; whether the counter surface carries recognised
signal at n=1; the completed report's CANT-TELL rate; the same-day replication check; the
measured effect of one executed repair on the product's own output.

**Cannot decide:** pricing, buyers, segments, or anything #29-shaped; any population rate; the
databases' contents (#51; its deferred runs stand registered); the target-status
indistinguishability defect (#135 — expected to reproduce here, its cost measured, its fix not
this run's business); the block-tree budget's owner (#136 — ROOT-C is predicted to exit 2
through it again, and that reproduction is data for the ticket, not a surprise).
