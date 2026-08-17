/* The scan. One declared root, five funnel stages, one rule, one exit byte.
 *
 * WHAT #43 CHANGED, AND WHAT IT DID NOT
 *
 * T1 (#42) implemented no rule, so nothing reached `evaluated` and every
 * resource carried a named cause saying exactly that. SYS001 arrives here, so
 * three things move and each was predicted on #42:
 *
 *   1. `evaluated` IS NOW REACHABLE. A resource the funnel delivered whole is
 *      judged by SYS001 and marked. The "this slice implements no rule" cause is
 *      gone from every path.
 *   2. THE COVERAGE VECTOR IS NO LONGER EMPTY. ADR-0011: one row per rule, over
 *      that rule's own coverage item. SYS001 counts RESOURCES, so its row is the
 *      funnel figure with a rule name and a unit attached. It is still not a
 *      figure to be pooled with another rule's — REF001 (#44) counts references,
 *      and counts of different things do not add.
 *   3. `newUnsuppressedFindings` STOPS BEING ZERO. T1 passed 0 explicitly because
 *      it produced no finding of any kind. It now carries the SYS001 findings,
 *      and that is the single most likely place for the exit byte to go quietly
 *      wrong: with the argument left at 0, a run whose coverage clears the
 *      threshold exits 0 while holding unsuppressed findings, which is the exact
 *      false-green ADR-0008 decision 2 exists to prevent. CHECK-sys001.ts TEST 4
 *      is the control on this line.
 *
 * WHAT STILL DOES NOT REACH `evaluated`: a resource that stalled before
 * `fetched`, and a resource that reached `fetched` carrying a drop-out cause.
 * Both are SYS001 findings. Letting either through would print a coverage figure
 * over resources the scan did not actually deliver, which is the flattering
 * direction and the defect class this product exists to detect.
 */

import type { Config } from './config.js';
import type { NotionPort } from './notion-port.js';
import { createObserver, listAllChildren, type Call } from './observed.js';
import { Manifest, gapsFrom, KEEP_ALIAS } from './manifest.js';
import { deriveVerdict, type Gap, type Verdict } from './verdict.js';
import { SYS001, type Sys001Rule } from './sys001.js';
import type { CoverageRow, Finding, Outcome } from './finding.js';

const DATA_SOURCE_CAUSE =
  'data-source enumeration is not implemented in this slice — rows and schemas are REQ001/UNQ001 concerns, out of scope per spec §1.2';

export type ScanResult = {
  manifest: Manifest;
  verdict: Verdict;
  gaps: Gap[];
  findings: Finding[];
  /** ADR-0011: one row per rule, over that rule's own coverage item. */
  coverage: CoverageRow[];
  /** Per rule, the outcome PAIR. Keyed by rule ID. */
  outcomes: Record<string, Outcome>;
  calls: Call[];
  requestCount: number;
  wallMs: number;
  log: string[];
};

export type ScanOptions = {
  config: Config;
  port: NotionPort;
  /**
   * The coverage-gap detection mechanism, injected so the mutation check can
   * disable it and confirm the exit byte goes green. Defaults to gapsFrom.
   */
  deriveGaps?: (m: Manifest) => Gap[];
  /**
   * The rule, injected for the same reason and at two seams rather than one.
   * `judge` and `report` are separately replaceable because they wire into
   * different halves of the verdict: `judge` feeds the coverage ratio and
   * `report` feeds the finding count. A mutation check that could only remove
   * the whole rule would leave the finding-to-exit-byte path untested.
   */
  rule?: Sys001Rule;
  now?: () => number;
};

/* The block shapes this slice reads. Everything else on a block is ignored. */
type ChildBlock = {
  id: string;
  type: string;
  child_page?: { title?: string };
  child_database?: { title?: string };
};

function asChildBlock(b: unknown): ChildBlock | null {
  if (typeof b !== 'object' || b === null) return null;
  const o = b as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.type !== 'string') return null;
  return o as unknown as ChildBlock;
}

const titleOf = (b: ChildBlock): string =>
  String(b.child_page?.title ?? b.child_database?.title ?? b.id);

export async function scan(opts: ScanOptions): Promise<ScanResult> {
  const { config, port } = opts;
  const deriveGaps = opts.deriveGaps ?? gapsFrom;
  const rule = opts.rule ?? SYS001;
  const now = opts.now ?? (() => Date.now());

  const t0 = now();
  const observer = createObserver();
  const manifest = new Manifest();
  const log: string[] = [];
  const say = (s = '') => log.push(s);

  const finish = (didNotRunAsDeclared = false): ScanResult => {
    /* THE RULE RUNS HERE, NOT AT THE END OF THE TRAVERSAL, because every early
     * return above is also a scan whose coverage has to be judged. An
     * unreachable declared root is SYS001's headline finding, and it leaves
     * through the second return in this function. */
    const judged = rule.judge(manifest);
    /* ADR-0005 decision 5 stage 5: "every applicable rule reached a judgement."
     * WITH A SECOND RULE THIS BECOMES AN INTERSECTION. #44 must not add a
     * parallel loop that marks the same stage — a union here would mark a
     * resource evaluated because ONE rule judged it, which is the flattering
     * answer and would inflate every coverage figure computed downstream. */
    for (const key of judged) manifest.mark(key, KEEP_ALIAS, 'evaluated');

    const gaps = deriveGaps(manifest);
    const findings = rule.findingsFrom(manifest, gaps);
    /* `judged` is threaded through rather than recomputed. The rule's coverage
     * row, its outcome pair and the funnel's `evaluated` stage are then three
     * readings of ONE judgement. */
    const row = rule.coverage(manifest, judged);
    const coverage = row ? [row] : [];
    const outcomes = { [rule.id]: rule.outcome(manifest, judged, findings) };

    const verdict = deriveVerdict({
      applicable: manifest.size,
      evaluated: manifest.reached('evaluated'),
      gaps,
      /* Findings that are NOT coverage gaps. SYS001 produces only coverage-gap
       * findings, so this stays 0 until a rule with a content invariant lands.
       * It drives the disposition; the gaps already qualify the report. */
      violations: 0,
      /* NO LONGER ZERO — see this file's header, consequence 3. Every finding in
       * this slice is `new` and unsuppressed BY CONSTRUCTION, not by
       * computation: spec §1.2 gives the slice no baseline file and no
       * suppressions, so there is nothing a finding could be matched against.
       * When a baseline lands, this argument stops equalling findings.length and
       * becomes the count that survives matching — a baselined gap is still a
       * gap, still lowers coverage, and still qualifies the report, but stops
       * failing the build (ADR-0008 decision 3). */
      newUnsuppressedFindings: findings.length,
      /* ADR-0011 decision 5 makes the threshold a floor on EVERY rule, i.e. on
       * the minimum of the vector. deriveVerdict takes one scalar, and in this
       * slice the two are the same number: there is exactly one rule and its
       * coverage item is the resource the funnel stages. THAT COINCIDENCE ENDS
       * WITH #44. REF001's row counts internal references, so the minimum of the
       * vector stops being evaluated/applicable, and feeding this scalar instead
       * of the minimum would let a well-covered rule mask a badly covered one.
       * verdict.ts is copied verbatim from a frozen prototype, so changing what
       * it compares is a decision that goes in an ADR before it goes in code. */
      coverageThreshold: config.minCoverage,
      didNotRunAsDeclared,
    });
    return {
      manifest, verdict, gaps, findings, coverage, outcomes,
      calls: observer.calls,
      requestCount: observer.calls.length,
      wallMs: now() - t0,
      log,
    };
  };

  /* -- auth, and it is also the identity check --------------------------- */
  /* Without this, a bad credential returns 404 on the declared root and the run
   * exits 2 — "the root is unreachable" — when the truth is that the scan never
   * ran as declared, which is 4. Two different failures, two different bytes. */
  const me = await observer.observe('GET /v1/users/me', () => port.whoami());
  if (me.state === 'unreachable') {
    say(`AUTH FAILED — ${me.cause}`);
    say('The scan did not run as declared. No coverage claim is made.');
    return finish(true);
  }
  say(`connection ok — ${me.value?.name ?? '(unnamed)'} (${me.value?.type ?? '?'})`);

  /* -- the declared root -------------------------------------------------- */
  const root = config.roots[0]!;
  const rootAlias = root.alias ?? root.id;
  manifest.mark(root.id, rootAlias, 'declared', null, true);

  const page = await observer.observe('GET /v1/pages/{root}', () => port.retrievePage(root.id));
  if (page.state === 'unreachable') {
    manifest.note(root.id, {
      cause: `declared root was never reached — ${page.cause}`,
      /* The missing item is the root itself, which is named. Pervasiveness
       * comes from isRootMiss here, not from boundedness. */
      bounded: true,
      target: 'unreachable',
    });
    say(`declared root UNREACHABLE — ${page.cause}`);
    return finish();
  }
  manifest.mark(root.id, rootAlias, 'resolved');
  say('declared root resolved.');

  /* -- enumerate the root ------------------------------------------------- */
  const rootBlocks = await listAllChildren(port, observer, root.id, 'root');
  if (rootBlocks.state === 'unreachable') {
    manifest.note(root.id, {
      cause: `root enumeration failed — ${rootBlocks.cause}`,
      /* UNBOUNDED. The child list was never retrieved, so the scan can neither
       * count nor name what it missed — ADR-0005 decision 3(b) exactly. The
       * previous pattern-matched classification called this BOUNDED while
       * calling a half-finished enumeration unbounded, so failing outright
       * produced the milder verdict. */
      bounded: false,
      /* The root itself was retrieved a moment ago. The loss is its contents. */
      target: 'present',
    });
    say(`root enumeration FAILED — ${rootBlocks.cause}`);
    return finish();
  }
  manifest.mark(
    root.id, rootAlias, 'enumerated',
    /* A partial enumeration is unbounded whatever produced it — a mid-stream
     * error, an exhausted page budget, or a positive `request_status:
     * incomplete`. In every case the remainder is unknown. */
    rootBlocks.state === 'partial' ? { cause: rootBlocks.cause, bounded: false, target: 'present' } : null,
  );
  manifest.mark(root.id, rootAlias, 'fetched');
  const blocks = rootBlocks.value;
  say(`root enumerated — ${blocks.length} block(s), ${rootBlocks.state}.`);

  /* THE APPLICABLE SET IS BUILT FROM WHAT WAS ENUMERATED, not from the subset
   * this code knows how to descend into. Counting only child_page produced a
   * ratio of 2/2 over a root with three children — a denominator that shrinks to
   * match the scan's own blind spots (results-ref001-live.md §3). The
   * child_database below is counted and then reported as a gap with a named
   * cause, which is the difference between a blind spot and a disclosed one. */
  const children = blocks
    .map(asChildBlock)
    .filter((b): b is ChildBlock => b !== null && (b.type === 'child_page' || b.type === 'child_database'));

  say(`child resources under the declared root: ${children.length}`);
  for (const c of children) manifest.mark(c.id, titleOf(c), 'declared');
  for (const c of children) manifest.mark(c.id, titleOf(c), 'resolved');

  /* -- descend one level -------------------------------------------------- */
  for (const c of children) {
    const alias = titleOf(c);
    if (c.type === 'child_database') {
      /* A NAMED gap. Bounded, because the resource is named and counted, and
       * present, because its block was returned in the parent's listing. */
      manifest.mark(c.id, alias, 'enumerated', { cause: DATA_SOURCE_CAUSE, bounded: true, target: 'present' });
      continue;
    }
    /* The label is the ID, NOT the alias. The alias is a page title, the call
     * log is stdout, and titles are redacted by default. The first live run
     * printed `GET /v1/blocks/wl-pagination/children` under a report that said
     * "page titles redacted by default" three lines above. A redaction control
     * with a hole in it is worse than no control, because the report asserts the
     * guarantee either way. */
    const kids = await listAllChildren(port, observer, c.id, c.id);
    if (kids.state === 'unreachable') {
      manifest.note(c.id, {
        cause: `enumeration failed — ${kids.cause}`,
        /* Bounded: the resource that was lost is this child, and it is named.
         * Its own descendants are outside this slice's applicable set, which
         * descends one level (spec §1.1). */
        bounded: true,
        /* UNREACHABLE, not present. The parent's listing returned this block,
         * but the call about the resource itself failed, and a 404 is access
         * failure or object absence with no way to tell which. Claiming
         * `present` here was reporting an object the API had just refused. */
        target: 'unreachable',
      });
      continue;
    }
    manifest.mark(
      c.id, alias, 'enumerated',
      kids.state === 'partial' ? { cause: kids.cause, bounded: false, target: 'present' } : null,
    );
    manifest.mark(c.id, alias, 'fetched');
  }

  /* The traversal ends here. Judgement belongs to the rule and happens in
   * finish(), which every exit path above goes through. T1 stamped a
   * "no rule implemented" cause on each surviving resource at this point; SYS001
   * now judges those same resources instead. */
  return finish();
}
