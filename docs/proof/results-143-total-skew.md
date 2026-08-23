# The reconstructibility control, scored by skewing a real total — #143 AC2

- **Run:** 2026-08-22, offline, on branch `feat/144-inbound-references`.
- **Why this file exists:** #143's second acceptance criterion asks that the mutation "skewing a
  total" take the suite to a **non-zero exit**. A gate assertion that must go red in order to pass
  is a gate that cannot ship, so the literal form is run by hand and its receipt is recorded here
  rather than written into `CHECK-measurements.ts`. The suite carries the bidirectional predicate
  test instead (TEST 6b), which is the same evidence without the contradiction.

## The mutation

One line in `slice/measurement.ts`, inside `inboundReferences`, the only measurement in the v0.1 set
whose rows sum:

```
    total: rows.reduce((sum, x) => sum + (x.numeric ?? 0), 0) + 41, /* SKEW-MUTATION */
```

**Substitution verified before the run was scored**, per the standing rule that an unapplied mutation
is indistinguishable from dead code and both look like a green gate:
`grep -c "SKEW-MUTATION" measurement.ts` → `1`.

## Result

| | |
|---|---|
| `npm run check` exit byte, unmutated | **0** |
| `npm run check` exit byte, skewed | **1** |

Scored on the **exit code**, not on a `grep` for `FAIL`: a crashed suite prints no `FAIL`, and that
false signal fired twice during this session's own work.

The assertions that failed:

```
FAIL  measurement/inbound-references@1: its printed total is reconstructible from its printed rows: got=false want=true
FAIL    the total equals the sum of the printed rows: got=42 want=1
FAIL    and the total collapses with them: got=41 want=0
```

## ⛔ The run found a defect in the control it was scoring, and that is the substantive finding

**On the first attempt the reconstructibility loop did not fail.** Only the two ticket-specific
assertions did.

The loop iterated `measurementsFrom(r.manifest)` where `r` is the `DEAD_LINK` fixture, which reaches
no database. Every measurement in that manifest was therefore either `computed: false` or carried a
null total, so the `m.total === sum` branch **was never taken**. The gate went red through a
different test than the one whose job this is — the wrong file catching this test's defect, which is
the shape this repository already records for `CHECK-measurements` versus `CHECK-sys001`.

The loop was not wrong. Its input could not exercise it. It now runs over a manifest that sums, with
an explicit guard asserting one is present:

```ts
check('the reconstructibility loop has a measurement that actually SUMS, so it is not vacuous',
  reconstructible.some(m => m.computed && m.total !== null), true);
```

**Re-run with the skew still in place**, the loop caught it by name.

⭐ **The generalisation, which is worth more than the receipt:** an isolation control needs an arm
where the thing under test is *present in the form under test*, not merely an arm where the code path
is entered. A recompute loop over measurements that never sum is a recompute loop that has never
recomputed anything.

## Related mutations run in the same session

| mutation | outcome |
|---|---|
| `totalIsReconstructible` returns `true` unconditionally | RED, in `CHECK-measurements` — the correct file |
| database selection widened from kind `data-source` to every classified resource | RED, in `CHECK-measurements` |
| the scope phrase replaced with a bare "unreferenced" | RED in all three emitters |
| a fixture with no references at all | every count and the total collapse to 0 |
