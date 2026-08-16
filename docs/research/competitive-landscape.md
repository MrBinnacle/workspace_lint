# Competitive Landscape: Notion Workspace Structural Linting

- **Date:** 2026-08-16
- **Role:** competitive-threat SME
- **Status:** This document is research evidence, not a canonical product decision. It does not
  override `CONTEXT.md` or any ADR in `docs/adr/`. It is an input.

## Scope

The product under assessment is a local, read-only CLI. It scans a Notion workspace through the
official API and reports structural defects against rules the user declares in a YAML config. It is
deterministic, uses no LLM, sends no telemetry, and cannot modify the workspace.

The eight rules, referenced by number throughout:

| # | Rule |
|---|---|
| R1 | Incomplete-scan reporting (coverage manifest) |
| R2 | Broken, archived, or unreachable internal references |
| R3 | Missing required property values |
| R4 | Duplicate declared-unique values |
| R5 | Incompatible schemas between peer databases |
| R6 | Relations pointing at disallowed targets |
| R7 | Active items depending on inactive ones |
| R8 | More than one canonical marker in a declared boundary |

Every claim below carries the URL it came from. Pages were fetched on 2026-08-16. Claims taken from
search-result snippets rather than a fetched page are labelled `[snippet]`.

---

## 1. NoteRunway

### 1.1 Correction to the prior sweep

The prior sweep described NoteRunway as a product that "ships five of the eight rule categories."
That description does not survive contact with the sources.

NoteRunway is a single-developer entry to the "DEV × Notion MCP Challenge," published
2026-03-29. It is MIT-licensed, has 11 GitHub stars, and has no company, no pricing, and no revenue.
It is not a commercial competitor. It is a hackathon demonstration.

Sources fetched:

- https://github.com/georgekobaidze/noterunway — README. MIT licence, 11 stars.
- https://dev.to/georgekobaidze/noterunway-because-your-notion-workspace-deserves-an-elite-crew-53bk
  — author's launch post, dated 2026-03-29, states the DEV × Notion MCP Challenge origin.
- https://noterunway.pilotronica.com/ — live demo site. No pricing page. No company details.

### 1.2 What it actually is

**Architecture.** Next.js 16 web application. Connects to Notion by OAuth 2.0. Runs analysis
server-side through Next.js API routes and the Notion MCP Server over stdio. The README states MCP
stdio spawns subprocesses and is therefore incompatible with serverless hosting; it directs users to
Railway, Render, Docker, or a VPS. It is self-hostable, and a hosted demo instance exists at
`noterunway.pilotronica.com`.

**Configuration.** Required. The user must register a Notion OAuth application and supply
`NOTION_OAUTH_CLIENT_ID`, `NOTION_OAUTH_CLIENT_SECRET`, and `NOTION_OAUTH_REDIRECT_URI` in
`.env.local`, then enter an LLM provider key in browser settings. The prior sweep's claim that it
"requires little or no configuration" is wrong. It requires more setup than a CLI with a YAML file.

**LLM dependency.** Bring-your-own-key across four providers (OpenAI, Anthropic, xAI, Google), 13
models. Keys are held in browser `localStorage` and sent per request. Two of the seven tools —
Duplicate Detection and Semantic Ask — do not function without an LLM key.

**Data egress.** Workspace content is read by the NoteRunway server and, for the AI tools, sent to
the user's chosen LLM provider. The site's claim "Your data stays in Notion. NoteRunway never stores
workspace content" is a statement about persistence, not about transmission. Content transits the
NoteRunway server and reaches a third-party model API. It would appear as though "never stores" is
doing work that "never sends" would not do.

**Write access.** NoteRunway writes to Notion. The README states it archives pages into a
"NoteRunway Archive" folder with an audit trail. Destructive actions require explicit user approval,
and the Garbage Collector defaults to dry-run. It is not read-only by construction; it is read-only
by default with a confirmation dialog.

**Viability.** One author, 11 stars, four months since launch, no monetisation. Treat as
abandonment-prone.

### 1.3 The seven tools

Verbatim names and descriptions from the fetched sources:

1. **Workspace Health** — "total pages, orphans, duplicate candidates, and link density score"
2. **Duplicate Detection** — "AI semantically identifies near-duplicate notes. Side-by-side diff,
   similarity score, confirm before merging." Fetches up to 100 pages with content snippets.
3. **Garbage Collector** — "Finds empty, orphaned, and stale pages" (stale = 90+ days). Dry-run
   default, then archives.
4. **Dependency Graph** — React Flow visualisation of linked notes and tasks.
5. **Dead Link Detector** — "Scans every page for @mentions pointing to archived or deleted pages"
6. **Sensitive Data Finder** — regex over 13 secret patterns, plus optional AI deep scan.
7. **Semantic Ask** — agentic chat, up to 10 reasoning steps, proposes archive/create/rename/append/
   update actions for approval.

### 1.4 Rule-by-rule mapping — NoteRunway

| Rule | Verdict | Evidence |
|---|---|---|
| R1 incomplete-scan reporting | **DOES NOT COVER** | No coverage manifest exists in any of the seven tools. Worse, Duplicate Detection "fetches up to 100 pages" (dev.to) and reports on that subset without declaring the truncation. This is the exact failure R1 is designed to prevent. |
| R2 broken/archived internal references | **PARTIAL** | Dead Link Detector covers `@mention` blocks pointing at archived or deleted pages (noterunway.pilotronica.com). It does not cover relation properties, database parents, or synced-block sources. It covers one reference channel of several. |
| R3 missing required property values | **DOES NOT COVER** | The nearest feature is "empty pages" in Garbage Collector. An empty page body is not a missing required property value. No mechanism exists for the user to declare a property required. |
| R4 duplicate declared-unique values | **PARTIAL, AND DIFFERENT IN KIND** | Duplicate Detection finds semantic near-duplicates of page *content* by LLM similarity score. R4 is exact-match detection over a property the user declared unique. NoteRunway cannot answer "two rows share an invoice number"; it can answer "two pages read similarly." The outputs are non-deterministic and capped at 100 pages. |
| R5 incompatible peer-database schemas | **DOES NOT COVER** | No schema comparison feature exists in any of the seven tools. |
| R6 relations pointing at disallowed targets | **DOES NOT COVER** | Dependency Graph renders relations visually. It applies no rule and emits no finding. Visualisation is not validation. |
| R7 active items depending on inactive ones | **DOES NOT COVER** | No status-aware dependency check. The graph is untyped with respect to status. |
| R8 duplicate canonical markers in a boundary | **DOES NOT COVER** | No concept of a declared boundary or a canonical marker exists. |

**Score: 0 COVERS, 2 PARTIAL, 6 DOES NOT COVER.** The prior sweep's "five of eight" is not
supportable from any fetched page.

---

## 2. Notion's first-party audit agent

### 2.1 Correction to the prior sweep — the feature does not exist as described

The prior sweep described "Notion's own first-party AI workspace-audit agent." I went to Notion's
own documentation. No such shipped feature is documented there.

Fetched:

- https://www.notion.com/help/use-claude-agents-in-notion — describes Claude agents hosted by Notion
  via Anthropic infrastructure. Business and Enterprise plans. Beta, gradual rollout: "you might not
  see it right away." Off by default for Enterprise and HIPAA workspaces. **No mention of a preset
  "Business Workspace Auditor" or any workspace cleanup capability.**
- https://www.notion.com/help/custom-agents — states Custom Agents are user-configured. "You build
  them by providing instructions." Business or Enterprise plan required. Critical constraint:
  "Agents act only on the pages, databases, and external apps you explicitly grant access to. They
  never have full workspace access by default."
- https://www.notion.com/product/agents — lists three agent *types* (Q&A, task routing, status
  update). Names no audit or cleanup preset. States Custom Agents move to credit metering from
  2026-05-04 at "$10 per 1,000 credits."
- https://www.notion.com/releases/2026-07-01 — Notion 3.6 release notes. External Agents (Claude,
  Cursor), HTML blocks, Microsoft integrations, five new MCP connections, Enterprise audit logging
  of Custom Agent activity. **No workspace audit, cleanup, schema check, or preset agent.**

The secondary source the prior sweep relied on
(https://app.therundown.ai/guides/how-to-audit-your-business-with-notions-built-in-claude-agents,
2026-04-15) names a "Business Workspace Auditor" and states it returns "a scored report with: Schema
issues, such as duplicate status fields or orphaned properties," at "$10 per 1,000 credits" on
Business or Enterprise with Notion AI enabled. The credit price matches Notion's own page. The agent
name does not appear in any Notion-owned page I fetched, and a targeted search for the exact string
returned only the Rundown guide itself.

**Finding: "Business Workspace Auditor" is a prompt recipe a reader configures as a Custom Agent,
described by a third-party newsletter as though it were a shipped product. It is not a Notion
feature. Notion ships the *substrate*; the audit behaviour is user-written instructions.**

Also checked: https://www.notion.com/templates/workspace-cleanup-organization-agent — a
"Workspace Cleanup & Organization AI Agent Template," free, by Ivy Saskia, a third-party creator with
100+ marketplace templates. Community-contributed, not Notion Labs. The marketplace is the real
distribution channel for this behaviour, and it is already occupied by free templates.

### 2.2 Why this remains the most dangerous competitor anyway

The threat is not the named agent. The threat is the substrate. A Business-plan admin can write a
Custom Agent with instructions approximating most of the eight rules, in minutes, with no install,
no API key, and no CLI. Notion improves that substrate continuously at no cost to itself. That is the
correct thing to be afraid of.

The countervailing evidence is specific and load-bearing. Notion's own docs impose three limits that
a Custom Agent cannot escape:

1. **Access is opt-in per object.** "They never have full workspace access by default"
   (notion.com/help/custom-agents). An agent audits what it was pointed at. A workspace-wide
   structural audit requires the admin to enumerate the workspace first — which is the problem they
   wanted audited.
2. **Metered.** $10 per 1,000 credits, and "tasks with more steps, more reading, or more tool use
   cost more credits" (notion.com/help/use-claude-agents-in-notion). Exhaustive enumeration is the
   most expensive possible workload. The pricing model penalises completeness.
3. **No determinism guarantee.** Notion's Custom Agents documentation does not address determinism or
   reproducibility of output across runs. There is no exit code, no CI surface, no stable finding ID.

### 2.3 Rule-by-rule mapping — Notion Custom Agent (user-configured, Business/Enterprise)

Every verdict here is for behaviour a user can instruct, not a shipped feature. "PARTIAL" means the
agent can produce findings of that kind but cannot guarantee it found all of them.

| Rule | Verdict | Evidence |
|---|---|---|
| R1 incomplete-scan reporting | **DOES NOT COVER — structurally cannot** | An LLM agent cannot certify the boundary of what it did not read. Notion documents no coverage or completeness output. Combined with per-object access grants, the agent's scan boundary is undefined by construction. This is the one rule that is *anti-correlated* with the agent approach. |
| R2 broken/archived internal references | **PARTIAL** | Instructable. Reliability degrades with workspace size; no completeness claim. |
| R3 missing required property values | **PARTIAL** | Instructable per database. "Required" must be restated in prose each run rather than declared once in version control. |
| R4 duplicate declared-unique values | **PARTIAL** | Instructable, but exact-match uniqueness over thousands of rows is a task LLMs perform unreliably and expensively. Credits scale with rows read. |
| R5 incompatible peer-database schemas | **PARTIAL** | The Rundown guide claims schema findings ("duplicate status fields or orphaned properties"). Plausible for a small number of explicitly granted databases. Unverified against Notion-owned documentation. |
| R6 relations pointing at disallowed targets | **PARTIAL** | Instructable. Requires the allowed-target policy to be stated in the prompt; no schema for it. |
| R7 active items depending on inactive ones | **PARTIAL** | Instructable and well-suited to LLM reasoning, subject to the same completeness limit. |
| R8 duplicate canonical markers in a boundary | **PARTIAL** | Instructable. "Boundary" must be described in prose. |
| — | **Applies fixes** | Yes. Agents "create or update content (if the agent has edit access)" (notion.com/help/use-claude-agents-in-notion). |

**Score: 0 COVERS, 7 PARTIAL, 1 DOES NOT COVER.** The single non-covered rule is R1.

---

## 3. The wider field

| Name | URL | What it checks | Alive? | Notes |
|---|---|---|---|---|
| NoteRunway | github.com/georgekobaidze/noterunway | See §1 | Alive, 11 stars, MIT, launched 2026-03-29 | Hackathon entry. No revenue. |
| Notion Custom Agents / Claude agents | notion.com/help/custom-agents | User-instructed anything | Alive, beta rollout | First-party substrate. Business/Enterprise + credits. |
| Notion Marketplace cleanup agent templates | notion.com/templates/workspace-cleanup-organization-agent | Unspecified cleanup/organisation | Alive, free | Third-party creator. Free templates already occupy this shelf. |
| Notion Link Checker | notionlinkchecker.com | Broken/inaccessible links in Notion documents. Scope appears to be external URLs; internal references, archived pages, and relations are not documented as covered. | Ambiguous — footer reads "2024-2025," several doc pages marked "Coming Soon," no changelog | Chrome extension. Free tier 300 checks/month; $5/month unlimited. **This is the only tool found that charges money for a Notion structural check, and it charges $5.** |
| dataclean.to (Notion duplicates) | dataclean.to/use-cases/clean-duplicates-from-notion | Fuzzy-matched duplicate rows in Notion *exports*, by title and property values | Alive `[snippet]` | Operates on exported files, not the live workspace. Closest to R4 of anything found, but offline and fuzzy. |
| Coastal-Programs/notion-cli | github.com/Coastal-Programs/notion-cli | Has a `doctor` command, described in the README only as "Health check and diagnostics." MIT, 12 stars. Exit codes 0/1/2. | Alive | I fetched the repo page. The README does not enumerate the checks. Search snippets claiming "7 diagnostic checks" are unverified `[snippet]`. Separately, `notion auth doctor` in Notion's own CLI is an *authentication/integration* health check, not a workspace structural check. **Not a competitor for the eight rules.** |
| 4ier/notion-cli | github.com/4ier/notion-cli | Full Notion API CRUD coverage in a Go binary | Alive | A transport, not a linter. No rules. |
| Notion Audit Log | notion.com/help/audit-log | *Who did what, when.* Security event log, Enterprise only. | Alive, first-party | Frequently confused with structural auditing in search results. It is an access log. It answers no structural question. Not a competitor. |
| "Guided workspace self-audit + clean up" template | notion.com/templates/guided-workspace-self-audit-clean-up | A human checklist | Alive | Manual. Establishes that the pain is recognised and currently served by checklists. |

**No abandoned tool with a public post-mortem was found.** I searched specifically for discontinued
Notion cleanup/audit SaaS and found none. The honest reading is not "nobody tried and failed" — it is
that this category is too small to have produced a documented failure. Absence of a graveyard here is
absence of evidence, not evidence of a green field.

**Adjacent-category tools worth noting as design precedent, not competition:**

- **Vale** (docs prose linter) — deterministic, YAML-declared rules, fails CI. Adopted by Datadog,
  GitLab, Microsoft, Mozilla, Linux Foundation `[snippet]`. Free and open source.
- **dbt-doctor** (github.com/joachimhodana/dbt-doctor) — "Static analysis and health checks for dbt
  projects. Find missing docs, missing tests, schema drift risks, stale models, DAG maintainability
  issues, and CI quality gate failures." This is structurally the same product, aimed at dbt. Free.
- **Spectral / IBM openapi-validator / Zally** — declared-rule linters for OpenAPI. All free OSS.

---

## 4. The defensible gap

What no competitor does today: **certify the boundary of the scan**, and **fail a build**.
Everything else in the candidate list is contested, cheap to copy, or unsold.

Each candidate differentiator, assessed against observed buying behaviour:

| Differentiator | Uncontested? | Has anyone been observed paying for it? |
|---|---|---|
| **Determinism / reproducibility** | Yes against NoteRunway's AI tools and against Custom Agents. | **In adjacent categories, weakly.** Compliance and audit-tech vendors market re-executable, same-inputs-same-outputs workflows as a compliance requirement (floqast.com, workflowbuilder.io, typedef.ai — all vendor marketing, `[snippet]`). But the deterministic *linters* themselves — Vale, Spectral, dbt-doctor, Zally — are all free. Determinism is a property buyers *require* and do not *pay for* separately. |
| **Local execution, no data egress** | Yes against all hosted and LLM-mediated competitors. | **Yes, but bundled.** Semgrep sells at $30/contributor/month for Teams (semgrep.dev/pricing) and states plainly: "If Semgrep runs either locally or fully in your CI pipeline, then no, your source code never leaves your computer or your CI environment." Privacy is positioned as a differentiator. It is not what the invoice is for — the invoice is for security findings. Locality is a *qualifier* that unblocks the sale, not the value that closes it. |
| **Read-only by construction** | Yes. NoteRunway writes; Custom Agents write. This one is genuinely uncontested. | **No direct evidence.** No buyer was observed paying a premium for a tool's inability to act. Read-only lowers the approval barrier — it is a procurement accelerant, not a line item. |
| **Explicit declared rules over AI judgement (auditable, falsifiable)** | Yes. | **In regulated contexts, yes — as a requirement, not a purchase.** The buyers who insist on it are the regulated ones: financial services, accounting/audit, healthcare/HIPAA, and EU AI Act-scoped organisations `[snippet]`. Notably, Notion turns Claude agents **off by default for Enterprise and HIPAA workspaces** (notion.com/help/use-claude-agents-in-notion) — Notion itself concedes that the regulated segment will not accept the AI path. That is the segment where this property has force. |
| **CI integration, failing a build** | Partly. Coastal-Programs/notion-cli already emits exit codes 0/1/2, though not for structural rules. Custom Agents have no CI surface at all. | **Yes, and this is the strongest evidence in the table.** Vale, Spectral, and dbt-doctor exist because teams want prose and schema defects to fail a pipeline. But every one of them is free. The willingness is behavioural, not monetary. |
| **Coverage manifest — refuses to report clean over a partial scan** | **Yes. Completely uncontested.** No tool found produces one. NoteRunway silently truncates at 100 pages. Custom Agents cannot certify what they did not read. | **No.** No buyer was found paying for this, because no product offers it. It is a theoretically attractive property with zero market evidence. It is also the property most likely to be *invisible* to a buyer until it has already saved them. |

**The supporting technical fact that makes the coverage manifest non-trivial and therefore
defensible:** Notion's API makes complete enumeration genuinely hard, so a coverage manifest is real
engineering rather than a marketing claim.

- Rate limits: "an average of three requests per second" per connection, plus a per-workspace limit
  scaled to plan; 429/529 with `Retry-After`
  (https://developers.notion.com/reference/request-limits).
- A secondary limit of 1,000 requests per 5 minutes per workspace `[snippet]`.
- The search endpoint's own response schema carries `request_status: complete | incomplete` with
  `incomplete_reason: query_result_limit_reached`
  (https://developers.notion.com/reference/post-search). **Notion's API already tells callers when
  results are incomplete. No competitor surfaces this to the user.** Picking up a signal the platform
  is already emitting, and refusing to report clean when it fires, is defensible and cheap.
- There is no "get all pages" endpoint; developers use empty-query search, and recently added pages
  may not be indexed yet `[snippet]`.

---

## 5. Verdict

**NARROW.**

The product is viable only for a specific niche: **teams that must be able to prove a structural
claim about a Notion workspace to someone else.** Not teams that want a tidy workspace — teams whose
tidiness is subject to review. Concretely: regulated organisations (financial services, healthcare
and HIPAA workspaces, EU AI Act-scoped firms), and engineering teams that treat a Notion database as
production data feeding a downstream system.

**The wedge is R1 — the coverage manifest — combined with a CI exit code.**

R1 is the only rule of the eight that no competitor covers and that the dominant competitor
*structurally cannot* cover. An LLM agent cannot certify the boundary of what it did not read, and
Notion's own access model grants agents visibility per object rather than per workspace. Every other
rule in the catalogue is instructable to a Custom Agent today. R1 is not a feature the incumbent has
not got around to. It is a feature the incumbent's architecture forbids.

"Clean" is worthless without "and here is exactly what I looked at." Every competitor emits the first
half. NoteRunway silently truncates at 100 pages while presenting its findings as complete. That is
the product's entire reason to exist, and it is a narrow one.

The other five candidate differentiators do not carry the wedge. Determinism, locality, read-only
construction, and declared rules are qualifiers that unblock a purchase in regulated segments. None
of them was observed closing one.

### The strongest counter-argument to this verdict

**The niche that needs R1 may not use Notion for anything that matters, and the deterministic-linter
category monetises at zero.**

Two independent objections, both serious:

First, a selection argument. Organisations under audit or regulatory obligation tend not to place
audit-relevant records in Notion. They use systems with native referential integrity and native
audit trails. Notion's structural laxity is why it is pleasant, and teams that need rigour usually
leave rather than lint. If that is right, the wedge names a segment that is real but nearly empty —
the intersection of "uses Notion structurally" and "must prove it to a third party" may not be large
enough to support a product.

Second, a pricing argument, and it is the harder one. Every deterministic, config-declared,
CI-failing linter found in this sweep is free: Vale, Spectral, Zally, IBM's openapi-validator,
dbt-doctor, both notion-clis, and NoteRunway itself. The only comparable tool that charges — Semgrep,
at $30/contributor/month — sells *security findings*, where a miss has a named cost. Structural
tidiness has no such cost. The one Notion-specific tool found that charges anything charges $5/month
for link checking. The evidence says this category is one people build and give away, not one they
buy.

The wedge survives that objection only if R1 is reframed from "completeness" to "assurance" — the
same reframe that lets Semgrep charge for a linter. That reframe is unproven here, and nothing in
this sweep demonstrates a buyer has accepted it.

### Next action

Before writing code, test the pricing objection, not the technical one. The 72-hour API proof
described in `CONTEXT.md` will establish whether R1 is *buildable*. It will not establish whether
anyone pays. Those are separate risks, and on this evidence the second is the larger.

The falsifiable test: find five teams that hold audit-relevant or downstream-production data in
Notion and ask what they currently do to prove the workspace is complete and consistent. If the
answer is "a manual checklist" or "nothing, and it has bitten us," the wedge holds. If the answer is
"we moved that data out of Notion," the selection argument wins and the product should not be built.
