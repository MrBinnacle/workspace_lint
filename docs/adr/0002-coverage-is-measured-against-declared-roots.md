# ADR-0002: Coverage is measured against declared roots, not against the workspace

- **Status:** Accepted
- **Date:** 2026-08-16
- **Supersedes:** the wording of Principle 1 in `CONTEXT.md` and the phrase "Coverage: COMPLETE for shared scope" in the PRD's sample report
- **Evidence:** `docs/research/notion-api-documented.md`, `docs/research/notion-api-practice.md`

## Context

The product's central promise was that a partial scan cannot pass, and the stop condition was that the project halts if the proof "cannot produce a complete coverage manifest." Both assume the tool can establish what it did not see.

It cannot. Three findings, from documentation and from practitioner evidence:

1. **No endpoint enumerates a connection's grant.** Search, `/v1/users`, `/v1/users/me`, `/v1/oauth/introspect`, and the complete public endpoint index were checked. Nothing returns the set of objects an integration may read.
2. **Notion documents search as non-exhaustive, verbatim:** "Search is not guaranteed to return everything, and the index may change as your connection iterates through pages and databases." Only *directly shared* objects are guaranteed returned. Inherited access is not.
3. **Search stops at roughly 11,200 objects.** The cursor dies at the same position regardless of page size or request rate, and restarting from zero hits the same wall. Reported at `outline/outline#11573`, closed 2026-07-10 with no merged fix; the proposed fix at `outline/outline#12871` was closed unmerged.

A scan therefore cannot be a census. Unshared subtrees are not merely unread — they are unnameable. The tool cannot count what it was never told exists.

## Decision

Coverage is measured against **declared roots**: resources the operator names in configuration as scan entry points. The denominator is supplied by the operator, never discovered by the tool.

1. A scan reports completeness **relative to declared roots**. It makes no claim about the workspace.
2. An unreachable declared root is a hard coverage failure and exits `2`. This is what makes a partial scan detectable at all.
3. Every unresolvable reference is recorded as an explicit **observation**, never as a silent absence.
4. `Notion-Version` is pinned to a release carrying `request_status`. The **absence** of `request_status` from a paginated list response is a hard error, not evidence of completeness.
5. The report states its start time and end time. A scan is a bounded observation over a mutating system, not a snapshot of a stable one.

Point 4 is the highest-leverage item here. Before `request_status` shipped on 2026-04-20, `dataSources.query` returned `has_more: false` at exactly 10,000 rows and silently lied — in Notion's own words, "a common source of confusion for connections doing full exports."

## Consequences

**Gained.** The product can now make a claim it can actually keep. "Everything you declared was read, and here is what could not be" is provable. "Your workspace is clean" never was.

This also turns out to be the only defensible commercial position. Two independent sweeps — one over Notion tooling, one over static analysis generally — found no tool that fails on incomplete coverage, and the SARIF 2.1.0 `run` object has no field expressing analysis scope at all. The thing that forced this ADR is the thing nobody else sells.

**Paid.** The operator must declare roots before coverage means anything, which adds a step to first-run setup already burdened by six configured rules out of eight. A scan of an undeclared workspace reports on nothing.

**Rejected by consequence.** Any claim that the tool audits "your Notion workspace." It audits a declared scope. Marketing copy that blurs this reintroduces the exact failure mode — a green report over an unknown fraction — that the product exists to prevent.

## Revisit if

Notion ships an endpoint that enumerates a connection's grant, or documents search as exhaustive. Either would restore workspace-level coverage as a provable claim. Neither is announced.
