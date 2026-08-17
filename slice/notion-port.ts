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
