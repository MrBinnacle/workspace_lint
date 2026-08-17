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
 *   4. THE EXIT BYTE STOPS BEING TRUSTWORTHY WITHOUT #49, and this file does not
 *      pretend otherwise. deriveVerdict compares the FUNNEL scalar; ADR-0011
 *      decision 5 makes the threshold a floor on every rule, i.e. the MINIMUM of
 *      the vector. Those were one number in T2 and are two now. verdict.ts is
 *      copied verbatim from a frozen prototype, so the fix is an ADR (#49) and
 *      not an edit here. What this slice does instead is MEASURE the divergence
 *      and hand it to the report, which discloses it per run. See
 *      `ScanResult.byteBasis`.
 *
 * WHAT STILL DOES NOT REACH `evaluated`: a resource that stalled before
 * `fetched`, a resource that reached `fetched` carrying a drop-out cause, and
 * now a reference the recogniser could not classify. All three are reported.
 */

import type { Config } from './config.js';
import type { NotionPort } from './notion-port.js';
import { createObserver, listAllChildren, readBlockTree, type Call } from './observed.js';
import { Manifest, gapsFrom, RESOURCES, type Loss } from './manifest.js';
import { deriveVerdict, type Gap, type Verdict } from './verdict.js';
import { SYS001 } from './sys001.js';
import { REF001, REF001_UNIT, refKey } from './ref001.js';
import { dedupeReferences, extractReferences, redactHref, type Reference, type TargetKind } from './references.js';
import type { Rule } from './rule.js';
import { headlineCoverage, type CoverageRow, type Finding, type Outcome } from './finding.js';

const DATA_SOURCE_CAUSE =
  'data-source enumeration is not implemented in this slice — rows and schemas are REQ001/UNQ001 concerns, out of scope per spec §1.2';

/**
 * Which figure the exit byte was actually computed on, and which figure
 * ADR-0011 decision 5 requires.
 *
 * MEASURED RATHER THAN ASSERTED, because the two coincide whenever one rule has
 * an empty applicable set and a reader would otherwise conclude the byte is
 * sound from a run where the question never arose.
 */
export type ByteBasis = {
  /** What deriveVerdict compared: evaluated/applicable over RESOURCES. */
  funnel: number;
  /** What ADR-0011 decision 5 requires: the minimum over the coverage vector. */
  vectorMinimum: CoverageRow | null;
  declaredThreshold: number;
  /**
   * True when the two figures fall on opposite sides of the declared threshold.
   * That is the only case where the divergence changes the byte, and it is the
   * false green #49 exists to close.
   */
  byteWouldDiffer: boolean;
};

export type ScanResult = {
  manifest: Manifest;
  verdict: Verdict;
  gaps: Gap[];
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

export async function scan(opts: ScanOptions): Promise<ScanResult> {
  const { config, port } = opts;
  const deriveGaps = opts.deriveGaps ?? gapsFrom;
  const rules = opts.rules ?? [SYS001, REF001];
  const now = opts.now ?? (() => Date.now());

  const t0 = now();
  const observer = createObserver();
  const manifest = new Manifest();
  const log: string[] = [];
  const say = (s = '') => log.push(s);
  let externalReferences = 0;

  const finish = (didNotRunAsDeclared = false): ScanResult => {
    /* THE RULES RUN HERE, NOT AT THE END OF THE TRAVERSAL, because every early
     * return above is also a scan whose coverage has to be judged. An
     * unreachable declared root is SYS001's headline finding, and it leaves
     * through the second return in this function. */
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

    /* #49, MEASURED. deriveVerdict was handed the funnel scalar because
     * verdict.ts is frozen verbatim from the prototype (spec §5) and what it
     * compares is a decision that goes in an ADR before it goes in code. The
     * scan therefore computes the figure ADR-0011 decision 5 actually requires
     * and hands both to the report, which discloses the divergence per run. A
     * byte reported without that disclosure would be a coverage claim over a
     * comparison the run did not make. */
    const vectorMinimum = headlineCoverage(coverage);
    const byteBasis: ByteBasis = {
      funnel: verdict.coverage,
      vectorMinimum,
      declaredThreshold: config.minCoverage,
      byteWouldDiffer:
        !didNotRunAsDeclared &&
        vectorMinimum !== null &&
        vectorMinimum.ratio < config.minCoverage &&
        verdict.coverage >= config.minCoverage,
    };

    return {
      manifest, verdict, gaps, findings, coverage, outcomes, byteBasis, externalReferences,
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
  manifest.mark({ id: root.id, alias: rootAlias, stage: 'resolved' });
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
  for (const c of children) manifest.mark({ id: c.id, alias: titleOf(c), stage: 'declared' });
  for (const c of children) manifest.mark({ id: c.id, alias: titleOf(c), stage: 'resolved' });

  /* -- descend one level -------------------------------------------------- */
  for (const c of children) {
    const alias = titleOf(c);
    if (c.type === 'child_database') {
      /* A NAMED gap. Bounded, because the resource is named and counted, and
       * present, because its block was returned in the parent's listing. */
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

  /* The traversal ends here. Judgement belongs to the rules and happens in
   * finish(), which every exit path above goes through. */
  return finish();
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
