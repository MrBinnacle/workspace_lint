---
title: Notion Public API — What the Vendor Documents
date: 2026-08-16
role: official-documentation SME
api_version_targeted: "2026-03-11"
status: Research evidence. Not a canonical product decision. Does not override CONTEXT.md or docs/adr/.
---

# Notion Public API — Official Documentation Findings

Scope: what Notion's own developer documentation states, with citations. Community sources, SDK source, and observed runtime behavior are out of scope for this document and are covered elsewhere.

Method: every claim below comes from a page fetched live on 2026-08-16. Verbatim quotes are marked with quotation marks or blockquotes. Where the documentation does not answer a question, this document says **DOCS SILENT** rather than supplying an inference.

**Correction to the research brief's premise.** The brief assumed the current API version was `2025-09-03`. It is not. The current version is **`2026-03-11`**. The `2025-09-03` version is two versions behind, and the field names the brief assumed (`archived`) were removed in `2026-03-11`.

---

## 1. API version

Sources:
- https://developers.notion.com/reference/versioning
- https://developers.notion.com/page/changelog
- https://developers.notion.com/docs/upgrade-guide-2025-09-03
- https://developers.notion.com/docs/upgrade-guide-2026-03-11

### Current version string

**`2026-03-11`.**

Versions are date-named. Verbatim: "Our API versions are named for the date the version is released." Format is `YYYY-MM-DD`.

The version is sent as a request header: `Notion-Version: 2026-03-11`.

### What changed in 2025-09-03 — databases vs. data sources

This version split one concept into two. A *database* became a container. A *data source* became a table inside that container. One database can now hold several data sources.

Verbatim from the upgrade guide:

- "Most API operations that used `database_id` now require a `data_source_id`."
- "Several database endpoints have moved or been restructured to support the new data model."
- "You can't use a database ID with the retrieve data source API, or vice-versa. The two types of IDs are not interchangeable."
- "Continue to use the Update Database API for attributes that apply to the database."
- "Switch over to the Update Data Source API to modify attributes that apply to a specific data source."

Division of responsibility:

| Level | Owns |
|---|---|
| Database | `parent`, `title`, `is_inline`, `icon`, `cover` |
| Data source | `properties` (the schema), content queries, data-source metadata |

Endpoint migrations:

- `GET /v1/databases/:database_id` now returns a list of child `data_sources`.
- `GET /v1/data_sources/:data_source_id` replaces database schema retrieval.
- `PATCH /v1/data_sources/:data_source_id/query` replaces the old database query endpoint.
- `POST /v1/data_sources` adds additional data sources to an existing database.

From the "Working with databases" guide (https://developers.notion.com/guides/data-apis/working-with-databases): "Previously, databases could only have one data source, so the concepts were combined in the API until 2025."

How to obtain a data source ID, verbatim: "To get the **data source ID**, either use the [Retrieve a database](/reference/retrieve-database) endpoint first and check the `data_sources` array, or use the overflow menu under 'Manage data sources' to copy it from the Notion app."

### What changed in 2026-03-11

Three breaking changes.

1. **`archived` renamed to `in_trash`.** Verbatim: "`archived` field has been renamed to `in_trash` across all API responses and request parameters." The upgrade guide states the deprecated `archived` field was fully removed in this version and no longer appears in responses.
2. **Append block children takes a `position` object.** Verbatim: the `position` object "supports three placement types: `after_block` — insert after a specific block (replaces the old `after` parameter), `start` — insert at the beginning of the parent, `end` — insert at the end of the parent."
3. **Block type rename.** Verbatim: "The `transcription` block type has been renamed to `meeting_notes`. Update any code that creates, reads, or filters by this block type."

The changelog characterizes the migration as "simple find-and-replace updates" for most integrations. The JS/TS SDK requires v5.12.0 or later with `notionVersion: "2026-03-11"` set in the client configuration.

### Which version to target today (2026-08)

**`2026-03-11`.** It is current, and both intervening breaking changes touch surfaces this project reads directly: object identity (database vs. data source IDs) and trash state (`archived` → `in_trash`). Building against `2025-09-03` would mean writing against a field name that no longer exists in the current version.

### Deprecation timeline

**None published.** Verbatim from the versioning page:

> "We don't currently have any plans to stop supporting older API versions. If this changes in the future, we'll communicate this with all affected users and provide a time window and migration guidance."

And: "However, we recommend upgrading to the latest version to take advantage of the latest features and improvements."

Note the historical counter-example: the April 2024 changelog introduced `in_trash` and stated `archived` was "a deprecated alias for `in_trash` and may be removed in a future API version." It was in fact removed in 2026-03-11. So "no plans to deprecate versions" coexists with real removal of fields inside new versions. Version pinning protects against the latter; nothing protects against the former if the policy changes.

---

## 2. Rate limits

Source: https://developers.notion.com/reference/request-limits

### Documented limits

Two tiers.

**Per connection.** Verbatim: "an average of three requests per second, with some bursts beyond the average allowed."

**Per workspace.** Verbatim: limits are "shared across all of the workspace's connections and scaled to the workspace's plan."

**DOCS SILENT on the exact burst allowance.** "Some bursts beyond the average allowed" is the entire specification. No token-bucket size, no burst window.

**DOCS SILENT on the numeric per-workspace limit and on the per-plan scaling table.** The same scan will therefore behave differently on different customers' workspaces, and the tool cannot predict how.

### 429 behavior

Exceeding a limit returns HTTP 429 with error code `rate_limited`. The response carries `additional_data.rate_limit_reason`, which distinguishes which limit was hit:

- `public_api_request_rate_limit` — the per-connection limit.
- `public_api_space_request_rate_limit` — the per-workspace limit.

This distinction is useful: it tells a scanner whether slowing itself down will help (per-connection) or whether another connection is consuming the shared budget (per-workspace).

### Retry-After

Documented for both 429 and 529. Verbatim: "Read `Retry-After` and pause new requests for at least that many seconds." The header value is "an integer number of seconds."

Also verbatim: "Connections should handle HTTP 429 and 529 responses and respect the `Retry-After` response header."

Additional guidance: implement exponential backoff with jitter and set a retry limit. The official SDK uses a maximum of 6 attempts.

### Headers reporting limit state — a documented gap

**The only response header documented anywhere on this page is `Retry-After`.**

**DOCS SILENT on `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, or any equivalent.**

Consequence: a client cannot read its remaining budget. It can only discover it has exceeded the limit after the fact, by being throttled. Proactive pacing must be open-loop — a self-imposed rate below 3 rps — rather than closed-loop against an observable budget.

### Size limits

**Payload maximum:** "1000 block elements and 500KB overall."

**Per-request property value limits:**

| Item | Limit |
|---|---|
| Rich text content | 2000 characters |
| Text links | 2000 characters |
| Equations | 1000 characters |
| URLs | 2000 characters |
| Emails | 200 characters |
| Phone numbers | 200 characters |
| Block arrays | 100 elements |
| Multi-select options | 100 |
| Relations | 100 related pages |
| People fields | 100 users |

The page notes these limits govern a single request, not the total capacity of a property. For a read-only tool the write-side limits are mostly irrelevant, with one exception: the relation and people caps mean a single read response may truncate those property values, which affects rules that count relations or assignees.

---

## 3. Pagination

Sources:
- https://developers.notion.com/reference/intro
- https://developers.notion.com/reference/pagination
- https://developers.notion.com/reference/query-a-data-source
- https://developers.notion.com/reference/get-block-children

### Cursor semantics

- `start_cursor`: "A `next_cursor` value returned in a previous response. **Treat this as an opaque value.**"
- `next_cursor`: "A string that can be used to retrieve the next page of results by passing the value as the `start_cursor` parameter."
- `has_more`: "Whether the response includes the end of the list. `false` if there are no more results."
- Response envelope: `object` (always `"list"`), `type`, `results`, `has_more`, `next_cursor`.

For GET requests pagination parameters go in the query string. For POST requests they go in the request body.

### page_size

Verbatim: "Default: `100`, Maximum: `100`."

Also verbatim, and operationally important: "The response may contain fewer than `page_size` of results."

**A short page is not an end-of-list signal.** Only `has_more: false` terminates a traversal. A scanner that stops when it receives fewer than `page_size` items will silently under-report.

The search optimizations page adds: "To speed up results, try reducing the `page_size`. The default `page_size` is 100."

**Per-endpoint maxima:** the endpoint reference pages (search, query a data source, retrieve block children) declare `page_size` only as `type: number` in their OpenAPI schemas, with no per-endpoint constraint. The global 100 maximum from the pagination reference is the only documented number. **DOCS SILENT on whether any endpoint permits a different maximum.**

### Total-result ceiling

**Query a data source caps traversal at 10,000 results per query.** This is a hard ceiling on total pagination depth, not a page size. A data source with more than 10,000 rows cannot be fully enumerated in a single query. Partitioning by filter is the only documented route past it, and partitioning requires a property suitable for partitioning.

**DOCS SILENT on whether an equivalent ceiling applies to search or to retrieve block children.**

### Ordering

**Explicitly not guaranteed.** Verbatim from Query a data source:

> "Notion doesn't guarantee any particular sort order when no sort parameters are provided."

**DOCS SILENT on the ordering of retrieve block children.** Block children have an inherent document order in the Notion UI, and the API is the mechanism by which that order is read, but the reference page makes no statement guaranteeing the response preserves it.

### Cursor stability under concurrent mutation

**DOCS SILENT.** No page states whether a cursor remains valid, skips items, or duplicates items when the underlying data changes between page fetches.

This silence is load-bearing rather than incidental, because the search limitations page volunteers the opposite fact for search specifically: "the index may change as your connection iterates through pages and databases." Notion knows mid-traversal mutation is a real condition. It documents the consequence for search and says nothing for the other paginated endpoints.

---

## 4. Search endpoint

Sources:
- https://developers.notion.com/reference/post-search
- https://developers.notion.com/reference/search-optimizations-and-limitations

### What it returns

Verbatim: "Searches all parent or child pages and data_sources that have been shared with a connection."

Verbatim: "Returns all pages or data_sources, excluding duplicated linked databases, that have titles that include the `query` param."

Verbatim, and the single most important sentence for this project's discovery design: "If no `query` param is provided, then the response contains all pages or data_sources that have been shared with the connection."

### What it explicitly excludes

"duplicated linked databases."

### Parameters

**Filters:**
- `filter.property: "object"` with value `"page"` or `"data_source"`.
- `filter.in_trash: true` to list trashed content.
- Filters may be combined or used independently.

**Sorts:**
- `timestamp: "last_edited_time"` with `direction: "ascending" | "descending"`.
- `property: "relevance"`.

**Response fields:** `next_cursor`, `has_more`, `results`, and `request_status`.

`request_status` has `type` = `complete` | `incomplete`, with optional `incomplete_reason` = `query_result_limit_reached`. This field is a truthfulness surface the tool should read and propagate: it is Notion telling the caller that the result set it just returned is knowingly partial.

Verbatim caveat on the results: "The results adhere to any limitations related to a connection's capabilities."

Verbatim redirect: "To search a specific data_source — not all sources shared with the connection — use the Query a data_source endpoint instead."

### Documented consistency and latency guarantees

The optimizations-and-limitations page is short enough to reproduce in full. Verbatim:

> ## Optimizations
>
> Search works best when the request is as specific as possible. We recommend filtering by object (such as `page` or `database`) and providing a text `query` to narrow down results.
>
> To speed up results, try reducing the `page_size`. The default `page_size` is 100.
>
> Our implementation of the search endpoint includes an optimization where any pages or databases that are directly shared with a connection are guaranteed to be returned. If your use case requires pages or databases to immediately be available in search without an indexing delay, we recommend that you share relevant pages/databases with your connection directly.
>
> ## Limitations
>
> The search endpoint works best when it's being used to query for pages and databases by name. It is not optimized for the following use cases:
>
> * **Exhaustively enumerating through all the documents that a bot has access to in a workspace.** Search is not guaranteed to return everything, and the index may change as your connection iterates through pages and databases.
> * **Searching or filtering within a particular database.** This use case is much better served by finding the database ID and using the [Query a data source](/reference/query-a-data-source) endpoint.
> * **Immediate and complete results.** Search indexing is not immediate. If a connection performs a search quickly after a page is shared with the connection (such as immediately after a user performs OAuth), then the response may not contain the page.
>   * When a connection needs to present a user interface that depends on search results, we recommend including a *Refresh* button to retry the search. This will allow users to determine if the expected result is present or not, and give them a way to try again.
> * **Listing content in the trash.** Trash results are search-index-backed and eventually consistent. Results include only content the connection can access.

### Can search enumerate ALL objects shared with an integration?

**No. It is documented as best-effort, in the vendor's own words, for exactly this use case.**

Two documented statements sit in tension and must be read together:

1. `POST /v1/search` with no `query` "contains all pages or data_sources that have been shared with the connection." (post-search reference)
2. "Search is not guaranteed to return everything, and the index may change as your connection iterates through pages and databases." (limitations page)

The limitations page is the more specific and more recent statement, and it names exhaustive enumeration as a use case search "is not optimized for." Statement 1 describes the intent of the no-query form; statement 2 describes its reliability. Where they conflict, the explicit non-guarantee governs.

**One partial guarantee survives:** objects *directly* shared with the connection "are guaranteed to be returned." Objects reachable only by inheritance from a shared ancestor carry no such guarantee.

---

## 5. Enumerating the grant — THE GATING QUESTION

**Finding: there is no endpoint, and no field, by which an integration can enumerate the set of objects it has been granted access to. This is established by documentation, not by inference.**

### Every candidate, checked

| Candidate | URL | Result |
|---|---|---|
| `POST /v1/search` | https://developers.notion.com/reference/post-search | Returns shared objects. But the vendor states search "is not guaranteed to return everything." Only *directly shared* objects are guaranteed; inherited access is not. Best-effort, not a boundary. |
| `GET /v1/users/me` | https://developers.notion.com/reference/get-self | Returns the bot user only: `id`, `object`, `name`, `avatar_url`, `type`, and for bots a `bot` object with `owner`, `workspace_id`, `workspace_limits`, `workspace_name`. **No access list. No capability list.** |
| `GET /v1/users` | https://developers.notion.com/reference/get-users | Workspace members only, not objects. "Guests are not included in the response." Requires user-information capability or returns 403. |
| `POST /v1/oauth/introspect` | https://developers.notion.com/reference/introspect-token | Returns `active`, `scope`, `iat`, `request_id`. Scope only. Does not enumerate which objects the token can access. |
| Workspace / teamspace endpoint | https://developers.notion.com/llms.txt | **Does not exist in the public API.** |

### The endpoint inventory

I pulled the complete documentation index at https://developers.notion.com/llms.txt, which lists every reference page. The public API surface is:

- **Auth/token:** create a token, introspect a token, revoke a token, refresh a token.
- **Users:** list all users, retrieve a user, retrieve your token's bot user, list custom emojis.
- **Pages:** create, retrieve, retrieve property item, move, update, trash, retrieve as markdown, update content as markdown.
- **Blocks:** append children, retrieve, retrieve children, update, delete.
- **Databases/data sources:** create database, update database, retrieve database, create data source, retrieve data source, list data source templates, update data source, update data source properties, query a data source, filter/sort data source entries, plus legacy database query/filter/sort pages.
- **Comments:** create, update, delete, retrieve, list.
- **Views:** create, retrieve, update, delete, list, create view query, get view query results, delete view query.
- **Files:** create/send/complete/retrieve/list file uploads.
- **Search:** search by title, search optimizations and limitations.
- **Meeting notes:** create, query.
- **Async tasks:** retrieve an async task.
- **Webhook events.**

**There is no teamspace endpoint. There is no permissions endpoint. There is no "list objects granted to this integration" endpoint.**

Teamspace, permission, and workspace-level control exists only in the **Admin API** — a separate enterprise surface covering legal holds, personal access token management, MCP client connections, agent policy and credit limits, user session revocation, and workspace export. None of these enumerate an ordinary integration's object grant, and the Admin API is not available to a normal integration token.

### The documented access model

From https://developers.notion.com/docs/authorization, verbatim:

> "Before a connection can interact with your Notion workspace page(s), the page must be manually shared with the connection."

And the mechanism, verbatim: "visit the page in your Notion workspace, click the ••• menu at the top right of a page, scroll down to `Add connections`, and use the search bar to find and select the connection from the dropdown list."

The documentation describes *granting* access in detail. It describes no mechanism for *discovering* what has been granted. Discovery is by traversal from known roots, or by the best-effort search index. Nothing else exists.

### Consequence for workspace_lint

A coverage manifest cannot be proven complete against the grant, because the grant is not observable. The tool cannot know what it was not shown.

What the tool *can* prove is narrower and still useful: what it reached, from which roots, by which traversal, and where traversal terminated (404, 403, pagination ceiling, rate limit). That is a **reachability manifest**, not a coverage manifest.

The product must state this distinction to the user in plain words, in the output itself. A manifest that implies completeness it cannot establish is a correctness defect, not a wording preference.

---

## 6. ID stability — THE SECOND GATING QUESTION

Sources:
- https://developers.notion.com/reference/property-object
- https://developers.notion.com/reference/page
- https://developers.notion.com/reference/block
- https://developers.notion.com/reference/data-source
- https://developers.notion.com/reference/update-property-schema-object
- https://developers.notion.com/guides/data-apis/working-with-databases

**Finding: Notion documents essentially no ID stability guarantee. One exception exists, and it is not the one this project needs.**

### What the docs do state

- Page `id`: "Unique identifier of the page." Type `string`, UUIDv4. That is the whole description.
- Block `id`: "Identifier for the block," UUIDv4.
- Data source `id`: "Unique identifier for the data source," UUID.
- Property `id`: "An identifier for the property, usually a short string of random letters and symbols. Some automatically generated property types have special human-readable IDs (e.g. all Title properties have an `id` of `"title"`)."
- **Database ID formatting, verbatim:** "Note that when you receive the database ID from the API, e.g. the [search](/reference/post-search) endpoint, it will contain hyphens in the UUIDv4 format. You may use either the hyphenated or un-hyphenated ID when calling the API."

That last point is a direct byte-stability hazard. The same logical ID has two valid string forms. Any ID that enters the tool from a user-supplied config, a URL, or a differently-formatted response must be normalized on ingest, or identical workspaces will produce non-identical output.

### The one explicit stability guarantee in the reference

Select and multi-select **option** IDs. Verbatim:

> "An identifier for the option. Does not change if the name is changed."

This is the only sentence in the API reference that promises an identifier survives a mutation. It concerns option identifiers inside a select property — not the property `id`, and not any object ID.

### What is DOCS SILENT

Each of the following was checked individually against the relevant reference page. None is documented.

- **Page ID** across move, rename, archive, restore, duplicate.
- **Block ID** across any operation, including move between parents.
- **Database ID** across any operation.
- **Data source ID** across any operation, and the relationship between a pre-2025-09-03 `database_id` and the data source IDs that replaced it in operations. The upgrade guide says the two ID types "are not interchangeable" but never says either is stable, and never documents whether a single-source database's data source ID is derived from, equal to, or independent of its database ID.
- **User ID** stability.
- **Property ID across TYPE change.** The Update database properties reference explains how to change a property's type. It says nothing about the resulting ID. There is no statement anywhere in the documentation on this.

### Property ID across RENAME — implied only

There is no direct statement. The nearest text is in the formula property documentation, which explains that formulas reference properties by ID so that "renaming the property later doesn't break the formula."

That implies the property ID survives a rename. But it is an implication drawn from a sentence about formula durability, not a guarantee about the `id` field. It is evidence, not documentation.

### Answers to the two specific sub-questions

**Does renaming a property preserve its ID?** Implied yes, indirectly, via the formula documentation. Not stated. Weak.

**Does changing a property's TYPE preserve its ID?** **DOCS SILENT.** No statement exists.

### Consequence for workspace_lint

Any rule that identifies a finding across runs by object ID, or that identifies a schema column by property ID, is built on undocumented behavior. That does not make it wrong — it makes it unverified. It must be established empirically before the identity model is fixed, and the empirical result must be recorded as an assumption with a re-test, because an undocumented behavior can change without a version bump.

---

## 7. Archived / trashed — including a documentation contradiction

Sources:
- https://developers.notion.com/reference/page (version-agnostic)
- https://developers.notion.com/reference/retrieve-a-page.md (2026-03-11 schema)
- https://developers.notion.com/reference/query-a-data-source.md (2026-03-11 schema)
- https://developers.notion.com/docs/upgrade-guide-2026-03-11
- https://developers.notion.com/reference/block
- https://developers.notion.com/reference/search-optimizations-and-limitations

### The contradiction

**The documentation contradicts itself, and I could not resolve it from the documentation alone.**

**Position A — the versioned 2026-03-11 schemas show two distinct fields.**

`GET /v1/pages/:id` response field list at version 2026-03-11: `object`, `id`, `created_time`, `last_edited_time`, **`in_trash`**, **`is_archived`**, `is_locked`, `url`, `public_url`, `parent`, `properties`, `icon`, `cover`, `created_by`, `last_edited_by`.

With distinct descriptions:
- `in_trash`: "Whether the page is in trash."
- `is_archived`: "Whether the page has been archived."

Corroborating evidence: Query a data source accepts an **`is_archived`** body parameter — "Whether to return archived pages. When omitted or false, returns non-archived pages. When true, returns archived pages" — while the same page states that "`in_trash` is not a supported query body parameter for this endpoint." Two separate axes, only one of them filterable at query time. A schema would not carry both a parameter and a disjoint response field for the same concept.

Further corroborating: the 2026-03-11 upgrade guide says `archived` was renamed to `in_trash` and removed.

**Position B — the version-agnostic page object reference still says they are the same thing.**

https://developers.notion.com/reference/page states:
- `in_trash`: "Whether the page has been trashed. Use this field to check trash status and as a body parameter in Update page to trash or restore a page."
- `archived`: "**Deprecated.** Use `in_trash` instead. This is an alias for `in_trash` and always returns the same value."

This page has no `is_archived` and no `is_locked`.

**Assessment:** `/reference/page` appears stale relative to 2026-03-11. The upgrade guide and the versioned endpoint schemas agree with each other and disagree with it. The most probable reading is that `archived` (the old alias) was removed, and `is_archived` (a genuinely separate state, distinct from trash) exists at 2026-03-11.

I am recording the conflict rather than picking a winner. **Verify empirically against a live 2026-03-11 response.**

### Retrieval and query behavior

- **Retrieve a page / retrieve a block:** returns the object with trash and archive state populated. No documented filtering — trashed objects appear to be retrievable by ID. The reference contains no note restricting retrieval of trashed or archived objects.
- **Search:** `filter.in_trash: true` lists trashed content. But verbatim: "Trash results are search-index-backed and eventually consistent. Results include only content the connection can access." Trash listing is the least reliable read path in the API.
- **Query a data source:** archived pages are returned only when `is_archived: true` is passed; omitted or `false` returns non-archived pages. Trash state is **not queryable at all** on this endpoint.

### Permanently deleted objects

**DOCS SILENT.** The documentation draws no distinction between trashed and permanently deleted. There is no documented field, error, or endpoint that identifies an object as hard-deleted rather than merely absent.

---

## 8. 404 semantics

Sources:
- https://developers.notion.com/reference/status-codes
- https://developers.notion.com/reference/errors

### The finding

**Not distinguishable.** Verbatim, error code `object_not_found`, HTTP 404:

> "Given the bearer token used, the resource does not exist. This error can also indicate that the resource has not been shared with owner of the bearer token."

One code. One status. One message shape. Covering two materially different conditions: *this object does not exist* and *this object exists and you cannot see it*.

The page notes the message "may include a connection name to provide additional context." That is a hint for a human reading a message string, not a machine-readable discriminator.

### The adjacent codes

| HTTP | Code | Verbatim description |
|---|---|---|
| 401 | `unauthorized` | "The bearer token is not valid." Example message: "API token is invalid." |
| 403 | `restricted_resource` | "Given the bearer token used, the client doesn't have permission to perform this operation." Example message: "API token does not have access to this resource." |
| 404 | `object_not_found` | "Given the bearer token used, the resource does not exist. This error can also indicate that the resource has not been shared with owner of the bearer token." |
| 400 | `validation_error` | "The request body does not match the schema for the expected parameters. Check the message property for more details." |
| 409 | `conflict_error` | — |
| 429 | `rate_limited` | "This request exceeds the number of requests allowed. Slow down and try again." |
| 500 / 503 / 504 / 529 | service errors | — |

`restricted_resource` (403) is a genuinely different condition: capability-level denial — the token holds insufficient *capability* for the operation. It is not object-level invisibility.

**DOCS SILENT on distinguishing a hard-deleted object from one that never existed from one that is simply not shared.**

### Error object schema

The error body carries `code` and `message`. The status-codes page is the canonical list. **The `errors` reference page does not show a complete error object schema and does not document `request_id` on the error body**, though `request_id` does appear on other responses (see §10).

### Consequence for workspace_lint

The manifest cannot classify a 404 as "denied" versus "absent." It must record it as **unresolvable**, with the attempted ID and the endpoint. Any rule whose output depends on distinguishing those two states cannot be implemented correctly against this API.

---

## 9. Capabilities

Sources:
- https://developers.notion.com/reference/capabilities
- https://developers.notion.com/reference/introspect-token
- https://developers.notion.com/reference/get-self
- https://developers.notion.com/reference/get-users

### The capability model

Three groups.

**Content capabilities:** "Read content," "Update content," "Insert content" — governing interaction with databases, pages, and blocks.

**Comment capabilities:** "Read comments," "Insert comments."

**User capabilities:** three tiers — no user information, user information without email, user information with email addresses.

A governing constraint, verbatim: **"A connection's capabilities will never supersede a user's."** Effective access is the intersection of the connection's capabilities and the underlying user's permissions.

Design guidance, verbatim: request the "minimum capabilities that your connection needs in order to function," because lower capability requests improve the likelihood of installation approval by workspace administrators.

### Can an integration be provisioned read-only?

**Yes.** Request "Read content" and omit "Update content" and "Insert content." The capability model supports exactly this configuration, and the documentation actively encourages minimal capability requests.

### Can a client verify at runtime that its own token holds no write capability?

**Partially, and only for OAuth tokens. This is weaker than the project needs.**

- `GET /v1/users/me` does **not** return capabilities. Its own note is explicit: "This endpoint is accessible from by connections with any level of capabilities." It confirms the token works. It tells you nothing about what the token may do. The bot object carries `owner`, `workspace_id`, `workspace_limits`, `workspace_name` — no capability field.
- `POST /v1/oauth/introspect` returns `active` (boolean, required — whether the token is valid), `scope` (string — the authorized permissions), `iat` (integer — issuance timestamp), and `request_id` (UUID). **This is the only runtime capability surface in the public API.**
  - **DOCS SILENT on the `scope` value vocabulary and format.** The reference documents `scope` as "a string" and provides no enumeration and no example. A parser cannot be written against the documentation; the values must be observed empirically.
  - It applies to OAuth tokens. Internal integration tokens and personal access tokens are a different provisioning path.
- `GET /v1/users` returns 403 without user-information capability — verbatim: "This endpoint requires a connection to have user information capabilities. Attempting to call this API without user information capabilities will return an HTTP response with a 403 status code." That is a usable negative probe, but for the wrong capability. There is no equivalent documented probe for write capability that does not require attempting a write.

**DOCS SILENT on the error returned when a write capability is missing.** The capabilities page describes configuration and does not document the failure mode. By analogy with `GET /v1/users` it is presumably 403 `restricted_resource`, but that is inference.

### Recommendation

Do not make token introspection the safety mechanism for the never-writes guarantee. It is OAuth-only and its value format is undocumented.

Enforce read-only **in the client**: no code path may construct a request with a method other than GET, or to a mutating endpoint, at all. This is a structural guarantee the tool controls, verifiable by test and by review. Treat introspection as a secondary advisory check, once its scope strings have been empirically catalogued.

---

## 10. Volatile fields

Sources:
- https://developers.notion.com/reference/file-object
- https://developers.notion.com/reference/introspect-token
- https://developers.notion.com/reference/page
- https://developers.notion.com/reference/status-codes

### Documented as volatile — must be excluded from any stability hash

**File URLs. One hour expiry. Different on every read.**

Verbatim: "Each time you fetch a Notion-hosted file, it includes a temporary public url valid for 1 hour."

The file object carries `expiry_time` — "The date and time when the link expires."

And the explicit instruction, verbatim: **"Don't cache or statically reference these URLs. To refresh access, re-fetch the file object."** Also: "If the link expires, send an API request to get an updated URL."

These URLs carry a fresh signature on every fetch. Two identical scans one minute apart will produce different bytes wherever a file URL appears. They must be excluded from hashed output, or normalized to a stable surrogate (for example, the file's non-signature path component plus a marker).

**`request_id`.** A per-request UUID. Documented on the token introspection response, and referenced in the error-handling context. Per-request by construction. Never stable. Exclude.

### Not documented as volatile, but must be treated as suspect

**`last_edited_time`.** Described only as "Date and time when this page was updated. Formatted as an ISO 8601 date time string."

**DOCS SILENT on whether non-user-visible system activity bumps this field** — schema migrations, backfills, formula recomputation, rollup refresh, or Notion-side maintenance. This matters because a rule that reports "N pages edited in the last 30 days" produces a different answer on every run if the field moves for reasons unrelated to human editing.

Treat as an input to findings. Do not include in a stability hash until measured.

### Documented, apparently stable, with one caveat

- **`url`** — "The URL of the Notion page." No documented statement that it changes. Caveat: Notion page URLs embed a title slug, so a rename plausibly changes the URL string while the page identity is unchanged. **DOCS SILENT on this.** Verify.
- **`public_url`** — "The public page URL if the page has been published to the web. Otherwise, `null`." Changes when publish state changes. That is a real state transition, not noise, and a rule may legitimately want to detect it.
- **`created_time`**, **`created_by`** — no documented volatility. Expected stable.

---

## PROJECT-STOPPING FINDINGS

Four documented limitations. The first two bear directly on the 72-hour go/no-go.

### 1. A complete coverage manifest is not achievable. This is the vendor's position, not an inference.

There is no endpoint that enumerates an integration's grant (§5). The only near-candidate — `POST /v1/search` with no query — is documented as unfit for precisely this purpose, in the vendor's own words:

> "**Exhaustively enumerating through all the documents that a bot has access to in a workspace.** Search is not guaranteed to return everything, and the index may change as your connection iterates through pages and databases."

The tool cannot prove what it could not see, because it cannot learn what exists to be seen. The complete endpoint inventory at https://developers.notion.com/llms.txt confirms no alternative surface exists in the public API; teamspace and permission endpoints exist only in the separate enterprise Admin API.

**What this forces:** the manifest must be reframed from "coverage" to "reachability from declared roots," and the product must say so in its own output. If the product's value proposition depends on provable completeness against the grant, that proposition does not survive contact with this API and must be revised before build.

### 2. Byte-stable output is achievable, but only with an explicit exclusion set — and two of its inputs are undocumented.

Known-volatile and excludable now: file URLs (fresh signature per read, 1h expiry, "Don't cache or statically reference these URLs"), `request_id`.

Structurally hostile and fixable in the client: no guaranteed sort order — "Notion doesn't guarantee any particular sort order when no sort parameters are provided" — so every traversal must impose a deterministic client-side sort on a stable key before emitting. Also, the hyphenated/un-hyphenated ID equivalence requires normalization on ingest.

Unresolved and requiring measurement: `last_edited_time` volatility under system-side edits is **DOCS SILENT**, and cursor stability under concurrent mutation is **DOCS SILENT** while search openly admits its index "may change as your connection iterates."

**Determinism is reachable with discipline. It is not reachable by assumption.** The exclusion set must be derived empirically.

### 3. Object identity has no documented guarantee.

Notion documents exactly one identifier-stability guarantee in its entire reference — select/multi-select option IDs across rename. Page, block, database, data source, user, and property IDs across move / rename / archive / restore / duplicate / type-change are all **DOCS SILENT**. Property ID across rename is implied only, via a sentence about formula durability.

Any rule that identifies a finding by ID across runs rests on undocumented behavior.

### 4. A 404 is not diagnostic.

`object_not_found` covers "does not exist" and "has not been shared with owner of the bearer token" with one code and one message shape. The manifest cannot report "denied" versus "absent." It can only report "unresolvable."

### Secondary, real, not project-stopping

- **No rate-limit-state headers exist** — only `Retry-After`, after the fact. A scanner cannot pace itself against an observable budget; pacing must be open-loop.
- **The per-workspace limit is scaled to plan by an undocumented factor.** The same scan will behave differently on different customers' workspaces, and the tool cannot predict how.
- **Query a data source is capped at 10,000 results.** Data sources larger than that cannot be enumerated in one query, and partitioning requires a suitable property.
- **The `archived` / `is_archived` / `in_trash` documentation is self-contradictory** (§7). The field the tool reads to determine trash state is currently ambiguous in the docs.

---

## Complete list of DOCS SILENT findings

Consolidated for tracking. Each is a question the documentation does not answer.

| # | Question | Section |
|---|---|---|
| 1 | Exact burst allowance above the 3 rps average | §2 |
| 2 | Numeric per-workspace rate limit and its per-plan scaling | §2 |
| 3 | Any response header reporting current rate-limit state (`X-RateLimit-*`) | §2 |
| 4 | Whether any endpoint permits a `page_size` maximum other than 100 | §3 |
| 5 | Whether a total-result ceiling like the 10,000 query cap applies to search or block children | §3 |
| 6 | Ordering guarantee for retrieve block children | §3 |
| 7 | Cursor stability when underlying data changes mid-traversal | §3 |
| 8 | Page ID stability across move, rename, archive, restore, duplicate | §6 |
| 9 | Block ID stability across any operation | §6 |
| 10 | Database ID stability across any operation | §6 |
| 11 | Data source ID stability, and its derivation from a legacy database ID | §6 |
| 12 | User ID stability | §6 |
| 13 | Property ID across rename (implied only, never stated) | §6 |
| 14 | **Property ID across TYPE change — no statement of any kind** | §6 |
| 15 | Distinction between trashed and permanently deleted objects | §7 |
| 16 | Whether a hard-deleted object is distinguishable from a never-existed object | §8 |
| 17 | Complete error object schema, including whether `request_id` appears on errors | §8 |
| 18 | The `scope` value vocabulary and format returned by token introspection | §9 |
| 19 | The error returned when a write capability is missing | §9 |
| 20 | Whether system-side activity bumps `last_edited_time` | §10 |
| 21 | Whether a page rename changes `url` | §10 |

Twenty-one silences. Items 14, 7, and 20 are the ones that gate design decisions.

---

## NEXT ACTION — what the 72-hour proof must measure

The documentation answered eight of ten questions. The two that gate product decisions — Q5 and Q6 — are the two it answers worst. Measure these, in this order, pinned to `Notion-Version: 2026-03-11`.

1. **Enumeration delta.** Run `POST /v1/search` with no query, to exhaustion, against a workspace with a known object count that deliberately includes deeply nested pages and pages accessible only by inheritance rather than direct share. Compare against full traversal from roots. **Quantify what search misses.** This number decides whether the product is viable as currently specified.
2. **Property ID under type change** (silence #14). Create a property, record its `id`, change its type via Update data source properties, re-read the schema. One call answers a question the documentation never addresses.
3. **Page ID under duplicate and move** (silences #8). Same method.
4. **Repeat-run diff.** Two identical full scans, ten minutes apart, no workspace edits between them. Diff the raw responses field by field. This produces the volatile-field exclusion set empirically instead of by guess, and settles the `last_edited_time` question (silence #20).
5. **Resolve the `archived` / `is_archived` / `in_trash` contradiction** (§7) against a live 2026-03-11 response. The documentation disagrees with itself; only the API is authoritative.
6. **Cursor behavior under mutation** (silence #7), if time permits. Begin a paginated traversal, mutate the underlying set between pages, observe whether items are skipped or duplicated.

Steps 1 and 2 are the minimum viable proof. If step 1 shows a material enumeration gap, the product definition needs revision before any further build.
