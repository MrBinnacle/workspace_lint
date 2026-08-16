# Static-Analysis Prior Art: Identity, Baselines, Incompleteness, Determinism

- **Date:** 2026-08-16
- **Author role:** static-analysis prior-art SME (subagent research sweep)
- **Status:** This document is research evidence. It is not a canonical product decision. `CONTEXT.md` and `docs/adr/` remain authoritative. Nothing here binds the design until an ADR adopts it.

Scope: four questions on how the field already solved problems `workspace_lint` is about to solve, plus a reframe of the PRD's ESLint anchor. Every mechanism claim carries a URL that was fetched during the sweep.

---

## 1. Cross-run finding identity

### SARIF: `fingerprints` vs `partialFingerprints` — the spec's own words

Source fetched: OASIS SARIF 2.1.0 committee specification, `sarif-2.1/prose/sarif-v2.1.0-committee-specification.htm` in https://github.com/oasis-tcs/sarif-spec (branch `editor-revision-2026-03-05`); schema descriptions from `sarif-2.1/schema/sarif-schema-2.1.0.json` in the same repo. Public rendering: https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html

§3.27.16 `fingerprints`:

> "Each property value in this object SHALL be a string that provides a stable identifier for the result. This identifier SHALL, to the extent that it is feasible, be the same for all results that are logically identical, and different for any two results that are logically distinct. This requirement is intended to ensure that a fingerprint is resistant to changes that do not affect the logical identity of the result, such as the location of the root of a source code enlistment, or the line number where a result appears in a source file."

> "A direct SARIF producer SHOULD NOT populate this property. A SARIF converter MAY populate this property if the analysis tool's native output format provides a value that qualifies as a fingerprint (a stable identifier for the result). A result management system MAY populate this property when it ingests a SARIF file."

§3.27.17 `partialFingerprints`:

> "Each property value in this object SHALL be a string that contributes to the stable, unique identity, or fingerprint, of the result (see 3.27.16)."

> "A result management system MAY use any algorithm to combine the information contained in the various partial fingerprints. (For example, it might decide that two results are logically identically if any one of their partial fingerprints match, or only if a majority of them match, or only if all of them match.)"

Schema one-liners, verbatim from `sarif-schema-2.1.0.json`:

- `fingerprints`: "A set of strings each of which individually defines a stable, unique identity for the result."
- `partialFingerprints`: "A set of strings that contribute to the stable, unique identity of the result."
- `guid`: "A stable, unique identifier for the result in the form of a GUID."
- `correlationGuid`: "A stable, unique identifier for the equivalence class of logically identical results to which this result belongs, in the form of a GUID."
- `baselineState`: "The state of a result relative to a baseline of a previous run." Enum: `new`, `unchanged`, `updated`, `absent`.

#### Why the spec provides both

The split is a division of labour, not a strength gradient.

The **producer** (the analysis tool) knows things a consumer cannot recover from the log. Appendix B's worked example is a documentation checker whose prohibited word appears only inside `result.message`. The producer emits that as a *partial* fingerprint.

The **result management system** owns the whole-identity computation. It combines partial fingerprints with what it can already derive. Appendix B, normative:

> "A result management system SHOULD construct a fingerprint by using information contained in the SARIF file such as the name of the tool that produced the result; the rule id; the file system path to the analysis target."

> "An analysis tool SHOULD NOT include in `partialFingerprints` information that a result management system could deduce from other information in the SARIF file, for example, file hashes. Rather, the result management would use such information, along with `partialFingerprints`, in its computation of `fingerprints`."

Both property names are **versioned hierarchical strings** (`stableResultHash/v2`, `prohibitedWordHash/v3`). Matching uses "the latest version of the fingerprint available in both results" — the spec builds algorithm migration into the identity format itself. §3.27.16's NOTE gives the reason the property is a map rather than a single string:

> "To allow a result management system to continue to support outdated fingerprinting algorithms while upgrading to a newer, more reliable algorithm."

#### Documented failure modes

- **Line-number churn.** Appendix B: "suppose the fingerprint were to include the line number where the result was located, and suppose that after the baseline was constructed, a developer inserted additional lines of code above that location. Then in the next run, the result would occur on a different line, the computed fingerprint would change, and the result management system would erroneously report it as a new result." Consequence: "A result management system SHOULD NOT include an absolute line number (or an absolute byte location in a binary artifact) in its fingerprint computation."
- **Path churn across environments.** https://github.com/oasis-tcs/sarif-spec/issues/122 — including file paths or hashes in the fingerprint contribution makes fingerprints non-portable, because "the paths will be different and the overall fingerprints won't match," and the path component cannot be un-mixed from an already-computed hash. Recommended fix: scope the fingerprint *within* a normalised file, and key findings on the pair `(fingerprint, normalised path)`.
- **Non-determinism poisoning identity.** Appendix B NOTE: "The inclusion of non-deterministic file format elements (Appendix F, F.2) or non-deterministic absolute URIs (Appendix F, F.4) in the fingerprint computation will compromise the usefulness of fingerprints for distinguishing logically identical from logically distinct results."
- **The spec's own admission.** "It is difficult to devise an algorithm that constructs a truly stable fingerprint for a result. Fortunately, for practical purposes, the fingerprint does not need to be absolutely stable; it only needs to be stable enough to reduce the number of results that are erroneously reported as new to a low enough level that the development team can manage the erroneously reported results without too much effort."
- **Under-specified relationships.** https://github.com/oasis-tcs/sarif-spec/issues/615 is an open SARIF 2.2 proposal to clarify how `guid`, `correlationGuid`, `fingerprints`, `partialFingerprints`, and `workItemUris` relate. Today they sit "organized flatly in the `result` object" with no stated interaction.

#### The third mechanism most readers miss

§3.27.2, "Distinguishing logically identical from logically distinct results," describes three architectures, not one:

> "Some result management systems do this by calculating a fingerprint for each result and considering results with the same fingerprint to be logically identical."

> "Other result management systems group results into equivalence classes without associating a computed fingerprint with each result, and they denote each equivalence class with an arbitrary unique identifier. This identifier is opaque: it is not calculated from information stored in the result, and hence contains no readable information about the result."

> "SARIF accommodates all these types of result management systems. Result management systems that compute fingerprints SHOULD populate the `fingerprints` property (3.27.16). Result management systems that group results into equivalence classes based on an arbitrary unique identifier SHOULD populate the `correlationGuid` property (3.27.4), regardless of whether they also compute a fingerprint."

A tool analysing a system with **native stable object identifiers** — which Notion has — belongs in the second camp. Content hashing is a workaround for the absence of stable ids. `workspace_lint` does not have that absence.

### SonarQube

Docs: https://docs.sonarsource.com/sonarqube-server/2025.4/user-guide/issues/solution-overview/

Rename detection runs **first**, as a separate file-identity step. Then, per file, the algorithm matches base issues against raw issues, strongest evidence first:

1. "If the issue is on the same rule, with the same line hash (but not necessarily with the same message): MATCH"
2. "If the issue is on the same rule, on the same line number with the same message (but not necessarily with the same line hash): MATCH"
3. "If the issue is on the same rule but the detected block moved inside the file, then if the issue is on the same line within the moved block, and has the same message: MATCH"

Line hash definition: "calculated based on the content of the first line the issue is reported on, excluding the white spaces." For multi-line issues, the hash of the first line is used.

Outcomes: an unmatched raw issue is new; an unmatched base issue is Fixed; a match against a previously-Fixed issue reopens it.

Failure modes:

- Tier 1 breaks when the line's text is edited, dropping to tier 2, which breaks on insertion above.
- Two textually identical statements in one file are indistinguishable at tier 1. SonarQube contains the damage by matching greedily inside a single file.
- SonarQube does **not** try to make the fingerprint survive rename. It resolves the rename first. The lesson: file identity and finding identity are separate problems and should be solved separately.

### Semgrep

Docs: https://docs.semgrep.dev/semgrep-code/glossary (diff-aware definition); https://semgrep.dev/docs/semgrep-code/remove-duplicates (fingerprint composition); https://semgrep.dev/docs/semgrep-ci/findings-ci (CI behaviour).

Two identifiers: `syntactic_id` and `match_based_id`. For `match_based_id`, match information is combined and hashed, then Semgrep **appends an index** — the ordinal of that rule's match within the file — rather than folding the index into the hash. Stated purpose: `123_0` and `123_1` are visibly siblings from one rule matching one file. Semgrep's claim: this "can determine if a given finding in a file is the same as a finding identified during a different scan, even if the code snippet that the rule matched had been moved to a different location in the file."

Failure mode: the appended index renumbers when the count of preceding matches changes. Identity survives motion but not insertion of a sibling match earlier in the file.

Baseline: `--baseline-commit` runs the analysis **twice** — once at HEAD, once against a `git worktree` of the baseline commit — and reports the set difference. Semgrep persists no baseline artifact; it re-derives the baseline from version control on every run.

### CodeQL / GitHub code scanning

https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/sarif-support-for-code-scanning

> "GitHub uses the `partialFingerprints` property in the OASIS standard to detect when two results are logically identical."

Code scanning consumes **only** `primaryLocationLineHash` from the `partialFingerprints` object. Uploading through the `upload-sarif` action causes GitHub to back-fill fingerprints from source files. Uploading through the `/code-scanning/sarifs` API without them produces the documented degradation:

> "If you upload a SARIF file without fingerprint data using the `/code-scanning/sarifs` API endpoint, the code scanning alerts will be processed and displayed, but users may see duplicate alerts."

Identity is a line-content hash computed by the **ingesting** system — exactly the division of labour SARIF Appendix B prescribes.

### ESLint

**ESLint has no cross-run finding identity. None.** Evidence rather than assertion:

- Its only persistent cross-run state is `eslint-suppressions.json`, whose entire schema is `{path: {ruleId: {count: N}}}` — https://eslint.org/blog/2025/04/introducing-bulk-suppressions/ . A count is not an identity. It records how many violations were accepted, never which.
- ESLint's JSON formatter output carries no fingerprint, GUID, or correlation field.
- Searched for a native baseline or ratchet feature; found only third-party ratchets comparing per-rule counts.

Caution for anyone re-treading this search: web.dev's "Support for CSS and Baseline has shipped in ESLint" (https://web.dev/blog/eslint-baseline-integration) concerns the **Web Platform Baseline** feature-support dataset. It is an unrelated meaning of the word and is not evidence of cross-run tracking.

**Finding for Q1:** ESLint is the only tool in this set with nothing to teach on identity, and identity is this project's hardest problem.

---

## 2. Baseline and suppression as separate concepts

| Tool | Accepted debt, still counted | Hidden exception | Reason required | Expiry | Self-prunes |
|---|---|---|---|---|---|
| SonarQube new code | yes — old issues stay visible, gate applies to new code only | resolve as won't-fix | comment optional | 90-day cap on "number of days" NCD | n/a |
| Semgrep `--baseline-commit` | derived per run from git, never stored | `# nosemgrep` | no | no | n/a (recomputed) |
| ESLint suppressions (9.24+) | file + rule + count | `/* eslint-disable */` | **no** | **no** | yes, non-zero exit until `--prune-suppressions` |
| PHPStan baseline | message regex + count + path | `@phpstan-ignore` | no | no | yes, reports vanished entries |
| OWASP Dependency-Check | suppression XML | same file | `<notes>`, free text, optional | **`until` attribute** | via expiry |
| TypeScript | n/a | `@ts-ignore` | no | no | `@ts-expect-error` only |
| Ruff | n/a | `# noqa: CODE` | **no** (open request) | no | RUF100 unused-noqa |

### SonarQube new code — the only structural separation

https://docs.sonarsource.com/sonarqube-server/user-guide/about-new-code

Old issues are never hidden. The **quality gate** is scoped to code changed since the new-code start date. Each project carries a new-code definition (NCD) setting. "All lines of code that are not in the reference branch or have changed since the start date of the new code period are marked, and all issues with one or more of the marked lines as primary or secondary locations are categorized as new code issues."

The "number of days" option caps at 90, and the docs state the rot rate outright: if no action is taken on a new issue within the period, "this issue becomes part of the overall code."

### ESLint bulk suppressions

Shipped in v9.24.0. Docs: https://eslint.org/docs/latest/use/suppressions ; announcement: https://eslint.org/blog/2025/04/introducing-bulk-suppressions/

File format, verbatim from the announcement:

```json
{
  "src/file1.js": {
    "no-undef": {
        "count": 1
    }
  },
  "src/file2.js": {
    "no-unused-expressions": {
        "count": 2
    }
  }
}
```

No reason field. No expiry field. Entries are matched by file path and rule name. If more violations appear for the same rule in the same file than the recorded count, ESLint reports **all** of them.

Anti-rot mechanism: unused entries produce a non-zero exit with "There are suppressions left that do not occur anymore. Consider re-running the command with `--prune-suppressions`."

Then v9.28.0 added `--pass-on-unpruned-suppressions`, which suppresses the non-zero exit while leaving the stale entries in place — https://eslint.org/blog/2025/05/eslint-v9.28.0-released/ . The escape hatch shipped one month after the discipline.

Also documented: "Only rules configured as `error` are suppressed. If a rule is enabled as `warn`, ESLint will not suppress the violations."

### PHPStan baseline

https://phpstan.org/user-guide/baseline

> "PHPStan allows you to declare the currently reported list of errors as 'the baseline' and cause it not being reported in subsequent runs."

> "The life goal of a baseline file is to not exist."

Entries match on three criteria: a regex of the error message, a `count`, and a `path`. When ignored errors stop occurring, "PHPStan will let you know and you will have to remove the pattern from the baseline file."

The count-based design has a specific silent failure: two violations of one rule in one file are interchangeable, so fixing one and introducing another nets zero and passes.

### Evidence of suppression files rotting into permanent blindness

- Drupal accepted a large PHPStan baseline to reach level 9: https://www.drupal.org/project/drupal/issues/3426047 . The issue records that plans to fix the underlying errors "grinded to a halt."
- A separate, long-running Drupal issue exists purely to fix errors already ignored in `phpstan-baseline.neon`: https://www.drupal.org/project/lms/issues/3485672 . The baseline outlived the migration it was meant to bridge.
- PHPStan itself files the structural complaint: "Some errors could not be put into baseline. Re-run PHPStan and fix them." is reported as a **warning**, not an error — https://github.com/phpstan/phpstan/issues/3890 — so a partially-failed baseline write does not fail the run.
- Community write-ups converge on the same discipline and the same failure: never regenerate the baseline to absorb new errors, because a silently growing baseline defeats its purpose.

### Who enforces a reason or an expiry

**Expiry: OWASP Dependency-Check alone.** https://dependency-check.github.io/DependencyCheck/general/suppression.html

The `until` attribute makes a suppression time-limited: `<suppress until="2020-01-01Z">` "Suppresses a given CVE for a dependency with the given sha1 until the current date is 1 Jan 2020 or beyond." After that date the rule no longer applies and the finding returns. Suppressions match on `<sha1>`, `<packageUrl>`, `<gav>`, or `<filePath>`, narrowed by `<cpe>` or `<cve>`. A `<notes>` CDATA element carries free-form rationale — optional, never enforced.

This is the only mechanical suppression expiry found in the sweep.

**Reason: nobody enforces it.**

- Ruff's request to require an explanation after `# noqa` is open, not shipped: https://github.com/astral-sh/ruff/issues/5182 . Ruff does ship `blanket-noqa` (PGH004, https://docs.astral.sh/ruff/rules/blanket-noqa/), which forces a *rule code* — "Blanket noqa annotations are more difficult to interpret and maintain, as the annotation does not clarify which diagnostics are intended to be suppressed" — but a code is not a reason.
- Searched for a Checkstyle mechanism requiring justification text on `SuppressionCommentFilter`. **Searched, found none.** Query: `ruff noqa blanket-noqa require rule code Checkstyle SuppressionCommentFilter reason justification suppression requires comment`.

**SARIF is the exception at the format level.** From `sarif-schema-2.1.0.json`:

- `suppression.justification`: "A string representing the justification for the suppression."
- `suppression.status`: "A string that indicates the review status of the suppression." Enum: `accepted`, `underReview`, `rejected`.
- `suppression.kind`: "A string that indicates where the suppression is persisted." Enum: `inSource`, `external`.

SARIF models a suppression as a **reviewable object with a state machine**, not a mute switch. No tool surveyed implements that model fully.

### The self-pruning design that works

`@ts-expect-error`, TypeScript 3.9 — https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html

The suppression **is itself an assertion**. When a line is preceded by `// @ts-expect-error`, TypeScript suppresses the error; if there is no error, TypeScript reports that the directive was unnecessary ("Unused '@ts-expect-error' directive"). `// @ts-ignore` does nothing when the following line is error-free, so it survives forever.

Same family:

- ESLint `linterOptions.reportUnusedDisableDirectives` defaults to `"warn"` in v9 — https://eslint.org/docs/latest/use/configure/configuration-files
- Ruff RUF100 unused-noqa — https://docs.astral.sh/ruff/rules/unused-noqa/ — "enforces that noqa directives are 'valid', in that the violations they say they ignore are actually being triggered on that line."

**Finding for Q2:** the field has converged on *self-invalidating* suppressions and has almost entirely failed at *reasoned* and *expiring* ones. A greenfield tool can have all three at near-zero cost, and the one shipped expiry implementation (`until`) is trivial to copy.

---

## 3. Incomplete analysis as a first-class result

### SARIF states the requirement normatively

§3.20.21, `invocation.toolExecutionNotifications`:

> "An invocation object MAY contain a property named `toolExecutionNotifications` whose value is an array of zero or more notification objects (3.58). Each element of the array represents a runtime condition detected by the invoked process, either by the tool's driver or by one of its extensions. The presence within this array of any notification object whose `level` property (3.58.6) is `"error"` SHALL mean that the run failed. A SARIF consumer SHALL NOT assume that a failed run contains a complete set of analysis results."
>
> "NOTE: This is important in compliance scenarios, where, for example, a corporate policy might require that a project's entire code base be analyzed with a specified set of rules."

That NOTE is the most load-bearing sentence found in this sweep. The SARIF committee identified this project's central claim, named the scenario "compliance," and gave it a normative consequence.

Supporting machinery:

- `invocation.executionSuccessful`, required in the schema: "Specifies whether the tool's execution completed successfully."
- `invocation.toolConfigurationNotifications`: "A list of conditions detected by the tool that are relevant to the tool's configuration." The spec's own example is a rule that could not be disabled because no rule with that id exists — a *configuration* fault, distinct from a *runtime* fault.
- The spec's worked example of graceful degradation carries level `error` and the message "Exception evaluating rule \"C2001\". Rule disabled; run continues." The run continues, and it is nonetheless formally a failed run.
- §3.20.21 NOTE on partial execution: "If the error occurs in the course of evaluating a rule, the tool might report the error in `toolExecutionNotifications`, disable the rule, and continue to execute the remaining rules. If the error occurs outside of the evaluation of a rule, the tool might report the error in `toolExecutionNotifications` and then halt."

What SARIF does **not** have: any object expressing analysis *scope* or *coverage* — "I intended to analyse N objects; I reached M." Verified by enumerating `run`'s properties from `sarif-schema-2.1.0.json`: `tool, invocations, conversion, language, versionControlProvenance, originalUriBaseIds, artifacts, logicalLocations, graphs, results, automationDetails, runAggregates, baselineGuid, redactionTokens, defaultEncoding, defaultSourceLanguage, newlineSequences, columnKind, externalPropertyFileReferences, threadFlowLocations, taxonomies, addresses, translations, policies, webRequests, webResponses, specialLocations, properties`. No coverage or scope member exists. Incompleteness is expressible only as a notification. **Searched, found none.**

### axe-core — the four-valued result model

https://github.com/dequelabs/axe-core/blob/develop/doc/API.md ; https://docs.deque.com/devtools-for-web/4/en/needs-review-incomplete/

Results are four arrays: `passes`, `violations`, **`incomplete`**, `inapplicable`.

- `incomplete`, also called "needs review": results "were aborted and require further testing, which can happen either because of technical restrictions to what the rule can test, or because a JavaScript error occurred." Both terms mean "axe-core wasn't able to tell whether something was a violation or not with 100% certainty."
- `inapplicable`: "rules did not run because no matching content was found on the page."

This is the most directly transferable model in the sweep. It separates the three states a binary pass/fail collapses: *checked and clean*, *could not check*, and *nothing to check*.

Consequence in the field: `incomplete` does **not** fail by default. It is a manual-review queue, and downstream consumers drop it — see Lighthouse's integration issue, https://github.com/GoogleChrome/lighthouse/issues/14354 . Copy the taxonomy; reject the default disposition.

### Type checkers

mypy — https://mypy.readthedocs.io/en/stable/command_line.html and https://mypy.readthedocs.io/en/stable/running_mypy.html

- `--follow-imports {normal,silent,skip,error}`; default `normal`, "mypy will follow and type check all modules."
- `--ignore-missing-imports`: "makes mypy ignore all missing imports. It is equivalent to adding `# type: ignore` comments to all unresolved imports within your codebase." It does not suppress errors about missing names in successfully resolved modules.
- `--disallow-any-unimported`: "disallows usage of types that come from unfollowed imports (such types become aliases for `Any`). Unfollowed imports occur either when the imported module does not exist or when `--follow-imports=skip` is set."
- mypy's own warning on skip mode: it "greatly restricts the analysis mypy can perform and you will lose a lot of the benefits of type checking."

**`--strict` does not include `--disallow-any-unimported`.** The documented `--strict` set is: `--disallow-any-generics`, `--disallow-subclassing-any`, `--disallow-untyped-calls`, `--disallow-untyped-defs`, `--disallow-incomplete-defs`, `--check-untyped-defs`, `--disallow-untyped-decorators`, `--warn-redundant-casts`, `--warn-unused-ignores`, `--warn-return-any`, `--no-implicit-reexport`, `--strict-equality`, `--extra-checks`.

Stated plainly: mypy's strictest preset still lets unseen code silently become `Any`. The opt-in for "fail when I could not see it" exists and is off even in strict mode. Background on how much checking silently disappears under import settings: https://engineering.kraken.tech/news/2024/08/19/mypy-imports.html

TypeScript's `skipLibCheck` has the same shape: a switch that trades unseen surface for speed, with no report of what went unchecked.

### Coverage tools

coverage.py separates "not executed" from "not measured" only when told the intended scope — https://coverage.readthedocs.io/en/latest/source.html :

> "If the source option is specified, only code in those locations will be measured."

> "Specifying the source option also enables coverage.py to report on un-executed files, since it can search the source tree for files that haven't been measured at all."

Restrictions: "Only importable files (ones at the root of the tree, or in directories with a `__init__.py` file) will be considered"; files with unusual punctuation or non-Python extensions are skipped.

Without `source`, a never-imported file is simply absent from the report, indistinguishable from a file that does not exist. Diagnosing the gap requires `--debug=trace`, which "will write a line for each file considered, indicating whether it is traced or not, and if not, why not" — https://coverage.readthedocs.io/en/latest/faq.html

**Transferable rule: a scanner must be told its intended denominator, or it cannot report incompleteness at all.** A Notion scanner that only walks what the API hands back has no denominator and cannot know what it missed.

### SAST and vulnerability scanning

CodeQL surfaces extraction diagnostics and explicitly declines to fail on them — https://docs.github.com/en/code-security/reference/code-scanning/troubleshoot-analysis-errors/extraction-errors-in-the-database :

> "A small number of extractor errors is healthy and typically indicates a good state of analysis."

Investigation is warranted only when errors appear "in the overwhelming majority of files that were compiled during database creation." The silent-undercount case is handled by a troubleshooting page rather than a failure — https://docs.github.com/en/code-security/how-tos/scan-code-for-vulnerabilities/troubleshooting/troubleshooting-analysis-errors

Vulnerability scanning supplies the canonical cautionary tale. Nessus plugin 19506 reports "Credentialed checks: no," and a scan that ran without credentials produces a clean-looking report that is mostly blind. Entire report templates exist to hunt for these — https://www.tenable.com/sc-report-templates/credentialed-scan-failures . The field even has a documented false negative on the incompleteness signal itself: plugin 19506 can report "no" while the host was in fact authenticated, so guidance is to cross-check plugin 110095 — https://community.tenable.com/s/question/0D53a00007DS2NTCA1/

This is precisely the Notion 404-means-either failure. The industry's answer was a second, independent check on whether the scan could see.

**Finding for Q3.** SARIF **mandates** that a failed run be treated as incomplete but leaves enforcement to the consumer. axe-core **models** incompleteness cleanly but does not fail on it. mypy, TypeScript, and CodeQL **log** it and pass. coverage.py **can** detect it, but only against a declared scope. Nobody surveyed fails the build on partial visibility by default. The project's claim "a partial scan cannot pass" is a genuine differentiator, and it is *supported* by SARIF's normative text rather than being novel.

---

## 4. Determinism under a nondeterministic input source

### SARIF Appendix F is a determinism checklist

Appendix F, "(Informative) Producing deterministic SARIF log files," names four problems: non-deterministic format elements, array and dictionary ordering, absolute paths, and baseline handling. F.1:

> "Authors of analysis tools are encouraged to provide a mechanism (for example, a command line option such as `--deterministic`) which instructs the tool to produce deterministic output."

**F.2 — fields to omit.** The list maps almost one-to-one onto a Notion scanner's incidental state: `invocation.startTimeUtc`, `endTimeUtc`, `processId`, `machine`, `account`, `workingDirectory`, `environmentVariables`, `commandLine`, `arguments`, `stdin`/`stdout`/`stderr`; `notification.timeUtc`, `notification.threadId`; `result.guid`; `run.automationDetails.guid` and the trailing component of `run.automationDetails.id`; `run.baselineGuid`; `run.originalUriBaseIds`; `run.addresses`; `versionControlDetails.revisionId` and `asOfTimeUtc`.

**F.3 — ordering, the concrete recipe.**

> "A multi-threaded analysis tool analyzing multiple artifacts in parallel might produce results in any order, and there is no natural order for the results. A tool might choose to order them, for example, first alphabetically by analysis target URI, then numerically by line number, then by column number, then alphabetically by rule id."

> "For dictionaries such as the `artifact.hashes` object, a tool might order the property names alphabetically, using a locale-insensitive ordering."

**F.4 — absolute paths.** Emit URIs relative to declared roots and pair each `artifactLocation.uri` with an `artifactLocation.uriBaseId`.

**F.5 — inherently non-deterministic tools.** Expose the random seed as a command-line argument.

**F.6 — compensating after the fact.** A post-processing step can strip non-deterministic elements, reorder arrays and properties, and remove path prefixes. This is the expensive alternative to designing for determinism up front.

**F.7** flags that baselining interacts badly with determinism, because a baseline reference changes the log for identical inputs.

### The canonicalisation standard to name

**RFC 8785, JSON Canonicalization Scheme (JCS)** — https://www.rfc-editor.org/rfc/rfc8785

Purpose, from the abstract: to enable "cryptographic operations like hashing and signing" over JSON so that "operations are reliably repeatable."

Rules that matter:

- Object properties MUST be sorted recursively by **UTF-16 code unit** comparison, ascending; where one string is a prefix of another, the shorter precedes the longer.
- Numbers serialise per ECMAScript IEEE-754 double rules. The RFC calls this "relatively complex" and points at V8's implementation as the reference.
- Control characters U+0000–U+001F escape as lowercase `\uhhhh`, except the five short forms `\b \t \n \f \r`. Lone surrogates are an error.
- Output is UTF-8, "intended to be usable as input to cryptographic methods."

If the tool emits JSON that is hashed, signed, diffed, or used as a cache key, JCS is the standard to cite and implement. The trap the RFC hands you free: naive `JSON.stringify` with sorted keys is **not** JCS, because number formatting and UTF-16 ordering differ from what most sort implementations produce.

### Record–replay for the remote source

Netflix **Polly.js** — https://github.com/Netflix/pollyjs — "records your test suite's HTTP interactions and replays them during future test runs for fast, deterministic, accurate tests." Recordings persist as **HAR** files. Relevant configuration: `recordIfMissing`, `recordIfExpired`, `recordFailedRequests`.

Its documented gotcha is instructive: the server **port** is part of the record signature by default, so an environment change silently produces a second cassette instead of a replay. That is the same class of churn bug as SARIF issue #122 — an incidental environment detail folded into an identity key.

The VCR/cassette pattern generalises to a design rule: **separate the fetch from the analysis with a durable, content-addressed snapshot in between.** For `workspace_lint` that snapshot is not a test convenience. It is the only way to (a) re-run rules without re-spending the ~3 req/sec budget, (b) diff two scans of a workspace being edited under you, and (c) claim a finding was true of a *specific observed state* rather than of "Notion, at some point during a 40-minute crawl."

---

## 5. The reframe

**ESLint is the wrong anchor.** It is wrong for output, wrong for identity, wrong for suppression lifecycle, and wrong for the failure model. It is right only for the part that was easiest anyway: rules are plugins with ids and severities.

| Concern | ESLint's answer | Why it does not transfer |
|---|---|---|
| Cross-run identity | none | Notion objects are renamed and moved constantly; an identity-less report is unusable on the second run |
| Output contract | bespoke JSON formatters | no fingerprint, no baseline state, no suppression state, no run metadata |
| Suppression | inline comments in the artifact | you cannot write `/* eslint-disable */` into someone's Notion page; suppressions must be external and durable |
| Incompleteness | inconceivable — the filesystem is fully readable | the entire hard part of this product |
| Determinism | trivially satisfied — same files, same output | the input mutates during the scan |

### Recommendation

**Adopt SARIF 2.1.0 as the output contract, and the SonarQube issue-lifecycle model as the state machine over it.**

Justification:

- SARIF already defines every field this product needs and cannot get from ESLint: `fingerprints` / `partialFingerprints` / `correlationGuid` for identity; `baselineState` (`new | unchanged | updated | absent`) for debt accounting; `suppression` with `justification` and `status` (`accepted | underReview | rejected`) for reviewable exceptions; `toolExecutionNotifications` with the normative "SHALL NOT assume complete" rule for partial scans; Appendix F for byte-stable output.
- The SARIF committee reasoned explicitly about the **compliance** case, which is this product's case.
- Adoption is nearly free at v0.1 and buys interoperability with GitHub code scanning and every SARIF viewer.
- SonarQube supplies what SARIF deliberately omits: the *algorithm* for matching findings run to run, and the new-code/old-code split that lets a workspace with 400 pre-existing defects still have a meaningful gate.

### Strongest counter-argument to that recommendation

SARIF is a source-code artifact format with source-code assumptions in its core. `physicalLocation` presumes a URI, a region, lines and columns. `logicalLocation` presumes programmatic constructs with `fullyQualifiedName` and `parentIndex`. A Notion database property has no line number and no byte offset. You would model every finding through `logicalLocation` plus property bags, inheriting a large, deeply source-shaped schema and using perhaps 30% of it — while SARIF-rendering consumers display your findings badly, because they expect to open a file at a line. The real risk: v0.1's budget goes to schema conformance instead of the rule engine and the 72-hour API proof.

**Mitigation that preserves the value.** Treat SARIF as a *design source* now and an *export target* later. Copy its field semantics into a native model in v0.1; add `--format sarif` once the rule catalogue is stable. Do not let the API proof become a schema exercise.

### Is it a linter at all?

No. Structurally this is a **compliance/audit tool over an incompletely-observable system**. Two fields have solved that better than static analysis has.

1. **Security control assessment — NIST OSCAL Assessment Results.** https://pages.nist.gov/OSCAL-Reference/models/v1.1.2/assessment-results/json-definitions/ ; overview at https://pages.nist.gov/OSCAL/ . OSCAL separates **observation** (what the assessor saw, with evidence and provenance) from **finding** (the judgement, with an `objective-status` whose state is `satisfied` or `not-satisfied`, plus reason and remarks). Findings reference the observations "that were used to determine the finding," and `back-matter` resources are typed `evidence` and `tool-output`. That observation/finding split is exactly what a Notion scanner needs, because "I got a 404" is an observation supporting no finding at all, and OSCAL is built to say so.
2. **Credentialed vulnerability scanning.** It learned the hard way that a scan which could not authenticate produces a clean-looking report, and responded by making scan visibility a first-class, separately-checked artifact.

Neither displaces the SARIF + SonarQube recommendation. Both sharpen it: take OSCAL's observation/finding separation and axe-core's four-valued outcome, express them in SARIF's vocabulary, and run SonarQube's matching algorithm over the result.

### Candidates evaluated and not recommended

- **Database schema-migration checker** (Flyway, Liquibase, `squawk`). The analogy fails on the decisive axis: a migration checker reads a complete, versioned, single-writer artifact. It solved ordering and idempotency, not partial visibility.
- **Dependency / SBOM auditor.** Closer, and Dependency-Check's `until` is worth stealing outright, but PURL and CPE solve its identity problem for it. Identity is not where that field did its hardest thinking.
- **Monitoring alert dedup.** https://prometheus.io/docs/alerting/latest/alertmanager/ . Alertmanager's two-level identity model is worth borrowing conceptually — deduplication keys on a hash of the **full** label set, grouping keys on a hash of the `group_by` **subset**, which cleanly separates "one finding" from "one issue class." But alerting has no baseline, no suppression justification, and treats incompleteness as a scrape failure rather than a result.
- **Accessibility auditor (axe-core).** The single best idea in the sweep — `incomplete` as a first-class array — but it is a result taxonomy, not an anchor architecture.

---

## WHAT THIS PROJECT SHOULD CHANGE

Ranked by value per unit of v0.1 effort.

1. **Replace ESLint with SARIF as the stated prior-art anchor for the output contract; keep ESLint only for "rules are pluggable, id'd, severity-tagged."** SARIF §3.27.16/17, §3.27.2, §3.20.21, and Appendices B and F cover identity, baseline, suppression, incompleteness, and determinism — all five hard problems. ESLint covers none. https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html

2. **Adopt a four-valued rule outcome — `pass` / `violation` / `incomplete` / `inapplicable` — and make `incomplete` fail the run by default.** Taxonomy from axe-core (https://github.com/dequelabs/axe-core/blob/develop/doc/API.md); failure disposition from SARIF §3.20.21's "A SARIF consumer SHALL NOT assume that a failed run contains a complete set of analysis results," with its compliance NOTE. Diverge from axe-core on disposition: their `incomplete` is advisory and gets dropped downstream (https://github.com/GoogleChrome/lighthouse/issues/14354).

3. **Make Notion's 404 ambiguity an explicit observation, never a silent absence — and require a declared scope so the tool has a denominator.** coverage.py cannot report un-executed files without `source` (https://coverage.readthedocs.io/en/latest/source.html). Nessus's "Credentialed checks: no" is the canonical clean-looking blind report (https://www.tenable.com/sc-report-templates/credentialed-scan-failures). OSCAL separates observation from finding precisely so unresolvable evidence supports no judgement (https://pages.nist.gov/OSCAL-Reference/models/v1.1.2/assessment-results/json-definitions/).

4. **Build finding identity on Notion's native object id, not on a content hash — the SARIF `correlationGuid` path, not the `fingerprints` path.** §3.27.2 explicitly provides for systems that "denote each equivalence class with an arbitrary unique identifier... not calculated from information stored in the result." Notion object ids survive rename and move, which is what SonarQube's line hash and Semgrep's `match_based_id` are elaborate workarounds for lacking. Use `partialFingerprints` for the *within-object* discriminator (which property, which rule occurrence) so one rule firing twice on one page stays distinguishable — Semgrep's appended-index trick, https://semgrep.dev/docs/semgrep-code/remove-duplicates.

5. **Split "accepted debt" from "suppression" at the data-model level, and require both a reason and an expiry on suppressions.** SonarQube new code is the only structural separation found, and its docs concede the rot rate — after the period, "this issue becomes part of the overall code" (https://docs.sonarsource.com/sonarqube-server/user-guide/about-new-code). Dependency-Check's `until` is the only shipped mechanical expiry (https://dependency-check.github.io/DependencyCheck/general/suppression.html). SARIF already types the fields: `suppression.justification`, `suppression.status ∈ {accepted, underReview, rejected}`. No surveyed tool enforces a reason; Ruff's request is open (https://github.com/astral-sh/ruff/issues/5182).

6. **Make every suppression self-invalidating: a suppression that matches nothing is an error, not a shrug.** `@ts-expect-error` vs `@ts-ignore` is the cleanest instance (https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html); ESLint `reportUnusedDisableDirectives` defaults to `warn` in v9; Ruff RUF100. **Do not ship the escape hatch** — ESLint shipped `--pass-on-unpruned-suppressions` one release after the discipline (https://eslint.org/blog/2025/05/eslint-v9.28.0-released/), and abandoned PHPStan baselines show the end state (https://www.drupal.org/project/lms/issues/3485672).

7. **Never use counts as baseline entries.** ESLint's `{path: {rule: {count: N}}}` (https://eslint.org/blog/2025/04/introducing-bulk-suppressions/) and PHPStan's `message` + `count` + `path` (https://phpstan.org/user-guide/baseline) both admit a silent swap: fix one violation, introduce another, net zero, gate passes. With stable Notion object ids there is no reason to accept that weakness.

8. **Insert a content-addressed snapshot between fetch and analysis; run rules only against the snapshot.** Polly.js record/replay for deterministic runs over HTTP (https://github.com/Netflix/pollyjs); the ~3 req/sec and 10,000-result ceilings make re-fetching per rule untenable. Heed Polly's own churn bug — the port is part of the record signature by default — as a warning to define the snapshot key deliberately.

9. **Specify byte-stable output now: a fixed sort order for findings, and RFC 8785 JCS for any JSON that is hashed, signed, or diffed.** RFC 8785 (https://www.rfc-editor.org/rfc/rfc8785) for canonicalisation; SARIF Appendix F.3 for the concrete sort recipe and F.2 for the timestamp/pid/host fields to exclude. Appendix B states the coupling: non-deterministic elements in the identity computation destroy the identity.

10. **Add a `--deterministic` flag from day one rather than retrofitting it.** SARIF Appendix F.1 recommends exactly this, by that name. F.6 documents the cost of the alternative: a post-processing pass that strips non-deterministic elements after the fact.

---

## Negative results

Recorded so the next reader does not repeat the search.

- **No SARIF object expresses analysis scope or coverage.** Incompleteness is representable only as a notification. Verified by enumerating `run`'s properties in `sarif-schema-2.1.0.json`.
- **No linter or SAST tool found enforces a mandatory reason on suppressions.** Ruff's proposal is open; Dependency-Check's `<notes>` is optional; Checkstyle — searched, found none. Query: `ruff noqa blanket-noqa require rule code Checkstyle SuppressionCommentFilter reason justification suppression requires comment`.
- **ESLint has no native cross-run finding identity.** Queries: `ESLint stateless no memory between runs does eslint track issues across runs baseline feature request`; `ESLint 9 bulk suppressions suppressions file --suppress-all eslint-suppressions.json release notes`. The apparent hit — web.dev's "Baseline has shipped in ESLint" — is the unrelated Web Platform Baseline dataset.
- **`--strict` in mypy does not include `--disallow-any-unimported`.** Verified against the documented `--strict` flag list at https://mypy.readthedocs.io/en/stable/command_line.html
- **No surveyed tool fails a build on partial analysis coverage by default.** SARIF mandates the consumer must not assume completeness, but enforcement is left to the consumer.

## Method note

Primary sources were fetched, not recalled. The SARIF quotations come from the committee-specification HTML in the OASIS repository, downloaded and converted to plain text; the schema one-liners come from `sarif-schema-2.1.0.json` in the same repository. Two intermediate summarisation passes garbled spec attributions during the sweep (one placed `fingerprints` on the `invocation` object rather than `result`); the quotations above were re-derived from the downloaded specification text and the schema, which are authoritative.
