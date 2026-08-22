/* Rendering. Extracted from scan.ts.
 *
 * The split is not cosmetic. scan.ts held traversal AND rendering, so it changed
 * for two unrelated reasons — and #43 (SYS001) and #44 (REF001) are meant to run
 * in parallel, both landing on the traversal half, while #45 (Markdown and
 * byte-stable JSON) lands on this half. Three tickets, one file, is a merge
 * conflict inside the coverage instrument.
 *
 * Dependency runs one way: this file imports the scan's result type, and the
 * scan knows nothing about rendering.
 */

import { STAGES, type Residual, type Stage } from './manifest.js';
import type { Attestation } from './notion-port.js';
import { ANCHOR_TEXT_ABSENT, ANCHOR_TEXT_REDACTED, anchorKey, formatRow, headlineCoverage, LINK_NOT_CAPTURED, type CoverageRow, type FindingSource } from './finding.js';
import { canonicalize, NORMALIZATION_VERSION, VOLATILE_FIELDS } from './normalize.js';
import type { Measurement } from './measurement.js';
import type { ScanResult } from './scan.js';

export type RenderOptions = {
  /**
   * Page titles are redacted by default — CONTEXT.md settled defaults, "a
   * finding in CI names its resource by ID and link, never by title." A title
   * carries workspace content into logs readable by more people than the
   * workspace is. The operator opts in; the default does not.
   */
  showTitles?: boolean;
};

/* ================================================================ document ==
 *
 * ONE DOCUMENT, THREE RENDERERS. The terminal report, the Markdown report and
 * the JSON report all read the structure below and none of them decides
 * anything. #45's ticket states the hazard this closes: "a JSON exporter that
 * serialises the raw `verdict` object rather than the rendered decisions will
 * reintroduce every one of them" — four suppressions, each earned by a shipped
 * defect. Three emitters each remembering four rules is three chances to forget
 * one, and it is the drift hazard ADR-0012 decision 6 closed at the module
 * layer arriving at the render layer.
 * ========================================================================== */

/**
 * A value the report may refuse to publish.
 *
 * THE REFUSAL IS STRUCTURAL, NOT REMEMBERED. `value` does not exist on the
 * unpublished branch, so no renderer can emit a withheld figure — `tsc` rejects
 * the access. A nullable field would have left every emitter free to print
 * `null`, and "printed a zero where the report refused to judge" is precisely
 * what ADR-0005 decision 3 forbids.
 *
 * `because` is machine-readable, and it separates two states a single `null`
 * would collapse: the report DECLINED to publish (disclaimed), versus there was
 * nothing to publish (no subject, or the scan never ran).
 */
export type Suppressible<T> =
  | { published: true; value: T }
  | { published: false; reason: string; because: 'withheld-disclaimed' | 'absent-no-subject' | 'absent-did-not-run' };

const published = <T>(value: T): Suppressible<T> => ({ published: true, value });
const withheld = <T>(reason: string, because: 'withheld-disclaimed' | 'absent-no-subject' | 'absent-did-not-run'): Suppressible<T> =>
  ({ published: false, reason, because });

export type ReportDocument = {
  /** ADR-0004. Which normaliser produced these bytes, and what it removed. */
  normalization: { version: string; excluded: readonly string[] };
  disposition: Suppressible<'unqualified' | 'qualified' | 'disclaimed'>;
  /** ADR-0011 decision 4. Always present: per-rule evidence, not a summary. */
  coverageVector: CoverageRow[];
  headline: Suppressible<CoverageRow>;
  conformityRatio: Suppressible<{ conforming: number; claimed: number; unit: string }>;
  funnel: { evaluated: number; applicable: number; fetched: number; unit: 'resources' };
  /**
   * ADR-0013 decision 5. `attestation` travels with `evidence` or neither is
   * printed — the same instrument as ADR-0005 decision 4's ratio pair. Null when
   * the run performed no enumeration at all, which is a state and not a blank.
   */
  outcomes: { rule: string; conformity: string | null; evidence: string | null; attestation: Attestation | null }[];
  exit: {
    byte: 0 | 1 | 2 | 3 | 4;
    why: string;
    cause: string | null;
    /**
     * ADR-0012 decision 2. The byte basis travels with the byte or neither is
     * published — and ADR-0013 decision 6 puts the RESIDUAL COUNT on the same
     * object for the same reason. The S017 finding was not a missing
     * disclosure: the blind-spine disclosure was already shipping. It was two
     * true statements in different sections with nothing connecting them.
     */
    basis: {
      compared: CoverageRow | null;
      declaredThreshold: number;
      funnelNotCompared: number;
      /** RESOURCES whose enumeration was unattested. Not a count of calls, and not a count of missing items. */
      residuals: number;
      /**
       * Carried on the basis so a zero count can say something TRUE. `0` means
       * two different things — every enumeration was attested, or none produced
       * a listing at all — and one template for both prints a false sentence in
       * whichever case it was not written for.
       */
      attestation: Attestation | null;
    };
  };
  manifest: { resource: string; unit: string; stages: string[]; loss: string | null; isRoot: boolean }[];
  gaps: { resource: string; cause: string; bounded: boolean; isRootMiss: boolean }[];
  /**
   * ADR-0013. NOT gaps. A gap is a coverage item that left the funnel; a
   * residual is a doubt about whether the item was ever in it. They are separate
   * fields on this document so no renderer can merge them into one table and no
   * exporter can sum them.
   */
  residuals: Residual[];
  /**
   * ADR-0017. NOT findings, NOT gaps, NOT residuals. A separate field so no
   * renderer can merge a count into a defect table and no exporter can sum
   * across classes — the identical construction, and the identical reason, as
   * `residuals` directly above.
   */
  measurements: Measurement[];
  findings: {
    rule: string; resource: string; discriminator: Record<string, string>;
    certainty: string; targetState: string; bounded: boolean; isRootMiss: boolean;
    evidence: { object: string; location: string; observed: string; expected: string };
    link: string | null; linkAbsentReason: string | null;
    /**
     * #135, #141. ALREADY RESOLVED — this is the string to print, never the raw
     * anchor text. `buildReportDocument` has applied the reveal decision, so a
     * renderer that prints this field verbatim is correct by construction and a
     * renderer that reaches past the document to `Finding.anchorText` is the
     * leak. Same contract as every other field on this document: the renderers
     * are formatters over an already-decided value.
     *
     * NEVER NULL AND NEVER EMPTY. The three states a reader must be able to
     * tell apart — revealed, withheld, never existed — are three different
     * strings, because one string for two of them prints a false sentence in
     * whichever case it was not written for, and an empty one makes a
     * downstream `includes()` assertion vacuously true.
     */
    anchorText: string;
    /**
     * WHERE THE DEFECT IS — #100. Null for a rule whose subject is the resource
     * itself; the finding type carries the reason at each site. It is on the
     * DOCUMENT rather than computed per renderer, for the same reason every
     * other decision here is: three emitters each remembering to look it up is
     * three chances for one to drop it, and a format that silently omits a
     * field is this product's own defect class appearing in its own output.
     */
    source: FindingSource | null;
    message: string;
  }[];
  disclosures: string[];
  /** ADR-0004. Omitted entirely under `deterministic`; never merely emptied. */
  volatile?: { wallMs: number; requestCount: number; calls: { endpoint: string; status: string; code: string | null }[] };
};

export type DocumentOptions = RenderOptions & {
  /**
   * ADR-0004 decision 5 — SARIF Appendix F.1 names this flag. Drops every field
   * in VOLATILE_FIELDS, which is what makes two runs over an unchanged
   * workspace byte-identical (acceptance criterion 5).
   */
  deterministic?: boolean;
};

/**
 * The per-run disclosures, in one place so all three renderers carry the same
 * ones. Every line states a limit that is NOT visible in any figure — a reader
 * cannot infer them from a clean-looking ratio, which is why they are printed
 * rather than filed.
 */
function DISCLOSURES(r: ScanResult): string[] {
  return [
    /* ADR-0006 decision 2 establishes that the truncation signal covers one
     * endpoint family and that the scan records which endpoints ran blind;
     * decision 5 makes the standing statement a per-run disclosure. Cited
     * separately because the slice spec §3.1 attributes the fact to decision 5,
     * which is the disclosure requirement, not the finding. */
    'GET /v1/blocks/{id}/children carries NO truncation signal (ADR-0006 decision 2).',
    'A complete enumeration and a silently truncated one both return has_more: false.',
    'The traversal spine of this scan is trusted blind, and this run discloses it',
    'rather than hiding it (ADR-0006 decision 5).',
    'request_status is tested positively only; its absence proves nothing either way',
    'and maps to `sufficient` (ADR-0006 decision 3).',
    /* The host set is unbounded — Notion documents custom domains for Sites — so
     * no allow-list can be complete and the residue path is the mechanism. Stated
     * per run so that a future reader cannot re-frame the host list as the
     * soundness mechanism, which is DoD item 2 on #44. */
    'REF001 recognises internal links by a residue path, NOT by an allow-list: the host',
    'set is unbounded (Notion Sites supports custom domains), so a link carrying a',
    'Notion-shaped ID on an unknown host is reported, never dropped. The host list is an',
    'optimisation and can never be complete.',
    `${r.externalReferences} external reference(s) were discovered and excluded from every`,
    'denominator as non-defect exclusions (ADR-0005 decision 2).',
    /* Two limits REF001 has that are NOT visible in any figure, so they are stated
     * rather than left for a reader to infer from a clean-looking ratio. */
    'Nested block content IS read, to a bounded depth and request budget. Exhausting',
    'either is recorded as an UNBOUNDED loss on the containing page, never as a',
    'silent stop: a link the scan did not open cannot be counted or named.',
    'A reference naming a DATABASE is not retrieved — this slice has GET /v1/pages only.',
    'It is a named drop-out in REF001\'s coverage, never a finding. A reference found by',
    'URL carries no object kind, so a 404 on it means "not retrievable as a page", which',
    'covers a readable database as well as a dead link. That is a PRECISION limit and it',
    'is the reason the finding names the route that discovered it.',
    /* #51. Named in the report because the operator scoped the port widening to
     * pages, so the database half of the same seam is still open and a reader
     * must not read a clean REF001 row as covering databases. */
    'The page url IS now captured, so a SYS001 finding names its resource by ID and link',
    '(CONTEXT.md settled defaults). The link is REDACTED — a Notion URL copied from the UI',
    'carries the page title inside its path. A DATA SOURCE url is still not retrieved: that',
    'is issue #51 and it is open.',
  ];
}

/**
 * The attestation state behind a rule's applicable set — ADR-0013 decision 5.
 *
 * IT IS RUN-LEVEL, AND THAT IS A DOCUMENTED LIMIT RATHER THAN THE FULL
 * DECISION. ADR-0013 decision 5 asks for the attestation of the enumerations
 * that built THAT RULE's applicable set. In this slice every rule's applicable
 * set descends from the same block-children traversal — SYS001 counts the
 * resources it enumerated, and REF001 counts references extracted from the
 * block content that same traversal read — so the per-rule answer and the
 * run-level answer are the same value. They stop being the same the moment a
 * rule's coverage item is built from a different endpoint, and at that point
 * this function is the thing that must change rather than the callers.
 *
 * `unattested` DOMINATES. One blind enumeration behind a rule's set is enough
 * to make the set's completeness unestablished, and the flattering direction
 * would be to report the best endpoint used rather than the worst.
 *
 * NULL MEANS NO ENUMERATION PRODUCED A LISTING, WHICH IS NOT THE SAME AS "NONE
 * WAS ATTEMPTED". A root whose `GET /v1/blocks/{id}/children` returned 404
 * writes no enumeration record — the call was made and produced nothing to
 * doubt — so it lands here too. The sentence this state prints must be true of
 * BOTH cases: an earlier wording said "no enumeration was performed", which the
 * report then printed four sections above a call log showing the call. That is
 * the report contradicting its own evidence, which is this product's defect
 * class appearing in this product's output.
 *
 * Null is a state with its own sentence in every renderer, never a blank cell.
 */
function attestationBehind(r: ScanResult): Attestation | null {
  const enumerations = r.manifest.all().flatMap(e => (e.enumeration ? [e.enumeration] : []));
  if (enumerations.length === 0) return null;
  return enumerations.some(e => e.attestation === 'unattested') ? 'unattested' : 'attested';
}

/**
 * The sentence printed where an attestation state would go when there is none.
 *
 * "PRODUCED A LISTING", NOT "WAS PERFORMED". A failed enumeration was performed;
 * it just returned nothing. See attestationBehind.
 */
const NO_ENUMERATION = 'none — no enumeration produced a listing, so there is no attestation state';

/**
 * What the byte's basis line says about residuals — ADR-0013 decision 6.
 *
 * THREE CASES, BECAUSE ZERO MEANS TWO DIFFERENT THINGS. A single plural template
 * printed `0 residual(s): the enumerations behind this figure could not be
 * verified complete` on a run whose root enumeration 404'd — a sentence a reader
 * parses as "nothing here is unverifiable" when in fact no listing was obtained
 * at all and the figure rests on nothing. The zero case needed its own clause,
 * and which clause depends on WHY it is zero.
 *
 * Shared by the terminal and Markdown renderers so the two cannot drift, which
 * is the same reason the suppressions live in the document.
 */
function residualClause(count: number, attestation: Attestation | null): string {
  if (count > 0) return `${count} residual(s): the enumerations behind this figure could not be verified complete`;
  if (attestation === null) return 'no residuals — and no enumeration produced a listing, so this figure rests on none';
  return 'no residuals — every enumeration behind this figure carried a completeness signal';
}

/**
 * Build the single structured report consumed by terminal, Markdown and JSON output.
 *
 * Suppression, redaction, ordering and byte-basis choices are made here once.
 * Renderers are therefore formatters over an already-decided document, not
 * independent implementations that can disagree about what is safe or valid to
 * publish.
 */
export function buildReportDocument(r: ScanResult, opts: DocumentOptions = {}): ReportDocument {
  const label = (e: { alias: string; safeLabel: string }) => (opts.showTitles ? e.alias : e.safeLabel);
  const entries = r.manifest.all();
  const safeName = new Map(entries.map(e => [e.key, label(e)]));

  /* THE FOUR SUPPRESSIONS, COMPUTED ONCE.
   *
   * 1. A DISCLAIMED report renders no summary verdict (ADR-0005 decision 3). It
   *    keeps the manifest, the findings and the per-rule vector; the headline
   *    and the conformity ratio are the summary verdict and they are withheld.
   *    The arithmetic is worse than a formatting slip: a disclaimed run is
   *    disclaimed because a gap is unbounded, so its denominator is a number the
   *    run has just declared unestablishable.
   * 2. A scan that DID NOT RUN has no disposition. deriveVerdict returns
   *    `unqualified` on exit 4, which reads as a clean bill of health.
   * 3. An EMPTY applicable set has no evidence sufficiency; `null` is absent,
   *    never false.
   * 4. The BYTE BASIS travels with the byte (ADR-0012 decision 2). */
  const didNotRun = r.verdict.exit === 4;
  const disclaimed = r.verdict.disposition === 'disclaimed';

  const headlineRow = headlineCoverage(r.coverage);
  const claimed = Object.values(r.outcomes).filter(o => o.conformity !== null);
  /* COMPUTED ONCE, beside the other suppressions, and for the same reason: a
   * value derived per row is a value that can differ per row. It cannot today —
   * the function reads only the manifest — and computing it once means it still
   * cannot after someone gives it a second input. */
  const attestation = attestationBehind(r);

  return {
    normalization: { version: NORMALIZATION_VERSION, excluded: VOLATILE_FIELDS },

    disposition: didNotRun
      ? withheld('none — the scan did not run as declared, so no disposition was formed', 'absent-did-not-run')
      : published(r.verdict.disposition),

    coverageVector: [...r.coverage].sort((a, b) => (a.rule < b.rule ? -1 : a.rule > b.rule ? 1 : 0)),

    headline: disclaimed
      ? withheld('WITHHELD — the disposition is disclaimed, so no summary verdict is rendered (ADR-0005 decision 3)', 'withheld-disclaimed')
      : headlineRow
        ? published(headlineRow)
        : withheld('none — the vector is empty', 'absent-no-subject'),

    conformityRatio: disclaimed
      ? withheld('WITHHELD — the disposition is disclaimed (ADR-0005 decision 3)', 'withheld-disclaimed')
      : claimed.length
        ? published({
            conforming: claimed.filter(o => o.conformity === 'conforms').length,
            claimed: claimed.length,
            unit: 'rules that reached a conformity claim',
          })
        : withheld('none — no rule formed a conformity verdict, so there is no ratio', 'absent-no-subject'),

    funnel: {
      evaluated: r.verdict.evaluated,
      applicable: r.verdict.applicable,
      fetched: r.manifest.reached('fetched'),
      unit: 'resources',
    },

    outcomes: Object.entries(r.outcomes)
      /* ADR-0013 decision 5. The attestation is attached to the row HERE, in the
       * document, so no renderer has the option of printing evidence without it.
       * Three emitters each remembering the constraint is three chances to
       * forget it — the same reasoning that put the other four suppressions in
       * this function. */
      .map(([rule, o]) => ({ rule, conformity: o.conformity, evidence: o.evidence, attestation }))
      .sort((a, b) => (a.rule < b.rule ? -1 : a.rule > b.rule ? 1 : 0)),

    exit: {
      byte: r.verdict.exit,
      why: r.verdict.why,
      cause: r.verdict.cause,
      basis: {
        compared: r.byteBasis.compared,
        declaredThreshold: r.byteBasis.declaredThreshold,
        funnelNotCompared: r.byteBasis.funnel,
        /* A COUNT OF RESOURCES WHOSE ENUMERATION WAS UNATTESTED, and NOT a count
         * of missing items. That distinction is what makes the number
         * publishable at all: ADR-0013 decision 3 forbids rendering the
         * unattested SET as a figure because it is not estimable, and permits
         * this one because the scan knows exactly which resources it enumerated.
         *
         * IT IS NOT A COUNT OF CALLS, and the earlier comment here said it was.
         * `listAllChildren` paginates, so one resource can cost many calls, and
         * `readBlockTree`'s nested descent issues more against the same
         * resource. Measured on the repo's own fixtures: MIDSTREAM makes three
         * block-children calls and yields two residuals. The per-resource
         * granularity is what ADR-0013 decision 6's table specifies; the
         * justification was the thing that was wrong. */
        residuals: r.residuals.length,
        attestation,
      },
    },

    /* SORTED, NOT INSERTION-ORDERED — SARIF Appendix F.3. Insertion order is
     * call order, which is a property of the traversal and of the network, not
     * of the workspace. */
    manifest: entries
      .map(e => ({
        resource: label(e),
        unit: e.unit,
        stages: STAGES.filter((s: Stage) => e.stages.has(s)),
        loss: e.loss?.cause ?? null,
        isRoot: e.isRoot,
      }))
      .sort((a, b) => (a.unit + a.resource < b.unit + b.resource ? -1 : 1)),

    gaps: [...r.gaps]
      .map(g => ({
        resource: safeName.get(g.resource) ?? g.resource,
        cause: g.cause,
        bounded: g.bounded,
        isRootMiss: g.isRootMiss ?? false,
      }))
      .sort((a, b) => (a.resource < b.resource ? -1 : a.resource > b.resource ? 1 : 0)),

    /* COPIED, like every sibling field on this document. Handing the document a
     * live reference to the scan's own array lets a renderer or exporter that
     * sorts or splices `doc.residuals` mutate the ScanResult — the aliasing the
     * copy-on-build convention here exists to prevent.
     *
     * Already sorted by residualsFrom, and nothing needs resolving through
     * safeName: a residual is always keyed on a resource the scan enumerated, so
     * its identity is a hyphenated ID and cannot carry a title. A gap's identity
     * may be a verbatim href, which is why that field does need the lookup. */
    residuals: [...r.residuals],

    /* COPIED, like every sibling field, so a renderer that sorts or splices
     * `doc.measurements` cannot mutate the ScanResult.
     *
     * NO REDACTION TRANSFORM IS APPLIED HERE AND NONE IS NEEDED, which is worth
     * stating rather than leaving to be inferred: a measurement row names its
     * resource by `safeLabel` and carries the already-redacted `Entry.link`, so
     * every string on it is safe on any line by construction. That is a
     * DIFFERENT safety argument from the one anchor text uses two fields below,
     * where a single decision point governs a raw value — and conflating the two
     * arguments is how a future measurement carrying a title would slip in
     * under the wrong precedent. A measurement that ever needs a title must
     * route through the reveal decision, not through here. */
    measurements: [...r.measurements],

    findings: [...r.findings]
      .map(f => ({
        rule: f.rule,
        resource: f.anchor.resource,
        discriminator: f.discriminator,
        certainty: f.certainty,
        targetState: f.targetState,
        bounded: f.bounded,
        isRootMiss: f.isRootMiss,
        evidence: f.evidence,
        link: f.link,
        /* The REASON travels with the null, because "no link" and "we did not
         * look" are different facts about the same field. */
        linkAbsentReason: f.link === null ? LINK_NOT_CAPTURED : null,
        /* #141. THE REVEAL DECISION, MADE ONCE, HERE — beside `label()` above,
         * which is the identical decision for `Entry.alias`. Anchor text is
         * title-class by the remedy test (#139), so it rides the SAME flag and
         * there is deliberately no second one.
         *
         * The order of the two tests is load-bearing. Absence is checked FIRST,
         * so a reference that never had anchor text says so under `--show-titles`
         * instead of claiming something was withheld. Redaction-first would make
         * the reveal flag print "withheld" for a value that does not exist. */
        anchorText: f.anchorText === null
          ? ANCHOR_TEXT_ABSENT
          : opts.showTitles
            ? f.anchorText
            : ANCHOR_TEXT_REDACTED,
        /* Carried through verbatim, fallback strings included. Substituting a
         * blank or a dash here would delete the distinction `references.ts`
         * wrote them to preserve. */
        source: f.source,
        message: f.message,
      }))
      .sort((a, b) => {
        const ka = `${anchorKey({ rule: a.rule, resource: a.resource })}|${canonicalize(a.discriminator)}`;
        const kb = `${anchorKey({ rule: b.rule, resource: b.resource })}|${canonicalize(b.discriminator)}`;
        return ka < kb ? -1 : ka > kb ? 1 : 0;
      }),

    disclosures: DISCLOSURES(r),

    ...(opts.deterministic
      ? {}
      : {
          volatile: {
            wallMs: r.wallMs,
            requestCount: r.requestCount,
            calls: r.calls.map(c => ({ endpoint: c.endpoint, status: String(c.status), code: c.code ?? null })),
          },
        }),
  };
}

/**
 * Render the human terminal report from the same document used by artifacts.
 *
 * This keeps stdout subject to the same redaction and suppression rules as the
 * Markdown and JSON exporters; any field not present on ReportDocument is not
 * available for the terminal to leak or reinterpret.
 */
export function renderReport(r: ScanResult, opts: RenderOptions = {}): string[] {
  const out: string[] = [...r.log];
  /* The FULL ID, not a prefix. Notion IDs are time-ordered, so resources created
   * in one session share their leading hex: the first live run rendered three
   * distinct pages as «3bf1351d…» and the manifest read like a double-count when
   * it was in fact correct. Truncation is not redaction, and here it was not
   * even disambiguation. The ID is the right thing to print — CONTEXT.md's
   * settled default names a resource "by ID and link, never by title". */
  /* ONE LABELLING RULE FOR EVERY ENTRY, WHATEVER IT COUNTS. `safeLabel` is the
   * form that is safe on any line: a resource's ID, or a reference's href with
   * its path redacted. `alias` may carry a page title — and for a reference it
   * may carry one INSIDE THE URL, because a Notion link copied from the UI reads
   * `.../My-Private-Roadmap-3bf1351d…`. That is the same hole #42 shipped
   * through an endpoint label, arriving through a different door. */
  /* EVERY SECTION BELOW READS THE DOCUMENT. Three sections used to read
   * `r.manifest`, `r.gaps` and `r.findings` directly while the Markdown and JSON
   * read the document, which made "one document, three renderers" two-thirds
   * true — and left the terminal free to disagree with the artifacts about
   * order, about names, and about which reason travels with a null. Caught by
   * reviewing this change against its own claim, not by a failing test. */
  const doc = buildReportDocument(r, opts);
  const width = Math.max(20, ...doc.manifest.map(e => e.resource.length));
  /* ⚠ COMPUTED, NOT `padEnd(20)`. The unit column was a hardcoded 20 beside a
   * resource column measured from the data, and it held only because every unit
   * name then in the union was shorter than 20 characters. `resource pairs in a
   * uniqueness scope` is 36, so UNQ001's rows padded to nothing and their loss
   * text ran straight into the unit with no separator:
   * `…uniqueness scopedata-source enumeration is not implemented…`. Observed in
   * #59's live run. Same defect as the `heading.length + 20` offset in
   * CHECK-harness.ts — a width written as a constant beside one that is
   * measured, correct until the data outgrows the guess.
   *
   * The `+ 1` is the separator, so a loss never abuts the widest unit. */
  const unitWidth = Math.max(20, ...doc.manifest.map(e => e.unit.length)) + 1;

  out.push('');
  out.push('──────── COVERAGE MANIFEST ────────');
  for (const e of doc.manifest)
    out.push(`  ${e.resource.padEnd(width)} ${STAGES.map((st: Stage) => (e.stages.includes(st) ? '●' : '○')).join(' ')}  ${e.unit.padEnd(unitWidth)}${e.loss ?? ''}`);
  out.push(`  ${''.padEnd(width)} ${STAGES.map(s => s[0]).join(' ')}   (declared resolved enumerated fetched evaluated)`);
  /* ADR-0011 decision 4 and spec criterion 6: no figure without its unit. The
   * manifest is where the figures come from, so the unit is on every row —
   * `enumerated` means nothing for a reference and the column says which rows it
   * applies to. */
  out.push('  the unit column names which rule\'s coverage item each row belongs to; counts are never pooled across them');
  if (!opts.showTitles) out.push('  page titles redacted by default, in aliases AND inside link paths; --show-titles opts in');

  out.push('');
  out.push('──────── GAPS ────────');
  if (!doc.gaps.length) out.push('  none');
  /* The document already resolved each gap's name THROUGH the manifest, never
   * from `g.resource` directly: a gap over an unrecognised link carries the
   * VERBATIM href as its identity, and the verbatim href is the thing that may
   * carry a title. */
  for (const g of doc.gaps)
    out.push(`  ${g.bounded ? 'bounded  ' : 'UNBOUNDED'} ${g.resource}  ${g.isRootMiss ? '[declared root never reached] ' : ''}${g.cause}`);

  /* ADR-0013. A SEPARATE SECTION FROM GAPS, DELIBERATELY. Merging them would put
   * a doubt about the frame in the same table as items that left the funnel, and
   * a reader would reasonably add them up. The count that connects this section
   * to the verdict is on the byte basis line, not here — a register a reader has
   * to go looking for is the defect S017 found, restated with more words. */
  out.push('');
  out.push('──────── RESIDUALS ────────');
  if (!doc.residuals.length) out.push('  none');
  for (const x of doc.residuals) {
    out.push(`  ${x.cause}  ${x.resource}`);
    out.push(`      ${x.endpoint} carries no completeness signal, so a filtered listing and a complete one are identical.`);
    out.push(`      NOT a gap and NOT counted in any ratio — this is a doubt about the frame, and its size is not estimable.`);
    out.push(`      remedy: ${x.remedy}`);
  }

  out.push('');
  out.push('──────── FINDINGS ────────');
  /* Every finding here is `new` and unsuppressed BY CONSTRUCTION — this slice
   * has no baseline file and no suppressions (spec §1.2). NO BASELINE STATE IS
   * PRINTED. Printing `new` would look computed, and ADR-0008 decision 1's five
   * states were never exercised: a state the slice did not compute is a false
   * claim whichever value it carries. */
  if (!doc.findings.length) out.push('  none');
  for (const f of doc.findings) {
    out.push(`  ${f.rule}  ${f.resource}`);
    out.push(`      ${f.message}`);
    out.push(
      `      certainty: ${f.certainty} · target state: ${f.targetState} · ` +
      `gap: ${f.bounded ? 'bounded' : 'UNBOUNDED'}${f.isRootMiss ? ' · declared root never reached' : ''}`,
    );
    out.push(`      evidence: expected ${f.evidence.expected}, observed ${f.evidence.observed} (${f.evidence.location})`);
    out.push(`      link: ${f.link ?? f.linkAbsentReason ?? LINK_NOT_CAPTURED}`);
    /* #100. WHERE THE DEFECT IS, not what it is about. Without this line a
     * REF001 finding names an unreachable target and no place to go, and the
     * operator's next move is a search of the whole workspace. Both halves are
     * IDs — see FindingSource — so no redaction transform is applied and none
     * is needed; CHECK-ref001 asserts that over every rendered line. */
    out.push(`      source: ${f.source ? `page ${f.source.page} · block ${f.source.block}` : SOURCE_NOT_APPLICABLE}`);
    /* #135, #141. WHAT THE WORKSPACE STILL CALLS THE THING THAT IS NOT THERE.
     * `source` above says where to go; this says what the operator was looking
     * at when they got there, which is what turns a dead-reference finding from
     * an ID into a decision. Run 1 binned 1 of 5 CANT-TELL for want of it.
     *
     * Printed from the DOCUMENT, already resolved. This line does not know
     * whether titles are revealed and must not learn. */
    out.push(`      anchor text: ${f.anchorText}`);
  }
  out.push('  no baseline state is printed: this slice computes none (spec §1.2).');

  /* ADR-0017. A SEPARATE SECTION FROM FINDINGS, DELIBERATELY, and the reasoning
   * is ADR-0013's applied to a different pair: a count in a table of defects is
   * a count a reader will read as a defect, and this section makes no conformity
   * claim at all.
   *
   * IT ALWAYS RENDERS — decision 5. A measurement that could not be computed
   * prints its cause, because a quiet report and an absent report look identical
   * (Baca et al., DOI 10.1002/spe.2109: a tool abandoned after an expired
   * licence silently stopped it analysing). There is deliberately no
   * `if (!doc.measurements.length)` early return here. */
  out.push('');
  out.push('──────── MEASUREMENTS ────────');
  out.push('  counted facts, not defect claims: no measurement enters a coverage ratio or the exit byte (ADR-0017)');
  for (const m of doc.measurements) {
    out.push('');
    out.push(`  ${m.label}`);
    if (!m.computed) {
      /* THE BOUNDARY, NAMED. "not computed" plus its cause is the whole of
       * decision 5: a reader can tell a limit from a pass. */
      out.push(`      not computed — ${m.cause}`);
      continue;
    }
    /* THE DENOMINATOR, PRINTED BESIDE THE ROWS — decision 6. Without it a
     * reader takes the rows for the whole reached set, and every zero in this
     * section becomes a claim about the workspace rather than about the scan. */
    out.push(`      over: ${m.over}   (unit: ${m.unit})`);
    /* MEASURED FROM THE DATA, NEVER A CONSTANT. A width written as a constant
     * beside one that is measured is correct until the data outgrows the guess,
     * and that shape has now shipped three times in this repository — the
     * manifest's unit column, and `heading.length + 20` in CHECK-harness.ts. */
    const rw = Math.max(12, ...m.rows.map(x => x.resource.length));
    for (const row of m.rows)
      out.push(`      ${row.resource.padEnd(rw)}  ${row.value}  ${row.link ?? LINK_NOT_CAPTURED}`);
    /* ADR-0017 decision 3. A total prints only beside the rows it sums, and it
     * is COMPUTED from them rather than supplied, so the reader's recount cannot
     * disagree with it. `null` means the rows do not sum — a column of instants
     * has no meaningful total, and printing `0` would be a number the run never
     * computed. */
    if (m.total !== null) out.push(`      total: ${m.total} ${m.unit}   (sum of the ${m.rows.length} row(s) above — recount it)`);
  }

  out.push('');
  out.push('──────── DISCLOSURES ────────');
  /* READ FROM THE DOCUMENT, like every other section. This line called
   * DISCLOSURES(r) directly, which is the same two-thirds-true shape T4's review
   * found in three other sections: the terminal renderer was free to disagree
   * with the Markdown and JSON about what a run disclosed. */
  for (const d of doc.disclosures) out.push(`  ${d}`);

  out.push('');
  out.push('──────── REPORT ────────');
  /* EVERY DECISION BELOW IS READ FROM THE DOCUMENT, NOT RECOMPUTED HERE. The
   * four suppressions live in buildReportDocument() and this renderer only
   * formats them — same reason ADR-0012 deleted the second copy of the verdict.
   * The line formats are unchanged, so the assertions over them still hold. */
  /* A SCAN THAT DID NOT RUN HAS NO DISPOSITION, AND MUST NOT PRINT ONE.
   * deriveVerdict computes the disposition from gaps and violations, and a run
   * that failed its identity call has neither — so it returns `unqualified`,
   * which reads as a clean bill of health directly under "The scan did not run
   * as declared." A value the run did not compute is a false claim whichever
   * value it carries. */
  out.push(
    doc.disposition.published
      ? `  disposition:      ${doc.disposition.value}${doc.disposition.value === 'disclaimed' ? '   ← NO SUMMARY VERDICT RENDERED' : ''}`
      : `  disposition:      ${doc.disposition.reason}`,
  );

  /* ADR-0011 decision 4. One row per rule over that rule's OWN coverage item,
   * every figure carrying its unit, and the headline is the MINIMUM over the
   * vector — never a mean, never a count pooled across rules, because counts of
   * different things do not add. The vector is printed first and the headline
   * second, because the headline may not be published without it.
   *
   * A DISCLAIMED REPORT RENDERS NO SUMMARY VERDICT (ADR-0005 decision 3), and
   * the headline and the conformity ratio ARE the summary verdict. The vector
   * still prints — it is per-rule evidence, not a summary. */
  out.push('  coverage vector:');
  if (!doc.coverageVector.length) {
    /* ADR-0011 decision 6: a rule with an empty applicable set leaves the
     * vector. Every rule empty means the scan judged nothing, and that must not
     * read as coverage. */
    out.push('    (empty — no rule had an applicable subject; no coverage figure exists)');
  }
  for (const row of doc.coverageVector) out.push(`    ${row.rule.padEnd(8)} ${formatRow(row)}`);
  out.push(
    `  headline:         ${
      doc.headline.published
        ? `${formatRow(doc.headline.value)} — the MINIMUM of the vector, set by ${doc.headline.value.rule}`
        : doc.headline.reason
    }`,
  );

  out.push(`  funnel:           ${doc.funnel.evaluated}/${doc.funnel.applicable} resources evaluated · ${doc.funnel.fetched}/${doc.funnel.applicable} fetched   (unit: resources)`);
  /* ADR-0013 decision 5: EVIDENCE SUFFICIENCY AND ITS ATTESTATION ARE PRINTED ON
   * ONE LINE, together or not at all. `sufficient` is a claim about the
   * evaluated set against the applicable set, and it stays exactly that — what
   * the attestation adds is whether the applicable set was built from a listing
   * the API could vouch for. A run can be `sufficient` and `unattested` at the
   * same time and both words are true; separating them onto different lines is
   * how a reader ends up believing only the first. */
  for (const o of doc.outcomes)
    out.push(
      `  outcome ${o.rule}:   conformity ${o.conformity ?? 'ABSENT — the evaluated set is empty, so no verdict was formed'}` +
      ` · evidence ${o.evidence ?? 'ABSENT — the applicable set is empty, so there is nothing for evidence to cover'}` +
      ` · attestation ${o.attestation ?? NO_ENUMERATION}`,
    );

  /* ADR-0005 decision 4: the conformity ratio and the coverage figure are
   * published TOGETHER OR NOT AT ALL. Printing conformity alone is the Great
   * Expectations defect — a suite in which half the expectations never ran can
   * report 100%. A rule whose conformity is absent is excluded from the
   * denominator rather than scored as a failure. */
  out.push(
    `  conformity ratio: ${
      doc.conformityRatio.published
        ? `${doc.conformityRatio.value.conforming}/${doc.conformityRatio.value.claimed} rules conforming (unit: ${doc.conformityRatio.value.unit})`
        : doc.conformityRatio.reason
    }`,
  );
  out.push(`  requests:         ${r.requestCount} · wall ${r.wallMs} ms   (NOT a validated budget — #7 owns that)`);
  /* NO UNIT IS APPENDED HERE ANY MORE, AND THAT IS THE FIX RATHER THAN A
   * REGRESSION. The previous line appended "[figures in this reason are
   * resources]" because deriveVerdict built `why` as a bare "3/4". ADR-0012
   * decision 5 moved the remedy to the source: `why` is composed through
   * formatRow(), which has no code path that omits the unit. Re-appending a
   * unit here would now be wrong as well as redundant — the figures in `why`
   * are the weakest rule's coverage item, which is `internal references` on any
   * run REF001 sets the minimum on, and was only ever `resources` by accident
   * of there being one rule. */
  out.push(`  exit:             ${r.verdict.exit}   (${r.verdict.why})`);

  /* WHAT THE EXIT BYTE COMPARED, PRINTED EVERY RUN.
   *
   * This line survived #49; the warning that used to follow it did not, because
   * it has nothing left to warn about. ADR-0011 decision 5 makes the threshold a
   * floor on every rule and ADR-0012 decision 2 made the byte compare that
   * figure, so the divergence this block once disclosed is now unrepresentable.
   * The line stays because a byte published without the figure it compared is a
   * coverage claim the reader cannot check, and #45's exporter carries the same
   * obligation. The funnel is printed beside it as a different noun, not as an
   * alternative. */
  const b = doc.exit.basis;
  out.push(
    `  byte basis:       compared ${
      b.compared ? `${formatRow(b.compared)} — the weakest rule, ${b.compared.rule} —` : 'nothing — the vector is empty, so the scan judged nothing —'
    } against the declared threshold ${b.declaredThreshold}` +
    `   (funnel, not compared: ${(b.funnelNotCompared * 100).toFixed(1)}% of resources)` +
    /* ADR-0013 decision 6, AND THIS IS THE OPERATIVE LINE OF THE WHOLE DECISION.
     * The blind-spine disclosure was already shipping when the false green
     * shipped, in its own section; what was missing was anything connecting it
     * to the byte. A reader who reads only this line still learns that the
     * enumeration behind the figure was unverifiable. */
    `   · ${residualClause(b.residuals, b.attestation)}`,
  );
  if (doc.exit.cause) out.push(`  cause:            ${doc.exit.cause}`);

  out.push('');
  out.push('──────── CALLS MADE (read-only) ────────');
  for (const c of r.calls) out.push(`  ${String(c.status).padEnd(4)} ${c.code ?? ''} ${c.endpoint}`);

  return out;
}

/* ================================================================ emitters ==
 * Acceptance criterion 5: one readable Markdown report, one stable JSON report.
 * Both read the document; neither decides anything.
 * ========================================================================== */

/** RFC 8785 bytes. Byte-identical across two runs when `deterministic` is set. */
export function renderJson(doc: ReportDocument): string {
  return canonicalize(doc);
}

/**
 * Escape only what would change the STRUCTURE of the document.
 *
 * `|` ends a table cell and `` ` `` opens a code span; both would corrupt the
 * layout. `*` can start emphasis. Underscores and brackets are deliberately NOT
 * escaped: CommonMark does not treat an intraword `_` as emphasis, so
 * `has_more`, `request_status` and `child_page` render literally — and escaping
 * them puts a visible backslash into every API identifier this report prints,
 * which is worse than the problem. The report's text is full of identifiers.
 */
const md = (s: string) => s.replace(/([|`*\\])/g, '\\$1');

/**
 * The reason a finding carries no source, printed rather than left blank.
 *
 * SAME INSTRUMENT AS `LINK_NOT_CAPTURED`: "no source" and "this rule has no
 * source to give" are different facts about the same field, and a renderer that
 * printed an empty cell would collapse them. Every rule that writes `null`
 * states its own reason at the construction site; this is the one line the
 * report prints for all of them.
 */
export const SOURCE_NOT_APPLICABLE =
  'none — this rule\'s subject is the resource itself, so there is no separate containing page';

export function renderMarkdown(doc: ReportDocument): string {
  const L: string[] = [];

  L.push('# workspace_lint — scan report');
  L.push('');
  L.push(`Normalization \`${doc.normalization.version}\`. ${doc.volatile ? 'Volatile fields INCLUDED — this report is not byte-stable; re-run with `--deterministic`.' : 'Volatile fields excluded, so two runs over an unchanged workspace are byte-identical.'}`);
  L.push('');

  L.push('## Verdict');
  L.push('');
  L.push(`- **Exit byte:** \`${doc.exit.byte}\` — ${md(doc.exit.why)}`);
  if (doc.exit.cause) L.push(`- **Cause:** \`${doc.exit.cause}\``);
  L.push(`- **Disposition:** ${doc.disposition.published ? `\`${doc.disposition.value}\`` : md(doc.disposition.reason)}`);
  /* ADR-0012 decision 2: the byte basis travels with the byte, or neither is
   * published. A byte without the figure it compared is a coverage claim the
   * reader cannot check. */
  /* ADR-0013 decision 6: the residual count is on the byte's own line here too.
   * A count that appears in the Markdown register but not beside the byte would
   * leave the two artifacts disagreeing about how connected the facts are. */
  L.push(
    `- **Byte basis:** compared ${doc.exit.basis.compared ? `${md(formatRow(doc.exit.basis.compared))} — the weakest rule, \`${doc.exit.basis.compared.rule}\` —` : 'nothing; the vector is empty, so the scan judged nothing —'} against the declared threshold ${doc.exit.basis.declaredThreshold}. The resource funnel was ${(doc.exit.basis.funnelNotCompared * 100).toFixed(1)}% and was **not** the comparison. **${md(residualClause(doc.exit.basis.residuals, doc.exit.basis.attestation))}**.`,
  );
  L.push('');

  /* The vector prints before the headline, and prints even when the headline is
   * withheld: it is per-rule evidence, not a summary (ADR-0005 decision 3). */
  L.push('## Coverage');
  L.push('');
  if (!doc.coverageVector.length) {
    L.push('_The vector is empty — no rule had an applicable subject, so no coverage figure exists._');
  } else {
    L.push('| Rule | Evaluated | Applicable | Coverage | Unit |');
    L.push('| --- | ---: | ---: | ---: | --- |');
    for (const r of doc.coverageVector)
      L.push(`| \`${r.rule}\` | ${r.evaluated} | ${r.applicable} | ${(r.ratio * 100).toFixed(1)}% | ${r.unit} |`);
  }
  L.push('');
  L.push(`**Headline:** ${doc.headline.published ? `${md(formatRow(doc.headline.value))} — the **minimum** of the vector, set by \`${doc.headline.value.rule}\`` : md(doc.headline.reason)}`);
  L.push('');
  L.push(`**Conformity ratio:** ${doc.conformityRatio.published ? `${doc.conformityRatio.value.conforming}/${doc.conformityRatio.value.claimed} (unit: ${doc.conformityRatio.value.unit})` : md(doc.conformityRatio.reason)}`);
  L.push('');
  L.push(`**Funnel:** ${doc.funnel.evaluated}/${doc.funnel.applicable} ${doc.funnel.unit} evaluated, ${doc.funnel.fetched}/${doc.funnel.applicable} fetched. This is the resource funnel and it is **not** a rule's coverage figure.`);
  L.push('');

  L.push('### Outcomes');
  L.push('');
  /* ADR-0013 decision 5. The Attestation column is not decoration: evidence
   * sufficiency and its attestation are published together or not at all. */
  L.push('| Rule | Conformity | Evidence sufficiency | Attestation |');
  L.push('| --- | --- | --- | --- |');
  for (const o of doc.outcomes)
    L.push(`| \`${o.rule}\` | ${o.conformity ?? '_absent — the evaluated set is empty_'} | ${o.evidence ?? '_absent — the applicable set is empty_'} | ${o.attestation ?? `_${NO_ENUMERATION}_`} |`);
  L.push('');

  L.push('## Coverage manifest');
  L.push('');
  L.push(`| Resource | Unit | ${STAGES.join(' | ')} | Drop-out cause |`);
  L.push(`| --- | --- |${STAGES.map(() => ' :-: |').join('')} --- |`);
  for (const e of doc.manifest)
    L.push(`| \`${md(e.resource)}\`${e.isRoot ? ' **(declared root)**' : ''} | ${e.unit} | ${STAGES.map(s => (e.stages.includes(s) ? '●' : '○')).join(' | ')} | ${e.loss ? md(e.loss) : ''} |`);
  L.push('');

  L.push('## Gaps');
  L.push('');
  if (!doc.gaps.length) L.push('_None._');
  else {
    L.push('| Resource | Bounded | Cause |');
    L.push('| --- | --- | --- |');
    for (const g of doc.gaps)
      L.push(`| \`${md(g.resource)}\` | ${g.bounded ? 'bounded' : '**UNBOUNDED**'} | ${g.isRootMiss ? '**declared root never reached** — ' : ''}${md(g.cause)} |`);
  }
  L.push('');

  /* ADR-0013. Its own section, below Gaps and separate from it. A residual is
   * not an item that left the funnel and must never be summed with one. */
  L.push('## Residuals');
  L.push('');
  L.push('_A residual is a doubt about the evidence base, **not** a gap. It enters no numerator, no denominator and no ratio: the size of what an unattested enumeration may have omitted is not estimable, so no figure for it is published (ADR-0013 decision 3)._');
  L.push('');
  if (!doc.residuals.length) L.push('_None._');
  else {
    L.push('| Cause | Resource | Endpoint | Remedy |');
    L.push('| --- | --- | --- | --- |');
    for (const x of doc.residuals)
      L.push(`| \`${md(x.cause)}\` | \`${md(x.resource)}\` | \`${md(x.endpoint)}\` | ${md(x.remedy)} |`);
  }
  L.push('');

  /* ADR-0017, and it renders unconditionally for decision 5's reason. Its own
   * heading, above Findings and below Residuals, so the document's four classes
   * are four sections in every emitter. */
  L.push('## Measurements');
  L.push('');
  L.push('_A measurement is a counted fact, **not** a defect claim. It has no coverage item, enters no ratio, and reaches the exit byte through no channel — not even a rule-level one, because it owns no rule ID (ADR-0017 decision 4). Every aggregate printed here is reconstructible from the rows printed beside it._');
  L.push('');
  for (const m of doc.measurements) {
    L.push(`### ${md(m.label)}`);
    L.push('');
    if (!m.computed) {
      L.push(`_Not computed — ${md(m.cause)}_`);
      L.push('');
      continue;
    }
    L.push(`_Computed over ${md(m.over)}. Unit: **${md(m.unit)}**._`);
    L.push('');
    L.push(`| Resource | Value | Link |`);
    L.push('| --- | --- | --- |');
    for (const row of m.rows)
      L.push(`| \`${md(row.resource)}\` | ${md(row.value)} | ${row.link ? `\`${md(row.link)}\`` : `_${md(LINK_NOT_CAPTURED)}_`} |`);
    if (m.total !== null) L.push(`| **Total** | **${m.total} ${md(m.unit)}** | _sum of the ${m.rows.length} row(s) above_ |`);
    L.push('');
  }

  L.push('## Findings');
  L.push('');
  if (!doc.findings.length) L.push('_None._');
  for (const f of doc.findings) {
    L.push(`### \`${f.rule}\` — \`${md(f.resource)}\``);
    L.push('');
    L.push(md(f.message));
    L.push('');
    L.push(`- Certainty: \`${f.certainty}\` · target state: \`${f.targetState}\` · gap: ${f.bounded ? 'bounded' : '**UNBOUNDED**'}${f.isRootMiss ? ' · **declared root never reached**' : ''}`);
    L.push(`- Evidence: expected ${md(f.evidence.expected)}, observed ${md(f.evidence.observed)} (${md(f.evidence.location)})`);
    L.push(`- Link: ${f.link ? `\`${md(f.link)}\`` : `_${md(f.linkAbsentReason ?? 'none')}_`}`);
    /* #100, and it must say the same thing the terminal renderer says. The two
     * emitters disagreeing about what a run found is the defect T4's review
     * found in three sections of this file. */
    L.push(`- Source: ${f.source ? `page \`${md(f.source.page)}\` · block \`${md(f.source.block)}\`` : `_${md(SOURCE_NOT_APPLICABLE)}_`}`);
    /* #141. Escaped through md() like every other value on this document that
     * came out of a workspace — anchor text is the one field here an editor
     * typed freely, so it is the likeliest to carry a pipe or a backtick and
     * break the table it sits under. The JSON emitter needs no equivalent: it
     * serialises the same already-resolved document through canonicalize(). */
    L.push(`- Anchor text: ${md(f.anchorText)}`);
    L.push('');
  }
  /* Spec §1.2: this slice computes no baseline state. Printing one would look
   * computed, and a value the run did not compute is a false claim whichever
   * value it carries. */
  L.push('_No baseline state is printed: this slice computes none (spec §1.2)._');
  L.push('');

  L.push('## Disclosures');
  L.push('');
  for (const d of doc.disclosures) L.push(`- ${md(d)}`);
  L.push('');

  if (doc.volatile) {
    L.push('## Volatile (excluded from the determinism claim)');
    L.push('');
    L.push(`${doc.volatile.requestCount} request(s), ${doc.volatile.wallMs} ms wall. **Not a validated budget — #7 owns that.**`);
    L.push('');
    L.push('| Status | Code | Endpoint |');
    L.push('| --- | --- | --- |');
    for (const c of doc.volatile.calls) L.push(`| ${c.status} | ${c.code ?? ''} | \`${md(c.endpoint)}\` |`);
    L.push('');
  }

  return L.join('\n');
}
