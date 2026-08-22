# Dispositions — the operator's cold read of the five real-root reports

**Protocol:** `docs/proof/prereg-real-roots-rest.md` → "The read protocol". The operator reads the
`--show-titles` copies cold and bins every finding — REPAIR / NOISE / CANT-TELL — with a one-line
reason. **CANT-TELL is a defect of the report, not of the workspace, and its count is a product
measurement.** Same redaction rule as the pre-registration: role labels only.

**Status: READ IN PROGRESS — 5 of 6 binned, 2026-08-22.** Empty bins mean the operator has not
yet ruled on that row. A future session must not fill them from anything but the operator's own
reading.

| finding | rule | seen from | bin | reason (operator's words) |
| --- | --- | --- | --- | --- |
| TARGET-1 unresolvable | REF001 | ROOT-A, ROOT-B, ROOT-C | **REPAIR** | "dead doctrine pointer, I'd relink it today" |
| TARGET-2 unresolvable | REF001 | ROOT-A | **CANT-TELL** | "no idea what that page was" |
| TARGET-3 unresolvable | REF001 | ROOT-A | **REPAIR** | "that's the old task sequencer link" |
| TARGET-4 unresolvable | REF001 | ROOT-B | **NOISE** | "Hans Archive absorbed that one on purpose" |
| TARGET-5 unresolvable | REF001 | ROOT-C | **REPAIR** | "I'd fix that link today" |
| block-budget exhaustion on one ROOT-C child | SYS001 | ROOT-C | | |

The two `400 validation_error` targets under ROOT-C are gaps, not findings, and take no bin; if
the operator's read reclassifies them, that is recorded here as its own line, not edited into the
table above.

## Post-read verification — a second credential path, appended and never edited into the bins

After the bins above were committed, each dead target was fetched through the owner-side MCP
connector (documented-tier under ADR-0004; a different credential path that does not clear the
REST path). **The bins above are the cold-read record and stand unedited**; this section is the
verification layer the pre-registration did not promise but the operator's repair authorization
required ("repair them once your confidence level in the veracity of the action is satisfactory").

| finding | cold-read bin | second path | verified state |
| --- | --- | --- | --- |
| TARGET-1 | REPAIR | **resolves** | **Alive, outside the integration's grant.** The reference is correct; the 404 is a grant boundary. Repair refused — a relink would have redirected a working pointer. |
| TARGET-2 | CANT-TELL | 404 | Dead on both credential paths. Nothing identifiable to repair toward; the bin stands. |
| TARGET-3 | REPAIR | 404 | Dead on both credential paths — a true repair candidate. The correct replacement target is a fact only the operator holds; no repair executed on inference. |
| TARGET-4 | NOISE | resolves as **archived** | Retired to trash/archive deliberately. The operator's NOISE ruling is confirmed by the artifact. |
| TARGET-5 | REPAIR | **resolves** | **Alive, outside the integration's grant.** Same class as TARGET-1. Repair refused. |

**The product measurement this adds:** 2 of 3 REPAIR rulings were made against targets that are
not dead — the report gave the reader no way to distinguish decay from grant boundary, and the
reader (the workspace's own owner, reading with full context) could not recover the distinction
either. REF001's wording — *absent or inaccessible, indistinguishable* — held exactly; what run 1
measured is what that indistinguishability costs at the read layer. Evidence filed on #135. An
accepted-finding rate computed from cold-read bins alone would have scored 4 of 6 accepts; the
verified figure for genuinely-dead REPAIR targets is 1 of 6. Both numbers are honest at their own
layer, and any future acceptance-rate claim must name which layer it counts.
