/* THROWAWAY. REF001 link recognition, implementing docs/spec/REF001-link-recognition.md.
 *
 * Pure. No I/O, no network, no .env. That is the point: the previous red test
 * could not exercise link DISCOVERY because discovery was welded to a live client,
 * so the only reachable control injected a known-bad ID and passed whether or not
 * discovery worked. This module is the seam that makes discovery testable offline.
 *
 * Run the checks:  npx tsx CHECK-link-recognition.ts
 */

/* ------------------------------------------------------------------ types -- */

export type Unrecognised = {
  kind: 'unrecognised';
  href: string;
  /* Spec §5. Exactly two causes. `skipped: error` is banned by ADR-0005
   * decision 5 constraint 2 and no generic cause may be added here. */
  cause: 'link-host-unrecognised' | 'href-unparseable';
  sourceBlock: string;
};

export type Reference =
  | { kind: 'internal'; targetId: string; via: string; sourceBlock: string }
  | { kind: 'external'; href: string; sourceBlock: string }
  | Unrecognised;

export type HostEntry = { host: string; pattern: RegExp; evidence: 'observed' | 'documented' };

/* --------------------------------------------------------------- host set -- */

/* Spec §2.1. An entry needs a locator. `notion.so`, `www.notion.so` and
 * `notion.com` are NOT here: they are `not checked`, and the spec's §7 makes
 * "no host without a locator" non-negotiable. They are reported through the
 * residue path meanwhile, which costs precision and not soundness.
 *
 * This list can never be complete. Notion documents custom domains for Sites,
 * so a page can be served from a domain Notion does not own. The residue path
 * below is the mechanism; this list is an optimisation that suppresses noise. */
export const KNOWN_INTERNAL_HOSTS: HostEntry[] = [
  { host: 'app.notion.com', pattern: /^app\.notion\.com$/i, evidence: 'observed' },
  { host: '*.notion.site', pattern: /\.notion\.site$/i, evidence: 'documented' },
];

/* --------------------------------------------------------------- ID shape -- */

const UUID = /([0-9a-f]{8})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{12})/i;

export function hyphenate(s: string): string | null {
  const m = UUID.exec(s);
  return m ? `${m[1]}-${m[2]}-${m[3]}-${m[4]}-${m[5]}`.toLowerCase() : null;
}

/* ---------------------------------------------------------- the classifier -- */

/**
 * Spec §4. Three outcomes, first match wins. The residue is non-empty by
 * construction: step 3 keys on the ID shape, so an internal link on an
 * unknown host cannot reach `external`.
 *
 * `hosts` is a parameter rather than a module constant so a test can mutate it.
 * A control that cannot be mutated cannot show the mechanism is load-bearing.
 */
export function classifyHref(
  href: string,
  sourceBlock: string,
  hosts: HostEntry[] = KNOWN_INTERNAL_HOSTS,
): Reference {
  const id = hyphenate(href);

  let host: string | null = null;
  try {
    host = new URL(href).host;
  } catch {
    /* Relative and malformed hrefs both land here. A relative `/`-prefixed href
     * is very probably internal, and "very probably" is not a locator — the
     * shape is marked speculative in spec §3 and has never been observed. It is
     * reported rather than claimed. */
    host = null;
  }

  if (host === null) {
    if (!id) return { kind: 'external', href, sourceBlock };
    return { kind: 'unrecognised', href, cause: 'href-unparseable', sourceBlock };
  }

  if (hosts.some(h => h.pattern.test(host!))) {
    if (!id) return { kind: 'external', href, sourceBlock };
    return { kind: 'internal', targetId: id, via: `href(${host})`, sourceBlock };
  }

  /* Step 5, and it is the whole design. Deliberately over-reports: a non-Notion
   * URL carrying 32 hex characters is called unrecognised and appears as a gap
   * that is not a gap. That costs precision. The other error costs soundness —
   * it is CONTEXT.md Non-goal 4, hiding an access gap inside a passing result,
   * and it is the defect observed on 2026-08-17. The costs are not symmetric. */
  if (id) return { kind: 'unrecognised', href, cause: 'link-host-unrecognised', sourceBlock };

  return { kind: 'external', href, sourceBlock };
}

/* -------------------------------------------------------------- extraction -- */

/**
 * Spec §3. Route A (structural, host-free) is tried before Route B (href).
 *
 * Deduplicates on the resolved target ID, never on the detection route. The
 * rich-text reference defines `href` as "The URL of any link or Notion mention
 * in this text", so a mention appears on BOTH routes and a route-keyed dedupe
 * counts it twice — the same double-count recorded in results-ref001-live.md §5.
 */
export function extractReferences(blocks: any[]): Reference[] {
  const out: Reference[] = [];

  for (const b of blocks) {
    const blockId = String(b?.id ?? '(unknown block)');

    /* -- Route A: structural, no host parsing ------------------------------ */
    if (b?.type === 'link_to_page') {
      const pid = b.link_to_page?.page_id ?? b.link_to_page?.database_id;
      const id = pid ? hyphenate(String(pid)) : null;
      if (id) out.push({ kind: 'internal', targetId: id, via: 'link_to_page', sourceBlock: blockId });
    }

    const rich: any[] = b?.[b?.type]?.rich_text ?? [];

    for (const t of rich) {
      if (t?.type === 'mention') {
        const m = t.mention;
        const pid = m?.type === 'page' ? m.page?.id : m?.type === 'database' ? m.database?.id : null;
        const id = pid ? hyphenate(String(pid)) : null;
        if (id) {
          /* This reference survives the permission failure it reports. The API
           * reference: "If a connection doesn't have access to the mentioned
           * page, then the mention is returned with just the ID." */
          out.push({ kind: 'internal', targetId: id, via: `mention(${m.type})`, sourceBlock: blockId });
          continue;
        }
      }

      /* -- Route B: href parsing ------------------------------------------ */
      const href = t?.href ?? t?.text?.link?.url;
      if (!href) continue;
      out.push(classifyHref(String(href), blockId));
    }
  }

  const seen = new Set<string>();
  return out.filter(r => {
    const key = r.kind === 'internal' ? `i|${r.targetId}` : `${r.kind}|${r.href}|${r.sourceBlock}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const internalRefs = (rs: Reference[]) =>
  rs.filter((r): r is Extract<Reference, { kind: 'internal' }> => r.kind === 'internal');

export const unrecognisedRefs = (rs: Reference[]) =>
  rs.filter((r): r is Unrecognised => r.kind === 'unrecognised');
