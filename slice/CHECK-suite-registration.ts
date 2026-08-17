/* The suite checks that the suite is complete — issue #55.
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

finish(
  'Both gates are list-driven. The typecheck half is now a glob; this file is the control for\n' +
  'the half that cannot be. A green gate over an unrun set is what this product exists to detect.',
);
