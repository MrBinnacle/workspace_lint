# Codebase review — 2026-08-19

Scope: static review of the TypeScript slice, docs, and local checks. No live Notion workspace was scanned.

## Top three performance bottlenecks

1. **Serial Notion reads in the traversal and hydration loops.** `scan()` descends child resources one at a time, resolves REF001 targets one at a time, then hydrates page properties one at a time. That is safe for rate limits, but it turns wall time into the sum of every network round trip.
   - Improvement task: add a bounded request scheduler around `Observer.observe`, with deterministic ordering, a default concurrency of 1, and an opt-in higher concurrency that preserves the call log order used by deterministic reports.
2. **UNQ001 materialises all unordered pairs in memory.** A 1,000-resource scope creates 499,500 manifest entries before judging. The ceiling prevents catastrophic growth, but the current shape still makes memory and render time quadratic.
   - Improvement task: design a streaming UNQ001 coverage counter that records representative duplicate findings and exact `C(n,2)` denominators without storing every conforming pair.
3. **Repeated full-manifest scans.** `Manifest.of()`, `count()`, `reached()`, `gapsFrom()`, `residualsFrom()`, and `evaluateStage()` repeatedly iterate all manifest entries. This is fine for the current slice, but pair-shaped rules multiply entries quickly.
   - Improvement task: index manifest entries by coverage unit and maintain per-stage counts incrementally, while keeping `all()` sorted or otherwise deterministic for rendering.

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

No `TODO` or `FIXME` comments were found in tracked project files during this review.

Categories and action plan:

1. **No explicit TODO/FIXME debt — low priority.** Keep the codebase's current issue-number style (`#44`, `#59`, etc.) for settled context, but do not use it as a substitute for actionable tracker issues.
2. **Open issue references in comments — medium priority.** Periodically audit issue-number comments whose linked issues are closed, because stale issue references can become documentation drift.
3. **Deferred rule IDs in docs/config — high priority when roadmap changes.** `SCH001`, `REL001`, `DEP001`, and `CAN001` are deliberately deferred; each should gain an implementation PR or an explicit superseding decision before the rule catalog is marketed as complete beyond v0.1.

## Duplicate code and DRY opportunities

1. **Property hydration is duplicated between REQ001 and UNQ001.** Both stages retrieve page maps, classify missing maps, absent properties, unreadable shapes, and unsupported values with near-identical causes. Extract a `readScopedPropertyMembers()` helper that returns a typed result and leaves each rule to decide its own coverage item.
2. **Scope expansion logic is duplicated.** Both configured property rules expand a scope as either root-plus-children, one child, or an unenumerated scope. Extract a `resourcesInConfiguredScope()` helper that returns either `{ ok: true, resources }` or a named loss cause.
3. **Report rendering has repeated line-building patterns.** Terminal and Markdown rendering now share `ReportDocument`, but sections still hand-build similar rows. Introduce small section renderers for coverage, gaps, residuals, and findings after adding golden-file tests.
