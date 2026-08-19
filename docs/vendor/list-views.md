# `GET /v1/views` — List views

- **Fetched:** 2026-08-19. `https://developers.notion.com/reference/list-views`
- **Why this file exists:** the endpoint surfaced while reading `llms.txt` for enumeration routes
  (`access-enumeration.md`). It is a `List all …` endpoint on the surface where this project's
  coverage gap lives, so it was assessed rather than left as a name in a table.

## What it is

**`GET /v1/views`**

> "Returns a paginated list of View references for the specified database."

> "This endpoint requires a connection to have read content capabilities."

Pagination is the ordinary shape: *"If supplied, this endpoint will return a page of results starting
after the cursor provided"*, with `next_cursor` (nullable) and a `has_more` boolean.

## ⛔ Verdict: it does NOT close the ten-of-twenty gap, and it is not an enumeration route

**The response carries view metadata only** — an array of view-reference objects with `object` and
`id`, plus pagination. **It returns no rows and no pages.**

- **Against `#51` / the traversal gap:** the gap at `slice/scan.ts:455` is that the scan will not
  descend into a `child_database`. Descending needs the **rows**, which is
  `POST /v1/data_sources/{id}/query` (`data-source-endpoints.md` §2). Listing a database's *views*
  moves nothing.
- **Against `#123` / grant enumeration:** it is scoped to *"the specified database"*, so it
  enumerates within an object already reachable. It tells the caller nothing about what the
  connection can reach.

**The capability requirement is met** — read-only is Read content — so if a use for it appears, no
grant is needed. There is no such use today.

## ⚠ What this page does NOT say

It states the read-content requirement and **nothing else about permissions** — no workspace-level
capability, no role-based restriction, no sharing precondition. Notably it does **not** repeat the
query endpoint's precondition that *"the parent database must be shared with the connection"*.

⛔ **That silence is not evidence that no such precondition exists.** Recorded because this
repository has twice read a page's silence as a negative, and the sharing precondition is documented
on a sibling endpoint's page.

## One thing worth carrying

`has_more` on this endpoint is the **same unattested shape** as `GET /v1/blocks/{id}/children` —
ADR-0013's whole point is that `has_more: false` reads identically whether a listing was complete or
permission-filtered. **If this endpoint is ever called, it enters `notion-port.ts`'s attestation table
as `unattested` by default**, which is the direction ADR-0013 decision 2 chose deliberately. Nothing
on this page states a completeness guarantee.
