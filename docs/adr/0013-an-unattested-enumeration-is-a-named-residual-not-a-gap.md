# ADR-0013: An unattested enumeration is a named residual, not a gap, and it may never become a number

- **Status:** Accepted
- **Date:** 2026-08-17
- **Closes:** issue #35.
- **Supersedes:** nothing. ADR-0002, ADR-0005, ADR-0006, ADR-0008, ADR-0011 and ADR-0012 all stand as
  written. This ADR adds a component the outcome model never had. ADR-0011's Context states the
  boundary explicitly — *"Whether that principle binds every rule is issue #35 and is **not** decided
  here"* — so this is the decision that ADR was deferring to, not a revision of it.
- **Extends:** ADR-0006 decision 5, the blind-endpoint disclosure, which stands unchanged and keeps
  its mandatory status. Decision 6 below adds a per-resource layer beneath it. The reason a second
  layer is warranted is that decision 5's disclosure **was already shipping when the false green
  shipped** — see decision 6.
- **Observed evidence:** `docs/proof/results-t5-red-test.md` §1, the live run of 2026-08-17 on commit
  `6b719cf`. A scan of `wl-revoke-parent` exits `0` with `SYS001 1/1 resources (100.0%)`, `conforms`,
  `evidence sufficient`, over a page whose child the read-only connection cannot see. Pinned as an
  executable pair in `slice/CHECK-redtest.ts` TEST 2 and TEST 3, with mutations 2b and 3b.
- **Documented evidence:** `docs/research/frame-completeness-prior-art.md`, sweep of 2026-08-17,
  four domains queried and three returned. All ten DOIs resolved against `api.crossref.org`.
  Supporting: `docs/research/unseen-population-sizing.md`, which reaches this ADR's central
  prohibition from an independent literature.
- **External input consulted:** `docs/inputs/decay-causal-synthesis-2026-08-16.md`, cause 2. Not
  authority. It is the reason decision 6 is shaped as it is, and it is cited as a mechanism, not as a
  fact.
- **Not checked, and named because it was sought:** the formal treatment of query completeness over
  incomplete databases — Motro (1989) on integrity as validity plus completeness, and
  Razniewski & Nutt (VLDB 2011) on table-completeness statements. **This is the closest formal
  analogue to this decision and it remains unopened**, because the available corpus is Wiley and that
  literature is ACM/VLDB. Neither is claimed as absent. Nothing below rests on either.

## How to treat this document

You are not being given orders. This was written by the session that ran the prior-art sweep, verified
every DOI against Crossref, and read the live reproduction and the two red-test fixtures that pin it.
It has **not** implemented the residual register, and decision 6 is the decision that implementation
will make expensive if it is wrong.

Each decision is labelled **revisable** or **non-negotiable** under *Decision status*, and each
revisable one names the evidence that reopens it. Surface disagreement with reasoning; do not silently
deviate.

## Context

### The defect, and it is not a defect in any shipped code

The read-only subject issues `GET /v1/blocks/{parent}/children` against `wl-revoke-parent`. It
receives the page's paragraphs and **no `child_page` block at all**. The child `wl-revoke-child`
(…`ce0fb949`) exists — the builder identity, which holds full access and is explicitly not part of the
measurement, reads it. The subject is not told the child is unreadable. The child is **absent**.

So the applicable set is built as 1, the evaluated set is 1, and every figure the run publishes is
internally consistent and true of a workspace that is not the one being scanned.

Nothing in T1–T5 introduced this and none of them could prevent it. ADR-0006 decision 2 already
records that the children endpoint carries no truncation signal, which means a permission-filtered
listing and a complete one are indistinguishable **in the response**. The scan is blind here by
documented API limitation.

**The part that is this project's problem rather than Notion's:** the report *already* discloses that
the traversal spine is trusted blind, and prints exit `0` on the same page. Both statements are true.
They sit in different sections. Nothing connects them, so a reader who trusts the byte has been warned
only in general terms, elsewhere.

### The reach of the mechanism is decidable exactly, and it is the block type

| Trace | Survives permission filtering | Caught by |
| --- | --- | --- |
| Inline `href` in rich text (`wl-outside-grant`) | **yes** — the paragraph is readable | `REF001` → 404 → `confirmed` / `unreachable` |
| `child_page` block (`wl-revoke-child`) | **no** — the block goes with the permission | **nothing** |

`REF001` catches a vanished resource when a trace survives. When the trace is the block that carried
the permission, no trace survives.

### Issue #35 as filed does not cover issue #35's own evidence

The rule the issue proposes is:

> A rule's applicable set is derived from what the API returned. It is never derived from the subset
> the tool knows how to handle.

**The reproduction satisfies that rule and still produces a false green.** The denominator was built
from exactly what the API returned. The API returned a filtered list and said nothing about filtering
it.

The rule as filed is correct, and it is about **tool competence**. Its two cited instances are both of
that kind: the `app.notion.com` host allow-list, and the `child_page`-only applicable set, at
`docs/proof/results-ref001-live.md` §2 and §3. The new instance is about **frame fidelity** — whether
the thing the tool enumerated is the thing that is there. Two failure modes, two remedies, one issue.
Separating them is the first thing this ADR does.

### The outcome model is one component short, and the field that names the components says so

Survey methodology separates errors of observation from errors of **nonobservation**, and splits the
latter into three: sampling, coverage, nonresponse. Pont (2007), *JRSS-A* 170(3), 713–733, DOI
`10.1111/j.1467-985X.2007.00475.x`, §2, attributing Groves (1989). Map that onto ADR-0005 decision 1:

| Component of nonobservation error | ADR-0005 axis | Status |
| --- | --- | --- |
| Nonresponse — in the frame, not obtained | `unreached` | Modelled |
| Measurement / processing — obtained, not usable | `undecidable` | Modelled |
| **Coverage — not in the frame at all** | **none** | **Not modelled** |

ADR-0005 exists because ADR-0003's four-valued enum was "one dimension short and [mixed] two axes."
**This is the same finding one level up.** The pair is one dimension short, and the missing dimension
is exactly the one the live reproduction exercises.

### Two independent literatures agree the missing quantity cannot be measured

Pont (2007) §2, continuing the attribution: coverage error *"exists because some persons are not part
of the list or frame [and] can never be measured."* **That clause is quoted from Groves via Pont;
Groves 1989 was not opened.** The taxonomic claim above does not depend on it — Johnson & Sleet (2014)
and Rao (2007) state the components independently — but this clause does, and it is load-bearing.

It does not stand alone. `docs/research/unseen-population-sizing.md` reached the same prohibition from
capture-recapture statistics, on four Crossref-verified abstracts: no upper bound is estimable in the
general case, and every estimator that produces one needs a frequency-of-frequencies distribution
that a cursor-paginated read cannot produce, because each child is returned exactly once. Two fields,
two routes, one answer. **The prohibition survives even if the Groves attribution is wrong.**

### The bias runs in the flattering direction, and another field has quantified it since 2003

Diagnostic-accuracy research has this product's exact structure: an index test applied broadly, a
reference standard applied to a subset only, accuracy computed on the verified subset.

de Groot et al. (2008), *Statistics in Medicine* 27(28), 5880–5889, DOI `10.1002/sim.3410`, abstract —
**Crossref-verified**:

> "Partial verification refers to the situation where a subset of patients is not verified by the
> reference (gold) standard and is excluded from the analysis. If partial verification is present, the
> observed (naive) measures of accuracy such as sensitivity and specificity are most likely to be
> biased."

Kosinski & Barnhart (2003), *Biometrics* 59(1), 163–171, DOI `10.1111/1541-0420.00019`, abstract —
**Crossref-verified** — gives the direction:

> "If only data from patients who received the gold standard test were used to assess the test
> performance, the commonly used measures of diagnostic test performance — sensitivity and
> specificity — are likely to be biased. **Sensitivity would often be higher**, and specificity would
> be lower, **than the true values.**"

A measurement restricted to the subset the instrument could verify **overstates how well the
instrument is doing**. That is this product's own false-green class, named in another field twenty-two
years before this ADR. It is the decisive argument against publishing `evidence: sufficient` as though
it were a claim about the world.

The dependence is structural here, not incidental. Schmidt et al. (2014), *Head & Neck* 36(11),
1654–1661, DOI `10.1002/hed.23495`: "Verification bias occurs when the verification rate depends on
the result of the index test." In this product one connection grant determines both what is enumerated
and what is evaluated.

**The correction family is unavailable, and the reason is already in the repository.** Begg–Greenes
and multiple-imputation corrections model missingness over subjects *known to be missing*. ADR-0002
established that unshared subtrees are "not merely unread — they are unnameable." A correction that
needs the identity of the unverified cases has no input. Same shape as the capture-recapture finding:
the instruments exist and their inputs do not.

### Both obvious answers are damaged, and the damage is recorded in this repository

- **Publish `sufficient` anyway.** Kosinski & Barnhart says the figure is biased upward. And
  `docs/inputs/decay-causal-synthesis-2026-08-16.md` cause 2 records that the buyer's pain is trust
  collapse — *"Once users stop trusting the workspace as a source of truth, they stop maintaining it
  and route around it."* A byte that can be silently wrong reproduces the failure the product is sold
  against.
- **Never publish `sufficient` in v0.1.** Every block-children traversal is unattested, so the field
  becomes constant on every run of every workspace. **A constant field carries no information.** The
  same input passage names "no authority signal" as part of the same decay. ADR-0005's fourth
  Revisit-if already anticipated the softer version of this — that readers discount a limitations half
  they always see.

The way out is not a third verdict value and not a corrected number. It is the shape both analogous
fields converged on independently: **carry the doubt as a named, structured residual, and attach it to
the thing it qualifies.**

STARD is the fourth member of the reporting-guideline family ADR-0005 decision 5 borrowed from, and it
is the member whose subject is a test measured against a standard applied to part of the population
only. Khan, Bakour & Bossuyt (2004), *BJOG* 111(7), 638–640, DOI `10.1111/j.1471-0528.2004.00218.x`,
figure caption: a flow diagram giving "the complete verification of all cases **regardless of index
test result**."

Safety assurance supplies the structure and a cost figure. Viger et al. (2025), *Systems Engineering*
29(1), 99–113, DOI `10.1002/sys.70010`, uses eliminative argumentation, whose distinguishing node is
the **defeater** — "reasons to doubt AC claims". Its taxonomy: "Undercutting defeaters challenge
inference rules, **undermining defeaters challenge evidence**, and rebutting defeaters challenge
claims." The blindness here is an undermining defeater: it does not dispute that the evaluated
resources conform, it disputes that the evidence base is what the report implies. And from the LHC
case study: *"Of these nodes, 105 are defeaters… While most defeaters are mitigated by evidence,
**nine are left as residual risks within the AC.**"*

A 506-node assurance case ended with nine unmitigated residuals and shipped. **Carrying named residual
doubt is not the same as refusing to render a verdict.** That is the empirical answer to the objection
behind the second option above.

## Decision

### 1. Tool competence and frame fidelity are separate failure modes and are named separately

**Tool competence** — the applicable set was built from the subset the code knows how to name. Remedy:
widen the recogniser, or record the unrecognised as a drop-out. **This is a consequence of ADR-0005
decision 5 honestly applied, not a new decision**, because the funnel already requires every drop-out
to be named with a specific cause, and a type the tool cannot handle is a drop-out. It becomes a
settled default in `CONTEXT.md`, which is the answer to issue #35 as originally filed.

**Frame fidelity** — the enumeration itself may have been filtered upstream, undetectably. Remedy:
none available in-band. Decisions 2 through 7 are about this one.

### 2. `Attestation` is a property of an enumeration, recorded on the `Enumerated` stage

Two values, recorded per enumeration in the coverage manifest:

| Value | Condition |
| --- | --- |
| `attested` | The endpoint carries a completeness signal and the scan checked it. |
| `unattested` | The endpoint carries no completeness signal. |

`POST /v1/search` is attested per ADR-0007's table. `GET /v1/blocks/{id}/children` is **unattested**
per ADR-0006 decision 2.

**Attestation describes the method, not the result.** It is read off the endpoint the scan called. It
is declared, never inferred from a response, and never computed. ADR-0005 decision 5 already separated
`Enumerated` from `Fetched` because that stage carries a property the others do not — unboundedness.
This is a second property of the same stage, and it is why the stage boundary was worth keeping.

### 3. An unattested enumeration is NOT a Gap, and enters no arithmetic anywhere

`CONTEXT.md` defines a Gap as an applicable coverage item that **left the funnel** before evaluation.
Under an unattested enumeration nothing left the funnel. The doubt is whether the item was ever *in*
it.

Therefore an unattested enumeration:

- is **not** counted in any numerator or denominator,
- does **not** enter any coverage ratio, the coverage vector, or the headline minimum,
- does **not** affect the conformity ratio,
- does **not** make a gap set `Pervasive`,
- and is **never rendered as a ratio, a percentage, a count of missing items, or an estimate.**

The last clause is the hard one and it is carried by two independent literatures. The quantity is not
estimable. Any number published about it would be an invention, and — per the capture-recapture
sweep's hazard 2 — an invention biased in the flattering direction, which is the product's own defect
class arriving inside the instrument built to detect it.

**A count of unattested enumerations is not a count of missing items and is permitted.** Decision 6
requires it. It counts calls the scan made, which the scan knows exactly.

### 4. `evidence: sufficient` keeps its ADR-0005 meaning, unchanged

It remains: every applicable coverage item was fetched and judged. It is not weakened, not redefined,
and not made conditional. Redefining it would break the ISA 705 grammar ADR-0005 decision 1 adopts
wholesale, and would make the two axes non-orthogonal — the failure ADR-0005 was written to end.

The correction is not to the value. It is to what may be printed beside it.

### 5. A report may not print `evidence: sufficient` without the attestation state behind it

**The operative decision.** For each rule, the report publishes that rule's evidence sufficiency
together with the attestation state of the enumerations that built its applicable set. The two travel
together or neither is printed.

This is not a new instrument. ADR-0005 decision 4 already prohibits publishing a conformity ratio
without the coverage figure that bounds it — *"Two figures are published together or not at all"* —
and `report.ts` already enforces three such suppressions. This is the same rule applied to a new pair,
and it is enforced the same way.

### 6. The residual register extends ADR-0006 decision 5; it does not replace it

**ADR-0006 decision 5 already requires a blind-endpoint disclosure**, implemented at
`docs/spec/v0.1-scan-slice.md` §3.1, and it stands unchanged. It names, per run, which **endpoint
families** the scan used and which carried a truncation signal.

**That disclosure was already shipping when the false green shipped.** The `wl-revoke-parent` run
printed it and exited `0` on the same page. So the defect is not a missing disclosure, and adding a
second sentence would not have caught it. Two properties the existing statement does not have, and
both are what let the finding through:

| | ADR-0006 decision 5 | This register |
| --- | --- | --- |
| Granularity | endpoint **family**, per run | **resource**, per enumeration |
| Form | a sentence | structured entries |
| Attachment | the disclosures section | **the byte's own basis line** |

A family-level sentence says *this run trusted block-children blind.* It cannot say *this run trusted
`3bf1351d-…-ce0fb949`'s parent blind, and that is the subtree your clean byte is about.* The register
is the per-resource layer beneath the standing statement. Both ship.

The section is **structured, never prose** — the standing rule, paid for twice in one commit, is that
a drop-out carries structure so its facts are not recovered by pattern-matching a cause string.

Each entry carries: the fixed cause `enumeration_unattested`; the **full hyphenated resource ID**; the
endpoint called; and the remedy — *verify out of band, with a full-access identity, that the declared
tree is the tree the scan saw.*

The ID is printed in full and matched on the full ID or the suffix. Notion IDs are time-ordered, the
declared root and two of its children share eight leading hex digits, and a prefix rendering has
already made three distinct resources read as one.

**The count of residuals prints on the same line as the byte's basis.** This is the whole point of the
decision. The S017 finding was not that the disclosure was missing — it was that the disclosure and
the byte were two true statements in different sections with nothing connecting them. A residual
register in a distant section reproduces that defect with more words.

### 7. The remedy is distinct, which is what earns the value

The project's deletion test is that a value is distinct when its remedy is distinct (ADR-0009
decision 6).

| State | Operator's remedy |
| --- | --- |
| `unreached` | Widen access, or raise the request budget. |
| `undecidable` | Fix the rule, the configuration, or the data. |
| `unattested` | Confirm out of band that the declared tree is the tree the scan saw. |

Three states, three remedies, none substitutable. Sharing more pages does not make an enumeration
attested — the endpoint still carries no signal. Re-running does not either.

### 8. STARD joins ADR-0005 decision 5's citation set

Recorded here rather than by editing ADR-0005, per the rule that an ADR is never edited in place.
Decision 5's funnel cites CONSORT, PRISMA and STROBE. **STARD is the fourth and the closest**, because
its subject is a test measured against a standard applied to only part of the population, which is
this product's structure exactly. Its added requirement is that the flow account for cases *regardless
of index-test result* — the denominator must not be conditioned on what the instrument did.

Its evidential standing matches decision 5's others and is no better: fetched by a retrieval tool,
**not independently re-verified**. Re-verify before quoting the caption anywhere published.

## Consequences

**Gained: the byte and its own limitation become inseparable.** The report already said the traversal
spine is trusted blind. Now that statement is attached, by count, to the line that carries the byte. A
reader who reads only the verdict line still learns that a residual exists.

**Gained: the outcome model matches the canonical error taxonomy for the first time.** Three
components of nonobservation error, three expressions. The gap was invisible while the model was
compared only against ISA 705, which is an opinion grammar rather than an error taxonomy and has no
frame component to be missing.

**Gained: a prohibition that would otherwise have been discovered by shipping it.** The flattering
direction here is to size the unattested set — one plausible-looking estimator, published as a
coverage adjustment. Two independent literatures say the estimate cannot be made and would be biased
low. Decision 3 forecloses it before an implementation invents one.

**Paid: every v0.1 run carries at least one residual.** Every declared root is traversed with
`GET /v1/blocks/{id}/children`. There is no configuration in v0.1 that produces an empty register. The
register is therefore load-bearing on its formatting: it must not read as boilerplate, and it will if
it is verbose.

**Paid: the output contract widens again.** ADR-0005 already doubled it. This adds one section and one
figure on the basis line. `PRODUCT.md`'s complaint that a v0.1 with a manifest more elaborate than its
rule catalogue is a strange-looking product gets stranger.

**Paid, and stated plainly: this ADR does not fix the false green.** A scan of `wl-revoke-parent` will
still exit `0`. `SYS001` will still read `1/1 resources (100.0%)`. The child will still be invisible.
What changes is that the report can no longer present that byte without the residual count beside it.
**The defect is disclosed, not closed, and no in-band mechanism can close it** — that is ADR-0006
decision 2 and ADR-0002, not a limitation of this decision.

**Rejected by consequence.** Any coverage figure adjusted for suspected filtering. Any estimate of how
many resources a filtered enumeration omitted. Any report that prints `evidence: sufficient` alone.
Any residual register rendered as a prose sentence rather than as structured entries. Any exit byte
that varies on attestation — the operator considered and rejected it this session, on the grounds that
the remedy is identical to the one the register already prints.

**Deferred, not decided.** Whether an operator may opt into a stricter mode in which an unattested
enumeration caps the run at `qualified`. That is a configuration question with a real audience — a
compliance user may want the strict byte — and it is not v0.1.

## Decision status

- **Non-negotiable — decision 3's prohibition on rendering the unattested set as a number.** Two
  independent literatures, and the flattering-direction hazard is this product's own defect class.
  Better evidence about the Notion API does not bear on it; only an estimator with an input this
  access pattern can supply would, and none exists.
- **Non-negotiable — decision 5's publication constraint.** It is ADR-0005 decision 4's instrument
  applied to a new pair. Weakening it reintroduces the exact defect the S017 red test found.
- **Non-negotiable — decision 6's count on the basis line.** The finding was that two true statements
  sat in different sections. Moving the count off that line restores the finding.
- **Non-negotiable — decision 4.** `evidence: sufficient` is not redefined. The axes stay orthogonal.
- **Revisable with new evidence — decision 2's two-valued attestation.** *Revisit if:* an endpoint
  appears that carries a partial or advisory completeness signal, at which point two values are one
  short and the same "one dimension short" finding fires again, on this ADR.
- **Revisable with new evidence — decision 6's two-layer arrangement.** The register and ADR-0006
  decision 5's standing statement both ship, and that is a proposal, not a settled fact: it is
  defended by a granularity argument, not by an observation of the two together. Neither has been
  rendered beside the other in a real report. *Revisit if:* a rendered report shows the standing
  statement adds nothing the register does not already carry per resource, in which case the honest
  move is a superseding ADR that folds decision 5's content into the register — **not** a quiet
  removal, because the statement is mandatory under ADR-0005 decision 5 and ISO 19011 clause 6.5.1
  item k), which is the one item in that clause that is required rather than optional.
- **Revisable with new evidence — decision 6's register format.** *Revisit if:* real reports show the
  register reading as boilerplate. That is ADR-0005's fourth Revisit-if arriving here, and the fix is
  a redesign of the disclosure, not its removal — removal returns to the state the red test found.
- **Revisable with new evidence — decision 1's classification of tool competence as a consequence
  rather than a decision.** *Revisit if:* a **third** instance appears in a **third** rule. That is
  issue #35's own Revisit-if and it is carried forward unchanged: three instances across three rules
  makes "consequence of an honestly applied funnel" much weaker, because the funnel is being applied
  and the defect recurs anyway. Two instances stand today, both in the same family.

## Revisit if

**Notion ships a truncation or completeness signal on `GET /v1/blocks/{id}/children`.** The
enumeration becomes attested, the register empties, and decisions 5 and 6 become inert without being
wrong. This is the clean exit and it is not announced.

**The formal database-completeness literature is opened and disagrees.** Motro (1989) and
Razniewski & Nutt (VLDB 2011) treat certifying query completeness over a partially-known database,
which is this decision stated in another vocabulary. It was sought and was out of corpus reach. If it
supplies a decidable framework for stating completeness over a filtered source, decision 2's
two-valued property is the crude version of something better specified.

**A residual is found that is not an enumeration.** The register is scoped to enumerations because
that is where the observed instance lives. If a second undermining defeater appears at another stage
of the funnel, the register generalises and `enumeration_unattested` becomes one cause among several
rather than the only one.

**`REAL_ROOT_ID` is exercised and residual counts on an organic workspace are large.** The fixture has
one declared root. A real workspace has many, and the register's per-entry cost is what decides
whether decision 6 is readable. No run has produced that number.
