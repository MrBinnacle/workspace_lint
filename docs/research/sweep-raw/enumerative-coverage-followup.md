# Scout follow-up — enumerative coverage in research reporting

**VERBATIM, citations NOT yet verified.** Scout `scout-audit`, second pass, 2026-08-16. Dispatched to close a lead the scout itself flagged as unpursued: whether an enumerative coverage precedent exists in clinical-trial or assurance reporting, since audit opinions demonstrably lack one. Self-reported method: 3 searches, 3 fetches.

---

Lead run. 3 searches + 3 fetches. Answer to your question: **yes** — clinical-trial and systematic-review reporting has exactly that artifact, and it is a stronger model than anything in audit.

## Findings

**1 · CONSORT requires per-group accounting of every participant at every stage, with reasons for each dropout.**
CLAIM: Item 13a — "For each group, the numbers of participants who were randomly assigned, received intended treatment, and were analysed for the primary outcome." Item 13b — "For each group, losses and exclusions after randomisation, together with reasons." A flow diagram is required and "should account for participant numbers at each stage: randomization, allocation to groups, treatment received, and final analysis inclusion." Renumbered **item 22b** in the current CONSORT (2025).
SOURCE: *CONSORT 2010 Statement / CONSORT 2025* / CONSORT Group / 2010, 2025 / https://www.consort-spirit.org/item22b-lossesandexclusions (fetched); item 13a/13b wording via search of https://www.thelancet.com/cms/10.1016/S0140-6736(10)60456-4/attachment/dfbe2c7c-fb4f-49ac-a536-484a012311d7/mmc1.pdf
RELEVANCE: This is the coverage manifest. Declared roots enter at the top, each drop-out stage carries a reason, and the count that reached rule evaluation is stated per stage. It makes losses **reconcile** instead of merely listing them.
VERDICT: ADOPT

**2 · "Reason" means a specific cause, not a category label.**
CLAIM: "Simply stating 'protocol deviation' is insufficient. The exact nature and rationale for any post-randomization exclusions must be clearly documented." The requirement covers deviations, post-randomisation exclusions, discontinuations, and loss to follow-up — each by group, each with reasons.
SOURCE: as above (fetched).
RELEVANCE: Bans the manifest entry `skipped: error`. Each omission needs the specific cause — 403 on a named page, pagination cap hit at N, rate-limit at timestamp.
VERDICT: ADOPT

**3 · PRISMA carries the same structure and adds a named-exclusions duty.**
CLAIM: Item 16a — "Describe the results of the search and selection process, from the number of records identified in the search to the number of studies included in the review, ideally using a flow diagram." Item 16b — "Cite studies that might appear to meet the inclusion criteria, but which were excluded, and explain why they were excluded."
SOURCE: *PRISMA 2020 Checklist* / PRISMA Group / 2021 / https://static1.squarespace.com/static/65b880e13b6ca75573dfe217/t/67ad313f1c80aa5235fce0d0/1739403584136/PRISMA_2020_checklist.pdf (fetched, text-extracted locally)
RELEVANCE: 16b is the sharper rule. Near-misses must be named individually, not counted in aggregate. A resource that looked in-scope but was not scanned gets its own line with its own reason.
VERDICT: ADOPT

**4 · STROBE confirms the pattern generalises past randomised trials.**
CLAIM: Item 13 requires "(a) numbers of individuals at each stage of study — such as numbers potentially eligible, examined for eligibility, confirmed eligible, included in the study, completing follow-up, and analysed; (b) reasons for non-participation at each stage; (c) consider use of a flow diagram."
SOURCE: *STROBE Statement checklist v4* / STROBE Initiative / https://www.equator-network.org/wp-content/uploads/2013/09/STROBE-Checklist-v4-MS-Word.doc — search summary only, not fetched.
RELEVANCE: Three independent reporting standards converged on the same shape: staged funnel, per-stage counts, per-stage reasons. That convergence is the design signal, not any one standard.
VERDICT: ADOPT

**5 · ISAE 3000 has no enumerative scope artifact, but supplies one hard rule worth stealing.**
CLAIM: No enumerative scope statement found. What it does carry: if the engaging party imposes a scope limitation the practitioner believes "will result in the practitioner disclaiming a conclusion," the practitioner "shall not accept such an engagement as an assurance engagement, unless required by law or regulation."
SOURCE: *ISAE 3000 (Revised)* / IAASB / https://www.ifac.org/_flysystem/azure-private/publications/files/ISAE%203000%20Revised%20-%20for%20IAASB.pdf — search summary only, full text not fetched.
RELEVANCE: Negative on the manifest. But it argues for a **pre-flight refusal**: if declared roots are visibly inaccessible before the scan runs, refuse to produce a report rather than produce a disclaimed one.
VERDICT: ADAPT

## Softest claims

- **Finding 4 (STROBE) and Finding 5 (ISAE 3000).** Both rest on search summaries. I did not fetch either full source. STROBE's item-13 wording matched across two independent result sets, so I rate it likely accurate; the ISAE 3000 quote is single-sourced from a summary and should be re-verified against the IFAC PDF before it enters an ADR.
- **The reconciliation property is inferred, not quoted.** CONSORT's diagram plainly accounts for numbers stage by stage, but I found no clause explicitly requiring the arithmetic to balance. Do not cite CONSORT as mandating a reconciliation check. The staged-counts-plus-reasons requirement is what is actually documented; reconciliation is the natural consequence, and is our design choice to make.

Findings 1–3 are from fetched full sources. PRISMA extracted text at `C:\Users\mlpgr\AppData\Local\Temp\claude\C--Users-mlpgr-2026-Projects-workspace-lint\153cd804-8ce3-4b24-84e9-61726eee27dc\tool-results\prisma.txt`.
