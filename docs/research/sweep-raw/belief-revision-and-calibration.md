# Prior-art sweep — belief revision (item 4, load-bearing) and AD reconciliation records (item 1)

Seat: high-reliability and formal literatures. Survey only; no implementation proposed.
All fetches 2026-08-19. Scope revised mid-sweep: items 2 and 3 demoted to one line each because
`docs/research/documented-claim-drift-prior-art.md` already holds that ground. IAEA attempted, result
below.

---

## 0. Routes and status codes

| Route | Status | Action taken |
| --- | --- | --- |
| `www.ecfr.gov/current/title-14/.../part-39` | **302** → `unblock.federalregister.gov` | Bot-block. Routed to `law.cornell.edu`, which served every CFR section requested. |
| `dspace.mit.edu` handle + 2 bitstream forms for Doyle AI Memo 521 (1979) | **405** ×3 | Doyle's primary text NOT retrieved. Substituted secondary sources that quote the mechanism (below). **Route not taken:** Crossref `api.crossref.org/works?query.bibliographic=`. |
| `iaea.org/publications/8724/configuration-management-in-nuclear-power-plants` | **402 Payment Required** | Next route taken: Wayback JSON API — returned `archived_snapshots: {}`, **no snapshot exists**. IAEA remains unreached; our repo's NOT-CHECKED marker stands, now with a code against it. **Route not taken:** `www-pub.iaea.org` direct PDF paths. |
| `faa.gov/.../advisory_circulars/...documentID/22245` (AC 39-7) | **403** | Next route: Wayback JSON API found a snapshot (20251026042358, status 200), but `web.archive.org` is **blocked at the harness level** — "Claude Code is unable to fetch from web.archive.org". The Wayback *JSON API* (`archive.org/wayback/available`) works; the *snapshot host* does not. Worth recording as a standing route fact. Substituted the regulation itself, which turned out to be the better source. |
| `standards.nasa.gov`, `nasa.gov` CM appendix | **404** ×2 | Routed to `ntrs.nasa.gov` PDF, **200**, 3.9 MB, extracted with pypdf. |
| `stuklex.fi/en/ohje/YVL-A-5`, `/en/search?q=` | **404** ×2 | Slug form is `YVLB-1`. Fetched, 200. |
| arXiv API `export.arxiv.org/api/query` | 200 | Useful for AGM, useless for anchoring (see §2.4). |

---

## 1. Item 4 — belief revision and truth maintenance. LOAD-BEARING.

### 1.1 The direct question, answered directly

**AGM is a formal semantics. TMS is an implementable mechanism. They are not the same thing and the
distinction is not cosmetic.**

**AGM (Alchourrón, Gärdenfors, Makinson 1985) constrains what a correct revision looks like; it does
not tell you which belief to drop.** The arXiv corpus confirms this shape decisively. A query for
`abs:"AGM" AND abs:"belief revision"` (20 results, fetched 2026-08-19) returned characterisation
results almost exclusively: model-theoretic characterisation across Tarskian logics
(arXiv:2112.13557, Falakh/Rudolph/Sauerwald), modal-logic translation of the postulates
(arXiv:2502.14176, Bonanno), realizability conditions for revision and contraction operators
(arXiv:2407.20918, Sauerwald & Thimm), Kripke-Lewis frame semantics (arXiv:2310.11506, Bonanno),
containment of KM update in AGM revision (arXiv:2602.23302, Bonanno). Exactly two implementations
surfaced in 20 hits: SATEN, a web-based AGM revision engine over ranked information
(arXiv:cs/0003059, Williams & Sims), and a Coq-verified constructive AGM algorithm
(arXiv:2606.03063). One paper exists precisely because the gap is real: arXiv:2608.14567, Almeida &
Casals, 29 May 2026, *From Doyle to AGM: A Survey and an Implementation Roadmap for Belief Change* —
its abstract promises "robust computational blueprints that synthesize historical insights with
formal guarantees," which is a bridging survey, not the mechanism itself.

**Adopting AGM would give us postulates to check a revision against. It would not give us a program.**

**TMS gives the program.** From the AI Magazine TMS bibliography, DOI `10.1609/aimag.v11i4.866`:

> "A truth maintenance system's task is to maintain a set of beliefs in such a way that (1) they are
> not known to be contradictory and (2) **no belief is kept without a reason**. ... the TMS's task is
> to keep a record of dependencies among propositions and use those dependencies to inform the problem
> solver in which propositions it should believe."

That second clause is a design requirement stated in one line, and our repository violates it: 9 of
~180 assertions carry a followable locator, so ~171 beliefs are kept without a reason.

**The propagation mechanism.** DOI `10.1609/aimag.v9i2.680`:

> "The ability of a TMS to identify the assumptions that cause a contradiction led to the development
> of a search technique called **dependency-directed backtracking** (Stallman and Sussman 1977) ... In
> the event of a contradiction, the assumptions underlying it can be quickly determined so that they
> can be revised as appropriate."

Formal characterisation of DDB in a justification-based TMS, DOI `10.1111/j.1467-8640.1995.tb00022.x`:
DDB is "the process of resolving conflicts which can arise when **nogoods** are allowed in the set of
justifications," formalised via "three-valued labeling" and via a transformation adding all
contrapositives of the justifications.

**The two propagation architectures, named.** DOI `10.1609/aimag.v11i4.866`, section "Disbelief
propagation":

> "There are basically two approaches to this problem: (1) **Label-based** systems associate a label
> (typically IN or OUT, respectively, for believed or disbelieved) with each proposition, and disbelief
> is done by changing the labels; (2) **Context-based** systems associate contexts with propositions
> and disbelief is attained by changing the context."

**ATMS.** Same source, section "Assumption-based TMS":

> "the dependencies among propositions (corresponding to beliefs) are recorded by associating each
> proposition with the **non-derived propositions (called hypotheses or assumptions) that underlie its
> derivation**."

**The data structure, stated implementably.** DOI `10.1155/2013/632319`:

> "The **support list** contains the rule used to derive A together with all the premises used for
> firing that rule. This means that the percepts and initial knowledge will have an **empty support
> list**. Having this data structure, the beliefs and justifications can be regarded as a **directed
> graph**: incoming edges from the justifications of a belief and outgoing edges to justifications
> containing the belief in its support list."

**The retraction rule.** SNePS, DOI `10.1609/aimag.v28i1.2026`:

> "contradiction resolution requires that at least one **base (input) belief** that underlies a
> contradiction must be retracted to eliminate that contradiction."

**Cost, and a mitigation.** DOI `10.1111/j.1467-8640.1993.tb00308.x`: standard ATMS reason maintenance
is "exponential in the worst case" and "often lays claim to a major part of the computational effort
spent by a problem solver/ATMS system." The paper presents label-updating algorithms based on **lazy
evaluation** — "labels are not automatically [updated]" — to cut average-case cost. Relevant because a
~180-node assertion graph does not need eager propagation; recompute on read.

Scholar Gateway · dependency-directed backtracking and retraction propagation · 12 passages ·
9 articles · 1988-06-01–2013-09-05. And · ATMS labels, environments, nogoods · 10 passages · 6 articles
· 1990-01-01–2022-06-16.

**Mapping to our case, exactly.** ADR-0 asserts "X is impossible" and cites nothing: empty support
list, therefore a **base belief**, therefore the only kind that must be checked against the world.
Four later ADRs cite ADR-0: non-empty support list, therefore **derived**, therefore checked against
their premises and never against the world. X turns out possible. The TMS answer is not "go edit five
documents." It is: ADR-0's label flips to OUT, and every belief whose support list contains ADR-0 is
labelled OUT automatically and must be re-justified from a still-IN support set or itself retracted.
The one prerequisite is a **per-assertion support list that distinguishes base from derived**. Nine
locators across ~180 assertions means the dependency graph is essentially unconnected, and an
unconnected graph propagates nothing — which is a complete mechanical explanation of why four
reversals produced no cascade.

**The overshoot has a formal name.** The TMS bibliography carries a whole section titled "Revision of
beliefs" devoted to "picking *the* culprit for a contradiction," citing Doyle 1979 and Doyle 1989 on
"general principles for selecting the culprit," Cebulka/Carberry/Chester 1988 on "a domain-independent
formalism for the selection of *the* culprit," and Dhar & Quayle 1985 on "a heuristic procedure ... in
determining what to change in a model when an undesirable condition occurs" (all DOI
`10.1609/aimag.v11i4.866`). **Culprit selection is under-determined.** A contradiction tells you the
support set is inconsistent; it does not tell you which member to blame. Blaming the wrong one
produces a fresh error, and that is what our correction pass did when it overshot.

### 1.2 Negative capability claims — this is the sharpest hit in the sweep

The parallel seat established that no software drift-detection mechanism covers "the API cannot do X."
The formal literature covers it, and has for forty years, under a different name.

**A claim of the form "the API cannot do X" derived from "we looked and found no way" is not a
negation. It is negation as failure under a closed-world assumption.** DOI `10.1155/2013/632319`
states the distinction plainly:

> "the notion of **strong negation** is introduced in Prolog. ... this kind of negation does not rely
> on the closed world assumption. It explicitly says that the negation of a formula **succeeds**,
> whereas negation as failure says that the formula **does not succeed, but also that it does not
> explicitly fail** either. In other words, **negation as failure can be read as 'it is not currently
> believed that.'**"

Two different operators, two different truth conditions, and natural-language English collapses both
into the word "cannot."

**Why the collapse is dangerous, in the literature's own words.** DOI `10.1111/j.1468-0394.2006.00415.x`:

> "In many applications, it is very reasonable to assume CWA. For other areas of reasoning, the use of
> CWA is quite limiting, and in fact may even produce **incorrect results**. That is, **it is too harsh
> to say that something is false simply because we do not know it to be true**."

And the fix, from the same paper:

> "Monotonic deductive databases acknowledge that there is a **distinction between that which is
> unknown and that which is provably false**. Far greater expressive power is gained by being able to
> reason about this distinction. ... Extended logic programs (Gelfond & Lifschitz, 1988, 1991) allow us
> to do this. A new connective *not* is introduced, which intuitively means that a literal is **not
> believed**."

The paper illustrates the resulting three-valued answer set directly: a query is **false** when its
complement is in the answer set, and **unknown** when neither the literal nor its complement is.

**Finding, stated as the finding.** Our four reversed assertions were written in the syntactic form of
strong negation ("X is impossible") on evidence that only supported negation as failure ("no way to do
X was found"). Extended logic programming has carried a two-symbol vocabulary for exactly this
distinction since Gelfond & Lifschitz 1988, and a three-valued answer set — true / false / **unknown**
— that our documents cannot express at all. Every one of the four reversals is a type error in that
vocabulary, and the type error is *visible on the face of the sentence*, before any check against the
vendor. That is a cheaper detector than any watch over a changelog: it needs no network call.

**Nonmonotonicity is the reason these claims and only these claims decay.** DOI `10.1002/wcs.134`
defines it: "a logic is *nonmonotonic* if it is possible that φ₁,…,φₙ ⊢ ψ is valid, but φ₁,…,φₙ,χ ⊢ ψ
is not" — adding information withdraws a conclusion. DOI `10.1002/int.4550050507` names the property as
"the ability to **withdraw conclusions after some new information is added** to the original theories."
A positive claim ("the API supports X") is monotonic under vendor change: new features do not falsify
it. A negation-as-failure claim is nonmonotonic by construction — **the vendor shipping anything at all
is exactly the "new information added" that invalidates it.** Negative claims are not merely harder to
watch; they are the only class in the set that a vendor's forward development can falsify by addition.
That is a structural argument, not an empirical one, and it predicts the 4-of-4 result without
appealing to bias at all.

Also relevant: DOI `10.1609/aimag.v6i3.490` on notations that permit cancellation — "if the notation
allows cancellation, but provides no mechanism for **noting certain facts as uncancellable**, then it
simply cannot express universal truths," referencing Fahlman's 1979 proposal for declaring a fact
"sacred (uncancellable)." A claim register needs a way to mark which assertions are defeasible and
which are not, or it cannot distinguish "cannot today" from "cannot by construction."

Scholar Gateway · negation as failure and the closed-world assumption · 12 passages · 11 articles ·
1985-09-01–2024-09-03.

### 1.3 Systematically one-directional errors — two literatures, two different answers

**(a) A countermeasure: seed variables.** DOI `10.1111/risa.12385` describes an elicitation of 103
nominated experts, 78 of whom sat "in-person calibration question interviews":

> "**Cooke's classical model** uses responses to **calibration questions** to aggregate expert
> judgments. The purpose of the calibration questions is to assess the individual expert's ability to
> give statistically accurate probability assessments and to assess how informative their judgments
> tend to be relative to an uninformed [prior]."

This is a countermeasure, not a description. You do not detect a biased belief set by re-reading it.
You mix in **seed items whose true answers are independently known**, score the source against them,
and derive a weight or a correction. "Four checked, four wrong, all one way" **is** a calibration
statistic. Cooke's model is the machinery that turns it into a weight.

Supporting pieces:
- DOI `10.1111/j.1467-9310.1980.tb00017.x` (1980) — a calibration function derived from scored
  assessments "can be used to **display certain systematic bias features** as well as for **correcting
  future assessments**." Both uses, explicitly separated.
- DOI `10.1002/for.3980040404` — calibration curve shape modelled on **two parameters**, "over- or
  underconfidence and **over- or underestimation**." Direction and spread are independent. A correction
  pass that fixes direction by moving too far has repaired one parameter and damaged the other. That is
  the formal shape of our overshoot.
- DOI `10.1002/for.3980080306` — Bayesian combination of forecasts from experts "who might be
  **biased and correlated with each other**. The combination procedure involves **debiasing and then
  combining**," plus "a sequential method for **learning about the forecasters' biases** in the process
  of combining information from them." Debias before aggregating; learn the bias online.
- DOI `10.1111/rssa.12028` — method for quantifying expert bias "**when probability densities for seed
  calibration variables are not available**." Directly relevant: we have 4 checkable items out of ~180.
- DOI `10.1111/risa.12360` — debiasing as engineering: biases "can be reduced or even removed through
  **decomposition of the elicitation task, training, and tools**." Also draws the cognitive/motivational
  split, where motivational biases are "distortions of judgments and decisions because of
  **self-interest**, social pressure..." **Flag:** "cannot" is the self-serving direction — it is the
  answer that justifies not building the thing. This may be a motivational pattern, not only a cognitive
  one, and the two have different countermeasures.
- DOI `10.1002/acp.4236` — "*Calibration* is the degree to which confidence coincides with judgment
  accuracy."
- DOI `10.1111/j.1523-1739.2011.01806.x` — epistemic uncertainty "can be **reduced by studying the
  system**"; aleatory cannot. All ~180 assertions about a third-party system are epistemic. **"We could
  not have known" is unavailable as a disposition for any assertion in the set.**

**(b) A caution the sweep did not expect.** The confirmation-bias literature does *not* uniformly
support "one-directional error = irrationality." DOI `10.1111/j.1551-6709.2010.01161.x` proves the
opposite under stated conditions:

> "We **prove that the confirmation bias is an optimal strategy** for testing hypotheses when those
> hypotheses are deterministic, each making a single prediction about the next event in a sequence. Our
> proof applies for two normative standards ... maximizing expected information gain and maximizing the
> probability of falsifying the current hypothesis."

And DOI `10.1002/jip.1362` on Klayman & Ha 1987: "hypothesis confirmation behaviour was **not
necessarily biased or problematic** but may be what they termed a **positive test strategy** ... people
tend to test features that are expected to be present if the hypothesis is true," with functional
advantages including "providing a **stopping rule** — that is, when the evidence makes sense."

**That stopping-rule clause is our failure mode named from the other side.** A researcher testing "can
the API do X?" runs positive tests, finds none succeeding, and the *absence of a successful test is
itself the stopping rule*. The search terminates and the negative claim is written. Nothing in the
procedure is irrational; the defect is that the stopping rule for a negative conclusion is
indistinguishable from the stopping rule for "I stopped looking."

Also: DOI `10.1111/j.1742-9536.2011.00044.x` distinguishes positive tests ("investigating whether the
events that it predicts are eventually observed") from negative tests, and warns that a preference for
sparse hypotheses does not make positive tests always more effective. DOI
`10.1111/j.1469-5812.2007.00349.x`, quoting Nickerson 1998: "people are basically limited to
consideration of only one thing — and inclined to gather information about only one hypothesis — at a
time. ... An incorrect hypothesis can be sufficiently close to being correct that it receives a
considerable amount of positive reinforcement ... and inhibit continued search for an alternative."
DOI `10.1111/j.1744-7984.2007.00097.x`: "we are more likely to **scrutinize information that does not
fit** with our expectations or desires" — asymmetric scrutiny, which is what a correction pass must
guard against in *both* directions if it is not to overshoot.

Scholar Gateway · systematic directional bias, calibration, debiasing · 12 passages · 11 articles ·
1980-02-01–2024-09-07. And · positive test strategy and falsification asymmetry · 10 passages ·
6 articles · 2007-07-21–2016-11-17.

### 1.4 Route fact worth keeping

An arXiv query for `all:"anchoring" AND all:"expert judgment"` (2026-08-19) returned 8 entries, **all
recent machine-learning papers** — LLM-judge calibration, aesthetic-ranking benchmarks, video
benchmarks. Zero from judgment and decision making. **arXiv is the wrong index for the
anchoring/calibration literature**, and anyone sweeping it through arXiv alone will wrongly conclude the
topic is an LLM-evaluation concern. Scholar Gateway returned the real corpus on the first query.

**Caveat on all Scholar Gateway citations here:** the API returns DOIs and passage text but **null
titles and null authors**. Every DOI above is verified as returned by the named query. No title or
authorship is asserted from that source. Author names appearing above are those quoted *inside* the
passage text.

**UNVERIFIED — model memory:** Tversky & Kahneman 1974 (*Science*) is the origin of the anchoring
construct; DOI `10.1111/risa.12360` is, I believe, Montibeller & von Winterfeldt in *Risk Analysis*;
Nickerson 1998 is "Confirmation Bias: A Ubiquitous Phenomenon in Many Guises," *Review of General
Psychology* 2:175 — that last one appears as a quoted citation inside DOI `10.1111/jels.12129`, so it
is corroborated but not fetched.

---

## 2. Item 1 — aviation ADs, reconciliation record and recurring re-review obligation

All CFR text below from `law.cornell.edu`, fetched 2026-08-19.

### 2.1 The record format — this is the direct answer

**14 CFR 91.417(a)(2)** requires the owner or operator to keep records containing:

> "The current status of applicable airworthiness directives (AD) including, for each, the **method of
> compliance**, the **AD number** and **revision date**." And: "If the AD involves **recurring action**,
> the **time and date when the next action is required**."

`https://www.law.cornell.edu/cfr/text/14/91.417`

**Finding.** This is a four-field per-claim reconciliation record, and it is exactly the shape our
assertion set lacks:

1. **Identity** — the AD number. A stable external reference, not prose.
2. **Version** — the revision date. Compliance is against a *specific version* of the authority's
   statement, so a revised AD is a new obligation even though the number is unchanged.
3. **Disposition** — the method of compliance. Not a boolean "done"; the *route taken*, which is what
   makes the record auditable rather than merely reassuring.
4. **Expiry** — the next-action due date, present only when the obligation recurs.

Note field 4's conditionality. The regulation does **not** put an expiry on every record. It puts one
on records whose underlying obligation is recurring, and it makes the recurrence a property of the
*directive*, not of the operator's diligence. Transferred to our problem, the analogue of "recurring"
is not "important" — it is "the claim is nonmonotonic," which §1.2 argues is precisely the negative
capability claims and precisely not the positive ones.

### 2.2 The obligation chain and where the expiry actually sits

- **14 CFR 91.403(a)** — "The owner or operator of an aircraft is **primarily responsible** for
  maintaining that aircraft in an airworthy condition, **including compliance with part 39** of this
  chapter." The duty to reconcile against the AD stream is the operator's, not the authority's, and it
  is asserted as a general standing duty rather than a discrete task.
- **14 CFR 39.7** — "Anyone who operates a product that does not meet the requirements of an applicable
  airworthiness directive is **in violation of this section**." Non-compliance is a violation on its
  own; no separate finding of negligence is needed.
- **14 CFR 39.11** — "Airworthiness directives specify **inspections** you must carry out, conditions
  and limitations you must comply with, and any actions you must take to resolve an unsafe condition."
- **14 CFR 91.409(a)** — "No person may operate an aircraft unless, **within the preceding 12 calendar
  months**, it has had an annual inspection..." **(b)** — a 100-hour inspection for aircraft carrying
  persons for hire, with a permitted 10-hour overage while ferrying to the facility, that overage
  counting against the *next* interval.

**Finding.** Part 39 itself contains **no periodic re-review obligation**. I checked and it does not.
The expiry lives one layer out, in the maintenance-program rules: 91.409 imposes a **calendar-time
ceiling** (12 months) and, for commercial use, a **usage-time ceiling** (100 hours), whichever binds
first. Two clock types, and the second is the interesting one for us — the AD status record is
re-examined when the aircraft has been *used*, not merely when time has passed. The overage rule is
also worth noting: a permitted small excursion is deducted from the next interval, so slippage cannot
accumulate.

Three more applicability primitives in Part 39, by section title (text not fetched; **route not
taken:** individual Cornell pages for 39.15/39.17/39.19/39.27):
- **39.15** — "Does an airworthiness directive apply if the product has been changed?"
- **39.17** — what to do when a change to the product affects the ability to accomplish the AD.
- **39.19 / 39.21** — Alternative Method of Compliance: a **registered, authority-approved deviation**.
- **39.27** — what to do when the AD conflicts with the service document it was based on. The
  authority's mandate takes precedence over the vendor's own document.

### 2.3 The publication surface

`https://ad.easa.europa.eu/` (200). 17,365 AD publications, searchable, paginated by issue date. Each
record carries: number, issuing authority, **issue date**, subject, **Approval Holder / Type
Designation** (the applicability key), **effective date** (distinct from issue date), and a PDF
attachment. Record classes include `AD`, `PAD` (proposed, open for comment), and `EAD` (emergency).

**Finding.** Two dates, not one — issue and effective — so the consumer gets a defined lead time
between "the authority said it" and "you are in violation." And `PAD` is a **pre-publication class**:
the mandate is visible and commentable before it binds. A vendor changelog with no feed gives us
neither. The transferable point is that **the authority does the diffing and emits dated, numbered,
applicability-keyed records**; the operator reconciles against a stream of records rather than
re-reading prose. Where no such stream exists — our case — that diffing work does not disappear, it
relocates to us, and 91.417(a)(2) says what the resulting record must contain.

---

## 3. Items 2 and 3 — demoted, per the correction

**Nuclear:** 10 CFR 50.2 defines "design bases"; 10 CFR 50.59(a) names the written model "the FSAR
(**as updated**)" — currency written into the defined term; 50.59(c)(2) gates changes, including "a
departure from a **method of evaluation** described in the FSAR"; 50.59(d) requires a **retained
written evaluation** per self-approved change; **10 CFR 50.71(e) sets a statutory maximum staleness of
24 months on the document as a whole**, independent of whether anyone noticed a discrepancy. STUK
YVL B.1 (eff. 15 June 2019) Req. 359 gives the sharpest wording found anywhere in this sweep:
documentation "shall be consistent and **traceable to a frozen baseline** of the plant design"
(also Reqs. 305, 319, 327, 404).

**Configuration management:** NASA SE Handbook Rev 2 (NASA/SP-2016-6105 Rev 2, NTRS 20170001761, 356 pp,
extracted locally) §6.5 pp.167-174 — CM "ensures **consistency between the product and information about
the product**"; five elements including **Configuration Status Accounting**, which tracks "status and
final disposition of identified **discrepancies** and actions identified during each configuration
audit" (§6.5.1.2.4, p.173); configuration verification "sometimes divided into **functional and physical
configuration audits**" (§6.4.1.2.5, p.174); and a vocabulary separating major change, minor change, and
**waiver/deviation** — "a documented agreement intentionally releasing a program or project from meeting
a requirement" (§6.5.1.2.3, p.172).

**IAEA: still unchecked, now with a code.** `iaea.org` publication page returned **402 Payment
Required**; the Wayback JSON API confirms **no archived snapshot exists** for that URL. Our repo's
NOT-CHECKED marker is correct and I could not clear it. **Route not taken:** `www-pub.iaea.org` direct
PDF paths for IAEA-TECDOC on plant configuration management.

---

## 4. Findings, in order of weight

1. **Negative capability claims are nonmonotonic by construction; positive ones are not.** This is a
   structural explanation of 4-of-4, and it needs no appeal to bias. A vendor shipping any new feature
   is exactly the "new information added" that withdraws a negation-as-failure conclusion.
2. **The four reversals are a type error visible on the face of the sentence.** Extended logic
   programming distinguishes strong negation ("provably false") from negation as failure ("not
   currently believed") and admits a third value, **unknown**. Our documents wrote the first on evidence
   supporting only the second. Detecting that requires no network call.
3. **TMS is a mechanism and AGM is not.** Support lists, base vs derived beliefs, IN/OUT labels,
   dependency-directed backtracking. The one prerequisite is a per-assertion support list. Lazy label
   evaluation exists as a cost mitigation if propagation ever gets expensive at ~180 nodes.
4. **The overshoot is called culprit selection and it is under-determined.** A contradiction identifies
   an inconsistent support set, not a culprit. This is a known hard problem with its own literature, not
   a lapse in care.
5. **14 CFR 91.417(a)(2) is the record format:** identity, version, disposition, and — conditionally, for
   recurring obligations only — next-due date. The expiry attaches to the *directive's* recurrence, not
   to the reviewer's diligence. In aviation the recurring clock is dual: 12 calendar months **or** 100
   hours of use (91.409), whichever binds first, with permitted overage deducted from the next interval.
6. **Cooke's classical model is the detector for directional bias:** seed items with known answers,
   scored, yielding a calibration statistic and a correction function. Direction and spread are separately
   parameterised, which is why the overshoot is a distinct defect and not more of the same error.
7. **Caution against over-reading the bias frame.** Confirmation bias is provably optimal under stated
   conditions, and Klayman & Ha's positive test strategy is functional — its function includes supplying a
   **stopping rule**. For a negative claim, the stopping rule for "it cannot" is indistinguishable from
   the stopping rule for "I stopped looking." That is a procedural defect, and it has a procedural fix,
   which is different from a bias that needs a debiasing intervention.

No implementation proposed. One boundary the survey does establish: the two mechanisms are from
different literatures and do different jobs — a **dependency graph with support lists** (TMS) propagates
a retraction, and a **seeded calibration score** (Cooke) detects a directional tilt. Neither does the
other's job, and merging them into a single "staleness checker" would deliver neither.
