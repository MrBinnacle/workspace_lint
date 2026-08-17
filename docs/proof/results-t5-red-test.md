# T5 — the red test. What the slice cannot detect.

Recorded 2026-08-17, branch `build/t3-ref001`, issue #46, spec §4.

## 1. The finding, and it is the point of the ticket

**A scan of `wl-revoke-parent` returns exit `0` over a page whose child it cannot see.**

Live, read-only, `Notion-Version: 2026-03-11`:

```
npx tsx make-fixture-config.ts REVOKE_PARENT_ID
npx tsx cli.ts scan --config ../wl.config.json

  disposition:      unqualified
  coverage vector:  SYS001  1/1 resources (100.0%)
  headline:         1/1 resources (100.0%) — the MINIMUM of the vector, set by SYS001
  outcome SYS001:   conformity conforms · evidence sufficient
  exit:             0
```

### The full-access control

The ticket asks for a control confirming the page still exists. Obtained from the **builder**
identity — OAuth, full workspace access, the identity that created the fixture and is explicitly not
part of the measurement (`docs/proof/fixture.md`, "Two identities"). Fetched 2026-08-17:

```
wl-revoke-parent
  <page url=".../3bf1351d6af4818688c3c234ce0fb949">wl-revoke-child</page>
```

`wl-revoke-child` (…`ce0fb949`) exists and is a child of `wl-revoke-parent`. The read-only **subject**
issues `GET /v1/blocks/{parent}/children`, receives the page's paragraphs, and receives **no
`child_page` block at all**. The child is not reported unreadable. It is absent.

So the applicable set is built as **1**, the evaluated set is **1**, and the run reports `conforms`,
`evidence: sufficient`, 100.0% coverage and a clean byte.

### This is the coverage model meeting a documented API limit

It is not a defect introduced by T1–T5, and none of those tickets could have prevented it.

- **ADR-0006 decision 2** — `GET /v1/blocks/{id}/children` carries **no truncation signal**. A
  complete enumeration and a permission-filtered one are indistinguishable in the response.
- **ADR-0011's own evidence section** already names the shape: *"the denominator was built from what
  the code could name. A denominator built that way reports its highest confidence exactly where the
  tool is weakest."*
- **Issue #35** is exactly this question — whether a rule's denominator may be derived from the
  subset the tool can handle — and it is **open**.

### What makes it sharp rather than merely known

**The report already discloses that the traversal spine is trusted blind, and then prints exit `0`
on the same page.** Both are true, both are in the same artifact, and nothing tells the reader they
are about the same subtree. The disclosure is in the DISCLOSURES section; the clean bill of health is
in REPORT. A reader who trusts the byte has been told the byte is unreliable, elsewhere, in general
terms.

### The mechanism that catches this, and exactly where it stops

`REF001` catches a vanished resource **when a trace survives**. The difference between the caught
case and the uncaught one is the **block type of the trace**, and nothing else:

| Trace | Survives permission filtering? | Caught by |
| --- | --- | --- |
| Inline `href` in rich text — `wl-outside-grant` | **Yes**, the paragraph is readable | `REF001`, 404 on retrieve → `confirmed` / `unreachable` |
| `child_page` block — `wl-revoke-child` | **No**, the block goes with the permission | nothing |

`CHECK-redtest.ts` TEST 2 and TEST 3 are that pair, executable: same hidden child, same filtering,
`0` versus `1`, and the only difference between the two fixtures is the block type.

**Per #46's Revisit-if this was recorded and taken to the operator before any code changed. The
coverage model is unchanged. That decision belongs to #35 and to an ADR, not to this ticket.**

## 2. The live exit byte table — all five, each by its own fault

ADR-0008 decision 2 assigns five bytes and the ticket's 2026-08-17 correction notes the DoD named
only one branch. Every row below is a separate live read-only scan.

| Configuration | Byte | Disposition | Why |
| --- | --- | --- | --- |
| `FIXTURE_ROOT_ID`, floor 1.0 | **3** | `qualified` | confined gap, coverage below the declared threshold |
| `FIXTURE_ROOT_ID`, floor 0.5 | **1** | `qualified` | coverage clears the floor, findings are new and unsuppressed |
| `REVOKE_PARENT_ID`, floor 1.0 | **0** | `unqualified` | **the false green of §1** |
| `UNSHARED_PAGE_ID`, floor 1.0 | **2** | `disclaimed` | unreachable declared root — pervasiveness condition (a) |
| config naming a non-ID | **4** | none | the scan did not run as declared |

**Exit `2` is reached live by condition (a), not (b).** Pervasiveness condition (b) — an **unbounded**
gap — needs an enumeration to die mid-stream on a 429 or 502, and that cannot be forced against a
read-only connection without mutating the workspace or the grant. **It is offline-only**, via the
`MIDSTREAM` fake, asserted in `CHECK-redtest.ts` TEST 1 and `CHECK-scan-scaffold.ts` TEST 4b.

#46's Revisit-if asked for this to be said rather than for the expectation to be adjusted to match
the output. It is said: **the live fixture cannot seed an unbounded gap, and the exit-`2` row above
tests the other pervasiveness condition.**

## 3. Tests

`npx tsc --noEmit` clean in both packages, TypeScript 7.0.2.

| Suite | Assertions |
| --- | --- |
| `CHECK-verdict.ts` | 38 |
| `CHECK-scan-scaffold.ts` | 56 |
| `CHECK-sys001.ts` | 92 |
| `CHECK-ref001.ts` | 124 |
| `CHECK-report.ts` | 89 |
| `CHECK-redtest.ts` | **50** |
| **total** | **449** (was 399) |

Offline, no network, no token. `prototypes/CHECK-link-recognition.ts`: 23, green.

### Mutation checks

Three live inside `CHECK-redtest.ts`, because the file's subject *is* falsification:

- **TEST 2b** — unhide the child in the fake's listing. The byte moves off `0`, proving TEST 2 keys
  on the filtering rather than on some other property of the fixture.
- **TEST 3b** — remove the surviving href. `REF001` stops catching it and the run exits `0` again,
  which is the finding stated as a mutation.
- **TEST 4** — disable `gapsFrom`. **The byte does not move**, and that is now correct: ADR-0012
  decision 7 gave exit `3` a second, independent route. The disposition (`qualified`→`unqualified`),
  the finding count (`1`→`0`) and the reason string move instead, and the check asserts those.

One source mutation, to show the suite is not vacuous:

- **Drop pervasiveness condition (a)** from `verdict.ts` — `RED`. `EXIT 2a … got=3 want=2` and
  `the disposition is disclaimed: got=qualified want=disclaimed`.

### DoD item 1's wording predates the code it tests

*"Disable the coverage-gap detection. Criterion 7 must go red."* That assumed gaps were the only
route to exit `3`. They are not, since ADR-0012 decision 7. A check written to *the byte must change*
would now assert a property the system deliberately no longer has, and it would go red for the wrong
reason. Recorded rather than silently reinterpreted.

## 4. #10's nine proof checks — what this slice did and did not satisfy

DoD item 4. **Spec §1.3 is non-negotiable: this slice does not close #10.** Its fixture is narrower
than #10 specified — one data source rather than three, no archived target, no seeded `UNQ001`,
`SCH001`, `DEP001` or `CAN001` — and two rules of eight are implemented.

| # | Check | Status |
| --- | --- | --- |
| 1 | Enumerate the complete shared fixture, match a hand-written manifest | **Satisfied.** Oracle, 17 comparisons, committed before the run it judges. |
| 2 | Retrieve full schemas, rows, long relation values, nested blocks | **Partial.** Nested blocks yes, to a bounded depth. Schemas and rows are `REQ001`/`UNQ001` concerns, out of scope per spec §1.2. |
| 3 | Detect every seeded confirmed defect | **Partial.** Two rules of eight. The seeded defects for the other six are not detectable by a slice that does not implement them. |
| 4 | Label the unshared target `indeterminate`, not broken | **Superseded.** Spec §2 criterion 4 requires `confirmed` / `unreachable` — *"this link cannot be resolved"* is a proved fact. #10 predates ADR-0005's certainty/target-state split. |
| 5 | Run `REQ001` against the current Directory and detect a real route gap | **Not satisfied.** No `REQ001`, no Directory. |
| 6 | Emit one readable Markdown report and one stable JSON report | **Satisfied.** #45; two live runs byte-identical at 5987 bytes, with the non-deterministic control differing. |
| 7 | Return exit `2` after a seeded pagination or retrieval failure | **Satisfied for pervasiveness condition (a).** Condition (b), the unbounded gap, is offline-only — see §2. |
| 8 | Complete the scoped Directory scan within two minutes | **Satisfied on this fixture** — 7 requests, 1.7 s. **Not** on the Directory, which this slice never scanned. #7 owns the real budget. |
| 9 | Persist no token and no page-body text | **Satisfied.** Asserted over every rendered line of all three formats; zero fixture aliases or titles in either live artifact. |

**Four satisfied, three partial or superseded, two not satisfied.** A result reported as closing #10
would be a coverage claim over an unrun set, which is the defect class this product exists to detect.

## 5. The fixture was not restored, deliberately

`wl-revoke-child` remains **disconnected**. Restoring it resets proof question Q1 *and* removes the
only live instance of the condition §1 documents. #46 asks for this to be decided rather than done by
accident; it is decided.

## 6. What this leaves open

- **#35 — the decision this finding creates.** Whether a scan that cannot detect permission
  filtering may report `evidence: sufficient` and exit `0`. Live reproduction attached to the issue.
- **#51** — database references remain a permanent coverage gap.
- **ADR-0004 decision 2's Snapshot** — still not built.
- **#8** — the npm name is still the only thing between this branch and `main`.
