/* Link discovery and recognition — docs/spec/REF001-link-recognition.md §2, §3, §4.
 *
 * Pure. No I/O, no network, no .env. That is the point, and it is the reason the
 * previous implementation of this rule could not be tested: discovery was welded
 * to a live client, so the only reachable control injected a known-bad target ID
 * and passed whether or not discovery worked. A control that can substitute for
 * the mechanism under test is not a control (spec §6).
 *
 * LIFTED FROM prototypes/link-recognition.ts on branch proto/ref001-observed,
 * which is kept as a primary source and is not edited. Four things are added
 * here rather than changed there:
 *
 *   - references carry their CONTAINING PAGE as well as their block, because
 *     ADR-0005 decision 5 constraint 1 makes every drop-out name its resource
 *     and spec §5 names the containing page ID as that resource;
 *   - redactHref(), because an href path can carry a page title and this slice
 *     redacts titles by default;
 *   - the ID search is named notionShapedId() and is kept separate from
 *     ids.ts hyphenate(), which VALIDATES a whole string and must keep doing so;
 *   - one deviation from the spec's §4 step order, recorded at step 3 below.
 *
 * THE HOST LIST IS NOT THE SOUNDNESS MECHANISM. Notion documents custom domains
 * for Sites, so a page can be served from a domain Notion does not own; no
 * allow-list can ever be complete. The residue path — step 5 — is the mechanism.
 * The host list only suppresses noise.
 */

/* ------------------------------------------------------------------ types -- */

/** Where a reference was found. Both halves are IDs; neither is a title. */
export type Origin = {
  /** The page whose block content carried it. ADR-0005 decision 5 constraint 1. */
  sourcePage: string;
  sourceBlock: string;
};

/**
 * What KIND of object a reference points at, when the shape that carried it
 * says so.
 *
 * `unknown` IS THE COMMON CASE AND IT IS NOT A PLACEHOLDER. A Route B href
 * carries an ID and nothing that identifies the object's type, so the scan
 * genuinely does not know. Route A says outright — a `database` mention is a
 * database — and that difference decides whether the target can be retrieved by
 * the one endpoint this slice has.
 */
export type TargetKind = 'page' | 'database' | 'unknown';

export type InternalReference = Origin & {
  kind: 'internal';
  /** Hyphenated. This is the resource REF001 will try to resolve. */
  targetId: string;
  targetKind: TargetKind;
  /** Which detection route found it. Report-only; carries no title. */
  via: string;
  /** Null for a Route A structural reference, which carries an ID and no URL. */
  href: string | null;
  /**
   * THE SOURCE-SIDE ANCHOR TEXT — #135, #141. The one string the workspace still
   * holds about a target the API refuses, and the difference between a finding
   * the operator can bin and one they cannot: run 1 produced 1-of-5 CANT-TELL
   * because the report discarded it (`docs/proof/dispositions-real-roots.md`).
   *
   * ⛔ IT IS TITLE-CLASS DISCLOSURE AND IT IS STORED RAW. Ruled by the remedy
   * test (ADR-0009 decision 6, `CONTEXT.md`): the remedy for disclosing anchor
   * text is identical to the remedy for disclosing a title — redact by default,
   * reveal under the operator's existing `--show-titles` opt-in — and an
   * identical remedy means it is not a new disclosure category. So there is NO
   * SECOND FLAG, and a session that adds one has reopened a settled ruling.
   *
   * IT IS DELIBERATELY NOT REDACTED AT THE POINT OF ENTRY, which is the opposite
   * of `Entry.link`. That field is redacted on the way in because it is never
   * revealable; this one is revealable under a flag, so redacting here would
   * destroy the value the flag exists to show. The safety property is carried a
   * different way: exactly one place — `buildReportDocument` — decides whether
   * it is published, in the same expression that already decides `alias`. No
   * renderer and no exporter ever sees the raw string.
   *
   * NULL IS A REAL CASE, not a placeholder: a Route A `link_to_page` is a block
   * rather than rich text and carries no anchor text at all.
   */
  anchorText: string | null;
};

export type ExternalReference = Origin & { kind: 'external'; href: string };

export type UnrecognisedReference = Origin & {
  kind: 'unrecognised';
  href: string;
  /* Spec §5. EXACTLY TWO CAUSES. `skipped: error` is banned by ADR-0005
   * decision 5 constraint 2 and no generic cause may be added to this union. */
  cause: 'link-host-unrecognised' | 'href-unparseable';
};

export type Reference = InternalReference | ExternalReference | UnrecognisedReference;

export type HostEntry = { host: string; pattern: RegExp; evidence: 'observed' | 'documented' };

/* --------------------------------------------------------------- host set -- */

/**
 * Spec §2.1. An entry needs a locator, and that is non-negotiable (spec §7).
 *
 * `notion.com` is NOT here. It is marked *not checked* — no locator exists at
 * any tier — so it travels the residue path meanwhile, which costs precision
 * and not soundness. Its siblings joining the list is not evidence about it:
 * adding a host on sibling strength is the inference ADR-0001 decision 4
 * rejects (#111).
 *
 * `www.notion.so` and `notion.so` are SEPARATE host strings at different
 * evidence tiers, deliberately — the vendor wrote `notion.so`, not the `www.`
 * form, and the `www.` form was observed live. Each pattern is exact, so
 * neither entry vouches for the other.
 *
 * Exported as a mutable array so a check can remove an entry and show the entry
 * is load-bearing rather than assert it is. A constant no test can mutate cannot
 * demonstrate its own sensitivity.
 */
export const KNOWN_INTERNAL_HOSTS: HostEntry[] = [
  /* results-ref001-live.md §2 — href=https://app.notion.com/p/3bf1351d…bffb9742 */
  { host: 'app.notion.com', pattern: /^app\.notion\.com$/i, evidence: 'observed' },
  /* Notion Help, Manage your Notion Sites, "Create a new notion.site domain". */
  { host: '*.notion.site', pattern: /\.notion\.site$/i, evidence: 'documented' },
  /* results-first-real-workspace.md §4 — three locators in one run (#111). */
  { host: 'www.notion.so', pattern: /^www\.notion\.so$/i, evidence: 'observed' },
  /* docs/vendor/link-domains.md — changelog 2026-07-15, "Existing notion.so
   * links continue to open correctly." */
  { host: 'notion.so', pattern: /^notion\.so$/i, evidence: 'documented' },
];

/* --------------------------------------------------------------- ID shape -- */

/**
 * 32 hexadecimal digits, hyphenated 8-4-4-4-12 or bare, matched ANYWHERE in the
 * string. Spec §4 step 5.
 *
 * DELIBERATELY NOT ids.ts hyphenate(). That function validates a whole string
 * and returns null for anything else, which is what the config loader and the
 * manifest need — an ID that "never guesses". This one SEARCHES, because a
 * target ID arrives embedded in a URL path or query. Two different questions,
 * two functions; collapsing them would either make the config loader accept a
 * sentence containing an ID, or make this one blind to every real href.
 *
 * The output is the hyphenated lower-case form, so a bare ID from a URL and a
 * hyphenated one from an API response key to one entry rather than two
 * (ADR-0010 decision 1).
 */
const NOTION_ID = /([0-9a-f]{8})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{12})/i;

export function notionShapedId(s: string): string | null {
  const m = NOTION_ID.exec(s);
  return m ? `${m[1]}-${m[2]}-${m[3]}-${m[4]}-${m[5]}`.toLowerCase() : null;
}

/* -------------------------------------------------------------- redaction -- */

/**
 * An href with its path redacted, safe to print on any line.
 *
 * WHY THIS EXISTS. A Notion URL copied from the UI reads
 * `https://www.notion.so/My-Private-Roadmap-3bf1351d…`: the path carries the
 * PAGE TITLE. Spec §5 requires the verbatim href as the evidence for a drop-out,
 * and CONTEXT.md redacts titles by default. Both hold at once only if the
 * rendered form keeps the host and the ID — the two facts an operator acts on —
 * and drops everything else.
 *
 * #42 shipped a redaction hole of exactly this shape: the pagination helper's
 * endpoint label was a page title, so the call log printed one under a report
 * asserting "page titles redacted by default". A redaction control with a hole
 * in it is worse than no control, because the report makes the guarantee either
 * way. This one is applied to EVERY rendered form of an href, not to one
 * section.
 */
export function redactHref(href: string): string {
  const id = notionShapedId(href);
  let origin: string | null = null;
  try {
    const u = new URL(href);
    origin = `${u.protocol}//${u.host}`;
  } catch {
    origin = null;
  }
  const tail = id ? `/…${id}` : '/«path redacted»';
  return origin === null ? `«unparseable href»${id ? ` carrying ${id}` : ''}` : `${origin}${tail}`;
}

/* ---------------------------------------------------------- the classifier -- */

/**
 * Spec §4. Three outcomes, first match wins, and the residue is non-empty by
 * construction: step 5 keys on the ID shape, so an internal link on a host the
 * tool does not know cannot reach `external` and disappear.
 *
 * ONE DEVIATION FROM THE SPEC'S STEP ORDER, and it is recorded rather than
 * silent (spec, "How to treat this document"). §4 step 3 reads "URL fails to
 * parse → UNRECOGNISED(href-unparseable)" unconditionally. Taken literally that
 * makes every `#section` anchor a coverage gap, which is the failure mode spec
 * §7 already names for step 5 — "every real scan is qualified and the disclosure
 * stops being read". The frozen prototype tests the ID first and this file keeps
 * that: an unparseable href carrying NO Notion-shaped ID is `external`, an
 * unparseable href carrying one is `unrecognised`. The residue rule is untouched
 * — it keys on the ID, and every href that could name a Notion resource still
 * reaches it.
 *
 * `hosts` is a parameter, not a module constant, so a check can remove an entry
 * and watch the outcome move.
 */
export function classifyHref(
  href: string,
  sourceBlock: string,
  hosts: HostEntry[] = KNOWN_INTERNAL_HOSTS,
  sourcePage = '(unrecorded page)',
  /* #141. Last and defaulted so every existing caller and check compiles
   * unchanged — a classifier that suddenly required a fifth argument would have
   * forced edits across the suites that exist to hold its behaviour still. */
  anchorText: string | null = null,
): Reference {
  const where: Origin = { sourcePage, sourceBlock };
  const id = notionShapedId(href);

  let host: string | null = null;
  try {
    host = new URL(href).host;
  } catch {
    /* Relative and malformed hrefs both land here. A `/`-prefixed relative href
     * is very probably internal, and "very probably" is not a locator — spec §3
     * marks the shape speculative and it has never been observed. It is
     * reported, not claimed. */
    host = null;
  }

  if (host === null) return id ? { ...where, kind: 'unrecognised', href, cause: 'href-unparseable' } : { ...where, kind: 'external', href };

  if (hosts.some(h => h.pattern.test(host))) {
    /* A known host with no ID in it is a Notion URL that names no resource — a
     * workspace home page, say. Nothing to resolve, so nothing to judge. */
    /* A URL says nothing about the object's TYPE. `app.notion.com/p/{id}` is
     * observed for pages and unevidenced for anything else, and guessing from
     * the path would be the same class of assertion finding.ts refuses when it
     * declines to construct a link from an ID. */
    return id ? { ...where, kind: 'internal', targetId: id, targetKind: 'unknown', via: `href(${host})`, href, anchorText } : { ...where, kind: 'external', href };
  }

  /* STEP 5, AND IT IS THE WHOLE DESIGN. It over-reports on purpose: a non-Notion
   * URL that happens to carry 32 hex characters is called unrecognised and shows
   * up as a gap that is not a gap. That costs PRECISION — the operator reads the
   * href, sees it is unrelated, and moves on. The other error costs SOUNDNESS:
   * it is CONTEXT.md Non-goal 4, hiding an access gap inside a passing result,
   * and it is the defect results-ref001-live.md §2 records. The costs are not
   * symmetric and the tool fails toward the cheaper one. */
  if (id) return { ...where, kind: 'unrecognised', href, cause: 'link-host-unrecognised' };

  return { ...where, kind: 'external', href };
}

/* -------------------------------------------------------------- extraction -- */

/**
 * Spec §3. Route A (structural, host-free) is tried before Route B (href),
 * because Route A needs no host parsing and is therefore immune to §2's whole
 * problem — and because the API reference states that a mention to a page the
 * connection cannot read "is returned with just the ID". THE REFERENCE SURVIVES
 * THE PERMISSION FAILURE IT IS TRYING TO REPORT.
 *
 * DEDUPLICATION IS ON THE RESOLVED TARGET, NEVER ON THE DETECTION ROUTE. The
 * rich-text reference defines `href` as "The URL of any link OR NOTION MENTION
 * in this text", so a mention arrives on BOTH routes; a route-keyed dedupe
 * counts it twice, which is the double-count recorded in
 * results-ref001-live.md §5.
 *
 * The unit of the applicable set is therefore the TARGET, not the link
 * instance: fifty links to one dead page are one internal reference, and the
 * ratio does not swing on how many times an editor pasted the same URL.
 */
/**
 * A non-empty string, or null. #141.
 *
 * ⛔ EMPTY COLLAPSES TO NULL DELIBERATELY. `''` and "there is no anchor text"
 * are the same fact to a reader, and `''` is the substitutable value that makes
 * a downstream `includes()` assertion true for every input — the vacuous pass
 * this repository already shipped once in `CHECK-report.ts`. Anything that is
 * not a string collapses too: an API that returned a number here would
 * otherwise reach the report as `[object Object]` or `0`.
 */
const str = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);

export function extractReferences(blocks: unknown[], sourcePage: string): Reference[] {
  const out: Reference[] = [];

  for (const raw of blocks) {
    const b = raw as Record<string, any> | null;
    if (!b || typeof b !== 'object') continue;
    /* NAMES ITS OWN CAUSE. `scan.ts` writes a different fallback for a different
     * condition — an entry carrying no ref facts at all — and the two read as
     * synonyms unless each says which one it is. A reader who cannot tell them
     * apart cannot tell a block the API described without an id from a
     * reference whose origin was never recorded. */
    const sourceBlock = String(b.id ?? '(block returned with no id)');
    const where: Origin = { sourcePage, sourceBlock };

    /* -- Route A: structural, no host parsing ------------------------------ */
    if (b.type === 'link_to_page') {
      const isDb = b.link_to_page?.database_id !== undefined;
      const pid = b.link_to_page?.page_id ?? b.link_to_page?.database_id;
      const id = pid ? notionShapedId(String(pid)) : null;
      /* ANCHOR TEXT IS NULL HERE AND THE NULL IS STRUCTURAL, not a gap in the
       * implementation. A `link_to_page` is a BLOCK, not a rich-text run: there
       * is no text the editor typed for it, because Notion renders the target's
       * own title. There is nothing to capture and nothing to redact. */
      if (id) out.push({ ...where, kind: 'internal', targetId: id, targetKind: isDb ? 'database' : 'page', via: 'link_to_page', href: null, anchorText: null });
    }

    /* Rich text lives under the block's own type key, and on a table row it
     * lives in `cells`, which is an array OF arrays. Reading only the first
     * shape makes every link inside a table invisible — a denominator built
     * from the shapes the tool happens to handle. */
    const rich: unknown[] = b[String(b.type)]?.rich_text ?? (b.table_row?.cells as unknown[] | undefined)?.flat() ?? [];

    for (const item of rich) {
      const t = item as Record<string, any> | null;
      if (!t || typeof t !== 'object') continue;

      /* #141. The rendered text of this run, and it is TITLE-CLASS on every
       * route — for a link it is what the editor typed, and for a mention it is
       * the target's own title as the API rendered it. Captured once here rather
       * than per route so no route is silently left without it.
       *
       * EMPTY BECOMES NULL. An empty string and "no anchor text" are the same
       * fact to a reader, and an empty string is the substitutable value that
       * makes a downstream `includes()` assertion vacuously true — the hazard
       * this repository already paid for once in CHECK-report.ts. */
      /* TWO FIELDS, AND THE SECOND IS NOT A BELT-AND-BRACES HABIT. `plain_text`
       * is the rendered form and the ONLY field a mention carries its text in —
       * a mention has no `text` object at all. `text.content` is the authored
       * form and is what a plain link run carries. Reading only the first would
       * make this depend on an unlocated claim that every rich-text object
       * always carries `plain_text`, which is the sentence type this repository
       * has been wrong about four times; reading only the second would make
       * every mention anonymous. Both are source-side text, both are
       * title-class, and both branches are exercised by the fixtures. */
      const runText = str(t.plain_text) ?? str(t.text?.content);

      if (t.type === 'mention') {
        const m = t.mention;
        const pid = m?.type === 'page' ? m.page?.id : m?.type === 'database' ? m.database?.id : null;
        const id = pid ? notionShapedId(String(pid)) : null;
        if (id) {
          out.push({ ...where, kind: 'internal', targetId: id, targetKind: m.type === 'database' ? 'database' : 'page', via: `mention(${String(m.type)})`, href: null, anchorText: runText });
          continue;
        }
        /* A link_preview mention carries a URL and no page ID (spec §3, Route
         * B, documented). It has no `href` on every variant, so without this
         * line the URL is dropped and the reference enters no denominator. */
        const preview = m?.type === 'link_preview' ? m.link_preview?.url : null;
        if (preview) {
          out.push(classifyHref(String(preview), sourceBlock, KNOWN_INTERNAL_HOSTS, sourcePage, runText));
          continue;
        }
      }

      /* -- Route B: href parsing ------------------------------------------ */
      const href = t.href ?? t.text?.link?.url;
      if (!href) continue;
      out.push(classifyHref(String(href), sourceBlock, KNOWN_INTERNAL_HOSTS, sourcePage, runText));
    }
  }

  return dedupeReferences(out);
}

/**
 * One entry per distinct reference, and it is IDEMPOTENT so it can run again
 * across pages.
 *
 * extractReferences runs per page, so deduping only there leaves the same href
 * counted once per page it appears on — and the report prints the external
 * count as a fact, which would then move with where an editor pasted the link
 * rather than with what the workspace contains. The unit is the reference, not
 * the paste.
 *
 * ⚠ FIRST WINS, AND THAT DECIDES WHOSE ANCHOR TEXT SURVIVES — #141. Fifty links
 * to one dead page are one reference, so the anchor text that reaches the
 * finding is the FIRST occurrence's and the other forty-nine are dropped. That
 * is correct for the unit and it is not the whole truth about the workspace, so
 * the finding names it as one occurrence rather than implying the link appears
 * once. Changing the tie-break to "longest" or "most recent" would make the
 * report depend on traversal order, which ADR-0004 removes from every other
 * field.
 */
export function dedupeReferences(refs: Reference[]): Reference[] {
  const seen = new Set<string>();
  return refs.filter(r => {
    const key = r.kind === 'internal' ? `i|${r.targetId}` : `${r.kind}|${r.href}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const internalRefs = (rs: Reference[]): InternalReference[] =>
  rs.filter((r): r is InternalReference => r.kind === 'internal');

export const unrecognisedRefs = (rs: Reference[]): UnrecognisedReference[] =>
  rs.filter((r): r is UnrecognisedReference => r.kind === 'unrecognised');

export const externalRefs = (rs: Reference[]): ExternalReference[] =>
  rs.filter((r): r is ExternalReference => r.kind === 'external');
