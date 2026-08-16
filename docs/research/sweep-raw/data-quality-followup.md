# Scout follow-up — data-quality frameworks

**VERBATIM, citations NOT yet verified.** Scout `scout-priorart`, second pass, 2026-08-16. Dispatched to close a gap the scout explicitly refused to record as a negative in its first report, having searched but not fetched. Self-reported method: 5 fetches, 1 search.

---

Gap closed. 5 fetches, 1 search. Answer: **coverage is advisory in data-quality tooling too, with one partial exception (Soda).**

## Findings

**1 · dbt has a `skipped` status and it does not affect the exit code.**
SOURCE: dbt run-results schema v6 / dbt Labs / https://schemas.getdbt.com/dbt/run-results/v6.json + exit codes doc / https://docs.getdbt.com/reference/exit-codes
FETCHED BOTH. `TestStatus` = `pass, error, fail, warn, skipped`. `RunStatus` = `success, error, skipped, partial success, no-op`. `FreshnessStatus` = `pass, warn, error, runtime error`. Exit codes are only 0 / 1 / 2, and 1 requires "at least one handled error"; the doc says the run "was completed, but some models may have been skipped" as a *consequence* of that error. Skipping without an upstream error exits 0.
RELEVANCE: `skipped` is emitted, machine-readable, per-node — and carries zero verdict weight. My earlier belief is CONFIRMED as to the field and REFUTED as to any binding.
VERDICT: NEGATIVE

**2 · Great Expectations collapses "could not evaluate" into "failed".**
SOURCE: `expectation_validation_result.py` / Great Expectations / https://raw.githubusercontent.com/great-expectations/great_expectations/develop/great_expectations/core/expectation_validation_result.py + standard arguments doc / https://docs.greatexpectations.io/docs/reference/learn/expectations/standard_arguments/
FETCHED BOTH. `ExpectationValidationResult` carries `exception_info` with `raised_exception`, `exception_message`, `exception_traceback`. But under `catch_exceptions: True` the docs show the result returning `"result": False` alongside `"exception_traceback"`. A broken expectation and a violated expectation both land as unsuccessful.
RELEVANCE: This is worse than advisory — it is destructive. The information exists in `exception_info` but the verdict has already merged the two categories.
VERDICT: NEGATIVE

**3 · GX's summary statistics count only what ran, and cannot see what never ran.**
SOURCE: same file, `ExpectationSuiteValidationResult`. FETCHED.
`statistics` = `evaluated_expectations`, `successful_expectations`, `unsuccessful_expectations`, `success_percent`. Suite-level `success` is a boolean over `results`.
RELEVANCE: The denominator is expectations *evaluated*, not expectations *declared*. An expectation that was never reached cannot lower `success_percent` because it is not in the denominator. This is precisely the failure mode workspace_lint exists to prevent.
VERDICT: CONTEXT-ONLY — cite as the anti-pattern.

**4 · Soda is the partial exception: four outcomes including `error`, and non-zero exit on runtime failure.**
SOURCE: Soda v3 "Run a scan" / Soda / https://docs.soda.io/soda-documentation/soda-v3/run-a-scan
FETCHED (outcomes). Outcomes: "**pass** … **fail** … **error**: the syntax of the check is invalid", plus configurable **warn**. Exit codes (SEARCH SUMMARY, not fetched — the table was not on the page I reached): 0 pass, 1 warn, 2 fail, 3 runtime issue with results sent, 4 runtime issue without.
RELEVANCE: Soda does *not* report clean over a runtime failure — codes 3 and 4 are distinct non-zero states. That is a real partial bind, and the only one found in this domain. But `error` means *the check was malformed*, not *the data was unreachable*, and there is no manifest of unchecked columns or datasets.
VERDICT: ADAPT — steal the distinct exit code for "I could not complete", separate from "I found problems".

## Does it exist here?

**No, and the negative is convergent.** Three of four frameworks emit per-item non-execution status and give it no verdict weight — the exact shape as Semgrep in finding 1 of my first report. That is now four independent tools across two unrelated domains converging on: emit the coverage signal, never bind it. Soda binds partially, on runtime failure only, with no coverage artifact.

**Novelty claim survives, and is now better evidenced.** The gap is unchanged and confirmed twice over: nobody makes the verdict conditional on how much of the *declared* set was actually reached.

## Softest claims

- **Soda exit codes (finding 4).** Search summary only. The docs page I fetched carried the outcome list but not the exit-code table; two attempted URLs 404'd or lacked it. Codes 3 and 4 are UNVERIFIED at source. If the ADAPT recommendation is load-bearing, fetch `https://docs.soda.io/llms-full.txt` and confirm.
- **GX `catch_exceptions` semantics (finding 2).** The docs page shows `"result": False` in the error payload; I did not trace the code path that sets `success` on the exception branch. High confidence, one inference deep.

dbt and GX schema findings (1, 2 fields, 3) are fetched from primary artifacts and firm.

## What you should take from this

GX finding 3 is the sharpest thing in this pass. `success_percent` computed over evaluated rather than declared expectations is a named, shipping instance of the exact failure workspace_lint targets. It is a better motivating example than anything in the static-analysis literature, because the number is *wrong* rather than merely incomplete — a suite where half the expectations never ran can report 100%.
