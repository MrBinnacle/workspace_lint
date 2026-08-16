# Scout report — account reconciliation and ICFR

**VERBATIM, citations NOT yet verified.** Scout `scout-reconciliation`, 2026-08-16. Self-reported method: web tools loaded and used, 10 searches/fetches.

---

Web tools loaded and used (10 searches/fetches). Research was already complete; transmitting unchanged.

## Findings

**1 · The reconciliation artifact has a mandated field list, and "list of unreconciled items with explanatory notes and a documented action plan" is one required field, separate from "list of reconciling items."**
SOURCE · *Balance Sheet Account Reconciliation Procedure*, Macquarie University Policy Central, clause (10), 2021 (https://policies.mq.edu.au/document/view.php?id=225&version=1) — fetched full text.
Required fields: account number and name · accounting period · GL balance at close · supporting documentation substantiating the **entire** closing balance · list of Reconciling Items with support · list of Unreconciled Items with notes and action plan · preparer and approver names with dates.
RELEVANCE · Direct template for the coverage manifest. Note the two-list split: *explained* differences and *unexplained* differences are separate sections, not one list with a status column.
VERDICT · ADOPT

**2 · The dispatching session's hypothesis is confirmed but under-specified: the artifact also asserts that the closing balance is substantiated in full, not merely that the delta is zero.**
SOURCE · same, clause (10) ("supporting documentation…to substantiate the entire closing balance").
RELEVANCE · The analogue is not "rules that failed" but "every declared root was actually read." A scan asserting only rule outcomes is the weaker artifact. The manifest should assert substantiation of the whole scanned population.
VERDICT · ADOPT

**3 · Unreconciled items are aged, and the resolution deadline is inverse to magnitude, with a named escalation recipient at the top band.**
SOURCE · same, clauses (23)–(24). Tolerance: AUD 50,000 per reconciliation. Deadlines: $0–50k → 3 months; $51k–100k → 2 months; >$100k → 1 month; >$500k → 2 weeks **plus immediate notification by the Approver to the Director, Financial Control and Treasury**.
RELEVANCE · Maps to the project's baseline. Materiality sets the clock, not the calendar. A baselined violation should carry a severity-derived expiry, not an indefinite suppression.
VERDICT · ADAPT

**4 · Write-off authority is tiered by amount and escalates to a named officer; the writer-off is never the preparer.**
SOURCE · *Writing Off Uncollectable Receivables*, Cornell University Division of Financial Services, undated (https://finance.cornell.edu/accounting/topics/accountsreceivable/writeoffs) — fetched. Under $5,000 → operating unit's senior business officer; $5,000+ → university controller; student loan bad debt → University Treasurer, any amount.
RELEVANCE · Baseline acceptance needs a recorded authoriser, not a config-file entry. NEGATIVE sub-finding: the page does **not** state that written-off items remain visible after write-off. The "stays visible" half of the project's baseline concept is not evidenced here.
VERDICT · ADAPT

**5 · Completeness is a separate assertion from accuracy, and the certification names both — but the same person may not prepare and approve.**
SOURCE · *1101 PR.04 Balance Sheet Ledger Account Reconciliation & Certification*, Yale University, current (https://your.yale.edu/policies-procedures/procedures/1101-pr04-balance-sheet-ledger-account-reconciliation-certification) — fetched. Certification asserts "The reconciliation is complete; The balance is accurate and appropriate" and "The balance is supported by appropriate documentation." "The same individual must not prepare and approve a reconciliation."
RELEVANCE · Answers the brief's signature question directly: the signature attests to **completeness**, not merely to preparation. For an unattended CLI there is no second human, so the tool cannot honestly emit a completeness assertion — it can only emit the evidence a reviewer would need. The manifest is the preparer's package, not the approver's certificate.
VERDICT · ADOPT

**6 · Completeness is bounded to no unexplained differences, not to no open items.**
SOURCE · *Bank Reconciliations*, Office of the Washington State Auditor, BARS GAAP Manual, current (https://sao.wa.gov/bars-annual-filing/bars-gaap-manual/accounting/accounting-principles-and-internal-control/bank-reconciliations) — fetched. "After adjusting for reconciling items, there should be no further differences… If there are differences, research should be performed to determine the cause." Unknown deposits: "If unknown at the time of the reconciliation, they should be recorded to a suspense fund until they can be investigated and resolved."
RELEVANCE · This is the `incomplete` outcome, named. A known-timing item is not a failure; an unattributed difference is parked in a **suspense account** — a holding class that keeps the artifact balanced while the item stays visible and owned. The 404-means-both problem takes the suspense treatment: a distinct outcome class, not a pass and not a violation.
VERDICT · ADOPT

**7 · The report used to perform a control must itself carry evidence of completeness and accuracy: source system, report logic, and parameters.**
SOURCE · *IUC & IPE Audit Procedures for SOC Audits*, Linford & Co., undated (https://linfordco.com/blog/iuc-ipe-audit-procedures-for-soc-audits/) — fetched. Documented elements: source data and its origin; report logic ("the computer code, algorithms, or formulas for transforming, extracting, or loading relevant source data"); parameters. PCAOB position that auditors must "test the accuracy and completeness of the information" is SEARCH-SUMMARY ONLY — I did not fetch AS 2201 or Practice Alert 11. UNVERIFIED.
RELEVANCE · The coverage manifest is IPE. It must record which API endpoints were called, with what parameters, at what time, under which integration token — otherwise the report is inadmissible as evidence of anything.
VERDICT · ADOPT

**8 · Federal guidance sets a hard clearing deadline for differences (2 months) — NEGATIVE on primary verification.**
SOURCE · I TFM Part 2 Chapter 5100, Fund Balance with Treasury (https://tfm.fiscal.treasury.gov/v1/p2/c510.html). Both the TFM host and fiscal.treasury.gov failed to resolve/timed out. The 2-month figure comes from a search summary only. UNVERIFIED — do not cite it in an ADR without re-fetching.
VERDICT · NEGATIVE

## Softest claims

- **Finding 8.** Search summary only; two fetch attempts failed (DNS failure, then 60s timeout). Treat the 2-month clearing deadline as unconfirmed.
- **Finding 7's PCAOB layer.** I fetched a practitioner blog, not the standard. The IPE attribute list is well-attested across practitioner sources; the specific PCAOB requirement wording is not verified. PwC's IPE PDF and Schneider Downs' whitepaper both returned 403 / unparseable binary.

Also not verified: the Denver Reconciliation Certification Form's attestation wording (PDF returned binary; saved locally at `C:\Users\mlpgr\.claude\projects\C--Users-mlpgr-2026-Projects-workspace-lint\153cd804-8ce3-4b24-84e9-61726eee27dc\tool-results\webfetch-1786922856707-xh28u4.pdf` if someone wants to open it). GAO Green Book was not searched to conclusion — GAO-14-704G is superseded by GAO-25-107721 and I did not open either.

## What the dispatching session got wrong or missed

**Wrong: "one artifact" is right, but "two halves" is wrong — it is three.** The Macquarie field list separates *Reconciling Items* (differences with a known cause and support) from *Unreconciled Items* (differences with no cause yet). The project's proposed split is verdict-half plus blindness-half. The financial artifact splits the blindness half again: **explained gap** versus **unexplained gap**. A 429 rate-limit is an explained gap with an expected clearance. A 404 on a declared root is an unexplained gap. Collapsing them into one `incomplete` bucket loses the distinction the brief said matters most.

**Missed: the suspense account.** The brief asked how the artifact distinguishes a real difference from a timing artefact. The answer is not a flag on the item — it is a **separate holding location** that keeps the books balanced while the item stays open, owned, and aged. That is a structural answer, not a metadata answer. `incomplete` should be a first-class outcome with its own section in the report, not a status enum value sitting alongside pass and violation.

**Missed: substantiation of the whole balance, not just the delta.** Clause (10) requires documentation for the entire closing balance. The project's manifest as framed documents only what went wrong or went unseen. The stronger form documents what was seen, too — the positive evidence that root X was fetched at time T with parameters P. Without it the manifest cannot be audited, only trusted.

**Missed: the signature question has a specific answer that constrains the product.** The certification asserts completeness, and preparer ≠ approver is mandatory. `workspace_lint` runs unattended with no second party. It therefore cannot produce a certification; it produces the preparer's evidence package. That is a positioning fact worth stating in `CONTEXT.md` — the tool's output is an input to a human sign-off, never a substitute for one.

**Missed: aging is driven by materiality, not by age alone.** The brief asked whether reconciling items are aged. They are, but the deadline is a function of amount. The project has no natural "amount," so the analogue must be rule severity or blast radius. A baseline entry needs a severity-derived expiry; an indefinite suppression has no counterpart in the control literature.

**Wrong framing on the write-off threshold.** The brief treated the threshold as the interesting part. In the sources the threshold is trivial; the **named authoriser** is the control. Cornell escalates to the University Controller by name and role. A baseline file with no recorded approver reproduces the mechanism's form without its substance.

**Missed entirely: the manifest is itself IPE.** The coverage manifest is a report produced by the entity and used to reach a conclusion. Under SOX practice that report must carry its own completeness-and-accuracy evidence: source, query logic, and parameters. This is the strongest argument for recording API endpoint, request parameters, timestamp, and integration identity in the manifest — not for debuggability, but because a report without provenance is not evidence.
