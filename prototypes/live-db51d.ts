/* THROWAWAY. Live probe #4 for issue #51 — the contrast case.
 *
 *   npx tsx live-db51d.ts
 *
 * Probe 2 established that a database INSIDE the grant returns 400
 * validation_error on GET /v1/pages/{id}, with a message naming the object kind.
 * If that also holds for a database OUTSIDE the grant, the 400/404 split
 * separates "readable database" from "dead link" for every database. If an
 * ungranted database 404s instead, the split only works inside the grant and the
 * Route B ambiguity survives for every database the connection cannot read.
 *
 * `wl-outside-grant-db` was created top-level by the BUILDER identity, never
 * connected to the subject integration, and never linked from the fixture. It is
 * the database analogue of `wl-outside-grant`.
 *
 * Read-only. GET only. The token is read from .env and NEVER printed.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const env: Record<string, string> = {};
for (const line of readFileSync(join(HERE, '..', '.env'), 'utf8').split(/\r?\n/)) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const TOKEN = env.NOTION_TOKEN ?? '';
const VERSION = env.NOTION_VERSION || '2026-03-11';
const SECRETS = [TOKEN].filter(s => s.length > 8);
function scrub(s: string): string {
  let out = s;
  for (const sec of SECRETS) out = out.split(sec).join('«REDACTED»');
  return out.replace(/\b(ntn_|secret_)[A-Za-z0-9]{8,}/g, '«REDACTED»');
}
const say = (s = '') => console.log(scrub(s));
if (!TOKEN) { say('FATAL: NOTION_TOKEN empty. Nothing was called.'); process.exit(4); }

/** Ungranted database and its data source, created for this probe. */
const OUT_DB = '62890fc7-ce45-4d9b-beb2-6ac125ef8879';
const OUT_DS = 'f4581b39-a09e-4ec4-95cc-077ef23e4b04';
const sfx = (raw: string) => `…${raw.replace(/-/g, '').slice(-8)}`;
const msg = (s: unknown) => String(s ?? '').replace(/\s+/g, ' ').slice(0, 170);

async function probe(label: string, path: string) {
  const r = await fetch(`https://api.notion.com${path}`, {
    method: 'GET', headers: { Authorization: `Bearer ${TOKEN}`, 'Notion-Version': VERSION },
  });
  const b: any = await r.json().catch(() => ({}));
  say(`  ${String(r.status).padEnd(4)} ${label.padEnd(40)} code=${b?.code ?? '—'}  msg="${msg(b?.message)}"`);
}

async function main() {
  say('workspace_lint — LIVE probe #4 for #51 (a database OUTSIDE the grant)');
  say(`Notion-Version: ${VERSION} · read-only, GET only · ${new Date().toISOString()}`);
  say(`subject — ungranted database ${sfx(OUT_DB)} · its data source ${sfx(OUT_DS)}`);
  say('');
  await probe('GET /v1/pages/{ungranted database}', `/v1/pages/${OUT_DB}`);
  await probe('GET /v1/databases/{ungranted database}', `/v1/databases/${OUT_DB}`);
  await probe('GET /v1/data_sources/{ungranted database}', `/v1/data_sources/${OUT_DB}`);
  await probe('GET /v1/blocks/{ungranted database}', `/v1/blocks/${OUT_DB}`);
  await probe('GET /v1/pages/{ungranted data source}', `/v1/pages/${OUT_DS}`);
  await probe('GET /v1/data_sources/{ungranted data source}', `/v1/data_sources/${OUT_DS}`);
  say('');
  say('probe complete. Nothing was written.');
}

main().catch(e => { say(`UNHANDLED: ${scrub(String(e?.message ?? e))}`); process.exit(4); });
