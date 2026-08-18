# Claims inside a document store, checked against that store's live data

**Evidence class: documented.** This file records what primary sources state. No Notion response was
involved. Nothing here outranks `docs/proof/`.

Run for issue **#69**. It tests one sentence: *"No other tool in the market does this."*

- **Date of all fetches:** 2026-08-17 unless stated otherwise.
- **Role:** competitive prior-art SME.
- **Status:** research evidence, not a product decision. It does not override `CONTEXT.md` or any ADR.
  It is an input.
- **Question under test:** the pitch sentence for #69, *"No other tool in the market does this."*

**Scope note.** This sweep deliberately does not re-cover doctest, rustdoc doctests, `cog`, ArchUnit,
Terraform drift detection, or AWS Config. Those are settled in
`docs/research/documented-claim-drift-prior-art.md` §5.

---

## 0. Method, and what a null result here can and cannot mean

`WebSearch` is exhausted at 200/200 and was not used. Every finding below came from one of five
routes, all of which returned data:

| Route | Mechanism | Worked? |
|---|---|---|
| npm registry search API | `https://registry.npmjs.org/-/v1/search?text=…` raw JSON | Yes — 11 queries |
| GitHub search | `gh` CLI (`gh search repos`, `gh search code`) | Yes — 20 queries |
| Atlassian Marketplace API | `https://marketplace.atlassian.com/rest/2/addons?text=…` | Yes — HTTP 200, 10 queries |
| arXiv API | `https://export.arxiv.org/api/query` | Yes — 3 queries (note: **plain HTTP 301s**, HTTPS required) |
| Scholar Gateway (Wiley corpus) | `semanticSearch` | Yes — 1 query, 15 passages, 7 distinct papers |

The GitHub MCP server returned `Authentication Failed: Bad credentials` on every call. The `gh` CLI
is authenticated in this environment and was substituted. No GitHub question went unasked.

**What a null result proves.** These routes see published packages, public repositories, and listed
marketplace apps. They do not see a script inside a company, an unlisted Notion internal tool, or a
feature shipped without documentation. Where this file says nothing was found, it means **nothing was
found on the named routes** — absence of evidence. Where a fetched page states a limit in its own
words, that is evidence of absence, and it is marked as such.

**One inference is flagged, not asserted.** The Notion automations page yields a complete list of
triggers and actions (§1.4). The conclusion that no action can fail a run is *drawn from the
absence of such an action in that list*. Notion does not state the limit in words. It is an
inference from an enumerated list, and it is labelled that way below.

---

## 1. Sub-question 1 — Notion specifically

### 1.1 Notion's own integration gallery lists no validation category

`https://www.notion.com/integrations/all` (302 → `https://www.notion.com/connections`, HTTP 200).
Fifteen categories exist: Engineering, Design, Sales, Marketing, Finance, Analytics, Automations,
Productivity, Collaboration, Forms, Customer experience, File management, Communication, Security &
compliance, Identity.

There is no auditing, validation, linting, or data-quality category. The nearest, **Security &
compliance**, contains Datadog, Panther, Sumo Logic, Splunk, Nightfall AI, Polymer, Microsoft Entra
ID, and RunReveal — threat detection, log monitoring, data redaction, and user provisioning. None
evaluates a claim about workspace content.

### 1.2 npm has no such package

Eight queries against the registry search API: `notion lint`, `notion validate`, `notion audit`,
`notion check`, `notion test`, `notion quality`, `notion integrity`, `notion assert`. Every
Notion-named result is a client, a renderer, a Markdown converter, a type package, an MCP server, or
a transport CLI. The complete set of distinct Notion packages returned across all eight queries:

`@notionhq/client`, `@notionhq/notion-mcp-server`, `notion-mcp-server`, `notion-to-md`,
`@tryfabric/martian`, `notion-types`, `react-notion-x`, `react-notion`, `vue3-notion`,
`@9gustin/react-notion-render`, `notion-md-crawler`, `notion-utils`, `notion-client`,
`notion-helper`, `notion-compat`, `@notion-md-converter/core`, `@4ier/notion-cli`, `ntn`,
`@sug1t0m0/notion-typed-client`, `playwright-notion-reporter`.

Two are worth naming precisely because they are the near-misses:
- **`@sug1t0m0/notion-typed-client`** (2025-09-23) — "Type-safe wrapper for Notion SDK with database
  schema injection." It types the *client*. It asserts nothing about the data.
- **`playwright-notion-reporter`** (2026-08-06) — writes test results *into* a Notion database. The
  arrow points the wrong way: Notion is the sink for assertions made elsewhere, not the subject.

### 1.3 GitHub has no such repository

`gh search repos` over name/description/topics: `notion validate workspace`, `notion audit
workspace`, `notion data quality`, `notion assertions`, `notion integrity check`, `notion database
validation`, `notion schema validation`, `notion doctor`. One hit total —
`SCORE1387/notion-data-quality`, 0 stars, last touched 2023-08-14, **no description**.

Widening to `in:readme` returned ranking noise (large "awesome-skills" lists) and no candidate.
`gh search code` for `notion assertion`, `living documentation notion`, `notion database data
contract`, and `notion page assertion check API` returned nothing relevant.

The only literal name-match in the whole sweep is **`Romloader/notion-linter`** (2 stars, 2024-10-22)
— "A Linter for Notion Formulas as a VS Code Extension." It lints *formula syntax* in an editor. It
does not connect to a workspace and evaluates no claim.

### 1.4 Notion's own automations cannot express a failure

`https://www.notion.com/help/database-automations`. Triggers: **"Page added"**, **"Property
edited"**, **"Every {frequency}"**. Actions: **"Edit property"**, **"Add page to"**, **"Edit pages
in"**, **"Send notification to"**, **"Send mail to"**, **"Send webhook"**, **"Send Slack notification
to"**, **"Define variables"**.

**Inference, not quotation:** no action in that enumeration reports a failure, returns a non-zero
status, or blocks anything. The strongest thing Notion can natively do with a false condition is
send a message about it. A rollup or formula can already *display* "8 active partners" as a live
value; nothing native turns a wrong value into a failed run.

### 1.5 The Notion developer community is not a reachable route

- `https://developers.notion.com/page/community` — **HTTP 404**.
- `https://community.notion.so/` — **does not resolve** (curl exit 7, no HTTP status returned).
- Reddit — **known-blocked from every agent path attempted in this project**; not attempted, per the
  standing finding.

This corroborates the existing project note that the Notion forum is dead. The developer-community
sub-route of sub-question 1 is **blocked**, and the other four routes carried it.

### 1.6 Verdict, sub-question 1

**No shipping tool was found that evaluates an assertion written inside a Notion page against Notion
data.** The prior sweep's field — NoteRunway, Notion Link Checker, `Coastal-Programs/notion-cli`'s
`doctor`, Notion Custom Agents, marketplace cleanup templates — contains nothing of this shape
either, and this sweep adds no new candidate.

---

## 2. Sub-question 2 — adjacent document stores

### 2.1 Confluence — four apps checked, none does it

The Atlassian Marketplace API answered ten queries at HTTP 200. Four apps came back as plausible and
each was opened.

| App | URL | What it checks | What it does **not** do |
|---|---|---|---|
| **Scroll Content Quality for Confluence** (K15t) | [marketplace.atlassian.com/apps/1224799](https://marketplace.atlassian.com/apps/1224799/scroll-content-quality-for-confluence) | Rules over **text, links, images, macros**. Bundled rulesets: Link Checker, Inclusive Language, Documentation Style Guide. Free up to 10 users. | No rule asserts a fact about data — no count, no value, no relationship. It is a prose-and-structure linter, the Confluence analogue of Vale. |
| **SoftComply Validation for Confluence (MedTech Compliance)** (SoftComply, 57 installs) | [marketplace.atlassian.com/apps/1229288](https://marketplace.atlassian.com/apps/1229288/softcomply-validation-for-confluence-medtech-compliance) | Weekly automated tests of **the Confluence platform itself** — "management of permissions, users, spaces and pages" — emitting a Master Validation Plan, Validation Report, Test Protocol, and Master Validation Report for FDA 21 CFR 11 / ISO 13485. | **The subject is the software, not the content.** This is IQ-OQ-PQ software validation. It proves Confluence works; it says nothing about whether a sentence on a page is true. This is the single most misleading name in the sweep. |
| **Blueprint Validation** (MESILAT LIMITED, 1,470 downloads) | [marketplace.atlassian.com/apps/1222627](https://marketplace.atlassian.com/apps/1222627/blueprint-validation) | "Create typed JSON from your Confluence pages, validate it against JSON schema; share and report your Confluence data." Browser-side validators use value lists, regex patterns, and CQL queries. | **Closest structural match found in any document store.** But the assertion is a *schema* (shape and type), not a *claim* (this count equals 8). The subject is the page's own fields, not live records elsewhere. Deprecated for Server. |
| **Capable Quality for Confluence** (com.gocapable.confluence.quality) | [marketplace.atlassian.com/apps/4170202150](https://marketplace.atlassian.com/apps/4170202150/capable-quality-for-confluence) | "automatically scans pages for structural, accessibility, language, and compliance issues. Define rules, run audits" | Same class as Scroll Content Quality: structure, accessibility, language. No data assertion. |

Confluence's long macro history produced the richest field in this sweep and it still stops at
**shape**. Nothing was found that checks a *value*.

### 2.2 SharePoint — the platform forbids it, in its own words

Microsoft's formula reference states the limit directly:

> "Calculated fields can only operate on their own row, so you can't reference a value in another
> row, or columns contained in another list or library."

([support.microsoft.com, Examples of common formulas in SharePoint Lists](https://support.microsoft.com/en-us/office/examples-of-common-formulas-in-sharepoint-lists-d81f5f21-2b4e-45ce-b170-bf7ebf6988b3))

The page also states "Lookup fields are not supported in a formula."

**This is evidence of absence, not absence of evidence.** A claim like "this list contains exactly 8
active partners" is an aggregate over many rows. SharePoint validation formulas are structurally
incapable of expressing it. SharePoint validates a row as it is written; it cannot assert anything
about a set after the fact.

### 2.3 Coda — blocked, with status codes

Coda's documentation has moved. `coda.io` now 302s to `docs.superhuman.com` (Coda's docs are served
from the Superhuman domain).

- `https://help.coda.io/` → 302 → `https://help.coda.io/hc/en-us` — **HTTP 403** to curl.
- `https://help.coda.io/hc/en-us` via WebFetch — **HTTP 403**.
- `https://help.coda.io/en/articles/1137949-automations-in-coda`, `…/1137949-automation-rules`,
  `…/collections/81877-automations`, `https://coda.io/resources/guides/automations` — **HTTP 404**
  (all four; the article IDs are stale after the migration).
- `https://coda.io/formulas` → 302 → `https://docs.superhuman.com/formulas` — **HTTP 200**, but the
  body is client-rendered; WebFetch retrieved only the `<title>`. No formula names extracted.

**Coda is the one named store in the brief that this sweep did not answer.** It is recorded as
blocked at HTTP 403/404, not as absent. A browser-driven fetch would clear it.

### 2.4 Airtable — nothing on the routes taken

`https://airtable.com/marketplace` returns HTTP 200 but was not mined (JS-rendered, same failure mode
as Coda). npm queries `airtable validation` and `airtable lint` returned only SDKs, MCP servers,
bundlers, a Gatsby source, and `@qualifyze/airtable-formulator` ("Airtable Formula Manipulator") —
which manipulates formulas rather than asserting anything. `airtable-ts` is a type-safe SDK, the same
class as `@sug1t0m0/notion-typed-client`.

Confidence here is **lower than for Notion**: one route (npm), not five.

### 2.5 Wikis — and this is the real prior art

The Wiley corpus returned one paper eight times out of fifteen passages, which is the retrieval
engine saying the field is thin and this is its centre:

**Di Iorio, A., Draicchio, F., Vitali, F., Zacchiroli, S., & Eklundh, K. S. (2012). Constrained
Wiki: The WikiWay to Validating Content. *Advances in Human-Computer Interaction*, 2012(1).
[10.1155/2012/893575](https://doi.org/10.1155/2012/893575)**

The paper defines the exact object #69 proposes:

> **Definition 1 (light constraint).** A *light constraint* is a decidable constraint, that is, a
> boolean predicate denoting the fulfillment of some requirement, applicable to the content of a
> wiki, or part of it, which its community wants to be adhered to as much as possible.

It classifies constraints on two axes — **scope** (intra-page vs inter-page) and **expressivity**
(syntactic vs semantic) — and its inter-page example is nearly the workspace_lint premise:

> "ordered lists of all the elements of a class described on a wiki (e.g., the class of 'European
> countries') can be listed on different pages according to different sorting criteria. The fact that
> all those lists should contain the same elements is an obvious quality requirement, **which remains
> implicit with current wiki technology.**"

It was implemented. Two proof-of-concept validators, for MediaWiki and MoinMoin.

**Three differences decide whether this refutes #69, and they all point the same way.**

1. **It warns; it does not fail.** The abstract is explicit that the validators provide "an annotated
   view function, that is, presenting content authors with violation warnings, **rather than
   preventing them from saving a noncompliant text.**" Preserving the WikiWay is the paper's stated
   design goal. #69's mechanism is the opposite: it fails the run.
2. **The subject is page prose, not database records.** The constraints are over wiki content —
   section length, forbidden words, structural uniformity, broken links, semantic triples. Not over
   the live rows of a structured store.
3. **The implementation is gone.** Source was published at `http://vitali.web.cs.unibo.it/lcwikis`.
   The host **resolves** (DNS: alias of `loewng.cs.unibo.it`, 130.136.1.142) but **the connection
   fails** — curl exit 7, no HTTP status returned, on both http:// and https://. A resolving host
   that refuses connections is a decommissioned service, not a moved one.

The other six Wiley papers are off-target: XWiki real-time collaborative editing
([10.1002/cpe.4110](https://doi.org/10.1002/cpe.4110)), semantic-web ontologies
([10.1002/aris.2007.1440410116](https://doi.org/10.1002/aris.2007.1440410116)), and wikis as research
group communication tools ([10.1111/j.1525-1594.2004.29005.x](https://doi.org/10.1111/j.1525-1594.2004.29005.x)).

---

## 3. Sub-question 3 — the general pattern under other names

### 3.1 What the names actually return

| Name searched | Route | Result |
|---|---|---|
| "living documentation" OR "executable documentation" | arXiv API | **39 results, almost all false positives.** In physics "living review" means a periodically updated survey — *A Living Review of Machine Learning for Particle Physics*, *A Living Review of Quantum Computing for Plasma Physics*. The term is claimed by a different field. One relevant hit: **"Example-driven development: bridging tests and documentation"** ([arXiv:2409.00514](https://arxiv.org/abs/2409.00514), 2024-08-31). |
| "executable specification" OR "specification by example" | arXiv API | **338 results, and they are formal methods** — Coq, Isabelle, VDM-SL, ACL2, Z, model checking Paxos, Prolog dose-escalation protocols. This is specification-of-behaviour, verified by proof or model checking. It is not documentation checked against a running system's data. |
| "documentation drift" OR "docs as tests" OR "documentation testing" | arXiv API | **32 results**, consistent with the 11 found by the #62 sweep on its narrower query. Nearest: "Identifying Inaccurate Descriptions in LLM-generated Code Comments via Test Execution" ([arXiv:2406.14836](https://arxiv.org/abs/2406.14836)); "Towards identifying and minimizing customer-facing documentation debt" ([arXiv:2402.11048](https://arxiv.org/abs/2402.11048)). Both are about code comments. |

**Finding on the names.** Three of the four phrases the brief proposed are already owned by other
problems. "Living documentation" belongs to physics survey articles. "Executable specification"
belongs to theorem proving. Searching for #69's mechanism under those names retrieves other fields,
which is one reason the pattern looks unoccupied: it has no agreed name.

### 3.2 The mature form of the pattern is in data tooling, not in document tooling

Two tools ship the declared-assertion mechanism at scale. Both were reached first-hand.

**dbt data tests.** The assertion and the prose live in the same YAML file, next to each other, and
the run fails. From [docs.getdbt.com/docs/build/data-tests](https://docs.getdbt.com/docs/build/data-tests):

```yaml
models:
  - name: orders
    columns:
      - name: order_id
        data_tests: [unique, not_null]
      - name: customer_id
        data_tests:
          - relationships:
              arguments: {to: ref('customers'), field: id}
```

On failure dbt returns **exit code 1** — "completed with at least one handled error"; a zero exit
code always implies success ([docs.getdbt.com/reference/exit-codes](https://docs.getdbt.com/reference/exit-codes)).
This is the CI-failing half of #69, in production, since well before it.

**Great Expectations.** The definition is the same object as #69's falsifier:

> "An Expectation is a verifiable assertion about data. Similar to assertions in traditional Python
> unit tests, Expectations provide a flexible, declarative language for describing expected data
> qualities."

([docs.greatexpectations.io/docs/core/introduction/gx_overview](https://docs.greatexpectations.io/docs/core/introduction/gx_overview))

**Where both differ from #69, and it is the same difference twice.** In dbt and in Great
Expectations, the assertion lives in a **repository**, and the data lives in a **warehouse**. Two
systems, one asserting about the other. #69 puts the assertion **inside the store it asserts about**
— the Notion page and the Notion database are the same product, edited by the same non-technical
people, in the same session. That collapse from two systems to one is the part not found elsewhere.

---

## 4. Sub-question 4 — the sentence the evidence supports

**#69's current claim, "No other tool in the market does this," is not supported and should not
ship.** It asserts a universal negative over a market that no available route can enumerate.

The sentence the evidence does support:

> **We searched npm, GitHub, the Notion integrations gallery, the Atlassian Marketplace, arXiv, and
> the Wiley corpus, and found no shipping tool that evaluates an assertion written inside a document
> against that document store's own live data and fails when the assertion is false; the mechanism is
> published prior art for wikis (Constrained Wiki, 2012) and is mature in data tooling (dbt, Great
> Expectations), so what is unoccupied here is the application, not the invention.**

Three supporting statements that can each be made on their own, in descending strength:

1. **Strongest, and it is evidence of absence.** SharePoint cannot express the assertion at all —
   "Calculated fields can only operate on their own row." Notion's automation actions can notify
   about a false condition but cannot fail on one. The platforms' own documentation establishes this.
2. **Middling, and it is absence of evidence.** Five independent routes over Notion returned no such
   tool. That is a real negative, and it cannot see private or unlisted tools.
3. **Weakest, and it must be stated anyway.** Coda is unchecked at HTTP 403/404, and Airtable was
   checked on one route only. Neither is claimed either way.

**What must be dropped.** Any phrasing containing "no other tool," "first," "only," or "nobody
else." The Constrained Wiki paper defined this exact predicate in 2012 and prototyped it twice. A
claim of novelty is refutable by a fourteen-year-old paper that a reviewer can find in one search,
and the repository's own standard — a claim states what would falsify it — makes shipping that
sentence a self-inflicted wound.

**What is genuinely defensible, and it is narrower and better.** #69 collapses the two-system
assumption every existing tool makes. dbt, Great Expectations, and Terraform all keep the assertion
in a repository and the data in a system elsewhere, which requires the person who knows the claim to
be someone who commits YAML. #69 puts the assertion where the claim is already written, next to the
prose, editable by the person who wrote the sentence — and still fails a run. Constrained Wiki chose
warnings on purpose to protect open editing; #69 chooses failure. That contrast is a design position
that can be argued and defended, and unlike a novelty claim it cannot be refuted by finding one repo.

---

## 5. Blocked routes, with status codes

Recorded so each omission is a choice and not an oversight.

| Route | Status | Consequence |
|---|---|---|
| GitHub MCP server | `Authentication Failed: Bad credentials` | **None.** Substituted `gh` CLI, which is authenticated. Every GitHub question was asked. |
| `WebSearch` | Exhausted 200/200 | None. Five other routes carried the sweep. |
| `help.coda.io/hc/en-us` | **HTTP 403** (curl and WebFetch) | §2.3 unanswered. Coda is the one real gap. |
| Four Coda help article URLs | **HTTP 404** | Stale IDs after the `coda.io` → `docs.superhuman.com` migration. |
| `docs.superhuman.com/formulas` | **HTTP 200**, body client-rendered | Only `<title>` retrieved. Needs a browser-driven fetch. |
| `airtable.com/marketplace` | **HTTP 200**, JS-rendered | Not mined. Airtable rests on one route (npm). |
| `developers.notion.com/page/community` | **HTTP 404** | Notion developer forum unreachable. |
| `community.notion.so` | **Does not resolve** — curl exit 7, no HTTP status | Corroborates the standing project finding that the forum is dead. |
| `vitali.web.cs.unibo.it/lcwikis` | **DNS resolves, connection fails** — curl exit 7, no HTTP status | Constrained Wiki source code is gone. Paper is first-hand; code is not. |
| Reddit | **Known-blocked from every agent path in this project** | Not attempted, per standing finding. Would have been the route for "has anyone built this." |
| `marketplace.atlassian.com/apps/1216144/...` | HTTP 200, **wrong app** | A guessed app ID resolved to "Ultimate Customizer for Jira Service Management." Corrected by resolving real IDs through the Marketplace API. No claim rests on the bad fetch. |

---

## 6. Next action

**Two things, in this order.**

1. **Rewrite #69's pitch sentence before the issue is used to justify build effort.** Replace "No
   other tool in the market does this" with the §4 sentence. This costs one edit and removes a claim
   a reviewer can refute in one search.

2. **Clear Coda, or write it off explicitly.** It is the only named store this sweep failed to
   answer, and it is the most likely place for a real counter-example: Coda merges documents and
   tables in one object, which is the same collapse #69 depends on. The route is a browser-driven
   fetch of `docs.superhuman.com/formulas` and the Coda automations documentation, since both are
   HTTP 200 and JS-rendered rather than forbidden. If Coda ships a formula or automation that fails
   on a false condition over doc data, §4's sentence needs weakening again.

**The falsifier for this file.** If any reader finds a shipping tool — Notion, Confluence, Coda,
Airtable, SharePoint, or a wiki — where an assertion written in a page is evaluated against that
store's live data and a false assertion causes a non-zero exit or a blocked action, then §4's
sentence is wrong and must be retracted rather than softened.
