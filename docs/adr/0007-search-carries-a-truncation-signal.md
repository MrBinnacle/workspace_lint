# ADR-0007: `POST /v1/search` carries a truncation signal. One row of ADR-0006's table is wrong, and its central finding is stronger than when it was written

- **Status:** Accepted
- **Date:** 2026-08-17
- **Supersedes:** one row of ADR-0006 decision 2's per-endpoint table — `POST /v1/search`. ADR-0006 decisions 1, 3, 4, 5 and 6 stand and are unchanged. The other two rows of decision 2's table stand. **ADR-0006 is not edited.**
- **Corrects:** nothing in `docs/research/`. Both research files carried the correct fact before ADR-0006 was written. This ADR corrects the ADR, not the evidence.
- **Evidence:** `https://developers.notion.com/reference/post-search`, re-fetched while drafting this ADR rather than taken from the issue that reported it; `makenotion/notion-sdk-js` PR #711, merged 2026-04-20, re-fetched the same way; `docs/research/notion-api-practice.md` §4.5 and its verification table; `docs/research/competitive-landscape.md` §4

## Context

ADR-0006 decision 2 lists a per-endpoint truncation-signal table. The `POST /v1/search` row reads **None** in both columns.

The row is wrong in its first column. Two independent primary sources say so, and both were opened directly for this ADR:

- The `post-search` reference documents `request_status` on the search response envelope. Its `type` is an enum over `complete` and `incomplete`; its `incomplete_reason` is an enum whose only documented value is `query_result_limit_reached`. The documented top-level fields are `type`, `page_or_data_source`, `object`, `next_cursor`, `has_more`, `results` and `request_status`.
- `notion-sdk-js` PR #711 adds `request_status` to seven response types. `SearchResponse` is among them.

The second column of that row is correct and is kept. The search reference documents no maximum result count. `incomplete_reason: "query_result_limit_reached"` implies a limit exists; it does not state its value.

### How the error was made

ADR-0006 asserted a negative across three endpoints having opened two reference pages. `/reference/intro#pagination` — the shared paginated-list envelope — does not mention `request_status`, and `/reference/get-block-children` does not either. The search reference was never opened. Silence on the shared page was read as absence on every endpoint under it.

That inference is invalid in this specific API, and ADR-0006 contains the proof of its own invalidity. Its decision 2 records that `query-a-data-source` **does** document `request_status` while the shared envelope page does not. The shared page was therefore already known to be an incomplete description of the per-endpoint envelopes at the moment the negative was asserted.

### The fact was in the repository, in two files, three hours earlier

This is the part worth carrying forward.

- `docs/research/notion-api-practice.md` §4.5 listed `SearchResponse` among the seven types carrying `request_status`.
- `docs/research/competitive-landscape.md` §4 stated it independently, citing the `post-search` reference by URL, and drew the product conclusion from it: *"Notion's API already tells callers when results are incomplete. No competitor surfaces this to the user."*

Both files entered the tree in commit `12106c5` at 18:51. ADR-0006 was committed as `f8917fa` at 21:42 the same day. A grep of `docs/research/` for `post-search` before asserting the table would have returned two files, and either one refutes the row.

This is the second time an ADR has contradicted a file already in the repository. It is not a research failure. The research was right, present, and indexed.

## Decision

### 1. The corrected per-endpoint table

| Endpoint | Documented truncation signal | Documented cap |
| --- | --- | --- |
| `POST /v1/data_sources/{id}/query` | `request_status.type === "incomplete"` with `incomplete_reason: "query_result_limit_reached"` | 10,000 results |
| `GET /v1/blocks/{id}/children` | **None** | None documented |
| `POST /v1/search` | `request_status.type === "incomplete"` with `incomplete_reason: "query_result_limit_reached"` | **None documented** |

The observation that search dies at roughly 11,200 objects is removed from the signal columns and stated here instead, with its standing attached: it is a community report, and the verification pass in `notion-api-practice.md` recorded it as **not re-confirmed** on refetch. It is not a documented cap, it is not a first-party observation, and no decision may key on the number.

**Evidence class, stated plainly because it is the same class that failed before.** Both sources for the search row are statements of intent — a documentation page and an SDK type. Neither is an observation. ADR-0002 decision 4 was built on exactly this class: a field documented as present, absent from every real response. **No capped search has been observed, and neither branch of `request_status` has been observed on any endpoint.** The corrected row says what Notion documents. It does not say what the server sends.

### 2. The correction cannot change scan behaviour, and that is a property of ADR-0006 decision 1 being right

ADR-0006 decision 1 makes the test positive: the scan checks for `request_status.type === "incomplete"` and treats absence as uninformative.

Under a positive test, a wrong **None** in the signal column is inert. The scan does not consult the table to decide whether to look for the field; it looks on every response page and reacts only when the field arrives saying `incomplete`. Had ADR-0006's table been implemented literally alongside its own decision 1, a truncated search would still have been caught.

Two consequences follow, and both are load-bearing:

1. **No code path needs revision.** There is no scan code yet, and when there is, decision 1 covers this endpoint already.
2. **If search never emits the field in practice, behaviour is identical to ADR-0006's table.** The positive test simply does not fire, and search degrades to the block-children case. The correction has no downside branch.

The error was contained by a design decision made for a different reason. That is worth noticing, and it is not a reason to relax the method rule in decision 4 — the containment was luck relative to the error, not a defence against it. A negative asserted in a table that *did* gate behaviour would have shipped.

### 3. The coverage consequence is real but conditional, because search has no declared role in the v0.1 scan

The issue reporting this error stated that the correction improves the coverage story: a truncated search becomes a reportable gap rather than a silent one. That is true of the endpoint. **It does not reach the v0.1 product, because no document in this repository gives `POST /v1/search` a role in a scan.**

Every design surface was opened before this was written:

- **ADR-0002** examined search and rejected it. Findings 1–3 rule it out as a grant-enumeration instrument; the decision makes the operator supply the denominator.
- **CONTEXT.md** defines a declared root as a resource the operator names in configuration. Nothing discovers roots.
- **PRODUCT.md** states the general rule: the coverage manifest can only name what the operator declared or what the tool successfully enumerated.
- **The four shipping rules** — `SYS001`, `REF001`, `REQ001`, `UNQ001` — all work downward from declared roots. Issue #18's hydration map enumerates their fetch depths as data-source metadata, page properties, block children and nested block content. Search is not among them.
- **The 2026-08-17 proof run** called `POST /v1/data_sources/{id}/query` and `GET /v1/blocks/{id}/children`. It did not call search.

So the corrected row is accurate and currently unexercised. The honest statement of the consequence is conditional:

> **If** a scan calls `POST /v1/search`, a truncated search is detectable, and the resulting gap is reportable with the cause `result_limit_reached` carrying `incomplete_reason` verbatim, exactly as decision 1's table prescribes for the data-source endpoint. **Whether v0.1 calls search at all is undeclared**, and this ADR does not decide it.

**This ADR asserts no negative about search's role.** It asserts that the five design surfaces above are silent, having opened all five. Silence is what produced the error this ADR corrects, and it is not being re-used as evidence here.

The question is filed rather than answered, because it is a scope decision with a product surface — root discovery is an onboarding affordance, and ADR-0002 made the denominator operator-supplied for reasons that bear on it.

### 4. A negative about an endpoint requires that endpoint's own reference page

Adopted as a standing method rule, at the same tier as the citation-hazard rules:

1. **A per-endpoint claim requires the per-endpoint page.** A shared envelope or overview page is not evidence about an endpoint it does not name. In this API the shared pagination page is known to under-describe at least two endpoints.
2. **Absence of a field from a documentation page is not absence of the field.** It is *not checked* until the endpoint's own reference is opened, and it stays *not observed* until a response shows it.
3. **Grep `docs/research/` before asserting a factual table in an ADR.** The repository's own research is a primary check and it is cheap. It would have caught this in one command, and it would have returned two files.

Rule 3 is the one that fires soonest and it is the one currently unenforced. Per the layer-placement rule, a discipline that must fire cannot depend on remembering it. Whether it becomes a hook or stays a written rule is a process decision, filed separately.

### 5. ADR-0006's central finding survives, and its evidence is now stronger than when it was written

ADR-0006's largest claim is that `GET /v1/blocks/{id}/children` — the traversal spine of the scan — carries no truncation signal, so a truncated child list is indistinguishable from a complete one.

When ADR-0006 was written, that claim rested on documentation silence: the same inference that failed on the search row. It now rests on a positive fact. PR #711 threads `request_status` through seven named response types — `ListCommentsResponse`, `QueryDataSourceResponse`, `ListFileUploadsResponse`, `SearchResponse`, `ViewQueryResponse`, `ListDatabaseViewsResponse`, `GetViewQueryResultsResponse` — and **`ListBlockChildrenResponse` is not among them.** An SDK that enumerates seven types and omits the eighth is a statement about the eighth, not a silence about it.

The finding is unchanged. The evidence under it changed class, from unchecked silence to an enumerated omission, in the same pass that refuted the row above it.

### 6. What this ADR does not change

- **ADR-0006 decisions 1, 3, 4, 5 and 6 stand.** The positive test, the ruling that an absent `request_status` maps to `sufficient` with no fourth value, the cap-proximity lower-bound trip, the per-run disclosure and the version pin are all unaffected.
- **Decision 4's exclusion of search from the cap-proximity trip stands, on its stated reason.** That trip compares a terminal count against a *documented cap constant*. Search has a signal and no documented cap, so there is nothing to compare against. Decision 4's sentence — *"neither has a documented cap constant to compare against"* — remains true of search after this correction. Do not read a signal as a cap.
- **Decision 5's disclosure content changes only for runs that call search.** The disclosure names the endpoint families a run used and which of those carried a signal. A run that does not call search produces an unchanged disclosure. If a run does call search, it moves from the blind list to the signalled list.
- **ADR-0006 is not edited, and neither is the checkpoint archive.** The refuted row stands where it was written. `.claude/state/checkpoint-archive.md` carries a copy of the same table as a dated record of what was believed on that date; it is a record, not an assertion, and it is left alone.

## Consequences

**Gained.** One documented signal the product was not going to look for is now on the table. It costs nothing to use, because decision 1 already looks for it everywhere.

**Gained, and larger than the correction.** The block-children finding — the product's most expensive limitation — moved off the inference method that failed here and onto an enumerated omission in an SDK. The audit that broke one row strengthened the row that matters.

**Paid: a second contradiction between an ADR and `docs/research/` in two days.** Both were the same shape — an ADR asserting a fact the research had already recorded correctly. Two occurrences with one shape is a pattern with a cheap mechanical defence, and the defence is not yet installed.

**Paid: the corrected row rests on the evidence class that failed in ADR-0002 decision 4.** Documentation plus an SDK type, with no observation behind either. This is stated in decision 1 rather than buried, and the positive-test design in decision 2 is what makes it safe to adopt anyway.

**Rejected by consequence.** Any use of the ~11,200 figure as a cap constant. Any cap-proximity trip on search. Any claim that v0.1 detects truncated search, in a report or in demand-test material, before search has a declared role and a capped response has been seen.

**Evidential standing.** The two primary sources for the search row were fetched directly while drafting this ADR, not carried over from the issue that reported the error — the error being corrected was itself caused by trusting a page that had not been opened. The commit ordering in the Context section is from `git merge-base --is-ancestor` and the committer timestamps, not from document front-matter. The claim in decision 3 that five design surfaces are silent on search's role was made by opening all five and is listed so it can be falsified by naming a sixth.

**Citation hazard, unchanged.** ISO 19011 and ISA 705, referenced through ADR-0005, were read from unauthorised copies. Cite by clause; publish no URL.

## Decision status

Every decision here is a factual correction or a method rule, and both are revisable on evidence. None is a values decision.

- **Revisable with new evidence — decision 1's table.** *Revisit if:* any condition in the Revisit-if section below fires.
- **Revisable with new evidence — decision 3's conditional framing.** *Revisit if:* a design surface not listed there assigns search a role, or a decision assigns it one. Naming a sixth surface falsifies the enumeration; it does not require re-deriving the row.
- **Revisable with new evidence — decision 4's method rules.** *Revisit if:* the mandatory grep in rule 3 is installed as a hook, in which case rule 3 moves to the enforcement layer and this ADR should say so.
- **Non-negotiable — ADR-0006 is not edited, and neither is any accepted ADR.** This is a standing project constraint and a superseding ADR is the only instrument. It is not reopened by better evidence about its content.

## Revisit if

**A capped search is observed and emits no `request_status`.** This is the failure mode of ADR-0002 decision 4, repeating on a different endpoint. The scan would not break — the positive test simply would not fire — but the corrected row would be documentation-only and decision 5's disclosure would be naming search as signalled when it is blind. That is worse than the original error, because it overstates coverage rather than understating it. Until a capped search is seen, treat the row as documented-not-observed.

**`ListBlockChildrenResponse` gains `request_status` in a later SDK release, or the shared pagination page starts documenting the field.** Either dissolves ADR-0006's central finding, this ADR's decision 5, and most of `PRODUCT.md`'s stated coverage boundary. Re-check on any Notion API changelog entry touching pagination.

**A third contradiction is found between an ADR and `docs/research/`.** Two is a pattern; three settles that the drafting step needs enforcement rather than a written rule. At that point rule 3 in decision 4 becomes a pre-commit or PreToolUse check on ADR files, not a discipline someone remembers.

**`POST /v1/search` is given a declared role in the scan.** Decision 3's conditional becomes unconditional, decision 5's disclosure gains a real branch, and the ~11,200 wall becomes a reportable gap in a shipped product rather than a property of an endpoint the product does not call.

**`request_status: {"type": "complete"}` is observed on any endpoint.** Unchanged from ADR-0006's second Revisit-if, restated because this ADR adds an endpoint to the set where it could appear. Neither branch has been seen anywhere.
