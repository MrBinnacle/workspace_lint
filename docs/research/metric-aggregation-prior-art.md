# Where the counting/scoring line falls, operationally

**Evidence class: documented.** This file records what primary sources state. No Notion response was
involved. Nothing here outranks `docs/proof/`.

Run for issue **#70**. May the zero-config decay report emit
(a) per-resource counts only, (b) counts plus totals, or (c) counts plus an operator-configured
threshold. Written 2026-08-17. All fetch dates are 2026-08-17 unless stated.

Read before searching: `PRODUCT.md` (the paragraph "The line this must not cross") and
`docs/adr/0001-linter-not-entropy-engine.md`.

---

## 0. Recommendation

**Take (b), constrained by a mechanical test. Reject (c) as a third option — it is not one.**

(b) with this constraint: **every aggregate printed in the report must be reconstructible by the
reader from the per-item rows printed in the same report.** A sum of one unit over rows that are
also printed passes. A mean, a ratio, a rank, a letter, or a score does not. The test is
mechanical, so the gate can hold it.

(c) is rejected on a reframe rather than on a preference. An operator-configured count threshold is
not a new mechanism. It is the **declared-rule mechanism the product already has**, applied to a
count. ADR-0001 decision 4 settled that policy checks require explicit configuration. So "fail when
rollups > 20" is a configured rule with a rule ID, it belongs in the config file, and it lands on
the **framing-3 declared-rules track** — not on the zero-config decay report. Putting the same
number on the zero-config surface does not relocate the judgement to the operator. It keeps the
judgement in the product's output vocabulary and moves only the authorship of one constant.

The evidence that the relocation is cosmetic is in §4. It is the strongest single result in this
sweep.

**Strongest counter-argument, and the answer.** A total is a compression, and compression is where
judgement hides. "214 rollups across 37 databases" invites "is that a lot?", and the product has no
answer — the state ADR-0001 rejected. The counter-argument proves too much: under it the report may
not say how many databases it scanned either. The distinguishing property is not compression. It is
**recoverability**. A sum over one unit is recoverable from the rows beside it; a reader can add the
column and get the same number. A score is not recoverable from anything. Hence the constraint
above rather than a ban on totals.

---

## 1. The aggregate-score critique

The critique exists and is substantial. It is **not one failure**. It is three separable failures,
and they occur in this order: aggregation, then calibration, then interpretation. Only the first two
are avoidable by design choice. The third is what happens when the first two are ignored.

### 1.1 Aggregation: unlike units, and destroyed distributions

Chatzigeorgiou & Stiakakis state the unit problem directly, in a related-work section reviewing the
Maintainability Index (MI):

> "Beyond the immediate drawback related to the subjective selection of weights, it is questionable
> whether weighing and summing are legal operations for metrics of different scales and units.
> However, the weighted sum is by far the most widely used approach for the combination of metrics."

— Chatzigeorgiou & Stiakakis (2012), *Journal of Software: Evolution and Process* 25(3):303–324,
[10.1002/smr.584](https://doi.org/10.1002/smr.584), §2 Related Work. First-hand, full text via
Scholar Gateway (Wiley corpus).

This is the exact operation option (b) must refuse: a count of rollups plus a count of views is a
sum across units. A count of rollups alone is not.

The distributional failure is separate. Arie van Deursen, on the MI:

> "Taking the average tends to mask the presence of high-risk parts"

— van Deursen, "Think Twice Before Using the Maintainability Index", August 2014,
https://avandeursen.com/2014/08/29/think-twice-before-using-the-maintainability-index/ (fetched
2026-08-17). This is a named academic's technical blog, not peer review. Cited as such.

The peer-reviewed form of the same point is the aggregation-technique literature. Vasilescu,
Serebrenik & van den Brand, "By no means: a study on aggregating software metrics", WETSoM 2011,
[10.1145/1985374.1985381](https://doi.org/10.1145/1985374.1985381). The title is the finding. The
Semantic Scholar TLDR reads: "The results indicate that correlation is not strong, and is influenced
by the aggregation technique, while recently econometric aggregation techniques, such as the Gini,
Theil, and Hoover indices have been proposed." **This TLDR is machine-generated and second-hand.**
Two open-copy routes failed: `research.tue.nl/files/3590486/Metis254214.pdf` → HTTP 403;
`aserebre.win.tue.nl/WETSoM2011.pdf` → HTTP 404. Existence and venue are confirmed by Crossref.

Mordal et al. supply the mechanism by which a *threshold applied during aggregation* both hides
change and creates a gaming surface. This is first-hand full text and it is the most useful passage
in the sweep:

> "*Hide modifications*. Discrete mapping of metric results introduces staircase and threshold
> effects that may hide detailed information and trigger wrong interpretation. Slight fluctuations
> — progression or regression — of individual elements might not appear if they remain in the same
> interval."

> "*Badly influence reengineering decisions*. A corollary of modifications within the same interval
> being hidden is that working on components close to a quality threshold value would exhibit more
> benefit on the overall quality than working on components whose values are far from a threshold.
> Therefore, engineers can use this mapping behaviour to improve the perceived quality at the cost
> of not fixing more serious problems. **We saw this practice in one company, where developers
> selected their tasks to maximize their impact on the quality assessment.**"

— Mordal, Anquetil, Laval, Serebrenik, Vasilescu & Ducasse (2012), "Software quality metrics
aggregation in industry", *Journal of Software: Evolution and Process* 25(10):1117–1135,
[10.1002/smr.1558](https://doi.org/10.1002/smr.1558), §2.1. Emphasis mine. First-hand, full text via
Scholar Gateway.

### 1.2 Calibration: the constants are from 1994 and were never redone

The MI polynomial comes from Oman & Hagemeister's 1992/1994 work, fitted by "a series of 50
statistical regression tests" (Strečanský et al. 2020, §3, first-hand). Its coefficients have not
been refitted since. van Deursen records the specifics: the original experiments used C and Pascal
programs of roughly 1,000–10,000 LOC; tool vendors "used the exact same formula and coefficients as
the 1994 experiments, without any recalibration"; and of the Visual Studio thresholds 20 and 10,
"I have not been able to find a justification for these thresholds."

Two scoring tools ship that uncalibrated formula today. One of them says so in its own
documentation:

> "Maintainability Index is still a very experimental metric, and should not be taken into account
> as seriously as the other metrics."

— radon documentation, https://radon.readthedocs.io/en/latest/intro.html (fetched 2026-08-17). Radon
states its formula "derives from both SEI derivative and Visual Studio one."

Contrast the SIG maintainability model, which did calibrate: it derived four risk classes per metric
from the statistical distribution of values across roughly one hundred systems before mapping to a
two-to-five-star rating (Burger, Hummel, Calero & Walker (2012), *International Scholarly Research
Notices* 2012(1), [10.5402/2012/162305](https://doi.org/10.5402/2012/162305), §3, describing
Heitlager et al. — **this description is second-hand**; the Heitlager, Kuipers & Visser primary
source is QUATIC 2007, [10.1109/quatic.2007.8](https://doi.org/10.1109/quatic.2007.8), verified to
exist via Crossref but not read).

**Consequence for `workspace_lint`.** Calibration requires a benchmark corpus. Gate 3 says the build
runs "at n=1 against this workspace, which is the only fixture available." There is no corpus.
Therefore no threshold this product ships can be calibrated, and any number it picks is the 1994-MI
failure repeated with a shorter history. This is decisive against a built-in threshold and is the
first half of the case against (c).

### 1.3 Interpretation: three published aggregates disagree about the same code

Strečanský, Chren, Rossi & Cerny (2020) ran MI, the SIG TD model and SQALE over 20 open-source
Python libraries and compared the resulting time series.
[10.1155/2020/2976564](https://doi.org/10.1155/2020/2976564), *Scientific Programming* 2020(1), open
access. First-hand, full text via Scholar Gateway.

> "While all methods report generally growing trends of TD over time, there are different patterns.
> SQALE reports more periods of steady states compared to MI and SIG TD. MI is the method that
> reports more repayments of TD compared to the other methods. SIG TD and MI are the models that
> show more similarity in the way TD evolves, while SQALE and MI are less similar. **The
> implications are that each method gives slightly a different perception about TD evolution.**"
> (Abstract; emphasis mine.)

> "Seems there is limited overlap between the different methods for TD identification, probably due
> to the multifaced TD definition. One consequence being that practitioners adopting one or the
> other method might get different perceptions about the state of the projects. This can be seen
> from our analysis, when some models were reporting no changes in TD, while others larger
> repayments." (§6 Conclusions.)

Their Granger-causality table (§4, Table 7) shows the series barely inform each other: SQALE→MI true
in 30% of projects, SQALE→SIG 25%, SIG→SQALE 25%, MI→SIG 15%, MI→SQALE 10%, SIG→MI 10%.

They also report, **second-hand from Oppedijk**, that MI and the SIG model correlate only moderately
across 73 systems — 0.494/0.476 for C, 0.459/0.500 for Java, non-significant for C++ — and note
"expectations were for a higher correlation level between the two models" (§5).

**The finding.** Convergent validity fails. Three peer-reviewed aggregates, each claiming to measure
maintainability, disagree about the same programs. A number three careful teams cannot make agree is
not a measurement of the thing it names. It is a measurement of the formula.

### 1.4 The one source I could not read first-hand

Sjøberg, Anda & Mockus (2012), "Questioning software maintenance metrics: a comparative case study",
ESEM 2012, [10.1145/2372251.2372269](https://doi.org/10.1145/2372251.2372269). **Existence and
metadata verified via Crossref; the finding is not verified first-hand.** Unpaywall returns
`is_oa: false`, `oa_status: "closed"`, `oa_locations: []`. Semantic Scholar reports 67 citations and
an elided abstract. `dl.acm.org/doi/10.1145/2372251.2372269` → HTTP 403.
`mockus.org/papers/maintainability.pdf` → HTTP 404. **Route not taken:** institutional ACM Digital
Library access, which this session does not have.

The only description I have is second-hand, from an open-access SLR: "the comparative case study
published in 2012 by Sjoberg et al. … had a primary aim at questioning the consistency between
different metrics in the evaluation of maintainability of software projects" (Ardito, Coppola,
Barbato, Verga & Briola (2020), [10.1155/2020/8840389](https://doi.org/10.1155/2020/8840389), §5).
Do not cite Sjøberg et al. for a specific correlation figure on the strength of this file.

---

## 2. Goodhart's law in software measurement

**Canonical statement.** C.A.E. Goodhart, "Problems of Monetary Management: The U.K. Experience", in
*Monetary Theory and Practice*, Macmillan, 1984, ch. 4,
[10.1007/978-1-349-17295-5_4](https://doi.org/10.1007/978-1-349-17295-5_4). Verified via Crossref.
The paper was first given in 1975. The familiar aphorism — "When a measure becomes a target, it
ceases to be a good measure" — is **not Goodhart's wording**; it is Marilyn Strathern's compression
of it in "'Improving ratings': audit in the British University system", *European Review*
5(3):305–321, 1997,
[10.1002/(sici)1234-981x(199707)5:3<305::aid-euro184>3.0.co;2-4](https://doi.org/10.1002/(sici)1234-981x(199707)5:3%3C305::aid-euro184%3E3.0.co;2-4).
Bibliographic record verified via Crossref. **The quotation itself is not verified first-hand:**
Cambridge Core returned HTTP 500 on the article page. Attribute the aphorism to Strathern 1997, not
to Goodhart, and do not put a page number on it without reading it.

**The earlier and more directly applicable source.** V.F. Ridgway, "Dysfunctional Consequences of
Performance Measurements", *Administrative Science Quarterly* 1(2):240, 1956,
[10.2307/2390989](https://doi.org/10.2307/2390989). Verified via Crossref. Ridgway's argument is the
one that bears on aggregation specifically — he separates single, multiple and composite measures
and argues the composite is the most dysfunctional of the three. **Metadata verified; text not read
first-hand.** Route not taken: JSTOR, which requires authentication.

**Austin.** Robert D. Austin, *Measuring and Managing Performance in Organizations*, Dorset House
Publishing, 1996, ISBN 0-932633-36-6, 216 pp. **Existence verified** via Open Library
(`openlibrary.org/search.json`, fetched 2026-08-17; a later Pearson reissue also exists, ISBN
0-13-348841-1). The brief asked for the specific claim with a page or chapter. **I could not get it.**
The publisher's own page redirected to an error page (`dorsethouse.com/books/mmp.html` → 302 →
`/error-page.html`), there is no open full text, and the book is not in Crossref or Scholar Gateway.
Austin's central argument — that measuring a subset of a multi-dimensional job causes effort to move
to the measured dimensions and away from the unmeasured ones — is widely reported, but I am not
citing a page number I did not read. Route not taken: a library copy or a paid ebook.

**Software-specific measurement dysfunction, observed, first-hand.** Use Mordal et al. §2.1 instead,
quoted in full in §1.1 above. It reports a named observation in industry — developers choosing tasks
by their effect on the quality assessment rather than by severity — and it identifies the *threshold*
as the mechanism. This is a better citation for this product's purpose than Austin, because it is
about a static-analysis quality score and because the dysfunction it records is caused by exactly the
construct option (c) proposes.

Mordal et al. also record the general warning, attributed there to Wiegers:

> "Metrics data is intrinsically neither virtuous nor evil, simply informative. Using metrics to
> motivate rather than to learn has the potential of leading to dysfunctional behaviour, in which
> the results obtained are not consistent with the goals intended by the motivator."

— quoted in Mordal et al. (2012) §2. **Second-hand; the Wiegers original was not opened.**

---

## 3. Where the line falls in shipped tools

### Tools that measure and do not score

**cloc.** "cloc counts blank lines, comment lines, and physical lines of source code in many
programming languages." It emits counts by language in text, JSON, XML, CSV, SQL, YAML or Markdown.
It produces no score, rating, grade or threshold. https://github.com/AlDanial/cloc (fetched
2026-08-17).

**radon raw metrics.** Reports LOC, LLOC, SLOC, comments, multiline strings, blanks, and the
comment-to-line ratios. These are counts and one explicit ratio, presented as data.
https://radon.readthedocs.io/en/latest/intro.html (fetched 2026-08-17). Radon *also* ships an MI and
a rank, and disclaims it in the same document (quoted in §1.2). **This is the most instructive
single data point in item 3: a tool that does both draws the line inside its own documentation, and
puts the warning on the scored half.**

**git-log-derived statistics.** Not separately checked. `git log --numstat` / `git shortlog -sn`
emit counts per author and per file with no valence attached. I did not fetch the git documentation
because the counting/non-scoring character is not in dispute and no claim in this file rests on it.
Route not taken: `git-scm.com/docs/git-log`.

### Tools that score

**SonarQube.** Maintainability Rating (`sqale_rating`) is a letter A–E derived from the Technical
Debt Ratio, with fixed bands: "A ≤ 5% to 0%, B ≥ 5% to <10%, C ≥ 10% to <20%, D ≥ 20% to < 50%,
E ≥ 50%". The ratio itself is `technical debt / (cost to develop one line of code × number of lines
of code)`, where the default cost per line is 30 minutes.
https://docs.sonarsource.com/sonarqube-server/user-guide/code-metrics/metrics-definition.md (fetched
2026-08-17).

Note what that formula is: a ratio whose denominator is a **vendor-chosen constant** (30 minutes)
multiplied by a size measure. Both of ADR-0001's objections apply — the number is not falsifiable
against anything, and its constant has no stated derivation.

**CodeScene.** Code Health is "an aggregated metric based on 25+ factors scanned from the source
code", banded Green / Yellow / Red. First-party statement of the aggregation:

> "The code health scores are aggregated by a weighted average. The weight is the number of lines of
> code (LoC) in each file."

— https://codescene.io/docs/guides/technical/code-health.html (fetched 2026-08-17). It reports two
system KPIs, Hotspot Code Health and Average Code Health.

CodeScene is the one scoring tool that bought its score with outcome validation. Tornhill & Borg,
"Code Red: The Business Impact of Code Quality — A Quantitative Study of 39 Proprietary Production
Codebases", arXiv:2203.04374 (8 March 2022): across 30,737 files, "low quality code contains 15
times more defects than high quality code", issue resolution "takes on average 124% more time in
development", and low-quality code shows "9 times longer maximum cycle times". First-hand from the
arXiv abstract. Note the standing conflict: the authors are CodeScene's own founder and a
collaborator, and the tool under evaluation is theirs.

**Code Climate.** Could not be checked as specified. `docs.codeclimate.com` now 301-redirects to
`docs.qlty.sh`, and that documentation index contains no definition of a GPA, a letter grade, or a
threshold. The product appears to have been rebranded. **Status: blocked, HTTP 301 then no matching
content.** Route not taken: the Internet Archive, which would give the historical GPA definition if
this matters enough to chase.

### What the scoring tools gained and gave up

**Gained:** a single number a non-engineer can read, compare across projects, and put on a
dashboard; a build-breaking gate that needs no per-project argument; and, for CodeScene alone, a
published claim of correlation with defects and cycle time.

**Gave up, and this is the load-bearing half:**

1. **Falsifiability of the individual number.** A count of 47 rollups can be checked by opening the
   database and counting. A rating of C cannot be checked by anything.
2. **Agreement with other measurements of the same construct** (§1.3).
3. **Immunity to threshold gaming** — the failure Mordal et al. observed in a real company (§1.1).
4. **Recalibration discipline.** MI has not been refitted since 1994 and is still shipped by Visual
   Studio and radon.

`workspace_lint` cannot pay for what the scoring tools gained. CodeScene bought its score with 39
proprietary codebases and 30,737 files. This product has one workspace.

---

## 4. The threshold question — is (c) a real difference?

**Answer: no. Relocating the number to the operator is cosmetic. It is worse than cosmetic, because
it removes the one thing a vendor default has that an operator default does not: a maintainer.**

### The evidence

Beller, Bholanath, McIntosh & Zaidman, "Analyzing the State of Static Analysis: A Large-Scale
Evaluation in Open Source Software", SANER 2016,
[10.1109/SANER.2016.105](https://doi.org/10.1109/SANER.2016.105). 9 tools, 168,214 OSS projects.
First-hand: PDF read via `rebels.cs.uwaterloo.ca/papers/saner2016_beller.pdf`, extracted with pypdf
(fetched 2026-08-17). Section references are to that PDF.

Abstract, and RQ 2 / RQ 3 headline findings:

> "Most ASAT configurations deviate slightly from the default, but hardly any introduce new custom
> analyses." (Abstract.)

> "The ASAT configurations in the studied OSS projects barely deviate from the default ASAT
> configuration and rarely introduce custom checks." (RQ 2.)

> "Most ASAT configurations, once committed, never change. The ASAT configurations that do change
> are typically only very slightly modified within the first week of their appearance in the studied
> repositories." (RQ 3.)

The numbers, from §VI (Results):

- **Deviation is shallow.** "Only for the tools ESLINT (2% of default rules affected) and JSHINT
  (10%) did more than 50% of configuration files deviate from the default by reconfiguring a subset
  of rule defaults."
- **Custom rules are near-absent.** "Custom rules never account for more than 5% of all of the
  enabled rules of a tool. For 3 out of 8 ASATs, this percentage is even lower than 1%." (Table VI:
  Checkstyle 0.2%, ESLint 4.1%, FindBugs 1.3%, JSCS 4.7%, JSHint 0.1%, PMD 2.9%, Pylint 1.1%,
  RuboCop 0.9%.)
- **Configuration is written once and abandoned.** "A little over 80% of all configuration files are
  never changed after their creation." Figure 5: median 0 changes, mean 0.5. "Less than 10% of all
  files are changed just once and less than 5% twice."
- **What change there is happens at adoption.** "18% of the changes are made on the same day that
  the file is created and 33.5% of changes are made within the first week… no date more than 15 days
  after the creation of the file individually represents more than 1% of all changes."

**Read the table precisely, because the loose reading is wrong.** Table V shows most configuration
files *do* touch at least one default rule: ESLint 80.5% changed, FindBugs 93.0%, JSHint 89.6%,
JSL 94.6%, Pylint 53.3%, RuboCop 79.1%. So "users just accept defaults" is too strong as stated. The
accurate finding is narrower and more damaging to option (c): **users touch a small subset of the
defaults once, at adoption, and then never revisit.** Whatever number the operator writes on day one
is the number for the life of the project.

### Why that settles it

A threshold set once and never revisited behaves exactly like a built-in default. It has the same
authority in the report and the same arbitrariness. It has strictly worse provenance:

- A vendor default has a documented rationale, a version history, and someone whose job is to
  recalibrate it across releases. SonarQube's default gate is explicit about this: "Sonar way … is
  provided by Sonar, activated by default, and read-only", with fixed conditions — "New code test
  coverage is greater than or equal to 80.0%" and "Duplication in the new code is less than or equal
  to 3.0%" (https://docs.sonarsource.com/sonarqube-server/quality-standards-administration/managing-quality-gates/introduction-to-quality-gates.md,
  fetched 2026-08-17). The vendor picks the numbers, marks them read-only, and expects them to stand.
- An operator's `rollups: 20`, typed once in a config file eighteen months ago, has no rationale
  recorded anywhere, no version history that explains it, and no one who will revisit it. Beller's
  Figure 5 is that sentence in data.

And the threshold is itself the gaming surface, independent of who wrote it. Mordal et al. §2.1
observed developers "select[ing] their tasks to maximize their impact on the quality assessment"
because work near a threshold pays more than work far from it. A database at 21 rollups against a
threshold of 20 gets attention; one at 19 does not; and the cheapest repair is 21 → 20, which
changes the report and not the workspace. That dysfunction does not care whose constant it is.

### The reframe

(c) is not a third option, so do not spend a decision on it. The product already has a mechanism for
operator-declared thresholds: **configured rules**, per ADR-0001 decision 4. "Fail when rollups > 20"
is a declared rule. It gets a rule ID, it lives in the config file, it emits a rule violation, and it
belongs to framing 3 — the buyer who must prove a structural claim to a third party. Nothing new is
needed and nothing in ADR-0001 is reopened.

What must not happen is a threshold on the **zero-config decay report**. That surface exists because
"the tool must return something before it asks for anything" (`PRODUCT.md`). A threshold asks for
something. Worse, a threshold on a zero-config surface must ship with a default, and shipping a
default is shipping a judgement — the thing PRODUCT.md's line forbids and the thing §1.2 shows this
product cannot calibrate at n=1.

---

## 5. The operational line, buildable

Prose is not buildable. This is. A number may appear in the zero-config report if and only if it
satisfies all eight.

1. **Named unit.** Its unit is a countable resource type or a time span, named in the output:
   relations, rollups, formulas, views, days since last write, days since last edit, inbound
   references.
2. **Linked.** Every number resolves to a link or a set of links. The falsifier is that a reader can
   open the target and recount. This is what makes a count a measurement rather than an opinion.
3. **One unit per number.** Sums are over a single unit. No number combines two units. (Chatzigeorgiou
   & Stiakakis, §1.1.)
4. **No division, with one existing exception.** No ratio, no percentage, no per-database
   normalization. The exception is already in the product and is principled: **a ratio is admissible
   only where the operator supplied the denominator.** That is precisely why the coverage manifest
   survives — "The operator supplies the denominator, which is the whole point of ADR-0002"
   (`PRODUCT.md`). SonarQube's debt ratio fails this test; its denominator is a vendor constant.
5. **No distribution summary standing in for the items.** No mean, no median, no percentile in place
   of the rows. (van Deursen; Vasilescu et al.; §1.1.)
6. **Sorting is allowed; ranking is not.** A table may be sorted, and the column header must name the
   sort key. Do not number the rows as positions. Do not use "worst", "unhealthy", "at risk",
   "problem", "bloated" — those are the judgement re-entering as vocabulary.
7. **No score surface.** No letter grade, star count, 0–100 index, GPA, or colour with implied
   valence. Green/yellow/red is a score with the numerals removed.
8. **No threshold on this surface.** A threshold exists only as a declared rule with a rule ID on the
   configured-rules track (§4).

**The gate test, which subsumes 3, 4, 5 and 7 and is the one to implement first:** every aggregate
printed in the report must be arithmetically reconstructible by the reader from the per-item rows
printed in the same report. Print the rows; print the sum of a column; a reader can verify the sum.
Print a rating; nothing verifies it. The test is mechanical and it is close in kind to what
`CHECK-claims.ts` already evaluates — a claim that declares its own falsifier.

**Worked examples.**

| Output | Verdict | Why |
| --- | --- | --- |
| "Projects DB: 47 rollups, 12 relations, 8 formulas, 23 views. Last write 184 days ago." | Pass | Rules 1, 2. Each figure recounts. |
| "214 rollups across 37 databases." | Pass, if the 37 rows are printed beside it | Rule 3 (one unit), gate test (recoverable). |
| "Average 5.8 rollups per database." | Fail | Rules 4 and 5. Denominator is the tool's, not the operator's; the mean hides the 47. |
| "Maintenance load: 89/100." | Fail | Rules 3, 4, 7. Not recoverable, not calibrated, not falsifiable. |
| "Top 5 most complex databases." | Fail | Rule 6. "Complex" is ADR-0001's rejected construct. |
| "Databases sorted by rollup count (descending)." | Pass | Rule 6. The header names the key; the reader draws the conclusion. |
| "3 databases exceed your configured rollup limit (20)." | Fail on the zero-config surface; pass as a declared rule with a rule ID | §4. |
| "Reached 37 of 40 declared roots. 3 unreached: …" | Pass | Rule 4's exception. The operator supplied the 40. |

---

## 6. What I checked, what failed, and what I did not check

**First-hand, full text read:** Mordal et al. 2012 (§2, §2.1); Strečanský et al. 2020 (abstract, §1,
§3, §4, §5, §6); Chatzigeorgiou & Stiakakis 2012 (§2); Ardito et al. 2020 (§3, §5); Burger et al.
2012 (§3); Beller et al. 2016 (abstract, §VI, Tables V and VI, Figures 5–6); Tornhill & Borg 2022
(arXiv abstract); radon, cloc, SonarQube and CodeScene documentation; van Deursen 2014.

**Verified to exist, text not read:** Sjøberg et al. 2012 (Crossref + Semantic Scholar; closed
access, 67 citations); Ridgway 1956 (Crossref); Goodhart 1984 ch. 4 (Crossref); Strathern 1997
(Crossref); Heitlager et al. 2007 (Crossref); Letouzey 2012 (Crossref,
[10.1109/mtd.2012.6225997](https://doi.org/10.1109/mtd.2012.6225997)); Austin 1996 (Open Library);
Vasilescu et al. 2011 (Crossref; TLDR only); Bouwers, Visser & van Deursen, "Getting What You
Measure", *Queue* 10(5):50–56, [10.1145/2208917.2229115](https://doi.org/10.1145/2208917.2229115)
(Crossref).

**Failed fetches, with status codes:** `dl.acm.org/doi/10.1145/2372251.2372269` 403;
`mockus.org/papers/maintainability.pdf` 404; `research.tue.nl/files/3590486/Metis254214.pdf` 403;
`aserebre.win.tue.nl/WETSoM2011.pdf` 404; `queue.acm.org/detail.cfm?id=2229115` 403 (twice, with and
without the doi parameter); `pure.tudelft.nl/ws/files/1858546/getting_what_you_measure.pdf` 404;
`downloads.hindawi.com/journals/sp/2020/2976564.pdf` 402; Cambridge Core Strathern article 500;
`onlinelibrary.wiley.com/doi/10.1155/2020/2976564` 403 (recovered via Scholar Gateway);
`dorsethouse.com/books/mmp.html` 302 → error page; `docs.codeclimate.com` 301 → `docs.qlty.sh`, no
matching content; Semantic Scholar search endpoint 429 twice; Crossref 429 once (retried, succeeded).
`WebSearch` was not attempted — the brief records it exhausted at 200/200.

**Not checked, route named:**
- Austin 1996's specific chapter and page. Route: a library or paid ebook copy. Nothing in the
  recommendation depends on it; Mordal et al. §2.1 carries the same argument first-hand and in the
  software domain.
- Ridgway 1956's text. Route: JSTOR with institutional access.
- Strathern 1997's exact wording and page. Route: Cambridge Core with institutional access. Consequence
  recorded in §2: attribute the aphorism to Strathern, not Goodhart, and use no page number.
- Sjøberg et al. 2012's findings. Route: ACM Digital Library with institutional access.
- Code Climate's historical GPA definition. Route: Internet Archive snapshot of `docs.codeclimate.com`.
- git-log-derived statistics documentation. Route: `git-scm.com/docs/git-log`. Not in dispute.

**Provenance note.** Wiley full texts reached through Scholar Gateway (corpus updated May 2026,
queries executed 2026-08-17): 3 searches, 34 passages, 11 unique articles.

**Standing bias to state.** The Tornhill & Borg validation of Code Health is authored by CodeScene's
founder and evaluates CodeScene. It is the strongest published defence of scoring and it is not
independent.

---

## 7. What would change the recommendation

- **A benchmark corpus arrives.** If `workspace_lint` ever measures 100+ real workspaces, thresholds
  become calibratable the way SIG's were, and (c) reopens on evidence rather than on convenience.
  Until then it cannot.
- **Gate 4 finds owners cannot read the counts.** If three technically capable Notion owners see
  "47 rollups" and ask "so what?", the failure is that the counts are not tied to a repair decision —
  which is Gate 4's own criterion. The fix is a better *link and context*, not a score. Watch for the
  fix being proposed as a score.
- **A first-hand read of Sjøberg et al. 2012** could strengthen or weaken §1.3. It cannot reverse it;
  Strečanský et al. carries that section on its own.
