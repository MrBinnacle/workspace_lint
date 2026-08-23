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
import type { Attestation } from './notion-port.js';

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
 * The enumeration that listed this resource's children — ADR-0013 decision 2.
 *
 * PRESENT ONLY WHEN A CALL WAS ACTUALLY MADE. A resource that reaches the
 * `enumerated` stage without one — the child_database, which is marked
 * enumerated carrying a drop-out cause and spends no request — has no
 * enumeration and produces no residual. It is a GAP and only a gap.
 *
 * THE RULE IS "NO CALL, NO RESIDUAL". IT IS NOT "NEVER BOTH", and the difference
 * matters because the weaker reading is the one that feels right. A PARTIAL
 * enumeration is both: the scan knows it stopped, which is an unbounded gap, and
 * it also cannot verify that what it did receive was unfiltered, which is a
 * residual. Two different facts about one resource, and suppressing either to
 * keep them mutually exclusive would delete information. What must never happen
 * is the residual entering the gap's arithmetic — that is residualsFrom's
 * concern, not this record's.
 *
 * Recorded as STRUCTURE by the site that made the call, for the same reason
 * `Loss` is. The endpoint is stored rather than the attestation alone so a
 * reader can check the classification instead of trusting it.
 */
export type Enumeration = {
  /** The endpoint family called, e.g. `GET /v1/blocks/{id}/children`. */
  endpoint: string;
  /** Read off the endpoint by attestationOf(). Never inferred from a response. */
  attestation: Attestation;
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
  /**
   * THE SOURCE-SIDE ANCHOR TEXT, RAW — #135, #141. TITLE-CLASS: it is published
   * only under the operator's existing `--show-titles` opt-in, by the same
   * ruling and the same single decision point as `Entry.alias`. There is no
   * second flag; the remedy test made it the same disclosure category, not a
   * new one. `references.ts`' InternalReference docstring holds the full ruling.
   *
   * ⛔ THIS IS THE ONE EXCEPTION TO `UnqFacts`' RULE AND THE EXCEPTION IS
   * ARGUED, NOT ASSUMED. That type forbids storing an observed value because a
   * property value is workspace content that three renderers and a JSON
   * artifact would eventually print. The distinguishing fact is that anchor text
   * is content the operator has ALREADY opted to reveal or not, through a flag
   * that exists — so it has a decision point, and a property value does not. If
   * that flag ever stops governing it, this field becomes the #42 leak with
   * better paperwork.
   *
   * Null for a Route A structural reference, which is a block and has none.
   */
  anchorText: string | null;
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

/**
 * What a (resource, property) pair entry knows about itself — #58, REQ001.
 *
 * SAME RULE AS `Loss` AND `RefFacts`: the site that observed the fact records
 * it as structure. The pair's manifest key is `req:<resource>#<property>`, and
 * a later reader that recovered the property name by splitting that string
 * would be the third instance of the pattern-matching this repository has
 * already been wrong about twice — and property names may contain `#`.
 *
 * `propertyId` IS THE OTHER HALF OF ADR-0010 DECISION 7 AND IT IS NULLABLE.
 * The matchkey hierarchy is `propertyId/v1` then `propertyName/v1`, because
 * neither identifier alone survives both a rename and a type change. The ID is
 * read off the response — the vendored SDK types a property value as carrying
 * its own `id` — and it is null when no map was read or the property was not in
 * it. A null ID drops that pass rather than inventing a value for it.
 */
export type ReqFacts = {
  /** The hyphenated resource ID the pair is about. The finding anchors here. */
  resource: string;
  /** The property name AS CONFIGURED. Operator-supplied, never a page title. */
  property: string;
  /** Observed on the response. Null when the map was never read or lacks the property. */
  propertyId: string | null;
};

/**
 * What a UNIQUENESS PAIR entry knows about itself — #59, UNQ001.
 *
 * ⛔ THE OBSERVED VALUE IS NOT IN THIS TYPE AND MUST NEVER BE ADDED TO IT. A
 * property value is workspace content. `Entry` is read by three renderers and a
 * JSON artifact that outlives the terminal, so a value stored here is a value
 * that will eventually be printed — which is precisely how #42 shipped a page
 * title into a call log four lines under a report claiming titles were
 * redacted. UNQ001 compares values in memory and records only the ANSWER. Same
 * discipline ADR-0010 decision 6 applies to matchkeys: comparison is allowed,
 * publication is not.
 *
 * TWO PARTICIPANTS, LEXICALLY SORTED, because the coverage item is an UNORDERED
 * pair (ADR-0011 decision 2). Sorting at the point of construction is what makes
 * `(A,B)` and `(B,A)` one manifest entry rather than two, and two would double
 * the denominator.
 *
 * `propertyIds` IS PER PARTICIPANT AND POSITIONAL — index 0 belongs to
 * `participants[0]`. The finding anchors on a RESOURCE, not on the pair
 * (ADR-0010 decision 7 line 145), so the matchkey needs the ID observed on that
 * resource and not on its co-participant.
 */
export type UnqFacts = {
  /** The two participant resource IDs, lexically sorted. */
  participants: [string, string];
  /** The property name AS CONFIGURED. Operator-supplied, never a page title. */
  property: string;
  /** The property ID observed on each participant, in `participants` order. */
  propertyIds: [string | null, string | null];
  /** Did the two participants carry the same value? THE ANSWER, never the value. */
  duplicate: boolean;
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
  /**
   * WHAT KIND OF OBJECT THIS RESOURCE IS, as the block listing stated it — #144.
   *
   * RECORDED BY THE SITE THAT OBSERVED IT, never recovered later. The block type
   * in a parent's listing is the only place this fact is stated, and a reader
   * that recovered it by pattern-matching the drop-out cause would be the third
   * instance of a shape this repository has already been wrong about twice —
   * `Loss.bounded` and `Loss.target` were both recovered from prose and both
   * recoveries inverted the answer.
   *
   * `unknown` IS THE DEFAULT AND THE DIRECTION IS DELIBERATE. A resource nobody
   * classified must not inherit a kind, because the inbound-reference
   * measurement selects on this field: defaulting to `data-source` would put
   * unclassified resources in a table of databases, and defaulting to `page`
   * would silently drop a real database out of the denominator. Both are wrong
   * and only one is visible.
   */
  kind: 'page' | 'data-source' | 'unknown';
  /** Report-only. MAY CARRY A PAGE TITLE. Printed only under --show-titles. */
  alias: string;
  /** Report-only, and safe on every line. Never carries a title. */
  safeLabel: string;
  stages: Set<Stage>;
  /** Null when the funnel delivered this entry whole. */
  loss: Loss | null;
  /**
   * The resource's own url, ALREADY REDACTED, or null when the port did not
   * return one. `Finding.link` reads this — CONTEXT.md's settled default names
   * a resource "by ID and link".
   *
   * REDACTED AT THE POINT OF ENTRY, not at the point of render. A Notion URL
   * carries the page title inside its path, and this field is read by three
   * renderers plus a JSON artifact that outlives the terminal. Storing the raw
   * url here and trusting every reader to redact is the shape of the #42 leak.
   */
  link: string | null;
  /** A declared root, which carries ADR-0005's pervasiveness condition (a). */
  isRoot: boolean;
  /** Present on reference entries only. */
  ref: RefFacts | null;
  /** Present on (resource, property) pair entries only. */
  req: ReqFacts | null;
  /** Present on uniqueness pair entries only. Never carries the observed value. */
  unq: UnqFacts | null;
  /** Null unless an enumeration call was made for this resource. ADR-0013 decision 2. */
  enumeration: Enumeration | null;
  /**
   * The `last_edited_time` the API returned on this resource's OWN retrieve —
   * #142, ADR-0017. Verbatim, as an absolute instant.
   *
   * NULL MEANS NO RETRIEVE WAS MADE, WHICH IS THE COMMON CASE and not a defect.
   * A child page discovered in its parent's block listing reaches `fetched`
   * without `GET /v1/pages` ever being called on it, so no response exists to
   * read this from. The measurement prints its denominator rather than letting
   * a reader take the rows for the whole reached set.
   *
   * ⛔ NOT AN AGE, AND NOTHING HERE MAY TURN IT INTO ONE. An age is a function
   * of the clock, so it belongs to VOLATILE_FIELDS and to nothing else — the
   * determinism claim (ADR-0004, acceptance criterion 5) is defined against the
   * normaliser's output, and a section that silently re-derived an age would
   * make two identical runs differ. Recorded by the site that observed it, like
   * `Loss` and `RefFacts`, never re-derived by a later reader.
   */
  lastEditedTime: string | null;
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
  /** Stated by the block listing that named this resource. See Entry.kind. */
  kind?: 'page' | 'data-source';
  alias?: string;
  safeLabel?: string;
  loss?: Loss | null;
  isRoot?: boolean;
  ref?: RefFacts;
  req?: ReqFacts;
  unq?: UnqFacts;
  /** ALREADY REDACTED by the caller. See Entry.link. */
  link?: string | null;
  /** Recorded by the site that made the enumeration call. See Entry.enumeration. */
  enumeration?: Enumeration;
  /** Verbatim from the resource's own retrieve. See Entry.lastEditedTime. */
  lastEditedTime?: string;
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
      { key, unit, kind: 'unknown', alias: args.alias || key, safeLabel: args.safeLabel || key, stages: new Set<Stage>(), loss: null, link: null, isRoot: false, ref: null, req: null, unq: null, enumeration: null, lastEditedTime: null };
    if (args.kind) e.kind = args.kind;
    if (args.alias) e.alias = args.alias;
    if (args.safeLabel) e.safeLabel = args.safeLabel;
    if (args.link) e.link = args.link;
    if (args.isRoot) e.isRoot = true;
    if (args.ref) e.ref = args.ref;
    if (args.req) e.req = args.req;
    if (args.unq) e.unq = args.unq;
    if (args.enumeration) e.enumeration = args.enumeration;
    if (args.lastEditedTime) e.lastEditedTime = args.lastEditedTime;
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

/* --------------------------------------------------------------- residuals --
 *
 * ADR-0013. A residual is a named, structured doubt about the EVIDENCE BASE
 * that no in-band mechanism can resolve. It is not a Gap and it is not a
 * finding.
 *
 * WHY THIS IS NOT A GAP, STATED HERE BECAUSE THE COLLAPSE IS ONE EDIT AWAY.
 * CONTEXT.md defines a Gap as an applicable coverage item that LEFT the funnel
 * before evaluation. Under an unattested enumeration nothing left the funnel —
 * the doubt is whether the item was ever IN it. Appending residuals to the gap
 * set puts a doubt into a denominator, and ADR-0013 decision 3 forbids that
 * because two independent literatures say the quantity is not estimable: survey
 * methodology holds that coverage error "can never be measured", and the
 * capture-recapture sweep found that no upper bound exists for an access
 * pattern that returns each child exactly once. A number derived from it would
 * be invented, and invented in the flattering direction.
 *
 * `CHECK-residuals.ts` TEST 2b performs that collapse and asserts the run
 * changes, so the prohibition is executable rather than merely written down.
 * -------------------------------------------------------------------------- */

/** The fixed machine-readable cause. Generic causes are banned — ADR-0005 decision 5 constraint 2. */
export const RESIDUAL_CAUSE = 'enumeration_unattested';

/**
 * The remedy, and it is what earns the value its place.
 *
 * ADR-0009 decision 6's deletion test: a value is distinct when its remedy is
 * distinct. `unreached` is remedied by widening access or raising the budget;
 * `undecidable` by fixing the rule, the config or the data. Neither helps here —
 * sharing more pages does not give the endpoint a truncation signal, and
 * re-running does not either. The only remedy leaves the tool.
 */
export const RESIDUAL_REMEDY =
  'verify out of band, with a full-access identity, that the declared tree is the tree the scan saw';

export type Residual = {
  cause: typeof RESIDUAL_CAUSE;
  /** The FULL hyphenated ID. Never a prefix: Notion IDs are time-ordered and share leading hex. */
  resource: string;
  endpoint: string;
  remedy: string;
};

/**
 * Derive the residual register from the manifest.
 *
 * Exported as a named function for the same reason `gapsFrom` is: the mutation
 * check must be able to bypass it and watch a control go red. One source of
 * truth — the register is DERIVED from the enumeration records the calling
 * sites wrote, never accumulated beside them, because a second copy drifts and
 * drifts toward the flattering answer (results-ref001-live.md §4).
 */
export function residualsFrom(manifest: Manifest): Residual[] {
  const residuals: Residual[] = [];
  for (const e of manifest.all()) {
    /* No call, no residual. An entry without an enumeration record either made
     * no enumeration call or is not a resource at all. */
    if (!e.enumeration) continue;
    if (e.enumeration.attestation === 'attested') continue;
    residuals.push({
      cause: RESIDUAL_CAUSE,
      /* THE KEY, WHICH IS THE HYPHENATED ID — never the alias. An alias is a page
       * title, and this register is printed on stdout under a default that
       * redacts titles. */
      resource: e.key,
      endpoint: e.enumeration.endpoint,
      remedy: RESIDUAL_REMEDY,
    });
  }
  /* Sorted, not insertion-ordered. Insertion order is call order, which is a
   * property of the traversal and the network rather than of the workspace —
   * SARIF Appendix F.3, the same rule the manifest and findings follow. */
  return residuals.sort((a, b) => (a.resource < b.resource ? -1 : a.resource > b.resource ? 1 : 0));
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
