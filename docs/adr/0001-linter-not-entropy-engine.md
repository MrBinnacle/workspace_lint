# ADR-0001: workspace-lint is a deterministic linter, not an entropy engine

- **Status:** Accepted
- **Date:** 2026-08-16
- **Input:** PRD, https://app.notion.com/p/2d41c2631b5945f196c5688cde44cdf9 (a suggestion; this ADR is the decision)

## Context

The predecessor concept framed the problem as workspace entropy and proposed a tool that judged workspace quality. Entropy describes a symptom. It does not produce a testable contract, so no result could be proved right or wrong.

The PRD replaced that framing with the ESLint pluggable static-analysis model: a normalized input graph, independent rules with metadata, stable source locations, and project-specific configuration.

## Decision

The product is a linter. It tests explicit, declared rules against a normalized workspace graph. The following decisions are settled and are not reopened without a superseding ADR.

1. The product is a linter, not an entropy engine.
2. The core runs locally and uses read-only Notion API access.
3. The rule engine is deterministic: the same snapshot, rules, and tool version produce byte-stable output after timestamp removal.
4. Policy checks require explicit configuration. Zero-config inference of owner, canon, uniqueness, or peer status is rejected.
5. A partial scan cannot pass. Coverage is part of the result.
6. The product reports uncertainty as `indeterminate` instead of converting it to an error.
7. v0.1 does not modify Notion. Automatic fixes are rejected for v0.1.
8. CI is an optional mode with a separate privacy contract and a separate threat review.

## Consequences

**Gained.** Every finding is falsifiable against a declared rule, so the product can be tested with fixtures and golden files. Coverage reporting means a green result from a partial workspace is not a pass — the failure mode that would make the tool untrustworthy.

**Paid.** The user must declare policy before most checks do anything. Out of the eight v0.1 rules, six are configured and only two are built-in, so the first run after install reports coverage and little else. The PRD accepts this cost and sets a release target of one useful declared rule within fifteen minutes of setup.

**Rejected by consequence.** Any feature requiring prose interpretation or an LLM is out. The PRD lists that requirement as a kill criterion, not a roadmap item.

## Revisit if

The proof gate fails: the API cannot produce a complete coverage manifest and stable findings without write access or an LLM. In that case the product stops or narrows rather than relaxing this decision.
