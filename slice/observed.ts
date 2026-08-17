/* Observed<T> — what the scan saw, with its partiality attached.
 *
 * Lifted from prototypes/live-ref001.ts, which is frozen as a primary source.
 *
 * There is deliberately no Observed<T> -> T. No unwrap, no getOrThrow. A caller
 * that wants the value must handle the case where the value is incomplete,
 * because "unknown is not broken" (Principle 3) only survives if the type system
 * refuses to let a partial observation be read as a complete one.
 */

import type { NotionPort } from './notion-port.js';
import { PortError } from './notion-port.js';

export type Observed<T> =
  | { state: 'complete'; value: T }
  | { state: 'partial'; value: T; cause: string }
  | { state: 'unreachable'; cause: string };

export const complete = <T>(value: T): Observed<T> => ({ state: 'complete', value });
export const partial = <T>(value: T, cause: string): Observed<T> => ({ state: 'partial', value, cause });
export const unreachable = <T>(cause: string): Observed<T> => ({ state: 'unreachable', cause });

export type Call = { endpoint: string; status: number | 'ok'; code?: string };

export type Observer = {
  /** The ONLY place in this slice that constructs an Observed. */
  observe<T>(endpoint: string, fn: () => Promise<T>): Promise<Observed<T>>;
  calls: Call[];
};

export function createObserver(): Observer {
  const calls: Call[] = [];
  return {
    calls,
    async observe<T>(endpoint: string, fn: () => Promise<T>): Promise<Observed<T>> {
      try {
        const v = await fn();
        calls.push({ endpoint, status: 'ok' });
        return complete(v);
      } catch (e) {
        if (e instanceof PortError) {
          calls.push({ endpoint, status: e.status, code: e.code });
          /* Principle 3, and CONTEXT.md's "certainty is not target state": a 404
           * is access failure OR object absence and the API does not say which.
           * It is recorded as unreachable, never as absent. */
          if (e.status === 404) return unreachable(`404 ${e.code} on ${endpoint} — absent or inaccessible, indistinguishable`);
          if (e.status === 403) return unreachable(`403 ${e.code} on ${endpoint} — restricted`);
          if (e.status === 429) return unreachable(`429 rate_limited on ${endpoint}`);
          return unreachable(`${e.status} ${e.code} on ${endpoint}`);
        }
        calls.push({ endpoint, status: 0, code: 'transport' });
        return unreachable(`transport failure on ${endpoint}`);
      }
    },
  };
}

/**
 * Paginated child listing. Truncation becomes `partial` with a cause, never a
 * silent stop.
 *
 * Two disclosures live in here, both from ADR-0006:
 *
 * 1. The truncation test is POSITIVE ONLY. `request_status.type === 'incomplete'`
 *    produces partial. Absence of the field is neither an error nor proof of
 *    completeness — it maps to `sufficient` and NO code path blocks on the
 *    field's arrival. It has never been observed on any endpoint on any branch.
 * 2. This endpoint carries no truncation signal at all (decision 5). A complete
 *    enumeration and a silently truncated one both return has_more: false. The
 *    traversal spine of this scan is trusted blind and the report says so per
 *    run rather than hiding it.
 */
export async function listAllChildren(
  port: NotionPort,
  observer: Observer,
  id: string,
  label: string,
  maxPages = 20,
): Promise<Observed<unknown[]>> {
  const acc: unknown[] = [];
  let cursor: string | undefined = undefined;

  for (let page = 0; page < maxPages; page++) {
    const step = await observer.observe(`GET /v1/blocks/${label}/children`, () => port.listChildren(id, cursor));
    if (step.state === 'unreachable') {
      return acc.length
        ? partial(acc, `${step.cause} — enumeration of ${label} stopped after ${acc.length} blocks`)
        : unreachable(step.cause);
    }
    const r = step.value;
    acc.push(...(r.results ?? []));

    if (r.request_status?.type === 'incomplete')
      return partial(acc, `request_status incomplete (${r.request_status.incomplete_reason ?? 'no reason given'}) on ${label}`);

    if (!r.has_more) return complete(acc);
    cursor = r.next_cursor ?? undefined;
  }
  /* Unbounded by construction: the scan cannot say how many blocks remain. */
  return partial(acc, `enumeration of ${label} abandoned after ${maxPages} pages — remaining count unknown`);
}
