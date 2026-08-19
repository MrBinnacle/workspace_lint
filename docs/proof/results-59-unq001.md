# UNQ001 live run — the pair denominator set the headline, and the violation path did not run

- **Date:** 2026-08-19
- **Issue:** #59, the fourth and last v0.1 rule.
- **Subject:** the `workspace-lint-proof` integration, read-only, against the proof fixture.
- **Command:** `npx tsx make-fixture-config.ts FIXTURE_ROOT_ID --property title --rule UNQ001`
  then `npx tsx cli.ts scan --config ../wl.config.json --oracle --deterministic`.
- **API version:** `Notion-Version: 2026-03-11`. Nine requests, all read-only.
- **Oracle:** `slice/fixture-oracle.ts` → `uniqueness`, **written and committed before the run**.
- **Result:** exit **3**. **ORACLE MATCHED** on all three uniqueness assertions.

## 1. What the run reported

```
  coverage vector:
    REF001   1/1 internal references (100.0%)
    SYS001   3/4 resources (75.0%)
    UNQ001   3/6 resource pairs in a uniqueness scope (50.0%)
  headline:  3/6 resource pairs in a uniqueness scope (50.0%) — the MINIMUM of the vector, set by UNQ001
  exit:      3
```

⭐ **The pair denominator changed the headline on a real workspace, and this is the finding.** One
resource in the scope — `wl-dataset`, a data source this slice does not enumerate — is unreadable.
A resource-shaped figure reports **75%**, and `SYS001`'s row prints exactly that. `UNQ001`'s own
coverage item is unordered pairs, so the same single drop-out removes **three of six** pairs and the
true figure is **50%**.

That 25-point gap is not a rounding artefact. It is ADR-0011's whole argument, observed rather than
argued: the collapse it forbids had already shipped a `2/2 — 100%` figure over a root with three
children, and here the collapse would have overstated coverage by half again.

## 2. The oracle, matched

The row was pre-registered in `slice/fixture-oracle.ts` before the run and was not corrected after
it. Verbatim from the run:

```
  MATCH    UNQ001's applicable set is 6 resource pair(s), oracle says 6 — C(4,2), NOT 4
  MATCH    3 pair(s) reached evaluated over "title", oracle says 3 — one unreadable resource
           removes THREE pairs, not one
  MATCH    UNQ001 produced 0 finding(s), oracle says 0
  NOTE     the fixture seeds NO duplicate value, so the VIOLATION path is not exercised by this
           run. Offline only, CHECK-unq001.ts TEST 5. Seeding is operator-only (#102).
```

The scope is the declared root, which selects the root and its three children: `wl-proof-fixture`,
`wl-pagination`, `wl-revoke-parent` and `wl-dataset`. Four resources, `C(4,2)` = six pairs. The three
pairs among the three readable pages were compared; the three touching the data source are gaps.

`outcome UNQ001: conformity conforms · evidence unreached`. Both halves are right and they say
different things: the rule found no repeated value in what it read, **and** it could not read all
of it. ADR-0005 decision 1's pair, doing the job it exists for.

## 3. What this run does NOT prove

⛔ **The violation path has never run against the live API.** Every readable resource in this
fixture carries a distinct title, so no duplicate exists to find. Zero findings here is the
*conforming* path, not evidence that a duplicate would be reported.

Per #59's Definition of Done this takes the second branch — record which criterion the fixture could
not exercise — rather than claiming a proof that did not run. Unexercised live:

| Criterion | Status | Where it is exercised |
|---|---|---|
| A duplicate value produces a finding | **not run** — no duplicate in the fixture | `CHECK-unq001.ts` TEST 5 |
| Five participants regroup to five findings | **not run** | TEST 5 |
| The ceiling refuses a scope above 1,000 | **not run** — the fixture has four resources | TEST 8 |
| An empty value is not a value | **not run** — every title here is non-empty | TEST 1, TEST 4 |
| A value this build will not compare | **not run** — every title is rich-text | TEST 9 |
| `Finding.link` on a UNQ001 finding | **not run** — no finding was produced | — |

**Seeding a duplicate is an operator-only action in the Notion UI.** It is filed on **#102**. Until
it lands, `UNQ001`'s conformity-violation path is offline-only and any summary of this rule's
maturity must say so.

## 4. The redaction control, checked on live data

The duplicated value is never printed. On this run there was no duplicate, so the stronger statement
is the one the artifacts support:

- **The JSON artifact contains zero occurrences** of `wl-proof-fixture`, `wl-pagination` or
  `wl-revoke-parent` — the three real page titles. Checked by grep over the written file.
- **The terminal report contains them only inside the `HAND-WRITTEN MANIFEST ORACLE` section**,
  lines 117–123, and nowhere in the report proper. ⚠ **Those strings are the oracle's own aliases,
  transcribed into `fixture-oracle.ts` from `docs/proof/fixture.md` — they are not workspace content
  read from the API.** The oracle is a proof instrument and prints the labels it was written with;
  a reader must not take its output as evidence about redaction either way.
- `--show-titles` prints three titles, which is what the flag is for. It opts into **titles**. A
  property **value** UNQ001 compared has no flag and is never printed.

## 5. Determinism — criterion 5 holds with a fourth rule in the vector

Two consecutive live runs with `--deterministic --json` produced **byte-identical** artifacts at
**9,727 bytes**. Adding a rule whose manifest keys are composed of two resource IDs did not
introduce order dependence.

⚠ **The control is the JSON artifact, not the terminal render.** Two `--deterministic` terminal runs
differ, by one line: `requests: 9 · wall 2041 ms` against `wall 2002 ms`. `--deterministic` drops
the volatile fields from the report **document**, and the terminal's wall-time line is not among
them. This is pre-existing and unrelated to #59 — it is noted here because a future session
diffing two terminal transcripts will otherwise read it as a regression.

## 6. One report defect found by this run, and fixed

The manifest table's unit column was `padEnd(20)`, a constant sitting beside a resource-column width
measured from the data. Every `CoverageUnit` member was shorter than 20 characters until this one:
`resource pairs in a uniqueness scope` is 36. Its rows padded to nothing and the loss text ran
straight into the unit:

```
  …f23e4b04 · "title" ● ○ ○ ○ ○  resource pairs in a uniqueness scopedata-source enumeration is not…
```

Same defect class as the `heading.length + 20` offset `CHECK-harness.ts` records — a width written
as a constant beside one that is measured, correct until the data outgrows the guess. The column is
now measured, and `CHECK-report.ts` asserts that a loss never abuts its unit over a run carrying
both the shortest unit and the longest. **No assertion caught this; the live run did**, which is the
argument for running one.

## 7. Calls made

Nine, all read-only, none of them new to this rule:

```
  ok    GET /v1/users/me
  ok    GET /v1/pages/{root}
  ok    GET /v1/blocks/root/children
  ok    GET /v1/blocks/…fef57e44/children      (twice — wl-pagination paginates, 151 blocks)
  ok    GET /v1/blocks/…70a06142/children
  404  object_not_found GET /v1/pages/…bffb9742   (REF001's link target, expected)
  ok    GET /v1/pages/…fef57e44
  ok    GET /v1/pages/…70a06142
```

**UNQ001 added no request to this run.** `docs/spec/v0.1-hydration-map.md` §1.4 puts it at page
properties, identical to REQ001, and the uniqueness stage runs after the property stage and shares
its cache. On this configuration REQ001 was not configured at all, so the two `GET /v1/pages` calls
for the children are UNQ001's own — and they are the same two REQ001 would have made.
