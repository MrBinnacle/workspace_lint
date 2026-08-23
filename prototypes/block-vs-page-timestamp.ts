/* THROWAWAY. Does a `child_page` block's last_edited_time track its PAGE's?
 *
 *   cd prototypes && npx tsx block-vs-page-timestamp.ts
 *
 * Pre-registration: docs/proof/prereg-block-vs-page-timestamp.md — read it first.
 * Predictions P1-P5 and the decision table are fixed there and are NOT re-derived here.
 *
 * ⛔ THIS PROBE WRITES. It is the first in this repository that does.
 *
 * It creates its OWN scratch child page under FIXTURE_ROOT_ID, edits that page twice,
 * measures, then archives it and verifies the archive by read-back. It modifies NO
 * existing page, block or property. Editing real fixture content would have measured
 * the same thing while risking content other proofs depend on.
 *
 * ⚠ Timestamps cannot be rolled back. The fixture root's own last_edited_time WILL move,
 * because a child was added and archived under it. Known, accepted, disclosed in the
 * pre-registration. No other proof reads the fixture root's edit time.
 *
 * The token is read from .env by this process and is NEVER printed. Every line of output
 * passes through scrub() before it reaches stdout, and the SDK is constructed with
 * logLevel 'error' because its own warn logger bypasses application redaction.
 */

import { Client } from '@notionhq/client';
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
const SECRETS = [TOKEN].filter(s => s.length > 8);

/** Nothing reaches stdout without passing through here. */
function scrub(s: string): string {
  let out = s;
  for (const sec of SECRETS) out = out.split(sec).join('«REDACTED»');
  return out.replace(/\b(ntn_|secret_)[A-Za-z0-9]{8,}/g, '«REDACTED»');
}
const say = (s = '') => console.log(scrub(s));

if (!TOKEN) { say('FATAL: NOTION_TOKEN is empty in .env. Nothing was called.'); process.exit(4); }

/** Which .env key holds the parent to create the scratch page under.
 *  Defaults to the fixture root; pass another key name as argv[2] to override. */
const ROOT_KEY = process.argv[2] || 'FIXTURE_ROOT_ID';
const ROOT = env[ROOT_KEY];
if (!ROOT) { say(`FATAL: ${ROOT_KEY} is empty in .env. Nothing was called.`); process.exit(4); }

const notion = new Client({
  auth: TOKEN,
  notionVersion: env.NOTION_VERSION || '2026-03-11',
  logLevel: 'error' as any,
});

/* -------------------------------------------------------------- utils ---- */

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Notion timestamps are second-granularity. Wait past it so a moved value is visible. */
const SETTLE_MS = 2500;

function hyphenate(id: string): string {
  const h = id.replace(/-/g, '');
  return h.length === 32
    ? `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
    : id;
}

/** Same-suffix match. Notion IDs are time-ordered so a PREFIX is not a discriminator —
 *  the declared root and two of its children share eight leading hex digits. */
const sameId = (a: string, b: string) => hyphenate(a) === hyphenate(b);

type Shot = { page: string | null; block: string | null; blockKeys: string[] };

/** One measurement: the page's own last_edited_time, and the block's, read the two ways. */
async function measure(pageId: string, label: string): Promise<Shot> {
  let page: string | null = null;
  try {
    const p: any = await notion.pages.retrieve({ page_id: pageId });
    page = p?.last_edited_time ?? null;
  } catch (e: any) {
    say(`  ${label}: page retrieve FAILED — ${scrub(String(e?.message ?? e))}`);
  }

  let block: string | null = null;
  let blockKeys: string[] = [];
  try {
    let cursor: string | undefined;
    outer: do {
      const r: any = await notion.blocks.children.list({
        block_id: ROOT, page_size: 100, start_cursor: cursor,
      });
      for (const b of r.results ?? []) {
        if (sameId(b?.id ?? '', pageId)) {
          block = b?.last_edited_time ?? null;
          blockKeys = Object.keys(b ?? {}).sort();
          break outer;
        }
      }
      cursor = r.has_more ? r.next_cursor : undefined;
    } while (cursor);
  } catch (e: any) {
    say(`  ${label}: children list FAILED — ${scrub(String(e?.message ?? e))}`);
  }

  say(`  ${label}: page=${page ?? '«absent»'}  block=${block ?? '«absent»'}`);
  return { page, block, blockKeys };
}

/* --------------------------------------------------------------- main ---- */

async function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const title = `wl-probe block-vs-page ts ${stamp} — prereg-block-vs-page-timestamp.md — DELETE ME`;

  say('=== block-vs-page timestamp probe ===');
  say('Pre-registration: docs/proof/prereg-block-vs-page-timestamp.md');
  say(`Parent from .env key: ${ROOT_KEY}`);
  say(`Parent id: ${hyphenate(ROOT)}`);
  say('');
  say('THIS PROBE WRITES. It creates one scratch page, edits it twice, then archives it.');
  say('No existing page, block or property is modified.');
  say('');

  /* -- 1. create the subject ------------------------------------------- */
  let pageId = '';
  try {
    const created: any = await notion.pages.create({
      parent: { page_id: hyphenate(ROOT) } as any,
      properties: { title: { title: [{ text: { content: title } }] } } as any,
      children: [{
        object: 'block', type: 'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
            text: { content: 'Scratch subject for the block-vs-page timestamp probe. Safe to delete.' },
          }],
        },
      }] as any,
    });
    pageId = created.id;
    say(`created scratch page: ${hyphenate(pageId)}`);
  } catch (e: any) {
    say(`FATAL: create failed — ${scrub(String(e?.message ?? e))}`);
    say('Nothing was created, so nothing needs rolling back.');
    process.exit(2);
  }

  const shots: Shot[] = [];
  let rolledBack = false;

  try {
    /* -- 2. measure at rest -------------------------------------------- */
    await sleep(SETTLE_MS);
    say('');
    say('AT REST (P2: expect page == block)');
    shots.push(await measure(pageId, 't0'));

    if (shots[0].blockKeys.length) {
      say('');
      say(`P1 — child_page block object fields observed (${shots[0].blockKeys.length}):`);
      say(`  ${shots[0].blockKeys.join(', ')}`);
      say(`  last_edited_time present: ${shots[0].blockKeys.includes('last_edited_time')}`);
    } else {
      say('');
      say('P1 REFUTED OR BLOCK NOT FOUND — no block object was matched under the parent.');
      say('  Read the pre-registration decision table: this would refute S042 finding.');
    }

    /* -- 3+4. edit content, re-measure. Twice (P4). --------------------- */
    for (const n of [1, 2]) {
      await notion.blocks.children.append({
        block_id: pageId,
        children: [{
          object: 'block', type: 'paragraph',
          paragraph: {
            rich_text: [{
              type: 'text',
              text: { content: `content edit ${n} at ${new Date().toISOString()}` },
            }],
          },
        }] as any,
      });
      say('');
      say(`AFTER CONTENT EDIT ${n} (P3: expect page MOVES, block DOES NOT)`);
      await sleep(SETTLE_MS);
      shots.push(await measure(pageId, `t${n}`));
    }
  } catch (e: any) {
    say('');
    say(`ERROR during measurement — ${scrub(String(e?.message ?? e))}`);
    say('Continuing to rollback so the scratch page is not left behind.');
  } finally {
    /* -- 5. rollback, always ------------------------------------------- */
    say('');
    say('ROLLBACK (P5)');
    try {
      await notion.pages.update({ page_id: pageId, archived: true } as any);
      const back: any = await notion.pages.retrieve({ page_id: pageId });
      rolledBack = back?.archived === true || back?.in_trash === true;
      say(`  archived: ${rolledBack ? 'VERIFIED by read-back' : 'NOT VERIFIED — REMOVE BY HAND'}`);
      if (!rolledBack) say(`  page id: ${hyphenate(pageId)}`);
    } catch (e: any) {
      say(`  rollback FAILED — ${scrub(String(e?.message ?? e))}`);
      say(`  ⛔ REMOVE THIS PAGE BY HAND: ${hyphenate(pageId)}`);
    }
  }

  /* -- score, against the registered predictions only ------------------ */
  say('');
  say('=== OBSERVED ===');
  const [t0, t1, t2] = shots;
  const has = (s?: Shot) => !!s && s.page !== null && s.block !== null;

  if (!has(t0) || !has(t1) || !has(t2)) {
    say('INCOMPLETE — not all three measurements landed. No prediction is scored.');
    say('Re-run before drawing any conclusion. Rollback status above still applies.');
    process.exit(3);
  }

  say(`  t0  page=${t0.page}  block=${t0.block}`);
  say(`  t1  page=${t1.page}  block=${t1.block}`);
  say(`  t2  page=${t2.page}  block=${t2.block}`);
  say('');

  const p1 = t0.blockKeys.includes('last_edited_time');
  const p2 = t0.page === t0.block;
  const pageMoved1 = !!t1.page && !!t0.page && t1.page > t0.page;
  const pageMoved2 = !!t2.page && !!t1.page && t2.page > t1.page;
  const blockFroze1 = t1.block === t0.block;
  const blockFroze2 = t2.block === t1.block;
  const p3 = pageMoved1 && blockFroze1;
  const p4 = (pageMoved1 === pageMoved2) && (blockFroze1 === blockFroze2);

  say('=== PREDICTIONS (scored against the pre-registration, not re-derived) ===');
  say(`  P1  block carries last_edited_time      : ${p1 ? 'HOLDS' : 'REFUTED'}`);
  say(`  P2  equal at rest                       : ${p2 ? 'HOLDS' : 'REFUTED'}`);
  say(`  P3  page moves AND block frozen         : ${p3 ? 'HOLDS' : 'REFUTED'}`);
  say(`        page moved on edit 1/2            : ${pageMoved1}/${pageMoved2}`);
  say(`        block frozen on edit 1/2          : ${blockFroze1}/${blockFroze2}`);
  say(`  P4  edit 2 reproduces edit 1            : ${p4 ? 'HOLDS' : 'REFUTED'}`);
  say(`  P5  rollback verified                   : ${rolledBack ? 'HOLDS' : 'REFUTED'}`);
  say('');

  say('=== VERDICT, read off the registered decision table ===');
  if (!p1) {
    say('  P1 REFUTED — no last_edited_time on the child_page block.');
    say('  ⛔ STOP. This refutes the S042 instrument-defect finding itself.');
    say('  Re-open dispositions-run2.md and the banner on issue #158.');
  } else if (!p4) {
    say('  P4 REFUTED — the two edits disagree. Behaviour is nondeterministic.');
    say('  ⛔ NO LABELLING DECISION FROM THIS RUN. Re-run.');
  } else if (!pageMoved1 || !pageMoved2) {
    say('  The PAGE timestamp did not move on a content edit — instrument failure, not a finding.');
    say('  ⛔ Re-run. Check that the append actually landed.');
  } else if (p3 || !p2) {
    say('  LABELLING REFUSED.');
    say('  The block timestamp does not track the page\'s content edits.');
    say('  Capture the field if useful, but it may NOT be rendered as "last edited"');
    say('  for that resource. The edit-age counter needs a different source —');
    say('  most likely a per-child GET /v1/pages/{id}, which is a COST decision, not a grant.');
  } else {
    say('  LABELLING LICENSED — as an EMPIRICAL finding, never a documented guarantee.');
    say('  The block timestamp moved with the page across two independent edits.');
    say('  ⚠ Every downstream claim must say "observed n=1, vendor silent" and cite');
    say('  docs/proof/prereg-block-vs-page-timestamp.md. The vendor never promised this');
    say('  and may change it without notice.');
  }
  say('');
  say('Record the run in docs/proof/results-block-vs-page-timestamp.md.');
  say('Role labels only — no page title, id or URL from the workspace enters that file.');
}

main().catch((e: any) => {
  say(`UNHANDLED: ${scrub(String(e?.message ?? e))}`);
  process.exit(1);
});
