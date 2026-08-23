/* Measurements — the fourth report class. ADR-0017, spec #139, ticket #142.
 *
 * A Measurement is a counted fact or an observed timestamp about a resource the
 * scan reached, published with a named unit, a link, and the set it was computed
 * over. It makes NO conformity claim.
 *
 * WHY IT IS NOT A RULE, settled by definition rather than preference.
 * `CONTEXT.md` defines a Rule as executable logic that tests one invariant. Edit
 * age tests no invariant — there is no correct value to conform to — so a rule
 * ID would force it to declare a coverage item and enter a conformity ratio for
 * a claim that cannot be stated. ADR-0017 decision 1.
 *
 * WHY IT IS ITS OWN MODULE AND ITS OWN FIELD. Exactly the construction ADR-0013
 * used for residuals: separate field, separate section, so no renderer can merge
 * measurements into a findings table and no exporter can sum across classes. Two
 * things in one table are two things a reader will reasonably add up, and a
 * count read as a defect claim is the alarming direction.
 *
 * ⛔ WHAT MAY NEVER BE ADDED TO THIS FILE — ADR-0017 decision 2, the eight
 * operational rules. No mean, median or percentile in place of rows. No ratio or
 * percentage except over a denominator the OPERATOR supplied. No letter grade,
 * star count, 0–100 index, or colour with implied valence. No positional "top
 * N". No judgement vocabulary — "worst", "bloated", "at risk". No threshold: a
 * threshold exists only as a configured rule with a rule ID, which is framing 3
 * and already has a home. Adding any of them reopens ADR-0001 AND supersedes
 * ADR-0017, and a formatting choice is not either of those.
 */

import type { Entry, Manifest } from './manifest.js';
import { RESOURCES } from './manifest.js';
import { hyphenate } from './ids.js';

/**
 * One row of a measurement. The unit lives on the Measurement, not here, because
 * ADR-0017 rule 3 forbids a number that combines two units — one measurement is
 * one unit by construction, and a row cannot opt out of its parent's.
 */
export type MeasurementRow = {
  /** The resource this row is about, ALREADY SAFE — an ID, never a title. */
  resource: string;
  /**
   * What was measured, rendered. A string rather than a number because a
   * timestamp is not a number and forcing one type on both would make the
   * timestamp measurement lie about its own shape.
   */
  value: string;
  /**
   * The numeric value when there is one, for the reconstructibility test only.
   * Null for a timestamp: ADR-0017 rule 3 means a column of timestamps has no
   * sum, and inventing one would be a number combining a unit with itself
   * dishonestly.
   */
  numeric: number | null;
  /** ADR-0017 rule 2: every number resolves to a link, or says why it does not. */
  link: string | null;
};

/**
 * A measurement that produced rows, or one that could not be computed.
 *
 * ⛔ THE TWO STATES ARE A UNION, NOT A NULLABLE `rows`. ADR-0017 decision 5
 * requires the section never to be silently empty, and an empty array is exactly
 * what a silently-empty section looks like. On the `computed: false` branch
 * `rows` DOES NOT EXIST, so `tsc` rejects a renderer that tries to iterate a
 * measurement that was never computed — the same construction `Suppressible<T>`
 * uses in report.ts, for the same reason: the refusal is structural, not
 * remembered.
 *
 * The grounds are observed in someone else's deployment. Baca et al., DOI
 * 10.1002/spe.2109: a static analysis tool at Ericsson "had been abandoned after
 * it stopped reporting faults; this was caused by an expired license that was
 * not discovered before this study was done." A quiet report and an absent
 * report look identical.
 */
export type Measurement = {
  /**
   * ADR-0017 decision 7. STABLE ACROSS RELEASES, and this is the whole answer to
   * the strongest counter-evidence rather than housekeeping. Sadowski et al.
   * (DOI 10.1145/3188720) records Google deleting the non-blocking warning tier
   * because developers ignored it, and defines an effective false positive as
   * one developers took no action on. A count with no promotion path is one by
   * construction. This key is what lets a measurement become a declared rule
   * condition later with NO change to the measuring code. Renaming it silently
   * breaks that path and the objection becomes permanent.
   */
  id: string;
  /** One line naming what was measured. Carries no judgement vocabulary. */
  label: string;
  /** ADR-0017 rule 1. Named on the measurement, printed with every figure. */
  unit: string;
} & (
  | {
      computed: true;
      rows: MeasurementRow[];
      /**
       * ADR-0017 decision 6. THE SET THIS WAS COMPUTED OVER, printed with the
       * rows, so a zero is scoped or it is not printed. "0 inbound references"
       * asserted over the workspace is negation as failure wearing a
       * measurement's clothes; asserted over the scanned set it is a fact.
       */
      over: string;
      /**
       * ADR-0017 decision 3. Null when the rows do not sum.
       *
       * ⛔ COMPUTED HERE, NEVER SUPPLIED BY A CALLER. That is what makes the
       * reconstructibility test true BY CONSTRUCTION rather than by assertion:
       * there is no code path through which a printed total can disagree with
       * the rows printed beside it, because the total is a function of them. A
       * caller-supplied total would need a check; this needs none, and the
       * check that exists in the suite guards the PRINTING rather than the
       * arithmetic.
       */
      total: number | null;
    }
  | {
      computed: false;
      /**
       * Why not, named. ADR-0017 decision 5: a measurement that could not be
       * computed says so and says why, so a reader can tell a boundary from a
       * pass. Never an empty string — an empty subject makes a downstream
       * `includes()` assertion vacuously true.
       */
      cause: string;
    }
);

/** Every measurement's stable key, in one place so a rename is a visible edit. */
export const MEASUREMENT_IDS = {
  lastEdited: 'measurement/last-edited@1',
  inboundReferences: 'measurement/inbound-references@1',
} as const;

/**
 * THE SCOPE, SPELLED THE SAME WAY EVERY TIME IT IS PRINTED — #144.
 *
 * A zero is scoped or it is not printed (ADR-0017 decision 6). The connection
 * cannot enumerate its own grant (ADR-0002), so "0 inbound references" asserted
 * of the workspace is negation as failure; asserted of the scanned set it is a
 * fact. This is a constant rather than four string literals because the phrasing
 * IS the guarantee, and a guarantee re-typed at each call site is one typo away
 * from a row that quietly makes the unscoped claim.
 */
const SCANNED_SET = 'from the scanned set';

/**
 * The last-write half when this build cannot read one, naming OUR boundary.
 *
 * ⛔ IT NAMES THE MISSING CALL, NOT A MISSING FACT. Notion returns
 * `last_edited_time` on a database — the SDK's own `DatabaseObjectResponse` and
 * `DataSourceObjectResponse` both declare it — so a line reading "no timestamp"
 * would assert something false about the vendor. What is missing is a method on
 * OUR port, whose entire surface is three GETs and none of them retrieves a
 * database. Widening it is #51 and is ask-first, not a thing to do here.
 *
 * When that call lands, this branch stops being taken with NO change to this
 * file: the row reads `Entry.lastEditedTime`, which the new retrieve would
 * populate exactly as `GET /v1/pages` populates it for a page today.
 */
const NO_DATABASE_RETRIEVE = 'last edited: not read (this scan makes no database retrieve)';

/**
 * The same boundary at full length, printed ONCE beside the rows.
 *
 * ⚠ SPLIT IN TWO BECAUSE THE ONE-PIECE VERSION MADE THE SECTION UNREADABLE, and
 * that was found by rendering it rather than by any assertion. The full sentence
 * repeated on every row is three clauses of identical text between the reader
 * and the only thing that varies, which is the count. The short marker keeps the
 * row self-explanatory — it says what is missing and whose fault it is — and the
 * detail sits on the measurement, where a cause that is identical for every row
 * belongs. Splitting it into "row says what, measurement says why" is the same
 * move the manifest makes with `Loss.cause` and the disclosure block.
 */
const NO_DATABASE_RETRIEVE_DETAIL =
  'last-write timestamps are unread for every row: this scan retrieves pages only (GET /v1/pages/{id}) and makes no database retrieve, so no response carrying a database\'s last_edited_time exists — the boundary is this tool\'s, not the vendor\'s, and it widens under #51';

/**
 * The resources whose own retrieve this scan made.
 *
 * ⛔ THIS IS A SMALLER SET THAN "RESOURCES THE SCAN REACHED", AND THE GAP IS THE
 * POINT. `GET /v1/pages/{id}` runs for the declared root, for reference targets,
 * and for resources a configured rule needed hydrated. A child page discovered
 * in the root's block listing is ENUMERATED and FETCHED without its own retrieve
 * ever being made, so no response carrying its `last_edited_time` exists.
 *
 * The honest consequence is that this measurement's denominator is the retrieved
 * set and it says so, rather than quietly reporting rows for the resources it
 * happens to have and letting the reader infer the rest were not edited. That
 * inference is the defect this product exists to detect, and it would be this
 * product committing it.
 */
const retrieved = (e: Entry): boolean => e.unit === RESOURCES && e.lastEditedTime !== null;

/**
 * Derive the v0.1 measurement set from the manifest.
 *
 * INJECTED AT THE SAME SEAM AS `gapsFrom` AND `residualsFrom`, and exported as a
 * named function for the same reason both of those are: a control that passes
 * with its mechanism disabled tested nothing, so the mutation check must be able
 * to replace it.
 */
export function measurementsFrom(manifest: Manifest): Measurement[] {
  const all = manifest.of(RESOURCES);
  const withTimes = all.filter(retrieved);

  /* SORTED BY A NAMED KEY, AND THE HEADER NAMES IT — ADR-0017 rule 6. Sorting is
   * allowed and ranking is not: the reader draws the conclusion from an ordered
   * table, where "top 5 most neglected" would draw it for them. Oldest first,
   * because the reader is looking for what has gone quiet.
   *
   * The resource ID is the tie-break, so the order is TOTAL. Insertion order is
   * call order, which is a property of the traversal and of the network rather
   * than of the workspace — ADR-0004, and the same reason SARIF Appendix F.3
   * sorts results. Without a tie-break two runs over an unchanged workspace
   * could differ, which would make this section the reason determinism fails. */
  const rows: MeasurementRow[] = withTimes
    .map(e => ({
      resource: e.safeLabel,
      value: e.lastEditedTime as string,
      /* Timestamps do not sum. ADR-0017 rule 3 forbids a number combining two
       * units, and a column of instants has no total that means anything. */
      numeric: null,
      link: e.link,
    }))
    .sort((a, b) => (a.value === b.value
      ? (a.resource < b.resource ? -1 : a.resource > b.resource ? 1 : 0)
      : a.value < b.value ? -1 : 1));

  const lastEdited: Measurement = rows.length === 0
    ? {
        id: MEASUREMENT_IDS.lastEdited,
        label: 'Last edited, per resource the scan retrieved (sorted by timestamp, oldest first)',
        unit: 'resources',
        computed: false,
        cause: `no resource carried a last-edited timestamp — GET /v1/pages runs for the declared root, for reference targets, and for rule hydration only, so a resource enumerated in a parent's block listing has no response of its own to read one from (${all.length} resource(s) reached)`,
      }
    : {
        id: MEASUREMENT_IDS.lastEdited,
        label: 'Last edited, per resource the scan retrieved (sorted by timestamp, oldest first)',
        unit: 'resources',
        computed: true,
        rows,
        /* THE DENOMINATOR, PRINTED. Both numbers, so the reader can see how much
         * of the reached set this measurement is silent about, rather than
         * reading the rows as the whole picture. */
        over: `${rows.length} of ${all.length} reached resource(s) — those the scan retrieved directly; the remainder were enumerated without their own retrieve, so no timestamp exists for them`,
        /* Null, and not zero. A zero total would be a number the run did not
         * compute, printed where a real one goes. */
        total: null,
      };

  return [lastEdited, inboundReferences(manifest)];
}

/* ------------------------------------------------ inbound references (#144) --
 *
 * Per reached database: how many references in the scan's own reference set
 * point at it, printed BESIDE its last-write timestamp.
 *
 * WHY THE TWO TRAVEL TOGETHER AND NEITHER SHIPS ALONE. A database nobody links
 * to that was edited this morning is in use. One edited fourteen months ago that
 * nothing points at is the structure the owner is actually looking for. Either
 * figure on its own reads as noise, and the pair is the signal — which is also
 * why there is no threshold: the operator reads the rows and draws the
 * conclusion. A threshold here would be a vendor default with worse provenance
 * (Beller et al., DOI 10.1109/SANER.2016.105: 80%+ of config files are never
 * changed after creation, so a number we pick once is a number nobody revisits).
 * -------------------------------------------------------------------------- */

/**
 * ⚠ THE UNIT IS THE REFERENCE, AND THE REFERENCE SET IS DEDUPLICATED BY TARGET.
 * `dedupeReferences` keys internal references on `i|<targetId>`, so fifty links
 * to one database are ONE reference — #141 settled that deliberately, because
 * the alternative makes every printed figure move with where an editor pasted a
 * link rather than with what the workspace contains.
 *
 * The honest consequence is that this count is structurally 0 or 1 on today's
 * build: it answers *is anything in the scanned set pointing here*, not *how
 * many links exist*. The unit string says so, because a reader who takes `1` for
 * a link count has been misled by a number that is technically correct. This is
 * surfaced on the ticket rather than patched here — widening it would mean
 * changing the reference unit, which is #141's decision and not this one's.
 */
const INBOUND_UNIT = 'inbound references from the scanned set';

/**
 * The deduplication caveat, printed once on the `over` line rather than in the
 * unit. ADR-0017 rule 1 has the unit travelling with every figure, so a unit
 * that is a sentence is a sentence printed on every figure — the total rendered
 * as "1 inbound references from the scanned set (one per referencing target,
 * deduplicated)" before this was split out.
 */
const DEDUPE_CAVEAT =
  'counted per referencing TARGET, not per link: the reference set is deduplicated by target (#141), so a row reading 1 means at least one link points here and not that exactly one does';

/**
 * Count the references pointing at each reached database.
 *
 * ⛔ SELECTED BY `Entry.kind`, WHICH THE BLOCK LISTING STATED — never by parsing
 * a drop-out cause. Every reached database in this build is a drop-out carrying
 * a named cause, and reading "data source" out of that string would be the third
 * time this repository recovered structure from prose; the first two recoveries
 * both inverted their answer.
 *
 * EXTERNAL REFERENCES CANNOT ENTER THIS COUNT AND THE EXCLUSION IS STRUCTURAL:
 * `registerReferences` skips `kind === 'external'` before the manifest is
 * touched, so an external href has no entry to be counted. The filter below
 * additionally requires a `targetId`, which drops the unrecognised candidates —
 * they were never classified to a target, so they cannot be evidence that
 * anything points at this database.
 */
function inboundReferences(manifest: Manifest): Measurement {
  const label = 'Inbound references and last write, per reached database (sorted by inbound count ascending, then by resource ID)';

  const databases = manifest.of(RESOURCES).filter(e => e.kind === 'data-source');

  /* The references that reached a target, indexed by the target they name. */
  const inbound = new Map<string, number>();
  for (const e of manifest.all()) {
    const targetId = e.ref?.targetId;
    if (!targetId) continue;
    const key = hyphenate(targetId) ?? targetId;
    inbound.set(key, (inbound.get(key) ?? 0) + 1);
  }

  if (databases.length === 0) {
    return {
      id: MEASUREMENT_IDS.inboundReferences,
      label,
      unit: INBOUND_UNIT,
      computed: false,
      /* NOT "no databases exist". The scan reached none, which is a fact about
       * this scan's declared roots and its grant, and the two readings have
       * different remedies — widen the roots, or widen the grant. */
      cause: `no data source was reached by this scan, so there is nothing to count references against (${manifest.of(RESOURCES).length} resource(s) reached, none of kind data-source)`,
    };
  }

  const rows: MeasurementRow[] = databases
    .map(e => {
      const count = inbound.get(e.key) ?? 0;
      /* THE SCOPE TRAVELS ON EVERY ROW, not only on the zero. A reader scanning
       * a column of numbers reads the qualifier once, at most; putting it only
       * on the zeros would make the scoped phrasing look like a special case
       * rather than the standing terms of the whole column. */
      const written = e.lastEditedTime === null
        ? NO_DATABASE_RETRIEVE
        : `last edited: ${e.lastEditedTime}`;
      return {
        resource: e.safeLabel,
        value: `${count} ${count === 1 ? 'inbound reference' : 'inbound references'} ${SCANNED_SET}  ·  ${written}`,
        numeric: count,
        link: e.link,
      };
    })
    /* Ascending, so the reader's eye lands on the zeros first WITHOUT the report
     * ranking anything — ADR-0017 rule 6. The resource ID is the tie-break, so
     * the order is total and two runs over an unchanged workspace cannot differ;
     * insertion order is traversal order, which is a property of the network. */
    .sort((a, b) => (a.numeric === b.numeric
      ? (a.resource < b.resource ? -1 : a.resource > b.resource ? 1 : 0)
      : (a.numeric ?? 0) - (b.numeric ?? 0)));

  return {
    id: MEASUREMENT_IDS.inboundReferences,
    label,
    unit: INBOUND_UNIT,
    computed: true,
    rows,
    over: `${rows.length} reached data source(s), counted against the ${inbound.size} reference target(s) this scan resolved — ${SCANNED_SET} only, never the workspace: the connection cannot enumerate its own grant (ADR-0002). ${DEDUPE_CAVEAT}. ${NO_DATABASE_RETRIEVE_DETAIL}`,
    /* THESE ROWS DO SUM, unlike the timestamp measurement's. The total is the
     * number of inbound references this scan saw landing on any reached
     * database, and it is COMPUTED from the rows printed beside it, so a
     * reader's recount cannot disagree with it. */
    total: rows.reduce((sum, x) => sum + (x.numeric ?? 0), 0),
  };
}
