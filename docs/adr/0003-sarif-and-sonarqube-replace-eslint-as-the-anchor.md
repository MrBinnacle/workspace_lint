# ADR-0003: SARIF and SonarQube replace ESLint as the prior-art anchor

- **Status:** Accepted
- **Date:** 2026-08-16
- **Amends:** ADR-0001's prior-art gate, which adopted ESLint's model wholesale
- **Evidence:** `docs/research/static-analysis-prior-art.md`

## Context

ADR-0001 adopted ESLint's pluggable static-analysis model. That was the right move against the predecessor framing, which had no testable contract at all. It was not the result of a survey.

A survey has now run. ESLint solves one of this product's five hard problems.

| Concern | ESLint's answer | Why it does not transfer |
| --- | --- | --- |
| Cross-run finding identity | none | Notion objects are renamed and moved constantly; an identity-less report is unusable on the second run |
| Output contract | bespoke JSON formatters | no fingerprint, no baseline state, no suppression state, no run metadata |
| Suppression | inline comments in the analysed artifact | you cannot write `/* eslint-disable */` into someone's Notion page; suppressions must be external and durable |
| Incompleteness | inconceivable — the filesystem is fully readable | the entire hard part of this product |
| Determinism | trivially satisfied — same files, same output | the input mutates during the scan |

ESLint analyses a complete, local, single-writer artifact. This product analyses a remote, partially visible, concurrently edited one. The hard problems are the ones ESLint never had.

## Decision

**SARIF 2.1.0 is the output contract's design source. SonarQube's issue-lifecycle model is the state machine over it.** ESLint is retained only for "rules are pluggable, identified, and severity-tagged."

Six specific adoptions:

1. **Finding identity is Notion's native object ID, not a content hash.** SARIF §3.27.2 provides explicitly for an identifier "not calculated from information stored in the result" — the `correlationGuid` path. Notion object IDs survive rename and move, which is what SonarQube's line-hash and Semgrep's `match_based_id` are workarounds for lacking. `partialFingerprints` carries only the within-object discriminator — which property, which occurrence — so one rule firing twice on one page stays distinguishable.
2. **Rule outcomes are four-valued:** `pass`, `violation`, `incomplete`, `inapplicable`. Taxonomy from axe-core, which separates the three states a binary pass/fail collapses: checked and clean, could not check, nothing to check.
3. **`incomplete` fails the run by default.** This diverges from axe-core deliberately: their `incomplete` is advisory, and downstream consumers drop it. The disposition comes instead from SARIF §3.20.21 — "A SARIF consumer SHALL NOT assume that a failed run contains a complete set of analysis results."
4. **Observation is separated from finding**, following NIST OSCAL Assessment Results. An observation records what was seen, with evidence and provenance. A finding is the judgement. A 404 is an observation that supports no finding, and the model must be able to say exactly that.
5. **Baseline entries are never counts.** ESLint's bulk-suppression format and PHPStan's baseline both key on a count per path, which permits a silent swap: fix one violation, introduce another, net zero, gate passes. Stable Notion object IDs remove any reason to accept that.
6. **Suppressions require a reason and an expiry, and a suppression matching nothing is an error.** SARIF already types the fields — `suppression.justification`, `suppression.status ∈ {accepted, underReview, rejected}`. No surveyed tool enforces a mandatory reason; Ruff's request is open. The self-invalidating half follows `@ts-expect-error` over `@ts-ignore`. **The escape hatch is not shipped**: ESLint added `--pass-on-unpruned-suppressions` one release after introducing the discipline, and abandoned PHPStan baselines show the end state.

## Consequences

**Gained.** Every hard problem now has a specification behind it rather than an invention. Identity, baseline state, suppression semantics, incompleteness, and determinism are all copied from bodies that argued about them publicly. SARIF's committee reasoned explicitly about the compliance case, which is this product's case.

**Paid.** SARIF is source-code-shaped. `physicalLocation` presumes a URI, a region, lines and columns; `logicalLocation` presumes programmatic constructs. A Notion database property has no line number. Modelling every finding through `logicalLocation` plus property bags means inheriting a large schema and using roughly a third of it, while SARIF viewers render the findings badly because they expect to open a file at a line.

**Mitigation, and it is part of the decision.** SARIF is a **design source now and an export target later**. v0.1 copies SARIF's field semantics into a native model. `--format sarif` ships once the rule catalogue is stable. The 72-hour proof must not become a schema-conformance exercise.

**One thing SARIF cannot carry.** Enumerating the `run` object's properties in `sarif-schema-2.1.0.json` confirms that no SARIF object expresses analysis scope or coverage. Incompleteness is representable only as a notification. The coverage manifest of ADR-0002 is therefore native to this product and survives SARIF export only in degraded form. That is a finding about the state of the art, not a defect in this design.

## Revisit if

SARIF 2.2 or a successor adds a scope or coverage object, which would make export lossless and raise the value of adopting the schema natively rather than as a design source.
