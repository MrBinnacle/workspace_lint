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

/**
 * One block, as `GET /v1/blocks/{block_id}/children` returns it — #158 item 0.
 *
 * ⛔ IT IS A WIDENING OF A CALL THIS SLICE ALREADY MAKES, NOT A NEW ENDPOINT,
 * and the precedent is written twice below on `retrievePage`: `properties` (#58)
 * and `last_edited_time` (#142) were both fields the response had always
 * carried and the declared return type had always thrown away. "Keeping more of
 * one response is not a new endpoint", so #51's ASK-FIRST precedent for ADDING
 * an endpoint does not apply here either, and the endpoint surface in this
 * file's header is unchanged.
 *
 * ⛔ THE COST OF NOT DOING IT WAS A FALSE CLAIM ABOUT THE VENDOR. `measurement.ts`
 * stated, unqualified, that a child page enumerated from its parent's listing has
 * no response carrying its `last_edited_time`. The response exists, this code
 * receives it, and `results: unknown[]` discarded it — so the report named a
 * boundary that was this tool's own type declaration. A tool that reports an
 * external obstacle for a figure it already holds is committing the defect it
 * exists to detect.
 *
 * EVERY FIELD IS OPTIONAL, AND THAT IS THE PARTIAL-BLOCK-OBJECT CASE. When the
 * API returns a partial block object is undocumented, so a consumer may never
 * assume `type` or `last_edited_time` arrived. `scan.ts`'s `asChildBlock`
 * validates before reading, and a block that carried no timestamp produces no
 * measurement row rather than a null one.
 *
 * ⚠ WHETHER A `child_page` BLOCK'S TIMESTAMP IS ITS PAGE'S IS EMPIRICAL, n=1,
 * AND THE VENDOR IS SILENT. `docs/proof/results-block-vs-page-timestamp.md`,
 * pre-registered before any data existed: across four runs the block's value
 * moved with its page's on every content-only edit and was equal at every
 * measurement. Labelling is licensed as an OBSERVATION and never as a documented
 * guarantee. The same file records that the API truncates this value to the
 * MINUTE — 24 of 24 observed — which the vendor does not document and its own
 * example contradicts, so ⛔ NO CODE HERE OR DOWNSTREAM MAY ORDER EDITS OR
 * MEASURE ELAPSED TIME BELOW ONE MINUTE.
 *
 * The index signature keeps the block's own type payload — `child_page`,
 * `paragraph`, `toggle` — reachable without this file declaring a copy of the
 * vendor's block union, which is the copy that drifts.
 */
export type BlockObject = {
  id?: string;
  type?: string;
  last_edited_time?: string;
  [key: string]: unknown;
};

export type BlockListResponse = {
  results: BlockObject[];
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
  /**
   * `properties` IS A FIELD AND NOT A SECOND METHOD — #58. REQ001's entire
   * input is the page's property map, which this seam discarded until now:
   * `GET /v1/pages/{id}` has always returned it and the declared return type
   * threw it away. Keeping more of one response is not a new endpoint, so the
   * three-endpoint surface in this file's header is unchanged and #51's
   * ASK-FIRST precedent for adding an endpoint does not apply here.
   *
   * OPTIONAL, AND THE OPTIONALITY IS LOAD-BEARING. A response carrying no map
   * and a map carrying nothing are different observations: the first is a
   * failed hydration, the second is a page with no properties this integration
   * can see. REQ001 maps them to different outcomes and NEITHER is a violation.
   *
   * VALUES ARE `unknown`, DELIBERATELY. A property value is a tagged union of
   * nineteen shapes and this slice reads two facts off it — its `id`, and
   * whether it carries a value. Declaring that union here would put a copy of
   * the vendor's type in this file, and the copy is what drifts.
   */
  /**
   * `last_edited_time` IS THE SAME MOVE `properties` WAS, AND THE PRECEDENT IS
   * WRITTEN DIRECTLY ABOVE — #142. `GET /v1/pages/{id}` has always returned it
   * and this declared type threw it away. **Keeping more of one response is not
   * a new endpoint**, so the endpoint surface in this file's header is unchanged
   * and #51's ASK-FIRST precedent for ADDING an endpoint does not apply here
   * either. It is the input to the last-edited measurement (ADR-0017).
   *
   * OPTIONAL, AND THE OPTIONALITY IS LOAD-BEARING for the same reason
   * `properties` is: a response that carried no timestamp and a resource whose
   * retrieve was never made are different observations, and the measurement
   * maps them to different report lines. Neither is a defect.
   *
   * ⛔ IT IS NOT PARSED, COMPARED TO A CLOCK, OR TURNED INTO AN AGE HERE. A
   * relative age depends on when the run happened, which is exactly the class of
   * field ADR-0004's normaliser strips, and this section must not be the reason
   * two runs over an unchanged workspace differ. The absolute instant the API
   * returned is what travels.
   */
  retrievePage(id: string): Promise<{ id: string; url?: string; last_edited_time?: string; properties?: Record<string, unknown> }>;
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
    retrievePage: id =>
      translate(() => client.pages.retrieve({ page_id: id })) as Promise<{ id: string; url?: string; last_edited_time?: string; properties?: Record<string, unknown> }>,
    listChildren: (id, cursor) =>
      translate(() => client.blocks.children.list({ block_id: id, page_size: 100, start_cursor: cursor })) as Promise<BlockListResponse>,
  };
}
