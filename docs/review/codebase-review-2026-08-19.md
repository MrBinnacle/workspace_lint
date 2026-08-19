# Codebase review — 2026-08-19

Scope: static review of the TypeScript slice, docs, and local checks. No live Notion workspace was scanned.

## Top three performance bottlenecks

1. **Serial Notion reads in the traversal and hydration loops.** `scan()` descends child resources one at a time, resolves REF001 targets one at a time, then hydrates page properties one at a time. That is safe for rate limits, but it turns wall time into the sum of every network round trip.
   - Improvement task: add a bounded request scheduler around `Observer.observe`, with deterministic ordering, a default concurrency of 1, and an opt-in higher concurrency that preserves the call log order used by deterministic reports.
2. **UNQ001 materialises all unordered pairs in memory.** A 1,000-resource scope creates 499,500 manifest entries before judging. The ceiling prevents catastrophic growth, but the current shape still makes memory and render time quadratic.
   - Improvement task: replace full-pair storage with a streaming combinatorics design that computes exact denominators and duplicate findings without storing every conforming pair.
3. **Repeated full-manifest scans.** `Manifest.of()`, `count()`, `reached()`, `gapsFrom()`, `residualsFrom()`, and `evaluateStage()` repeatedly iterate all manifest entries. This is fine for the current slice, but pair-shaped rules multiply entries quickly.
   - Improvement task: index manifest entries by coverage unit and maintain per-stage counts incrementally, while keeping `all()` sorted or otherwise deterministic for rendering.

## Streaming combinatorics viability for UNQ001

A streaming UNQ001 implementation looks viable, but it is a semantic change to the manifest model rather than a drop-in loop optimization. The current code records each unordered pair as a coverage item, and `evaluateStage()` marks entries evaluated by intersecting each rule's judged key set with entries in that rule's unit. Streaming therefore needs a first-class aggregate coverage row or a virtual pair iterator; otherwise the report would have no place to carry the exact pair denominator.

A viable exact algorithm is:

1. Hydrate each in-scope member once, exactly as the current implementation does, and classify blocked members with the existing `MemberStage` ranking.
2. Maintain counts instead of materializing conforming pairs:
   - `declared = C(n, 2)` for the scope size.
   - Let `d`, `r`, `e`, and `k` be the counts of members whose own state is blocked at `declared`, blocked at `resolved`, blocked at `enumerated`, and comparison-ready. Then pair-stage counts can be exact without pair entries: `resolved = C(r + e + k, 2)`, `enumerated = C(e + k, 2)`, and `evaluated = C(k, 2)`.
   - Pair losses can be summarized by blocked member and stage: a member blocked at stage `s` blocks `n - 1` pairs unless both sides are blocked and the lower-ranked member owns the rendered cause. That summary needs a report design before implementation.
3. Maintain a map from comparable value to participant IDs while streaming members. When a value appears again, emit one finding per offending resource, matching UNQ001's current anchor decision, without emitting entries for values that remain unique. Empty values keep the current behavior by contributing to coverage but not colliding.
4. Preserve the current atomic refusal path above `UNQ001_SCOPE_CEILING` until the aggregate coverage representation has checks proving exact parity for denominators, evaluated counts, and findings.

This reduces memory from `O(n²)` manifest entries to `O(n + d)`, where `d` is the number of duplicate-bearing participants or duplicate groups retained for findings. It does not remove the need to hydrate `O(n)` resources, so it pairs well with the shared property-hydration helper and only partially overlaps with request scheduling work.

Risks to resolve before implementation:

- The manifest currently treats a coverage item as an addressable entry. Aggregate pair counts would need either virtual entries, rule-owned coverage rows, or a new manifest summary type.
- Findings and reports must still name concrete duplicate resources, never raw property values.
- Gap reporting for blocked members must remain explainable: a single blocked member affects `n - 1` pairs, but the report should avoid flooding with synthetic pair gaps unless a deterministic compact representation is specified.
- Mutation checks need to prove that replacing `C(n,2)` with `n`, suppressing blocked-member pair impact, or treating empty values as duplicates all go red.

## Three high-impact, well-scoped PRs

1. **Bounded request scheduler PR.** Introduce a small scheduler module, thread it through `scan()`, keep the default behavior serial, and add offline fakes proving concurrency never reorders rendered call evidence.
2. **Streaming UNQ001 design PR.** Add an ADR/spec amendment and a thin implementation spike for exact denominator accounting without pair materialisation; keep the current ceiling until the tests prove equivalent coverage semantics.
3. **Manifest indexing PR.** Replace repeated `all().filter(...)` paths with unit-indexed storage and stage counters; verify existing reports are byte-identical under deterministic output.

## Concrete next steps

1. Run a deterministic-report golden-file check before and after any manifest or scheduler work so performance changes cannot alter published evidence accidentally.
2. Add lightweight timing counters around traversal, reference resolution, REQ001 hydration, and UNQ001 hydration to turn the bottleneck hypotheses above into measured slices.
3. Split the repeated property-hydration branches shared by REQ001 and UNQ001 into a single helper before adding more property-based rules.

## Documentation gaps addressed

This review added docstrings/comments for the most complex undocumented control points found during the scan:

- `createObserver()` now documents why it is the choke point for transport-to-evidence conversion and call logging.
- `buildReportDocument()` now documents why every renderer must consume the same document shape.
- `renderReport()` now documents that the terminal output is also a renderer over that document, not a separate report implementation.

Remaining documentation opportunities:

- The offline `CHECK-*.ts` files are executable specs but vary in how clearly they name the production invariant each mutation protects.
- `cli.ts` has good inline comments but no exported helper boundaries; if more commands land, parsing and output writing should be documented after extraction.

## TODO/FIXME inventory

No actionable inline `TODO` or `FIXME` debt comments were found in implementation files during this review. Broad repository searches now match this review document itself, so future scans should exclude `docs/review/` when checking whether new implementation debt was introduced.

Categories and action plan:

1. **No explicit implementation TODO/FIXME debt — low priority.** Keep the codebase's current issue-number style (`#44`, `#59`, etc.) for settled context, but do not use it as a substitute for actionable tracker issues.
2. **Open issue references in comments — medium priority.** Periodically audit issue-number comments whose linked issues are closed, because stale issue references can become documentation drift.
3. **Deferred rule IDs in docs/config — high priority when roadmap changes.** `SCH001`, `REL001`, `DEP001`, and `CAN001` are deliberately deferred; each should gain an implementation PR or an explicit superseding decision before the rule catalog is marketed as complete beyond v0.1.

## Duplicate code and DRY opportunities

1. **Property hydration is duplicated between REQ001 and UNQ001.** Both stages retrieve page maps, classify missing maps, absent properties, unreadable shapes, and unsupported values with near-identical causes. Extract a `readScopedPropertyMembers()` helper that returns a typed result and leaves each rule to decide its own coverage item.
2. **Scope expansion logic is duplicated.** Both configured property rules expand a scope as either root-plus-children, one child, or an unenumerated scope. Extract a `resourcesInConfiguredScope()` helper that returns either `{ ok: true, resources }` or a named loss cause.
3. **Report rendering has repeated line-building patterns.** Terminal and Markdown rendering now share `ReportDocument`, but sections still hand-build similar rows. Introduce small section renderers for coverage, gaps, residuals, and findings after adding golden-file tests.
