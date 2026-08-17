/* CHECK-verdict — deriveVerdict, called DIRECTLY.
 *
 * WHY THIS SUITE EXISTS AND WHY IT IS NEW. Every other slice suite reaches the
 * verdict through scan(), which fixes two of deriveVerdict's inputs: it always
 * passes `newUnsuppressedFindings: findings.length`, because the slice has no
 * baseline file, and it always passes a vector built by the live rule set. Two
 * branches are therefore unreachable from those suites — the BASELINED gap of
 * ADR-0008 decision 3, and the EMPTY VECTOR of ADR-0011 decision 6.
 *
 * The baselined branch was covered, in prototypes/CHECK-link-recognition.ts,
 * which was the only caller reaching deriveVerdict directly. ADR-0012 decision 1
 * retired that copy of the implementation. Its verdict block — ELEVEN assertions
 * over FIVE deriveVerdict calls — is carried here unchanged in behaviour; TEST 1
 * below is that block, moved. The retirement therefore moved coverage rather
 * than deleting it.
 *
 * Checked before the move rather than assumed: four of the five calls exercise
 * behaviour the other suites already reach end-to-end through scan(), and the
 * fifth, `vBaselined`, does not.
 *
 * The vector is REQUIRED on every call in this file. That is ADR-0012 decision 2
 * doing its job: an optional parameter would have let this suite compile while
 * silently testing the funnel scalar.
 */

import { createHarness } from './CHECK-harness.js';
import { coverageRow, type CoverageRow } from './finding.js';
import { deriveVerdict, type Gap } from './verdict.js';

const { check, head, finish } = createHarness();

/* A vector whose minimum is whatever the caller says. Built through
 * coverageRow() rather than as an object literal so the empty-applicable-set
 * rule of ADR-0011 decision 6 is exercised by the same constructor the rules
 * use, not re-implemented here. */
const vec = (evaluated: number, applicable: number, rule = 'SYS001'): CoverageRow[] => {
  const row = coverageRow(rule, 'resources', evaluated, applicable);
  return row ? [row] : [];
};

const refs = (evaluated: number, applicable: number): CoverageRow[] => {
  const row = coverageRow('REF001', 'internal references', evaluated, applicable);
  return row ? [row] : [];
};

/* =========================================================================
 * TEST 1 — the eleven assertions carried from prototypes/CHECK-link-recognition
 * =========================================================================
 * Moved by ADR-0012 decision 1. Same inputs, same expected bytes. The vector
 * is added because the parameter is now required; it is set to the same 3/4
 * the funnel carries, which is what made these two figures indistinguishable
 * in the prototype and is exactly the condition TEST 2 breaks.
 */

head('TEST 1 — an unrecognised reference lowers coverage and forces exit 3 (carried from the prototype)');

const gaps: Gap[] = [
  { resource: 'https://notes.example.com/x', cause: 'link-host-unrecognised', bounded: true },
];

const v = deriveVerdict({ applicable: 4, evaluated: 3, coverage: vec(3, 4), gaps, violations: 0, coverageThreshold: 1.0 });

check('the unrecognised reference stays in the denominator', v.applicable, 4);
check('coverage ratio', `${v.evaluated}/${v.applicable}`, '3/4');
check('gap is bounded, so the disposition is qualified not disclaimed', v.disposition, 'qualified');
check('exit', v.exit, 3);

const v0 = deriveVerdict({ applicable: 4, evaluated: 4, coverage: vec(4, 4), gaps: [], violations: 0, coverageThreshold: 1.0 });
check('control: with nothing unrecognised the same inputs exit 0', v0.exit, 0);

/* An unrecognised reference cannot reach exit 0 by raising the threshold alone.
 * Its SYS001 gap finding is still new and unsuppressed, and ADR-0008 exit 1
 * fires on that. This corrected an error in spec §5, which had claimed exit 0. */
const vTol = deriveVerdict({ applicable: 4, evaluated: 3, coverage: vec(3, 4), gaps, violations: 0, coverageThreshold: 0.5 });
check('raising the threshold to 0.5 does NOT buy exit 0', vTol.exit, 1);
check('the report is still qualified', vTol.disposition, 'qualified');

/* THE ASSERTION NOTHING ELSE IN THIS REPOSITORY MAKES. scan() hardcodes
 * newUnsuppressedFindings to findings.length, so the baselined branch of
 * ADR-0008 decision 3 is unreachable end-to-end. It was covered only by the
 * prototype suite retired in ADR-0012 decision 1. */
const vBaselined = deriveVerdict({
  applicable: 4, evaluated: 3, coverage: vec(3, 4), gaps, violations: 0,
  coverageThreshold: 0.5, newUnsuppressedFindings: 0,
});
check('exit 0 requires the gap to be BASELINED as well', vBaselined.exit, 0);
check('and the report stays qualified even then', vBaselined.disposition, 'qualified');
console.log('  ^ the only route to exit 0 with an unrecognised link is an explicit');
console.log('    operator decision recorded in the baseline. Not a threshold tweak.');

const vUnbounded = deriveVerdict({
  applicable: 4, evaluated: 3, coverage: vec(3, 4), violations: 0, coverageThreshold: 0.5,
  gaps: [{ resource: 'wl-pagination', cause: 'enumeration abandoned', bounded: false }],
});
check('an UNBOUNDED gap is not tolerable at any threshold', vUnbounded.exit, 2);
check('and renders no summary verdict', vUnbounded.disposition, 'disclaimed');

/* =========================================================================
 * TEST 2 — the byte compares the VECTOR MINIMUM, not the funnel
 * =========================================================================
 * ADR-0012 decision 2, closing #49. This is the case that was undetectable
 * while one rule existed: the funnel clears the threshold and a rule does not.
 */

head('TEST 2 — a rule below the floor is not masked by a funnel above it');

const masked = deriveVerdict({
  /* The funnel is PERFECT — every resource was read. */
  applicable: 2, evaluated: 2,
  /* REF001 judged none of its one reference. */
  coverage: refs(0, 1),
  gaps: [{ resource: 'https://notes.example.com/x', cause: 'link-host-unrecognised', bounded: true }],
  violations: 0,
  coverageThreshold: 1.0,
});

check('the funnel is at 1.0 and would have cleared the threshold alone', masked.coverage, 1);
check('the byte is 3 anyway — the weakest rule sets it', masked.exit, 3);
check('  and the verdict says which rule and which unit', masked.coverageMinimum!.rule, 'REF001');
check('  carrying its unit, so the figure cannot be read as resources', masked.coverageMinimum!.unit, 'internal references');
check('  the compared ratio is the rule\'s, not the funnel\'s', masked.coverageMinimum!.ratio, 0);

/* THE MUTATION. Feeding the funnel figure in as the vector is precisely the
 * pre-ADR-0012 behaviour. If this check ever goes green at 3, the byte has
 * stopped depending on the vector and TEST 2 above is testing nothing. */
const mutated = deriveVerdict({
  applicable: 2, evaluated: 2,
  coverage: vec(2, 2),
  gaps: [{ resource: 'https://notes.example.com/x', cause: 'link-host-unrecognised', bounded: true }],
  violations: 0,
  coverageThreshold: 1.0,
});
check('MUTATION — with the funnel substituted for the vector the byte falls to 1', mutated.exit, 1);
check('  the mutation moved the byte, so the vector is load-bearing', masked.exit !== mutated.exit, true);

/* =========================================================================
 * TEST 3 — the reason string names its unit at the source
 * ========================================================================= */

head('TEST 3 — no bare ratio in `why`');

check('the exit-3 reason names the unit', masked.why.includes('internal references'), true);
check('  and names the rule that set the minimum', masked.why.includes('REF001'), true);
check('the exit-0 reason also names its unit', v0.why.includes('resources'), true);

/* The render-layer workaround this replaces appended "[figures in this reason
 * are resources]" to every byte line. On THIS run that sentence would have been
 * false: the figures are internal references. */
check('and the figures are NOT resources on this run', masked.why.includes('resources'), false);

/* MUTATION — a row whose unit is dropped cannot reach `why`, because CoverageUnit
 * is a closed union and formatRow always interpolates it. The check that the
 * unit is load-bearing is therefore the one above: swap refs() for vec() and the
 * assertion for 'internal references' goes red. */
check('MUTATION — the same run rendered from a resources row loses the reference unit',
  mutated.why.includes('internal references'), false);

/* =========================================================================
 * TEST 4 — an empty vector cannot exit 0
 * =========================================================================
 * ADR-0011 decision 6 named this case and no code path reached it in T2,
 * because exit 4 covered the only route to an empty vector there.
 */

head('TEST 4 — every rule with an empty applicable set means the scan judged nothing');

const empty = deriveVerdict({
  applicable: 0, evaluated: 0,
  coverage: [],
  gaps: [], violations: 0, coverageThreshold: 1.0,
});

check('the vector is empty, so there is no coverage figure', empty.coverageMinimum, null);
check('the byte is 3, NOT 0 — nothing was judged', empty.exit, 3);
check('  and the cause is machine-readable, not prose only', empty.cause, 'no_applicable_subject');
check('  the reason says the scan judged nothing', empty.why.includes('judged nothing'), true);

/* WITHOUT decision 3's branch this run has no gaps and no findings and falls
 * straight through to 0 — a clean bill of health over a scan that read nothing.
 *
 * The CONTROL is a vector with ONE row carrying the same zero counts. It reaches
 * exit 3 too, by a different route and with a different reason, which is what
 * shows the empty-vector branch keys on EMPTINESS and not merely on the zeros. */
const emptyish = deriveVerdict({
  applicable: 0, evaluated: 0,
  coverage: vec(0, 1),
  gaps: [], violations: 0, coverageThreshold: 1.0,
});
check('CONTROL — one row at 0/1 also exits 3, because it is below the floor', emptyish.exit, 3);
check('  but NOT via no_applicable_subject — it had a subject', emptyish.cause, null);
check('  it has a coverage figure where the empty vector has none', emptyish.coverageMinimum!.ratio, 0);
check('  and its reason is the sub-threshold one, not the judged-nothing one',
  emptyish.why.includes('below the declared threshold'), true);
check('  while the empty vector says it judged nothing', empty.why.includes('judged nothing'), true);
console.log('  ^ 0/1 means a rule had a subject and judged none of it. An empty vector');
console.log('    means no rule had a subject at all. Same byte, distinct causes and');
console.log('    distinct remedies — ADR-0011 decision 6 and the deletion test.');

/* THE HOLE ADR-0012 DECISION 7 CLOSED, pinned so it cannot reopen quietly.
 * With the old `gaps.length &&` conjunct this exact call exited 0 and its reason
 * asserted "every rule's coverage is at or above the declared threshold" beside
 * a row reading 0.0%. The report would have published a claim the run refuted
 * two lines above it. */
check('a sub-threshold rule with NO recorded gap cannot reach exit 0', emptyish.exit !== 0, true);
check('  and the reason names the missing gap rather than inventing one',
  emptyish.why.includes('NO gap was recorded for it'), true);

/* =========================================================================
 * TEST 5 — precedence is unchanged by any of the above
 * =========================================================================
 * ADR-0008 decision 2's total order, 4 > 2 > 3 > 1 > 0. ADR-0012 changes what
 * the exit-3 row COMPARES and adds one route to 3. It must change nothing else.
 */

head('TEST 5 — ADR-0008 decision 2 precedence survives');

const four = deriveVerdict({
  applicable: 0, evaluated: 0, coverage: [], gaps: [], violations: 0,
  didNotRunAsDeclared: true, coverageThreshold: 1.0,
});
check('4 outranks the empty-vector 3', four.exit, 4);
check('  and the empty-vector cause is not claimed on a run that did not happen', four.cause, null);

const two = deriveVerdict({
  applicable: 4, evaluated: 0, coverage: [], violations: 0, coverageThreshold: 1.0,
  gaps: [{ resource: 'root', cause: 'unreachable declared root', bounded: true, isRootMiss: true }],
});
check('2 outranks the empty-vector 3', two.exit, 2);

const threeOverOne = deriveVerdict({
  applicable: 4, evaluated: 3, coverage: vec(3, 4), violations: 2, coverageThreshold: 1.0,
  gaps: [{ resource: 'wl-x', cause: 'not fetched', bounded: true }],
});
check('3 outranks 1 — evidence outranks findings', threeOverOne.exit, 3);

finish('The byte compares the weakest rule. The funnel is recorded beside it and is not the comparison.');
