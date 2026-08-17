# ADR-0010: Baseline matching is a hierarchy of matchkeys over a resource anchor, not an equivalence relation over fingerprints

- **Status:** Accepted
- **Date:** 2026-08-17
- **Supersedes:** ADR-0008 decision 6 — its matching rule and its key-composition table. ADR-0008 decisions 1, 2, 3, 4, 5 and 7 stand and are unchanged, and decision 6's four SARIF constraints and its two-hazard analysis are retained verbatim below. **ADR-0008 is not edited.**
- **Restores:** ADR-0003 decision 1, which ADR-0008 decision 6 drifted from without saying so. Finding identity is Notion's native object ID — SARIF's `correlationGuid` architecture — and `partialFingerprints` carries "only the within-object discriminator — which property, which occurrence."
- **Corrects:** three glossary rows in `CONTEXT.md`, in place, per the living-document carve-out. **Fingerprint** read "two findings are the same finding when any one key matches" and now states the two layers. **Baseline** read "a map of partial fingerprints, an evidence digest, and the (rule, resource) pair it anchors to" and now names the three parts as disjoint, which is decision 6's substance. **Matchkey hierarchy** is new. The refuted sentence stands in ADR-0008, which is **not** edited. It is **not** in `docs/inputs/prd-2026-08-16.md` — it entered the project with ADR-0008 and reached exactly two surfaces, both named here.
- **Closes:** issue #31, including its third *Revisit if* — *"Entity-resolution literature offers a better standard answer… none of it was consulted."* It has now been consulted. It confirms the filed fix and adds one constraint the fix was missing.
- **Evidence:** `docs/research/static-analysis-prior-art.md` §1 (SARIF §3.27.2's three architectures, Appendix B) and §SonarQube (the tiered matching algorithm); ADR-0003 decision 1; ADR-0008 decisions 1 and 6. Fetched directly while drafting: Wray (2024) on hierarchical matchkeys, the NCBI record-linkage overview, and Binette & Steorts (2022) on transitive closure. Locators in *Evidential standing*.

## Context

Issue #31 reports that ADR-0008 decision 6 defines finding identity with a relation that is not an equivalence relation:

> **"Adopted: a baseline entry stores a map of partial fingerprints, and two entries are logically identical when any one key matches."**

"Logically identical" names an equivalence relation. Any-one-key-matches is reflexive and symmetric and **not transitive**. With the two keys decision 6 specifies:

```
A = (pagePropertyId = x, pagePropertyName = y)
B = (pagePropertyId = x, pagePropertyName = z)
C = (pagePropertyId = w, pagePropertyName = z)

A ~ B   share pagePropertyId
B ~ C   share pagePropertyName
A ~ C   FALSE — no shared key
```

Both completions of that relation are defects. Take the transitive closure and A, B and C become one baseline entry, so accepting one finding silently accepts two unrelated ones. Do not take it and the result depends on the order entries are visited, which violates ADR-0004, whose whole subject is determinism.

The issue is correct, and it is the smallest of four defects in decision 6. The other three were found while drafting this ADR, and all four have one root cause.

### Three more defects, and they are the same defect

**1. Decision 6 contradicts ADR-0003 decision 1, the anchor ADR.** ADR-0003 decided that finding identity is Notion's native object ID — the SARIF `correlationGuid` path, for systems that "denote each equivalence class with an arbitrary unique identifier… not calculated from information stored in the result" — and that `partialFingerprints` carries **only** the within-object discriminator. Decision 6's table makes each key a *"complete identity candidate"* composed of rule ID, page ID, a property identifier, and the normalized observed value. That is the `fingerprints` path, which ADR-0003 examined and rejected on the stated grounds that content hashing is a workaround for the absence of stable IDs and Notion does not have that absence. The drift is not argued anywhere; ADR-0008 does not cite ADR-0003 decision 1 at all.

**2. Putting the observed value inside the key makes `updated` unreachable.** ADR-0008 decision 1 defines two states that differ only by evidence:

| State | Definition, ADR-0008 decision 1 |
| --- | --- |
| `unchanged` | "Matches a baseline entry; the evidence digest is equal." |
| `updated` | "Matches a baseline entry; the evidence digest differs." |

Both of decision 6's keys contain the normalized observed value, and the observed value is evidence — `CONTEXT.md` principle 2 requires a rule to name "object, location, observed value, expected value." So when the observed value changes, *both* keys change at once, the finding matches nothing, and it is reported as `new` while the baseline entry falls to `unverified` or `resolved`. `updated` is unreachable in exactly the case its own remedy column describes: *"the debt you accepted is not the debt you have."* The state survives only for a change of expected value or location, which for four rules is close to empty. ADR-0008 decision 1's Revisit-if predicts this outcome as an empirical possibility — *"`updated` never separates from `unchanged` against a real workspace"* — without noticing that decision 6 guarantees it by construction.

**3. The v1 key table covers two of the four shipping rules.** Both keys are property-composed. `REF001` findings are about a hyperlink whose target is unreachable, and neither key names a link or a target; `SYS001` findings are about a resource that was never evaluated, and neither key names a cause. Under decision 6 as written, two broken links on one page produce two identical fingerprint maps and are indistinguishable. `REF001` is the rule `CONTEXT.md`'s settled defaults call "the load-bearing coverage mechanism" after the 2026-08-17 proof run.

**Corroboration from a source with no authority, noted because it is unanimous.** `docs/inputs/prd-2026-08-16.md` is an input and never overrides this repository. Its fingerprint composition reads *"Rule, resource, location, and normalized evidence **selector**"* — rule and resource are the anchor, location and selector are the discriminator, and a selector names *which* evidence rather than carrying its value. The two-layer shape and the value exclusion were both in the seed document. ADR-0003 decision 1 then decided them. ADR-0008 decision 6 departed from both without citing either.

**The root cause of all four is one decision.** Decision 6 loaded whole identity into the fingerprint map. Once each key must carry the entire identity, the key must contain the page ID (so the map cannot be scoped to a resource), must contain the evidence (so `updated` collapses), must be combined with some multi-key policy (so a non-transitive relation appears), and must be re-composed per rule family (so rules with no property are unrepresentable). Return the map to the discriminator role ADR-0003 assigned it and all four disappear together.

### What the field calls this problem

The instrument being specified is a matcher between two sets of records under unstable keys. That is deterministic **record linkage**, and the technique this ADR adopts has a name, a literature and an evaluation.

The canonical shape is the **stepwise** or **hierarchical matchkey** algorithm. The NCBI record-linkage overview states the general form under "Deterministic Linkage Methods":

> "In a multiple-step strategy (also referred to as an iterative or stepwise strategy), records are matched in a series of progressively less restrictive steps in which record pairs that do not meet a first round of match criteria are passed to a second round of match criteria for further comparison."

Wray (2024), evaluating matchkey ordering at the UK Office for National Statistics, states the constraint that issue #31's proposed fix does not have:

> "Deterministic hierarchical matchkeys are a linkage technique that applies a list of conditions to classify links, **where records can only be linked once.**"

> "The aim of the hierarchy is to classify correct links by running higher precision matchkeys first, **removing linked records from the matching pool**, and then running lower quality keys so that they are less likely to make incorrect links."

Two findings follow.

**The filed fix is right and is the field's standard answer.** #31 proposed priority-ordered probing, derived from first principles in one sitting, and flagged that the literature had not been consulted. It had independently reconstructed hierarchical matchkeys, including the ordering rationale — highest precision first.

**The filed fix is missing one-to-one.** #31 specifies at most one *baseline entry* per finding. It does not specify at most one *finding* per baseline entry. Without pool removal, two produced findings can both claim the same baseline entry, and the second one's state depends on whether the implementation notices. Wray's pool removal closes it, and it closes the residual case #31 raised — two baseline entries matching on different keys — as a side effect rather than as a special rule.

**And the closure branch has a name.** Binette & Steorts (2022) state the requirement that any-one-key-matches fails:

> "Generally, any linkage that does not satisfy transitive closure is impossible—knowing that *a* links to *b* and that *b* links to *c* should entail that *a* also links to *c*."

A relation that is not transitively closed does not partition the findings, so it cannot define identity. The literature's name for the damage done by closing it anyway is **over-merging**, and it is an active research problem rather than a solved one — which is a sufficient reason not to make a baseline depend on solving it.

One structural confirmation was already in this repository and was not used. `static-analysis-prior-art.md` §SonarQube records that rename detection "runs **first**, as a separate file-identity step," after which the algorithm matches issues *within* a file by numbered tiers, strongest evidence first. The same file states the lesson in one sentence: *"file identity and finding identity are separate problems and should be solved separately."* Decision 6 solved them together.

## Decision

### 1. Finding identity has two layers, and they are resolved in order

**Layer 1, the anchor: the pair (rule ID, resource ID), where the resource ID is Notion's native object ID.** It is not hashed and not composed with any content. This is ADR-0003 decision 1 restored and SARIF §3.27.2's second architecture. The anchor partitions produced findings and baseline entries into buckets.

**The ID is normalized to one canonical string form on ingest, and this is a correctness requirement rather than a tidiness one.** `notion-api-documented.md` §6, "ID stability", records that Notion returns database IDs hyphenated and accepts both forms — *"You may use either the hyphenated or un-hyphenated ID when calling the API"* — and names the consequence directly: *"That last point is a direct byte-stability hazard. The same logical ID has two valid string forms… must be normalized on ingest, or identical workspaces will produce non-identical output."* An ID reaching the anchor from an operator's config, a pasted URL and an API response can therefore be three strings for one page, producing three buckets for one resource and reporting every finding on it as `new`. **The canonical form is hyphenated UUIDv4**, because that is the form the API returns. Normalization is form-only: it changes the string, never the identity, so this does not reintroduce content into the anchor.

**Layer 2, the discriminator: a matchkey hierarchy, run only inside one bucket.** It answers *which finding of this rule on this resource*, and nothing else. This is what `partialFingerprints` carries.

Matching never crosses a bucket. Under ADR-0008 decision 6, cross-page collision was prevented by every key remembering to include the page ID; here it is impossible by construction, and a future key cannot reintroduce it by omission.

**One consequence is worth stating on its own: the untested assumption is now isolated in one field.** ADR-0008 decision 7 records that page-ID stability across a move is **documented-silent and unobserved**. Under decision 6 that assumption was smeared across both keys. Here it sits in the anchor alone, so the experiment that settles it — proof-question item 3, page ID under duplicate and move — tests exactly one field of the design. ADR-0008 decision 7 is unchanged: the kill criterion is **not triggered, not cleared, untested**, and this ADR does not clear it.

### 2. The hierarchy is run as ordered passes over sets, not as a probe per finding

For an ordered key list `k₁ … kₙ`, for `i` from 1 to `n`: compute `kᵢ` for every still-unmatched produced finding and every still-unmatched baseline entry in the bucket, join on exact equality, and record the matched pairs. Then move to `kᵢ₊₁` with the matched pairs removed.

The pass form is adopted over #31's per-finding probing because it is strictly more deterministic. A pass is a set join, so the outer loop has no visiting order to depend on. Order-dependence survives only inside a single pass, between findings whose value for that one key is *equal*, and decision 5 makes that total.

Ordering is by precision, highest first, per Wray (2024). An ID key precedes a name key: an ID is exact, and a normalized name can collide between two properties on one page — which is the case that generates issue #31's middle element `B`.

### 3. Matching is one-to-one, and a matched entry leaves the pool

A produced finding matches **at most one** baseline entry. A baseline entry matches **at most one** produced finding. Both leave the pool at the moment they match and are invisible to every later pass.

Terminal states follow without further rules, and they agree with SonarQube's:

- A finding unmatched after pass `n` is **`new`**.
- A baseline entry unmatched after pass `n` goes to ADR-0008 decision 5 — **`resolved`** only if its (rule, resource) pair reached `evaluated`, otherwise **`unverified`**, and it is retained.
- A matched pair is **`unchanged`** or **`updated`** by ADR-0008 decision 1's evidence-digest test.

The residual case #31 asked to have stated explicitly is now automatic. If two baseline entries would match one finding on different keys, the higher-precision pass claims one and removes it; the other stays in the pool with nothing left to match and falls to decision 5. That is a stated outcome reached by the general rule, not an exception to it.

### 4. Taking the transitive closure is prohibited

No implementation may cluster findings by chaining matches, compute connected components over match pairs, or merge two baseline entries because a third finding matched both. There is no closure to take — decision 2 produces an assignment, not a relation — and this decision exists so that a later optimisation cannot quietly reintroduce one.

The failure this forbids is over-merging: one accepted finding silently accepting unrelated debt on the same resource. In a linter that is worse than a missed match, because a missed match is loud (a `new` finding fails the run) and an over-merge is silent. It is the repository's own defect class — a system reporting success over an unverified state.

### 5. Ties inside a pass are broken by a published total order

Two findings in one bucket can hold equal values for one key. Pool removal makes the pairing observable, because the two may carry different evidence digests and therefore different states.

**Within a pass, findings and baseline entries with equal key values are paired by ascending occurrence index.** Surplus findings fall through to the next pass; surplus baseline entries stay in the pool. The occurrence index is the finding's ordinal within its bucket under a **published total order that each rule specifies with its key family**. A rule whose ordering is not total does not ship — an unspecified tie-break is an ADR-0004 violation that will only appear on a workspace nobody tested.

The index is a tie-break, never a key. Semgrep appends the ordinal to its `match_based_id` and pays for it: `static-analysis-prior-art.md` §Semgrep records that identity then "survives motion but not insertion of a sibling match earlier in the file." Confining the index to ties keeps that failure out of identity.

### 6. The observed value is evidence, not identity

No matchkey contains the observed value, the expected value, or any other component of the evidence. The evidence digest of ADR-0008 decision 1 is the only place evidence enters the baseline.

This is what makes `updated` reachable. Worked through `SYS001`: a coverage gap on one page whose cause changes from *share revoked* to *request budget exhausted* keeps its anchor, matches its baseline entry, and reports `updated` — "the debt you accepted is not the debt you have." Under decision 6 the same event produced a `resolved` entry and a `new` finding, which reports a repair that did not happen. That is the failure ADR-0008 decision 5 was written to prevent, arriving through the fingerprint instead of through the coverage manifest.

The mirrored constraint: a rule may not put an identity component in the evidence digest alone. Identity and evidence are disjoint and both are complete.

### 7. Key list, version 1, for the four shipping rules

Anchor is `(rule ID, resource ID)` throughout. `n = 0` is a valid hierarchy and means the anchor alone is the identity.

| Rule | Anchored resource | Matchkey hierarchy, in order | Occurrence order |
| --- | --- | --- | --- |
| `SYS001` | The unevaluated resource | *(none — `n = 0`)* | n/a; one finding per bucket |
| `REF001` | The page containing the reference | 1. `linkTargetId/v1` — the target object ID | Target ID ascending |
| `REQ001` | The page | 1. `propertyId/v1` 2. `propertyName/v1` — normalized | Property ID ascending |
| `UNQ001` | The page | 1. `propertyId/v1` 2. `propertyName/v1` — normalized | Property ID ascending |

Three notes, because each is a decision rather than a transcription.

**`REF001` anchors on the page, not the block, and this reduces the design's unobserved assumptions rather than expressing a preference.** `notion-api-documented.md` §6 records page **and** block ID stability as documented-silent. Anchoring on the containing page makes the identity depend on the source page ID and the target object ID — two instances of one unverified assumption. Anchoring on the block would add a third. A link that moves between blocks on the same page keeps its identity, which is the churn an editor produces most often.

**`REF001` has a one-key hierarchy and that is not a defect.** There is no second axis to vary: if the target ID churns, no key composed of Notion identifiers survives. #31's first *Revisit if* anticipated the degenerate case — a single-key scheme is trivially a total function — and specifying a hierarchy rather than a pair is what lets a rule sit at `n = 1` or `n = 0` without a special rule.

**`UNQ001` is entered here under a stated assumption.** A duplicate value spans two or more pages, and this table presumes the rule emits **one finding per offending resource**, which is what ADR-0005's and ADR-0008's `(rule, resource)` pair requires throughout. If `UNQ001`'s specification instead emits one finding per duplicate *group*, that finding has no single resource to anchor to and the anchor model needs a group-level answer this ADR does not supply. **This is an open question, not a settled one**, and it belongs to the issue that specifies `UNQ001`.

### 8. Keys are appended, never inserted, and the order is part of the compatibility contract

A new key is added at the end of a hierarchy. Inserting one changes the outcome of existing matches, which changes baseline states on a workspace that did not change — an ADR-0004 violation reached through a version bump rather than through code.

ADR-0008 decision 6's four constraints are **retained unchanged and apply to every key**: keys are versioned hierarchical strings and matching uses the latest version present in both records; no page title enters a key; no parent path or ancestor chain enters a key; nothing volatile enters a key, and every key is computed over the output of ADR-0004's normalization function.

## What ADR-0008 decision 6 got right and this ADR keeps

The two-hazard analysis is retained in full and is the reason `REQ001` and `UNQ001` have two keys rather than one. A property ID survives a rename and probably does not survive a type change; a property name survives a type change and does not survive a rename. Neither identifier alone survives both, so a hierarchy of two is the minimum.

The residual hole is retained and unchanged: a property **renamed and retyped between two runs** matches on neither key. Decision 6 named it rather than designing it away, and the report still flags a baseline entry that matched no key while its page is unchanged.

## Consequences

**Gained: identity is a function, and its properties are checkable without running it.** Decision 2 produces a deterministic total assignment. Decision 3 makes it injective on both sides. Decision 4 forbids the only construction that could break either. None of that depends on a property of Notion's data that this repository has not observed.

**Gained: three defects closed by one structural change.** `updated` becomes reachable, `REF001` and `SYS001` become expressible, and ADR-0003 decision 1 stops being contradicted — all from returning the fingerprint map to the discriminator role it was assigned in the first place.

**Gained: the untested assumption is localized.** Page-ID stability is one field of one layer. The experiment that settles it is unchanged and now tests one thing.

**Paid: the baseline schema changes before it has ever been written.** An entry is an anchor, a discriminator map, and an evidence digest, and the three are disjoint. The keys named in ADR-0008 decision 6 — `pagePropertyId/v1`, `pagePropertyName/v1` — do not appear in any implementation and are replaced rather than migrated. Nothing has to be migrated, because no code exists. #31 is right that this is the cheapest moment this is ever fixable.

**Paid: matching is now specified per rule, not once.** Every new rule must declare a hierarchy and a total occurrence order before it ships. That is more specification work per rule, and it is the price of `REF001` and `SYS001` being representable at all.

**Paid: a one-to-one assignment can leave a correct match unmade.** If a higher-precision pass pairs a finding with the wrong baseline entry, the right entry is gone by the later pass. Wray (2024) accepts this trade explicitly — higher-precision keys run first precisely so that lower-quality keys "are less likely to make incorrect links." The failure is loud in this direction: an unmatched finding is `new` and fails the run.

**Rejected by consequence.** Any multi-key combination policy — any-match, majority-match, all-match. Any clustering, connected-component or union-find step over match pairs. Any matchkey containing an observed value, an expected value, a page title, an ancestor path, or an unnormalized field. Any key inserted before an existing key. Any rule that ships without a total occurrence order. Any implementation in which the pairing of two equal-keyed findings depends on iteration order.

**Evidential standing, and it is uneven.** ADR-0005 set the precedent of saying so.

- The SARIF and SonarQube facts were verified in `docs/research/static-analysis-prior-art.md` before this ADR and are cited to the repository file, per ADR-0007 decision 4.
- The three record-linkage sources were **fetched while drafting and quoted from the fetched text. None was adversarially re-verified by a second reader.** The Binette & Steorts quote was confirmed on a second independent fetch of the same page under a different prompt; the other two were not.
- **A negative, stated because absence from one page is not absence:** the NCBI overview contains **no** statement about a record being linked only once or removed from the pool. That constraint rests on Wray (2024) alone. It was checked for and is not there.
- Locators, all fetched **2026-08-17**:
  - Wray, M. (2024). "Evaluation of an Optimal Method for Ordering Hierarchical Matchkeys in Data Linkage at the Office for National Statistics." *International Journal of Population Data Science* 9(5). DOI `10.23889/ijpds.v9i5.2656`. Fetched via `http://ijpds.org/index.php/ijpds/article/view/2656`.
  - "An Overview of Record Linkage Methods," in *Linking Data for Health Services Research*, NCBI Bookshelf `NBK253312`, section "Deterministic Linkage Methods". `https://www.ncbi.nlm.nih.gov/books/NBK253312/`.
  - Binette, O. & Steorts, R. C. (2022). "(Almost) all of entity resolution." *Science Advances* 8(12):eabi8021. DOI `10.1126/sciadv.abi8021`. Quoted from the open-access copy at `https://pmc.ncbi.nlm.nih.gov/articles/PMC11636688/`, section "PROBABILISTIC RECORD LINKAGE".

**Method note: this ADR found a gap in the rule that found the defect, and the gap is a scope gap.** ADR-0007 decision 4 rule 3 requires a grep of `docs/research/` before asserting a factual table. It was run, and it returned two things ADR-0008 decision 6 needed and did not use.

- **`static-analysis-prior-art.md` §SonarQube** — the two-stage architecture and the sentence *"file identity and finding identity are separate problems and should be solved separately."* Decision 6 cites **§1 of the same file**, quotes SARIF from it at length, and does not reach the section one heading below. This is the shape `docs/agents/domain.md` calls C: indexed, present, unread.
- **ADR-0003 decision 1** — which decision 6 contradicts outright. **Rule 1's grep does not cover this and cannot**, because its target is `docs/research/`. An ADR that contradicts an *earlier ADR* is a fourth shape, and the repository's three method rules address none of it. The count in issue #25 is a count of ADRs contradicting research files; this is not one of those, and it should be recorded as its own shape rather than folded into that number.

A defect in this ADR's own drafting was caught the same way. Decision 1 was written asserting that the anchor ID is "not hashed, not normalized." Opening `notion-api-documented.md` §6 to verify an unrelated claim about block IDs returned the refutation: *"That last point is a direct byte-stability hazard. The same logical ID has two valid string forms."* An un-normalized anchor produces one bucket per string form of one page ID and reports every finding on that page as `new`. Decision 1 now carries the normalization requirement and the quote.

## Decision status

This ADR was written with **no toolchain, no source code, and no run against a live workspace.** It could not match a single finding. An implementer will be able to, and on the decisions labelled below the implementer's evidence outranks this document's reasoning.

- **Not revisable on evidence — decisions 2, 3, 4.** These are properties of a function, not claims about Notion. New evidence about the API cannot make a non-transitive relation define a partition. Reopening them requires an argument, not an observation.
- **Revisable with new evidence — decision 1's canonical ID form.** *Revisit if:* any endpoint the scan calls is observed returning un-hyphenated IDs, or returning a third form. Hyphenated UUIDv4 was chosen because it is the form the documentation says the API returns, and that is a documented claim rather than an observed one. The rule that survives either way is *one canonical form, normalized on ingest*; which form is the revisable part.
- **Revisable with new evidence — decision 6's exclusion of the observed value.** *Revisit if:* a rule is specified whose findings on one resource are distinguishable **only** by their observed values — a single page holding two duplicate values under one `UNQ001` property is the candidate. That rule needs a value-derived key, and it then loses `updated` for value changes. The correct response is to state the loss in that rule's specification, not to reopen decision 6 globally.
- **Revisable — decision 8's append-only rule, which is incomplete as written.** It says how to add a key and says nothing about **removing** one. A key that is merely superseded can stay; a key that produces *wrong* matches must go, and removing it changes existing match results exactly as inserting one does. *Revisit if:* a shipped key is found to mismatch. The removal procedure is unspecified today and this is the notice that it is missing, not an argument that it is unnecessary.
- **Revisable with new evidence — decision 7's key list.** *Revisit if:* a property ID is observed surviving a type change. `REQ001` and `UNQ001` then collapse to `n = 1`, `propertyName/v1` is dropped rather than reordered, and the two-hazard analysis this ADR retains is obsolete. The experiment is already specified and `TYPE_CHANGE_PROP` is already set.
- **Revisable with new evidence — decision 7's `REF001` anchor.** *Revisit if:* block IDs are observed stable across a move while page IDs are not, or the reverse. The anchor should sit on whichever identifier the evidence supports.
- **Revisable with new evidence — decision 5's tie-break.** *Revisit if:* a real workspace produces no bucket with two equal-keyed findings across several runs, in which case the occurrence order is specification carrying no traffic. Absence over a few runs is not proof it cannot happen, so the requirement stays until it is measured.
- **Open, and deliberately not decided here — `UNQ001`'s emission granularity.** Decision 7 records the assumption. The rule's own specification settles it, and if it emits per group the anchor model needs an answer this ADR does not contain.
- **Unchanged — ADR-0008 decision 7.** The kill criterion in `PRODUCT.md` is **not triggered, not cleared, untested.** Nothing in this ADR clears it, and the two named experiments still settle it.
