# ADR-0008: Exit status is a priority signal over two axes, and `resolved` is a coverage claim the baseline must earn

- **Status:** Accepted
- **Date:** 2026-08-17
- **Implements:** ADR-0005 decision 4, which moved the run-failure decision off the per-rule outcome and onto the report disposition and the coverage ratio without saying what the resulting byte is. **Generalises** ADR-0002 decision 2 — exit `2` keeps its number and widens from *unreachable declared root* to *disclaimed disposition*, which ADR-0005 decision 3 already established as the general form of the same condition.
- **Supersedes:** nothing. No ADR is edited.
- **Corrects:** the glossary entry for **Baseline** in `CONTEXT.md`, which reads "a set of accepted finding fingerprints". A set of fingerprints cannot express `updated`, cannot survive an identifier change, and cannot distinguish a fixed finding from an unread one. Corrected in place, per the living-document carve-out. The same sentence stands in `docs/inputs/prd-2026-08-16.md`, which is a dated input and is **not** edited.
- **Evidence:** `docs/research/static-analysis-prior-art.md` §1 (SARIF `baselineState`, `partialFingerprints`, Appendix B), §2 (ESLint suppressions, PHPStan baseline, OWASP `until`); `docs/research/notion-api-documented.md` §6 and its documented-silence index; `docs/research/notion-api-practice.md` §7.1–7.5; `docs/research/coverage-artifact-prior-art.md` §82–85. Fetched directly while drafting: the `fsck(8)` exit-status section, the pytest exit-code reference, the ESLint CLI exit codes, the `grep(1)` exit status, the `rsync(1)` exit values, the Semgrep CLI reference, and POSIX Shell Command Language §2.8.2.

## Context

Issue #20 states the problem correctly: exit status now has two inputs and their composition is specified nowhere. It is right about that. Two of its premises did not survive drafting, and both changed the design.

### The four states in the issue are not four values of one thing

#20 names the finding states `new`, `existing`, `resolved`, `suppressed`, and adds a constraint that `resolved` must stay distinct from `suppressed`.

The constraint is right and it understates the problem. **`suppressed` is not a baseline state.** SARIF settles this in its schema, and the fact was already in this repository: `baselineState` is a four-value enum — `new`, `unchanged`, `updated`, `absent` — and suppression is a separate `result.suppressions[]` object carrying `justification`, a `status` enum of `accepted`/`underReview`/`rejected`, and a `kind` of `inSource`/`external`. The two are orthogonal. A finding is in some baseline state *and* is or is not suppressed.

Put in one enum, the two axes cannot both be expressed: a suppressed finding that is also new becomes inexpressible, and that is the combination an operator most needs to see. This is the third time this project has found an enum mixing two axes — ADR-0003's outcome enum was the first, corrected by ADR-0005 decision 1; ADR-0005 decision 2's `inapplicable` was the second. The shape is now familiar enough to check for deliberately.

### Keying the exit code on the disposition would make the baseline inert

ADR-0005 decision 3 defines `unqualified` as **"Every rule is `sufficient`, and every rule `conforms`."** That is two clauses, and the second is a conformity clause. A single baselined violation makes some rule `violates`, which downgrades the report to `qualified`.

So an exit contract that keys on the disposition fails every run on a workspace with accepted debt, forever. That directly contradicts the settled default in `CONTEXT.md`: *a baseline reports old debt and fails only on new findings*. The two inputs #20 calls independent are not independent as written — findings reach the exit byte twice, once through the baseline and once through the disposition's conformity clause.

The resolution is in decision 2 below: **the exit contract reads the disposition's sufficiency clause and ignores its conformity clause.** Conformity reaches the exit byte only through the baseline.

### What one byte can carry

The exit status is a POSIX byte. §2.8.2 of the Shell Command Language reserves `127` for command-not-found, `126` for found-but-not-executable, and "greater than 128" for termination by signal. The usable space for a tool's own meanings is small and its top is not ours.

Five tools were read for how they spend it, chosen because each solves one part of this problem:

| Tool | What it does with the exit byte | What it teaches |
| --- | --- | --- |
| `fsck(8)` | A bit mask: `1` corrected, `2` reboot needed, `4` uncorrected, `8` operational, `16` usage, `32` cancelled, `128` shared-library. Multiple filesystems combine by "the bit-wise OR of the exit statuses". | The only surveyed tool that composes independent axes into one byte. Its own manual calls the result both "the sum of the following conditions" and a bit-wise OR, and it spends bit 7 at `128`, on the edge of the signal range. |
| `pytest` | `5` means "No tests were collected", distinct from `1` "some of the tests failed" and `2` "interrupted by the user". | The empty evaluated set gets its own code. Running nothing is not passing. |
| `rsync(1)` | `23` "Partial transfer due to error" and `24` "Partial transfer due to vanished source files", both distinct from `1` syntax error and from `0`. | Partial completion is its own class of outcome, and it is split by cause. |
| `eslint` / `grep(1)` | `2` is "a configuration problem or an internal error" (ESLint) and "an error occurred" (grep). | The ecosystem convention: `2` means the tool could not do its job. |
| `semgrep` | Findings exit `0` unless `--error` is passed. Repo research records the same shape in dbt: `skipped` carries zero verdict weight, and skipping without an upstream error exits `0`. | The field's default is to not fail on what it found. This product's default is the opposite, and that is the wedge. |

One of these is a warning rather than a model. `grep(1)` documents that with `-q`, "the exit status is 0 even if an error occurred." A success code that outlives a read failure is Non-goal 4 of `CONTEXT.md` — *hiding access gaps inside a passing result* — shipped by one of the most-used programs in the world, deliberately, for a defensible reason. It is the exact byte this product exists not to emit.

## Decision

### 1. The finding model is two axes, not one enum

**Axis A — baseline state.** Five values. Taken from SARIF's four with one split, explained in decision 3.

| Value | Condition | Operator's action |
| --- | --- | --- |
| `new` | The finding's fingerprint matches no baseline entry. | Fix it, or accept it into the baseline. |
| `unchanged` | Matches a baseline entry; the evidence digest is equal. | None. This is accepted debt. |
| `updated` | Matches a baseline entry; the evidence digest differs. | Re-read the acceptance. The debt you accepted is not the debt you have. |
| `resolved` | No longer produced, **and** the (rule, resource) pair reached the manifest's `evaluated` stage. | Remove the entry from the baseline. |
| `unverified` | No longer produced, and the (rule, resource) pair did **not** reach `evaluated`. | Restore access or re-select the rule, then re-run. Do not remove the entry. |

**Axis B — suppression.** A finding is suppressed or it is not. A suppression carries a reason and an expiry, per Principle 5 and the glossary. Expiry is mechanical: OWASP Dependency-Check's `until` attribute is the only shipped implementation the sweep found, and it is trivial to copy. An expired suppression stops applying and the finding returns at whatever baseline state it holds.

The axes are reported together and never merged. `new` + suppressed is a real and important combination: a defect the operator pre-accepted before it existed.

### 2. Exit status is a priority signal over two axes, and it is not a serialisation of the report

A bit mask was considered and rejected. `fsck(8)` is the only surveyed precedent for composing independent axes in one byte, and three things argue against copying it here.

- **It permits states the model forbids.** Pervasive and confined gaps are mutually exclusive. Two bits for one three-valued axis makes `pervasive | confined` representable and meaningless.
- **It re-allocates a number an accepted ADR already spent.** ADR-0002 decision 2 fixed exit `2` for an unreachable declared root. Any bit layout puts a bit, not that condition, at `2`.
- **It buys nothing that has a consumer.** The exit byte's job is to name the most urgent required action. Every consumer needing the full state — the CI gate, the SARIF exporter, the human reader — already has the report, which carries the disposition, both published ratios, and the five-stage manifest. A lossless byte would duplicate the report badly and would still be lossy.

**Exit status is therefore a total order over conditions, highest firing condition wins.**

| Code | Condition | Summary verdict rendered? |
| --- | --- | --- |
| `4` | The scan did not run as declared: usage error, invalid configuration, authentication failure, internal error. | No |
| `2` | Disposition is `disclaimed` — a declared root was never reached, or any gap is unbounded. | **No** |
| `3` | Gaps exist and are confined, and coverage is below the declared threshold. | Yes |
| `1` | At least one finding is `new` and not suppressed. Evidence is complete. | Yes |
| `0` | No new unsuppressed finding, and coverage is at or above the declared threshold. | Yes |

Precedence is `4` > `2` > `3` > `1` > `0`. Numeric value is deliberately **not** monotonic with severity, because ADR-0002 fixed `2` and reshuffling to buy an ordered ladder would change nothing an operator does — the governing design rule of ADR-0005 excludes it.

Two properties of this table are load-bearing and both look wrong at first reading.

**Evidence outranks findings.** A run with confined gaps exits `3` even when it also produced new findings. This is ISA 705's structure: a scope limitation qualifies the whole opinion irrespective of what was found, because a finding set drawn from an incomplete scan is itself provisional. The new findings are still in the report and still fail the build; the byte names the condition that bounds the rest.

**A `qualified` report can exit `0`.** When every violation is accepted debt and no gap exists, the disposition is `qualified` — a violation was found — and the exit code is `0`. The exit code is not the disposition and must never be documented as one. The disposition is an evidentiary statement about the report; the exit code is an action signal keyed to the baseline. This is the settled default working exactly as written.

**The invariant that makes exit `0` trustworthy:** exit `0` asserts two things and no others — no new unsuppressed finding, and coverage at or above the declared threshold. No third condition may ever produce `0`.

### 3. The exit contract reads the sufficiency clause, never the conformity clause

ADR-0005 decision 3's `unqualified` has two clauses. The exit contract reads one.

| Disposition's gap condition | Exit axis |
| --- | --- |
| Every rule `sufficient` | No gap. Evidence axis clear. |
| Gaps exist and are confined | Evidence axis trips at `3`, subject to the threshold in decision 4. |
| Gaps pervasive | Evidence axis trips at `2`. Not subject to any threshold. |

Conformity reaches the exit byte only through axis A of decision 1. This is the whole content of the fix, and without it the baseline is decorative.

### 4. The coverage ratio is a tolerance the operator sets, and it can never relax a disclaimer

ADR-0005 decision 4 makes the exit status a function of the disposition **and the coverage ratio**, and keeps fail-on-gaps as the default. ADR-0005 decision 3 separately rejected a percentage threshold for pervasiveness, on the grounds that any percentage would be invented and would be computed over a denominator the scan has just admitted it cannot establish.

Both hold at once, because they are thresholds on different things.

- **Default: `--min-coverage 100`.** Any gap trips the evidence axis. This is fail-on-gaps, unchanged.
- **The operator may lower it.** ESLint's `--max-warnings` is the shape: a numeric tolerance, off by default, with the tool asserting nothing about what the right number is. Coverage at or above the operator's threshold does not trip the evidence axis.
- **Non-negotiable: a threshold cannot suppress a `disclaimed` disposition.** Pervasiveness is not a ratio. An unbounded gap has no size, so no threshold can be met or missed by it, and `--min-coverage 0` must not be a route to a green build over a scan that does not know what it missed. Exit `2` is unconditional.

The third bullet is the one that would be quietly removed by a future contributor optimising for adoption. It is the difference between this tool and `grep -q`.

### 5. `resolved` is a claim about coverage, and it is the product's own thesis turned on its own baseline

A baselined finding that stops being produced has two possible causes, and they are not the same fact:

1. The defect was fixed. The (rule, resource) pair was evaluated and produced nothing.
2. The pair was never evaluated. The page became unreachable, the share was revoked, the request budget ran out, or the operator deselected the rule.

Reporting the second as `resolved` reports repair that did not happen, and it does so in the direction that flatters the operator. Worse, it is self-erasing: the baseline shrinks because access shrank, and the record of what was accepted disappears with it.

**Therefore `resolved` may only be asserted when the (rule, resource) pair reached the `evaluated` stage of the coverage manifest.** Otherwise the entry is `unverified` and is **retained** in the baseline.

The pair, not the resource, is the unit. A rule the operator deselected did not evaluate its resources even if those resources were fetched for other rules, and ADR-0005 decision 2 already requires the report to state that a rule was not selected.

This is ADR-0005 decision 1 applied to the baseline instead of to a rule: an absence of findings is not a finding of absence, and the difference is measured by coverage. The failure it prevents is shipping. ESLint's bulk suppressions report "There are suppressions left that do not occur anymore" without establishing that the files carrying them were linted, and v9.28.0 added `--pass-on-unpruned-suppressions` one month after the discipline shipped, which silences the non-zero exit while leaving the stale entries in place.

`unverified` entries are always printed and their count is always published. They do not carry their own exit contribution, and they do not need one: when the cause is a coverage gap the evidence axis has already tripped at `3` or `2`, so a separate contribution would double-count. When the cause is a deliberate scope change the build correctly does not fail, and the printed count is the only thing standing between that and silent rot.

### 6. Identity is a map of partial fingerprints, because no single Notion identifier survives both hazards

`PRODUCT.md` carries a kill criterion: *the baseline cannot retain stable identity after normal page moves or renames*. This decision specifies the fingerprint. It does **not** clear the kill criterion, and decision 7 says why.

Two Notion facts, from this repository's research, are in direct tension:

- **A property ID survives a rename.** Confirmed by two doc admissions on the property-object reference — the saved formula "references the property by ID, so renaming the property later doesn't break the formula" — and by the one identifier-stability guarantee in Notion's entire reference, on select option IDs: "Does not change if the name is changed."
- **A property ID probably does not survive a type change.** Documentation is silent, no practitioner report exists either way, and the standing prior in `notion-api-practice.md` §7.2 is that a type change destroys and recreates the property, minting a new ID.

So an ID-keyed fingerprint breaks on a type change, and a name-keyed fingerprint breaks on a rename. Neither identifier alone survives both.

SARIF solves this and the solution is already quoted in `static-analysis-prior-art.md` §1. `partialFingerprints` is a **map**, and the consuming system decides how to combine: "it might decide that two results are logically identical if any one of their partial fingerprints match, or only if a majority of them match, or only if all of them match."

**Adopted: a baseline entry stores a map of partial fingerprints, and two entries are logically identical when any one key matches.** Version 1 emits two keys, each a complete identity candidate with one axis varied:

| Key | Composition | Survives | Breaks on |
| --- | --- | --- | --- |
| `pagePropertyId/v1` | rule ID, page ID, property ID, normalized observed value | rename | property type change |
| `pagePropertyName/v1` | rule ID, page ID, normalized property name, normalized observed value | property type change | rename |

Both hold the page ID, so no cross-page collision is possible under any-one-matches. Both break only when a property is renamed and retyped between two runs; that residual hole is named here rather than designed away, and the report flags a baseline entry that matched on neither key but whose page is unchanged.

Four constraints carried from SARIF's Appendix B and its issue tracker, all already verified in the repo:

1. **Keys are versioned hierarchical strings.** Matching uses "the latest version of the fingerprint available in both results", which builds algorithm migration into the identity format instead of into a migration script.
2. **No page title enters any key.** A title changes on rename and is the field an editor is most likely to touch. This also aligns with the settled default that CI output redacts titles.
3. **No parent path or ancestor chain enters any key.** SARIF issue 122 records that path components make fingerprints non-portable and cannot be un-mixed from an already-computed hash. A Notion page's ancestor chain changes on exactly the move this must survive.
4. **Nothing volatile enters any key.** Determinism is defined against the normalization function of ADR-0004, and the fingerprint is computed over its output.

A baseline entry therefore stores: the partial-fingerprint map, an evidence digest for the `unchanged`/`updated` split, and the (rule, resource) pair the `resolved` guard of decision 5 tests. This is what corrects the glossary.

### 7. The kill criterion is untested, not cleared, and two named experiments settle it

This ADR specifies a fingerprint whose stability rests on two assumptions that **no observation in this repository supports**.

- **Page and block ID stability across a move.** `notion-api-documented.md` §6 records this as documented-silence 8: page, block, database, data-source, user and property IDs across move / rename / archive / restore / duplicate are all **DOCS SILENT**. The practitioner evidence is `notion-api-practice.md` §7.5 — *"I found no reports of page, block, or database IDs changing across moves"* — which is a **negative search result, not an observation of stability**. The one corroborating quote in §7.4 concerns the 2025-09-03 data-source migration, which is a platform event, not a page move. By ADR-0007 decision 4 rule 2, this is *not observed*, and it stays not observed until a response shows it.
- **Property ID survival across a type change.** Open. Proof question 2, `TYPE_CHANGE_PROP` already set in `.env`, and `notion-api-documented.md` §651 item 2 specifies the run: create a property, record its `id`, change its type, re-read the schema.

The test for the first is already specified too, as item 3 of the same list: page ID under duplicate and move.

**The kill criterion's status is therefore: not triggered, not cleared, untested.** Decision 6's two-key design is the mitigation that makes it survivable if either assumption fails singly. It does not survive page-ID churn, because a page-ID change is an identity change and no key in the map is independent of it.

This ADR was drafted to assert page-ID stability as a settled property of UUIDs. The grep required by ADR-0007 decision 4 rule 3 returned `notion-api-documented.md` §596, which refutes it. That rule has now fired usefully once, which is the third data point its own Revisit-if was waiting for.

## Consequences

**Gained.** The exit byte is specified, every value is reachable, and exit `0` carries a stated two-part invariant that a reader can check a future implementation against. The disclaimed code was forced rather than chosen: ADR-0005 decision 3 named condition (a) as the general form of ADR-0002 decision 2, so `2` widened to the disposition without touching ADR-0002's number.

**Gained, and larger than the exit table.** The `resolved` guard closes a self-erasing failure in the baseline that is shipping in ESLint today, and it closes it by re-using the coverage machinery the product already has. The product's central claim — *nothing was wrong in what I read, and here is what I did not read* — now also governs the product's memory of itself.

**Paid: the baseline file is no longer a list of hashes.** Each entry carries a fingerprint map, an evidence digest, and a (rule, resource) anchor. It is bigger, it is harder to hand-edit, and it needs its own schema and its own migration story. The versioned keys are the migration story; that is why they are in decision 6 rather than deferred.

**Paid: five baseline states and a separate suppression axis is a lot of vocabulary for a v0.1 with four rules.** This is the same disproportion ADR-0005 accepted and for the same reason. `withdrawn` was drafted as a sixth state, for a pair deliberately removed from scope, and was cut: its operator action is identical to `resolved`'s, so it fails the design rule.

**Paid: the exit codes are not monotonic in severity**, and `2` deviates from the ESLint and `grep` convention that `2` means the tool broke. Both costs were accepted to leave ADR-0002 decision 2 untouched. A reader who knows the convention will read a `disclaimed` report as a tool failure, which is approximately the right reaction — the remedy is setup in both cases — but it is a misreading and it is on us.

**Rejected by consequence.** Any bit-mask exit status. Any documentation that equates the exit code with the report disposition. Any `--min-coverage` value that produces exit `0` over a `disclaimed` report. Any baseline write that drops an `unverified` entry. Any fingerprint containing a page title, an ancestor path, or an unnormalized value.

**Evidential standing.** The five exit-status conventions in the Context table were fetched directly while drafting and are quoted from their own reference pages. The SARIF, ESLint, PHPStan, OWASP and Semgrep facts were already verified in `docs/research/` and are cited to the repository file, not re-fetched. The two Notion identifier claims in decision 6 are doc admissions quoted in `notion-api-practice.md` §7.1. The two assumptions in decision 7 are labelled unobserved because the repository says they are unobserved.

**Citation hazard, unchanged.** ISA 705, reached through ADR-0005 decision 3 and referenced in decision 2's precedence argument, was read from an unauthorised copy. Cite by paragraph; publish no URL.

## Decision status

The evidence asymmetry is worth stating plainly, because it decides which of these a future session may reopen. This ADR was written with **no toolchain, no source code, and no live workspace**. It could not run a scan, could not test a fingerprint against a real page move, and could not observe a single exit code. An implementer will have all three. On any decision below whose label says so, the implementer's evidence outranks this document's reasoning, and the correct response to a conflict is to surface it, not to follow this file.

- **Revisable with new evidence — decision 2's exit table and its precedence.** *Revisit if:* a real CI integration shows a consumer that needs the pair rather than the priority, or shows `3` and `1` being conflated by every consumer in practice, in which case the distinction is costing more than it buys.
- **Revisable with new evidence — decision 1's five baseline states.** *Revisit if:* `updated` never separates from `unchanged` against a real workspace over several runs, or `unverified` never separates from `resolved`. Either would mean a value is labelling a state rather than changing an action. This is the same test ADR-0005's first Revisit-if applies to its own split.
- **Revisable with new evidence — decision 6's two-key fingerprint.** *Revisit if:* either experiment in decision 7 lands. A confirmed property-ID survival across type change collapses the map to one key; a confirmed page-ID churn on move invalidates both keys and reopens the kill criterion rather than this table.
- **Revisable with new evidence — decision 4's default of `--min-coverage 100`.** *Revisit if:* the demand test or a design partner shows that a full-coverage default makes first-run adoption impossible on real workspaces. Lowering the default is a product decision, not an implementation one, and it belongs to the operator.
- **Non-negotiable — a threshold may not relax a `disclaimed` disposition (decision 4, third bullet).** This is Non-goal 4 of `CONTEXT.md` expressed as a number, and better evidence about adoption does not reopen it. Surface the conflict; do not add the flag.
- **Non-negotiable — `resolved` requires evaluation (decision 5).** Reporting unverified absence as repair is the failure the product exists to prevent. An implementer who finds this expensive should raise the cost, not relax the rule.
- **Non-negotiable — no accepted ADR is edited.** Standing project constraint. A superseding ADR is the only instrument.

## Revisit if

**`disclaimed` fires on most real workspaces.** ADR-0005's third Revisit-if already says this, and it reaches further here: if `2` is the usual exit, the exit contract is a single-valued function and the rest of this table is decoration. The declared-root model of ADR-0002 needs revisiting before this ADR does.

**Page or block IDs are observed changing across a move.** Decision 6's fingerprint map has no key independent of the page ID, so this invalidates the whole identity design and triggers `PRODUCT.md`'s kill criterion rather than merely amending decision 6. This is the highest-value open experiment in the ADR and its method is already written down.

**A property ID is observed surviving a type change.** The `pagePropertyName/v1` key becomes redundant, the map collapses to one key, and the residual rename-plus-retype hole closes. This is the cheap experiment and it is ready to run.

**Two exit codes prove insufficient in the other direction** — a consumer needs to distinguish pervasiveness condition (a), an unreachable declared root, from condition (b), an unbounded gap, because their remedies differ. That would split `2`, which is a change to ADR-0002's number and needs a superseding ADR, not an amendment here.

**An operator is observed setting `--min-coverage` to a low value and treating the resulting `0` as a clean report.** The tolerance would then be functioning as the escape hatch that ESLint's `--pass-on-unpruned-suppressions` became one month after its discipline shipped. The remedy is a report-level statement of the threshold on every run, not removal of the flag.

**A finding is observed matching on neither fingerprint key while its page is unchanged.** Decision 6 predicts this only for rename-plus-retype in one interval. A different cause would mean the key composition is missing a hazard the research has not found.

**The product's first release surface stops being a local CLI.** Notion's Developer Platform shipped Workers — a Notion-hosted sandbox runtime — on 2026-05-13, and no file in `docs/research/` mentions it. Decision 2 is the only decision here that is surface-specific: a Worker is triggered by a sync, an agent tool or a webhook, and has no exit byte for a priority signal to occupy. *Revisit if:* a surface without an exit byte becomes the first release target — decision 2 then needs re-homing onto whatever that surface signals with, and its two-axis priority order is the part worth carrying over, not the numbers. Decisions 1, 3, 5 and 6 are properties of the finding model rather than of the packaging, so a surface change is not by itself evidence against them; each carries its own Revisit-if above, and those remain the conditions that reopen them. The platform gap is filed separately.
