/* CHECK-measurements — ADR-0017's decisions, executable. Ticket #142.
 *
 * The Measurement class ships with four controls, and each one exists because
 * the corresponding claim would otherwise be a sentence in an ADR that no run
 * can falsify:
 *
 *   TEST 1  the class is separate, and separate at the TYPE level
 *   TEST 2  EXIT-BYTE ISOLATION — no channel at any level (decision 4)
 *   TEST 3  NON-EMPTY — the section can never be silently empty (decision 5)
 *   TEST 4  DETERMINISM — this section is not the reason two runs differ
 *   TEST 5  REDACTION — no title reaches the report through a measurement
 *   TEST 6  RECONSTRUCTIBILITY — a printed total is a function of printed rows
 *
 * WHY TEST 2 NEEDS THE INJECTED SEAM. Asserting "the byte did not move" against
 * one fixture proves nothing: the byte would not have moved anyway. The seam
 * lets the check REPLACE the derivation with one returning wildly different
 * rows and assert the byte is identical — a difference that could only show up
 * if a channel existed. A control that passes with its mechanism disabled tested
 * nothing, and this is the inverse: a control that passes with the mechanism
 * driven hard.
 */

import { createHarness } from './CHECK-harness.js';
import { scan } from './scan.js';
import { buildReportDocument, renderJson, renderMarkdown, renderReport } from './report.js';
import { measurementsFrom, MEASUREMENT_IDS, type Measurement } from './measurement.js';
import { LINK_NOT_CAPTURED } from './finding.js';
import { ROOT, cfg, clock, fakePort, DEAD_LINK, TITLED_URL, TITLE_IN_URL } from './CHECK-fakes.js';

const { check, head, finish } = createHarness();

/* An absolute instant, as the API returns it. Deliberately old, because the
 * measurement exists to surface what has gone quiet — and deliberately a fixed
 * string rather than a computed one, since a fixture derived from the clock
 * would make this suite's own determinism test meaningless. */
const EDITED = '2026-02-19T08:14:00.000Z';

/* The root retrieve carries a timestamp AND a title-bearing url. One fixture
 * serves the computed path and the redaction control, so the redaction
 * assertion runs over a report that actually has a measurement in it. */
const TIMED = { ...DEAD_LINK, [ROOT]: { ...DEAD_LINK[ROOT]!, url: TITLED_URL(ROOT), lastEditedTime: EDITED } };

/* The same fixture with the timestamp omitted — a response that carried none.
 * Omitted, not empty: the fake models a RESPONSE, and a response either carries
 * the key or does not. */
const UNTIMED = { ...DEAD_LINK, [ROOT]: { ...DEAD_LINK[ROOT]!, url: TITLED_URL(ROOT) } };

/* =========================================================================
 * TEST 1 — a measurement is its own class, and the type enforces it
 * ========================================================================= */

head('TEST 1 — measurements are a separate field, not findings and not gaps');

const r = await scan({ config: cfg(ROOT, 1.0), port: fakePort(TIMED), now: clock() });

check('the scan result carries a measurements field', Array.isArray(r.measurements), true);
check('  the v0.1 set has one measurement', r.measurements.length, 1);
check('  and it carries a STABLE key, so it can be promoted to a rule condition later',
  r.measurements[0]!.id, MEASUREMENT_IDS.lastEdited);
check('  the key is versioned, so a later change is visible rather than silent',
  /@\d+$/.test(r.measurements[0]!.id), true);
check('  and it names its unit, per ADR-0017 rule 1', r.measurements[0]!.unit.length > 0, true);

/* The separation is what stops a count being read as a defect claim. */
check('no measurement leaked into findings', r.findings.length, r.findings.filter(f => f.rule !== undefined).length);
check('  no measurement is a gap', r.gaps.some(g => g.resource === MEASUREMENT_IDS.lastEdited), false);
check('  and none is a residual', r.residuals.some(x => x.resource === MEASUREMENT_IDS.lastEdited), false);

/* ADR-0017 rule 6: sorting is allowed, ranking is not. The label must name the
 * sort key, and must not carry judgement vocabulary. */
const label = r.measurements[0]!.label;
check('the label names its sort key, so the reader draws the conclusion', /sorted by/i.test(label), true);
check('  and carries NO judgement vocabulary — rule 6', /worst|bloated|unhealthy|at risk|neglected|too many/i.test(label), false);
check('  no score, grade or index appears in the label — rule 7', /score|grade|index|rating|\/100/i.test(label), false);

/* =========================================================================
 * TEST 2 — EXIT-BYTE ISOLATION. ADR-0017 decision 4, both halves.
 * ========================================================================= */

head('TEST 2 — a measurement reaches the exit byte through NO channel at any level');

/* THE MECHANISM DRIVEN HARD, not merely present. Same fixture, same everything,
 * except a derivation returning a measurement with absurd rows. If any channel
 * existed — a coverage row, a ratio, a gap, a violation — this would move the
 * byte. Asserting against the real derivation would prove nothing, because the
 * real one produces a modest answer that would not move the byte either. */
const LOUD: (m: unknown) => Measurement[] = () => [{
  id: 'measurement/absurd@1',
  label: 'A deliberately extreme measurement (sorted by nothing)',
  unit: 'widgets',
  computed: true,
  rows: Array.from({ length: 500 }, (_, i) => ({ resource: `res-${i}`, value: String(i), numeric: i, link: null })),
  over: 'a set invented by this check',
  total: 124750,
}];

const rLoud = await scan({ config: cfg(ROOT, 1.0), port: fakePort(TIMED), now: clock(), deriveMeasurements: LOUD });

check('the mutation actually substituted — the loud derivation ran', rLoud.measurements[0]!.id, 'measurement/absurd@1');
check('  and it is genuinely extreme, so the assertions below are not vacuous', rLoud.measurements[0]!.computed && rLoud.measurements[0]!.rows.length, 500);

check('the exit BYTE is identical', rLoud.verdict.exit, r.verdict.exit);
check('  the disposition is identical', rLoud.verdict.disposition, r.verdict.disposition);
check('  the coverage VECTOR is identical', JSON.stringify(rLoud.coverage), JSON.stringify(r.coverage));
check('  the byte basis is identical', JSON.stringify(rLoud.byteBasis), JSON.stringify(r.byteBasis));
check('  the funnel is identical', `${rLoud.verdict.evaluated}/${rLoud.verdict.applicable}`, `${r.verdict.evaluated}/${r.verdict.applicable}`);
check('  the gap set is identical', rLoud.gaps.length, r.gaps.length);
check('  and the finding set is identical', rLoud.findings.length, r.findings.length);

/* ⛔ THE COMPARISON ABOVE IS NOT SUFFICIENT ON ITS OWN, AND THIS IS RECORDED
 * BECAUSE THE FIRST DRAFT STOPPED THERE. Both runs above HAVE measurements, so
 * they can only detect a channel keyed on measurement CONTENT. A channel keyed
 * on mere PRESENCE — `measurements.length > 0` reaching an input — moves both
 * runs by the same amount and is invisible to every assertion above.
 *
 * Verified, not reasoned: a live mutation subtracting 1 from `evaluated` when
 * any measurement exists took the gate to exit 1 through CHECK-sys001 and NOT
 * through this suite, which is the wrong file catching this file's defect. The
 * third arm closes it — measurements PRESENT versus measurements ABSENT. */
const rEmpty = await scan({ config: cfg(ROOT, 1.0), port: fakePort(TIMED), now: clock(), deriveMeasurements: () => [] });

check('the presence arm actually differs — one run has measurements, the other has none',
  `${r.measurements.length > 0}|${rEmpty.measurements.length === 0}`, 'true|true');
check('the byte is identical whether measurements EXIST or not', rEmpty.verdict.exit, r.verdict.exit);
check('  the funnel is identical either way', `${rEmpty.verdict.evaluated}/${rEmpty.verdict.applicable}`, `${r.verdict.evaluated}/${r.verdict.applicable}`);
check('  the coverage vector is identical either way', JSON.stringify(rEmpty.coverage), JSON.stringify(r.coverage));
check('  and the byte basis is identical either way', JSON.stringify(rEmpty.byteBasis), JSON.stringify(r.byteBasis));

/* THE SECOND HALF, WHICH IS THE OPERATIVE ONE. A report class owning a rule ID
 * reaches the byte through that rule's coverage row whether or not it emits a
 * finding — ADR-0011 decision 2 plus ADR-0012 decision 2. A measurement owns no
 * rule ID, so that route does not exist for it. This is the stated contrast with
 * issue #101, whose tier is a tier OF A RULE and does have the channel. */
check('NO coverage row was created for a measurement — it owns no rule ID',
  r.coverage.some(c => c.rule.startsWith('measurement')), false);
check('  and none appears in the outcomes map either', Object.keys(r.outcomes).some(k => k.startsWith('measurement')), false);
console.log('  ^ decision 4\'s operative half: no rule ID means no rule-level channel.');
console.log('    #101 is frozen and is NOT decided by this — its tier is a tier of a rule.');

/* =========================================================================
 * TEST 3 — NON-EMPTY. ADR-0017 decision 5.
 * ========================================================================= */

head('TEST 3 — a measurement that could not be computed says so, and says why');

const rUntimed = await scan({ config: cfg(ROOT, 1.0), port: fakePort(UNTIMED), now: clock() });
const untimed = rUntimed.measurements[0]!;

check('the measurement is still PRESENT when it could not be computed', rUntimed.measurements.length, 1);
check('  and it is marked not computed', untimed.computed, false);
check('  carrying a named cause', !untimed.computed && untimed.cause.length > 0, true);
check('  which names the endpoint boundary rather than shrugging',
  !untimed.computed && /GET \/v1\/pages/.test(untimed.cause), true);

const untimedTerm = renderReport(rUntimed, {}).join('\n');
/* GUARD THE SUBJECT FIRST. An assertion over a blank report passes while proving
 * nothing — `''.includes(x)` is false for every x. */
check('the report is non-empty, so the assertions below mean something', untimedTerm.length > 0, true);
check('the MEASUREMENTS section renders even with nothing computed', /MEASUREMENTS/.test(untimedTerm), true);
check('  and prints the not-computed line', /not computed —/.test(untimedTerm), true);
check('  the cause is printed, not swallowed', untimedTerm.includes(!untimed.computed ? untimed.cause : 'NEVER'), true);
console.log('  ^ Baca et al. (10.1002/spe.2109): a tool at Ericsson was abandoned after an');
console.log('    expired licence silently stopped it analysing. A quiet report and an absent');
console.log('    report look identical, so this section may never be silently empty.');

head('TEST 3b — MUTATION: an empty measurement list must NOT render as a clean section');

/* The failure this control exists for is a section that renders and says
 * nothing. Drive the derivation to return no measurements at all and confirm the
 * section does not quietly look like a pass. */
const rNone = await scan({ config: cfg(ROOT, 1.0), port: fakePort(TIMED), now: clock(), deriveMeasurements: () => [] });
check('the mutation actually substituted — no measurements were derived', rNone.measurements.length, 0);
const noneTerm = renderReport(rNone, {}).join('\n');
check('  the heading still renders rather than vanishing', /MEASUREMENTS/.test(noneTerm), true);
check('  and the standing disclaimer still states what this section is',
  /counted facts, not defect claims/.test(noneTerm), true);
console.log('  ^ the section cannot disappear. An absent section is the one shape a reader');
console.log('    cannot distinguish from "nothing to report".');

/* =========================================================================
 * TEST 4 — DETERMINISM. ADR-0004, acceptance criterion 5.
 * ========================================================================= */

head('TEST 4 — two deterministic renders with measurements present are byte-identical');

const rA = await scan({ config: cfg(ROOT, 1.0), port: fakePort(TIMED), now: clock() });
const rB = await scan({ config: cfg(ROOT, 1.0), port: fakePort(TIMED), now: clock() });

const jsonA = renderJson(buildReportDocument(rA, { deterministic: true }));
const jsonB = renderJson(buildReportDocument(rB, { deterministic: true }));

check('the measurement is actually present, so this is not a vacuous pass',
  /measurement\/last-edited@1/.test(jsonA), true);
check('two deterministic renders are byte-identical', jsonA === jsonB, true);
check('  and they are the same LENGTH, so the comparison is not on empty strings', jsonA.length === jsonB.length && jsonA.length > 0, true);

/* THE ABSOLUTE INSTANT TRAVELS; AN AGE DOES NOT. An age is a function of the
 * clock, so a section that derived one would be the reason two identical runs
 * differ — which is exactly what ADR-0004's normaliser exists to prevent. */
check('the absolute timestamp is what is published', jsonA.includes(EDITED), true);
check('  and no relative age is rendered anywhere in the report',
  /\b\d+ days? ago\b/.test(renderReport(rA, {}).join('\n')), false);

/* =========================================================================
 * TEST 5 — REDACTION. No title reaches the report through this section.
 * ========================================================================= */

head('TEST 5 — a measurement names its resource by ID, never by title');

const term = renderReport(r, {}).join('\n');
const doc = buildReportDocument(r, {});
const mdOut = renderMarkdown(doc);
const jsonOut = renderJson(doc);

check('the terminal report is non-empty', term.length > 0, true);
check('  the Markdown report is non-empty', mdOut.length > 0, true);
check('  the JSON report is non-empty', jsonOut.length > 0, true);
check('  and the title under test is itself non-empty', TITLE_IN_URL.length > 0, true);

/* THE FIXTURE'S URL CARRIES A TITLE IN ITS PATH — the shape Notion actually
 * serves. A fixture whose url carried no title could not tell a working
 * redactor from a missing one. */
check('the fixture url really does carry a title', TITLED_URL(ROOT).includes(TITLE_IN_URL), true);

check('the title appears NOWHERE in the terminal report', term.includes(TITLE_IN_URL), false);
check('  nowhere in the Markdown report', mdOut.includes(TITLE_IN_URL), false);
check('  and nowhere in the JSON artifact', jsonOut.includes(TITLE_IN_URL), false);

/* And specifically not through a measurement row, which is the new door. */
const measured = r.measurements[0]!;
check('no measurement row carries the title', measured.computed && measured.rows.every(x => !x.resource.includes(TITLE_IN_URL)), true);
check('  and no measurement link carries it either — links are redacted at entry',
  measured.computed && measured.rows.every(x => (x.link ?? '').includes(TITLE_IN_URL) === false), true);

/* =========================================================================
 * TEST 6 — RECONSTRUCTIBILITY. ADR-0017 decision 3, the gate test.
 * ========================================================================= */

head('TEST 6 — a printed total is a function of the rows printed beside it');

/* THE STRONGEST FORM OF THIS TEST IS THAT THE TOTAL CANNOT BE SUPPLIED. There is
 * no code path through which a caller hands `measurementsFrom` a total, so the
 * printed figure and the printed rows cannot disagree. This asserts the printing
 * rather than the arithmetic, because the arithmetic is true by construction. */
for (const m of measurementsFrom(r.manifest)) {
  if (!m.computed) continue;
  if (m.total === null) {
    check(`${m.id}: no total is printed, because these rows do not sum`,
      m.rows.every(x => x.numeric === null), true);
    continue;
  }
  const recomputed = m.rows.reduce((sum, x) => sum + (x.numeric ?? 0), 0);
  check(`${m.id}: the printed total equals the sum of the printed rows`, m.total, recomputed);
}

/* The timestamp measurement has no total, and that is the correct answer rather
 * than a missing feature: ADR-0017 rule 3 forbids a number combining two units,
 * and a column of instants has no sum that means anything. Printing `0` would be
 * a number the run never computed. */
check('the timestamp measurement prints NO total', measured.computed && measured.total, null);
check('  because its rows are non-numeric by construction',
  measured.computed && measured.rows.every(x => x.numeric === null), true);

/* Rule 2: every number resolves to a link, or the report says why it does not.
 * The falsifier for this whole section is that a reader opens the target and
 * recounts, and they cannot do that without an address. */
/* ⛔ THE FIRST DRAFT OF THIS ASSERTION WAS VACUOUS AND IS RECORDED AS SUCH. It
 * read `x.link !== null || /link:/.test(term) || …`, and the middle disjunct is
 * TRUE for every report ever rendered, because the findings section prints the
 * word "link:" four lines up. A disjunction whose second term is a tautology
 * asserts nothing about the first, and it passes exactly as loudly as a real
 * check. Same family as `x.includes('')` and `rendered.includes(BLANKED)` —
 * this repository has now produced the shape three times.
 *
 * The honest form reads the ROW, not the whole report: every row either carries
 * a link, or the line rendered FOR THAT ROW states why it has none. */
const rowLines = term.split('\n').filter(l => measured.computed && measured.rows.some(x => l.includes(x.resource) && l.includes(x.value)));
check('the row lines were actually located, so the check below is not over an empty set',
  rowLines.length, measured.computed ? measured.rows.length : -1);
check('every measurement row carries a link, or its own line states why it has none',
  measured.computed && measured.rows.every((x, i) => x.link !== null || rowLines[i]!.includes(LINK_NOT_CAPTURED)), true);

/* Rule 6 again, at the DATA level rather than the label: the rows are sorted by
 * the key the label names, and the order is TOTAL so two runs cannot differ. */
check('the rows are sorted by the key the label names — oldest first',
  measured.computed && measured.rows.every((x, i, a) => i === 0 || a[i - 1]!.value <= x.value), true);

finish('A measurement is a counted fact. It makes no conformity claim, and ADR-0017 decision 4 gives it no channel to the exit byte — not even a rule-level one, because it owns no rule ID.');
