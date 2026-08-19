# Vendor-assumption drift — what detects it, what cannot, and why our errors ran one direction

- **Status:** Research. Trust tier **documented** — what a primary source states. Beaten by `docs/proof/`.
- **Date:** 2026-08-19.
- **The question:** ~180 assertions about Notion's behaviour live in `docs/adr/` and `CONTEXT.md`.
  Nine carry a followable locator (#124). Four spot-checked assumptions were refuted, **all in the
  same direction — toward "cannot"** (#125). What prior art detects this, and what does not?
- **Behind:** #124, #125, #123, and the Notion SME instrument this file was swept to license.
- **Raw scout reports:** `sweep-raw/contract-testing.md`, `sweep-raw/grounded-claim-verification.md`,
  `sweep-raw/belief-revision-and-calibration.md`. Every scout's blocked-route table is preserved there.
- **Method note:** three independent scouts, one per literature, dispatched before any instrument was
  designed — §0.5's hard trigger. Each was told WebSearch is exhausted and routed to WebFetch, the
  keyless arXiv API, Crossref and Scholar Gateway.

⚠ **READ THIS BEFORE CITING A NUMBER FROM §2.** The scout recorded that the RGB, FaithEval and
Sufficient Context table values were extracted from ar5iv/HTML renderings **by the fetch
summarizer**, not read out of abstracts. They are good enough to size a design and **not yet good
enough for an ADR**. Re-verify against the paper before any of them enters a decision document.

---

## 1. The headline: three literatures, three different answers, and none of them is one instrument

The sweep was framed as one question. It came back as **three separable jobs**, and the reliability
scout's closing line is the load-bearing warning:

> the instrument has two separable jobs — dependency graph (TMS) and seeded calibration score
> (Cooke). Merging them into one "staleness checker" delivers neither.

Adding the grounding scout's finding makes it three:

| Job | Literature | What it detects | What it cannot |
| --- | --- | --- | --- |
| **A. Is this quote still on the page?** | doctest; recorded-observation drift | a vendor sentence that CHANGED | a claim never verified in the first place |
| **B. What else falls if this is wrong?** | Truth Maintenance Systems | propagation of a retracted base belief | whether the base belief is true |
| **C. Is this source's judgement any good?** | structured expert judgment (Cooke) | systematic directional bias in a source | any individual claim |

**Our four reversals were job C's signal, sitting in a corpus with no job B graph, and job A cannot
see them at all.** That is the whole finding.

---

## 2. What the software field offers, and where it stops

### 2.1 ⛔ Consumer-driven contract testing does NOT transfer. The vendor says so.

`docs.pact.io/faq`, fetched 2026-08-19:

> "if you use Pact to test a public API, the only way to set up the right provider state is to use the
> very API that you're actually testing, which will make the tests slower and more brittle… If this is
> still a better situation for you than integration testing, or using another tool like VCR, then go
> for it!"

CDCT requires the **provider's** CI to run verification, plus provider states and provider version
IDs. We have none of the three. **This refutes the frame this session first proposed.**

`oasdiff` fails on the same constraint from the other end: it diffs spec against spec, and Notion
publishes no spec we trust. Confluent Schema Registry likewise — but one shape survives it:
**transitive** compatibility checking against *all* prior versions, not only the last.

Academic status is thin, and that is itself a finding. Schwarz, Quast & Riehle 2025, DOI
`10.1002/stvr.70006`, a systematic literature review of CDCT, calls its own empirical base **"rare"**
and scopes CDCT to **syntactic** interoperability. Our problem is semantic.

**Bi-directional CDCT (BDCT) was chased down and is EXCLUDED, not merely unassessed.** It does remove
the provider-CI requirement — and replaces it with a **provider-published OpenAPI spec**, compared
document-against-document on PactFlow's servers. `pactflow.io/bi-directional-contract-testing/`
(fetched 2026-08-19) states the feature is *"exclusive to PactFlow"*; the open-source Pact Broker does
not implement it. Notion publishes no spec we trust, so the substitution fails at the same point.

**Spring Cloud Contract is also excluded, and its failure mode is the one to remember.** For a third
party *you* write the contract, it generates a WireMock stub **from your own contract**, and your tests
run against the stub. The real provider is never touched — **green on day one, green through every
vendor change.** That is §2.4's cassette with a build system attached.

### 2.2 Deprecation RFCs exist and are the wrong direction

RFC 8594 (Sunset header) and RFC 9745 (Deprecation header, Proposed Standard, March 2025) both exist.
Both announce **retirement only**. RFC 8594 §4 states Sunset *"is not concerned with resource state at
all."* Neither covers a capability **change**, and neither can be caused by us — cheap to read,
impossible to compel.

### 2.3 ✅ What does transfer: doctest, and recorded-observation drift detection

`doctest`'s stated first purpose is our problem verbatim — *"check that a module's docstrings are
up-to-date by verifying that all interactive examples still work."* The mechanism is that **the claim
and its verification are one artifact.** `CHECK-claims.ts` is already this shape for claims about the
repo; #124 is the extension to claims about the vendor.

The closest whole-mechanism match is **recorded-observation drift detection** — probe live, serialise,
diff against stored, fail on difference. Optic built it (OpenAPI inferred from traffic) and was
**archived 2026-01-12**, Optic Labs absorbed into Atlassian. **No maintained tool composes it.** We
are not reinventing a live wheel.

### 2.4 ⛔ The trap in a mirrored corpus: VCR passes forever

VCR-style recording **hides drift by default**. A cassette passes indefinitely unless it is
re-recorded and diffed. **A `docs/vendor/` mirror of fetched pages IS a cassette.** Stored without a
mandatory re-fetch it becomes a monument to today's beliefs with better formatting than the ADRs — the
same defect, harder to see. **The watch is not an enhancement to the corpus; it is the only thing that
makes the corpus safe to keep.**

### 2.5 ⭐ THE GAP NOTHING COVERS: negative capability claims

> *"The API cannot do X"* is not observable in traffic, is not a schema diff, and is announced by no RFC.

**All four of our reversals were negative claims.** Every mechanism in §2 detects facts that
**changed**. Ours were never established. This is the single finding that most constrains the design.

`#51` is the worked example: `notion-port.ts` lacked a method, the absence was written down as a
property of Notion, and it gated four sessions as *"THE CEILING"*.

⭐ **The general form of the rule was stated by a vendor about its own product.** PactFlow, in
`github.com/pactflow/example-bi-directional-provider-dredd` (fetched 2026-08-19):

> "_implementing_ a spec is not the same as being _compatible_ with a spec. Most tools only tell you
> that what you're doing is _not incompatible_ with the spec."

**A source that is silent about X never contradicts "X is impossible."** Every mechanism surveyed
compares *descriptions or observations of what a system does*; **none probe what it refuses.** So a
negative claim cannot be established by any amount of reading that fails to mention the capability —
only by a sentence that asserts the negative, or by an attempt that fails. This is the
substitutable-control problem in a new place, and it survived contact with every source added in the
follow-up sweep.

**A useful metric exists for the quantity we lack:** technical lag, DOI `10.1002/spe.2215`. And for
**rationing** a re-check budget once claims outnumber fetches, the literature is Web API
change-proneness prediction, DOI `10.1109/saner60148.2024.00050`.

---

## 3. Is "the agent must cite a source" a sufficient control? No.

This section exists because the instrument's whole premise was that a citing SME beats a recalling
SME. It does, and it is **necessary and not sufficient**. Three measured leaks survive a
URL-plus-quote-plus-date rule.

### 3.1 Citations that resolve and do not support

Liu, Zhang & Liang, arXiv `2304.09848` (2023), human evaluation of Bing Chat, perplexity.ai, NeevaAI
and YouChat:

> "only 51.5% of generated sentences are fully supported by citations and only 74.5% of citations
> support their associated sentence."

ALCE (Gao et al., arXiv `2305.14627`): on ELI5, *"even the best models lack complete citation support
50% of the time."* In a legal-domain pipeline (L-MARS, arXiv `2509.00761`) naive RAG scored **0.13**
strict citation F1; the tuned pipeline reached **0.25**.

### 3.2 ⛔ The model ignores the fetched page and answers from priors — our exact failure mode

FaithEval (arXiv `2410.03727`): GPT-4o scores **96.3% closed-book** and drops to **47.5% under
counterfactual context.** That is precisely our situation — stale parametric knowledge of Notion
versus a freshly fetched page that contradicts it. arXiv `2404.00216` adds that factuality tuning
*reduces* context-faithfulness by up to **69.7%**.

**A more knowledgeable model is not a safer SME here.** It has stronger priors to override.

### 3.3 Retrieval misses and the model fills the hole

RGB (arXiv `2309.01431`), negative-rejection rate on all-noise documents, English: ChatGPT **24.67%**,
ChatGLM-6B **9.00%** — ChatGPT answered from nothing roughly three times in four. Sufficient Context
(arXiv `2411.06037`), 2024 frontier models under insufficient context, hallucinate/abstain: Gemini 1.5
Pro **40.4/50.0**, Claude 3.5 Sonnet **36.5/53.8**, GPT-4o **15.4/61.5**.

### 3.4 ⛔ Abstention is NOT solved, and this one changes the design

Direct answer to the question the scout was sent with: **partial, leaning no.** The TACL survey arXiv
`2407.18418` (rev. 2025) treats abstention as open. FaithEval's unanswerable subset: GPT-4o **59.7%**,
Claude 3.5 Sonnet **62.1%** — the best model fails to say *unknown* about **40%** of the time.

Worst for us, arXiv `2507.16199` finds **prompted abstention is partly a prompt artifact, decoupled
from the model's actual uncertainty.**

> **Consequence: an `UNLOCATABLE` verdict is not self-validating.** A high UNLOCATABLE rate is
> indistinguishable — from the output alone — between an honest agent and one emitting a token it was
> told to emit. **`UNLOCATABLE` must carry a replayable search transcript (URLs attempted, HTTP status
> codes) or it is a fact about the model rather than about the world.**

### 3.5 A second pass helps, and it is bounded

arXiv `2310.01798`, *LLMs Cannot Self-Correct Reasoning Yet*: self-correction without external
feedback sometimes **degrades** performance. So "cite carefully" is not a control at all.
AttributionBench (arXiv `2402.15089`): *"even a fine-tuned GPT-3.5 only achieves around 80% macro-F1"*
on the binary does-this-source-support-this-claim task. Self-preference bias (arXiv `2410.21819`) means
**a verifier drawn from the author's own model family is a compromised control** — which is this
repository's own substitutable-control rule arriving from outside.

### 3.6 ⭐ THE LEAD: the mechanical half has no measured error rate

The scout's unprompted headline, and the design's foundation:

> The only part of the control with no measured error rate is the **mechanical** part — resolve the
> URL (HTTP status), match the quote **byte-for-byte** against the fetched body, stamp the date. That
> is not inference, so none of the ~80% ceilings apply.

It does **not** test whether the quote supports the claim. It **does** eliminate fabricated locators
and misquotes outright — and fabricated-reference rates run **11.4–56.8%** (arXiv `2603.03299`).

**Design rule: the gate is mechanical and is the only trusted layer. Model judgement is treated as
~80% and the residual is designed in, never assumed away.**

---

## 4. Why four errors ran the same direction, and what to do about it

### 4.1 AGM is semantics. TMS is the mechanism.

Stated plainly because conflating them is the failure mode: **AGM belief revision gives a formal
semantics and no implementable procedure.** Truth Maintenance Systems give the procedure —
justifications, support lists, IN/OUT labels, and **dependency-directed backtracking**.

The mapping onto this repository is exact:

- An assertion with an **empty support list is a BASE belief** and must be checked against the world.
- Assertions citing it are **DERIVED**.
- Flip a base to **OUT** and every dependent goes OUT **until re-justified**.

> ⭐ **Nine locators out of ~180 means the support graph is essentially unconnected — and that is
> WHY four errors propagated silently.** There were no edges along which a retraction could travel.

The literature also names our own overshoot: **culprit selection is under-determined** (DOI
`10.1609/aimag.v11i4.866`). When a contradiction appears, which belief to retract is not decided by
the mechanism. This session reversed R1 in `#125` and then had to correct the reversal — that is
culprit selection, not carelessness.

⚠ **Doyle's AI Memo 521 was NOT retrieved** — `dspace.mit.edu` returned **HTTP 405** on all three URL
forms tried. The TMS description above rests on secondary sources. Route not taken: the ACM DL copy.

### 4.2 Directional bias is a different literature, and it has a countermeasure

Structured expert judgment, not belief revision. **Cooke's classical model** uses **seed questions
with known answers**, scored, producing a **calibration statistic per source** (DOI
`10.1111/risa.12385`). Direction and spread are **separate parameters** (DOI
`10.1002/for.3980040404`), so our four-toward-"cannot" and this session's overshoot are **two
distinct defects**, not one oscillation. The literature also prescribes **debiasing before
aggregation** and **learning bias sequentially** (DOI `10.1002/for.3980080306`).

⛔ **And the sharper flag:** DOI `10.1111/risa.12360` covers **motivational** bias, distinct from
cognitive slip. *"Cannot"* was the **self-serving** direction here — it retires work, closes
questions, and justifies a smaller scope. That is not an accident of reasoning.

**Route fact worth keeping:** arXiv is the **wrong index** for judgement-and-decision-making
literature — the anchoring/calibration query returned 8 hits, all LLM-evaluation papers, zero JDM
papers. Scholar Gateway reached the real corpus first try. ⚠ Scholar Gateway returns DOIs with **NULL
titles and authors**, so no title is asserted from it here.

### 4.3 "We could not know" is not available to us

Epistemic and aleatory uncertainty are separable (DOI `10.1111/j.1523-1739.2011.01806.x`). **All ~180
assertions are epistemic — reducible by observation.** None of them is irreducible randomness. So
*"the vendor is opaque"* is not a disposition this repository may claim about a fact its own docs
publish.

---

## 5. How regulated industries keep a document current, and the four transferable primitives

All four come from regulation rather than from software.

1. **A dated, numbered, applicability-keyed change STREAM.** EASA's AD database holds **17,365**
   records; each carries an **issue date and a separate effective date** plus a type designation.
   Operators reconcile against **records**, never against a re-read of the whole corpus. Notion's
   changelog is the analogue and has **no feed**, so the diff must be ours.
2. **Currency stated in the artifact's NAME.** 10 CFR 50.59(a) defines the *"final safety analysis
   report **(as updated)**"*.
3. ⭐ **Statutory maximum staleness on the DOCUMENT as a whole, not per claim.** 10 CFR 50.71(e), max
   **24-month** interval. **Cheaper than per-claim expiry and still bounds drift** — this is the
   affordable version for us.
4. **A retained WRITTEN EVALUATION per self-approved change** (10 CFR 50.59(d)), so the **reasoning**
   is auditable, not only the outcome. NASA's Configuration Status Accounting (SE Handbook Rev 2
   §6.5.1.2.4) tracks *"status and final disposition of identified discrepancies"*, and its
   **deviation/waiver** vocabulary (§6.5.1.2.3) separates a **known, accepted** gap from an
   **unnoticed** one. ⛔ **This repository cannot currently tell those two apart.**

Sharpest wording found anywhere in the sweep — STUK **YVL B.1, Requirement 359**: documentation
*"shall be consistent and traceable to a **frozen baseline** of the plant design."*

14 CFR **39.15/39.17** are applicability-drift primitives and **39.19/39.21** are a registered-deviation
(AMOC) channel. ⚠ **FAA Part 39 contains no periodic re-review duty** — the recurring obligation lives
in the operator's maintenance program, not in the AD rule.

**Blocked, with codes:** `ecfr.gov` → **HTTP 302** to `unblock.federalregister.gov`, bot-block
confirmed, routed around via `law.cornell.edu`. `dspace.mit.edu` → **HTTP 405**, three URL forms.
`stuklex.fi/en/ohje/YVL-A-5` → **404** (wrong slug; `YVLB-1` resolves). `standards.nasa.gov` and the
NASA CM appendix → **404**. **Routes not taken:** 14 CFR 91.403 (maintenance-program re-review),
`nrc.gov` itself, IAEA.

⭐ **`documented-claim-drift-prior-art.md`'s recorded ACM/IEEE gap is now CLOSED.** The keyless
Crossref API (`api.crossref.org/works?query.bibliographic=…`) works, no auth, poor precision but the
records are there. **IAEA remains not checked and was not touched.**

The find that matters, and it is unread: **Zhou & Walker (2016), *"API deprecation: a retrospective
analysis and detection method for code examples on the web"*, FSE'16, DOI
`10.1145/2950290.2950298`**, 68 citations. Substitute *assertions* for *code examples* and the title
is this repository's problem statement, both halves. ⛔ **The abstract could not be obtained** —
Crossref carries none and Semantic Scholar returns a publisher elision notice. Untaken routes:
Unpaywall (wants an email address, which a scout correctly declined to supply on our behalf) and
`dl.acm.org` (403 expected). **A human should read this before the instrument is finalised.**

Two more from the same pass: **API deprecation systematic mapping study**, DOI
`10.1109/seaa56994.2022.00076`, as the entry point; and one measured number — **67% of JavaScript
deprecation occurrences carry replacement messages** (DOI `10.5753/cbsoft_estendido.2020.14616`), so
roughly a third announce that a thing is going away without saying what replaces it.

**Tool-layer fact worth carrying to future sweeps:** `archive.org/wayback/available` is reachable and
keyless, but returned empty snapshots here — and **`web.archive.org` is blocked at the tool layer**
(*"Claude Code is unable to fetch from web.archive.org"*). Wayback is a lookup service for us, not a
retrieval one.

---

## 6. What this refutes, in the index's format

- **Refutes the CDCT frame** proposed at the start of this session — the vendor's own FAQ rules out
  public-API contract testing. **Every variant was chased and every one is excluded:** bi-directional
  CDCT swaps provider-CI for a provider-published spec we do not have and is PactFlow-proprietary;
  Spring Cloud Contract tests against a stub generated from our own contract and never touches the
  provider.
- **Refutes "make the agent cite its sources" as a sufficient control** — three measured leaks, with
  numbers, in §3.
- **Refutes "a mirrored vendor corpus is evidence"** — without a mandatory re-fetch it is a VCR
  cassette that passes forever (§2.4).
- **Refutes the reflex that this is one instrument** — three separable jobs, and merging them delivers
  none of them (§1).
- **Explains #124's own measurement rather than restating it**: nine locators in ~180 assertions is an
  unconnected support graph, which is the mechanism by which four errors propagated undetected (§4.1).
- **Names our overshoot**: culprit selection is under-determined (§4.1), and directional bias is a
  separate parameter from spread (§4.2).

## 7. What this does NOT establish

- **No number for how stale our corpus actually is.** Technical lag (DOI `10.1002/spe.2215`) defines
  the quantity; nobody has computed it here.
- **Doyle's TMS is cited from secondary sources** — the primary returned HTTP 405 (§4.1).
- **Zhou & Walker (2016) is UNREAD** — the closest paper found to this repository's exact problem, and
  only its title and DOI are held. This is the largest single gap in the sweep (§5).
- **The §3 table values need re-verification** before entering an ADR — see the banner at the top.
- **No claim that a calibration score can be computed for an LLM SME.** Cooke's model scores *experts
  against seed questions*; whether it survives the transfer to a stateless agent is untested and is a
  design question, not a finding.
