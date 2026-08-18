/* THROWAWAY. Live probe #3 for issue #51 — what a Route A database reference
 * actually carries.
 *
 *   npx tsx live-db51c.ts <page-id>
 *
 * Read-only for the SUBJECT integration. Every call is a GET. The page it reads
 * was created by the BUILDER identity (the claude.ai connector) and is removed
 * from the fixture root once this observation is recorded — see
 * docs/proof/results-51-database-identity.md.
 *
 * The token is read from .env by this process and NEVER printed.
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
const sfx = (raw: string): string => `…${hyphenate(String(raw)).replace(/-/g, '').slice(-8)}`;

async function get(path: string) {
  const r = await fetch(`https://api.notion.com${path}`, {
    method: 'GET', headers: { Authorization: `Bearer ${TOKEN}`, 'Notion-Version': VERSION },
  });
  const body: any = await r.json().catch(() => ({}));
  return { status: r.status, body };
}

/** Print a block's reference-bearing fields with their REAL field names. */
function dump(b: any) {
  say(`  block ${sfx(b.id)} type=${b.type}`);
  if (b.type === 'link_to_page') {
    say(`    link_to_page keys: ${Object.keys(b.link_to_page ?? {}).join(', ')}`);
    for (const [k, v] of Object.entries(b.link_to_page ?? {}))
      say(`      link_to_page.${k} = ${typeof v === 'string' ? sfx(v) : JSON.stringify(v)}`);
  }
  const rich: any[] = b[b.type]?.rich_text ?? [];
  for (const t of rich) {
    if (t?.mention) {
      const m = t.mention;
      say(`    mention.type = ${m.type}; keys of mention.${m.type}: ${Object.keys(m[m.type] ?? {}).join(', ')}`);
      for (const [k, v] of Object.entries(m[m.type] ?? {}))
        say(`      mention.${m.type}.${k} = ${typeof v === 'string' && /^[0-9a-f-]{32,36}$/i.test(v) ? sfx(v) : JSON.stringify(v).slice(0, 80)}`);
    } else if (t?.href) {
      /* An href path can carry a page title. Print the ID part only. */
      const id = /([0-9a-f]{32})/i.exec(String(t.href))?.[1];
      say(`    rich_text href → id=${id ? sfx(id) : '(no 32-hex id in href)'}  type=${t.type}`);
    }
  }
}

async function main() {
  const target = process.argv[2];
  if (!target) { say('usage: tsx live-db51c.ts <page-id>'); process.exit(4); }

  say('workspace_lint — LIVE probe #3 for #51 (Route A database reference shape)');
  say(`Notion-Version: ${VERSION} · read-only, GET only · ${new Date().toISOString()}`);
  say('');

  const DB = 'f937580c-0964-4ea7-a781-b9119887ee5b';
  const DS = '689bb2ff-29b0-469d-a1d0-e505cd5c4903';
  say(`known identities — database ${sfx(DB)} · data source ${sfx(DS)}`);
  say('');

  const r = await get(`/v1/blocks/${hyphenate(target)}/children?page_size=100`);
  if (r.status !== 200) { say(`FAILED — ${r.status} ${r.body?.code ?? ''}: ${String(r.body?.message ?? '').slice(0, 160)}`); process.exit(4); }
  const blocks: any[] = r.body?.results ?? [];
  say(`${blocks.length} blocks; types: ${[...new Set(blocks.map(b => b.type))].join(', ')}`);
  say('');
  for (const b of blocks) dump(b);

  say('');
  say('probe complete. Nothing was written by this process.');
}

main().catch(e => { say(`UNHANDLED: ${scrub(String(e?.message ?? e))}`); process.exit(4); });
