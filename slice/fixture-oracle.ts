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

  /**
   * REF001's applicable set, pre-registered for #44's live run — acceptance
   * criterion 4.
   *
   * TRANSCRIBED FROM TWO REPOSITORY FILES, BOTH OLDER THAN THE RULE. fixture.md
   * "What exists" records `wl-outside-grant` as *"Top-level, never connected.
   * LINKED FROM THE ROOT. The contrast case."* results-ref001-live.md §2 records
   * the href verbatim, read out of the root's block content on 2026-08-17:
   * `href=https://app.notion.com/p/3bf1351d6af481108dc5dcc8bffb9742`.
   *
   * The count is asserted rather than merely reported, and the risk is stated:
   * `wl-pagination` holds 151 Markdown-converted paragraphs, and if any of them
   * carries a link this number is wrong. A mismatch is then a FACT ABOUT THE
   * FIXTURE that neither file recorded — which is what an oracle is for. It is
   * not a defect in the rule, and it must not be corrected by editing this
   * constant after reading a run.
   */
  references: {
    source: 'docs/proof/fixture.md "What exists" + results-ref001-live.md §2',
    /** Internal references REF001 should discover across all readable blocks. */
    applicable: 1,
    /** The one target, by ID suffix. Same suffix discipline as the children above. */
    targetSuffix: 'bffb9742',
    alias: 'wl-outside-grant',
    /** The connection is not connected to it, so retrieval 404s. */
    expectUnreachable: true,
    /** No unrecognised candidate is expected: the only observed host is in the allow-list. */
    unrecognised: 0,
  },

  /**
   * REQ001's applicable set, PRE-REGISTERED FOR #58'S LIVE RUN — written before
   * the run and never corrected after it.
   *
   * TWO EXPECTATIONS, BECAUSE TWO RUNS ARE PLANNED AND THEY PROVE DIFFERENT
   * PATHS. Neither proves the violation path: every readable page in this
   * fixture carries a non-empty `title`, and the only resources with arbitrary
   * properties are rows inside `wl-dataset`, which this build does not
   * enumerate. Producing a violating page is an operator-only action in the
   * Notion UI. `docs/proof/` must say so rather than imply a fuller proof.
   *
   * BOTH ROWS CARRY A NAMED RISK, and a mismatch is a FACT ABOUT THE FIXTURE OR
   * THE API rather than a defect in the rule:
   *
   *   - The property KEY on a standalone page is expected to be `title`. This
   *     repository has never observed a page's property map — the port
   *     discarded it until #58 — so the expectation comes from the vendored SDK
   *     types and the API reference, not from an observation.
   *   - `docs/research/notion-live-probe.md` § "Probe 3 — Property IDs" observed
   *     NO property ID for `title`, `text` and `date` on the CONNECTOR path. If
   *     the REST path agrees, `propertyId/v1` is empty on every finding and
   *     ADR-0010 decision 7's first key is dead weight in practice. The run
   *     records which happened; it does not settle the ADR.
   */
  requiredProperties: {
    source: 'docs/proof/fixture.md "What exists" + the #58 plan, both written before the run',
    /* Root + three children, scoped at the declared root. The data source is IN
     * the denominator as a named gap — #50, and never an applicability filter. */
    applicable: 4,
    expectations: [
      {
        property: 'title',
        /** The three page resources carry a non-empty title; the data source cannot be hydrated. */
        evaluated: 3,
        findings: 0,
        why: 'the conforming path plus one disclosed gap. A page title is never empty in this fixture.',
      },
      {
        property: 'Owner',
        /** No such property exists on any of these pages, so every pair is a gap. */
        evaluated: 0,
        findings: 0,
        why: 'the gap path. An undefined property and an ungranted one are the same response, so NO finding may be produced.',
      },
    ],
  },

  /**
   * UNQ001's applicable set, PRE-REGISTERED FOR #59'S LIVE RUN — written before
   * the run and never corrected after it.
   *
   * ⭐ THE DENOMINATOR IS QUADRATIC AND THAT IS WHAT THIS ROW IS FOR. The scope
   * is the declared root, which selects the root and its three children: FOUR
   * resources, and therefore `C(4,2)` = SIX unordered pairs. A run reporting
   * four here has collapsed the coverage item into a resource, which is the
   * defect ADR-0011 exists to stop and the one this rule is most likely to
   * exhibit.
   *
   * `wl-dataset` IS ONE OF THE FOUR, and this build does not enumerate a data
   * source, so every pair containing it is a gap: three of the six. The three
   * pairs among the three readable pages are the evaluated set.
   *
   * ⛔ ZERO FINDINGS, AND THE FIXTURE CANNOT PROVE OTHERWISE. Every readable
   * resource in this fixture carries a distinct title — `wl-proof-fixture`,
   * `wl-pagination`, `wl-revoke-parent` — so the violation path is NOT
   * exercised by this run and `docs/proof/` must say so rather than imply a
   * fuller proof. Seeding a duplicate is an operator-only action in the Notion
   * UI and is filed on #102.
   *
   * THE ROW CARRIES THREE NAMED RISKS, and a mismatch on any of them is a FACT
   * ABOUT THE FIXTURE OR THE API rather than a defect in the rule:
   *
   *   - The property KEY is expected to be `title`, inherited from
   *     `requiredProperties`' first risk and observed by #58's live run.
   *   - If two of the three readable pages turn out to share a title, `findings`
   *     is wrong and the run has found a real duplicate in the fixture. That
   *     would be the violation path proving itself by accident, and it must be
   *     recorded as such rather than by editing this constant.
   *   - `evaluated` assumes the data source fails to hydrate exactly as it does
   *     for REQ001. If it hydrates, this reads 6 and #51 has changed.
   */
  uniqueness: {
    source: 'docs/proof/fixture.md "What exists" + this file\'s own `children` list, both older than the rule',
    /** C(4,2) over root + three children. NOT four. */
    applicable: 6,
    /** C(3,2) over the three readable pages. The data source removes three pairs, not one. */
    evaluated: 3,
    /** The property the uniqueness claim is made over. */
    property: 'title',
    /** Every readable title in this fixture is distinct. */
    findings: 0,
    why: 'the conforming path plus three disclosed gaps. ONE unreadable resource removes THREE of six pairs, which is the quadratic arithmetic the rule exists to report honestly.',
  },
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

  /* RESOURCES ONLY, AND THE FILTER IS LOAD-BEARING. The manifest now holds
   * REF001's references as well, keyed `ref:<target id>` — so `wl-outside-grant`
   * IS in the manifest, as the target of a link, while still not being a child
   * of the declared root. Matching on the suffix alone would make the `absent`
   * assertion below fail on the very fact the fixture was built to produce. */
  const resources = r.manifest.of('resources');
  const keys = resources.map(e => e.key);
  const find = (suffix: string) => resources.find(e => e.key.endsWith(suffix));

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
      const stalled = resources.filter(x => x.stages.has('enumerated') && !x.stages.has('fetched'));
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
    say(!present, `${a.alias} (…${a.suffix}) is absent from the RESOURCE manifest, as the oracle requires`);
    if (present) lines.push(`           ${a.why}`);
  }

  /* -- REF001, pre-registered for #44's run ------------------------------- */
  const refs = r.manifest.of('internal references');
  const expected = FIXTURE_ORACLE.references;
  lines.push(`  reference oracle source: ${expected.source}`);

  say(refs.length === expected.applicable,
    `REF001's applicable set is ${refs.length} internal reference(s), oracle says ${expected.applicable}`);

  const unrecognised = refs.filter(e => !e.stages.has('resolved'));
  say(unrecognised.length === expected.unrecognised,
    `${unrecognised.length} unrecognised candidate(s), oracle says ${expected.unrecognised}`);
  if (unrecognised.length !== expected.unrecognised)
    lines.push('           An unrecognised candidate is a FACT ABOUT THE FIXTURE that no repository ' +
               'file records — a host outside the allow-list. Record it in docs/proof/ and move the ' +
               'host row with its locator; do not edit this constant to match a run.');

  const target = refs.find(e => (e.ref?.targetId ?? '').endsWith(expected.targetSuffix));
  say(target !== undefined, `the link target ${expected.alias} (…${expected.targetSuffix}) was DISCOVERED in block content`);
  if (target) {
    say(target.stages.has('resolved'), `${expected.alias} was recognised as an internal reference`);
    say(target.stages.has('fetched') !== expected.expectUnreachable,
      `${expected.alias} is ${expected.expectUnreachable ? 'unreachable' : 'retrievable'}, as the oracle requires`);
  }

  const ref001 = r.findings.filter(f => f.rule === 'REF001');
  say(ref001.length === (expected.expectUnreachable ? 1 : 0),
    `REF001 produced ${ref001.length} finding(s), oracle says ${expected.expectUnreachable ? 1 : 0}`);
  for (const f of ref001) {
    /* Acceptance criterion 4, and the pair is asserted TOGETHER because
     * collapsing the two axes is the defect #10's triage comment corrected
     * twice. A finding can be confirmed about an unreachable target. */
    say(f.certainty === 'confirmed' && f.targetState === 'unreachable',
      `the finding is certainty=${f.certainty} about target state=${f.targetState}` +
      ' (criterion 4 requires confirmed / unreachable)');
  }

  /* -- REQ001, pre-registered for #58's run ------------------------------- */
  const pairs = r.manifest.of('resource–property pairs');
  if (pairs.length === 0) {
    lines.push('  NOTE     REQ001 declared no pairs in this run, so its oracle row was not exercised.');
  } else {
    const req = FIXTURE_ORACLE.requiredProperties;
    lines.push(`  required-property oracle source: ${req.source}`);

    /* THE PROPERTY IS READ OFF THE RUN, not passed in. The oracle holds one row
     * per planned run and the run says which one it is; an oracle that had to
     * be told what to expect could be told the answer. */
    const property = pairs[0]?.req?.property ?? '(unrecorded)';
    const expectation = req.expectations.find(e => e.property === property);

    if (!expectation) {
      say(false, `REQ001 ran over property "${property}", which this oracle did not pre-register. ` +
        'Add the row BEFORE the run that needs it; do not read one off a result.');
    } else {
      say(pairs.length === req.applicable,
        `REQ001's applicable set is ${pairs.length} (resource, property) pair(s), oracle says ${req.applicable}`);
      const evaluated = pairs.filter(e => e.stages.has('evaluated')).length;
      say(evaluated === expectation.evaluated,
        `${evaluated} pair(s) reached evaluated over "${property}", oracle says ${expectation.evaluated}`);
      const req001 = r.findings.filter(f => f.rule === 'REQ001');
      say(req001.length === expectation.findings,
        `REQ001 produced ${req001.length} finding(s), oracle says ${expectation.findings} — ${expectation.why}`);
      /* THE OBSERVATION THE RUN EXISTS TO MAKE, reported whichever way it goes.
       * Whether a property ID arrives on the REST path is unobserved in this
       * repository and the connector path observed the opposite. */
      const withId = pairs.filter(e => e.req?.propertyId).length;
      lines.push(`  OBSERVED ${withId} of ${pairs.length} pair(s) carried a property ID from the response ` +
        '(ADR-0010 decision 7 key 1; unobserved on the REST path before this run).');
    }
  }

  /* -- UNQ001, pre-registered for #59's run -------------------------------- */
  const unqPairs = r.manifest.of('resource pairs in a uniqueness scope');
  if (unqPairs.length === 0) {
    lines.push('  NOTE     UNQ001 declared no pairs in this run, so its oracle row was not exercised.');
  } else {
    const unq = FIXTURE_ORACLE.uniqueness;
    lines.push(`  uniqueness oracle source: ${unq.source}`);

    /* THE PROPERTY IS READ OFF THE RUN, for the reason REQ001's is: an oracle
     * that has to be told what to expect can be told the answer. A pair whose
     * members were never located carries no facts, so the first entry that has
     * any is the one asked. */
    const property = unqPairs.find(e => e.unq)?.unq?.property ?? '(unrecorded)';
    if (property !== unq.property) {
      say(false, `UNQ001 ran over property "${property}", which this oracle did not pre-register ` +
        `(it holds "${unq.property}"). Add the row BEFORE the run that needs it; do not read one off a result.`);
    } else {
      /* ⭐ THE ASSERTION THIS ROW EXISTS FOR. Four resources, six pairs. A run
       * reporting four has collapsed the coverage item into a resource. */
      say(unqPairs.length === unq.applicable,
        `UNQ001's applicable set is ${unqPairs.length} resource pair(s), oracle says ${unq.applicable} — ` +
        `C(${FIXTURE_ORACLE.applicable},2), NOT ${FIXTURE_ORACLE.applicable}`);
      const evaluated = unqPairs.filter(e => e.stages.has('evaluated')).length;
      say(evaluated === unq.evaluated,
        `${evaluated} pair(s) reached evaluated over "${property}", oracle says ${unq.evaluated} — ` +
        'one unreadable resource removes THREE pairs, not one');
      const unq001 = r.findings.filter(f => f.rule === 'UNQ001');
      say(unq001.length === unq.findings,
        `UNQ001 produced ${unq001.length} finding(s), oracle says ${unq.findings} — ${unq.why}`);
      /* ⛔ THE LIMITATION, PRINTED BY THE RUN ITSELF rather than left to the
       * proof file. A reader of this output must not take zero findings as
       * evidence the violation path works. */
      lines.push('  NOTE     the fixture seeds NO duplicate value, so the VIOLATION path is not ' +
        'exercised by this run. Offline only, CHECK-unq001.ts TEST 5. Seeding is operator-only (#102).');
    }
  }

  lines.push(`  ${ok ? 'ORACLE MATCHED' : 'ORACLE MISMATCH — the run and the hand-written manifest disagree'}`);
  return { ok, lines };
}
