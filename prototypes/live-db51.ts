/* THROWAWAY. Live probe for issue #51 — what a database ID names, and which
 * endpoint retrieves it, at Notion-Version 2026-03-11.
 *
 *   npx tsx live-db51.ts
 *
 * Read-only. Every call is a GET. Nothing is created, updated, moved or deleted.
 * Principle 7 holds at the call site, not only at the credential.
 *
 * The token is read from .env by this process and is NEVER printed. Every line
 * of output passes through scrub() before it reaches stdout. IDs are printed as
 * 8-hex suffixes only — that is what docs/proof/fixture.md already records, and
 * a full ID plus a title is a workspace leak.
 *
 * The three questions, taken from #51:
 *   Q-A1  which object does a child_database block's `id` name?
 *   Q-A2  which object does a `mention.database.id` / `link_to_page.database_id`
 *         carry — the same one, or the data source?
 *   Q-B   which endpoint retrieves it, and are the two ID types interchangeable?
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/* ---------------------------------------------------------------- env ---- */

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

if (!TOKEN) { say('FATAL: NOTION_TOKEN is empty in .env. Nothing was called.'); process.exit(4); }

const ROOT = env.FIXTURE_ROOT_ID ?? '';
if (!ROOT) { say('FATAL: FIXTURE_ROOT_ID is empty in .env. Nothing was called.'); process.exit(4); }

/* ------------------------------------------------------------ the call --- */

const hyphenate = (raw: string): string => {
  const h = raw.replace(/-/g, '').toLowerCase();
  return h.length === 32 ? `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}` : raw;
};
/** The only form of an ID that reaches stdout. */
const sfx = (raw: string): string => `…${hyphenate(raw).replace(/-/g, '').slice(-8)}`;

type Res = { status: number; code?: string; body: any };

async function get(path: string): Promise<Res> {
  try {
    const r = await fetch(`https://api.notion.com${path}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Notion-Version': VERSION },
    });
    const body = await r.json().catch(() => ({}));
    return { status: r.status, code: body?.code, body };
  } catch {
    return { status: 0, code: 'transport', body: {} };
  }
}

/** Report one retrieve attempt in one line. Body fields only, never the request. */
async function probe(label: string, path: string): Promise<Res> {
  const r = await get(path);
  const ok = r.status === 200;
  const what = ok
    ? `object=${r.body?.object ?? '?'} id=${r.body?.id ? sfx(String(r.body.id)) : '—'} parent=${r.body?.parent?.type ?? '—'}`
    : `code=${r.code ?? '—'}`;
  say(`  ${String(r.status).padEnd(4)} ${label.padEnd(46)} ${what}`);
  return r;
}

/* ------------------------------------------------------------- the run --- */

async function main() {
  say('workspace_lint — LIVE probe for #51 (database identity and retrieval)');
  say(`Notion-Version: ${VERSION} · read-only, GET only · ${new Date().toISOString()}`);
  say('');

  const me = await get('/v1/users/me');
  if (me.status !== 200) { say(`AUTH FAILED — ${me.status} ${me.code ?? ''}`); process.exit(4); }
  say(`bot identity ok — type=${me.body?.type ?? '?'}`);
  say('');

  /* -- 1. find the child_database block under the declared root ----------- */
  say('──── 1. root enumeration — what kind of block is the dataset? ────');
  const kids = await get(`/v1/blocks/${hyphenate(ROOT)}/children?page_size=100`);
  if (kids.status !== 200) { say(`root children FAILED — ${kids.status} ${kids.code ?? ''}`); process.exit(4); }
  const blocks: any[] = kids.body?.results ?? [];
  say(`  ${blocks.length} blocks; types: ${[...new Set(blocks.map(b => b.type))].join(', ')}`);

  const dbBlocks = blocks.filter(b => b.type === 'child_database');
  for (const b of dbBlocks) say(`  child_database block: block.id=${sfx(b.id)}`);
  if (!dbBlocks.length) { say('  NO child_database under the root. Q-A1 cannot be answered here.'); }
  say('');

  /* -- 2. Q-A1 + Q-B: which endpoint returns the child_database block ID? -- */
  for (const b of dbBlocks) {
    const D = hyphenate(b.id);
    say(`──── 2. the child_database block ID ${sfx(D)} against every retrieve ────`);
    await probe('GET /v1/pages/{child_database.id}', `/v1/pages/${D}`);
    const db = await probe('GET /v1/databases/{child_database.id}', `/v1/databases/${D}`);
    await probe('GET /v1/data_sources/{child_database.id}', `/v1/data_sources/${D}`);

    const sources: any[] = db.status === 200 ? (db.body?.data_sources ?? []) : [];
    say(`  data_sources listed by the database: ${sources.length}`);
    for (const s of sources) {
      const S = hyphenate(String(s.id));
      say(`  data source ${sfx(S)}  — same ID as the block? ${S === D ? 'YES' : 'NO'}`);
      say(`──── 3. the data source ID ${sfx(S)} against every retrieve ────`);
      await probe('GET /v1/data_sources/{data_source.id}', `/v1/data_sources/${S}`);
      await probe('GET /v1/databases/{data_source.id}', `/v1/databases/${S}`);
      await probe('GET /v1/pages/{data_source.id}', `/v1/pages/${S}`);
    }
    say('');
  }

  /* -- 4. Q-A2: what do Route A database references carry? ---------------- */
  say('──── 4. Route A database references in readable content ────');
  /* Walk the root's blocks and one level of child pages, the same depth the
   * slice walks. Only the two Route A shapes are inspected. */
  const pages = blocks.filter(b => b.type === 'child_page').map(b => b.id);
  const all: any[] = [...blocks];
  for (const p of pages) {
    const r = await get(`/v1/blocks/${hyphenate(p)}/children?page_size=100`);
    if (r.status === 200) all.push(...(r.body?.results ?? []));
  }
  say(`  ${all.length} blocks inspected (root + ${pages.length} child pages, first page each)`);

  let found = 0;
  for (const b of all) {
    const ltp = b.link_to_page;
    if (ltp?.database_id) { found++; say(`  link_to_page.database_id = ${sfx(String(ltp.database_id))}  (block ${sfx(b.id)})`); }
    if (ltp?.data_source_id) { found++; say(`  link_to_page.data_source_id = ${sfx(String(ltp.data_source_id))}  (block ${sfx(b.id)})`); }
    const rich: any[] = b[b.type]?.rich_text ?? [];
    for (const t of rich) {
      const m = t?.mention;
      if (!m) continue;
      if (m.type === 'database' && m.database?.id) { found++; say(`  mention.database.id = ${sfx(String(m.database.id))}  (block ${sfx(b.id)})`); }
      if (m.type === 'data_source' && m.data_source?.id) { found++; say(`  mention.data_source.id = ${sfx(String(m.data_source.id))}  (block ${sfx(b.id)})`); }
    }
  }
  if (!found) say('  NONE. The fixture carries no Route A database reference, so Q-A2 is UNOBSERVED here.');

  say('');
  say('probe complete. Nothing was written.');
}

main().catch(e => { say(`UNHANDLED: ${scrub(String(e?.message ?? e))}`); process.exit(4); });
