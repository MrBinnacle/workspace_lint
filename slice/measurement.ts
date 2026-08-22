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
} as const;

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

  return [lastEdited];
}
