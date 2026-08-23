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
import { measurementsFrom, totalIsReconstructible, MEASUREMENT_IDS, type Measurement } from './measurement.js';
import { LINK_NOT_CAPTURED } from './finding.js';
import { hyphenate } from './ids.js';
import { ROOT, PAGE_B, DATASET, DATASET_B, cfg, clock, fakePort, DEAD_LINK, INBOUND_REFS, INBOUND_REFS_PLUS_EXTERNAL, THREE_CHILDREN, TITLED_URL, TITLE_IN_URL } from './CHECK-fakes.js';

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

/* SELECTED BY KEY, NOT BY INDEX. The v0.1 set grows one measurement at a time
 * (#142, #144, then #143 and #145), and an index is a claim about the order the
 * derivation happens to return them in — which is not a property this suite
 * should be asserting and not one a later ticket should have to preserve. The
 * stable key is the identity ADR-0017 decision 7 exists to provide, so use it. */
const edited = r.measurements.find(m => m.id === MEASUREMENT_IDS.lastEdited);
check('  the last-edited measurement is present, keyed by its stable ID', edited !== undefined, true);

/* THE SET SIZE IS STILL ASSERTED, and against the keys rather than a bare count,
 * so a measurement added without a test is a visible failure and the message
 * names which key is unaccounted for. A bare `length` assertion says only that
 * the number moved. */
check('  the v0.1 set is exactly the keys this suite knows about',
  r.measurements.map(m => m.id).sort().join(' + '),
  [
    MEASUREMENT_IDS.lastEdited,
    MEASUREMENT_IDS.inboundReferences,
    MEASUREMENT_IDS.databaseTypedProperties,
    MEASUREMENT_IDS.databaseViews,
    MEASUREMENT_IDS.peoplePropertyEmpty,
  ].sort().join(' + '));

/* AND EVERY DECLARED KEY IS RETURNED EXACTLY ONCE. The assertion above catches a
 * measurement silently dropped or silently added; this one catches a key
 * DECLARED and never returned, and a key returned twice — neither of which the
 * set comparison can tell apart from correct on its own.
 *
 * ⚠ IT READS THE CONSTANT UNDER TEST, so it is a consistency check and not an
 * independent control. It is paired with the explicit list above deliberately;
 * do not drop the list in favour of this. */
check('  and every declared measurement key is returned exactly once',
  Object.values(MEASUREMENT_IDS).map(id => `${id}:${r.measurements.filter(m => m.id === id).length}`).join(' '),
  Object.values(MEASUREMENT_IDS).map(id => `${id}:1`).join(' '));

check('  every measurement carries a STABLE key, so it can be promoted to a rule condition later',
  r.measurements.every(m => m.id.startsWith('measurement/')), true);
check('  every key is versioned, so a later change is visible rather than silent',
  r.measurements.every(m => /@\d+$/.test(m.id)), true);
check('  and each names its unit, per ADR-0017 rule 1',
  r.measurements.every(m => m.unit.length > 0), true);

/* The separation is what stops a count being read as a defect claim. */
check('no measurement leaked into findings', r.findings.length, r.findings.filter(f => f.rule !== undefined).length);
check('  no measurement is a gap', r.gaps.some(g => g.resource === MEASUREMENT_IDS.lastEdited), false);
check('  and none is a residual', r.residuals.some(x => x.resource === MEASUREMENT_IDS.lastEdited), false);

/* ADR-0017 rule 6: sorting is allowed, ranking is not. The label must name the
 * sort key, and must not carry judgement vocabulary. */
const label = edited!.label;
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
/* ⚠ NO NON-NULL ASSERTION HERE. It read `.find(…)!` with an `!== undefined`
 * check on the next line — so if the measurement ever went missing the check
 * would print one FAIL and the line after it would throw, aborting the suite
 * mid-run. A crashed suite prints no further FAIL and reports its failure only
 * through the exit code, which is the shape that has already misread twice in
 * this repository. Optional chaining fails cleanly and keeps the rest running. */
const untimed = rUntimed.measurements.find(m => m.id === MEASUREMENT_IDS.lastEdited);

check('the measurement is still PRESENT when it could not be computed', untimed !== undefined, true);
check('  and it is marked not computed', untimed?.computed, false);
check('  carrying a named cause', untimed && !untimed.computed ? untimed.cause.length > 0 : false, true);
check('  which names the endpoint boundary rather than shrugging',
  untimed && !untimed.computed ? /GET \/v1\/pages/.test(untimed.cause) : false, true);

const untimedTerm = renderReport(rUntimed, {}).join('\n');
/* GUARD THE SUBJECT FIRST. An assertion over a blank report passes while proving
 * nothing — `''.includes(x)` is false for every x. */
check('the report is non-empty, so the assertions below mean something', untimedTerm.length > 0, true);
check('the MEASUREMENTS section renders even with nothing computed', /MEASUREMENTS/.test(untimedTerm), true);
check('  and prints the not-computed line', /not computed —/.test(untimedTerm), true);
check('  the cause is printed, not swallowed',
  untimedTerm.includes(untimed && !untimed.computed ? untimed.cause : 'NEVER'), true);
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
const measured = edited!;
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
/* ⛔ RUN OVER A MANIFEST THAT ACTUALLY HAS A SUMMING MEASUREMENT IN IT, AND THE
 * GUARD BELOW IS WHY. This loop first ran over `r`'s manifest alone — the
 * DEAD_LINK fixture, which reaches no database — so every measurement in it was
 * either `computed: false` or had a null total, and the `m.total === sum` branch
 * was NEVER TAKEN. Verified rather than reasoned: skewing a real total by +41
 * turned the gate red through TEST 7's assertions and left this loop silent,
 * which is the wrong file catching this test's defect.
 *
 * Same family as every other vacuous-subject failure this suite records: the
 * loop was not wrong, its input could not exercise it. */
const rSums = await scan({ config: cfg(ROOT, 0.0), port: fakePort(INBOUND_REFS), now: clock() });
const reconstructible = [...measurementsFrom(r.manifest), ...measurementsFrom(rSums.manifest)];
check('the reconstructibility loop has a measurement that actually SUMS, so it is not vacuous',
  reconstructible.some(m => m.computed && m.total !== null), true);
for (const m of reconstructible) {
  check(`${m.id}: its printed total is reconstructible from its printed rows`,
    totalIsReconstructible(m), true);
}

head('TEST 6b — MUTATION: a total that disagrees with its rows is CAUGHT — #143 AC2');

/* ⛔ THE FIXTURES ARE CONSTRUCTED HERE AND NOT DERIVED, BECAUSE THE DERIVATION
 * CANNOT PRODUCE ONE. `measurementsFrom` computes every total from its own rows,
 * so there is no code path that yields a skewed measurement — which is exactly
 * what makes the loop above pass for every real measurement and therefore
 * exactly why the loop alone proves nothing about the predicate. A control that
 * only ever sees inputs it must accept has not been shown to reject anything.
 *
 * ⚠ WHY THIS IS NOT #143's LITERAL "TAKES THE SUITE TO A NON-ZERO EXIT". A gate
 * assertion that must go red to pass is a gate that cannot ship. The predicate is
 * scored in BOTH directions over the same rows instead, which is the same
 * evidence without the contradiction. The literal exit-byte form is a by-hand
 * red run and its receipt belongs in docs/proof/, not in the suite. */
const HONEST: Measurement = {
  id: 'measurement/honest@1', label: 'A measurement whose total sums its rows', unit: 'widgets',
  computed: true, over: 'a set invented by this check', total: 5,
  rows: [{ resource: 'res-a', value: '2', numeric: 2, link: null },
         { resource: 'res-b', value: '3', numeric: 3, link: null }],
};
const SKEWED: Measurement = { ...HONEST, id: 'measurement/skewed@1', total: 99 };

check('the honest fixture passes, so the predicate is not simply always-false',
  totalIsReconstructible(HONEST), true);
check('  the skewed fixture genuinely disagrees — 99 is not 2 + 3',
  SKEWED.computed && SKEWED.total, 99);
check('  and the two differ only in the total, so nothing else explains the verdict',
  JSON.stringify({ ...HONEST, id: '', total: 0 }) === JSON.stringify({ ...SKEWED, id: '', total: 0 }), true);
check('  the predicate CATCHES the skew', totalIsReconstructible(SKEWED), false);

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

/* =========================================================================
 * TEST 7 — INBOUND REFERENCES, per reached database. Ticket #144.
 *
 * The signal is quiet-and-unreferenced TOGETHER: an inbound-reference count
 * beside a last-write timestamp, because either alone reads as noise. A database
 * nobody links to that was edited this morning is in use; one edited fourteen
 * months ago that nothing points at is the structure the owner is looking for.
 * The report prints both and draws no conclusion — ADR-0017 rule 6, and there is
 * deliberately no threshold, because a threshold set once has a vendor default's
 * authority and worse provenance (Beller et al., DOI 10.1109/SANER.2016.105).
 * ========================================================================= */

head('TEST 7 — per reached database: inbound references from the scanned set, beside last write');

const rIn = await scan({ config: cfg(ROOT, 0.0), port: fakePort(INBOUND_REFS), now: clock() });
const inbound = rIn.measurements.find(m => m.id === MEASUREMENT_IDS.inboundReferences);

check('the inbound-reference measurement is present', inbound !== undefined, true);
check('  and it carries a versioned stable key', /@\d+$/.test(inbound?.id ?? ''), true);
check('  it was computed — the reference set is input the scan already has',
  inbound?.computed, true);

/* GUARD THE SUBJECT'S EMPTINESS FIRST. Every assertion below reads `rows`, and
 * an assertion over an empty array is vacuously true — the shape this suite has
 * already produced three times in other forms. */
const inRows = inbound?.computed ? inbound.rows : [];
check('  the rows are non-empty, so the assertions below are not vacuous', inRows.length > 0, true);

/* THE JOIN IS BY KIND, AND THE FIXTURE HOLDS A PAGE TOO. A derivation that
 * counted every reached resource would put PAGE_B and the root in this table. */
check('  exactly the two reached DATA SOURCES are rowed, and no page is', inRows.length, 2);
check('  the root is not in the table', inRows.some(x => x.resource.includes(hyphenate(ROOT)!)), false);
check('  and neither is the reached child PAGE', inRows.some(x => x.resource.includes(hyphenate(PAGE_B)!)), false);

const referenced = inRows.find(x => x.resource.includes(hyphenate(DATASET)!));
const quiet = inRows.find(x => x.resource.includes(hyphenate(DATASET_B)!));

check('  the mentioned database is rowed', referenced !== undefined, true);
check('    and its inbound count is 1 — the root `@`-mentions it', referenced?.numeric, 1);
check('  the unmentioned database is rowed', quiet !== undefined, true);
check('    and its inbound count is 0', quiet?.numeric, 0);

/* ADR-0017 decision 3: the total is a function of the rows printed beside it. */
check('  the total equals the sum of the printed rows',
  inbound?.computed ? inbound.total : 'no total',
  inRows.reduce((s, x) => s + (x.numeric ?? 0), 0));

head('TEST 7b — the zero is SCOPED, and the unscoped assertion appears nowhere');

const inTerm = renderReport(rIn, {}).join('\n');
const inDoc = buildReportDocument(rIn, {});
const inMd = renderMarkdown(inDoc);
const inJson = renderJson(inDoc);

check('the terminal report is non-empty', inTerm.length > 0, true);
check('  the Markdown report is non-empty', inMd.length > 0, true);
check('  and the JSON artifact is non-empty', inJson.length > 0, true);

check('the zero row states the SET it is a zero over', /from the scanned set/.test(quiet?.value ?? ''), true);
check('  and the denominator is printed beside the rows',
  inbound?.computed ? /scanned set/.test(inbound.over) : false, true);

/* ⛔ THE PROHIBITED SENTENCE, ASSERTED OVER THE WHOLE OUTPUT AND NOT OVER ONE
 * SECTION. A redaction-style guarantee with a hole in it is worse than none,
 * because the report makes the claim either way and the reader cannot tell —
 * this repository shipped exactly that with a page title in a call log four
 * lines under a report promising titles were redacted. The bare word
 * "unreferenced" asserted of a resource is a claim about the WORKSPACE, and the
 * connection cannot enumerate its own grant. */
/* ⚠ THE QUALIFIER MUST BE ON THE SAME ROW AS THE CLAIM, SO THIS IS SCOPED PER
 * ROW AND NOT PER DOCUMENT. The first draft read
 * `/\bunreferenced\b(?!.*scanned set)/` over the whole rendered string, and the
 * lookahead spans the entire document: the `over:` line prints "scanned set" a
 * few rows below every row, so the pattern was satisfied by a qualifier the
 * reader would never connect to the claim. It passed on the mutated build for
 * the JSON artifact while catching the same mutation in the other two emitters,
 * which is the tell.
 *
 * Same family as `x.includes('')` and the tautological disjunct this suite
 * already records: an assertion that cannot fail passes as loudly as a real one.
 * The honest form asks, of each row, whether THAT row carries its scope. The
 * JSON artifact is `canonicalize`d and therefore not newline-delimited, so it is
 * split on the row separator its own encoding uses rather than assumed to have
 * lines. */
const CLAIM = /\bunreferenced\b|\bno inbound references\b|\borphan/i;
const unscopedIn = (text: string): string[] =>
  text.split(/[\n,]/).filter(l => CLAIM.test(l) && !/scanned set/i.test(l));

check('no unscoped claim of unreferencedness in the terminal report', unscopedIn(inTerm).join('|'), '');
check('  nor in the Markdown report', unscopedIn(inMd).join('|'), '');
check('  nor in the JSON artifact', unscopedIn(inJson).join('|'), '');
console.log('  ^ ADR-0002: the connection cannot enumerate its own grant, so "unreferenced"');
console.log('    asserted of the workspace is negation as failure wearing a count\'s clothes.');

head('TEST 7c — no threshold, and no judgement vocabulary anywhere in the section');

/* Rule 8: a threshold exists only as a configured rule with a rule ID. The
 * words below are the judgement re-entering through the label. */
const JUDGEMENT = /stale|abandoned|dead|neglected|unused|rot|worst|bloated|at risk|too (many|old)/i;
check('the label carries no judgement vocabulary', JUDGEMENT.test(inbound?.label ?? 'stale'), false);
check('  and names its sort key, so the reader draws the conclusion',
  /sorted by/i.test(inbound?.label ?? ''), true);
check('  no row value carries it either', inRows.some(x => JUDGEMENT.test(x.value)), false);
check('  and no threshold is expressed anywhere in the measurement',
  /\b(threshold|older than|more than \d+ days|within \d+ days)\b/i.test(JSON.stringify(inbound ?? {})), false);

head('TEST 7d — the last-write half is a BOUNDARY LINE, and it names what would widen it');

/* ⛔ THIS IS THE HONEST ANSWER ON TODAY'S BUILD, NOT A MISSING FEATURE.
 * `NotionPort` has three methods — GET /v1/users/me, GET /v1/pages/{id},
 * GET /v1/blocks/{id}/children — and none retrieves a database, so no response
 * carrying a database's `last_edited_time` exists for the row to read. The
 * vendor DOES return one (the SDK's DatabaseObjectResponse carries
 * `last_edited_time`), which is exactly why the row must name the boundary as
 * OURS rather than implying the timestamp does not exist. */
check('every row prints its last-write half', inRows.every(x => /last edited/i.test(x.value)), true);
check('  and where it could not be read, the ROW says so in its own words',
  inRows.every(x => /last edited: [0-9]/.test(x.value) || /not read/.test(x.value)), true);
check('  the boundary line is not a silent blank', inRows.every(x => x.value.trim().length > 0), true);

/* ⛔ THE ROW SAYS WHAT, THE MEASUREMENT SAYS WHY, AND BOTH HALVES ARE ASSERTED.
 * The full cause was on every row until the section was rendered and read: three
 * clauses of identical text per row, with the only varying figure buried behind
 * them. Hoisting the detail is only honest if the detail is still printed, so
 * the `over` line is checked for the specific endpoint — a short row marker with
 * no explanation anywhere is the shrug ADR-0017 decision 5 forbids. */
const inOver = inbound?.computed ? inbound.over : '';
check('  the measurement names the ENDPOINT boundary in full, beside the rows',
  /GET \/v1\/pages\/\{id\}/.test(inOver), true);
check('    and attributes it to this tool rather than to the vendor',
  /not the vendor/.test(inOver), true);
check('    and the deduplication caveat travels with the counts',
  /deduplicated by target/.test(inOver), true);
console.log('  ^ the row widens with no code change when a database retrieve is granted (#51):');
console.log('    it reads Entry.lastEditedTime, which that call would populate.');

head('TEST 7d(i) — the link cell states the DATABASE boundary, not the shared page one');

/* ⛔ THE SHARED DEFAULT WENT FALSE ON THIS TABLE AND THE ROW REFUTED IT ON ITS
 * OWN LINE. `LINK_NOT_CAPTURED` reads "GET /v1/pages runs for the declared root
 * and for reference targets only", and it was printing beside "1 inbound
 * reference from the scanned set" — on a resource that IS a reference target.
 * Both halves of that line cannot be true. A generic constant is right until a
 * caller's boundary differs from the one it names. */
check('the row states its own link-absence reason', inRows.every(x => (x.linkCause ?? '').length > 0), true);
check('  and the shared page-only sentence appears on NO database row',
  inRows.some(x => (x.linkCause ?? '') === LINK_NOT_CAPTURED), false);
/* ⚠ SCOPED TO THE DATABASE ROWS, NOT TO THE WHOLE REPORT, and the first draft
 * got that wrong. `LINK_NOT_CAPTURED` is CORRECT everywhere else it prints — it
 * describes a page the retrieve never covered, which is most of them. Asserting
 * its absence report-wide failed for the right reason and would have been the
 * wrong fix: a control that forbids a true sentence elsewhere to protect one
 * table. The claim is that no DATABASE row carries it. */
/* ⚠ MATCHED ON THE RESOURCE **AND** THE VALUE. On the ID alone this selected ten
 * lines for two rows — the manifest section prints every resource by ID too — and
 * the emptiness guard below is what caught it. The pair is unique to the
 * measurement's own row. */
const dbRowLines = inTerm.split('\n').filter(l => inRows.some(x => l.includes(x.resource) && l.includes(x.value)));
check('  the database row lines were actually located, so the check below is not over an empty set',
  dbRowLines.length, inRows.length);
check('  and none of them carries the page-only sentence',
  dbRowLines.some(l => l.includes(LINK_NOT_CAPTURED)), false);
check('    while the constant under test is itself non-empty, so that is not vacuous',
  LINK_NOT_CAPTURED.length > 0, true);

head('TEST 7d(ii) — an EXTERNAL reference changes no count, and the fixtures differ by one href');

/* The exclusion is structural — `registerReferences` skips external references
 * before the manifest is touched, so an external href has no entry to be
 * counted. Asserted anyway, because "structural" is a claim about code that a
 * later edit can quietly falsify, and the whole point of this section is that a
 * printed number answers the question its label says it answers. */
const rExt = await scan({ config: cfg(ROOT, 0.0), port: fakePort(INBOUND_REFS_PLUS_EXTERNAL), now: clock() });
const extM = rExt.measurements.find(m => m.id === MEASUREMENT_IDS.inboundReferences);
const extRows = extM?.computed ? extM.rows : [];

check('the external arm is non-empty, so this comparison is not between two blanks',
  extRows.length > 0 && inRows.length > 0, true);
check('  the external reference WAS seen by the scan, so the fixture really differs',
  rExt.externalReferences > rIn.externalReferences, true);
check('  every inbound count is unchanged by it',
  extRows.map(x => `${x.resource}=${x.numeric}`).join(' '),
  inRows.map(x => `${x.resource}=${x.numeric}`).join(' '));
check('  and so is the total', extM?.computed ? extM.total : 'no total', inbound?.computed ? inbound.total : 'no total');

head('TEST 7e — MUTATION: the count must come from the reference set, not from a constant');

/* The failure this control exists for is a derivation that returns a plausible
 * number without joining anything. Drive a fixture with NO references at all and
 * confirm the referenced database's count collapses to zero — a constant, or a
 * count of reached resources, would not move. */
const rNoRefs = await scan({ config: cfg(ROOT, 0.0), port: fakePort(THREE_CHILDREN), now: clock() });
const noRefs = rNoRefs.measurements.find(m => m.id === MEASUREMENT_IDS.inboundReferences);
const noRefRows = noRefs?.computed ? noRefs.rows : [];
check('the mutation arm actually differs — this fixture has a database and no reference to it',
  noRefRows.length > 0, true);
check('  every count is zero when nothing references anything',
  noRefRows.every(x => x.numeric === 0), true);
check('  and the total collapses with them', noRefs?.computed ? noRefs.total : 'no total', 0);
console.log('  ^ the referenced arm reads 1 and this arm reads 0 over the same code path,');
console.log('    so the number is a join over the reference set and not a constant.');

/* =========================================================================
 * TEST 8 — #143. The maintenance counts, and their boundary named rather than
 * shrugged at.
 *
 * ⛔ BOTH LINES ARE `not computed` ON TODAY'S BUILD AND THAT IS THE HONEST
 * ANSWER, NOT A STUB. Relation, rollup and formula counts are read off a
 * data-source SCHEMA; a view count is read off a view listing. `NotionPort`
 * declares three methods and none of them returns either. #143's own AC3
 * pre-authorises this outcome — "either views print like the other counts, or
 * the not-computed line names the boundary".
 * ========================================================================= */

head('TEST 8 — a database count that cannot be computed names the endpoint, not a shrug');

/* THE SUBJECT IS GUARDED FIRST: a fixture with no database in it would make
 * every assertion below true about nothing at all. */
const rDb = await scan({ config: cfg(ROOT, 0.0), port: fakePort(INBOUND_REFS), now: clock() });
check('the fixture really did reach data sources, so this is not a vacuous pass',
  rDb.gaps.some(g => g.resource === hyphenate(DATASET)), true);

const typed = rDb.measurements.find(m => m.id === MEASUREMENT_IDS.databaseTypedProperties);
const views = rDb.measurements.find(m => m.id === MEASUREMENT_IDS.databaseViews);

check('the typed-property measurement is present', typed !== undefined, true);
check('  and is NOT computed on this build', typed?.computed, false);
check('  its cause is non-empty, so the assertions below are not vacuously true',
  typed && !typed.computed ? typed.cause.length > 0 : false, true);
check('  the cause names the SCHEMA endpoint that would supply the counts',
  typed && !typed.computed ? typed.cause.includes('GET /v1/data_sources/{data_source_id}') : false, true);
check('  and the traversal endpoint that would reach it',
  typed && !typed.computed ? typed.cause.includes('GET /v1/databases/{id}') : false, true);

check('the view measurement is present', views !== undefined, true);
check('  and is NOT computed on this build', views?.computed, false);
check('  the cause names GET /v1/views — the vendor question is DISCHARGED, not open',
  views && !views.computed ? views.cause.includes('GET /v1/views') : false, true);

/* ⛔ THE HONEST HALF, AND THE ONE MOST EASILY GOT WRONG. `docs/vendor/list-views.md`
 * (fetched 2026-08-19) records that read-content capability — which a read-only
 * integration already holds — is sufficient for GET /v1/views. So the missing
 * thing is the CALL, not the grant, and a cause blaming the credential would be
 * a false claim about the operator's own token. */
check('  and it blames the missing CALL, never the grant',
  views && !views.computed ? /not the grant/.test(views.cause) : false, true);
check('  the grant is not falsely implicated anywhere in it',
  views && !views.computed ? /(insufficient|lacks?|denied) (permission|capability|grant)/i.test(views.cause) : true, false);

/* THE CAUSE IS SCOPED TO WHAT WAS ACTUALLY REACHED, so "not computed" is an
 * observation about this scan rather than a standing disclaimer. */
check('  the cause counts the data sources it is silent about',
  typed && !typed.computed ? /2 data source\(s\) reached/.test(typed.cause) : false, true);

head('TEST 9 — #145. The owner signal names the ROW endpoint it does not have');

const people = rDb.measurements.find(m => m.id === MEASUREMENT_IDS.peoplePropertyEmpty);

check('the measurement is present even though nothing was counted', people !== undefined, true);
check('  and is NOT computed on this build', people?.computed, false);
check('  its cause is non-empty', people && !people.computed ? people.cause.length > 0 : false, true);
check('  the cause names the ROW endpoint, which is the one that is missing',
  people && !people.computed ? people.cause.includes('POST /v1/data_sources/{data_source_id}/query') : false, true);
check('  and the SCHEMA endpoint, where the property TYPE would come from',
  people && !people.computed ? people.cause.includes('GET /v1/data_sources/{data_source_id}') : false, true);
/* ⚠ THE TWO ENDPOINTS HAVE DIFFERENT REMEDIES AND THE CAUSE MUST NOT FLATTEN
 * THEM. The schema endpoint is authorized; the row endpoint is a POST whose
 * addition is an ASK FIRST decision that has not been granted. An operator told
 * only "not computed" would reach for the wrong one. */
check('  and it records that the ROW endpoint is ungranted, not merely uncalled',
  people && !people.computed ? /not been granted/i.test(people.cause) : false, true);

/* #145 AC3: the type is the only selector. Principle 4 forbids inferring meaning
 * from a label, and "Owner" is a label. */
check('  the label selects by TYPE', /people-type/i.test(people?.label ?? ''), true);
check('  and no property NAME appears in the label',
  /\bowner\b|\bassignee\b|\bDRI\b/i.test(people?.label ?? ''), false);
check('  nor anywhere in the measurement',
  /\bowner\b|\bassignee\b/i.test(JSON.stringify(people ?? {})), false);

head('TEST 9b — every not-computed line reaches the reader, in all three emitters');

const dbTerm = renderReport(rDb, {}).join('\n');
const dbDoc = buildReportDocument(rDb, {});
const dbMd = renderMarkdown(dbDoc);
const dbJson = renderJson(dbDoc);

check('the terminal report is non-empty, so the assertions below mean something', dbTerm.length > 0, true);
/* LITERALS, NOT THE CONSTANTS UNDER TEST. Reading the label back out of
 * measurement.ts would make these pass under any rename — the same shape as
 * `rendered.includes(BLANKED)`, which this suite already records. */
check('  the typed-property line renders', dbTerm.includes('Relation, rollup and formula properties'), true);
check('  the view line renders', dbTerm.includes('Views, per reached database'), true);
check('  the people line renders', dbTerm.includes('People-type properties with an empty value'), true);
check('  three not-computed lines are printed, one per boundary',
  (dbTerm.match(/not computed —/g) ?? []).length >= 3, true);
check('  and they survive into the Markdown emitter', /Not computed —/.test(dbMd), true);
check('  and into the JSON artifact', /"cause"/.test(dbJson), true);
console.log('  ^ ADR-0017 decision 5: a quiet report and an absent report look identical.');
console.log('    Baca et al. (10.1002/spe.2109) — an expired licence stopped a tool analysing');
console.log('    and nobody noticed. Every boundary here is printed, with the endpoint named.');

finish('A measurement is a counted fact. It makes no conformity claim, and ADR-0017 decision 4 gives it no channel to the exit byte — not even a rule-level one, because it owns no rule ID.');
