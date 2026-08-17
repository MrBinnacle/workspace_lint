/* The one seam.
 *
 * Everything above this file talks to NotionPort. Only the live adapter below
 * talks to @notionhq/client. That is what lets CHECK-scan-scaffold.ts drive the
 * whole scan with no network, no .env and no token.
 *
 * The prototype caught its errors as APIResponseError inside the observer, which
 * welded the funnel to the SDK and made the offline check unable to produce a
 * 404. PortError is the translation, and the live adapter is the only place that
 * performs it.
 *
 * Read-only. The three methods below are the entire API surface this slice has:
 * GET /v1/users/me, GET /v1/pages/{id}, GET /v1/blocks/{id}/children. Nothing is
 * created, updated, moved or deleted. Principle 7 holds at the call site, not
 * only at the credential.
 */

import { Client, APIResponseError } from '@notionhq/client';

/* ------------------------------------------------------------ attestation --
 *
 * ADR-0013 decision 2. Whether an enumeration's endpoint carries a completeness
 * signal the scan can check.
 *
 * IT LIVES HERE, WITH THE API SURFACE, ON PURPOSE. Attestation is a property of
 * the ENDPOINT, not of a response and not of a result — the whole reason the
 * component exists is that `GET /v1/blocks/{id}/children` returns the same
 * `has_more: false` whether its listing was complete or permission-filtered, so
 * no response body can ever carry this fact. Putting the table beside the
 * endpoint declarations means adding a call forces the classification at the
 * same moment.
 * -------------------------------------------------------------------------- */

export type Attestation = 'attested' | 'unattested';

/** The traversal spine. No truncation signal — ADR-0006 decision 2. */
export const BLOCK_CHILDREN = 'GET /v1/blocks/{id}/children';
/** Carries a truncation signal — ADR-0007. Not called by this slice; classified so the table is not a one-row special case. */
export const SEARCH = 'POST /v1/search';

const ATTESTED_ENDPOINTS: readonly string[] = [SEARCH];

/**
 * Classify an endpoint.
 *
 * THE DEFAULT IS `unattested`, AND THAT DIRECTION IS THE POINT. An endpoint
 * nobody has classified must not inherit the flattering answer. Defaulting to
 * `attested` would let a future call silently widen the trusted set merely by
 * being added — which is the shape of the defect that shipped a `2/2 — 100%`
 * figure over a root with three children, where the denominator quietly grew to
 * fit what the code could name.
 *
 * It is a function rather than a bare lookup so that the default is executable
 * and can be asserted against. `CHECK-residuals.ts` TEST 1 asserts it.
 */
export function attestationOf(endpoint: string): Attestation {
  return ATTESTED_ENDPOINTS.includes(endpoint) ? 'attested' : 'unattested';
}

export type BlockListResponse = {
  results: unknown[];
  has_more: boolean;
  next_cursor: string | null;
  /** ADR-0006 decision 1. Tested positively, never awaited. */
  request_status?: { type?: string; incomplete_reason?: string };
};

export interface NotionPort {
  whoami(): Promise<{ name?: string; type?: string }>;
  /**
   * `url` is OPTIONAL because the API may omit it and because a fake need not
   * supply one — but it is no longer discarded. CONTEXT.md's settled default
   * says a finding names its resource "by ID and link", and every SYS001
   * finding carried `link: null` while this returned `{ id }` alone.
   *
   * THE CALLER MUST REDACT IT. A Notion URL copied from the UI reads
   * `.../My-Private-Roadmap-3bf1351d…`, so the page title is inside the path.
   * Writing this value into a report unredacted is the #42 title leak through a
   * new door. `redactHref()` in references.ts is the only safe renderer of it.
   */
  retrievePage(id: string): Promise<{ id: string; url?: string }>;
  listChildren(id: string, cursor?: string): Promise<BlockListResponse>;
}

/** A transport or API failure, carrying only what may be logged: status and code. */
export class PortError extends Error {
  constructor(readonly status: number, readonly code: string) {
    super(`${status} ${code}`);
    this.name = 'PortError';
  }
}

/**
 * The live adapter. `logLevel: 'error'` is not cosmetic — the SDK's own warn
 * logger writes straight to the console and bypasses application redaction, so
 * a lower level can put request context on stdout that scrub() never sees.
 */
export function liveNotionPort(auth: string, notionVersion: string): NotionPort {
  const client = new Client({ auth, notionVersion, logLevel: 'error' as never });

  const translate = async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      /* Never rethrow the error object: it can carry request context including
       * headers. Status and code only. */
      if (e instanceof APIResponseError) throw new PortError(e.status, e.code);
      throw new PortError(0, 'transport');
    }
  };

  return {
    whoami: () => translate(() => client.users.me({})) as Promise<{ name?: string; type?: string }>,
    retrievePage: id => translate(() => client.pages.retrieve({ page_id: id })) as Promise<{ id: string; url?: string }>,
    listChildren: (id, cursor) =>
      translate(() => client.blocks.children.list({ block_id: id, page_size: 100, start_cursor: cursor })) as Promise<BlockListResponse>,
  };
}
