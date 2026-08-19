# Grounded-claim controls: what the literature measures about their failure

Sweep date: 2026-08-19. Instrument: WebFetch against the arXiv Atom API and
`arxiv.org/abs|html`. WebSearch not used (quota exhausted, per dispatch).
Every entry below carries an arXiv ID. Extraction notes are marked where a
number was read out of a table by the fetch summarizer rather than out of an
abstract; those need a human re-read before they enter a decision document.

## Finding, stated first

**The proposed control is necessary and not sufficient.** The literature
measures three separate leaks, and all three survive a "cite a URL + quote +
date" rule:

1. A citation can resolve and still not support its claim. Measured at
   **74.5% citation support** in the best-studied deployed systems (2304.09848).
2. When the retrieved context does not contain the answer, models answer
   anyway far more often than they abstain. Measured at a **24.67% rejection
   rate** — i.e. ~75% confabulation — in the cleanest experiment (2309.01431).
3. The verifier that would catch (1) is itself only ~**80% macro-F1**
   (2402.15089). A verify pass reduces the leak; it does not close it.

None of these are about the model lacking a URL. They are about the model
having a URL and the claim still being wrong. A control that checks *presence*
of a locator does not test *support* by the locator. That gap is the whole
finding.

---

## 1. Attribution / citation faithfulness — measured rates

**Liu, Zhang, Liang. "Evaluating Verifiability in Generative Search Engines."
arXiv 2304.09848 (Apr 2023, rev. Oct 2023).** Human evaluation of Bing Chat,
NeevaAI, perplexity.ai and YouChat. Abstract, quoted verbatim:

> only 51.5% of generated sentences are fully supported by citations
> and only 74.5% of citations support their associated sentence.

This is the single most load-bearing number in the sweep. These were
production systems that already fetched and cited. One citation in four did
not support the sentence it was attached to. The paper further notes the
systems' prose was fluent and appeared informative — i.e. the failure is not
visible to a reader who does not open the link.

**Gao, Yen, Yu, Chen. "Enabling Large Language Models to Generate Text with
Citations." arXiv 2305.14627 (May 2023, rev. Oct 2023).** Introduces **ALCE**,
the benchmark the dispatch named. Datasets ASQA, QAMPARI, ELI5. Metrics split
into fluency, correctness, and citation quality (citation precision / citation
recall). Abstract, quoted:

> on the ELI5 dataset, even the best models lack complete citation support
> 50% of the time

ELI5 is long-form open-ended QA — the closest ALCE dataset to "explain how
this API behaves." On the format closest to our use case, the best system
half the time fails to fully support its output.

Subsequent work reports gains but from low bases, which is itself evidence the
problem is unsolved:
- arXiv 2406.13124 (Jun 2024): "+34.1, +15.5 and +10.5 citation F1 points" over
  baselines — improvements of that magnitude are only available when baselines
  are poor.
- arXiv 2408.04568 (Aug 2024): "average of 14.21% improvement in citation
  quality across all datasets."
- arXiv 2509.00761 (L-MARS, legal domain, Aug 2025): "lifts strict citation F1
  from 0.13 (naive RAG) to 0.25." **Naive RAG scored 0.13 strict citation F1
  in a high-stakes domain.** The state of the art after a multi-agent audit
  pipeline was 0.25.

**Rashkin et al. "Measuring Attribution in Natural Language Generation Models."
arXiv 2112.12870 (Dec 2021, rev. Aug 2022).** The AIS framework the dispatch
named ("Attributable to Identified Sources"). It is a *definition and
annotation protocol*, not a rate: a claim is AIS iff a generic reader would
affirm "According to the source, X." Useful to us as the operational
definition of what our verifier would have to test. No headline percentage in
the abstract.

**Fabricated-reference rates** (adjacent, and relevant because our agent will
be asked about docs pages that may not exist):
- arXiv 2603.03299 (Feb 2026), cross-model audit of reference fabrication:
  "hallucination rates span a fivefold range (between 11.4% and 56.8%)."
- arXiv 2604.16407 (Mar 2026): "9.2% remained hallucinated" after checking.
- arXiv 2605.28003 (May 2026): newer model generations "produce 5.6x more
  references and 5.0x more fake references per trace." Volume of citation
  scales with volume of fabrication. Requiring more citations per answer is
  not automatically a net gain.

---

## 2. RAG failure modes

### 2a. Model ignores retrieved context, answers from priors

**Ming et al. "FaithEval." arXiv 2410.03727 (Sep 2024, rev. Apr 2025).**
*Extraction note: numbers below read from `arxiv.org/html/2410.03727v2` tables
by the fetch summarizer. Re-verify before quoting externally.*

Counterfactual-context subset — the context states something contrary to the
model's parametric knowledge, and the model is instructed to follow the context:

| Setting | GPT-4o accuracy |
|---|---|
| Closed book (no context) | 96.3% |
| Counterfactual context supplied | 47.5% |

A 48.8-point gap. Over half the time the model did not follow a context that
disagreed with what it already believed. The paper's stated conclusion:
"faithfulness remains a limitation for contextual LLMs," with model size giving
minimal advantage.

**Direct read-across for us:** the Notion API is exactly the domain where the
agent's priors are wrong and stale. A fetched page that contradicts the
model's 2024-vintage memory of the Notion API is precisely the counterfactual
condition FaithEval measures. This is the design's central risk, not a corner
case.

Supporting entries:
- arXiv 2404.00216, "Is Factuality Enhancement a Free Lunch For LLMs?"
  (Mar 2024): factuality-tuning makes models *more* confident in parametric
  knowledge; context-faithfulness drop "reaching a striking 69.7%." Tuning a
  model to be more factual can make it *less* willing to believe a fetched page.
- arXiv 2305.13300, "Adaptive Chameleon or Stubborn Sloth" (May 2023):
  characterises the confirmation-bias behaviour.
- arXiv 2510.19116 (Oct 2025), knowledge conflicts in code generation with
  deprecated APIs — the nearest published analogue to our exact problem
  (third-party API whose docs moved). Reports 80.65% conflict-detection
  accuracy and 12.6% steering improvement.

### 2b. Retrieval misses; model confabulates instead of abstaining

**Chen, Lin, Han, Sun. "Benchmarking Large Language Models in
Retrieval-Augmented Generation." arXiv 2309.01431 (Sep 2023, rev. Dec 2023).**
The RGB benchmark. *Extraction note: Table 1 and Table 3 values read from
ar5iv HTML by the fetch summarizer. Re-verify before external quotation.*

Negative rejection — every retrieved document is noise, the correct behaviour
is to say "I cannot answer." Rejection rate, English (exact match):

| Model | Rejection rate |
|---|---|
| Qwen-7B-Chat | 31.00% |
| ChatGPT | 24.67% |
| Vicuna-7B-v1.3 | 17.00% |
| ChatGLM2-6B | 10.33% |
| ChatGLM-6B | 9.00% |
| BELLE-7B-2M | 5.67% |

Chinese-language rejection rates were lower still (ChatGPT 5.33%).
**ChatGPT answered from thin air roughly three times out of four when handed
only irrelevant documents.** These are 2023 models; the number should be
re-measured on a current frontier model before it is used to size our risk.
I did not find a frontier-model re-run of RGB negative rejection in this sweep.

Noise robustness, same paper: ChatGPT English accuracy 96.33% at 0% noise
falls to 76.00% at 80% noise (-20.33 pp).

**Joren et al. "Sufficient Context: A New Lens on Retrieval Augmented
Generation Systems." arXiv 2411.06037 (Nov 2024, rev. Apr 2025).**
*Extraction note: per-model split read from `arxiv.org/html/2411.06037v2`.*
Behaviour when the retrieved context is insufficient to answer:

| Model | Hallucinates | Abstains |
|---|---|---|
| Gemini 1.5 Pro | 40.4% | 50.0% |
| Claude 3.5 Sonnet | 36.5% | 53.8% |
| Gemma 27B | 34.6% | 55.8% |
| GPT-4o | 15.4% | 61.5% |

Fraction of instances with insufficient context: FreshQA 22.6%,
Musique-Ans 55.4%, HotpotQA 56.0%.

Abstract, quoted: large models "excel at answering queries when the context is
sufficient, but often output incorrect answers instead of abstaining when the
context is not." Their selective-generation method improved correct-answer
fraction among answered queries by "2--10%" — a real but small gain.

**Read-across:** for a class of questions where retrieval genuinely misses (a
Notion behaviour that is simply undocumented — which is the exact case our
UNLOCATABLE output exists to name), a frontier model still fabricates roughly
15-40% of the time. That is the leak rate the design has to survive.

---

## 3. Abstention — direct answer

**PARTIAL, leaning NO. A structured UNLOCATABLE output is not a solved
problem.**

Evidence:

- **Wen et al. "Know Your Limits: A Survey of Abstention in Large Language
  Models." arXiv 2407.18418 (Jul 2024, rev. Feb 2025), TACL 2024.** The survey
  treats abstention as an active open area, not a solved capability. Named open
  challenges: whether abstention can work "as a meta-capability that transcends
  specific tasks or domains," and improving "abstention abilities in specific
  contexts." A 2025-revised survey does not frame a solved problem this way.
- The RGB negative-rejection numbers above (5.67%-31.00%) are a direct
  measurement of "can the model say I could not find this." In 2023, no.
- The Sufficient Context numbers are the same measurement on 2024 frontier
  models: 50.0%-61.5% abstention when it was the correct action. Better than
  RGB. Not reliable.
- **arXiv 2507.16199 (rev. Jun 2026), "LLM Abstention Can Be a Prompt Artifact,
  in Addition to Genuine Uncertainty."** Directly adverse to our design. It
  reports that prompting for abstention induces abstention that does not track
  actual uncertainty, with "serious accuracy drops on True/False Questions."
  **An UNLOCATABLE rate is therefore not self-validating.** A high UNLOCATABLE
  rate could mean the agent is honest, or that the instruction taught it to
  emit the token. The two are not distinguishable from the output alone.
- arXiv 2407.16221, "Do LLMs Know When to NOT Answer?" (Sep 2024): strict
  prompting and chain-of-thought "can enhance this capability" — the honest
  reading is that it moves a needle that is not at 100%.
- FaithEval unanswerable subset (2410.03727, extraction-note caveat above):
  GPT-4o 59.7% strict accuracy, Claude 3.5 Sonnet 62.1%, Phi-3-mini 6.3%.
  **The best model failed to say "unknown" about 40% of the time when the
  context lacked the answer.**

The consequence for the design: turning the agent's silence into a first-class
output is defensible, but the output cannot be trusted as a *measurement* of
absence. It is a hypothesis. If the design treats UNLOCATABLE as evidence that
something is undocumented, it will inherit a ~40% error rate in both
directions. UNLOCATABLE needs an independent test — a recorded, replayable
search transcript that a human or a second process can re-run — before it can
be read as a fact about the world rather than a fact about the model's mood.

---

## 4. Verification as a separate pass

Evidence says a separate pass is the standard answer, and that it is bounded
by the verifier's own accuracy.

**For a separate pass:**
- **Huang et al. "Large Language Models Cannot Self-Correct Reasoning Yet."
  arXiv 2310.01798 (Oct 2023, rev. Mar 2024).** Abstract, quoted: "LLMs
  struggle to self-correct their responses without external feedback, and at
  times, their performance even degrades after self-correction." This is the
  negative result that kills "just tell the model to check its own citations
  carefully." Intrinsic self-correction is not a control.
- Gao et al. **RARR**, arXiv 2210.08726 (2022, rev. May 2023) — "Researching
  and Revising What Language Models Say, Using Language Models." Establishes
  the retrofit-attribution pattern: generate, then a *separate* research-and-
  revise stage attributes and edits. No headline number in the abstract.
- Chain-of-Verification, arXiv 2309.11495 (Sep 2023): reduces hallucination
  across Wikidata list questions, MultiSpanQA and long-form generation. No
  percentages in the abstract.
- arXiv 2602.02018 (Feb 2026): learned factual self-verification "reduces
  factual hallucination rates by 9.7 to 53.3 percent, with only modest
  reductions in recall." Note the range: the benefit is task-dependent by a
  factor of five.

**Bounding the pass — the verifier is not clean:**
- **"AttributionBench: How Hard is Automatic Attribution Evaluation?"
  arXiv 2402.15089 (Feb 2024).** Abstract, quoted: "even a fine-tuned GPT-3.5
  only achieves around 80% macro-F1 under a binary classification
  formulation." The binary task is exactly ours: *does this source support
  this claim, yes or no.* ~80% macro-F1 on the easiest possible framing.
- Yue et al. "Automatic Evaluation of Attribution by Large Language Models,"
  arXiv 2305.06311 (May 2023, rev. Oct 2023) — the AttrScore work. Defines
  attribution error types and tests both prompted LLMs and fine-tuned small
  LMs; abstract reports "both promising signals and challenges" without a
  headline rate.
- **LLM-as-judge biases are documented and named**, so a verifier pass must be
  designed around them:
  - Position bias — arXiv 2406.07791 ("Judging the Judges", Jun 2024):
    position bias "varies significantly across judges and tasks."
  - Self-preference bias — arXiv 2410.21819 (Oct 2024): "LLMs assign
    significantly higher evaluations to outputs with lower perplexity," i.e.
    a judge favours text that looks like its own. **A verifier from the same
    model family as the author is a compromised control.**
  - arXiv 2410.02736 ("Justice or Prejudice?", Oct 2024): 12 catalogued biases.
  - arXiv 2506.22316 (Jun 2025): rubric-order bias, score-ID bias,
    reference-answer-score bias.
  - arXiv 2606.19544 ("Reliability without Validity", Jun 2026): "kappa
    deflation between exact match and Cohen's kappa is universal (33--41 pp on
    MT-Bench)" — raw agreement overstates judge reliability once chance
    agreement is removed. If we measure our verifier by raw agreement we will
    overstate it by tens of points.

Net: yes, run verification as a separate pass, and do not run it as the same
model checking itself. Expect the pass to be ~80% accurate on the
support-or-not question and design the residual into the process rather than
assuming it away.

---

## 5. Things we did not ask about that bear on the design

1. **Volume of citation correlates with volume of fabrication** (2605.28003).
   A rule that demands a locator per claim increases locator count. The
   fabrication rate per locator does not fall by itself.
2. **Factuality tuning trades against context faithfulness** (2404.00216,
   up to 69.7% degradation). A model tuned to "be accurate" is a model more
   attached to its priors — the opposite of what a docs-grounded agent needs.
3. **Deprecated-API knowledge conflict is a named published problem**
   (2510.19116). Our situation is an instance of a studied class, not a
   novel one.
4. **The strongest verifiable control is mechanical, not model-based.** Every
   number above degrades when a model judges support. None of them apply to
   a deterministic check: does the URL resolve (HTTP status), does the quoted
   string appear byte-for-byte in the fetched body, is the fetch date recorded.
   That check has no measured error rate in this literature because it is not
   an inference. It does not test *support*, but it does eliminate the
   fabricated-locator and misquoted-quote classes entirely, and those are
   sizeable (11.4-56.8% fabricated references, 2603.03299). This is the
   highest-leverage observation in the sweep.

---

## Coverage and gaps

Covered: items 1, 2, 3, 4, plus item 5. 21 WebFetch calls.

Blocked or missing, stated honestly:
- No fetch returned an HTTP error. Two PDF fetches
  (`arxiv.org/pdf/2309.01431v2`, `arxiv.org/pdf/2411.06037v2`) returned HTTP
  200 but the extractor could not read the compressed text layer; both were
  recovered from HTML/ar5iv instead.
- `all:"AttrScore"` returned `totalResults=0` from the arXiv API. The paper
  was found by its title instead (2305.06311).
- **No frontier-2026-model re-run of RGB negative rejection was found.** The
  24.67% figure is a 2023 ChatGPT measurement. Sufficient Context (2024) is
  the most recent comparable, at 50-62% abstention. Our risk sizing should use
  the 2024 numbers and treat the 2023 ones as a floor, not a forecast.
- ALCE per-system citation precision/recall tables were not opened; only the
  abstract's ELI5 headline is quoted here. If a precise precision/recall figure
  is needed for sizing, open `arxiv.org/html/2305.14627` Table 3-5 next.
- Scholar Gateway MCP was not used. arXiv coverage was sufficient and the
  Wiley corpus is a poor fit for this literature.

## Next action

Two, in order. First, open ALCE's results tables (2305.14627) to get a
per-system citation precision number, because that is the figure that sizes
the hole in a cite-everything rule. Second, decide whether the mechanical
check in §5.4 — resolve the URL, match the quote byte-for-byte, stamp the
date — is made a hard gate. The literature says the model-judgement layer will
sit near 80% no matter how it is prompted; the mechanical layer is the only
part of the control with no measured error rate.
