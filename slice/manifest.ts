/* The coverage manifest — ADR-0005 decision 5.
 *
 * Five stages: declared, resolved, enumerated, fetched, evaluated. Every
 * drop-out names a resource and a specific cause. There are no unattributed
 * losses; an entry that stalls without a cause is still reported, with the
 * absence of the cause stated as the cause.
 *
 * KEYED ON THE HYPHENATED NATIVE ID, never on a title. The first live run keyed
 * this map on titles, counted wl-revoke-parent twice, and the denominator read 5
 * for 4 resources (docs/proof/results-ref001-live.md §5). A title-keyed manifest
 * inflates its own coverage ratio.
 *
 * ONE SOURCE OF TRUTH. Gaps are DERIVED from this structure by gapsFrom() and
 * are never accumulated alongside it. results-ref001-live.md §4 records what the
 * second copy does: it drifts, and it drifts toward the flattering answer — the
 * manifest showed a stalled resource, the gap list was empty, and the exit byte
 * read 1 where the contract required 3.
 */

import { hyphenate } from './ids.js';
import type { Gap } from './verdict.js';

export type Stage = 'declared' | 'resolved' | 'enumerated' | 'fetched' | 'evaluated';
export const STAGES: readonly Stage[] = ['declared', 'resolved', 'enumerated', 'fetched', 'evaluated'] as const;

export type Entry = {
  key: string;
  /** Report-only. Never addresses anything. */
  alias: string;
  stages: Set<Stage>;
  cause: string;
  /** A declared root, which carries ADR-0005's pervasiveness condition (a). */
  isRoot: boolean;
};

/**
 * A gap is unbounded when the scan cannot say how many resources it missed.
 * These three phrases are the only ways this slice can produce one, and each is
 * emitted by exactly one site in observed.ts.
 *
 * `stopped after N blocks` is unbounded on purpose: the enumeration died
 * mid-stream, so the remainder cannot be counted OR named. Calling it bounded
 * would round toward the flattering answer, which is the product's own
 * false-green class appearing inside the coverage instrument.
 */
const UNBOUNDED_CAUSE = /remaining count unknown|abandoned after|stopped after/;

export class Manifest {
  private readonly entries = new Map<string, Entry>();

  /**
   * Record a resource at a stage. The key is derived from the ID; a value that
   * is not an ID keys on itself, which is how non-resource drop-outs (an
   * unclassifiable link, say) enter the manifest without pretending to be
   * resources.
   */
  mark(id: string, alias: string, stage: Stage, cause = '', isRoot = false): void {
    const key = hyphenate(id) ?? id;
    const e = this.entries.get(key) ?? { key, alias: alias || key, stages: new Set<Stage>(), cause: '', isRoot: false };
    if (alias) e.alias = alias;
    if (isRoot) e.isRoot = true;
    e.stages.add(stage);
    if (cause) e.cause = cause;
    this.entries.set(key, e);
  }

  /** Attach a cause without advancing a stage. */
  note(id: string, cause: string): void {
    const key = hyphenate(id) ?? id;
    const e = this.entries.get(key);
    if (e && cause) e.cause = cause;
  }

  all(): Entry[] { return [...this.entries.values()]; }
  get size(): number { return this.entries.size; }
  reached(stage: Stage): number { return this.all().filter(e => e.stages.has(stage)).length; }
}

/**
 * Derive the gap set from the manifest.
 *
 * This function is the coverage-gap detection mechanism, and it is exported as a
 * named function rather than inlined into the scan for one reason: the mutation
 * check in CHECK-scan-scaffold.ts must be able to bypass it and watch the exit
 * byte go green. A control that passes with its mechanism disabled tested
 * nothing (docs/spec/v0.1-scan-slice.md §4.1).
 */
export function gapsFrom(manifest: Manifest): Gap[] {
  const gaps: Gap[] = [];
  for (const e of manifest.all()) {
    if (e.stages.has('evaluated')) continue;
    const cause = e.cause || 'left the funnel before evaluation, and no cause was recorded';
    gaps.push({
      /* The ID, not the alias. A gap travels into #43 as a SYS001 finding, and a
       * finding names its resource by ID and link, never by title (CONTEXT.md
       * settled defaults). Putting the alias here would hand the next ticket a
       * title-shaped resource field and a redaction hole with it. */
      resource: e.key,
      cause,
      bounded: !UNBOUNDED_CAUSE.test(cause),
      /* Pervasiveness condition (a): a declared root that was never REACHED.
       * Reached means resolved. A root that resolved and then stalled is an
       * ordinary gap, bounded or not on its own cause. */
      isRootMiss: e.isRoot && !e.stages.has('resolved'),
    });
  }
  return gaps;
}
