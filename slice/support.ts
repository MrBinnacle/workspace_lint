/* No belief is kept without a reason — issue #124.
 *
 * The mechanism. `CHECK-support.ts` is the suite over it.
 *
 * WHY THIS EXISTS. Issue #124 measured ~180 assertions about Notion across the
 * ADRs and NINE followable locators. Issue #125 then checked four of them and
 * reversed all four. The question that measurement leaves open is not "which
 * assertions are wrong" — it is "when one turns out to be wrong, what else
 * falls?", and on 2026-08-19 the repository had no way to answer it.
 *
 * `docs/research/vendor-assumption-drift-prior-art.md` §4.1 names the machinery.
 * AGM belief revision is a SEMANTICS and gives no procedure. Truth Maintenance
 * Systems give the procedure: support lists, IN/OUT labels, and
 * dependency-directed backtracking. Doyle's rule, quoted in the TMS bibliography
 * (DOI 10.1609/aimag.v11i4.866):
 *
 *   "no belief is kept without a reason"
 *
 * We violate that for roughly 171 of ~180 assertions. **Nine locators in 180
 * assertions means the support graph is essentially unconnected — and that is
 * WHY four errors propagated silently. There were no edges for a retraction to
 * travel along.**
 *
 * WHAT THIS BUILDS, AND WHAT IT DOES NOT.
 *
 * The edges already exist as a convention: ten of fourteen ADRs carry a
 * `- **Evidence:**` line. This reads those lines and makes the graph checkable.
 * It is DOCUMENT granularity, not per-assertion — it answers "which ADRs rest on
 * this document" and not "which sentence rests on which quote". That is a real
 * limit and it is stated rather than implied away: #124's full fix is
 * per-assertion and this is not it.
 *
 * THE FIRST TRAVERSAL FOUND SOMETHING NOBODY HAD SEEN. ADR-0014's Evidence line
 * begins "ADR-0002 findings 1-3 and its decision". ADR-0002 finding 1 was refuted
 * on 2026-08-19 (ADR-0015). So the ADR that removed search from the v0.1 scan
 * rests on a withdrawn support — and nothing surfaced that for three days,
 * because nobody traversed the edges.
 *
 * IN AND OUT, AND WHY OUT IS NOT FALSE. A derived belief whose support is
 * withdrawn goes OUT: it is no longer justified, which is a different claim from
 * being wrong. ADR-0014 is not reversed by this file and must not be read as
 * reversed. Deciding WHICH belief to retract when a contradiction appears is
 * "culprit selection", under-determined by construction, and this file
 * deliberately does not attempt it — it reports the OUT set and stops.
 *
 * A BASE BELIEF IS ONE WITH AN EMPTY SUPPORT LIST. Under TMS it must be checked
 * against the world rather than against premises. Four ADRs carry no Evidence
 * line and are therefore base beliefs.
 *
 * ⛔ THEY CANNOT BE EDITED TO SAY SO. "ADRs are never edited in place" is a
 * standing constraint of this repository, so a base belief is DECLARED in
 * `support-baseline.json` — the same sidecar pattern `negation-baseline.json`
 * uses for the same reason. A NEW ADR with no Evidence line and no baseline entry
 * FAILS, which is what keeps the convention from decaying.
 *
 * WHAT THIS DOES NOT COVER — stated, never implied away.
 *
 *   - IT CANNOT TELL WHETHER A SUPPORT IS ADEQUATE. An Evidence line naming a
 *     file that exists satisfies this file completely, whether or not the file
 *     says what the ADR claims it says.
 *   - IT READS ONE LINE PER DOCUMENT. An ADR that cites a source in its prose and
 *     not in its Evidence line has an edge this never sees.
 *   - IT IS NOT TRANSITIVE THROUGH RESEARCH FILES. `docs/research/` files carry
 *     no Evidence line of their own, so the graph stops at them.
 */

import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadBaseline as loadNegationBaseline } from './negation.js';

/** The Evidence line, which is the support list. One per document, by convention. */
const EVIDENCE = /^-\s+\*\*Evidence:\*\*\s*(.+)$/m;

/** A repository path inside backticks. Deliberately narrow: `dir/file.ext`. */
const PATH_IN_TICKS = /`([A-Za-z0-9_./-]+\.(?:md|ts|json))`/g;

/** An ADR reference in prose — `ADR-0002`, with or without backticks. */
const ADR_REF = /\bADR-(\d{4})\b/g;

export type Node = {
  /** Repo-relative path of the ADR. */
  file: string;
  /** `0002`, used for ADR-to-ADR edges. */
  number: string;
  /** True when the document carries no Evidence line at all — a BASE belief. */
  base: boolean;
  /** ADR numbers this document cites as support. */
  adrs: string[];
  /** Repo-relative file paths this document cites as support. */
  files: string[];
};

export function adrFiles(repo: string): string[] {
  const dir = join(repo, 'docs', 'adr');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => /^\d{4}-.*\.md$/.test(f)).sort().map(f => `docs/adr/${f}`);
}

/**
 * One document's support list.
 *
 * URLs, issue numbers and clause references are deliberately NOT extracted. They
 * are real supports and this file cannot check them — a URL needs the network,
 * which the gate does not have. Pretending to check them would be worse than
 * omitting them, so the omission is stated here and in the header.
 */
export function parseNode(text: string, file: string): Node {
  const number = file.slice(file.lastIndexOf('/') + 1, file.lastIndexOf('/') + 5);
  const m = text.match(EVIDENCE);
  if (!m) return { file, number, base: true, adrs: [], files: [] };

  const line = m[1]!;
  const files = [...line.matchAll(PATH_IN_TICKS)].map(x => x[1]!);
  /* Self-references are dropped: an ADR citing its own number is not a support
   * edge, and a self-loop would make the OUT traversal non-terminating in the
   * least useful way. */
  const adrs = [...new Set([...line.matchAll(ADR_REF)].map(x => x[1]!))].filter(n => n !== number);
  return { file, number, base: false, adrs, files: [...new Set(files)] };
}

export type Graph = { nodes: Node[]; byNumber: Map<string, Node> };

export function buildGraph(repo: string): Graph {
  const nodes = adrFiles(repo).map(f => parseNode(readFileSync(join(repo, f), 'utf8'), f));
  return { nodes, byNumber: new Map(nodes.map(n => [n.number, n])) };
}

/** A cited path that is not on disk. A broken support must be loud. */
export function danglingEdges(graph: Graph, repo: string): { from: string; missing: string }[] {
  const out: { from: string; missing: string }[] = [];
  for (const n of graph.nodes) {
    for (const f of n.files) if (!existsSync(join(repo, f))) out.push({ from: n.file, missing: f });
    for (const a of n.adrs) if (!graph.byNumber.has(a)) out.push({ from: n.file, missing: `ADR-${a}` });
  }
  return out;
}

export type BaseDeclaration = { file: string; note: string };

export function loadSupportBaseline(repo: string): BaseDeclaration[] {
  const p = join(repo, 'slice', 'support-baseline.json');
  if (!existsSync(p)) return [];
  return JSON.parse(readFileSync(p, 'utf8')) as BaseDeclaration[];
}

/**
 * Documents carrying a REFUTED sentence — the sources a retraction starts from.
 *
 * Read off `negation-baseline.json`'s `disposition` field rather than from a
 * second list, so there is one place a refutation is recorded. `CONTESTED` does
 * NOT start a retraction: contested means nobody has established it either way,
 * and putting dependents OUT on an unsettled premise would be the overshoot this
 * whole line of work exists to avoid.
 */
export function refutedSources(repo: string): string[] {
  return [...new Set(
    loadNegationBaseline(repo)
      .filter(b => (b.disposition ?? '').startsWith('REFUTED'))
      .map(b => b.file),
  )];
}

export type OutEntry = { file: string; via: string; reason: string };

/**
 * Dependency-directed backtracking, one hop at a time until it closes.
 *
 * An ADR is OUT when it cites a refuted document, or when it cites an ADR that is
 * already OUT. The source document itself is NOT listed — it is where the
 * retraction starts, not something the retraction knocked over.
 */
export function outSet(graph: Graph, refuted: string[]): OutEntry[] {
  const refutedSet = new Set(refuted);
  const out = new Map<string, OutEntry>();

  for (const n of graph.nodes) {
    if (refutedSet.has(n.file)) continue;
    const hit = n.files.find(f => refutedSet.has(f)) ?? n.adrs.map(a => graph.byNumber.get(a)).find(t => t && refutedSet.has(t.file))?.file;
    if (hit) out.set(n.file, { file: n.file, via: hit, reason: 'cites a document carrying a REFUTED claim' });
  }

  /* Close the set. Bounded by the node count, so a cycle terminates rather than
   * spinning — an ADR pair citing each other is a documentation defect, not a
   * reason for this function to hang. */
  for (let pass = 0; pass < graph.nodes.length; pass++) {
    let grew = false;
    for (const n of graph.nodes) {
      if (out.has(n.file) || refutedSet.has(n.file)) continue;
      const via = n.adrs.map(a => graph.byNumber.get(a)).find(t => t && out.has(t.file));
      if (via) {
        out.set(n.file, { file: n.file, via: via.file, reason: 'cites an ADR that is itself OUT' });
        grew = true;
      }
    }
    if (!grew) break;
  }
  return [...out.values()];
}
