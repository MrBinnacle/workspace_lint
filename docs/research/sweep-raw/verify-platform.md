# Verification pass — Notion platform and tooling claims

**Tier 1, adversarial.** Verifier `verify-platform`, 2026-08-16. Six keystone claims from `scout-wildcard` and `scout-priorart`, each re-fetched from primary sources. Result: **6 checked — 2 confirmed, 4 partial, 0 not-found, 0 misattributed.**

---

ADVERSARIAL VERIFICATION REPORT — 6 claims

**1 — PARTIAL.** The feature is real and Enterprise-gated, and it does reach private pages. Quotes: "This feature is only available to users on the Enterprise Plan." · "Where the page lives and whether it's private, shared internally, shared externally, or shared to web." · "The page creator, creation date, and who can access the page" · "Who last edited the page and when" · "Workspace owners can also export this data as a .csv file." · permission change: "•••" next to a page title, then "Change permissions." Multi-workspace: "If your organization has multiple Enterprise workspaces, you can view and manage content across all of those workspaces in one place."
CORRECTION — one word in the claim is wrong and it is the load-bearing one. The entry point is a **search**, not an enumeration: "go to Settings → Content search and search for a page based on its ID, title, or content." Nothing in the help page states the tool lists all workspace content unprompted. The CSV export is of "this data" — the result set — with no stated guarantee it is the full workspace. So Notion ships admin *lookup* over private content, not first-party coverage enumeration. The scout's 404 on a related URL did not indicate absence; the page exists.
URL: https://www.notion.com/help/admin-content-search (corroborated by https://www.notion.com/help/data-accessible-by-your-workspace-owner via search)

**2 — CONFIRMED.** Search scope, verbatim: the endpoint "searches all parent or child pages and data_sources that have been shared with a connection," and results "adhere to any limitations related to an connection's capabilities." Default-no-access, verbatim from the authorization doc: "Before a connection can interact with your Notion workspace page(s), the page must be manually shared with the connection." and "If the page is not shared, any API requests made will respond with an error."
Note the negative is implied, not stated: no Notion page says "search cannot discover unshared pages." It follows from scope, but it is inference, not published wording.
URLs: https://developers.notion.com/reference/post-search · https://developers.notion.com/docs/authorization

**3 — PARTIAL. The standing project claim is wrong as written; the scout is right on primitives and right on the gap.**
Verified against the machine-readable schema, not the prose spec:
- `result.kind` enum, verbatim: `[ "notApplicable", "pass", "fail", "review", "open", "informational" ]`, `"default": "fail"`. All five values the scout named are present. The scout omitted `fail`; the enum has exactly six members, no more.
- `invocation.executionSuccessful`: "Specifies whether the tool's execution completed successfully.", type boolean, required on `invocation`.
- `invocation.toolExecutionNotifications`: "A list of runtime conditions detected by the tool during the analysis.", array of `notification`.
- `artifact.roles`: `"analysisTarget"` is the first enum member. Confirmed.
- Run-level aggregate: no property anywhere in the schema has "coverage" in its name, and there is no run-level scanned/skipped count object.
CORRECTION 1: the standing claim "no SARIF object expresses analysis scope or coverage" is refuted at the per-item level. Four primitives exist and are normative.
CORRECTION 2: treat the section numbers as unverified. My fetch of the OASIS prose spec returned the four numbers as claimed (3.27.9, 3.20.14, 3.20.21, 3.24.6), but that same fetch also returned a `result.kind` enum containing `"diagnostic"` and `"initialState"` — values that do not exist in the schema. A source that fabricated one answer cannot confirm another. Cite the schema, not section numbers, until someone reads the printed spec directly.
URLs: https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/sarif-2.1/schema/sarif-schema-2.1.0.json · https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html

**4 — PARTIAL.** Primary source, verbatim: per connection, "an average of three requests per second, with some bursts beyond the average allowed"; per workspace, "shared across all of the workspace's connections and scaled to the workspace's plan."
CORRECTION: the numbers 10/25/50/100 req/s by plan are NOT on the primary page. Notion publishes only the qualitative statement "scaled to the workspace's plan" with no tier table. Those four numbers come from third-party blogs and carry no vendor backing. Do not size a scan budget on them. The 3 req/s per-integration figure is confirmed, and the claim that it does not scale by tier is correct — but note the *workspace* ceiling does scale, by an undisclosed amount.
URL: https://developers.notion.com/reference/request-limits

**5 — PARTIAL.** Structure confirmed: `scanned_and_skipped` has required `scanned` (array of fpath) and optional `skipped` (array of skipped_target); `skipped_target` requires `path` and `reason`, with optional `details` and `rule_id`. All eight `skip_reason` values the scout named exist.
CORRECTION 1: casing. The schema has `Nonexistent_file`, `Gitignore_patterns_match`, `Dotfile` with capitals — do not pattern-match on lowercase.
CORRECTION 2: the enum is 17 values, not 8. The scout's list omits `always_skipped`, `semgrepignore_patterns_match`, `cli_include_flags_do_not_match`, `cli_exclude_flags_match`, `excluded_by_config`, `minified`, `irrelevant_rule`, `Gitignore_patterns_match`, `Dotfile`. That is the richer half of the taxonomy — it separates "excluded by policy" from "failed to analyze," which is the distinction a coverage model needs.
CORRECTION 3 on the sub-questions: the CLI reference says `--verbose` shows "more details about what rules are running, which files failed to parse, etc." It does not state that `skipped` is verbose-gated. Unresolved — test empirically, do not assume. Exit code: "Semgrep ran successfully and found no errors (or did find errors, but the `--error` flag is not being used)" = 0; findings raise exit 1 only "while using the `--error` flag"; 2 = "Semgrep failed." So findings alone do NOT drive the exit code by default.
URLs: https://raw.githubusercontent.com/semgrep/semgrep-interfaces/main/semgrep_output_v1.jsonschema · https://docs.semgrep.dev/cli-reference

**6 — CONFIRMED.** Verbatim: `-S, --strict          fail the entire audit if dependency collection fails on any dependency (default: False)`. Opt-in, default False.
URL: https://raw.githubusercontent.com/pypa/pip-audit/main/README.md

## Claims that changed materially
- **Claim 1.** Notion's admin tool is search-first, not an enumeration. The competitive threat is narrower than reported, and the differentiator survives — but only if the product enumerates rather than looks up. Do not write "Notion already enumerates all content" into any positioning doc.
- **Claim 3.** Retire the standing "no SARIF object expresses analysis scope or coverage." The correct statement is: SARIF carries per-result and per-artifact not-analyzed primitives but no run-level coverage aggregate. Build on the four primitives instead of inventing parallel ones.
- **Claim 4.** Delete 10/25/50/100 from any throughput model. Size on 3 req/s per integration and treat the workspace ceiling as unknown.
- **Claim 5.** Adopt the full 17-value `skip_reason` enum with exact casing. The 9 omitted values carry the policy-exclusion vs. analysis-failure split.

6 claims checked: 2 confirmed, 4 partial, 0 not-found, 0 misattributed.
