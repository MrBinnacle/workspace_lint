# ADR-0009: The integration is the primary credential, the Operator is the accountability locus for the access boundary, and membership drift is disclosed rather than detected

- **Status:** Accepted
- **Date:** 2026-08-17
- **Supersedes:** nothing. No ADR is edited.
- **Corrects:** nothing. `Operator` was used 35 times across `docs/adr/`, `CONTEXT.md` and `PRODUCT.md` without ever being defined. This ADR defines it; it does not correct a wrong definition.
- **Closes:** issue #1, "Confirm the primary user for v0.1", in the narrow sense of naming the accountable role. It does not name the buyer.
- **Depends on:** ADR-0002 decision 1 (no endpoint enumerates a connection's grant), which is what makes decision 4 necessary rather than merely cautious.
- **Evidence:** `https://developers.notion.com/guides/get-started/overview`, fetched 2026-08-17; ADR-0002 finding 1; `docs/proof/fixture.md` line 12; `docs/research/notion-api-documented.md` §313 and §519.

## Context

`Operator` is the most-used word in this project's model and the only load-bearing one with no definition. It appears inside other glossary entries — *"a resource the operator names in configuration"* — so the glossary defines terms using a term it does not define.

That was tolerable while one credential model was assumed. It stopped being tolerable on 2026-08-17, when the `guides/get-started/overview` page was opened and found to document a second one.

### The two credential models, quoted

The overview page names three connection types. Two matter here.

- **Internal connection.** Access is granted by the connection owner or by workspace members, per-object, through the Developer portal's Content access tab or the Add connections menu. This is what the 2026-08-17 proof ran on: `docs/proof/fixture.md` line 12 records the subject as *"`workspace-lint-proof` — internal integration, read-only, granted one page."*
- **Personal access token.** Verbatim from the same page: *"Uses the creator's Notion permissions; pages do not need to be shared with a bot"*, and *"A PAT uses the creator's workspace membership and page permissions."* Elsewhere on the platform surface: *"Personal access tokens (PATs) are user-scoped tokens for scripts, CLI workflows, Workers, and tools that should act as one Notion user."*

The repository knew PATs existed — `notion-api-documented.md` §519 mentions them once, as a provisioning-path aside — and never evaluated them as an access model.

**Evidence class, stated because this project has been burned by it twice.** Every sentence above is documentation. No PAT has been run against the fixture. Per ADR-0007 decision 4 rule 2, the PAT's behaviour is *documented, not observed*, and stays that way until a response shows it. Issue #27 carries the test.

### The scenario that decided it

> Alice declares the roots in configuration. Bob runs the scan from CI. Carol reads the report and attests something to a third party.

Under an internal integration the grant belongs to a non-human identity. Nobody's promotion changes it. The denominator is a set someone deliberately constructed, and constructing it is an auditable act.

Under a PAT the grant is **Bob's**. Three consequences follow, and the third is the one that decides the ADR:

1. Bob is promoted and gains access to Finance. Coverage widens. No configuration changed.
2. Bob leaves. Coverage collapses. No configuration changed.
3. **The tool cannot see either event.** ADR-0002 finding 1 established that no endpoint enumerates a connection's grant, and the overview page re-confirms it today: it describes no endpoint that lists the content a token can reach, for any connection type. So the scan cannot compare Bob's membership this run against Bob's membership last run. Neither side of that comparison is retrievable.

A product whose central claim is *the report states its access boundary* cannot ship a boundary that moves silently. That is `CONTEXT.md` Non-goal 4 — *hiding access gaps inside a passing result* — arriving through the credential rather than through the scan.

## Decision

### 1. The internal integration is the primary credential model

The grant is held by a non-human identity. The coverage denominator is the integration's granted scope, and it does not move when a person's employment does.

This is not a rejection of the PAT. It is a statement of which model the report's boundary claim is calibrated against, and which one carries an extra obligation.

### 2. `Operator` is the accountability locus for the access boundary

**The Operator is the role that decides what the scan is allowed to see, and is accountable for that decision.**

It is a role, not a person, and it is orthogonal to two other roles the model needs and did not name:

| Role | Decides | In the scenario |
| --- | --- | --- |
| **Operator** | What the scan may see. Declares roots; owns the grant. | Alice under an integration. Bob under a PAT, because minting the token *is* the grant decision. |
| **Executor** | When the scan runs. Holds no authority over scope. | Bob, or CI. |
| **Consumer** | Nothing about the scan. Reads the attested boundary. | Carol. |

**The roles are distinct; the people may coincide.** On a two-person team one person holds all three. The model asserts the separation of responsibilities, not the separation of humans — the tool cannot observe an org chart and must not encode assumptions about one.

The Consumer is never *by virtue of consuming* the Operator. A person can hold both roles; reading the report does not confer the boundary decision.

### 3. The PAT is a secondary mode and it must name its principal

A scan run under a PAT is not simply a scan with different plumbing. It measures a different denominator, and the report must say so.

- The coverage manifest carries a **Principal**: the Notion user identity whose membership the PAT inherits, recorded by user ID with the email as a report-only alias. This follows the settled default that identity is the stable ID and names are aliases.
- Report language distinguishes **integration-granted scope** from **PAT-inherited scope of \<principal\>**. These are not interchangeable phrasings of one fact.
- A run whose principal differs from the previous run's principal is a **coverage-boundary change**. The scan can see this, because it records the principal on both runs, and it must surface it.

This decision is gated on issue #27. No PAT path is built before the fixture test observes what a PAT actually reaches.

### 4. Membership drift for a fixed principal is disclosed, not detected

This is the amendment to the approved proposal, and it exists because the stronger requirement cannot be built.

The proposal held that *any* change in the principal's workspace membership must surface as a coverage-boundary change. Against this API it cannot. There is no endpoint returning a user's accessible set, so there is no before and no after to compare. ADR-0002 decision 4 was refuted for exactly this shape of error — a capability assumed from documentation, absent from every real response — and asserting a detection the API cannot perform would repeat it in the credential layer.

What is implementable, and what is therefore required:

| Condition | Treatment |
| --- | --- |
| Principal changes between runs | **Detected.** Both principals are recorded. Surfaced as a coverage-boundary change. |
| Principal's membership changes, principal unchanged | **Undetectable.** Every PAT-mode report carries a standing disclosure saying so. |

The disclosure sits alongside the sampling-risk statement that ADR-0005 decision 5 already makes mandatory on every report, and for the same reason: a limitation the reader cannot infer must be stated on every run, not only on degraded ones.

A falling coverage ratio between two same-principal runs is **not** a detector. It is confounded by deleted pages, budget exhaustion and rule reselection, and presenting it as evidence of narrowed membership would be a guess wearing a number.

### 5. `Principal` is a new term, not a second definition of `Connection`

The approved proposal called for mode-labelled dual definitions — `Connection (PAT mode)`, `Shared scope (PAT mode)`. Adopted in substance, changed in form.

Two definitions of one word drift, and a reader who does not know which mode is active cannot tell which definition applies. Adding one term instead makes the mode legible from the data: **a report either has a Principal or it does not.**

`Connection` and `Shared scope` keep their current definitions, which are accurate for the integration model this product ships against. They are the two entries that move if the PAT path ever becomes primary, and that is recorded here rather than pre-emptively edited.

### 6. A value is distinct when its remedy is distinct

Adopted as a standing model rule, at the same tier as ADR-0007 decision 4's method rules.

It is already how three decisions were made, and it was implicit in all three:

- ADR-0005 decision 1 split `unreached` from `undecidable` because widening access fixes one and not the other.
- ADR-0006 corrected `docs/proof/results.md` for calling an absent `request_status` `unreached`, because that value's remedy — *widen access or raise the request budget* — does not apply to a field the server did not send.
- ADR-0008 decision 1 kept `unverified` distinct from `resolved`, and separately justified `unverified` against `unreached` on the same test.

Stated as a rule it also works as a **deletion** test, which is how ADR-0008 cut a sixth baseline state: `withdrawn` shared `resolved`'s remedy, so it was not a value. This rule and ADR-0005's governing design rule — *a value earns its place only if it changes what the operator does next* — are the same rule seen from two ends.

## Consequences

**Gained.** The boundary claim survives both credential models, because under the model where it can move it is attributed to a named principal and its undetectable component is disclosed. The product does not have to choose between honesty and the PAT's much lower setup cost.

**Gained: three roles where there was one word.** Operator, Executor and Consumer were all called "the operator" in 35 places. The separation matters most for the report's audience — the Consumer attests to something, and knowing that the Consumer did not choose the scope is the whole point of attesting.

**Paid: the PAT's advantage is smaller than it looked when first found.** The share-settings step disappears, which is real, and the human gate in front of the proof re-run goes with it. But the coverage denominator becomes an employee's account, and the manifest grows a Principal, a boundary-change signal, and a standing disclosure. Some of the setup cost moves rather than vanishing.

**Paid: two glossary entries are knowingly model-specific.** `Connection` and `Shared scope` describe the integration model. They are correct today and are named here as the entries that move.

**Rejected by consequence.** Any report that names an inherited scope without naming its principal. Any claim that the tool detects membership change under a fixed principal. Any use of a coverage-ratio delta as evidence of narrowed access. Any glossary entry that defines one term twice under mode labels.

**Evidential standing.** The PAT sentences in Context are quoted from the overview page fetched 2026-08-17. The integration behaviour is observed — the 2026-08-17 proof ran on one, recorded in `docs/proof/fixture.md`. **The asymmetry is deliberate and worth stating: the model this ADR makes primary is the one with an observation behind it, and the one it makes secondary is documentation-only.** Decision 3 is gated on closing that gap.

## Decision status

This ADR was written with no source code, no toolchain, and no PAT ever run. An implementer will have all three, and on the decisions marked revisable their evidence outranks the reasoning here. The correct response to a conflict is to surface it with reasoning, not to follow this file.

- **Non-negotiable — decision 4's split between detected and disclosed.** Claiming a detection the API cannot perform is Non-goal 4 of `CONTEXT.md`. Better evidence about what users would prefer to see does not reopen it; evidence that the API *can* perform the detection does, and that is the Revisit-if below rather than a values question.
- **Non-negotiable — a PAT-mode report names its principal (decision 3).** An unattributed inherited scope is an unstated boundary.
- **Revisable with new evidence — decision 1's choice of primary model.** *Revisit if:* issue #27's fixture test shows the PAT reaches a materially different set, or shows the integration model imposing setup cost that blocks the demand test. Both are observations this session could not make.
- **Revisable with new evidence — decision 2's three roles.** *Revisit if:* a real deployment shows a fourth role, or shows Executor and Operator inseparable in every CI configuration anyone actually uses, in which case the separation is costing more than it buys.
- **Revisable with new evidence — decision 5's single-term form.** *Revisit if:* the PAT path becomes primary, at which point `Connection` and `Shared scope` need re-deciding and the dual-definition form may win on clarity after all.
- **Revisable with new evidence — decision 6's rule.** *Revisit if:* a value is found that changes no remedy and is still worth keeping. That would mean the rule is a heuristic rather than a test, and it should be restated as one.

## Revisit if

**Notion ships an endpoint that returns a user's accessible set.** Decision 4 collapses: membership drift becomes detectable, the disclosure becomes a real signal, and the PAT's main structural cost disappears. This is ADR-0002's own Revisit-if condition arriving through a different door, and it would reopen the coverage model before it reopened this ADR.

**Issue #27's test shows a PAT reaching less than the integration.** The entire premise inverts — the PAT would be a narrower grant with worse attribution, and decision 3 would become a rejection rather than a gated secondary path.

**A workspace is observed where the Operator and the Consumer must be the same person for the attestation to be worth anything.** Some assurance contexts require the person attesting to have set the scope. If that is the demand test's finding, decision 2's separation is still correct but the product needs to say which role the reader holds, which it currently does not.

**The demand test finds the buyer is an engineer rather than an auditor.** The Consumer role thins out, attestation stops being the point, and the attribution machinery in decision 3 is weight the product does not need.
