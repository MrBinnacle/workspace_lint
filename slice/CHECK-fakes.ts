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

import { PortError, type BlockListResponse, type BlockObject, type NotionPort } from './notion-port.js';
import { hyphenate } from './ids.js';
import type { Config } from './config.js';

/* IDs are 32 hex digits. They are fake but well-formed — hyphenate() rejects
 * anything else, and a check that fed it a non-ID would test the reject path
 * instead of the path it names. */
export const ROOT = '2d41c2631b5945f196c5688cde44cdf9';
export const PAGE_A = '3bf1351d6af481108dc5dcc8bffb9742';
export const PAGE_B = '4ca2462e7bf592219ed6edd9c00ca853';
export const DATASET = '5db3573f8cf6a332afe7fee0d11db964';
/**
 * A SECOND data source, and its whole job is to be the ZERO — #144.
 *
 * The inbound-reference measurement's hardest line is the scoped zero, and a
 * fixture holding one database can never produce one alongside a non-zero: a
 * single row is consistent with a derivation that always returns the count it
 * happened to find. Two databases where exactly one is referenced is the
 * smallest fixture in which a wrong join is visible.
 */
export const DATASET_B = '6ec46840cf6a332afe7fee0d11db9642';

/**
 * A `child_page` block as the listing returns it — #158 item 0.
 *
 * `lastEdited` IS OMITTED WHEN NOT SUPPLIED, not sent as `undefined`, for the
 * reason `retrievePage`'s fields are: the fake models a RESPONSE, and a response
 * either carries the key or does not. That distinction is the whole fixture for
 * the PARTIAL BLOCK OBJECT — the case Notion does not document and which
 * `docs/proof/results-block-vs-page-timestamp.md` explicitly did not force. A
 * fake that always supplied the key could not exercise the branch that has to
 * survive one arriving without it.
 */
export const childPage = (id: string, title: string, lastEdited?: string) =>
  ({ object: 'block', id, type: 'child_page', child_page: { title }, ...(lastEdited === undefined ? {} : { last_edited_time: lastEdited }) });
export const childDb = (id: string, title: string, lastEdited?: string) =>
  ({ object: 'block', id, type: 'child_database', child_database: { title }, ...(lastEdited === undefined ? {} : { last_edited_time: lastEdited }) });
export const para = (id: string) => ({ object: 'block', id, type: 'paragraph', paragraph: { rich_text: [] } });

/* `BlockObject[]` since #158 item 0 — the fake models the response, and the
 * response's declared shape is no longer `unknown[]`. Every field on
 * `BlockObject` is optional, so the fixture helpers above and the inline block
 * literals throughout this file satisfy it unchanged; what it now rejects is a
 * fixture block that is not an object at all. */
export const page = (results: BlockObject[], extra: Partial<BlockListResponse> = {}): BlockListResponse =>
  ({ results, has_more: false, next_cursor: null, ...extra });

export type Step = BlockListResponse | { throwStatus: number; throwCode: string };
export type FakeResource = {
  pageFail?: { status: number; code: string };
  steps?: Step[];
  /** What GET /v1/pages returns as `url`. See TITLED_URL. */
  url?: string;
  /**
   * What GET /v1/pages returns as `properties` — #58.
   *
   * ABSENT AND EMPTY ARE DIFFERENT FIXTURES AND THE DIFFERENCE IS THE RULE.
   * `properties: undefined` models a response that carried no map at all;
   * `properties: {}` models a map the integration can see and which holds
   * nothing. REQ001's third and fourth rows turn on exactly that distinction,
   * so a fake that collapsed them could not tell the two apart either.
   */
  properties?: Record<string, unknown>;
  /**
   * What GET /v1/pages returns as `last_edited_time` — #142.
   *
   * OMITTED AND PRESENT ARE DIFFERENT FIXTURES, exactly as `properties` above.
   * Omitted models a response that carried no timestamp, which is what drives
   * the measurement's "not computed" branch; present drives the computed one.
   * A fake that always supplied one could not exercise ADR-0017 decision 5 at
   * all, and that branch is the whole reason the section can never go silently
   * empty.
   */
  lastEditedTime?: string;
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
      /* Each field is omitted rather than sent as `undefined`, because the fake
       * is modelling a RESPONSE and a response either carries a key or does
       * not. `{ properties: undefined }` would satisfy `'properties' in res`
       * and make the fourth row of REQ001's table untestable. */
      return {
        id,
        ...(r.url === undefined ? {} : { url: r.url }),
        ...(r.properties === undefined ? {} : { properties: r.properties }),
        ...(r.lastEditedTime === undefined ? {} : { last_edited_time: r.lastEditedTime }),
      };
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

/* `rules` is empty, and it STAYS empty on this helper. Every suite that drives
 * the scan through this fixture asserts against the two BUILT-IN rules, so a
 * configured entry here would put a rule in the funnel that no assertion in any
 * suite expects. #58 adds REQ001 through `cfgReq` below rather than by widening
 * this one, so the other five suites are untouched by a third rule. */
export const cfg = (id = ROOT, minCoverage = 1.0): Config => ({ version: 1, roots: [{ id, alias: 'wl-proof-fixture' }], minCoverage, rules: [] });

/** The same declared root, with ONE REQ001 entry — #58. */
export const cfgReq = (scope: string, property: string, minCoverage = 1.0): Config => ({
  version: 1,
  roots: [{ id: ROOT, alias: 'wl-proof-fixture' }],
  minCoverage,
  rules: [{ rule: 'REQ001', scope: { id: scope }, property }],
});
export const clock = () => { let t = 1000; return () => (t += 7); };

/* The fixture as it actually is: a declared root with three children, one of
 * which is a data source this slice does not enumerate. */
export const THREE_CHILDREN: Record<string, FakeResource> = {
  [ROOT]: { steps: [page([para('a1b2c3d40000400080000000000000ff'), childPage(PAGE_A, 'wl-outside-grant'), childPage(PAGE_B, 'wl-revoke-parent'), childDb(DATASET, 'wl-dataset')])] },
  [PAGE_A]: { steps: [page([])] },
  [PAGE_B]: { steps: [page([])] },
  [DATASET]: { steps: [page([])] },
};

/**
 * THE BLOCK LISTING CARRIES THE TIMESTAMPS — #158 item 0.
 *
 * The root retrieve supplies one; `PAGE_A` and `DATASET` carry one on their own
 * `child_page` / `child_database` block; `PAGE_B` carries NONE. Three
 * provenances in one fixture, deliberately:
 *
 *   ROOT     retrieve        — GET /v1/pages/{id} returned it
 *   PAGE_A   block-listing   — the parent's listing returned it, no retrieve made
 *   DATASET  block-listing   — likewise, and this slice makes no database retrieve
 *   PAGE_B   none            — the partial-block-object case, undocumented and
 *                              never forced live, so it must be survivable here
 *
 * ⛔ `PAGE_B` IS THE CONTROL AND MUST NOT BE GIVEN A TIMESTAMP AS A TIDY-UP. A
 * fixture in which every resource has one cannot show that the denominator is
 * still printed, and the denominator is the only thing standing between these
 * rows and a reader taking them for the whole reached set.
 *
 * The three instants are distinct and ordered, so the sort is falsifiable: a
 * derivation that dropped the sort would still pass against ties.
 */
export const BLOCK_EDITED_A = '2026-01-05T11:00:00.000Z';
export const BLOCK_EDITED_DB = '2026-03-30T16:00:00.000Z';

export const ROOT_EDITED = '2026-02-19T08:14:00.000Z';

export const BLOCK_TIMES: Record<string, FakeResource> = {
  [ROOT]: {
    lastEditedTime: ROOT_EDITED,
    steps: [page([
      childPage(PAGE_A, 'wl-outside-grant', BLOCK_EDITED_A),
      childPage(PAGE_B, 'wl-revoke-parent'),
      childDb(DATASET, 'wl-dataset', BLOCK_EDITED_DB),
    ])],
  },
  [PAGE_A]: { steps: [page([])] },
  [PAGE_B]: { steps: [page([])] },
  [DATASET]: { steps: [page([])], pageFail: { status: 404, code: 'object_not_found' } },
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
/* A title-bearing link on a host that is NOT CHECKED, so it travels the residue
 * path. `notion.com`, not `www.notion.so`: the latter became an observed internal
 * host in #111, and this fixture's job is redaction on the RESIDUE path — a
 * recognised host would silently change what TEST 8 tests. */
export const TITLED_LINK = `https://notion.com/My-Private-Roadmap-${LINK_TARGET}`;
export const EXTERNAL_LINK = 'https://example.com/blog';

export const linkPara = (id: string, href: string) =>
  ({ object: 'block', id, type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: 'link' }, href }] } });

/**
 * The anchor text a real editor would have typed — #141. Deliberately reads
 * like workspace content, because that is what the redaction control must be
 * shown to withhold. A fixture whose anchor text is the word "link" cannot
 * demonstrate that anything sensitive was kept out of the report.
 */
export const ANCHOR_PHRASE = 'Q3 Roadmap — Confidential';

/**
 * A link run carrying anchor text on `plain_text`, which is the field the API
 * sends and the only one a mention has. `linkPara` above sets `text.content`
 * and no `plain_text`, so the two helpers exercise the extractor's two source
 * fields between them rather than leaving either branch unrun.
 */
export const anchoredLinkPara = (id: string, href: string, anchor: string) =>
  ({ object: 'block', id, type: 'paragraph',
     paragraph: { rich_text: [{ type: 'text', text: { content: anchor }, plain_text: anchor, href }] } });

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

/**
 * The same dead link, but the run carries the anchor text an editor typed —
 * #135, #141. This is the fixture the disclosure control is measured on.
 */
export const ANCHORED_DEAD_LINK: Record<string, FakeResource> = {
  [ROOT]: { steps: [page([anchoredLinkPara('block-link', OBSERVED_LINK, ANCHOR_PHRASE), childPage(PAGE_B, 'wl-revoke-parent')])] },
  [PAGE_B]: { steps: [page([])] },
};

/**
 * A `link_to_page` BLOCK pointing at the dead target — the no-anchor-text case.
 *
 * It is a block and not a rich-text run, so there is no string an editor typed
 * and nothing to redact. This fixture exists so the report's THIRD state — "the
 * workspace never held one" — is exercised rather than assumed, and so it can
 * be shown distinct from "withheld from you". Run 1 met this shape live.
 */
export const LINK_TO_PAGE_DEAD: Record<string, FakeResource> = {
  [ROOT]: {
    steps: [page([
      { object: 'block', id: 'block-ltp', type: 'link_to_page', link_to_page: { type: 'page_id', page_id: LINK_TARGET } },
      childPage(PAGE_B, 'wl-revoke-parent'),
    ])],
  },
  [PAGE_B]: { steps: [page([])] },
};

/* ------------------------------------------------- the permission filter -- */

/**
 * THE FALSE GREEN, AS A FIXTURE. #46 DoD item 2, reproduced from a live
 * observation on 2026-08-17.
 *
 * `HIDDEN_CHILD` EXISTS. It is a real page under the root, and the builder
 * identity can read it — `wl-revoke-parent` holds `wl-revoke-child`
 * (…ce0fb949), confirmed against the workspace with full access. The read-only
 * subject's `GET /v1/blocks/{root}/children` does not return it as unreadable.
 * IT RETURNS NOTHING ABOUT IT AT ALL: the `child_page` block is gone with the
 * permission.
 *
 * So the listing below is what the subject sees, and the fixture's truth is the
 * constant beside it. That gap between the two IS the test.
 *
 * ADR-0006 decision 2 is why this cannot be detected from the response: the
 * endpoint carries no truncation signal, and a complete enumeration and a
 * filtered one are byte-identical in shape.
 */
export const HIDDEN_CHILD = '7fd5795b0ee8c554c1a900f12f33f186';
export const HIDDEN_CHILD_ID = '7fd5795b-0ee8-c554-c1a9-00f12f33f186';

/** What the subject sees: paragraphs, and no trace of HIDDEN_CHILD. */
export const PERMISSION_FILTERED: Record<string, FakeResource> = {
  [ROOT]: { steps: [page([para('block-prose')])] },
};

/**
 * The SAME filtered listing, plus one surviving inline href pointing at the
 * hidden child.
 *
 * This is the contrast that makes the finding precise. An inline href lives in
 * a paragraph's rich text and the paragraph is readable, so the href survives
 * the filtering that deleted the `child_page` block. REF001 then resolves it,
 * gets a 404, and the run stops being clean.
 *
 * The difference between this fixture and the one above is the BLOCK TYPE of
 * the trace, and nothing else.
 */
export const PERMISSION_FILTERED_WITH_LINK: Record<string, FakeResource> = {
  [ROOT]: { steps: [page([para('block-prose'), linkPara('block-link', `https://app.notion.com/p/${HIDDEN_CHILD}`)])] },
};

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

/**
 * A database mention, as a reusable block — #144. Same shape `DB_MENTION` uses
 * inline; extracted so a fixture can point one at a database the scan actually
 * reached rather than at an unreachable target.
 */
export const dbMentionPara = (id: string, databaseId: string) =>
  ({ object: 'block', id, type: 'paragraph',
     paragraph: { rich_text: [{ type: 'mention', mention: { type: 'database', database: { id: databaseId } } }] } });

/**
 * TWO reached data sources, ONE of them referenced — #144.
 *
 * `DATASET` is `@`-mentioned from the root's own block content, so it has one
 * inbound reference in the scan's reference set. `DATASET_B` has none, and is
 * the fixture's whole point: it drives the SCOPED ZERO, which is the line this
 * measurement can most easily get wrong. An unscoped "unreferenced" asserted
 * over a workspace the connection cannot enumerate is negation as failure
 * (ADR-0002), and only a real zero row can demonstrate the scoped phrasing.
 *
 * `PAGE_B` is here so the reached set is not databases alone — a derivation that
 * forgot to filter by kind would put a page in this table, and a fixture without
 * one could not catch that.
 */
export const INBOUND_REFS: Record<string, FakeResource> = {
  [ROOT]: {
    steps: [page([
      dbMentionPara('block-db-ref', DATASET),
      childDb(DATASET, 'wl-dataset'),
      childDb(DATASET_B, 'wl-quiet-dataset'),
      childPage(PAGE_B, 'wl-revoke-parent'),
    ])],
  },
  [PAGE_B]: { steps: [page([])] },
  /* ⛔ A DATABASE ID MUST NOT ANSWER `retrievePage` SUCCESSFULLY, because Notion
   * does not — `GET /v1/pages/{id}` on a database is exactly the call whose
   * failure `scan.ts`'s database branch exists to avoid making. These entries
   * previously read `{ steps: [page([])] }`, which answered the page retrieve
   * with a page. Nothing reads it today, since the guard short-circuits first,
   * so this is not a green-mutation hole — it is worse in a quieter way: a
   * fixture encoding a falsehood about the API, which is the "defect in the
   * instrument that looks exactly like a defect in the product" this file's own
   * `fakePort` docstring names.
   *
   * `steps` stays, because the block listing IS reachable for a database and the
   * traversal is entitled to ask; only the page retrieve is made to fail. */
  [DATASET]: { steps: [page([])], pageFail: { status: 404, code: 'object_not_found' } },
  [DATASET_B]: { steps: [page([])], pageFail: { status: 404, code: 'object_not_found' } },
};

/**
 * The SAME two data sources, plus an external link — #144.
 *
 * The only difference from `INBOUND_REFS` is one `https://example.com` href, so
 * any change in the inbound counts between the two fixtures is attributable to
 * that href and to nothing else. An external reference is not a reference to
 * anything in this workspace, and letting one raise a count would make the
 * figure answer a different question than its label claims.
 */
export const INBOUND_REFS_PLUS_EXTERNAL: Record<string, FakeResource> = {
  ...INBOUND_REFS,
  [ROOT]: {
    steps: [page([
      dbMentionPara('block-db-ref', DATASET),
      linkPara('block-ext', EXTERNAL_LINK),
      childDb(DATASET, 'wl-dataset'),
      childDb(DATASET_B, 'wl-quiet-dataset'),
      childPage(PAGE_B, 'wl-revoke-parent'),
    ])],
  },
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

/* ------------------------------------------------------------ properties -- */

/* REQ001's fixtures — #58.
 *
 * THE PROPERTY VALUE SHAPES ARE THE API'S, NOT A CONVENIENCE. A Notion page
 * property is an object carrying its own `id` and `type`, and the value lives
 * under the key named by `type`. A fake that stored a bare string would let the
 * rule read `properties[name]` directly and pass while the real response shape
 * failed — the instrument-shaped defect the fixture header above records.
 */
export const PROP_ID_OWNER = 'AbC%3D';
export const PROP_ID_TITLE = 'title';

/** A rich_text property. Empty text means an EMPTY ARRAY, which is what the API returns. */
export const richTextProp = (text: string, id = PROP_ID_OWNER) => ({
  id, type: 'rich_text',
  rich_text: text === '' ? [] : [{ type: 'text', text: { content: text }, plain_text: text }],
});

/** A title property. Every page in this workspace has one and it is never empty. */
export const titleProp = (text: string) => ({
  id: PROP_ID_TITLE, type: 'title',
  title: [{ type: 'text', text: { content: text }, plain_text: text }],
});

/** A property object whose own `type` key is missing from it — the shape the scan cannot read. */
export const UNREADABLE_PROP = { id: PROP_ID_OWNER, type: 'rollup' };

/** Root with one readable child and no data source, so only REQ001's row can fall below the floor. */
const rootWithChild = (rootProps: Record<string, unknown>, childProps: FakeResource): Record<string, FakeResource> => ({
  [ROOT]: { steps: [page([childPage(PAGE_B, 'wl-revoke-parent')])], properties: rootProps },
  [PAGE_B]: { steps: [page([])], ...childProps },
});

/* Row 1 of the table: the property is in the map and carries no value. THE VIOLATION. */
export const REQ_PRESENT_EMPTY = rootWithChild(
  { Title: titleProp('wl-proof-fixture'), Owner: richTextProp('a name') },
  { properties: { Title: titleProp('wl-revoke-parent'), Owner: richTextProp('') } },
);

/* Row 2: present and non-empty. Conforms. */
export const REQ_PRESENT_VALUE = rootWithChild(
  { Title: titleProp('wl-proof-fixture'), Owner: richTextProp('a name') },
  { properties: { Title: titleProp('wl-revoke-parent'), Owner: richTextProp('another name') } },
);

/* Row 3: a map the scan READ, with no such property in it. NOT a violation — the
 * API returns the properties the integration can see, so absent means "not
 * defined here" OR "not granted" and the scan cannot tell which. */
export const REQ_ABSENT_FROM_MAP = rootWithChild(
  { Title: titleProp('wl-proof-fixture'), Owner: richTextProp('a name') },
  { properties: { Title: titleProp('wl-revoke-parent') } },
);

/* Row 4: the response carried no properties map at all. Hydration failed. */
export const REQ_NO_MAP = rootWithChild(
  { Title: titleProp('wl-proof-fixture'), Owner: richTextProp('a name') },
  {},
);

/* Row 5, which the plan's table does not carry and the code must still answer:
 * the property is in the map and its VALUE cannot be read, because the object
 * does not carry the key its own `type` names. Undecidable, so it is a gap. */
export const REQ_UNREADABLE_SHAPE = rootWithChild(
  { Title: titleProp('wl-proof-fixture'), Owner: richTextProp('a name') },
  { properties: { Title: titleProp('wl-revoke-parent'), Owner: UNREADABLE_PROP } },
);

/**
 * The vendor's own "I will not send this value" — issue #127.
 *
 * Notion's changelog, 2026-08-05: "The API can now return formula and rollup
 * page property values and property item values with `type` set to
 * `"unsupported"` and an empty `unsupported` object."
 *
 * ⛔ THIS IS THE REAL SHAPE, NOT AN APPROXIMATION OF IT. The empty object is the
 * whole hazard: it is not null, not an array and not a string, so it reached
 * `readProperty`'s catch-all and was read as a present VALUE. A fixture that
 * used `unsupported: null` would pass through the `empty` branch instead and
 * would test nothing.
 */
export const UNSUPPORTED_PROP = { id: PROP_ID_OWNER, type: 'unsupported', unsupported: {} };

export const REQ_UNSUPPORTED_TYPE = rootWithChild(
  { Title: titleProp('wl-proof-fixture'), Owner: richTextProp('a name') },
  { properties: { Title: titleProp('wl-revoke-parent'), Owner: UNSUPPORTED_PROP } },
);

/* The page itself is refused when the hydration stage retrieves it. */
export const REQ_PAGE_UNREACHABLE = rootWithChild(
  { Title: titleProp('wl-proof-fixture'), Owner: richTextProp('a name') },
  { pageFail: { status: 429, code: 'rate_limited' } },
);

/* A data source in scope. This build does not enumerate one, so the pairs
 * beneath it are unenumerable — a gap, never an applicability filter (#50). */
export const REQ_WITH_DATASET: Record<string, FakeResource> = {
  [ROOT]: { steps: [page([childPage(PAGE_B, 'wl-revoke-parent'), childDb(DATASET, 'wl-dataset')])], properties: { Title: titleProp('wl-proof-fixture'), Owner: richTextProp('a name') } },
  [PAGE_B]: { steps: [page([])], properties: { Title: titleProp('wl-revoke-parent'), Owner: richTextProp('a name') } },
  [DATASET]: { steps: [page([])] },
};

/* ------------------------------------------------------------ uniqueness -- */

/* UNQ001's fixtures — #59.
 *
 * A UNIQUENESS SCOPE NEEDS MORE THAN THREE RESOURCES, which is why these IDs
 * exist rather than reusing PAGE_A and PAGE_B. The rule's coverage item is
 * unordered PAIRS, so the interesting arithmetic starts at four members: three
 * resources are three pairs and so are three of anything, which is exactly the
 * coincidence that lets a resource-shaped denominator pass unnoticed. Five
 * members are ten pairs and no other reading produces ten.
 */
export const UNQ_1 = '11111111aabbccdd01010101eeff0011';
export const UNQ_2 = '22222222aabbccdd02020202eeff0011';
export const UNQ_3 = '33333333aabbccdd03030303eeff0011';
export const UNQ_4 = '44444444aabbccdd04040404eeff0011';
export const UNQ_5 = '55555555aabbccdd05050505eeff0011';

/**
 * A declared root with `children` beneath it, each carrying the properties
 * given. The root itself carries none and is therefore a scope member whose
 * property is ABSENT FROM THE MAP — which is a gap, and it would silently
 * lower every ratio these fixtures assert.
 *
 * So the root's properties are REQUIRED here, unlike `rootWithChild` above. A
 * fixture whose root is a permanent gap cannot show a clean run, and a suite
 * that never sees a clean run cannot tell a real gap from its own scaffolding.
 */
export const unqFixture = (rootTitle: string, children: Array<[string, FakeResource]>): Record<string, FakeResource> => ({
  [ROOT]: {
    steps: [page(children.map(([id]) => childPage(id, 'a child')))],
    properties: { Title: titleProp(rootTitle) },
  },
  ...Object.fromEntries(children.map(([id, r]) => [id, { steps: [page([])], ...r }])),
});

/** A child carrying one Title. The ordinary member. */
export const titled = (text: string): FakeResource => ({ properties: { Title: titleProp(text) } });

/** A child whose Title is present in the map and empty — decision 1's subject. */
export const untitled = (): FakeResource => ({ properties: { Title: { id: PROP_ID_TITLE, type: 'title', title: [] } } });

/** The same declared root, with ONE UNQ001 entry — #59. */
export const cfgUnq = (scope: string, property: string, minCoverage = 1.0): Config => ({
  version: 1,
  roots: [{ id: ROOT, alias: 'wl-proof-fixture' }],
  minCoverage,
  rules: [{ rule: 'UNQ001', scope: { id: scope }, property }],
});

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
