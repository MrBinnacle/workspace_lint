/* The red test for T1 — docs/spec/v0.1-scan-slice.md §4.
 *
 *   npx tsx CHECK-scan-scaffold.ts
 *
 * UPDATED BY T2 (#43). This file was written when the slice implemented no rule.
 * SYS001 now judges the resources the funnel delivered whole, so three
 * assertions here changed and each carries a note saying what it used to assert
 * and why the new value is the honest one. Nothing was deleted to make a test
 * pass: the funnel, the denominator, the mutation check and the exit bytes are
 * unchanged. SYS001's OWN behaviour is tested in CHECK-sys001.ts, not here.
 *
 * No network, no .env, no token. Deterministic: the clock is injected and the
 * whole Notion surface is a fake NotionPort.
 *
 * TEST 5 IS A MUTATION CHECK AND IT IS THE POINT OF THIS FILE. It disables the
 * coverage-gap derivation and asserts the exit byte goes green. A control that
 * passes with its mechanism bypassed tested nothing — the previous red test on
 * this project injected a known-bad page ID straight into the resolver and
 * passed whether or not link discovery worked, and discovery was in fact broken.
 * If TEST 5 shows the byte staying at 3, this suite is measuring nothing and no
 * result it reports may be believed.
 */

import { parseConfig } from './config.js';
import { createHarness, reportSection } from './CHECK-harness.js';
import { scan } from './scan.js';
import { renderReport } from './report.js';
import { checkAgainstOracle } from './fixture-oracle.js';
import { gapsFrom } from './manifest.js';
import { hyphenate } from './ids.js';
/* The fake Notion surface is shared with CHECK-sys001.ts — one fixture, so the
 * two suites cannot drift into asserting against different workspaces. */
import {
  ROOT, PAGE_A, PAGE_B, DATASET,
  childPage, childDb, page, cfg, clock, fakePort,
  THREE_CHILDREN, MIDSTREAM, type FakeResource,
} from './CHECK-fakes.js';

/* The harness is shared and its comparison is STRICT — see CHECK-harness.ts.
 * Both suites previously carried their own copy comparing stringified
 * values, which passes when the types differ. */
const { check, head, finish } = createHarness();

/* =========================================================================
 * TEST 1 — the config rejects a root it cannot address
 * ========================================================================= */

head('TEST 1 — identity is the stable ID, and a name is never guessed at');

const byName = parseConfig(JSON.stringify({ version: 1, roots: [{ name: 'Proof Fixture' }] }));
check('a name-only root is rejected', byName.ok, false);
check('and the reason names the rule', /Identity is the stable ID/.test((byName as { reason: string }).reason ?? ''), true);

const byAlias = parseConfig(JSON.stringify({ version: 1, roots: [{ alias: 'wl-proof-fixture' }] }));
check('an alias-only root is rejected too', byAlias.ok, false);

const bare = parseConfig(JSON.stringify({ version: 1, roots: [{ id: ROOT }] }));
check('a bare 32-hex ID is accepted', bare.ok, true);
check('and normalized to hyphenated form', bare.ok && bare.config.roots[0]!.id, '2d41c263-1b59-45f1-96c5-688cde44cdf9');

const notAnId = parseConfig(JSON.stringify({ version: 1, roots: [{ id: 'https://app.notion.com/p/whatever' }] }));
check('a URL is not an ID', notAnId.ok, false);

const twoRoots = parseConfig(JSON.stringify({ version: 1, roots: [{ id: ROOT }, { id: PAGE_A }] }));
check('two roots are rejected — this slice enumerates one', twoRoots.ok, false);

console.log('  ^ every rejection above exits 4: the scan did not run as declared (ADR-0008 decision 2).');

/* =========================================================================
 * TEST 2 — the denominator does not shrink to fit what the code can descend into
 * ========================================================================= */

head('TEST 2 — the applicable set is what was ENUMERATED, not what was understood');

const r2 = await scan({ config: cfg(), port: fakePort(THREE_CHILDREN), now: clock() });
/* Matched on the FULL hyphenated ID. An 8-hex prefix match would be the same
 * defect the live run exposed in the report layer: the fixture's real pages
 * share their leading hex because Notion IDs are time-ordered, so a prefix
 * helper can silently assert against the wrong entry. */
const entry = (id: string) => r2.manifest.all().find(e => e.key === hyphenate(id));

check('applicable set is 4 — the root and all three children', r2.verdict.applicable, 4);
check('the data source is IN the denominator', entry(DATASET) !== undefined, true);
check('  and it stalled at enumerated', entry(DATASET)!.stages.has('fetched'), false);
check('  with a named, specific cause', /data-source enumeration is not implemented/.test(entry(DATASET)!.loss!.cause), true);
check('the two child pages were fetched', [entry(PAGE_A)!, entry(PAGE_B)!].every(e => e.stages.has('fetched')), true);
/* CHANGED BY T2. This read "NOTHING was evaluated — this slice implements no
 * rule", want 0. SYS001 exists now and judges the three resources the funnel
 * delivered whole. The data source is not one of them, which is the point. */
check('the three delivered resources were evaluated by SYS001', r2.verdict.evaluated, 3);
check('  and the data source was NOT — it stalled before fetched', entry(DATASET)!.stages.has('evaluated'), false);
/* CHANGED BY T2. This asserted the "implements no rule" cause on a fetched
 * page. That cause is gone from every path; a delivered resource records no
 * LOSS at all, which is what makes it judgeable. */
check('  a delivered resource records no loss', entry(PAGE_A)!.loss, null);
check('every gap names a resource and a cause', r2.gaps.every(g => g.resource.length > 0 && g.cause.length > 0), true);
check('every gap is bounded — each missing resource is named', r2.gaps.every(g => g.bounded), true);
check('disposition is qualified, not unqualified', r2.verdict.disposition, 'qualified');
check('EXIT 3 — gaps are confined and coverage is below the declared threshold', r2.verdict.exit, 3);
check('the run recorded its request count', r2.requestCount > 0, true);
check('and its wall time', r2.wallMs > 0, true);

console.log(`  ^ 4 resources, not 3. Counting only child_page shipped a "2/2 — 100%"`);
console.log('    over a root with three children (results-ref001-live.md §3).');

/* =========================================================================
 * TEST 3 — an unreachable declared root
 * ========================================================================= */

head('TEST 3 — an unreachable declared root is pervasive, and the byte is 2');

const r3 = await scan({ config: cfg(), port: fakePort({}), now: clock() });
check('the root is in the manifest as declared', r3.verdict.applicable, 1);
check('it never resolved', r3.manifest.reached('resolved'), 0);
check('the gap is flagged as a declared-root miss', r3.gaps[0]?.isRootMiss, true);
check('disposition is disclaimed', r3.verdict.disposition, 'disclaimed');
check('NO summary verdict is rendered, and the byte is 2', r3.verdict.exit, 2);

head('TEST 3b — a failed credential is 4, not 2');

const r3b = await scan({ config: cfg(), port: fakePort(THREE_CHILDREN, true), now: clock() });
check('exit 4 — the scan did not run as declared', r3b.verdict.exit, 4);
check('and it is NOT reported as an unreachable root', r3b.verdict.disposition === 'disclaimed' && r3b.verdict.exit === 2, false);
console.log('  ^ without the identity call, a bad token 404s on the root and this run exits 2.');
console.log('    Same byte the fixture produces when the root is genuinely gone. Two failures, two bytes.');

/* =========================================================================
 * TEST 4 — truncation, tested positively only
 * ========================================================================= */

head('TEST 4 — request_status is tested positively; its absence proves nothing');

const ABSENT: Record<string, FakeResource> = {
  ...THREE_CHILDREN,
  [ROOT]: { steps: [page([childPage(PAGE_A, 'wl-outside-grant')])] },
};
const r4a = await scan({ config: cfg(), port: fakePort(ABSENT), now: clock() });
check('no request_status at all, and the enumeration is not penalised', /request_status/.test(entryCause(r4a, ROOT)), false);
check('  the root reached fetched', r4a.manifest.all().find(e => e.key === hyphenate(ROOT))!.stages.has('fetched'), true);

const INCOMPLETE: Record<string, FakeResource> = {
  ...THREE_CHILDREN,
  [ROOT]: { steps: [page([childPage(PAGE_A, 'wl-outside-grant')], { request_status: { type: 'incomplete', incomplete_reason: 'timeout' } })] },
};
const r4b = await scan({ config: cfg(), port: fakePort(INCOMPLETE), now: clock() });
check('a positive incomplete signal becomes a cause on the root', /request_status incomplete \(timeout\)/.test(entryCause(r4b, ROOT)), true);

head('TEST 4b — an enumeration that dies mid-stream is UNBOUNDED, so the run is disclaimed');

const r4c = await scan({ config: cfg(), port: fakePort(MIDSTREAM), now: clock() });
check('the gap is UNBOUNDED — the remainder cannot be counted or named', r4c.gaps.some(g => !g.bounded), true);
check('so the gap set is pervasive and the report is disclaimed', r4c.verdict.disposition, 'disclaimed');
check('exit 2, not 3', r4c.verdict.exit, 2);
console.log('  ^ calling this bounded would round toward the flattering answer.');

/* =========================================================================
 * TEST 5 — THE MUTATION CHECK
 * ========================================================================= */

head('TEST 5 — MUTATION CHECK: disable coverage-gap detection and the byte MUST go green');

const control = await scan({ config: cfg(), port: fakePort(THREE_CHILDREN), now: clock(), deriveGaps: gapsFrom });
const mutated = await scan({ config: cfg(), port: fakePort(THREE_CHILDREN), now: clock(), deriveGaps: () => [] });

check('with gap detection ON  the byte is 3', control.verdict.exit, 3);
check('with gap detection OFF the byte is 0', mutated.verdict.exit, 0);
check('the mutation moved the byte', control.verdict.exit !== mutated.verdict.exit, true);
check('and the manifest itself is unchanged by the mutation', mutated.verdict.applicable, control.verdict.applicable);

console.log('  ^ gapsFrom() is load-bearing: removing it changes the result.');
console.log('    A byte that stayed at 3 here would mean the suite measures nothing.');

/* =========================================================================
 * TEST 6 — title redaction, tested against the WHOLE rendered output
 * ========================================================================= */

head('TEST 6 — no page title reaches the report unless the operator opts in');

/* This test exists because the first live run FAILED it. The report printed
 * "page titles redacted by default" and then, four sections later, printed
 * `GET /v1/blocks/wl-pagination/children` in the call log — the title had been
 * passed in as the pagination label. Asserting on the manifest section alone
 * would have stayed green. The assertion is over EVERY rendered line. */

const TITLES = ['wl-outside-grant', 'wl-revoke-parent', 'wl-dataset'];
const DATASET_HYPHENATED = hyphenate(DATASET)!;
const r6 = await scan({ config: cfg(), port: fakePort(THREE_CHILDREN), now: clock() });

const redacted = renderReport(r6, {}).join('\n');
check('the default output contains NO page title, anywhere', TITLES.some(t => redacted.includes(t)), false);
check('  and it names each resource by full ID instead', redacted.includes('3bf1351d-6af4-8110-8dc5-dcc8bffb9742'), true);
/* CHANGED BY T2. This matched PAGE_A's ID inside the GAPS section. PAGE_A is
 * evaluated now and is correctly absent from that section, so the assertion
 * moved to the resource that IS a gap — the data source — and gained the
 * findings section, which is new output and the likeliest place for a title to
 * leak next.
 *
 * CUT THE SECTION OUT FIRST. The original wrote /GAPS[\s\S]*<id>/, which spans
 * the rest of the report — the ID appearing only in CALLS MADE would have
 * satisfied an assertion claiming it appeared in GAPS. */
check('  including in the gap list', reportSection(redacted, 'GAPS').includes(DATASET_HYPHENATED), true);
check('  and in the findings, by full ID', reportSection(redacted, 'FINDINGS').includes(`SYS001  ${DATASET_HYPHENATED}`), true);
check('  and the section cut is real — the ID is NOT in DISCLOSURES', reportSection(redacted, 'DISCLOSURES').includes(DATASET_HYPHENATED), false);

const shown = renderReport(r6, { showTitles: true }).join('\n');
check('--show-titles opts in, and then the titles appear', TITLES.every(t => shown.includes(t)), true);

/* Distinctness, which truncation destroyed: three fixture pages share their
 * first 8 hex digits in the real workspace because Notion IDs are time-ordered. */
const ids = r6.manifest.all().map(e => e.key);
check('every manifest key is distinct', new Set(ids).size, ids.length);
check('every RENDERED label is distinct too', new Set(redacted.split('\n').filter(l => /^ {2}[0-9a-f]{8}-/.test(l)).map(l => l.trim().split(/\s+/)[0])).size, 4);

console.log('  ^ truncation is not redaction, and here it was not disambiguation either.');

/* =========================================================================
 * TEST 7 — the hand-written oracle, and it must be able to go red
 * ========================================================================= */

head('TEST 7 — the oracle matches a fixture-shaped run, and FAILS when one child goes missing');

/* IDs built to the suffixes docs/proof/fixture.md records. The shared LEADING
 * hex is deliberate: it is what the real workspace looks like. */
const O_ROOT = '3bf1351d-6af4-8057-8496-ee302a3bee7c';
const O_PAGINATION = '3bf1351d-6af4-81ee-990b-f7c5fef57e44';
const O_REVOKE_PARENT = '3bf1351d-6af4-8108-8ff3-c2d170a06142';
const O_DATABASE = 'f937580c-0964-4ea7-a781-b9119887ee5b';

const ORACLE_SHAPED: Record<string, FakeResource> = {
  [O_ROOT]: { steps: [page([childPage(O_PAGINATION, 'wl-pagination'), childPage(O_REVOKE_PARENT, 'wl-revoke-parent'), childDb(O_DATABASE, 'wl-dataset')])] },
  [O_PAGINATION]: { steps: [page([], { has_more: true, next_cursor: '1' }), page([])] },
  [O_REVOKE_PARENT]: { steps: [page([])] },
  [O_DATABASE]: { steps: [page([])] },
};

const r7 = await scan({ config: cfg(O_ROOT), port: fakePort(ORACLE_SHAPED), now: clock() });
const o7 = checkAgainstOracle(r7);
check('the oracle MATCHES a fixture-shaped run', o7.ok, true);
check('  and it names its own source', /fixture\.md/.test(o7.lines.join('\n')), true);
check('  wl-outside-grant and wl-revoke-child are absent, as required', /absent, as the oracle requires/.test(o7.lines.join('\n')), true);

/* MUTATION: delete one child the oracle requires. If the oracle stays green
 * here it is checking nothing — the same failure the exit byte's mutation check
 * exists to catch, one layer up. */
const MISSING_CHILD: Record<string, FakeResource> = {
  ...ORACLE_SHAPED,
  [O_ROOT]: { steps: [page([childPage(O_PAGINATION, 'wl-pagination'), childDb(O_DATABASE, 'wl-dataset')])] },
};
const r7b = await scan({ config: cfg(O_ROOT), port: fakePort(MISSING_CHILD), now: clock() });
const o7b = checkAgainstOracle(r7b);
check('with wl-revoke-parent removed the oracle goes RED', o7b.ok, false);
check('  and it says which resource is missing', /MISMATCH.*wl-revoke-parent/.test(o7b.lines.join('\n')), true);
check('  and the applicable count mismatch is named too', /applicable set is 3, oracle says 4/.test(o7b.lines.join('\n')), true);

/* A fixture edit must NOT masquerade as a coverage failure. */
check('the exit byte is unchanged by the oracle mismatch', r7b.verdict.exit, r7.verdict.exit);

console.log('  ^ the oracle is hand-written from fixture.md and compared to the run,');
console.log('    never derived from it. An oracle that cannot go red is a restatement.');

/* --------------------------------------------------------------- helper -- */

function entryCause(r: Awaited<ReturnType<typeof scan>>, id: string): string {
  return r.manifest.all().find(e => e.key === hyphenate(id))?.loss?.cause ?? '';
}

/* ------------------------------------------------------------------------ */

finish('SYS001 is implemented (#43). This file covers the FUNNEL; CHECK-sys001.ts covers the RULE.');
