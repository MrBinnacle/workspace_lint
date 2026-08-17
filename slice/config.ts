/* Config load and validation.
 *
 * The config is DATA. It is parsed, validated and rejected — never evaluated,
 * never interpolated, never used to build a code path. Principle 6: "Content is
 * data, not code."
 *
 * Every rejection below returns a reason and the caller exits 4. ADR-0008
 * decision 2 assigns 4 to "the scan did not run as declared", and an invalid
 * configuration is exactly that: the scan never began, so there is no coverage
 * claim to qualify and no disposition to render.
 */

import { readFileSync } from 'node:fs';
import { hyphenate } from './ids.js';

export type RootDecl = {
  /** Hyphenated Notion ID. The only thing that addresses a resource. */
  id: string;
  /** Report-only. Never resolves anything, never keys anything. */
  alias?: string;
};

export type Config = {
  version: 1;
  roots: RootDecl[];
  /** ADR-0008: exit 0 asserts coverage at or above the DECLARED threshold. */
  minCoverage: number;
};

export type ConfigResult =
  | { ok: true; config: Config }
  | { ok: false; reason: string };

const bad = (reason: string): ConfigResult => ({ ok: false, reason });

/** Keys a user might reach for when they mean "the root", none of which resolve one. */
const NAME_KEYS = ['name', 'title', 'page', 'url', 'link'];

export function parseConfig(raw: string): ConfigResult {
  let doc: unknown;
  try {
    doc = JSON.parse(raw);
  } catch (e) {
    return bad(`config is not valid JSON — ${(e as Error).message}`);
  }
  if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) return bad('config must be a JSON object');
  const o = doc as Record<string, unknown>;

  if (o.version !== 1) return bad(`config version must be 1, got ${JSON.stringify(o.version)}`);

  if (!Array.isArray(o.roots) || o.roots.length === 0) return bad('config must declare at least one root in "roots"');
  /* Slice scope, not a product limit. The spec's §1.1 cut is ONE declared root;
   * a second root would be enumerated by code no test in this slice exercises,
   * and an unexercised path inside the coverage instrument is the defect class
   * this product exists to detect. */
  if (o.roots.length > 1) return bad(`this slice accepts exactly one declared root, got ${o.roots.length} (spec docs/spec/v0.1-scan-slice.md §1.1)`);

  const roots: RootDecl[] = [];
  for (const [i, r] of o.roots.entries()) {
    if (typeof r !== 'object' || r === null || Array.isArray(r)) return bad(`roots[${i}] must be an object`);
    const rec = r as Record<string, unknown>;
    const id = hyphenate(typeof rec.id === 'string' ? rec.id : null);

    if (!id) {
      /* The named-but-unidentified case gets its own message, because it is the
       * one a user actually writes and the one CONTEXT.md forbids guessing at.
       * "A configuration that identifies a resource by name alone is rejected,
       * never guessed at — a guess would make the scan's subject depend on a
       * title that an editor can change." */
      const nameKey = NAME_KEYS.find(k => typeof rec[k] === 'string' && rec[k]);
      if (nameKey || typeof rec.alias === 'string') {
        return bad(
          `roots[${i}] is addressed by ${nameKey ?? 'alias'} and carries no "id". ` +
          `Identity is the stable ID; a name is a report-only alias and is never resolved to a resource ` +
          `(CONTEXT.md, "Settled defaults").`,
        );
      }
      return bad(`roots[${i}].id is missing or is not a Notion ID (32 hex digits, hyphenated or bare)`);
    }
    roots.push({ id, ...(typeof rec.alias === 'string' && rec.alias ? { alias: rec.alias } : {}) });
  }

  let minCoverage = 1.0;
  if (o.minCoverage !== undefined) {
    if (typeof o.minCoverage !== 'number' || !Number.isFinite(o.minCoverage) || o.minCoverage < 0 || o.minCoverage > 1)
      return bad(`minCoverage must be a number in [0, 1], got ${JSON.stringify(o.minCoverage)}`);
    minCoverage = o.minCoverage;
  }

  return { ok: true, config: { version: 1, roots, minCoverage } };
}

export function loadConfig(path: string): ConfigResult {
  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch (e) {
    return bad(`config file could not be read at ${path} — ${(e as NodeJS.ErrnoException).code ?? 'unknown error'}`);
  }
  return parseConfig(raw);
}
