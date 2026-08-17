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

/**
 * A resource's identity inside the manifest: the hyphenated Notion ID, or the
 * raw string when the value is not an ID at all.
 *
 * The second half is not a fallback for convenience. A non-resource drop-out —
 * an unclassifiable link, say — keys on itself so that it enters the manifest
 * without pretending to be a resource. `hyphenate()` never guesses.
 */
export type ResourceKey = string;

/**
 * What the scan lost at a resource, recorded as STRUCTURE rather than prose.
 *
 * WHY THIS IS A RECORD AND NOT A CAUSE STRING. The producer of a drop-out knows
 * three separate facts: why it happened, whether the missing items can be
 * counted, and what was established about the resource itself. Storing only the
 * prose forced two later readers to recover the other two by pattern-matching
 * it, and both recoveries were wrong:
 *
 *   - Boundedness was matched from three phrases, so a root whose child list
 *     failed OUTRIGHT was classified `bounded` while one that failed HALFWAY was
 *     `unbounded`. Failing harder produced the better verdict — exit 3 instead
 *     of 2 — and `request_status: incomplete` was misread the same way.
 *   - `target` was inferred from the `resolved` stage, which scan.ts stamps on
 *     every child straight out of the parent's block listing. A child whose own
 *     call returned 404 was reported `present`, which is a positive claim about
 *     an object the API had just refused (Principle 3).
 *
 * Each drop-out site now states all three. A new site cannot omit them.
 */
export type Loss = {
  /** Specific and machine-readable. Generic causes are banned — ADR-0005 decision 5, constraint 2. */
  cause: string;
  /** Bounded when the missing items can be named and counted; unbounded when they cannot. */
  bounded: boolean;
  /**
   * What the scan established about THIS resource, never about what it
   * contains. `absent` is not reachable: a 404 is access failure or object
   * absence and the API does not say which (Principle 3).
   */
  target: 'present' | 'unreachable';
};

/** Passed as the alias when a call must not overwrite the one already recorded. */
export const KEEP_ALIAS = '';

export type Entry = {
  key: ResourceKey;
  /** Report-only. Never addresses anything. */
  alias: string;
  stages: Set<Stage>;
  /** Null when the funnel delivered this resource whole. */
  loss: Loss | null;
  /** A declared root, which carries ADR-0005's pervasiveness condition (a). */
  isRoot: boolean;
};

export class Manifest {
  private readonly entries = new Map<string, Entry>();

  /**
   * Record a resource at a stage. The key is derived from the ID; a value that
   * is not an ID keys on itself, which is how non-resource drop-outs (an
   * unclassifiable link, say) enter the manifest without pretending to be
   * resources.
   */
  mark(id: string, alias: string, stage: Stage, loss: Loss | null = null, isRoot = false): void {
    const key = hyphenate(id) ?? id;
    const e = this.entries.get(key) ?? { key, alias: alias || key, stages: new Set<Stage>(), loss: null, isRoot: false };
    /* KEEP_ALIAS reaches here as the empty string. An empty alias keeps the one
     * already recorded rather than clearing it, because the callers that advance
     * a stage later in the funnel do not carry the title. */
    if (alias) e.alias = alias;
    if (isRoot) e.isRoot = true;
    e.stages.add(stage);
    if (loss) e.loss = loss;
    this.entries.set(key, e);
  }

  /** Record a loss without advancing a stage. */
  note(id: string, loss: Loss): void {
    const key = hyphenate(id) ?? id;
    const e = this.entries.get(key);
    if (e) e.loss = loss;
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
    const loss = e.loss ?? unrecordedLoss(e);
    gaps.push({
      /* The ID, not the alias. A gap travels into #43 as a SYS001 finding, and a
       * finding names its resource by ID and link, never by title (CONTEXT.md
       * settled defaults). Putting the alias here would hand the next ticket a
       * title-shaped resource field and a redaction hole with it. */
      resource: e.key,
      cause: loss.cause,
      bounded: loss.bounded,
      /* Pervasiveness condition (a): a declared root that was never REACHED.
       * Reached means resolved. A root that resolved and then stalled is an
       * ordinary gap, bounded or not on its own record. */
      isRootMiss: e.isRoot && !e.stages.has('resolved'),
    });
  }
  return gaps;
}

/**
 * The loss for an entry that stalled without one being recorded.
 *
 * ADR-0005 decision 5: "an entry that stalls without a cause is still reported,
 * with the absence of the cause stated as the cause." The resource is named, so
 * the loss is bounded. `target` is the only fact still inferred from a stage,
 * and it is inferred conservatively — a resource that never resolved is not
 * claimed present.
 */
const unrecordedLoss = (e: Entry): Loss => ({
  cause: 'left the funnel before evaluation, and no cause was recorded',
  bounded: true,
  target: e.stages.has('resolved') ? 'present' : 'unreachable',
});
