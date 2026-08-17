# Frame completeness, against issue #35

**Evidence class: documented.** This file records what primary sources state. No Notion response was
involved. Nothing here outranks `docs/proof/`.

Sweep date 2026-08-17. Run for issue **#35**, and for the §0.5 prior-art trigger, which was unrun for
this question across twelve ADRs.

## The question this sweep answers

Not the question `docs/research/unseen-population-sizing.md` answered. That file asked **how large is
the gap** and found the size is not estimable from a cursor-paginated read.

This file asks the prior question: **may a completeness figure computed inside a frame be published as
`sufficient` when the frame itself may be incomplete in a way the instrument cannot detect?**

The occasion is the live reproduction on #35, recorded at `docs/proof/results-t5-red-test.md` §1. A
scan of `wl-revoke-parent` exits `0` with `SYS001 1/1 resources (100.0%)`, `conforms`, `evidence
sufficient`, over a page whose child the read-only connection cannot see. The child is not reported
unreadable. It is absent from `GET /v1/blocks/{parent}/children`, so the applicable set is built as 1
and every published figure is internally consistent and true of a workspace that is not the one being
scanned.

## Finding 1 — the rule as filed on #35 does not cover the evidence now attached to #35

The issue body proposes:

> A rule's applicable set is derived from what the API returned. It is never derived from the subset
> the tool knows how to handle.

**The permission-filtering reproduction satisfies that rule and still produces a false green.** The
denominator was built from exactly what the API returned. The API returned a filtered list and said
nothing about filtering it.

The rule as filed is correct and is about **tool competence**. The reproduction is about **frame
fidelity**. They are different failure modes with different remedies, and the issue currently treats
them as one. The two earlier instances the issue cites — the `app.notion.com` host allow-list, and the
`child_page`-only applicable set, both in `docs/research/notion-live-probe.md` via
`docs/proof/results-ref001-live.md` §2 and §3 — are tool-competence instances. The new one is not.

## Finding 2 — the canonical taxonomy splits this into two components, and the product has one

Survey methodology separates **errors of observation** from **errors of nonobservation**, and splits
the latter into sampling, coverage and nonresponse. Pont (2007), *JRSS-A* 170(3), 713–733, DOI
[10.1111/j.1467-985X.2007.00475.x](https://doi.org/10.1111/j.1467-985X.2007.00475.x), §2, attributing
Groves (1989):

> "Groves (1989) distinguished various aspects of the total survey error. Within that classification
> he defined errors of observation, which relate to the data collection instrument … and errors of
> nonobservation, which include sampling, coverage and nonresponse errors."

Johnson & Sleet (2014), *International Scholarly Research Notices* 2014(1), DOI
[10.1155/2014/923290](https://doi.org/10.1155/2014/923290), §3 "Errors of Representation":

> "Errors in coverage are generally a consequence of employing a survey sampling frame that does not
> include all individuals in the population being studied, or, alternatively, by employing methods
> that do not provide all members of the population of interest some probability of being sampled."

Map onto ADR-0005 decision 1:

| Survey-error component | ADR-0005 axis | Status |
| --- | --- | --- |
| Nonresponse — in the frame, not obtained | `unreached` | Modelled |
| Measurement / processing — obtained, not usable | `undecidable` | Modelled |
| **Coverage — not in the frame at all** | **none** | **Not modelled** |

ADR-0005 exists because ADR-0003's four-valued enum was "one dimension short and [mixed] two axes."
**This is the same finding one level up: the pair is one dimension short.** The permission-filtered
child is a coverage error, and no axis in the current model expresses it.

## Finding 3 — the field states this component is not measurable from inside the instrument

Pont (2007) §2, continuing the Groves attribution:

> "Groves stated that coverage error exists because some persons are not part of the list or frame
> [and] can never be measured."

This converges with `docs/research/unseen-population-sizing.md` from an independent literature. That
file found no upper bound is estimable and that every estimator needs a frequency-of-frequencies
distribution a cursor-paginated read cannot produce. Survey methodology reaches the same place by
definition rather than by estimator mechanics.

**Consequence, and it is a hard constraint on the ADR:** this quantity may not be rendered as a ratio,
a percentage, a coverage figure, or any number. Any candidate shape that expresses frame fidelity
numerically is ruled out by two independent literatures before it is designed.

## Finding 4 — the analogous bias is known, and its direction is the flattering one

Diagnostic-accuracy research has this product's exact structure: an index test applied broadly, a
reference standard applied only to a subset, and accuracy computed on the verified subset.

de Groot et al. (2008), *Statistics in Medicine* 27(28), 5880–5889, DOI
[10.1002/sim.3410](https://doi.org/10.1002/sim.3410), abstract:

> "Partial verification refers to the situation where a subset of patients is not verified by the
> reference (gold) standard and is excluded from the analysis. If partial verification is present, the
> observed (naive) measures of accuracy such as sensitivity and specificity are most likely to be
> biased."

Kosinski & Barnhart (2003), *Biometrics* 59(1), 163–171, DOI
[10.1111/1541-0420.00019](https://doi.org/10.1111/1541-0420.00019), abstract, gives the direction:

> "If only data from patients who received the gold standard test were used to assess the test
> performance, the commonly used measures of diagnostic test performance — sensitivity and
> specificity — are likely to be biased. **Sensitivity would often be higher**, and specificity would
> be lower, **than the true values.** This bias is called verification bias."

**A measurement restricted to the subset the instrument could verify overstates how well the
instrument is doing.** That is this product's own false-green class, named and quantified in another
field since at least 2003. It is the strongest available argument against candidate shape 1 on #35:
shape 1 publishes `sufficient` over exactly the subset the literature says biases the figure upward.

The bias is worse when verification depends on the index test. Schmidt et al. (2014), *Head & Neck*
36(11), 1654–1661, DOI [10.1002/hed.23495](https://doi.org/10.1002/hed.23495), Introduction:
"Verification bias occurs when the verification rate depends on the result of the index test." In this
product the connection grant determines both what is enumerated and what is evaluated, so the two are
not independent. The dependence is structural, not incidental.

**The correction family is unavailable here, and the reason is already in the repo.** Begg–Greenes and
multiple-imputation corrections model the missingness mechanism over subjects *known to be missing*.
ADR-0002 established that unshared subtrees are "not merely unread — they are unnameable." A
correction that needs the identity of the unverified cases has no input. This is the same shape as the
capture-recapture finding: the instruments exist, and their inputs do not.

## Finding 5 — the remedy these fields adopted is a flow disclosure, not a corrected number

STARD is the fourth member of the reporting-guideline family ADR-0005 decision 5 already borrowed
from, and it is the member specifically about verification. Khan, Bakour & Bossuyt (2004), *BJOG*
111(7), 638–640, DOI
[10.1111/j.1471-0528.2004.00218.x](https://doi.org/10.1111/j.1471-0528.2004.00218.x), figure caption:

> "Flow diagram of a test accuracy study to provide insight into the sampling and selection process of
> participants, **the complete verification of all cases regardless of index test result** and the
> numbers at each stage of the study."

ADR-0005 decision 5 cites CONSORT, PRISMA and STROBE. **STARD is missing and it is the closest of the
four to this product**, because it is the one whose subject is a test measured against a standard
applied to only part of the population. Its prescription is the funnel the product already builds,
with one addition: the flow must account for cases *regardless of index-test result*, which is the
requirement that the denominator not be conditioned on what the instrument did.

## Finding 6 — there is a named structure for residual doubt that cannot be quantified

Safety assurance provides one, and with an empirical cost figure attached. Viger et al. (2025),
*Systems Engineering* 29(1), 99–113, DOI
[10.1002/sys.70010](https://doi.org/10.1002/sys.70010), uses **eliminative argumentation**, whose
distinguishing node type is the **defeater** — "reasons to doubt AC claims", per the paper's
Introduction. From "The LHC Assurance Case":

> "Of these nodes, 105 are defeaters representing sources of doubt in the system. While most defeaters
> are mitigated by evidence, **nine are left as residual risks within the AC.**"

Its "Discussion and Lessons Learned" gives the taxonomy: "Undercutting defeaters challenge inference
rules, undermining defeaters challenge evidence, and rebutting defeaters challenge claims."

**The permission-filtering blindness is an undermining defeater.** It does not dispute that the
evaluated resources conform. It disputes that the evidence base is what the report implies it is.

Two things this contributes to #35, and the second is the more useful:

1. Residual doubt is carried **explicitly, named, and enumerated** — not folded into a verdict value
   and not converted into a number. That is compatible with Finding 3's prohibition.
2. **A 506-node assurance case ended with nine unmitigated residuals and shipped.** Carrying named
   residual doubt is not equivalent to refusing to render a verdict. This is direct evidence against
   the assumption behind #35's candidate shape 2 — that a run which cannot rule out a blind spine must
   therefore be permanently qualified.

## What this sweep does NOT settle

**The product cost of each shape.** Findings 1–6 establish that the current model is one component
short, that the missing component is unquantifiable, that the induced bias is upward, and that two
fields carry residual doubt by naming it rather than by suppressing the verdict. None of that decides
how loud the residual should be on a CLI report or whether a v0.1 byte may still read `0`. That is a
values decision and it belongs to the operator.

**The counter-pressure is real and it is in `docs/inputs/`.**
`decay-causal-synthesis-2026-08-16.md`, cause 2, records that the buyer's pain is trust collapse:
"Once users stop trusting the workspace as a source of truth, they stop maintaining it and route
around it." The same passage names "no authority signal" as part of the degradation. A byte that can
be silently wrong reproduces the buyer's pain; a byte that is always qualified supplies no authority
signal. **Both horns of #35's fork are damaged by the owner's own market research**, which is why the
sweep does not pick one.

## Method, verification status, and what is not checked

**Retrieval.** WebSearch was unavailable — the session budget was exhausted at 200 of 200 before the
sweep began, the same condition S012 and `unseen-population-sizing.md` recorded. The sweep ran on the
Scholar Gateway full-text tool over a Wiley corpus, which carries the disclosure *"Summary generated
by AI — verify claims against source documents."*

**Verification.** All ten DOIs consulted were resolved against `api.crossref.org` on 2026-08-17. Every
one is a real paper with matching authors, journal, volume, issue and page range. None is fabricated.
One metadata correction: the retrieval tool dated Schmidt et al. 2013; Crossref gives 2014, and 2014
is used above.

Quote-level status, stated per quote because the classes differ:

| Source | Quote location | Verified against |
| --- | --- | --- |
| de Groot et al. 2008 | abstract | **Crossref abstract, 2026-08-17** — publisher-independent |
| Kosinski & Barnhart 2003 | abstract | **Crossref abstract, 2026-08-17** — publisher-independent |
| Pont 2007 | §2, body | retrieval tool only — **not verified** |
| Johnson & Sleet 2014 | §3, body | retrieval tool only — **not verified** |
| Khan et al. 2004 | figure caption, body | retrieval tool only — **not verified**; no Crossref abstract exists |
| Viger et al. 2025 | body, tables and Introduction | retrieval tool only — **not verified** |
| Schmidt et al. 2014 | Introduction, body | retrieval tool only — **not verified** |

**The Groves quote is second-hand and must be labelled so wherever it travels.** Pont (2007) quotes
Groves (1989), *Survey Errors and Survey Costs*. Groves was not opened. The *taxonomic* claim — that
coverage is a distinct component of nonobservation error — does not rest on it: Johnson & Sleet 2014
and Rao (2007), *International Statistical Review* 73(2), 241–244, DOI
[10.1111/j.1751-5823.2005.tb00283.x](https://doi.org/10.1111/j.1751-5823.2005.tb00283.x), abstract
("nonsampling errors … include frame error, measurement error and nonresponse") state it
independently. The **"can never be measured"** clause does rest on it, and it is the load-bearing
clause for Finding 3's prohibition. Finding 3 is additionally carried by
`unseen-population-sizing.md`, which reaches the same prohibition from Crossref-verified abstracts, so
the prohibition survives if the Groves attribution is wrong. **Re-verify against Groves 1989 before
quoting that clause in anything published.**

**Not checked, and not absent.** Per the second method rule in `docs/agents/domain.md`:

- **Query completeness over incomplete databases.** Motro (1989) on integrity as validity plus
  completeness, and Razniewski & Nutt (VLDB 2011) on table-completeness statements, are the formal
  treatment of exactly this question — certifying an answer complete over a partially-known database.
  The query returned no relevant result because the corpus is Wiley and this literature is ACM/VLDB.
  **This is the closest formal analogue and it remains unopened.**
- **Metrology.** ISO/IEC Guide 98 (GUM) on unrecognised systematic effects, which is the measurement
  discipline's statement of the same limit. Not opened.
- **Information retrieval.** Pooling bias and recall estimation over incomplete relevance judgments.
  ACM/TREC; out of corpus.

Neither is claimed as absent, and none is relied on above. A future sweep with a working search budget
should open the first before this file is treated as complete.
