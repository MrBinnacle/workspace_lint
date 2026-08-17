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

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

import { loadConfig } from './config.js';
import { liveNotionPort } from './notion-port.js';
import { scan, renderReport } from './scan.js';

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

const USAGE = 'usage: tsx cli.ts scan --config <path.json> [--show-titles]';

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

  if (!TOKEN) {
    say('NOTION_TOKEN is empty in .env. Nothing was called.');
    say('exit: 4   (The scan did not run as declared.)');
    process.exit(4);
  }

  say('workspace_lint — v0.1 scan slice (T1, issue #42)');
  say(`Notion-Version: ${env.NOTION_VERSION || '2026-03-11'} · read-only · rules implemented: 0`);
  say('');

  const result = await scan({
    config: loaded.config,
    port: liveNotionPort(TOKEN, env.NOTION_VERSION || '2026-03-11'),
  });

  for (const line of renderReport(result, { showTitles: flag('show-titles') })) say(line);
  process.exit(result.verdict.exit);
}

main().catch((e: unknown) => {
  /* The error MESSAGE only. An error object can carry request context. */
  say(`UNHANDLED — ${scrub(String((e as Error)?.message ?? e))}`);
  say('exit: 4   (The scan did not run as declared.)');
  process.exit(4);
});
