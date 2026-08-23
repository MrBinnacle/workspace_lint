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
const NO_DATABASE_RETRIEVE = 'last edited: not read (this scan makes no database retrieve)';

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

  /* APPENDED, AND THE ORDER IS THE RENDER ORDER. `report.ts` iterates this array,
   * so `lastEdited` staying first is a choice rather than an accident: the
   * computed lines lead, and the boundary lines follow them. */
  const reachedDatabases = all.filter(e => e.kind === 'data-source').length;

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
  `${databases} data source(s) reached by this scan, none entered`;

function maintenanceLoad(databases: number): Measurement[] {
  /* ⚠ NO `sorted by …` CLAUSE ON THESE LABELS, DELIBERATELY. #143 AC4 requires
   * sorting to name its key in the header; nothing here sorts, because nothing
   * here has rows. A label advertising a sort the run did not perform is a claim
   * about work that did not happen. The clause is added in the same edit that
   * adds the rows, and not before. */
  const typedProperties: Measurement = {
    id: MEASUREMENT_IDS.databaseTypedProperties,
    label: 'Relation, rollup and formula properties, per reached database',
    unit: 'properties',
    computed: false,
    cause: `no data-source schema was retrieved — these counts are read off the schema that GET /v1/data_sources/{data_source_id} returns ("information that describes the structure and columns of a data source", docs/vendor/data-source-endpoints.md section 1, fetched 2026-08-19), and this scan's port declares three methods (GET /v1/users/me, GET /v1/pages/{id}, GET /v1/blocks/{id}/children), none of which retrieves a database or a data source; widening it means GET /v1/databases/{id} to list a database's data-source IDs, which IS already authorized, and then GET /v1/data_sources/{data_source_id} for each schema (${reachedClause(databases)})`,
  };

  /* ⭐ THE VENDOR QUESTION #143 AC3 RAISES IS DISCHARGED IN THIS REPOSITORY AND
   * IS NOT RE-ASKED FROM MEMORY. `docs/vendor/list-views.md`, fetched
   * 2026-08-19 from the endpoint's own reference page: GET /v1/views "Returns a
   * paginated list of View references for the specified database", carrying view
   * metadata only, "an array of view-reference objects with `object` and `id`,
   * plus pagination". An array with pagination is exactly countable — so the
   * data IS obtainable and the read-content capability a read-only integration
   * already holds is sufficient for it.
   *
   * ⛔ WHICH MAKES THE MISSING THING THE CALL, NOT THE GRANT, and this cause must
   * say so. It is also why this line is not a NEGATIVE claim about Notion and
   * needs no negation marker: it asserts nothing the vendor could falsify by
   * shipping something. */
  const views: Measurement = {
    id: MEASUREMENT_IDS.databaseViews,
    label: 'Views, per reached database',
    unit: 'views',
    computed: false,
    cause: `no view listing was requested — a view count would come from GET /v1/views, which returns a paginated list of view references for a specified database and carries view metadata only (docs/vendor/list-views.md, fetched 2026-08-19); the read-content capability a read-only integration already holds is sufficient for it, so what is missing here is the call and not the grant — this scan's port declares three methods and GET /v1/views is not among them (${reachedClause(databases)})`,
  };

  /* ⛔ TWO THINGS ARE MISSING HERE AND THEY HAVE DIFFERENT REMEDIES — #145. The
   * property TYPE lives in a data-source schema, and the empties are counted
   * over ROWS. `docs/vendor/data-source-endpoints.md` section 2 records
   * POST /v1/data_sources/{data_source_id}/query as "the endpoint that returns
   * the rows", a POST whose addition to the port is a CLAUDE.md section 3 ASK
   * FIRST decision that has not been granted. Flattening the two into one cause
   * would hand the operator the wrong lever.
   *
   * ⛔ AND WHEN IT IS BUILT, THE SELECTOR IS THE TYPE AND NEVER THE NAME.
   * Matching a property called "Owner" infers meaning from a label, which
   * Principle 4 forbids; the property's own name prints as data beside the
   * count. The emptiness test is the one REQ001 already settled —
   * `readProperty(...)`.state === 'empty' in req001.ts, which already rules that
   * an empty array is empty, that a run of blank spans is empty, and that
   * `false` and `0` are values. Do not write a second predicate for it. */
  const peopleEmpty: Measurement = {
    id: MEASUREMENT_IDS.peoplePropertyEmpty,
    label: 'People-type properties with an empty value, per reached data source',
    unit: 'rows',
    computed: false,
    cause: `no data-source row was read — this count needs the property TYPES from GET /v1/data_sources/{data_source_id} and the rows themselves from POST /v1/data_sources/{data_source_id}/query ("This is the endpoint that returns the rows", docs/vendor/data-source-endpoints.md section 2, fetched 2026-08-19); this scan's port declares three methods and neither is among them, and the row endpoint in particular has NOT been granted — it is a POST and adding it is an ask-first decision, so this line widens with that grant and not before (${reachedClause(databases)})`,
  };

  return [typedProperties, views, peopleEmpty];
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
    over: `${rows.length} reached data source(s), of ${landed} reference target(s) that landed on one; this scan resolved ${inbound.size} reference target(s) of any kind, and the remainder point at pages or at databases outside the scanned subtree, which have no row here — ${SCANNED_SET} only, never the workspace: the connection cannot enumerate its own grant (ADR-0002). ${DEDUPE_CAVEAT}. ${NO_DATABASE_RETRIEVE_DETAIL}`,
    /* THESE ROWS DO SUM, unlike the timestamp measurement's. The total is the
     * number of inbound references this scan saw landing on any reached
     * database, and it is COMPUTED from the rows printed beside it, so a
     * reader's recount cannot disagree with it. */
    total: rows.reduce((sum, x) => sum + (x.numeric ?? 0), 0),
  };
}
