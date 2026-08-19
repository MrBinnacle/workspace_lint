# Non-Notion tool fit — 2026-08-19

The current slice proves a narrower product than the original "Notion workspace linter": a local,
read-only verifier that refuses to make a clean claim when its declared input frame was not actually
reached. That shape is not intrinsically Notion-specific. The valuable primitive is **declared-scope
coverage plus deterministic structural findings**.

This note ranks tools other than Notion that the project is practically begging to target if the goal
is to solve painful customer problems with a sharper willingness-to-pay story.

## Ranking

| Rank | Tool / surface | Why it fits this codebase | Customer pain that is easier to sell than Notion tidiness | Fit verdict |
| --- | --- | --- | --- | --- |
| 1 | **Jira Cloud** | Issue keys, issue links, versions, components, statuses and changelogs are structured enough for deterministic checks. Atlassian documents a broad REST API surface and first-class issue link resources. | Release, compliance and delivery claims live in Jira. Broken traceability has a named cost: failed audits, missed dependency handoffs, and release-risk meetings. | Best commercial pivot. |
| 2 | **Linear** | Linear exposes Issues, Comments, Documents, Projects, Cycles, Labels, Users and SLAs through API/webhooks, which maps cleanly to declared roots and cross-object rules. | Fast teams trust Linear as the source of execution truth, but drift appears in labels, project membership, stale cycles, orphaned documents and missing links to code. | Best developer-first wedge. |
| 3 | **GitHub Issues / Pull Requests / code scanning** | GitHub already accepts SARIF uploads and exposes issues, pull requests and code-scanning alerts through APIs. The repository can reuse its SARIF/static-analysis framing directly. | Engineering orgs already pay for CI failures. The product can become a "work graph integrity check" that blocks merges or releases when required issue, PR, alert or doc links are missing. | Best distribution path. |
| 4 | **Slack** | Slack exposes conversation history and threads by channel with explicit scopes, but complete export/search is plan- and permission-shaped. | Important decisions decay into untracked chat. The valuable claim would be not "summarize Slack," but "which declared channels/threads were covered, and which decisions lack durable links." | High pain, weaker deterministic boundary. |
| 5 | **Confluence / SharePoint** | They resemble Notion document stores, but much of the pain collapses back into stale-page/document-control checks. | Better enterprise budget than Notion, but the product risks becoming document governance instead of a sharp coverage prover. | Plausible later, not the first pivot. |

## 1. Jira Cloud is the strongest non-Notion target

Jira is the most natural place to sell the current product shape because it turns "workspace tidiness"
into **traceability assurance**. A Jira adaptation should not begin as a general Jira cleaner. It
should begin as a local CI-style verifier over declared projects, filters, releases or epics.

High-value deterministic checks:

- release versions with unresolved blockers or missing owner fields;
- epics whose child issues do not satisfy a declared workflow contract;
- issues in release scope with missing links to pull requests, specs, incidents or test evidence;
- issue links pointing to inaccessible, deleted or cross-project objects outside the declared boundary;
- status/category transitions that violate a declared lifecycle;
- changelog coverage: whether the scan actually reached enough history to support an audit claim.

Why customers would care:

- Jira is often the audit and release record, not just a collaboration space.
- The buyer can name the cost of a false green: a release gate passed without evidence, a compliance
  control failed, or a dependency was missed.
- A declared denominator is normal in Jira: project, board, JQL filter, fix version, component or epic.

Product phrasing:

> CI for Jira traceability: prove every release issue was reached, linked and evidence-backed — or fail
> with the exact coverage gap.

API note: Atlassian documents Jira Cloud REST API v3 endpoints, including issue resources, issue link
types, issue links, permissions, pagination and status codes at `developer.atlassian.com/cloud/jira/platform/rest/v3/intro/`.

## 2. Linear is the best developer-first target

Linear is a strong fit if the desired market is smaller, faster, engineering-led teams rather than
enterprise compliance. Its object model is modern, strongly typed and close to the current rule catalog:
Issues, Comments, Documents, Projects, Cycles, Labels, Users and SLAs all admit structural checks.

High-value deterministic checks:

- project issues missing required labels, owners, milestones or code links;
- stale cycles with unresolved issues and no project update;
- Linear Documents referenced by issues but archived, inaccessible or not updated since a declared date;
- duplicate issue titles inside a team/project where a duplicate creates triage confusion;
- SLA issues without owner/comment activity inside the promised window;
- GitHub/Linear mismatch: PR references a Linear issue that is not in the expected team, state or project.

Why customers would care:

- The pain is operational: launch plans, customer commitments and triage queues go stale.
- The output can live naturally in CI or a scheduled local run.
- Linear's audience already tolerates developer tooling and API tokens.

Product phrasing:

> Linear integrity checks for launch teams: fail stale, orphaned or unlinked work before planning and
> release meetings turn into manual reconciliation.

API note: Linear documents API and webhook support for issues, comments, issue attachments, documents,
projects, project updates, cycles, labels, users and issue SLAs at `linear.app/docs/api-and-webhooks`.

## 3. GitHub is the easiest distribution wedge

GitHub is not just a source-code host for this project; it is a better-shaped home for the product's
existing static-analysis vocabulary. The repository already reasons in terms of SARIF, exit codes,
findings, baselines and CI. GitHub lets the product meet buyers where they already accept automated
failure.

High-value deterministic checks:

- every PR in a release branch has an issue link, reviewer, passing check and attached risk label;
- every open code-scanning alert above a declared severity has an owner, issue or suppression reason;
- every issue marked `blocked` links to a live blocker and every blocker reciprocates;
- stale accepted suppressions or ignored alerts exceed a declared age;
- docs/spec files with checked claims have corresponding CI evidence.

Why customers would care:

- Developers already run tools in GitHub Actions and accept red/green gates.
- SARIF ingestion gives a native result format for many findings.
- The value can be sold as release hygiene, security evidence and audit readiness rather than content
  organization.

Product phrasing:

> Work graph linting for GitHub: validate the issue/PR/security-evidence graph before merge or release.

API note: GitHub documents REST APIs for issues and code scanning; code scanning supports retrieving,
updating and uploading analysis results, including SARIF-oriented workflows, at `docs.github.com/rest/code-scanning/code-scanning`.

## 4. Slack has the loudest pain but a weaker first product shape

Slack is where many decisions happen, so customer pain is obvious: decisions vanish, links rot, and
people ask the same questions repeatedly. But Slack is a harder first target because the most tempting
product is semantic summarization, which would violate this repository's core discipline. The safe
version is narrow and structural.

High-value deterministic checks:

- declared decision channels were scanned to a specific timestamp and pagination boundary;
- threads tagged with a decision marker link to a durable issue/spec/page;
- incident channels have linked postmortems;
- customer-escalation threads have a linked owner and ticket;
- referenced GitHub/Jira/Linear objects still exist and are accessible.

Why to defer:

- Search/export completeness and history access are plan-, token- and scope-dependent.
- The highest-value pain is semantic, while this project is strongest when it avoids semantic claims.
- Slack should be a connector in a GitHub/Jira/Linear verifier before it becomes the primary product.

API note: Slack documents `conversations.history` as returning a portion of message events for a
conversation, with token scopes controlling accessible conversations, at `docs.slack.dev/reference/methods/conversations.history`.

## 5. Confluence and SharePoint are plausible, but too close to the Notion trap

Confluence and SharePoint have better enterprise budgets than Notion, but they pull the product back
toward generic document governance: stale pages, missing owners, broken links and duplicated canon.
Those are real pains, but the project has already learned that "tidiness" is hard to price unless it
is tied to an external obligation.

If pursued, the wedge should be **controlled-document evidence**, not knowledge-base cleanup:

- declared policy pages have owners, review dates and approval evidence;
- pages cited by audits are still accessible and current;
- canonical documents have no competing active canonical sibling;
- evidence links in Jira/GitHub tickets resolve to approved document versions.

Confluence/SharePoint should therefore be downstream evidence stores for Jira/GitHub release and audit
checks, not the primary first target.

## Recommended product move

Do **not** build a second document-store linter. Build a cross-tool **traceability coverage verifier**,
starting with Jira or Linear and using GitHub as the output/distribution layer.

The strongest sequence is:

1. **Jira Cloud release traceability**: declared fix version or JQL filter as root; verify issue links,
   owners, required fields, unresolved blockers and evidence links.
2. **GitHub PR/SARIF output**: publish findings where teams already gate work.
3. **Linear adapter**: same engine for developer-first teams with projects/cycles as roots.
4. **Slack connector**: only for decision-thread evidence linked into Jira/Linear/GitHub.
5. **Confluence/SharePoint connectors**: only as evidence targets for controlled documents.

## Why this is more valuable than the Notion-first framing

- The buyer has a budgeted reason to care: release assurance, audit traceability, security evidence or
  customer commitment tracking.
- The declared denominator is natural: release, project, epic, cycle, repository, branch or filter.
- The product's hardest-won idea — never pass on partial coverage — matters more when the output gates
  a release than when it comments on workspace hygiene.
- The CLI can stay local and read-only while producing a materially useful artifact.

## Non-goal guardrails for any pivot

- Do not become an AI summarizer.
- Do not infer correctness from prose.
- Do not sell "all work is covered" unless the user declared the full denominator and the API permits
  proving it.
- Do not start with automatic repair.
- Do not score team health. Count structural facts, evaluate declared rules, and make coverage explicit.
