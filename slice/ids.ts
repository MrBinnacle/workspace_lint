/* Notion object identity.
 *
 * CONTEXT.md settled defaults: "Identity is the stable ID. Names are report-only
 * aliases." Both the config loader and the coverage manifest key on the output of
 * this file, and they must agree byte for byte — the first live run keyed the
 * manifest on titles and counted one resource twice, so the denominator read 5
 * for 4 resources (docs/proof/results-ref001-live.md §5).
 */

/** 32 hex digits, hyphenated 8-4-4-4-12 or bare. Nothing else is an ID. */
const BARE = /^[0-9a-f]{32}$/i;
const HYPHENATED = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Normalize an ID to its hyphenated form, or return null if the input is not an
 * ID. Returning null is the whole point: a caller that cannot get an ID must
 * reject, never guess. There is deliberately no fallback to the raw string.
 */
export function hyphenate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();
  if (HYPHENATED.test(s)) return s;
  if (BARE.test(s)) return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
  return null;
}

export const isNotionId = (raw: string | null | undefined): boolean => hyphenate(raw) !== null;
