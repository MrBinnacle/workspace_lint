# 72-hour proof — first results

Run 2026-08-17 against the fixture in `docs/proof/fixture.md`, using the `workspace-lint-proof` integration (read-only) at `Notion-Version: 2026-03-11`.

Four results. One of them invalidates part of a locked ADR.

---

## 1. `request_status` is absent from normal responses. ADR-0002 decision 4 is inoperable as written.

**ADR-0002 decision 4 says:** *"`Notion-Version` is pinned to a release carrying `request_status`. The **absence** of `request_status` from a paginated list response is a hard error, not evidence of completeness."*

**Observed.** `request_status` is absent from every response taken in this run:

| Endpoint | `page_size` | `has_more` | `request_status` |
| --- | --- | --- | --- |
| `POST /v1/data_sources/{id}/query` | 100 | `true` | **absent** |
| `GET /v1/blocks/{id}/children` (151 blocks) | 100 | `true` | **absent** |
| `GET /v1/blocks/{id}/children` (3 blocks) | 100 | `false` | **absent** |

Top-level keys returned by the data source query, in full: `has_more`, `next_cursor`, `object`, `page_or_data_source`, `request_id`, `results`, `type`. There is no `request_status`.

**Primary source.** `https://developers.notion.com/reference/query-a-data-source` documents the field as conditional, not guaranteed. It gives two values — `complete` and `incomplete` with `incomplete_reason: "query_result_limit_reached"` — and states that at the cap *"`has_more` becomes `false`, and every response page served from the capped result includes a `request_status` marking the result as incomplete."* Its instruction is a positive test: *"Check `request_status.type === "incomplete"` on every response page to know whether a query was cut off."* The page does not state that the field is always present, and it is not.

**Consequence, and it is severe.** Implemented literally, decision 4 makes **every scan of every normal workspace a hard error**, because the field it requires is absent from ordinary responses. The rule would fire on the healthy path and never on the degraded one.

**The intent was right and the mechanism is backwards.** Decision 4 exists because, before 2026-04-20, `dataSources.query` returned `has_more: false` at exactly 10,000 rows and silently lied. The defence against that is to test for `request_status.type === "incomplete"` as a positive truncation signal. Absence is not an error and is not proof of completeness — it is simply uninformative, which is the state ADR-0005's `unreached` exists to express.

**Status: ADR-0002 decision 4 needs a superseding decision.** ADR-0002 is not edited. Draft the amendment before any scan code is written, because this rule sits on the healthy path.

**Not yet established:** whether `request_status: {"type": "complete"}` is ever emitted at all. This fixture cannot reach the 10,000-row cap, so neither branch of the field was observed. That is proof question 4's territory and it remains open.

---

## 2. Q7 — enumeration is separable from fetching. ADR-0005 decision 5 survives.

`GET /v1/blocks/{PAGINATION_PAGE_ID}/children` over a page holding 151 blocks:

- page 1 — 100 results, `has_more: true`, `next_cursor` present
- page 2 — 51 results, `has_more: false`
- total enumerated — **151**, matching the fixture exactly

**Finding.** The API distinguishes "I have listed some children and there are more" from "I have fetched this resource". `has_more` plus `next_cursor` is a real, observable enumeration boundary.

This was ADR-0005's second Revisit-if: *"if enumeration and fetching cannot be separated in practice, condition (b) of the pervasiveness predicate loses its input."* It does not fire. The five-stage funnel's `enumerated` stage has an API basis, and an unbounded gap — pagination abandoned mid-enumeration — is a state the tool can actually detect and report.

---

## 3. Q3 — result order was stable across two identical calls. Provisional.

Two consecutive `POST /v1/data_sources/{id}/query` calls with `page_size: 100` returned the **same 100 page IDs in identical order**.

**Do not promote this to a settled fact.** `docs/proof/fixture.md` records the reason: all 150 rows were created in two bulk API calls, so their `created_time` values cluster into two tight groups. If Notion's default ordering is timestamp-derived, this fixture could produce artificial stability. The result is consistent with stable ordering; it does not demonstrate it.

**To settle it:** re-run against `REAL_ROOT_ID` content with organically spread timestamps, and re-run with a deliberate write between the two calls.

---

## 4. Q1 — the mechanism a completeness claim would rest on is NOT yet demonstrated.

The control behaves correctly:

| Page | Grant | Retrieve |
| --- | --- | --- |
| `wl-outside-grant` | never connected | **404** |
| `wl-revoke-child` | disconnect dialog was opened | **200** |

`wl-revoke-parent` still lists a `child_page` block for `wl-revoke-child` — but the child also still retrieves successfully, so this is the ordinary connected case, not the detectable-hole case.

**The 404 on `wl-outside-grant` is worth keeping.** It confirms that an unconnected page returns 404 rather than 403, which is the ambiguity `CONTEXT.md` Principle 3 is built on: access failure and object absence share a response.

**Unresolved:** whether the disconnect was actually applied. The dialog was opened and screenshotted; it is not established that it was confirmed. Until that is known, this run says nothing about proof question 1.

---

## What this run changed

| Question | Before | After |
| --- | --- | --- |
| ADR-0002 decision 4 | assumed sound | **inoperable as written; needs a superseding decision** |
| ADR-0005 Revisit-if 2 (enumeration separable) | open | **does not fire — decision 5 stands** |
| Q3 order stability | open | **provisionally stable; fixture-confounded** |
| Q1 child_page visibility | open | **still open** |
| Selective revocation exists | `(C)` unverified | confirmed in UI 2026-08-17 (`docs/proof/fixture.md`) |
| `Notion-Version: 2026-03-11` valid | assumed | **confirmed — HTTP 200 on `/v1/users/me`** |

## Next

1. **Draft the ADR superseding ADR-0002 decision 4.** It is on the healthy path, so it blocks scan code.
2. **Settle Q1.** Confirm the disconnect on `wl-revoke-child`, then re-run the parent-children listing and the direct retrieve.
3. **Re-run Q3 against real content.** The fixture cannot settle it alone.
