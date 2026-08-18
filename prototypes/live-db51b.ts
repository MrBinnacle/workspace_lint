/* THROWAWAY. Live probe #2 for issue #51 — the ID-kind × endpoint truth table.
 *
 *   npx tsx live-db51b.ts
 *
 * Read-only. Every call is a GET. Nothing is created, updated, moved or deleted.
 * The token is read from .env by this process and NEVER printed; every line goes
 * through scrub(). IDs print as 8-hex suffixes only.
 *
 * Probe 1 (live-db51.ts) found that `GET /v1/pages/{database_id}` returns 400
 * validation_error and NOT 404. If that holds, the Route B ambiguity #51 calls
 * a permanent precision limit is DISTINGUISHABLE at the status code, with no
 * port widening at all. That is a strong claim, so this probe tries to break it:
 *
 *   C1  does an ID that names nothing return 404 on /v1/pages?  (else 400 is
 *       just "unparseable" and carries no object-kind information)
 *   C2  what does the 400 body actually SAY?
 *   C3  does a database the integration CANNOT read return 400 or 404? If 404,
 *       the 400 only distinguishes GRANTED databases and the ambiguity survives
 *       for every database outside the grant — which is most of them.
 *   C4  the reverse directions: page ID against /v1/databases and
 *       /v1/data_sources.
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

const hyphenate = (raw: string): string => {
  const h = raw.replace(/-/g, '').toLowerCase();
  return h.length === 32 ? `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}` : raw;
};
const sfx = (raw: string): string => `…${hyphenate(raw).replace(/-/g, '').slice(-8)}`;

/** An API message can quote a workspace title. Truncate and scrub before printing. */
const msg = (s: unknown): string => String(s ?? '').replace(/\s+/g, ' ').slice(0, 220);

async function get(path: string) {
  try {
    const r = await fetch(`https://api.notion.com${path}`, {
      method: 'GET', headers: { Authorization: `Bearer ${TOKEN}`, 'Notion-Version': VERSION },
    });
    const body: any = await r.json().catch(() => ({}));
    return { status: r.status, code: body?.code as string | undefined, body };
  } catch { return { status: 0, code: 'transport', body: {} as any }; }
}

async function probe(label: string, path: string) {
  const r = await get(path);
  const what = r.status === 200
    ? `object=${r.body?.object ?? '?'} id=${r.body?.id ? sfx(String(r.body.id)) : '—'}`
    : `code=${r.code ?? '—'}  msg="${msg(r.body?.message)}"`;
  say(`  ${String(r.status).padEnd(4)} ${label.padEnd(44)} ${what}`);
  return r;
}

async function main() {
  say('workspace_lint — LIVE probe #2 for #51 (ID-kind × endpoint truth table)');
  say(`Notion-Version: ${VERSION} · read-only, GET only · ${new Date().toISOString()}`);
  say('');

  const ROOT = hyphenate(env.FIXTURE_ROOT_ID ?? '');
  const UNSHARED = env.UNSHARED_PAGE_ID ? hyphenate(env.UNSHARED_PAGE_ID) : '';

  const kids = await get(`/v1/blocks/${ROOT}/children?page_size=100`);
  const dbBlock = (kids.body?.results ?? []).find((b: any) => b.type === 'child_database');
  if (!dbBlock) { say('FATAL: no child_database under the root.'); process.exit(4); }
  const DB = hyphenate(dbBlock.id);
  const dbRes = await get(`/v1/databases/${DB}`);
  const DS = hyphenate(String((dbRes.body?.data_sources ?? [])[0]?.id ?? ''));

  say(`subjects — database ${sfx(DB)} · data source ${sfx(DS)} · page(root) ${sfx(ROOT)}`);
  say('');

  say('──── C1. an ID that names nothing (random v4 UUID, never allocated) ────');
  /* Fixed literal, not generated: a hard-coded ID is reproducible by a reader,
   * and Math.random() in a proof script makes the run unrepeatable. */
  const NOWHERE = '00000000-0000-4000-8000-000000000000';
  await probe('GET /v1/pages/{nowhere}', `/v1/pages/${NOWHERE}`);
  await probe('GET /v1/databases/{nowhere}', `/v1/databases/${NOWHERE}`);
  await probe('GET /v1/data_sources/{nowhere}', `/v1/data_sources/${NOWHERE}`);
  say('');

  say('──── C2. the database ID against /v1/pages — the exact body ────');
  await probe('GET /v1/pages/{database_id}', `/v1/pages/${DB}`);
  await probe('GET /v1/pages/{data_source_id}', `/v1/pages/${DS}`);
  say('');

  say('──── C3. a database OUTSIDE the grant — 400 or 404? ────');
  /* UNSHARED_PAGE_ID is a page, not a database, so it answers the weaker
   * question: does an object outside the grant 404 on its OWN endpoint? If a
   * page outside the grant 404s on /v1/pages, an unread database plausibly 404s
   * on /v1/databases too, and the 400 above is evidence the ID is a KNOWN
   * database rather than merely a non-page. Stated as the limit it is. */
  if (UNSHARED) {
    await probe('GET /v1/pages/{unshared page}', `/v1/pages/${UNSHARED}`);
    await probe('GET /v1/databases/{unshared page}', `/v1/databases/${UNSHARED}`);
    await probe('GET /v1/data_sources/{unshared page}', `/v1/data_sources/${UNSHARED}`);
  } else say('  UNSHARED_PAGE_ID not in .env — not run.');
  say('');

  say('──── C4. the reverse directions from a KNOWN page ID ────');
  await probe('GET /v1/pages/{root page}', `/v1/pages/${ROOT}`);
  await probe('GET /v1/databases/{root page}', `/v1/databases/${ROOT}`);
  await probe('GET /v1/data_sources/{root page}', `/v1/data_sources/${ROOT}`);
  say('');

  say('──── C5. does /v1/blocks/{id} accept the database ID? ────');
  await probe('GET /v1/blocks/{database_id}', `/v1/blocks/${DB}`);
  await probe('GET /v1/blocks/{data_source_id}', `/v1/blocks/${DS}`);
  say('');

  say('probe complete. Nothing was written.');
}

main().catch(e => { say(`UNHANDLED: ${scrub(String(e?.message ?? e))}`); process.exit(4); });
