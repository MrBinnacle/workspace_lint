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

const key = process.argv[2] ?? 'FIXTURE_ROOT_ID';
const id = hyphenate(env[key]);
if (!id) {
  console.log(`${key} is missing from .env or is not a Notion ID. Nothing was written.`);
  process.exit(4);
}

const out = join(HERE, '..', 'wl.config.json');
writeFileSync(out, JSON.stringify({ version: 1, roots: [{ id, alias: 'wl-proof-fixture' }], minCoverage: 1.0 }, null, 2) + '\n', 'utf8');
console.log(`wrote wl.config.json — root ${id.slice(0, 8)}… from ${key}`);
