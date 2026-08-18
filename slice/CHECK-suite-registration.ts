/* The suite checks that the suite is complete — issues #55 and #60.
 *
 *   npx tsx CHECK-suite-registration.ts
 *
 * No network, no .env, no token. Reads two files in this directory and nothing
 * else.
 *
 * WHY THIS EXISTS. Both gates this repo runs before a commit are list-driven,
 * and a file missing from either list is silently not covered while the gate
 * reports success:
 *
 *   - `tsconfig.json` had an explicit 26-entry `include`. `CHECK-residuals.ts`
 *     was written against five exports that did not exist and `tsc --noEmit`
 *     exited 0. That half is fixed by a glob.
 *   - `package.json`'s `check` script names each suite by hand. A glob cannot
 *     fix that half — the script has to run them in order — so it needs a
 *     control instead.
 *   - And the glob only decides WHICH files the typecheck reads. Nothing RAN
 *     it: `check` chained eight suites and no compiler, so a type error passed
 *     the gate at exit 0 for as long as the slice has existed. That is #60, and
 *     TEST 4 is its control.
 *
 * A green gate over an unrun set is the defect class this product exists to
 * detect. Finding it inside this product's own instrument is the reason this
 * file is worth its weight.
 *
 * THE BOOTSTRAP HOLE IS REAL AND IS STATED RATHER THAN HIDDEN. If someone adds
 * a suite AND forgets to register it, this control catches it — but only
 * because this file is itself registered. Nothing catches the removal of this
 * file from the script except reading the script. That is irreducible for a
 * runner that takes an ordered list, and the residual risk is one line in one
 * file rather than one line per suite added forever.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { createHarness } from './CHECK-harness.js';

const { check, head, finish } = createHarness();

/* Not suites. `CHECK-harness.ts` is the assertion library every suite imports
 * and `CHECK-fakes.ts` is the shared Notion fake; neither has a `finish()` and
 * running either would assert nothing. They are named here explicitly rather
 * than detected by a heuristic, because a heuristic that guesses which files
 * are suites is the same hand-maintained list wearing a regular expression. */
const NOT_SUITES = new Set(['CHECK-harness.ts', 'CHECK-fakes.ts']);

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  scripts: Record<string, string>;
};
const checkScript = pkg.scripts.check ?? '';

const onDisk = readdirSync(new URL('.', import.meta.url))
  .filter(f => f.startsWith('CHECK-') && f.endsWith('.ts') && !NOT_SUITES.has(f))
  .sort();

head('TEST 1 — every suite on disk is registered in the `check` script');

check('suites were found on disk at all', onDisk.length > 0, true);
/* If this ever reads 0 the loop below asserts nothing and the file goes green
 * having tested nothing — the empty-set hole that makes a negative assertion
 * pass vacuously, which `requiredSection` exists to close elsewhere. */

for (const f of onDisk) {
  const entry = `tsx ${f}`;
  check(`  ${f} is in \`npm run check\``, checkScript.includes(entry), true);
}

head('TEST 2 — the script names no suite that does not exist');

/* The other direction, and it fails differently: a script naming a deleted file
 * does not silently under-test, it crashes the gate. Worth catching here so the
 * failure names the cause instead of surfacing as `tsx: cannot open`. */
const named = [...checkScript.matchAll(/tsx (CHECK-[\w.-]+\.ts)/g)].map(m => m[1]!);
check('the script names at least one suite', named.length > 0, true);
for (const f of named) check(`  ${f} exists on disk`, onDisk.includes(f), true);

head('TEST 3 — tsconfig covers this directory by glob, not by a hand-kept list');

const tsconfig = readFileSync(new URL('./tsconfig.json', import.meta.url), 'utf8');
const include = (JSON.parse(tsconfig) as { include: string[] }).include;
/* THE ASSERTION IS ON THE SHAPE, NOT ON THE CONTENTS. Asserting that a specific
 * set of files appears would rebuild the hand-maintained list inside the control
 * meant to retire it — and would go stale on the next file added, which is
 * exactly the failure mode under test. */
check('include is a single entry', include.length, 1);
check('  and it is a glob over this directory', include[0], '*.ts');
check('  so no file in slice/ can be omitted from the typecheck by forgetting it', include.some(p => p.includes('CHECK-')), false);

head('TEST 4 — the `check` script runs the typecheck, and the typecheck it runs is real');

/* THE CHAIN HAS FOUR LINKS AND EVERY ONE IS ASSERTED — issue #60.
 *
 * `tsconfig.json` being a glob (TEST 3) makes the typecheck cover every file.
 * It does not make anything RUN the typecheck. `npm run check` chained eight
 * suites and no compiler, so a type error passed the gate at exit 0 while the
 * suites went green over code that does not compile — the same shape as the
 * hole in TEST 3, one layer up, and the reason both live in this file.
 *
 * Asserting only that `check` mentions the typecheck would leave this control
 * SUBSTITUTABLE: redefining `typecheck` to `echo ok` keeps that assertion green
 * while the gate stops typechecking, and a control that passes with its own
 * mechanism bypassed has tested nothing. So the invoked script is checked too. */
const typecheckScript = pkg.scripts.typecheck ?? '';

check('the `check` script invokes the typecheck', checkScript.includes('npm run typecheck'), true);
check('  and the `typecheck` script runs the compiler', /(^|\s)tsc(\s|$)/.test(typecheckScript), true);
check('  and passes --noEmit, so it checks rather than builds', typecheckScript.includes('--noEmit'), true);

/* THE SEPARATOR IS PART OF THE MECHANISM. `npm run typecheck ; tsx …` runs the
 * compiler and then discards its exit code, which reinstates the exact defect
 * under test while every assertion above stays green. */
check('  and is chained with && so a failure stops the gate', /npm run typecheck\s*&&/.test(checkScript), true);

/* ORDERING IS ASSERTED RATHER THAN LEFT TO HABIT. A type error usually explains
 * the assertion failures that follow it; reported after 500-odd assertions it
 * has scrolled off. #60 records the ordering as revisable — if it is revised,
 * this pair is what changes, which is the point of writing it down. */
const typecheckAt = checkScript.indexOf('npm run typecheck');
const firstSuiteAt = checkScript.indexOf('tsx CHECK-');
/* Both indices are asserted PRESENT first. Without this line a script naming
 * neither would compare -1 < -1, which is false but says nothing about order,
 * and a script naming only the suites would compare -1 < 0 and pass VACUOUSLY —
 * the empty-set hole TEST 1 guards with its `onDisk.length > 0` line. */
check('  both the typecheck and a suite are present to order', typecheckAt >= 0 && firstSuiteAt >= 0, true);
check('  and the typecheck runs before the first suite', typecheckAt >= 0 && firstSuiteAt >= 0 && typecheckAt < firstSuiteAt, true);

finish(
  'Both gates are list-driven, and this file is the control for what a glob cannot fix. TEST 3\n' +
  'covers WHICH files the typecheck reads; TEST 4 covers WHETHER anything runs it. A green gate\n' +
  'over an unrun set is what this product exists to detect.',
);
