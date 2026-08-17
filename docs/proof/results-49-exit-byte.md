# #49 — the exit byte compares the vector minimum. What the run earned.

Recorded 2026-08-17, branch `build/t3-ref001`, against ADR-0012.

## 1. What changed

`deriveVerdict` took a resource-funnel scalar and compared it to the declared coverage threshold.
ADR-0011 decision 5 requires a floor on every rule — the minimum of the coverage vector. It now takes
the vector and compares the minimum. `prototypes/verdict.ts`, a second byte-identical copy of the
same function, is deleted.

## 2. The offline suites

`npx tsc --noEmit` clean on TypeScript 7.0.2, in **both** packages.

| Suite | Assertions | Before |
| --- | --- | --- |
| `slice/CHECK-verdict.ts` | **38** | did not exist |
| `slice/CHECK-scan-scaffold.ts` | **56** | 53 |
| `slice/CHECK-sys001.ts` | 92 | 92 |
| `slice/CHECK-ref001.ts` | **124** | 123 |
| **slice total** | **310** | 268 |
| `prototypes/CHECK-link-recognition.ts` | **23** | 34 |

All green, offline, no network and no token.

**The prototype's eleven assertions were moved, not deleted.** They are `CHECK-verdict.ts` TEST 1,
same inputs and same expected bytes. Four of the five `deriveVerdict` calls exercise behaviour the
other suites already reach through `scan()`; the fifth, `vBaselined`, does not — `scan.ts` hardcodes
`newUnsuppressedFindings` to `findings.length`, so ADR-0008 decision 3's baselined branch was
reachable **only** from the prototype. That was checked before the move rather than assumed, and it
is the reason `CHECK-verdict.ts` exists as a direct-call suite rather than the assertions being
folded into an end-to-end one.

**Three assertions in `CHECK-ref001.ts` TEST 4 were replaced, not deleted.** They read
`byteBasis.vectorMinimum` and `byteBasis.byteWouldDiffer`, fields that no longer exist. Four
assertions replace them.

## 3. Mutation checks

Each was performed by disabling the mechanism and observing the result. A control that stays green
with its mechanism bypassed tested nothing.

| # | Mutation | Result |
| --- | --- | --- |
| 1 | Exit-3 predicate compares `coverage` (the funnel) instead of `coverageMinimum.ratio` — the exact pre-ADR-0012 behaviour | **RED.** `CHECK-ref001.ts`: `spec §6 test 3 — the residue forces exit 3: got=0 want=3`. `CHECK-verdict.ts`: 5 failures including `the byte is 3 anyway — the weakest rule sets it: got=1 want=3` |
| 2a | Empty-vector branch removed (`else if (false)`) | **Caught by `tsc`, not by an assertion** — 5 errors, `TS18047: 'coverageMinimum' is possibly 'null'`. See the note below. |
| 2b | Empty vector exits `0` with `cause = null` instead of `3` / `no_applicable_subject` (type-safe) | **RED.** `the byte is 3, NOT 0: got=0 want=3` and `the cause is machine-readable: got=null want=no_applicable_subject` |
| 3 | `why` built from a bare `evaluated/applicable` instead of `formatRow()` | **RED.** 3 failures — `the exit-3 reason names the unit: got=false want=true` |
| 4 | Re-add the `gaps.length &&` conjunct to the exit-3 predicate — decision 7 reversed | **RED.** 4 failures in `CHECK-verdict.ts`, including `a sub-threshold rule with NO recorded gap cannot reach exit 0: got=false want=true` |
| 5 | Is any second copy of `deriveVerdict` still executing? | **No.** `prototypes/` typechecks clean with no verdict module present, which proves nothing in that package references one. |

**Mutation 2a is recorded as a `tsc` catch, and the distinction matters.** Removing the
empty-vector branch does not turn a check red — the suite **crashes** with a `TypeError` when it
reaches TEST 4, because `coverageMinimum` is `CoverageRow | null` and the later branches dereference
it. The first attempt at this mutation was scored by grepping the output for `FAIL`, found none, and
briefly looked like a control that had failed to fire. It had not: the process died before printing.
`tsc` rejects the same mutation outright with five errors, which is the stronger guarantee — the
branch cannot be removed without the build failing — but it is a **different** guarantee from the one
the mutation protocol asks for, so 2b was written to supply the behavioural one. **Grepping a test
run for `FAIL` cannot distinguish a passing suite from a crashed one.**

## 4. The live run

Read-only, `Notion-Version: 2026-03-11`, against the proof fixture.

```
npx tsx make-fixture-config.ts
npx tsx cli.ts scan --config ../wl.config.json --oracle
```

**Exit byte `3`.** 4 applicable resources, 3 evaluated, 1 internal reference, **7 requests**,
`ORACLE MATCHED` on **17 comparisons**. Wall time 1.7 s and 4.6 s on two consecutive runs; neither is
a validated budget and #7 owns that figure.

The rendered basis line:

```
  exit:             3   (Gaps exist and are confined, and the weakest rule's coverage —
                         SYS001 at 3/4 resources (75.0%) — is below the declared threshold 1.)
  byte basis:       compared 3/4 resources (75.0%) — the weakest rule, SYS001 — against the
                    declared threshold 1   (funnel, not compared: 75.0% of resources)
```

### What this live run does NOT establish, and it is the main thing

**On this fixture the vector minimum and the funnel are the same number.** `SYS001` reads 3/4
resources, `REF001` reads 1/1 internal references, so `SYS001` sets the minimum — and `SYS001`'s
coverage item *is* a resource, so its row equals the funnel. The run would have exited `3` under the
old code too.

**The live fixture therefore does not exercise the defect this change fixes.** It confirms no
regression: the byte, the oracle and the request count are unchanged. It confirms nothing about the
divergence.

The divergence is exercised **offline only**, by `CHECK-ref001.ts` TEST 4, whose fixture puts the
funnel at 2/2 resources and `REF001` at 0/1 references. That check asserted `exit === 0` before this
change — a deliberate tripwire over a known false green — and asserts `3` now. Mutation 1 above
reproduces the old byte on demand.

**To exercise it live, the fixture needs a readable page containing a dead internal link and no
unreadable child**, so that the funnel is complete while `REF001` is not. The current fixture cannot
produce that: `wl-dataset` stalls at `enumerated` on every run, which holds `SYS001` below 1.0
permanently. Restoring `wl-revoke-child` would not help either — it moves `SYS001`, not `REF001`.
Filed as a fixture limitation, not as a code question.

## 4b. The defect the review found, which no test was going to

The first implementation of this change kept ADR-0008 decision 2's exit-`3` row verbatim — *"gaps
exist and are confined, **and** coverage is below the declared threshold"* — and changed only what
`coverage` referred to. Every suite was green and the live run was clean.

**With that conjunct, a run whose weakest rule is below the floor and whose gap list is empty exits
`0`, and the reason string then reads "every rule's coverage is at or above the declared threshold"
beside a coverage row reading `0/1 (0.0%)`.** The report publishes a claim the run refutes two lines
above it. ADR-0011 decision 5 states the axis without the conjunct — *"the evidence axis trips at
exit 3 if **any** rule falls below it"* — and restates the exit-`0` invariant as *"every rule's
coverage at or above the declared threshold."* The conjunct made that invariant false.

It was found by reading the predicate against ADR-0011 before committing, not by a failing check.
The check that would have caught it was one I had just written and had asserted the wrong value in:
`CHECK-verdict.ts`'s `emptyish` control asserted `exit === 0` and passed. **A test written from the
same misreading as the code confirms the misreading.**

Recorded as ADR-0012 decision 7. Mutation 4 above reverses it and goes red.

### It also weakened an existing mutation check, and that is recorded rather than absorbed

`CHECK-scan-scaffold.ts` TEST 5 disabled gap detection and asserted the byte fell `3` → `0`. Its
closing note read: *"A byte that stayed at 3 here would mean the suite measures nothing."* Correct
while gaps were the only route to `3`. There are two now, so the mutation no longer moves the byte.

Measured rather than assumed — the mutation still moves three things:

| | control | gap detection off |
| --- | --- | --- |
| exit | 3 | 3 |
| disposition | `qualified` | `unqualified` |
| gaps, findings | 1, 1 | 0, 0 |
| reason | the gap wording | *"NO gap was recorded for it… manifest and vector disagree"* |

The check now asserts those four rows. **A byte defended by two independent conditions is a stronger
property than a byte that moves, but it is a different property**, and the check was rewritten to
state the one that is now true rather than loosened until it passed.

## 5. Spec corrections carried under the same plan gate

`docs/spec/REF001-link-recognition.md`, edited in place (a spec is, an ADR is not):

- **§4 step 3** read *"URL fails to parse → UNRECOGNISED"* unconditionally, which classifies every
  `#section` anchor as a coverage gap. Now carries the Notion-shaped-ID condition the implementation
  has always applied. The code was right; the document was the defect.
- **§5** said an unrecognised candidate "produces **no finding**" while also saying its coverage gap
  carries a `SYS001` finding. Both are true and the rule name was missing. `REF001` asserts something
  about the target; `SYS001` asserts something about the scan. §7's non-negotiable bullet is scoped
  the same way and now says so.
- **§6** claimed 34 prototype assertions against `prototypes/verdict.ts`. That file is deleted;
  the count is 23 and the exit-byte assertions are in the slice.

## 6. What is still open

- **#51** — every database reference remains a permanent coverage gap. Untouched here.
- **#50**, **#35** — named in ADR-0012's *Not decided here*.
- **#45** — the JSON exporter now has a fourth suppression with a definite shape: `byteBasis` travels
  with the byte, and `coverageMinimum` serialises as a row, never as a bare number.
- **#8** — the npm name is still the only thing between this branch and `main`.
