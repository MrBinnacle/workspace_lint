/* The residual register and enumeration attestation — ADR-0013, issue #52.
 *
 *   npx tsx CHECK-residuals.ts
 *
 * No network, no .env, no token.
 *
 * WHAT THIS FILE IS DEFENDING. ADR-0013 decided that the outcome model was one
 * component short: `unreached` is survey methodology's nonresponse analogue and
 * `undecidable` its measurement analogue, and COVERAGE ERROR — the frame itself
 * being filtered upstream — had no axis at all. The component is unquantifiable
 * by two independent literatures, so it may never be rendered as a number, and
 * the bias it induces runs in the flattering direction (Kosinski & Barnhart
 * 2003: restricting to the verified subset means "sensitivity would often be
 * higher than the true values").
 *
 * So the three things most likely to go wrong are the three things asserted
 * hardest here:
 *
 *   1. A RESIDUAL LEAKING INTO ARITHMETIC. The flattering move is to let the
 *      register touch a denominator. TEST 2 pins every published figure against
 *      a run that carries residuals, and TEST 6 pins the byte itself.
 *   2. THE COUNT DRIFTING OFF THE BYTE'S LINE. The S017 finding was never a
 *      missing disclosure — the blind-spine disclosure was already shipping at
 *      report.ts when the false green shipped. It was two true statements in
 *      different sections with nothing connecting them. TEST 4 is that line.
 *   3. THE REGISTER BECOMING PROSE. A drop-out carries STRUCTURE; this
 *      repository has twice recovered structure from a cause string and been
 *      wrong both times.
 *
 * FOUR TESTS HERE ARE MUTATION CHECKS, and each disables the mechanism and
 * asserts the control goes red. A control that passes with its mechanism
 * bypassed tested nothing (docs/spec/v0.1-scan-slice.md §4.1). They are scored
 * by the harness, which exits non-zero on any FAIL — never by grepping output
 * for the string FAIL, which cannot tell a passing suite from a crashed one.
 */

import { createHarness, requiredSection } from './CHECK-harness.js';
import { scan } from './scan.js';
import { gapsFrom, Manifest, residualsFrom, RESIDUAL_CAUSE, type Residual } from './manifest.js';
import { attestationOf, BLOCK_CHILDREN, SEARCH } from './notion-port.js';
import { buildReportDocument, renderJson, renderMarkdown, renderReport } from './report.js';
import { hyphenate } from './ids.js';
import {
  ROOT, PAGE_A, PAGE_B, DATASET, HIDDEN_CHILD_ID, TITLE_IN_URL, TITLED_URL,
  cfg, clock, fakePort,
  THREE_CHILDREN, PERMISSION_FILTERED, MIDSTREAM, ROOT_ENUM_FAILS,
} from './CHECK-fakes.js';

const { check, head, finish } = createHarness();

/* =========================================================================
 * TEST 1 — attestation is READ OFF THE ENDPOINT, never off a response
 * =========================================================================
 * ADR-0013 decision 2. It describes the METHOD, not the result. A version that
 * inspects a response body for a completeness signal is the defect: the whole
 * point is that `GET /v1/blocks/{id}/children` returns the same
 * `has_more: false` whether the listing was complete or filtered, so no
 * response can carry this fact.
 * ========================================================================= */

head('TEST 1 — ADR-0013 decision 2: attestation is a property of the endpoint');

check('block children is UNATTESTED (ADR-0006 decision 2)', attestationOf(BLOCK_CHILDREN), 'unattested');
check('search is ATTESTED (ADR-0007)', attestationOf(SEARCH), 'attested');
/* THE DEFAULT IS THE CONSERVATIVE DIRECTION, and this assertion is the reason
 * the function exists rather than a bare object lookup. An endpoint nobody
 * classified must not inherit the flattering answer: an unknown endpoint
 * silently reading `attested` would let a future call widen the trusted set by
 * being added, which is precisely how the `child_page`-only applicable set
 * shipped a 2/2 — 100% figure over a root with three children. */
check('an UNCLASSIFIED endpoint defaults to unattested, never to attested', attestationOf('GET /v1/some/endpoint/nobody/classified'), 'unattested');

const r1 = await scan({ config: cfg(), port: fakePort(THREE_CHILDREN), now: clock() });
const entries = r1.manifest.all();
const entryFor = (id: string) => entries.find(e => e.key === hyphenate(id));

check('the declared root carries an enumeration record', entryFor(ROOT)?.enumeration?.endpoint, BLOCK_CHILDREN);
check('  and it is unattested', entryFor(ROOT)?.enumeration?.attestation, 'unattested');
check('a child page enumerated by a real call carries one too', entryFor(PAGE_A)?.enumeration?.attestation, 'unattested');
check('  and so does the second child', entryFor(PAGE_B)?.enumeration?.attestation, 'unattested');

/* THE DATA SOURCE MADE NO CALL, SO IT HAS NO ENUMERATION AND NO RESIDUAL.
 * It reaches the `enumerated` stage carrying a drop-out cause, which makes it a
 * GAP. Recording a residual here as well would double-count one resource across
 * two mechanisms that mean opposite things — a gap is an item that LEFT the
 * funnel, a residual is a doubt about whether the item was ever IN it. */
check('the data source reached the enumerated stage', entryFor(DATASET)?.stages.has('enumerated'), true);
check('  but it has NO enumeration record, because no call was made', entryFor(DATASET)?.enumeration ?? null, null);

/* =========================================================================
 * TEST 2 — a residual is NOT a gap, and it enters no arithmetic anywhere
 * =========================================================================
 * ADR-0013 decision 3, and the hardest constraint in the ADR. Two independent
 * literatures say the quantity is not estimable, so any number derived from it
 * would be invented — and per the capture-recapture sweep's hazard 2, invented
 * in the flattering direction.
 * ========================================================================= */

head('TEST 2 — ADR-0013 decision 3: residuals touch no numerator and no denominator');

check('the run produced residuals', r1.residuals.length > 0, true);
/* ONE PER RESOURCE WHOSE ENUMERATION WAS UNATTESTED — not one per CALL, and the
 * earlier wording of this assertion said "per CALL". It passed only because this
 * fixture fits every listing in one page and has no descendable containers.
 * `listAllChildren` paginates and `readBlockTree` descends, so one resource can
 * cost many calls: MIDSTREAM makes THREE block-children calls and produces TWO
 * residuals, and TEST 7 now asserts that pair directly. A test that is true by
 * accident of its fixture states the wrong invariant even while it is green. */
check('  three of them, one per RESOURCE with an unattested enumeration', r1.residuals.length, 3);

/* The figures this fixture produced before ADR-0013 existed, asserted here as
 * literals rather than recomputed. Recomputing them from the same run would
 * assert only that the run equals itself. These are the numbers recorded in
 * S016's band for this fixture: exit 3, 4 applicable, 3 evaluated. */
check('applicable is UNCHANGED by the register', r1.verdict.applicable, 4);
check('evaluated is UNCHANGED by the register', r1.verdict.evaluated, 3);
check('the exit byte is UNCHANGED by the register', r1.verdict.exit, 3);

const residualResources = new Set(r1.residuals.map(x => x.resource));
const gapResources = new Set(r1.gaps.map(g => g.resource));
/* The root and both child pages carry residuals AND were fully evaluated. If a
 * residual were leaking into the gap set, these would intersect. */
check('no residual resource is also a gap on this fixture', [...residualResources].some(x => gapResources.has(x)), false);
check('  and the data source is a gap, with no residual', gapResources.has(hyphenate(DATASET)!) && !residualResources.has(hyphenate(DATASET)!), true);

const doc1 = buildReportDocument(r1, { deterministic: true });
const sysRow = doc1.coverageVector.find(row => row.unit === 'resources');
/* The denominator is the four resources, NOT the four resources plus the three
 * residuals. Asserted as a literal, because recomputing it from the same run
 * would assert only that the run equals itself. */
check('SYS001\'s denominator is resources only, with no residual added', sysRow?.applicable, 4);
check('  and its numerator is unchanged', sysRow?.evaluated, 3);

/* -------------------------------------------------------------------------
 * TEST 2b — MUTATION: let the register feed the gap set, and the byte must move
 * ------------------------------------------------------------------------- */

head('TEST 2b — MUTATION: a residual leaking into the gap set changes the run');

const rLeaked = await scan({
  config: cfg(),
  port: fakePort(THREE_CHILDREN),
  now: clock(),
  /* The flattering-direction defect, executed: residuals appended to the gap
   * set as though a doubt about the frame were an item that left the funnel. */
  deriveGaps: m => [
    ...gapsFrom(m),
    ...residualsFrom(m).map(x => ({ resource: x.resource, cause: x.cause, bounded: true, isRootMiss: false })),
  ],
});

check('with residuals leaked into gaps the run DIFFERS', rLeaked.gaps.length !== r1.gaps.length, true);
check('  which is what TEST 2 is holding shut', rLeaked.gaps.length > r1.gaps.length, true);

/* =========================================================================
 * TEST 3 — ADR-0013 decision 5: `sufficient` may not print alone
 * =========================================================================
 * The same instrument as ADR-0005 decision 4's "two figures are published
 * together or not at all", applied to a new pair.
 * ========================================================================= */

head('TEST 3 — the publication constraint: evidence sufficiency carries its attestation');

check('every outcome row carries an attestation field', doc1.outcomes.every(o => 'attestation' in o), true);
check('  and on this run it is unattested', doc1.outcomes.every(o => o.attestation === 'unattested'), true);

const rendered1 = renderReport(r1);
const reportSec = requiredSection(rendered1.join('\n'), 'REPORT');
const outcomeLines = reportSec.split('\n').filter(l => l.includes('evidence '));
check('the report printed at least one outcome line', outcomeLines.length > 0, true);
/* ON THE SAME LINE. An attestation printed in a different section is the exact
 * defect ADR-0013 exists to end — two true statements a reader cannot connect. */
check('EVERY line printing evidence sufficiency also carries attestation', outcomeLines.every(l => l.includes('attestation')), true);

const mdReport1 = renderMarkdown(doc1);
check('the Markdown outcomes table carries an attestation column', mdReport1.includes('Attestation'), true);

/* -------------------------------------------------------------------------
 * TEST 3b — MUTATION: strip attestation from the outcome rows
 * ------------------------------------------------------------------------- */

head('TEST 3b — MUTATION: an outcome row without attestation fails the constraint');

const stripped = { ...doc1, outcomes: doc1.outcomes.map(({ rule, conformity, evidence }) => ({ rule, conformity, evidence, attestation: null })) };
const mdStripped = renderMarkdown(stripped as typeof doc1);
check('with attestation stripped the Markdown no longer claims a state', mdStripped.includes('| unattested |'), false);
check('  and it says so explicitly rather than printing an empty cell', mdStripped.includes('no enumeration'), true);

/* =========================================================================
 * TEST 4 — the COUNT travels on the byte's own basis line
 * =========================================================================
 * ADR-0013 decision 6, and the operative requirement of the whole ticket.
 * ========================================================================= */

head('TEST 4 — the residual count is on the byte basis line, not in a distant section');

check('the document carries the count on the exit basis', doc1.exit.basis.residuals, 3);

const basisLine = reportSec.split('\n').find(l => l.includes('byte basis:'));
check('the terminal report has a byte basis line', typeof basisLine === 'string', true);
check('  and the residual count is ON IT', /residual/i.test(basisLine ?? ''), true);
check('  as a number the reader can act on', (basisLine ?? '').includes('3'), true);

const mdBasis = mdReport1.split('\n').find(l => l.includes('**Byte basis:**'));
check('the Markdown byte basis line carries it too', /residual/i.test(mdBasis ?? ''), true);

const json1 = JSON.parse(renderJson(doc1)) as { exit: { basis: { residuals: number } } };
check('the JSON exporter serialises it on the basis, not beside it', json1.exit.basis.residuals, 3);

/* -------------------------------------------------------------------------
 * TEST 4b — MUTATION: move the count off the basis line
 * ------------------------------------------------------------------------- */

head('TEST 4b — MUTATION: the count in a distant section is the defect, not the fix');

const movedOff = { ...doc1, exit: { ...doc1.exit, basis: { ...doc1.exit.basis, residuals: 0 } } };
const renderedMoved = renderMarkdown(movedOff as typeof doc1);
const movedBasis = renderedMoved.split('\n').find(l => l.includes('**Byte basis:**')) ?? '';
check('with the count zeroed the basis line stops naming a residual count of 3', movedBasis.includes('3 residual'), false);
check('  while the register itself still lists them — the two are separable, which is the hazard', renderedMoved.includes(RESIDUAL_CAUSE), true);

/* =========================================================================
 * TEST 5 — the register is STRUCTURE, in all three renderers, with full IDs
 * ========================================================================= */

head('TEST 5 — ADR-0013 decision 6: structured entries, full hyphenated IDs, three renderers');

const sample = doc1.residuals[0]!;
check('the cause is the fixed machine-readable string', sample.cause, RESIDUAL_CAUSE);
/* ADR-0005 decision 5 constraint 2 bans generic causes. `skipped: error` is the
 * named banned form. The check is written over a WIDENED array because
 * `Residual.cause` is a literal type, so `sample.cause === 'skipped: error'` is
 * a compile error rather than a test — the type system already forbids it, which
 * is the stronger guarantee. This asserts the runtime value anyway, because the
 * type could be widened by a future edit without anything else failing. */
const BANNED_GENERIC_CAUSES: string[] = ['skipped: error', 'error', 'skipped', 'unknown'];
check('  it is not a banned generic cause (ADR-0005 decision 5 constraint 2)', BANNED_GENERIC_CAUSES.includes(sample.cause), false);
check('the entry names its endpoint', sample.endpoint, BLOCK_CHILDREN);
check('the entry carries a remedy', sample.remedy.length > 0, true);
check('  and the remedy is the OUT-OF-BAND one, distinct from unreached and undecidable', /out of band/i.test(sample.remedy), true);

/* THE FULL HYPHENATED ID. Notion IDs are time-ordered and the declared root
 * shares eight leading hex digits with two of its children, so a prefix
 * rendering made three distinct resources read as one on the first live run. */
check('every residual names its resource by FULL hyphenated ID', doc1.residuals.every(x => x.resource.length === 36 && x.resource.includes('-')), true);

const termResiduals = requiredSection(rendered1.join('\n'), 'RESIDUALS');
check('the terminal report has a RESIDUALS section', termResiduals.length > 0, true);
check('  and the root appears in it, by full ID', termResiduals.includes(hyphenate(ROOT)!), true);
check('the Markdown report has one', mdReport1.includes('## Residuals'), true);
check('the JSON document has one', Array.isArray((JSON.parse(renderJson(doc1)) as { residuals: Residual[] }).residuals), true);

/* REDACTION OVER EVERY RENDERED LINE, never over one section. #42 printed a page
 * title four lines under a report asserting titles were redacted. */
const titled = { ...THREE_CHILDREN, [ROOT]: { ...THREE_CHILDREN[ROOT]!, url: TITLED_URL(ROOT) } };
const rTitled = await scan({ config: cfg(), port: fakePort(titled), now: clock() });
const docTitled = buildReportDocument(rTitled, { deterministic: true });
check('no residual entry leaks a page title, in any field', JSON.stringify(docTitled.residuals).includes(TITLE_IN_URL), false);
check('  nor does the rendered terminal RESIDUALS section', requiredSection(renderReport(rTitled).join('\n'), 'RESIDUALS').includes(TITLE_IN_URL), false);

/* =========================================================================
 * TEST 6 — THE FALSE GREEN IS DISCLOSED, AND IT IS NOT CLOSED
 * =========================================================================
 * ADR-0013's Consequences, stated plainly: "this ADR does not fix the false
 * green." A byte that MOVED here would mean the coverage model was touched,
 * which #52 puts out of scope and which #46's Revisit-if routes through the
 * operator. This test fails in BOTH directions on purpose.
 * ========================================================================= */

head('TEST 6 — the permission-filtered run still exits 0, and now says why that is not proof');

const rFiltered = await scan({ config: cfg(), port: fakePort(PERMISSION_FILTERED), now: clock() });
const docFiltered = buildReportDocument(rFiltered, { deterministic: true });

check('the byte is STILL 0 — ADR-0013 discloses, it does not close (#35)', rFiltered.verdict.exit, 0);
check('  the applicable set is STILL 1', rFiltered.verdict.applicable, 1);
check('  and evidence is STILL sufficient, by its own ADR-0005 definition', docFiltered.outcomes.find(o => o.evidence !== null)?.evidence, 'sufficient');

check('but the run now carries a residual over the parent it read blind', docFiltered.residuals.length > 0, true);
check('  naming the parent whose child list was filtered', docFiltered.residuals.some(x => x.resource === hyphenate(ROOT)), true);
check('  and the count is on the byte basis line, beside the 0', docFiltered.exit.basis.residuals > 0, true);
/* The hidden child is STILL invisible. Asserting its absence is what stops a
 * future change from quietly claiming the residual detected it. */
check('the hidden child is STILL not in the manifest — nothing detected it', rFiltered.manifest.all().some(e => e.key === HIDDEN_CHILD_ID), false);

/* =========================================================================
 * TEST 7 — a PARTIAL enumeration is both a gap and a residual, on purpose
 * =========================================================================
 * The rule is "no call, no residual". It is NOT "never both", and the weaker
 * reading is the one that feels right — which is how a stated invariant ends up
 * guarding only the case its author had in mind (S016's REF001 defect, where
 * the property guarded the STATUS and the hole was in the OBJECT KIND).
 *
 * A mid-stream failure is two facts about one resource. The scan knows it
 * stopped, which is an UNBOUNDED gap and drives the disposition to disclaimed.
 * It also cannot verify that the part it did receive was unfiltered, which is a
 * residual. Suppressing either to keep them mutually exclusive would delete
 * information.
 * ========================================================================= */

head('TEST 7 — a mid-stream enumeration failure produces a gap AND a residual');

const rPartial = await scan({ config: cfg(), port: fakePort(MIDSTREAM), now: clock() });
const rootKey = hyphenate(ROOT)!;

check('the root is a gap', rPartial.gaps.some(g => g.resource === rootKey), true);
check('  and the gap is UNBOUNDED — the remainder cannot be counted or named', rPartial.gaps.find(g => g.resource === rootKey)?.bounded, false);
check('the root is ALSO a residual — the call was made, so the listing is unverifiable', rPartial.residuals.some(x => x.resource === rootKey), true);
check('  which is two facts about one resource, not a double count', rPartial.gaps.filter(g => g.resource === rootKey).length, 1);

/* The arithmetic is what must not double-count. The gap drives the byte; the
 * residual drives nothing. */
check('the disposition is disclaimed, from the GAP alone', rPartial.verdict.disposition, 'disclaimed');
check('  exit 2, unchanged by the residual being present', rPartial.verdict.exit, 2);

const docPartial = buildReportDocument(rPartial, { deterministic: true });
/* A DISCLAIMED REPORT WITHHOLDS THE SUMMARY VERDICT (ADR-0005 decision 3) — and
 * the residual register is NOT a summary verdict. It is evidence about the
 * evidence, in the same class as the per-rule vector, so it still prints. */
check('a disclaimed report still publishes the register', docPartial.residuals.length > 0, true);
check('  while the headline is withheld', docPartial.headline.published, false);

/* THE COUNT IS PER RESOURCE, NOT PER CALL, and this fixture is the one that
 * separates them. The root's listing takes two calls — one page, then a 502 —
 * and PAGE_A takes a third. Three calls, two resources with an enumeration
 * record, two residuals. */
const partialChildCalls = rPartial.calls.filter(c => c.endpoint.includes('children')).length;
check('three block-children CALLS were made', partialChildCalls, 3);
check('  but only TWO residuals, because the unit is the resource', rPartial.residuals.length, 2);
check('  which is the pair that makes "per call" a false description', partialChildCalls !== rPartial.residuals.length, true);

/* =========================================================================
 * TEST 7b — a FAILED enumeration must not be reported as none attempted
 * =========================================================================
 * FOUND IN REVIEW. `attestationBehind` returns null whenever no enumeration
 * RECORD exists, and a root whose children call 404s writes none — the call was
 * made and produced nothing to doubt. The sentence printed for that state said
 * "no enumeration was performed", and the same report's CALLS MADE section
 * listed the call. The report contradicting its own evidence is this product's
 * defect class in this product's output.
 * ========================================================================= */

head('TEST 7b — the report may not deny a call its own log records');

const rFailed = await scan({ config: cfg(), port: fakePort(ROOT_ENUM_FAILS), now: clock() });
const docFailed = buildReportDocument(rFailed, { deterministic: true });
const renderedFailed = renderReport(rFailed).join('\n');

check('the call WAS made and is in the log', rFailed.calls.some(c => c.endpoint.includes('children')), true);
check('  and it produced no enumeration record, so there are no residuals', rFailed.residuals.length, 0);
check('the attestation state is absent', docFailed.outcomes.every(o => o.attestation === null), true);
/* The wording must be true of BOTH "never attempted" and "attempted, failed". */
check('  and the report does NOT claim no enumeration was PERFORMED', /no enumeration was performed/.test(renderedFailed), false);
check('  it says no enumeration produced a LISTING, which the log agrees with', /no enumeration produced a listing/.test(renderedFailed), true);

/* The zero case on the byte basis line needs its own clause: reusing the plural
 * template printed "0 residual(s): the enumerations behind this figure could not
 * be verified complete", which reads as "nothing here is unverifiable" over a
 * figure that rests on no listing at all. */
const failedBasis = requiredSection(renderedFailed, 'REPORT').split('\n').find(l => l.includes('byte basis:')) ?? '';
check('the byte basis line does not print the plural template at zero', failedBasis.includes('0 residual(s)'), false);
check('  it states the figure rests on no listing', failedBasis.includes('rests on none'), true);

/* =========================================================================
 * TEST 8 — an ATTESTED enumeration produces NO residual
 * =========================================================================
 * FOUND BY A MUTATION THAT FAILED TO FIRE. Deleting the
 * `attestation === 'attested'` filter from residualsFrom left the whole suite
 * green, because every enumeration this slice performs is block-children and
 * block-children is unattested. The filter was doing nothing observable, and
 * `attestationOf(SEARCH)` returning `attested` bought nothing a test could see.
 *
 * No fixture can reach this branch — the port has three GETs and none of them
 * carries a completeness signal — so the manifest is built by hand. That is the
 * honest instrument here: the alternative is a fake endpoint that exists only to
 * be attested, which would test the fake.
 * ========================================================================= */

head('TEST 8 — the attested branch, reached by hand because no fixture can reach it');

const byHand = new Manifest();
byHand.mark({ id: ROOT, stage: 'enumerated', enumeration: { endpoint: SEARCH, attestation: 'attested' } });
byHand.mark({ id: PAGE_A, stage: 'enumerated', enumeration: { endpoint: BLOCK_CHILDREN, attestation: 'unattested' } });
byHand.mark({ id: PAGE_B, stage: 'enumerated' });

const handResiduals = residualsFrom(byHand);
check('exactly one residual, from the one unattested enumeration', handResiduals.length, 1);
check('  and it is the block-children one', handResiduals[0]?.resource, hyphenate(PAGE_A));
check('the ATTESTED enumeration produced none', handResiduals.some(x => x.resource === hyphenate(ROOT)), false);
check('the entry with NO enumeration produced none either', handResiduals.some(x => x.resource === hyphenate(PAGE_B)), false);
/* The two exclusions above have DIFFERENT reasons and must not be collapsed:
 * the root was enumerated by an endpoint that can vouch for its own
 * completeness, and PAGE_B was never enumerated by a call at all. A
 * residualsFrom that dropped either test would pass the other. */

finish(
  'The register discloses the frame; it does not measure it. Exit 0 over a filtered\n' +
  'child list is still exit 0 — ADR-0013 attaches the doubt to the byte and stops there.',
);
