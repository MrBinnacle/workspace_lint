# Dispositions — the operator's cold read of the five real-root reports

**Protocol:** `docs/proof/prereg-real-roots-rest.md` → "The read protocol". The operator reads the
`--show-titles` copies cold and bins every finding — REPAIR / NOISE / CANT-TELL — with a one-line
reason. **CANT-TELL is a defect of the report, not of the workspace, and its count is a product
measurement.** Same redaction rule as the pre-registration: role labels only.

**Status: READ IN PROGRESS — 3 of 6 binned, 2026-08-22.** Empty bins mean the operator has not
yet ruled on that row. A future session must not fill them from anything but the operator's own
reading.

| finding | rule | seen from | bin | reason (operator's words) |
| --- | --- | --- | --- | --- |
| TARGET-1 unresolvable | REF001 | ROOT-A, ROOT-B, ROOT-C | **REPAIR** | "dead doctrine pointer, I'd relink it today" |
| TARGET-2 unresolvable | REF001 | ROOT-A | **CANT-TELL** | "no idea what that page was" |
| TARGET-3 unresolvable | REF001 | ROOT-A | **REPAIR** | "that's the old task sequencer link" |
| TARGET-4 unresolvable | REF001 | ROOT-B | | |
| TARGET-5 unresolvable | REF001 | ROOT-C | | |
| block-budget exhaustion on one ROOT-C child | SYS001 | ROOT-C | | |

The two `400 validation_error` targets under ROOT-C are gaps, not findings, and take no bin; if
the operator's read reclassifies them, that is recorded here as its own line, not edited into the
table above.
