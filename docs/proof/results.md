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

## 4. Q1 — ANSWERED, AND THE ANSWER IS NO. The detectable hole does not exist.

The disconnect was applied to `wl-revoke-child` at 2026-08-17, then the sequence was re-run.

| Call | Before disconnect | After disconnect |
| --- | --- | --- |
| `GET /blocks/{parent}/children` | 3 blocks, **including a `child_page` block** for the child | **2 blocks. The `child_page` block is gone.** |
| `GET /pages/{child}` | 200 | **404** `object_not_found` |
| `GET /blocks/{child}` | 200 | **404** `object_not_found` |
| `GET /blocks/{child}/children` | 200 | **404** `object_not_found` |

**Control — the page was not moved or deleted.** Fetched through the claude.ai connector, which holds full workspace access: `wl-revoke-child` still exists, with its ancestor path unchanged at `wl-proof-fixture → wl-revoke-parent → wl-revoke-child`. The block list is **permission-filtered**, not structurally changed.

### What this refutes

`docs/research/notion-api-practice.md` §5.2 states, under **Detectable hole**:

> "A `child_page` or `child_database` block appears in `GET /v1/blocks/{id}/children` with an ID and title even when the page itself subsequently 404s on retrieve. This gives a named, enumerable hole."

It was rated **(C)** — community reports, no reproduced primary write-up — and carried this note: *"This is the highest-value item to verify directly in the 72-hour proof, because a completeness proof would rest on this mechanism."*

**Verified directly. The claim is false.** Notion filters the child list by permission. A revoked child is not *named but unreadable*. It is **invisible**, exactly like a subtree that was never shared. §5.2's "Detectable hole" and "Undetectable hole" are not two cases. They are one case.

### It also falsifies an inference recorded earlier the same day

After observing the disconnect dialog in the UI, `docs/proof/fixture.md` and the S003 checkpoint recorded: *"`unreached` inside a declared root **is** reachable by permissions, not only by rate limits and pagination — so ADR-0005's evidence-sufficiency axis keeps its full range."*

**That inference is wrong.** It was drawn from a UI dialog before the API was asked. Revocation does not produce an `unreached` Gap; it removes the resource from enumeration entirely, so the resource never enters the applicable set and there is nothing to count. The write-up at the time labelled itself "UI capability CONFIRMED; API consequence OPEN" — the label was right and the inference next to it was not.

### What actually survives

**The declared-root model is intact.** ADR-0002 is unaffected. *"Everything you declared was read"* is still provable, because the denominator is supplied by the operator.

**REF001 is now the load-bearing rule, and it is confirmed working.** The `wl-outside-grant` control returns **404** on retrieve while the link to it sits in readable content. A *link* to an inaccessible page survives revocation, because the link lives in another page's content rather than in the permission-filtered child list. That is the real detectable-hole mechanism, and it is a link-resolution mechanism, not a tree-enumeration one.

The 404 also confirms `CONTEXT.md` Principle 3's premise directly: an unconnected page returns 404, not 403. Access failure and object absence are indistinguishable in the response.

### What narrows

Inside a Declared root, an `unreached` Gap can arise **only** from rate limits, request-budget exhaustion, or abandoned pagination. **Never from permissions.** Permission removal below a declared root is silent: the scan cannot count it, name it, or report it.

Permissions still produce a detectable gap at exactly one place — an inaccessible **declared root**, which ADR-0002 decision 2 already makes a hard coverage failure. It is detectable *because the operator declared it*. The declaration is what makes it nameable.

**The general rule this establishes: the coverage manifest can only name what the operator declared, or what the tool successfully enumerated. Nothing else is expressible.**

### The counter-argument this strengthens

`docs/research/coverage-artifact-prior-art.md` §5.1 recorded the wildcard scout's strongest objection: *"A Notion integration sees only what a human explicitly shared with it. 'What I could not see' may reduce to 'everything you did not give me' — which the customer already knew and the tool cannot size."*

This result is evidence **for** that objection, in a specific and bounded way. It does not carry the objection all the way: declared roots plus link resolution still yield a real, provable coverage claim. But the claim is narrower than the repository has been stating it, and `PRODUCT.md` should be corrected before the claim is put in front of a buyer.

---

## What this run changed

| Question | Before | After |
| --- | --- | --- |
| ADR-0002 decision 4 | assumed sound | **inoperable as written; needs a superseding decision** |
| ADR-0005 Revisit-if 2 (enumeration separable) | open | **does not fire — decision 5 stands** |
| Q3 order stability | open | **provisionally stable; fixture-confounded** |
| Q1 `child_page` survives revocation | `(C)`, "highest-value item to verify" | **REFUTED — the block vanishes; the hole is undetectable** |
| Detectable vs undetectable hole | two cases | **one case** |
| `unreached` from permissions inside a root | claimed possible (2026-08-17, from UI) | **impossible — that claim is withdrawn** |
| REF001's role | one rule among eight | **the load-bearing coverage mechanism, confirmed working** |
| Selective revocation exists in the UI | `(C)` unverified | confirmed |
| `Notion-Version: 2026-03-11` valid | assumed | **confirmed** |

## Next

1. **Draft the ADR superseding ADR-0002 decision 4.** It sits on the healthy path and blocks scan code.
2. **Correct `PRODUCT.md`.** The coverage claim is narrower than stated: the tool proves declared-root coverage and resolves links, and it cannot see permission removal below a declared root.
3. **Re-run Q3 against real content.** The fixture cannot settle it alone.
4. **Re-check §5.2's remaining claims.** One of its two headline claims was false. The rest of that file has not been re-verified.
