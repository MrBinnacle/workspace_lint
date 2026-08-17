/* The red test for T2 — SYS001, issue #43, spec docs/spec/v0.1-scan-slice.md §4.
 *
 *   npx tsx CHECK-sys001.ts
 *
 * No network, no .env, no token. The clock is injected and the Notion surface is
 * the shared fake in CHECK-fakes.ts.
 *
 * THREE OF THESE TESTS ARE MUTATION CHECKS AND THEY ARE THE POINT OF THE FILE.
 * A control that passes with its mechanism bypassed tested nothing (spec §4.1).
 * Each one disables a different load-bearing clause and asserts the result moves:
 *
 *   TEST 4 — remove the FINDINGS from the verdict input; the byte must go 1 → 0.
 *            This is the line #43 was warned about: T1 passed
 *            `newUnsuppressedFindings: 0` explicitly, and leaving it at 0 makes a
 *            run with unsuppressed findings exit 0 whenever coverage clears the
 *            threshold. Nothing else in either suite would have caught it.
 *   TEST 5 — remove the drop-out-cause clause from `judgeable`; the disposition
 *            must fall from `disclaimed` to `qualified` and the byte from 2 to 3.
 *   TEST 7 — feed a gap naming a resource the manifest does not hold; the rule
 *            must report the disagreement instead of defaulting around it.
 */

import { scan } from './scan.js';
import { renderReport } from './report.js';
import { hyphenate } from './ids.js';
import { anchorFor, anchorKey, headlineCoverage } from './finding.js';
import { SYS001, SYS001_ID, SYS001_UNIT, DROPOUT_STAGE_KEY, lastStage, type Sys001Rule } from './sys001.js';
import type { Entry, Manifest } from './manifest.js';
import type { Finding } from './finding.js';
import {
  ROOT, PAGE_A, PAGE_B, DATASET,
  cfg, clock, fakePort, THREE_CHILDREN, MIDSTREAM,
} from './CHECK-fakes.js';

let fails = 0;
const check = (name: string, got: unknown, want: unknown) => {
  const ok = String(got) === String(want);
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: got=${got} want=${want}`);
};
const head = (s: string) => console.log(`\n== ${s} ==`);

const findingFor = (fs: Finding[], id: string) => fs.find(f => f.anchor.resource === hyphenate(id));

/* =========================================================================
 * TEST 1 — one finding per gap, and identity is the two-layer anchor
 * ========================================================================= */

head('TEST 1 — SYS001 emits one finding per applicable resource that left the funnel unevaluated');

const r1 = await scan({ config: cfg(), port: fakePort(THREE_CHILDREN), now: clock() });

check('the applicable set is still 4 resources', r1.verdict.applicable, 4);
check('three resources were evaluated', r1.verdict.evaluated, 3);
check('one gap remains — the data source', r1.gaps.length, 1);
check('and there is exactly one finding for it', r1.findings.length, 1);
check('  one finding per gap, never one per resource in the manifest', r1.findings.length, r1.gaps.length);

const fDataset = findingFor(r1.findings, DATASET)!;
check('the finding names SYS001', fDataset.rule, SYS001_ID);
check('  and anchors on (rule ID, resource ID) — ADR-0010 decision 1', anchorKey(fDataset.anchor), `SYS001:${hyphenate(DATASET)}`);
check('  the resource ID is the HYPHENATED native ID', fDataset.anchor.resource, '5db3573f-8cf6-a332-afe7-fee0d11db964');
check('  the evaluated resources produce NO finding', findingFor(r1.findings, PAGE_A) === undefined, true);

/* The normalization is a correctness requirement, not tidiness: a bare ID from a
 * config file and a hyphenated one from an API response are one resource, and
 * two string forms would make two buckets and report every finding as new. */
check('a bare 32-hex ID normalizes to the same anchor', anchorKey(anchorFor(SYS001_ID, DATASET)), anchorKey(fDataset.anchor));
check('  and so does an upper-case hyphenated one', anchorKey(anchorFor(SYS001_ID, '5DB3573F-8CF6-A332-AFE7-FEE0D11DB964')), anchorKey(fDataset.anchor));

const r1b = await scan({ config: cfg(), port: fakePort(THREE_CHILDREN), now: clock() });
check('the anchor is stable across two runs of an unchanged workspace',
  r1b.findings.map(f => anchorKey(f.anchor)).join(','), r1.findings.map(f => anchorKey(f.anchor)).join(','));

check('the discriminator names the drop-out stage', fDataset.discriminator[DROPOUT_STAGE_KEY], 'enumerated');
/* ADR-0010 decision 6: no matchkey holds the observed value. The cause IS the
 * observed value here, so its presence in a key would be the defect that makes
 * `updated` unreachable — every key changing at once when the evidence changes. */
check('  and no matchkey carries the observed value',
  Object.values(fDataset.discriminator).some(v => fDataset.evidence.observed.includes(v)), false);

/* =========================================================================
 * TEST 2 — the coverage item is RESOURCES, and no figure prints without its unit
 * ========================================================================= */

head('TEST 2 — the vector has one row, over resources, and the headline is its minimum');

check('the vector holds one row — one rule', r1.coverage.length, 1);
check('  the rule is SYS001', r1.coverage[0]!.rule, SYS001_ID);
check('  its coverage item is resources (ADR-0011 decision 2)', r1.coverage[0]!.unit, SYS001_UNIT);
check('  and the row reads 3/4', `${r1.coverage[0]!.evaluated}/${r1.coverage[0]!.applicable}`, '3/4');
check('the headline is the MINIMUM over the vector, never a mean', headlineCoverage(r1.coverage)!.ratio, 0.75);

const rendered = renderReport(r1, {}).join('\n');
check('the report prints the vector', /coverage vector:/.test(rendered), true);
check('  and the headline names the rule that set it', /headline:.*SYS001/.test(rendered), true);
check('  and the empty-vector line of T1 is gone', /EMPTY — this slice implements no rule/.test(rendered), false);

/* Spec criterion 6: "no figure is printed without its unit named." Checked over
 * EVERY rendered line rather than the coverage section alone — the redaction
 * control failed in exactly that way on the first live run, green in the section
 * it was asserted over and broken four sections later. */
const UNIT_WORDS = /resources|references|rules|blocks|pages|ms|requests/;
const bareRatios = rendered.split('\n').filter(l => /\d+\/\d+/.test(l) && !UNIT_WORDS.test(l));
check('no line prints a ratio without naming its unit', bareRatios.join(' | '), '');

/* =========================================================================
 * TEST 3 — the outcome is a PAIR, and conformity is absent on an empty evaluated set
 * ========================================================================= */

head('TEST 3 — conformity × evidence sufficiency, never a single value');

check('conformity is violates — a resource was not evaluated', r1.outcomes[SYS001_ID]!.conformity, 'violates');
check('evidence is unreached — an applicable resource was never fetched', r1.outcomes[SYS001_ID]!.evidence, 'unreached');

const rRootGone = await scan({ config: cfg(), port: fakePort({}), now: clock() });
check('an unreachable declared root evaluates nothing', rRootGone.verdict.evaluated, 0);
check('  so conformity is ABSENT, not a third enum value (ADR-0005 decision 1)', rRootGone.outcomes[SYS001_ID]!.conformity, null);
check('  and the report says so rather than printing a verdict', /conformity ABSENT/.test(renderReport(rRootGone, {}).join('\n')), true);
check('  the finding still exists — a disclaimed report still prints its findings', rRootGone.findings.length, 1);
check('  it is flagged as the declared-root miss', rRootGone.findings[0]!.isRootMiss, true);
check('  certainty is confirmed: non-evaluation is a proved fact', rRootGone.findings[0]!.certainty, 'confirmed');
check('  target state is unreachable, never absent (Principle 3)', rRootGone.findings[0]!.targetState, 'unreachable');
console.log('  ^ confirmed about an unreachable target. Collapsing the two axes makes this inexpressible.');

const rMid = await scan({ config: cfg(), port: fakePort(MIDSTREAM), now: clock() });
check('a truncated enumeration leaves every resource fetched', rMid.manifest.all().every((e: Entry) => e.stages.has('fetched')), true);
check('  so evidence is undecidable, not unreached', rMid.outcomes[SYS001_ID]!.evidence, 'undecidable');
check('  and the finding is UNBOUNDED — the remainder cannot be named', findingFor(rMid.findings, ROOT)!.bounded, false);
check('the data source finding IS bounded — the resource is named and counted', fDataset.bounded, true);
check('  and its target state is present — the block was seen', fDataset.targetState, 'present');

/* =========================================================================
 * TEST 4 — MUTATION CHECK: the findings must reach the exit byte
 * ========================================================================= */

head('TEST 4 — MUTATION CHECK: remove the findings from the verdict and the byte MUST go green');

/* minCoverage 0.5 puts coverage (0.75 resources) ABOVE the declared threshold,
 * which is the only configuration where the finding count decides the byte.
 * At the default 1.0 the exit-3 coverage condition fires first and hides it. */
const lenient = cfg(ROOT, 0.5);
const control4 = await scan({ config: lenient, port: fakePort(THREE_CHILDREN), now: clock() });

check('coverage 0.75 resources clears the declared threshold 0.5', control4.verdict.coverage >= 0.5, true);
check('gaps still exist and the report is qualified', control4.verdict.disposition, 'qualified');
check('EXIT 1 — a finding is new and unsuppressed', control4.verdict.exit, 1);

const noReport: Sys001Rule = { ...SYS001, report: () => [] };
const mutated4 = await scan({ config: lenient, port: fakePort(THREE_CHILDREN), now: clock(), rule: noReport });
check('with the findings removed the byte is 0', mutated4.verdict.exit, 0);
check('the mutation moved the byte', control4.verdict.exit !== mutated4.verdict.exit, true);
check('  and the coverage figure is unchanged by it', mutated4.coverage[0]!.ratio, control4.coverage[0]!.ratio);

console.log('  ^ THIS is the line #43 was warned about. T1 passed newUnsuppressedFindings: 0');
console.log('    explicitly and correctly. Left at 0, this run exits 0 while holding an');
console.log('    unsuppressed finding — a false green with every other check still passing.');

/* And the precedence still holds: evidence outranks findings. */
const strict4 = await scan({ config: cfg(ROOT, 1.0), port: fakePort(THREE_CHILDREN), now: clock() });
check('at threshold 1.0 the same run exits 3, not 1 — 3 outranks 1', strict4.verdict.exit, 3);

/* =========================================================================
 * TEST 5 — MUTATION CHECK: the drop-out-cause clause in judgeable()
 * ========================================================================= */

head('TEST 5 — MUTATION CHECK: judge on `fetched` alone and the unbounded gap disappears');

check('with the cause clause ON  the truncated run is disclaimed', rMid.verdict.disposition, 'disclaimed');
check('  and the byte is 2', rMid.verdict.exit, 2);

/* The mutation: judge anything that reached `fetched`, ignoring its cause. This
 * is the plausible simplification, and it deletes the one signal the disposition
 * depends on — the root whose children were never listed becomes "evaluated". */
const fetchedOnly: Sys001Rule = {
  ...SYS001,
  judge(m: Manifest) {
    const judged = new Set<string>();
    for (const e of m.all()) if (e.stages.has('fetched')) judged.add(e.key);
    return judged;
  },
};
const mutated5 = await scan({ config: cfg(), port: fakePort(MIDSTREAM), now: clock(), rule: fetchedOnly });
/* THE MUTATION IS WORSE THAN PREDICTED, AND THE MEASURED VALUES ARE KEPT.
 * This was written expecting the gap to survive as bounded and the byte to fall
 * from 2 to 3. It does not: gapsFrom() keys on the `evaluated` stage, so marking
 * the truncated root evaluated DELETES the gap outright. The run then reports a
 * clean bill of health — unqualified, 2/2 resources, exit 0 — over a root whose
 * children were never listed. Four regressions from one omitted clause. */
check('with it OFF the disposition goes to unqualified', mutated5.verdict.disposition, 'unqualified');
check('  the byte falls from 2 all the way to 0', mutated5.verdict.exit, 0);
check('  the unbounded gap is gone entirely', mutated5.gaps.some(g => !g.bounded), false);
check('  every gap is gone, and so is every finding', `${mutated5.gaps.length}/${mutated5.findings.length}`, '0/0');
check('  and coverage now reads 100% of the resources it kept', mutated5.coverage[0]!.ratio, 1);

console.log('  ^ one omitted clause turns a disclaimed run into a clean bill of health.');
console.log('    The children the root never listed cannot be counted or named, and the');
console.log('    mutated rule prints 2/2 resources over them.');

/* =========================================================================
 * TEST 6 — no baseline state is printed, because none was computed
 * ========================================================================= */

head('TEST 6 — the slice computes no baseline state and prints none');

check('a finding carries no baselineState field', 'baselineState' in fDataset, false);
check('  and no suppression field either', 'suppressed' in fDataset, false);

const findingsSection = rendered.split('──────── FINDINGS ────────')[1]!.split('────────')[0]!;
/* ADR-0008 decision 1's five states. Not one of them may appear as a claim about
 * a finding: this slice has no baseline file to match against (spec §1.2), so
 * every value would be asserted rather than computed. */
check('no baseline state appears in the findings section',
  /\b(unchanged|updated|unverified)\b/.test(findingsSection) || /\bstate: (new|resolved)\b/.test(findingsSection), false);
check('  and the report states the omission is deliberate', /no baseline state is printed/.test(rendered), true);
check('the link is null and says why', /link: not captured/.test(findingsSection), true);

/* The same rule, one section down. A run that failed its identity call has no
 * gaps and no violations, so deriveVerdict returns `unqualified` — a clean bill
 * of health printed under "the scan did not run as declared". */
const rAuth = await scan({ config: cfg(), port: fakePort(THREE_CHILDREN, true), now: clock() });
const authReport = renderReport(rAuth, {}).join('\n');
check('a scan that did not run exits 4', rAuth.verdict.exit, 4);
check('  and prints NO disposition rather than `unqualified`', /disposition: *unqualified/.test(authReport), false);
check('  it says none, and says why', /disposition: *none — the scan did not run as declared/.test(authReport), true);
check('  its vector is empty, so no coverage figure exists', rAuth.coverage.length, 0);
check('  and the report says that instead of printing a ratio', /no rule had an applicable subject/.test(authReport), true);

/* =========================================================================
 * TEST 7 — MUTATION CHECK: the manifest and the gap set must not drift silently
 * ========================================================================= */

head('TEST 7 — a gap naming a resource the manifest does not hold is REPORTED, not smoothed over');

const GHOST = 'ffffffffffffffffffffffffffffffff';
const rGhost = await scan({
  config: cfg(),
  port: fakePort(THREE_CHILDREN),
  now: clock(),
  deriveGaps: () => [{ resource: hyphenate(GHOST)!, cause: 'invented by a second gap list', bounded: true }],
});
const ghost = rGhost.findings[0]!;
check('the finding is still produced', rGhost.findings.length, 1);
check('  and it names the disagreement rather than defaulting around it', /the two disagree/.test(ghost.message), true);
check('  its drop-out stage is unrecorded, not guessed', ghost.discriminator[DROPOUT_STAGE_KEY], 'unrecorded');

console.log('  ^ results-ref001-live.md §4: the manifest showed a stalled resource, the');
console.log('    parallel gap list was empty, and the exit byte read 1 where 3 was required.');

/* =========================================================================
 * TEST 8 — the funnel figure and the vector agree, and every finding is evidenced
 * ========================================================================= */

head('TEST 8 — Principle 2: a rule names its evidence — object, location, observed, expected');

check('every finding names its object by ID', r1.findings.every(f => hyphenate(f.evidence.object) !== null), true);
check('every finding names a location in the funnel', r1.findings.every(f => f.evidence.location.length > 0), true);
check('every finding names a specific observed cause', r1.findings.every(f => f.evidence.observed.length > 0), true);
check('every finding expects `evaluated`', fDataset.evidence.expected, 'evaluated');
check('no generic cause reaches a finding (ADR-0005 decision 5, constraint 2)',
  r1.findings.some(f => /^(error|skipped|unknown)$/i.test(f.evidence.observed)), false);

/* The two figures are computed from the same manifest by different code paths.
 * They agreeing is not a tautology — deriveVerdict counts the `evaluated` stage
 * and the rule counts judgeable entries, and #44 is where they can part. */
check('the funnel figure and the SYS001 row are the same number in this slice',
  `${r1.verdict.evaluated}/${r1.verdict.applicable}`, `${r1.coverage[0]!.evaluated}/${r1.coverage[0]!.applicable}`);

/* The stage helper is structural. A cause-string parse would have re-derived the
 * funnel from prose, which is the second copy this file exists to prevent. */
const rootEntry = r1.manifest.all().find(e => e.key === hyphenate(ROOT))!;
check('lastStage reads the stage set, not the cause text', lastStage(rootEntry), 'evaluated');
check('  and a stalled resource stops at enumerated',
  lastStage(r1.manifest.all().find(e => e.key === hyphenate(DATASET))!), 'enumerated');
check('  a judged resource is judgeable, a stalled one is not',
  `${SYS001.judge(r1.manifest).has(hyphenate(PAGE_B)!)}/${SYS001.judge(r1.manifest).has(hyphenate(DATASET)!)}`, 'true/false');

/* ------------------------------------------------------------------------ */

console.log('');
console.log(fails === 0 ? `ALL CHECKS PASS` : `${fails} CHECK(S) FAILED`);
console.log('SYS001 keeps its finding-identity job only. The run-failure decision is verdict.ts (ADR-0005 decision 4).');
process.exit(fails === 0 ? 0 : 1);
