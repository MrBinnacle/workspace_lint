# Scout report — external financial audit

**VERBATIM, citations NOT yet verified.** Scout `scout-audit`, 2026-08-16. Delivered after one idle-without-transmit nudge. Self-reported method: web tools loaded, 4 searches and 4 fetches, ISA 705 (Revised) full PDF fetched and text-extracted locally with `pdftotext`; quotes stated to be verbatim from the standard rather than from summaries. Nothing below has passed the verification pass.

---

Web tools loaded. 4 searches + 4 fetches run. I fetched and text-extracted the ISA 705 (Revised) full PDF locally (pdftotext), so quotes below are verbatim from the standard, not from summaries.

## Findings

**1 · The standard requires a separately-headed section, placed directly after the verdict.**
CLAIM: "the auditor shall … Amend the heading 'Basis for Opinion' … to 'Basis for Qualified Opinion,' 'Basis for Adverse Opinion,' or 'Basis for Disclaimer of Opinion,' as appropriate; and … Within this section, include a description of the matter giving rise to the modification" (ISA 705 para. 20). ISA 700 (Revised) para. 28 requires that section "directly following the Opinion section."
SOURCE: *ISA 705 (Revised), Modifications to the Opinion in the Independent Auditor's Report* / IAASB / effective for periods ending on/after 2016-12-15 / https://static1.squarespace.com/static/57019a6db6aa607cbb909ab2/t/58dc12e417bffcc09363819d/1490817767320/isa-705.pdf ; ISA 700 para. 28 via search summary of https://www.irba.co.za/upload/ISA-700-Revised.pdf
RELEVANCE: The coverage manifest is not an appendix. It is a named section adjacent to the verdict, and its heading changes with severity.
VERDICT: ADOPT

**2 · Required content when evidence could not be obtained is the *reasons for the inability*.**
CLAIM: "If the modification results from an inability to obtain sufficient appropriate audit evidence, the auditor shall include in the Basis for Opinion section the reasons for that inability" (para. 24). Illustration 4 gives the form: item, magnitude ("over 90% of the Group's net assets"), cause ("We were not allowed access to the management and the auditors of XYZ Company"), consequence ("we were unable to determine whether any adjustments were necessary").
SOURCE: same PDF, Appendix Illustrations 3–5.
RELEVANCE: A manifest entry has four fields — resource, magnitude, cause of inaccessibility, consequence for the verdict. Copy this shape.
VERDICT: ADOPT

**3 · "Could not verify" vs "verified as wrong" is carried by required grammar, not a flag.**
CLAIM: Material misstatement → "except for the effects of the matter(s)". Inability to obtain evidence → "except for the **possible** effects of the matter(s)" (para. 17). Disclaimer: "the **possible** effects on the financial statements of undetected misstatements, **if any**" (paras. 9, 13).
SOURCE: same PDF.
RELEVANCE: This is the project's certainty axis, solved as a mandated phrase. `violation` = effects; `incomplete` = possible effects, if any.
VERDICT: ADOPT

**4 · Severity is graded on two axes; the escalation test is pervasiveness.**
CLAIM: Type depends on "(a) The nature of the matter … whether the financial statements are materially misstated or, in the case of an inability to obtain sufficient appropriate audit evidence, may be materially misstated; and (b) The auditor's judgment about the pervasiveness of the effects or possible effects" (para. 2). Material but not pervasive → qualified (para. 7(b)). Material **and** pervasive → disclaimer (para. 9). Para. 13(b) escalates when "a qualification of the opinion would be inadequate to communicate the gravity of the situation."
SOURCE: same PDF.
RELEVANCE: A flat `incomplete` is under-specified. Coverage gaps need at least two severity levels.
VERDICT: ADOPT

**5 · "Pervasive" has an operational three-branch definition.**
CLAIM: Pervasive effects are those that "(i) Are not confined to specific elements, accounts or items of the financial statements; (ii) If so confined, represent or could represent a substantial proportion of the financial statements; or (iii) In relation to disclosures, are fundamental to users' understanding of the financial statements" (para. 5(a)).
SOURCE: same PDF.
RELEVANCE: Directly transplantable. A gap is pervasive if it is not confined to named roots, or is confined but covers a substantial proportion of them, or hits a resource the rules structurally depend on.
VERDICT: ADOPT

**6 · A severe scope limitation degrades the whole report, not one line of it.**
CLAIM: On a disclaimer the report "shall not include the elements required by paragraphs 28(b) and 28(d) of ISA 700 (Revised)" — the assurance statements; the auditor must say it "was engaged to audit" rather than "audited" (para. 19(c)); and the report "shall not include a Key Audit Matters section" (para. 29). PCAOB AS 3105.45: "The auditor should not identify the procedures that were performed nor include the paragraph describing the characteristics of an audit."
SOURCE: same PDF; *AS 3105, Departures from Unqualified Opinions and Other Reporting Circumstances* / PCAOB / https://pcaobus.org/oversight/standards/auditing-standards/details/AS3105
RELEVANCE: Strongest finding. Both bodies deliberately strip the report of anything that would let a reader infer a real examination occurred. A scan missing a pervasive share of declared roots should not print per-rule passes at all.
VERDICT: ADOPT

**7 · A clean opinion over an incomplete examination is permitted. The gate is materiality, not completeness.**
CLAIM: Modification is required only when the auditor "is unable to obtain sufficient appropriate audit evidence to conclude that the financial statements **as a whole** are free from **material** misstatement" (para. 6(b)). Below that threshold the opinion is unmodified. Audits are never exhaustive.
SOURCE: same PDF.
RELEVANCE: Answers the project's question directly — yes, but only against a materiality threshold declared before the scan.
VERDICT: ADOPT

**8 · Both bodies forbid stating the verdict in terms of the limitation itself.**
CLAIM: AS 3105.09 forbids "In our opinion, except for the above-mentioned limitation on the scope of our audit …" because it bases the exception on the restriction rather than on potential effects. ISA 705 A20: "it would not be appropriate to use phrases such as 'with the foregoing explanation' or 'subject to' in the Opinion section as these are not sufficiently clear or forceful."
SOURCE: as above.
RELEVANCE: The verdict line must state effect on the rule, never "scan incomplete." "Scan incomplete" is the banned formulation.
VERDICT: ADAPT

## Softest claims

- **Finding 1's ISA 700 para. 28 citation.** Search summary only. I did not fetch ISA 700's full text. The ISA 705 half of that finding is from the fetched file.
- **Paragraph numbers 5(a), 6, 7, 9, 13, 19, 29.** The PDF's marginal paragraph numbers were lost in text extraction. Numbers 17, 20, 21, 23, 24, 27 and A20–A22 are confirmed by internal cross-references inside the fetched text; the rest I reconstructed from document order. Treat as UNVERIFIED-precise, verified-in-substance. All quoted wording is verbatim from the fetched full source.

## What the dispatching session got wrong or missed

**The framing is half wrong, and it is the more important half.** Financial audit did not solve the coverage manifest. It solved the `incomplete` outcome. An audit report **never enumerates what was examined**. AS 3105.45 actively forbids listing procedures performed on a disclaimer, and ISA 705's Basis section describes only the limitations bearing on the opinion. There is no audit artifact saying "here is everything I looked at." The manifest's first half has no precedent in this domain. Stop looking for one here.

**`incomplete` is not a peer of `pass` and `violation`.** ISA 705 models the outcome as a pair: what is wrong × how much of it is unverified. A flat four-value enum collapses that. Recommend `(verdict, evidence_sufficiency)` where verdict ∈ {holds, violated, unknown} and sufficiency carries a pervasiveness grade.

**Pervasiveness is a judgment; a tool cannot compute it.** Auditors set materiality *before* fieldwork (ISA 320 — UNVERIFIED, not fetched). The transplant is a declared threshold sitting in config beside the declared roots, not one derived at report time.

**Missed: denied access is a governance escalation, not a footnote.** ISA 705 paras. 11–13 require the auditor to demand removal of a management-imposed limitation, escalate to those charged with governance, and — if the effect is material and pervasive — **withdraw** where practicable rather than report. A Notion integration lacking page access is exactly this case. The product response is "grant the integration access and re-run," not a quiet manifest line.

**Missed: `inapplicable` has no audit analogue.** Nearest is ISA 706 Other Matter paragraphs (UNVERIFIED — not fetched).

**Lead not pursued:** the enumerative-coverage precedent probably lives in clinical-trial reporting (CONSORT participant flow diagram) or ISAE 3000 assurance, not in audit opinions. UNVERIFIED — no search run.

Local extracted full text of ISA 705 for follow-up: `C:\Users\mlpgr\AppData\Local\Temp\claude\C--Users-mlpgr-2026-Projects-workspace-lint\153cd804-8ce3-4b24-84e9-61726eee27dc\tool-results\isa705.txt` (also `isa705b.txt`, reflow without layout).
