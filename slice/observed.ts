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
  /**
   * `status` is the HTTP status, or null when the failure produced none —
   * a transport error, or a truncation the caller turned into an unreachable.
   *
   * IT IS CARRIED AS A NUMBER SO NO CALLER PARSES THE CAUSE STRING FOR IT.
   * REF001 must distinguish a 404 target — a proved unresolvable link, which is
   * a finding — from a 429 or a 502, which is a drop-out and not a defect. That
   * distinction taken out of prose is the third instance of the mistake this
   * codebase has already made twice; `Loss` exists for the same reason.
   */
  | { state: 'unreachable'; cause: string; status: number | null };

export const complete = <T>(value: T): Observed<T> => ({ state: 'complete', value });
export const partial = <T>(value: T, cause: string): Observed<T> => ({ state: 'partial', value, cause });
export const unreachable = <T>(cause: string, status: number | null = null): Observed<T> =>
  ({ state: 'unreachable', cause, status });

export type Call = { endpoint: string; status: number | 'ok'; code?: string };

export type Observer = {
  /** The ONLY place in this slice that constructs an Observed. */
  observe<T>(endpoint: string, fn: () => Promise<T>): Promise<Observed<T>>;
  calls: Call[];
};

/**
 * Convert port calls into Observed values and append the audit call log.
 *
 * The observer is the only place that translates transport failures into the
 * scan's evidence states. Keeping that mapping here prevents rule code from
 * parsing thrown SDK errors or cause strings, and keeps the call log aligned
 * with the exact request whose result was classified.
 */
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
          if (e.status === 404) return unreachable(`404 ${e.code} on ${endpoint} — absent or inaccessible, indistinguishable`, 404);
          if (e.status === 403) return unreachable(`403 ${e.code} on ${endpoint} — restricted`, 403);
          if (e.status === 429) return unreachable(`429 rate_limited on ${endpoint}`, 429);
          return unreachable(`${e.status} ${e.code} on ${endpoint}`, e.status);
        }
        calls.push({ endpoint, status: 0, code: 'transport' });
        return unreachable(`transport failure on ${endpoint}`, null);
      }
    },
  };
}

/**
 * Every nested block under a page, to a bounded depth.
 *
 * WHY THIS EXISTS. `listAllChildren` returns one level. A link inside a toggle,
 * a callout, a column or a list item is therefore invisible, and REF001 would
 * report full coverage over a denominator it never built — a dead link under a
 * toggle produces no reference, no finding, and exit 0. That is `CONTEXT.md`
 * Non-goal 4, hiding an access gap inside a passing result, and slice spec
 * criterion 2 marks the requirement NON-NEGOTIABLE: "retrieve nested block
 * trees to the depth REF001 requires."
 *
 * `child_page` and `child_database` ARE NOT DESCENDED INTO. They are separate
 * resources with their own manifest entries, and the slice descends one resource
 * level (spec §1.1). Following them here would scan the same page twice and
 * count its blocks under two parents.
 *
 * THE BUDGET IS A DISCLOSED LIMIT, NOT A SILENT ONE. Exhausting either the depth
 * or the request budget returns `partial` with a cause, and the caller turns
 * that into an UNBOUNDED loss on the containing page — the scan cannot say how
 * many links it did not see.
 */
export async function readBlockTree(
  port: NotionPort,
  observer: Observer,
  topLevel: unknown[],
  maxDepth = 4,
  maxRequests = 40,
): Promise<Observed<unknown[]>> {
  const all: unknown[] = [...topLevel];
  let frontier = topLevel;
  let spent = 0;

  for (let depth = 0; depth < maxDepth; depth++) {
    const containers = frontier.filter(isDescendableContainer).map(b => (b as { id: string }).id);
    if (containers.length === 0) return complete(all);

    const next: unknown[] = [];
    for (const id of containers) {
      if (spent >= maxRequests) return partial(all, `block-tree budget of ${maxRequests} requests exhausted at depth ${depth} — the number of unread nested blocks is unknown`);
      spent++;
      const kids = await listAllChildren(port, observer, id, id);
      if (kids.state === 'unreachable') return partial(all, `nested blocks under ${id} could not be read — ${kids.cause}`);
      next.push(...kids.value);
      if (kids.state === 'partial') return partial([...all, ...next], kids.cause);
    }
    all.push(...next);
    frontier = next;
  }

  /* Depth ran out with containers still unopened. The remainder is unknown. */
  return frontier.some(isDescendableContainer)
    ? partial(all, `block-tree depth limit of ${maxDepth} reached with nested blocks still unopened — the number of unread blocks is unknown`)
    : complete(all);
}

/** A block that holds other blocks and is NOT a resource of its own. */
function isDescendableContainer(b: unknown): boolean {
  if (typeof b !== 'object' || b === null) return false;
  const o = b as Record<string, unknown>;
  if (typeof o.id !== 'string' || o.has_children !== true) return false;
  return o.type !== 'child_page' && o.type !== 'child_database';
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
        : unreachable(step.cause, step.status);
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
