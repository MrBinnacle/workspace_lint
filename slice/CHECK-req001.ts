/* The red test for T6 — REQ001, issue #58.
 *
 *   npx tsx CHECK-req001.ts
 *
 * No network, no .env, no token. The clock is injected and the Notion surface is
 * the shared fake in CHECK-fakes.ts.
 *
 * WHAT THIS RULE TURNS ON, AND IT IS ONE MAPPING. A Notion page returns the
 * properties the integration can SEE. A property the connection was never
 * granted is absent from the map, and so is a property that was never defined,
 * and the API does not say which. So ONLY a property that is present and empty
 * is a violation.
 *
 * TEST 3 IS THAT ASSERTION AND TEST 9 PRICES ITS REVERSAL. Collapsing the two
 * observations reports a defect in the operator's workspace that is really a
 * defect in the grant — #58's hazard 1, and the single easiest thing to get
 * wrong in this rule. A control that can substitute for the mechanism under
 * test is not a control, so the mutant in TEST 9 is a rule that makes exactly
 * that collapse and the run is compared against it.
 *
 * NO ASSERTION BELOW READS A PROPERTY VALUE OUT OF A REPORT, because the rule
 * never puts one there. TEST 8 is the control for that.
 */

import { createHarness, requiredSection } from './CHECK-harness.js';
import { scan, BUILT_RULES } from './scan.js';
import { renderReport } from './report.js';
import { hyphenate } from './ids.js';
import { RESOURCES, type Entry } from './manifest.js';
import type { Rule } from './rule.js';
import {
  PROPERTY_ID_KEY, PROPERTY_NAME_KEY, REQ001, REQ001_ID, REQ001_UNIT, pairKey, readProperty,
} from './req001.js';
import {
  ROOT, PAGE_B, DATASET, PROP_ID_OWNER, UNREADABLE_PROP, UNSUPPORTED_PROP,
  cfgReq, clock, fakePort, richTextProp, titleProp,
  REQ_PRESENT_EMPTY, REQ_PRESENT_VALUE, REQ_ABSENT_FROM_MAP, REQ_NO_MAP,
  REQ_UNREADABLE_SHAPE, REQ_UNSUPPORTED_TYPE, REQ_PAGE_UNREACHABLE, REQ_WITH_DATASET,
} from './CHECK-fakes.js';

const { check, head, finish } = createHarness();

const id = (raw: string): string => hyphenate(raw) ?? raw;
const PAGE_B_ID = id(PAGE_B);
const ROOT_ID = id(ROOT);

const run = (spec: Parameters<typeof fakePort>[0], scope: string, property: string, minCoverage = 1.0, rules?: Rule[]) =>
  scan({ config: cfgReq(scope, property, minCoverage), port: fakePort(spec), now: clock(), ...(rules ? { rules } : {}) });

/** REQ001's row of the coverage vector, or null when the rule left the vector. */
const req001Row = (r: Awaited<ReturnType<typeof scan>>) => r.coverage.find(c => c.rule === REQ001_ID) ?? null;
const req001Findings = (r: Awaited<ReturnType<typeof scan>>) => r.findings.filter(f => f.rule === REQ001_ID);
const pairEntry = (r: Awaited<ReturnType<typeof scan>>, resource: string, property: string): Entry | undefined =>
  r.manifest.of(REQ001_UNIT).find(e => e.key === pairKey(resource, property));

/* =========================================================================
 * TEST 1 — present in the map and carrying no value is a VIOLATION
 * ========================================================================= */

head('TEST 1 — present in the map and carrying no value is a violation');

const empty = await run(REQ_PRESENT_EMPTY, PAGE_B, 'Owner');
const emptyFindings = req001Findings(empty);

check('one REQ001 finding', emptyFindings.length, 1);
check('  and it anchors on the PAGE, not on the pair', emptyFindings[0]?.anchor.resource ?? '', PAGE_B_ID);
check('  the scan proved it', emptyFindings[0]?.certainty ?? '', 'confirmed');
check('  over a resource it read', emptyFindings[0]?.targetState ?? '', 'present');
check('  the pair is named, so the missing item is countable', emptyFindings[0]?.bounded ?? false, true);
check('  and a property is never a declared root', emptyFindings[0]?.isRootMiss ?? true, false);

/* A VIOLATION IS NOT A GAP. The rule reached its judgement, so the pair is
 * evaluated and the coverage row is full — the report qualifies on findings
 * here, never on coverage. Conflating the two double-counts one defect. */
check('the pair still reaches evaluated', pairEntry(empty, PAGE_B_ID, 'Owner')?.stages.has('evaluated') ?? false, true);
check('  so coverage is 1/1, not 0/1', `${req001Row(empty)?.evaluated}/${req001Row(empty)?.applicable}`, '1/1');
check('  and the rule reports a proved defect', empty.outcomes[REQ001_ID]?.conformity ?? '', 'violates');
check('  with sufficient evidence behind it', empty.outcomes[REQ001_ID]?.evidence ?? '', 'sufficient');
/* `qualified` IS THE FINDING-BEARING DISPOSITION and there is no fourth value:
 * ADR-0005's axis is unqualified / qualified / disclaimed. What separates this
 * run from TEST 3's is the BYTE — a proved defect is 1, a coverage shortfall is
 * 3 — and the disposition is the same word for both. */
check('the report is qualified, which is what a finding makes it', empty.verdict.disposition, 'qualified');
check('  and the byte is 1, the proved-defect byte', empty.verdict.exit, 1);

/* =========================================================================
 * TEST 2 — present and carrying a value CONFORMS
 * ========================================================================= */

head('TEST 2 — present and carrying a value conforms, silently');

const filled = await run(REQ_PRESENT_VALUE, PAGE_B, 'Owner');

check('no REQ001 finding', req001Findings(filled).length, 0);
check('  the rule reached a judgement', filled.outcomes[REQ001_ID]?.conformity ?? '', 'conforms');
check('  on evidence it calls sufficient', filled.outcomes[REQ001_ID]?.evidence ?? '', 'sufficient');
check('  coverage is full', req001Row(filled)?.ratio ?? -1, 1);
check('  and the run is clean', filled.verdict.exit, 0);

/* =========================================================================
 * TEST 3 ⭐ — ABSENT FROM THE MAP IS A GAP, AND NEVER A VIOLATION
 * ========================================================================= */

head('TEST 3 — a property that is not in the map is a GAP, never a violation');

const absent = await run(REQ_ABSENT_FROM_MAP, PAGE_B, 'Owner');
const absentPair = pairEntry(absent, PAGE_B_ID, 'Owner');

check('NO REQ001 finding — the scan cannot tell undefined from ungranted', req001Findings(absent).length, 0);
check('  the map WAS read, and that fact is recorded', absentPair?.stages.has('resolved') ?? false, true);
check('  the property was NOT located in it', absentPair?.stages.has('enumerated') ?? true, false);
check('  so the pair carries a drop-out', absentPair?.loss !== null && absentPair?.loss !== undefined, true);
check('  with a specific, machine-readable cause', absentPair?.loss?.cause.startsWith('property-not-in-map') ?? false, true);
check('  bounded — the pair is named and counted', absentPair?.loss?.bounded ?? false, true);
check('  and the RESOURCE is present: it is the property that is missing', absentPair?.loss?.target ?? '', 'present');
check('the pair never reaches evaluated', absentPair?.stages.has('evaluated') ?? true, false);
check('  so it is in the gap set', absent.gaps.some(g => g.resource === pairKey(PAGE_B_ID, 'Owner')), true);
check('  and it LOWERS the ratio rather than leaving the denominator', `${req001Row(absent)?.evaluated}/${req001Row(absent)?.applicable}`, '0/1');
/* `=== null` RATHER THAN `?? fallback`: ADR-0005 decision 1 makes conformity
 * ABSENT here, and a nullish-coalescing assertion cannot tell absent from a
 * value it substituted for absent. */
check('conformity is ABSENT, not `conforms`', absent.outcomes[REQ001_ID]?.conformity === null, true);
check('  and the remedy named is access, not a rule change', absent.outcomes[REQ001_ID]?.evidence ?? '', 'unreached');
check('the byte is 3 — a coverage shortfall, not a violation', absent.verdict.exit, 3);
console.log('  ^ TEST 9 prices the reversal. Collapsing this row into TEST 1 reports a');
console.log('    defect in the workspace that is really a defect in the grant.');

/* =========================================================================
 * TEST 4 — hydration that never produced a map
 * ========================================================================= */

head('TEST 4 — no map, and no page: two different drop-outs, neither a violation');

const noMap = await run(REQ_NO_MAP, PAGE_B, 'Owner');
const noMapPair = pairEntry(noMap, PAGE_B_ID, 'Owner');

check('no finding when the response carried no properties map', req001Findings(noMap).length, 0);
check('  the map was never read', noMapPair?.stages.has('resolved') ?? true, false);
check('  the cause names hydration, not the workspace', noMapPair?.loss?.cause.startsWith('property hydration incomplete') ?? false, true);
check('  and the PAGE itself was present — it is the map that was not', noMapPair?.loss?.target ?? '', 'present');

const refused = await run(REQ_PAGE_UNREACHABLE, PAGE_B, 'Owner');
const refusedPair = pairEntry(refused, PAGE_B_ID, 'Owner');

check('no finding when the page itself was refused', req001Findings(refused).length, 0);
check('  the cause carries the port\'s own status', refusedPair?.loss?.cause.includes('429') ?? false, true);
check('  and the target is UNREACHABLE, never present', refusedPair?.loss?.target ?? '', 'unreachable');
check('  a 429 is a gap, so the byte is 3 and not 1', refused.verdict.exit, 3);

/* =========================================================================
 * TEST 5 — a value shape this build cannot read
 * ========================================================================= */

head('TEST 5 — located but unreadable is undecidable, and still not a violation');

const unreadable = await run(REQ_UNREADABLE_SHAPE, PAGE_B, 'Owner');
const unreadablePair = pairEntry(unreadable, PAGE_B_ID, 'Owner');

check('no finding for a property whose value cannot be read', req001Findings(unreadable).length, 0);
check('  it WAS located, which is what separates it from TEST 3', unreadablePair?.stages.has('enumerated') ?? false, true);
check('  the cause says the build is short, not the page', unreadablePair?.loss?.cause.startsWith('property-shape-unread') ?? false, true);
check('  and the remedy is a rule change, not more access', unreadable.outcomes[REQ001_ID]?.evidence ?? '', 'undecidable');

/* =========================================================================
 * TEST 5b — the API returned the property and sent no value (#127)
 * ========================================================================= */

head('TEST 5b — "unsupported" is the API declining to SEND a value, not the page lacking one');

const unexpressed = await run(REQ_UNSUPPORTED_TYPE, PAGE_B, 'Owner');
const unexpressedPair = pairEntry(unexpressed, PAGE_B_ID, 'Owner');

check('no finding — the scan never read the value, so it claims nothing either way', req001Findings(unexpressed).length, 0);
check('  it WAS located, which separates it from TEST 3', unexpressedPair?.stages.has('enumerated') ?? false, true);
check('  the cause names the representation, not the workspace', unexpressedPair?.loss?.cause.startsWith('property-value-unexpressed') ?? false, true);
/* ⛔ THE CAUSE MAY NEVER CLAIM NOTION COULD NOT COMPUTE THE VALUE. `unsupported`
 * is a statement about what the REST representation carries; the value very
 * likely exists and renders in the UI. Asserted rather than trusted, because the
 * first draft of #127 made exactly this error and the operator caught it. */
check('  and it does NOT claim the value could not be computed', unexpressedPair?.loss?.cause.includes('comput') ?? true, false);
check('  bounded — the pair is named and counted', unexpressedPair?.loss?.bounded ?? false, true);
check('  the RESOURCE is present; it is the value that was not sent', unexpressedPair?.loss?.target ?? '', 'present');

/* ⭐ THE REGRESSION THIS TICKET IS ABOUT. Before the fix the pair reached
 * `fetched`, was judged, and counted toward the evaluated set — a judgement over
 * a value nobody read, and an inflated numerator under ADR-0011. */
check('the pair never reaches evaluated', unexpressedPair?.stages.has('evaluated') ?? true, false);
check('  so it LOWERS the ratio rather than inflating it', `${req001Row(unexpressed)?.evaluated}/${req001Row(unexpressed)?.applicable}`, '0/1');
check('  conformity is ABSENT, never `conforms`', unexpressed.outcomes[REQ001_ID]?.conformity === null, true);
check('  the byte is 3 — a coverage shortfall, not a violation', unexpressed.verdict.exit, 3);

/* THE MUTATION, scored on the reader's own verdict rather than on a printed
 * string — a crashed suite prints no FAIL. Restoring the old behaviour means
 * reading `unsupported` as a value; if that still produced a gap, this branch
 * would be dead code rather than a fix. */
const mutantReading = readProperty({ Owner: { id: 'p', type: 'select', select: {} } }, 'Owner');
check('MUTATION — a NON-unsupported object payload still reads as a value', mutantReading.state, 'value');
check('  so the new state is keyed on the type name and nothing else',
  readProperty({ Owner: UNSUPPORTED_PROP }, 'Owner').state === mutantReading.state, false);

/* The reader itself, at its own seam. Each row is one observation. */
check('readProperty — an unsupported type is unexpressed', readProperty({ Owner: UNSUPPORTED_PROP }, 'Owner').state, 'unexpressed');
check('readProperty — and the property ID still comes back with it',
  (r => (r.state === 'absent' ? '' : r.propertyId ?? ''))(readProperty({ Owner: UNSUPPORTED_PROP }, 'Owner')), PROP_ID_OWNER);
check('readProperty — "unsupported" WITHOUT its key is unreadable, not unexpressed',
  readProperty({ Owner: { id: 'p', type: 'unsupported' } }, 'Owner').state, 'unreadable');
check('readProperty — a missing key is absent', readProperty({}, 'Owner').state, 'absent');
check('readProperty — an empty rich_text is empty', readProperty({ Owner: richTextProp('') }, 'Owner').state, 'empty');
check('readProperty — a filled rich_text is a value', readProperty({ Owner: richTextProp('x') }, 'Owner').state, 'value');
check('readProperty — a blank span is empty, not a value', readProperty({ Owner: { id: 'p', type: 'rich_text', rich_text: [{ plain_text: '   ' }] } }, 'Owner').state, 'empty');
check('readProperty — a null payload is empty', readProperty({ Owner: { id: 'p', type: 'select', select: null } }, 'Owner').state, 'empty');
check('readProperty — an unchecked checkbox is a VALUE, not an absence', readProperty({ Owner: { id: 'p', type: 'checkbox', checkbox: false } }, 'Owner').state, 'value');
check('readProperty — zero is a VALUE', readProperty({ Owner: { id: 'p', type: 'number', number: 0 } }, 'Owner').state, 'value');
check('readProperty — a blank string is empty', readProperty({ Owner: { id: 'p', type: 'url', url: '  ' } }, 'Owner').state, 'empty');
check('readProperty — a value with no type key is unreadable', readProperty({ Owner: UNREADABLE_PROP }, 'Owner').state, 'unreadable');
check('readProperty — a non-object property is unreadable', readProperty({ Owner: 'a bare string' }, 'Owner').state, 'unreadable');
const emptyReading = readProperty({ Owner: richTextProp('') }, 'Owner');
check('readProperty — the ID is read off the value', emptyReading.state === 'absent' ? '' : emptyReading.propertyId ?? '', PROP_ID_OWNER);

/* =========================================================================
 * TEST 6 — scope selects a subtree, and what it cannot select is disclosed
 * ========================================================================= */

head('TEST 6 — scope, and the three things it can select');

const wholeTree = await run(REQ_PRESENT_VALUE, ROOT, 'Owner');
check('a root scope selects the root AND its children', req001Row(wholeTree)?.applicable ?? -1, 2);
check('  the root is one of the pairs', pairEntry(wholeTree, ROOT_ID, 'Owner') !== undefined, true);
check('  the child is the other', pairEntry(wholeTree, PAGE_B_ID, 'Owner') !== undefined, true);
check('  and the root costs NO second retrieve — its map came with the traversal',
  wholeTree.calls.filter(c => c.endpoint === `GET /v1/pages/${ROOT_ID}`).length, 0);

const childScope = await run(REQ_PRESENT_VALUE, PAGE_B, 'Owner');
check('a child scope selects that child alone', req001Row(childScope)?.applicable ?? -1, 1);

const dataset = await run(REQ_WITH_DATASET, ROOT, 'Owner');
const datasetPair = pairEntry(dataset, id(DATASET), 'Owner');
check('a data source under the scope is IN the denominator', datasetPair !== undefined, true);
check('  as a gap with the named cause, never an applicability filter (#50)',
  datasetPair?.loss?.cause.startsWith('data-source ROW enumeration is not implemented') ?? false, true);
check('  so the ratio falls rather than reading 1.0 over what the tool can do',
  `${req001Row(dataset)?.evaluated}/${req001Row(dataset)?.applicable}`, '2/3');

const offTree = await run(REQ_PRESENT_VALUE, '9999999999994999a999999999999999', 'Owner');
check('a scope this scan never enumerated is ONE pair and a gap', req001Row(offTree)?.applicable ?? -1, 1);
check('  it is not silently zero pairs, which would report 1.0 over nothing', req001Row(offTree)?.evaluated ?? -1, 0);
check('  and it names why', offTree.gaps.some(g => g.cause.startsWith('scope-not-enumerated')), true);

/* =========================================================================
 * TEST 7 — identity is ADR-0010 decision 7, and it has TWO keys
 * ========================================================================= */

head('TEST 7 — the anchor is the page and the matchkey hierarchy has two keys');

const twoProps = await scan({
  config: {
    version: 1, roots: [{ id: ROOT, alias: 'wl-proof-fixture' }], minCoverage: 1.0,
    rules: [
      { rule: 'REQ001', scope: { id: PAGE_B }, property: 'Owner' },
      { rule: 'REQ001', scope: { id: PAGE_B }, property: 'Status' },
    ],
  },
  port: fakePort({
    [ROOT]: { steps: [{ results: [{ object: 'block', id: PAGE_B, type: 'child_page', child_page: { title: 'wl-revoke-parent' } }], has_more: false, next_cursor: null }], properties: { Title: titleProp('wl-proof-fixture') } },
    [PAGE_B]: { steps: [{ results: [], has_more: false, next_cursor: null }], properties: { Owner: richTextProp('', 'ZZ%3D'), Status: richTextProp('', 'AA%3D') } },
  }),
  now: clock(),
});
const twoFindings = req001Findings(twoProps);

check('two required properties on one page are two findings', twoFindings.length, 2);
check('  and they share one anchor, because the anchor is the PAGE',
  twoFindings[0]?.anchor.resource === twoFindings[1]?.anchor.resource, true);
check('  the discriminator carries the property NAME', twoFindings[0]?.discriminator[PROPERTY_NAME_KEY] ?? '', 'Status');
check('  and the property ID observed on the response', twoFindings[0]?.discriminator[PROPERTY_ID_KEY] ?? '', 'AA%3D');
check('  the order is property ID ASCENDING, per decision 7',
  `${twoFindings[0]?.discriminator[PROPERTY_ID_KEY]},${twoFindings[1]?.discriminator[PROPERTY_ID_KEY]}`, 'AA%3D,ZZ%3D');

/* ADR-0010 decision 6: no matchkey holds the observed value. Here there is
 * nothing to hold — the rule stores that a value was absent, never what it
 * was — and the assertion states the property rather than trusting it. */
const keys = Object.keys(twoFindings[0]?.discriminator ?? {});
check('the discriminator has exactly the two keys the ADR lists', keys.sort().join(','), `${PROPERTY_ID_KEY},${PROPERTY_NAME_KEY}`);

/* A page and a pair ABOUT that page are two entries in two coverage items. On a
 * bare key they collide and one silently deletes the other, which is the
 * flattering direction because the deleted one is a drop-out. */
check('the pair key does not collide with the resource key',
  empty.manifest.of(RESOURCES).some(e => e.key === pairKey(PAGE_B_ID, 'Owner')), false);
check('  and the pair unit is its own noun', req001Row(empty)?.unit ?? '', 'resource–property pairs');

/* =========================================================================
 * TEST 8 — the report prints the property NAME and never its VALUE
 * ========================================================================= */

head('TEST 8 — redaction, asserted over every rendered line');

const secret = 'MY-SECRET-OWNER-NAME';
const leaky = await run({
  [ROOT]: { steps: [{ results: [{ object: 'block', id: PAGE_B, type: 'child_page', child_page: { title: 'wl-revoke-parent' } }], has_more: false, next_cursor: null }], properties: { Title: titleProp('wl-proof-fixture') } },
  [PAGE_B]: { steps: [{ results: [], has_more: false, next_cursor: null }], properties: { Owner: richTextProp(''), Leak: richTextProp(secret) } },
}, PAGE_B, 'Owner');
const rendered = renderReport(leaky, { showTitles: false }).join('\n');

check('the report names the required property', rendered.includes('"Owner"'), true);
check('  and the value of a DIFFERENT property never reaches the report', rendered.includes(secret), false);
/* requiredSection throws rather than passing vacuously if the heading moves. */
check('  the FINDINGS section carries the property name', requiredSection(rendered, 'FINDINGS').includes('Owner'), true);
check('  and no property value at all', requiredSection(rendered, 'FINDINGS').includes(secret), false);

/* =========================================================================
 * TEST 9 — the mutation, and what the reversal costs
 * ========================================================================= */

head('TEST 9 — collapsing the mapping is observable, so TEST 3 is a control');

/* THE MUTANT MAKES EXACTLY ONE CHANGE: it drops the drop-out test from
 * `judgeable`, so a property that is absent from the map becomes a judged pair
 * carrying no value — which is TEST 1's violation. Everything else, including
 * the coverage row and the outcome pair, is REQ001's own. */
const collapsed: Rule = {
  ...REQ001,
  /* Judgeable on the map having been READ, with no test for a drop-out — the
   * one-line difference that makes "not in the map" indistinguishable from
   * "in the map and empty". */
  judge(m) {
    const judged = new Set<string>();
    for (const e of m.of(REQ001_UNIT)) if (e.stages.has('resolved')) judged.add(e.key);
    return judged;
  },
  findingsFrom(m) {
    return m
      .of(REQ001_UNIT)
      .filter(e => e.stages.has('resolved') && !e.stages.has('fetched'))
      .map(e => ({
        rule: REQ001_ID,
        anchor: { rule: REQ001_ID, resource: e.req?.resource ?? e.key },
        discriminator: { [PROPERTY_NAME_KEY]: e.req?.property ?? '' },
        certainty: 'confirmed' as const,
        targetState: 'present' as const,
        bounded: true,
        isRootMiss: false,
        evidence: { object: e.req?.resource ?? e.key, location: 'the collapsed mapping', observed: 'no value', expected: 'a property carrying a value' },
        link: null,
        source: null,
        anchorText: null,
        message: `required property "${e.req?.property ?? ''}" is present and carries no value`,
      }));
  },
};
const mutatedRules = BUILT_RULES.map(r => (r.id === REQ001_ID ? collapsed : r));
check('the mutant swaps exactly one rule and keeps the rest', mutatedRules.length, BUILT_RULES.length);

const mutant = await run(REQ_ABSENT_FROM_MAP, PAGE_B, 'Owner', 1.0, mutatedRules);

check('the control reports NO violation on an absent property', req001Findings(absent).length, 0);
check('  the mutant reports one', req001Findings(mutant).length, 1);
check('  the byte moves 3 → 1', `${absent.verdict.exit}→${mutant.verdict.exit}`, '3→1');
/* THE DISPOSITION DOES NOT MOVE, and that is worth asserting rather than
 * omitting. Both runs are `qualified` — one by a gap, one by a violation — so
 * an operator reading the disposition alone cannot see the reversal at all.
 * The byte and the finding list are what carry it. */
check('  the disposition does NOT move, so it is not where the reversal shows', `${absent.verdict.disposition}→${mutant.verdict.disposition}`, 'qualified→qualified');
check('  the coverage row moves 0/1 → 1/1', `${req001Row(absent)?.ratio}→${req001Row(mutant)?.ratio}`, '0→1');
console.log('  ^ a mutation that changed nothing would mean TEST 3 measures nothing.');
console.log('    The reversal reports a defect in the operator\'s workspace that is');
console.log('    really a defect in the grant, and it reports it as PROVED.');

/* =========================================================================
 * TEST 10 — a configured rule survives an early return
 * ========================================================================= */

head('TEST 10 — the scan can end before hydration, and the rule must still be in the report');

/* The root resolves and its child list is then never retrieved, so the scan
 * returns before the hydration stage runs. */
const endedEarly = await run({ [ROOT]: { steps: [], properties: { Title: titleProp('wl-proof-fixture') } } }, ROOT, 'Owner');

check('REQ001 still declares a pair', req001Row(endedEarly)?.applicable ?? -1, 1);
check('  it is a gap, not a judgement', req001Row(endedEarly)?.evaluated ?? -1, 0);
check('  and it names the reason the pairs were never listed',
  endedEarly.gaps.some(g => g.cause.startsWith('scan-ended-before-hydration')), true);
check('  so the rule does NOT leave the coverage vector', endedEarly.coverage.some(c => c.rule === REQ001_ID), true);
console.log('  ^ without this the run is byte-identical to one with no rule configured:');
console.log('    an empty applicable set leaves the vector (ADR-0011 decision 6) and the');
console.log('    floor the operator declared is silently never applied.');

/* =========================================================================
 * TEST 11 — a property named after something on Object.prototype
 * ========================================================================= */

head('TEST 11 — `constructor` is not a property this page has');

for (const inherited of ['constructor', 'toString', 'valueOf', 'hasOwnProperty']) {
  check(`readProperty — "${inherited}" is ABSENT, not located`, readProperty({}, inherited).state, 'absent');
}
console.log('  ^ `in` walks the prototype chain, so each of these was reported as present');
console.log('    and unreadable — the wrong remedy: "extend the rule" for a property');
console.log('    that is simply not there.');

/* =========================================================================
 * TEST 12 — one page, one retrieve
 * ========================================================================= */

head('TEST 12 — a page that is both a link target and in scope is retrieved ONCE');

const alsoLinked = await run({
  [ROOT]: {
    steps: [{
      results: [
        { object: 'block', id: 'block-link', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: 'link' }, href: `https://app.notion.com/p/${PAGE_B}` }] } },
        { object: 'block', id: PAGE_B, type: 'child_page', child_page: { title: 'wl-revoke-parent' } },
      ],
      has_more: false, next_cursor: null,
    }],
    properties: { Title: titleProp('wl-proof-fixture') },
  },
  [PAGE_B]: { steps: [{ results: [], has_more: false, next_cursor: null }], properties: { Title: titleProp('wl-revoke-parent'), Owner: richTextProp('a name') } },
}, PAGE_B, 'Owner');

check('the reference resolved and the pair was judged', req001Row(alsoLinked)?.ratio ?? -1, 1);
check('  and GET /v1/pages ran ONCE for that page, not twice',
  alsoLinked.calls.filter(c => c.endpoint === `GET /v1/pages/${PAGE_B_ID}`).length, 1);
console.log('  ^ REF001 already had the response. Throwing its properties away and');
console.log('    paying for them again doubles the budget on exactly the pages most');
console.log('    likely to be in scope, under a ~3 req/s ceiling.');

finish('REQ001 reports a property it read and found empty. It never reports one it could not see.');
