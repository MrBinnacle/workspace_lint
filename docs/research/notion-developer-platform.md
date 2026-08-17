# Notion Developer Platform: Workers, the CLI, and the credential models

Closes the research half of issue #27. All sources fetched 2026-08-17. Every claim below carries the URL it came from; where a page is silent, the silence is recorded as silence and not converted into a negative, per ADR-0007 decision 4 rule 2.

**Method note.** Two of #27's six questions were specified to be answered by observation against the fixture. Neither was, and one of them no longer needs to be — see §2. Nothing in this file is an observation. It is all documentation, and §9 lists what that leaves open.

---

## 1. What shipped, and when

Source: <https://www.notion.com/releases/2026-05-13>, <https://www.notion.com/blog/introducing-developer-platform>

Announced 2026-05-13. Named capabilities:

| Capability | Status at announcement | Notes |
| --- | --- | --- |
| **Workers** | Public beta | Notion-hosted runtime. Business and Enterprise plans. |
| **Notion CLI (`ntn`)** | Shipped | All plans. Authenticates, manages data, deploys Workers. |
| **Database Sync** | Beta | External data into Notion databases, powered by Workers. |
| **Custom Agent Tools** | Beta | Workers as deterministic tools for agents. |
| **Webhook Triggers** | Beta | External events trigger Notion workflows. |
| **External Agents API** | **Alpha** | Names Claude, Codex, Decagon as partner agents. |
| **Agent SDK** | **Alpha** | Embed Notion Agents elsewhere. |

**Correction to an earlier statement in this project.** The launch blog was read as "free through August". The release note is more precise: Workers are *"free during beta, then runs on Notion credits starting August 11, 2026."* That date has passed. Workers are billed now.

`docs/research/name-and-legal.md` §337 already recorded `ntn` as Notion's official CLI. Nothing else in `docs/research/` mentions any of the above.

---

## 2. Question 1 — can the scan be read-only? Answered per credential, and one answer is decisive

Source: <https://developers.notion.com/reference/capabilities.md>, <https://developers.notion.com/guides/get-started/personal-access-tokens.md>

### Internal integration — yes

**[doc admission]** Capabilities are granted in three groups. Content capabilities are **Read content**, **Update content**, **Insert content**, granted independently:

> "Read content: This capability gives a connection access to read existing content in a Notion workspace. For example, a connection with only this capability is able to call Retrieve a database, but not Update database."

An integration holding only *Read content* satisfies Principle 7.

### Personal access token — **no, and this rules the PAT out**

**[doc admission]** A PAT offers exactly two capability options at creation, quoted verbatim:

> 1. **Notion API** — "Read, create, update, and search content; read and create comments; and read supported user information through Notion's REST API."
> 2. **Workers** — "Deploy and manage Notion Workers with the Notion CLI."

There is no read-only variant. The API capability is a single bundle that includes create and update.

`CONTEXT.md` Principle 7 reads: **"Read-only means read-only. The process requests no insert or update capability."** The operative verb is *requests*, not *uses*. A PAT requests update capability by construction, so a scan running under a PAT violates Principle 7 at the credential layer regardless of which endpoints the code ever calls.

**Finding: the PAT is ruled out by a product boundary, not by a preference, and not by anything the fixture test would have measured.** ADR-0009 made it a gated secondary mode pending observation. The gate is closed by documentation instead, and closed harder than that ADR anticipated.

**Consequence for #27's own scope: the PAT fixture run in its Definition of Done is no longer decision-relevant.** It would establish reach for a credential the product cannot use. Recommend dropping it rather than running it.

---

## 3. Question 3 — does a Worker see anything an external integration cannot? No

Source: <https://developers.notion.com/workers/guides/api-client.md>

**[doc admission]** A Worker's API access is entirely a function of the token it carries. Three cases:

| Context | Credential | Access |
| --- | --- | --- |
| Custom Agent tool | `NOTION_API_TOKEN` set by the platform | "the client has the same permissions as the Custom Agent" |
| Sync, webhook, local | Personal access token | "acts as you and uses your page permissions. You don't need to connect it to each page." |
| Sync, webhook, local | Internal integration token | "acts as a bot, with access limited to pages explicitly connected via the Connections menu." |

Both non-agent credentials are the same two available to code running anywhere. Being hosted inside Notion confers no additional read.

**Finding: ADR-0002's Revisit-if has NOT fired.** It reopens on *"an endpoint that enumerates a connection's grant, or search documented as exhaustive."* Neither appeared. The `guides/get-started/overview` page describes no endpoint listing what any token can reach, for any connection type. The declared-root model stands, and so does everything built on it.

**A second finding follows, and it is the useful half.** Because a Worker accepts an internal integration token, **a Worker can be read-only** — the Principle 7 problem in §2 belongs to the PAT, not to the Worker.

---

## 4. Question 4 — what does a Worker emit? Not an exit code

Source: <https://developers.notion.com/workers/get-started/overview.md>

**[doc admission]** *"Notion Workers are small Node/TypeScript programs that extend Notion. You write code, deploy it with the Notion CLI, and Notion hosts and runs it for you."* Runtime: *"Your code runs in a sandboxed Node.js environment."*

Three trigger and output shapes:

| Shape | Trigger | Output |
| --- | --- | --- |
| **Sync** | Schedule, default 30 minutes | Writes results to Notion databases |
| **Tool** | Invoked on demand by a Custom Agent | Returns a function response to the agent |
| **Webhook** | HTTP event from an external service | Handler runs asynchronously |

**DOCS SILENT** on exit codes, failure status, or any run result an external system can read. Recorded as silence; not asserted as absence.

**Finding: ADR-0008's exit byte has no home in a Worker**, and the two shapes that could carry a report each collide with a stated boundary:

- **Sync** writes the coverage manifest into a Notion database. That is the durable, auditor-facing artifact the product's audit vocabulary points at — and it requires **Insert content**, which Principle 7 forbids requesting. The collision holds even when the write targets a report database the tool owns, because the capability is held at the token, not at the target.
- **Tool** returns to a Custom Agent, which is an LLM layer. `CONTEXT.md` Non-goals: *"A GUI, hosted service, or LLM layer."* ADR-0001 separately fixes this product as a deterministic linter.

Neither shape is available without the operator reopening a boundary.

---

## 5. Question 5 — pricing, with a date

Sources: <https://www.notion.com/help/understand-pricing-for-workers>, <https://www.notion.com/releases/2026-07-24>

- Free during beta on Business and Enterprise, including Business trials.
- **Billed on Notion credits from 2026-08-11.** Five days before this file was written.
- Credits are a Business/Enterprise add-on at **$10 per 1,000**, shared workspace-wide, reset monthly.
- Workers consume credits **per run**, and *"the number of credits per run can vary depending on how much work the Worker does, like how long it runs or how much processing it needs."*

**Finding, and it is the strongest commercial argument in this file: the credit meter is adverse to this specific product.** Cost scales with run duration and work done. A linter whose entire value proposition is *reading everything that was declared* is, on this meter, a product that charges the customer more the better it does its job. A thorough scan is an expensive scan, repeated on a schedule, on a meter the workspace admin watches. A local CLI's scan costs nothing but rate limit.

This is not fatal on its own — a nightly scan may be cheap in absolute terms, and no measurement exists. It is adverse in *shape*, which is worse than adverse in magnitude, because it does not improve as the product improves.

---

## 6. Question 6 — the competitive picture

`docs/research/competitive-landscape.md` §270 places the wedge at *"R1 — the coverage manifest — combined with a CI exit code."* §4 of the same file recorded that Notion's API already signals incomplete results and no competitor surfaces it.

The platform does not contest the wedge. It has no coverage artifact, and §3 above confirms it grants no enumeration capability. What it changes is the surface economics: the CLI slot is now occupied by a first-party tool (`ntn`), which `name-and-legal.md` §337 already flagged as a naming-confusion risk, and which is now also a distribution risk — a developer looking for a Notion CLI finds Notion's.

The External Agents alpha is the item worth watching and is out of this sweep's scope. It names Claude Code as a partner agent, which is a different product shape entirely.

---

## 7. A finding that lands on ADR-0009, merged the same day

ADR-0009 decision 1 states that under an internal integration *"the grant is held by a non-human identity"* and *"does not move when a person's employment does."*

**[doc admission]**, from the capabilities reference:

> "A connection's capabilities will never supersede a user's. If a user loses edit access to the page where they have added a connection, that connection will now also only have read access, regardless of the capabilities the connection was created with."

The documented case is loss of **edit** access, which degrades the connection to read. **DOCS SILENT** on what happens when the granting user loses *all* access to the page or leaves the workspace.

**So ADR-0009 decision 1's independence claim is not established.** It is not refuted either — the docs do not say the connection survives, and they do not say it dies. The claim was asserted where the documentation is silent, which is the inference ADR-0007 decision 4 rule 2 exists to forbid.

The comparative ranking in ADR-0009 survives, on narrower ground. A PAT's scope is coupled to one principal wholesale and the coupling is **documented**: *"if the creator loses access to a page or leaves the workspace, the PAT loses that access too."* An integration's coupling is per-page, bounded by whichever user connected that page, and its extent is unknown. Bounded-and-unknown is better than wholesale-and-documented. It is not independence.

**This is a new failure shape for this project, and #25 should hear about it.** The two prior cases were ADRs contradicting a file already in `docs/research/`, catchable by grep. This one was not in the repository at all. ADR-0009 made a claim about the capability model without opening the capability reference — the generalisation of ADR-0007 rule 1 from *per-endpoint page* to *per-model page*.

---

## 8. Recommendation

**Keep the local CLI as the primary surface for v0.1. Do not build on Workers. Do not use a PAT at all.**

1. **The PAT is ruled out.** Principle 7, decided by documentation, no test required.
2. **Workers is technically viable and strategically premature.** It can be read-only via an integration token, but both of its output shapes reopen a stated boundary, it has no exit byte, it is Business/Enterprise only, and its cost structure penalises coverage.
3. **Revisit Workers only if the demand test names the auditor.** If respondents describe an artifact they must show a third party, a scheduled sync writing a standing conformance record into Notion is the right shape and Principle 7's write clause is the thing to renegotiate — deliberately, in an ADR, not incidentally. That decision belongs to issue #29.
4. **Correct ADR-0009 by supersession, not by edit**, if the operator judges §7 material. The comparative conclusion holds; the independence sentence overstates it.

---

## 9. What remains unobserved

Nothing in this file was observed. Specifically:

- No PAT has been minted or run. §2 rules it out on documented capability, which is sufficient for the decision and is **not** evidence about what a PAT reaches.
- No Worker has been deployed. Every claim in §3, §4 and §5 is documentation.
- The operator's plan tier is unverified. If the fixture workspace is not Business or Enterprise, the Worker branch is untestable by this project regardless of any decision above.
- §7's silence is a silence. Whether an integration survives its granting user's departure is answerable only by a fixture mutation: connect a page as user A, remove user A's access, re-read as the integration.

## 10. Documented silences added to the index

Extending the index in `notion-api-documented.md` §6:

| # | Silence | Section |
| --- | --- | --- |
| 22 | Whether an integration retains **read** access when the granting user loses all access or leaves | §7 |
| 23 | Whether a Worker exposes any externally-readable run status or failure code | §4 |
| 24 | Whether PAT capabilities can be narrowed after creation | §2 |
