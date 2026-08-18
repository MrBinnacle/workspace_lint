/* What a rule is, as the scan sees it.
 *
 * One interface, two implementations — sys001.ts and ref001.ts — and the scan
 * holds a list of them rather than a hard-coded pair. Extracted when the second
 * rule arrived (#44), because the shape had already been fixed by the first and
 * copying it would have made two declarations of one contract.
 *
 * EVERY METHOD IS A SEPARATE SEAM ON PURPOSE. `judge` feeds the coverage ratio,
 * `findingsFrom` feeds the finding count, and those wire into different halves
 * of the verdict. A mutation check that could only replace a whole rule would
 * leave the finding-to-exit-byte path untested, which is the exact false green
 * CHECK-sys001.ts TEST 4 exists to catch.
 */

import type { RuleDecl } from './config.js';
import type { Manifest, ResourceKey } from './manifest.js';
import type { CoverageRow, CoverageUnit, Finding, Outcome } from './finding.js';
import type { Gap } from './verdict.js';

export type Rule = {
  id: string;
  /**
   * The noun this rule's applicable set is a set of — ADR-0011 decision 2.
   * The scan uses it to decide which manifest entries this rule is applicable
   * to, so a rule cannot judge a coverage item it does not count.
   */
  unit: CoverageUnit;
  /**
   * What this rule's findings ARE — declared, never inferred from the rule's ID.
   *
   * `coverage-gap`: the finding reports the ABSENCE of a judgement. SYS001 is
   * the finding identity for one (CONTEXT.md), and the gap already qualifies the
   * report, so counting it again as a violation would double it.
   * `conformity-violation`: the finding reports a defect the rule PROVED in
   * something it read. ADR-0005 decision 3 takes these as `violations`.
   *
   * deriveVerdict takes the two counts separately, and the scan cannot tell them
   * apart by looking at a Finding — both carry the same shape. Reading the rule
   * name to decide would put the mapping in a string comparison.
   */
  findingKind: 'coverage-gap' | 'conformity-violation';
  /**
   * Stage 5 of the funnel, over this rule's OWN coverage item. Returns the
   * entries this rule judged; THE CALLER MARKS THEM, because ADR-0005 decision 5
   * defines the stage as "every applicable rule reached a judgement" and only
   * the caller knows how many rules there are.
   */
  judge(m: Manifest): Set<ResourceKey>;
  /** The findings this rule reached. `gaps` is the single gap set, never recomputed. */
  findingsFrom(m: Manifest, gaps: Gap[]): Finding[];
  /** This rule's row of the coverage vector, or null when its applicable set is empty. */
  coverage(m: Manifest, judged: Set<ResourceKey>): CoverageRow | null;
  /** The outcome PAIR — ADR-0005 decision 1. Never one value. */
  outcome(m: Manifest, judged: Set<ResourceKey>, findings: Finding[]): Outcome;
};

/**
 * Rule IDs the operator configured that this build has no implementation for.
 *
 * THE LOADER CANNOT ANSWER THIS AND MUST NOT PRETEND TO. `config.ts` validates
 * the shape of a rule declaration — that is a question about the document. This
 * is a question about the BUILD: which rules were compiled into the binary that
 * is about to run. Two different questions, and folding the second into the
 * loader would put a hard-coded list of built rules in a file that has no way to
 * know when one is added.
 *
 * A non-empty return is exit 4, before the traversal begins. The alternative —
 * running the scan and reporting coverage that says nothing about the configured
 * rule — is a green run over a rule that never ran. That is the failure this
 * product exists to detect, and shipping it in the product's own entry point
 * would make every claim the report makes about "the declared rules" false by
 * construction.
 */
export function unimplementedRules(configured: RuleDecl[], implemented: Rule[]): string[] {
  const built = new Set(implemented.map(r => r.id));
  /* Deduplicated: two entries configuring one unbuilt rule are one defect, and
   * printing the ID twice reads as two different problems. */
  return [...new Set(configured.map(d => d.rule).filter(id => !built.has(id)))];
}
