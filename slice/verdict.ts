/* Disposition, ratios and exit byte — ADR-0005 decision 3 and ADR-0008 decision 2.
 *
 * THIS IS THE ONLY EXECUTABLE IMPLEMENTATION OF THE EXIT BYTE, and ADR-0012
 * decision 6 is what makes that a guarantee rather than a hope. The live run
 * and the offline checks execute this file. There is no second copy to drift
 * from: `prototypes/verdict.ts` was deleted by ADR-0012 decision 1, and its
 * eleven assertions live in CHECK-verdict.ts, which calls deriveVerdict directly.
 *
 * results-ref001-live.md §4 records why that matters. Its rule is DERIVE, DO
 * NOT DUPLICATE — "a coverage rule whose input is a second copy of the coverage
 * data is not a check on the scan; it is a check on the bookkeeping." The
 * header this one replaces cited that section while holding this file
 * byte-identical to a second copy, which is the hazard §4 describes rather
 * than a defence against it. It also attributed a freeze to
 * docs/spec/v0.1-scan-slice.md §5, which says only that the prototype is kept
 * as a "primary source" and constrains nothing here.
 *
 * WHAT THE EXIT BYTE COMPARES, and it is not the funnel. ADR-0011 decision 5
 * makes the declared threshold a floor on EVERY rule, equivalently a floor on
 * the MINIMUM of the coverage vector. The funnel scalar is a count of
 * resources; a rule's coverage figure is a count of that rule's own coverage
 * item. They coincided while one rule existed and they do not now. Comparing
 * the funnel lets a well-covered rule mask a badly covered one, which is the
 * defect ADR-0005 decision 4 prohibits arriving through the byte instead of
 * through a printed figure.
 */

import { formatRow, headlineCoverage, type CoverageRow } from './finding.js';

export type Gap = {
  resource: string;
  cause: string;
  /** Unbounded means the scan cannot say how many resources it missed. */
  bounded: boolean;
  /** A declared root that was never reached — pervasiveness condition (a). */
  isRootMiss?: boolean;
};

/**
 * Machine-readable cause for a byte whose prose alone would not distinguish it
 * from another route to the same number — ADR-0005 decision 5 constraint 2.
 * `no_applicable_subject` is ADR-0011 decision 6: every rule's applicable set
 * was empty, so the scan judged nothing.
 */
export type VerdictCause = 'no_applicable_subject';

export type Verdict = {
  disposition: 'unqualified' | 'qualified' | 'disclaimed';
  /* These three are the RESOURCE funnel and they stay the resource funnel —
   * ADR-0012 decision 4. ADR-0011 decision 1 keeps the funnel deliberately:
   * "Resources are what the scan fetches. Coverage items are what a rule
   * counts. Collapsing the two is what produced the defect." report.ts labels
   * them `resources` and fixture-oracle.ts asserts `applicable` against the
   * oracle's resource count. They are not what the byte compares. */
  applicable: number;
  evaluated: number;
  coverage: number;
  /**
   * What the byte DID compare — the minimum row of the coverage vector, whole.
   * The row rather than the ratio, because a CoverageRow carries its rule and
   * its unit and there is no way to print the figure without them (ADR-0011
   * decision 4). `null` is the empty vector of ADR-0011 decision 6, and it is
   * distinguishable from a ratio of 0.
   */
  coverageMinimum: CoverageRow | null;
  exit: 0 | 1 | 2 | 3 | 4;
  why: string;
  cause: VerdictCause | null;
};

export function deriveVerdict(input: {
  applicable: number;
  evaluated: number;
  /**
   * The coverage vector — one row per rule, over that rule's own coverage item.
   * REQUIRED, and ADR-0012 decision 2 says why it may not be made optional: an
   * optional vector defaulting to the funnel keeps every stale call site
   * compiling and silently comparing the wrong number, which is the flattering
   * direction and is the defect this parameter exists to fix. `tsc` is the
   * enforcement.
   */
  coverage: CoverageRow[];
  gaps: Gap[];
  /** Findings that are not coverage gaps. Drives the disposition only. */
  violations: number;
  /**
   * Findings that are `new` and not suppressed, INCLUDING the SYS001 findings
   * derived from the gaps above. This is the only input to exit 1.
   *
   * It is separate from `violations` and from `gaps.length` because ADR-0008
   * decision 3 routes conformity to the exit byte through the baseline and
   * nowhere else. A gap whose SYS001 finding is baselined is still a gap — it
   * still lowers coverage and still qualifies the report — but it no longer
   * fails the build. Defaults to violations + gaps, i.e. nothing baselined.
   */
  newUnsuppressedFindings?: number;
  /** ADR-0008: exit 0 asserts coverage at or above the DECLARED threshold. */
  coverageThreshold?: number;
  /** Usage error, invalid configuration, auth failure, internal error. */
  didNotRunAsDeclared?: boolean;
}): Verdict {
  const threshold = input.coverageThreshold ?? 1.0;
  const newUnsuppressed = input.newUnsuppressedFindings ?? input.violations + input.gaps.length;
  const applicable = input.applicable;
  const evaluated = input.evaluated;
  const coverage = applicable ? evaluated / applicable : 0;

  /* ADR-0011 decision 4: the minimum, never a mean and never a pooled count.
   * Computed by the same headlineCoverage() the report's headline uses — one
   * code path, so the byte and the headline cannot disagree about which rule
   * is worst. */
  const coverageMinimum = headlineCoverage(input.coverage);

  const pervasive = input.gaps.some(g => g.isRootMiss) || input.gaps.some(g => !g.bounded);
  const disposition: Verdict['disposition'] = pervasive
    ? 'disclaimed'
    : input.violations || input.gaps.length
      ? 'qualified'
      : 'unqualified';

  /* ADR-0008 decision 2: a total order, highest firing condition wins.
   * Precedence 4 > 2 > 3 > 1 > 0. Evidence outranks findings — a confined gap
   * below threshold exits 3 even when new findings also exist. */
  let exit: Verdict['exit'];
  let why: string;
  let cause: VerdictCause | null = null;

  if (input.didNotRunAsDeclared) {
    exit = 4;
    why = 'The scan did not run as declared.';
  } else if (disposition === 'disclaimed') {
    exit = 2;
    why = 'Disposition is disclaimed — no summary verdict is rendered.';
  } else if (coverageMinimum === null) {
    /* ADR-0011 decision 6. Every rule's applicable set was empty, so the vector
     * is empty and its minimum is undefined. The scan judged nothing, and that
     * must not fall through to 0. It takes byte 3 because the operator's remedy
     * is the remedy for a coverage gap — fix the configuration or widen the
     * scope — and a remedy that duplicates another's earns no new value. The
     * cause is what distinguishes it from the row below. */
    exit = 3;
    cause = 'no_applicable_subject';
    why = 'No rule had an applicable subject, so the scan judged nothing and there is no coverage figure.';
  } else if (coverageMinimum.ratio < threshold) {
    /* THE GAPS CONJUNCT IS GONE, AND ITS REMOVAL IS THE POINT — ADR-0012
     * decision 7.
     *
     * ADR-0008 decision 2's table row reads "gaps exist and are confined, AND
     * coverage is below the declared threshold", and this predicate carried the
     * conjunction verbatim. ADR-0011 decision 5 states the same axis without it
     * — "the evidence axis trips at exit 3 if ANY rule falls below it" — and
     * restates the exit-0 invariant as "no new unsuppressed finding, and EVERY
     * RULE'S coverage at or above the declared threshold."
     *
     * With the conjunct, a run whose weakest rule is below the floor but whose
     * gap list is empty falls through to exit 0, and the exit-0 reason string
     * then asserts every rule cleared the threshold beside a figure showing one
     * did not. That is the report publishing a claim the run did not establish,
     * which is this project's own recorded defect class, sitting inside the
     * predicate that exists to prevent it.
     *
     * The row in ADR-0008 stays TRUE — gaps plus a sub-threshold figure still
     * exits 3. It is now a special case of the rule rather than the whole rule.
     *
     * The reason string is built through formatRow(), which has no code path
     * that omits the unit (ADR-0012 decision 5). The previous version printed a
     * bare "3/4" and was patched at the render layer, which is a disclosure in
     * the wrong file. */
    exit = 3;
    why = input.gaps.length
      ? `Gaps exist and are confined, and the weakest rule's coverage — ${coverageMinimum.rule} at ${formatRow(coverageMinimum)} — is below the declared threshold ${threshold}.`
      /* NO GAP WAS RECORDED FOR IT, and the reason says so rather than
       * inventing one. ADR-0005 decision 5 requires every drop-out to be
       * recorded, so a coverage item that went unevaluated without producing a
       * gap is an inconsistency in the scan's own bookkeeping. The byte is
       * still 3 — the evidence is still incomplete — and the operator is told
       * which of the two things went wrong. */
      : `The weakest rule's coverage — ${coverageMinimum.rule} at ${formatRow(coverageMinimum)} — is below the declared threshold ${threshold}, and NO gap was recorded for it. Every drop-out is required to be recorded, so this run's coverage manifest and its coverage vector disagree.`;
  } else if (newUnsuppressed > 0) {
    exit = 1;
    why = 'At least one finding is new and unsuppressed.';
  } else {
    exit = 0;
    why = `No new unsuppressed finding, and every rule's coverage is at or above the declared threshold (weakest: ${coverageMinimum.rule} at ${formatRow(coverageMinimum)}).`;
  }

  return { disposition, applicable, evaluated, coverage, coverageMinimum, exit, why, cause };
}
