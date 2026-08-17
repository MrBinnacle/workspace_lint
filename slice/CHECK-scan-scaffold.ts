/* The red test for T1 — docs/spec/v0.1-scan-slice.md §4.
 *
 *   npx tsx CHECK-scan-scaffold.ts
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
import { PortError, type BlockListResponse, type NotionPort } from './notion-port.js';
import { scan, renderReport, NO_RULE_CAUSE } from './scan.js';
import { gapsFrom } from './manifest.js';
import { hyphenate } from './ids.js';
import type { Config } from './config.js';

let fails = 0;
const check = (name: string, got: unknown, want: unknown) => {
  const ok = String(got) === String(want);
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: got=${got} want=${want}`);
};
const head = (s: string) => console.log(`\n== ${s} ==`);

/* ------------------------------------------------------------ the fake -- */

const ROOT = '2d41c2631b5945f196c5688cde44cdf9';
const PAGE_A = '3bf1351d6af481108dc5dcc8bffb9742';
const PAGE_B = '4ca2462e7bf592219ed6edd9c00ca853';
const DATASET = '5db3573f8cf6a332afe7fee0d11db964';

const childPage = (id: string, title: string) => ({ object: 'block', id, type: 'child_page', child_page: { title } });
const childDb = (id: string, title: string) => ({ object: 'block', id, type: 'child_database', child_database: { title } });
const para = (id: string) => ({ object: 'block', id, type: 'paragraph', paragraph: { rich_text: [] } });

const page = (results: unknown[], extra: Partial<BlockListResponse> = {}): BlockListResponse =>
  ({ results, has_more: false, next_cursor: null, ...extra });

type Step = BlockListResponse | { throwStatus: number; throwCode: string };

type FakeResource = { pageFail?: { status: number; code: string }; steps?: Step[] };

function fakePort(spec: Record<string, FakeResource>, meFails = false): NotionPort {
  return {
    async whoami() {
      if (meFails) throw new PortError(401, 'unauthorized');
      return { name: 'workspace-lint-proof', type: 'bot' };
    },
    async retrievePage(id) {
      const r = spec[id];
      if (!r || r.pageFail) throw new PortError(r?.pageFail?.status ?? 404, r?.pageFail?.code ?? 'object_not_found');
      return { id };
    },
    async listChildren(id, cursor) {
      const r = spec[id];
      if (!r?.steps) throw new PortError(404, 'object_not_found');
      const i = cursor ? Number(cursor) : 0;
      const step = r.steps[i];
      if (!step) throw new PortError(404, 'object_not_found');
      if ('throwStatus' in step) throw new PortError(step.throwStatus, step.throwCode);
      return step;
    },
  };
}

const cfg = (id = ROOT, minCoverage = 1.0): Config => ({ version: 1, roots: [{ id, alias: 'wl-proof-fixture' }], minCoverage });
const clock = () => { let t = 1000; return () => (t += 7); };

/* The fixture as it actually is: a declared root with three children, one of
 * which is a data source this slice does not enumerate. */
const THREE_CHILDREN: Record<string, FakeResource> = {
  [ROOT]: { steps: [page([para('a1b2c3d40000400080000000000000ff'), childPage(PAGE_A, 'wl-outside-grant'), childPage(PAGE_B, 'wl-revoke-parent'), childDb(DATASET, 'wl-dataset')])] },
  [PAGE_A]: { steps: [page([])] },
  [PAGE_B]: { steps: [page([])] },
  [DATASET]: { steps: [page([])] },
};

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
check('  with a named, specific cause', /data-source enumeration is not implemented/.test(entry(DATASET)!.cause), true);
check('the two child pages were fetched', [entry(PAGE_A)!, entry(PAGE_B)!].every(e => e.stages.has('fetched')), true);
check('NOTHING was evaluated — this slice implements no rule', r2.verdict.evaluated, 0);
check('  and every fetched resource says so', /implements no rule/.test(entry(PAGE_A)!.cause), true);
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

const MIDSTREAM: Record<string, FakeResource> = {
  ...THREE_CHILDREN,
  [ROOT]: {
    steps: [
      page([childPage(PAGE_A, 'wl-outside-grant')], { has_more: true, next_cursor: '1' }),
      { throwStatus: 502, throwCode: 'internal_server_error' },
    ],
  },
};
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
const r6 = await scan({ config: cfg(), port: fakePort(THREE_CHILDREN), now: clock() });

const redacted = renderReport(r6, {}).join('\n');
check('the default output contains NO page title, anywhere', TITLES.some(t => redacted.includes(t)), false);
check('  and it names each resource by full ID instead', redacted.includes('3bf1351d-6af4-8110-8dc5-dcc8bffb9742'), true);
check('  including in the gap list', /GAPS[\s\S]*3bf1351d-6af4/.test(redacted), true);

const shown = renderReport(r6, { showTitles: true }).join('\n');
check('--show-titles opts in, and then the titles appear', TITLES.every(t => shown.includes(t)), true);

/* Distinctness, which truncation destroyed: three fixture pages share their
 * first 8 hex digits in the real workspace because Notion IDs are time-ordered. */
const ids = r6.manifest.all().map(e => e.key);
check('every manifest key is distinct', new Set(ids).size, ids.length);
check('every RENDERED label is distinct too', new Set(redacted.split('\n').filter(l => /^ {2}[0-9a-f]{8}-/.test(l)).map(l => l.trim().split(/\s+/)[0])).size, 4);

console.log('  ^ truncation is not redaction, and here it was not disambiguation either.');

/* --------------------------------------------------------------- helper -- */

function entryCause(r: Awaited<ReturnType<typeof scan>>, id: string): string {
  return r.manifest.all().find(e => e.key === hyphenate(id))?.cause ?? '';
}

/* ------------------------------------------------------------------------ */

console.log('');
console.log(fails === 0 ? `ALL CHECKS PASS` : `${fails} CHECK(S) FAILED`);
console.log(`NO_RULE_CAUSE in force: ${NO_RULE_CAUSE}`);
process.exit(fails === 0 ? 0 : 1);
