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

import type { DbFacts, Entry, Manifest } from './manifest.js';
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
  /**
   * WHY THIS ROW HAS NO LINK, when the shared default would state it wrongly.
   *
   * ⛔ IT EXISTS BECAUSE THE SHARED CONSTANT WENT FALSE ON THE FIRST TABLE THAT
   * ROWED A DATABASE. `report.ts` prints `LINK_NOT_CAPTURED` for a null link —
   * "GET /v1/pages runs for the declared root and for reference targets only, so
   * no url exists for this resource" — and the inbound-reference measurement
   * rows databases that ARE reference targets. The row refuted that sentence on
   * its own line: it read "1 inbound reference from the scanned set … not
   * captured — … for reference targets only." The real reason is that a database
   * target short-circuits before the retrieve, because this slice retrieves
   * pages only.
   *
   * A generic constant is right until a new caller's boundary differs from the
   * one it names, and this repository has now shipped that shape three times
   * with column widths. Null here keeps the shared default; a string overrides
   * it for callers whose reason is genuinely different.
   */
  linkCause?: string;
  /**
   * WHY THIS ROW'S VALUE COULD NOT HAVE COME OUT ANY OTHER WAY — #158 item 2.
   *
   * ⛔ IT EXISTS BECAUSE FOUR OF FIVE REPORTS IN THE RUN-2 READ PRINTED FIGURES
   * THAT WERE ARITHMETICALLY FORCED, SORTED AND TOTALLED IN THE FURNITURE OF A
   * DISTRIBUTION (`docs/proof/dispositions-run2.md`). Two roots resolved zero
   * references of any kind, so every inbound row could only be 0; one root's
   * single row could only be 0 or 1. **A figure that cannot vary with the state
   * of the workspace is not a measurement of the workspace**, and printing it
   * beside figures that can is what made the section read as noise.
   *
   * ⚠ FORCED IS NOT WRONG AND THE ROW IS NOT SUPPRESSED. The value is correct;
   * what it lacks is informational content, and the honest fix is to say so on
   * the row rather than to withhold it — withholding would be the silently-empty
   * section ADR-0017 decision 5 forbids. Undefined means the value could have
   * been otherwise, which is the ordinary case.
   */
  forced?: string;
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
       *
       * ⚠ SINCE #158 ITEM 6 THIS IS THE LONG FORM AND IT NO LONGER PRINTS IN
       * THE MEASUREMENTS SECTION. It moves to DISCLOSURES, in full, with its
       * endpoints and citations intact — ⛔ MOVED, NEVER DELETED. No seat in the
       * run-2 read proposed cutting a word of it; all four proposed relocating
       * it, and a boundary a reader cannot find is the silent report ADR-0017
       * decision 5 forbids.
       */
      cause: string;
      /**
       * The one line that prints beside the label — #158 item 6.
       *
       * ⛔ THE SECTION SPENT ROUGHLY A THOUSAND CHARACTERS OF PROSE PER RENDERED
       * FIGURE, ON EVERY RUN, PER ROOT (`docs/proof/dispositions-run2.md`).
       * Three of four SME seats binned the density as noise between the reader
       * and the numbers. Worse, a statement identical on every run of a build is
       * a property of the BUILD, not a measurement of the workspace, and it was
       * printed where measurements of the workspace go.
       *
       * ⛔ IT MUST NAME THE LEVER, WHICH IS THE ONLY PART A READER CAN ACT ON —
       * item 5. A line beginning `[BLOCKED — needs an operator grant, not a
       * call]` and a line that is one authorized GET away are the same shrug
       * without it.
       */
      blocker: string;
    }
);

/** Every measurement's stable key, in one place so a rename is a visible edit. */
export const MEASUREMENT_IDS = {
  lastEdited: 'measurement/last-edited@1',
  inboundReferences: 'measurement/inbound-references@1',
  databaseTypedProperties: 'measurement/database-typed-properties@1',
  databaseViews: 'measurement/database-views@1',
  peoplePropertyEmpty: 'measurement/people-property-empty@1',
} as const;

/**
 * Is a measurement's printed total the sum of the rows printed beside it?
 *
 * ADR-0017 decision 3, as an EXPORTED PREDICATE rather than a loop inside the
 * suite — #143. Inline, the only thing a check can do is recompute and compare,
 * and that passes for every measurement this file can build, because no code
 * path hands `measurementsFrom` a total. A control that only ever sees inputs it
 * must accept has not been shown to reject anything. Exported, the suite can
 * feed it a deliberately skewed measurement and watch it return false, which is
 * the difference between a control and a restatement.
 *
 * `computed: false` is vacuously reconstructible: there is no total and no rows,
 * so there is no arithmetic for a reader to disagree with.
 */
export function totalIsReconstructible(m: Measurement): boolean {
  if (!m.computed) return true;
  /* Null means the rows do not sum, and the honest form of that claim is that
   * NONE of them is numeric — a null total over numeric rows would be a figure
   * withheld rather than a figure that does not exist. */
  if (m.total === null) return m.rows.every(x => x.numeric === null);
  return m.total === m.rows.reduce((sum, x) => sum + (x.numeric ?? 0), 0);
}

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
const NO_DATABASE_RETRIEVE = 'last edited: not read (no database retrieve, and its block carried no timestamp)';

/**
 * Why a database row carries no link, stated for the database case specifically.
 *
 * ⛔ THE SHARED CONSTANT IS FALSE HERE AND THE ROW REFUTED IT ON ITS OWN LINE.
 * `LINK_NOT_CAPTURED` reads "GET /v1/pages runs for the declared root and for
 * reference targets only, so no url exists for this resource" — printed beside
 * "1 inbound reference from the scanned set", on a resource that is a reference
 * target. Both halves of that line cannot be true.
 */
const NO_DATABASE_LINK =
  'no link — a database reference target short-circuits before the retrieve (this slice retrieves pages only), so no response carrying a url was ever received for it';

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
  'where a last-write timestamp is unread on a row, both sources were silent: this scan retrieves pages only (GET /v1/pages/{id}) and makes no database retrieve, and that database\'s own child_database block in the parent listing carried no last_edited_time either — the boundary is this tool\'s, not the vendor\'s, and it widens under #51';

/**
 * The resources this scan OBSERVED a timestamp for, from either call.
 *
 * ⛔ IT USED TO SAY "the resources whose own retrieve this scan made", AND THE
 * SENTENCE BENEATH IT WAS FALSE — #158 item 0. It read: a child page discovered
 * in the root's block listing is enumerated and fetched without its own retrieve,
 * "so no response carrying its `last_edited_time` exists". The response exists.
 * `GET /v1/blocks/{block_id}/children` returns block objects, a full block
 * object carries `last_edited_time`, a `child_page` IS a block object, and this
 * scan already makes that call. The field was discarded at our own type boundary
 * (`BlockListResponse.results: unknown[]`) and the report then named a
 * vendor-shaped obstacle for a figure the run already held — which is precisely
 * the inference this product exists to detect, committed by this product.
 *
 * ⚠ THE SET IS STILL SMALLER THAN "RESOURCES THE SCAN REACHED" and the gap is
 * still the point. A block object may arrive PARTIAL, carrying an id and no
 * timestamp, and when the API does that is undocumented. Such a resource gets no
 * row, and the denominator below prints both numbers so a reader cannot take the
 * rows for the whole reached set.
 */
const observed = (e: Entry): boolean => e.unit === RESOURCES && e.lastEditedTime !== null;

/**
 * How a row's timestamp was obtained, in the row's own words.
 *
 * ⛔ THE TWO PROVENANCES DO NOT CARRY THE SAME WEIGHT AND A BARE COLUMN OF
 * INSTANTS HIDES THAT. A retrieve-sourced value is the page's own timestamp as
 * the vendor documents it. A listing-sourced value is the BLOCK's timestamp, and
 * that it equals the page's is an empirical finding at n=1 with the vendor
 * silent. Printing them in one column without a marker asserts that they are the
 * same kind of fact.
 *
 * ⚠ SHORT ON THE ROW, FULL ON THE MEASUREMENT — the split this file already
 * makes with `NO_DATABASE_RETRIEVE` and its detail, and for the same reason: the
 * full licence repeated on every row is four clauses of identical text between
 * the reader and the only thing that varies.
 */
const provenanceOf = (e: Entry): string =>
  e.lastEditedSource === 'retrieve'
    ? 'from its own retrieve'
    : "from the parent's block listing";

/**
 * THE LICENCE, PRINTED ONCE BESIDE THE ROWS, WITH ITS RECEIPT.
 *
 * ⛔ ALL THREE LIMITS ARE MANDATORY AND NONE IS OPTIONAL. A block timestamp
 * labelled as its page's rests on `docs/proof/results-block-vs-page-timestamp.md`
 * — pre-registered at `cc0eb1c` before any data existed, four runs, the block's
 * value moving with its page's on every content-only edit and equal at every
 * measurement. That is an OBSERVATION at n=1 and never a documented guarantee:
 * the vendor has promised nothing and may change it without notice. The
 * partial-block-object case was not forced, so the finding holds on a full
 * object and says nothing about a partial one. And the API truncates the value
 * to the MINUTE (24 of 24 observed), which the vendor does not document and its
 * own example contradicts.
 *
 * ⛔ THE TRUNCATION IS LOAD-BEARING FOR A READER, NOT TRIVIA. Two edits inside
 * one minute are indistinguishable in this column, so nothing here or downstream
 * may order edits or measure elapsed time below that resolution.
 */
/**
 * ⚠ IT NO LONGER SAYS "per resource the scan RETRIEVED" — #158 item 0. That
 * label was correct while the retrieve was the only source and became a false
 * narrowing the moment the block listing's field was kept: most rows in this
 * table now belong to resources that were never retrieved. `observed` is the
 * predicate, so `observed` is the word.
 */
const LAST_EDITED_LABEL =
  'Last edited, per resource whose timestamp this scan observed (sorted by timestamp, oldest first)';

const BLOCK_TIMESTAMP_LICENCE =
  "a timestamp marked \"from the parent's block listing\" is the child_page or child_database BLOCK's last_edited_time, taken from GET /v1/blocks/{block_id}/children, which this scan already makes; that it is also the page's own is an OBSERVED finding and not a documented guarantee — observed n=1, vendor silent, four runs, docs/proof/results-block-vs-page-timestamp.md — and the API truncates every value in this column to the minute, so two edits within one minute are indistinguishable here and nothing may order edits below that resolution";

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
  const withTimes = all.filter(observed);

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
  /* ⛔ SORTED ON THE INSTANT, NEVER ON THE RENDERED CELL. The cell carries the
   * provenance marker after the timestamp, and sorting the rendered string would
   * let two resources edited in the same minute be ordered by which call
   * observed them — a property of this scan's traversal, not of the workspace,
   * which is the class of field ADR-0004's normaliser exists to strip. The
   * resource ID stays the tie-break, so the order is TOTAL and two runs over an
   * unchanged workspace cannot differ. */
  const rows: MeasurementRow[] = withTimes
    .slice()
    .sort((a, b) => (a.lastEditedTime === b.lastEditedTime
      ? (a.safeLabel < b.safeLabel ? -1 : a.safeLabel > b.safeLabel ? 1 : 0)
      : (a.lastEditedTime as string) < (b.lastEditedTime as string) ? -1 : 1))
    .map(e => ({
      resource: e.safeLabel,
      /* THE PROVENANCE TRAVELS ON EVERY ROW, not only on the weaker one. Marking
       * only the block-sourced values would make the unmarked ones read as a
       * default the reader never had explained, and the two statuses are exactly
       * what this column would otherwise flatten. */
      value: `${e.lastEditedTime as string}  ·  ${provenanceOf(e)}`,
      /* Timestamps do not sum. ADR-0017 rule 3 forbids a number combining two
       * units, and a column of instants has no total that means anything. */
      numeric: null,
      link: e.link,
    }));

  const lastEdited: Measurement = rows.length === 0
    ? {
        id: MEASUREMENT_IDS.lastEdited,
        label: LAST_EDITED_LABEL,
        unit: 'resources',
        /* ⛔ NOT READ, NOT "NOT COMPUTED" — #158 item 4. The call was made: this
         * scan lists the root's children on every run. What is missing is the
         * FIELD on the responses that came back, which is a different fact with
         * a different remedy, and flattening the two into one apology is what
         * item 4 of the ticket names. */
        computed: false,
        blocker: `NOT READ — the calls were made and no response carried a last-edited timestamp (${all.length} resource(s) reached)`,
        cause: `no resource carried a last-edited timestamp — the calls were made and the field was absent from every response: GET /v1/pages/{id} runs for the declared root, for reference targets and for rule hydration, and GET /v1/blocks/{block_id}/children returns a block object per child, but a PARTIAL block object carries no last_edited_time and when the API returns one is undocumented (${all.length} resource(s) reached)`,
      }
    : {
        id: MEASUREMENT_IDS.lastEdited,
        label: LAST_EDITED_LABEL,
        unit: 'resources',
        computed: true,
        rows,
        /* THE DENOMINATOR, PRINTED. Both numbers, so the reader can see how much
         * of the reached set this measurement is silent about, rather than
         * reading the rows as the whole picture. */
        over: `${rows.length} of ${all.length} reached resource(s) — those whose timestamp this scan observed, from a retrieve of the resource itself or from its block in the parent's listing; the remainder returned a partial block object carrying no timestamp and have no row here. ${BLOCK_TIMESTAMP_LICENCE}`,
        /* Null, and not zero. A zero total would be a number the run did not
         * compute, printed where a real one goes. */
        total: null,
      };

  /* APPENDED, AND THE ORDER IS THE RENDER ORDER. `report.ts` iterates this array,
   * so `lastEdited` staying first is a choice rather than an accident: the
   * computed lines lead, and the boundary lines follow them. */
  const reachedDatabases = all.filter(e => e.kind === 'data-source');

  return [
    lastEdited,
    inboundReferences(manifest),
    ...maintenanceLoad(reachedDatabases),
  ];
}

/* ------------------------------------------ the boundary lines (#143, #145) --
 *
 * ⛔ THESE THREE ARE `computed: false` ON TODAY'S BUILD, AND THAT IS THE HONEST
 * ANSWER RATHER THAN AN UNFINISHED ONE. `NotionPort` declares three methods —
 * `GET /v1/users/me`, `GET /v1/pages/{id}`, `GET /v1/blocks/{id}/children` — and
 * `scan.ts`'s `child_database` branch returns before spending a request. No
 * schema, no view listing and no row has ever entered the manifest, so there is
 * nothing here to count and no fixture, offline or live, that could change that:
 * the limit is the PORT'S SHAPE, not the grant and not the data.
 *
 * ⛔ SO THE CAUSE MUST NAME THE ENDPOINT, AND MUST NAME THE RIGHT OBSTACLE. The
 * three lines do not share one: the schema endpoint is authorized, the view
 * endpoint needs no grant a read-only integration lacks, and the row endpoint is
 * an ASK FIRST decision that has NOT been granted. An operator told only "not
 * computed" reaches for the wrong remedy, and one told "insufficient permission"
 * about the view line would be told something false about their own token.
 *
 * WHY THEY ARE PRINTED AT ALL — ADR-0017 decision 5. A quiet report and an
 * absent report look identical. Baca et al., DOI 10.1002/spe.2109: a static
 * analysis tool at Ericsson "had been abandoned after it stopped reporting
 * faults; this was caused by an expired license that was not discovered before
 * this study was done."
 * -------------------------------------------------------------------------- */

/**
 * The reached-set clause every boundary cause below ends with.
 *
 * ⭐ SCOPED TO WHAT THIS SCAN ACTUALLY REACHED, so "not computed" is an
 * observation about this run rather than a standing disclaimer a reader learns
 * to skip. A line that reads the same on every workspace is a line nobody reads.
 */
const reachedClause = (databases: number): string =>
  `${databases} data source(s) reached by this scan`;

/**
 * The three properties whose count IS the maintenance load — #143.
 *
 * ⛔ THE SELECTOR IS THE CONFIG'S `type` AND NEVER ITS NAME. Principle 4 forbids
 * inferring meaning from a label, and a column called "Rollup" is a label.
 */
const MAINTENANCE_TYPES = ['relation', 'rollup', 'formula'] as const;

/** The columns of one type, summed across every data source of one database. */
const countType = (facts: DbFacts, type: string): number =>
  facts.schemas.reduce((sum, s) => sum + (s.types[type] ?? 0), 0);

/** Every column the schemas declared, so a type count has a denominator. */
const countProperties = (facts: DbFacts): number =>
  facts.schemas.reduce((sum, s) => sum + s.properties, 0);

function maintenanceLoad(databases: Entry[]): Measurement[] {
  return [typedProperties(databases), viewCounts(databases), peopleEmpty(databases)];
}

/* ------------------------------------------- relation/rollup/formula (#143) -- */

/**
 * ⭐ COMPUTED SINCE #158 ITEM 1, AND THE OBSTACLE WAS NEVER THE GRANT. The line
 * used to read "no data-source schema was retrieved", naming a port with three
 * methods. `GET /v1/databases/{id}` was authorized under #51 on 2026-08-18 and
 * `GET /v1/data_sources/{data_source_id}` needs none, so what stood between this
 * count and the report was two uncalled GETs — a fact about this build that had
 * been rendering as a boundary a reader could do nothing about.
 *
 * ⛔ THE TWO-CALL PATH IS NOT AN IMPLEMENTATION DETAIL. A database retrieve on
 * API version `2026-03-11` returns a `data_sources` list and no property map;
 * the columns live one call further on. Collapsing them yields an empty schema
 * and a confident zero, which is worse than an error because a zero prints like
 * an observation.
 */
function typedProperties(databases: Entry[]): Measurement {
  const label = 'Relation, rollup and formula properties, per reached database (sorted by count ascending, then by resource ID)';
  const unit = 'properties (relation, rollup or formula)';

  const readable = databases.filter(e => e.db !== null && e.db.schemas.length > 0);

  if (readable.length === 0)
    return {
      id: MEASUREMENT_IDS.databaseTypedProperties,
      label,
      unit,
      computed: false,
      ...notReadCause(databases, 'schema',
        `these counts are read off the schema that GET /v1/data_sources/{data_source_id} returns ("information that describes the structure and columns of a data source", docs/vendor/data-source-endpoints.md section 1, fetched 2026-08-19), reached through GET /v1/databases/{id} for the data-source IDs — ${BOTH_CALLS_AUTHORIZED}`,
        f => f.cause),
    };

  const rows: MeasurementRow[] = readable
    .map(e => {
      const facts = e.db as DbFacts;
      const count = MAINTENANCE_TYPES.reduce((sum, t) => sum + countType(facts, t), 0);
      const properties = countProperties(facts);
      const breakdown = MAINTENANCE_TYPES.map(t => `${t}: ${countType(facts, t)}`).join(', ');
      return {
        resource: e.safeLabel,
        value: `${count} of ${properties} column(s)  ·  ${breakdown}  ·  ${facts.schemas.length} data source(s) read${facts.cause ? `  ·  ${facts.cause}` : ''}`,
        numeric: count,
        link: e.link,
        linkCause: NO_DATABASE_LINK,
        /* ⛔ ITEM 2. A schema with no columns at all cannot produce anything but
         * zero, so the zero is arithmetic and not an observation about how this
         * database is maintained. Saying so is the difference between "nothing
         * here is a relation" and "there was nothing here to be one". */
        forced: properties === 0
          ? 'forced: the schemas read declared no columns at all, so every type count beneath them can only be 0'
          : undefined,
      };
    })
    .sort(byCountThenResource);

  return {
    id: MEASUREMENT_IDS.databaseTypedProperties,
    label,
    unit,
    computed: true,
    rows,
    over: `${rows.length} of ${databases.length} reached data source(s) — those whose column schema this scan read. ${SCHEMA_SCOPE}${unreadClause(databases, readable.length)}`,
    total: rows.reduce((sum, x) => sum + (x.numeric ?? 0), 0),
  };
}

/* ------------------------------------------------------- view counts (#143) -- */

/**
 * ⭐ THE VENDOR QUESTION #143 AC3 RAISED WAS DISCHARGED IN THIS REPOSITORY AND
 * IS STILL NOT RE-ASKED FROM MEMORY. `docs/vendor/list-views.md`, fetched
 * 2026-08-19: GET /v1/views "Returns a paginated list of View references for the
 * specified database", carrying view metadata only. The read-content capability
 * a read-only integration already holds is sufficient for it — so the missing
 * thing was the CALL and never the grant, and since #158 item 1 the call is
 * made. ⛔ A CAUSE HERE MAY NEVER BLAME THE CREDENTIAL: an operator told
 * "insufficient permission" about this line would be told something false about
 * their own token.
 */
function viewCounts(databases: Entry[]): Measurement {
  const label = 'Views, per reached database (sorted by count ascending, then by resource ID)';
  const counted = databases.filter(e => e.db !== null && e.db.views !== null);

  if (counted.length === 0)
    return {
      id: MEASUREMENT_IDS.databaseViews,
      label,
      unit: 'views',
      computed: false,
      ...notReadCause(databases, 'view listing',
        'a view count comes from GET /v1/views, which returns a paginated list of view references for a specified database and carries view metadata only (docs/vendor/list-views.md, fetched 2026-08-19); the read-content capability a read-only integration already holds is sufficient for it, so a missing count here is never a grant problem',
        f => f.viewCause),
    };

  const rows: MeasurementRow[] = counted
    .map(e => {
      const facts = e.db as DbFacts;
      return {
        resource: e.safeLabel,
        value: `${facts.views as number} view(s)`,
        numeric: facts.views as number,
        link: e.link,
        linkCause: NO_DATABASE_LINK,
      };
    })
    .sort(byCountThenResource);

  /* ⚠ THE UNCOUNTED DATABASES CARRY THEIR OWN REASONS AND THEY ARE NOT ALL THE
   * SAME REASON. A listing that 404'd, one abandoned after the page budget, and
   * one never reached because the request budget ran out are three different
   * facts, and a single "not counted" line would flatten them. Each row's own
   * cause is written by the site that observed it. */
  const missing = databases.filter(e => e.db === null || e.db.views === null);
  const missingClause = missing.length === 0
    ? ''
    : ` ${missing.length} reached data source(s) have no count here: ${
        missing.map(e => `${e.safeLabel} — ${e.db?.viewCause ?? 'no view listing was attempted for this resource'}`).join('; ')
      }.`;

  return {
    id: MEASUREMENT_IDS.databaseViews,
    label,
    unit: 'views',
    computed: true,
    rows,
    over: `${rows.length} of ${databases.length} reached data source(s) — those whose view listing this scan read to completion. A partial listing is reported as NO count rather than as a small one, because a number smaller than the truth is indistinguishable on the page from an observed one.${missingClause}`,
    total: rows.reduce((sum, x) => sum + (x.numeric ?? 0), 0),
  };
}

/* ---------------------------------------------- people-type empties (#145) -- */

/**
 * ⛔ STILL NOT COMPUTED, AND NOW FOR EXACTLY ONE REASON RATHER THAN TWO — #158
 * items 1 and 5. The property TYPES arrive with the schema and this scan now
 * reads them, so that half is DONE and the cause must stop claiming otherwise.
 * What remains is the ROWS: `POST /v1/data_sources/{data_source_id}/query` is
 * "the endpoint that returns the rows" (docs/vendor/data-source-endpoints.md
 * §2, fetched 2026-08-19), it is a POST, and adding it to the port is a
 * CLAUDE.md §3 ASK FIRST decision that has NOT been granted.
 *
 * ⭐ THAT DISTINCTION IS THE WHOLE VALUE OF THIS LINE NOW. Every other boundary
 * in this section was one uncalled GET away and has been built; this one is not,
 * and an operator reading the section can act on precisely one of them. Item 5
 * of the ticket asks for that difference to be findable, and the line says which
 * side it is on in its first clause.
 *
 * ⛔ THE SELECTOR STAYS THE TYPE WHEN THIS IS BUILT. The emptiness test is the
 * one REQ001 already settled — `readProperty(...)`.state === 'empty' in
 * req001.ts, which rules that an empty array is empty, that a run of blank spans
 * is empty, and that `false` and `0` are values. Do not write a second predicate.
 */
function peopleEmpty(databases: Entry[]): Measurement {
  /* THE SCHEMA HALF IS REPORTED EVEN THOUGH THE COUNT IS NOT, because it is the
   * evidence that the remaining obstacle is the one named. A boundary line that
   * cannot show what it already has is asking to be taken on trust. */
  const peopleColumns = databases.reduce(
    (sum, e) => sum + (e.db ? countType(e.db, 'people') : 0), 0);
  const schemasRead = databases.filter(e => e.db !== null && e.db.schemas.length > 0).length;

  return {
    id: MEASUREMENT_IDS.peoplePropertyEmpty,
    label: 'People-type properties with an empty value, per reached data source',
    unit: 'rows',
    computed: false,
    /* ⛔ THE BLOCKER LINE NAMES THE LEVER FIRST AND THE FIGURE SECOND. This is
     * the ONE line in the section an operator cannot act on by re-running, and
     * item 5 asks for exactly that to be findable rather than buried. */
    blocker: `${UNGRANTED_MARKER} the property types are in hand (${peopleColumns} people-type column(s) across ${schemasRead} schema(s)); the empties need rows, and rows need POST /v1/data_sources/{data_source_id}/query, which is ungranted`,
    cause: `${UNGRANTED_MARKER} no data-source ROW was read — the property TYPES are in hand (${peopleColumns} people-type column(s) across ${schemasRead} schema(s) this scan read), and the empties are counted over rows that come only from POST /v1/data_sources/{data_source_id}/query ("This is the endpoint that returns the rows", docs/vendor/data-source-endpoints.md section 2, fetched 2026-08-19); that endpoint is a POST, adding it to this port is an ask-first decision under CLAUDE.md section 3, and it has NOT been granted — so unlike every other boundary in this section this one does not widen by making a call (${reachedClause(databases.length)})`,
  };
}

/* --------------------------------------------- the shared boundary language -- */

/**
 * ⛔ ITEM 5. THE ONE PREFIX A READER CAN ACT ON, AND IT MARKS THE LINE THEY
 * CANNOT. Five boundary paragraphs that all read as apologies taught four SME
 * seats to skip the section (`docs/proof/dispositions-run2.md`). The only part
 * any of them could act on was which lever the line needs, and it was the
 * hardest part to find. It is now the first thing on the line.
 */
const UNGRANTED_MARKER = '[BLOCKED — needs an operator grant, not a call]';

/**
 * ⛔ ITEM 4. "NOT COMPUTED" AND "NOT READ" ARE DIFFERENT FACTS AND HAD BEEN ONE
 * APOLOGY. *Not computed* is the call was never made — a fact about this build,
 * which a release changes. *Not read* is the call WAS made and the response did
 * not carry the field, or failed — a fact about this run, which a re-run or a
 * permission change may change. An operator handed one word for both reaches for
 * the wrong remedy, and the report gave them one word.
 */
function notReadCause(
  databases: Entry[],
  what: string,
  how: string,
  /**
   * ⛔ WHICH FACT'S CAUSE TO QUOTE, AND IT IS NOT OPTIONAL. Both callers used
   * `db.cause ?? db.viewCause`, so the VIEW line quoted the DATABASE retrieve's
   * failure — it named an obstacle that was not its own. `GET /v1/views` takes
   * the database id as a query parameter and does not depend on the retrieve
   * having succeeded, which is exactly why `readDatabaseFacts` asks for it even
   * after that retrieve fails: they are two calls with two failure modes, and a
   * report that quotes one under the other's heading reports one obstacle as two
   * and points the reader at the wrong remedy. Found by MEASURING the section
   * for item 6, not by reading it.
   */
  pick: (f: DbFacts) => string | null,
): { cause: string; blocker: string } {
  const attempted = databases.filter(e => e.db !== null);
  const causes = attempted
    .map(e => (e.db ? pick(e.db) : null))
    .filter((c): c is string => typeof c === 'string' && c.length > 0);

  if (attempted.length === 0)
    return {
      cause: `NOT COMPUTED — no ${what} call was made on this run: ${how} (${reachedClause(databases.length)})`,
      blocker: `NOT COMPUTED — no ${what} call was made on this run (${reachedClause(databases.length)})`,
    };

  /* ⛔ THE DISTINCT CAUSES, WITH THEIR COUNTS — NEVER ONE CLAUSE PER DATABASE.
   * Joining every database's cause reads fine on a two-database fixture and
   * turns into fifty near-identical clauses on a real workspace, which is the
   * density this ticket's item 6 exists to remove, returning at scale through a
   * door item 6 did not cover. Distinct causes are the information; the
   * repetition is not. The COUNT is kept beside each, so a reader can still tell
   * one database failing from all of them. */
  const distinct = new Map<string, number>();
  for (const c of causes) distinct.set(c, (distinct.get(c) ?? 0) + 1);
  const folded = [...distinct.entries()]
    .map(([c, n]) => (n === 1 ? c : `${c} (and ${n - 1} other data source(s) with the same cause)`));

  /* ⛔ AND A CAP, BECAUSE DEDUPLICATION ALONE DOES NOT BOUND THIS. Each cause
   * carries the resource ID that produced it, so two databases failing the same
   * way produce two DIFFERENT strings and nothing folds — the map above helps
   * only when the ids happen to match, which at scale they never do. The cap is
   * what actually bounds the line. ⚠ IT IS DISCLOSED, NEVER SILENT: the count of
   * what was dropped is printed, because a truncated list that does not say it
   * was truncated reads as the complete set, which is the defect this product
   * exists to detect. */
  const summarised = folded.length <= CAUSE_QUOTE_CAP
    ? folded.join('; ')
    : `${folded.slice(0, CAUSE_QUOTE_CAP).join('; ')}; and ${folded.length - CAUSE_QUOTE_CAP} further distinct cause(s), not quoted here`;

  /* THE CALL WAS MADE. Saying "not computed" here would be false, and it is the
   * false half this repository keeps shipping: an internal boundary rendered as
   * an external one. */
  return {
    cause: `NOT READ — the ${what} call was made for ${attempted.length} of ${databases.length} reached data source(s) and carried nothing this count could use${
      summarised.length > 0 ? `: ${summarised}` : ''
    }. ${how} (${reachedClause(databases.length)})`,
    blocker: `NOT READ — the ${what} call was made for ${attempted.length} of ${databases.length} reached data source(s) and carried nothing this count could use`,
  };
}

/**
 * How many distinct failure causes a boundary line quotes before it summarises.
 *
 * Three is enough to show that the failures differ, and few enough that the line
 * stays a line. The remainder is COUNTED and said, never dropped in silence.
 */
const CAUSE_QUOTE_CAP = 3;

const BOTH_CALLS_AUTHORIZED =
  'both are GETs this integration is authorized to make, so a missing count here is never a grant problem';

const SCHEMA_SCOPE =
  'A column count is a fact about the SCHEMA and about nothing else: no row, page or value is read for it, because the rows come only from POST /v1/data_sources/{data_source_id}/query, which is ungranted and absent from this build.';

const unreadClause = (databases: Entry[], read: number): string => {
  const missing = databases.length - read;
  return missing === 0 ? '' : ` ${missing} reached data source(s) contributed no schema and are absent from these rows rather than counted as zero.`;
};

/**
 * Ascending by count, then by resource ID — ADR-0017 rule 6.
 *
 * Ascending so the reader's eye lands on the zeros without the report ranking
 * anything. The ID tie-break makes the order TOTAL, so two runs over an
 * unchanged workspace cannot differ: insertion order is traversal order, which
 * is a property of the network rather than of the workspace (ADR-0004).
 */
const byCountThenResource = (a: MeasurementRow, b: MeasurementRow): number =>
  a.numeric === b.numeric
    ? (a.resource < b.resource ? -1 : a.resource > b.resource ? 1 : 0)
    : (a.numeric ?? 0) - (b.numeric ?? 0);

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
      blocker: `NOT COMPUTED — this scan reached no data source, so there is nothing to count references against (${manifest.of(RESOURCES).length} resource(s) reached)`,
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
      /* THE PROVENANCE TRAVELS HERE TOO, for the same reason it travels on the
       * last-edited table: a database's timestamp now reaches this row from its
       * `child_database` block in the parent's listing, and that it is the
       * database's own is an observation at n=1 rather than a documented
       * guarantee. A cell reading a bare instant would assert the stronger
       * thing. The licence itself is on the `over` line, once. */
      const written = e.lastEditedTime === null
        ? NO_DATABASE_RETRIEVE
        : `last edited: ${e.lastEditedTime} (${provenanceOf(e)})`;
      return {
        resource: e.safeLabel,
        value: `${count} ${count === 1 ? 'inbound reference' : 'inbound references'} ${SCANNED_SET}  ·  ${written}`,
        numeric: count,
        /* ⛔ ITEM 2. WHEN THE SCAN RESOLVED NO REFERENCE TARGETS AT ALL, EVERY
         * ROW IN THIS COLUMN IS ARITHMETICALLY FORCED TO ZERO. That is the exact
         * shape the run-2 read found on four of five reports: a column of zeros
         * sorted and totalled, which reads as "nothing links to any of these"
         * when what it means is "this scan had nothing to link them with". The
         * zero is correct and it is not evidence. */
        forced: inbound.size === 0
          ? 'forced: this scan resolved no reference targets of any kind, so every count in this column can only be 0 — the figure is arithmetic, not an observation about this database'
          : undefined,
        link: e.link,
        /* The shared default would say "GET /v1/pages runs for … reference
         * targets only", which is false of a row that IS a reference target.
         * A database target short-circuits before the retrieve — scan.ts's
         * database branch — so no response carrying a url was ever received. */
        linkCause: NO_DATABASE_LINK,
      };
    })
    /* Ascending, so the reader's eye lands on the zeros first WITHOUT the report
     * ranking anything — ADR-0017 rule 6. The resource ID is the tie-break, so
     * the order is total and two runs over an unchanged workspace cannot differ;
     * insertion order is traversal order, which is a property of the network. */
    .sort((a, b) => (a.numeric === b.numeric
      ? (a.resource < b.resource ? -1 : a.resource > b.resource ? 1 : 0)
      : (a.numeric ?? 0) - (b.numeric ?? 0)));

  /* How many of the resolved targets actually landed on a database this scan
   * reached — the population the rows are about, as distinct from every target
   * the scan resolved. Computed from the rows, so it cannot disagree with them. */
  const landed = rows.filter(x => (x.numeric ?? 0) > 0).length;

  return {
    id: MEASUREMENT_IDS.inboundReferences,
    label,
    unit: INBOUND_UNIT,
    computed: true,
    rows,
    /* ⚠ THE DENOMINATOR NAMES ITS POPULATION, because it is not the rows'.
     * `inbound.size` counts every resolved reference target — pages included —
     * so beside a two-row database table it can read "47", a figure over a
     * different set than the rows beneath it. ADR-0017 decision 6 is precisely
     * about a denominator a reader can trust, so the line says which targets it
     * counted and reports the database-landing subset separately. Some of those
     * targets are databases OUTSIDE the scanned subtree, which have no row here
     * at all; naming the population is what makes that legible rather than
     * looking like a missing row. */
    /* ⛔ ITEM 3. THE COVERAGE RATIO IS PRINTED, NOT LEFT TO BE ASSEMBLED. Both
     * figures were already on this line and a reader who wanted the fraction had
     * to hunt them out of two clauses — on ROOT-A that is 1 of 39, and nothing
     * said so. The project's own arithmetic-reconstructibility rule asks for the
     * aggregate to be recoverable from the rows; printing the ratio is the
     * cheaper half of the same obligation, and it stays beside its numerator and
     * denominator rather than replacing them. ⚠ IT IS WRITTEN AS `a of b`, NEVER
     * AS A PERCENTAGE: ADR-0017 rule 2 permits no ratio except over a
     * denominator the operator supplied, and a percentage would also round the
     * two small integers this is usually made of into a figure that looks
     * precise. */
    over: `reference-population coverage: ${landed} of ${inbound.size} reference target(s) this scan resolved landed on a data source it reached, and those ${landed} are what the ${rows.length} row(s) below are made of; the remainder point at pages or at databases outside the scanned subtree, which have no row here — ${SCANNED_SET} only, never the workspace: the connection cannot enumerate its own grant (ADR-0002). ${DEDUPE_CAVEAT}. ${NO_DATABASE_RETRIEVE_DETAIL}`,
    /* THESE ROWS DO SUM, unlike the timestamp measurement's. The total is the
     * number of inbound references this scan saw landing on any reached
     * database, and it is COMPUTED from the rows printed beside it, so a
     * reader's recount cannot disagree with it. */
    total: rows.reduce((sum, x) => sum + (x.numeric ?? 0), 0),
  };
}
