# Changelog watch — the reconciliation record

**Source:** `https://developers.notion.com/page/changelog`
**Last reviewed:** 2026-08-19. **Newest entry seen:** 2026-08-13.

## Why the record has this shape

Borrowed, not invented. **14 CFR 91.417(a)(2)** requires an operator to keep

> "the current status of applicable airworthiness directives (AD) including, for each, the **method of
> compliance**, the **AD number** and **revision date**" and "if the AD involves recurring action, the
> **time and date when the next action is required**."

Four fields: **identity**, **version**, **disposition — the route taken, not a boolean**, and
**expiry, which is CONDITIONAL and present only where the obligation recurs.** The expiry attaches to
the directive's recurrence, not to the reviewer's diligence.

⭐ **Our analogue of "recurring" is "nonmonotonic", and that is exactly the negative claims.** A
positive claim is monotonic under vendor change — Notion shipping a feature cannot falsify *"the API
does X"*. A negation-as-failure claim is nonmonotonic by construction, and **the vendor shipping
anything at all is the new information**. So only negative claims carry an expiry. That is why this
file is cheap: most of what we assert never needs re-checking.

The full derivation, with locators, is `docs/research/vendor-assumption-drift-prior-art.md` §5.

## ⛔ There is no feed. Polling is the only route.

Fetched 2026-08-19: the changelog is dated per entry and actively maintained, and it has **no RSS, no
Atom, no email subscription and no JSON form.** Diffing the page is ours to do.

⚠ **The page mixes REST API and MCP-connector entries.** Many recent entries concern the Notion MCP
connector and its tools (`notion-fetch`, `notion-query-data-sources`), not the REST endpoints this
product calls. **Filter before treating an entry as bearing on the product** — and record the filter
decision, because "not applicable" is a disposition and deserves the same audit trail as "applied".

## The record

| Entry | Version | Disposition — the route taken | Next action |
| --- | --- | --- | --- |
| Link domains move to `app.notion.com/p/{id}` | 2026-07-15 | **Applied.** Fetched verbatim, landed as `link-domains.md`, filed to `#111`. Recogniser checked against the new path prefix at `references.ts:154,196` — keys on ID shape, unaffected. | **Recurring.** It states the format "may change again", which is a standing nonmonotonic hazard against the host list. |
| Data-source query/retrieve endpoints | `2026-03-11` API version | **Applied.** Both pages fetched, landed as `data-source-endpoints.md`. Re-scoped `#51`; corrected `#125`'s R1. | **Recurring** — the endpoint set is the surface our negatives are written about. |
| Data-source query cap | 2026-07-08 | **Applied.** *"A single data source query returns at most 10,000 results."* A **second, dated** locator for the `10,000` constant, independent of the endpoint page. | Not recurring — a positive claim, monotonic. |
| Rate limit becomes **per workspace** | 2026-06-16 | ✅ **APPLIED.** `request-limits` fetched and quoted verbatim as `rate-limits.md`. Two ceilings exist — per connection (*"an average of three requests per second"*) and per workspace (*"shared across all of the workspace's connections and scaled to the workspace's plan"*) — and *"requests that exceed **either** limit"* return 429. The standing `~3 req/s` claim is **incomplete, not refuted**. | **Recurring.** The per-workspace ceiling's value is unpublished and plan-scaled; a number appearing later changes the request budget. |
| ⭐ Formula/rollup values may return `type: "unsupported"` | 2026-08-05 | ⛔ **APPLIED, AND IT FOUND A LIVE DEFECT — `#127`.** *"The API can now return formula and rollup page property values and property item values with `type` set to `"unsupported"` and an empty `unsupported` object."* `readProperty` returns `state: 'value'` for that shape, executed and confirmed. `REQ001` therefore counts as **evaluated** a pair it cannot observe, which inflates coverage. ⚠ The type is a statement about **what the API represents**, NOT about whether Notion computed the value — the value likely exists and renders in the UI. Corrected on the ticket within the hour of filing. | **Recurring** — the property-value type union is vendor-extensible and our reader enumerates it. |
| ⭐ `notion-fetch` gains truncation metadata | 2026-08-07 | **MCP-scoped, and NOT skippable.** *"…now includes `truncated`, `unknown_block_ids`, and `unknown_block_count` when a page is large enough that some subtrees could not be loaded."* **This is the completeness signal ADR-0013 says the REST traversal does not have** — `GET /v1/blocks/{id}/children` returns the same `has_more: false` whether a listing was complete or permission-filtered. It does **not** change the REST attestation table. It does mean an attested route exists on a surface this project has already used once (`#121`, `#122`). | **Recurring.** Filed as context on the Full-vs-Null work; it is evidence, not a decision. |
| Formula `prop()` references preserved on update | 2026-08-12 | **Not applicable, recorded rather than skipped.** Affects `/v1/data_sources` **update** operations. This product writes nothing — Principle 7. | — |
| View filter tools; saved-view query mode; MCP protocol 2026-07-28 | 2026-08-13, 2026-08-10, 2026-08-03 | **Not applicable, recorded rather than skipped.** All three are Notion MCP connector tools (`notion-create-view`, `notion-update-view`, `notion-query-data-sources`, the Streamable HTTP endpoint). No `/v1/` change. | — |
| 2026-07-17 | 2026-07-17 | **Not applicable, recorded rather than skipped.** `notion-fetch`'s `self` response gained a `current_tool_access` map. MCP-scoped. | — |

## What this record does not claim

- **It does not claim the changelog is complete.** A vendor may change behaviour without an entry.
  Nothing here detects that, and no mechanism surveyed does.
- **It does not claim the unreviewed entries are irrelevant.** They are unreviewed. The
  distinction between a **known, accepted** gap and an **unnoticed** one is NASA's deviation/waiver
  vocabulary (SE Handbook Rev 2 §6.5.1.2.3), and the row above makes this one known.
- **It sets no maximum staleness interval yet.** 10 CFR 50.71(e) puts a statutory 24-month ceiling on
  the *document as a whole* rather than per claim, which is the affordable shape — but Notion ships
  weekly and the right interval here is an open question, not an assumed one.
