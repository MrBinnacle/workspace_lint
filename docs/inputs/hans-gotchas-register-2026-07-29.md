# INPUT: Hans Gotchas — Silent Failure and Anti-Pattern Register

> **Status: input artifact, not canonical.**
>
> Local copy of the Notion page at
> <https://app.notion.com/p/c8ffc02b54804fb3bd5d5c98f2f18ea8>, fetched 2026-08-18 through the
> **Notion MCP connector**. Page state as of 2026-07-29T19:34Z.
>
> **Evidence tier: documented, not proof.** ADR-0004 states an OAuth connector run "does not clear
> the REST path", which is why `docs/research/notion-live-probe.md` is documented-tier despite
> holding observations. Nothing in this file is a run of `workspace_lint` and nothing here closes #7.
>
> **One transformation from the source:** Notion `<mention-page url="…">` tags are rendered as
> plain URLs or omitted where the target adds nothing. No wording was changed. If the Notion page
> changes, re-fetch and replace this file wholesale, and note the new fetch date above.
>
> This file exists so agents can read the register without a Notion call. It does not govern. Where
> it disagrees with `CONTEXT.md` or `docs/adr/`, those win.

---

## Why this is in the repository

Fifteen numbered silent-failure modes of a real Notion workspace, each earned by a real failure and
each carrying its trigger, the underlying reality, the required action, and the session it was
discovered in. Four entries bear directly on this product:

- **G-008** is `workspace_lint`'s premise, observed: a map that rots independently of what it
  describes, with numbers — *a row claimed 80, a live census found 106* — and three lifecycle
  verdicts overturned by sampling in one day.
- **G-010** is the supersession rule that #73 arrived at independently.
- **G-011** is verification theater: when live state is unreachable, the record silently degrades to
  the artifact's own self-description and reads as verified. Same class as `CONTEXT.md` Principle 3
  and the repository's unverified-claim discipline.
- **G-007** is a stale boot-up document being the live instruction source while doctrine declared a
  different page canonical — #74's failure, observed in the wild.

Its own maintenance rule is worth reading against `docs/adr/`'s never-edit-in-place convention:
**"Do not delete entries when a gotcha is fixed. Mark the entry as Resolved with a one-line note
describing the fix and the date. The historical record is more valuable than a clean register."**

---

## Page callout

> This page exists to prevent Hans from repeating known silent-failure modes. Each entry is a real
> failure or near-miss surfaced during workspace operation. Consult this page before editing the
> surfaces it covers, and add a new entry every time a silent failure is discovered.

## How to use this page

- **Before editing** any surface or database listed below, scan the matching entry.
- **Before deciding** that a SQL query, autofill agent, or schema is broken, check whether a gotcha
  already explains the behavior.
- **After discovering a new silent failure**, add an entry using the template at the bottom of this
  page. Cite the artifact or session where it was discovered.
- **Pair with reasoning, not in place of it.** This page is a memory aid for Hans, not an exhaustive
  checklist. **Absence of a gotcha is not evidence that none exists.**

## When to consult

- Planning any change to the Workspace Database Directory, Quick Notes, Memory, Agent Digest, Agent
  Registry, or Inspection Photos.
- Creating or moving pages inside a wiki database.
- Building consolidated tables that mention multiple agents or pages.
- Decommissioning, replacing, or evaluating any database autofill custom agent.
- Diagnosing a SQL query that returns null where the UI shows data.

## Gotcha register

### G-001 — Workspace Database Directory URL fields are Notion mentions, not strings

**Trigger:** SQL queries against the Workspace Database Directory URL columns return null on every row.

**Reality:** The URL columns store rendered Notion page mention objects. The UI shows them correctly.
SQL string extraction does not see them as text values.

**Action:** Do not treat null SQL results as data loss or as a Directory integrity failure. Read the
Directory through `loadPage` or the rendered view when you need URL values. Do not overwrite mention
objects with raw URL strings — that breaks the UI rendering for the sake of SQL.

**Source:** Workspace Surface + Database Census — 2026-05 (drift item C1).

### G-002 — Wiki databases require a page parent, not a data source parent

**Trigger:** Creating or moving a page into a wiki database using `createPage` or `updatePage`.

**Reality:** Wiki databases (`isWiki: true` on `loadDatabase`) parent their pages by the wiki's
collection-view page (`wikiPageUrl`), not by the data source. Using `{ type: "dataSource" }` will
fail or misparent the page.

**Action:** Always use `{ type: "page", url: wikiPageUrl }` as the parent. Load the database first to
confirm `isWiki` and capture `wikiPageUrl`.

**Source:** Notion pages module documentation; reinforced in OI v6 candidate §6.

### G-003 — Quick Notes lacks a Last Edited Time property

**Trigger:** Any logic that filters, sorts, or summarizes Quick Notes by recency or staleness.

**Reality:** The Quick Notes schema does not include a Last Edited Time column. Recency filters
silently return empty or incorrect results. Anything that previously claimed to summarize "recent"
Quick Notes was running on an absent field.

**Action:** Use Created Time as the temporal field, or add a Last Edited Time property to the schema
before any recency-dependent workflow is built. Treat any prior recency-based output from this
database as suspect.

**Resolved:** 2026-07-17 — Last Edited Time property added. Recency logic is valid from this date
forward only; the column has no history before it existed, so prior-period staleness questions still
fall back to Created time and Date Last Reviewed.

### G-004 — Inspection Photos autofills have inverted cost-value math

**Trigger:** Reviewing the 9 database autofill custom agents for decommission alongside the broader
fleet.

**Reality:** Five autofills run on Inspection Photos: Caption, NHIE Topic, Defect Noted, System Type,
Defect Severity. Inspection workflows generate high row volumes with per-row classification needs
that Hans-on-demand cannot reasonably absorb. The credit cost of these autofills is justified by the
volume; the credit cost of doing the same work interactively in Hans sessions is higher.

**Action:** Recommend **Keep** for all five Inspection Photos autofills during fleet decommission.
Recommend **Replace with Hans on-demand** for the four lower-volume autofills. Do not apply blanket
decommission to all 9.

**Flag (2026-07-17):** the volume premise is stale for one of the five — Inspection Photos took 0 new
rows since March 2026 (444 total, frozen archive per Directory census). The Defect Noted autofill's
instructions page was also trashed as a side effect of a select→checkbox schema repair the same day
(see G-013). Recommend ratifying Keep-and-repair vs. Retire before any fix is spent on it.

### G-005 — Memory and Agent Digest go cold the moment the fleet is decommissioned

**Trigger:** Any sequence that disables the Notion AI fleet without first installing Hans as the sole
writer to Memory and Agent Digest.

**Reality:** The fleet is the current source of writes. Disabling triggers stops those writes. If
sole-agent OI is not installed first, both databases continue to be readable but stop receiving
updates, **and any consumer that trusts them will silently drift.**

**Action:** Install the v6 sole-agent OI before executing decommission. Then update Agent Registry
status fields. Then disable triggers in the UI. Do not reorder.

### G-006 — Mention text inside table cells can render blank even when the URL is correct

**Trigger:** Building consolidated maps, registers, or inventory tables with `<mention-agent>` or
`<mention-page>` cells.

**Reality:** When a mention tag is placed inside a table cell with empty inner text, the URL is
preserved in source but the visible label can render as a blank cell. The link is present but
invisible.

**Action:** Always include explicit inner text on mention tags inside table cells. Verify the
rendered table after creation; if cells appear blank, edit the source to add inner text rather than
assuming the URL was lost.

### G-007 — Active instruction wiring can diverge from what doctrine pages claim is live

**Trigger:** Any doctrine consolidation, cutover, retirement, or agent-configuration change; any
session where the loaded instruction source contradicts what the page hierarchy says is canonical.

**Reality:** The runtime loads whatever page is actually pinned as the long-term instruction source —
**not the page doctrine declares canonical.** On 2026-06-09, the retired fleet-era OI v6 page was
still the active instruction source for live sessions, while its declared successor sat archived and
deleted on a custom agent's instruction slot. Additionally, a 2026-06-03 breadcrumb claimed that
agent's disabled trigger and dead fleet permissions had been removed; direct inspection on 2026-06-09
showed both still present.

**Action:** After any doctrine cutover: (1) verify in a fresh session which page actually loads as the
active instruction source; (2) load the agent configuration and confirm trigger/permission changes
landed. **Treat breadcrumbs and cutover notes as claims, not evidence.** Never trash a doctrine page
until its successor is confirmed wired into the live runtime.

**Source:** 2026-06-09 instruction-tree review; Drift Log entry DRIFT-OI-WIRING-2026-06-09.

### G-008 — Directory map rot: rows drift silently from the ground truth they claim to describe

**Trigger:** Reading any Directory row as fact (row count, lifecycle, known issue); issuing any
lifecycle, deletion, or prune verdict; planning a structural audit or bulk refactor.

**Reality:** The Directory is a live database inside the territory it maps, so it rots independently
and without signal. On 2026-06-09 the CC Tools row claimed 80 rows; **a live census found 106** with a
fully populated core, overturning a prune verdict. **Three deletion/prune verdicts were overturned by
content sampling in a single day** (Memory, Findings, CC Tools). **A Directory row is never evidence
about its own database.**

**Action:** Treat Directory rows as claims to be reconciled, not evidence. Before structural audits,
bulk refactors, or any lifecycle verdict, load the workspace-cartography protocol and follow its
sampling gate: no downgrade or deletion verdict without sampling content this run; sync the Directory
row of any database touched, in the same run; stamp Last Verified only on rows whose ground truth was
actually checked.

**Source:** 2026-06-09 eight-pass workspace refactor session.

### G-009 — Data source URLs derived from createPage or row results are not data source URLs

**Trigger:** Any `querySql` call that uses a data source URL held from session memory, a `createPage`
result, or a row's `url` field.

**Reality:** `createPage` returns the page (row) URL, not the data source URL. The data source URL is
a distinct identifier only returned by `loadDataSource` or `loadDatabase`. Holding the page URL and
passing it to `querySql` as a table name produces "data source not found" with no further
explanation.

**Action:** Always derive data source URLs from a live `loadDatabase` or `loadDataSource` call
immediately before `querySql`. Never pass a page/row URL to `querySql` as a table name.

### G-010 — Preservation bias keeps workspace representations alive after the territory moves

**Trigger:** A live external artifact — repository, issue tracker, executable system, filed claim, or
other territorial source — has become canonical, while a Notion page, registry row, draft bundle,
audit, or mirror still describes or manages the same function.

**Reality:** **Preservation is not neutral.** Stale representations continue to appear in search,
imply authority, attract maintenance, and bias future sessions toward obsolete architecture. Archive
placement and historical interest do not justify continued existence when version control, source
history, or Trash already preserves rollback. The workspace should retain only what it uniquely
owns: a consequential cross-territory decision, evidence unavailable at the canonical source, active
control, or a minimal pointer needed for navigation.

**Action:** Run a supersession test whenever territorial ownership changes or a replacement artifact
ships: (1) name the canonical owner; (2) ask what concrete capability would be lost if the workspace
representation disappeared; (3) extract any unique decision or evidence to its proper existing home;
(4) replace navigation needs with a pointer; (5) trash the mirror, stale audit, duplicate registry
row, or completed intake. **Do not keep a page merely because it is accurate history.**

**Source:** 2026-07-10 `MrBinnacle/skills` + `skill-harness` workspace-role audit and cleanup.

### G-011 — Verification theater: unreachable live state silently degrades to the artifact's self-description

**Trigger:** Any verify-against-source-of-truth step where the live artifact cannot actually be
fetched this run — private repo, dead link, or a source not connected to the runtime.

**Reality:** When live fetch fails, the path of least resistance is a quiet fallback to the artifact's
own summary, a screenshot, or session memory — **producing a record that reads as verified but is
not.** This violates the prime directive ("the record may never outrun the evidence") through the
tooling gap rather than through intent, and it is invisible afterward: the record carries a confident
anchor that was never read from live state.

**Action:** If live state is unreachable, the record must carry an explicit marker: *"unverified as of
[date]; evidence actually inspected: [what]"*. **Never stamp a verification anchor (commit/HEAD,
counts, dates, visibility) that was not read from live state in the current run.**

**Source:** 2026-07-12 fresh-eyes review of the Receipts to Leverage skill.

### G-012 — Cross-database page moves pollute the destination schema and its views

**Trigger:** Any `updatePage` call that moves a page between data sources.

**Reality:** The move copies the source data source's properties into the destination schema. Name
collisions arrive suffixed (a second status property landed as "Status 1") and silently shadow the
destination's real property — property writes then fail with invalid-option errors that look like
schema bugs. The stray properties are also injected into the destination's view `displayProperties`,
so a first-pass schema repair fails validation because a view still references the strays.

**Action:** After any cross-database move: (1) `loadDataSource` the destination and diff the schema
against its known-clean property list; (2) delete stray properties and reset polluted view
`displayProperties` in the SAME `updateDatabase` call; (3) verify the returned configuration is
clean; (4) only then write properties on the moved page.

**Source:** 2026-07-17 private-credit graduation session — moving one Quick Note into Strategic
Resources dragged five properties into the schema and broke its Default view.

### G-013 — Property-type changes can trap a bound autofill agent's instructions page in Trash

**Trigger:** Any `updateDatabase` call that changes the type of a property listed in an autofill
agent's `fillPropertyNames`.

**Reality:** Notion invalidated the agent's linked instructions page after a select→checkbox
conversion — `loadPage` still returns the last-known content but tags the page `deleted`, and
`updatePage` fails with "Cannot update deleted pages." `unarchivePages` returns success with no error
but does not restore a true Trash deletion. **No restore-from-trash function is exposed to the
runtime — only the user can restore it via the Notion UI.**

**Action:** Before changing the type of a property any autofill agent fills, check whether the fill's
cost justification still holds. If the change proceeds, check the agent's `instructionsPageUrl` via
`loadPage` immediately after for a `deleted` tag. If present, do not rely on `unarchivePages`; tell
the user the page needs restoring from Trash.

### G-014 — Hans-native "skills" are Notion pages, not entries in the sandbox's skill catalog

**Trigger:** Any call to `connections.skills.loadSkill({ name: … })` for a Hans-native protocol.

**Reality:** The sandbox's skills module ships a fixed catalog. Hans-native protocols living in the
Skills Library are ordinary Notion pages; they were never registered in that catalog. `loadSkill`
returns "Skill not found" for every one of them, every time — not a transient failure. **The word
"skill" is shared by two unrelated systems**, which is what makes this fail silently as a
plausible-looking tool call.

**Action:** Load any Hans-native protocol via `loadPage` on its page URL, or via the client's
skill-activation action. Never via `connections.skills.loadSkill`. **Mechanism over semantics.**

### G-015 — Deleting database icon fields can silently retain the icon

**Trigger:** Removing a database, data source, or form-view icon through a configuration edit.

**Reality:** Deleting the optional `icon` field can return without error while the existing icon
remains unchanged.

**Action:** Verify the returned database configuration. If the old icon remains, replace it explicitly
with a known-valid gray Notion icon path rather than retrying deletion. **Treat the returned
configuration, not the accepted edit, as ground truth.**

## Adding a new gotcha

Use the next available G-### identifier. Each entry must include:

- **Title.** One line. Names the failure mode, not the symptom.
- **Trigger.** The exact situation in which this gotcha applies. If a future Hans is reading this
  register without the surrounding context, what should make this entry fire?
- **Reality.** What is actually true, including any non-obvious behavior or data shape.
- **Action.** What to do, what not to do, and any required ordering.
- **Source.** The page, query, session, or audit where this was discovered.

**Do not delete entries when a gotcha is fixed.** Mark the entry as **Resolved** with a one-line note
describing the fix and the date. **The historical record is more valuable than a clean register.**
