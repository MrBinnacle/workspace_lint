# Access enumeration — what routes exist for discovering what a connection can reach

> ⭐ **ADDENDUM 2026-08-19 — the `llms.txt` Revisit-if is CLOSED, and it does not change the
> conclusion.** `https://developers.notion.com/llms.txt` was fetched and read for enumeration routes.
> Across **300+ entries**, no endpoint enumerates a connection's accessible objects other than
> `POST /v1/search`. Keyword-matching entries checked and eliminated: List all users, List data source
> templates, List views, List comments, List file uploads, List custom emojis, and three
> `admin/`-scoped ones (MCP client connections, personal access tokens, legal holds), which are
> organisation-scoped rather than connection-scoped.
>
> ⛔ **THIS IS NEGATION AS FAILURE AND IS RECORDED AS SUCH.** Absence from an index is absence of
> evidence. The honest form is *"no enumeration route other than search is currently believed to
> exist"*. It strengthens the narrower claim; it does not convert it into a strong negation. The rule
> applies to our own findings or it is decoration.
>
> ⚠ **One endpoint surfaced that this repository does not know about:** `List views` — *"List all
> views in a database"*, `developers.notion.com/reference/list-views`. Not an enumeration route for
> the grant, but a database-scoped listing endpoint nobody here has read. **Unassessed.**

- **Fetched:** 2026-08-19. **Notion-Version in force in this repository:** `2026-03-11`.
- **Why this file exists:** `#123` asked whether ADR-0002 finding 1 — *"Nothing returns the set of
  objects an integration may read."* — still holds. It does not. A vendor sentence contradicts it,
  and a second endpoint contradicted it historically. The finding that ADR-0002 needed is a
  *narrower* sentence that the vendor does state, and ADR-0002 already quotes it, one line lower.

## 1. `POST /v1/search` — Search by title

`https://developers.notion.com/reference/post-search`

The opening description, verbatim:

> "Searches all parent or child pages and data_sources that have been shared with a connection."

And, verbatim:

> "The results adhere to any limitations related to an connection's capabilities."

⚠ **The `an connection's` is the vendor's own typo, reproduced.** This repository's standing note
renders the sentence as *"adheres to any limitations related to a connection's capabilities"* with no
locator. **That rendering is a paraphrase, not a quote.** The locator is this page; the quote is the
sentence above.

**Method and path, as shown:** `POST /v1/search`.

## 2. `https://developers.notion.com/reference/search-optimizations-and-limitations` — the page that decides the question

Reproduced verbatim, in full, because both halves are load-bearing and this repository has only ever
carried one of them.

> ## Optimizations
>
> Search works best when the request is as specific as possible. We recommend filtering by object
> (such as `page` or `database`) and providing a text `query` to narrow down results.
>
> To speed up results, try reducing the `page_size`. The default `page_size` is 100.
>
> Our implementation of the search endpoint includes an optimization where any pages or databases
> that are directly shared with a connection are guaranteed to be returned. If your use case requires
> pages or databases to immediately be available in search without an indexing delay, we recommend
> that you share relevant pages/databases with your connection directly.
>
> ## Limitations
>
> The search endpoint works best when it's being used to query for pages and databases by name. It is
> not optimized for the following use cases:
>
> * **Exhaustively enumerating through all the documents that a bot has access to in a workspace.**
>   Search is not guaranteed to return everything, and the index may change as your connection
>   iterates through pages and databases.
> * **Searching or filtering within a particular database.** This use case is much better served by
>   finding the database ID and using the [Query a data source](/reference/query-a-data-source)
>   endpoint.
> * **Immediate and complete results.** Search indexing is not immediate. If a connection performs a
>   search quickly after a page is shared with the connection (such as immediately after a user
>   performs OAuth), then the response may not contain the page.
>   * When a connection needs to present a user interface that depends on search results, we
>     recommend including a *Refresh* button to retry the search. This will allow users to determine
>     if the expected result is present or not, and give them a way to try again.
> * **Listing content in the trash.** Trash results are search-index-backed and eventually consistent.
>   Results include only content the connection can access.

⭐ **Read the two halves together.** The vendor says search *does* enumerate what a bot has access to
— it names that use case by name — and says the enumeration is **not guaranteed complete**. It also
says one subset **is** guaranteed: objects *directly shared* with the connection.

**This page lives under `/reference/`, not `/docs/`.** `https://developers.notion.com/docs/search-optimizations-and-limitations`
returns **HTTP 404**. That wrong path is the plausible reason a prior sweep concluded the page was
absent.

## 3. `GET /v1/databases` — List all databases shared with the connection (deprecated)

`https://developers.notion.com/reference/get-databases`

> "List all Databases shared with the authenticated connection."

> "This endpoint will only return explicitly shared databases, while search will also return child
> pages."

> "Connections can only access databases a user has shared with the connection."

Deprecation, verbatim: *"Deprecated as of version 2025-09-03"*, and it is *"only available on API
version '2021-08-16' and earlier."*

**Bearing.** This endpoint did exactly what ADR-0002 finding 1 says nothing does — for databases,
explicitly, with no index and no "not guaranteed" caveat. It is **unusable at `2026-03-11`**, so it
changes no build decision. It changes the *finding*: the claim was over-general even before the
version this project pins.

⚠ The page as fetched did not display the HTTP method and path. `GET /v1/databases` is taken from the
endpoint's name and the historical API; **treat the exact path as UNVERIFIED.**

## 4. `GET /v1/spaces/{space_id}/agents/{agent_id}/permissions` — Get a custom agent's sharing permissions

`https://developers.notion.com/reference/admin/get-agent-permissions`

Required scope, verbatim: `"workflows:read"`. Returns, verbatim:

> "The page of permission entries, up to 250 per request. The workspace-wide grant always sorts
> first, then groups, then users."

> "'workspace' maps to a space-wide permission granting all workspace members the given role; guests
> are never covered by it."

**This is not the route.** It enumerates *principals granted access to an agent* — users, groups,
workspace — not *objects an agent may read*. Recorded so the next sweep does not re-open it. It is
also an admin-API endpoint on a different scope model from the internal-integration capability set,
which this project does not hold.

## 5. `GET /v1/users` and `GET /v1/users/me`

`https://developers.notion.com/reference/get-users` · `https://developers.notion.com/reference/get-self`

`get-users`, verbatim:

> "Returns a paginated list of Users for the workspace. The response may contain fewer than
> `page_size` of results."

> "This endpoint requires a connection to have user information capabilities. Attempting to call this
> API without user information capabilities will return an HTTP response with a 403 status code."

> "Guests are not included in the response."

> "Personal access tokens cannot list workspace users."

`get-self`, verbatim:

> "Retrieves the User associated with the API token provided in the authorization header."

> "This endpoint is accessible from by connections with any level of capabilities."

Returned bot fields as listed: `owner`, `workspace_id`, `workspace_limits`
(`max_file_upload_size_in_bytes`), `workspace_name`. **No grant set, no object list.** ADR-0002's
citation of these two endpoints is correct.

⚠ *"accessible from by"* is the vendor's own wording, reproduced.

## 6. `request_status` / `query_result_limit_reached` — the locator, and its limit

**Locator: the response schema of `POST /v1/search`**, `https://developers.notion.com/reference/post-search`.
The schema carries a `request_status` object with `type` taking `"complete"` or `"incomplete"`, and
`incomplete_reason` taking `"query_result_limit_reached"`.

⛔ **These are field and enum names read out of a schema table. No prose sentence explaining the
field was obtained, and nothing here is a verbatim vendor sentence.** The repository's standing
description — *"documented but never observed"* — is now half-resolved: **documented, on this page, as
schema.** Whether prose exists elsewhere is unresolved. Do not upgrade this to a quote without a
re-fetch that returns the sentence.

## 7. The endpoint index — how it was obtained

`https://developers.notion.com/llms.txt` is a machine-readable index of the entire documentation set,
including every reference page. `https://developers.notion.com/reference/intro` does **not** display
the endpoint list; it points at `llms.txt`. Any future claim of the form *"the complete public
endpoint index was checked"* should cite `llms.txt`, because that is the only place the complete index
is actually rendered.

Endpoints in that index that this repository has not, to date, considered: `list-views`,
`get-view-query-results`, `create-view-query`, `list-data-source-templates`, `retrieve-page-markdown`,
`query-meeting-notes`, `list-custom-emojis`, and the `reference/admin/*` family. **None of them is a
grant-enumeration route.** Listed so the next sweep starts from a named set rather than re-deriving one.

## Dispositions

| Claim | Disposition | Basis |
| --- | --- | --- |
| "Nothing returns the set of objects an integration may read." | **REFUTED** | §1 — *"Searches all parent or child pages and data_sources that have been shared with a connection."* §3 — *"List all Databases shared with the authenticated connection."* |
| "Search is not a guaranteed-complete enumeration." | **CONFIRMED** | §2 — *"Search is not guaranteed to return everything…"* |
| "**No endpoint** guarantees complete enumeration." | **UNLOCATABLE** | The vendor asserts the non-guarantee **of search**. It asserts nothing about the universal case. Negation as failure. |
| "Objects directly shared with the connection are guaranteed returned by search." | **CONFIRMED (positive)** | §2 — *"any pages or databases that are directly shared with a connection are guaranteed to be returned."* |
| Search "adheres to any limitations related to a connection's capabilities" | **LOCATOR FOUND, quote corrected** | §1. The repository's wording is a paraphrase. |
| `request_status` / `query_result_limit_reached` is vendor-documented | **CONFIRMED as schema, not as prose** | §6 |
| An endpoint enumerates shared content directly | **REFUTED for the current version, CONFIRMED historically** | §3 — deprecated as of `2025-09-03`. |

## What this contradicts in standing documents

- `docs/adr/0002-coverage-is-measured-against-declared-roots.md:14` — *"Nothing returns the set of
  objects an integration may read."* **Contradicted by §1 and §3.** The sentence one line down
  (`:15`, finding 2) is correct, correctly quoted, and is the finding the ADR's decision actually
  rests on. Finding 1 is a stronger claim than the decision needs and than the vendor supports.
- `docs/adr/0002-…:14` — *"the complete public endpoint index was checked."* The index is at
  `llms.txt` (§7); `reference/intro` does not render it. Whether the earlier check reached `llms.txt`
  is not recorded.
- `slice/negation-baseline.json` — digest `d66eb982f3fc` carries the refuted sentence, and digest
  `70da8ea84cbe` carries the endpoint-index sentence. Both are baselined as standing negatives.
- The unlocated *"adheres to any limitations"* note (§1) now has a locator and a corrected quote.

**Per `docs/agents/domain.md` and `CLAUDE.md`, no ADR is edited to match this file.** ADR-0002 is
superseded by reference, not corrected.
