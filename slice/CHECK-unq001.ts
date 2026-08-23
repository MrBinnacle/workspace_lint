/* The red test for T7 — UNQ001, issue #59.
 *
 *   npx tsx CHECK-unq001.ts
 *
 * No network, no .env, no token. The clock is injected and the Notion surface is
 * the shared fake in CHECK-fakes.ts.
 *
 * ⭐ THE DENOMINATOR IS WHAT THIS SUITE IS FOR. UNQ001's coverage item is an
 * unordered PAIR of resources (ADR-0011 decision 2), so `n` resources are
 * `n(n−1)/2` coverage items and ONE resource dropping out removes `n−1` of them.
 * ADR-0011 exists because collapsing a pair-shaped item into a resource-shaped
 * one had already shipped a `2/2 — 100%` figure over a root with three children.
 * TEST 2 is the assertion and TEST 3 prices its reversal.
 *
 * ⚠ THE FIXTURES USE FIVE MEMBERS, NOT THREE, AND THAT IS DELIBERATE. Three
 * resources are three pairs, so on a three-member scope a resource-shaped
 * denominator and a pair-shaped one print the same number — the collapse this
 * suite exists to catch is invisible at n=3. Five members are ten pairs and no
 * other reading of the fixture produces ten.
 *
 * NO ASSERTION BELOW READS A PROPERTY VALUE OUT OF A REPORT, because the rule
 * never puts one there. TEST 6 is the control for that and TEST 7 proves the
 * control is not substitutable.
 *
 * EVERY MUTATION IS SCORED ON THE EXIT CODE AND THE FIGURES, never by grepping
 * a rendered report for `FAIL`: a suite that crashes prints no `FAIL` at all,
 * and a mutation scored that way reads as green.
 */

import { createHarness, requiredSection } from './CHECK-harness.js';
import { scan, BUILT_RULES, UNQ001_SCOPE_CEILING, pairCount } from './scan.js';
import { renderReport } from './report.js';
import { hyphenate } from './ids.js';
import type { Rule } from './rule.js';
import type { Manifest } from './manifest.js';
import { UNQ001, UNQ001_ID, UNQ001_UNIT, collides, orderPair, unqPairKey } from './unq001.js';
import { PROPERTY_NAME_KEY } from './req001.js';
import {
  ROOT, DATASET, UNQ_1, UNQ_2, UNQ_3, UNQ_4, UNQ_5, UNSUPPORTED_PROP,
  cfgUnq, clock, fakePort, page, childPage, childDb, titleProp, titled, untitled, unqFixture,
  type FakeResource,
} from './CHECK-fakes.js';

const { check, head, finish } = createHarness();

const id = (raw: string): string => hyphenate(raw) ?? raw;

const run = (spec: Record<string, FakeResource>, scope: string, property = 'Title', minCoverage = 1.0, rules?: Rule[]) =>
  scan({ config: cfgUnq(scope, property, minCoverage), port: fakePort(spec), now: clock(), ...(rules ? { rules } : {}) });

type Run = Awaited<ReturnType<typeof scan>>;

/** UNQ001's row of the coverage vector, or null when the rule left the vector. */
const unqRow = (r: Run) => r.coverage.find(c => c.rule === UNQ001_ID) ?? null;
const unqFindings = (r: Run) => r.findings.filter(f => f.rule === UNQ001_ID);
const pairsIn = (m: Manifest) => m.of(UNQ001_UNIT);

/* THE ROOT IS ALWAYS A SCOPE MEMBER. `cfgUnq(ROOT, …)` selects the root and its
 * children, so a fixture with four children is a FIVE-member scope. Stated once
 * here because every count below depends on it and getting it wrong by one
 * changes ten pairs into six. */
const FIVE_DISTINCT = unqFixture('root title', [
  [UNQ_1, titled('alpha')],
  [UNQ_2, titled('beta')],
  [UNQ_3, titled('gamma')],
  [UNQ_4, titled('delta')],
]);

/* The five-identical-rows case from #59's live measurement: one automation
 * double-firing the same nudge. Five resources carrying one value. */
const FIVE_IDENTICAL = unqFixture('has gone quiet for 14+ days', [
  [UNQ_1, titled('has gone quiet for 14+ days')],
  [UNQ_2, titled('has gone quiet for 14+ days')],
  [UNQ_3, titled('has gone quiet for 14+ days')],
  [UNQ_4, titled('has gone quiet for 14+ days')],
]);

/* Exactly one colliding pair inside an otherwise clean five. */
const ONE_COLLIDING_PAIR = unqFixture('root title', [
  [UNQ_1, titled('shared')],
  [UNQ_2, titled('shared')],
  [UNQ_3, titled('gamma')],
  [UNQ_4, titled('delta')],
]);

/* =========================================================================
 * TEST 1 — the comparison predicate, asserted directly
 * ========================================================================= */

head('TEST 1 — `collides` is the whole predicate, and it is pure');

check('two equal strings collide', collides('alpha', 'alpha'), true);
check('two different strings do not', collides('alpha', 'beta'), false);
/* ⭐ DECISION 1, AT THE PREDICATE. Two empties are two absences of one value,
 * not one shared value, and the remedy differs: FILL THESE IN, not
 * DE-DUPLICATE THESE. `readProperty` renders an empty as a null comparable. */
check('two absent comparables do NOT collide — decision 1', collides(null, null), false);
check('  and a null never collides with a value', collides(null, 'alpha'), false);
check('  in either order', collides('alpha', null), false);
/* Trimming is readProperty's, so the predicate sees values already trimmed. */
check('comparison is NOT case-folded — ADR-0001 decision 4 rejects inferred policy',
  collides('Alpha', 'alpha'), false);

check('a pair is unordered, so orderPair is canonical', orderPair('b', 'a').join(','), 'a,b');
check('  and the key is the same whichever way round it is built',
  unqPairKey('b', 'a', 'Title') === unqPairKey('a', 'b', 'Title'), true);
console.log('  ^ `(A,B)` and `(B,A)` are ONE coverage item. Registering both would');
console.log('    double the denominator of the rule whose denominator is the thing');
console.log('    most likely to be got wrong.');

/* =========================================================================
 * TEST 2 — the denominator is QUADRATIC
 * ========================================================================= */

head('TEST 2 — five resources are TEN pairs, and one drop-out removes FOUR');

const clean = await run(FIVE_DISTINCT, ROOT);

check('the scope holds five resources', pairsIn(clean.manifest).length, 10);
check('  which is C(5,2), not 5', pairCount(5), 10);
check('  the applicable set is the pairs', unqRow(clean)?.applicable ?? -1, 10);
check('  every one of them was evaluated', unqRow(clean)?.evaluated ?? -1, 10);
check('  so the ratio is 1.0', unqRow(clean)?.ratio ?? -1, 1);
check('  and the unit printed alongside it names PAIRS', unqRow(clean)?.unit, UNQ001_UNIT);
check('no value repeats, so the rule conforms', clean.outcomes[UNQ001_ID]?.conformity, 'conforms');
check('  and reports no finding', unqFindings(clean).length, 0);

/* ⭐ ONE MEMBER DROPS OUT AND FOUR PAIRS GO WITH IT. This is the whole reason
 * ADR-0011 forbids a resource-shaped denominator: a resource-shaped figure
 * reads 4/5 = 80%, and the truth is 6/10 = 60%. */
const oneRefused = unqFixture('root title', [
  [UNQ_1, titled('alpha')],
  [UNQ_2, titled('beta')],
  [UNQ_3, titled('gamma')],
  [UNQ_4, { pageFail: { status: 429, code: 'rate_limited' } }],
]);
const dropped = await run(oneRefused, ROOT);

check('the applicable set is unchanged at ten', unqRow(dropped)?.applicable ?? -1, 10);
check('  ONE resource dropping out removed FOUR pairs, not one', unqRow(dropped)?.evaluated ?? -1, 6);
check('  so the ratio is 0.6, NOT the 0.8 a resource-shaped figure would print', unqRow(dropped)?.ratio ?? -1, 0.6);
check('  and the four lost pairs are gaps', dropped.gaps.filter(g => /property hydration failed/.test(g.cause)).length, 4);
check('  evidence sufficiency is unreached — the remedy is a wider grant', dropped.outcomes[UNQ001_ID]?.evidence, 'unreached');
console.log('  ^ CONTEXT.md records the consequence at scale: at 90% of resources read,');
console.log('    UNQ001 has evaluated 80.9% of the pairs it quantifies over. A run that');
console.log('    printed a resource-shaped percentage here is the collapse ADR-0011 stops.');

/* =========================================================================
 * TEST 3 — the reversal, priced
 * ========================================================================= */

head('TEST 3 — a resource-shaped denominator reads 80% where the truth is 60%');

/* THE MUTANT COUNTS RESOURCES. It is the collapse ADR-0011 exists to stop,
 * written out: `coverage` divides by the number of distinct resources in the
 * scope instead of by the pairs. Everything else about the rule is untouched.
 *
 * SUBSTITUTED INTO BUILT_RULES, not hardcoded beside one other rule, so the
 * mutant runs through the same scan the control did. */
const collapsed: Rule = {
  ...UNQ001,
  coverage(m, judged) {
    const resources = new Set<string>();
    let judgedResources = 0;
    for (const e of m.of(UNQ001_UNIT)) {
      if (!e.unq) continue;
      for (const p of e.unq.participants) resources.add(p);
    }
    for (const r of resources) {
      const touching = m.of(UNQ001_UNIT).filter(e => e.unq?.participants.includes(r));
      if (touching.some(e => judged.has(e.key))) judgedResources++;
    }
    return resources.size === 0
      ? null
      : { rule: UNQ001_ID, unit: UNQ001_UNIT, evaluated: judgedResources, applicable: resources.size, ratio: judgedResources / resources.size };
  },
};
const mutatedRules = BUILT_RULES.map(r => (r.id === UNQ001_ID ? collapsed : r));
check('the mutant swaps exactly one rule and keeps the rest', mutatedRules.length, BUILT_RULES.length);

const mutant = await run(oneRefused, ROOT, 'Title', 1.0, mutatedRules);

check('the control divides by pairs', `${unqRow(dropped)?.evaluated}/${unqRow(dropped)?.applicable}`, '6/10');
check('  the mutant divides by resources', `${unqRow(mutant)?.evaluated}/${unqRow(mutant)?.applicable}`, '4/4');
check('  the ratio moves 0.6 → 1', `${unqRow(dropped)?.ratio}→${unqRow(mutant)?.ratio}`, '0.6→1');
console.log('  ^ a mutation that changed NOTHING would mean TEST 2 measures nothing.');
console.log('    The mutant claims FULL coverage over a scope it could not read a');
console.log('    fifth of, and the byte it produces is a false green by construction.');

/* =========================================================================
 * TEST 4 — an empty value is not a value, AND it stays in the denominator
 * ========================================================================= */

head('TEST 4 — decision 1, in both halves');

/* TWO untitled members. Under the rejected reading they collide with each other
 * and the run reports a duplicate; under the settled reading they do not. */
const TWO_EMPTIES = unqFixture('root title', [
  [UNQ_1, untitled()],
  [UNQ_2, untitled()],
  [UNQ_3, titled('gamma')],
  [UNQ_4, titled('delta')],
]);
const empties = await run(TWO_EMPTIES, ROOT);

check('two empty values produce NO finding', unqFindings(empties).length, 0);
check('  and the rule conforms', empties.outcomes[UNQ001_ID]?.conformity, 'conforms');
/* ⭐ THE HALF THAT GETS DROPPED. The resources were READ and their pairs were
 * genuinely compared — the rule looked and found no shared value. Suppressing
 * the pairs instead would shrink the denominator to fit the answer. */
check('the pairs are STILL in the denominator', unqRow(empties)?.applicable ?? -1, 10);
check('  and still in the evaluated set — the comparison RAN', unqRow(empties)?.evaluated ?? -1, 10);
check('  so the ratio is 1.0, not 0.7', unqRow(empties)?.ratio ?? -1, 1);
check('  and evidence sufficiency is sufficient, not undecidable', empties.outcomes[UNQ001_ID]?.evidence, 'sufficient');
console.log('  ^ EMPTINESS CHANGES THE COMPARISON PREDICATE, NEVER THE COVERAGE');
console.log('    ARITHMETIC. REQ001 already reports present-and-empty as a violation,');
console.log('    so colliding the empties would be a second report of a defect the');
console.log('    product already names, under a rule whose remedy is wrong for it.');

/* The reversal: a rule that treats two empties as one shared value. */
const emptyCollides: Rule = {
  ...UNQ001,
  findingsFrom(m) {
    /* The collapse, written out: recompute the duplicate flag treating a null
     * comparable as a value equal to every other null. The manifest holds no
     * values, so the mutant asserts the collision over every unfilled pair —
     * which is exactly what the rejected reading produces. */
    return m
      .of(UNQ001_UNIT)
      .filter(e => e.unq && e.stages.has('fetched'))
      .map(e => ({
        rule: UNQ001_ID,
        anchor: { rule: UNQ001_ID, resource: e.unq!.participants[0] },
        discriminator: { [PROPERTY_NAME_KEY]: e.unq!.property },
        certainty: 'confirmed' as const,
        targetState: 'present' as const,
        bounded: true,
        isRootMiss: false,
        evidence: { object: e.unq!.participants[0], location: 'the collapsed predicate', observed: 'two absences read as one value', expected: 'a unique value' },
        link: null,
        source: null,
        anchorText: null,
        message: 'the collapsed predicate',
      }));
  },
};
const emptyMutant = await run(TWO_EMPTIES, ROOT, 'Title', 1.0, BUILT_RULES.map(r => (r.id === UNQ001_ID ? emptyCollides : r)));
check('the control reports no finding over two empties', unqFindings(empties).length, 0);
check('  the mutant reports ten', unqFindings(emptyMutant).length, 10);
check('  and the byte moves 0 → 1', `${empties.verdict.exit}→${emptyMutant.verdict.exit}`, '0→1');

/* =========================================================================
 * TEST 5 — five identical rows are FIVE findings over TEN pairs
 * ========================================================================= */

head('TEST 5 — decision 2: one finding per offending RESOURCE');

const five = await run(FIVE_IDENTICAL, ROOT);

/* ⭐ BOTH NUMBERS IN ONE TEST, because they are separate axes and the temptation
 * is to derive one from the other. ADR-0011 decision 2 fixes the coverage item
 * INDEPENDENTLY of finding granularity — which is why REQ001 anchors on a page
 * while counting pairs. #59's earlier comment said the denominator follows from
 * granularity; it does not, and that correction is on the ticket. */
check('FIVE findings — one per offending resource', unqFindings(five).length, 5);
check('  over TEN evaluated pairs', unqRow(five)?.evaluated ?? -1, 10);
check('  and both numbers are correct at once', `${unqFindings(five).length} findings / ${unqRow(five)?.applicable} pairs`, '5 findings / 10 pairs');
check('the rule violates', five.outcomes[UNQ001_ID]?.conformity, 'violates');

/* ADR-0010 decision 7: the anchor is (rule, PAGE), so five findings are five
 * distinct anchors and no two share one. */
const anchors = new Set(unqFindings(five).map(f => f.anchor.resource));
check('  five distinct anchors, one per participant', anchors.size, 5);
check('  and the anchor is a RESOURCE, never the pair', unqFindings(five).every(f => !f.anchor.resource.includes('+')), true);
check('  each names its four co-participants', unqFindings(five).every(f => /shared with 4 other resource\(s\)/.test(f.evidence.observed)), true);
check('  the matchkey hierarchy is REQ001\'s, per ADR-0010 decision 7',
  unqFindings(five).every(f => f.discriminator[PROPERTY_NAME_KEY] === 'Title'), true);
/* ⛔ THE CO-PARTICIPANTS ARE NOT A MATCHKEY. A discriminator listing them would
 * change the moment one duplicate is deleted, and every surviving finding would
 * read as `new` on the next run — the baseline churn ADR-0010 decision 1 exists
 * to prevent. */
check('  and the co-participants are NOT in the discriminator',
  unqFindings(five).every(f => !Object.values(f.discriminator).some(v => v.includes(id(UNQ_1)))), true);

/* One colliding pair inside a clean five: two findings, ten pairs, still. */
const one = await run(ONE_COLLIDING_PAIR, ROOT);
check('one colliding pair is TWO findings, not one and not ten', unqFindings(one).length, 2);
check('  still over ten pairs', unqRow(one)?.applicable ?? -1, 10);
check('  each naming exactly one co-participant', unqFindings(one).every(f => /shared with 1 other resource\(s\)/.test(f.evidence.observed)), true);

/* WHAT A BASELINE DOES WHEN ONE DUPLICATE IS DELETED — the statement #59 asks
 * for, executed rather than asserted in prose. Delete UNQ_2 from the fixture:
 * UNQ_1 is then unique and its finding is gone, and UNQ_2's anchor no longer
 * exists so its finding is gone too. Both resolve INDEPENDENTLY and no
 * transitive closure is taken over the group — the shape ADR-0010 decision 1
 * forbids and a group anchor would have invited. */
const afterDelete = await run(unqFixture('root title', [
  [UNQ_1, titled('shared')],
  [UNQ_3, titled('gamma')],
  [UNQ_4, titled('delta')],
]), ROOT);
check('deleting one duplicate resolves BOTH findings', unqFindings(afterDelete).length, 0);
check('  UNQ_1\'s finding is absent because it is now unique',
  unqFindings(afterDelete).some(f => f.anchor.resource === id(UNQ_1)), false);
check('  and the denominator falls to C(4,2)', unqRow(afterDelete)?.applicable ?? -1, 6);

/* =========================================================================
 * TEST 6 — the duplicated value appears on NO rendered line
 * ========================================================================= */

head('TEST 6 — hazard 2: the value is never printed, in any mode');

const SECRET = 'Acquisition-Target-Q4';
const secretRun = await run(unqFixture(SECRET, [
  [UNQ_1, titled(SECRET)],
  [UNQ_2, titled('beta')],
]), ROOT);

const redacted = renderReport(secretRun, {}).join('\n');
const shown = renderReport(secretRun, { showTitles: true }).join('\n');

check('the run DID find the duplicate', unqFindings(secretRun).length, 2);
/* ASSERTED OVER EVERY RENDERED LINE, NEVER OVER ONE SECTION. #42 shipped a
 * redaction hole that was green in the section it was asserted over and broken
 * four sections later, under a report claiming titles were redacted. */
check('the duplicated value appears on NO rendered line', redacted.includes(SECRET), false);
/* requiredSection, NOT reportSection: reportSection returns '' for a heading it
 * cannot find, and '' satisfies every negative assertion. */
check('  not in the manifest table', requiredSection(redacted, 'COVERAGE MANIFEST').includes(SECRET), false);
check('  not in the findings section', requiredSection(redacted, 'FINDINGS').includes(SECRET), false);
check('  and not in the call log', requiredSection(redacted, 'CALLS MADE (read-only)').includes(SECRET), false);
/* ⛔ INCLUDING UNDER --show-titles. That flag opens page TITLES, which are the
 * operator's own choice to reveal. A property VALUE the rule compared is not
 * the same thing and has no flag. */
check('and NOT under --show-titles either', shown.includes(SECRET), false);
check('the finding names the co-participant by ID instead, which is what the operator acts on',
  requiredSection(redacted, 'FINDINGS').includes(id(UNQ_1)), true);
check('  and the value is absent from the finding object itself',
  JSON.stringify(unqFindings(secretRun)).includes(SECRET), false);
check('  and from the manifest, which is where it would have to be to leak',
  JSON.stringify(pairsIn(secretRun.manifest).map(e => e.unq)).includes(SECRET), false);

/* =========================================================================
 * TEST 7 — the redaction control is not substitutable
 * ========================================================================= */

head('TEST 7 — a rule that stores the value proves TEST 6 is measuring something');

/* THE MUTANT PUTS THE VALUE ON THE FINDING. If TEST 6 were substitutable — if
 * it were passing because the report has no findings section, or because the
 * fixture's value never reaches the rule at all — this mutant would also pass
 * and the control would be worth nothing. */
const leaks: Rule = {
  ...UNQ001,
  findingsFrom(m, gaps) {
    return UNQ001.findingsFrom(m, gaps).map(f => ({
      ...f,
      message: `${f.message} — the shared value is "${SECRET}"`,
    }));
  },
};
const leaked = await run(unqFixture(SECRET, [[UNQ_1, titled(SECRET)], [UNQ_2, titled('beta')]]), ROOT, 'Title', 1.0,
  BUILT_RULES.map(r => (r.id === UNQ001_ID ? leaks : r)));
const leakedReport = renderReport(leaked, {}).join('\n');

check('the control keeps the value off every line', redacted.includes(SECRET), false);
check('  the mutant puts it on one', leakedReport.includes(SECRET), true);
check('  and it is in the FINDINGS section, where a reader would trust it',
  requiredSection(leakedReport, 'FINDINGS').includes(SECRET), true);
console.log('  ^ a control that passes with the mechanism bypassed tested nothing.');
console.log('    #42 printed a title into a call log four lines under a report');
console.log('    asserting titles were redacted; the report makes the guarantee');
console.log('    either way and the reader cannot tell.');

/* =========================================================================
 * TEST 8 — a scope above the ceiling is REFUSED, never degraded
 * ========================================================================= */

head('TEST 8 — the ceiling refuses rather than printing a resource-shaped figure');

/* `UNQ001_SCOPE_CEILING + 1` CHILDREN PLUS THE ROOT is two over, and one over
 * would be enough — the extra member is there so an off-by-one in the guard
 * cannot pass by accident in the direction that matters. */
const manyIds = Array.from({ length: UNQ001_SCOPE_CEILING }, (_, i) => (i + 1).toString(16).padStart(32, '0'));
const HUGE: Record<string, FakeResource> = {
  [ROOT]: { steps: [page(manyIds.map(x => childPage(x, 'a child')))], properties: { Title: titleProp('root title') } },
  ...Object.fromEntries(manyIds.map(x => [x, { steps: [page([])], properties: { Title: titleProp(`t-${x}`) } } as FakeResource])),
};
const refused = await run(HUGE, ROOT);

check('the run exits 4 — the scan did not run as declared', refused.verdict.exit, 4);
check('  and publishes NO coverage row for UNQ001', unqRow(refused), null);
check('  and no finding', unqFindings(refused).length, 0);
const refusalLine = refused.log.find(l => /UNQ001 REFUSED/.test(l)) ?? '';
check('the refusal names the scope size', /1,?001 resources/.test(refusalLine.replace(/ /g, '')), true);
check('  the pair count it would have materialised', /500,500/.test(refusalLine), true);
check('  and the ceiling it exceeded', new RegExp(String(UNQ001_SCOPE_CEILING)).test(refusalLine), true);
check('  and it says nothing was compared', /Nothing was compared/.test(refusalLine), true);
check('the arithmetic in the message is the arithmetic the rule uses', pairCount(1001), 500500);
console.log('  ^ silently switching to a resource-denominated figure at scale is the');
console.log('    false green this product exists to detect, and the one an operator');
console.log('    would be least able to see. The ceiling CANNOT be checked before the');
console.log('    traversal: a config declares a scope by ID and never by size.');

/* A scope AT the ceiling still runs. A guard that refused the boundary would be
 * an off-by-one nobody notices until the day a real scope sits on it. */
const atCeiling = await run({
  [ROOT]: { steps: [page(manyIds.slice(0, UNQ001_SCOPE_CEILING - 1).map(x => childPage(x, 'a child')))], properties: { Title: titleProp('root title') } },
  ...Object.fromEntries(manyIds.slice(0, UNQ001_SCOPE_CEILING - 1).map(x => [x, { steps: [page([])], properties: { Title: titleProp(`t-${x}`) } } as FakeResource])),
}, ROOT);
check('a scope AT the ceiling runs', atCeiling.verdict.exit !== 4, true);
check('  and materialises C(1000,2) pairs', unqRow(atCeiling)?.applicable ?? -1, pairCount(UNQ001_SCOPE_CEILING));

/* =========================================================================
 * TEST 9 — the three ways a member blocks a pair, and their three remedies
 * ========================================================================= */

head('TEST 9 — a blocked member is a gap, and which gap depends on how far it got');

/* A data source in scope. This build does not enumerate one, so its property was
 * never located: unreached, and never a defect in the workspace (#50). */
const withDataset = await run({
  [ROOT]: { steps: [page([childPage(UNQ_1, 'a child'), childDb(DATASET, 'wl-dataset')])], properties: { Title: titleProp('root title') } },
  [UNQ_1]: { steps: [page([])], properties: { Title: titleProp('alpha') } },
  [DATASET]: { steps: [page([])] },
}, ROOT);
check('a data source is a scope member, so its pairs are declared', unqRow(withDataset)?.applicable ?? -1, 3);
check('  and the two pairs touching it are gaps, never violations', unqRow(withDataset)?.evaluated ?? -1, 1);
check('  named as the data-source limitation', withDataset.gaps.some(g => /data-source ROW enumeration is not implemented/.test(g.cause)), true);
check('  evidence sufficiency is unreached', withDataset.outcomes[UNQ001_ID]?.evidence, 'unreached');

/* The property is in neither map: located nowhere, so unreached. */
const noSuchProperty = await run(FIVE_DISTINCT, ROOT, 'Owner');
check('a property no member carries makes every pair a gap', unqRow(noSuchProperty)?.evaluated ?? -1, 0);
check('  and names it as ungranted-or-undefined, which are one response',
  noSuchProperty.gaps.some(g => /property-not-in-map/.test(g.cause)), true);
check('  unreached — the remedy is a wider grant', noSuchProperty.outcomes[UNQ001_ID]?.evidence, 'unreached');
check('  and the rule reports NO conformity, because nothing was judged', noSuchProperty.outcomes[UNQ001_ID]?.conformity, null);

/* ⭐ LOCATED AND UNCOMPARABLE IS A DIFFERENT REMEDY. A number is a value REQ001
 * correctly calls present, and this build renders no comparable for it — see
 * `PropertyReading.comparable`. Neither a wider grant nor a re-run helps: the
 * rule has to learn the shape. That is `undecidable`, not `unreached`. */
const numeric = await run(unqFixture('root title', [
  [UNQ_1, { properties: { Title: { id: 'title', type: 'number', number: 7 } } }],
  [UNQ_2, { properties: { Title: { id: 'title', type: 'number', number: 7 } } }],
]), ROOT);
check('a value this build will not compare is a GAP, not a duplicate', unqFindings(numeric).length, 0);
check('  and it is undecidable, not unreached', numeric.outcomes[UNQ001_ID]?.evidence, 'undecidable');
check('  named as uncomparable rather than as missing',
  numeric.gaps.some(g => /property-shape-uncomparable/.test(g.cause)), true);
console.log('  ^ two nulls do not collide, so a build that compared numbers by');
console.log('    stringifying them would call 1.0 and 1 different and 1 and 1 the');
console.log('    same. It refuses instead, and discloses the refusal.');

/* ⭐ THE SITE THAT WOULD HAVE FAILED SILENTLY — issue #127.
 *
 * `unsupported` is the API declining to SEND a value. Before the fix it read as
 * `state: 'value'` with a null comparable, which is indistinguishable HERE from
 * the numeric case above — but the remedy is not the same, and neither is the
 * truth. A number is a value the page really holds and this build will not
 * compare. An `unsupported` payload is a value this build NEVER RECEIVED.
 *
 * ⛔ And the worse half: had the new state been added WITHOUT a branch here, an
 * `unexpressed` reading would have fallen past every guard into the final
 * `members.set({ ok: true, comparable: null })` and become an ORDINARY EMPTY
 * MEMBER — declared, compared, never colliding, and COUNTED AS EVALUATED.
 * TypeScript does not catch it: these are `if` guards, not an exhaustive switch.
 * That was verified by compiling the new union member with no branch and getting
 * a clean `tsc --noEmit`. */
const unexpressedUnq = await run(unqFixture('root title', [
  [UNQ_1, { properties: { Title: UNSUPPORTED_PROP } }],
  [UNQ_2, { properties: { Title: UNSUPPORTED_PROP } }],
]), ROOT);
check('a value the API never sent is a GAP, not a duplicate', unqFindings(unexpressedUnq).length, 0);
check('  and NOT an ordinary empty member — the pair is not evaluated', unqRow(unexpressedUnq)?.evaluated ?? -1, 0);
/* THREE, NOT ONE — the root is a scope member too, so C(3,2) = 3. Every pair
 * touches at least one member the API sent no value for, so all three are gaps
 * and none is dropped from the denominator. ADR-0005 decision 5. */
check('  the pairs are still DECLARED, so they stay in the denominator', unqRow(unexpressedUnq)?.applicable ?? -1, 3);
check('  named as unexpressed rather than as uncomparable or missing',
  unexpressedUnq.gaps.some(g => /property-value-unexpressed/.test(g.cause)), true);
/* The cause may never claim Notion failed to compute the value. */
check('  and it makes no claim about the vendor computing anything',
  unexpressedUnq.gaps.some(g => /property-value-unexpressed/.test(g.cause) && /comput/.test(g.cause)), false);
check('  undecidable — a wider grant does not help, and neither does a re-run',
  unexpressedUnq.outcomes[UNQ001_ID]?.evidence, 'undecidable');

/* =========================================================================
 * TEST 10 — a configured rule survives an early return
 * ========================================================================= */

head('TEST 10 — the scan can end before hydration, and the rule must still be in the report');

/* The root resolves and its child list is then never retrieved, so the scan
 * returns before the uniqueness stage runs. */
const endedEarly = await run({ [ROOT]: { steps: [], properties: { Title: titleProp('root title') } } }, ROOT);

check('UNQ001 still declares something', unqRow(endedEarly)?.applicable ?? -1, 1);
check('  it is a gap, not a judgement', unqRow(endedEarly)?.evaluated ?? -1, 0);
check('  and it names the reason the pairs were never listed',
  endedEarly.gaps.some(g => g.cause.startsWith('scan-ended-before-hydration')), true);
check('  so the rule does NOT leave the coverage vector', endedEarly.coverage.some(c => c.rule === UNQ001_ID), true);
/* ⚠ ONE ENTRY, NOT A GUESSED `C(n,2)`. The scope was never enumerated, so `n` is
 * unknown; a guessed count would put an invented number in a denominator. The
 * entry is the one place in the build where a pair-unit entry has no
 * participants, and it is disclosed rather than hidden. */
check('  and the placeholder carries NO participants, because none can be named',
  pairsIn(endedEarly.manifest).every(e => e.unq === null), true);
console.log('  ^ without this the run is byte-identical to one with no rule configured:');
console.log('    an empty applicable set leaves the vector (ADR-0011 decision 6) and the');
console.log('    floor the operator declared is silently never applied.');

/* A scope naming a resource the scan never enumerated. */
const badScope = await run(FIVE_DISTINCT, UNQ_5);
check('a scope outside the traversal is a gap, not an empty set', unqRow(badScope)?.applicable ?? -1, 1);
check('  named as not-enumerated', badScope.gaps.some(g => /scope-not-enumerated/.test(g.cause)), true);

/* =========================================================================
 * TEST 11 — one resource in scope is ZERO pairs, and the run says so
 * ========================================================================= */

head('TEST 11 — C(1,2) is zero, and a rule with nothing to count leaves the vector');

const alone = await run({ [ROOT]: { steps: [page([])], properties: { Title: titleProp('root title') } } }, ROOT);

check('a one-member scope has no pairs', pairsIn(alone.manifest).length, 0);
check('  so UNQ001 leaves the coverage vector — ADR-0011 decision 6', unqRow(alone), null);
check('  its conformity is ABSENT, never `conforms`', alone.outcomes[UNQ001_ID]?.conformity, null);
/* DISCLOSED. A configured rule producing no row looks exactly like a rule that
 * did not run, and the operator cannot tell the two apart from the report. */
check('and the run SAYS the scope had nothing to compare',
  alone.log.some(l => /holds ONE resource/.test(l)), true);

/* =========================================================================
 * TEST 12 — one page, one retrieve
 * ========================================================================= */

head('TEST 12 — a page in both rules\' scopes is retrieved ONCE');

const bothRules = await scan({
  config: {
    version: 1,
    roots: [{ id: ROOT, alias: 'wl-proof-fixture' }],
    minCoverage: 1.0,
    rules: [
      { rule: 'REQ001', scope: { id: ROOT }, property: 'Title' },
      { rule: 'UNQ001', scope: { id: ROOT }, property: 'Title' },
    ],
  },
  port: fakePort(unqFixture('root title', [[UNQ_1, titled('alpha')], [UNQ_2, titled('beta')]])),
  now: clock(),
});

check('both rules report a coverage row', bothRules.coverage.filter(c => c.rule === 'REQ001' || c.rule === UNQ001_ID).length, 2);
check('  and they count DIFFERENT nouns', new Set(bothRules.coverage.filter(c => c.rule === 'REQ001' || c.rule === UNQ001_ID).map(c => c.unit)).size, 2);
check('  REQ001 counts three (resource, property) pairs', bothRules.coverage.find(c => c.rule === 'REQ001')?.applicable ?? -1, 3);
check('  UNQ001 counts three resource pairs — the same number for different reasons', unqRow(bothRules)?.applicable ?? -1, 3);
check('GET /v1/pages ran ONCE for the shared page, not twice',
  bothRules.calls.filter(c => c.endpoint === `GET /v1/pages/${id(UNQ_1)}`).length, 1);
console.log('  ^ hydration map §1.4 puts both rules at page properties. UNQ001 runs');
console.log('    second and shares REQ001\'s cache; paying twice doubles the budget on');
console.log('    exactly the pages most likely to be in both scopes, under ~3 req/s.');
console.log('  ^ THREE AND THREE IS A COINCIDENCE OF THIS FIXTURE and the assertion');
console.log('    above is why both are written out: ADR-0011 decision 4 forbids');
console.log('    pooling them, and two equal numbers are the easiest pair to pool.');

finish('UNQ001 counts pairs, reports resources, and never prints the value it compared.');
