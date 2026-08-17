# Checkpoint — workspace_lint

## S003 — 2026-08-16 — ADR-0005 locks the outcome model; the 72-hour proof is unblocked

**PHASE:** Pre-build. No source code. Build gate still closed. The sweep banked in S002 was spent into one decision.

**TESTS:** None. No toolchain. Not a gap.

**ALL WORK LANDED, ON A BRANCH, UNPUSHED.** Branch `docs/adr-0005-outcome-model`, one commit `db02541`, three files:

- `docs/adr/0005-outcome-splits-into-conformity-and-evidence-sufficiency.md` (new)
- `CONTEXT.md` — glossary carries the split model
- `PRODUCT.md` — refuted SARIF claim corrected

Nothing is in flight. Nothing is half-written.

### What ADR-0005 decides

Six decisions. Full text in the ADR; the working is in `store.json` → `locked_decisions` → `ADR-0005`.

1. **Outcome is a pair, not an enum.** Conformity (`conforms` | `violates`, **absent** when the evaluated set is empty) × evidence sufficiency (`sufficient` | `unreached` | `undecidable`). ISA 705's mandated grammar: "except for the effects" for a proved defect, "except for the **possible** effects" for an inability to obtain evidence.
2. **`inapplicable` is deleted.** Operator exclusion → the scope declaration. Precondition mismatch → an applicability filter in the manifest. Neither is an outcome. Follows OSCAL, which keeps exclusion machinery in the assessment plan and never in results.
3. **The report carries a disposition** — `unqualified` | `qualified` | `disclaimed` — and a disclaimed report renders **no summary verdict**. Gaps are pervasive when a declared root was never reached, or when any gap is unbounded.
4. **No ratio is published without the coverage figure bounding it.**
5. **The coverage manifest is a five-stage funnel:** declared → resolved → **enumerated** → fetched → evaluated. Every drop-out names a resource and a specific cause. Generic causes banned.
6. **The SARIF claim is corrected.** Four primitives exist; the gap is the run-level aggregate only.

### The five judgment calls that were not in the S002 handoff

Recorded because a future reader will otherwise assume the handoff specified them.

1. **Evidence sufficiency has three values, not two.** Split on the governing rule: *a value earns its place only if it changes what the operator does next.* `unreached` is fixed by sharing more or raising the request budget; `undecidable` is fixed by neither.
2. **Conformity is absent, not a third value.** A verdict never formed is not a verdict value.
3. **ISA 705's `adverse` was dropped.** It separates from `qualified` on materiality, which a CLI cannot compute. Three dispositions, not four.
4. **Pervasiveness is structural, not a percentage.** A ratio threshold would be computed over a denominator the scan has just admitted it cannot establish. The structural form generalises ADR-0002 decision 2.
5. **The funnel has five stages, not the handoff's four.** `enumerated` was inserted because it is the only source of unbounded gaps, and the `disclaimed` disposition keys on exactly those.

**And one correction to the handoff's own instruction.** It said to adopt XCCDF's rule that a non-verdict never enters a scoring denominator. Applied alone, that rule **is** the Great Expectations defect — excluding never-run checks from the denominator is how a suite half of which never executed reports 100%. The shipped rule is stronger: the conformity ratio and the coverage ratio are published together or not at all.

### Two S002 handoff claims were falsified at session start

Both caught by the claim-verification step, both before any writing began.

1. **The refuted SARIF sentence stood in three files, not one.** `PRODUCT.md`, `ADR-0002` Consequences, and `ADR-0003` Consequences — the last in its strongest form. Only `PRODUCT.md` was corrected. **The two ADRs were deliberately left standing** and are superseded by reference. Do not "fix" them.
2. **"Delete the 10/25/50/100 req/s figures wherever they appear" was a no-op.** Those figures are in no canonical doc. Remaining instances are the instruction itself, the research file that marks them PARTIAL, and two sweep-raw files. Nothing to delete. Standing figure for every throughput model: **3 req/s per connection, ~540 requests inside the three-minute warm-scan kill criterion.**

### BLOCKERS

**None on the outcome model.** The 72-hour proof was waiting on it and is now unblocked.

**Gate 1 is unchanged and still not technical.** Five teams that must prove a structural claim to a third party. Three channels: Reddit diagnosis, warm network, ICT Institute. The instruments are written and sitting in `docs/demand-test/`. That gate advances only when the operator sends.

**One precondition on the proof:** it needs a Notion API token and a fixture workspace, and two of the four proof questions require the fixture to be **mutable**. That is not a breach of Principle 7 and should not be read as one.

### EXACT NEXT STEPS

1. **Push the branch and open the PR.** `git push -u origin docs/adr-0005-outcome-model`, then `gh pr create`. The work is committed but exists on one disk only.
2. **Run the 72-hour proof as a `/prototype` on a `prototype/api-proof` branch** — not as build phase 0. ADR-0005 now defines what it must measure. `store.json` → `unknowns_assigned_to_proof` holds **eight** questions; three were added this session and all three test ADR-0005 itself:
   - Do `unreached` and `undecidable` ever diverge against a workspace with a deliberately unshared subtree? If they never separate, collapse evidence sufficiency to two values.
   - Can enumeration and fetching be separated against the real API? If not, the `disclaimed` disposition loses its trigger.
   - How often does `disclaimed` fire on a real workspace? If it is the normal case, ADR-0002's declared-root model needs revisiting before ADR-0005 does.
3. **The demand test needs no session.** The instruments are written. The Reddit diagnosis is the first send and the words are the operator's.
4. **Do not open Configuration Status Accounting yet.** ADR-0005 deferred it deliberately; it is blocked on re-verifying MIL-HDBK-61A Fig 8-3, which no verifier has checked.

**NEXT-MODEL:** fast tier. The proof is execution mechanics — write probes, measure, record what the API does. The ambiguity that justified a frontier model was the outcome model, and it is now locked. If the proof's results reopen ADR-0005 (any of its three Revisit-ifs firing), close that session and reopen on a frontier model rather than crossing the tier boundary mid-session.

**NEXT-REPO/CWD:** `C:\Users\mlpgr\2026_Projects\workspace_lint` — single repo; state, ADRs, research and both session rituals all live here.

### Standing cautions carried forward

- **ADRs are never edited in place.** A refuted claim standing in ADR-0002 or ADR-0003 is correct, not a bug. Living docs (`PRODUCT.md`, `CONTEXT.md`) are corrected directly.
- **ADR-0005's evidential floor is uneven, and the ADR says so.** Decisions 1–3 rest on adversarially re-verified primary sources. Decision 5's funnel shape rests on CONSORT 13a/13b, PRISMA 16b and STROBE 13 — **fetched but never re-verified**, adopted on three-way convergence. Re-verify the clause numbers before quoting them anywhere published.
- **Citation hazard, unchanged and load-bearing.** ISO 19011:2018 and ISA 705 were read from unauthorised copies. Cite by clause and paragraph, link the ISO catalogue or IAASB, and put neither URL in a published artifact.
- `docs/research/sweep-raw/` is raw and unverified except where a verification file says otherwise.

---

## S002 — 2026-08-16 — Demand-test funnel specified; cross-domain prior-art sweep run

**PHASE:** Pre-build. No source code. Build gate still closed. Two work streams advanced: the gate-1 recruiting funnel, and a seven-scout prior-art sweep on how mature assurance disciplines represent incomplete verification.

**TESTS:** None. No toolchain. Not a gap.

**ALL WORK LANDED.** Nine scout reports and two verification passes are banked. Merged to `main` as PR #11 (`7590515`), three commits:

- `3254153` — `docs(demand-test): specify the gate-1 recruiting funnel`
- `6c5981a` — `docs(research): add cross-domain prior-art sweep on incomplete verification`
- `3e64806` — `fix(state): track session state instead of discarding it as scratch`

Nothing is in flight. No unfinished threads.

### Stream 1 — demand test

Written, uncommitted:

- `docs/demand-test/questionnaire-2026-08-16.md` — 16 questions, 6 parts, ~15 min. Tests the three framings separately with a forced-discrimination ranking. Header framing is a spec with a delete-before-sending note, not drafted copy.
- `docs/demand-test/screener.md` — 4 questions, ~60 s, with a read-the-answers table. Screen-outs get logged; they are the denominator.
- `docs/demand-test/outreach.md` — content **specifications** for three messages, not drafts.
- `docs/inputs/recruiting-sweep-2026-08-16.md` — a Grok recruiting sweep, mirrored with provenance, plus a same-day correction block.

Three operator rulings, all binding:

1. **No ghostwriting.** Do not draft first-person prose for him to send as himself. Produce a specification: purpose, required content, prohibited content, length, failure mode. The `literal-humanist-voice` register governs how the agent writes; it does not license writing *as* him. The register is installed at `~/.claude/output-styles/literal-humanist.md` and is active.
2. **LinkedIn is out, permanently.** Not for this project, not for any.
3. **SewerAI is not a contact.** See below.

**The recruiting sweep's "no public channel" conclusion was falsified the same day, by his own history.** He answered a Notion structural problem on Reddit — publicly, free, in one response — and that response produced a scoped call with a Director of Engineering at SewerAI. The engagement never closed and he was never paid; they ghosted after an intro call in which he delivered further diagnostic and architectural work unbilled. `PRODUCT.md` had already predicted that outcome: *"Ruled out by capability: technical operators. That segment writes the tool."*

Two consequences. The acquisition motion that works is a **free diagnosis published where these people read**, not a question. And the SewerAI Notion artifacts — SOW, SOPs, 46-task delivery hub, an email template reading "handoff complete and final invoice" — are prepared work, not a record of delivery. Do not read them as evidence of a completed engagement.

The Owner Checklist drift items (missing DRI, overdue review, docs needing promotion, DRI vacancy, overdue docs) remain valid as a rule specification derived from real client work.

**Cold outreach is now closed.** Three channels remain: Reddit diagnosis, warm network, ICT Institute. Gate 1 asks for five teams. That target now rests almost entirely on the Reddit post generating inbound. If the funnel stalls below five, lower the gate or accept a longer calendar — do not substitute weaker contacts to reach the count.

### Stream 2 — cross-domain prior-art sweep

Run under `cite-verified-research-sweep`. Seven scouts — five domain, one direct-prior-art, one unconstrained wildcard — all banked verbatim in `docs/research/sweep-raw/`. One Tier-1 verifier returned; a second is outstanding.

**Verified corrections (`verify-platform`, 6 claims: 2 confirmed, 4 partial, 0 fabricated).**

1. **`PRODUCT.md`'s SARIF claim is refuted and must be restated.** "No SARIF object expresses analysis scope or coverage" is wrong. The schema carries `result.kind` (six values incl. `notApplicable`), `invocation.executionSuccessful`, `toolExecutionNotifications`, and `artifact.roles: analysisTarget`. The true gap is narrower: **no run-level coverage aggregate.** Build on those four primitives.
2. **The Notion kill-criterion threat does not land.** Admin content search is real, Enterprise-only, reaches private pages, exports CSV — but it is a **search**, not an enumeration. Notion ships admin lookup over private content, not coverage enumeration. The wedge survives, conditional on the product enumerating rather than looking up.
3. **Rate limits: delete 10/25/50/100 req/s from every model.** Notion publishes only "an average of three requests per second" per connection, with the workspace ceiling "scaled to the workspace's plan" and no tier table. At 3 req/s the three-minute warm-scan kill criterion allows roughly 540 requests total. That is the budget the 72-hour proof must live inside.
4. **Semgrep's `skip_reason` enum is 17 values with mixed casing, not 8.** The nine missed values separate *excluded by policy* from *failed to analyse*.
5. **Method receipt:** the verifier caught the OASIS prose spec returning `result.kind` values (`diagnostic`, `initialState`) that do not exist in the schema, then correctly refused to trust that source's section numbers. SARIF section numbers are unverified.

**Unverified but convergent — the design finding.** Four scouts, none told about ISA 705, independently found it. The convergent claim: **the four-outcome enum is one dimension short and mixes two axes.**

- ISA 705 models outcome as nature × pervasiveness, with mandated grammar — "except for the effects" (proved) vs "except for the **possible** effects" (unverified).
- XCCDF has run nine values since 2005, splitting `incomplete` into `notchecked` (never attempted) and `error`/`unknown` (attempted, failed), and `inapplicable` into `notapplicable` (rule does not fit target) and `notselected` (out of scope). It excludes `unknown` from scoring so a non-verdict cannot move a pass rate.
- OSCAL has **no** unassessed state — `finding-target` allows only `satisfied` / `not-satisfied`. `ADR-0003` cannot inherit `incomplete` from it.
- `inapplicable` is in the wrong place: scope exclusion is declared *before* the audit; evidence unavailability is discovered *during* it.
- DOE-STD-1073 adds severity: an open item that voids the verdict and one that does not are different objects.

**The coverage manifest is not an invention — but the "required in three disciplines" claim is wrong and was corrected by `verify-standards`.** Precise position:

- **ISO 19011 §6.5.1 — OPTIONAL, not required.** "any areas within the audit scope not covered… with related justifications" is verbatim correct, but sits in the second list, introduced by "The audit report **can also** include or refer to the following, **as appropriate**". The mandatory set is the lettered a)–k) list. Say "may include, as appropriate".
- **ISO 19011 §6.5.1 item k) — MANDATORY, and confirmed.** "audits by nature are a sampling exercise; as such there is a risk that the audit evidence examined is not representative." A standing sampling-risk disclosure in every report *is* required.
- **Macquarie clause 10 — required field list, verified.** Items (5), (6), (7): supporting documentation substantiating the entire closing balance; "a list of all Reconciling Items, with supporting documentation"; "a list of Unreconciled Items, with explanatory notes and documented action plan for investigation".
- **MIL-HDBK-61A Fig 8-3, CONSORT, PRISMA, STROBE — not yet verified.** Fetched by scouts, not re-checked.

**Citation hazard, load-bearing.** The ISO 19011 text was read from `synersia.org`, which hosts a complete unaltered copy of the standard including its intact copyright page forbidding exactly that posting. It is an unauthorised copy. Cite "ISO 19011:2018, clause 6.5.1" with no URL, or link the ISO catalogue. The same applies to the squarespace-hosted ISA 705 mirror — cite IAASB. Do not put either URL in a published artifact.

**Enumerative coverage does have a strong precedent, found on a follow-up pass:** CONSORT item 13a/13b (renumbered 22b in CONSORT 2025) requires per-group counts at every stage plus reasons for every loss and exclusion, and explicitly rejects category labels — "simply stating 'protocol deviation' is insufficient". PRISMA item 16b goes further: studies that appeared to meet inclusion criteria but were excluded must be **cited individually** with reasons. STROBE carries the same staged-funnel shape. Three independent reporting standards converged on it. Unverified.

**Structural idea worth more than the rest:** Configuration Status Accounting. The manifest should be a standing record fed by each scan, not a per-scan artifact that is discarded.

**The strongest counter-argument on the table** (wildcard, unverified): a Notion integration sees only what a human shared with it, so "what I could not see" may reduce to "everything you did not give me" — which the customer already knew and the tool cannot size.

### BLOCKERS

Unchanged and still not technical. Gate 1 needs contact with teams that must prove a structural claim to a third party. The channel set is now smaller than it was this morning.

### EXACT NEXT STEPS

**Start here.** Write the superseding ADR — `docs/adr/0005-*`. It is the head of the chain and everything else waits on it.

1. **ADR-0005, superseding part of ADR-0003: the outcome model.** Replace the flat four-value enum with two orthogonal fields — conformity and evidence-sufficiency. Move `inapplicable` out of the outcome enum into the scope declaration, because scope exclusion is declared before a run and evidence unavailability is discovered during it. Add a report-level disclaimer disposition so a pervasively incomplete scan can refuse to render a summary verdict. Adopt the XCCDF rule that a non-verdict never enters a scoring denominator. Do **not** edit ADR-0003 in place. Evidence: `docs/research/coverage-artifact-prior-art.md` §2. Full working: `store.json` → `open_decisions` → `outcome-model`.
2. **Correct `PRODUCT.md`.** The SARIF claim is refuted; the replacement wording is in `store.json` → `corrections_pending`. Delete the 10/25/50/100 req/s figures wherever they appear. Quote nothing from the ISO 19011 or ISA 705 mirror URLs — see the citation hazards below.
3. **Then the manifest shape**, after CONSORT and PRISMA: a staged funnel from declared roots to rules-evaluated, every drop-out carrying a specific machine-readable cause and a named resource. Generic reasons are banned. Consider Configuration Status Accounting — a standing record fed by each scan rather than a per-scan artifact that is discarded.
4. **Only then the demand test.** The Reddit diagnosis is the first send, and `docs/demand-test/outreach.md` specifies what it must contain. It is a specification, not a draft — the words are the operator's.

The 72-hour proof stays downstream of steps 1 and 3, because the outcome model determines what the proof has to measure.

**Everything from this session is committed and merged.** Nothing is pending on disk.

**NEXT-MODEL:** frontier model. The synthesis is a judgment call across seven reports with a live corrections ledger.

**NEXT-REPO/CWD:** `C:\Users\mlpgr\2026_Projects\workspace_lint`

### Standing cautions carried forward

- `docs/research/sweep-raw/` is **raw, unverified** except where a verification file says otherwise. The wildcard file is explicitly fenced — unanchored searching favours reachable-but-weak sources.
- Scouts self-nominate their softest claims. Use those to prioritise verification, never to bound it. One scout's file came back stronger than it flagged; the genuine errors were elsewhere.
- Do not cite paywalled standards from consultancy paraphrase. ISO 9001, ISO 13485, EIA-649, ISO 10007, MIL-STD-973 and AICPA AT-C 320 were all reached only second-hand.

---

## S001 — 2026-08-16 — Grilling closed, product reframed

**PHASE:** Pre-build. Grilling (`/grill-with-docs` + `/domain-modeling`) complete. No source code exists and none is due yet.

**TESTS:** None. No toolchain chosen, no `package.json` *(forward reference — verified absent 2026-08-16; it is due at the point the name decision resolves)*. Not a gap — the build gate has not opened.

### What this session established

Seven research sweeps ran as subagents; all reports are in `docs/research/` with citations. Findings that changed decisions:

1. **Complete workspace coverage is impossible.** No endpoint enumerates a connection's grant; Notion documents search as non-exhaustive; search dies at ~11,200 objects. The PRD's stop condition would have killed the project on a settled fact. Resolved by ADR-0002: coverage is measured against **declared roots**.
2. **That same limitation is the only defensible wedge.** No Notion tool and no SARIF object expresses analysis coverage; no surveyed static-analysis tool fails a build on incomplete coverage. The product is a coverage prover that also runs rules, not a linter that also reports coverage.
3. **Determinism as written was untestable.** Signed S3 URLs regenerate per request; timestamp removal does not touch a signature. Resolved by ADR-0004: a named Normalization function, specified before the proof runs.
4. **ESLint was the wrong anchor** for four of five hard problems. Resolved by ADR-0003: SARIF 2.1.0 as design source, SonarQube issue-lifecycle as state machine, axe-core's four-valued outcome, OSCAL's observation/finding split.
5. **Seven of eight rules are instructable to a Notion Custom Agent today.** The eighth — coverage — is structurally out of reach for an agent.
6. **The config file, not the segment, is the suspect** for weak demand. Zero-config surface expanded and is now the adoption path.
7. **Name must be a third thing.** `workspace-lint` is trademark-clean and npm-blocked; every `notion-*` is the reverse. Deferred until `package.json`.

### BLOCKERS

**One, and it is not technical.** The next gate is a demand test requiring contact with five teams that hold audit-relevant data in Notion. Nothing in the repo advances until those conversations happen or the owner decides to build for himself regardless.

Secondary: Reddit was unreachable from every research path attempted, and `community.notion.so` / `forum.notion.so` no longer resolve. The obvious recruiting venues are gone. Expect direct contacts.

*(S002 note: the agents cannot reach Reddit. The owner can, and has, successfully. That limitation is about the research tooling, not about the channel.)*

### EXACT NEXT STEPS

1. `/session-start-from-state` in a fresh session.
2. Run `/to-questionnaire` for the demand test. Substantive questions are the agent's to write from `docs/research/` and `PRODUCT.md`; only recipients and deadline come from the owner.
3. The questionnaire must test **three** framings separately — configured, zero-config decay report, coverage proof — per `PRODUCT.md` gate 1. A NO on the first with a YES on the others changes what gets built, not whether.
4. Do **not** run `/to-spec` yet. Three live product framings mean a spec written now encodes a guess.
5. After the demand test resolves: 72-hour proof as a `/prototype` on a `prototype/api-proof` branch, not as build phase 0.

**NEXT-MODEL:** frontier-model (Opus 5) — the next session authors questions whose wording determines whether the answers are usable, from a seven-report evidence base. Judgment-heavy, not mechanical.

**NEXT-REPO/CWD:** `C:\Users\mlpgr\2026_Projects\workspace_lint` — single-repo project; state, ADRs, research and resume ritual all live here.

### Standing cautions for the next session

- `docs/inputs/` holds two inputs, neither canonical: the Notion PRD (URLs, dated) and a decay causal synthesis (reasoning, no URLs). Their evidentiary weights differ and the files say so. Do not treat them as parity.
- Counting is inside ADR-0001; scoring is outside it. A decay report that grades a workspace reopens the entropy-engine framing without a superseding ADR.
- The four proof tests listed in `PRODUCT.md` are unknowns no source could close. Two of them require a **mutable** fixture workspace. That is not a breach of Principle 7 and should not be read as one.
