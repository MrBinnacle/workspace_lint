# T2 SYS001 — the first rule, the first coverage vector, and acceptance criterion 1 closed against a pre-registered oracle

- **Evidence class:** `observed`. This file records what the API and the code actually did.
  It outranks documentation on any question of fact.
- **Date:** 2026-08-17. `Notion-Version: 2026-03-11`. Read-only.
- **Ticket:** #43 (T2). **Spec:** `docs/spec/v0.1-scan-slice.md`.
- **Branch:** `build/t2-sys001`, cut from `build/t1-scan-scaffold` at `6972899`.
- **Code:** `slice/`. Command: `npx tsx cli.ts scan --config ../wl.config.json --oracle`.

## 1. The run

The scan resolved the declared root, enumerated 15 blocks, found 3 child resources, descended into
the two `child_page` children, and stopped at the `child_database`. SYS001 judged the three
resources the funnel delivered whole. It returned **exit `3`** in **6 requests** and **1.66 s wall**.

| Figure | Value | Change from T1 |
| --- | --- | --- |
| Applicable set | 4 resources — the declared root and its 3 children | unchanged |
| Reached `fetched` | 3 of 4 | unchanged |
| Reached `evaluated` | **3 of 4** | was 0 of 4 |
| Coverage vector (ADR-0011) | `SYS001 3/4 resources (75.0%)` | was **empty** |
| Headline coverage | `3/4 resources` — the minimum of the vector, set by SYS001 | did not exist |
| Outcome pair | conformity `violates` · evidence `unreached` | did not exist |
| Conformity ratio | `0/1 rules conforming` | did not exist |
| Findings | **1** — SYS001 on `f937580c-0964-4ea7-a781-b9119887ee5b` | 0 |
| Disposition | `qualified` | unchanged |
| Exit | **3** — gaps confined, coverage below the declared threshold | unchanged |
| Requests · wall | 6 · 1662 ms | 6 · 1782 ms |

**Neither the request count nor the wall time is a validated budget.** #7 owns budgets on a named
reference workspace and has not run. Three runs across two sessions returned 2043 ms, 1782 ms and
1662 ms; nothing should be concluded beyond "the scoped run is seconds, not minutes."

## 2. Acceptance criterion 1 is closed, and this is the run that could close it

`slice/fixture-oracle.ts` is hand-written from `docs/proof/fixture.md`'s "What exists" table and was
committed on 2026-08-17 in `9dcb069`, **before** this run existed. Criterion 1 requires the
hand-written manifest to be written before the run, which is why #42's run could not close it: that
run's applicable set was checked against the code's own output.

Result: **`ORACLE MATCHED`**, twelve comparisons, no mismatch. The oracle asserted, and the run
confirmed:

- the applicable set is 4;
- the declared root and both `child_page` children reached `fetched`;
- exactly one resource stalls at `enumerated` — the data source;
- `wl-outside-grant` and `wl-revoke-child` are **absent** from the manifest.

**An oracle mismatch does not move the exit byte, and did not need to here.** The byte reports the
scan's coverage verdict; the oracle reports whether the scan agrees with a human's written
expectation. Collapsing them would let a fixture edit read as a coverage failure.

**`wl-revoke-child` is still absent, so Q1 is unchanged.** Selective revocation still removes the
child from the parent's child list rather than making it visible-and-unreadable, re-confirmed by
this run. If it ever appears in this manifest, Q1 reopens.

## 3. What SYS001 counts, and the one thing that decides whether the figure is honest

SYS001's coverage item is a **resource** (ADR-0011 decision 2), so its row reads `3/4 resources`.
The unit is printed with every figure computed over it.

A resource is judged when the funnel delivered it whole: it reached `fetched` **and** carries no
drop-out cause. The second clause is the load-bearing one, and the mutation check in
`slice/CHECK-sys001.ts` TEST 5 measures what removing it costs. Judging on `fetched` alone, against
a fixture whose root enumeration dies mid-stream:

| | With the cause clause | Without it |
| --- | --- | --- |
| Unbounded gap | present | **gone** |
| Gaps · findings | 1 · 1 | **0 · 0** |
| Disposition | `disclaimed` | **`unqualified`** |
| Coverage | 1/2 resources | **2/2 resources (100%)** |
| Exit | `2` | **`0`** |

One omitted clause turns a disclaimed run into a clean bill of health over a root whose children
were never listed. `gapsFrom()` keys on the `evaluated` stage, so marking a truncated parent
evaluated does not shrink its gap — it deletes it.

**This was written expecting the byte to fall from 2 to 3.** The measured result is worse than the
prediction, and the measured values are what the check now asserts.

## 4. Two defects found, both in the same layer as T1's two

**`deriveVerdict` builds its reason string with a bare ratio.** The `why` field reads
*"coverage 3/4 is below the declared threshold 1"* with no unit named, which acceptance criterion 6
and ADR-0011 decision 4 both forbid. Found by a check that tests **every** rendered line for a
figure without a unit, not the coverage section alone — the same shape of assertion that caught the
title leak on the first live run.

`slice/verdict.ts` is copied verbatim from `prototypes/verdict.ts`, which spec §5 freezes as a
primary source, so the string is **not** edited there. The render layer names the unit instead. The
real remedy is an ADR permitting the two files to diverge, and it is filed as a follow-up rather
than decided inside #43.

**A failed credential printed `disposition: unqualified`.** `deriveVerdict` computes the disposition
from gaps and violations. A run whose identity call fails has neither, so it returned the value that
means *every rule sufficient, every rule conforms* — printed three lines under "The scan did not run
as declared. No coverage claim is made." The report contradicted itself.

This is **T1 behaviour, not introduced by #43**; the same path returned `unqualified` on #42's code.
What changed is that it now prints beside a coverage vector and a conformity ratio, which made the
contradiction legible. ADR-0005 decision 3's three dispositions describe a report of a scan that
ran, and exit `4` says this one did not. The render layer prints `none — the scan did not run as
declared, so no disposition was formed`. Same rule as the baseline state: a value the run did not
compute is a false claim whichever value it carries.

## 5. What this run did not exercise, stated so the result is not read as complete

Spec §1.3 requires the recorded result to name the criteria the fixture cannot exercise.

- **`REF001` is not implemented.** #44 owns it. Criterion 4 — a link whose target the connection
  cannot read, `certainty: confirmed` about a `target state: unreachable` — is **not closed by this
  run.** `wl-outside-grant` is reachable only as a link target and this slice discovers no links.
- **No seeded `REQ001`, `UNQ001`, `SCH001`, `DEP001` or `CAN001` defect was looked for.** The
  fixture seeds none, and the slice implements none.
- **Criterion 5 is not closed.** There is no JSON report and no Normalization function; #45 owns
  both. Byte-stability across two runs is therefore untested.
- **Criterion 8's budget is unvalidated**, per §1 above.
- **ADR-0011 decision 6's empty-vector byte is unimplemented, because its input is unreachable
  here.** A vector is empty only when every rule's applicable set is empty; the declared root enters
  the manifest immediately after the identity call, so the applicable set is empty only on the auth
  failure path, where exit `4` already fires and outranks `3`. `no_applicable_subject` therefore has
  no code path in T2. It becomes reachable when a rule can have an empty applicable set while
  another rule does not — that is #44.
- **The finding carries no link.** `CONTEXT.md`'s settled default names a resource "by ID and link."
  The authoritative link is the object's own `url` field, which this slice never reads:
  `NotionPort.retrievePage` is typed `{ id: string }`. A link constructed from the ID would be an
  assertion about Notion's URL scheme for an object whose kind the manifest does not record —
  `app.notion.com/p/{id}` is observed for pages (`docs/research/notion-live-probe.md`, search
  results carrying the API's own `url` field) and is unevidenced for a data source. The report
  prints the null and states the reason per run.

## 6. Two figures that look the same and will stop being the same

`deriveVerdict` compares one scalar — `evaluated / applicable` over the funnel — against the
declared threshold. ADR-0011 decision 5 makes the threshold a floor on **every** rule, i.e. on the
**minimum of the vector**. In T2 those are the same number, because there is one rule and its
coverage item is the resource the funnel stages.

**That coincidence ends with #44.** `REF001` counts internal references, so the minimum of the
vector stops being `evaluated / applicable`, and feeding the scalar instead of the minimum would let
a well-covered rule mask a badly covered one — the Great Expectations defect ADR-0005 decision 4
already prohibits. `verdict.ts` is frozen, so changing what it compares is a decision that goes in
an ADR before it goes in code. Recorded here so #44 does not discover it at the exit byte.
