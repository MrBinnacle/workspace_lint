/* UNQ001 — a declared unique value occurs more than once in a declared scope.
 *
 * The FOURTH rule, the LAST of the v0.1 catalog, and the second configured one.
 * Issue #59. Its three design decisions were settled on that ticket before a
 * line was written, and each is restated here beside the code that implements
 * it, because the ticket is not loaded when the next reader opens this file.
 * `docs/spec/UNQ001-uniqueness.md` is the durable record.
 *
 * THE HYDRATION IS NOT IN THIS FILE, the same division req001.ts uses. scan.ts
 * reads the property maps, compares the values IN MEMORY, and writes the ANSWER
 * into the manifest as structure. This file is the RULE: what the manifest says
 * about a pair, what that makes it, and what it does to the report.
 *
 * ⭐ THE COVERAGE ITEM IS AN UNORDERED PAIR, AND THAT IS THE WHOLE RULE'S SHAPE
 *
 * ADR-0011 decision 2 assigns UNQ001 the unit `resource pairs in a uniqueness
 * scope`, and ADR-0011 exists BECAUSE collapsing a pair-shaped item into a
 * resource-shaped one had already shipped a `2/2 — 100%` figure over a root with
 * three children. For `n` resources in scope the applicable set is `n(n−1)/2`
 * pairs, so:
 *
 *   ONE resource dropping out removes `n−1` pairs, not one.
 *   At 90% of resources read, UNQ001 has evaluated 80.9% of its pairs.
 *
 * A run printing a resource-shaped percentage under this rule's name is the
 * exact collapse ADR-0011 forbids. Nothing in this file counts a resource.
 *
 * ⭐ DECISION 1 — AN EMPTY VALUE IS NOT A VALUE FOR UNIQUENESS
 *
 * Two empties are not the same value; they are two absences of one, and the
 * remedy differs — *fill these in*, not *de-duplicate these*. Treating empty as
 * a value would make every untitled resource in a scope collide with every
 * other, converting one data-quality problem into a duplicate group of size `n`
 * — and REQ001 already reports present-and-empty as a violation, so the
 * collision would be a second report of a defect the product already names,
 * under a rule whose remedy is wrong for it.
 *
 * ⛔ THE DENOMINATOR IS UNAFFECTED, AND THAT IS THE HALF THAT GETS DROPPED. An
 * empty-valued resource was READ and its pairs were genuinely compared — the
 * rule looked and found no shared value. Those pairs count toward the evaluated
 * set. EMPTINESS CHANGES THE COMPARISON PREDICATE, NEVER THE COVERAGE
 * ARITHMETIC. Suppressing the pair instead would shrink the denominator to fit
 * the answer, which is the defect docs/proof/results-ref001-live.md §3 records.
 * Revisit if: a scope is configured over a property where two blanks are a real
 * collision — a slug, or an external key. The answer is then a per-declaration
 * flag, not a change to this default.
 *
 * ⭐ DECISION 2 — ONE FINDING PER OFFENDING RESOURCE
 *
 * Five identical rows are FIVE findings over TEN evaluated pairs. Both numbers
 * are correct and they are separate axes: ADR-0011 decision 2 fixes the coverage
 * item independently of finding granularity, which is why REQ001 anchors on a
 * page while counting pairs.
 *
 * ADR-0010 already made this decision and left it to this ticket to close.
 * Decision 7's table (`docs/adr/0010-…md:145`) enters UNQ001 anchored on "The
 * page", hierarchy `propertyId/v1` then `propertyName/v1` — identical to
 * REQ001. Line 153 states the table presumes one finding per offending resource,
 * and that a per-GROUP emission "has no single resource to anchor to and the
 * anchor model needs a group-level answer this ADR does not supply." Line 211
 * files the choice here. Per-resource costs no ADR; per-group costs one, and
 * #59 states it needs none.
 *
 * WHAT A BASELINE DOES WHEN ONE DUPLICATE OF A PAIR IS DELETED. Resources A and
 * B share a value; each carries its own finding under its own anchor. Delete B.
 * Next run: A is unique, so A's finding is absent; B's anchor no longer exists,
 * so B's finding is absent. Both resolve independently, matching never crosses
 * an anchor (ADR-0010 decision 1), and NO TRANSITIVE CLOSURE IS TAKEN over the
 * group — the shape decision 1 forbids and a group anchor would have invited.
 *
 * ⛔ HAZARD 2 — THE DUPLICATED VALUE IS NEVER PRINTED, IN ANY MODE
 *
 * The value enters no Finding, no discriminator, no message, no gap label and no
 * call log, including under `--show-titles`. It is not on `UnqFacts` and must
 * never be added to it. The finding names the CO-PARTICIPANTS BY ID, which is
 * the actionable locator: the operator opens either resource and the shared
 * value is in front of them. Principle 2 is satisfied because the observed fact
 * — *shares its `<property>` value with these resources* — is checkable.
 *
 * The rule compares values in memory and records only the answer. Same
 * discipline ADR-0010 decision 6 applies to matchkeys: comparison is allowed,
 * publication is not. #42 shipped a page title into a call log four lines under
 * a report claiming titles were redacted; a value never stored for rendering
 * cannot repeat that.
 *
 * COMPARISON IS BY TRIMMED STRING AND IS NOT CASE-FOLDED. Trimming matches
 * readProperty's existing treatment. Case-folding is a policy claim about what
 * counts as the same value, and ADR-0001 decision 4 rejects inferred policy.
 * Revisit if: a real workspace needs case-insensitive uniqueness — a
 * per-declaration option, not a default.
 *
 * THE FIVE STAGES, READ FOR THIS COVERAGE ITEM
 *
 * The funnel's stage names are resource-shaped and this rule's coverage item is
 * a PAIR OF resources, so each stage is given its reading once, here:
 *
 *   declared    the config made this pair applicable — both members are in one
 *               declared uniqueness scope.
 *   resolved    BOTH members' property maps were read.
 *   enumerated  the property was LOCATED in both maps.
 *   fetched     both readings yielded a comparable, so the comparison RAN.
 *   evaluated   marked by the scan, when every applicable rule judged the pair.
 *
 * ⚠ `fetched` AND `judgeable` COINCIDE FOR THIS RULE, UNLIKE REQ001, and the
 * difference is worth stating because the two files otherwise read alike. For
 * REQ001 a present-and-empty property is judgeable and NOT fetched — that gap
 * between the two stages IS the violation. For UNQ001 an empty is a legitimate
 * comparison input: the comparison ran and found no match. So a pair either
 * compared or recorded a loss, and there is no third position.
 */

import { RESOURCES, type Entry, type ResourceKey } from './manifest.js';
import type { Rule } from './rule.js';
import { PROPERTY_ID_KEY, PROPERTY_NAME_KEY } from './req001.js';
import {
  anchorFor,
  coverageRow,
  type CoverageUnit,
  type Discriminator,
  type Evidence,
  type Finding,
} from './finding.js';

export const UNQ001_ID = 'UNQ001';

/**
 * ADR-0011 decision 2. Already a member of the closed `CoverageUnit` union,
 * which ADR-0011 required each rule to declare before it was built.
 */
export const UNQ001_UNIT: CoverageUnit = 'resource pairs in a uniqueness scope';

/* The matchkey hierarchy is REQ001's, imported rather than re-declared.
 * ADR-0010 decision 7 gives both rules the identical hierarchy — `propertyId/v1`
 * then `propertyName/v1`, because neither identifier alone survives both a
 * rename and a type change — and two declarations of one contract is how the
 * two drift apart on the release that changes one of them. */
export { PROPERTY_ID_KEY, PROPERTY_NAME_KEY } from './req001.js';

/**
 * The two participants of a pair, in canonical order.
 *
 * SORTED, BECAUSE THE PAIR IS UNORDERED. `(A,B)` and `(B,A)` are one coverage
 * item, and registering both would double the denominator against a rule whose
 * denominator is already the thing most likely to be got wrong.
 */
export const orderPair = (a: string, b: string): [string, string] => (a <= b ? [a, b] : [b, a]);

/**
 * The manifest key for a uniqueness pair.
 *
 * PREFIXED, for the reason `pairKey` and `refKey` are: the Manifest slots on
 * (unit, key), and the prefix keeps the units apart in the rendered GAPS
 * section, where only the key is printed.
 *
 * NOTHING PARSES THIS STRING. A Notion property name may contain `#` and `+`,
 * so splitting it recovers the wrong participant. Every reader takes the
 * participants and the property from `Entry.unq` instead.
 */
export const unqPairKey = (a: string, b: string, property: string): ResourceKey => {
  const [x, y] = orderPair(a, b);
  return `unq:${x}+${y}#${property}`;
};

/**
 * Do two readings collide?
 *
 * PURE AND EXPORTED, so the predicate can be asserted directly and mutated
 * directly — the seam CHECK-unq001.ts scores. Nothing downstream re-derives it.
 *
 * NULL IS NOT A VALUE, AND THE TWO NULLS DO NOT MATCH EACH OTHER. A null
 * reaches here from two places and both mean "no comparable value": an empty
 * property (decision 1) and a value shape this build will not render a
 * comparable for (see `PropertyReading.comparable`). Returning `true` for two
 * nulls is the single edit that implements the rejected reading of decision 1,
 * which is why the suite mutates exactly this line.
 */
export const collides = (a: string | null, b: string | null): boolean => a !== null && b !== null && a === b;

/**
 * Can UNQ001 judge this pair?
 *
 * Yes when both members' property maps were read, the property was located in
 * both, and no drop-out was recorded. A pair missing any of those has no answer,
 * and an answer the scan did not reach is a gap rather than a conformity claim.
 */
export const judgeable = (e: Entry): boolean =>
  e.stages.has('resolved') && e.stages.has('enumerated') && e.loss === null;

/** A judged pair whose two members carried the same value. THE VIOLATION. */
const collided = (e: Entry): boolean => judgeable(e) && e.unq?.duplicate === true;

export const UNQ001: Rule = {
  id: UNQ001_ID,
  unit: UNQ001_UNIT,
  /* A repeated value the rule READ in two resources it READ is a defect proved
   * in something the scan read, not a judgement it failed to reach. */
  findingKind: 'conformity-violation',

  judge(m) {
    const judged = new Set<ResourceKey>();
    /* PAIRS ONLY. Judging a resource here would mark it `evaluated` on the
     * strength of a rule that compared one of its properties against one other
     * resource — the union hazard that inflates every figure downstream, and
     * the collapse ADR-0011 exists to stop. */
    for (const e of m.of(UNQ001_UNIT)) if (judgeable(e)) judged.add(e.key);
    return judged;
  },

  findingsFrom(m) {
    /* THE GAP SET IS NOT AN INPUT, for the reason it is not one in req001.ts:
     * a violation and a gap are different objects produced by disjoint entries.
     * `collided` requires `judgeable`; gapsFrom emits only entries that never
     * reached `evaluated`. */
    const links = new Map(m.of(RESOURCES).map(e => [e.key, e.link]));

    /* ⭐ THE REGROUPING FROM PAIRS TO RESOURCES — decision 2, and the one place
     * in this file where the coverage item and the finding identity differ.
     * Each colliding pair contributes its two members; a member that appears in
     * three colliding pairs is still ONE finding naming three co-participants.
     *
     * A Set of co-participants, NOT a running list, because a resource can
     * reach the same co-participant only once but the same co-participant can
     * be reached through two properties — and the finding is per (resource,
     * property), which is what `byOffender` keys on. */
    type Offence = { resource: string; property: string; propertyId: string | null; others: Set<string> };
    const byOffender = new Map<string, Offence>();

    for (const e of m.of(UNQ001_UNIT)) {
      if (!collided(e) || !e.unq) continue;
      const { participants, property, propertyIds } = e.unq;
      for (const [i, resource] of participants.entries()) {
        const other = participants[1 - i]!;
        const slot = `${resource} ${property}`;
        const existing = byOffender.get(slot);
        if (existing) {
          existing.others.add(other);
          /* An ID observed on one pair and not on another is still the same
           * property on the same resource. Keeping the first non-null is what
           * stops the matchkey depending on which pair happened to be last. */
          existing.propertyId ??= propertyIds[i] ?? null;
        } else {
          byOffender.set(slot, { resource, property, propertyId: propertyIds[i] ?? null, others: new Set([other]) });
        }
      }
    }

    return [...byOffender.values()]
      .map((o): Finding => {
        const anchor = anchorFor(UNQ001_ID, o.resource);

        /* ADR-0010 decision 6: no matchkey holds the observed value. The name
         * and the ID identify WHICH property; the collision — the whole
         * observation — is in the evidence and nowhere else.
         *
         * ⛔ THE CO-PARTICIPANTS ARE NOT IN THE DISCRIMINATOR EITHER, and that
         * is deliberate. A matchkey listing them would change the moment one
         * duplicate is deleted, so every surviving finding would read as `new`
         * on the next run — the baseline churn ADR-0010 decision 1 exists to
         * prevent. They are evidence, and evidence enters the baseline through
         * the digest. */
        const discriminator: Discriminator = {
          ...(o.propertyId ? { [PROPERTY_ID_KEY]: o.propertyId } : {}),
          [PROPERTY_NAME_KEY]: o.property,
        };

        /* Sorted so the line is stable across runs. The manifest's iteration
         * order follows the traversal, which is not a guarantee — ADR-0004 —
         * and an unstable evidence line breaks `--deterministic`. */
        const others = [...o.others].sort();

        /* ⛔ THE VALUE IS NEVER PRINTED, and there is no line below that could
         * print it: the rule stores whether two values matched, not what they
         * were. The property NAME is the operator's own configured string; the
         * co-participants are IDs. */
        const evidence: Evidence = {
          object: anchor.resource,
          location: `the page's own property map, property "${o.property}"`,
          observed: `the value is shared with ${others.length} other resource(s) in the declared uniqueness scope: ${others.join(', ')}`,
          expected: 'a value that occurs at most once within the declared uniqueness scope',
        };

        return {
          rule: UNQ001_ID,
          anchor,
          discriminator,
          /* Both maps were read and both values were compared. The scan proved
           * this — the same reading that makes a SYS001 404 `confirmed`:
           * certainty is about the proposition the finding asserts, and this
           * one asserts something the manifest establishes. */
          certainty: 'confirmed',
          /* The resource was retrieved — hydration is what produced the map. */
          targetState: 'present',
          /* The co-participants are named, so the collision can be counted. */
          bounded: true,
          /* A uniqueness pair is never a declared root. Pervasiveness condition
           * (a) belongs to the traversal. */
          isRootMiss: false,
          evidence,
          /* The resource's own url, ALREADY REDACTED by scan.ts at the point of
           * entry. Null for a resource the scan staged from a parent's block
           * listing, which has no url to capture. */
          link: links.get(anchor.resource) ?? null,
          /* NULL, for REQ001's reason. The subject is the resource's own
           * property value; the co-participants are already named in the
           * evidence, and the anchor is the address. */
          source: null,
          /* No reference is involved: UNQ001's subject is a pair of resources in
           * a declared scope. Nothing to anchor and nothing to redact. */
          anchorText: null,
          message: `property "${o.property}" carries a value shared with ${others.length} other resource(s) in the declared uniqueness scope`,
        };
      })
      /* ADR-0010 decision 7's occurrence order: property ID ascending, the tie
       * on a null ID falling to the name and then to the resource. TOTAL, on
       * purpose — an unspecified tie-break is an ADR-0004 violation that only
       * shows up on a workspace nobody tested. */
      .sort((a, b) => {
        const ai = a.discriminator[PROPERTY_ID_KEY] ?? '';
        const bi = b.discriminator[PROPERTY_ID_KEY] ?? '';
        if (ai !== bi) return ai < bi ? -1 : 1;
        const an = a.discriminator[PROPERTY_NAME_KEY] ?? '';
        const bn = b.discriminator[PROPERTY_NAME_KEY] ?? '';
        if (an !== bn) return an < bn ? -1 : 1;
        return a.anchor.resource < b.anchor.resource ? -1 : a.anchor.resource > b.anchor.resource ? 1 : 0;
      });
  },

  coverage(m, judged) {
    /* The applicable set is every pair the config declared over the resources
     * in scope, INCLUDING the pairs this rule could not decide. A pair whose
     * member never arrived stays in the denominator and lowers the ratio;
     * dropping it would shrink the denominator to fit the scan's own blind
     * spot. Quadratic by construction — see the header. */
    return coverageRow(UNQ001_ID, UNQ001_UNIT, judged.size, m.count(UNQ001_UNIT));
  },

  outcome(m, judged, findings) {
    const entries = m.of(UNQ001_UNIT);

    /* ADR-0005 decision 1: conformity is ABSENT when the evaluated set is
     * empty. A verdict that was never formed is not a verdict. */
    const conformity = judged.size === 0 ? null : findings.length > 0 ? 'violates' : 'conforms';

    /* An empty applicable set has no sufficiency either. */
    if (entries.length === 0) return { conformity, evidence: null };

    /* STRUCTURAL, off the stage set and the presence of a loss — never parsed
     * out of a cause string.
     *
     * `unreached` — the property was never LOCATED on one of the two members:
     * the page was refused, or carried no map, or the map held no such
     * property. The remedy is the `unreached` remedy — widen the grant or raise
     * the budget.
     * `undecidable` — the property WAS located on both and a value could not be
     * compared: a shape this build renders no comparable for. Neither sharing
     * more nor re-running helps; the rule has to learn that property shape.
     *
     * ADR-0005 decision 1 gives `unreached` precedence where both hold. */
    const unreached = entries.some(e => !e.stages.has('enumerated') && e.loss !== null);
    const undecidable = entries.some(e => e.stages.has('enumerated') && e.loss !== null);

    return { conformity, evidence: unreached ? 'unreached' : undecidable ? 'undecidable' : 'sufficient' };
  },
};
