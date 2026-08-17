/* The hand-written manifest oracle — acceptance criterion 1.
 *
 *   "Enumerate the declared root and match a hand-written manifest. The
 *    hand-written manifest is the test oracle and must be written BEFORE the
 *    run." — docs/spec/v0.1-scan-slice.md §2, criterion 1
 *
 * WHERE THIS COMES FROM, AND WHY THAT MATTERS
 *
 * Every entry below is transcribed from `docs/proof/fixture.md`, section
 * "What exists" — the table written when the fixture was BUILT, by the process
 * that built it, months before this scanner existed. Nothing here is read off a
 * scan report. That independence is the whole value: an oracle derived from the
 * output it checks is not an oracle, it is a restatement.
 *
 * WHAT THIS FILE DOES AND DOES NOT CLOSE
 *
 * It does NOT close criterion 1 for #42's run. That run happened first, so its
 * applicable set was checked against the code's own output and the
 * pre-registration property is unrecoverable for it. This file pre-registers the
 * expectation for the NEXT live run — #43's — which is the earliest run for
 * which criterion 1 can honestly be closed. Do not let a later session read this
 * file's existence as criterion 1 being met retroactively.
 *
 * Matching is on the ID SUFFIX because that is what fixture.md records. Suffixes
 * are the low-order bits of a time-ordered ID, so they discriminate where
 * prefixes do not — the live run found the declared root and two of its children
 * sharing eight LEADING hex digits.
 */

import type { ScanResult } from './scan.js';

export type OracleChild = {
  /** Last 8 hex digits, as recorded in fixture.md. */
  suffix: string;
  alias: string;
  kind: 'page' | 'data-source';
  /** The furthest funnel stage this slice should carry the resource to. */
  terminal: 'fetched' | 'enumerated';
  note?: string;
};

export const FIXTURE_ORACLE = {
  source: 'docs/proof/fixture.md, section "What exists"',
  root: { suffix: '2a3bee7c', alias: 'wl-proof-fixture' },

  /** Direct children of the declared root. T1 descends one level only. */
  children: [
    { suffix: 'fef57e44', alias: 'wl-pagination', kind: 'page', terminal: 'fetched',
      note: '151 blocks, so its enumeration MUST take more than one children call' },
    { suffix: '70a06142', alias: 'wl-revoke-parent', kind: 'page', terminal: 'fetched' },
    { suffix: 'cd5c4903', alias: 'wl-dataset', kind: 'data-source', terminal: 'enumerated',
      note: 'fixture.md records the DATA SOURCE id. A child_database block carries the ' +
            'DATABASE id, which is a different object. The suffix is therefore expected NOT ' +
            'to match, and that non-match is a documented fact about Notion identity, not a defect.' },
  ] as OracleChild[],

  /** Resources that must NOT appear in the manifest, each for a stated reason. */
  absent: [
    { suffix: 'bffb9742', alias: 'wl-outside-grant',
      why: 'top-level and never connected, deliberately not under the root (fixture.md). It is ' +
           'reachable only as a LINK TARGET, which is REF001 and #44 — not a child of the root.' },
    { suffix: 'ce0fb949', alias: 'wl-revoke-child',
      why: 'the revocation target. It vanishes from its parent child list rather than appearing ' +
           'unreadable, observed 2026-08-17. If it EVER appears here, selective revocation has ' +
           'changed behaviour and Q1 reopens.' },
  ],

  /** Root + three children. The number criterion 1 is really about. */
  applicable: 4,
} as const;

export type OracleVerdict = { ok: boolean; lines: string[] };

/**
 * Compare a scan result against the pre-registered expectation.
 *
 * Returns lines rather than printing, so the caller owns stdout and its
 * redaction policy. Aliases from the oracle are safe to print: they are fixture
 * page names recorded in a tracked repository file, not workspace content
 * discovered at scan time.
 */
export function checkAgainstOracle(r: ScanResult): OracleVerdict {
  const lines: string[] = [];
  let ok = true;
  const say = (pass: boolean, msg: string) => {
    if (!pass) ok = false;
    lines.push(`  ${pass ? 'MATCH   ' : 'MISMATCH'} ${msg}`);
  };

  const keys = r.manifest.all().map(e => e.key);
  const find = (suffix: string) => r.manifest.all().find(e => e.key.endsWith(suffix));

  lines.push(`  oracle source: ${FIXTURE_ORACLE.source}`);

  say(r.verdict.applicable === FIXTURE_ORACLE.applicable,
    `applicable set is ${r.verdict.applicable}, oracle says ${FIXTURE_ORACLE.applicable}`);

  const root = find(FIXTURE_ORACLE.root.suffix);
  say(root !== undefined, `declared root ${FIXTURE_ORACLE.root.alias} (…${FIXTURE_ORACLE.root.suffix}) is in the manifest`);
  if (root) say(root.stages.has('fetched'), `${FIXTURE_ORACLE.root.alias} reached fetched`);

  for (const c of FIXTURE_ORACLE.children) {
    const e = find(c.suffix);
    if (c.kind === 'data-source') {
      /* The documented non-match. Assert the SHAPE — one resource that stalls at
       * enumerated — rather than the suffix, and state why. */
      const stalled = r.manifest.all().filter(x => x.stages.has('enumerated') && !x.stages.has('fetched'));
      say(stalled.length === 1,
        `exactly one resource stalls at enumerated (the data source); found ${stalled.length}`);
      lines.push(`  NOTE     ${c.alias}: ${c.note}`);
      lines.push(`           suffix …${c.suffix} present in manifest? ${e ? 'yes' : 'no (expected)'}`);
      continue;
    }
    say(e !== undefined, `${c.alias} (…${c.suffix}) is in the manifest`);
    if (e) say(e.stages.has(c.terminal), `${c.alias} reached ${c.terminal}`);
    if (c.note) lines.push(`  NOTE     ${c.alias}: ${c.note}`);
  }

  for (const a of FIXTURE_ORACLE.absent) {
    const present = keys.some(k => k.endsWith(a.suffix));
    say(!present, `${a.alias} (…${a.suffix}) is absent, as the oracle requires`);
    if (present) lines.push(`           ${a.why}`);
  }

  lines.push(`  ${ok ? 'ORACLE MATCHED' : 'ORACLE MISMATCH — the run and the hand-written manifest disagree'}`);
  return { ok, lines };
}
