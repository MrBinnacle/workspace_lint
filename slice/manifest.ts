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
import type { CoverageUnit } from './finding.js';

export type Stage = 'declared' | 'resolved' | 'enumerated' | 'fetched' | 'evaluated';
export const STAGES: readonly Stage[] = ['declared', 'resolved', 'enumerated', 'fetched', 'evaluated'] as const;

/**
 * The default coverage item. Everything the traversal stages is a resource;
 * REF001 (#44) is the first entrant with a different one.
 */
export const RESOURCES: CoverageUnit = 'resources';

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

/**
 * What a reference entry knows about itself, so no later reader recovers it by
 * parsing a key. Same rule as `Loss`: the site that discovered the fact records
 * it as structure.
 */
export type RefFacts = {
  /** Hyphenated, or null when the candidate was never classified. */
  targetId: string | null;
  /**
   * What KIND of object the discovering shape said the target is. Recorded
   * because the scan can retrieve a page and cannot retrieve a database, and a
   * rule that does not know the difference reports a readable database as a
   * proved dead link.
   */
  targetKind: 'page' | 'database' | 'unknown';
  /** The verbatim href. May carry a page title; never rendered directly. */
  href: string | null;
  /** Which detection route found it. Carries no title. */
  via: string;
  sourcePage: string;
  sourceBlock: string;
  /**
   * The cause the port produced when the target was retrieved, written by the
   * site that made the call. Null when no call was made or the call succeeded.
   * Recorded rather than re-derived: this repository has twice recovered
   * structure from prose and been wrong both times.
   */
  resolveCause: string | null;
};

export type Entry = {
  key: ResourceKey;
  /**
   * WHICH RULE'S COVERAGE ITEM THIS ENTRY IS — ADR-0011 decision 2. A rule
   * counts only the entries whose unit is its own, because ADR-0011 decision 4
   * forbids pooling counts of different nouns. Without this field SYS001's
   * denominator would silently absorb REF001's references and report a
   * resource-coverage ratio over things that are not resources.
   */
  unit: CoverageUnit;
  /** Report-only. MAY CARRY A PAGE TITLE. Printed only under --show-titles. */
  alias: string;
  /** Report-only, and safe on every line. Never carries a title. */
  safeLabel: string;
  stages: Set<Stage>;
  /** Null when the funnel delivered this entry whole. */
  loss: Loss | null;
  /** A declared root, which carries ADR-0005's pervasiveness condition (a). */
  isRoot: boolean;
  /** Present on reference entries only. */
  ref: RefFacts | null;
};

/**
 * One record in the funnel. `alias` omitted keeps the alias already recorded,
 * because the callers that advance a later stage do not carry the title.
 */
export type MarkArgs = {
  id: string;
  stage: Stage;
  /** Defaults to resources. */
  unit?: CoverageUnit;
  alias?: string;
  safeLabel?: string;
  loss?: Loss | null;
  isRoot?: boolean;
  ref?: RefFacts;
};

export class Manifest {
  /**
   * KEYED ON (unit, key), NOT ON key ALONE. A page under the declared root and
   * an internal reference pointing at that same page are two entries in two
   * different coverage items, and they collide on a bare key — one silently
   * overwriting the other, which is the flattering direction because it deletes
   * a drop-out. Entry.key keeps the natural identity for reporting and anchors.
   */
  private readonly entries = new Map<string, Entry>();

  private static slot(unit: CoverageUnit, key: string): string { return `${unit}|${key}`; }

  /**
   * Record an entry at a stage. The key is derived from the ID; a value that is
   * not an ID keys on itself, which is how non-resource drop-outs — an
   * unclassifiable link, say — enter the manifest without pretending to be
   * resources.
   */
  mark(args: MarkArgs): void {
    const unit = args.unit ?? RESOURCES;
    const key = hyphenate(args.id) ?? args.id;
    const slot = Manifest.slot(unit, key);
    const e =
      this.entries.get(slot) ??
      { key, unit, alias: args.alias || key, safeLabel: args.safeLabel || key, stages: new Set<Stage>(), loss: null, isRoot: false, ref: null };
    if (args.alias) e.alias = args.alias;
    if (args.safeLabel) e.safeLabel = args.safeLabel;
    if (args.isRoot) e.isRoot = true;
    if (args.ref) e.ref = args.ref;
    e.stages.add(args.stage);
    if (args.loss) e.loss = args.loss;
    this.entries.set(slot, e);
  }

  /** Record a loss without advancing a stage. */
  note(id: string, loss: Loss, unit: CoverageUnit = RESOURCES): void {
    const e = this.entries.get(Manifest.slot(unit, hyphenate(id) ?? id));
    if (e) e.loss = loss;
  }

  /** Every entry, of every coverage item. The report and gapsFrom read this. */
  all(): Entry[] { return [...this.entries.values()]; }

  /** The entries belonging to one rule's coverage item. */
  of(unit: CoverageUnit): Entry[] { return this.all().filter(e => e.unit === unit); }

  /**
   * How many entries one coverage item holds. THERE IS NO UNIT-FREE `size`, and
   * the omission is deliberate: a bare count over a manifest holding two units
   * is a pooled figure, which ADR-0011 decision 4 forbids.
   */
  count(unit: CoverageUnit = RESOURCES): number { return this.of(unit).length; }

  reached(stage: Stage, unit: CoverageUnit = RESOURCES): number {
    return this.of(unit).filter(e => e.stages.has(stage)).length;
  }
}

/**
 * Derive the gap set from the manifest.
 *
 * This function is the coverage-gap detection mechanism, and it is exported as a
 * named function rather than inlined into the scan for one reason: the mutation
 * check in CHECK-scan-scaffold.ts must be able to bypass it and watch the exit
 * byte go green. A control that passes with its mechanism disabled tested
 * nothing (docs/spec/v0.1-scan-slice.md §4.1).
 *
 * IT SPANS EVERY COVERAGE ITEM, NOT ONLY RESOURCES. CONTEXT.md's Gap entry says
 * a drop-out "produces a gap in every rule whose coverage items depended on it",
 * so an unrecognised link is a gap exactly as a stalled page is. The gap set is
 * therefore MIXED, and a consumer that renders findings must select the entries
 * belonging to its own unit — see sys001.ts findingsFrom. Two units in one gap
 * list is still one source of truth; two gap lists would not be.
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
