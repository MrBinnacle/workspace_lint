# Unseen-population sizing, against ADR-0005 decision 3

**Evidence class: documented.** This file records what primary sources state. No Notion response
was involved. Nothing here outranks `docs/proof/`.

Sweep date 2026-08-17. Run for issue #40, step 1, and for the §0.5 prior-art trigger that
`store.json` → `open_decisions` → `soundness-classification` had recorded as unrun across eleven
ADRs.

## The claim under test

ADR-0005 decision 3, under the heading "Gaps are pervasive when either holds", condition (b):

> An unbounded gap cannot be sized, and a gap that cannot be sized cannot be shown to be confined.

Recall the glossary. A **Gap** is an applicable **coverage item** that left the coverage funnel
before evaluation. A Gap is unbounded when the scan cannot name the missing items.

That sentence carries three loads: the **Pervasive** predicate's condition (b), the rejection of a
percentage coverage threshold, and — through `store.json` → `corrections_pending` → #40 — the
capability refutation of the auditor buyer.

`store.json` recorded the claim as asserted "without consulting the field that sizes unobserved
populations." This sweep consults it.

## Finding

**The claim holds. Its stated reason does not, and the reason should be replaced.**

The claim reads as though unboundedness makes sizing impossible by definition. The supported
statement is narrower, falsifiable, and stronger: sizing an unobserved population is a mature
statistical field, its instruments require repeated observation of the same unit, and a
cursor-paginated read produces none.

### 1. The field's own general result is that no upper bound is available

Alfò, Böhning & Rocchetti (2020), *Biometrics* 77(1), 237–248, DOI
[10.1111/biom.13265](https://doi.org/10.1111/biom.13265), abstract:

> "The estimation of the number of unseen units has been a challenge for theoretical statisticians,
> and considerable progress has been made in providing **lower bound** estimators for the population
> size. In fact, **it is well known that consistent estimators for this cannot be provided in the
> very general case.**"

Mao, Huang & Zhang (2016), *Biometrics* 73(1), 167–173, DOI
[10.1111/biom.12553](https://doi.org/10.1111/biom.12553), Methods, states the same result for the
bound specifically:

> "the nonidentifiability of [the mixing distribution] implies that it is impossible to estimate
> [p₀] and consequently, impossible to estimate *s*. Moreover, **no upper bound of *s* is available
> because of the possible existence of individuals difficult to observe**. These observations
> suggest that we should consider estimating some lower bounds of *s* rather than *s* itself."

This answers decision 3's second clause directly. Confinement is an upper bound. The upper bound is
the quantity the field says it cannot supply in general.

### 2. Every estimator that does produce a bound needs an input pagination cannot give

The family — Chao1, ACE, jackknife, Good–Turing, Horvitz–Thompson under a counting distribution —
runs on a **frequency-of-frequencies distribution**: how many units were observed exactly once,
exactly twice, and so on. It requires observing the same unit more than once.

- Alfò et al. 2020 (above) derive their upper bound only "considering a case where capture-recapture
  studies are summarized by a **frequency of frequencies distribution**."
- Böhning & Schön (2005), *JRSS-C* 54(4), 721–737, DOI
  [10.1111/j.1467-9876.2005.05324.x](https://doi.org/10.1111/j.1467-9876.2005.05324.x), abstract:
  "**When repeated counts of identifying the same case are available**, we can use the counting
  distribution for estimating p₀ to solve the problem."
- Chiu, Wang & Walther (2014), *Biometrics* 70(3), 671–682, DOI
  [10.1111/biom.12200](https://doi.org/10.1111/biom.12200), abstract: the Chao1 lower bound "uses
  only the information on the rarest species (**the numbers of singletons and doubletons**) to
  estimate the number of undetected species in samples."
- Hwang, Lin & Shen (2014), *Biometrical Journal* 57(2), 321–339, DOI
  [10.1002/bimj.201300168](https://doi.org/10.1002/bimj.201300168), abstract, is the
  finite-population correction to Good–Turing and states the standing assumption it corrects:
  "existing studies assume **sampling with replacement or sampling from an infinite population**."
  The correction still consumes observed class frequencies.
- ter Steege et al. (2017), *Ecology* 98(5), 1444–1454, DOI
  [10.1002/ecy.1813](https://doi.org/10.1002/ecy.1813), Introduction: Chao–Bunge, ACE and jackknife
  "are all based on the capture-recapture principle that **requires sampling with replacement**."

`GET /v1/blocks/{id}/children` returns each child **exactly once**. In the notation above, the count
of singletons equals the number of items read and the count of doubletons is zero, on every page,
always, by construction. There is no frequency-of-frequencies distribution to estimate from.

This is the precise reason the claim holds, and it is stronger than the ADR's. These estimators do
not give a poor answer against a Notion enumeration. Their input does not exist.

### 3. These estimators also assume the miss is random, and this one is not

Teitelbaum et al. (2020), *Ecography* 43(9), 1316–1328, DOI
[10.1111/ecog.05143](https://doi.org/10.1111/ecog.05143), Introduction: "rarefaction and
nonparametric estimators assume that undetected species are missed **randomly rather than
systematically**."

Cursor pagination stops at a deterministic prefix boundary. Whatever is missed is missed because of
where the cursor stopped. The mechanism is systematic.

The serial-number family — estimating a population maximum from observed labels — does not apply
either. Notion object IDs are UUIDv4 per ADR-0010 decision 1, so there is no ordered label to take a
maximum over.

## The Revisit-if this sweep creates

Decision 3 is now conditional on a fact about the access pattern rather than on a definition, so a
change in the access pattern can reopen it.

***Revisit if:*** the scan obtains **two or more independent enumerations of the same scope over
identifiable object IDs.** Overlap between the enumerations is a frequency-of-frequencies
distribution, and a bound becomes estimable in principle.

The project already has two enumeration paths — block-children traversal, and `POST /v1/search`,
whose role in v0.1 is the open question on **#24**. **Do not treat that as a route to sizing a Gap.**
Two hazards, and both must travel with any future statement of this Revisit-if:

1. **The lists are not independent.** Both paths filter through the same connection grant per
   ADR-0009, so inclusion in one is strongly positively associated with inclusion in the other.
   Independence between lists is the assumption capture-recapture is best known to violate.
2. **Positive dependence biases the estimate downward.** A downward-biased population estimate
   reports a **smaller Gap than the true Gap**. That is the flattering direction. It is the
   product's own false-green class arriving inside the coverage instrument built to detect it —
   the same shape ADR-0011 found in `UNQ001`'s quadratic denominator.

An estimator that fails safe would have to be biased toward overstating the Gap. Nothing in the
sources above offers one for this access pattern.

## Corroboration of an existing decision, found incidentally

ADR-0006 decision 4's cap-trip remedy is *"partition the declared root."* The information-science
literature reaches the same remedy independently.

Bar-Ilan & Peritz (2009), *JASIST* 60(9), 1730–1740, DOI
[10.1002/asi.21097](https://doi.org/10.1002/asi.21097), Methods:

> "create a nonoverlapping cover of subqueries of the original query, where each subquery returns at
> most 1,000 results (or the limit of the search engine if this limit is different)."

Two fields reached one answer separately. Note what the remedy does: partitioning **removes** the
Gap. It does not size it. That is consistent with, not an exception to, the finding above.

## Method, verification status, and what is not checked

**Retrieval.** WebSearch was unavailable — the session budget was exhausted at 200 of 200 before the
sweep began, the same condition S012 recorded. The sweep ran on a Wiley full-text search tool that
carries the disclosure *"Summary generated by AI — verify claims against source documents."*

**Verification.** All eight DOIs were resolved against `api.crossref.org` on 2026-08-17. Every one
is a real paper with matching authors, journal, volume and page range. None is fabricated.

Quote-level status, stated per quote because the classes differ:

| Source | Quote location | Verified against |
| --- | --- | --- |
| Alfò et al. 2020 | abstract | **Crossref abstract, 2026-08-17** — publisher-independent |
| Böhning & Schön 2005 | abstract | **Crossref abstract, 2026-08-17** — publisher-independent |
| Chiu et al. 2014 | abstract | **Crossref abstract, 2026-08-17** — publisher-independent |
| Hwang et al. 2014 | abstract | **Crossref abstract, 2026-08-17** — publisher-independent |
| Mao et al. 2016 | Methods, body | retrieval tool only — **not verified** |
| ter Steege et al. 2017 | Introduction, body | retrieval tool only — **not verified** |
| Teitelbaum et al. 2020 | Introduction, body | retrieval tool only — **not verified** |
| Bar-Ilan & Peritz 2009 | Methods, body | retrieval tool only — **not verified** |

`onlinelibrary.wiley.com` returns HTTP 403 to a direct fetch, so the four body quotes cannot be
checked against the publisher from here.

**The finding does not depend on an unverified quote.** Sections 1 and 2 are carried by the four
Crossref-verified abstracts on their own. Mao et al. sharpens section 1 and is not load-bearing for
it. Sections 3 and the Bar-Ilan corroboration rest on unverified body quotes and are marked so
where they appear; neither changes decision 3's outcome.

**Not checked, and not absent.** The computer-science venues for this problem were out of reach: the
tool's corpus is Wiley, and WebSearch was dead. Two named leads remain unopened —

- Bar-Yossef & Gurevich on random sampling from a search engine's index (ACM), the closest analogue
  to sizing a collection behind a capped query interface.
- The capture-recapture-for-software-defects literature (IEEE). Alfò et al.'s own motivation cites
  Liu et al. (2015) on estimating the maximum number of defects in a software application.

Per the second method rule in `docs/agents/domain.md`, these are **not checked**. Neither is claimed
as absent, and neither is relied on above. A future sweep with a working search budget should open
both before this file is treated as complete.
