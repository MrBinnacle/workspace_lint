# Data source endpoints — retrieve, query, and the capability they require

- **Fetched:** 2026-08-19. **Notion-Version in force in this repository:** `2026-03-11`.
- **Why this file exists:** `#51` was carried for four sessions as *"THE CEILING"* — ten of twenty
  resources permanently invisible — on the belief that Notion offered no route. Both endpoints below
  are documented and neither had been read.

## 1. `GET /v1/data_sources/{data_source_id}` — Retrieve a data source

`https://developers.notion.com/reference/retrieve-a-data-source`

Returns, in the vendor's words, *"information that describes the structure and columns of a data
source"* — **the schema. Not the rows.**

> "The response adheres to any limits to a connection's capabilities and the permissions of the data
> source and its containing database."

**⛔ What this page does NOT say, recorded because the silence has already been misread once:** it has
**no Capabilities section and no Permissions section.** It names the constraint without naming the
capability. **A negative read off this page would be unfounded.**

Errors listed: 400, 401, 403 (restricted resource, workspace credits exhausted, agent credit limits),
404 (`object_not_found`, `directory_not_found`), 406 (`row_limit_exceeded`), 429, 500, 503, 504, 529.

## 2. `POST /v1/data_sources/{data_source_id}/query` — Query a data source

`https://developers.notion.com/reference/query-a-data-source`

**This is the endpoint that returns the rows.** It is the one the traversal needs, and it is not the
one `#51`'s re-scope named.

> "This endpoint requires a connection to have read content capabilities."

> "Before a connection can query a data source, its parent database must be shared with the
> connection."

> "This endpoint supports paginating through up to 10,000 results per query."

⭐ **The capability requirement is stated on the endpoint's own page**, which is where the
capabilities page could not answer it. A read-only internal integration holds **Read content** and
nothing else, so **the requirement is met and the coverage gap is not a credential limit.**

⭐ **This is also the locator for the `10,000` cap.** `.claude/state/checkpoint.md` files that
constant under *"Numbers and facts that are unverified"* as *"vendor-documented and unobserved"*, and
`#125` records it as *not on the vendor page.* It is on **this** page — one this project does not
call — and it is stated **per query**, not per workspace and not per object.

⚠ It is a **POST**. It reads rather than writes, the same shape as `POST /v1/search`, but adding it to
the port is a `CLAUDE.md` §3 ASK FIRST decision and **has not been granted.**

⚠ The `~11,200` figure attributed to a third-party issue in ADR-0002 is untouched by this and still
has no vendor locator.

## 3. Database → data source traversal

`https://developers.notion.com/docs/upgrade-guide-2025-09-03`

> "The Retrieve Database API is now repurposed to return a list of `data_sources` (each with an `id`
> and `name`…"

> "The Retrieve *Data Source* API is the new home for getting up-to-date information on the
> properties (schema) of each data source under a database."

`GET /v1/databases/{id}` **is already authorized** (operator, 2026-08-18, on `#51`), so the traversal
from a database reference to its data source IDs needs no further grant.

**⛔ What this guide does NOT say:** it does not address whether existing read-only integrations
automatically gain access to data source endpoints. That question is answered by §2's page, not here.

## What this contradicts in standing documents

- `.claude/state/checkpoint.md` — *"The `10,000` cap constant is vendor-documented and unobserved"*
  under a heading for unverified facts. It now has a locator. Still unobserved.
- `#125` — *"Three result caps, none on the vendor page."* One of the three is on a vendor page.
- `#51`'s re-scope comment — names `GET /v1/data_sources/{id}` as the fix for the ten-of-twenty gap.
  That endpoint returns the schema; the gap is an **enumeration** gap and needs §2.
