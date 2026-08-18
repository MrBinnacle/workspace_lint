/* The command.
 *
 *   npx tsx cli.ts scan --config ../wl.config.json [--show-titles]
 *
 * Read-only. Three endpoints, all GET. Nothing is created, updated, moved or
 * deleted.
 *
 * THE TOKEN NEVER REACHES STDOUT. This process reads .env with fs — which is
 * normal operation, not a workaround — and every line printed from here passes
 * through scrub() first. The SDK's log level is pinned to 'error' in
 * notion-port.ts because the SDK's own warn logger writes to the console and
 * bypasses application redaction entirely.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

import { loadConfig } from './config.js';
import { liveNotionPort } from './notion-port.js';
import { scan, BUILT_RULES } from './scan.js';
import { unimplementedRules } from './rule.js';
import { buildReportDocument, renderJson, renderMarkdown, renderReport } from './report.js';
import { checkAgainstOracle } from './fixture-oracle.js';

const HERE = dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------ env -- */

function readEnv(path: string): Record<string, string> {
  const env: Record<string, string> = {};
  let raw = '';
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    return env;
  }
  for (const line of raw.split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m) env[m[1]!] = m[2]!.trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = readEnv(join(HERE, '..', '.env'));
const TOKEN = env.NOTION_TOKEN ?? '';
const SECRETS = [TOKEN].filter(s => s.length > 8);

/** Nothing reaches stdout without passing through here. */
function scrub(s: string): string {
  let out = s;
  for (const sec of SECRETS) out = out.split(sec).join('«REDACTED»');
  return out.replace(/\b(ntn_|secret_)[A-Za-z0-9]{8,}/g, '«REDACTED»');
}
const say = (s = '') => console.log(scrub(s));

/* ----------------------------------------------------------------- args -- */

const argv = process.argv.slice(2);
const flag = (name: string) => argv.includes(`--${name}`);
const value = (name: string): string | undefined => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};

const USAGE =
  'usage: tsx cli.ts scan --config <path.json> [--show-titles] [--oracle]' +
  ' [--json <path>] [--markdown <path>] [--deterministic]';

async function main(): Promise<never> {
  if (argv[0] !== 'scan') {
    say(`unknown command ${JSON.stringify(argv[0] ?? '')}. ${USAGE}`);
    process.exit(4);
  }

  const configPath = value('config');
  if (!configPath) {
    say(`--config is required. ${USAGE}`);
    process.exit(4);
  }

  /* Configuration errors exit 4 — ADR-0008 decision 2, "the scan did not run as
   * declared". The scan never began, so there is no coverage claim to qualify. */
  const loaded = loadConfig(resolve(process.cwd(), configPath));
  if (!loaded.ok) {
    say(`CONFIG REJECTED — ${loaded.reason}`);
    say('exit: 4   (The scan did not run as declared.)');
    process.exit(4);
  }

  /* A rule the DOCUMENT declares and this BINARY cannot run. The loader cannot
   * catch it — it validates the document against a table, and the table is
   * hand-kept — so the build is asked directly, here, before any call is made.
   * Running anyway would publish a coverage figure that says nothing about the
   * configured rule while the header claims the declared rules were evaluated. */
  const missing = unimplementedRules(loaded.config.rules, BUILT_RULES);
  if (missing.length > 0) {
    say(`CONFIG REJECTED — configured but not implemented in this build: ${missing.join(', ')}. Nothing was called.`);
    say('exit: 4   (The scan did not run as declared.)');
    process.exit(4);
  }

  if (!TOKEN) {
    say('NOTION_TOKEN is empty in .env. Nothing was called.');
    say('exit: 4   (The scan did not run as declared.)');
    process.exit(4);
  }

  say('workspace_lint — v0.1 scan slice (T3, issue #44)');
  say(`Notion-Version: ${env.NOTION_VERSION || '2026-03-11'} · read-only · rules implemented: ${BUILT_RULES.length} (${BUILT_RULES.map(r => r.id).join(', ')})`);
  say('');

  const result = await scan({
    config: loaded.config,
    port: liveNotionPort(TOKEN, env.NOTION_VERSION || '2026-03-11'),
  });

  const renderOpts = { showTitles: flag('show-titles') };
  for (const line of renderReport(result, renderOpts)) say(line);

  /* ACCEPTANCE CRITERION 5 — one readable Markdown report and one stable JSON
   * report, from one run. Both are built from the SAME document the terminal
   * render above used, so the four suppressions are applied once rather than
   * three times.
   *
   * --deterministic drops the volatile fields (ADR-0004 decision 5, and SARIF
   * Appendix F.1 names the flag). It is what makes two runs over an unchanged
   * workspace byte-identical; without it the report carries wall time, the
   * request count and the call log, none of which are properties of the
   * workspace.
   *
   * Written through scrub(), like every other byte this process emits. A file
   * is not a safer destination than stdout — it is a more durable one. */
  const deterministic = flag('deterministic');
  const doc = buildReportDocument(result, { ...renderOpts, deterministic });

  const jsonPath = value('json');
  if (jsonPath) {
    writeFileSync(resolve(process.cwd(), jsonPath), scrub(renderJson(doc)), 'utf8');
    say(`wrote JSON report to ${jsonPath}${deterministic ? '' : '   (NOT byte-stable — volatile fields included; add --deterministic)'}`);
  }

  const mdPath = value('markdown');
  if (mdPath) {
    writeFileSync(resolve(process.cwd(), mdPath), scrub(renderMarkdown(doc)), 'utf8');
    say(`wrote Markdown report to ${mdPath}`);
  }

  /* Acceptance criterion 1. The oracle is hand-written from docs/proof/fixture.md
   * and is compared to, never derived from, this run. A mismatch does NOT change
   * the exit byte: the byte reports the scan's coverage verdict, and the oracle
   * reports whether the scan agrees with a human's written expectation. Two
   * different questions; collapsing them would let a fixture edit look like a
   * coverage failure. */
  if (flag('oracle')) {
    say('');
    say('──────── HAND-WRITTEN MANIFEST ORACLE (criterion 1) ────────');
    const o = checkAgainstOracle(result);
    for (const line of o.lines) say(line);
    if (!o.ok) say('  The scan and the pre-registered expectation disagree. Investigate before believing either.');
  }

  process.exit(result.verdict.exit);
}

main().catch((e: unknown) => {
  /* The error MESSAGE only. An error object can carry request context. */
  say(`UNHANDLED — ${scrub(String((e as Error)?.message ?? e))}`);
  say('exit: 4   (The scan did not run as declared.)');
  process.exit(4);
});
