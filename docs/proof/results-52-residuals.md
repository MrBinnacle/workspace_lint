# #52 — the residual register and enumeration attestation

**Evidence class: observed.** Real responses from the real API, read-only connection,
`Notion-Version: 2026-03-11`. Recorded 2026-08-17 on branch `build/t3-ref001`.

Implements ADR-0013 decisions 2, 5 and 6. The ADR decided; this is what the code did.

## 1. The headline — the byte and its own limitation now print on one line

Live, `REVOKE_PARENT_ID`, the page whose child the connection cannot see:

```
npx tsx make-fixture-config.ts REVOKE_PARENT_ID
npx tsx cli.ts scan --config ../wl.config.json

──────── RESIDUALS ────────
  enumeration_unattested  3bf1351d-6af4-8108-8ff3-c2d170a06142
      GET /v1/blocks/{id}/children carries no completeness signal, so a filtered listing and a complete one are identical.
      NOT a gap and NOT counted in any ratio — this is a doubt about the frame, and its size is not estimable.
      remedy: verify out of band, with a full-access identity, that the declared tree is the tree the scan saw

──────── REPORT ────────
  disposition:      unqualified
  coverage vector:
    SYS001   1/1 resources (100.0%)
  headline:         1/1 resources (100.0%) — the MINIMUM of the vector, set by SYS001
  outcome SYS001:   conformity conforms · evidence sufficient · attestation unattested
  exit:             0   (No new unsuppressed finding, and every rule's coverage is at or above the declared threshold …)
  byte basis:       compared 1/1 resources (100.0%) … against the declared threshold 1   (funnel, not compared: 100.0%)   · 1 residual(s): the enumerations behind this figure could not be verified complete
```

**The exit byte is still `0`, and that is the intended result.** ADR-0013's Consequences state it
without hedging: the ADR discloses the false green, it does not close it. `SYS001` still reads
`1/1 resources (100.0%)`. The hidden child is still invisible.

**What changed is that the two facts are now one line apart instead of two sections apart.** Before
this commit the blind-spine disclosure lived in `DISCLOSURES` and the clean byte lived in `REPORT`,
both true, with nothing connecting them — the S017 finding exactly. A reader who reads only the
verdict line now learns that the enumeration behind the figure was unverifiable.

## 2. The publication constraint holds on the same line

`outcome SYS001: conformity conforms · evidence sufficient · attestation unattested`

ADR-0013 decision 5. `evidence: sufficient` keeps its exact ADR-0005 meaning — every applicable
coverage item was fetched and judged — and it is true. `attestation unattested` says the applicable
set itself was built from a listing the API cannot vouch for. **Both words are true and the report no
longer lets a reader have the first without the second.**

Note the REF001 row on the same run:
`conformity ABSENT … · evidence ABSENT … · attestation unattested`. The attestation prints even where
both other axes are absent, because it is a fact about the run's enumerations rather than about the
rule's subject.

## 3. The full fixture is unchanged, and the oracle still matches

```
npx tsx make-fixture-config.ts FIXTURE_ROOT_ID
npx tsx cli.ts scan --config ../wl.config.json --oracle

  enumeration_unattested  3bf1351d-6af4-8057-8496-ee302a3bee7c
  enumeration_unattested  3bf1351d-6af4-8108-8ff3-c2d170a06142
  enumeration_unattested  3bf1351d-6af4-81ee-990b-f7c5fef57e44
  outcome REF001:   conformity violates · evidence sufficient · attestation unattested
  outcome SYS001:   conformity violates · evidence unreached · attestation unattested
  exit:             3   (Gaps exist and are confined, and the weakest rule's coverage — SYS001 at 3/4 resources (75.0%) — is below the declared threshold 1.)
  byte basis:       compared 3/4 resources (75.0%) … · 3 residual(s) …
  ORACLE MATCHED
```

**Exit `3`, 4 applicable, 3 evaluated — every figure identical to S016's record.** The register added
no number to any denominator, which is ADR-0013 decision 3 observed rather than asserted.

**Three residuals, not four.** The root and the two child pages each carry an enumeration record.
The data source spends no request — it is marked `enumerated`
carrying a drop-out cause — so it has no enumeration record and produces **no** residual. It is a
**gap** and only a gap.

**The rule is "no call, no residual". It is NOT "never both"** — see §6 for the version of this
sentence that was wrong, and TEST 7 for the case that falsifies it.

**The three IDs share the prefix `3bf1351d-6af4-8`.** This is why the register prints the full
hyphenated ID and matches on the full ID or the suffix. An 8-character prefix rendering made three
distinct resources read as one on the first live run (#42).

## 4. Determinism survives the new output

Two live runs, `--deterministic --json`:

```
BYTE-IDENTICAL (3554 bytes)
```

Acceptance criterion 5 holds. The register is sorted by resource in `residualsFrom` — insertion order
is call order, which is a property of the traversal and the network rather than of the workspace
(SARIF Appendix F.3) — and no residual field carries a timestamp, a duration or a request count.

The JSON exporter carries all three obligations:

```json
"exit": { "basis": { "compared": {…}, "declaredThreshold": 1, "funnelNotCompared": 1, "residuals": 1 } }
"residuals": [ { "cause": "enumeration_unattested", "endpoint": "GET /v1/blocks/{id}/children",
                 "remedy": "verify out of band, …", "resource": "3bf1351d-6af4-8108-8ff3-c2d170a06142" } ]
"outcomes": [ { "attestation": "unattested", "conformity": null, "evidence": null, "rule": "REF001" },
              { "attestation": "unattested", "conformity": "conforms", "evidence": "sufficient", "rule": "SYS001" } ]
```

The count is on `exit.basis`, not beside it. An exporter that serialised the residual list without the
basis count would reproduce the defect this ticket exists to fix.

## 5. Nine mutation checks, each scored on the EXIT CODE

Each disables the mechanism in the **source**, runs `CHECK-residuals.ts`, and records the process exit
status. Scoring on exit code rather than on grepping output for `FAIL` is deliberate: a mutation that
crashes the suite prints no `FAIL`, and a grep then reads a crash as a pass. That misread happened in
S017.

| # | Mutation | Result |
| --- | --- | --- |
| M1 | `attestationOf` always returns `attested` | **exit 1 — red** |
| M2 | `residualsFrom` returns `[]` | **exit 1 — red** |
| M3 | the root's `enumeration` record is not written | **exit 1 — red** |
| M4 | the residual count is removed from the terminal byte-basis line | **exit 1 — red** |
| M5 | `attestation` is removed from the terminal outcome line | **exit 1 — red** |
| M6 | the Markdown outcomes table drops its Attestation column | **exit 1 — red** |
| M7 | `residualsFrom` drops its `attestation === 'attested'` filter | **exit 0 — GREEN. The control did not fire.** |
| M8 | `residualClause` collapses to one template for every count | **exit 1 — red** |
| M9 | `NO_ENUMERATION` reverts to the "was performed" wording | **exit 1 — red** |

Restored source: **exit 0**.

### M7 is the finding of this section

**Deleting the filter that decides whether an enumeration produces a residual at all left the entire
suite green.** Every enumeration this slice performs is `GET /v1/blocks/{id}/children`, and that
endpoint is unattested, so the `attested` branch is unreachable from any fixture. The filter was doing
nothing a test could observe, and `attestationOf(SEARCH)` returning `attested` bought nothing
verifiable — a classification with no consequence is a comment with a type.

Fixed by **TEST 8**, which builds a `Manifest` by hand — three entries, one attested, one unattested,
one with no enumeration record — and asserts each. No fixture could reach it: the port has three GETs
and none carries a completeness signal, so the alternative was a fake endpoint invented purely to be
attested, which would have tested the fake. The two exclusions are asserted separately and on purpose,
because they have different reasons and a `residualsFrom` that dropped either would still pass the
other.

**M7 re-run after TEST 8: exit 1 — red.** All seven mutations now fire.

Two further mutations live inside the suite as permanent tests. TEST 2b appends residuals to the gap
set through the injected `deriveGaps` seam — the flattering-direction defect, executed — and asserts
the run changes. TEST 4b zeroes the basis count and asserts the register alone no longer carries the
connection.

## 6. Suite

`tsc --noEmit` clean on TypeScript 7.0.2. **525 offline assertions across seven suites**
(38 + 56 + 92 + 124 + 89 + 50 + **76**), no network, no token.

**A comment that overstated its own invariant, caught by re-reading the change against it.** The
`Enumeration` header first said a gap and a residual "must not double-count one resource." The true
rule is narrower — **no call, no residual** — and the stronger reading is wrong: a PARTIAL enumeration
is legitimately both. The scan knows it stopped, which is an unbounded gap, and it cannot verify that
what it did receive was unfiltered, which is a residual. Two facts, one resource. Suppressing either
to keep them exclusive would delete information. This is the S016 shape repeating — a stated invariant
guarding the case its author was thinking about — and it was untested, so TEST 7 now pins it: the
`MIDSTREAM` fixture produces one gap and one residual over the same root, exit `2` and `disclaimed`
from the **gap alone**. It also pins that a disclaimed report still publishes the register, because
the register is evidence about the evidence, not a summary verdict.

**One instrument defect found and fixed while doing this.** `slice/tsconfig.json` lists its files
explicitly, so `CHECK-residuals.ts` was **silently untypechecked** until it was added to `include` —
`tsc --noEmit` exited 0 over a file full of references to types that did not exist. Any new file has
this property until someone remembers the list. Filed as a follow-up rather than fixed here, because
switching to a glob changes what the whole project typechecks.

## 6.5 Review found four defects, and two of them were the report making false claims

`/code-review high` ran against the working tree before commit. Every finding below was reproduced
against a repo fixture before it was accepted.

**1. The residual count was documented as a count of CALLS. It is a count of RESOURCES.**
`listAllChildren` paginates and `readBlockTree` descends, so one resource can cost many
block-children calls while writing one enumeration record. Measured:

| Fixture | block-children calls | residuals |
| --- | ---: | ---: |
| `THREE_CHILDREN` | 3 | 3 |
| `MIDSTREAM` | **3** | **2** |
| `ROOT_ENUM_FAILS` | 1 | 0 |

The published **value** is right — ADR-0013 decision 6's granularity row specifies per-resource — and
the **justification** was wrong, in `report.ts`, in `CHECK-residuals.ts` ("one per enumeration CALL"),
and in §3 of this file. A test true by accident of its fixture states the wrong invariant while
green; `THREE_CHILDREN` happens to fit every listing in one page. TEST 7 now asserts the
`MIDSTREAM` pair directly, which is the case that separates the two readings.

**2. The report denied a call its own log recorded.** `attestationBehind` returns null whenever no
enumeration RECORD exists, and a root whose children call 404s writes none — the call was made and
returned nothing to doubt. The sentence printed for that state was *"no enumeration was performed"*,
four sections above `404 object_not_found GET /v1/blocks/root/children`. **The report contradicting
its own evidence is this product's defect class in this product's output.** Reworded to *"no
enumeration produced a listing"*, which is true of both cases. TEST 7b pins it in both directions.

**3. `0 residual(s)` reused the plural template and said the opposite of the truth.** On the same run
the basis line read `0 residual(s): the enumerations behind this figure could not be verified
complete` — which a reader parses as "nothing here is unverifiable" over a `0/1 resources (0.0%)`
figure resting on no listing at all. Zero means two different things, so `residualClause()` now
branches on why it is zero and is shared by both renderers so they cannot drift.

**4. The document aliased the scan's own array.** `residuals: r.residuals` handed out a live
reference where every sibling field copies (`[...r.gaps].map(…)`). A renderer that sorted in place
would have mutated the `ScanResult`. Now `[...r.residuals]`.

Also fixed: an unused `RESIDUAL_CAUSE` import in `report.ts`, which nothing catches because
`tsconfig.json` sets no `noUnusedLocals`.

**Two further mutations were added for the fixes** — M8 collapses `residualClause` to one template,
M9 restores the false "was performed" wording. Both red. **All nine mutations fire.**

## 7. What this does NOT establish

- **The mechanism is unchanged.** No coverage figure moved, no byte moved, and the hidden child is
  still absent from the manifest. `CHECK-residuals.ts` TEST 6 asserts that absence so a future change
  cannot quietly claim the register detected it.
- **Attestation is run-level, not per-rule.** ADR-0013 decision 5 asks for the attestation of the
  enumerations that built *that rule's* applicable set. In this slice every rule's set descends from
  the same block-children traversal, so the two are the same value. `attestationBehind()` in
  `report.ts` carries the limit in its header and is the single site that must change when a rule's
  coverage item is built from a different endpoint.
- **The `attested` branch is never exercised live, and was not exercised at all until M7 exposed it.**
  No run calls `POST /v1/search` — that is #24, and it is open. `attestationOf(SEARCH)` is asserted in
  TEST 1 and the branch it feeds is asserted in TEST 8, both offline, the latter against a
  hand-built manifest rather than a scan.
- **`REAL_ROOT_ID` is still unexercised**, so no residual count on an organic workspace exists. ADR-0013's
  fourth Revisit-if turns on exactly that number: the fixture has one declared root and a real
  workspace has many. Whether the register reads as boilerplate at organic scale is undecided.
