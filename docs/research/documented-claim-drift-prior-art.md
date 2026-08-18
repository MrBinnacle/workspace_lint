# Prior art: detecting a documented claim that the system has falsified

**Question.** A document asserts a fact about a system. The system changes. Nothing detects that the
document is now false. What has been built for this problem, and in which domain is it most mature?

**Why asked.** S019, 2026-08-17. PR #56 put product source on `main` and five surfaces went on saying
the project was pre-build — `CLAUDE.md`, `CONTEXT.md`, `README.md`, `docs/agents/domain.md` and
`.claude/state/checkpoint.md`. Both passes that found them were people reading. Issue **#61**'s
Revisit-if says a third instance stops being a bad day and becomes a missing check. Run before any
instrument is built, per the standing §0.5 rule.

**Method and its limits.** Scholar Gateway (Wiley corpus), two queries, 2026-08-18. **`WebSearch` is
exhausted at 200/200** and was not available, so the non-Wiley literature was reached through the
**arXiv API directly** and the practitioner tools through their own documentation. Six sources that a
first pass recorded as "not checked" were subsequently fetched and are now first-hand, including the
nuclear regulatory text. What remains unreached is in §6 and is smaller than it was.

---

## 1. The software literature works on *recovering* links, because nobody declared them

Four of the five software hits are traceability-recovery work: given artefacts that were written
without explicit links, infer the links after the fact.

| Claim | Source |
| --- | --- |
| Outdated comments are a named, detectable defect class. Developers "sometimes neglect to update the corresponding comment when changing the code, resulting in outdated comments," which "may mislead subsequent developers." The proposed detector (CoCC) is **learning-based**, extracting features from code and comment before and after the change. | Huang, Chen, Chen & Zhou (2024), *J. Software: Evolution and Process* 37(1), [10.1002/smr.2718](https://doi.org/10.1002/smr.2718) |
| Traceability links between artefacts are **reconstructed** with information-retrieval methods, and the paper's motivation is "the limitations of both the humans developing artifacts and the IR techniques." | Capobianco, De Lucia, Oliveto, Panichella & Panichella (2012), *JSEP* 25(7):743–762, [10.1002/smr.1564](https://doi.org/10.1002/smr.1564) |
| Trace links between design-phase class diagrams and source code are typically **absent** and must be established automatically. | Chen, Zhang & Lian (2023), *Software: Practice and Experience* 54(2):281–307, [10.1002/spe.3270](https://doi.org/10.1002/spe.3270) |
| "Consistency between the designed architecture and the implemented software system itself is important" — architecture-recovery approaches exist because that consistency is not maintained by construction. | Qayum et al. (2024), *SPE* 55(1):100–132, [10.1002/spe.3364](https://doi.org/10.1002/spe.3364) |
| **Change impact analysis** is the formal name for "X changed, what else must change," and it is a traceability problem. | Lee, Deng, Lee & Lee (2010), *Int. J. Intelligent Systems* 25(8):878–908, [10.1002/int.20443](https://doi.org/10.1002/int.20443) |

**The finding that matters here is what the software field spends its effort on.** It builds
probabilistic recovery — IR, ML, feature extraction — because the link between a claim and the thing
that would falsify it was never written down. Every one of these techniques is imprecise by
construction, and they are imprecise because they are solving a harder problem than this repository
has.

### 1a. The non-Wiley literature, reached via the arXiv API

Queried 2026-08-18, `abs:"documentation drift" OR abs:"outdated comments" OR abs:"code-comment
inconsistency" OR abs:"stale documentation"`. **Total results: 11.** That number is itself a finding —
an earlier draft of this file speculated that the ACM/IEEE venues would hold a rich docs-as-tests
literature. On this query they do not. The corpus is small and it is almost entirely about **code
comments**, not about documents making claims about system state.

- **`ReCite`** — "We Must Have Missed This Comment: Detecting and Repairing Stale Function References
  in Linux Kernel Comments," Sun et al., [arXiv:2608.03734](https://arxiv.org/abs/2608.03734),
  2026-08-04. Finds comments that reference functions which **no longer exist**. This is the
  identifier class from §4, at kernel scale, and it is the closest published analogue to the
  repository's own failure.
- **Outdated comments correlate with bugs.** Radmanesh et al., "Investigating the Impact of Code
  Comment Inconsistency on Bug Introducing," [arXiv:2409.10781](https://arxiv.org/abs/2409.10781),
  2024-09-16.
- **Detect-and-repair, LLM-based.** `CCISolver`, Zhong et al.,
  [arXiv:2506.20558](https://arxiv.org/abs/2506.20558), 2025-06-25; `HatCUP`, Zhu et al.,
  [arXiv:2205.00600](https://arxiv.org/abs/2205.00600), 2022-05-02; Nguyen et al.,
  [arXiv:2512.19883](https://arxiv.org/abs/2512.19883), 2025-12-22.
- **Cross-check:** Huang et al., the Wiley hit above, is also [arXiv:2403.00251](https://arxiv.org/abs/2403.00251).
  Two independent retrieval paths returning the same paper is weak corroboration that the search was
  not badly scoped.

---

## 2. The high-reliability domains do not recover the link. They declare it.

This is the §0.5 payoff and it is a different discipline with a different name: **configuration
management**.

- **Aerospace / defence.** Rotorcraft configuration management "documents performance, functionality
  and physical attributes of a military helicopter," and "applies technical and administrative
  surveillance **against a certified design baseline** and controls change incorporation throughout
  the life cycle of the aircraft." Governed by **MIL-HDBK-61A** and **EIA Standard 649**.
  — Stanilka & Dagli, *INCOSE International Symposium* 13(1):419–435,
  [10.1002/j.2334-5837.2003.tb02629.x](https://doi.org/10.1002/j.2334-5837.2003.tb02629.x)

- **Aerospace, model-based.** "As with any digital artefact, if the models aren't configured and
  traceability isn't assured, then the models are not of much use."
  — D'Souza & Thota (2023), *INSIGHT* 26(1):60–66, [10.1002/inst.12430](https://doi.org/10.1002/inst.12430);
  same authors, *INCOSE IS* 32(1):648–664, [10.1002/iis2.12955](https://doi.org/10.1002/iis2.12955).
  A later CM strategy for aircraft product lines is written to **ISO/IEC 26580** — Epp, Robert, Ruch
  & Olechowski (2024), *INCOSE IS* 34(1):2287–2304, [10.1002/iis2.13270](https://doi.org/10.1002/iis2.13270)

- **Nuclear — and this one is now first-hand.** Finnish guide **YVL B.1, "Safety design of a nuclear
  power plant," issued 15.6.2019**, fetched from [stuklex.fi](https://www.stuklex.fi/en/ohje/YVLB-1)
  on 2026-08-18. Four requirements bear directly, and #359 is the whole design in one sentence:

  > **359.** The documentation concerning design and implementation shall be **consistent and
  > traceable to a frozen baseline of the plant design.**

  > **327.** The configuration system documentation shall be updated in connection with any
  > modifications made.

  > **305.** The licensee shall maintain detailed design documentation to be able to ensure the design
  > integrity and safety of the facility over its entire service life, including the planning of
  > modifications and component replacements. *[dated 2013-11-15]*

  > **355.** The documentation describing the nuclear facility, its systems and their design
  > requirements shall be clearly structured, comprehensive and **capable of accommodating any
  > updates** made during the course of design, implementation and operation.

  Documentation currency is a **regulated obligation**, not a tidiness preference — and the regulator
  specifies the mechanism, not just the outcome: a frozen baseline, plus traceability to it, plus an
  update obligation triggered by modification. *(Requirement #305 was previously carried here
  second-hand via Varkoi, Mäkinen, Cameron & Nevalainen (2019), *JSEP* 32(3),
  [10.1002/smr.2177](https://doi.org/10.1002/smr.2177). The primary source confirms that quotation
  verbatim. Varkoi et al. remains the source for the §3 cost figure.)*

- **Process safety.** Under OSHA PSM (29 CFR 1910.119(d)), a Canadian Chemical Producers Association
  analysis of 89 incidents found six PSM elements contributed to 85% of them, and **"Process
  knowledge and documentation"** is one of the six — alongside "Management of change."
  — Aziz, Shariff & Rusli (2013), *Process Safety Progress* 33(1):41–48, [10.1002/prs.11610](https://doi.org/10.1002/prs.11610).
  *Second-hand:* the 89-incident figure is reported by Aziz et al. citing the CCPA; the CCPA report
  itself was not fetched. Labelled accordingly.

**The structural difference.** These domains pay the cost **at write time** — a baseline is declared,
and every change is routed through control against it — rather than paying it at audit time by
inferring what related to what. That inverts the problem from *recover the traceability* to *check a
declared assertion*, which is cheap and exact instead of probabilistic.

---

## 3. The cost datum that should shape the instrument

Varkoi et al. report that in nuclear process assessment, **"compliance evaluation can be up to 25% of
the assessment effort and requires scrupulous manual work to complete"** — in a domain where it is
mandatory and funded.

Read straight: manual document-conformance checking is expensive **even where a regulator requires
it**. An instrument for this repository should therefore be narrow and mechanical, not a broad audit
that a session has to perform by hand. This is an argument against the reflex design, which is "have
an agent re-read the docs each session."

---

## 4. What this implies for the repository, stated as a finding rather than a decision

The five S019 instances are not one class. They separate by **what would falsify them**, and the
classes have very different costs:

| Class | Example from S019 | Falsifiable by |
| --- | --- | --- |
| **Path** | a file reference | Resolving it. Self-healing — following it eventually errors. Already covered by `deref_check.py`. |
| **Count** | "seven research sweeps" (twelve), "seven settled defaults" | Counting. Mechanical, exact, near-zero cost. |
| **Status** | "the project is pre-build", "gate 2 is open", "not on `main`" | Querying git or the tracker. Mechanical if — and only if — the claim declares what it depends on. |
| **Identifier** | a hook name, a constant | Grepping the naming file. Not covered by anything today. |

Only the path class self-heals. The other three are **quoted, never visited**, and each re-quotation
reads as corroboration — which is the mechanism `session-end-to-state` step 6.8 already names for its
own artefacts, and which this sweep finds is a general result rather than a local one.

**So the candidate design is a declared-baseline check, not a drift detector.** A claim that wants
checking carries a machine-readable assertion of what would falsify it; a script evaluates the
assertions and fails when one is false. That is the configuration-management shape from §2, applied
at the only scale this repository needs. It is also the shape `CHECK-suite-registration.ts` already
uses for the `check` script, which is evidence the pattern fits this codebase.

**What it is not:** an agent re-reading documents, and a natural-language contradiction detector.
The first is the 25% cost from §3. The second is the probabilistic recovery from §1, adopted for a
problem where the exact version is available.

---

## 5. The practitioner tools, verified — and two of them are the answer

Checked 2026-08-18 against each tool's own documentation. This was #62's gating step and it changed
the shape of the recommendation again.

**Terraform is the closest working precedent, and it already does exactly this.**
`terraform plan -refresh-only` "creates a plan whose goal is only to update the Terraform state and
any root module output values to match changes made to remote objects **outside of Terraform**," and
`-detailed-exitcode` gives **0 = empty diff, 1 = error, 2 = non-empty diff**
([HashiCorp docs](https://developer.hashicorp.com/terraform/cli/commands/plan), fetched 2026-08-18).
Declared state versus observed state, difference signalled by an exit code, designed for CI. That is
the §4 design, in production, at scale — and it scores on the exit code, which is the discipline this
repository already applies to its mutation checks.

**`cog --check` is the answer for the count class, and it is better than checking.**
Cog "lets you use small bits of Python code in otherwise static files to generate whatever text you
need," and `--check` means **"Check that the files would not change if run again"**
([cog docs](https://cog.readthedocs.io/en/latest/running.html), fetched 2026-08-18). So a count like
"twelve research sweeps" is not verified — it is **generated**, and the check fails when the file is
stale. A claim that is generated from its source cannot drift from it. *(The docs page does not state
`--check`'s exit code; confirm before relying on it in a gate.)*

**Two tools are the right pattern aimed at the wrong subject.**
- `doctest` "searches for pieces of text that look like interactive Python sessions, and then executes
  those sessions to verify that they work exactly as shown" — and the documentation is explicit that
  prose is out of scope: all narrative text in docstrings "is completely ignored during testing"
  ([Python docs](https://docs.python.org/3/library/doctest.html), fetched 2026-08-18). Executable
  claims only.
- ArchUnit is "a free, simple and extensible library for checking the architecture of your Java code
  using any plain Java unit test framework" ([archunit.org](https://www.archunit.org/), fetched
  2026-08-18). Structural claims asserted as ordinary tests that fail on violation — the declared-
  assertion pattern exactly, scoped to Java bytecode rather than to documents.

**Consequence for #62.** The build is smaller than it looked. Count claims should be **generated**
(cog's strategy), not checked. Status claims should be **checked against a source of truth with an
exit code** (Terraform's strategy). Neither needs a natural-language contradiction detector, and
neither needs an agent to re-read anything.

## 6. Not checked

Six items a first pass listed here were fetched instead and moved into the body. **An exhausted
`WebSearch` is not an unreachable web** — arXiv publishes an API, regulators publish their own
guides, and tools document themselves. What is left is genuinely blocked, and each entry names how.

- **MIL-HDBK-61A.** Named by Stanilka & Dagli as the governing DoD guidance. One fetch to a mirror
  returned **HTTP 404**. Title and role are second-hand; no text is quoted.
- **EIA Standard 649.** Named by the same source. A paid SAE standard with no public text. Not
  reachable by any route available here.
- **ISO/IEC 26580.** Named by Epp et al. The ISO Online Browsing Platform returned **HTTP 403**, so
  even the free scope statement was not obtained.
- **IAEA configuration-management guidance.** One fetch returned **HTTP 402**.
- **US 10 CFR 50.71(e)**, the FSAR update obligation — the nearest US regulatory analogue to YVL B.1.
  Two attempts: eCFR **302-redirects to a bot-block page**, and nrc.gov returned **HTTP 403**. Named
  from prior knowledge and therefore **not cited anywhere in this file**. The Finnish guide is
  first-hand and carries the regulatory claim on its own.
- **AWS Config.** Not attempted. Terraform already establishes the drift-detection precedent
  first-hand, so the marginal value was low; recorded so the omission is a choice and not an oversight.
- **`cog --check`'s exit code.** The options page states what `--check` does but not what it returns.
  Confirm before putting it in a gate.
- **rustdoc doctests.** Not attempted; `doctest` establishes the executable-example class already.

**On the size of the arXiv result.** Eleven results is a real number from one query, not a survey.
A different phrasing — "specification conformance", "living documentation", "executable
specification" — would return a different set. Treat §1a as evidence that the *code-comment* framing
is well worked and the *document-asserts-system-state* framing is not, rather than as a census.
