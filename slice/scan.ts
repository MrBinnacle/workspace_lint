/* The scan. One declared root, five funnel stages, TWO rules, one exit byte.
 *
 * WHAT #44 CHANGED, AND WHAT IT DID NOT
 *
 * T2 (#43) ran one rule over one coverage item, so the funnel figure and the
 * coverage vector were the same number read twice. REF001 arrives here counting
 * INTERNAL REFERENCES, and four things move. Each was predicted on #43 and each
 * is the flattering direction if it is got wrong:
 *
 *   1. STAGE 5 BECOMES AN INTERSECTION. ADR-0005 decision 5 defines `evaluated`
 *      as "every applicable rule reached a judgement". A second parallel loop
 *      that marks the stage makes it a UNION — a coverage item marked evaluated
 *      because ONE rule judged it — which inflates every figure downstream.
 *      evaluateStage() below computes it as an intersection over the rules whose
 *      coverage item the entry belongs to, so a second rule on an existing unit
 *      cannot make it a union by being added. CHECK-ref001.ts TEST 5 is the
 *      control: a second resources-rule that judges nothing must take the
 *      funnel to zero.
 *   2. THE MANIFEST HOLDS TWO COVERAGE ITEMS. Every entry declares its unit and
 *      each rule counts only its own, because ADR-0011 decision 4 forbids
 *      pooling counts of different nouns. `manifest.count()` has no unit-free
 *      form for that reason.
 *   3. `violations` STOPS BEING ZERO. A REF001 finding is a proved defect, not a
 *      coverage gap, so it drives the disposition. Rules DECLARE which kind they
 *      produce; nothing here reads a rule name to decide.
 *   4. THE EXIT BYTE COMPARES THE VECTOR MINIMUM, not the funnel — ADR-0011
 *      decision 5 through ADR-0012 decision 2, closing #49. The threshold is a
 *      floor on every rule, so the byte compares the weakest row. Those were one
 *      number in T2 and are two now. This file hands `deriveVerdict` the whole
 *      vector; it does not reduce it first, and it does not compute a second
 *      copy of the minimum. `ScanResult.byteBasis` records what was compared.
 *
 * WHAT STILL DOES NOT REACH `evaluated`: a resource that stalled before
 * `fetched`, a resource that reached `fetched` carrying a drop-out cause, and
 * now a reference the recogniser could not classify. All three are reported.
 */

import type { Config, RuleDecl } from './config.js';
import { attestationOf, BLOCK_CHILDREN, type NotionPort } from './notion-port.js';
import { createObserver, listAllChildren, readBlockTree, type Call, type Observer } from './observed.js';
import { Manifest, gapsFrom, residualsFrom, RESOURCES, type Enumeration, type Loss, type Residual } from './manifest.js';
import { deriveVerdict, type Gap, type Verdict } from './verdict.js';
import { SYS001 } from './sys001.js';
import { REF001, REF001_UNIT, refKey } from './ref001.js';
import { REQ001, REQ001_UNIT, pairKey, readProperty } from './req001.js';
import { UNQ001, UNQ001_UNIT, collides, orderPair, unqPairKey } from './unq001.js';
import { hyphenate } from './ids.js';
import { dedupeReferences, extractReferences, redactHref, type Reference, type TargetKind } from './references.js';
import type { Rule } from './rule.js';
import type { CoverageRow, Finding, Outcome } from './finding.js';

const DATA_SOURCE_CAUSE =
  'data-source enumeration is not implemented in this slice — rows and schemas are REQ001/UNQ001 concerns, out of scope per spec §1.2';

/**
 * What the exit byte was computed on, recorded per run.
 *
 * It survived #49. Before ADR-0012 this type existed to DISCLOSE that the byte
 * compared the wrong figure; it now records which figure the byte compared, and
 * #45's exporter must serialise it alongside the byte — a byte published
 * without its basis is a coverage claim the reader cannot check.
 *
 * `funnel` is kept beside `compared` because they are different nouns and the
 * report prints both. It is NOT what the byte compared, and the field name no
 * longer implies otherwise.
 */
export type ByteBasis = {
  /** The resource funnel: evaluated/applicable over RESOURCES. Recorded only. */
  funnel: number;
  /**
   * What the byte compared — the minimum row of the coverage vector, per
   * ADR-0011 decision 5. This is the SAME OBJECT as `verdict.coverageMinimum`,
   * read from the verdict rather than recomputed: a second derivation of the
   * same number is the drift hazard of results-ref001-live.md §4.
   */
  compared: CoverageRow | null;
  declaredThreshold: number;
};

/**
 * The enumeration record every block-children call writes — ADR-0013 decision 2.
 *
 * One constant, so no call site can classify the same endpoint differently from
 * another. `attestationOf` is called rather than the value written literally,
 * which keeps the classification in one place and lets TEST 1 assert it.
 *
 * FROZEN, because every entry that records an enumeration holds a REFERENCE to
 * this one object and all three renderers read it. An in-place edit anywhere
 * would silently reclassify every enumeration in the run — and the flattering
 * direction of that edit is the one that empties the register. Freezing makes
 * the immutability a property of the value rather than a habit of its callers.
 */
const BLOCK_ENUMERATION: Enumeration = Object.freeze({ endpoint: BLOCK_CHILDREN, attestation: attestationOf(BLOCK_CHILDREN) });

export type ScanResult = {
  manifest: Manifest;
  verdict: Verdict;
  gaps: Gap[];
  /**
   * ADR-0013. Doubts about the evidence base, NOT gaps and NOT findings. They
   * enter no ratio, no vector and no pervasiveness test — see residualsFrom.
   */
  residuals: Residual[];
  findings: Finding[];
  /** ADR-0011: one row per rule, over that rule's own coverage item. */
  coverage: CoverageRow[];
  /** Per rule, the outcome PAIR. Keyed by rule ID. */
  outcomes: Record<string, Outcome>;
  byteBasis: ByteBasis;
  /** Discovered, classified external, and excluded from every denominator. */
  externalReferences: number;
  calls: Call[];
  requestCount: number;
  wallMs: number;
  log: string[];
};

export type ScanOptions = {
  config: Config;
  port: NotionPort;
  /**
   * The coverage-gap detection mechanism, injected so the mutation check can
   * disable it and confirm the exit byte goes green. Defaults to gapsFrom.
   */
  deriveGaps?: (m: Manifest) => Gap[];
  /**
   * The residual-register mechanism, injected at the same seam and for the same
   * reason: a control that passes with its mechanism disabled tested nothing.
   */
  deriveResiduals?: (m: Manifest) => Residual[];
  /**
   * The rules, injected at the same seam and for the same reason. A list rather
   * than a pair, so a check can add a rule on an existing coverage item and
   * prove stage 5 is an intersection rather than assert it.
   */
  rules?: Rule[];
  now?: () => number;
};

/* The block shapes this slice reads for TRAVERSAL. Reference discovery reads
 * rich text out of the same blocks and lives in references.ts. */
type ChildBlock = {
  id: string;
  type: string;
  child_page?: { title?: string };
  child_database?: { title?: string };
};

function asChildBlock(b: unknown): ChildBlock | null {
  if (typeof b !== 'object' || b === null) return null;
  const o = b as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.type !== 'string') return null;
  return o as unknown as ChildBlock;
}

const titleOf = (b: ChildBlock): string =>
  String(b.child_page?.title ?? b.child_database?.title ?? b.id);

/**
 * ADR-0005 decision 5 stage 5, computed as an INTERSECTION.
 *
 * An entry is `evaluated` when every rule applicable to it reached a judgement.
 * A rule is applicable to an entry when the entry belongs to that rule's own
 * coverage item — which is what makes the loop safe to extend: adding a second
 * rule over `resources` narrows the stage, it does not widen it.
 *
 * An entry belonging to no rule's coverage item is never evaluated. That is the
 * honest answer, not an oversight: nothing judged it.
 */
function evaluateStage(manifest: Manifest, rules: Rule[]): void {
  const judgements = rules.map(rule => ({ unit: rule.unit, judged: rule.judge(manifest) }));
  for (const e of manifest.all()) {
    const applicable = judgements.filter(j => j.unit === e.unit);
    if (applicable.length === 0) continue;
    if (applicable.every(j => j.judged.has(e.key))) manifest.mark({ id: e.key, unit: e.unit, stage: 'evaluated' });
  }
}

/**
 * The rules THIS BUILD can execute, exported so that nothing has to restate it.
 *
 * The CLI needs the same list to answer a different question — whether the
 * operator configured a rule this binary cannot run (`unimplementedRules` in
 * rule.ts) — and it printed the count as a hand-written `2 (SYS001, REF001)`
 * before this was exported. A hand-kept copy of a fact the system already holds
 * is the drift class this repository keeps re-finding; here it would have made
 * the report's own header lie about which rules produced the figures under it.
 */
export const BUILT_RULES: Rule[] = [SYS001, REF001, REQ001, UNQ001];

export async function scan(opts: ScanOptions): Promise<ScanResult> {
  const { config, port } = opts;
  const deriveGaps = opts.deriveGaps ?? gapsFrom;
  const deriveResiduals = opts.deriveResiduals ?? residualsFrom;
  const rules = opts.rules ?? BUILT_RULES;
  const now = opts.now ?? (() => Date.now());

  const t0 = now();
  const observer = createObserver();
  const manifest = new Manifest();
  const log: string[] = [];
  const say = (s = '') => log.push(s);
  let externalReferences = 0;

  /* What the traversal learned about SHAPE, kept local — #58.
   *
   * The manifest records coverage, not structure: it has no parent field and no
   * kind field, and adding either for one rule's benefit would put a second
   * model of the tree beside the block listings that produced it. REQ001 needs
   * two facts the traversal already holds while it runs — which resources are
   * children of the declared root, and which of them this build cannot retrieve
   * as a page — so they are captured here and spent in the hydration stage.
   */
  const keyOf = (id: string): string => hyphenate(id) ?? id;
  const resourceKind = new Map<string, 'page' | 'data-source'>();
  const childKeys: string[] = [];
  /** Property maps already returned by the traversal. The root's retrieve is not repeated. */
  const propertiesOf = new Map<string, Record<string, unknown> | undefined>();
  /**
   * Did the uniqueness stage get to run? See `declareScopesNeverEnumerated` —
   * a legitimately-empty pair set and a stage that never ran are the same entry
   * count and are not the same fact.
   */
  let uniquenessStageRan = false;

  const finish = (didNotRunAsDeclared = false): ScanResult => {
    /* THE RULES RUN HERE, NOT AT THE END OF THE TRAVERSAL, because every early
     * return above is also a scan whose coverage has to be judged. An
     * unreachable declared root is SYS001's headline finding, and it leaves
     * through the second return in this function. */

    /* AND SO IS REQ001'S APPLICABLE SET. Three paths return before the
     * hydration stage; on each of them a configured rule had no pairs, left the
     * coverage vector, and produced a run indistinguishable from one with no
     * rule configured. This declares the pairs that were never enumerated,
     * and it is a no-op once the hydration stage has declared any. */
    declarePairsNeverEnumerated(manifest, config.rules);
    declareScopesNeverEnumerated(manifest, config.rules, uniquenessStageRan);
    evaluateStage(manifest, rules);

    const gaps = deriveGaps(manifest);
    const findings: Finding[] = [];
    const coverage: CoverageRow[] = [];
    const outcomes: Record<string, Outcome> = {};
    let violations = 0;

    for (const rule of rules) {
      /* `judge` is called a second time here rather than threaded out of
       * evaluateStage, and the difference is deliberate: the value it returns
       * now includes nothing new, because `evaluated` is a stage and neither
       * judgeable() reads it. Re-deriving a number two ways is the recorded
       * defect; re-calling one pure function is not. */
      const judged = rule.judge(manifest);
      const ruleFindings = rule.findingsFrom(manifest, gaps);
      findings.push(...ruleFindings);
      if (rule.findingKind === 'conformity-violation') violations += ruleFindings.length;
      const row = rule.coverage(manifest, judged);
      if (row) coverage.push(row);
      outcomes[rule.id] = rule.outcome(manifest, judged, ruleFindings);
    }

    const applicable = manifest.count(RESOURCES);
    const evaluated = manifest.reached('evaluated', RESOURCES);
    const verdict = deriveVerdict({
      applicable,
      evaluated,
      /* THE WHOLE VECTOR, unreduced — ADR-0012 decision 2. deriveVerdict takes
       * the minimum itself, through the same headlineCoverage() the report's
       * headline uses. Reducing it here would put a second copy of that
       * derivation in a second file. */
      coverage,
      gaps,
      /* NO LONGER ZERO. Findings that are not coverage gaps — a REF001 dead link
       * is a defect the rule proved, and ADR-0005 decision 3 counts it toward
       * the disposition. The rules declare which kind they produce; this line
       * does not read a rule name. */
      violations,
      /* Every finding in this slice is `new` and unsuppressed BY CONSTRUCTION,
       * not by computation: spec §1.2 gives the slice no baseline file and no
       * suppressions, so there is nothing a finding could be matched against.
       * When a baseline lands this stops equalling findings.length and becomes
       * the count that survives matching (ADR-0008 decision 3). */
      newUnsuppressedFindings: findings.length,
      coverageThreshold: config.minCoverage,
      didNotRunAsDeclared,
    });

    /* #49 CLOSED. `compared` is READ FROM THE VERDICT, not recomputed here.
     * Calling headlineCoverage() a second time would produce the same number
     * today and would be a second holding of it, which is the defect
     * results-ref001-live.md §4 records: two derivations maintained beside each
     * other drift, and they drift toward the flattering answer. */
    const byteBasis: ByteBasis = {
      funnel: verdict.coverage,
      compared: verdict.coverageMinimum,
      declaredThreshold: config.minCoverage,
    };

    return {
      manifest, verdict, gaps,
      /* DERIVED AFTER the verdict and fed into NOTHING above it. That ordering is
       * the decision-3 prohibition expressed as control flow: there is no line
       * between here and deriveVerdict where a residual could reach a
       * denominator. */
      residuals: deriveResiduals(manifest),
      findings, coverage, outcomes, byteBasis, externalReferences,
      calls: observer.calls,
      requestCount: observer.calls.length,
      wallMs: now() - t0,
      log,
    };
  };

  /* -- auth, and it is also the identity check --------------------------- */
  /* Without this, a bad credential returns 404 on the declared root and the run
   * exits 2 — "the root is unreachable" — when the truth is that the scan never
   * ran as declared, which is 4. Two different failures, two different bytes. */
  const me = await observer.observe('GET /v1/users/me', () => port.whoami());
  if (me.state === 'unreachable') {
    say(`AUTH FAILED — ${me.cause}`);
    say('The scan did not run as declared. No coverage claim is made.');
    return finish(true);
  }
  say(`connection ok — ${me.value?.name ?? '(unnamed)'} (${me.value?.type ?? '?'})`);

  /* -- the declared root -------------------------------------------------- */
  const root = config.roots[0]!;
  const rootAlias = root.alias ?? root.id;
  manifest.mark({ id: root.id, alias: rootAlias, stage: 'declared', isRoot: true });

  const page = await observer.observe('GET /v1/pages/{root}', () => port.retrievePage(root.id));
  if (page.state === 'unreachable') {
    manifest.note(root.id, {
      cause: `declared root was never reached — ${page.cause}`,
      /* The missing item is the root itself, which is named. Pervasiveness
       * comes from isRootMiss here, not from boundedness. */
      bounded: true,
      target: 'unreachable',
    });
    say(`declared root UNREACHABLE — ${page.cause}`);
    return finish();
  }
  /* THE URL IS REDACTED HERE, AT THE POINT OF ENTRY. `page.value.url` is the raw
   * Notion URL and it carries the page title inside its path. Redacting at the
   * point of RENDER would mean three renderers plus a JSON artifact each had to
   * remember, and #42 shipped a title through exactly one such forgotten site. */
  manifest.mark({
    id: root.id,
    alias: rootAlias,
    stage: 'resolved',
    link: page.value.url ? redactHref(page.value.url) : null,
  });
  /* THE ROOT'S PROPERTY MAP ARRIVES ON THIS RESPONSE and is kept, so REQ001
   * over the root costs no second request. `has` is what the hydration stage
   * tests, so a root that carried NO map is recorded as such — storing
   * `undefined` here is a fact, not an absence of one. */
  resourceKind.set(keyOf(root.id), 'page');
  propertiesOf.set(keyOf(root.id), page.value.properties);
  say('declared root resolved.');

  /* -- enumerate the root ------------------------------------------------- */
  const rootBlocks = await listAllChildren(port, observer, root.id, 'root');
  if (rootBlocks.state === 'unreachable') {
    manifest.note(root.id, {
      cause: `root enumeration failed — ${rootBlocks.cause}`,
      /* UNBOUNDED. The child list was never retrieved, so the scan can neither
       * count nor name what it missed — ADR-0005 decision 3(b) exactly. The
       * previous pattern-matched classification called this BOUNDED while
       * calling a half-finished enumeration unbounded, so failing outright
       * produced the milder verdict. */
      bounded: false,
      /* The root itself was retrieved a moment ago. The loss is its contents. */
      target: 'present',
    });
    say(`root enumeration FAILED — ${rootBlocks.cause}`);
    return finish();
  }
  manifest.mark({
    id: root.id, alias: rootAlias, stage: 'enumerated',
    /* A partial enumeration is unbounded whatever produced it — a mid-stream
     * error, an exhausted page budget, or a positive `request_status:
     * incomplete`. In every case the remainder is unknown. */
    loss: rootBlocks.state === 'partial' ? { cause: rootBlocks.cause, bounded: false, target: 'present' } : null,
    /* THE CALL WAS MADE, SO THE ENUMERATION IS RECORDED — ADR-0013 decision 2.
     * This is orthogonal to the loss above. A complete-looking enumeration and a
     * permission-filtered one are identical in the response, so a clean `loss:
     * null` here says nothing about whether the listing was whole. */
    enumeration: BLOCK_ENUMERATION,
  });
  manifest.mark({ id: root.id, alias: rootAlias, stage: 'fetched' });

  /* Block content the reference recogniser will read. Collected as it is
   * fetched, so REF001's applicable set is derived from what the scan actually
   * READ — never from a second traversal, and never from a page the scan only
   * heard about. */
  const contentRead: { pageId: string; blocks: unknown[] }[] = [];
  const readTree = async (pageId: string, alias: string, topLevel: unknown[]): Promise<unknown[]> => {
    const tree = await readBlockTree(port, observer, topLevel);
    if (tree.state === 'partial')
      /* UNBOUNDED. The cause says the number of unread nested blocks is unknown,
       * and a link inside one of them cannot be counted or named. Recording this
       * as bounded would be the same inversion that once made failing outright
       * milder than failing halfway. */
      manifest.mark({ id: pageId, alias, stage: 'fetched', loss: { cause: `nested block content incomplete — ${tree.cause}`, bounded: false, target: 'present' } });
    const read = tree.state === 'unreachable' ? [] : tree.value;
    contentRead.push({ pageId, blocks: read });
    return read;
  };

  const blocks = await readTree(root.id, rootAlias, rootBlocks.value);
  say(`root enumerated — ${rootBlocks.value.length} top-level block(s), ${blocks.length} with nesting, ${rootBlocks.state}.`);

  /* THE APPLICABLE SET IS BUILT FROM WHAT WAS ENUMERATED, not from the subset
   * this code knows how to descend into. Counting only child_page produced a
   * ratio of 2/2 over a root with three children — a denominator that shrinks to
   * match the scan's own blind spots (results-ref001-live.md §3). The
   * child_database below is counted and then reported as a gap with a named
   * cause, which is the difference between a blind spot and a disclosed one. */
  const children = blocks
    .map(asChildBlock)
    .filter((b): b is ChildBlock => b !== null && (b.type === 'child_page' || b.type === 'child_database'));

  say(`child resources under the declared root: ${children.length}`);
  /* Recorded from the BLOCK TYPE the listing returned, which is the only place
   * the kind is stated. A REQ001 scope naming a data source is a gap with a
   * named cause, and this is where the scan learns which resources those are. */
  for (const c of children) {
    childKeys.push(keyOf(c.id));
    resourceKind.set(keyOf(c.id), c.type === 'child_database' ? 'data-source' : 'page');
  }
  for (const c of children) manifest.mark({ id: c.id, alias: titleOf(c), stage: 'declared' });
  for (const c of children) manifest.mark({ id: c.id, alias: titleOf(c), stage: 'resolved' });

  /* -- descend one level -------------------------------------------------- */
  for (const c of children) {
    const alias = titleOf(c);
    if (c.type === 'child_database') {
      /* A NAMED gap. Bounded, because the resource is named and counted, and
       * present, because its block was returned in the parent's listing.
       *
       * ⛔ THIS IS NOT AN APPLICABILITY FILTER AND MUST NOT BECOME ONE — #50.
       * ADR-0005 decision 2's filter takes the (rule, resource) pair out of the
       * denominator on a PRECONDITION MISMATCH: the rule's preconditions against
       * the resource's properties. "This build does not enumerate data sources"
       * is neither — it is a fact about the tool, and admitting it would make
       * every denominator a function of build state, so each unimplemented
       * capability would RAISE the ratio. ADR-0005 decision 4 already names the
       * resulting figure as a defect in prior art, and REF001 answers the same
       * question the same way on live evidence
       * (docs/proof/results-51-database-identity.md).
       *
       * CHECK-sys001.ts TEST 10b implements the filter and prices it: the ratio
       * reads 3/3, the byte goes 3 → 0, and the gap SURVIVES in the report while
       * the run exits green. There is no second guard behind this line. */
      manifest.mark({ id: c.id, alias, stage: 'enumerated', loss: { cause: DATA_SOURCE_CAUSE, bounded: true, target: 'present' } });
      continue;
    }
    /* The label is the ID, NOT the alias. The alias is a page title, the call
     * log is stdout, and titles are redacted by default. The first live run
     * printed `GET /v1/blocks/wl-pagination/children` under a report that said
     * "page titles redacted by default" three lines above. A redaction control
     * with a hole in it is worse than no control, because the report asserts the
     * guarantee either way. */
    const kids = await listAllChildren(port, observer, c.id, c.id);
    if (kids.state === 'unreachable') {
      manifest.note(c.id, {
        cause: `enumeration failed — ${kids.cause}`,
        /* Bounded: the resource that was lost is this child, and it is named.
         * Its own descendants are outside this slice's applicable set, which
         * descends one level (spec §1.1). */
        bounded: true,
        /* UNREACHABLE, not present. The parent's listing returned this block,
         * but the call about the resource itself failed, and a 404 is access
         * failure or object absence with no way to tell which. Claiming
         * `present` here was reporting an object the API had just refused. */
        target: 'unreachable',
      });
      continue;
    }
    manifest.mark({
      id: c.id, alias, stage: 'enumerated',
      loss: kids.state === 'partial' ? { cause: kids.cause, bounded: false, target: 'present' } : null,
      /* Same call, same classification. The child_database branch above returns
       * before reaching this line and therefore records NO enumeration: it spends
       * no request, so there is no blind listing to doubt. It is a gap. */
      enumeration: BLOCK_ENUMERATION,
    });
    manifest.mark({ id: c.id, alias, stage: 'fetched' });
    await readTree(c.id, alias, kids.value);
  }

  /* -- REF001: discover the references, then resolve them ------------------ */
  /* Deduplicated ACROSS pages, not only within one. The same href on two pages
   * is one reference; counting it twice would make every printed figure move
   * with where an editor pasted the link. */
  const discovered = dedupeReferences(contentRead.flatMap(({ pageId, blocks: bs }) => extractReferences(bs, pageId)));
  externalReferences = discovered.filter(r => r.kind === 'external').length;
  const targets = registerReferences(manifest, discovered);
  say(`internal references discovered: ${targets.length} · unrecognised candidates: ${
    manifest.of(REF001_UNIT).filter(e => !e.stages.has('resolved')).length
  } · external excluded: ${externalReferences}`);

  for (const { targetId, targetKind } of targets) {
    const key = refKey(targetId);

    /* A DATABASE TARGET IS NOT RESOLVED, AND IT IS NOT A FINDING EITHER.
     *
     * This slice's whole API surface is three GETs and the only retrieve it has
     * is `GET /v1/pages/{id}`. A database is not a page, so that call does not
     * return one — and the rule would then read the failure as proof that the
     * link is dead. A shared, perfectly readable database `@`-mentioned in block
     * content would be reported `certainty: confirmed`, `target state:
     * unreachable`, and the build would fail on a defect the scan invented.
     * That is the failure this file's own property 3 forbids, arriving through
     * a different door.
     *
     * So it becomes a DROP-OUT: in REF001's denominator, lowering its ratio,
     * named with a specific cause, and producing no finding. The tool's
     * inability to retrieve one kind of object is disclosed as a gap rather
     * than converted into a defect in the workspace. Widening the port is the
     * real fix and it is filed, not done here. */
    if (targetKind === 'database') {
      manifest.mark({
        id: key, unit: REF001_UNIT, stage: 'resolved',
        loss: { cause: 'target-kind-not-retrievable — the reference names a database and this slice retrieves pages only (GET /v1/pages)', bounded: true, target: 'unreachable' },
      });
      continue;
    }

    /* The FULL ID as the endpoint label. It is not a title, and an 8-character
     * prefix is not a discriminator in this workspace — three distinct resources
     * shared eight leading hex digits on the first live run. */
    const target = await observer.observe(`GET /v1/pages/${targetId}`, () => port.retrievePage(targetId));

    if (target.state !== 'unreachable') {
      manifest.mark({ id: key, unit: REF001_UNIT, stage: 'fetched' });
      /* THE SAME RESPONSE THE HYDRATION STAGE WOULD OTHERWISE PAY FOR AGAIN. A
       * page that is both a child of the declared root and the target of a link
       * was retrieved twice — once here, once by REQ001 — and under a ~3 req/s
       * ceiling the pages most likely to be in scope are exactly the ones that
       * doubled. A 429 on the second call turns a conforming pair into a gap. */
      propertiesOf.set(keyOf(targetId), target.value.properties);
      continue;
    }

    /* A 404 IS THE FINDING. It is the one status that proves the reference does
     * not resolve for this connection, and the rule reached its judgement — so
     * NO drop-out is recorded and the entry stays judgeable. Every other status
     * means the rule never got an answer, which is a gap and not a defect: a
     * dead link claimed out of a rate limit is a defect the scan invented. The
     * status is read as a NUMBER, never parsed out of the cause string. */
    manifest.mark({
      id: key, unit: REF001_UNIT, stage: 'resolved',
      ref: { ...referenceFacts(manifest, key), resolveCause: target.cause },
      loss: target.status === 404 ? null : { cause: `target could not be retrieved — ${target.cause}`, bounded: true, target: 'unreachable' },
    });
  }

  /* -- REQ001: the pairs, and the hydration they need ---------------------- */
  await hydrateRequiredProperties({
    manifest, observer, port,
    decls: config.rules,
    rootKey: keyOf(root.id),
    childKeys,
    resourceKind,
    propertiesOf,
    say,
  });

  /* -- UNQ001: the pairs, over the maps REQ001 already cached -------------- */
  /* SECOND, AND THE ORDER IS THE OPTIMISATION. Both rules read page properties
   * (hydration map §1.4), and this stage reuses `propertiesOf`, so a resource in
   * both scopes is retrieved once. */
  /* SET BEFORE THE AWAIT, not after. A refusal returns from inside the stage,
   * and the placeholder must not be declared on that path either. */
  uniquenessStageRan = true;
  const refusal = await hydrateUniquenessScopes({
    manifest, observer, port,
    decls: config.rules,
    rootKey: keyOf(root.id),
    childKeys,
    resourceKind,
    propertiesOf,
    say,
  });
  if (refusal !== null) {
    /* REFUSED, NOT DEGRADED — see UNQ001_SCOPE_CEILING. `finish(true)` sets
     * `didNotRunAsDeclared`, which ADR-0008 decision 2 routes to exit 4 ahead
     * of every other condition. No coverage claim is published. */
    say(refusal);
    return finish(true);
  }

  /* The traversal ends here. Judgement belongs to the rules and happens in
   * finish(), which every exit path above goes through. */
  return finish();
}

/* ----------------------------------------------------- property hydration -- */

/**
 * Declare one (resource, property) pair. The facts are STRUCTURE, written by
 * the site that knows them.
 *
 * MODULE-LEVEL, because two callers need it and they run at different times:
 * the hydration stage, and `finish()` on a scan that ended before hydration.
 */
function declarePair(manifest: Manifest, resource: string, property: string, loss: Loss | null = null): void {
  manifest.mark({
    id: pairKey(resource, property),
    unit: REQ001_UNIT,
    stage: 'declared',
    /* The resource ID and the CONFIGURED property name. Neither is a page
     * title, so this label is safe on every rendered line. */
    alias: `${resource} · "${property}"`,
    safeLabel: `${resource} · "${property}"`,
    req: { resource, property, propertyId: null },
    ...(loss ? { loss } : {}),
  });
}

/**
 * A configured REQ001 rule that never reached the hydration stage.
 *
 * ⛔ WITHOUT THIS, A CONFIGURED RULE VANISHES FROM THE REPORT ON EVERY EARLY
 * RETURN. The hydration stage runs after the traversal, and three paths return
 * before it: a failed auth, an unreachable declared root, and a failed root
 * enumeration. On all three the pairs were never declared, so REQ001 had an
 * empty applicable set, LEFT the coverage vector under ADR-0011 decision 6, and
 * the run was byte-identical to one where no rule had been configured at all.
 * The floor the operator declared was silently not applied.
 *
 * The run is already exiting 2 or 4 on those paths, so this was never a false
 * green. It was a MISSING DISCLOSURE: CONTEXT.md's Gap entry says a drop-out
 * "produces a gap in every rule whose coverage items depended on it", and this
 * is that gap for the rule that depended on the whole traversal.
 *
 * Idempotent by construction: it declares nothing when the hydration stage
 * already declared something, so the normal path never reaches it.
 */
function declarePairsNeverEnumerated(manifest: Manifest, decls: RuleDecl[]): void {
  const req = decls.filter(d => d.rule === 'REQ001');
  if (req.length === 0 || manifest.count(REQ001_UNIT) > 0) return;
  for (const decl of req) {
    const scope = hyphenate(decl.scope.id) ?? decl.scope.id;
    declarePair(manifest, scope, decl.property, {
      cause: 'scan-ended-before-hydration — the scan returned before this scope could be enumerated, so its (resource, property) pairs were never listed',
      /* Bounded: the scope is named. What is unknown is how many resources sit
       * under it, and that is the traversal's own gap, reported there. */
      bounded: true,
      target: 'unreachable',
    });
  }
}

/**
 * A configured UNQ001 rule whose scope was never enumerated — #59.
 *
 * The REQ001 sibling above, for the same three early-return paths and the same
 * reason: without it a configured rule has an empty applicable set, LEAVES the
 * coverage vector under ADR-0011 decision 6, and the run is byte-identical to
 * one where no rule was configured.
 *
 * ⚠ ONE ENTRY, NOT `C(n,2)` OF THEM, AND THE ENTRY IS NOT A PAIR. This is the
 * one place in the build where an entry under the pair unit has no participants,
 * and it is stated rather than hidden: the scope was never enumerated, so `n` is
 * unknown and no pair can be named. Registering a guessed count would put an
 * invented number in a denominator — the direction ADR-0013 decision 3 forbids
 * for exactly this shape of unknown. The entry carries `unq: null`, so
 * `judgeable` rejects it on the loss, `findingsFrom` skips it on the missing
 * facts, and it reaches the report as one bounded gap naming the scope.
 *
 * ⛔ GUARDED ON WHETHER THE STAGE RAN, NOT ON WHETHER IT LEFT ENTRIES — and the
 * difference is not pedantic. Its REQ001 sibling can guard on the entry count
 * because that stage declares at least one pair per declaration, always. This
 * one cannot: `C(1,2)` is ZERO, so a scope holding exactly one resource is
 * hydrated, compared, and correctly leaves no entry — whereupon an entry-count
 * guard reads that as "the stage never ran" and declares a gap over a scope
 * that had nothing to compare. The same misread fired on a refused run, where
 * it invented a denominator of 1 for a scope of 1,001 resources. Both were
 * caught by CHECK-unq001.ts TEST 8 and TEST 11.
 */
function declareScopesNeverEnumerated(manifest: Manifest, decls: RuleDecl[], stageRan: boolean): void {
  const unq = decls.filter(d => d.rule === 'UNQ001');
  if (unq.length === 0 || stageRan) return;
  for (const decl of unq) {
    const scope = hyphenate(decl.scope.id) ?? decl.scope.id;
    declareUnenumerableScope(
      manifest,
      scope,
      decl.property,
      'scan-ended-before-hydration — the scan returned before this uniqueness scope could be enumerated, so its resource pairs were never listed',
    );
  }
}

/**
 * Register REQ001's pairs and read the property maps they need — #58.
 *
 * WHY THERE IS A SECOND RETRIEVE AT ALL. The traversal issues `GET /v1/pages`
 * for the declared root and for nothing else: every descendant arrives as a
 * `child_page` BLOCK inside its parent's listing, and a block carries no
 * properties. So a rule about properties needs a stage the scan did not have,
 * and `docs/spec/v0.1-hydration-map.md` §1.3 priced it as one retrieve per
 * in-scope resource. The root's own map is reused rather than re-fetched,
 * because it was already returned by the retrieve the traversal made.
 *
 * EVERY FAILURE HERE IS A GAP AND NONE OF THEM IS A VIOLATION. That is not
 * generosity toward the workspace; it is the only sound reading. A page the
 * hydration could not retrieve, a response with no property map, and a map with
 * no such property are all consistent with a grant that is narrower than the
 * config, and none of them proves anything about the operator's content.
 */
async function hydrateRequiredProperties(args: {
  manifest: Manifest;
  observer: Observer;
  port: NotionPort;
  decls: RuleDecl[];
  rootKey: string;
  childKeys: string[];
  resourceKind: Map<string, 'page' | 'data-source'>;
  /** Maps already returned by the traversal, so the root is not retrieved twice. */
  propertiesOf: Map<string, Record<string, unknown> | undefined>;
  say: (s?: string) => void;
}): Promise<void> {
  const { manifest, observer, port, decls, rootKey, childKeys, resourceKind, propertiesOf, say } = args;
  /* FILTERED BY RULE, and it was not until UNQ001 arrived — #59. This stage
   * took `config.rules` whole while REQ001 was the only configured rule, so a
   * UNQ001 declaration would have been registered as a (resource, property)
   * pair under REQ001's unit and reported under REQ001's name. The filter lives
   * here rather than at the call site so a third configured rule cannot reach
   * this loop by being passed the whole list. */
  const req = decls.filter(d => d.rule === 'REQ001');
  if (req.length === 0) return;

  const toHydrate: { resource: string; property: string }[] = [];

  for (const decl of req) {
    const scope = hyphenate(decl.scope.id) ?? decl.scope.id;
    /* Spec §1.1 descends ONE level, so a scope is either the declared root —
     * which selects the root and its children — or one enumerated child, which
     * selects itself. A scope naming anything else selected nothing, and that
     * is reported rather than skipped. */
    const inScope = scope === rootKey ? [rootKey, ...childKeys] : childKeys.includes(scope) ? [scope] : [];

    if (inScope.length === 0) {
      /* THE PAIRS UNDER AN UNENUMERATED SCOPE ARE UNENUMERABLE, WHICH IS A GAP
       * AND NOT AN EMPTY SET. Registering nothing would take the whole
       * declaration out of the denominator, and a rule that counts nothing
       * reports a ratio of 1.0 over the pairs it did manage to check. */
      declarePair(manifest, scope, decl.property, {
        cause: 'scope-not-enumerated — the configured scope is not a resource this scan enumerated, so the pairs beneath it cannot be listed',
        bounded: true,
        target: 'unreachable',
      });
      continue;
    }

    for (const resource of inScope) {
      if (resourceKind.get(resource) === 'data-source') {
        /* Same ruling as REF001's database target and #50's data source: the
         * tool's inability to enumerate one kind of object is DISCLOSED as a
         * gap, never converted into a defect in the workspace and never taken
         * out of the denominator. */
        declarePair(manifest, resource, decl.property, { cause: DATA_SOURCE_CAUSE, bounded: true, target: 'present' });
        continue;
      }
      declarePair(manifest, resource, decl.property);
      toHydrate.push({ resource, property: decl.property });
    }
  }

  /* One retrieve per resource, however many properties are required of it.
   * Grouping is what keeps the request budget linear in resources rather than
   * in (resource, property) pairs. */
  const byResource = new Map<string, string[]>();
  for (const { resource, property } of toHydrate) byResource.set(resource, [...(byResource.get(resource) ?? []), property]);

  for (const [resource, properties] of byResource) {
    let map = propertiesOf.get(resource);

    if (!propertiesOf.has(resource)) {
      const fetched = await observer.observe(`GET /v1/pages/${resource}`, () => port.retrievePage(resource));
      if (fetched.state === 'unreachable') {
        for (const property of properties) {
          manifest.mark({
            id: pairKey(resource, property), unit: REQ001_UNIT, stage: 'declared',
            /* UNREACHABLE, not present: the call about the resource itself
             * failed, and a 404 is access failure or object absence with no way
             * to tell which. */
            loss: { cause: `property hydration failed — ${fetched.cause}`, bounded: true, target: 'unreachable' },
          });
        }
        continue;
      }
      map = fetched.value.properties;
      propertiesOf.set(resource, map);
    }

    if (map === undefined) {
      for (const property of properties) {
        manifest.mark({
          id: pairKey(resource, property), unit: REQ001_UNIT, stage: 'declared',
          /* PRESENT: the page itself was retrieved. What is missing is the map. */
          loss: { cause: 'property hydration incomplete — the page response carried no properties map', bounded: true, target: 'present' },
        });
      }
      continue;
    }

    for (const property of properties) {
      const id = pairKey(resource, property);
      /* The map was READ. That fact is recorded whatever the property turns out
       * to be, because it is what separates "the scan could not look" from "the
       * scan looked and the property was not there". */
      manifest.mark({ id, unit: REQ001_UNIT, stage: 'resolved' });

      const reading = readProperty(map, property);
      if (reading.state === 'absent') {
        /* ⛔ NOT A VIOLATION, AND THIS IS THE ONE LINE THE RULE TURNS ON. The
         * API returns the properties the integration can SEE, so an absent
         * property is "not defined here" OR "not granted" and the scan cannot
         * tell which. Reporting it as a violation reports a defect in the
         * operator's workspace that is really a defect in the grant. */
        manifest.mark({
          id, unit: REQ001_UNIT, stage: 'resolved',
          loss: {
            cause: `property-not-in-map — "${property}" is not in the property map this connection can see, which is either an undefined property or an ungranted one`,
            bounded: true,
            target: 'present',
          },
        });
        continue;
      }

      /* The property was LOCATED, and the ID observed on it is recorded here —
       * the other half of ADR-0010 decision 7's matchkey hierarchy. */
      manifest.mark({
        id, unit: REQ001_UNIT, stage: 'enumerated',
        req: { resource, property, propertyId: reading.propertyId },
      });

      if (reading.state === 'unreadable') {
        manifest.mark({
          id, unit: REQ001_UNIT, stage: 'enumerated',
          loss: {
            cause: `property-shape-unread — "${property}" is present and this build cannot read its value`,
            bounded: true,
            target: 'present',
          },
        });
        continue;
      }

      /* `fetched` MEANS THE PROPERTY CARRIED A VALUE. A property that is present
       * and empty stops here, judgeable and unfilled, which is the violation. */
      if (reading.state === 'value') manifest.mark({ id, unit: REQ001_UNIT, stage: 'fetched' });
    }
  }

  say(`required properties: ${manifest.count(REQ001_UNIT)} (resource, property) pair(s) declared.`);
}

/* ------------------------------------------------------ uniqueness pairs -- */

/**
 * The largest uniqueness scope this build will materialise pairs for — #59.
 *
 * ⭐ 1,000 RESOURCES IS 499,500 PAIRS, AND THE CEILING EXISTS BECAUSE THE
 * DENOMINATOR IS QUADRATIC. `docs/spec/v0.1-hydration-map.md` §4.1 documents a
 * 10,000-row data-source ceiling, and a 10,000-member scope is ~50 million pair
 * entries — inside the documented ceiling and not viable in one Manifest.
 *
 * WHY MATERIALISE AT ALL. `evaluateStage` marks `evaluated` by intersecting
 * every applicable rule's judgement over `manifest.of(rule.unit)`, implementing
 * ADR-0005 decision 5. Entries under a pair-shaped unit therefore have to BE
 * pairs; holding resource-shaped entries there is the collapse ADR-0011 exists
 * to stop.
 *
 * Revisit if: a real configuration needs uniqueness above this. The answer is a
 * streaming counter computing `C(k,2)` and `C(n,2)` without materialising, which
 * means changing the `evaluated` intersection — a blast radius #59 does not
 * carry.
 */
export const UNQ001_SCOPE_CEILING = 1000;

/** `n(n−1)/2`, named once so the refusal message and the tests read the same arithmetic. */
export const pairCount = (n: number): number => (n * (n - 1)) / 2;

/**
 * Declare a uniqueness scope whose pairs cannot be listed. See
 * `declareScopesNeverEnumerated` for why this entry has no participants.
 */
function declareUnenumerableScope(manifest: Manifest, scope: string, property: string, cause: string): void {
  manifest.mark({
    /* NO `+` IN THIS KEY, deliberately: `unqPairKey` puts one between the two
     * participants, and a reader scanning the GAPS section can tell a named
     * pair from an unenumerable scope without parsing either. */
    id: `unq:${scope}#${property}`,
    unit: UNQ001_UNIT,
    stage: 'declared',
    alias: `${scope} · "${property}" · uniqueness scope, not enumerated`,
    safeLabel: `${scope} · "${property}" · uniqueness scope, not enumerated`,
    /* Bounded: the scope is named. What is unknown is how many resources sit
     * under it, and that is the traversal's own gap, reported there. */
    loss: { cause, bounded: true, target: 'unreachable' },
  });
}

/**
 * One member of a uniqueness scope, as the comparison sees it.
 *
 * A BLOCKED MEMBER CARRIES THE FURTHEST STAGE IT REACHED, not a boolean, because
 * ADR-0005 decision 1 splits evidence sufficiency along exactly that line and
 * the three failures have three different remedies:
 *
 *   declared    the map was never read — refused page, no map in the response,
 *               a data source this slice cannot enumerate. `unreached`.
 *   resolved    the map was read and the property was not in it. Still
 *               `unreached`: an ungranted property and an undefined one are the
 *               same response, and both are answered by widening the grant.
 *   enumerated  the property was located and its value cannot be compared.
 *               `undecidable` — neither sharing more nor re-running helps.
 *
 * Collapsing any two of them sends the operator the wrong instruction.
 */
type MemberStage = 'declared' | 'resolved' | 'enumerated';

type ScopeMember =
  | { ok: true; comparable: string | null; propertyId: string | null }
  | { ok: false; stage: MemberStage; loss: Loss };

/** How far a member got. An `ok` member reached the end of the member's own funnel. */
const memberStage = (m: ScopeMember): MemberStage => (m.ok ? 'enumerated' : m.stage);

/**
 * A PAIR REACHES THE LESSER OF ITS TWO MEMBERS' STAGES. One member whose map was
 * never read leaves the pair unresolved however completely the other one was
 * read — the comparison is over both or it is over nothing.
 */
const RANK: Record<MemberStage, number> = { declared: 0, resolved: 1, enumerated: 2 };
const lesserStage = (a: MemberStage, b: MemberStage): MemberStage => (RANK[a] <= RANK[b] ? a : b);

/**
 * Register UNQ001's pairs and read the values they compare — #59.
 *
 * THE HYDRATION IS ALREADY PAID FOR. `docs/spec/v0.1-hydration-map.md` §1.4 puts
 * UNQ001 at page properties, identical to REQ001, so this stage runs AFTER
 * `hydrateRequiredProperties` and shares its `propertiesOf` cache. A resource in
 * both rules' scopes is retrieved once.
 *
 * ⛔ RETURNS A REFUSAL STRING RATHER THAN DEGRADING. A scope above the ceiling
 * ends the run at exit 4 through `finish(true)`. Silently switching to a
 * resource-denominated figure at scale is the false green this product exists to
 * detect, and it is the one the operator would be least able to see.
 *
 * ⚠ THE CEILING CANNOT BE CHECKED BEFORE THE TRAVERSAL, and #59's build note
 * saying it exits "before traversal, the same shape `unimplementedRules` uses"
 * is wrong on that one point. A config declares a scope by ID and never by size,
 * so `n` is not known until the scope is enumerated; `cli.ts`'s pre-flight has
 * nothing to test. The refusal fires here, at the point pairs would be
 * materialised, and routes through the existing `didNotRunAsDeclared` seam
 * rather than adding a second exit path.
 */
async function hydrateUniquenessScopes(args: {
  manifest: Manifest;
  observer: Observer;
  port: NotionPort;
  decls: RuleDecl[];
  rootKey: string;
  childKeys: string[];
  resourceKind: Map<string, 'page' | 'data-source'>;
  propertiesOf: Map<string, Record<string, unknown> | undefined>;
  say: (s?: string) => void;
}): Promise<string | null> {
  const { manifest, observer, port, decls, rootKey, childKeys, resourceKind, propertiesOf, say } = args;
  const unq = decls.filter(d => d.rule === 'UNQ001');
  if (unq.length === 0) return null;

  /* ⭐ TWO PASSES, AND THE FIRST ONE MARKS NOTHING. The refusal message says
   * "Nothing was compared", and a single pass makes that false the moment two
   * scopes are configured and the second is the oversized one: the first
   * scope's pairs are already in the manifest and already compared. Checking
   * every ceiling before materialising any pair is what makes the refusal
   * atomic, and the sentence true. */
  const scoped = unq.map(decl => {
    const scope = hyphenate(decl.scope.id) ?? decl.scope.id;
    /* Spec §1.1 descends ONE level, the same reading REQ001's hydration takes:
     * a scope is either the declared root — which selects the root and its
     * children — or one enumerated child, which selects itself. */
    const inScope = scope === rootKey ? [rootKey, ...childKeys] : childKeys.includes(scope) ? [scope] : [];
    return { decl, scope, inScope };
  });

  for (const { scope, inScope } of scoped) {
    if (inScope.length > UNQ001_SCOPE_CEILING) {
      /* The arithmetic is IN the message. A refusal that says "too large" tells
       * the operator nothing they can act on; the three numbers tell them what
       * the scope costs and how far over it is. */
      return (
        `UNQ001 REFUSED — the uniqueness scope ${scope} holds ${inScope.length} resources, and its coverage item is unordered PAIRS: ` +
        `${pairCount(inScope.length).toLocaleString('en-US')} of them, against a ceiling of ${UNQ001_SCOPE_CEILING} resources ` +
        `(${pairCount(UNQ001_SCOPE_CEILING).toLocaleString('en-US')} pairs). Nothing was compared. ` +
        `The scan refuses rather than reporting a resource-shaped percentage, which would claim coverage over comparisons it never made.`
      );
    }
  }

  for (const { decl, scope, inScope } of scoped) {
    if (inScope.length === 0) {
      /* THE PAIRS UNDER AN UNENUMERATED SCOPE ARE UNENUMERABLE, WHICH IS A GAP
       * AND NOT AN EMPTY SET. Registering nothing would take the declaration
       * out of the denominator, and a rule that counts nothing reports a ratio
       * of 1.0 over the pairs it did manage to check. */
      declareUnenumerableScope(
        manifest,
        scope,
        decl.property,
        'scope-not-enumerated — the configured uniqueness scope is not a resource this scan enumerated, so the resources beneath it cannot be listed',
      );
      continue;
    }

    /* -- one reading per member, before any pair is considered -------------- */

    const members = new Map<string, ScopeMember>();

    for (const resource of inScope) {
      if (resourceKind.get(resource) === 'data-source') {
        /* Same ruling as REF001's database target, #50's data source and
         * REQ001's: the tool's inability to enumerate one kind of object is
         * DISCLOSED as a gap, never converted into a defect in the workspace
         * and never taken out of the denominator. The property was not located,
         * so this is `unreached`. */
        members.set(resource, { ok: false, stage: 'declared', loss: { cause: DATA_SOURCE_CAUSE, bounded: true, target: 'present' } });
        continue;
      }

      let map = propertiesOf.get(resource);
      if (!propertiesOf.has(resource)) {
        const fetched = await observer.observe(`GET /v1/pages/${resource}`, () => port.retrievePage(resource));
        if (fetched.state === 'unreachable') {
          members.set(resource, {
            ok: false,
            stage: 'declared',
            /* UNREACHABLE, not present: the call about the resource itself
             * failed, and a 404 is access failure or object absence with no way
             * to tell which. */
            loss: { cause: `property hydration failed — ${fetched.cause}`, bounded: true, target: 'unreachable' },
          });
          continue;
        }
        map = fetched.value.properties;
        propertiesOf.set(resource, map);
      }

      if (map === undefined) {
        members.set(resource, {
          ok: false,
          stage: 'declared',
          /* PRESENT: the page itself was retrieved. What is missing is the map. */
          loss: { cause: 'property hydration incomplete — the page response carried no properties map', bounded: true, target: 'present' },
        });
        continue;
      }

      const reading = readProperty(map, decl.property);

      if (reading.state === 'absent') {
        /* NOT A VIOLATION, and the same line REQ001 turns on: the API returns
         * the properties the integration can SEE, so an absent property is
         * "not defined here" OR "not granted" and the scan cannot tell which. */
        members.set(resource, {
          ok: false,
          stage: 'resolved',
          loss: {
            cause: `property-not-in-map — "${decl.property}" is not in the property map this connection can see, which is either an undefined property or an ungranted one`,
            bounded: true,
            target: 'present',
          },
        });
        continue;
      }

      if (reading.state === 'unreadable') {
        members.set(resource, {
          ok: false,
          stage: 'enumerated',
          loss: { cause: `property-shape-unread — "${decl.property}" is present and this build cannot read its value`, bounded: true, target: 'present' },
        });
        continue;
      }

      if (reading.state === 'value' && reading.comparable === null) {
        /* Located, present, and this build renders no comparable for its shape
         * — a number, a checkbox, a select. REQ001 correctly calls it a value;
         * UNQ001 will not guess at what makes two of them the same one. See
         * `PropertyReading.comparable`. */
        members.set(resource, {
          ok: false,
          stage: 'enumerated',
          loss: {
            cause: `property-shape-uncomparable — "${decl.property}" carries a value this build will not compare for uniqueness`,
            bounded: true,
            target: 'present',
          },
        });
        continue;
      }

      /* ⭐ DECISION 1, HERE AND NOWHERE ELSE. An empty property yields a null
       * comparable, and `collides` never matches a null against anything. The
       * member is otherwise ORDINARY: its pairs are declared, compared and
       * counted toward the evaluated set. Emptiness changes the comparison
       * predicate, never the coverage arithmetic. */
      members.set(resource, {
        ok: true,
        comparable: reading.state === 'value' ? reading.comparable : null,
        propertyId: reading.propertyId,
      });
    }

    /* -- then every unordered pair ----------------------------------------- */

    /* `j = i + 1` IS THE UNORDERED HALF. Iterating the full cross product would
     * register `(A,B)` and `(B,A)` — one coverage item counted twice, against
     * the rule whose denominator is the thing most likely to be got wrong. */
    for (let i = 0; i < inScope.length; i++) {
      for (let j = i + 1; j < inScope.length; j++) {
        const [a, b] = orderPair(inScope[i]!, inScope[j]!);
        const id = unqPairKey(a, b, decl.property);
        const label = `${a} + ${b} · "${decl.property}"`;

        manifest.mark({
          id,
          unit: UNQ001_UNIT,
          stage: 'declared',
          /* Two resource IDs and the CONFIGURED property name. Neither is a
           * page title, so this label is safe on every rendered line. */
          alias: label,
          safeLabel: label,
        });

        /* `a` and `b` come out of `orderPair` sorted, and `members` is keyed on
         * the resource ID, so `ma` belongs to `participants[0]` by
         * construction. `UnqFacts.propertyIds` is positional against that same
         * order — the finding anchors on a RESOURCE and needs the ID observed
         * on THAT resource, not on its co-participant. */
        const ma = members.get(a)!;
        const mb = members.get(b)!;

        /* The pair reached the lesser of its two members' stages. */
        const reached = lesserStage(memberStage(ma), memberStage(mb));
        if (RANK[reached] >= RANK.resolved) manifest.mark({ id, unit: UNQ001_UNIT, stage: 'resolved' });
        if (RANK[reached] >= RANK.enumerated) manifest.mark({ id, unit: UNQ001_UNIT, stage: 'enumerated' });

        if (!ma.ok || !mb.ok) {
          /* THE PAIR INHERITS THE BLOCKED MEMBER THAT GOT LEAST FAR. Where both
           * are blocked, reporting the further one would name a remedy that
           * does not unblock the pair: telling the operator to teach the tool a
           * property shape is useless while the other member's page is refused.
           * ADR-0005 decision 1's `unreached`-over-`undecidable` precedence is
           * the same ordering, read one level down. */
          const blocked = [ma, mb].filter((m): m is Extract<ScopeMember, { ok: false }> => !m.ok);
          const worst = blocked.reduce((w, m) => (RANK[m.stage] < RANK[w.stage] ? m : w));
          manifest.mark({ id, unit: UNQ001_UNIT, stage: reached, loss: worst.loss });
          continue;
        }

        /* The comparison RAN. For this rule that is the same condition as
         * judgeable — see the stage reading in unq001.ts's header. */
        manifest.mark({
          id,
          unit: UNQ001_UNIT,
          stage: 'fetched',
          /* ⛔ THE ANSWER, NEVER THE VALUE. `collides` compares in memory and
           * what reaches the manifest is a boolean. */
          unq: {
            participants: [a, b],
            property: decl.property,
            propertyIds: [ma.propertyId, mb.propertyId],
            duplicate: collides(ma.comparable, mb.comparable),
          },
        });
      }
    }

    if (inScope.length === 1) {
      /* DISCLOSED RATHER THAN SILENT. `C(1,2)` is zero, so this declaration
       * contributes no coverage item and the rule LEAVES the vector under
       * ADR-0011 decision 6. That is the correct arithmetic — one resource
       * cannot repeat a value against anything — but a configured rule
       * producing no row looks like a rule that did not run, and the operator
       * cannot tell the two apart from the report alone. */
      say(`uniqueness: scope ${scope} holds ONE resource, so it has no pairs to compare and contributes no coverage row.`);
    }
  }

  say(`uniqueness: ${manifest.count(UNQ001_UNIT)} resource pair(s) declared.`);
  return null;
}

/* ------------------------------------------------------ reference recording -- */

/** A target to retrieve, with what the discovering shape said about its kind. */
type ResolutionTarget = { targetId: string; targetKind: TargetKind };

/** Read back what discovery recorded, so the resolution step adds to it rather than replacing it. */
function referenceFacts(manifest: Manifest, key: string) {
  const e = manifest.of(REF001_UNIT).find(x => x.key === key);
  return e?.ref ?? { targetId: null, targetKind: 'unknown' as TargetKind, href: null, via: 'unrecorded route', sourcePage: '(unrecorded page)', sourceBlock: '(unrecorded block)', resolveCause: null };
}

/**
 * Put every discovered reference into the manifest and return the targets to
 * resolve.
 *
 * EXTERNAL REFERENCES ARE NOT RECORDED. Spec §6 test 4: a plain
 * `https://example.com/blog` must not change REF001's coverage ratio. Without
 * that exclusion, step 5's deliberate over-reporting is unbounded and every scan
 * is permanently qualified — which spec §7 already names as the failure mode
 * that makes the disclosure stop being read.
 *
 * AN UNRECOGNISED CANDIDATE IS RECORDED AND STOPS AT `declared`. It is in the
 * denominator, it lowers the ratio, and it names its containing page, its block
 * and its href. It produces no finding, because nothing about the target was
 * established (spec §7).
 */
function registerReferences(manifest: Manifest, refs: Reference[]): ResolutionTarget[] {
  const targets: ResolutionTarget[] = [];

  for (const r of refs) {
    if (r.kind === 'external') continue;

    if (r.kind === 'unrecognised') {
      const loss: Loss = {
        /* SPECIFIC AND MACHINE-READABLE, and the two values are the only two the
         * spec defines. `skipped: error` is banned by ADR-0005 decision 5
         * constraint 2, and the evidence — the href — is attached, which makes
         * the drop-out explained rather than unexplained. */
        cause: `${r.cause} — ${redactHref(r.href)}`,
        /* Bounded: the candidate is named and counted. */
        bounded: true,
        /* NOT A CLAIM ABOUT THE TARGET. `unreachable` here means the scan did
         * not reach it, which is what the manifest can prove; there is no
         * target state on the finding, because there is no finding. */
        target: 'unreachable',
      };
      manifest.mark({
        id: refKey(r.href), unit: REF001_UNIT, stage: 'declared',
        alias: `→ ${r.href}`,
        safeLabel: `→ ${redactHref(r.href)}`,
        loss,
        ref: { targetId: null, targetKind: 'unknown', href: r.href, via: `unrecognised(${r.cause})`, sourcePage: r.sourcePage, sourceBlock: r.sourceBlock, resolveCause: null },
      });
      continue;
    }

    const key = refKey(r.targetId);
    const safe = r.href ? redactHref(r.href) : r.targetId;
    manifest.mark({
      id: key, unit: REF001_UNIT, stage: 'declared',
      alias: `→ ${r.href ?? r.targetId}`,
      safeLabel: `→ ${safe}`,
      ref: { targetId: r.targetId, targetKind: r.targetKind, href: r.href, via: r.via, sourcePage: r.sourcePage, sourceBlock: r.sourceBlock, resolveCause: null },
    });
    /* Classified to a target: the reference is RESOLVED whatever the target
     * turns out to be. Resolution of the link and retrieval of the target are
     * two different facts and the funnel keeps them apart. */
    manifest.mark({ id: key, unit: REF001_UNIT, stage: 'resolved' });
    if (!targets.some(t => t.targetId === r.targetId)) targets.push({ targetId: r.targetId, targetKind: r.targetKind });
  }

  return targets;
}
