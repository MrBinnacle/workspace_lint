# INPUT: workspace-cartography v1.4.0

> **Status: input artifact, not canonical.**
>
> Local copy of the Notion page at
> <https://app.notion.com/p/764d6c588e714e46990701bcab59ab45>, fetched 2026-08-18 through the
> **Notion MCP connector**. Page state as of 2026-07-17T22:39Z. Version 1.4.0, first filed
> 2026-06-09.
>
> **Evidence tier: documented, not proof.** ADR-0004 states an OAuth connector run "does not clear
> the REST path". Nothing here is a run of `workspace_lint` and nothing here closes #7.
>
> **One transformation from the source:** Notion `<mention-page>` tags rendered as names or URLs. No
> wording changed. Re-fetch and replace wholesale if the page changes.
>
> Does not govern. Where it disagrees with `CONTEXT.md` or `docs/adr/`, those win.

---

## Why this is in the repository

This is `workspace_lint`'s coverage-manifest discipline, derived independently against a live Notion
workspace, roughly two months before this repository's equivalent ADRs. It contains, in its own
vocabulary: an evidence hierarchy, a sampling gate before any verdict, an instrument-boundary
contract, a supersession rule, cost scoping, and a version log.

Four things bear directly on open issues:

- **"A Directory row is never evidence about its own database"** is the general form of #73 — a
  state file is never evidence about the thing it describes.
- **The instrument-boundary table** is the structure `checkpoint.md` lacks. It conflates all four
  instruments, which is why trimming it needs judgement and why it re-accretes.
- **The map-lives-inside-the-territory distinction** is the boundary condition on #73's
  delete-or-generate recommendation: a repository can regenerate, a Notion workspace cannot.
- **The supersession rule** — *"Accurate history alone is not a keep verdict"* — settles what to do
  with `checkpoint-archive.md`.

Page properties as fetched: Execution Tier `Autonomous Agent`; Logic Mode `Research (Verification)`;
Platform `Notion AI (Hans)`; Status `Active`; Last Updated 2026-07-10.

**Trigger description (verbatim):** "Load before structural audits, bulk refactors, deletion or
lifecycle verdicts, or whenever a Directory row contradicts observed reality. The spot-sync tier fires
on any run that changes a database's structure or bulk rows."

---

## First principles

1. **One map.** The Directory *is* the workspace map. Cartography never produces a second map
   artifact: no snapshot pages, no parallel trackers, no "workspace report" wikis. Output is exactly
   two things: corrected Directory rows and a chat delta report.
2. **The map lives inside the territory it maps.** A codebase map is regenerated from files at will;
   this map is a live database that rots independently of what it describes: row counts go stale,
   Known Issues outlive their fixes, lifecycle verdicts fossilize. Cartography here is therefore
   **reconciliation, not generation**.
3. **Evidence hierarchy.** Data-source query returns beat loaded configs, which beat page content,
   which beats Directory metadata, which beats session memory. **Lower layers are claims; higher
   layers are evidence. A Directory row is never evidence about its own database.**
4. **Three layers per territory entry:** **Registry** (existence, row count, lifecycle, known issues:
   the Directory row) · **Topology** (where it lives, what points at it: hub tree, inbound mentions
   and relations) · **Machinery** (schemas, views, relations, templates, autofill agents: the layer
   with recurring credit cost).
5. **Cost-scoped.** Credits meter per run. Always run the smallest scope that answers the actual
   question.

## Instrument boundaries: complementary, not overlapping

Each instrument answers one question. **Never write one's content into another:**

| Instrument | Owns | Not its job |
| --- | --- | --- |
| Directory | Current state: what exists, counts, lifecycle, known issues | History (Drift Log) · failure mechanics (Gotchas) |
| Gotchas register | How edits fail silently: mechanisms and workarounds | The current state of any surface |
| Drift Log | Incidents: what went wrong, when, root cause | Standing state; a resolved incident doesn't update a row |
| Breadcrumbs | Point-of-change provenance on document pages | Database rows: the report and Last Verified carry it |

**Map–territory boundary:** the Directory maps Notion only. Territory maps — Writ's
`docs/CODEBASE_MAP.md` (code-cartography) and graphify's knowledge graph — live in the territory and
are owned by their own skills. Reference them by pointer; never import or duplicate a territory map
into the workspace. Prefer the instrument that owns the domain; cross-reference only when one question
genuinely spans both.

## Scopes

| Scope | Trigger | Procedure |
| --- | --- | --- |
| **Spot-sync** (default) | This run touched a database: schema, views, bulk rows, deletion | Sync its Directory row in the same run: Row Count if cheaply known, Known Issue delta, Last Verified. **Never end a run with a known-stale row.** |
| **Domain sweep** | Work reshaped one hub or domain; an anomaly surfaced in one row | Census + config capture for that domain's databases only; reconcile those rows. |
| **Full census** | Bulk refactor landed · two or more stale rows found incidentally · explicit request · 90+ days since last full pass | Steps 1–6 below. |

## When NOT to run

- One odd number → spot-sync that row. A single stale count never justifies a full census.
- Surface untouched since its Last Verified, no anomaly → skip. **Re-verifying unchanged surfaces is
  Theater.**
- Territory work (writing, research, claims, strategy) that touches no structure → cartography stays
  holstered.

## Invocable command

`/supersession-sweep [scope]` is the manual execution command for this protocol.

- **No argument:** run a full workspace supersession sweep.
- **Scope argument:** accept a page, database, hub, project, or domain and run the smallest complete
  sweep covering it.
- **Execution contract:** this is not a report-only audit. Identify the live territorial owner, sample
  each candidate, extract any unique remainder to its existing proper home, trash high-confidence
  mirrors / stale audits / completed intake / duplicate registry rows, reconcile every Directory row
  touched, and report only deltas plus the Trash rollback set.
- **No confirmation loop:** ordinary Trash deletion is within standing autonomy. Stop only when
  canonical ownership or unique retained value cannot be established from available evidence.
- **Candidate discovery order:** start with explicit state markers (`superseded`, `replaced`,
  `migrated`, `absorbed`, `executed transfer`, `do not use`, archived + named replacement); then
  inspect consolidation pages that name their absorbed sources; then inspect completed intake rows
  whose downstream asset is live; only then broaden to semantic duplicate search. **Explicit markers
  nominate candidates but never replace content sampling.**
- **Reconciliation requirement:** verify the replacement or downstream asset is live, remove or
  rewrite inbound navigation pointers, recensus every affected data source, and update only those
  Directory rows. **A deletion batch without pointer and count reconciliation is incomplete.**

## Full census procedure

1. **Enumerate.** Dump every Directory row with all properties. **This is the *claim set*, not ground
   truth.**
2. **Census.** `COUNT(*)` per data source via SQL. Batch at most ~10 aggregate expressions per SELECT
   (the parser rejects wide aggregate lists). Run a per-property population census wherever a verdict
   will hang on it.
3. **Config capture.** Load each database: data sources, schemas, views, templates, attached autofill
   agents. Record machinery with recurring credit cost on the row (G-004).
4. **Relation graph.** From schema relation properties, build the edge list (source data source →
   target). Flag dangling targets (deleted data sources), relations expected two-way that aren't, and
   surfaces with zero inbound links: orphan *candidates*, pending the verdict gate.
5. **Verdict pass.** Apply the verdict rules below, per row. **Verdicts change only on evidence
   gathered this run.**
6. **Reconcile + report.** Update Directory rows (Row Count, Known Issue, Lifecycle Status, Last
   Verified) **for verified rows only**; the chat report carries deltas only. Unchanged rows are
   noise.

## Verdict rules: the sampling gate

| Signal | Wrong verdict | Correct move |
| --- | --- | --- |
| Low or stale row count on the Directory row | "Dead, delete" | Census it. **Directory counts are claims (CC Tools claimed 80; actual 106** with a fully populated core). |
| Sparse property population | "Schema rot, prune" | Sample rows. Sparse can mean in-progress migration, not rot. |
| No recent edits | "Abandoned" | Check inbound links and relations first: under-use is often an upstream architecture break, not death. |
| Empty database | "Delete-ready" | If navigation references it, it's a wiring question: park it pending the wiring decision. |

**Hard rule: no lifecycle downgrade and no deletion verdict without sampling content this run.**
Metadata, name, and age are never sufficient: **three verdicts overturned by sampling in a single day**
(Memory, Findings, CC Tools, 2026-06-09).

**Supersession rule:** when a live external artifact has become the canonical owner of a function, its
Notion representation is presumptively obsolete. Preserve the workspace artifact only if sampling
proves it owns unique cross-territory decisions, evidence unavailable at the canonical source, active
control, or a navigation pointer that cannot be replaced more simply. Otherwise extract the unique
remainder, replace navigation with a pointer if needed, and trash the mirror. **Accurate history alone
is not a keep verdict; version control, source history, and Trash already preserve rollback.**

**No bare tags on boundary cases:** any row leaving Active carries its evidence in Known Issue: the
verdict plus the one-line observation that justified it. **A lifecycle tag without its evidence is
unauditable.** Classify deterministically where observable facts decide it; spend judgment, and
sampling, only where facts don't.

## Known failure modes

Scan the Gotchas register before edits. Cartography-specific entries:

- G-001: URL-mention columns return null in SQL; load the row as a page to read them.
- Wide aggregate SELECTs fail to parse; split into ~10 expressions or fewer.
- Moving a page into a data source requires that data source loaded this session first.
- Canceled write calls can still land; verify artifact state before re-firing anything.
- Full-content replace on a page containing child `<page>` blocks trashes those children. The
  Directory lives on such a page; targeted edits only.

## Never

- Never create a parallel map artifact: page, database, or snapshot document.
- Never treat a Directory row as evidence about its own database.
- Never stamp Last Verified on a row whose ground truth wasn't checked this run.
- Never issue a deletion or lifecycle verdict from metadata alone.
- Never run a wider scope than the question requires.

## Version log

| Version | Date | Notes |
| --- | --- | --- |
| 1.0.0 | 2026-06-09 | Initial protocol, distilled from the 2026-06-09 eight-pass workspace refactor (full census → refactor → reconcile, three sampling-overturned verdicts). **Seeded by Writ's code-cartography skill; rebuilt reconciliation-first because the Notion map lives inside its own territory.** |
| 1.1.0 | 2026-06-09 | Adopted from code-cartography's supporting files: instrument-boundary contract, map–territory boundary rule, and evidence-with-verdict on boundary cases. **Rejected as non-transferable:** path-based deterministic classification (Notion has no stable paths; sampling gate stays) and OS-specific tooling gotchas. |
| 1.2.0 | 2026-07-10 | Added the supersession rule. |
| 1.3.0 | 2026-07-10 | Added `/supersession-sweep [scope]` as the persistent manual invocation contract. The command executes deletions and reconciliation; it never stops at a report. |
| 1.4.0 | 2026-07-10 | Iterated from the first live sweep: explicit supersession markers now drive candidate discovery, and deletion batches must reconcile inbound pointers plus live data-source counts. |
