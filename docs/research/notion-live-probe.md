# Notion API — Live Behaviour Probe

- **Date:** 2026-08-16
- **Role:** live-behaviour SME (direct API observation only; no documentation review, no community reports)
- **Workspace probed:** `05b89d1a-b21d-46d1-bc47-2fc2e551a039` ("Matthew Gruber's Notion")
- **User:** Matthew Gruber, `341ee2b5-3fbe-4c4d-83dd-9782434e064a`

## Mandatory caveat

Every observation in this document came through the **claude.ai Notion connector**. That connector is an **OAuth grant, not a custom integration token**. The 404 payload exposed the connector identity: `integration_id: 1f8d872b-594c-80a4-b2f4-00370af2b13f`.

Access-scope findings therefore may not transfer to a custom integration. Server-side behaviours — field drift, ID stability, ordering, URL rotation, error shape — do transfer, because they are properties of the backend rather than of the credential. Every finding below is labelled **TRANSFERS** or **CREDENTIAL-SPECIFIC**.

## Status of this document

This is research evidence. It is not a canonical product decision and does not amend `CONTEXT.md` or any ADR.

## Method and safety

Read-only tools only: `notion-fetch`, `notion-search`, `notion-query-data-sources`, `notion-get-users`, `notion-list-shared-pages`, `notion-list-recent-pages`. No create, update, move, duplicate, delete, or upload tool was called. Nothing in the workspace was modified.

---

## Probe 1 — Scale and repeat-search stability

**No count endpoint exists.** `search` caps at `page_size: 25` and returns no total count. A workspace object count could not be measured and is not estimated here.

### Observed counts

| Surface | Result |
|---|---|
| `notion-get-users` (page_size 50) | 11 users, `has_more: false` — 1 `person`, 10 `bot` |
| `notion-list-shared-pages` (limit 50) | `{"results":[]}` — empty |
| `notion-list-recent-pages` (limit 15) | 15 results, `nextCursor: "offset:15"` |
| `notion-search("project", page_size 25)` | 25 results — 23 `type: page`, 2 `type: database`, 0 `type: data_source` |

The 10 bots, verbatim: `Claude Code`, `FosseGithubActions`, `IFTTT`, `NoteShot`, `Notion Agent Computer Session`, `Notion MCP`, `Supabase_AI_Forecasting`, `SyncTasks`, `VSCode`, `Widget for NT`.

The empty shared-pages list is **CREDENTIAL-SPECIFIC**. It describes this OAuth grant's sidebar, not the workspace.

`search` never returned `type: "data_source"`. Data sources surfaced only as `collection://…` URLs nested inside `fetch` responses. **TRANSFERS:** a scanner cannot enumerate data sources from search results; it must fetch each database and read its `<data-sources>` block.

### Repeat test — search

`search("project", page_size: 25, max_highlight_length: 0, content_search_mode: "workspace_search")` run twice, identical arguments.

**Result: byte-identical.** All 25 results matched in `id`, `title`, `url`, `timestamp`, and position. Zero diff.

First three results, both runs:

```json
{"id":"9f805a25-18ba-413b-8820-e494f7c50f67","title":"skill-harness — Prior Project Record","url":"https://app.notion.com/p/9f805a2518ba413b8820e494f7c50f67?pvs=204","type":"page","highlight":"","timestamp":"2026-08-09T18:46:00.000Z"}
{"id":"e423439d-a45d-414d-8e22-69698607c6b9","title":"The 610th Project: Grandpa's War → A gift for my Mom","url":"https://app.notion.com/p/e423439da45d414d8e2269698607c6b9?pvs=204","type":"page","highlight":"","timestamp":"2026-07-17T18:19:00.000Z"}
{"id":"8b29ec2f-3075-4524-9ca7-fc31ada4532a","title":"Projects","url":"https://app.notion.com/p/8b29ec2f307545249ca7fc31ada4532a?pvs=204","type":"page","highlight":"","timestamp":"2025-12-18T23:45:00.000Z"}
```

### Repeat test — recents

`list-recent-pages(limit: 15)` run twice.

**Result: byte-identical.** 15 results, same order, same `nextCursor`.

### Findings

**TRANSFERS — the pagination cursor is a positional offset.** The value is literally `"offset:15"`, not an opaque snapshot token. Pagination is not isolated from concurrent mutation. A row inserted at the head between two page requests shifts every later page by one, silently duplicating or skipping objects. This threatens scan *completeness*, which is a separate failure from byte-instability.

**TRANSFERS — response shape differs by endpoint.** `search` returns an `id` field. `list-recent-pages` returns **no `id` field at all** — only `type`, `url`, `title`, and sometimes `icon`:

```json
{"type":"page","url":"https://app.notion.com/p/3561351d6af4814aa070f10513271a3f?pvs=204","title":"AZIMUTH","icon":"/icons/compass_gray.svg"}
```

A scanner consuming recents must parse the UUID out of the URL path.

---

## Probe 2 — Field drift (highest value)

### Test A — page with no file properties

`fetch("92f36511-3e3e-4f2b-8831-e8bd95c8694f")` ("New Project"), twice, back to back, identical arguments.

**Result: byte-identical. Zero differing fields.**

Both responses, in full:

```
Here is the result of "view" for the Page with URL https://app.notion.com/p/92f365113e3e4f2b8831e8bd95c8694f as of 2023-10-22T15:12:18.657Z:
<page url="https://app.notion.com/p/92f365113e3e4f2b8831e8bd95c8694f" icon="icons/bookmark_gray">
<ancestor-path>
<parent-data-source url="collection://932ae0bb-cfe9-4693-b67b-7db4cc8bc7d4" name="My Projects (old)"/>
<ancestor-2-database url="https://app.notion.com/p/daf5aba3b8e84d7288b6f7f41a4ec9e1" title=""/>
<ancestor-3-page url="https://app.notion.com/p/200cd50915254e40ad7e6ce359990b5c" title="[ARCHIVED] Headquarters (old)"/>
<ancestor-4-page url="https://app.notion.com/p/951cb5c81a47434da9f7920b26a535eb" title="Hans Archive"/>
<ancestor-5-page url="https://app.notion.com/p/ff09e6b69c7b429696ea387d7a40da5d" title="Hans Systems"/>
<ancestor-6-page url="https://app.notion.com/p/28a1351d6af4818da555de4585036900" title="Headquarters"/>
</ancestor-path>
<properties>
{"Contact Phone Number":"","Detailed Description":"","Is Completed":"__NO__","Name":"New Project","Short Description":"","Status":"Not started","Summary":"","Website":"","date:Created Date:is_datetime":0,"date:Deadline:is_datetime":0,"url":"https://app.notion.com/p/92f365113e3e4f2b8831e8bd95c8694f"}
</properties>
```

### Test B — page containing a file

`fetch("111e6ed2-83a6-46b2-9117-5bcc1c8354c9")` ("Reference Diagram — Copper tube exchanger", a row in the Inspection Photos data source carrying an `Image Link` file property), twice.

**Result: byte-identical. Zero differing fields.**

The file property value, identical in both responses:

```
"Image Link":"file://%7B%22source%22%3A%22attachment%3Af88e90f5-95d5-4da9-941a-c3506a49e168%3Aimage.png%22%2C%22permissionRecord%22%3A%7B%22table%22%3A%22block%22%2C%22id%22%3A%222521351d-6af4-80ac-8eb3-e7cbd879d6ec%22%2C%22spaceId%22%3A%2205b89d1a-b21d-46d1-bc47-2fc2e551a039%22%7D%7D"
```

URL-decoded:

```json
file://{"source":"attachment:f88e90f5-95d5-4da9-941a-c3506a49e168:image.png","permissionRecord":{"table":"block","id":"2521351d-6af4-80ac-8eb3-e7cbd879d6ec","spaceId":"05b89d1a-b21d-46d1-bc47-2fc2e551a039"}}
```

**This is not a signed S3 URL.** There is no host, no expiry parameter, no `X-Amz-Signature`, no nonce, no token of any kind. The connector returns a stable content-addressed descriptor and defers signing to a separate `download-attachment` call.

**CREDENTIAL-SPECIFIC / SURFACE-SPECIFIC — and this is the binding limit on the whole probe.** The suspected drift source was not exercisable on this surface. The public REST API serialises `file.url` as a time-limited signed S3 link carrying an embedded expiry. That is a different serialisation from what was observed here. **A clean result on this surface does not clear the REST API of file-URL rotation.** Probe 2 must be re-run against a custom integration token before any determinism claim covers file properties.

### Test C — the "as of" envelope timestamp

Every `fetch` response opens with a line of the form `… as of <ISO-8601>:`. This is a timestamp in the response envelope and is a drift candidate on its face.

Observed values:

| Page | `as of` header | `Last Edited Time` property | Delta |
|---|---|---|---|
| `1e4720e7-…` (grill-with-docs) | `2026-08-07T19:11:48.234Z` | `2026-08-07T19:11:48.234Z` | 0 |
| `92f36511-…` (New Project) | `2023-10-22T15:12:18.657Z` | not exposed | — |
| `111e6ed2-…` (Reference Diagram) | `2025-09-09T02:57:06.899Z` | not exposed | — |
| `029877af-…` (RLM Starter Kit) | `2026-05-23T14:31:12.850Z` | not exposed | — |
| `2d41c263-…` (workspace-lint) | `2026-08-16T20:53:20.334Z` | `2026-08-16T20:53:18.898Z` | **+1.436 s** |

**TRANSFERS — the header timestamp is not wall-clock.** It tracks last-edited time and was stable across repeated reads of unchanged pages (Tests A and B, byte-identical both times).

**Unresolved:** on `workspace-lint` the header ran 1.436 s ahead of the `Last Edited Time` property. The clock responsible for that gap was not determined. That page was not re-fetched, so the *stability* of the gap is unverified. The header is an envelope timestamp and should be stripped from any hash regardless of this open question.

---

## Probe 3 — Property IDs

Source: `fetch("collection://28a1351d-6af4-818c-af32-000b17cfc14e")` ("My Projects" data source). The same `<data-source-state>` block was returned identically when reached indirectly via `fetch("https://app.notion.com/p/28a1351d6af48132bae6ed3c5f319791")` (the parent database).

**Property IDs are visible through this interface — but only for some property types.**

| Name | Type | ID exposed as |
|---|---|---|
| Name | `title` | **none** |
| Project Description | `text` | **none** |
| Deadline | `date` | **none** |
| Last Edited Time | `last_edited_time` | **none** |
| Days Since Update | `formula` | `formulaCode://28a1351d-6af4-818c-af32-000b17cfc14e/d3BXTg` |
| Priority | `select` | `collectionPropertyOption://28a1351d-6af4-818c-af32-000b17cfc14e/WkdbYg/<optionId>` |
| Status | `select` | `collectionPropertyOption://28a1351d-6af4-818c-af32-000b17cfc14e/PFNYeA/<optionId>` |
| Tasks | `relation` | `collectionProperty://28a1351d-6af4-811a-b395-000b5764efc9/P0tMfA` |
| Skills | `relation` | `collectionProperty://522cfe8c-c891-4da9-9c26-f4697c11ceb0/P0RcSQ` |
| My Life Buckets | `relation` | `collectionProperty://28a1351d-6af4-817f-8032-000bd911ce0a/QmJ9Tg` |
| Claude Code Capabilities | `relation` | `collectionProperty://1dc41d02-3674-4e66-b5bf-cdce20212d97/X2NTcA` |
| Claude Code Sessions | `relation` | `collectionProperty://f6bcd31f-e117-45fd-8703-b83f9c69833f/Sz19TQ` |
| Quick Notes | `relation` | `collectionProperty://28a1351d-6af4-812c-891a-000b85bd9f0a/YFJ-bQ` |
| Related to Strategic Resources (Related Projects) | `relation` | `collectionProperty://5866b15d-a70d-4907-920a-658498b8f238/XT1TaQ` |

Raw entry for a scalar property, showing the absence:

```json
"Project Description":{"description":"","name":"Project Description","type":"text"}
```

Raw entry for a relation property:

```json
"Tasks":{"dataSourceUrl":"collection://28a1351d-6af4-811a-b395-000b5764efc9","description":"Tasks associated with this project","name":"Tasks","propertyUrl":"collectionProperty://28a1351d-6af4-811a-b395-000b5764efc9/P0tMfA","type":"relation"}
```

### Findings

**1. TRANSFERS — scalar properties carry no ID on this surface.** Title, text, date, and last_edited_time expose only `name`, `type`, and `description`. The PRD's finding contract specifies `location: Property ID, block ID, or graph edge`. For those property types there is **no ID here to anchor to**. That is the observation. Whether the REST API exposes one was not tested and is not asserted.

**2. TRANSFERS — a relation's `propertyUrl` embeds the *related* collection ID, not the owning one.** `Tasks` belongs to `collection://28a1351d-6af4-818c-af32-000b17cfc14e`, but its `propertyUrl` reads `collectionProperty://28a1351d-6af4-811a-b395-000b5764efc9/P0tMfA` — that UUID is the Tasks data source. Parsing the collection ID out of a `propertyUrl` and treating it as the owner produces a reversed graph edge.

**3. TRANSFERS — select-option IDs use two incompatible encodings inside one property.** From `Status`:

```json
{"color":"default","description":"Actively advancing.","name":"Ongoing","url":"collectionPropertyOption://28a1351d-6af4-818c-af32-000b17cfc14e/PFNYeA/ZWE0NjFjY2YtZGYzOC00ZDA3LTk1OWEtYWM3YmViZTEwNTcw"}
{"color":"orange","description":"Intentionally paused.","name":"On Hold","url":"collectionPropertyOption://28a1351d-6af4-818c-af32-000b17cfc14e/PFNYeA/TD1jRg"}
{"color":"green","description":"Outcome delivered.","name":"Completed","url":"collectionPropertyOption://28a1351d-6af4-818c-af32-000b17cfc14e/PFNYeA/MWIzZjE3MzMtMTAzMC00OGFjLTg0YzQtZWNlOWM4MTM5NDc4"}
{"color":"brown","description":"Retained reference; no active execution.","name":"Archived","url":"collectionPropertyOption://28a1351d-6af4-818c-af32-000b17cfc14e/PFNYeA/NGE4ZGVhMDUtMTA0MC00MmUxLWFmOTgtMWM3OTIwMDIyNzVj"}
```

`ZWE0NjFjY2YtZGYzOC00ZDA3LTk1OWEtYWM3YmViZTEwNTcw` is base64 of the UUID `ea461ccf-df38-4d07-959a-ac7bebe10570`. `TD1jRg` is a 6-character token. Two encodings coexist inside one property's option set. A fingerprint scheme that assumes a fixed option-ID width or charset breaks.

**4. TRANSFERS — some schema properties are excluded from SQL query.** The data source declares `"notAvailableInQuerySql":["Total Hours","% Complete","Task Count","Days Since Update"]`. Formula and rollup properties appear in the schema but cannot be selected in SQL mode. A rule reading a formula value must obtain it another way, or record the omission in the coverage manifest.

**5. TRANSFERS — formula values are returned as opaque handles, not values.** Fetching a page returned `"Days Since Update":"formulaResult://28a1351d-6af4-818c-af32-000b17cfc14e/2d41c263-1b59-45f1-96c5-688cde44cdf9/d3BXTg"` — a pointer of the form `formulaResult://<collection>/<page>/<propertyId>`, not the computed integer. The handle is stable and deterministic. The value it stands for is not retrievable from this response.

---

## Probe 4 — Search versus fetch

Four objects returned by `search` were then fetched directly.

| ID | Search title | Fetch title | Parent, per fetch |
|---|---|---|---|
| `2d41c263-1b59-45f1-96c5-688cde44cdf9` | workspace-lint | workspace-lint | `collection://28a1351d-6af4-818c-af32-000b17cfc14e` |
| `92f36511-3e3e-4f2b-8831-e8bd95c8694f` | New Project | New Project | `collection://932ae0bb-cfe9-4693-b67b-7db4cc8bc7d4` |
| `111e6ed2-83a6-46b2-9117-5bcc1c8354c9` | Reference Diagram — Copper tube exchanger | Reference Diagram — Copper tube exchanger | `collection://4c72b0ea-8173-49a1-a285-21cf353143cb` |
| `029877af-af73-49c7-ae5e-77c42bda17d4` | RLM Starter Kit — Local Notion Architecture | RLM Starter Kit — Local Notion Architecture | page `bd34f4739ee9478b931e299399b13073` ("Historical artifacts") |

**Zero discrepancies on existence, title, or parent.** All four resolved; all four titles matched exactly; every parent was consistent with the search result's context.

One shape discrepancy, **TRANSFERS**: `search` returns a flat `title` field. `fetch` returns the title inside `<properties>` under the database's own title-property name, which differs per database:

- `2d41c263-…` → `"Name":"workspace-lint"`
- `111e6ed2-…` → `"Title":"Reference Diagram — Copper tube exchanger"`
- `029877af-…` → `"title":"RLM Starter Kit — Local Notion Architecture"`

There is no fixed key for a page title across `fetch` responses. A normaliser must resolve the title property from the schema (`"type":"title"`), never by key name.

Second shape discrepancy, **TRANSFERS**: `fetch` also exposes a full `<ancestor-path>` chain that `search` does not. For `029877af-…` the chain ran page → page → data source → database → page, six levels deep, mixing object types. Parent reconstruction from search results alone is impossible.

---

## Probe 5 — Inaccessible objects and error shape

`fetch("00000000-0000-4000-8000-000000000000")` returned, verbatim:

```json
{"name":"APIResponseError","code":"object_not_found","status":404,"headers":{},
 "body":"{\"object\":\"error\",\"status\":404,\"code\":\"object_not_found\",\"message\":\"Could not find page with ID: 00000000-0000-4000-8000-000000000000. Check that you have access and that you're authenticated to the correct workspace.\",\"additional_data\":{\"integration_id\":\"1f8d872b-594c-80a4-b2f4-00370af2b13f\"},\"request_id\":\"d25500a8-72d5-47a9-9f39-25a905009d36\"}",
 "additional_data":{"integration_id":"1f8d872b-594c-80a4-b2f4-00370af2b13f"},
 "request_id":"d25500a8-72d5-47a9-9f39-25a905009d36",
 "message":"Could not find page with ID: 00000000-0000-4000-8000-000000000000. Check that you have access and that you're authenticated to the correct workspace."}
```

### Findings

**TRANSFERS — `request_id` is a fresh random UUID on every request.** It appears **twice** in one payload: once at top level, once inside the stringified `body`. Observed value: `d25500a8-72d5-47a9-9f39-25a905009d36`. Any scanner that captures an error object verbatim into a report, a coverage manifest, or a finding's `evidence` field emits a value that changes on every run. **This is the single confirmed determinism threat found in this probe.**

**TRANSFERS — the 404 message does not distinguish "absent" from "inaccessible."** The message text states both possibilities in one sentence: *"Could not find page with ID: … Check that you have access and that you're authenticated to the correct workspace."* The API does not identify which case applies. This directly confirms the `REF001` design in `CONTEXT.md`: a 404 must produce an `indeterminate` warning, never a `confirmed` broken link.

**TRANSFERS — the error leaks the integration identity.** `additional_data.integration_id` is present at two nesting levels. It is stable per credential, so it is not a drift threat, but it identifies the connection and must be treated as sensitive under the FR-14 redaction requirement.

**TRANSFERS — `headers` came back as an empty object `{}`.** No `Retry-After`, no rate-limit headers were visible on this surface. The NFR requiring the client to respect `Retry-After` could not be verified here.

### Gap in this probe

No page was found that links to an object returning 404. Every `mention-page` target sampled from the `workspace-lint` page resolved — for example `1e4720e7-acfb-4744-a98e-3d0f341d5f5a` resolved to the page "grill-with-docs". The 404 shape above was obtained from a deliberately nonexistent UUID, not from a real broken reference in workspace content. The *shape* finding stands; the *detectability of a real dangling reference* was not demonstrated.

---

## Probe 6 — Archived objects

**Archived objects are visible. The marking field is named exactly `is_archived`, with boolean value `true`.**

Three surfaces were tested against the same objects, and they do not agree.

### Surface 1 — `search` marks it

`search("Local RLM Build portable cognitive substrate")` returned five results. Two carried the marker:

```json
{"id":"69009f7f-a983-442a-9550-5f521228f837","title":"Local RLM Build: portable cognitive substrate, model-independent governance architecture","url":"https://app.notion.com/p/69009f7fa983442a95505f521228f837?pvs=204","type":"page","highlight":"","timestamp":"2026-04-09T02:54:00.000Z","is_archived":true}
{"id":"029877af-af73-49c7-ae5e-77c42bda17d4","title":"RLM Starter Kit — Local Notion Architecture","url":"https://app.notion.com/p/029877afaf7349c7ae5e77c42bda17d4?pvs=204","type":"page","highlight":"","timestamp":"2026-05-23T14:31:00.000Z","is_archived":true}
```

The other three results carried **no `is_archived` key at all**:

```json
{"id":"0cf42cf2-625d-485f-96a3-47f1f7cb0ad9","title":"NEXUS Build Workflow — Claude Code Handoff Package","url":"https://app.notion.com/p/0cf42cf2625d485f96a347f1f7cb0ad9?pvs=204","type":"page","highlight":"","timestamp":"2026-01-26T21:19:00.000Z"}
```

### Surface 2 — `fetch` marks it

`fetch("029877af-af73-49c7-ae5e-77c42bda17d4")` returned a top-level `"is_archived":true` after the `text` field. Fetches of `2d41c263-…`, `92f36511-…`, `111e6ed2-…`, and `1e4720e7-…` carried **no `is_archived` key**.

### Surface 3 — view-mode query does not mark it

`query-data-sources` in view mode against `https://app.notion.com/p/28a1351d6af48132bae6ed3c5f319791?v=28a1351d6af48127a53e000cbab35935` with `is_archived: true` returned exactly one row — `69009f7f-…`, "Local RLM Build…" — and that row contained **no `is_archived` field anywhere in its payload**. Archived state was carried only by the request selector, not by the response.

The row's own fields:

```json
"Last Edited Time":"2026-04-09T02:54:08.328Z","Name":"Local RLM Build: portable cognitive substrate, model-independent governance architecture","url":"https://app.notion.com/p/69009f7fa983442a95505f521228f837"
```

### Surface 4 — recents leaks archived content unmarked

`list-recent-pages(limit: 15)` returned "Local RLM Build…" at **position 2**, with no marker of any kind:

```json
{"type":"page","url":"https://app.notion.com/p/69009f7fa983442a95505f521228f837?pvs=204","title":"Local RLM Build: portable cognitive substrate, model-independent governance architecture"}
```

### Surface 5 — SQL mode silently excludes archived rows

`SELECT "Name","Status",createdTime FROM "collection://28a1351d-6af4-818c-af32-000b17cfc14e"` returned 37 rows with `has_more: false`. "Local RLM Build…" was **not among them**. SQL mode filters archived rows out and provides no way to include them — the tool documentation states SQL mode does not accept `is_archived`.

### Findings

**TRANSFERS — `is_archived` is omitted on non-archived objects, not serialised as `false`.** A normaliser that maps a missing key to `null` produces a three-valued field where the domain has two states. Worse, any JSON diff between a run that saw the key and one that did not registers a spurious change. **Normalise absent → `false` explicitly, before hashing.**

**TRANSFERS — the same object is marked on two surfaces and unmarked on three.** `search` and `fetch` mark it; view-mode query, recents, and SQL do not. A scanner that enumerates via one surface and hydrates via another can silently mix archived and live objects.

**TRANSFERS — SQL-mode enumeration undercounts.** 37 rows returned with `has_more: false`, which reads as a complete enumeration. It is not. At least one archived row exists in that data source and is invisible to SQL. `has_more: false` means "no more rows matching the implicit filter," not "no more rows." Under the `SYS001` contract this is exactly the class of omission that must appear in the coverage manifest.

**Note on a false signal:** the page title "[ARCHIVED] Headquarters (old)" (`200cd50915254e40ad7e6ce359990b5c`, seen in an ancestor path) is a naming convention, not an archival state. It carried no `is_archived` field. Title-prefix conventions and the API's archive state are independent; a rule must not conflate them.

---

## Probe 7 — Query result ordering (unrequested, observed)

`query-data-sources` SQL mode, identical query, run twice:

```sql
SELECT "Name", "Status", createdTime FROM "collection://28a1351d-6af4-818c-af32-000b17cfc14e"
```

**Result: 37 rows both times, identical content, identical order, zero diff.**

But the order corresponds to no returned column. First four rows, both runs:

```json
{"Name":"TurboTax for VA Claims","Status":"Ongoing","createdTime":"2026-08-04 23:05:37Z"}
{"Name":"Boundary enforcement system: track violations, enforce policies, target 85%+ compliance post-launch","Status":"Archived","createdTime":"2025-10-16 19:16:58Z"}
{"Name":"The Horror essay series: 15k words Agile satire, Q1 2026 publication, 5 vignettes complete","Status":"Archived","createdTime":"2025-12-01 04:31:22Z"}
{"Name":"Home Maintenance: recurring inspections and household upkeep","Status":"Ongoing","createdTime":"2025-12-19 21:24:57Z"}
```

Row 1 is `2026-08-04`, row 2 is `2025-10-16`, row 28 is `2023-05-13`. Not sorted by `createdTime`, not by `Name`, not by `Status`.

**TRANSFERS — result order is arbitrary and carries no declared key.** It was stable across two reads seconds apart. That is not evidence of stability across a cache boundary, a shard migration, or an intervening row edit. A scanner must impose its own total order before hashing. Do not rely on the server's order.

**Incidental observation:** `Status` here is a user-defined `select` property whose option set includes the literal value `"Archived"` — 10 of the 37 rows carry it. This is unrelated to the API's `is_archived` state. The Notion-level archived row (`69009f7f-…`) does not appear in this result set at all. Two different concepts share one word in this workspace.

---

## DETERMINISM THREATS OBSERVED

### Confirmed changing between two identical reads

**1. `request_id`** — a fresh random UUID on every error response, present twice per payload (top level and inside the stringified `body`). Observed: `"request_id":"d25500a8-72d5-47a9-9f39-25a905009d36"`. Must be stripped before any hash, report, or coverage-manifest write.

That is the only field confirmed to differ. Six paired identical reads (two page fetches ×2, one search ×2, one recents ×2, one SQL query ×2) produced **zero** other diffs.

### Structural threats that did not fire in this probe but will

**2. Signed file URLs — untested, and the largest open risk.** This connector returns a stable `file://` descriptor with no signature and no expiry. The REST API returns signed, expiring S3 links instead. The drift source the probe was designed to find could not be exercised on this surface. Re-run probe 2 against a custom integration token before treating file properties as deterministic.

**3. `nextCursor: "offset:15"`** — a positional offset, not a snapshot cursor. Concurrent mutation during pagination duplicates or skips rows. Breaks completeness rather than byte-stability.

**4. `is_archived` omitted rather than `false`** — key presence carries boolean meaning. Normalise absent → `false` explicitly.

**5. Query result ordering with no declared sort key** — stable across two adjacent reads, unproven beyond that. Impose an explicit `ORDER BY` and a canonical sort in the normaliser.

**6. The `as of` envelope timestamp** — tracked last-edited time exactly on `grill-with-docs`, but ran 1.436 s ahead of `Last Edited Time` on `workspace-lint`. Unexplained. Strip it regardless; it is a response-envelope timestamp.

**7. Title key varies by database** (`Name` / `Title` / `title`) — resolve via schema, never by key name.

**8. Select-option ID encoding is mixed within one property** (base64-UUID and 6-character token). Do not assume a format when building fingerprints.

**9. Relation `propertyUrl` names the related collection, not the owner** — deriving ownership from it reverses the edge.

**10. SQL-mode `has_more: false` does not mean complete** — archived rows are filtered out with no signal.

---

## Next actions

1. **Re-run probe 2 against a custom integration token.** Until that happens, the determinism claim does not cover file properties. This is the gating item.
2. **Add a response-scrubber to the normaliser before any hashing work begins.** Minimum strip list: `request_id`, `integration_id`, the `as of` envelope timestamp. Minimum coercion list: absent `is_archived` → `false`.
3. **Test a real dangling internal reference.** This probe used a synthetic UUID. Seed a fixture page that links to an object outside the connection's scope and confirm the same 404 shape appears.
4. **Test pagination under concurrent mutation.** The `offset:N` cursor is a completeness threat that a static workspace cannot reveal.
5. **Decide how `REQ001` and the finding contract anchor to scalar properties**, given that no property ID was exposed for title, text, date, or last_edited_time on this surface. Resolve after item 1, since the REST API may differ.
