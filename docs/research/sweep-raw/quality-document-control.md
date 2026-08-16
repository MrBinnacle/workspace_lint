# Scout report — quality management and controlled documents

**VERBATIM, citations NOT yet verified.** Scout `scout-quality`, 2026-08-16. Self-reported method: 8 searches, 7 fetches. Two full primary standards retrieved as PDF and text-extracted locally (ISO 19011:2018, ISA 705 Revised). ISO 9001 and ISO 13485 remain paywalled and are labelled as such by the scout.

---

Web tools loaded and used. 8 searches, 7 fetches. Two full primary standards retrieved as PDF and text-extracted locally (ISO 19011:2018, ISA 705 (Revised)). ISO 9001 and ISO 13485 remain paywalled and are labelled as such.

## Findings

**1. The coverage manifest already exists as a required audit-report element.**
CLAIM · The audit report should include "any areas within the audit scope not covered including any issues of availability of evidence, resources or confidentiality, with related justifications," and "a summary of the audit process, including any obstacles encountered that may decrease the reliability of the audit conclusions." · SOURCE (ISO 19011:2018, Guidelines for auditing management systems, ISO, 2018, clause 6.5.1 — full standard PDF fetched and text-extracted, https://www.synersia.org/wp-content/uploads/2021/02/ISO-19011-2018-Pedoman-Audit-Sistem-Manajemen-EN.pdf) · RELEVANCE · The coverage manifest is not an invention. It is a named report section with a fixed tripartite shape: area + reason + justification. · VERDICT ADOPT

**2. Sampling risk is a mandatory disclosure, not a caveat.**
CLAIM · The report shall include "k) audits by nature are a sampling exercise; as such there is a risk that the audit evidence examined is not representative." This sits in the mandatory list, above the optional list. · SOURCE (ISO 19011:2018, clause 6.5.1, same URL) · RELEVANCE · A scan over a declared resource set is a sample of the workspace. The tool must say so in every report, not only when coverage degraded. · VERDICT ADOPT

**3. "Audit scope" is defined and explicitly covers virtual locations and a time window.**
CLAIM · Audit scope = "extent and boundaries of an audit." Note 1: "generally includes a description of the physical and virtual-locations, functions, organizational units, activities and processes, as well as the time period covered." Note 2 defines a virtual location as an online environment. · SOURCE (ISO 19011:2018, clause 3.5, same URL) · RELEVANCE · The declared resource set is the audit scope. A scope statement is incomplete without a time period — the snapshot timestamp is a scope element, not metadata. · VERDICT ADOPT

**4. The four-valued partition does NOT exist in ISO audit vocabulary.**
CLAIM · "Audit findings can indicate conformity or nonconformity with audit criteria." Grading (quantitative 1–5, qualitative minor/major) applies to nonconformities only. No grade means "could not determine." "Observation" is not defined in the standard's terms clause at all — it is registrar practice. · SOURCE (ISO 19011:2018, clauses 3.10, 6.4.8, same URL) · RELEVANCE · Do not claim ISO backing for pass/violation/incomplete/inapplicable. ISO gives two values. · VERDICT NEGATIVE

**5. Financial audit has the partition, on two axes.**
CLAIM · ISA 705 splits on (a) nature — misstatement found vs. "unable to obtain sufficient appropriate audit evidence" — and (b) pervasiveness. Qualified = material but not pervasive, from either cause. Adverse = material and pervasive misstatement. Disclaimer = unable to obtain evidence where possible effects "could be both material and pervasive." · SOURCE (ISA 705 (Revised), Modifications to the Opinion in the Independent Auditor's Report, IAASB/IFAC, paras. 5(a), 7–10 — full PDF fetched and text-extracted, https://static1.squarespace.com/static/57019a6db6aa607cbb909ab2/t/58dc12e417bffcc09363819d/1490817767320/isa-705.pdf) · RELEVANCE · These are the settled semantics. "Incomplete" is not a fourth peer of pass/violation — it is a separate axis crossing them. A scan whose blind spot invalidates the run is a disclaimer, not a violation. · VERDICT ADAPT

**6. Obsolete documents must be prevented from use, not deleted.**
CLAIM · "all obsolete documents shall be promptly removed from all points of use or otherwise prevented from unintended use." · SOURCE (21 CFR 820.40(a), Document controls, FDA, 2023 CFR edition, https://www.govinfo.gov/content/pkg/CFR-2023-title21-vol8/xml/CFR-2023-title21-vol8-sec820-40.xml) · RELEVANCE · Direct answer to staleness. The control is point-of-use removal — an access-path property, exactly what a link-reachability rule tests. A superseded page no live link reaches is compliant; one still linked from a live index is a violation. · VERDICT ADOPT

**7. Retention and removal are both required; the interval is delegated.**
CLAIM · ISO 13485:2016 §4.2.4 requires the organization to define the period for which at least one copy of an obsolete document is retained. · SOURCE (ISO 13485:2016 — PAYWALLED, NOT FETCHED. Consultancy paraphrase only: https://advisera.com/13485academy/blog/2018/03/14/common-mistakes-with-iso-134852016-documentation-control-and-how-to-avoid-them/) UNVERIFIED as clause text. · RELEVANCE · The standard sets no interval; it requires the interval be declared. Same posture for the linter: the rule file declares the staleness threshold, the tool does not. · VERDICT ADAPT

**8. Missing evidence has a required mid-audit disposition.**
CLAIM · "If adequate documented information cannot be provided within the time frame given in the audit plan, the audit team leader should inform both the individual(s) managing the audit programme and the auditee… a decision should be made as to whether the audit should be continued or suspended." Also: "Only information that can be subject to some degree of verification should be accepted as audit evidence." · SOURCE (ISO 19011:2018, clauses 6.4.6, 6.4.7, same URL) · RELEVANCE · Inaccessible resources are not a silent skip. The disposition is escalate-then-decide-continue-or-suspend. A `--fail-on-incomplete` flag is the mechanical equivalent. · VERDICT ADAPT

## Softest claims

**Finding 7 (ISO 13485 §4.2.4)** — search summary and consultancy paraphrase only. ISO paywalls it. I fetched no clause text. Wording is approximate.

**Finding 6's currency** — I fetched real primary text, but the 2023 CFR edition. Part 820 was amended by the QMSR final rule effective 2026-02-02, incorporating ISO 13485:2016 by reference and stripping most standalone Part 820 text (FDA, https://www.fda.gov/medical-devices/postmarket-requirements-devices/quality-management-system-regulation-qmsr — search summary, page not fetched). The quoted 820.40 language may no longer be operative. The principle survives; the citation may be historical.

## What the dispatching session got wrong or missed

**The hypothesis misattributes the attribute list.** ISO 9001:2015 clause 7.5 does not enumerate required per-document attributes. It states control outcomes (availability where needed, protection from loss of integrity) and control activities (distribution, version identification, preventing obsolete use). No clause says "every document shall have an owner." The enumerated model comes from 21 CFR 820.40 and ISO 13485, not 9001. I did not fetch 9001 clause text — paywalled — so this rests on the consistency of multiple consultancy summaries, not on clause text.

**Approver is not owner.** 820.40(a) requires a designated individual to review and approve prior to issuance. That is a timestamped act, not a standing role. The "document has no owner" rule is closer to RACI than to document control. Nothing I found requires a persistent owner attribute.

**The brief pointed at the wrong shelf.** It listed five document-control regimes and one auditing question. The yield ran the other way: the two highest-value findings (1, 5) come from auditing standards — ISO 19011 and ISA 705 — neither of which was in the starting-point list. The coverage manifest and the four-valued outcome are audit-report problems, not document-control problems. Reweight future sweeps toward ISO 19011, ISA 705, and ISA 530 (audit sampling).

**"Observation" is a trap.** It has no ISO definition. Its meaning varies by registrar. Do not build a schema level on it.

**A conflation to resolve before the rule catalogue is fixed.** "Inapplicable" and "incomplete" are being treated as adjacent. In the standards they are different objects: inapplicable is scope exclusion, declared before the audit (ISO 19011 3.5); incomplete is evidence unavailability, discovered during it (6.5.1). One belongs in the scope statement, the other in the coverage manifest. It would appear as though the current design puts both in the same enum.

**Next action.** Rewrite the outcome model as two orthogonal fields — `conformity ∈ {conform, nonconform}` and `evidence ∈ {sufficient, insufficient}` — moving `inapplicable` out of the outcome enum into the scope declaration. Then check the report shape against the ISO 19011 6.5.1 required-content list as a checklist.

Extracted source text retained at: `C:\Users\mlpgr\AppData\Local\Temp\claude\C--Users-mlpgr-2026-Projects-workspace-lint\153cd804-8ce3-4b24-84e9-61726eee27dc\..\tool-results\iso19011.txt` (full ISO 19011:2018 plain text) and the ISA 705 PDF in the same tool-results directory.
