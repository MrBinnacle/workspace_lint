/* Rollback tool. Moves ONE page to the workspace trash and verifies by read-back.
 *
 *   cd prototypes && npx tsx trash-page.ts <page-id>
 *
 * ⛔ THIS WRITES. It exists because a probe's own rollback failed and left a scratch
 * page live in the operator's workspace. Under the standing administrator grant the
 * discipline on every material edit is breadcrumb + rollback + verify by read-back;
 * this tool is the rollback half when a probe's in-run rollback does not fire.
 *
 * It takes an explicit id on the command line and refuses to run without one. It
 * never searches, never enumerates, and never touches a second page.
 *
 * ⚠ USE `in_trash`, NEVER `archived`. The SDK marks `archived` deprecated (v5.25.2,
 * api-endpoints/pages.d.ts:526) and API version 2026-03-11 rejects it at validation:
 * "body.archived should be not present, instead was `true`". That rejection is what
 * orphaned the page this tool was written to remove.
 *
 * Trash is not deletion. The page is recoverable from the workspace trash by the
 * operator; nothing here is irreversible.
 *
 * The token is read from .env by this process and is NEVER printed. Every line of
 * output passes through scrub(), and the SDK is constructed with logLevel 'error'
 * because its own warn logger bypasses application redaction.
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

const RAW = process.argv[2];
if (!RAW) {
  say('FATAL: no page id given. Usage: npx tsx trash-page.ts <page-id>');
  say('This tool refuses to guess a target. Nothing was called.');
  process.exit(4);
}

function hyphenate(id: string): string {
  const h = id.replace(/-/g, '');
  return h.length === 32
    ? `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
    : id;
}
const PAGE = hyphenate(RAW);

const notion = new Client({
  auth: TOKEN,
  notionVersion: env.NOTION_VERSION || '2026-03-11',
  logLevel: 'error' as any,
});

/* --------------------------------------------------------------- main ---- */

async function main() {
  say('=== trash-page ===');
  say(`target: ${PAGE}`);
  say('');

  /* Read BEFORE writing, so the run records what it acted on and so an
   * already-trashed page is reported as such rather than written to again. */
  let before: any;
  try {
    before = await notion.pages.retrieve({ page_id: PAGE });
  } catch (e: any) {
    say(`FATAL: retrieve failed — ${scrub(String(e?.message ?? e))}`);
    say('Nothing was written. The id may be wrong, or the page may be beyond the grant.');
    process.exit(2);
  }

  const wasTrashed = before?.in_trash === true || before?.archived === true;
  say(`before: in_trash=${before?.in_trash}  archived=${before?.archived}`);
  if (wasTrashed) {
    say('Already in the trash. Nothing to do, and nothing was written.');
    process.exit(0);
  }

  try {
    await notion.pages.update({ page_id: PAGE, in_trash: true } as any);
  } catch (e: any) {
    say(`FATAL: update failed — ${scrub(String(e?.message ?? e))}`);
    say(`⛔ REMOVE THIS PAGE BY HAND: ${PAGE}`);
    process.exit(2);
  }

  /* Verify by read-back. A command's own output is not evidence it succeeded. */
  const after: any = await notion.pages.retrieve({ page_id: PAGE });
  const nowTrashed = after?.in_trash === true || after?.archived === true;
  say(`after:  in_trash=${after?.in_trash}  archived=${after?.archived}`);
  say('');

  if (nowTrashed) {
    say('VERIFIED by read-back: the page is in the trash.');
    process.exit(0);
  }
  say('NOT VERIFIED — the update returned without error and the read-back disagrees.');
  say(`⛔ REMOVE THIS PAGE BY HAND: ${PAGE}`);
  process.exit(3);
}

main().catch((e: any) => {
  say(`UNHANDLED: ${scrub(String(e?.message ?? e))}`);
  process.exit(1);
});
