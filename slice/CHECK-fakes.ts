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
export type FakeResource = { pageFail?: { status: number; code: string }; steps?: Step[] };

export function fakePort(spec: Record<string, FakeResource>, meFails = false): NotionPort {
  return {
    async whoami() {
      if (meFails) throw new PortError(401, 'unauthorized');
      return { name: 'workspace-lint-proof', type: 'bot' };
    },
    async retrievePage(id) {
      const r = spec[id];
      if (!r || r.pageFail) throw new PortError(r?.pageFail?.status ?? 404, r?.pageFail?.code ?? 'object_not_found');
      return { id };
    },
    async listChildren(id, cursor) {
      const r = spec[id];
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
