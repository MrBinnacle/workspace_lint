/* Normalization — ADR-0004.
 *
 * "Determinism is defined against Normalization: a named, versioned function
 * that strips volatile fields from an API response before hashing, comparison,
 * or persistence." Determinism is defined against THIS function's output, never
 * against the raw response.
 *
 * ADR-0004 decision 4 names the canonicalisation standard: RFC 8785, the JSON
 * Canonicalization Scheme. docs/research/static-analysis-prior-art.md carries
 * the warning that goes with it — "naive JSON.stringify with sorted keys is NOT
 * JCS, because number formatting and UTF-16 ordering differ from what most sort
 * implementations produce."
 *
 * THAT WARNING IS CORRECT AND IT IS AIMED AT OTHER LANGUAGES. On this
 * toolchain three of RFC 8785's four requirements are supplied by the platform,
 * and the fourth is not. Each row was measured on Node 22 / TypeScript 7 before
 * this file was written, not assumed:
 *
 *   RFC 8785 requirement                       | this platform
 *   -------------------------------------------|---------------------------------
 *   Keys sorted by UTF-16 code unit, ascending, | Array.prototype.sort() IS that
 *   shorter prefix before longer                | order. Measured: A Z a a1 ab abc
 *                                               | b } ~ é 😀, and 'ab' < 'abc'.
 *   Numbers per ECMAScript Number::toString     | JSON.stringify already emits it.
 *                                               | Measured: 1e+21, 1e-7, 5e-324,
 *                                               | 333333333.3333333.
 *   Control chars U+0000–U+001F as lowercase    | JSON.stringify matches, including
 *   \uhhhh, except the five short forms         | \t and .
 *   Lone surrogates are an ERROR                | DIVERGES. JSON.stringify('\ud800')
 *                                               | returns "\ud800" rather than
 *                                               | failing. Closed by requireWellFormed().
 *
 * So canonicalize() is a recursive key sort, a lone-surrogate rejection, and
 * JSON.stringify. The rejection is the only clause this file implements itself,
 * and it is the only one a reader needs to audit as new code. Everything else is
 * a citation to a platform behaviour that was executed and recorded above.
 *
 * NO DEPENDENCY. A JCS package would add an install-time attack surface to
 * replace twenty lines whose whole content is "sort the keys".
 */

/**
 * The version of this function, and it is part of the artifact — ADR-0004:
 * "Normalization is a versioned artifact with its own compatibility surface.
 * Changing it changes every fingerprint downstream, so it needs a version field
 * and a migration story before v0.2, not after."
 *
 * CHANGING THE VOLATILE SET OR THE SORT ORDER IS A VERSION BUMP. A reader
 * comparing two reports needs to know whether a byte difference is the workspace
 * or the normaliser.
 */
export const NORMALIZATION_VERSION = 'wl-norm-1';

/**
 * What `wl-norm-1` strips, and why each one cannot survive a byte-identity test
 * over an unchanged workspace. Published INSIDE the report, so the reader sees
 * what was withheld rather than inferring it from an absence.
 *
 * This extends ADR-0004 decision 1's v0.1 exclusion set — signed URLs reduced to
 * path-only, `expiry_time`, `request_id`, `last_edited_time` out of identity —
 * to the fields this artifact actually carries. None of those four reach the
 * report: the slice persists no API response.
 */
export const VOLATILE_FIELDS: readonly string[] = [
  'wallMs — wall clock, and it differs on every run by construction',
  'requestCount — a retry on a transient 429 or 502 changes it while the workspace does not',
  'calls — a transport log; its statuses vary with the network, not with the workspace',
];

/* Unpaired surrogates, by code unit. A high surrogate must be followed by a low
 * one, and a low surrogate must be preceded by a high one. Anything else is a
 * string that cannot be encoded as UTF-8, which RFC 8785 makes an error and
 * JSON.stringify silently escapes instead. */
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

/**
 * RFC 8785's error case, which the platform does not raise.
 *
 * It throws rather than repairing, because a repaired string is a DIFFERENT
 * string and the caller asked for a canonical encoding of the one it passed.
 * Silently substituting is the failure mode this whole file exists to prevent.
 */
function requireWellFormed(s: string, path: string): void {
  if (LONE_SURROGATE.test(s))
    throw new Error(`canonicalize: lone surrogate at ${path} — RFC 8785 makes this an error, and JSON.stringify would have escaped it silently`);
}

/**
 * RFC 8785 (JCS). Deterministic bytes for a value this process built.
 *
 * `undefined` object properties are DROPPED, matching JSON.stringify, which is
 * how an omitted optional field stays omitted rather than becoming null. An
 * `undefined` inside an ARRAY is an error here: JSON.stringify turns it into
 * null and silently changes the array's meaning.
 */
export function canonicalize(value: unknown, path = '$'): string {
  if (value === null) return 'null';

  const t = typeof value;

  if (t === 'boolean') return value ? 'true' : 'false';

  if (t === 'number') {
    /* NaN and ±Infinity are not JSON. JSON.stringify writes `null` for all
     * three, which turns a broken computation into a legal-looking document. */
    if (!Number.isFinite(value as number))
      throw new Error(`canonicalize: ${String(value)} at ${path} is not representable in JSON, and JSON.stringify would have written null`);
    return JSON.stringify(value);
  }

  if (t === 'string') {
    requireWellFormed(value as string, path);
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    /* Array order is NOT sorted here. JCS preserves it, and the caller owns the
     * order — SARIF Appendix F.3 puts the fixed sort on the producer, because
     * only the producer knows which key is meaningful. */
    return `[${value.map((v, i) => {
      if (v === undefined)
        throw new Error(`canonicalize: undefined at ${path}[${i}] — JSON.stringify would have written null and changed what the array says`);
      return canonicalize(v, `${path}[${i}]`);
    }).join(',')}]`;
  }

  if (t === 'object') {
    const o = value as Record<string, unknown>;
    /* THE ONE LINE THAT IS JCS §3.2.3. Default sort compares strings by UTF-16
     * code unit ascending, which is exactly what the RFC specifies, including
     * the shorter-prefix-first consequence. Measured; see the header. */
    const keys = Object.keys(o).sort();
    const parts: string[] = [];
    for (const k of keys) {
      const v = o[k];
      if (v === undefined) continue;
      requireWellFormed(k, `${path}.${k} (key)`);
      parts.push(`${JSON.stringify(k)}:${canonicalize(v, `${path}.${k}`)}`);
    }
    return `{${parts.join(',')}}`;
  }

  throw new Error(`canonicalize: ${t} at ${path} has no JSON encoding`);
}
