# Product

What this is for, who it is for, and what would make it not worth building. `CONTEXT.md` holds the vocabulary; this file holds the product. Both are canonical. `docs/inputs/prd-2026-08-16.md` is neither.

Written 2026-08-16 from the PRD plus seven research sweeps in `docs/research/`. Every claim below that came from a sweep names its file.

Revised 2026-08-17 after the first live API run. The coverage claim was narrowed, because the mechanism it rested on was refuted. Corrections are marked in place rather than removed, so a reader can see what changed and why.

## What it does

Reads a declared set of Notion resources through the official API, and produces a report stating two things: which declared structural rules no longer hold, and how much of the declared set the scan actually reached.

The second half is the product. The first half is what makes the second half worth reading.

### What the report can name, and what it cannot

This section replaces an earlier claim that the report states *"exactly what the scan could not see."* That claim was wider than the API supports. It was refuted on 2026-08-17 and is corrected here. The mechanism it rested on is recorded in `docs/proof/results.md` §4; the reasoning is in issue #14.

**Provable, and no surveyed tool makes the claim:**

- **Declared-root coverage.** Everything you declared was read, or the report says which declared root was not and why. The operator supplies the denominator, which is the whole point of ADR-0002. A tool cannot enumerate its own grant, so no tool can supply that denominator itself.
- **Link resolution.** A link to a page the connection cannot read still resolves to a reportable defect, because links live in page content rather than in the permission-filtered child list. **REF001 is the load-bearing coverage mechanism, not one rule among eight.**
- **404 is ambiguous, and the report says so.** An unconnected page returns 404, not 403. Access failure and object absence share a response. Principle 3.

**Not provable, and the product must stop implying it:**

- **Anything about permission removal below a declared root.** A revoked descendant vanishes from enumeration entirely. Observed 2026-08-17: after disconnecting a child page under a connected parent, the parent returned 2 blocks instead of 3 and the `child_page` block was gone. A control fetch with full access confirmed the page still existed at the same ancestor path, so the child list is permission-filtered, not structurally changed. The scan cannot count that page, name it, or report it. Inside a declared root, an unreached resource arises only from rate limits, budget exhaustion, or abandoned pagination — **never from permissions.**
- **That a child list was complete.** `GET /v1/blocks/{id}/children` carries no documented truncation signal. A complete enumeration and a silently truncated one return the same `has_more: false`. See ADR-0006 decision 2. The report discloses which endpoints a run trusted blind; it cannot close the gap.

**The general rule: the coverage manifest can only name what the operator declared, or what the tool successfully enumerated.** Nothing else is expressible, and nothing else is claimed.

**The honest strategic reading.** This is partial evidence for the objection recorded in `docs/research/coverage-artifact-prior-art.md` §5.1 — *"'what I could not see' may reduce to 'everything you did not give me,' which the customer already knew and the tool cannot size."* It does not carry that objection all the way. Declared roots plus link resolution still yield a real claim no competitor makes. The claim is smaller than this file previously stated. A precise smaller claim is sellable; a vague larger one is not, and a buyer who tests the larger one finds it false.

## Why the ordering is that way round

Two independent sweeps looked for a tool that refuses to report clean over an incomplete scan.

- `docs/research/competitive-landscape.md` surveyed Notion tooling. Notion Custom Agents can be instructed to perform seven of the eight catalogued rules today — imperfectly and non-deterministically, but today. They cannot perform the eighth, and the reason is structural: an agent cannot certify the boundary of what it did not read, and Notion grants agents access per object rather than workspace-wide.
- `docs/research/static-analysis-prior-art.md` surveyed static analysis generally and recorded as a negative result: *no surveyed tool fails a build on partial analysis coverage by default.* A later sweep checked four tools at schema level — Semgrep, dbt, Great Expectations, Soda — and confirmed it. All four emit a non-execution signal. None binds the verdict to it.

SARIF carries per-result and per-artifact not-analysed primitives — `result.kind`, `invocation.executionSuccessful`, `invocation.toolExecutionNotifications`, `artifact.roles: analysisTarget` — but defines **no run-level coverage aggregate**. That is the narrow, verified gap. *(This corrects an earlier claim here that no SARIF object expresses analysis scope or coverage. It was refuted against `sarif-schema-2.1.0.json`. See ADR-0005 §6.)*

The gap is not specific to Notion. It is a gap in the field. State it precisely: what is unclaimed is making verdict validity a function of how much of a **user-declared** set was actually reached. That is a composition of two shipped behaviours plus a default flip, not an invention. Everything else in this product is available elsewhere, free, and improving without our effort.

The sharpest example is not in static analysis. Great Expectations computes `success_percent` over *evaluated* expectations rather than declared ones, so a suite in which half the expectations never ran can report 100%. The number is not incomplete. It is wrong.

The working tagline "CI for Notion workspaces" undersells this. The product is a coverage prover that also runs rules — coverage against a declared set, never against the workspace.

## Who it is for

**Primary: whoever must prove a structural claim about a Notion workspace to someone else.** Regulated organizations, and teams whose Notion databases feed production systems. The distinguishing trait is not workspace size or tidiness; it is that a wrong answer has a named cost and an audience.

*Primary is not the same as first, and this file has now been bitten once by the difference.* Gate 1 closed on framing 2, the policy-free decay report, as the **entry point**. This buyer is who the declared rules serve once someone already runs the tool — the position "The config file is the suspect, not the segment" reaches independently. A reader who treats this paragraph as naming the acquisition target reproduces the defect issue #40 recorded.

**Named as likely, not established:** consultants auditing client workspaces. `docs/research/notion-user-pain.md` recommends this segment, because it is the only one where frequent testable pain and *behavioural* willingness to configure appear in the same person — one practitioner already hand-writes structural rules as Notion formulas. The counter-argument is live: a consultant billing hourly has an incentive against a tool that mechanizes billable hours, and the willingness case rests on two named individuals.

**Explicitly excluded:** anyone who wants the tool to decide what the workspace should mean. The product checks declared rules. It supplies no governance judgement.

**Ruled out for the configured rules:** solo, hobbyist, and small-team users. `docs/research/solo-segment-evidence.md` finds they do configure things they will use — naming conventions, formulas, buttons — but the dominant purchase is a template, and buying a template is paying *not* to configure. Their documented response to complexity is deletion, not tooling.

**Ruled out by capability:** technical operators. 6.5 million monthly downloads of `@notionhq/client`, and the one practitioner with a documented workspace cleanup wrote four scripts rather than buy anything. That segment writes the tool.

## The config file is the suspect, not the segment

`docs/research/solo-segment-evidence.md` names the mechanism: the policy file asks the user to declare their intended schema, and the instability of that schema is their actual complaint. The tool asks for the artifact whose absence is the problem.

Its own counter-argument is why this is a design finding rather than a stop: four independent artifacts attack four slices of this pain, which is the signature of a fragmented under-served market, not an absent one. The sweep could not separate "no demand" from "no demand at this configuration cost" without Reddit, which stayed unreachable across four attempts by two agents.

**Consequence for v0.1.** ADR-0001 recorded the configuration requirement as a paid cost — a first run "reports coverage and little else." That is now the wrong reading. The policy-free surface is the product for adoption:

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

This makes duplicate-title-within-a-data-source a **built-in** rather than a configured rule. It is currently `UNQ001`, configured. Policy-free detection is confirmed, and it is one of the two surfaces a competitor already ships without configuration.

*(Contested, and marked so on 2026-08-18 rather than left reading as settled. The sentence above asserts a built-in duplicate-title rule. ADR-0001 decision 4 rejects "zero-config inference of owner, canon, **uniqueness**, or peer status" — the same list, in an ADR — and the paragraph two above this one already warns that "shipping one would reopen ADR-0001 without a superseding ADR." The escape identified in issue #70 is the finding's **kind**, not the rule's mode: "these two pages share a title" is an observation and infers nothing, while "a declared unique value occurs more than once" is a conformity violation and requires a declaration. **#70 decision 1 holds this and is open.** The rename of the term in this sentence does not decide it, and a session that reads the two as one act will believe ADR-0001 decision 4 has been dealt with when it has not.)*

## Job to be done

> When my workspace changes, tell me what no longer holds and what you could not see — with the evidence and the links — so that keeping it in order never starts with me running a census.

*(Rewritten 2026-08-18. The earlier statement read "show me which declared structural rules no longer hold, and tell me what you could not see. Give me enough evidence to repair the defect without a manual census." It made the operator the repairer and the report the deliverable. Issue #75 recorded the collision: the owner's workspace doctrine, written roughly a year before this repository existed, states "You administer the workspace. Matthew does not," and "any design that requires sustained filing work from Matthew is incorrect by construction." The old wording is kept visible rather than removed, per this file's convention.)*

**What this job does not include, stated rather than implied.** The product removes the **census** — the part where a human has to look. It does not remove the **repair**. `CONTEXT.md`'s non-goals forbid deleting, rewriting, migrating or repairing Notion content, and Principle 7 makes read-only a product boundary. A read-only tool therefore cannot stop being administration; it can stop administration starting with a manual audit. That is the whole claim, and the larger one — "stop making me my own workspace admin" — must not be sold on the strength of it. Whether the executive-function constraint forces a repair surface anyway is **issue #82**, and taking it would reverse Principle 7 and need a superseding ADR.

## The tension this product does not resolve

`docs/research/notion-user-pain.md` found that the catalogued pains rank in near-inverse order to their testability. The two loudest — stale pages that still look authoritative, and "it's cluttered, I can't find anything" — are the two the tool cannot honestly claim to address. The most testable pain, schema drift, is voiced by the smallest population.

This is structural, not a copywriting problem. One concrete consequence: the tool can flag a page's `last_edited_time` age. It cannot flag wrongness. Selling age-detection as staleness-detection would breach the product's own fourth principle.

**A third pain sits beside those two, and the ranking inverts for it.** The owner names **"productivity theater"** — time spent administering the system instead of using it — as a pain-point keyword in this population. Unlike the two above, this one is measurable, because admin time is measurable, and it is what an automated reconciler removes. It is the pain the census-removal job statement is aimed at. **Its evidence class is owner-supplied market vocabulary and it cannot be verified from inside this repository** — no agent in this project has ever reached Reddit, so the same limit applies here that applies to `docs/inputs/decay-causal-synthesis-2026-08-16.md`, which is the evidence that closed Gate 1. Recorded in issue #75. Note also that "theater" is a first-class failure mode in the owner's own doctrine — *"output that looks like work but makes no verifiable state change"* — so the user's word for the pain and the operator's word for the failure are the same word.

## The commercial risk, stated plainly

Deterministic linters monetize at zero. Vale, Spectral, Zally, IBM's openapi-validator, dbt-doctor, and every Notion CLI found are free. The one Notion-specific tool charging anything charges $5/month for link checking. The one comparable linter sustaining real pricing, Semgrep, sells security findings — where a miss has a named cost.

Structural tidiness has no named cost.

**There is a named cost, and it is not tidiness.** `docs/inputs/decay-causal-synthesis-2026-08-16.md` identifies it: unconstrained accumulation degrades search and authority signal, trust in the workspace collapses, and users route around it into Slack, Drive, and personal notes. The cost is abandonment plus duplicated work elsewhere. That is expensive and it is noticed — but it is noticed as a feeling about the tool, not as a line item, which is why it does not read as a named cost the way a security miss does.

**Agents raise that cost, and this inverts a competitive finding.** `docs/research/competitive-landscape.md` reads Notion Custom Agents as the threat, since seven of the eight catalogued rules are instructable to one. True and incomplete: an agent reading a decayed workspace quotes outdated drafts back with authority. Stale content used to be passive. It is now laundered into answers. Every agent Notion ships makes "what is stale, and what could you not read" worth more — and the second half is the question an agent structurally cannot answer about itself.

**The competitor is not another linter. It is the credit meter, and this is the fact that decides the comparison.** A Notion Custom Agent doing continuous reconciliation is metered per run, forever, at the vendor's price. A local CLI is not. The comparison is therefore not free-tool-versus-free-tool; it is a free local scan against metered agent runs, and it partially softens the monetize-at-zero risk stated above — the alternative here carries a recurring bill.

The evidence is one operator who built the reconciliation protocol and cannot afford to run it. `docs/inputs/hans-operating-instructions-v10-2026-08-16.md` records the constraint as an operating rule — *"Each run uses credits. Do not start background loops or speculative work"* — and requires approval before any recurring credit cost, naming triggers, agents and scheduled runs. `docs/inputs/hans-workspace-cartography-v1.4.0-2026-07-17.md` is designed around it: *"Cost-scoped. Credits meter per run. Always run the smallest scope that answers the actual question."* Two constraints meet in the same person: automated reconciliation costs credits he does not have, and manual reconciliation costs executive function he does not have. **That gap is the product**, and it is two structural constraints rather than a preference. The market shape follows: whoever most needs continuous reconciliation is whoever can least afford to run it as an agent. Recorded in issue #76.

**Three limits on that claim, stated here so it is not read wider than it is.** First, **no price** — a cost asymmetry is not evidence that anyone pays to close it, and Gate 1 closed without a willingness-to-pay figure. Second, **n=1**, and the one is the owner, whom `.claude/state/store.json` already records as the primary-user hypothesis. Third, **"free" means no per-run vendor charge, not unlimited** — Notion publishes roughly 3 requests per second per connection, which is what the three-minute warm-scan kill criterion bounds. A local scan has a time cost and a rate ceiling. It has no meter. **Whether Notion Enterprise changes these economics is not asserted**: that is a claim about a vendor's pricing and it needs that vendor's own page, which has not been read.

Buildability is the smaller risk. That nobody will pay for a coverage proof is the larger one — and the demand test must therefore ask about trust and re-work, not about tidiness.

## Gates, in order

1. **Demand test. CLOSED 2026-08-17, on owner research rather than on a five-team send.**

   *(Corrected. The gate previously read "ask five teams holding audit-relevant data in Notion what they do today to prove that workspace is complete." That wording recruits only the buyer for framing 3 below. Every respondent would have confirmed framing 3, and the gate would have returned no information about the fork it exists to settle — while the recruiting note below records that recruitment runs through direct contacts, the configuration most likely to manufacture agreement. The defect was internal to this file. "The config file is the suspect, not the segment" already concludes that declared rules "are not the entry point," and the Gates section went on recruiting the entry point from the buyer that section had abandoned. Filed and closed as issue #40.)*

   **What closed it.** `docs/inputs/decay-causal-synthesis-2026-08-16.md`, the owner's causal synthesis of workspace decay, derived from Reddit discussion no research path in this project could reach. It supplies the mechanism, the named cost — trust collapse, then routing around the workspace into Slack, Drive and personal notes — and the objection the product must answer: a config-driven linter is itself a maintenance tax, levied on people who by that account cannot pay one. `.claude/state/store.json` records that the owner reaches Reddit and has converted a buyer there. `docs/research/solo-segment-evidence.md` concedes that its own NO "may be a verdict on the config file, not on the segment."

   **What it decided.** Framing 2 is the entry point. Framing 1 is not. Framing 3 is what declared rules serve once a user is already running the tool.

   The three framings stand as written, because they are what the build now targets:

   1. **Configured** — "declare your rules, get a verdict." The framing the PRD assumes, and the one `docs/research/solo-segment-evidence.md` indicts.
   2. **Policy-free decay report** — "run one command, get what is stale, abandoned, duplicated, and over-complex, with links." Costs the user nothing before it returns something. *(Renamed 2026-08-18, from "zero-config decay report". The gate's decision is unchanged — it decided which framing is the entry point, a claim about the buyer and the surface, not about the label. The old term named two incompatible things across canonical documents: ADR-0001 decision 4 **rejects** "zero-config inference", while this line used it for the adopted entry point. "Policy-free" names what is absent, and a policy-free scan still has scope: a token and at least one declared root are required, which is why "zero-config" was never true of this product either. Definitions in `CONTEXT.md`; survey of thirteen shipped tools in `docs/research/zero-config-naming-prior-art.md`; reasoning on issue #70. **ADR-0001 is not edited** — its sense of the term is correct as written.)*
   3. **Coverage proof** — "run one command, get a defensible statement of what was and was not read." The wedge, and the one no competitor and no agent can supply.

   The outcome was a NO on 1 with a YES on 2. That changed what gets built, not whether — which is what this gate existed to establish.

   **The two limits, stated rather than left implicit.** First, the evidence is a synthesis carrying reasoning rather than URLs. The nineteen sweeps in `docs/research/`, indexed at `docs/research/INDEX.md`, carry URLs and dates, and where the two disagree on a **fact** the sweep wins; the synthesis is the better account only of **mechanism**. Its own header says so — it says it of *"the seven sweeps"*, the count at the time it was written, and there are now nineteen. The synthesis is an input and is never edited to match this file. Second, **no willingness-to-pay figure exists for any of the three framings.** This gate established which framing is the entry point. It did not establish a price, and nothing downstream may read it as having done so — `docs/research/competitive-landscape.md` still records that deterministic linters monetize at zero.

   <!-- claim: count glob="docs/research/*.md" exclude="INDEX.md" equals=19 -->

   *Revisit if:* the built slice reaches real users and framing 2 does not return the value this synthesis predicts. That is a product finding rather than a research finding, and Gate 4 is where it surfaces.

   Carry forward into Gate 4: ask about trust and re-work, not tidiness. The question that finds the cost is "when did you last act on something in Notion that turned out to be wrong, and what did that cost" — not "is your workspace messy."

   **The instruments are unsent, and kept as a record rather than deleted.** `docs/demand-test/outreach.md`, `screener.md` and `questionnaire-2026-08-16.md` describe how this gate was going to be tested. `community.notion.so` and `forum.notion.so` no longer resolve, and Reddit was unreachable from every agent path attempted — but not from the owner. That asymmetry is why the research exists and the send did not happen.
2. **72-hour API proof. CLOSED 2026-08-17 — as circular, not as passed. The distinction is load-bearing and is stated here rather than left to the tracker.**

   The question was: can the official API support a complete-against-declared-roots, deterministic, useful scan? Checklist in `docs/inputs/prd-2026-08-16.md`, amended by the four tests below **and by the two rewrites recorded under "the checklist is not safe to copy" below.**

   **What closed it.** Issue #10, the ratification ticket, closed on the finding its own triage comment recorded: **six of its nine proof checks require the build this gate exists to gate.** Checks **3, 5, 6 and 7** could not run because the rules, the reporter and the exit byte did not exist yet; check **8** is the performance budget, which is issue #7 and blocked on `REAL_ROOT_ID`; check **9** was never a check at all — the prototype routes output through a `scrub()`, and that is not a test. The triage stated the consequence as non-negotiable — *"either they move to build acceptance as above, or this issue stays open forever by construction."*

   **What it decided.** The nine checks are **build-acceptance criteria, not pre-build gates.** They are still owed, and they are owed against the build. The tracer-bullet sequence #42–#46 has since built the machinery they need and all five are closed; what each check now returns belongs to the build record under Gate 3, not to this gate.

   **The checklist is not safe to copy verbatim, and this is the part most likely to be lost.** Two of its nine lines are known-wrong as written, and #10's triage mandated rewrites that were never applied to `docs/inputs/prd-2026-08-16.md` — nor can they be, because `docs/inputs/` mirrors external artifacts and is never edited. The corrections live here instead:

   - **Item 4** — *"label the unshared target `indeterminate`, not broken"* assumes an unshared target is visible but unreadable. It is not; it vanishes from the parent's child list. Runnable in exactly one form: *"resolve a link whose target the connection cannot read, and confirm the finding is `certainty: confirmed` about a `target state: unreachable`."*
   - **Item 7** — *"return exit code `2` after a seeded pagination or retrieval failure"* predates ADR-0008. Under ADR-0008 decision 2 a retrieval failure that stops the scan running as declared is **`4`**, and a confined gap below the declared threshold is **`3`**; `2` is the `disclaimed` disposition only. Quote ADR-0008's table as amended — the paraphrase is what drifted last time.

   Anyone moving "the nine checks" into build acceptance moves two falsified lines with them unless they read this paragraph first. That is the failure #10 named: *"or the proof will be marked passed against a test that cannot be run."*

   **What it did not decide, and what a build result must still disclose.** Two of the nine checks were **partial** rather than unrun, and **for two different reasons** — collapsing them is what makes the fixture look like the only limitation. Check 1 is partial because the fixture is **narrower than the checklist specified**: one data source rather than three, no archived target, and no seeded `UNQ001`, `SCH001`, `DEP001` or `CAN001`. Check 2 is partial because **long relation values are untested** — pagination was confirmed at 151 blocks paged 100 + 51, and relation depth was not. Any recorded build result must state which criteria the fixture could not exercise.

   *Revisit if:* the fixture is widened to the three data sources the checklist assumed. That clears check 1 and **does not clear check 2** — long relation values need a fixture with long relations in it, which is a separate widening. Their results belong on the build record, not on a reopened gate.
3. **Build**, at n=1 against this workspace, which is the only fixture available. **OPEN, and underway.** Product source reached `main` on 2026-08-17 in PR #56 — `slice/`, a private and unpublishable package, deliberately not `src/` until the npm name lands (issue #8). The tracer-bullet sequence #42–#46 is complete and all five are closed. Of the four rules that **ship** in v0.1, `SYS001`, `REF001` and `REQ001` are built; **`UNQ001` is not.** `REQ001` closed #58 on 2026-08-18 — the first configured rule, proved live on the conforming path and the gap path, and offline on the violation path, because this fixture cannot produce a live `REQ001` violation (`docs/proof/results-58-req001.md` §6). `UNQ001` is issue #59. Both of REQ001's blockers closed before it — #19 (the config schema's rule-configuration section) on 2026-08-18, and #18 (the rule-to-hydration map) with `docs/spec/v0.1-hydration-map.md`, which also records that the request budget is bound by block-tree shape rather than by workspace size. **This gate does not close while `UNQ001` is unbuilt.**
<!-- claim: exists path="docs/spec/v0.1-hydration-map.md" -->
<!-- claim: exists path="docs/proof/results-58-req001.md" -->
4. **Release gate**, at n=3: three technically capable Notion owners, each finding at least one defect that changes a repair decision.

Steps 3 and 4 together are the standing answer to "is this a one-off script for one workspace." Build against one workspace; do not release on one workspace's evidence.

## Four proof tests the PRD does not list

All four are unknowns that neither documentation nor practitioner evidence could close. Sources: `docs/research/notion-api-documented.md`, `docs/research/notion-api-practice.md`.

1. ~~Does a `child_page` block stay visible after the child's access is revoked?~~ **ANSWERED 2026-08-17. It does not.** The block disappears from the parent's children and the child 404s on `/pages`, `/blocks` and `/blocks/children`. The claim that partial scans are detectable below a declared root is **refuted**; see the boundary section under "What it does" and `docs/proof/results.md` §4. The test is kept here as a record, not as an open question.
2. Does a property ID survive a property **type** change? Documentation is silent; no practitioner reports exist. If IDs churn on type change, every type change silently orphans a rule. Open; `TYPE_CHANGE_PROP` is set in `.env` and the test is ready to run.
3. Is result order stable across two identical paginated calls against an unchanged workspace? **Provisionally yes**, 2026-08-17, and the result is confounded by bulk-created timestamps. Do not promote it without a re-run against organic content.
4. Does the roughly 11,200-object search ceiling still hold? Last confirmed February 2026; cursor internals changed in April. Open; out of reach of any hand-built fixture.

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
- ~~**New:** the demand test finds no team that must prove a structural claim to a third party.~~ **Superseded 2026-08-17, when Gate 1 closed on framing 2.** This criterion killed the project on the failure of framing 3 — the buyer the product section had already ruled out as the entry point. It would have stopped the work on a fork the product had abandoned. Kept visible rather than deleted, per this file's convention. Replaced by the criterion below.
- **New, replacing the criterion above:** the policy-free surface returns nothing a workspace owner recognises as a defect worth repairing. The countable signals are listed under "The config file is the suspect, not the segment." If a first run against a real decayed workspace produces a report its owner reads as noise, the entry point has failed, and no configured rule set rescues it — configuration is the cost this framing exists to avoid.
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
