# Notion Public API — Practitioner Ground Truth

- **Date of research:** 2026-08-16
- **Role:** practitioner ground-truth SME (evidence from GitHub issue trackers, SDK PRs, vendor changelog, integration-platform community threads)
- **Status:** This is research evidence, not a canonical product decision. It does not override `CONTEXT.md` or any ADR in `docs/adr/`. It is an input to the 72-hour API proof gate.

Scope note: this document reports what practitioners observe, not what the documentation promises. Where `developers.notion.com` is cited it is because the documentation itself admits a limit that practitioners then hit; those citations are marked **[doc admission]**.

Trust tiers used throughout:

- **(A)** reproduced with numbers by a named party
- **(B)** single anecdote
- **(C)** secondary or aggregator blog, primary source unverified

---

## 1. Search completeness

**`POST /v1/search` is not complete, and Notion says so.** **[doc admission]**

> "Search is not guaranteed to return everything, and the index may change as your connection iterates through pages and databases."

> "Search indexing is not immediate. If a connection performs a search quickly after a page is shared with the connection (such as immediately after a user performs OAuth), then the response may not contain the page."

> "Trash results are search-index-backed and eventually consistent."

The only guarantee offered:

> "Any pages or databases that are directly shared with a connection are guaranteed to be returned."

No time bound for the indexing lag is published. The documentation's recommended workaround is to add a refresh mechanism so users can retry searches when expected results do not appear.

Source: <https://developers.notion.com/reference/search-optimizations-and-limitations> — fetched 2026-08-16.

**Observed lag figure.** Community guidance says to wait up to approximately 10 minutes after page creation for the index to update. **(C)** — search-snippet only; I could not verify a primary source for the 10-minute number. Treat the number as unconfirmed. Treat "there is a lag" as confirmed by the doc admission above.

### 1.1 Hard positional ceiling on search traversal — the strongest finding in this report **(A)**

Outline (open-source wiki, Enterprise self-hosted deployment) attempted to enumerate a workspace of approximately 15,000 pages via `POST /v1/search`. The traversal fails at a fixed position.

Initial report:

> "Notion imports fail for workspaces with ~10,000+ pages. The import fails during the initial page discovery phase with: `Failed: The start_cursor provided is invalid: 4d49987c-a64c-4ab8-916e-d9aeaffa265b`"

> "This is 100% reproducible on any large workspace."

Follow-up after further testing by the same reporter (comment dated 2026-02-25):

> "The cursor expires at exactly 11,200 pages every time, regardless of pageSize or request rate. This is a position-based limit, not a time-based TTL."

> "Restarting the search from the beginning hits the same expiry at the same position every attempt."

Measured results, same workspace, same token:

| pageSize | Pages scanned | API calls | Time |
|---|---|---|---|
| 25 | 11,200 | 449 | 793 s |
| 100 | 11,200 | 112 | 353 s |

Stated root cause:

> "The root cause is that `fetchRootPages()` must scan every page in the workspace via the search API just to find the handful of workspace-level items. There's no server-side filter for `parent.type`, so for any workspace over ~11k pages, this scan will always hit the cursor limit."

**Issue status:** <https://github.com/outline/outline/issues/11573> — opened 2026-02-25, **CLOSED 2026-07-10**.

**Fix status:** <https://github.com/outline/outline/pull/12871> ("fix(notion): recover from expired search cursor in large workspaces") — **CLOSED, NOT MERGED** (`merged: false`, `merged_at: null`). An earlier PR, <https://github.com/outline/outline/pull/11576>, was also withdrawn by its author. The issue was closed without a merged fix. The Outline maintainer stated on 2026-02-27: "I don't think its an approach we want to merge and maintain, but I have a thread open with Notion to find a way around this that doesn't involve manual root ID lookup."

**There is no evidence Notion changed the behavior.** Outline's shipped workaround is an environment variable, `NOTION_ROOT_PAGE_IDS`, which takes a comma-separated list of page/database IDs and fetches them directly via `pages.retrieve` / `databases.retrieve`, bypassing the search API entirely. Coverage then depends on a human pasting the correct root IDs.

**Caveat on currency.** This was last confirmed February 2026. Notion changed pagination cursor internals on 2026-04-22 (see §4). That change targeted a different failure mode (overlapping sessions), but it may have moved this one. This should be re-tested.

---

## 2. Determinism

### 2.1 Signed file URLs are regenerated per request and expire. This defeats byte-identical output as specified.

**[doc admission]**

> "The `url` is a temporary signed link that expires after 1 hour. Re-fetch the page to refresh it."

Every file object carries an `expiry_time` field. The documentation's own example value: `"2025-04-24T22:49:22.765Z"`. This applies to files retrieved from both page content blocks and database file properties.

Source: <https://developers.notion.com/docs/retrieving-files> — fetched 2026-08-16.

**Practitioner confirmation of the URL shape.** The URL carries a per-request AWS signature: **(A)**

> "a `https://prod-files-secure.s3.us-west-2.amazonaws.com/...?X-Amz-Signature=...` URL"

Source: <https://github.com/makenotion/notion-mcp-server/issues/274> — **OPEN**, created 2026-04-21. (The issue itself is about file properties returning an unresolved `file://%7B...%7D` reference instead of a signed URL; the signed-URL shape is quoted from the same issue as the expected correct behavior.)

Secondary confirmation of the mechanism: the signed URL query string includes `X-Amz-Algorithm`, `X-Amz-Credential`, `X-Amz-Date`, `X-Amz-Expires=3600`, and `X-Amz-Signature`. **(C)**

**Consequence.** Any page containing an image, a file block, or a file-type property yields a different byte string on every scan. Three things drift with no user edit:

1. `X-Amz-Signature` — a fresh cryptographic signature per request
2. `X-Amz-Date` — inside the URL query string, not a top-level field
3. `expiry_time` — a top-level field on the file object

**Timestamp stripping alone does not fix this.** `X-Amz-Signature` is not a timestamp field and will survive any timestamp-removal pass. A scan that strips timestamps and then diffs will report spurious differences on every page holding a file.

### 2.2 `last_edited_time` drifts in a way that reorders results; `created_time` does not.

Notion's own SDK engineers, in the PR adding full-export helpers:

> "`created_time` is used because it never changes, unlike `last_edited_time`, which would move rows between windows."

Source: <https://github.com/makenotion/notion-sdk-js/pull/730> — **MERGED 2026-06-25**. **(A)**

This is a useful positive result: `created_time` is asserted stable by the vendor and is safe to use as a sort key and as part of a normalized fingerprint.

### 2.3 Result order

Default `dataSources.query` ordering is `created_time` descending, not the order shown in the Notion UI.

> "the default order of API response matches 'created_time descending' rather than the real order on notion page"

Source: <https://github.com/makenotion/notion-sdk-js/issues/388> — created 2023-02-27, **CLOSED 2023-03-01** (working as intended; the reporter's expectation of UI-matching order was not accepted). **(B)**

I found **no** report of result order changing between two identical calls against an unchanged workspace. Absence of reports is weak evidence, not proof. This should be tested directly.

### 2.4 Verdict on the determinism gate

**Byte-identical output after timestamp removal is not achievable as the requirement is currently written.** The blocking cause is signed file URLs (§2.1).

**It is achievable under a stronger normalization.** The required normalization function:

1. Strip the query string from every `prod-files-secure.s3.*` URL, retaining only scheme, host, and path.
2. Drop `expiry_time` from every file object.
3. Drop `last_edited_time` and `last_edited_by` from every object.
4. Sort every collection by a stable key — `id`, or `created_time` then `id`. Do not rely on API-returned order.

Under those rules I found no evidence of remaining drift. I also found no one who has tested it. **This must be proven in the 72-hour API proof, not assumed.** The acceptance criterion in `CONTEXT.md` should be rewritten from "byte-identical after timestamp removal" to name this normalization function explicitly, or the proof will pass or fail against an undefined predicate.

---

## 3. Rate limits in practice

### 3.1 Documented limits

- **Per connection:** an average of three requests per second, "with some bursts beyond the average allowed." Equivalently 2,700 requests per 15 minutes per token.
- All subscription tiers share identical limits. No paid tier offers higher throughput.
- Notion reserves the right to change limits: "Rate limits may change."

Sources: <https://developers.notion.com/reference/request-limits>, <https://truto.one/blog/how-to-integrate-with-the-notion-api-architecture-guide-for-b2b-saas/> (published 2026-03-30).

### 3.2 Secondary per-workspace limit — added 2026-06-16, absolute value undocumented

Changelog entry, 2026-06-16:

> "The Notion API now applies a rate limit per workspace, in addition to the existing per-connection limit. This limit is shared across all of a workspace's connections and scaled to the workspace's plan."

The actual number is not published. The field `additional_data.rate_limit_reason` on a 429 response indicates which limit was breached.

Sources: <https://developers.notion.com/page/changelog>, <https://developers.notion.com/reference/request-limits>.

**Operational consequence:** a scan can be throttled by unrelated integrations in the same workspace, at a threshold the tool cannot know in advance. A scan's wall-clock time is not a property of the scan alone.

### 3.3 `Retry-After` is not guaranteed

Notion's own guidance treats `Retry-After` as optional and shows a fallback to exponential backoff when it is absent. Notion's documentation instructs developers to "Read `Retry-After` and pause new requests," but the implementation examples handle its absence.

Corroborating evidence from the vendor's own SDK:

- <https://github.com/makenotion/notion-sdk-js/pull/664> — "Add automatic retry support with exponential backoff", **MERGED 2026-02-01**
- <https://github.com/makenotion/notion-sdk-js/pull/727> — "[SDK] Add service overload retry support", **MERGED 2026-06-16**

**Design for `Retry-After` being missing.** Do not treat its presence as a precondition.

### 3.4 Observed wall-clock cost

**Enumeration (search).** From the Outline measurements in §1.1: **11,200 pages enumerated in 112 API calls over 353 seconds** at `pageSize: 100`. That is approximately 32 objects/second of enumeration. Enumeration is the cheap part — each call returns 100 objects.

**Block traversal is the expensive part.** `GET /v1/blocks/{id}/children` returns only one level of children, capped at 100 per response, and you must recurse on every block with `has_children: true`. Payloads cap at 1,000 block elements and 500 KB overall.

Worked example, widely cited: a single page with 250 blocks, of which 50 are toggles containing 150 child blocks each, costs **103 separate API calls** and takes **over 34 seconds** at 3 req/s. **(C)** — <https://truto.one/blog/how-to-integrate-with-the-notion-api-architecture-guide-for-b2b-saas/> (2026-03-30).

**Estimate for a ~10,000-block workspace:**

- Shallow block tree: roughly 300–800 API calls, **2–5 minutes**
- Toggle-heavy or column-heavy tree: **10–30 minutes**
- Add retry overhead on top. One aggregator claims a 30-minute sync becomes 2–3 hours once rate-limit handling and retries are included. **(C)**

**Real-world upper bound.** Outline's actual import of a ~15,000-page workspace ran **over 24 hours** before failing on an unrelated error (comment dated 2026-03-03 on issue 11573). Outline has a hardcoded 24-hour import timeout which the same reporter then tripped (comment 2026-03-05).

---

## 4. Pagination hazards

### 4.1 Positional cursor invalidation on search — approximately 11,200 results **(A)**

See §1.1 for full detail. Error text: `The start_cursor provided is invalid: <uuid>`. The limit is positional, not time-based; restart-from-zero does not recover, because the same position is hit every attempt.

Status: <https://github.com/outline/outline/issues/11573> — **CLOSED 2026-07-10 with no merged fix**.

### 4.2 Overlapping-session cursor 400s — FIXED 2026-04-22

Changelog entry, 2026-04-22:

> "Pagination cursors now embed a session identifier, eliminating intermittent `400 validation_error` errors that could occur when multiple pagination sessions for the same query overlapped."

Source: <https://developers.notion.com/page/changelog>.

**This fix post-dates the Outline report (February 2026) and addresses a different mechanism.** Session-identifier collisions are not the same as a positional ceiling. Do not assume §4.1 was fixed by this.

### 4.3 Silent truncation at 10,000 rows on `dataSources.query`, with `has_more: false` **(A)**

Vendor description, from the PR that added the workaround:

> "A single `dataSources.query` returns at most 10,000 results. Once that limit is reached, `has_more` becomes `false` and the response carries `request_status.type === "incomplete"` (`incomplete_reason: "query_result_limit_reached"`). The existing `iteratePaginatedAPI` / `collectPaginatedAPI` helpers follow `next_cursor` until `has_more` is `false`, so on a larger data source they stop at 10,000 and silently return a partial result. This is a common source of confusion for connections doing full exports."

Verified by Notion against a 20,000+ row data source:

> "Manually verified against a 20,000+ row dev data source with the per-query limit enabled: a plain query caps at exactly 10,000 with `request_status: incomplete`, and `collectAllDataSourceRows` recovers the full set with no duplicates."

Source: <https://github.com/makenotion/notion-sdk-js/pull/730> — **MERGED 2026-06-25**.

**Before `request_status` existed (see §4.5), this truncation was undetectable from the response.** `has_more: false` at exactly 10,000 rows is indistinguishable from a genuinely complete result.

### 4.4 Duplicates and stalls at window boundaries

Notion's own windowing workaround has to de-duplicate:

> "Boundary rows that share a timestamp are de-duplicated by id."

And a follow-up bug shipped four minutes after the helper PR merged:

> "if a truncated window's boundary row was a data source, or a window held only child data sources, the loop could restart from an older timestamp or throw 'cannot make progress' spuriously, even though more rows remained."

Source: <https://github.com/makenotion/notion-sdk-js/pull/731> — **MERGED 2026-06-25**.

Duplicate and stall hazards are real and were shipped-then-patched inside the vendor's own helper.

**Unbreakable case:** if more than 10,000 rows share the same `created_time` (minute granularity), the windowing workaround throws. That set is unreadable by any documented means.

> "They throw a clear error if a single `created_time` (minute granularity) holds more rows than the limit, since the window can't be narrowed by time alone."

**View queries cannot be windowed at all:**

> "View queries (`GET /v1/views/{view_id}/queries/{query_id}`) hit the same limit but paginate a fixed, already-capped result set and accept no filter while paginating, so they can't be windowed this way; query the underlying data source instead."

### 4.5 Positive: the API now emits an explicit incompleteness signal

As of 2026-04-20, every paginated list response can carry a `request_status` field:

```json
{
  "request_status": {
    "type": "incomplete",
    "incomplete_reason": "query_result_limit_reached"
  }
}
```

Changelog entry, 2026-04-20:

> "The endpoints now enforce a maximum pagination depth of 10,000 results per query. When a query matches more rows than this limit, the response includes a new `request_status` field."

The field was threaded through `ModelListResource`, the shared infrastructure for all paginated list responses in the public API. It therefore appears on:

- `QueryDataSourceResponse`
- **`SearchResponse`**
- `ViewQueryResponse`, `GetViewQueryResultsResponse`, `ListDatabaseViewsResponse`
- `ListCommentsResponse`
- `ListFileUploadsResponse`

Source: <https://github.com/makenotion/notion-sdk-js/pull/711> — **MERGED 2026-04-20**. Also <https://developers.notion.com/page/changelog>.

**This is the single highest-leverage fact for the completeness claim.** Pin `Notion-Version` to a release that includes `request_status`, and treat its absence from a list response as a hard error rather than as evidence of completeness. Note the one documented `incomplete_reason` value is `query_result_limit_reached`; do not assume it covers other causes of incompleteness such as search index lag.

---

## 5. The grant boundary

### 5.1 There is no endpoint that enumerates what an integration has been granted

An integration can only discover what it can reach: `POST /v1/search` (incomplete by design, capped at approximately 11,200 — §1) plus recursive traversal from known roots. To know its grant, a tool must either be told the roots by a human or trust search.

> "Integrations don't have access to any pages or databases in the workspace by default. A user must share specific pages with an integration for those pages to be accessed using the API."

> "When you connect a page and/or database to an integration, all child entities come along for the ride."

Sources: <https://developers.notion.com/docs/authorization>, <https://www.notion.com/help/add-and-manage-connections-with-the-api>.

The grant is therefore a set of subtrees, discoverable only by walking down from roots you already know about.

### 5.2 Can a tool detect that a child exists but is inaccessible? Partially, and only in one direction.

**Detectable hole.** A `child_page` or `child_database` block appears in `GET /v1/blocks/{id}/children` with an ID and title even when the page itself subsequently 404s on retrieve. This gives a named, enumerable hole.

**(C)** — multiple community reports describe exactly this pattern (a `child_page` block is returned; retrieving that page 404s), but I could not find a single reproduced primary write-up. **This is the highest-value item to verify directly in the 72-hour proof, because a completeness proof would rest on this mechanism.**

Test procedure: share a parent page with the integration, revoke access to one child page, list the parent's block children, then attempt to retrieve the child. Record whether the `child_page` block is still present.

**Undetectable hole.** A whole subtree whose root was never shared is invisible. No block anywhere in the readable graph references it. This hole cannot be detected by any API means.

**Adjacent confirmation that this distinction is a known hard problem.** A Notion CLI project lists as unresolved scope:

> "Complete relation/rollup/formula handling: checkpoint health, incomplete rollup states, formula depth/error cases, relation-sharing diagnostics, and empty-vs-inaccessible distinctions."

Source: <https://github.com/overengineeringstudio/effect-utils/issues/718> — **OPEN**, created 2026-05-31. **(B)**

### 5.3 Consequence for the completeness claim

A scan can prove: *"this subtree is complete relative to the roots I was given, and here are the specific children I could see referenced but not read."*

A scan cannot prove: *"I saw the whole workspace."* That claim is unfalsifiable through the public API.

---

## 6. 404 ambiguity

### 6.1 Confirmed, and deliberate

**[doc admission]** on `GET /v1/blocks/{id}/children`:

> "Returns a 404 HTTP response if the block specified by `id` doesn't exist, or if the connection doesn't have access to the block."

Source: <https://developers.notion.com/reference/get-block-children>.

Practitioner framing: **(C)** — the source URL returned HTTP 403 on direct fetch, so this is search-snippet only. It matches the documentation text exactly and matches the stated security rationale.

> "a valid token querying an unconnected page returns 404, identical to a missing page, with no distinguishing signal in the error body"

> "Notion answers `object_not_found` for objects the integration cannot see, deliberately, so existence never leaks."

### 6.2 No known way to distinguish them

The error code is `object_not_found` in both cases. No differing message, no differing sub-code, no documented timing difference.

### 6.3 One genuine discriminator that is not the same thing

A missing **capability** (as opposed to missing access to an object) returns **403**, not 404.

> "the endpoint requires a connection to have read content capabilities, and attempting to call the API without read content capabilities will return an HTTP response with a 403 status code"

Source: <https://developers.notion.com/reference/capabilities>, corroborated by the Latenode community troubleshooting threads.

So 403 vs 404 separates "my integration lacks the read-content capability" from "I cannot see this object." It does **not** separate deleted from unshared.

### 6.4 Design implication

The tool must model `unreachable` as a first-class third state alongside `present` and `absent`. `unreachable` must never be collapsed into `absent`. A rule that says "this required child page is missing" cannot be emitted for an object that returned 404 — only "this child could not be read."

---

## 7. ID stability

### 7.1 Property IDs survive rename — confirmed

**[doc admission]**, two independent statements on the same page:

> "An identifier for the property, usually a short string of random letters and symbols. Some automatically generated property types have special human-readable IDs (e.g. all Title properties have an `id` of `\"title\"`)."

> "the saved formula references the property by ID, so renaming the property later doesn't break the formula"

And for select / multi-select option identifiers:

> "An identifier for the option. Does not change if the name is changed."

Source: <https://developers.notion.com/reference/property-object>.

### 7.2 Property ID under type change — UNKNOWN, could not close

The documentation is silent on whether a property's `id` survives a change of property type. I found no practitioner report either way.

**Prior (unverified):** a type change likely destroys and recreates the property, minting a new ID. The Notion UI warns about data loss on type change, which is consistent with destroy-and-recreate. **Do not build rule identity on the assumption that a property ID survives a type change.** Test this directly.

### 7.3 `created_time` never changes — confirmed by vendor

See §2.2. <https://github.com/makenotion/notion-sdk-js/pull/730>, merged 2026-06-25.

### 7.4 Page and database IDs survived the 2025-09-03 migration

**[doc admission]**:

> "The concept of a database ID in the Notion app stays the same."

> "Connections using the `2022-06-28` API version (or older) will continue to work with existing databases in Notion that have a single data source."

Source: <https://developers.notion.com/docs/upgrade-faqs-2025-09-03>.

Practitioner corroboration that page IDs were unaffected:

> "This explains why page content still works (page IDs haven't changed), but the properties are missing—the API now requires a `data_source_id` to retrieve the schema and properties correctly."

Source: <https://github.com/astro-notion/notion-astro-loader/issues/10> — created 2026-02-10, **CLOSED 2026-02-26**.

However, a **new ID tier appeared**: `data_source_id`, which is what now carries the schema. Prior to 2025-09-03, "databases were limited to one data source, so the data source ID was hidden."

### 7.5 No reports found of page or block IDs changing

I found no reports of page, block, or database IDs changing across moves or template instantiation. Duplication obviously mints new IDs; that is expected behavior, not drift.

---

## 8. The 2025-09-03 data-source migration

**Announced 2025-08-26. Live 2025-09-03. Disruptive in practice, over weeks, on the largest integration platforms.**

### 8.1 What changed

Database endpoints such as `POST /v1/databases/{id}/query` were replaced by `POST /v1/data_sources/{id}/query`. A database became a container; the schema and rows moved into one or more data sources within it. API requests now need a `data_source_id`, because `database_id` alone is insufficient when a database holds multiple data sources.

Source: <https://developers.notion.com/docs/upgrade-guide-2025-09-03>, <https://developers.notion.com/docs/upgrade-faqs-2025-09-03>.

### 8.2 Zapier — approximately 10 days of broken production automations **(A)**

Community thread runs **2025-09-23 to 2025-10-03**. The "Update Database Item" action displayed only a `contents` field instead of editable database properties. Users encountered "Cannot read properties of undefined" errors when attempting field updates.

At least 28+ documented affected users, including consulting firms running exclusively on Notion-Zapier workflows and businesses with downstream customer impact.

Quoted users:

- Consulting firm owner: "All of my work has been put on pause, and all of my clients' work has been put on pause."
- User with 28 broken Zaps: "We are still very much underwater...mission critical processes running on the Zapier platform."
- Another user: "It's a major disruption of our workflows...Make have indeed made it work flawlessly already."
- A Zapier Solution Partner: Notion "must be one of the most widely-used Zapier integrations" — and characterized the response as reactive rather than proactive.

Partial resolution around 2025-09-30; some users still reporting issues through 2025-10-03.

Source: <https://community.zapier.com/troubleshooting-99/notion-integration-update-51509>.

### 8.3 Retool

`POST /v1/databases/{id}/query` began returning: `Databases with multiple data sources are not supported`.

Source: <https://community.retool.com/t/notion-connection-issue-cannot-see-updated-api-endpoints-introduced-in-api-version-2025-09-03/62024>.

### 8.4 The breakage is latent and end-user-triggered — the nastiest property

Per Notion's FAQ, old API versions "continue to work with existing databases in Notion that have a single data source." They break the moment **an end user adds a second data source**, at which point requests receive:

> "Databases with multiple data sources are not supported in this API version" — status 400

So an integration pinned to `2022-06-28` works until a user does something entirely ordinary in the Notion UI, then fails, with no warning to the integration author and no deploy on the integration's side.

Mitigation Notion provides: the error response body includes `child_data_source_ids` so the caller can identify which source IDs to use.

Source: <https://developers.notion.com/docs/upgrade-faqs-2025-09-03>.

### 8.5 Long tail into 2026

- <https://github.com/jomei/notionapi/issues/195> — "Do you have any plans to update API version from 2022-06-28 to 2025-09-03?" — created 2025-09-18, **CLOSED**.
- <https://github.com/astro-notion/notion-astro-loader/issues/10> — database properties silently empty. Filed **2026-02-10**, five months after the migration. **CLOSED 2026-02-26**.
- <https://github.com/outline/outline/issues/11573#issuecomment> (comment dated 2026-03-03) — Outline hit `Databases with multiple data sources are not supported` **after about 24 hours of importing**, six months after the migration. The reporter noted that skipping such databases "would mean the import silently skips importing any pages in that database."
- <https://github.com/mediajunkie/piper-morgan-product/issues/165> — "CORE-NOTN-UP: Upgrade Notion database API", 2025-09-10, **CLOSED**.

### 8.6 A further breaking version has since shipped: `2026-03-11`

Evidence:

- <https://github.com/visus-io/notion-sdk-ts/issues/36> — "feat: implement Notion API 2026-03-11 breaking changes", **CLOSED 2026-06-28**
- <https://github.com/Blummer92/dmsc_apps_script_bundle/issues/52> — "Migrate Notion transport to the 2026-03-11 API", **OPEN**, created 2026-07-24
- <https://github.com/markdstafford/autocatalyst-v0/issues/108> — "feat: complete Notion API migration to 2026-03-11 (data source IDs + version bump)", **CLOSED 2026-05-05**

**Notion ships breaking API versions roughly every six to seven months.** Plan for a version pin plus a recurring migration budget, not a one-time integration cost.

---

## 9. Prior art

**Searched. Found very little. This is a real gap in the ecosystem, not a search failure.**

### 9.1 Queries run

GitHub repository search via `gh api search/repositories`: `notion lint`, `notion audit`, `notion schema diff`, `notion validator`, `notion backup export in:name`, `notion sync tool`, `notion dedupe cleanup`, `airtable schema diff`, `airtable schema validation tool`, `confluence audit`, `confluence space audit tool`, `coda schema`.

GitHub issue search via `gh api search/issues`: `notion schema drift detection tool`, `notion workspace linter`, `notion structural validator rules`, `notion audit integrity checker api`, plus repo-scoped keyword sweeps across `makenotion/notion-sdk-js` and `makenotion/notion-mcp-server`.

Web search: approximately 12 queries covering Notion workspace audit tools, structural rules, naming-convention linters, and adjacent SaaS schema validators.

### 9.2 Notion structural-validation prior art

| Project | What it does | Status |
|---|---|---|
| [Balneario-de-Cofrentes/notion-cli-agent](https://github.com/Balneario-de-Cofrentes/notion-cli-agent) — 88 stars, last push 2026-08-03 | **The closest existing thing.** Ships `notion validate lint <db_id>`, `notion validate check`, and `notion validate health` — described as "Database integrity scoring" and "Find missing fields, overdue items, stale entries." Also ships `inspect workspace`, `inspect schema`, and `dedup`. Exposes `validate_health` as one of 14 MCP tools. | Active |
| [overengineeringstudio/effect-utils](https://github.com/overengineeringstudio/effect-utils), package `packages/@overeng/notion-cli` | Ships `notion schema diff` — a **drift gate** against a declared schema. This is closest to `workspace_lint`'s intended shape. Self-reported limits: [#896](https://github.com/overengineeringstudio/effect-utils/issues/896) (**OPEN**, 2026-07-07) — "`diff` only detects property add / remove / type-change. It does NOT detect `select` / `status` option-value changes (options added/removed/renamed)." [#718](https://github.com/overengineeringstudio/effect-utils/issues/718) (**OPEN**, 2026-05-31) — property authority model still unresolved, including "empty-vs-inaccessible distinctions." | Active, incomplete |
| [chazyua/notionctl](https://github.com/chazyua/notionctl) — 2 stars, last push 2026-08-16 | "Security-auditable, zero-dependency command-line interface for Notion, designed to be driven by AI coding agents via shell invocations." | Active, very small |
| [4ier/notion-cli](https://github.com/4ier/notion-cli) | Has `auth doctor` — diagnostics only, not structural linting. Open roadmap issue [#41](https://github.com/4ier/notion-cli/issues/41) tracks remaining API gaps; [#39](https://github.com/4ier/notion-cli/issues/39) tracks the 2025-09-03 migration. Both **OPEN**, created 2026-04-30. | Active |
| [Romloader/notion-linter](https://github.com/Romloader/notion-linter) — 2 stars, last push 2023-01-11 | **Not relevant despite the name.** Lints Notion *formula* syntax as a VS Code extension. **Abandoned.** |
| [Sync2Sheets audit log](https://sync2sheets.com/features/audit-log/) | Commercial. "A persistent, timestamped record of every schema change to a Notion database, adding a row when a property is created, removed, or reconfigured." Change tracking, not rule checking. | Commercial, active |
| [Notion native audit log](https://www.notion.com/help/audit-log) | Enterprise plans only. "Notion records when a user, integration, or external AI tool adds, removes, or changes properties in a data source schema." Observational; enforces nothing. | Vendor, Enterprise-gated |

### 9.3 Adjacent SaaS — schema validators and integrity checkers

| Platform | Project | Verdict |
|---|---|---|
| Airtable | [mickzijdel/airtable-utils](https://github.com/mickzijdel/airtable-utils) — 0 stars, last push 2026-08-08 | "Airtable Scripting agent skill and tools for schema dump, schema diff, and user check." Exactly the same shape, in a different SaaS, with essentially zero adoption. |
| Coda | [artsafin/coda-schema-generator](https://github.com/artsafin/coda-schema-generator) — 4 stars, **abandoned 2022-02-25** | Schema generator, not validator. Dead. |
| Confluence | [lithastra/atlaslens](https://github.com/lithastra/atlaslens) — 1 star, last push 2026-06-06 | "One pane of glass for Atlassian Cloud audit & activity data." Activity dashboards, not structural rules. |
| Confluence / Jira | [google/atlassian-addons-audit-sheet](https://github.com/google/atlassian-addons-audit-sheet) — 11 stars, **abandoned 2019-06-13** | Plugin inventory sync to a Google Sheet. Not structural validation. |
| Google Workspace | none found | — |

### 9.4 Finding

**No mature open-source or commercial Notion structural linter exists.** The adjacent-SaaS equivalents are all either abandoned or under five stars.

I found **no** evidence that any of these projects stopped *because of* the completeness or determinism problems in this document. The observable pattern is low adoption and maintainer attrition, not a documented technical wall. That is a weaker signal than "they tried and it was impossible," and it should not be inflated into one.

It is also not encouraging. The market has repeatedly started this shape of tool and never finished it.

---

## PROJECT-STOPPING FINDINGS

Ranked by severity.

### 1. `POST /v1/search` cannot enumerate past approximately 11,200 objects. Positional, reproducible, unfixed. Defeats COMPLETENESS at scale.

The cursor dies at the same position regardless of page size or request rate, and restarting from zero hits the same wall. Any workspace above approximately 11,000 objects cannot be discovered by search. The only known workaround is a human supplying root IDs, which means the tool's coverage is defined by human input, not by the API.

Evidence: <https://github.com/outline/outline/issues/11573> (**CLOSED 2026-07-10 with no merged fix**); <https://github.com/outline/outline/pull/12871> (**CLOSED, NOT MERGED**).

**Survivable?** Yes, but only by redefining the claim: the tool lints *declared roots*, and coverage is an explicitly user-supplied parameter rather than a discovered fact. **This changes the product's central promise.** Decide this before writing code.

### 2. Signed S3 file URLs regenerate per request. Defeats DETERMINISM as literally specified.

Every file, image, and file-property value returns a fresh `X-Amz-Signature` plus an `expiry_time` one hour out. Timestamp removal does not touch the signature.

Evidence: <https://developers.notion.com/docs/retrieving-files>; <https://github.com/makenotion/notion-mcp-server/issues/274> (**OPEN**).

**Survivable?** Yes — normalize signed URLs to path-only and drop `expiry_time`. But the acceptance criterion must be rewritten from "byte-identical after timestamp removal" to a named normalization function. Write that function's specification into `CONTEXT.md` before the 72-hour proof, or the proof will pass or fail against an undefined predicate.

### 3. `POST /v1/search` is documented as non-exhaustive and as mutating mid-traversal. Completeness is not provable, only bounded.

> "Search is not guaranteed to return everything, and the index may change as your connection iterates."

A workspace can change under a multi-minute scan. There is no transaction, no snapshot, and no consistent-read option.

Evidence: <https://developers.notion.com/reference/search-optimizations-and-limitations>.

**Survivable?** Only by reframing: a scan report is a bounded observation with a start time and an end time, not a census. The "partial scan must be detectable" requirement is achievable — see finding 4 — but "prove what it did not see" is achievable **only for holes the tool can name**. Unshared subtrees are unnameable (§5).

### 4. Positive, and load-bearing: the API now emits an explicit incompleteness signal — but only for one cause.

`request_status: {type: "incomplete", incomplete_reason: "query_result_limit_reached"}`, shipped 2026-04-20 on every paginated list response, including `SearchResponse`.

Before this existed, `dataSources.query` returned `has_more: false` at exactly 10,000 rows and silently lied. Notion's own words: "silently return a partial result… a common source of confusion for connections doing full exports."

Evidence: <https://github.com/makenotion/notion-sdk-js/pull/711> (**MERGED 2026-04-20**); <https://github.com/makenotion/notion-sdk-js/pull/730> (**MERGED 2026-06-25**); <https://developers.notion.com/page/changelog>.

**Action:** pin `Notion-Version` to a release that includes `request_status`, and treat its absence from a list response as a hard error rather than as evidence of completeness. This is the single highest-leverage action available for the completeness claim.

### 5. 404 conflates "not shared" with "does not exist," by design, with no discriminator.

**[doc admission]** on `get-block-children`. Notion does this deliberately so that object existence never leaks to an unauthorized integration.

Evidence: <https://developers.notion.com/reference/get-block-children>.

The data model needs a three-state `present | absent | unreachable`, and `unreachable` can never be resolved into either of the other two.

### 6. Breaking API versions ship every six to seven months, and break *latently* on ordinary end-user action.

2025-09-03 broke Zapier for approximately 10 days across thousands of users and was still breaking libraries in February 2026. 2026-03-11 followed. A pinned old version keeps working until a user adds a second data source, then returns 400.

This is an ongoing maintenance tax, not a one-time integration cost.

---

## OPEN QUESTIONS — could not close; test these in the 72-hour proof

1. **Does a `child_page` block remain visible when the child page's access is revoked?**
   This is the mechanism the "detectable partial scan" claim depends on, and I found only **(C)**-tier evidence for it.
   Test: share a parent with the integration, revoke the child, list the parent's block children, then retrieve the child. Record whether the block is still listed.

2. **Does a property ID survive a property *type* change?**
   Documentation silent, no practitioner reports found. Highest-value unknown for rule identity — if rules key on property ID and IDs churn on type change, every type change silently orphans a rule.

3. **Is result order stable across two identical paginated calls against an unchanged workspace?**
   No reports either way. Absence of complaints is not evidence. Cheap to test and directly gates the determinism claim.

4. **Does the approximately 11,200-object search ceiling still hold in August 2026?**
   Last confirmed February 2026. Notion changed cursor internals on 2026-04-22 (session identifiers) — that fix targeted a different failure mode, but it may have moved this one. Cheap to test given a large enough workspace. If no large workspace is available, this finding remains a documented risk that cannot be ruled out.

---

# Verification pass — 2026-08-17

Appended, not edited. Every original claim above stands as written; this section records what each was checked against and what the check returned. Issue #15.

## Why this scope

The issue's own Revisit-if said to scope down to spot-checks if the file turned out to be vendor-documented rather than community-sourced. **It does not fire.** The 18 rated claims are 7 **(A)**, 3 **(B)**, 8 **(C)** — eleven of eighteen are single anecdote or secondary.

The refuted claim in §5.2 was **(C)**. So the **(C)** tier was audited first, on calibration rather than on importance: the tier that produced one falsehood is where the next one is most likely.

## Verdicts

| Claim | Verdict | Basis |
| --- | --- | --- |
| §3.4 worked example — 250 blocks, 50 toggles × 150 children = **103 calls, >34 s** | **CONFIRMED, and the (C) rating understates it** | Derivable from two vendor-documented primitives, no blog required. `ceil(250/100) = 3`, plus `50 × ceil(150/100) = 100`, totals **103**. At 3 req/s that is **34.33 s**. `page_size` max 100 is documented on the pagination reference; 3 req/s is documented by Notion. This is arithmetic, not secondary evidence. |
| §3.4 enumeration rate — 11,200 pages / 112 calls / 353 s ≈ 32 objects/s | **CONFIRMED internally consistent** | 11,200 ÷ 112 = exactly 100 per call, matching `page_size` max. 11,200 ÷ 353 = 31.7 objects/s. Note the implied **0.32 req/s**, an order of magnitude under the 3 req/s ceiling — the reporter was not rate-limited, so this is not a throughput bound. |
| §4.1 / §1.1 — `outline/outline#11573` closed with no merged fix | **CONFIRMED** | Refetched 2026-08-17: closed as **not planned**, no PR merged, no comment after 2026-07-10, nothing indicating Notion fixed the cursor limit. |
| §4.1 / §1.1 — the **~11,200** figure itself | **NOT RE-CONFIRMED** | The refetch surfaced ~15,000 pages, ~600 calls, and a 5,448-page recovery test — it did **not** quote 11,200 back. The number may sit in a comment the fetch did not surface. Recorded as unverified rather than passed over, because silence reads as confirmation and is not. |
| §4.5 — the seven response types carrying `request_status` | **CONFIRMED against the primary source** | `makenotion/notion-sdk-js` PR #711 refetched. All seven type names match the file exactly: `ListCommentsResponse`, `QueryDataSourceResponse`, `ListFileUploadsResponse`, `SearchResponse`, `ViewQueryResponse`, `ListDatabaseViewsResponse`, `GetViewQueryResultsResponse`. |
| §4.5 — *"treat its absence from a list response as a hard error"* | **REFUTED 2026-08-17** | This sentence is the origin of ADR-0002 decision 4, which hard-errored every healthy scan. Superseded by **ADR-0006**: the test is positive — `request_status.type === "incomplete"`. Absence is neither an error nor proof of completeness. |
| §5.2 — the detectable hole | **REFUTED 2026-08-17** | `docs/proof/results.md` §4. Already recorded; restated here so this table is complete. |

## The pass refuted a decision made the day before it ran

**ADR-0006 decision 2's endpoint table is wrong in one row, and this file is why it was caught.**

ADR-0006 lists `POST /v1/search` as carrying **no** documented truncation signal. That was inferred from silence — `/reference/intro#pagination` does not mention `request_status`, and the search reference was never opened. §4.5 above says otherwise, and two independent primary sources agree with §4.5:

- `https://developers.notion.com/reference/post-search` documents `request_status` on the search response, with `type: "complete" | "incomplete"` and `incomplete_reason: "query_result_limit_reached"`.
- SDK PR #711 adds the field to `SearchResponse`.

**Search has a truncation signal. ADR-0006 says it does not.**

Two things follow, and the second is the larger one.

1. The product's coverage story **improves**. A truncated search is detectable, so the ~11,200 wall is a *reportable* gap rather than a silent one.
2. **ADR-0006's central finding is unchanged and is now independently corroborated.** PR #711 threads `request_status` through seven response types and **`ListBlockChildrenResponse` is not among them.** Block-children enumeration — the traversal spine of the scan — carries no truncation signal, and that now rests on two sources rather than on documentation silence.

ADR-0006 is **not** edited. Correction tracked as an issue for a superseding ADR, per the standing rule that ADRs are never edited in place.

## Untested, and named rather than passed over

- **§1.1** — the ~10-minute search index lag. **(C)**, search-snippet only. No primary source located.
- **§2.1** — signed-URL `X-Amz-*` parameters. **(C)**. Low stakes; ADR-0004 defines determinism against a normalization function, which strips them regardless.
- **§3.4** — *"a 30-minute sync becomes 2–3 hours"* with retry overhead. **(C)**, aggregator, no method given.
- **§6.3** — the 403-vs-404 security rationale. **(C)**, search-snippet only, but it matches the documentation text and the 404 behaviour was confirmed live on 2026-08-17.
- **§7.2** — property ID survival across a **type** change. Still open. This is proof question 2 and it is ready to run: `TYPE_CHANGE_PROP=Status` is set in `.env`. It requires mutating the fixture, which is a deliberate act, not a side effect.
- **§4.3** — silent truncation at exactly 10,000 rows. Unobserved on both branches. ADR-0006 decision 4 keys a cap-proximity trip to that constant, so it is load-bearing and unconfirmed.
