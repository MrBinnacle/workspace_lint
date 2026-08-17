/* The offline Notion surface both check suites drive.
 *
 * Extracted when CHECK-sys001.ts arrived (#43). It is one file rather than two
 * copies for the reason this repository keeps re-learning: two structures
 * maintained independently drift, and they drift toward the flattering answer
 * (docs/proof/results-ref001-live.md §4). A fake fixture that disagrees with the
 * other suite's fake fixture would make one of the two suites test a workspace
 * shape nothing else asserts against.
 *
 * No network, no .env, no token. The clock is injected, so both suites are
 * deterministic.
 */

import { PortError, type BlockListResponse, type NotionPort } from './notion-port.js';
import { hyphenate } from './ids.js';
import type { Config } from './config.js';

/* IDs are 32 hex digits. They are fake but well-formed — hyphenate() rejects
 * anything else, and a check that fed it a non-ID would test the reject path
 * instead of the path it names. */
export const ROOT = '2d41c2631b5945f196c5688cde44cdf9';
export const PAGE_A = '3bf1351d6af481108dc5dcc8bffb9742';
export const PAGE_B = '4ca2462e7bf592219ed6edd9c00ca853';
export const DATASET = '5db3573f8cf6a332afe7fee0d11db964';

export const childPage = (id: string, title: string) => ({ object: 'block', id, type: 'child_page', child_page: { title } });
export const childDb = (id: string, title: string) => ({ object: 'block', id, type: 'child_database', child_database: { title } });
export const para = (id: string) => ({ object: 'block', id, type: 'paragraph', paragraph: { rich_text: [] } });

export const page = (results: unknown[], extra: Partial<BlockListResponse> = {}): BlockListResponse =>
  ({ results, has_more: false, next_cursor: null, ...extra });

export type Step = BlockListResponse | { throwStatus: number; throwCode: string };
export type FakeResource = {
  pageFail?: { status: number; code: string };
  steps?: Step[];
  /** What GET /v1/pages returns as `url`. See TITLED_URL. */
  url?: string;
};

/**
 * A page url of the shape Notion actually serves — THE TITLE IS INSIDE THE PATH.
 * The fake returns this so the redaction assertions have something real to
 * catch: a test whose fixture url carries no title cannot tell a working
 * redactor from a missing one.
 */
export const TITLED_URL = (id: string) => `https://www.notion.so/My-Private-Roadmap-${id}`;
export const TITLE_IN_URL = 'My-Private-Roadmap';

export function fakePort(spec: Record<string, FakeResource>, meFails = false): NotionPort {
  /* THE FAKE RESOLVES AN ID IN EITHER FORM, BECAUSE THE API DOES. Notion accepts
   * a bare 32-hex ID and a hyphenated one as the same object. The fixtures below
   * are written bare and REF001 resolves link targets in hyphenated form — the
   * form the recogniser normalizes to — so a fake keyed on the literal string
   * returns 404 for a page it is holding. That is a defect in the instrument
   * that looks exactly like a defect in the product: it made a readable target
   * report as a dead link and a 429 report as a 404. */
  const normalized = new Map(Object.entries(spec).map(([k, v]) => [hyphenate(k) ?? k, v]));
  const lookup = (id: string): FakeResource | undefined => normalized.get(hyphenate(id) ?? id);

  return {
    async whoami() {
      if (meFails) throw new PortError(401, 'unauthorized');
      return { name: 'workspace-lint-proof', type: 'bot' };
    },
    async retrievePage(id) {
      const r = lookup(id);
      if (!r || r.pageFail) throw new PortError(r?.pageFail?.status ?? 404, r?.pageFail?.code ?? 'object_not_found');
      return r.url === undefined ? { id } : { id, url: r.url };
    },
    async listChildren(id, cursor) {
      const r = lookup(id);
      if (!r?.steps) throw new PortError(404, 'object_not_found');
      const i = cursor ? Number(cursor) : 0;
      const step = r.steps[i];
      if (!step) throw new PortError(404, 'object_not_found');
      if ('throwStatus' in step) throw new PortError(step.throwStatus, step.throwCode);
      return step;
    },
  };
}

export const cfg = (id = ROOT, minCoverage = 1.0): Config => ({ version: 1, roots: [{ id, alias: 'wl-proof-fixture' }], minCoverage });
export const clock = () => { let t = 1000; return () => (t += 7); };

/* The fixture as it actually is: a declared root with three children, one of
 * which is a data source this slice does not enumerate. */
export const THREE_CHILDREN: Record<string, FakeResource> = {
  [ROOT]: { steps: [page([para('a1b2c3d40000400080000000000000ff'), childPage(PAGE_A, 'wl-outside-grant'), childPage(PAGE_B, 'wl-revoke-parent'), childDb(DATASET, 'wl-dataset')])] },
  [PAGE_A]: { steps: [page([])] },
  [PAGE_B]: { steps: [page([])] },
  [DATASET]: { steps: [page([])] },
};

/* The root resolves, then its child list is never retrieved at all. The scan can
 * neither count nor name what it missed, so this is unbounded for the same
 * reason MIDSTREAM is — and it used to be classified BOUNDED, because
 * boundedness was recovered by pattern-matching the cause text. */
export const ROOT_ENUM_FAILS: Record<string, FakeResource> = {
  [ROOT]: { steps: [] },
};

/* A child the parent listed, whose own call then 404s. This is the shape the
 * fixture's revocation case models: the object was named by its parent and the
 * API refuses it. `target: present` would be a claim about an object the API
 * just declined to return. */
export const CHILD_UNREACHABLE: Record<string, FakeResource> = {
  ...THREE_CHILDREN,
  [PAGE_A]: {},
};

/* ------------------------------------------------------------- references -- */

/* The target of every link fixture below. It is NOT one of the four resources
 * above, because REF001's subject is a page the traversal cannot reach: a
 * disconnected page vanishes from its parent's child list, so the link is the
 * only surviving trace of it (results.md §4). */
export const LINK_TARGET = '6ec4684a9dd7b443b0f8ff01e22ec075';
export const LINK_TARGET_ID = '6ec4684a-9dd7-b443-b0f8-ff01e22ec075';

/* The host observed on 2026-08-17, transcribed from results-ref001-live.md §2. */
export const OBSERVED_LINK = `https://app.notion.com/p/${LINK_TARGET}`;
/* A Notion-shaped ID on a host with no locator. The residue path, spec §4 step 5. */
export const UNKNOWN_HOST_LINK = `https://docs.acme.example/${LINK_TARGET}`;
/* A UI-copied link: the PATH CARRIES THE PAGE TITLE, and the host is not checked. */
export const TITLED_LINK = `https://www.notion.so/My-Private-Roadmap-${LINK_TARGET}`;
export const EXTERNAL_LINK = 'https://example.com/blog';

export const linkPara = (id: string, href: string) =>
  ({ object: 'block', id, type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: 'link' }, href }] } });

/**
 * A root with ONE readable child and one link, and NO data source.
 *
 * The absence of the data source is what makes these fixtures useful: every
 * resource reaches `evaluated`, so the FUNNEL figure is 1.0 and only REF001's
 * row can fall below the threshold. On THREE_CHILDREN the stalled data source
 * drags the funnel below the floor and every exit-byte assertion would pass for
 * a reason that has nothing to do with links.
 */
const oneChildWith = (href: string, extra: Record<string, FakeResource> = {}): Record<string, FakeResource> => ({
  [ROOT]: { steps: [page([linkPara('block-link', href), childPage(PAGE_B, 'wl-revoke-parent')])] },
  [PAGE_B]: { steps: [page([])] },
  ...extra,
});

/* The link resolves to a target the connection cannot read. LINK_TARGET has no
 * entry, so retrievePage 404s — which is what an unconnected page returns, not
 * 403 (observed 2026-08-17). This is acceptance criterion 4. */
export const DEAD_LINK: Record<string, FakeResource> = oneChildWith(OBSERVED_LINK);

/* Same link, target readable. REF001 conforms and produces no finding. */
export const LIVE_LINK: Record<string, FakeResource> = oneChildWith(OBSERVED_LINK, { [LINK_TARGET]: { steps: [page([])] } });

/* The residue: a Notion-shaped ID on a host with no locator. */
export const UNRECOGNISED_LINK: Record<string, FakeResource> = oneChildWith(UNKNOWN_HOST_LINK);

/* The residue, with a page title inside the href. */
export const TITLED_UNRECOGNISED_LINK: Record<string, FakeResource> = oneChildWith(TITLED_LINK);

/* A toggle holding the dead link. The link is invisible to a scan that reads
 * only top-level blocks, and the run then exits 0 over a root containing it —
 * CONTEXT.md Non-goal 4, and slice spec criterion 2 is non-negotiable. */
export const TOGGLE = 'aa11bb22cc33dd44ee55ff6677889900';
export const NESTED_LINK: Record<string, FakeResource> = {
  [ROOT]: { steps: [page([{ object: 'block', id: TOGGLE, type: 'toggle', has_children: true, toggle: { rich_text: [] } }, childPage(PAGE_B, 'wl-revoke-parent')])] },
  [TOGGLE]: { steps: [page([linkPara('block-nested', OBSERVED_LINK)])] },
  [PAGE_B]: { steps: [page([])] },
};

/* The same toggle, whose children the API then refuses. The scan cannot say how
 * many links it did not see, so the loss is UNBOUNDED. */
export const NESTED_UNREADABLE: Record<string, FakeResource> = {
  [ROOT]: { steps: [page([{ object: 'block', id: TOGGLE, type: 'toggle', has_children: true, toggle: { rich_text: [] } }, childPage(PAGE_B, 'wl-revoke-parent')])] },
  [PAGE_B]: { steps: [page([])] },
};

/* A DATABASE mentioned in block content. Route A says outright that the target
 * is a database, and `GET /v1/pages/{id}` does not return one — so retrieving it
 * would 404 and the rule would call a readable database a proved dead link. */
export const DB_MENTION: Record<string, FakeResource> = {
  [ROOT]: {
    steps: [page([
      { object: 'block', id: 'block-db', type: 'paragraph',
        paragraph: { rich_text: [{ type: 'mention', mention: { type: 'database', database: { id: LINK_TARGET } } }] } },
      childPage(PAGE_B, 'wl-revoke-parent'),
    ])],
  },
  [PAGE_B]: { steps: [page([])] },
};

/* A PAGE mention of a target the connection cannot read. Route A states the
 * kind, so the 404 means exactly what the finding says and carries no
 * "or it is not a page" qualifier. This is also the shape the API reference
 * says survives a permission failure: "returned with just the ID". */
export const PAGE_MENTION_DEAD: Record<string, FakeResource> = {
  [ROOT]: {
    steps: [page([
      { object: 'block', id: 'block-mention', type: 'paragraph',
        paragraph: { rich_text: [{ type: 'mention', mention: { type: 'page', page: { id: LINK_TARGET } } }] } },
      childPage(PAGE_B, 'wl-revoke-parent'),
    ])],
  },
  [PAGE_B]: { steps: [page([])] },
};

/* The same external href pasted on TWO different pages. One reference, not two. */
export const EXTERNAL_ON_TWO_PAGES: Record<string, FakeResource> = {
  [ROOT]: { steps: [page([linkPara('block-ext-1', EXTERNAL_LINK), childPage(PAGE_B, 'wl-revoke-parent')])] },
  [PAGE_B]: { steps: [page([linkPara('block-ext-2', EXTERNAL_LINK)])] },
};

/* A dead link AND an external one, to show the external changes no denominator. */
export const DEAD_LINK_PLUS_EXTERNAL: Record<string, FakeResource> = {
  [ROOT]: { steps: [page([linkPara('block-link', OBSERVED_LINK), linkPara('block-ext', EXTERNAL_LINK), childPage(PAGE_B, 'wl-revoke-parent')])] },
  [PAGE_B]: { steps: [page([])] },
};

/* The root's enumeration dies mid-stream: one child listed, the next call 502s.
 * The remainder cannot be counted OR named, so the gap is unbounded. */
export const MIDSTREAM: Record<string, FakeResource> = {
  ...THREE_CHILDREN,
  [ROOT]: {
    steps: [
      page([childPage(PAGE_A, 'wl-outside-grant')], { has_more: true, next_cursor: '1' }),
      { throwStatus: 502, throwCode: 'internal_server_error' },
    ],
  },
};
