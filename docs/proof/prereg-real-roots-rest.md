# Pre-registration — five real roots through the REST port, the verdict sprint's run 1

**Registered 2026-08-22, committed BEFORE the first scan.** Session S036. Instrument:
`slice/` at `main@3e1722b`, gate exit 0 (typecheck first, 0 FAIL), re-run at session start.

This repository is public. **No identifier, title, or URL from the subject workspace appears in
this file or in the result file that follows it.** Counts, rates and shapes only. Roots are
labelled by role — ROOT-A through ROOT-E — and the mapping from label to resource is held outside
the repository, with the token. **A future session must not "improve" either file by adding the
identifiers.**

## What this run is, and what it is not

This is `#117` Route 1: the owner's workspace, through the product's own read-only REST
integration, at the width the 2026-08-22 grant re-measure confirmed. It produces the first
REST-tier per-resource densities — gaps per resource, unresolvable references per reference —
**inside one workspace. It is a density, never a population rate.** One workspace cannot yield a
rate about workspaces, and writing one would be the denominator error this product exists to
detect.

It is also **run 1 of the verdict sprint, and run 1 cannot fire the kill criterion.** The
policy-free counters (`PRODUCT.md` → "The config file is the suspect, not the segment") are
unbuilt; only coverage and unresolvable references exist. Run 2's reading is the kill-criterion
test. Anything this run tempts us to conclude beyond the decision list below is written down as a
hypothesis for run 2, not a result.

**Partial-replication note.** `docs/proof/results-first-real-workspace.md` (2026-08-19) already
ran one owner root: 85 requests, 23.2 s, exit 3, coverage 10/20. Whether ROOT-A is the same root
cannot be established from that file — it identifies nothing, deliberately — so a matching shape
in this run is recorded as *consistent with replication*, never as *the same root re-measured*.

## The five roots, and the two the build cannot take

One root per run — the config loader rejects more (`docs/spec/v0.1-scan-slice.md` §1.1) — and the
scan descends one level. Run order is fixed here, before any report exists; no swaps after the
first report is read.

| run | root | why it is in the set |
| --- | --- | --- |
| 1 | **ROOT-A** | The workspace's top operations surface. The database-dense case: it measures the `#51` visibility cost honestly. |
| 2 | **ROOT-B** | A container hub that absorbed loose pages in a 2026-03 cleanup; page-heavy, one database. |
| 3 | **ROOT-C** | A second container hub; the page-only case. The only root predicted to exit 0. |
| 4 | **ROOT-D** | Parent page of the first database the operator named as a prime decay surface. |
| 5 | **ROOT-E** | Parent page of the second; both of its children are databases. |

**ROOT-D and ROOT-E are substitutes, and the substitution is the finding.** The operator named two
*databases* — capture inbox and resource shelf — as the prime decay surfaces. **A database cannot
be a declared root in this build**: the root is retrieved with `GET /v1/pages/{id}`, and rows need
`POST /v1/data_sources/{id}/query` — the ask-first endpoint `#51` owns, neither requested nor
granted. The two database roots are **registered here as deferred runs, activated when `#51`
lands.** Until then the parent-page runs measure the boundary at exactly the place the owner
points: the slice will enumerate each database as a child and record it as a bounded gap it cannot
enter.

## Method

Per root, in the registered order:

1. Write the gitignored `wl.config.json` by hand — one root, alias equal to the role label,
   `minCoverage` **1.0**. The floor stays at 1.0 for every run: lowering it to "pass" a run known
   in advance to be gappy would be aiming the instrument after reading the target. Exit 3 is the
   scan's verdict, not our grade, and the predictions below own it.
2. `npx tsx cli.ts scan --config ../wl.config.json --deterministic` — the committed numbers come
   from this pass. Exit byte, request count and wall time are recorded per run.
3. A second pass with `--show-titles`, for the operator's read only. **It is never committed and
   never quoted**; the operator reads it locally.
4. No `--oracle`. The fixture oracle pre-registers the fixture; no oracle row exists for any real
   root, and an oracle aimed after the fact is not an oracle.

**The positive control, without which a run proves nothing:** the declared root's own retrieve
must succeed in the same run. Reference targets that then fail to resolve are informative; without
the control, a connector fault and a dead link are the same observation. A run whose root retrieve
fails is an instrument failure and is recorded as one, not as evidence about the workspace.

## The read protocol, defined before any report exists

The operator reads each report **cold** — no agent annotation before the read — and dispositions
every finding into exactly one bin, with a one-line reason:

- **REPAIR** — the specific edit is obvious from the finding alone, and the operator would make it
  in Notion this sitting. If the finding requires investigation first, it is not REPAIR.
- **NOISE** — the operator recognises the finding and would never act on it.
- **CANT-TELL** — the report does not give enough to decide. **This bin is a defect of the report,
  not of the workspace**, and its count is a product measurement.

The bins and reasons are committed to `docs/proof/` beside the result file, role-labelled under
the same redaction rule.

## What run 1 can decide, registered as a closed list

**Can decide:** the first REST-tier gap density and reference density inside one workspace; whether
the three read-protocol bins work as bins (or collapse into CANT-TELL); a timing point against the
three-minute kill criterion's scope clause; the measured width of the `#51` visibility boundary.

**Cannot decide:** the kill criterion (counters unbuilt); pricing, buyers, segments, or anything
`#29`-shaped; any claim about workspaces in general; any claim REF001's wording forbids — *absent
or inaccessible, indistinguishable* — so nothing is written as "deleted".

## Predictions, registered before the first scan

Shape figures below derive from MCP connector views (documented-tier under ADR-0004 — a different
credential path that does not clear the REST path), fetched 2026-08-22 over cached renderings
dated 2026-06-09 through 2026-08-20. The REST scan is the measurement; a stale MCP view refutes a
prediction, not the run. Where the honest direction is the embarrassing one, the prediction takes
it.

| # | Prediction | Refuted if |
| --- | --- | --- |
| **P1** | ROOT-A enumerates 18–22 child resources, of which ≥ 8 are databases; exit 3. | Outside those ranges, or any other exit byte. |
| **P2** | ROOT-B enumerates ≤ 8 children with exactly one database; exit 3 — one gap is enough at a 1.0 floor. | More databases than one, or any other exit byte. |
| **P3** | **ROOT-C exits 0 — the only green in the set.** If even the page-only hub cannot go green, the tool never exits 0 in the wild and the floor's meaning is due a rethink. | Any other exit byte. |
| **P4** | ROOT-D and ROOT-E enumerate ≤ 4 resources each, every child a database; both exit 3. | Any readable (non-database) child, or any other exit byte. |
| **P5** | ⚠ **Unresolvable references are RARE: ≥ 1 but < 5 across all five runs.** The owner's expectation runs the other way, so the low side is registered deliberately, as in the S031 pre-registration. | Zero anywhere (REF001 signal absent), or ≥ 5 (density high). |
| **P6** | **Databases are ≥ 40% of all enumerated child resources across the five roots** — the boundary claim: the owner's prime surfaces sit outside the slice's sight. | Under 30%. Between 30% and 40% the prediction is scored WEAK, not refuted. |
| **P7** | Every run completes warm in under 3 minutes; the five deterministic passes total < 300 requests (precedent: 85 for 20 resources). | Any run over 3 minutes, or the total at 300+. |

## What this run cannot establish

- **Not a population rate.** Density within one workspace, stated with its denominator.
- **Not the kill-criterion verdict.** Run 2, after `#70` decisions 2–4 ship.
- **Not the database contents.** That is `#51`, and the deferred runs above are its acceptance
  case, pre-registered.
- **Not a buyer signal.** `#29` is untouched by anything measured here.
