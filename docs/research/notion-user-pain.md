# Notion User Pain — Structural Defects in Real Workspaces

- **Date:** 2026-08-16
- **Role:** user-pain SME (one of four parallel research agents; siblings covered API documentation, API practitioner behavior, and live probing)
- **Status:** This document is research evidence. It is not a canonical product decision. It does not override `CONTEXT.md` or any ADR in `docs/adr/`.

---

## METHOD AND ITS LIMIT — read this before the findings

**r/Notion and r/Notionism were not reachable.** `reddit.com` is blocked to this user agent at the search layer (`API Error: 400 ... domains are not accessible to our user agent`) and `old.reddit.com` is blocked at the fetch layer. Every attempt returned an error, not thin results. G2 and Capterra returned HTTP 403 on direct fetch; only search-engine paraphrase is available from them, and that paraphrase is never used below as quote evidence.

Consequence: the largest and most representative pool of solo and hobbyist Notion complaint voice is missing from this report. The evidence base skews toward people who publish — engineering leaders, consultants, automation builders, and SEO bloggers. That skew biases the report **toward** the paying and configuring segments and **against** the solo user. Read the segment section with that in mind.

A follow-up sweep with a Reddit-capable fetch path is the single highest-value next research action.

**Trust tiers used below.**

- **T1** — a named person describing their own workspace with specifics, or the vendor describing its own product.
- **T2** — practitioner content with concrete verifiable detail.
- **T3** — SEO or marketing blog with no named author and no verifiable incident. Several results encountered match the pattern of AI-generated commercial content: `heybeagle.com`, `resumelens.org`, `talantir.ai`, `novumos.app`, `stackscout.net`. T3 is cited only for framing, never as pain-frequency evidence, and is labelled at each use.

---

## 1. PAIN CATALOGUE, RANKED BY VOICE FREQUENCY

### P1 — Stale pages that still look authoritative

Recurs in every source category. Highest-frequency pain found.

> "old pages that were 'obviously wrong'"
> — Will Larson, [Refactoring internal documentation in Notion](https://lethain.com/refactoring-internal-docs-notion/), 2026-02-05 (T1). He archived **approximately 1,500 expired pages** in **eight hours**.

> "the same process was documented in three different places, all with slightly different information, all out of date"
> — Kay Foxley, [Why Notion Fails on Most B2B Teams](https://oh-kayyyy.medium.com/why-notion-fails-on-most-b2b-teams-8dbe3d00fed7), 2026-05-03 (T2).

> "Ever wonder if that company policy you found is the latest one? Or if you're looking at an old design doc? ... confusion, extra meetings and slower decisions."
> — Notion, [Verify knowledge your teammates can trust with page verification](https://www.notion.com/help/guides/verify-knowledge-your-teammates-can-trust-with-page-verification) (T1 — the vendor shipped a feature specifically for this pain).

**Frequency: very high.** Notion built a product feature for it. Larson wrote a script for it.

### P2 — Duplicate pages, each claiming to be canonical

> Duplication made it "safer to create an `N+1`th version, rather than debugging why `N` versions already existed."
> — Larson, 2026-02-05 (T1).

> "three team members created separate pages because they couldn't locate content in existing structure"
> — Foxley, 2026-05-03, describing a 14-person team (T2).

NoteRunway ships a "Duplicate Detection" tool producing "Semantic duplicate groups with similarity scores" — [NoteRunway: Because Your Notion Workspace Deserves an Elite Crew](https://dev.to/georgekobaidze/noterunway-because-your-notion-workspace-deserves-an-elite-crew-53bk), DEV Community, 2026-03-29 (T2).

**Frequency: high.**

### P3 — Schema drift breaking automations silently

The most expensive pain found, and the only one with named-victim damage accounts.

> "When n8n writes to a Notion database, it references properties by their display name, not by some internal identifier ... It keeps looking for 'Status,' doesn't find it, and either writes nothing or throws a validation error that gets swallowed. **The execution log still shows green. That's the part that makes it hard to catch.**"
> — Abhiman Sundararajan, [Notion Database Mistakes Breaking Automations](https://abhiman.io/blog/notion-database-mistakes/), 2026-06-07, updated 2026-06-16 (T2).

> "Every new client record created from that point has a broken or missing relation. The automation runs fine. No errors. But the data structure is silently wrong."
> — Sundararajan, same source.

> "Formulas are read-only from the API. n8n can read a formula value, but it cannot write to one." ... "The write will silently do nothing."
> — Sundararajan, same source.

**Frequency: high among the automation and developer segment. Near-zero among solo users.**

### P4 — Free-text where a controlled vocabulary was needed

> "Text fields don't have defined options. One person types 'Qualified,' another types 'qualified,' another types 'QUALIFIED' ... Your filter is missing records it should be catching."
> — Sundararajan, 2026-06-07 (T2).

**Frequency: medium-high.**

### P5 — Empty required property values / rows missing data

> Users "leave relation fields empty, which defeats the purpose."
> — R.H. Rizvi, [The Notion Relations Trap: Why Connecting Everything Makes Nothing Usable](https://medium.com/@R.H_Rizvi/the-notion-relations-trap-why-connecting-everything-makes-nothing-usable-6d3dfdf416e7), 2026-02-20 (T2).

Notion Mastery's published audit checks include "Missing dates on entries," "Empty name fields," and "Proper status field completion" — Ben Borowski, [Naming and Nomenclature in Notion](https://notionmastery.com/naming-and-nomenclature-in-notion/), 2024-02-06 (T2).

**Frequency: medium-high.**

### P6 — Broken @-mentions and links to trashed pages

Larson "Built 404 link finder to prevent orphaned references" (2026-02-05, T1). NoteRunway ships a "Dead Link Detector — Finds broken @mentions pointing to deleted pages" (2026-03-29, T2).

**Frequency: medium.** Two independent parties built the same instrument, which is a real signal. Note the qualification: both *built* the check rather than *complaining about* the defect. This is a builder's pain, not a broadly voiced one.

### P7 — Orphan pages reachable only by search

NoteRunway ships a "Garbage Collector — Identifies orphaned pages, empty pages, and stale content (90+ days untouched)" and a "Dependency Graph — Interactive visualization of workspace structure showing orphaned pages" (2026-03-29, T2). Larson "Scripted pruning of pages unchanged for >N days" (T1).

**Frequency: medium.**

### P8 — Inconsistent naming across databases and properties

> "Difficult search outcomes with similarly named databases"; "Challenging relations creation with hundreds of identically named databases"
> — Borowski, 2024-02-06 (T2). He recommends verifying "Invalid naming format" via regex formulas.

**Frequency: medium, concentrated in consultants.**

### P9 — "It's cluttered / I can't find anything"

Highest raw volume, lowest specificity.

> "Search becomes something different ... You might find nothing because the page you're looking for is nested four levels deep"
> — Foxley, 2026-05-03 (T2).

Capterra reviews (search-engine paraphrase only; direct fetch returned HTTP 403) report that Notion "can become disorganized if you create too many pages and systems without structure" — [Capterra Notion Reviews](https://www.capterra.com/p/186596/Notion/reviews/).

**Frequency: highest raw volume of all pains. Also the least actionable.**

### P10 — Relation and rollup values silently truncated at 25 items via the API

> "for relations / rollups / people / rich_text properties with more than 25 items, the truncated response is silently incomplete"
> — [4ier/notion-cli issue #38, "page property: fix silent truncation of relation / rollup values (>25 items)"](https://github.com/4ier/notion-cli/issues/38) (T2).

**Frequency: low but sharp.** This is a defect in the *reading tool's* own path, not in user workspaces. Flagged for the engineering agents: a scanner will under-report unless it handles this.

---

## 2. TESTABLE / UNTESTABLE SPLIT

Applied to every catalogued pain without exception.

| # | Pain | Verdict | Basis |
|---|---|---|---|
| P1 | Stale authoritative pages | **PARTLY TESTABLE** | `last_edited_time` age is structural and readable. "Is the content actually wrong?" is not. The tool can flag age; it cannot flag wrongness. Do not market this as detecting staleness. |
| P2 | Duplicate pages claiming canonical | **UNTESTABLE as voiced** | The voiced pain is semantic near-duplication. NoteRunway needs AI similarity scoring to address it. A *declared canonical key* — exact title collision within a database, or a user-declared unique property — is TESTABLE, but that is a narrower problem than the one people complain about. |
| P3 | Schema drift breaking automations | **TESTABLE** | Compare live schema against a declared expected schema. Pure structure. Strongest fit in the catalogue. |
| P4 | Free-text where controlled vocabulary needed | **TESTABLE** | Property type is structural. Value-set membership is checkable against a declared allowed list. |
| P5 | Missing required property values | **TESTABLE** | Null check against a declared required-property list. Trivially structural. |
| P6 | Broken links to trashed pages | **TESTABLE** | Reference resolution. Zero semantics involved. |
| P7 | Orphan pages | **TESTABLE** | Inbound-reference count equals zero. A structural graph property. |
| P8 | Inconsistent naming / schema mismatch between twin databases | **TESTABLE** | Regex on names; set-difference on two databases' property schemas. Borowski already does this with Notion formulas. |
| P9 | "Cluttered, can't find anything" | **UNTESTABLE** | Requires judging quality, taste, and intent. Explicitly out of reach. |
| P10 | 25-item silent truncation | **TESTABLE**, but it is a tool-correctness constraint, not a user-facing rule. |

**Count: six clean TESTABLE (P3, P4, P5, P6, P7, P8), one partly testable (P1), two UNTESTABLE (P2 as voiced, P9).**

### The finding that matters

The pains rank in almost exactly inverse order to their testability. The two loudest pains — P1 staleness and P9 clutter — are the two the tool cannot honestly claim to solve. The most testable pain — P3 schema drift — is voiced by the smallest population. This is the product's central tension. It is not a framing problem that better copy can fix; it is structural.

---

## 3. SEGMENTS AND WILLINGNESS-TO-CONFIGURE EVIDENCE

Willingness to configure is the make-or-break variable. Evidence only; no speculation.

### Solo / personal user

**Pains voiced:** P9 (dominant), P1, P2.

**Willingness to configure: NO EVIDENCE FOUND.** The Reddit blackout means this is a genuine gap in the sweep, not a demonstrated negative.

What was found cuts against the segment. The paid-template market shows solo users paying **$5–$49** to *avoid* building structure themselves ([Payhip, 2026](https://payhip.com/blog/how-to-sell-notion-templates/); [BizToolkit, 2026](https://www.biztoolkit.co/post/how-much-do-notion-template-creators-make-in-2026)). Rizvi (2026-02-20) documents solo users **abandoning** a relational structure because the cognitive cost of filling it in was too high. A person who will not fill in a relation field will not write a config file.

### Small-team operator (under roughly 15 people)

**Pains voiced:** P2, P1, P5.

**Willingness to configure: WEAK EVIDENCE.** Foxley (2026-05-03) names the blocker directly: maintenance is "unpaid labour that nobody budgets for," and the workspace decays "within weeks" once the original architect becomes unavailable. The person who would write the config is the same overloaded champion who is already the bottleneck.

### Ops or knowledge lead at a company of 50+

**Pains voiced:** P1, P2, P7, P6.

**Willingness to configure: STRONG EVIDENCE, single source.** Larson (2026-02-05) did not merely tolerate configuration. He wrote scripts, built a 404 link finder, and defined a threshold parameter — "pages unchanged for >N days." That is a config file in all but name. Cost: eight hours, with "zero impact on others' time."

Weakness: **n = 1**, and that one person is a CTO who writes code. Whether a non-coding ops lead behaves the same is unevidenced.

### Notion consultant auditing CLIENT workspaces

**Pains voiced:** P8, P5, P2, P1, P3.

**Willingness to configure: STRONG EVIDENCE, multiple sources.**

- Borowski (2024-02-06) already hand-authors declarative structural rules as Notion regex formulas, and publishes them. A config file is a strict improvement on the tooling he chose voluntarily.
- Consultants bill **$100–200/hour**; the freelance average is **$90–95/hour**; fixed builds run **$1,000–$5,000**, **$5,000–$15,000**, and **$15,000–$25,000+** by tier; retainers start around 10 hours per month ([Notionalize, Notion Consultant Cost](https://notionalize.com/blog/notion-consultant-cost)).
- Fixed-scope, read-only structural audit is already a sold deliverable. [Notion Rescue](https://rescue.notionproviders.com) performs "a full audit, mapping workflows, identifying pain points, and documenting every structural gap without making any changes."
- A reusable rule config is directly billable leverage: write once, run across every client.

### Developer using Notion as a data backend

**Pains voiced:** P3, P4, P10.

**Willingness to configure: STRONG EVIDENCE.** These people already write config. `notion-cli-agent` "can discover your databases and save them to a configuration file, with subsequent tasks using the mapped IDs automatically" ([GitHub](https://github.com/Balneario-de-Cofrentes/notion-cli-agent)). A `DatabaseValidator` exists to "validate data against Notion database schemas before insertion." They write code against the API by definition. A config file is not a cost to them.

---

## 4. COST EVIDENCE

Concrete damage accounts are **rare and hard to find**. Exactly **one** thread was located with named parties, dates, and quantified business loss — and it concerns the API breaking, not workspace structure.

[Zapier Community, "Notion integration update"](https://community.zapier.com/troubleshooting-99/notion-integration-update-51509):

> "All of our Notion integrations started erroring today. I looks like the Zapier integration now only points to the unstructured part a Notion page, not finding the structured fields."
> — CarbonNick, 2025-09-23

> "all of my work has been put on pause, and all of my clients' work has been put on pause"
> — alvinliang, 2025-09-30, running a Notion consulting firm; also stated they were "paying for a tool we literally can't use until the engineering team rolls out a fix"

> "28 zaps affected by this bug, all of which have been down for about a week and half now"
> — AnthonyOrtega, 2025-10-02, describing "mission critical processes"

> Same situation, affecting "hundreds of our customers in our main database."
> — Remy F, 2025-10-03

**Second-strongest, and the only structural-defect cost account:** Larson's ~1,500 expired pages and eight hours of remediation, plus his statement that stale docs created "a bad smell" undermining confidence in all documentation, and that FAQ pages became "actively harmful" once Notion AI began surfacing them.

**Third:** Foxley's 14-person team whose meeting-notes database "had entries from only one person after six weeks."

### The finding

Nobody published an account of acting on a stale Notion page and losing money. Multiple people published accounts of a **broken API integration** losing them money, with dollar-adjacent specifics and visible panic.

Scarcity is itself the result. **Structural rot in Notion is a chronic irritation, not an acute incident.** People do not write incident reports about it. They write incident reports about integrations going down. Chronic irritations get cleaned up occasionally by whoever has a free afternoon. They do not get budget, and they rarely get a config file.

---

## 5. EXISTING REMEDIES AND WHAT PEOPLE PAY FOR

### Verbatim practitioner check items — the closest existing rule catalogue

**From Ben Borowski, [Naming and Nomenclature in Notion](https://notionmastery.com/naming-and-nomenclature-in-notion/), Notion Mastery, 2024-02-06.**

Audit checks (verbatim):

- "Missing dates on entries"
- "Empty name fields"
- "Invalid naming format" — verified via regex formulas
- "Proper status field completion"

Conventions enforced (verbatim where quoted):

- "Database names should generally be pluralized; `Things`, not `Thing`"
- Use prefixes or suffixes such as `DB` or company codes, e.g. `OK Tasks`
- "Use a prefix/suffix strategy for database templates" — prefix with `→` or `[TEMPLATE]` for easy recognition
- Booleans: name as questions, e.g. `Has Tasks?`
- Dates: use prepositions indicating purpose, e.g. `Due by`, `Created at`
- Rollups: reference the related database name, e.g. `Tasks / Count`
- Statuses: consider workflow tenses and actionability
- Database views: name views after applied filters, e.g. "Active Projects"
- Standardize capitalization and formatting across the workspace

**From [NoteRunway](https://dev.to/georgekobaidze/noterunway-because-your-notion-workspace-deserves-an-elite-crew-53bk), DEV Community, 2026-03-29** — shipping detections (verbatim):

- "Workspace Health Dashboard" — "Metrics on total pages, empty pages, recently edited content, and link density"
- "Duplicate Detection" — "Semantic duplicate groups with similarity scores"
- "Garbage Collector" — "Identifies orphaned pages, empty pages, and stale content (90+ days untouched)"
- "Dead Link Detector" — "Finds broken @mentions pointing to deleted pages"
- "Sensitive Data Finder" — "regex patterns (API keys, PEM keys, JWTs, database URLs, passwords, credit cards)" plus optional AI deep scan
- "Dependency Graph" — "Interactive visualization of workspace structure showing orphaned pages"
- "Semantic Ask" — natural language interface for archive, create, rename, append, update

Configurable: the stale-page detection timeframe (90+ days is the stated default).

**From [Notion Rescue](https://rescue.notionproviders.com)** (verbatim, via search-engine extract; direct fetch returned HTTP 403):

- "a full audit, mapping workflows, identifying pain points, and documenting every structural gap without making any changes"
- "a fixed-scope, 4-week Notion workspace cleanup, reorganization, and optimization service"

**From Sundararajan, [Notion Database Mistakes Breaking Automations](https://abhiman.io/blog/notion-database-mistakes/), 2026-06-07** — four named defect classes:

1. "Renaming Properties After the Automation Is Built"
2. "Using the Wrong Property Type"
3. "Restructuring a Database That an Automation Depends On"
4. "Trying to Use Formula Properties as Automation Inputs"

### What people pay

- Consultants: **$100–200/hour**; freelance average **$90–95/hour**; projects **$1,000–$25,000+**; retainers from roughly 10 hours per month.
- Templates: **$5–$49**, with premium bundles at **$79–$199**. Thomas Frank crossed **$1M** in Notion template sales.
- Notion itself: free. Page verification, [workspace audit log](https://www.notion.com/help/audit-log), and admin content search are bundled.

### Competitive finding

**NoteRunway already ships five of this product's eight rule categories**, adds AI semantic duplicate detection the CLI structurally cannot match, and appears to require little or no configuration. Notion additionally ships a first-party AI workspace-audit agent producing "a scored audit report, a prioritized fix list" and applying selected fixes ([Rundown Guides](https://app.therundown.ai/guides/how-to-audit-your-business-with-notions-built-in-claude-agents), 2026-04-15).

The product is not entering an empty field. Its differentiators are **local, read-only, and deterministic**. Those are real, but they are trust properties, not capability properties, and only some buyers price trust.

---

## 6. RELEASE CADENCE — THE BREAKAGE RISK IS HIGH

Source: [Notion API changelog](https://developers.notion.com/page/changelog), covering February 2025 through August 2026.

**Volume: roughly 60 entries across approximately 19 months, clustering at 3–6 per month and accelerating sharply through 2026.**

### Changes that would plausibly break a tool reading workspace structure — at least nine

1. **API version `2025-09-03` — the `data_sources` split.** The biggest. Databases became containers; schema and rows moved to new `data_source` objects; `/v1/databases/:id/query` became `/v1/data_sources/:id/query`; page creation now requires a `data_source_id` parent; webhook events were renamed. Not backwards compatible. Announced 2025-08-26, live 2025-09-03. This is the change that produced the Zapier casualties in section 4. See the [upgrade guide](https://developers.notion.com/docs/upgrade-guide-2025-09-03) and [FAQs](https://developers.notion.com/docs/upgrade-faqs-2025-09-03).
2. **API version `2026-03-11`.** Breaking: `position` replaces `after`, `in_trash` replaces `archived`, `meeting_notes` replaces `transcription`.
3. **2026-04-20 — hard 10,000-result cap** on data source and view queries, with a new `request_status` field. Directly limits full-workspace scanning.
4. **2026-04-22 — pagination cursors now embed session identifiers**; `start_cursor` accepts opaque strings.
5. **2026-06-16 — workspace-level rate limits** added on top of per-connection limits. A whole-workspace scanner is exactly the client shape this throttles.
6. **2026-08-05 — formula and rollup values can now return type `"unsupported"`** when complexity is too high. Silent data gaps in precisely the properties rules would evaluate.
7. **2026-08-12 — formula expressions now stored exactly as written**, plus a gradual rollout of human-readable `prop("Property Name")` syntax in data source schemas. A schema-shape change.
8. **2026-07-15 — app links changed from `notion.so` to `app.notion.com/p/{page-id}`.** Any URL or ID parsing breaks.
9. **2026-03-19 Views API launch** (eight new endpoints) and **2026-03-25 / 2026-03-30 new block types** (`heading_4`, tab blocks, tab item icons) — new structure a scanner must learn to traverse.

Plus the standing constraint from P10: relations, rollups, people, and rich_text properties silently truncate past 25 items.

Notion's product changelog ([notion.com/releases](https://www.notion.com/releases)) was fetched but returned only ten visible entries for the period, heavily weighted toward AI agent features. Treat that count as a floor, not a total — the page appears paginated or lazily loaded.

### The finding

Two breaking API versions in twelve months, a new result cap, new workspace rate limits, and a new `unsupported` value type. A local CLI pinned to an API version will drift out of correctness on a timescale of months, and the failure mode is the dangerous one: **silently reading less than the workspace contains and reporting a clean bill of health.**

Budget for version pinning plus a loud, non-suppressible warning whenever the API returns truncated, capped, or `unsupported` results. A structural linter that under-reports is worse than no linter.

---

## RECOMMENDED TARGET SEGMENT

### The Notion consultant auditing client workspaces.

**Why this one.** It is the only segment where frequent testable pain and evidenced willingness to configure appear in the same person.

- The pains they voice — P8 naming and schema mismatch, P5 missing required values, P3 schema drift — are the ones sitting in the clean-TESTABLE column. They are not primarily complaining about clutter.
- The willingness-to-configure evidence is **behavioral, not stated**. Borowski already hand-authors declarative structural rules as Notion regex formulas and publishes them. A config file is a strict improvement on the tooling he chose voluntarily.
- Structural audit is already a **priced, fixed-scope, read-only deliverable** they sell. Notion Rescue documents "every structural gap ... without making any changes." That is this product's output, already validated as a billable artifact.
- The economics work. At $100–200/hour, a config that saves two hours per client audit pays for itself on the first engagement and compounds across every subsequent client. No other segment amortizes the configuration cost across more than one workspace.
- They sit nearest the one real cost account: alvinliang, whose "clients' work has been put on pause," runs a Notion consulting firm.

### The strongest argument against this pick

The consultant segment is **small, and it is being squeezed from both sides.** Notion ships a first-party AI audit agent that scores a workspace, prioritizes fixes, and applies them. NoteRunway ships semantic duplicate detection this CLI structurally cannot match. Against those, the CLI's pitch is: deterministic, local, read-only, but you must first declare every rule by hand and it cannot fix anything.

A consultant billing hourly also has a live incentive **against** a tool that mechanizes the audit hours they invoice. The leverage argument assumes they compete on volume rather than on billable time, and no evidence was found establishing which. And the entire willingness-to-configure case rests on **two named individuals** — Borowski and Larson — one of whom is not even in this segment.

### Second choice if the consultant thesis fails

**The developer using Notion as a data backend.** Weaker pain volume, but zero configuration resistance — they already write config files and schema validators — and P3 is the one pain in this catalogue with dated, named, quantified damage attached.

### Next action

Re-run this sweep with a Reddit-capable fetch path before committing to a segment. The solo and small-team willingness-to-configure verdicts are currently "NO EVIDENCE FOUND" and "WEAK." Both were produced by a blocked crawler, not by an absence in the world.
