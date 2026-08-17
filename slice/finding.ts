/* What a rule produces, and what a rule publishes about its own coverage.
 *
 * Two shapes live here and they answer different questions:
 *
 *   Finding    — a judgement a rule reached, with a stable identity a baseline
 *                can reference (CONTEXT.md, Finding; ADR-0010 decision 1).
 *   CoverageRow — one rule's coverage over ITS OWN coverage item, one row of the
 *                report's vector (ADR-0011 decisions 1 and 4).
 *
 * This file is shared. SYS001 lands here first (#43) and REF001 (#44) is the
 * second caller, so nothing below may assume a resource-shaped coverage item:
 * SYS001 counts resources, REF001 counts internal references, and ADR-0011
 * decision 4 forbids pooling counts across them.
 *
 * NO BASELINE STATE APPEARS ON A FINDING IN THIS SLICE, and the omission is
 * deliberate rather than pending. docs/spec/v0.1-scan-slice.md §1.2: there is no
 * baseline file and no suppression, every finding is `new` by construction, and
 * "the slice must not pretend otherwise by printing a state it did not compute."
 * A `baselineState` field defaulted to `new` would be a computed-looking claim
 * over a computation that never ran.
 */

import { hyphenate } from './ids.js';

/* --------------------------------------------------------------- identity -- */

/**
 * Layer 1 of finding identity — ADR-0010 decision 1. The pair (rule ID,
 * resource ID) on Notion's native object ID, not hashed and not composed with
 * any content.
 *
 * The ID is normalized to hyphenated form on ingest, which ADR-0010 calls a
 * correctness requirement rather than a tidiness one: the same logical page can
 * arrive as a bare 32-hex string from a config file and as a hyphenated string
 * from an API response, and two string forms of one ID produce two buckets and
 * report every finding on that resource as `new`.
 */
export type Anchor = { rule: string; resource: string };

/**
 * Layer 2 — the discriminator. Answers *which finding of this rule on this
 * resource*, and nothing else. Keys are named and versioned so a later key
 * change is visible in the baseline rather than silent.
 *
 * ADR-0010 decision 6: no matchkey holds the observed value, the expected value,
 * or any other component of the evidence. Evidence enters the baseline through
 * the evidence digest and nowhere else.
 */
export type Discriminator = Record<string, string>;

export const anchorFor = (rule: string, resource: string): Anchor => ({
  rule,
  /* hyphenate() returns null for anything that is not an ID. A non-resource
   * drop-out — an unclassifiable link, say — keys on itself in the manifest, so
   * it can reach here as a non-ID. It keeps its own string rather than being
   * guessed into one, which is the same rule the config loader applies. */
  resource: hyphenate(resource) ?? resource,
});

/** The bucket key. Matching never crosses one (ADR-0010 decision 1). */
export const anchorKey = (a: Anchor): string => `${a.rule}:${a.resource}`;

/* --------------------------------------------------------------- outcomes -- */

/** ADR-0005 decision 1. Absent — not a third value — when the evaluated set is empty. */
export type Conformity = 'conforms' | 'violates' | null;

/**
 * ADR-0005 decision 1. `unreached` takes precedence over `undecidable`.
 *
 * Null when the applicable set is empty. Sufficiency asks whether the evaluated
 * set covered the applicable set, and over nothing that question has no answer —
 * `sufficient` would assert full cover on a run that read nothing.
 */
export type EvidenceSufficiency = 'sufficient' | 'unreached' | 'undecidable' | null;

/** An outcome is a PAIR. Never one value. Either half may be absent. */
export type Outcome = { conformity: Conformity; evidence: EvidenceSufficiency };

/**
 * Did the API prove this finding? A property of the finding.
 * CONTEXT.md: certainty is not target state, and the two never collapse.
 */
export type Certainty = 'confirmed' | 'indeterminate';

/**
 * What the scan established about the object. A property of the object.
 * `absent` is reachable in the type and is not reachable from a 404 — Principle
 * 3, "access failure and object absence share a 404 response."
 */
export type TargetState = 'present' | 'absent' | 'unreachable';

/* --------------------------------------------------------------- findings -- */

/** Principle 2: a rule must name its evidence — object, location, observed, expected. */
export type Evidence = {
  /** The resource the finding is about, by ID. */
  object: string;
  /** Where in the funnel the judgement was reached. */
  location: string;
  observed: string;
  expected: string;
};

export type Finding = {
  rule: string;
  anchor: Anchor;
  discriminator: Discriminator;
  certainty: Certainty;
  targetState: TargetState;
  /** Bounded when the missing items can be named, unbounded when they cannot. */
  bounded: boolean;
  /** ADR-0005 decision 3 condition (a): a declared root that was never reached. */
  isRootMiss: boolean;
  evidence: Evidence;
  /** Null in this slice. The reason is `LINK_NOT_CAPTURED`, and the report prints it. */
  link: string | null;
  /** One line a human reads. Carries no page title. */
  message: string;
};

/**
 * Why `Finding.link` is null, stated once and printed verbatim by the report.
 *
 * CONTEXT.md settled defaults: "a finding in CI names its resource by ID and
 * link, never by title." THIS IS A DISCLOSED GAP, not an oversight. The
 * authoritative link is the object's own `url` field, which this slice never
 * reads — `NotionPort.retrievePage` is typed `{ id: string }` and the child
 * listing returns blocks, not page objects. A link CONSTRUCTED from the ID
 * would be an assertion about Notion's URL scheme for an object whose kind the
 * manifest does not record: `app.notion.com/p/{id}` is observed for pages
 * (docs/research/notion-live-probe.md, search results carrying the API's own
 * `url` field) and is unevidenced for a data source.
 */
export const LINK_NOT_CAPTURED = "not captured — this slice does not read the object's url field";

/* --------------------------------------------------------------- coverage -- */

/**
 * The nouns a rule's applicable set can be a set of — ADR-0011 decision 2,
 * which assigns exactly these to the four shipping rules.
 *
 * A CLOSED UNION ON PURPOSE. ADR-0011 requires each of the four deferred rules
 * to declare a coverage item before it is built, and states that a deferred
 * rule whose unit duplicates an existing one is the Revisit-if that would
 * collapse the whole per-rule scheme. A `string` here lets a rule ship with an
 * undeclared unit, or with `resource` where another says `resources`, and two
 * spellings of one unit is how a vector stops being comparable to itself.
 */
export type CoverageUnit =
  | 'resources'
  | 'internal references'
  | 'resource–property pairs'
  | 'resource pairs in a uniqueness scope';

/**
 * One row of the coverage vector — ADR-0011 decision 1. `unit` travels with the
 * numbers because ADR-0011 decision 4 and spec criterion 6 both forbid printing
 * a figure without naming what it counts.
 */
export type CoverageRow = {
  rule: string;
  /** The noun this rule's applicable set is a set of. Declared by the rule. */
  unit: CoverageUnit;
  evaluated: number;
  applicable: number;
  ratio: number;
};

export const coverageRow = (rule: string, unit: CoverageUnit, evaluated: number, applicable: number): CoverageRow | null =>
  /* ADR-0011 decision 6: a rule with an empty applicable set has an undefined
   * ratio. It LEAVES the vector rather than scoring zero — scoring zero would
   * report a failure where the rule simply had nothing to count. */
  applicable === 0 ? null : { rule, unit, evaluated, applicable, ratio: evaluated / applicable };

/**
 * The headline figure — ADR-0011 decision 4. The MINIMUM over the vector, never
 * a mean and never a pooled count, because counts of different things do not
 * add. Returns the whole row, so the caller cannot print the number without the
 * rule and the unit that produced it.
 */
export function headlineCoverage(vector: CoverageRow[]): CoverageRow | null {
  let min: CoverageRow | null = null;
  for (const row of vector) if (min === null || row.ratio < min.ratio) min = row;
  return min;
}

/** Always "3/4 resources". There is no formatter here that omits the unit. */
export const formatRow = (r: CoverageRow): string =>
  `${r.evaluated}/${r.applicable} ${r.unit} (${(r.ratio * 100).toFixed(1)}%)`;
