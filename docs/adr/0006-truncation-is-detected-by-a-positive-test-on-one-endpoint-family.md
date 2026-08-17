# ADR-0006: Truncation is detected by a positive test, and that test exists on one endpoint family only

- **Status:** Accepted
- **Date:** 2026-08-17
- **Supersedes:** ADR-0002 decision 4 in full. ADR-0002 decisions 1, 2, 3 and 5 stand and are unchanged. ADR-0002 is not edited.
- **Corrects:** the final sentence of `docs/proof/results.md` §1 — *"it is simply uninformative, which is the state ADR-0005's `unreached` exists to express."* An absent `request_status` is not `unreached`. `unreached` carries the remedy *widen access or raise the request budget*, and neither remedy applies to a field the server did not send. Decision 3 below places the state correctly. The evidence record is not edited.
- **Evidence:** `docs/proof/results.md` §1 (observed 2026-08-17, `Notion-Version: 2026-03-11`); `https://developers.notion.com/reference/query-a-data-source`; `https://developers.notion.com/reference/intro#pagination`; `https://developers.notion.com/reference/get-block-children`

## Context

ADR-0002 decision 4 reads:

> "`Notion-Version` is pinned to a release carrying `request_status`. The **absence** of `request_status` from a paginated list response is a hard error, not evidence of completeness."

Implemented literally, that rule makes every scan of every healthy workspace a hard error. `request_status` was absent from every response taken in the 2026-08-17 proof run:

| Endpoint | `page_size` | `has_more` | `request_status` |
| --- | --- | --- | --- |
| `POST /v1/data_sources/{id}/query`, 150 rows | 100 | `true` | absent |
| `GET /v1/blocks/{id}/children`, 151 blocks | 100 | `true` | absent |
| `GET /v1/blocks/{id}/children`, 3 blocks | 100 | `false` | absent |

The full top-level key list on the query response was `has_more`, `next_cursor`, `object`, `page_or_data_source`, `request_id`, `results`, `type`. The rule fires on the healthy path and never on the degraded one. That is the exact inversion of its purpose.

**The intent was correct and remains correct.** Before 2026-04-20, `dataSources.query` returned `has_more: false` at exactly 10,000 rows and silently lied — in Notion's own words, "a common source of confusion for connections doing full exports." A scan that trusts `has_more: false` inherits that lie. Decision 4 was the defence. The mechanism was a presence check, and a presence check cannot detect a state the server signals by *adding* a field.

**A second finding, made while drafting this ADR, is larger than the first.** The reference for `POST /v1/data_sources/{id}/query` documents `request_status`. Two other pages do not:

- `https://developers.notion.com/reference/intro#pagination` — the normative description of the shared paginated-list envelope — documents `object`, `results`, `has_more`, `next_cursor`, `type` and `page_size`. It does not mention `request_status`.
- `https://developers.notion.com/reference/get-block-children` documents `type`, `block`, `object`, `next_cursor`, `has_more` and `results`. It does not mention `request_status`, and it documents no result cap. Its only stated limit is `page_size`, default 100, maximum 100.

`GET /v1/blocks/{id}/children` is the traversal spine of the scan. Every page walk, every nested-block descent, every `child_page` discovery runs through it. **It carries no documented truncation signal of any kind.** ADR-0002 decision 4 was written as though one global signal covered the whole API. It does not.

## Decision

### 1. The mechanism is a positive test. Absence is neither an error nor proof of completeness

The scan tests `request_status.type === "incomplete"` on every response page, which is what the primary reference prescribes:

> "Check `request_status.type === "incomplete"` on every response page to know whether a query was cut off."

Three states, and the third is the common one:

| Observed | Meaning | Manifest effect |
| --- | --- | --- |
| `request_status.type === "incomplete"` | The server states the result was cut off. | The `enumerated` stage drops out. **Unbounded gap.** Cause `result_limit_reached`, carrying `incomplete_reason` verbatim. |
| `request_status.type === "complete"` | The server states the result was not cut off. | No drop-out. |
| field absent | The server said nothing. | No drop-out. See decisions 3 and 4. |

An unbounded gap triggers ADR-0005 decision 3 condition (b), so a truncated enumeration disclaims the report. That is the behaviour ADR-0002 decision 4 wanted, reached through a test that fires on the degraded path instead of the healthy one.

**`request_status.type === "complete"` has never been observed.** Neither branch of the field has been seen emitted. The scan must not treat `complete` as a required precondition for anything, and no code path may block on its arrival.

### 2. The truncation signal covers one endpoint family, and the scan records which endpoints ran blind

| Endpoint | Documented truncation signal | Documented cap |
| --- | --- | --- |
| `POST /v1/data_sources/{id}/query` | `request_status.type === "incomplete"` with `incomplete_reason: "query_result_limit_reached"` | 10,000 results |
| `GET /v1/blocks/{id}/children` | **None** | None documented |
| `POST /v1/search` | **None** | None documented. Observed to die at roughly 11,200 objects — ADR-0002 Context, finding 3. |

For block-children enumeration the scan has `has_more` and nothing else. `has_more: false` is precisely the value that lied at the data-source cap before 2026-04-20, and there is no documented reason to believe the block-children endpoint is immune. The scan cannot close this hole. **It discloses it instead — see decision 5.**

This is not a temporary state pending better instrumentation. It is a property of the API surface, and every completeness claim the product makes over page content rests on an unsignalled `has_more: false`.

### 3. "Uninformative" gets no fourth value. An absent `request_status` maps to `sufficient`

ADR-0005's governing design rule is that **a value earns its place only if it changes what the operator does next.** A fourth evidence-sufficiency value for the absent case fails that rule on three counts:

1. **It has no remedy.** `unreached` is fixed by widening access or raising the request budget. `undecidable` is fixed by changing the rule, the configuration, or the data. Absence is fixed by nothing the operator can do. It is the server's choice not to send a field.
2. **It fires on every scan.** The field was absent from every response in the proof run, including a three-block list that completed in one page. A value that is set on 100% of runs partitions nothing.
3. **It would train readers to ignore the axis.** ADR-0005's fourth Revisit-if already names this hazard: readers retain the verdict and discount qualifying language. A permanent, universal, unremediable qualifier is the fastest way to produce that outcome.

`sufficient` therefore means what it always meant: **every applicable resource the tool established was fetched and judged.** It has never meant "the API proved this set was complete." ADR-0002 gave up the census claim in its first decision, and `sufficient` has been relative to a declared denominator ever since. Absence of `request_status` changes nothing about that reading; it only makes the pre-existing limit visible.

The residual doubt is real and it does not vanish. It is carried by decision 5, not by the outcome axis.

### 4. Where a documented cap exists, a terminal count at the cap makes the enumerated count a lower bound

Defence in depth for the one endpoint that has a documented cap. When a `dataSources.query` enumeration terminates with `has_more: false` and the cumulative result count equals a known cap constant, and no `request_status` arrived:

- the enumerated count is recorded as a **lower bound**, not an equality;
- the `enumerated` stage drops out with cause `suspected_result_limit`, marked **unbounded**;
- the operator's remedy is named: partition the declared root, or narrow the query filter.

This is transplanted, not invented. Three shipped precedents carry the same shape:

- **Elasticsearch** caps accurate hit counting at 10,000 by default and marks the capped state in the response envelope — `hits.total.relation` is `"eq"` when the count is exact and `"gte"` when it is a floor. The API does not report a capped count as a fact; it reports it as a bound. That is the distinction decision 4 adopts.
- **OSIsoft PI Web API** documents the failure mode directly: when a request exceeds `maxCount`, the response is silently truncated with no error and no warning header. The documented client-side defence is comparing the returned count against the requested limit.
- **The fetch n+1 pattern** — request `pageSize + 1` and infer a further page from the surplus — is the standard cursor-pagination defence against the same ambiguity. It is unavailable here, because Notion caps `page_size` at 100 and the relevant boundary is a server-side result cap rather than a page boundary. The reasoning it encodes still applies: *a result set that exactly equals a limit is evidence of a limit, not evidence of a total.*

The trip does not apply to block children or to search, because neither has a documented cap constant to compare against. Inventing one from the observed ~11,200 search wall is rejected — that figure is a community observation of a broken cursor, not a documented boundary, and a threshold built on it would fire unpredictably.

### 5. The standing sampling-risk statement names the endpoints that ran without a truncation signal

ADR-0005 decision 5 already makes a sampling-risk statement mandatory in every report. This decision gives it per-run content. The statement now names:

- which endpoint families the run used;
- which of those carried a truncation signal and which did not;
- for the ones that did not, that a complete-looking enumeration cannot be distinguished from a silently truncated one.

A boilerplate sentence repeated on every report is the thing ADR-0005's fourth Revisit-if predicts readers will skip. A sentence that names the specific endpoints this specific run trusted blind is a different artifact. It also makes the disclosure falsifiable: if Notion later documents a signal on block children, the statement changes, and the change is visible in a diff.

### 6. The version pin stands, and its reason is restated

`Notion-Version: 2026-03-11` returns HTTP 200 on `GET /v1/users/me`. The pin is valid and it is kept. What it buys is now narrower than ADR-0002 decision 4 implied:

- It **does not** buy guaranteed presence of `request_status`. The field is conditional, and it was absent from every observed response.
- It **does** buy the possibility of the `incomplete` signal. A version predating the 2026-04-20 release cannot emit the field at all, so on such a version the positive test in decision 1 is dead code and the data-source cap is undetectable. Pinning at or above that release is a precondition for decision 1 to mean anything.
- It **does** buy a stable response envelope for the normalization function of ADR-0004. Determinism is defined against normalized output, and a floating version can change the field set under it.

The pin is a floor, not a target. Raising it requires re-running the observations in `docs/proof/results.md` §1, because this ADR's per-endpoint table is a statement about one version.

## Consequences

**Gained.** The truncation defence now fires on the degraded path instead of the healthy one, which is the whole of issue #13. Scan code is unblocked.

**Gained, and it was not the goal.** The per-endpoint audit forced by this ADR surfaced a larger limit than the one it was written to fix. The scan's traversal spine has no truncation signal. That was true before this ADR and nobody had written it down. It is now a stated property of the product rather than an assumption inside it.

**Paid: the completeness claim over page content is weaker than the claim over data-source rows.** A data-source query that is cut off says so. A block-children enumeration that is cut off looks identical to one that finished. Two coverage claims of visibly different strength now sit in the same report, and the report has to say so without turning into a disclaimer nobody reads.

**Paid: decision 4 adds a cap constant to the codebase.** `10,000` is a magic number sourced from vendor documentation, and vendor documentation has already been wrong once in this project — `notion-api-practice.md` §5.2. It needs a named constant, a comment pointing at this ADR, and a test that fails loudly if a real capped response ever disagrees with it.

**Rejected by consequence.** Any presence check on `request_status`. Any treatment of `has_more: false` as proof of completeness in prose, in a report, or in marketing copy. Any fourth value on the evidence-sufficiency axis for the absent case. Any cap-proximity threshold on an endpoint without a documented cap.

**Evidential standing.** The observations in decision 1's table are first-party, taken 2026-08-17 against a live workspace, and recorded in `docs/proof/results.md` §1 with the request that produced each. The per-endpoint table in decision 2 is read directly from three Notion reference pages, fetched 2026-08-17. The `complete` branch of `request_status` is **unobserved** — no claim here depends on it. The three precedents in decision 4 are cited for the *shape* of the mechanism, and the Elasticsearch `hits.total.relation` values were read from a search-result summary rather than from the Elasticsearch reference directly; re-verify before quoting the field path in code or in anything published.

**Citation hazard, unchanged.** ISO 19011 and ISA 705, referenced through ADR-0005, were read from unauthorised copies. Cite by clause; publish no URL.

## Revisit if

**Notion documents `request_status` on the shared pagination envelope, or on `GET /v1/blocks/{id}/children`.** Decision 2's table is the load-bearing part of this ADR and it is a snapshot of three documentation pages on one date. A signal on block children would close the largest hole in the product's completeness claim, and decision 5's disclosure would shrink to the endpoints still lacking one. Re-check on any Notion API changelog entry touching pagination.

**`request_status: {"type": "complete"}` is observed.** Neither branch has been seen. If `complete` turns out to be emitted only on capped queries, the field's vocabulary is narrower than the reference implies and decision 1's three-state table is wrong in its second row. A workspace over 10,000 rows settles it. This is proof question 4 and it is open.

**A capped `dataSources.query` is observed and its terminal count does not equal 10,000.** Decision 4's trip would then be keyed to the wrong constant and would either never fire or fire on healthy scans — the same defect this ADR exists to remove. Treat the constant as unverified until a real capped response confirms it.

**Notion raises the `page_size` maximum above 100.** Decision 4 rejects the fetch n+1 pattern on the grounds that the relevant boundary is a server-side result cap rather than a page boundary. A larger page size does not change that, but a change to the pagination contract large enough to move the maximum is a signal to re-read the envelope documentation in full.

**The disclosure in decision 5 is shown to be ignored.** ADR-0005's fourth Revisit-if applies here with more force, because this disclosure is longer than the one it extends. If user testing shows readers skip the endpoint list, the answer is to redesign the disclosure, not to delete the limit it describes.
