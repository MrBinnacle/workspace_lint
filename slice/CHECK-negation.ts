/* The suite over negation.ts — #125.
 *
 *   npx tsx CHECK-negation.ts
 *
 * No network, no .env, no token. The mechanism, and the whole argument for why
 * it exists, is in `negation.ts`. This file only tests it.
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHarness } from './CHECK-harness.js';
import { audit, digestOf, findNegations, loadBaseline, normalise, scannedFiles, type Baseline } from './negation.js';

const { check, head, finish } = createHarness();

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');

head('TEST 1 — the detector finds a negative capability claim and reads its marker');

const FIX_UNMARKED = 'The integration cannot enumerate its own grant.';
const FIX_NMF = 'Nothing returns the set of objects an integration may read.\n<!-- nmf -->';
const FIX_VENDOR = 'The API does not support a read-only PAT.\n<!-- claim: vendor url="https://example.invalid/x" fetched="2026-08-19" quote="z" -->';
/* NEGATIVE WORD, NO VENDOR TOKEN. This is the product talking about itself. */
const FIX_OURS = 'A partial scan cannot report an unqualified verdict.';
/* VENDOR TOKEN, NO NEGATIVE WORD. */
const FIX_POSITIVE = 'The Notion endpoint returns a data_sources array.';

check('an unmarked vendor negative is found', findNegations(FIX_UNMARKED, 'f.md').length, 1);
check('  and it is reported as untyped', findNegations(FIX_UNMARKED, 'f.md')[0]!.marked, null);
check('an nmf-marked sentence is found and typed', findNegations(FIX_NMF, 'f.md')[0]!.marked, 'nmf');
check('a vendor-marked sentence is found and typed', findNegations(FIX_VENDOR, 'f.md')[0]!.marked, 'vendor');
check('a negative about OUR product is not flagged', findNegations(FIX_OURS, 'f.md').length, 0);
check('a positive vendor sentence is not flagged', findNegations(FIX_POSITIVE, 'f.md').length, 0);

head('TEST 2 — the marker comment is not itself scanned');

/* The `vendor` marker carries a quote= that can contain the vendor's own negative
 * wording. Scanning it would flag the comment that types the sentence. */
const FIX_SELF = '<!-- claim: vendor url="https://example.invalid/x" fetched="2026-08-19" quote="the API cannot do this" -->';
check('a marker line carrying a negative quote is skipped', findNegations(FIX_SELF, 'f.md').length, 0);

head('TEST 3 — identity is the sentence, never the line number');

const SHIFTED = `# Heading\n\nA paragraph inserted above.\n\n${FIX_UNMARKED}`;
check('inserting lines above does not change the digest',
  findNegations(SHIFTED, 'f.md')[0]!.digest, findNegations(FIX_UNMARKED, 'f.md')[0]!.digest);
check('  but the reported line number does move', findNegations(SHIFTED, 'f.md')[0]!.line, 5);
check('editing the sentence DOES change the digest',
  findNegations('The integration cannot enumerate its grant.', 'f.md')[0]!.digest
    === findNegations(FIX_UNMARKED, 'f.md')[0]!.digest, false);
check('the same sentence in a different file is a different identity',
  digestOf('a.md', FIX_UNMARKED) === digestOf('b.md', FIX_UNMARKED), false);

head('TEST 4 — a fenced example is documentation, not an assertion');

const FENCED = '# Doc\n\n```markdown\nThe Notion API cannot do this.\n```\n';
check('a negative inside a fence is not flagged', findNegations(FENCED, 'f.md').length, 0);

head('TEST 5 — THE MUTATION. Disable the marker and the sentence must go untyped.');

/* SCORED ON THE MUTANT'S OWN VERDICT, not on a printed string — a crashed suite
 * prints no FAIL, so grepping for FAIL cannot see a crash. `findNegations` is
 * pure, so the mutation is applied by removing the marker from the input rather
 * than by editing the module. */
const mutantMarked = findNegations(FIX_NMF.replace('<!-- nmf -->', ''), 'f.md')[0]!.marked;
check('with the marker gone, a typed sentence reads as UNTYPED', mutantMarked, null);
check('  so the marker lookup is load-bearing rather than decorative',
  mutantMarked === findNegations(FIX_NMF, 'f.md')[0]!.marked, false);

head('TEST 6 — a stale baseline entry FAILS rather than passing vacuously');

/* Driven through `audit` itself rather than a local reimplementation, because a
 * hand-rolled stand-in is a control that can substitute for the mechanism. */
const live = findNegations(FIX_UNMARKED, 'f.md')[0]!;
const DEAD: Baseline = [{ digest: 'deadbeef0000', file: 'f.md', note: 'a sentence that is gone' }];
check('the digest is stable across a normalise() round trip', digestOf('f.md', normalise(FIX_UNMARKED)), live.digest);
check('an entry matching nothing in the repository is stale', audit(REPO, DEAD).stale.length, 1);
check('  and it names the file so it can be removed', audit(REPO, DEAD).stale[0]!.file, 'f.md');

head('TEST 7 — the repository itself');

const baseline = loadBaseline(REPO);
const result = audit(REPO, baseline);

/* THE EMPTY-SET CONTROL. A scope matching no files, or a lexicon matching
 * nothing, makes every assertion below pass over nothing. */
check('the scanned set is non-empty', scannedFiles(REPO).length > 2, true);
check('  and it reaches the ADRs, not only the two root documents',
  scannedFiles(REPO).some(f => f.startsWith('docs/adr/')), true);
check('  and the detector finds negatives in it at all', result.hits.length > 0, true);
check('the baseline is non-empty, so its stale-entry check is not vacuous', baseline.length > 0, true);

/* A DISPOSITIONED ENTRY MUST NOT RENDER AS AN UNCHECKED ONE. A sentence proved
 * wrong and frozen in an un-editable ADR is a different state from one nobody has
 * looked at, and collapsing them is the failure NASA's deviation/waiver split
 * exists to prevent. This asserts the two states are distinguishable AT ALL —
 * without it the field can be added, never populated, and never noticed. */
check('at least one baseline entry carries a disposition', baseline.some(b => b.disposition), true);
check('  and an undispositioned entry is still distinguishable from it', baseline.some(b => !b.disposition), true);

console.log(`\n   scanned ${scannedFiles(REPO).length} decision surfaces`);
console.log(`   ${result.hits.length} negative-capability sentence(s) found`);
console.log(`   ${result.hits.filter(h => h.marked === 'vendor').length} typed as STRONG NEGATION (vendor-attested)`);
console.log(`   ${result.hits.filter(h => h.marked === 'nmf').length} typed as NEGATION AS FAILURE`);
console.log(`   ${baseline.length} in the baseline — accepted debt, still visible`);
console.log(`   ${baseline.filter(b => b.disposition).length} of those carry a DISPOSITION — checked since, and frozen in a document that cannot be edited`);

for (const b of baseline.filter(b => b.disposition)) {
  console.log(`\n   ${b.disposition!.split(' ')[0]}  ${b.file}  [${b.digest}]\n     ${b.note.slice(0, 110)}\n     → ${b.disposition!.slice(0, 150)}`);
}

for (const h of result.unaccounted) {
  console.log(`\n   UNTYPED  ${h.file}:${h.line}  [${h.digest}]\n     ${h.sentence.slice(0, 140)}`);
}
for (const s of result.stale) {
  console.log(`\n   STALE BASELINE ENTRY  ${s.file}  [${s.digest}] — the sentence is gone; remove this entry`);
}

check('every negative sentence is typed or baselined', result.unaccounted.length, 0);
check('the baseline contains no dead entries', result.stale.length, 0);

finish(
  `A negative claim about the vendor must declare whether it is STRONG NEGATION — the vendor
says so, with a locator — or NEGATION AS FAILURE, which reads "it is not currently
believed that". Four reversals on 2026-08-19 were all the second wearing the first's
clothes. This types the sentence; it does not check that the sentence is true.`,
);
