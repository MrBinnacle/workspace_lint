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

import { STAGES, type Stage } from './manifest.js';
import { formatRow, headlineCoverage, LINK_NOT_CAPTURED } from './finding.js';
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

export function renderReport(r: ScanResult, opts: RenderOptions = {}): string[] {
  const out: string[] = [...r.log];
  /* The FULL ID, not a prefix. Notion IDs are time-ordered, so resources created
   * in one session share their leading hex: the first live run rendered three
   * distinct pages as «3bf1351d…» and the manifest read like a double-count when
   * it was in fact correct. Truncation is not redaction, and here it was not
   * even disambiguation. The ID is the right thing to print — CONTEXT.md's
   * settled default names a resource "by ID and link, never by title". */
  const label = (alias: string, key: string) => (opts.showTitles ? alias : key);
  const width = Math.max(20, ...r.manifest.all().map(e => label(e.alias, e.key).length));

  out.push('');
  out.push('──────── COVERAGE MANIFEST ────────');
  for (const e of r.manifest.all())
    out.push(`  ${label(e.alias, e.key).padEnd(width)} ${STAGES.map((s: Stage) => (e.stages.has(s) ? '●' : '○')).join(' ')}  ${e.loss?.cause ?? ''}`);
  out.push(`  ${''.padEnd(width)} ${STAGES.map(s => s[0]).join(' ')}   (declared resolved enumerated fetched evaluated)`);
  if (!opts.showTitles) out.push('  page titles redacted by default; --show-titles opts in');

  out.push('');
  out.push('──────── GAPS ────────');
  if (!r.gaps.length) out.push('  none');
  for (const g of r.gaps)
    out.push(`  ${g.bounded ? 'bounded  ' : 'UNBOUNDED'} ${g.resource}  ${g.isRootMiss ? '[declared root never reached] ' : ''}${g.cause}`);

  out.push('');
  out.push('──────── FINDINGS ────────');
  /* Every finding here is `new` and unsuppressed BY CONSTRUCTION — this slice
   * has no baseline file and no suppressions (spec §1.2). NO BASELINE STATE IS
   * PRINTED. Printing `new` would look computed, and ADR-0008 decision 1's five
   * states were never exercised: a state the slice did not compute is a false
   * claim whichever value it carries. */
  if (!r.findings.length) out.push('  none');
  for (const f of r.findings) {
    out.push(`  ${f.rule}  ${f.anchor.resource}`);
    out.push(`      ${f.message}`);
    out.push(
      `      certainty: ${f.certainty} · target state: ${f.targetState} · ` +
      `gap: ${f.bounded ? 'bounded' : 'UNBOUNDED'}${f.isRootMiss ? ' · declared root never reached' : ''}`,
    );
    out.push(`      evidence: expected ${f.evidence.expected}, observed ${f.evidence.observed} (${f.evidence.location})`);
    out.push(`      link: ${f.link ?? LINK_NOT_CAPTURED}`);
  }
  out.push('  no baseline state is printed: this slice computes none (spec §1.2).');

  out.push('');
  out.push('──────── DISCLOSURES ────────');
  /* ADR-0006 decision 2 establishes that the truncation signal covers one
   * endpoint family and that the scan records which endpoints ran blind;
   * decision 5 makes the standing statement a per-run disclosure. Cited
   * separately because the slice spec §3.1 attributes the fact to decision 5,
   * which is the disclosure requirement, not the finding. */
  out.push('  GET /v1/blocks/{id}/children carries NO truncation signal (ADR-0006 decision 2).');
  out.push('  A complete enumeration and a silently truncated one both return has_more: false.');
  out.push('  The traversal spine of this scan is trusted blind, and this run discloses it');
  out.push('  rather than hiding it (ADR-0006 decision 5).');
  out.push('  request_status is tested positively only; its absence proves nothing either way');
  out.push('  and maps to `sufficient` (ADR-0006 decision 3).');

  out.push('');
  out.push('──────── REPORT ────────');
  /* A SCAN THAT DID NOT RUN HAS NO DISPOSITION, AND MUST NOT PRINT ONE.
   * deriveVerdict computes the disposition from gaps and violations, and a run
   * that failed its identity call has neither — so it returns `unqualified`,
   * which reads as a clean bill of health directly under "The scan did not run
   * as declared. No coverage claim is made." ADR-0005 decision 3's three values
   * describe a report of a scan that ran; exit 4 says this one did not.
   * verdict.ts is frozen (spec §5), so the suppression is here. Same rule the
   * findings section applies to baseline state: a value the run did not compute
   * is a false claim whichever value it carries. */
  out.push(
    r.verdict.exit === 4
      ? '  disposition:      none — the scan did not run as declared, so no disposition was formed'
      : `  disposition:      ${r.verdict.disposition}${r.verdict.disposition === 'disclaimed' ? '   ← NO SUMMARY VERDICT RENDERED' : ''}`,
  );

  /* A DISCLAIMED REPORT RENDERS NO SUMMARY VERDICT. ADR-0005 decision 3 gives
   * `disclaimed` exactly one behaviour — "No summary verdict is rendered. The
   * manifest and the findings are still printed" — and the headline coverage
   * figure and the conformity ratio are the summary verdict. Printing them under
   * "← NO SUMMARY VERDICT RENDERED" contradicted the line above them.
   *
   * The arithmetic makes it worse than a formatting slip. A disclaimed run is
   * disclaimed because a gap is unbounded, so its applicable set is a number the
   * run has just declared unestablishable — and decision 3 rejects a percentage
   * threshold on exactly that ground: it would be "computed over a denominator
   * the scan has just admitted it cannot establish."
   *
   * The VECTOR still prints. It is per-rule evidence, not a summary. */
  const summaryVerdictWithheld = r.verdict.disposition === 'disclaimed';

  /* ADR-0011 decision 4. One row per rule over that rule's OWN coverage item,
   * every figure carrying its unit, and the headline is the MINIMUM over the
   * vector — never a mean, never a count pooled across rules, because counts of
   * different things do not add. The vector is printed first and the headline
   * second, because the headline may not be published without it. */
  out.push('  coverage vector:');
  if (!r.coverage.length) {
    /* ADR-0011 decision 6: a rule with an empty applicable set leaves the
     * vector. Every rule empty means the scan judged nothing, and that must not
     * read as coverage. */
    out.push('    (empty — no rule had an applicable subject; no coverage figure exists)');
  }
  for (const row of r.coverage) out.push(`    ${row.rule.padEnd(8)} ${formatRow(row)}`);
  const headline = headlineCoverage(r.coverage);
  out.push(
    `  headline:         ${
      summaryVerdictWithheld
        ? 'WITHHELD — the disposition is disclaimed, so no summary verdict is rendered (ADR-0005 decision 3)'
        : headline
          ? `${formatRow(headline)} — the MINIMUM of the vector, set by ${headline.rule}`
          : 'none — the vector is empty'
    }`,
  );

  out.push(`  funnel:           ${r.verdict.evaluated}/${r.verdict.applicable} resources evaluated · ${r.manifest.reached('fetched')}/${r.verdict.applicable} fetched   (unit: resources)`);
  for (const [rule, o] of Object.entries(r.outcomes))
    out.push(
      `  outcome ${rule}:   conformity ${o.conformity ?? 'ABSENT — the evaluated set is empty, so no verdict was formed'}` +
      ` · evidence ${o.evidence ?? 'ABSENT — the applicable set is empty, so there is nothing for evidence to cover'}`,
    );

  /* ADR-0005 decision 4: the conformity ratio and the coverage figure are
   * published TOGETHER OR NOT AT ALL. Printing conformity alone is the Great
   * Expectations defect — a suite in which half the expectations never ran can
   * report 100%. A rule whose conformity is absent is excluded from the
   * denominator rather than scored as a failure. */
  const claimed = Object.values(r.outcomes).filter(o => o.conformity !== null);
  out.push(
    `  conformity ratio: ${
      summaryVerdictWithheld
        ? 'WITHHELD — the disposition is disclaimed (ADR-0005 decision 3)'
        : claimed.length
          ? `${claimed.filter(o => o.conformity === 'conforms').length}/${claimed.length} rules conforming (unit: rules that reached a conformity claim)`
          : 'none — no rule formed a conformity verdict, so there is no ratio'
    }`,
  );
  out.push(`  requests:         ${r.requestCount} · wall ${r.wallMs} ms   (NOT a validated budget — #7 owns that)`);
  /* THE UNIT IS APPENDED HERE BECAUSE THE REASON STRING DOES NOT CARRY ONE.
   * deriveVerdict builds `why` as "…coverage 3/4 is below the declared
   * threshold", a bare ratio, and spec criterion 6 and ADR-0011 decision 4 both
   * forbid printing a figure without naming what it counts. verdict.ts is
   * copied verbatim from a frozen prototype (spec §5), so the reason string is
   * not edited here; the render layer names the unit instead. The real remedy is
   * an ADR permitting the prototype and this file to diverge — filed as the
   * follow-up on #43, not decided in it. The figures in `why` are RESOURCES:
   * deriveVerdict is fed the funnel counts, which stage resources. */
  out.push(`  exit:             ${r.verdict.exit}   (${r.verdict.why})   [figures in this reason are resources]`);

  out.push('');
  out.push('──────── CALLS MADE (read-only) ────────');
  for (const c of r.calls) out.push(`  ${String(c.status).padEnd(4)} ${c.code ?? ''} ${c.endpoint}`);

  return out;
}
