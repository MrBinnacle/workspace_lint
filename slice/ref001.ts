/* REF001 — an internal reference names a target the scan cannot resolve.
 *
 * CONTEXT.md settled defaults name this rule the LOAD-BEARING COVERAGE
 * MECHANISM, and the 2026-08-17 proof run established why the hard way: a
 * disconnected child page VANISHES from its parent's child list, so the scan
 * cannot count it, name it, or report it. The link is what is left. Every other
 * rule reads resources the traversal found; this one reads the trace of
 * resources the traversal could not find.
 *
 * THE RECOGNISER IS NOT IN THIS FILE. references.ts holds it, pure and offline,
 * because the previous implementation welded discovery to a live client and the
 * only reachable control injected the known-bad target ID directly — passing
 * whether or not discovery worked. This file is the RULE: what the manifest says
 * about a reference, what that makes it, and what it does to the report.
 *
 * THREE PROPERTIES ARE UNUSUAL AND EACH IS FORCED BY A DOCUMENT
 *
 * 1. AN UNRECOGNISED CANDIDATE PRODUCES NO FINDING AT ALL. Spec §7 makes this
 *    non-negotiable — "it carries no `certainty` and it carries no
 *    `target_state`" — and `Finding` requires both, so emitting one would assert
 *    two things the scan did not establish. It is a DROP-OUT instead: it stays
 *    in this rule's denominator, lowers this rule's ratio, and is named in the
 *    manifest with its cause. Excluding it is what shrinks a denominator to fit
 *    a blind spot, which is the defect results-ref001-live.md §3 records.
 *
 *    Spec §5's exit table assumes the opposite — it speaks of "their SYS001
 *    findings" reaching exit 1 — and the two halves of §5 disagree with each
 *    other. THE NON-NEGOTIABLE IN §7 WINS, and the consequence is stated rather
 *    than hidden: at the default threshold of 1.0 an unrecognised candidate
 *    still reaches exit 3 through this rule's coverage row, so the residue does
 *    reach the byte. It is only the route to exit 1 that differs. Surfaced on
 *    #44 rather than settled here; scope is the operator's call.
 *
 * 2. CERTAINTY IS `confirmed` ABOUT AN `unreachable` TARGET, AND THAT IS NOT A
 *    CONTRADICTION. CONTEXT.md's third distinction: certainty describes the
 *    FINDING — did the scan prove it — and target state describes the OBJECT.
 *    "This link cannot be resolved" is proved: the link exists and the API
 *    refused the target. What the 404 does not prove is whether the target is
 *    absent or merely inaccessible, which is Principle 3 and is why the target
 *    state is `unreachable` and never `absent`. Spec criterion 4, and #10's own
 *    triage comment corrected the opposite reading twice.
 *
 * 3. A NON-404 FAILURE IS NOT A FINDING. A 429 or a 502 on the target means the
 *    rule never reached a judgement, so the reference is a drop-out with
 *    `unreached` evidence — widen access or raise the budget — not a violation.
 *    Reporting it as a dead link would be a defect claimed out of a rate limit.
 */

import type { Entry, ResourceKey } from './manifest.js';
import type { Rule } from './rule.js';
import {
  anchorFor,
  coverageRow,
  type CoverageUnit,
  type Discriminator,
  type Evidence,
  type Finding,
} from './finding.js';
import { redactHref } from './references.js';
import { hyphenate } from './ids.js';

export const REF001_ID = 'REF001';

/**
 * The rendered form of a source ID — full and hyphenated, or the fallback string
 * verbatim.
 *
 * ⛔ THE TWO FORMS IN ONE REPORT ARE A DEFECT, not a cosmetic difference.
 * `scan.ts` hands `extractReferences` the raw page ID it read from the traversal,
 * so `RefFacts.sourcePage` is BARE while `targetId`, every anchor and every
 * manifest row are hyphenated. A reader given a bare source page cannot match it
 * against the manifest row for the same page by eye, and Notion IDs are
 * time-ordered — resources created in one session share their leading hex, which
 * is the standing constraint that made #42's run read like a double-count.
 *
 * `hyphenate` returns null for anything that is not 32 hex digits, which is
 * exactly the behaviour the fallbacks need: `'(unrecorded page)'` and
 * `'(unknown block)'` pass through untouched rather than being mangled or
 * blanked. Normalising here rather than in `references.ts` keeps the capture
 * site recording what it observed and leaves the rendering convention to the
 * rule, which is where every other ID on this finding is already put in form.
 */
export const idForm = (raw: string): string => hyphenate(raw) ?? raw;

/**
 * ADR-0011 decision 2: REF001's coverage item is an internal reference, NOT a
 * resource. ADR-0011 decision 4 forbids pooling its count with SYS001's, so this
 * unit travels with every figure computed over it.
 */
export const REF001_UNIT: CoverageUnit = 'internal references';

/** The discriminator key family, named and versioned per ADR-0010 decision 1. */
export const FINDING_KIND_KEY = 'ref001/finding-kind@1';

/**
 * The manifest key for a reference entry.
 *
 * PREFIXED, AND THE PREFIX IS LOAD-BEARING. A page under the declared root and a
 * link pointing at that same page are two entries in two different coverage
 * items. Keyed on the bare ID they collide, and the second silently overwrites
 * the first — deleting a drop-out, which is the flattering direction. The
 * Manifest also slots on (unit, key), so this is the second of two guards; the
 * prefix additionally keeps the two apart in the rendered GAPS section, where
 * only the key is printed.
 */
export const refKey = (identity: string): ResourceKey => `ref:${identity}`;

/**
 * Can REF001 judge this reference?
 *
 * Yes when it was classified to a target — stage `resolved` — and carries no
 * drop-out cause. STRUCTURAL, never parsed from a cause string: the two readers
 * who recovered structure from prose in this codebase were both wrong, and the
 * `Loss` record exists because of it.
 *
 * A 404 target IS judgeable. The rule reached its judgement, and the judgement
 * is that the reference does not resolve. That is the finding, not a gap — a
 * violation the scan proved is the opposite of coverage it failed to obtain.
 */
export const judgeable = (e: Entry): boolean => e.stages.has('resolved') && e.loss === null;

/** A judged reference whose target was never retrieved. The violation. */
const unresolved = (e: Entry): boolean => judgeable(e) && !e.stages.has('fetched');

export const REF001: Rule = {
  id: REF001_ID,
  unit: REF001_UNIT,
  /* A dead link is a defect REF001 PROVED in something it read, not a judgement
   * it failed to reach. It is a violation and it drives the disposition. */
  findingKind: 'conformity-violation',

  judge(m) {
    const judged = new Set<ResourceKey>();
    /* REFERENCES ONLY. Judging a resource here would mark it `evaluated` on the
     * strength of a rule that never looked at it — the union hazard #43's
     * handoff names as the most dangerous line in the slice. */
    for (const e of m.of(REF001_UNIT)) if (judgeable(e)) judged.add(e.key);
    return judged;
  },

  findingsFrom(m) {
    /* THE GAP SET IS NOT AN INPUT TO THIS RULE, and the omission is the point.
     * A REF001 finding is a conformity violation — a link that does not resolve
     * — and a gap is the absence of a judgement. They are different objects, and
     * the entries that produce them are disjoint: `unresolved` requires
     * `judgeable`, and gapsFrom emits only entries that never reached
     * `evaluated`. A reference cannot be both. */
    return m.of(REF001_UNIT).filter(unresolved).map((e): Finding => {
      const facts = e.ref;
      const target = facts?.targetId ?? e.key;
      const anchor = anchorFor(REF001_ID, target);
      /* One finding per (rule, target) in this slice, so the bucket is a
       * singleton and ADR-0010 decision 5's ordering is total by construction.
       * The key names the KIND of finding, not the route it was found by: the
       * route can change between runs when an editor moves a link, and a
       * matchkey that moves reports an unchanged defect as new. ADR-0010
       * decision 6 keeps the observed value out of it either way. */
      const discriminator: Discriminator = { [FINDING_KIND_KEY]: 'unresolvable-internal-reference' };
      const evidence: Evidence = {
        object: anchor.resource,
        location: `internal reference discovered in block content (${facts?.via ?? 'unrecorded route'})`,
        /* The cause the port produced, recorded by the site that made the call.
         * Never re-derived from a stage or a string. */
        observed: facts?.resolveCause ?? 'the target was never retrieved and no cause was recorded',
        expected: 'a resolvable internal target',
      };
      /* WHAT THE 404 ACTUALLY PROVES DEPENDS ON WHETHER THE KIND IS KNOWN.
       * A Route A page mention says the target is a page, so a 404 means the
       * page is not retrievable. A Route B href says nothing about the kind, so
       * the same 404 also covers "this ID is a database and GET /v1/pages does
       * not return one". The finding is still true — the link does not resolve
       * for this connection — and the qualification travels with it rather than
       * being left for the operator to discover. A database reached by Route A
       * never gets here at all: scan.ts records it as a drop-out. */
      const kindQualifier = facts?.targetKind === 'unknown'
        ? ' — the route carried no object kind, so this also covers a target that is not a page'
        : '';
      return {
        rule: REF001_ID,
        anchor,
        discriminator,
        /* Property 2 in this file's header. The scan proved the link does not
         * resolve; it did not prove what happened to the target. */
        certainty: 'confirmed',
        targetState: 'unreachable',
        /* The reference is named, so the missing item can be counted. */
        bounded: true,
        /* A reference is never a declared root. Pervasiveness condition (a)
         * belongs to the traversal, not to link resolution. */
        isRootMiss: false,
        evidence,
        /* REF001 is the one rule in this slice that CAN name a link, because it
         * discovered one. It is the observed href, not a link constructed from
         * an ID — finding.ts records why constructing one is an assertion about
         * Notion's URL scheme. It is redacted, because an href path can carry a
         * page title. Null for a Route A structural reference, which carries an
         * ID and no URL at all. */
        link: facts?.href ? redactHref(facts.href) : null,
        /* THE ADDRESS. Read straight off the facts the discovering site
         * recorded — never recovered by parsing `e.key`, which is the shape
         * `RefFacts`' own docstring exists to forbid and which this repository
         * has recovered structure from prose and been wrong about twice.
         * The fallbacks travel verbatim; `references.ts` writes them precisely
         * so an absent origin is visibly absent rather than blank. Null only
         * when the entry carried no facts at all, which is the same condition
         * every other field on this finding already degrades under. */
        source: facts ? { page: idForm(facts.sourcePage), block: idForm(facts.sourceBlock) } : null,
        /* No title, and no verbatim href: both can carry workspace content into
         * every consumer of this finding, redaction flag or not. */
        message: `internal reference does not resolve — the target is unreachable (${facts?.via ?? 'unrecorded route'})${kindQualifier}`,
      };
    });
  },

  coverage(m, judged) {
    /* The applicable set is every discovered reference INCLUDING the ones this
     * rule could not classify. Spec §5: an unrecognised candidate is in the
     * denominator, and excluding it reproduces the defect where the denominator
     * shrank to fit the blind spot and coverage read 100% over a root the tool
     * could not fully see. External links are NOT here — they never enter the
     * manifest, per spec §6 test 4, because otherwise step 5's deliberate
     * over-reporting would make every scan permanently qualified. */
    return coverageRow(REF001_ID, REF001_UNIT, judged.size, m.count(REF001_UNIT));
  },

  outcome(m, judged, findings) {
    const entries = m.of(REF001_UNIT);

    /* ADR-0005 decision 1: conformity is ABSENT when the evaluated set is empty.
     * A verdict that was never formed is not a verdict. */
    const conformity = judged.size === 0 ? null : findings.length > 0 ? 'violates' : 'conforms';

    /* An empty applicable set has no sufficiency either — the same rule SYS001
     * learned by reporting a run that made no successful call as fully covered. */
    if (entries.length === 0) return { conformity, evidence: null };

    /* Both tests are STRUCTURAL, read off the stage set and the presence of a
     * loss, never off the cause text.
     *
     * `unreached` — the candidate WAS classified to a target and the target
     * could not be retrieved for a reason other than a 404. Remedy: widen access
     * or raise the request budget.
     * `undecidable` — the candidate was never classified at all. Remedy: neither
     * sharing more nor re-running helps; extend the recogniser or fix the link.
     * That is spec §1's whole argument for why `unrecognised` needs no new axis
     * value, and ADR-0005 decision 1 gives `unreached` precedence where both
     * hold. */
    const unreached = entries.some(e => e.stages.has('resolved') && e.loss !== null);
    const undecidable = entries.some(e => !e.stages.has('resolved') && e.loss !== null);

    return { conformity, evidence: unreached ? 'unreached' : undecidable ? 'undecidable' : 'sufficient' };
  },
};
