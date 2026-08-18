# Prior art: detecting a documented claim that the system has falsified

**Question.** A document asserts a fact about a system. The system changes. Nothing detects that the
document is now false. What has been built for this problem, and in which domain is it most mature?

**Why asked.** S019, 2026-08-17. PR #56 put product source on `main` and five surfaces went on saying
the project was pre-build — `CLAUDE.md`, `CONTEXT.md`, `README.md`, `docs/agents/domain.md` and
`.claude/state/checkpoint.md`. Both passes that found them were people reading. Issue **#61**'s
Revisit-if says a third instance stops being a bad day and becomes a missing check. Run before any
instrument is built, per the standing §0.5 rule.

**Method and its limits.** Scholar Gateway (Wiley corpus), two queries, 2026-08-18. **`WebSearch` is
exhausted at 200/200** and was not available. One `WebFetch` to IAEA was attempted and returned
**HTTP 402**. See "Not checked" — the gaps are large and are recorded, not glossed.

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

- **Nuclear.** The Finnish regulator's **YVL B.1 requirement #305**, quoted in the literature: *"The
  licensee shall maintain detailed design documentation to be able to ensure the design integrity and
  safety of the facility over its entire service life, including the planning of modifications and
  component replacements."* Documentation currency is a **regulated obligation**, not a tidiness
  preference.
  — Varkoi, Mäkinen, Cameron & Nevalainen (2019), *JSEP* 32(3), [10.1002/smr.2177](https://doi.org/10.1002/smr.2177)

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

## 5. Not checked

- **ACM, IEEE, VLDB and USENIX.** Out of reach: the Scholar Gateway corpus is Wiley, and `WebSearch`
  is exhausted at 200/200. The software-engineering venues where documentation-drift and
  docs-as-tests work most likely sits are therefore **not checked, not absent**.
- **IAEA configuration-management guidance.** One `WebFetch` attempted 2026-08-18; the server
  returned **HTTP 402**. No locator obtained, so no claim is made about its content.
- **MIL-HDBK-61A, EIA-649, ISO/IEC 26580, YVL B.1 as primary sources.** Each is named by a
  secondary source above and none was fetched. The YVL #305 wording is quoted **via Varkoi et al.**
  and is labelled so wherever it is reused.
- **US NRC design-basis reconstitution.** The obvious nearest regulatory analogue in the domain and
  it was not reached at all — no search path available this session.
- **Existing tooling.** `doctest`, rustdoc doctests, `cog`, ArchUnit, Terraform drift detection and
  AWS Config are all plausible practitioner prior art. **None was verified this session**, because
  verifying a tool's behaviour needs its own documentation fetched, and the budget went to the
  literature. Do this before writing any code.
