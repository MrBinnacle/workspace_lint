/* Disposition, ratios and exit byte — ADR-0005 decision 3 and ADR-0008 decision 2.
 *
 * COPIED VERBATIM from prototypes/verdict.ts, which is frozen as a primary
 * source (docs/spec/v0.1-scan-slice.md §5). Only this header differs: the
 * original is marked THROWAWAY and this one is not. Every line of logic below
 * is byte-identical. If this file and the prototype's ever need to diverge in
 * behaviour, that is a decision, and it goes in an ADR before it goes in here.
 *
 * The live run and the offline checks execute this SAME implementation.
 * results-ref001-live.md §4 records what happens when they do not: the manifest
 * and the exit byte were maintained independently, drifted, and drifted toward
 * the flattering answer.
 */

export type Gap = {
  resource: string;
  cause: string;
  /** Unbounded means the scan cannot say how many resources it missed. */
  bounded: boolean;
  /** A declared root that was never reached — pervasiveness condition (a). */
  isRootMiss?: boolean;
};

export type Verdict = {
  disposition: 'unqualified' | 'qualified' | 'disclaimed';
  applicable: number;
  evaluated: number;
  coverage: number;
  exit: 0 | 1 | 2 | 3 | 4;
  why: string;
};

export function deriveVerdict(input: {
  applicable: number;
  evaluated: number;
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

  if (input.didNotRunAsDeclared) {
    exit = 4;
    why = 'The scan did not run as declared.';
  } else if (disposition === 'disclaimed') {
    exit = 2;
    why = 'Disposition is disclaimed — no summary verdict is rendered.';
  } else if (input.gaps.length && coverage < threshold) {
    exit = 3;
    why = `Gaps exist and are confined, and coverage ${evaluated}/${applicable} is below the declared threshold ${threshold}.`;
  } else if (newUnsuppressed > 0) {
    exit = 1;
    why = 'At least one finding is new and unsuppressed.';
  } else {
    exit = 0;
    why = 'No new unsuppressed finding, coverage at or above the declared threshold.';
  }

  return { disposition, applicable, evaluated, coverage, exit, why };
}
