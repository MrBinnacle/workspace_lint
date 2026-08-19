/* The red test — T5, issue #46, spec docs/spec/v0.1-scan-slice.md §4.
 *
 *   npx tsx CHECK-redtest.ts
 *
 * No network, no .env, no token. This file makes the slice FAIL correctly, and
 * one of the things it records is a failure the slice cannot detect at all.
 *
 * THE HEADLINE IS TEST 2 AND IT IS NOT A PASS. A scan of a page whose child
 * list has been permission-filtered returns exit 0 — `conforms`, `evidence
 * sufficient`, 100.0% coverage — over a subtree it cannot see. Reproduced live
 * on 2026-08-17 against `wl-revoke-parent`, with the builder identity as a
 * full-access control confirming the hidden child exists. The assertions below
 * pin that behaviour as a DOCUMENTED LIMIT so it cannot change silently in
 * either direction. They do not endorse it. See docs/proof/results-t5-red-test.md
 * and issue #35.
 */

import { createHarness } from './CHECK-harness.js';
import { scan } from './scan.js';
import { gapsFrom } from './manifest.js';
import { loadConfig } from './config.js';
import { hyphenate } from './ids.js';
import { REF001_ID } from './ref001.js';
import {
  ROOT, HIDDEN_CHILD, HIDDEN_CHILD_ID,
  cfg, clock, fakePort, page, childPage, para,
  PERMISSION_FILTERED, PERMISSION_FILTERED_WITH_LINK,
  THREE_CHILDREN, MIDSTREAM,
} from './CHECK-fakes.js';

const { check, head, finish } = createHarness();

/* =========================================================================
 * TEST 1 — ADR-0008 decision 2's table, all of it, quoted not paraphrased
 * =========================================================================
 * The correction on #46 (2026-08-17): the DoD named ONE branch of three, and
 * the wording came from #10's proof check 7, which predates ADR-0008.
 *
 *   | 4 | The scan did not run as declared                        | No verdict |
 *   | 2 | Disposition is disclaimed — root never reached, or any  | No verdict |
 *   |   | gap is unbounded                                        |            |
 *   | 3 | Gaps exist and are confined, and coverage is below the  | Yes        |
 *   |   | declared threshold                                      |            |
 *   | 1 | At least one finding is new and not suppressed          | Yes        |
 *   | 0 | No new unsuppressed finding, and coverage at or above   | Yes        |
 *   |   | the declared threshold                                  |            |
 *
 * Precedence 4 > 2 > 3 > 1 > 0. An exit byte reached by another path is a
 * different bug wearing the right number, so each row is reached by its OWN
 * seeded fault and the disposition is asserted alongside the byte.
 */

head('TEST 1 — every row of the exit table, each reached by its own fault');

/* Row 4 — the scan did not run as declared. Seeded at the CONFIG layer, before
 * any call: a root that is not a Notion ID. */
const badCfg = loadConfig('/nonexistent-config-for-the-red-test.json');
check('a config that cannot be loaded is rejected before any call', badCfg.ok, false);

const r4 = await scan({ config: cfg(), port: fakePort(THREE_CHILDREN, true), now: clock() });
check('EXIT 4 — the identity call failed, so the scan did not run as declared', r4.verdict.exit, 4);
check('  and NO disposition is published — it is not `unqualified`', r4.verdict.exit === 4, true);
check('  the scan made no coverage claim', r4.verdict.applicable, 0);

/* Row 2 — disclaimed. TWO pervasiveness conditions reach it and they are
 * different faults; ADR-0005 decision 3 names both. */
const r2root = await scan({ config: cfg(), port: fakePort({}), now: clock() });
check('EXIT 2a — an unreachable DECLARED ROOT is pervasiveness condition (a)', r2root.verdict.exit, 2);
check('  the disposition is disclaimed', r2root.verdict.disposition, 'disclaimed');
check('  and the gap is flagged as a root miss', r2root.gaps.some(g => g.isRootMiss), true);

const r2unb = await scan({ config: cfg(), port: fakePort(MIDSTREAM), now: clock() });
check('EXIT 2b — an UNBOUNDED gap is pervasiveness condition (b)', r2unb.verdict.exit, 2);
check('  the disposition is disclaimed', r2unb.verdict.disposition, 'disclaimed');
check('  and the gap is unbounded, not a root miss', r2unb.gaps.some(g => !g.bounded && !g.isRootMiss), true);
console.log('  ^ 2a is reachable LIVE, by declaring an unshared page as the root.');
console.log('    2b is NOT: it needs an enumeration to die mid-stream on a 429 or 502,');
console.log('    which cannot be forced against a read-only connection. Offline only,');
console.log('    and #46\'s Revisit-if asks for that to be said rather than worked around.');

/* Row 3 — confined gap, coverage below the declared threshold. */
const r3 = await scan({ config: cfg(), port: fakePort(THREE_CHILDREN), now: clock() });
check('EXIT 3 — gaps exist, are confined, and coverage is below the threshold', r3.verdict.exit, 3);
check('  the gaps are all bounded', r3.gaps.every(g => g.bounded), true);
check('  the disposition is qualified, NOT disclaimed', r3.verdict.disposition, 'qualified');

/* Row 3 outranks row 1 — evidence outranks findings. ISA 705's structure: a
 * scope limitation qualifies the whole opinion irrespective of what was found. */
check('  and 3 outranks 1 even though findings exist', r3.findings.length > 0, true);

/* Row 0 — no new unsuppressed finding, every rule at or above the threshold. */
const r0 = await scan({ config: cfg(ROOT, 0.5), port: fakePort(PERMISSION_FILTERED), now: clock() });
check('EXIT 0 — nothing found and every rule cleared the floor', r0.verdict.exit, 0);
check('  the disposition is unqualified', r0.verdict.disposition, 'unqualified');

/* =========================================================================
 * TEST 2 — THE FALSE GREEN. This is the finding, not a pass.
 * =========================================================================
 * DoD item 2. Reproduced live 2026-08-17 against `wl-revoke-parent`:
 *
 *   disposition: unqualified · SYS001 1/1 resources (100.0%)
 *   conformity conforms · evidence sufficient · exit 0
 *
 * The builder identity — full access, the control this ticket asks for — reads
 * `wl-revoke-parent` and finds `wl-revoke-child` (…ce0fb949) inside it. The
 * read-only subject's children call returns the page's paragraphs and NO
 * child_page block. The child is not reported unreadable. It is absent.
 */

head('TEST 2 — a permission-filtered child list produces a CLEAN BILL OF HEALTH');

const rFiltered = await scan({ config: cfg(), port: fakePort(PERMISSION_FILTERED), now: clock() });

/* The fixture's truth, stated so the gap between it and the scan is visible. */
check('the hidden child EXISTS in the fixture\'s truth', HIDDEN_CHILD_ID.length, 36);
check('  and the scan holds no entry for it', rFiltered.manifest.all().some(e => e.key === HIDDEN_CHILD_ID), false);

check('DOCUMENTED LIMIT (#35) — the run exits 0', rFiltered.verdict.exit, 0);
check('  reporting conformity `conforms`', rFiltered.outcomes.SYS001?.conformity, 'conforms');
check('  and evidence `sufficient`', rFiltered.outcomes.SYS001?.evidence, 'sufficient');
check('  over a denominator of 1, built from what the connection could see', rFiltered.verdict.applicable, 1);
check('  with no gap recorded, because nothing signalled a loss', rFiltered.gaps.length, 0);
console.log('  ^ THIS IS NOT AN ENDORSEMENT. ADR-0006 decision 2: the children endpoint');
console.log('    carries no truncation signal, so a filtered listing and a complete one');
console.log('    are indistinguishable in the response. Whether a scan that cannot detect');
console.log('    this may report `sufficient` and exit 0 is issue #35, and it is OPEN.');

/* THE DISCLOSURE AND THE VERDICT ARE ON THE SAME PAGE, and that is the sharp
 * part. The report already says the traversal spine is trusted blind. It then
 * prints a clean byte over exactly that spine. */
const { renderReport } = await import('./report.js');
const filteredReport = renderReport(rFiltered, {}).join('\n');
check('the report DOES disclose that the spine is trusted blind', /trusted blind/.test(filteredReport), true);
check('  and prints exit 0 on the same page', /exit:\s+0/.test(filteredReport), true);

head('TEST 2b — MUTATION: unhide the child and the byte moves');

/* Proves TEST 2 keys on the FILTERING and not on some other property of the
 * fixture. With the child visible the scan tries to retrieve it, fails, and
 * stops being clean. */
const rUnhidden = await scan({
  config: cfg(),
  port: fakePort({ [ROOT]: { steps: [page([para('block-prose'), childPage(HIDDEN_CHILD, 'wl-revoke-child')])] } }),
  now: clock(),
});
check('with the child VISIBLE the run no longer exits 0', rUnhidden.verdict.exit !== 0, true);
check('  the applicable set grew', rUnhidden.verdict.applicable, 2);
check('  the mutation moved the byte', rFiltered.verdict.exit !== rUnhidden.verdict.exit, true);

/* =========================================================================
 * TEST 3 — the mechanism that DOES catch it, and exactly when it fails
 * =========================================================================
 * The difference between the two cases is the BLOCK TYPE of the surviving
 * trace, and nothing else. A child_page block is deleted by the permission
 * filter. An inline href lives in a readable paragraph's rich text and is not.
 */

head('TEST 3 — the same hidden child, caught, because one trace survived');

const rLinked = await scan({ config: cfg(), port: fakePort(PERMISSION_FILTERED_WITH_LINK), now: clock() });

check('the child list is filtered here too — no resource entry for it', rLinked.manifest.all().some(e => e.key === HIDDEN_CHILD_ID && e.unit === 'resources'), false);
check('but REF001 discovered it from block content', rLinked.findings.some(f => f.rule === REF001_ID), true);
check('  and the run does NOT exit 0', rLinked.verdict.exit !== 0, true);
check('  the finding is confirmed about an unreachable target', rLinked.findings.find(f => f.rule === REF001_ID)?.certainty, 'confirmed');
check('  which is what the link being the only surviving trace means', rLinked.findings.find(f => f.rule === REF001_ID)?.targetState, 'unreachable');

check('SAME hidden child, SAME filtering, opposite outcome', `${rFiltered.verdict.exit}→${rLinked.verdict.exit}`, '0→1');
console.log('  ^ the ONLY difference between these two fixtures is the block type of the');
console.log('    trace. child_page: deleted with the permission, undetectable. Inline href');
console.log('    in a readable paragraph: survives, and REF001 resolves it to a 404.');
console.log('    That is the reach of the coverage mechanism, stated as an executable fact.');

head('TEST 3b — MUTATION: remove the surviving href and the catch disappears');

const rNoTrace = await scan({
  config: cfg(),
  port: fakePort({ [ROOT]: { steps: [page([para('block-prose')])] } }),
  now: clock(),
});
check('with no trace at all the run exits 0 again', rNoTrace.verdict.exit, 0);
check('  and REF001 produces nothing to find', rNoTrace.findings.filter(f => f.rule === REF001_ID).length, 0);
check('  the href was load-bearing', rLinked.verdict.exit !== rNoTrace.verdict.exit, true);

/* =========================================================================
 * TEST 4 — DoD item 1, and why its wording predates the code
 * =========================================================================
 * "Disable the coverage-gap detection. Criterion 7 must go red."
 *
 * That wording assumed gaps were the ONLY route to exit 3. ADR-0012 decision 7
 * gave it a second one: a rule below the declared floor trips the evidence axis
 * on its own. So suppressing gaps no longer moves the byte, and a check written
 * to "the byte must change" would now be asserting a property the system
 * deliberately no longer has.
 */

head('TEST 4 — disable gap detection: three things move, and the byte is not one of them');

const control = await scan({ config: cfg(), port: fakePort(THREE_CHILDREN), now: clock(), deriveGaps: gapsFrom });
const noGaps = await scan({ config: cfg(), port: fakePort(THREE_CHILDREN), now: clock(), deriveGaps: () => [] });

check('the byte is 3 with gap detection ON', control.verdict.exit, 3);
check('  and STILL 3 with it off — coverage holds it independently', noGaps.verdict.exit, 3);
check('the disposition moves', `${control.verdict.disposition}→${noGaps.verdict.disposition}`, 'qualified→unqualified');
check('  the findings move', `${control.findings.length}→${noGaps.findings.length}`, '1→0');
check('  and the reason names the missing gap instead of inventing one', /NO gap was recorded for it/.test(noGaps.verdict.why), true);
check('the control\'s reason does not say that', /NO gap was recorded for it/.test(control.verdict.why), false);
console.log('  ^ a mutation that changed NOTHING would mean the suite measures nothing.');
console.log('    Three things change. The byte is defended by two independent conditions,');
console.log('    which is a stronger property than the byte moving — ADR-0012 decision 7.');

/* =========================================================================
 * TEST 5 — spec §1.3: this slice does not close #10
 * ========================================================================= */

head('TEST 5 — the fixture is narrower than #10 specified, and the code says so');

/* KEYED ON `outcomes`, NOT ON THE VECTOR. Every rule that RAN has an outcome;
 * a rule whose applicable set is empty LEAVES the vector (ADR-0011 decision 6),
 * so on this fixture — which holds no links — REF001 produces an outcome pair
 * and no coverage row. The first version of this check counted vector rows and
 * read 1, which is the model working, not a missing rule. */
/* THREE SINCE #58, AND THE THIRD ONE IS WHY THIS COUNT IS WORTH ASSERTING. This
 * line read `2` and `no REQ001 ran` until REQ001 shipped. The claim it makes has
 * not changed — the fixture is narrower than #10 specified — but the reason
 * REQ001 contributes nothing has: it is no longer absent, it is present with an
 * empty applicable set, because `cfg()` configures no rule. The two states look
 * identical in a report and are not the same fact. */
check('three rules ran, not eight', Object.keys(r3.outcomes).length, 3);
check('  REF001 ran and reported an outcome', r3.outcomes[REF001_ID] !== undefined, true);
check('  but it LEFT the vector, having no applicable subject here', r3.coverage.some(c => c.rule === REF001_ID), false);
check('  which is ADR-0011 decision 6, not a missing rule', r3.outcomes[REF001_ID]?.evidence, null);
check('  REQ001 ran and reported an outcome', r3.outcomes.REQ001 !== undefined, true);
check('  and it too LEFT the vector — this config declares no required property', r3.coverage.some(c => c.rule === 'REQ001'), false);
check('  its conformity is ABSENT, never `conforms`', r3.outcomes.REQ001?.conformity, null);
check('  no UNQ001 ran', r3.outcomes.UNQ001 === undefined, true);
check('the data source is a named drop-out, not an evaluated resource', r3.gaps.some(g => /data-source enumeration is not implemented/.test(g.cause)), true);
console.log('  ^ a result reported as closing #10 would be a coverage claim over an unrun');
console.log('    set, which is the defect class this product exists to detect. Spec §1.3.');

finish('The slice fails correctly on four of five branches. On the fifth it cannot fail at all, and that is the finding: #35.');
