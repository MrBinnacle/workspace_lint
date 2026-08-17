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
    out.push(`  ${label(e.alias, e.key).padEnd(width)} ${STAGES.map((s: Stage) => (e.stages.has(s) ? '●' : '○')).join(' ')}  ${e.cause}`);
  out.push(`  ${''.padEnd(width)} ${STAGES.map(s => s[0]).join(' ')}   (declared resolved enumerated fetched evaluated)`);
  if (!opts.showTitles) out.push('  page titles redacted by default; --show-titles opts in');

  out.push('');
  out.push('──────── GAPS ────────');
  if (!r.gaps.length) out.push('  none');
  for (const g of r.gaps)
    out.push(`  ${g.bounded ? 'bounded  ' : 'UNBOUNDED'} ${g.resource}  ${g.isRootMiss ? '[declared root never reached] ' : ''}${g.cause}`);

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
  out.push(`  disposition:      ${r.verdict.disposition}${r.verdict.disposition === 'disclaimed' ? '   ← NO SUMMARY VERDICT RENDERED' : ''}`);
  out.push(`  coverage vector:  EMPTY — this slice implements no rule, so no rule has a coverage item (ADR-0011)`);
  out.push(`  funnel:           ${r.verdict.evaluated}/${r.verdict.applicable} resources evaluated · ${r.manifest.reached('fetched')}/${r.verdict.applicable} fetched   (unit: resources)`);
  out.push(`  conformity:       withheld — no rule ran, so no invariant was tested`);
  out.push(`  requests:         ${r.requestCount} · wall ${r.wallMs} ms   (NOT a validated budget — #7 owns that)`);
  out.push(`  exit:             ${r.verdict.exit}   (${r.verdict.why})`);

  out.push('');
  out.push('──────── CALLS MADE (read-only) ────────');
  for (const c of r.calls) out.push(`  ${String(c.status).padEnd(4)} ${c.code ?? ''} ${c.endpoint}`);

  return out;
}
