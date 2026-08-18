# Executable-specification adoption: who writes them, and do they survive

**Evidence class: documented.** This file records what primary sources state. No Notion response was
involved. Nothing here outranks `docs/proof/`.

Sweep date 2026-08-18. Run for issue **#69**, whose pitch asserts that product managers and domain
experts will author machine-checkable claims next to prose in Notion.

**Why this sweep exists.** Both questions below were first put to an external NotebookLM corpus of
roughly 189 LLM-engineering sources. The corpus did not hold the evidence and answered anyway, twice,
by substituting a fluent adjacent quotation. That substitution is the failure this file corrects. Where
a question could not be reached here, the routes and their status codes are recorded instead of an
answer.

`WebSearch` was not used — it is exhausted at 200/200. Every retrieval below is `WebFetch`, `curl`,
the arXiv API, OpenAlex, Unpaywall, Semantic Scholar, or the Scholar Gateway MCP.

## Provenance convention

Every quotation carries how it reached the sweep.

- **[opened]** — the source was fetched and the text containing the quotation was read.
- **[abstract only]** — the abstract was read, not the full text.
- **[second-hand]** — the quotation arrived through another paper, named on the quotation.

No claim in this file rests on a source that was not opened.

---

## Question 1 — did non-engineers actually author executable specifications?

### Finding

**Unsupported, not refuted.** No study reached measures authorship directly. What the reachable
evidence establishes is narrower and still decisive for #69.

The gap is itself the finding: after roughly fifteen years of BDD, nobody reachable has published a
direct measurement of who commits `.feature` files. **The Gherkin promise was never audited.** Issue
#69 proposes to make the same promise.

### The practitioner population is engineers

Binamungu, Embury & Konstantinou, XP 2020, DOI
[10.1007/978-3-030-49392-9_6](https://doi.org/10.1007/978-3-030-49392-9_6). Full text **[opened]** at
`https://link.springer.com/content/pdf/10.1007/978-3-030-49392-9_6.pdf` (fetched 2026-08-18, HTTP 200
after two redirect hops, 16 pages, CC BY 4.0). 56 responses. §4.2:

> The distribution of respondent roles was: Developer (60.7%), Tester (12.5%), Consultant (7.1%),
> Chief Technology Officer (CTO) (5.4%), Researcher (3.6%), Business Analyst (1.8%), Other (7.1%),
> and did not say (1.8%).

Experience skews long — 51.8% had 6–10 years with BDD and 12.5% more than 10. This is not a sample of
novices who had not yet reached the collaborative practice.

Binamungu, Embury & Konstantinou, SANER 2018, DOI
[10.1109/SANER.2018.8330207](https://doi.org/10.1109/SANER.2018.8330207). Full text **[opened]** at
`https://pure.manchester.ac.uk/ws/files/181992545/SANER2018BinamunguKonstantinouEmbury.pdf` (fetched
2026-08-18, HTTP 200, 13 pages). 82 responses, 26 countries. Table I gives
"Quality Assurance Engineers/Business Analysts" as a **single combined row**, 4 respondents, 4.9%.

**Three limits on that table, which matter more than the headline.** 46.3% of respondents did not
state a role, so the table describes half the sample. Business analysts cannot be separated from QA
engineers — the count is somewhere in 0–4 and is unrecoverable. And it is a respondent-role
distribution, not an authorship measurement: it says who answered a survey.

**Sampling limit, stated by the authors.** XP 2020 recruited through "several Google Groups" and "an
e-mail list of 500+ contributors to BDD projects in GitHub". A GitHub-contributor frame selects for
developers, so 1.8% is a lower bound rather than an unbiased estimate. The defensible statement is:
**the technical channels BDD practice actually runs through contain almost no business analysts.**

Neither survey has a Product Owner role category at all.

### The primary literature states readability as a hypothesis

Both papers hedge the property in their own abstracts. XP 2020 **[opened]**:

> While **(in theory)** being readable by non-technical stakeholders, the examples can also be
> executed against the code base…

And its §1:

> The fact that BDD scenarios are expressed using customer languages means that they can **(in theory,
> at least)** be read and understood by non-technical project stakeholders

SANER 2018 reports "Specifications can be read and understood by end users" as a **perceived benefit**
selected by 67 respondents. **Perceived readability by end users is not authorship by end users.** It
is the weaker claim and it is the only one measured.

### Ownership is the top industrial challenge

Irshad, Britto & Petersen, JSS 2021, DOI
[10.1016/j.jss.2021.110944](https://doi.org/10.1016/j.jss.2021.110944). Full text **[opened]** at
`https://bth.diva-portal.org/smash/get/diva2:1543163/FULLTEXT01.pdf` (fetched 2026-08-18, HTTP 200,
20 pages, CC BY). An Ericsson study: six workshops, seven interviews, then an industrial evaluation.

"Ownership and maintenance of behaviors in large-scale projects" was raised in **all six workshops**
and in two interviews — the most frequently recurring challenge in the study. §4.2.2:

> There may be a lack of ownership when it comes to BDD since all software development phases share
> these artifacts and processes. This can result in confusion, a lack of guidance for the
> practitioners using the process, and a lack of maintenance support for these artifacts.

§4.2.1, on whether behaviours can be specified up front at all:

> in large-scale projects, the exact requirements are not known in advance… It is often the case that
> practitioners have a very high-level idea of a feature, and it requires many iterations with domain
> experts to understand how the potential users will use it.

§4.2.4, on cost:

> The analysis and modeling of BDD test cases, in a large-scale context, can take more time than the
> ordinary requirement documents.

**The trap in this paper, stated because it is the one a reader will fall into.** §4.3.1 says *"The
product manager, acting on customer request, write new behaviors."* **That is the authors' proposed
process, constructed and then evaluated for acceptability. It is not an observation of who wrote
behaviours at Ericsson.** Citing it as evidence that product managers author specifications would
repeat exactly the substitution this file exists to correct.

### Not reached, with routes

- **DOI [10.1016/j.infsof.2020.106311](https://doi.org/10.1016/j.infsof.2020.106311)**, *"Demystifying
  the adoption of behavior-driven development in open source projects"*, IST 2020. Unpaywall reports
  `is_oa: false`, no OA location. **This is the single highest-value unreached source** — it is the one
  paper likely to hold a direct authorship measurement from repository mining. Until it is opened,
  question 1's verdict stays *unsupported* rather than *refuted*, and the distinction matters to #69.
- **Solis & Wang, SEAA 2011**, DOI `10.1109/SEAA.2011.76`. Unpaywall `is_oa: false`. Not opened, not
  cited.
- **Haugset & Stålhane, and the FitNesse literature.** Semantic Scholar paper search returned **HTTP
  429**, not retried in this sweep. Route not taken: OpenAlex `title.search` filtered on
  FitNesse/Concordion/SpecFlow. **NOT CHECKED.**
- **A direct measurement of `.feature` commit authorship.** Searched arXiv (`all:"Gherkin"`, 30
  results) and OpenAlex (title-filtered, 50 results), both HTTP 200. **Searched, found none.** The
  2024–2026 arXiv Gherkin corpus is almost entirely LLM scenario generation — nobody is studying who
  writes them, because the emerging assumption is that a model will.

### Consequence for #69

The audience claim needs a falsifier of its own, on the pattern this repository already uses for
`<!-- claim: ... -->`. For instance: a stated threshold for the fraction of claim comments authored by
a non-engineer, measured against this repository's own six annotated documents — which are currently
authored by exactly one person.

---

## Question 2 — do inline executable assertions survive, or are they disabled?

### Finding

**A measured rate exists, and the expected failure mode is the wrong one.** Teams do not delete
assertions. They stop editing the surface the assertions describe.

### The suppression rate

Liargkovas, Panourgia & Spinellis, *"Quieting the Static"*, arXiv
[2311.07482](https://arxiv.org/abs/2311.07482), submitted 2023-11-13. **[opened]** — abstract page and
full PDF fetched (HTTP 200, 11 pages), extracted with pypdf.

1,425 repositories using FindBugs (1,327), SpotBugs (176) or both (78). 168 (13%) contain at least one
filter-file suppression; 91 (7%) use at least one suppressing annotation. **11,240 suppressions total**
— 8,298 in configuration files, 2,943 in annotations. 708 were manually coded, with inter-rater
agreement of 91% and 84%.

Table 3, verbatim:

| Category | Config. files | % | Annotations | % |
| --- | --- | --- | --- | --- |
| False Positive | 17 | **5** | 15 | **4** |
| Technical Debt | 101 | 27 | 101 | 34 |
| — Short-term | 53 | 14 | 96 | 28 |
| — Long-term | 48 | 13 | 20 | 6 |
| Unactionable | 250 | 68 | 209 | 61 |
| — Wrong Tool Assumption | 148 | 40 | 115 | 34 |
| — Testing | 25 | 7 | 55 | 16 |
| — Outside of Analysis Scope | 77 | 21 | 39 | 11 |
| **Total** | **368** | | **340** | |

Abstract:

> Contrary to expectations, false positives account for a minor proportion of suppressions. A
> significant number of suppressions introduce technical debt, suggesting potential disregard for code
> quality or a lack of appropriate guidance from the tool.

§5:

> In our study, we note a lower rate of false positives (5%) than previous work. Interestingly, we
> observed that silenced warnings are less likely to refer to false positives.

**One honest qualification.** The Unactionable bucket splits into Wrong Tool Assumption (34–40%),
Testing (7–16%) and Outside Analysis Scope (11–21%). Wrong Tool Assumption is a form of tool
imprecision distinct from a strict false positive, so the fully hostile reading — *"only 5% of
suppressions are the tool's fault"* — overstates the case. The defensible statement: **the tool being
outright wrong about a real finding accounts for 4–5% of suppressions; the tool being wrong about
applicability accounts for a further 34–40%; and deliberate acceptance of technical debt accounts for
27–34%.** Roughly a third of suppressions are a team silencing a claim it agrees is true.

### The real failure mode is freezing, not deletion

SANER 2018 **[opened]**, abstract:

> Some teams find that parts of the system are effectively **frozen** due to the challenges of finding
> and modifying the examples associated with them.

§V:

> 61% of the respondents held the view that the presence of duplication in BDD specifications can cause
> them to become difficult to extend and change (leading potentially to frozen functionality).

**Predicted shape for #69:** claim comments accumulate, editing the prose becomes expensive because the
claim must be re-derived, and the page stops being edited. A wiki nobody edits is precisely the decay
this product exists to detect, arriving as a side effect of the fix. Any design must be tested against
*"does this make the prose more expensive to edit"*, not only against *"will people delete the claim"*.

### There is no published BDD abandonment rate

SANER 2018 **[opened]**, §I, states the claim and immediately labels its own evidence:

> Anecdotal evidence from software engineers we have worked with suggest that the maintenance
> challenges, in particular, can be severe, and are leading some teams to drop the technique… However,
> **to the best of our knowledge, no empirical studies have been undertaken by the academic community
> to capture these lessons**

The most-cited paper in the area says so in its introduction, and it was still true as far as this
sweep could reach in 2026.

### Corpus-scale BDD decay, weighted as a preprint

arXiv `2604.20462v3`, *"Deja Vu at Scale: Paraphrase-Robust Detection of Duplicate Gherkin Steps"*,
Mughal, Fatima & Bilal, 2026-04-22. **[abstract only]**, retrieved through the arXiv API:

> The corpus contains 347 public GitHub repositories, 23,667 .feature files, and 1,113,616 Gherkin
> steps… Step-weighted exact-duplicate rate is 80.2%; median-repository rate is 58.6%… on the median
> repository 62.5% of step lines are eliminable.

**Unrefereed preprint, weighted as such.** It measures duplication, not deletion or disabling, so it
answers a neighbouring question. It is the only corpus-scale measurement of BDD specification decay
reached.

### Not reached, with routes

- **Zhang et al., "An Empirical Study of Suppressed Static Analysis Warnings", TOSEM 2025**, DOI
  [10.1145/3715729](https://doi.org/10.1145/3715729). Unpaywall reports `is_oa: true` with publisher OA
  at `dl.acm.org`; **WebFetch HTTP 403, curl with a browser user-agent HTTP 403.** This paper most
  likely holds suppression **survival time** — how long a suppression lives before removal — which is
  the one number question 2 asks for and does not have. Route not taken: an author preprint on arXiv or
  an institutional page. **NOT CHECKED.**
- **Python doctest, ArchUnit, Terraform drift detection, AWS Config.** No per-tool deletion or disable
  rate was sought, and none surfaced incidentally. Route not taken: targeted OpenAlex `title.search`
  per tool. **This is a tier-2 "not checked" and is named as such rather than dressed as a negative
  result.**
- **Flaky-test quarantine and `@Ignore` accumulation.** OpenAlex free-text query returned one
  irrelevant work. **The absence is a search-quality artefact, not an empty literature** — the same
  query style returned circular-economy papers for a BDD query. Parry et al.'s flaky-test survey and
  Google's quarantine reports are known to exist and were not reached. Route not taken: OpenAlex
  `title.search`, which worked well elsewhere in this sweep.

---

## Blocked routes, with status codes

| Target | Route | Status |
| --- | --- | --- |
| Semantic Scholar paper search | `api.semanticscholar.org/graph/v1/paper/search` | **HTTP 429**, twice |
| SANER 2018 full text | `research.manchester.ac.uk/files/...` | **HTTP 403** to WebFetch, to curl with browser UA, and with a Referer header |
| SANER 2018 full text | `pure.manchester.ac.uk/ws/files/...` | **HTTP 200** — the working host |
| TOSEM 2025 suppression study | `dl.acm.org/doi/pdf/10.1145/3715729` | **HTTP 403** despite Unpaywall reporting publisher OA |
| IEEE Access BDD SLR 2023 | `ieeexplore.ieee.org/ielx7/.../10210040.pdf` | **HTTP 418** to WebFetch, **HTTP 404** to curl |
| DOAJ record, same paper | `doaj.org/article/cb3f03153d...` | **HTTP 403** |
| JSS 2021 | `sciencedirect.com/.../S0164121221000418/pdf` | **HTTP 403** |
| JSS 2021 | `bth.diva-portal.org/smash/get/diva2:1543163/FULLTEXT01.pdf` | **HTTP 200** — the working route |
| CORE API | `api.core.ac.uk/v3/search/works` | Cloudflare interstitial, no key |
| Springer chapter PDF | `link.springer.com/content/pdf/...` | 303 → IDP → 302 → **HTTP 200** |

## Method notes for the next sweep

- **Unpaywall's recorded OA location can be wrong while an OA copy exists.** For SANER 2018 it named a
  host returning 403 while Semantic Scholar named one returning 200 for the same file. **Query both
  before recording a paywall.**
- **`WebFetch` cannot read PDFs.** It saves the binary and its summarising model reports the content
  unreadable — and in one case invented a plausible wrong title from the reference list. Extract with
  pypdf from the saved path. This matches the repository's existing `read-pdfs-with-pypdf` note.
- **OpenAlex free-text `search=` is unusable for multi-concept software-engineering queries.** Use
  `filter=title.search:` as the default.
