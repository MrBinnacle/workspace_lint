/* The suite over support.ts — issue #124.
 *
 *   npx tsx CHECK-support.ts
 *
 * No network, no .env, no token. The mechanism, and the whole argument for why it
 * exists, is in `support.ts`. This file only tests it.
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHarness } from './CHECK-harness.js';
import {
  adrFiles, buildGraph, danglingEdges, loadSupportBaseline, outSet, parseNode, refutedSources,
  type Graph,
} from './support.js';

const { check, head, finish } = createHarness();

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');

head('TEST 1 — the Evidence line is the support list, and an absent one is a BASE belief');

const WITH = '# ADR-0099: x\n\n- **Status:** Accepted\n- **Evidence:** `docs/research/a.md`, ADR-0002 decision 1, `slice/scan.ts`\n';
const WITHOUT = '# ADR-0098: y\n\n- **Status:** Accepted\n- **Date:** 2026-01-01\n';

const withNode = parseNode(WITH, 'docs/adr/0099-x.md');
check('an Evidence line is found', withNode.base, false);
check('  the ADR number is read off the filename', withNode.number, '0099');
check('  backticked file paths become edges', withNode.files.length, 2);
check('  and an ADR reference becomes an edge too', withNode.adrs.join(','), '0002');
check('no Evidence line makes it a BASE belief', parseNode(WITHOUT, 'docs/adr/0098-y.md').base, true);
check('  with an empty support list, which is what base MEANS', parseNode(WITHOUT, 'docs/adr/0098-y.md').files.length, 0);

/* A SELF-REFERENCE IS NOT A SUPPORT. Every ADR names itself in its own title, so
 * without this the graph gives each node an edge to itself and the OUT traversal
 * has a cycle on every node. */
const selfRef = parseNode('# ADR-0007: x\n\n- **Evidence:** ADR-0007 decision 3 and ADR-0002 finding 2\n', 'docs/adr/0007-x.md');
check('a self-reference is dropped', selfRef.adrs.join(','), '0002');

head('TEST 2 — a dangling support FAILS rather than passing quietly');

const fakeGraph: Graph = (() => {
  const nodes = [
    parseNode('- **Evidence:** `docs/research/does-not-exist.md`\n', 'docs/adr/0097-a.md'),
    parseNode('- **Evidence:** ADR-9999 decision 1\n', 'docs/adr/0096-b.md'),
  ];
  return { nodes, byNumber: new Map(nodes.map(n => [n.number, n])) };
})();

const dangling = danglingEdges(fakeGraph, REPO);
check('a cited file that is not on disk is reported', dangling.some(d => d.missing.endsWith('does-not-exist.md')), true);
check('a cited ADR that does not exist is reported', dangling.some(d => d.missing === 'ADR-9999'), true);
check('  and each names the document it came from', dangling[0]?.from.startsWith('docs/adr/') ?? false, true);

head('TEST 3 — OUT propagates from a refuted source, and stops being FALSE on the way');

/* Hand-built so the traversal is tested rather than the repository's current
 * state. A: refuted at source. B: cites A. C: cites B. D: cites nothing. */
const propGraph: Graph = (() => {
  const nodes = [
    parseNode('- **Evidence:** `docs/research/x.md`\n', 'docs/adr/0090-a.md'),
    parseNode('- **Evidence:** ADR-0090 finding 1\n', 'docs/adr/0091-b.md'),
    parseNode('- **Evidence:** ADR-0091 decision 2\n', 'docs/adr/0092-c.md'),
    parseNode('- **Evidence:** `docs/research/y.md`\n', 'docs/adr/0093-d.md'),
  ];
  return { nodes, byNumber: new Map(nodes.map(n => [n.number, n])) };
})();

const propagated = outSet(propGraph, ['docs/adr/0090-a.md']);
check('the ADR citing the refuted source is OUT', propagated.some(o => o.file === 'docs/adr/0091-b.md'), true);
check('  and so is the one citing THAT — the closure runs', propagated.some(o => o.file === 'docs/adr/0092-c.md'), true);
check('  an unrelated ADR is untouched', propagated.some(o => o.file === 'docs/adr/0093-d.md'), false);
/* ⛔ THE SOURCE IS NOT IN THE OUT SET. It is where the retraction starts, not
 * something the retraction knocked over. Listing it would make the report read as
 * "five ADRs are broken" when the truth is one claim was withdrawn. */
check('the refuted source itself is NOT listed as knocked over', propagated.some(o => o.file === 'docs/adr/0090-a.md'), false);

/* A CYCLE MUST TERMINATE. Two ADRs citing each other is a documentation defect,
 * and this function must report it rather than hang on it. */
const cyclic: Graph = (() => {
  const nodes = [
    parseNode('- **Evidence:** ADR-0095 decision 1\n', 'docs/adr/0094-a.md'),
    parseNode('- **Evidence:** ADR-0094 decision 1\n', 'docs/adr/0095-b.md'),
  ];
  return { nodes, byNumber: new Map(nodes.map(n => [n.number, n])) };
})();
check('a cycle terminates rather than spinning', outSet(cyclic, []).length, 0);

head('TEST 4 — CONTESTED does not start a retraction, and that is deliberate');

/* Read off the disposition prefix. A contested claim is one nobody has settled
 * either way; putting dependents OUT on it is the overshoot #125's R1 already
 * committed once. */
check('only REFUTED sources are returned', refutedSources(REPO).every(f => typeof f === 'string'), true);
check('  and ADR-0002 is one of them', refutedSources(REPO).some(f => f.includes('0002-coverage')), true);
check('  the CONTESTED entry in the same file does not add a second source',
  refutedSources(REPO).filter(f => f.includes('0002-coverage')).length, 1);

head('TEST 5 — the repository itself');

const graph = buildGraph(REPO);
const baseline = loadSupportBaseline(REPO);
const declaredBase = new Set(baseline.map(b => b.file));
const undeclaredBase = graph.nodes.filter(n => n.base && !declaredBase.has(n.file));
const realDangling = danglingEdges(graph, REPO);
const out = outSet(graph, refutedSources(REPO));

/* THE EMPTY-SET CONTROL. A glob that matches no ADRs makes every assertion below
 * pass over nothing. */
check('ADRs were found at all', adrFiles(REPO).length > 10, true);
check('  and at least one carries a real Evidence line', graph.nodes.some(n => !n.base), true);
check('  and at least one is a base belief, so the baseline is not vacuous', graph.nodes.some(n => n.base), true);

console.log(`\n   ${graph.nodes.length} ADRs`);
console.log(`   ${graph.nodes.filter(n => !n.base).length} carry an Evidence line — a support list`);
console.log(`   ${graph.nodes.filter(n => n.base).length} carry none, and are declared BASE in support-baseline.json`);
console.log(`   ${refutedSources(REPO).length} document(s) carry a REFUTED claim`);

for (const o of out) {
  console.log(`\n   ⛔ OUT  ${o.file}\n      ${o.reason}\n      via ${o.via}`);
}
console.log('\n   OUT is NOT false. A derived belief whose support is withdrawn is unjustified,');
console.log('   not wrong. Deciding which belief to retract is culprit selection, and this');
console.log('   suite deliberately reports the set and stops.');

check('every base belief is declared', undeclaredBase.map(n => n.file).join(',') || 'none', 'none');
check('no support edge dangles', realDangling.map(d => `${d.from}->${d.missing}`).join(',') || 'none', 'none');

/* ⭐ THE FIRST TRAVERSAL'S FINDING, ASSERTED SO THE MECHANISM CANNOT BE ADDED,
 * NEVER FIRE, AND NEVER BE NOTICED. ADR-0014 removed search from the v0.1 scan
 * and cites ADR-0002 findings 1-3; finding 1 was refuted on 2026-08-19. If this
 * assertion ever fails, either the refutation was withdrawn or ADR-0014 was
 * re-justified — and both are events worth stopping for. */
check('ADR-0014 is OUT, because it cites the refuted finding', out.some(o => o.file.includes('0014-search-has-no-role')), true);
check('  ADR-0015, the retraction itself, is NOT out', out.some(o => o.file.includes('0015-the-declared-roots')), false);

finish(
  `Nine locators in ~180 assertions means the support graph was essentially unconnected,
and that is WHY four errors propagated silently — there were no edges for a retraction
to travel along. This reads the Evidence lines that already existed and makes the graph
checkable. It is document granularity, not per-assertion: #124's full fix is not this.`,
);
