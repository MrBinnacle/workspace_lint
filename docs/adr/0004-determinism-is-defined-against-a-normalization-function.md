# ADR-0004: Determinism is defined against a named normalization function

- **Status:** Accepted
- **Date:** 2026-08-16
- **Supersedes:** the non-functional requirement "byte-stable JSON after timestamp removal"
- **Evidence:** `docs/research/notion-api-practice.md`, `docs/research/notion-live-probe.md`, `docs/research/static-analysis-prior-art.md`

## Context

ADR-0001 §3 claims determinism: the same snapshot, rules, and tool version produce byte-stable output after timestamp removal. That predicate is not testable, for two reasons.

**Timestamp removal is insufficient.** Every file, image, and file-property value returns a fresh `X-Amz-Signature` with a one-hour `expiry_time`. Removing timestamps does not touch a signature. A live probe of six paired identical reads found exactly one other drifting field, `request_id`, a fresh UUID per error response — a good result, with a caveat kept attached: that probe ran through an OAuth connector returning unsigned file descriptors, not a REST integration token returning signed S3 links. It does not clear the REST path.

**"The same snapshot" was undefined.** `CONTEXT.md` defined Snapshot and Workspace graph with near-identical sentences, and neither said whether a snapshot is a persisted artifact or a phase of execution. A determinism claim over an unpersisted intermediate cannot be tested by anyone.

## Decision

Determinism is defined against **Normalization**: a named, versioned function that strips volatile fields from an API response before hashing, comparison, or persistence.

1. **Normalization is specified before the 72-hour proof runs.** A proof that tests an undefined predicate reports nothing. Its v0.1 exclusion set: signed URLs reduced to path-only; `expiry_time` dropped; `request_id` dropped; `last_edited_time` excluded from identity computation but retained as data.
2. **A content-addressed Snapshot sits between fetch and analysis. Rules run only against the Snapshot, never against the API.** This is forced as much by cost as by correctness: at roughly three requests per second, re-fetching per rule is untenable. Polly.js's own cache-key churn bug — the port is part of the record signature by default — is the warning that the snapshot key must be defined deliberately rather than inherited.
3. **The Snapshot persists normalized metadata, edges, and content hashes. It never persists content.** This is now a legal constraint as well as a privacy one. Notion's Developer Terms §3.1(g) prohibits data-extraction methods, §3.1(i) governs storing Integration Data, and §4.4 obliges compliance with data-subject deletion requests including metadata. The snapshot must be disclosed and deletable.
4. **JSON that is hashed, signed, or diffed is canonicalized per RFC 8785 (JCS).** Findings carry a fixed sort order, following SARIF Appendix F.3, with F.2's exclusion list for timestamp, process, and host fields.
5. **A `--deterministic` flag ships from day one**, as SARIF Appendix F.1 recommends by that name. F.6 documents the alternative's cost: a post-processing pass that strips non-deterministic elements after the fact.

SARIF Appendix B states the coupling that makes this load-bearing: non-deterministic elements in the identity computation destroy the identity. Determinism and the baseline are the same problem.

## Consequences

**Gained.** A falsifiable test. Run the engine twice against one snapshot file and diff the bytes. Separates two failure classes that would otherwise blur during the proof: *the API returned different data* versus *the engine is non-deterministic*. Golden-file fixtures follow for free.

**Paid.** Normalization is a versioned artifact with its own compatibility surface. Changing it changes every fingerprint downstream, so it needs a version field and a migration story before v0.2, not after.

**Unresolved, and assigned to the proof.** Whether result order is stable across two identical paginated calls. No practitioner report exists either way, and absence of complaints is not evidence.

## Revisit if

The proof finds a drifting field outside the v0.1 exclusion set that cannot be normalized away — for example, unstable pagination ordering with no stable sort key available. That would move determinism from "normalize and compare" to "sort and compare," which is a different and weaker claim, and it should be recorded as such rather than absorbed silently.
