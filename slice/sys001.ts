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

import { RESOURCES, STAGES, type Entry, type ResourceKey, type Stage } from './manifest.js';
import type { Rule } from './rule.js';
import {
  anchorFor,
  coverageRow,
  type CoverageUnit,
  type Discriminator,
  type Evidence,
  type Finding,
  type TargetState,
} from './finding.js';

export const SYS001_ID = 'SYS001';

/**
 * ADR-0011 decision 2: SYS001's coverage item is a resource in the manifest.
 * Exported because the unit is printed with every figure computed over it and
 * no caller may supply its own noun.
 */
export const SYS001_UNIT: CoverageUnit = 'resources';

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
export const judgeable = (e: Entry): boolean => e.stages.has('fetched') && e.loss === null;

/** The furthest funnel stage a resource reached. Structural; never parsed from a cause string. */
export function lastStage(e: Entry): Stage | null {
  let last: Stage | null = null;
  for (const s of STAGES) if (e.stages.has(s)) last = s;
  return last;
}

/**
 * The rule interface moved to rule.ts when REF001 (#44) arrived and needed the
 * same one. This alias is kept because it names the seam CHECK-sys001.ts injects
 * at, and because the contract is unchanged.
 *
 * Two properties of it were written here and still hold. `findingsFrom` renders
 * ONE FINDING PER GAP from the gap set it is given and never recomputes it — two
 * code paths for one number is the defect in results-ref001-live.md §4. And it
 * is named `findingsFrom` rather than `report` because CONTEXT.md gives *Report*
 * one meaning, the artifact carrying a disposition, a coverage vector and a
 * conformity ratio, which renderReport builds. One term, one concept.
 */
export type Sys001Rule = Rule;

/**
 * Build one SYS001 finding. Both call sites go through here, so a field added to
 * `Finding` cannot reach one path and miss the other — the two sites previously
 * carried a ten-field literal each and differed in four of them.
 */
function sys001Finding(args: {
  resource: ResourceKey;
  stage: Stage | 'unrecorded';
  targetState: TargetState;
  cause: string;
  bounded: boolean;
  isRootMiss: boolean;
  location: string;
  message: string;
  /** ALREADY REDACTED. Null when the port returned no url for this resource. */
  link?: string | null;
}): Finding {
  const anchor = anchorFor(SYS001_ID, args.resource);
  const discriminator: Discriminator = { [DROPOUT_STAGE_KEY]: args.stage };
  const evidence: Evidence = {
    object: anchor.resource,
    location: args.location,
    observed: args.cause,
    expected: 'evaluated',
  };
  return {
    rule: SYS001_ID,
    anchor,
    discriminator,
    /* Always confirmed — see this file's header, property 2. Non-evaluation is
     * a fact about the scan, which the manifest proves outright. */
    certainty: 'confirmed',
    targetState: args.targetState,
    bounded: args.bounded,
    isRootMiss: args.isRootMiss,
    evidence,
    /* CONTEXT.md settled defaults: a finding names its resource "by ID and
     * link". This was hardcoded null while NotionPort.retrievePage discarded
     * `url`. It is REDACTED UPSTREAM, in scan.ts, because a Notion url carries
     * the page title inside its path. Still null for a resource the scan never
     * retrieved, and report.ts prints LINK_NOT_CAPTURED as the reason — "no
     * link" and "we did not look" are different facts about the same field. */
    link: args.link ?? null,
    message: args.message,
  };
}

export const SYS001: Rule = {
  id: SYS001_ID,
  unit: SYS001_UNIT,
  /* Every SYS001 finding reports a gap. The gaps already qualify the report, so
   * deriveVerdict must not also count them as violations. */
  findingKind: 'coverage-gap',

  judge(m) {
    const judged = new Set<string>();
    /* RESOURCES ONLY. m.all() now spans two coverage items — REF001 (#44) keeps
     * its references in the same manifest — and judging one of those here would
     * mark a reference `evaluated` on the strength of a rule that never looked
     * at it, and put it in a denominator ADR-0011 decision 2 says counts
     * resources. */
    for (const e of m.of(RESOURCES)) if (judgeable(e)) judged.add(e.key);
    return judged;
  },

  findingsFrom(m, gaps) {
    /* The join runs off the manifest, so a gap that names a resource the
     * manifest does not hold is REPORTED as a disagreement rather than smoothed
     * over with a default. The two structures drifting apart is the recorded
     * failure this rule is built around. */
    const byKey = new Map(m.of(RESOURCES).map(e => [e.key, e]));
    /* Which keys belong to somebody else's coverage item. A gap over one of
     * those is not this rule's to render and must not fall through to the
     * disagreement branch below, which would report a healthy REF001 drop-out as
     * the manifest and the gap set contradicting each other. */
    const otherUnits = new Set(m.all().filter(e => e.unit !== RESOURCES).map(e => e.key));

    return gaps.flatMap((g): Finding[] => {
      const e = byKey.get(g.resource);
      const isRootMiss = g.isRootMiss ?? false;

      /* Another rule's coverage gap. It still qualifies the report and still
       * lowers that rule's ratio; the finding, if any, is that rule's to make.
       * REF001 makes none for an unrecognised candidate — spec §7, and a Finding
       * would have to assert a `certainty` and a `target_state` the scan did not
       * establish. */
      if (!e && otherUnits.has(g.resource)) return [];

      if (!e) {
        return [sys001Finding({
          resource: g.resource,
          stage: 'unrecorded',
          /* The disagreement is proved, but nothing is established about the
           * object — there is no manifest record of it to establish it from. */
          targetState: 'unreachable',
          cause: g.cause,
          bounded: g.bounded,
          isRootMiss,
          location: 'gap set, with no matching manifest entry',
          message:
            'the gap set names a resource the coverage manifest does not hold — ' +
            'the two disagree, and neither may be believed until they are reconciled',
        })];
      }

      const stage = lastStage(e);
      return [sys001Finding({
        resource: e.key,
        /* One finding per resource in this slice, so the bucket holds at most
         * one element and the ordering ADR-0010 decision 5 requires is total by
         * construction. The stage key is a structural selector, not an observed
         * value — ADR-0010 decision 6 keeps the cause OUT of the key. */
        stage: stage ?? 'unrecorded',
        /* Read from the drop-out record, which the site that lost the resource
         * wrote. It is NOT inferred from the `resolved` stage: scan.ts stamps
         * `resolved` on every child straight from the parent's block listing, so
         * a child whose own call returned 404 was being reported `present`. */
        targetState: e.loss?.target ?? 'present',
        cause: g.cause,
        bounded: g.bounded,
        isRootMiss,
        location: `coverage funnel, after ${stage ?? 'no stage'}`,
        link: e.link,
        /* No alias. The alias is a page title and CONTEXT.md redacts titles by
         * default; a message built from one would carry workspace content into
         * every consumer of this finding, redaction flag or not. */
        message: `${e.isRoot ? 'declared root' : 'resource'} was not evaluated — ${g.cause}`,
      })];
    });
  },

  coverage(m, judged) {
    /* The applicable set is every resource in the manifest, INCLUDING the ones
     * that dropped out. A denominator built from what the scan managed to read
     * reports its highest confidence exactly where the tool is weakest — it
     * shipped "2/2 — 100%" over a root with three children
     * (docs/proof/results-ref001-live.md §3, and ADR-0011's opening evidence).
     *
     * RESOURCES ONLY, for the same reason judge() is. m.count() defaults to this
     * rule's unit and there is deliberately no unit-free size to reach for. */
    return coverageRow(SYS001_ID, SYS001_UNIT, judged.size, m.count(RESOURCES));
  },

  outcome(m, judged, findings) {
    const entries = m.of(RESOURCES);

    /* ADR-0005 decision 1: conformity is ABSENT when the evaluated set is empty.
     * Not a third enum value — a verdict that was never formed is not a verdict. */
    const conformity = judged.size === 0 ? null : findings.length > 0 ? 'violates' : 'conforms';

    /* AN EMPTY APPLICABLE SET HAS NO SUFFICIENCY, and saying `sufficient` there
     * is the loudest false claim this rule can make. Every `some()` below is
     * false over an empty manifest, so the fall-through reported a run that made
     * no successful call as one whose evidence covered everything it applied to.
     * Absent, for the same reason conformity is absent: a judgement that was
     * never formed is not a judgement. */
    if (entries.length === 0) return { conformity, evidence: null };

    /* `unreached` — an applicable resource was never fetched. Remedy: widen
     * access or raise the request budget.
     * `undecidable` — it was fetched and could not be judged. Remedy: neither
     * sharing more nor re-running helps.
     * ADR-0005 decision 1 gives `unreached` precedence where both hold. */
    const unreached = entries.some(e => !e.stages.has('fetched'));
    const undecidable = entries.some(e => e.stages.has('fetched') && e.loss !== null);

    return { conformity, evidence: unreached ? 'unreached' : undecidable ? 'undecidable' : 'sufficient' };
  },
};
