/* SYS001 — a declared root or applicable resource was not evaluated.
 *
 * CONTEXT.md, rule catalogue: SYS001 is the FINDING IDENTITY for a coverage gap.
 * ADR-0005 decision 5's consequences state the narrowing that produced it —
 * "SYS001 survives as the finding identity for a coverage gap… It no longer
 * carries the run-failure decision; decision 4 does." It is not "the scan result
 * is incomplete", it was already widened back to that once and narrowed again in
 * S003, and this file does not re-widen it. The run-failure decision lives in
 * verdict.ts and reads the report disposition, not this rule.
 *
 * ONE SOURCE OF TRUTH, AND THIS FILE IS NOT IT. The gap set is derived from the
 * manifest by gapsFrom() in manifest.ts. This rule RENDERS those gaps as
 * findings; it never accumulates a second gap list. docs/proof/results-ref001-live.md
 * §4 records what a second copy does — the manifest showed a stalled resource,
 * the parallel gap list was empty, and the exit byte read 1 where the contract
 * required 3. The drift went toward the flattering answer, which is the defect
 * class this product exists to detect.
 *
 * TWO PROPERTIES OF THIS RULE ARE UNUSUAL AND BOTH ARE DELIBERATE
 *
 * 1. ITS FINDINGS ARE ABOUT COVERAGE ITEMS OUTSIDE ITS OWN EVALUATED SET.
 *    Every other rule finds a defect in something it read. SYS001 finds the
 *    absence of a reading. CONTEXT.md's Gap entry forces this: "the funnel
 *    stages resources, so one resource drop-out produces a gap in every rule
 *    whose coverage items depended on it" — SYS001's coverage item IS a
 *    resource, so a dropped-out resource is a gap in SYS001's own coverage and
 *    therefore is not in its evaluated set.
 *
 *    The alternative — SYS001 judges every manifest entry, because the entry
 *    itself is the evidence — was considered and rejected. It makes SYS001
 *    report 100% coverage on every run by construction. A rule that always says
 *    "I covered everything" is the flattering answer wearing a coverage figure,
 *    and it would delete the exit-3 path that spec criterion 7 requires.
 *
 * 2. ITS CERTAINTY IS ALWAYS `confirmed`, INCLUDING ON A 404.
 *    This looks like it contradicts CONTEXT.md's second distinction — "Notion
 *    returns 404 for both absent and inaccessible, so a 404 produces
 *    indeterminate" — and it does not. Certainty is about the proposition the
 *    finding asserts. A REF001 finding asserts something about the TARGET ("this
 *    page is gone"), which a 404 does not prove. A SYS001 finding asserts
 *    something about THE SCAN ("this resource was not evaluated"), which the
 *    manifest proves outright. That is the third distinction, applied: a finding
 *    can be `confirmed` about an `unreachable` target, and spec criterion 4
 *    settles the same question the same way after #10's triage comment corrected
 *    it twice.
 *
 *    Revisit if: a funnel stage is ever recorded as "possibly reached". Then
 *    non-evaluation stops being a proved fact and certainty stops being constant.
 */

import { STAGES, type Entry, type Manifest, type Stage } from './manifest.js';
import type { Gap } from './verdict.js';
import {
  anchorFor,
  coverageRow,
  type CoverageRow,
  type Finding,
  type Outcome,
  type TargetState,
} from './finding.js';

export const SYS001_ID = 'SYS001';

/**
 * ADR-0011 decision 2: SYS001's coverage item is a resource in the manifest.
 * Exported because the unit is printed with every figure computed over it and
 * no caller may supply its own noun.
 */
export const SYS001_UNIT = 'resources';

/** The discriminator key family, named and versioned per ADR-0010 decision 1. */
export const DROPOUT_STAGE_KEY = 'sys001/dropout-stage@1';

/**
 * Can SYS001 judge this resource?
 *
 * Yes when the funnel delivered it whole: it reached `fetched` and carries no
 * drop-out cause. A cause is an attributed loss, and an attributed loss is the
 * thing SYS001 reports — clearing it would be the rule marking its own subject
 * as covered.
 *
 * The second clause is load-bearing and is not redundant with the first. A root
 * whose child enumeration truncated still reaches `fetched` for itself, while
 * the children it never listed cannot be counted or named. ADR-0005 decision 5
 * constraint 1 makes that gap name the parent, so the parent must stay
 * unevaluated. Dropping the cause test would delete the unbounded gap, flip the
 * disposition from `disclaimed` to `qualified`, and move the exit byte from 2 to
 * 3 — three regressions from one omission, all toward the flattering answer.
 */
export const judgeable = (e: Entry): boolean => e.stages.has('fetched') && e.cause === '';

/** The furthest funnel stage a resource reached. Structural; never parsed from a cause string. */
export function lastStage(e: Entry): Stage | null {
  let last: Stage | null = null;
  for (const s of STAGES) if (e.stages.has(s)) last = s;
  return last;
}

export type Sys001Rule = {
  id: string;
  unit: string;
  /**
   * Stage 5 of the funnel. Returns the resources this rule judged; the CALLER
   * marks them `evaluated`, because ADR-0005 decision 5 defines the stage as
   * "every applicable rule reached a judgement" and only the caller knows how
   * many rules there are.
   */
  judge(m: Manifest): Set<string>;
  /** One finding per gap. The gap set is the input, never recomputed here. */
  report(m: Manifest, gaps: Gap[]): Finding[];
  /**
   * This rule's row of the coverage vector, or null when its applicable set is
   * empty. `judged` is the SAME SET judge() returned and is not re-derived —
   * an earlier draft recomputed it here, and a mutation check caught the vector
   * and the funnel disagreeing by one resource. Two code paths for one number is
   * the defect recorded in docs/proof/results-ref001-live.md §4.
   */
  coverage(m: Manifest, judged: Set<string>): CoverageRow | null;
  /** The outcome PAIR — ADR-0005 decision 1. Never one value. */
  outcome(m: Manifest, judged: Set<string>, findings: Finding[]): Outcome;
};

export const SYS001: Sys001Rule = {
  id: SYS001_ID,
  unit: SYS001_UNIT,

  judge(m) {
    const judged = new Set<string>();
    for (const e of m.all()) if (judgeable(e)) judged.add(e.key);
    return judged;
  },

  report(m, gaps) {
    /* The join runs off the manifest, so a gap that names a resource the
     * manifest does not hold is REPORTED as a disagreement rather than smoothed
     * over with a default. The two structures drifting apart is the recorded
     * failure this rule is built around. */
    const byKey = new Map(m.all().map(e => [e.key, e]));

    return gaps.map((g): Finding => {
      const e = byKey.get(g.resource);
      const anchor = anchorFor(SYS001_ID, g.resource);

      if (!e) {
        return {
          rule: SYS001_ID,
          anchor,
          discriminator: { [DROPOUT_STAGE_KEY]: 'unrecorded' },
          /* The disagreement is proved — the gap set says one thing and the
           * manifest says another — but nothing is established about the object. */
          certainty: 'confirmed',
          targetState: 'unreachable',
          bounded: g.bounded,
          isRootMiss: g.isRootMiss === true,
          evidence: {
            object: anchor.resource,
            location: 'gap set, with no matching manifest entry',
            observed: g.cause,
            expected: 'a manifest entry for every gap',
          },
          link: null,
          message:
            'the gap set names a resource the coverage manifest does not hold — ' +
            'the two disagree, and neither may be believed until they are reconciled',
        };
      }

      const stage = lastStage(e);
      /* `resolved` means the identifier reached an object. Anything short of it
       * is `unreachable`, never `absent`: Principle 3, a 404 is access failure
       * OR object absence and the API does not say which. */
      const targetState: TargetState = e.stages.has('resolved') ? 'present' : 'unreachable';

      return {
        rule: SYS001_ID,
        anchor,
        /* One finding per resource in this slice, so the bucket holds at most
         * one element and the ordering ADR-0010 decision 5 requires is total by
         * construction. The stage key is here because it is the discriminator
         * the revisable one-finding-per-cause split would need, and because it
         * is a structural selector rather than an observed value — ADR-0010
         * decision 6 keeps the cause OUT of the key and in the evidence. */
        discriminator: { [DROPOUT_STAGE_KEY]: stage ?? 'unrecorded' },
        certainty: 'confirmed',
        targetState,
        bounded: g.bounded,
        isRootMiss: g.isRootMiss === true,
        evidence: {
          object: e.key,
          location: `coverage funnel, after ${stage ?? 'no stage'}`,
          observed: g.cause,
          expected: 'evaluated',
        },
        link: null,
        /* No alias. The alias is a page title and CONTEXT.md redacts titles by
         * default; a message built from one would carry workspace content into
         * every consumer of this finding, redaction flag or not. */
        message: `${e.isRoot ? 'declared root' : 'resource'} was not evaluated — ${g.cause}`,
      };
    });
  },

  coverage(m, judged) {
    /* The applicable set is every resource in the manifest, INCLUDING the ones
     * that dropped out. A denominator built from what the scan managed to read
     * reports its highest confidence exactly where the tool is weakest — it
     * shipped "2/2 — 100%" over a root with three children
     * (docs/proof/results-ref001-live.md §3, and ADR-0011's opening evidence). */
    return coverageRow(SYS001_ID, SYS001_UNIT, judged.size, m.size);
  },

  outcome(m, judged, findings) {
    const entries = m.all();

    /* ADR-0005 decision 1: conformity is ABSENT when the evaluated set is empty.
     * Not a third enum value — a verdict that was never formed is not a verdict. */
    const conformity = judged.size === 0 ? null : findings.length > 0 ? 'violates' : 'conforms';

    /* `unreached` — an applicable resource was never fetched. Remedy: widen
     * access or raise the request budget.
     * `undecidable` — it was fetched and could not be judged. Remedy: neither
     * sharing more nor re-running helps.
     * ADR-0005 decision 1 gives `unreached` precedence where both hold. */
    const unreached = entries.some(e => !e.stages.has('fetched'));
    const undecidable = entries.some(e => e.stages.has('fetched') && e.cause !== '');
    const evidence = unreached ? 'unreached' : undecidable ? 'undecidable' : 'sufficient';

    return { conformity, evidence };
  },
};
