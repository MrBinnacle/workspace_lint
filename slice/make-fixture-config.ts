/* Fixture tooling, not product code.
 *
 *   npx tsx make-fixture-config.ts
 *
 * Writes ../wl.config.json addressing the proof fixture's declared root by ID,
 * reading that ID from ../.env. The generated file is gitignored: it names a
 * real page in a real workspace.
 *
 * This exists because the config contract is ID-only. There is deliberately no
 * "${FIXTURE_ROOT_ID}" interpolation in the config loader and no --root-from-env
 * flag on the CLI — either one would put a name between the operator and the
 * resource, which is the indirection CONTEXT.md's settled default forbids. The
 * substitution happens HERE, in a fixture tool, before the config exists.
 *
 * Prints a truncated ID and never prints the token.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { hyphenate } from './ids.js';

const HERE = dirname(fileURLToPath(import.meta.url));

const env: Record<string, string> = {};
for (const line of readFileSync(join(HERE, '..', '.env'), 'utf8').split(/\r?\n/)) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
  if (m) env[m[1]!] = m[2]!.trim().replace(/^["']|["']$/g, '');
}

/* THE FLAG AND ITS VALUE ARE REMOVED BEFORE THE POSITIONAL IS READ.
 *
 * `argv[2]` was read blindly, so `--property title` set the env key to
 * `--property` and the tool exited 4 saying `--property is missing from .env`,
 * naming a flag as if it were an environment variable. Filtering only tokens
 * that start with `--` is the second version of the same bug: it takes `title`,
 * the flag's VALUE, as the env key. The flag is a PAIR and both halves leave. */
const args = process.argv.slice(2);
const propertyFlag = args.indexOf('--property');
const property = propertyFlag >= 0 ? args[propertyFlag + 1] : undefined;
if (propertyFlag >= 0 && (!property || property.startsWith('--'))) {
  console.log('--property needs a property name. Nothing was written.');
  process.exit(4);
}

/* WHICH configured rule the property belongs to — #59.
 *
 *   npx tsx make-fixture-config.ts FIXTURE_ROOT_ID --property title --rule UNQ001
 *
 * Defaults to REQ001, which is what every recorded run before 2026-08-19 used,
 * so an existing command line keeps producing the file it produced. The flag is
 * a PAIR and both halves leave before the positional is read, for the reason
 * `--property` does — that bug was fixed twice here already.
 */
const ruleFlag = args.indexOf('--rule');
const rule = ruleFlag >= 0 ? args[ruleFlag + 1] : 'REQ001';
if (ruleFlag >= 0 && (!rule || rule.startsWith('--'))) {
  console.log('--rule needs a rule ID. Nothing was written.');
  process.exit(4);
}
/* VALIDATED HERE, NOT LEFT TO THE LOADER. The loader would reject a bad ID at
 * exit 4 with a good message, but only after this tool had already overwritten
 * a working config with an unusable one. */
if (rule !== 'REQ001' && rule !== 'UNQ001') {
  console.log(`--rule is ${JSON.stringify(rule)}; this tool writes REQ001 or UNQ001 entries. Nothing was written.`);
  process.exit(4);
}
if (ruleFlag >= 0 && property === undefined) {
  console.log('--rule needs --property: both configured rules name a property. Nothing was written.');
  process.exit(4);
}

/* ⚠ ONE PASS OVER THE ORIGINAL INDICES, NOT TWO CHAINED FILTERS. Chaining
 * `.filter((_, i) => i !== propertyFlag …)` and then a second index filter reads
 * the SECOND flag's position in the ALREADY-SHORTENED array, so removing
 * `--property title` shifts `--rule` two places left and the positional picked
 * up is whatever landed there. This is the third variant of the same bug in
 * this file; the fix is to compute the removed positions first. */
const consumed = new Set<number>();
for (const at of [propertyFlag, ruleFlag]) if (at >= 0) consumed.add(at).add(at + 1);
const positional = args.filter((a, i) => !consumed.has(i) && !a.startsWith('--'));
const key = positional[0] ?? 'FIXTURE_ROOT_ID';
const id = hyphenate(env[key]);
if (!id) {
  console.log(`${key} is missing from .env or is not a Notion ID. Nothing was written.`);
  process.exit(4);
}

/* An optional REQ001 entry, for #58's live run.
 *
 *   npx tsx make-fixture-config.ts FIXTURE_ROOT_ID --property title
 *
 * THE SCOPE IS THE DECLARED ROOT AND THE TOOL DOES NOT OFFER A CHOICE. The
 * fixture has one root and this slice descends one level, so a scope anywhere
 * else selects one child or nothing — neither is what the pre-registered oracle
 * in fixture-oracle.ts expects, and an oracle that can be aimed after the fact
 * is not an oracle. A run over a different scope needs a new oracle row first.
 */
const out = join(HERE, '..', 'wl.config.json');
writeFileSync(
  out,
  JSON.stringify(
    {
      version: 1,
      roots: [{ id, alias: 'wl-proof-fixture' }],
      minCoverage: 1.0,
      ...(property ? { rules: [{ rule, scope: { id }, property }] } : {}),
    },
    null,
    2,
  ) + '\n',
  'utf8',
);
console.log(`wrote wl.config.json — root ${id.slice(0, 8)}… from ${key}${property ? ` · ${rule} over "${property}"` : ''}`);
