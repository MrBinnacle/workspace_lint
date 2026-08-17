/* The scan. One declared root, five funnel stages, one exit byte, no rules.
 *
 * WHY NOTHING REACHES `evaluated`, AND WHY THAT IS THE HONEST ANSWER
 *
 * #42 is explicit: "No rules yet." ADR-0005 decision 5's fifth stage is
 * `evaluated`, and a resource is evaluated when a RULE judged it. This slice
 * implements no rule, so this slice evaluates nothing, and the manifest says so
 * with a named cause on every resource rather than quietly redefining the stage
 * to mean "the scan finished with it."
 *
 * Three consequences, stated here so no later session has to re-derive them:
 *
 *   1. The coverage VECTOR of ADR-0011 is EMPTY in this slice — it is one entry
 *      per rule, and there are no rules. The funnel figure printed below is
 *      resources-through-the-funnel, and its unit is named every time it is
 *      printed. It is NOT a coverage ratio and must never be quoted as one.
 *   2. EXIT 0 IS UNREACHABLE HERE, by construction. Every resource is a gap, so
 *      a clean run still exits 3. The first ticket that can return 0 is #43,
 *      which is where SYS001 — and therefore evaluation — arrives.
 *   3. The exit byte this slice CAN prove is 4 (did not run as declared), 2
 *      (root unreached or an unbounded gap) and 3 (confined gaps below the
 *      declared threshold). #46 owns proving the byte responds to the right
 *      cause rather than to any cause.
 *
 * The alternative was to let `evaluated` mean "fetched successfully", which
 * would have printed a 3/4 that looks like rule coverage and is not. That is the
 * flattering direction, and it is the exact defect class this product exists to
 * detect.
 */

import type { Config } from './config.js';
import type { NotionPort } from './notion-port.js';
import { createObserver, listAllChildren, type Call } from './observed.js';
import { Manifest, gapsFrom } from './manifest.js';
import { deriveVerdict, type Gap, type Verdict } from './verdict.js';

export const NO_RULE_CAUSE =
  'reached the end of the funnel unevaluated — this slice implements no rule (#42); evaluation arrives with SYS001 in #43';

const DATA_SOURCE_CAUSE =
  'data-source enumeration is not implemented in this slice — rows and schemas are REQ001/UNQ001 concerns, out of scope per spec §1.2';

export type ScanResult = {
  manifest: Manifest;
  verdict: Verdict;
  gaps: Gap[];
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
  const now = opts.now ?? (() => Date.now());

  const t0 = now();
  const observer = createObserver();
  const manifest = new Manifest();
  const log: string[] = [];
  const say = (s = '') => log.push(s);

  const finish = (didNotRunAsDeclared = false): ScanResult => {
    const gaps = deriveGaps(manifest);
    const verdict = deriveVerdict({
      applicable: manifest.size,
      evaluated: manifest.reached('evaluated'),
      gaps,
      violations: 0,
      /* EXPLICIT ZERO, AND IT IS LOAD-BEARING. deriveVerdict defaults this to
       * violations + gaps.length, which would exit 1 on a slice that produced no
       * finding of any kind. This slice implements no rule, so it has no
       * finding, so nothing here is new-and-unsuppressed. #43 is where gaps
       * become SYS001 findings and this argument stops being zero. */
      newUnsuppressedFindings: 0,
      coverageThreshold: config.minCoverage,
      didNotRunAsDeclared,
    });
    return {
      manifest, verdict, gaps,
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
  manifest.mark(root.id, rootAlias, 'declared', '', true);

  const page = await observer.observe('GET /v1/pages/{root}', () => port.retrievePage(root.id));
  if (page.state === 'unreachable') {
    manifest.note(root.id, `declared root was never reached — ${page.cause}`);
    say(`declared root UNREACHABLE — ${page.cause}`);
    return finish();
  }
  manifest.mark(root.id, rootAlias, 'resolved');
  say('declared root resolved.');

  /* -- enumerate the root ------------------------------------------------- */
  const rootBlocks = await listAllChildren(port, observer, root.id, 'root');
  if (rootBlocks.state === 'unreachable') {
    manifest.note(root.id, `root enumeration failed — ${rootBlocks.cause}`);
    say(`root enumeration FAILED — ${rootBlocks.cause}`);
    return finish();
  }
  manifest.mark(root.id, rootAlias, 'enumerated', rootBlocks.state === 'partial' ? rootBlocks.cause : '');
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
      /* A NAMED gap. Bounded, because the resource is named and counted. */
      manifest.mark(c.id, alias, 'enumerated', DATA_SOURCE_CAUSE);
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
      manifest.note(c.id, `enumeration failed — ${kids.cause}`);
      continue;
    }
    manifest.mark(c.id, alias, 'enumerated', kids.state === 'partial' ? kids.cause : '');
    manifest.mark(c.id, alias, 'fetched');
  }

  /* -- every resource that survived the funnel is still a gap ------------- */
  for (const e of manifest.all())
    if (e.stages.has('fetched') && !e.cause) manifest.note(e.key, NO_RULE_CAUSE);

  return finish();
}
