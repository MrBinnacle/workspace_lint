# Result taxonomy: what the static-analysis field actually does

**Evidence class: documented.** This file records what primary sources state. No Notion response was
involved. Nothing here outranks `docs/proof/`.

Run for issue **#70**. Scope: Decision A (a detection that infers its own invariant) and Decision B
(metrics alongside rules), tested against the normative SARIF text, first-party tool documentation,
and the adoption literature.

All URLs in this file were fetched 2026-08-18 UTC (2026-08-17 local session date). Where a fetch
returned a non-200 or the tool summarised rather than quoted, that is recorded in place.

---

## 0. Recommendation, stated first

**Decision A — adopt the split, and correct one thing in the framing.** SARIF does not have one
non-failing bucket. It has four, and two of them are different in a way this product cares about.
`informational` means *"does not indicate the presence of a problem"*. `review` means *"requires
review by a human user to decide if it represents a problem"* (§3.27.9). Duplicate page titles
inside a data source are `review`-shaped, not `informational`-shaped: the tool cannot decide
whether uniqueness was intended, which is precisely Principle 4's reason for refusing to infer it.
Filing the detection as a bare "observation carrying no conformity claim" collapses the two, and
this repository's own deletion test — *a value is distinct when its remedy is distinct* — separates
them: the remedy for informational output is nothing, and the remedy for review output is that a
human decides and may then declare `UNQ001`. **The detection should carry a declared upgrade path
to a violation, not merely an absence of one.** The field's uniform practice supports that: of six
tools surveyed, **every single informational tier has a documented switch that promotes it to a
build failure.** None is non-failing by construction. See §3.

**Decision B — adopt it as proposed. It is the least controversial finding in this file.** SARIF
2.1.0 contains the word "metric" **zero times** and the word "coverage" **zero times** across the
whole 227-page specification (§1.4, method and counts stated there). There is no measure object,
no metric object, no place in the result stream for a count that tests nothing — a tool emitting
per-database counts in SARIF must put them in a property bag (§3.8), which is explicitly the
extension escape hatch. SonarQube reaches the same shape by a different route: Issues and Measures
are separate object types with separate API domains, and **the Quality Gate is defined over
metrics, never over individual issues** (§2). Per-database counts are not Rules, get no coverage
item, and contribute nothing to the exit byte.

**The counter-argument, stated in the same breath.** Sadowski et al. (CACM 2018) record Google
disabling the warning tier outright: *"the Clang team enabled the new diagnostic as a compiler
error (not a warning, which the Clang team found Google developers ignored) to break the build, a
report difficult to disregard"* (p. 61). Kim and Ernst (FSE 2007) measured the fate of unblocked
warnings: *"about 90% of warnings either remain or are removed during non-fix changes"* (§4). The
counter-argument bites **harder on B than on A**, because a metrics section has no upgrade path by
construction — nobody ever declares "47 rollups" to be a violation. The mitigation is in §5.

---

## 1. SARIF 2.1.0 — `result.kind` and `result.level`

Source: *Static Analysis Results Interchange Format (SARIF) Version 2.1.0*, OASIS Standard,
27 March 2020. Cited by section number. Retrieved as
`https://docs.oasis-open.org/sarif/sarif/v2.1.0/os/sarif-v2.1.0-os.pdf` (HTTP 200, 4,284,167
bytes) and extracted with pypdf 6.10.2.

**Route note.** The single-page HTML at
`https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html` was fetched first and is
unusable for this purpose: the converter truncates the document part-way through §3.10, and a
second fetch asking for §3.27 verbatim returned *"I cannot locate sections 3.27.9 and 3.27.10 …
The content appears to be truncated mid-document."* The PDF route was taken because of that
truncation, not in preference to it. Every quotation below is verbatim from the PDF text layer.

### 1.1 §3.27.9 kind property — verbatim

> A result object **MAY** contain a property named `kind` whose value is one of a fixed set of
> strings that specify the nature of the result.
>
> If present, the `kind` property **SHALL** have one of the following values, with the specified
> meanings:
>
> - `"pass"`: The rule specified by `ruleId` (§3.27.5), `ruleIndex` (§3.27.6), and/or `rule`
>   (§3.27.7) was evaluated, and no problem was found.
> - `"open"`: The specified rule was evaluated, and the tool concluded that there was insufficient
>   information to decide whether a problem exists.
>   - NOTE 1: This value is used by proof-based tools. Sometimes such a tool can prove that there
>     is no violation (`kind` = `"pass"`), sometimes it can prove that there is a violation
>     (`kind` = `"fail"`), and sometimes it does not detect a violation but is unable to prove that
>     there is none (`kind` = `"open"`). In such a tool, a `kind` value of `"open"` might be an
>     indication that the user should add additional assertions to enabe [sic] the tool to
>     determine if there is a violation.
> - `"informational"`: The specified rule was evaluated and produced a purely informational result
>   that does not indicate the presence of a problem. (See the example below.)
> - `"notApplicable"`: The rule specified by `ruleId` was not evaluated, because it does not apply
>   to the analysis target.
> - `"review"`: The result requires review by a human user to decide if it represents a problem.
>   - NOTE 2: This value is used by tools that are unable to check for certain conditions, but that
>     wish to bring to the user's attention the possibility that there might be a problem. For
>     example, an accessibility checker might produce a result with the message "Do not use color
>     alone to highlight important information," with `kind` = `"review"`. A user might address
>     this issue by visually inspecting the UI.
> - `"fail"`: The result represents a problem whose severity is specified by the `level` property
>   (§3.27.10).
>
> If `kind` is absent, it **SHALL** default to `"fail"`.
>
> If `level` has any value other than `"none"` and `kind` is present, then `kind` **SHALL** have
> the value `"fail"`.

The §3.27.9 example is a binary checker that emits `"notApplicable"` for a rule that applies only
to 32-bit binaries when run on a 64-bit one, and `"informational"` for a result whose whole message
is *"MyTool64.exe was compiled with Example Corporation Compiler version 10.2.2."* That is the
spec's own picture of an informational result: **a recorded fact about the analysed artifact,
carrying no claim.**

### 1.2 §3.27.10 level property — verbatim

> A result object **MAY** contain a property named `level` whose value is one of a fixed set of
> strings that specify the severity level of the result.
>
> If present, the `level` property **SHALL** have one of the following values, with the specified
> meanings:
>
> - `"warning"`: The rule specified by `ruleId` was evaluated and a problem was found.
> - `"error"`: The rule specified by `ruleId` was evaluated and a serious problem was found.
> - `"note"`: The rule specified by `ruleId` was evaluated and a minor problem or an opportunity
>   to improve the code was found.
> - `"none"`: The concept of "severity" does not apply to this result because the `kind` property
>   (§3.27.9) has a value other than `"fail"`.
>
> If `kind` (§3.27.9) has any value other than `"fail"`, then if `level` is absent, it **SHALL**
> default to `"none"`, and if it is present, it **SHALL** have the value `"none"`.
>
> If `kind` has the value `"fail"` and `level` is absent, then `level` **SHALL** be determined by
> the following procedure: [a five-branch resolution over `ruleConfigurationOverrides` (§3.20.5),
> `configurationOverride.configuration.level` (§3.51.3, §3.50.3) and
> `reportingDescriptor.defaultConfiguration.level` (§3.49.14), ending] IF `level` has not yet been
> set THEN SET `level` to `"warning"`.

### 1.3 How `kind` and `level` interact — the finding

The coupling is **bidirectional and normative**, and this is the part the brief's framing did not
have. §3.27.9 forbids a severity-bearing result from having any kind but `fail`. §3.27.10 forbids a
non-`fail` result from having any severity but `none`. The two axes are therefore not orthogonal in
the loose sense: **severity is a sub-axis of `fail` and is undefined everywhere else.** A SARIF
producer cannot say "informational, but severe." The vocabulary makes that sentence unwriteable.

Mapped onto this repository's vocabulary, `kind` is the Conformity axis and `level` is a
severity axis the product does not currently have. The mapping is not clean and the mismatch is
worth naming: SARIF's `kind` conflates two of this product's distinctions. `"open"` ("insufficient
information to decide") is an Evidence-sufficiency statement — it is `undecidable` in
`CONTEXT.md`'s terms. `"notApplicable"` is an applicable-set statement — the coverage item is not
in the denominator. `"review"` is a Conformity statement of a third value the glossary does not
have: *the invariant is undeclared, so conformity is not defined.* Those three live on three
different axes in this repository and on one axis in SARIF. **A SARIF exporter is therefore lossy
in the outward direction and cannot be used as the internal model.** That is an argument for
keeping the product's own taxonomy and mapping to SARIF at the edge, which is what `PRODUCT.md`
already implies.

### 1.4 Which kinds are excluded from a failure determination — the honest answer

**SARIF 2.1.0 defines no failure determination at all.** It is an interchange format for results,
not a gate. The nearest thing is §3.20.14:

> An `invocation` object **SHALL** contain a property named `executionSuccessful` whose value is a
> Boolean that is `true` if the engineering system that started the process knows that the analysis
> tool succeeded, and `false` if the engineering system knows that the tool failed.
>
> NOTE: This property is needed because not all programs exit with an exit code of 0 on success
> and non-0 on failure.

That is a statement about whether **the tool ran**, not about whether **the code passed**. The
spec's example makes the separation explicit: `"exitCode": 1, "exitCodeDescription": "Scan
successful; warnings detected."` So the answer to "which kinds are excluded from a failure
determination" is: *the specification does not make one; the consumer does.* Anyone citing SARIF as
authority for "informational results do not fail the build" is over-reading it. What SARIF
authorises is narrower and still useful: **an informational result is structurally incapable of
carrying a severity, so a consumer that gates on severity cannot accidentally gate on it.**

Counts, verified by exhaustive text search over the extracted PDF (630,349 characters):
`metric` 0 hits · `coverage` 0 hits · `measure` 7 hits, all of them about column measurement units
("the analysis tool measures columns", "consumer's native measurement unit"). `kind` 134 ·
`notApplicable` 3 · `informational` 5 · `property bag` 23 · `suppression` 50.

This independently reconfirms `PRODUCT.md`'s existing narrowed claim — SARIF has per-result
not-analysed primitives and **no run-level coverage aggregate** — and extends it: SARIF has no
metric concept whatsoever. A tool wanting to ship per-database counts in SARIF must use property
bags (§3.8), the general-purpose extension slot. **That is the field declining to give metrics a
home in the result stream, which is Decision B's answer in the negative form.**

### 1.5 Counter-datapoint: the dominant consumer discards `kind`

GitHub code scanning is the largest SARIF consumer. Its first-party SARIF support page
(`https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/sarif-support-for-code-scanning`,
fetched 2026-08-18) documents `result.level` — *"The severity of the result. This level overrides
the default severity defined by the rule. Code scanning uses the level to filter results by
severity on GitHub"* — and its supported-properties table for the `result` object **does not list
`kind` at all**; the only `kind` on the page is inside an example rule property bag
(`"kind": "path-problem"`), which is a CodeQL convention, not the SARIF result property.

**Strength of this claim: medium.** It rests on one WebFetch whose model-generated summary reported
the absence of a table row. An absence reported by a summariser is weaker evidence than a quoted
presence, and I did not re-read the raw table. **Next check:** re-fetch that page and read the
`result` object table rows directly before this datapoint is used in an ADR.

If it holds, the consequence is direct and unflattering to Decision A: the spec's first-class
non-failing kind is **dropped on ingestion by the ecosystem's biggest reader**. A taxonomy
distinction that no consumer reads is a distinction that exists only inside the producer.

---

## 2. SonarQube — Issues and Measures are different object types

First-party SonarSource documentation, all fetched 2026-08-18.

**Route note.** `https://docs.sonarsource.com/sonarqube-server/latest/user-guide/quality-gates/`
returned a 404 page (the fetch returned GitHub-style navigation, not content); the current
information architecture was recovered from `https://docs.sonarsource.com/llms.txt` and the pages
below are the live paths.

### 2.1 The Quality Gate is defined over metrics

`https://docs.sonarsource.com/sonarqube-server/quality-standards-administration/managing-quality-gates/introduction-to-quality-gates.md`

> Quality gates enforce a quality policy for the results of code review and analysis in your
> organization by answering one question: is my project ready for release?

> A quality gate consists of a set of conditions against which the code is measured during
> analysis. A condition is defined on either new code or overall code.

The page states that conditions are assessed on *"Statistics and ratings on detected security,
maintainability, and reliability issues"*, *"Statistics on test coverage"*, *"Code cyclomatic and
cognitive complexities"*, *"Statistics on duplicated lines and blocks"*, and *"Global statistics on
issues"*. A condition is the triple **metric + comparison operator + error value** — the fetch's
worked example being "Blocker issue > 0".

**The mechanism, stated plainly.** An issue never fails a quality gate. A **count of issues**, held
as a metric, fails a quality gate when it crosses a declared threshold. The issue stream and the
gate are connected by an aggregation step and a threshold the operator sets, not by the issue's own
severity.

### 2.2 Issues are objects with a lifecycle

`https://docs.sonarsource.com/sonarqube-cloud/managing-your-projects/issues/introduction.md`

> An analysis detects an issue as a problem in your code. When a coding rule is broken, an issue is
> raised.

> Each issue affects one or more software qualities with a varying impact level, called severity,
> as inherited from the rule.

> An issue is assigned a status that changes during its lifecycle.

Statuses named on the page include Open, Accept, and False positive. Note what the issue object
carries: a rule, a severity, and a **human-managed status**. It does not carry a verdict.

### 2.3 Measures are computed values

`https://docs.sonarsource.com/sonarqube-cloud/managing-your-projects/metric-definitions.md`

> Metrics are used to measure: Security, maintainability, and reliability attributes on the basis
> of statistics on the detected security, maintainability, and reliability issues, respectively.

> For most metrics, SonarQube computes two values or ratings: one for overall code and one for new
> code.

Metric families named: security, reliability, maintainability, coverage, complexity, size,
duplications, and issue counts (open issues, closed issues, issue density).

### 2.4 The split is visible in the API surface

`https://docs.sonarsource.com/sonarqube-server/extension-guide/web-api.md` names `/api/measures`
("extracting measures of given metrics for projects") and `/api/metrics` ("retrieving metric keys")
as distinct endpoints, alongside `/api/monitoring/metrics`. Issues are retrieved through a separate
domain. **Strength: medium.** The page I fetched enumerates the measures endpoints and does not
enumerate `/api/issues`; SonarQube's per-instance `/web_api` browser is the authoritative
enumeration and is a JavaScript application I did not drive. **Next check:** if the API-level split
is load-bearing for an ADR, read `/web_api` on a live instance or the OpenAPI document rather than
the docs prose.

### 2.5 Why SonarQube separates them — the finding

The separation is not cosmetic and it is not about storage. It buys three things this product
wants:

1. **A metric has no status and needs no triage.** "1,432 lines of code" is never accepted,
   dismissed, or marked a false positive. Giving it a triage surface would be a category error.
2. **The threshold is the operator's, and it is declared separately from the measurement.**
   SonarQube measures unconditionally and gates conditionally. The measurement is a fact; the
   condition is a policy. That is the same separation `CONTEXT.md` Principle 4 is defending.
3. **A metric can become a gate later without the measuring code changing.** The promotion path
   from "counted" to "gated" is a configuration edit, not a rule rewrite.

Point 3 is the design this product should copy for Decision B, and it answers the warning-fatigue
objection better than any argument about report layout. See §5.

---

## 3. Informational tiers in six tools — is any of them non-failing by construction?

**Answer: no. Not one.** Every informational or warning tier surveyed has a documented, first-party
switch that promotes it to a build failure. Non-failing is always a *default*, never a *property*.

| Tool | Informational tier | Documented escalation to failure | Non-failing by construction? |
| --- | --- | --- | --- |
| ESLint | severity `1` / `"warn"` | `--max-warnings n` | No |
| Semgrep (OSS CLI) | `severity: LOW/MEDIUM/HIGH/CRITICAL` | `--error` (exit 1 on **any** finding) | No — and severity is not the switch |
| dbt | `severity: warn`, `warn_if` | `--warn-error`, `--warn-error-options` | No |
| Checkstyle | `severity` `info` / `warning` | Maven `violationSeverity` (default `error`) | No |
| clang-tidy | warning diagnostics | `-warnings-as-errors` | No |
| Great Expectations | **none exists** | n/a | n/a — no informational tier at all |
| SARIF | `kind: informational` / `review` | consumer's choice; spec defines no gate | Spec-level yes; deployment-level no |

**ESLint** — `https://eslint.org/docs/latest/use/configure/rules`: `"warn"` or `1` is *"turn the
rule on as a warning (doesn't affect exit code)"*; `"error"` or `2` is *"turn the rule on as an
error (exit code is 1 when triggered)"*. And
`https://eslint.org/docs/latest/use/command-line-interface`: `--max-warnings` *"allows you to
specify a warning threshold, which can be used to force ESLint to exit with an error status if
there are too many warning-level rule violations in your project"*; exit `0` is *"Linting was
successful and there are no linting errors. If the `--max-warnings` flag is set to `n`, the number
of linting warnings is at most `n`"*; exit `1` is *"…at least one linting error, or there are more
linting warnings than allowed by the `--max-warnings` option"*; exit `2` is *"Linting was
unsuccessful due to a configuration problem or an internal error."*

ESLint is the closest published analogue to this repository's exit-byte model, and it is worth
noting what it does with the third byte: **exit 2 is reserved for "the tool could not do its job",
which is a coverage statement, not a findings statement.** That is the same instinct as ADR-0008's
`4`.

**Semgrep** — `https://docs.semgrep.dev/writing-rules/rule-syntax` (redirected from
`semgrep.dev/docs/…`, HTTP 301): *"Severity can be `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`. It
indicates the criticality of issues detected by a rule."* and *"The older levels `ERROR`,
`WARNING`, and `INFO` match `HIGH`, `MEDIUM`, and `LOW`."* **The brief's premise here is out of
date** — Semgrep has renamed the enumeration; `ERROR/WARNING/INFO` survive only as aliases.
`https://docs.semgrep.dev/cli-reference`: exit `0` is *"Semgrep ran successfully and found no
errors (or did find errors, but the `--error` flag is **not** being used)"*; exit `1` is *"Semgrep
ran successfully and found issues in your code (while using the `--error` flag)"*; `--error` is
*"Exit 1 if there are findings. Useful for CI and scripts."*

**Semgrep is the cleanest example in the table and it is the opposite of what the brief expected.**
Severity does not touch the exit code at all. `--severity` filters *which findings are printed*;
`--error` decides *whether findings fail*. Semgrep has completely decoupled the report taxonomy
from the gate. **Strength: medium-high.** This covers Semgrep OSS CLI. Semgrep AppSec Platform adds
a "blocking findings" policy layer whose semantics I did not open; **route not taken:** the
Semgrep policies documentation. Do not generalise the OSS exit-code behaviour to `semgrep ci`
without reading it.

**dbt** — `https://docs.getdbt.com/reference/resource-configs/severity`: `severity` takes `error`
(default) or `warn`, with `error_if` and `warn_if` conditional expressions both defaulting to
`!=0`. Under `severity: error` dbt evaluates `error_if` first and fails the build if met, then
`warn_if`; under `severity: warn` it skips `error_if` entirely and can only warn. `--warn-error`
promotes all warnings to errors and `--warn-error-options` promotes selected ones.

dbt is the most sophisticated design surveyed, and it is the one this product should study. **The
threshold and the severity are separate configuration keys.** `warn_if: ">10"` says "this is
tolerable below 10". That is a declared invariant with a declared tolerance — exactly the artifact
Principle 4 says the operator must supply, expressed at a granularity finer than on/off.

**Checkstyle** — `https://checkstyle.org/config.html` defines `severity` as a `SeverityLevel`
property defaulting to `error`, and states *"All output formatters does not report violations with
severity level `ignore`, and notes violations with severity level `warning`."* The failure decision
lives in the build plugin, not the tool:
`https://maven.apache.org/plugins/maven-checkstyle-plugin/check-mojo.html` — `violationSeverity`
is *"The lowest severity level that is considered a violation. Valid values are `error`, `warning`
and `info`"*, default `error`; `failOnViolation` is *"Fail the build on a violation"*, default
`true`. So by default only `error` fails, and moving `violationSeverity` to `warning` promotes the
whole warning tier in one edit. **Route note:** `https://checkstyle.org/cmdline.html` does not
document the CLI's exit code; the Maven mojo is where the first-party failure semantics are
written down.

**clang-tidy** — `https://clang.llvm.org/extra/clang-tidy/`: `-warnings-as-errors` *"Upgrades
warnings to errors. Same format as '-checks'."* The page distinguishes clang-tidy warnings from
compiler errors, which are *"reported with the check name `clang-diagnostic-error`"* and
*"represent fundamental compilation failures that must be fixed before clang-tidy can perform its
analysis."* **The page does not state clang-tidy's exit code, and I did not establish it.** The
existence of `-warnings-as-errors` implies warnings alone do not fail, but that is my inference
from a flag name, not a documented behaviour. **Route not taken:** the LLVM source
(`ClangTidyMain.cpp`) or a local run. Treat clang-tidy's row as inferred, not verified.

**Great Expectations** — `https://docs.greatexpectations.io/docs/reference/learn/terms/validation_result/`:
`success` is *"A `true` or `false` indicator of whether all the Expectations in the Expectation
Suite passed"*, and the `statistics` attribute holds *"some statistics to summarize the `results`
list, including things like the number of evaluated Expectations and the percentage of those
Expectations that passed successfully."*

Two things follow. First, **GX has no informational tier at all** — there is no severity, no warn
level, no way to express "I measured this and I am not judging it." Every expectation is a pass/fail
assertion and every failure enters the verdict. Second, the page confirms `PRODUCT.md`'s existing
and sharper finding from the other direction: the denominator is *evaluated* expectations, so the
percentage is computed over what ran, not over what was declared. **Strength of the "no
informational tier" claim: medium.** It is an argument from the silence of one page, and arguments
from silence are the weakest kind. **Next check:** search the GX Expectation configuration
reference for a severity or `meta`-only expectation type before this appears in a comparison table.

### 3.1 The finding this table produces

The brief asked which tools let an informational result exist **without any path to failing a
build.** The honest answer changes what Decision A should build.

**Only SARIF does, and only because SARIF is not a build tool.** Every executable tool surveyed
ships the informational tier *with* its escalation switch, in the same release, documented on the
same page. The field's settled pattern is not "non-failing output" — it is **"non-failing by
default, promotable by the operator, with the promotion mechanism shipped alongside."**

Applied to Decision A: shipping a duplicate-title observation with **no** route to becoming a
violation would be unlike every tool in this table. Shipping it with a declared route — the
operator writes a `UNQ001` config and the same detection starts producing violations — is exactly
what ESLint, dbt, Checkstyle and clang-tidy all do. And that route is already in this repository's
design: `UNQ001` exists, it is a configured rule, and `PRODUCT.md` already contemplates promoting
duplicate-title detection to built-in. **The observation and the rule are the same detection at two
declaration levels, and the product should say so rather than treat them as separate features.**

---

## 4. The counter-evidence: non-failing output trains users to ignore it

This is the strongest argument against both decisions and it is documented, quantified, and comes
from people who ran the experiment at scale.

### 4.1 Google removed the warning tier because it did not work

Sadowski, C., Aftandilian, E., Eagle, A., Miller-Cushon, L., and Jaspan, C. **"Lessons from
building static analysis tools at Google."** *Communications of the ACM* 61(4), pp. 58–66, April
2018. DOI [10.1145/3188720](https://doi.org/10.1145/3188720). Verbatim from the author PDF at
`https://storage.googleapis.com/gweb-research2023-media/pubtools/4365.pdf` (HTTP 200, 607,313
bytes; page numbers from the journal's own page markers).

> Once the codebase was cleansed of an issue, the Clang team enabled the new diagnostic as a
> compiler error (not a warning, which the Clang team found Google developers ignored) to break the
> build, a report difficult to disregard. — p. 61

> As of January 2018, there was a compiler warnings-free default for C++ and Java builds at Google,
> with all analysis results either shown as compiler errors or in code review. — p. 61

> [In May 2009, hundreds of Google engineers participated in a companywide "Fixit" week, focusing
> on addressing FindBugs warnings.] They reviewed a total of 3,954 such warnings (42% of 9,473
> total), but only 16% (640) were actually fixed, despite the fact that 44% of reviewed issues
> (1,746) resulted in a bug report being filed. — p. 61

> [If] a tool wastes developer time with false positives and low-priority issues, developers will
> lose faith and ignore results. — p. 65

> We consider an issue to be an "effective false positive" if developers did not take positive
> action after seeing the issue. — p. 59

> Unlike compile-time checks, analysis results shown during code review are allowed to include up
> to 10% effective false positives. — p. 62

> If the ratio for an analyzer goes above 10%, the Tricorder team disables the analyzer until the
> author(s) improve it. — p. 62

Read the 2009 Fixit number carefully, because it is the sharpest fact in this file. **A dedicated
company-wide week, with engineers deliberately looking at the warnings, fixed 16% of what it
reviewed — and 44% of reviewed issues were real enough to become filed bugs.** The gap between
"acknowledged as real" and "fixed" is where non-blocking output goes to die. It is not a false
positive problem. It is a *no forcing function* problem.

The related Google paper, Sadowski et al., **"Tricorder: Building a Program Analysis Ecosystem"**,
ICSE 2015, DOI [10.1109/ICSE.2015.76](https://doi.org/10.1109/ICSE.2015.76), records the same
10% effective-false-positive discipline and the same placement of results at code review.

### 4.2 The base rate for unblocked warnings

Kim, S. and Ernst, M. D. **"Which warnings should I fix first?"** *ESEC/FSE 2007*. DOI
[10.1145/1287624.1287633](https://doi.org/10.1145/1287624.1287633). Verbatim from the authors'
PDF at `https://homes.cs.washington.edu/~mernst/pubs/prioritize-warnings-fse2007.pdf`.

> Automatic bug-finding tools have a high false positive rate: most warnings do not indicate real
> bugs. — Abstract

> Only 6%, 9%, and 9% of warnings are removed by bug fix changes during 1 to 4 years of the
> software development. About 90% of warnings remain in the program or are removed during non-fix
> changes — likely false positive warnings. — Abstract

**Route note.** The first URL tried,
`https://homes.cs.washington.edu/~mernst/pubs/fix-warnings-fse2007.pdf`, returned HTTP 404. The
`prioritize-warnings` filename is the live one.

### 4.3 The mechanism in an industrial deployment

Baca, D., Petersen, K., Carlsson, B., and Lundberg, L. (Ericsson AB case study), *Software:
Practice and Experience*, DOI [10.1002/spe.2109](https://doi.org/10.1002/spe.2109). Retrieved via
Scholar Gateway, 2026-08-18; 12 passages, 1 unique article.

> Only 37.5% of the false positives were correctly classified as such.

> In one project where the champion had left the project, the tool had been abandoned after it
> stopped reporting faults; this was caused by an expired license that was not discovered before
> this study was done.

> Most developers assumed that the champion will correct all warnings and few developers
> [engaged].

The second quotation is the one that should worry this product most, and it is not about fatigue.
**A tool silently stopped analysing, and nobody noticed, because a quiet report and an absent report
look identical.** That is `SYS001`'s reason for existing, restated as a field observation from
someone else's deployment. It is evidence *for* this product's core thesis and *against* any report
section whose empty state is indistinguishable from its healthy state.

**Route note on the literature sweep.** `WebSearch` is exhausted (200/200) and was not attempted.
Crossref was used for DOI verification (two queries returned HTTP 429 on the first burst and
succeeded on retry with `mailto` and `--retry 4`). `cacm.acm.org` returned HTTP 403 and the ACM
Digital Library was not attempted; the Google-hosted author PDF was used instead and its page
markers match the journal pagination. Johnson et al., **"Why don't software developers use static
analysis tools to find bugs?"**, ICSE 2013, DOI
[10.1109/ICSE.2013.6606613](https://doi.org/10.1109/ICSE.2013.6606613), is the standard citation
for the developer-perception side of this argument; **I verified the DOI through Crossref but did
not retrieve the text** — `people.engr.ncsu.edu` failed DNS resolution (`ENOTFOUND`). Do not quote
it without opening it.

### 4.4 Where the counter-argument actually lands

It does **not** refute Decision A, and it does refute one common version of it.

- **Against a bare observation with no upgrade path: the objection holds.** An output category that
  can never become a failure, over which no threshold can ever be set, is a compiler warning at
  Google in 2017 — and Google deleted that category.
- **Against an observation with a declared upgrade path: the objection does not hold**, and
  Sadowski et al. say why. Their remedy was never "suppress the informational output." It was
  *"analysis tools must be integrated into the workflow and enabled by default for everyone"* and
  results must be *"actionable and easy to fix"* with *"a suggested fix"*. A duplicate-title
  observation that names two page IDs, links both, and prints the exact `UNQ001` config stanza that
  would make it a violation satisfies both criteria.
- **Against Decision B: the objection lands hardest, and it lands somewhere specific.** A per-database
  count has no fix, no threshold, and no promotion path as currently proposed. "47 rollups" is not
  actionable, and by Sadowski's own definition — *"developers did not take positive action after
  seeing the issue"* — every metric line in the report is an effective false positive by
  construction.

That last point is a real problem for `PRODUCT.md`'s zero-config decay report, which lists exactly
these counts as the entry-point surface. It does not kill the surface. It constrains its shape.

---

## 5. What to build

**Decision A.** Emit the detection, as a non-conformity-bearing result, contributing nothing to the
exit byte. Three refinements the sources argue for:

1. **Do not call it one thing.** SARIF §3.27.9 separates `informational` ("does not indicate a
   problem") from `review` ("may or may not"). Duplicate titles are `review`. Edit age is
   `informational`. The remedies differ — a human decides in one case and nobody does anything in
   the other — so by this repository's own distinctness test they are two values, not one.
2. **Ship the upgrade path in the same release as the detection.** Every tool in §3 does. The
   report line should print the `UNQ001` configuration that promotes the observation to a
   violation. This is the answer to warning fatigue and it is also the answer to Principle 4: the
   product never infers the invariant, it *offers* one and the operator declares it.
3. **Never let the observation stream reach the exit byte, including through a `--max-warnings`
   analogue, until an operator asks for it.** ESLint's `--max-warnings` is the precedent for adding
   it later without redesign.

**Decision B.** Ship metrics as a separate section, with no coverage item, no ratio, and no exit
contribution — the field is unanimous and SARIF does not even model them. Two constraints:

1. **Give every metric a unit name and a stable key**, because SonarQube's design shows what
   metrics are *for*: a metric plus a comparison operator plus an error value is a gate condition.
   A metric emitted today with a stable key can become a declared condition tomorrow with no change
   to the measuring code. Without a stable key it can never be promoted and §4.4's objection is
   permanent.
2. **Do not let the metrics section be silently empty.** The Ericsson case (§4.3) is the failure
   mode: an analysis that stopped running looked exactly like an analysis that found nothing. Every
   metric must state its denominator or state that it was not computed and why — which is this
   product's existing coverage discipline applied to a section that is not a rule.

**The line neither decision may cross**, restated because both proposals sit next to it:
`PRODUCT.md` says counting stays inside ADR-0001 and scoring leaves it. A metric section that adds
a composite "health score" reopens ADR-0001 without a superseding ADR. So does an observation whose
message says the workspace is disorganised rather than naming two pages with the same title.

**Immediate next checks, in order.**
1. Re-read the GitHub code scanning `result` supported-properties table directly (§1.5) — it is the
   single weakest citation in this file and the only one that argues against Decision A.
2. Open the Semgrep AppSec Platform policy documentation before generalising §3's Semgrep row.
3. Search the Great Expectations Expectation-configuration reference for any severity concept
   before publishing the §3 table's GX row.
4. Retrieve Johnson et al. 2013 through a working host if the developer-perception argument is
   going to be cited in an ADR.
