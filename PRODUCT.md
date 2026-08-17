# Product

What this is for, who it is for, and what would make it not worth building. `CONTEXT.md` holds the vocabulary; this file holds the product. Both are canonical. `docs/inputs/prd-2026-08-16.md` is neither.

Written 2026-08-16 from the PRD plus seven research sweeps in `docs/research/`. Every claim below that came from a sweep names its file.

## What it does

Reads a declared set of Notion resources through the official API, and produces a report stating two things: which declared structural rules no longer hold, and exactly what the scan could not see.

The second half is the product. The first half is what makes the second half worth reading.

## Why the ordering is that way round

Two independent sweeps looked for a tool that refuses to report clean over an incomplete scan.

- `docs/research/competitive-landscape.md` surveyed Notion tooling. Notion Custom Agents can be instructed to perform seven of the eight v0.1 rules today — imperfectly and non-deterministically, but today. They cannot perform the eighth, and the reason is structural: an agent cannot certify the boundary of what it did not read, and Notion grants agents access per object rather than workspace-wide.
- `docs/research/static-analysis-prior-art.md` surveyed static analysis generally and recorded as a negative result: *no surveyed tool fails a build on partial analysis coverage by default.* A later sweep checked four tools at schema level — Semgrep, dbt, Great Expectations, Soda — and confirmed it. All four emit a non-execution signal. None binds the verdict to it.

SARIF carries per-result and per-artifact not-analysed primitives — `result.kind`, `invocation.executionSuccessful`, `invocation.toolExecutionNotifications`, `artifact.roles: analysisTarget` — but defines **no run-level coverage aggregate**. That is the narrow, verified gap. *(This corrects an earlier claim here that no SARIF object expresses analysis scope or coverage. It was refuted against `sarif-schema-2.1.0.json`. See ADR-0005 §6.)*

The gap is not specific to Notion. It is a gap in the field. State it precisely: what is unclaimed is making verdict validity a function of how much of a **user-declared** set was actually reached. That is a composition of two shipped behaviours plus a default flip, not an invention. Everything else in this product is available elsewhere, free, and improving without our effort.

The sharpest example is not in static analysis. Great Expectations computes `success_percent` over *evaluated* expectations rather than declared ones, so a suite in which half the expectations never ran can report 100%. The number is not incomplete. It is wrong.

The working tagline "CI for Notion workspaces" undersells this. The product is a coverage prover that also runs rules.

## Who it is for

**Primary: whoever must prove a structural claim about a Notion workspace to someone else.** Regulated organizations, and teams whose Notion databases feed production systems. The distinguishing trait is not workspace size or tidiness; it is that a wrong answer has a named cost and an audience.

**Named as likely, not established:** consultants auditing client workspaces. `docs/research/notion-user-pain.md` recommends this segment, because it is the only one where frequent testable pain and *behavioural* willingness to configure appear in the same person — one practitioner already hand-writes structural rules as Notion formulas. The counter-argument is live: a consultant billing hourly has an incentive against a tool that mechanizes billable hours, and the willingness case rests on two named individuals.

**Explicitly excluded:** anyone who wants the tool to decide what the workspace should mean. The product checks declared rules. It supplies no governance judgement.

**Ruled out for the configured rules:** solo, hobbyist, and small-team users. `docs/research/solo-segment-evidence.md` finds they do configure things they will use — naming conventions, formulas, buttons — but the dominant purchase is a template, and buying a template is paying *not* to configure. Their documented response to complexity is deletion, not tooling.

**Ruled out by capability:** technical operators. 6.5 million monthly downloads of `@notionhq/client`, and the one practitioner with a documented workspace cleanup wrote four scripts rather than buy anything. That segment writes the tool.

## The config file is the suspect, not the segment

`docs/research/solo-segment-evidence.md` names the mechanism: the policy file asks the user to declare their intended schema, and the instability of that schema is their actual complaint. The tool asks for the artifact whose absence is the problem.

Its own counter-argument is why this is a design finding rather than a stop: four independent artifacts attack four slices of this pain, which is the signature of a fragmented under-served market, not an absent one. The sweep could not separate "no demand" from "no demand at this configuration cost" without Reddit, which stayed unreachable across four attempts by two agents.

**Consequence for v0.1.** ADR-0001 recorded the configuration requirement as a paid cost — a first run "reports coverage and little else." That is now the wrong reading. The zero-config surface is the product for adoption:

- coverage against declared roots, which is the wedge;
- unresolvable internal references;
- duplicate titles within a data source;
- edit age, and owner-property nulls where an owner property exists;
- relation, rollup, formula and view counts per database — the maintenance load, counted;
- databases with no writes in N days and no inbound references.

The last three come from `docs/inputs/decay-causal-synthesis-2026-08-16.md`, which locates the decay mechanism in unbounded accumulation, a super-linear maintenance tax, and no single-source-of-truth enforcement. All three are countable without a declared policy.

Declared rules serve the buyer who must prove something to a third party. They are not the entry point.

**The line this must not cross.** ADR-0001 rejected the entropy-engine framing because entropy is a symptom with no testable contract. Counting stays inside that decision; scoring leaves it. "This database has 47 rollups and no writes in 180 days" is a measured structural fact with a link attached. "This database is too complex" is a judgement the product does not make, and shipping one would reopen ADR-0001 without a superseding ADR.

**The objection this surface exists to answer.** A config-driven linter is itself a maintenance tax, levied on people who by the same account have no maintenance energy left. The people willing to pay it are the ones whose workspaces are already fine. The tool must return something before it asks for anything.

This makes duplicate-title-within-a-data-source a **built-in** rather than a configured rule. It is currently `UNQ001`, configured. Zero-config detection is confirmed, and it is one of the two surfaces a competitor already ships without configuration.

## Job to be done

> When my workspace changes, show me which declared structural rules no longer hold, and tell me what you could not see. Give me enough evidence to repair the defect without a manual census.

## The tension this product does not resolve

`docs/research/notion-user-pain.md` found that the catalogued pains rank in near-inverse order to their testability. The two loudest — stale pages that still look authoritative, and "it's cluttered, I can't find anything" — are the two the tool cannot honestly claim to address. The most testable pain, schema drift, is voiced by the smallest population.

This is structural, not a copywriting problem. One concrete consequence: the tool can flag a page's `last_edited_time` age. It cannot flag wrongness. Selling age-detection as staleness-detection would breach the product's own fourth principle.

## The commercial risk, stated plainly

Deterministic linters monetize at zero. Vale, Spectral, Zally, IBM's openapi-validator, dbt-doctor, and every Notion CLI found are free. The one Notion-specific tool charging anything charges $5/month for link checking. The one comparable linter sustaining real pricing, Semgrep, sells security findings — where a miss has a named cost.

Structural tidiness has no named cost.

**There is a named cost, and it is not tidiness.** `docs/inputs/decay-causal-synthesis-2026-08-16.md` identifies it: unconstrained accumulation degrades search and authority signal, trust in the workspace collapses, and users route around it into Slack, Drive, and personal notes. The cost is abandonment plus duplicated work elsewhere. That is expensive and it is noticed — but it is noticed as a feeling about the tool, not as a line item, which is why it does not read as a named cost the way a security miss does.

**Agents raise that cost, and this inverts a competitive finding.** `docs/research/competitive-landscape.md` reads Notion Custom Agents as the threat, since seven of the eight rules are instructable to one. True and incomplete: an agent reading a decayed workspace quotes outdated drafts back with authority. Stale content used to be passive. It is now laundered into answers. Every agent Notion ships makes "what is stale, and what could you not read" worth more — and the second half is the question an agent structurally cannot answer about itself.

Buildability is the smaller risk. That nobody will pay for a coverage proof is the larger one — and the demand test must therefore ask about trust and re-work, not about tidiness.

## Gates, in order

1. **Demand test.** Ask five teams holding audit-relevant data in Notion what they do today to prove that workspace is complete. If the answer is "we moved that data out of Notion," stop before writing code. This gate is cheaper than the proof and it gates the proof.

   It must test **three** framings separately, because the research cannot distinguish them:

   1. **Configured** — "declare your rules, get a verdict." The framing the PRD assumes, and the one `docs/research/solo-segment-evidence.md` indicts.
   2. **Zero-config decay report** — "run one command, get what is stale, abandoned, duplicated, and over-complex, with links." Costs the user nothing before it returns something.
   3. **Coverage proof** — "run one command, get a defensible statement of what was and was not read." The wedge, and the one no competitor and no agent can supply.

   A NO on 1 with a YES on 2 or 3 is a live outcome. It changes what gets built, not whether.

   Ask about trust and re-work, not tidiness. The question that finds the cost is "when did you last act on something in Notion that turned out to be wrong, and what did that cost" — not "is your workspace messy."

   Recruiting note: `community.notion.so` and `forum.notion.so` no longer resolve, and Reddit was unreachable from every research path attempted. The obvious venues for finding these five teams are gone or blocked. Expect to reach them through direct contacts.
2. **72-hour API proof.** Can the official API support a complete-against-declared-roots, deterministic, useful scan? Checklist in `docs/inputs/prd-2026-08-16.md`, amended by the four tests below.
3. **Build**, at n=1 against this workspace, which is the only fixture available.
4. **Release gate**, at n=3: three technically capable Notion owners, each finding at least one defect that changes a repair decision.

Steps 3 and 4 together are the standing answer to "is this a one-off script for one workspace." Build against one workspace; do not release on one workspace's evidence.

## Four proof tests the PRD does not list

All four are unknowns that neither documentation nor practitioner evidence could close. Sources: `docs/research/notion-api-documented.md`, `docs/research/notion-api-practice.md`.

1. Does a `child_page` block stay visible after the child's access is revoked? The claim that partial scans are detectable rests on this, and only weak evidence supports it.
2. Does a property ID survive a property **type** change? Documentation is silent; no practitioner reports exist. If IDs churn on type change, every type change silently orphans a rule.
3. Is result order stable across two identical paginated calls against an unchanged workspace?
4. Does the roughly 11,200-object search ceiling still hold? Last confirmed February 2026; cursor internals changed in April.

Note the shape of tests 1 and 2: proving a read-only tool correct requires a fixture workspace that can be **mutated**. The product never writes. The fixture setup does, by hand or by a separate throwaway integration. This is not a breach of Principle 7 and should not be read as one.

## Kill criteria

From the PRD, with two additions and one correction.

- The API cannot prove scan completeness **against declared roots**. *(Corrected: completeness against the workspace is already known to be impossible — see ADR-0002. The original wording would have stopped the project on a settled fact.)*
- Stable findings require prose interpretation or an LLM.
- A configured scan stays below an 85% accepted-finding rate.
- Three design partners produce fewer than three total decision-relevant findings.
- A warm scan exceeds three minutes on the reference scope after selective hydration.
- The baseline cannot retain stable identity after normal page moves or renames.
- The privacy contract requires page-body persistence or unapproved third-party transmission.
- The useful product reduces to a one-off script for this workspace.
- **New:** the demand test finds no team that must prove a structural claim to a third party.
- **New:** Notion ships first-party coverage certification. This would remove the only differentiator no competitor currently holds.

## Rule catalogue gaps

`docs/research/notion-user-pain.md` identifies two testable, voiced pains the eight-rule catalogue does not cover:

- **Free text where a controlled vocabulary was needed.** Value-set membership against a declared allowed list. No rule covers this.
- **Orphan pages**, testable as an inbound-reference count of zero. `CONTEXT.md` defers this until the product defines valid roots — which ADR-0002 has now done. The deferral's stated reason no longer holds and the rule should be reconsidered.

## Deliverables the release screen does not name

Notion's Developer Terms §4.2 requires terms of use and a privacy policy, accessible at download, describing how the integration processes information. §4.3 forbids representing that Notion provides support. That is a `TERMS.md` and a `PRIVACY.md`, or one README section. Detail and quoted clauses in `docs/research/name-and-legal.md`.

## Name

Two independent constraints, one outcome.

- Notion's Trademark Usage Guidelines bar the mark from an app or package name. Not `notion-*`, not `*-for-notion`, not embedded. Twelve surveyed packages violate this and Notion has enforced against none — but §5.2 and §7.2 of the Developer Terms permit termination at sole discretion without notice, so relying on non-enforcement makes distribution revocable by someone else's policy change.
- `workspace-lint` is unavailable on npm: a security holding package at `0.0.1-security`, no maintainers, claimable only through a support dispute.

`workspace-lint` is trademark-compliant and npm-blocked. Every `notion-*` candidate is npm-available and trademark-blocked. The name must therefore be a third thing, and it is not yet chosen — the shortlist and its `npm view` evidence are in `docs/research/name-and-legal.md`. The decision is due before the first `package.json`, which is after the proof. Descriptive use in the npm `description` and `keywords` fields is expressly permitted and recovers most of the discoverability cost.

The repository name is unaffected.
