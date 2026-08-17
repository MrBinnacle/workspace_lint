# Checkpoint archive — workspace_lint

Bands S001–S007, verbatim, moved out of `.claude/state/checkpoint.md` so the
always-loaded file stays under the 200-line adherence threshold. Nothing was edited or summarised.
These are dated records: read them for what was believed at the time, never as current state.

Current state, the standing constraints, and the current band are in
`.claude/state/checkpoint.md`. The operative constraints from these bands were hoisted into that
file's `Standing constraints` section — they are not only here.

---

## S007 — 2026-08-17 — The audit refuted the ADR the previous session shipped

**PHASE:** Pre-build. No source code. Build gate closed. The board is now decisions and chores only.

**TESTS:** None. No toolchain. Not a gap.

**ALL WORK MERGED.** `main` at `3fe815f`. PR #22 merged (#15, #16); `6968110` merged the checkpoint
trim that PR #17 had left stranded. Nothing in flight. Issues **#18–#21** filed, all
`ready-for-agent`.

### #15 refuted ADR-0006 decision 2, one day after it was accepted

ADR-0006 lists `POST /v1/search` as carrying no truncation signal. **It carries one.** Notion's
`post-search` reference documents `request_status`, and `notion-sdk-js` PR #711 adds the field to
`SearchResponse`. `docs/research/notion-api-practice.md` §4.5 had listed it correctly since
2026-08-16 — **the ADR contradicted a file already in the repository.**

**The method failure is the reusable part.** A negative was asserted across three endpoints having
opened two references, and silence on the shared pagination page was read as absence rather than as
not-checked.

Two consequences, and the second is larger than the error:

1. **The coverage story improves.** A truncated search is detectable, so the ~11,200 wall is a
   reportable gap rather than a silent one.
2. **ADR-0006's central finding survives, better evidenced.** PR #711 threads the field through
   seven response types and omits `ListBlockChildrenResponse`. The traversal spine's missing signal
   now rests on two independent sources instead of on the inference that just failed.

ADR-0006 is not edited. **#21** carries the superseding ADR, frontier tier.

### #16 found the interaction its own Revisit-if asked about

Six settled defaults are in `CONTEXT.md`; `asserted_without_adr` drops 7 entries to 1 and the two
surfaces finally agree. The rule catalogue gains a v0.1 column — four ship, four deferred.

None of the six conflicts with a locked ADR. **One interacts, and the interaction was unstated:**
ADR-0005 decision 4 makes exit status a function of report disposition *and* coverage ratio, so
"baseline fails new only" governs the **findings** contribution alone. A scan can fail on coverage
while every finding it produced is baselined. Composition filed as **#20**.

**Third instance of the three-places pattern.** `CONTEXT.md`'s stop condition still read "a complete
coverage manifest" with no declared-root qualifier — the wording that stops the project on a fact
ADR-0002 settled. `PRODUCT.md` was corrected earlier; this was the surviving copy.

### A new hygiene failure mode, and it fired on its own fix

`checkpoint.md` 445 → 140 lines. Each band ended with a pointer at the band before it, so archiving
older bands broke every reference above the cut **while losing zero normative claims** — the
superset check goes green over a file that can no longer reach its own constraints.

**Hoisting from the oldest source recovered two constraints the newest band had already dropped**:
the living-docs carve-out on "ADRs are never edited in place," and the scouts rule. The chain was
lossy *before* the archive. Written into `context-hygiene` as step 2; the recognizer then fired on
that same file, because inserting the step renumbered a list.

### BLOCKERS

**None technical.** Every remaining item is a decision, a chore, or Gate 1.

**Gate 1 is unchanged and is not on the board.** Five teams, 329 lines of instruments in
`docs/demand-test/`, and it advances when the operator sends. The Reddit diagnosis is the first send.

### EXACT NEXT STEPS

1. **#21 — ADR-0007**, correcting ADR-0006 decision 2. Do this before #10 ratifies anything.
2. **#20 — baseline state machine.** The one item with real design content.
3. **#18, #19** — hydration map and identity rule. Mechanical.
4. **#8, #14** — operator decisions. Not agent work.

**NEXT-MODEL:** frontier for **#21** and **#20** — a superseding ADR and a state machine composing
two independent exit inputs, both judgement. **#18** and **#19** are mechanical and belong to their
own fast-tier session. Do not straddle.

**NEXT-REPO/CWD:** `C:\Users\mlpgr\2026_Projects\workspace_lint` — single repo; state, plan and
resume ritual all at the root.

**SELF-ASSESS:** VERDICT: 2 (#15 and #16 landed; the ADR-0006 error was caught by the audit the project had scheduled, and tracked rather than patched) · ATTRIB: skill

### Note on `~/.claude`

Untouched by operator instruction. The `context-hygiene` SKILL.md edit from this session is
**uncommitted there and stays that way**. That repo has no remote and no backup; the operator has
seen the analysis and ruled the pile probably superseded. Do not re-raise it.

---

## S006 — 2026-08-17 — ADR-0006 unblocks scan code, and the audit it required found a larger limit

**PHASE:** Pre-build. No source code. Build gate closed — but the technical blocker that held it is gone.

**TESTS:** None. No toolchain. Not a gap.

**WORK IS IN FLIGHT.** `PR #17` is **open, not merged**, on branch `docs/adr-0006-truncation-positive-test`. Two commits: `f8917fa` (ADR-0006) and `cc16d63` (the `PRODUCT.md` narrowing that cites it). Nothing is on `main` from this session except this state close. Do not report #13 closed until #17 merges.

### #13 asked for a mechanism swap and the audit it required found something larger

The swap itself was mechanical. ADR-0002 decision 4 made the **absence** of `request_status` a hard error; the field is absent from every healthy response; ADR-0006 decision 1 replaces the presence check with the positive test the reference prescribes — `request_status.type === "incomplete"`.

**What nobody had checked was where the field is documented.** It is on the `dataSources.query` reference. It is on neither `/reference/intro#pagination` — the normative description of the shared paginated-list envelope — nor `/reference/get-block-children`.

| Endpoint | Truncation signal | Documented cap |
| --- | --- | --- |
| `POST /v1/data_sources/{id}/query` | `request_status.type === "incomplete"` | 10,000 |
| `GET /v1/blocks/{id}/children` | **none** | none |
| `POST /v1/search` | **none** | none (~11,200 observed) |

`GET /v1/blocks/{id}/children` is the traversal spine of the scan — every page walk, every nested descent, every `child_page` discovery. **It carries no truncation signal.** A complete enumeration and a silently truncated one return the same `has_more: false`, which is the value that lied at the data-source cap before 2026-04-20. Every completeness claim over page content rests on it. The scan cannot close this; decision 5 discloses it per-run instead.

That was true before the ADR. It was written down nowhere.

### The second question was answered against adding a value

`request_status` absence gets **no fourth value** on ADR-0005's evidence-sufficiency axis. It maps to `sufficient`. Rejected on ADR-0005's own governing rule — a value earns its place only if it changes what the operator does next. The absent case has no remedy, fires on 100% of runs, and a permanent universal qualifier is exactly the mechanism ADR-0005's fourth Revisit-if predicts will train readers to skip the limitations half. The residual doubt moved into the sampling-risk statement, which now names the endpoints a run trusted blind and so carries per-run content instead of boilerplate.

### The same refuted inference was standing in three places. Again.

The claim that an absent `request_status` maps to `unreached` was in `docs/proof/results.md` §1, copied forward verbatim into `store.json` → `corrections_pending`, and implied by anything written from either. It is wrong: `unreached` carries the remedy *widen access or raise the budget*, and no operator action produces a field the server declined to send.

**This is the second time this repository has produced the three-places pattern.** ADR-0005 found the refuted SARIF sentence in three files after a handoff claimed one. **Treat "the claim is in one place" as unverified until grepped.**

Corrected by reference in ADR-0006's header; the evidence record is not edited. `store.json` corrected in place, because it is forward-looking state rather than a dated record.

### `PRODUCT.md` narrowed, and #14 left open on purpose

Three provable claims stated — declared-root coverage, link resolution, the ambiguity of 404 — and two unprovable ones: anything about permission removal below a declared root, and that a child list was complete. REF001 promoted in the text to the load-bearing coverage mechanism. The refuted claim was found in a **second** place in the same file (proof test 1) and marked ANSWERED rather than deleted.

**#14 stays open.** It is labelled `ready-for-human`, the wording of a product claim is positioning, and positioning is the operator's call. The draft is a proposal; the reasoning and its Revisit-if are in the issue comment.

### The guard fired once and was right

`guard-downstream-framing-gh.py` caught the PR #17 body — reviewer prompts, no Revisit-if. Added. The hook installed one session earlier did its job on the first real body it saw that was not written to satisfy it.

### BLOCKERS

**The technical blocker is gone.** ADR-0002 decision 4 no longer sits on the healthy path. Scan code is unblocked once #17 merges.

**Gate 1 is unchanged and is not technical.** Five teams. Instruments written and waiting in `docs/demand-test/`. It advances when the operator sends. The Reddit diagnosis is the first send.

### EXACT NEXT STEPS

1. **Merge PR #17**, or review it first. Decision 3 is the judgement call in it; decisions 1 and 2 follow from observations and three documentation pages.
2. **#16 — transcribe six settled decisions** into `CONTEXT.md`, then remove `asserted_without_adr` entries 1–6 from `store.json` or the two surfaces disagree again.
3. **#15 — re-verify `notion-api-practice.md`.** One headline claim was false; the rest is untested.
4. **#10 — ratify the proof.** Its blocker (#13) is resolved. Its checklist still holds an item that cannot be run as written.

**NEXT-MODEL:** fast tier. #15 and #16 are transcription and re-verification against named sources — separable execution mechanics with no ambiguity left in them. **Do not add PR #17's review to that session**; a review of decision 3 is judgement under changed evidence and belongs to a frontier session of its own, before or after, never straddling.

**NEXT-REPO/CWD:** `C:\Users\mlpgr\2026_Projects\workspace_lint` — single repo; state, plan and resume ritual all live at the root.

**SELF-ASSESS:** VERDICT: 2 (ADR-0006 and the `PRODUCT.md` narrowing both landed; the per-endpoint audit found a limit the issue did not know to ask for) · ATTRIB: skill

### Standing cautions carried forward

All S004 and S005 cautions still hold — live token in `.env` (11 of 12 values filled, `REAL_ROOT_ID` deliberately empty), the fixture is a mutable instrument with `wl-revoke-child` currently disconnected, Q3's stability is provisional, Q4 and Q5 are out of fixture reach, ADRs are never edited in place, the ISO 19011 / ISA 705 citation hazard stands, and `~/.claude/settings.json` is gitignored so the guard wiring exists only on this machine.

New, and both are unverified numbers now sitting in a locked ADR:

- **The `10,000` cap constant is vendor-documented and unobserved.** No real capped response has confirmed it. Vendor documentation has already been wrong once here — `notion-api-practice.md` §5.2. When it reaches code it needs a named constant, a comment pointing at ADR-0006, and a test that fails loudly on disagreement.
- **`request_status: {"type": "complete"}` has never been seen on either branch.** No decision depends on it. No code path may block on its arrival.


---

## S005 — 2026-08-17 — Tracker reconciled, enforcement gap closed, three skills extracted

**PHASE:** Pre-build. No source code. Build gate closed. No product artifact this session — process and tracker only.

**TESTS:** None. No toolchain. Not a gap.

**ALL WORK LANDED.** Repo: this checkpoint. Tracker: issues #13–#16 open, six closed. `~/.claude`: commits `9f332bb` (hook) and `0824c86` (skills).

### The tracker and the state file had been disagreeing about what was settled

Ten issues had sat in `needs-triage` since 2026-08-16 with no category role. **Six of them were not open questions.** `store.json` → `asserted_without_adr` already held an answer for #2, #3, #4, #5, #6 and #9, and in every case it matched the issue's own stated Default word for word.

Consolidated into **#16** (`ready-for-agent`) — transcribe the six decisions into `CONTEXT.md`, which is what each issue's own "What closes this" asked for. The six are closed as duplicates with their problem statements intact and reopenable.

Remaining open, all now carrying a category role:

| # | State | Blocked on |
| --- | --- | --- |
| #1 primary user | `needs-info` | the demand test — five teams, not a decision |
| #7 performance budgets | `needs-info` | a named reference workspace; `REAL_ROOT_ID` is deliberately empty |
| #8 npm name | `ready-for-human` | a brand choice with three costed options |
| #10 ratify the proof | `needs-triage` | #13, plus a checklist item that cannot be run as written |
| #13 supersede ADR-0002 d4 | `ready-for-agent` | nothing — **this blocks scan code** |
| #14 correct `PRODUCT.md` | `ready-for-human` | nothing — do before a buyer sees the claim |
| #15 re-verify research | `ready-for-agent` | nothing |
| #16 record six decisions | `ready-for-agent` | nothing |

### An enforcement gap, and two wrong claims corrected on the way to it

`downstream-instruction-framing` is marked mandatory. Issues #13–#15 instruct a downstream reader on architectural decisions, were created through Bash heredocs, and **were seen by no guard**: the `UserPromptSubmit` nudge keys on prompt text (the prompt was "complete all github work"), and the file guard keys on tool surface (never `Edit`/`Write`). That is §1's loop-survival test failing in the field.

Closed with `guard-downstream-framing-gh.py` on the PreToolUse Bash matcher. Validated against the three real bodies — all had zero `Revisit if` clauses and would have drawn the tier-2 reminder. Revisit-if sections were then written into all three by hand.

**Two claims made during the sweep were wrong and were corrected by checking, not arguing.** The skill-rules file was at `~/.claude/hooks/skill-rules.json`, not missing. And the existing file guard *had* fired on ADR-0005 and passed it, because the ADR carries a `Revisit if` section — the earlier statement that enforcement never reached the ADR was false.

**The new guard blocked the commit that installed it.** Its command regex was unanchored, so it matched prose inside a heredoc that merely mentioned the CLI, and it scanned the whole command rather than the artifact body — so a message quoting the anti-pattern in order to forbid it read as committing it. Fixed by anchoring to shell command positions and splitting heredoc body from shell.

### Three skills extracted

Two to `~/.claude/skills/_quarantine/` — promotion needs manual §1.5 review:

- **`interactive-script-phantom-answers`** — the TTY/EOF failure that fabricated `REVOCATION_SUPPORTED=no`.
- **`pretooluse-bash-guard-prose-false-positive`** — command-position anchoring and heredoc splitting for Bash guards.

One update: **`windows-claude-code-env` 1.5.0 → 1.6.0**, new Problem 11 — Git Bash hidden-input Ctrl-V paste corruption and the empty-bodied HTTP 400 it produces.

### BLOCKERS

Unchanged from S004. **#13 blocks scan code.** Gate 1 still needs the operator to send.

### EXACT NEXT STEPS

1. **#13 — ADR-0006**, superseding ADR-0002 decision 4. Also place "uninformative" on ADR-0005's evidence-sufficiency axis; it is none of the three existing values.
2. **#14 — correct `PRODUCT.md`.** Say what is provable and stop.
3. **#16 — transcribe six decisions** into `CONTEXT.md`, folding in the two corrections named in that issue.
4. **#15 — re-verify `notion-api-practice.md`.** One headline claim was false; the rest is untested.

**NEXT-MODEL:** frontier for #13 and #14 — a superseding ADR and a restated product claim, both judgment under changed evidence. #15 and #16 are mechanical and belong in their own fast-tier session. Do not straddle tiers in one session.

**NEXT-REPO/CWD:** `C:\Users\mlpgr\2026_Projects\workspace_lint`

### Standing cautions carried forward

All S004 cautions still hold — live token in `.env` (11 of 12 values filled), the fixture is a mutable instrument with `wl-revoke-child` currently disconnected, Q3's stability is provisional, Q4 and Q5 are out of fixture reach, ADRs are never edited in place, and the ISO 19011 / ISA 705 citation hazard stands.

New: **`~/.claude/settings.json` is gitignored.** The `guard-downstream-framing-gh.py` wiring exists only on this machine; the hook file is committed but the PreToolUse entry is not.

---


---

## S004 — 2026-08-17 — The proof ran and spent three standing beliefs

**PHASE:** Pre-build, but the 72-hour proof is no longer hypothetical. Four of eight proof questions now have answers. Still no source code. Build gate still closed — and one of the findings is a reason not to open it yet.

**TESTS:** None. No toolchain. Not a gap.

**ALL WORK MERGED TO `main`.** PR #12 (`ebdae1b`) plus eight direct commits, ending `4d80b1a`. Nothing in flight.

### The three findings, in order of cost

**1. ADR-0002 decision 4 is inoperable. It blocks scan code.**
Decision 4 makes the *absence* of `request_status` from a paginated list response a hard error. Observed live at `Notion-Version: 2026-03-11`: the field is absent from **every** normal response — data-source query with `has_more: true`, block children with `has_more: true`, block children with `has_more: false`. The primary reference documents it as **conditional**, emitted at the 10,000-result cap, and prescribes a *positive* test: `request_status.type === "incomplete"`. As written, decision 4 hard-errors every healthy scan and never fires on a degraded one. The intent was right; the mechanism is inverted. ADR-0002 is **not** edited — decisions 1, 2, 3 and 5 stand.

**2. The detectable hole does not exist. This is the expensive one.**
`docs/research/notion-api-practice.md` §5.2 claimed a `child_page` block stays visible with ID and title even when the page 404s — *"a named, enumerable hole"* — and flagged itself as *"the highest-value item to verify directly in the 72-hour proof, because a completeness proof would rest on this mechanism."* **Refuted.** After disconnecting `wl-revoke-child`, the parent returns 2 blocks instead of 3 and the `child_page` block is gone; the child 404s on `/pages`, `/blocks` and `/blocks/children`. Control via the full-access connector: the page still exists at the same ancestor path, so the list is permission-filtered, not structurally changed. §5.2's "detectable" and "undetectable" holes are one case.

**3. ADR-0005 decision 5 survived its Revisit-if.**
A 151-block page paged as 100 + 51 with `has_more` and `next_cursor`, totalling exactly 151. Enumeration **is** separable from fetching, so the five-stage funnel's `enumerated` stage has an API basis and an unbounded gap is detectable. No change needed.

### What the refutation does to the product claim

**Survives:** ADR-0002's declared-root model. *"Everything you declared was read"* is still provable, because the operator supplies the denominator.

**Promoted:** **REF001 is now the load-bearing coverage mechanism.** A *link* to an inaccessible page survives revocation, because links live in page content rather than in the permission-filtered child list. Confirmed — `wl-outside-grant` is linked from readable content and returns 404. That 404 also confirms Principle 3's premise directly: an unconnected page returns 404, not 403.

**Narrows:** inside a declared root, `unreached` arises only from rate limits, budget exhaustion, or abandoned pagination — **never** from permissions. Permission removal below a declared root is silent: the scan cannot count it, name it, or report it.

**The rule that came out of it:** the coverage manifest can only name what the operator declared, or what the tool successfully enumerated. Nothing else is expressible.

**Strategic cost, stated plainly.** This is partial evidence for the wildcard objection in `docs/research/coverage-artifact-prior-art.md` §5.1 — *"what I could not see may reduce to everything you did not give me."* It does not carry the objection all the way. It does mean `PRODUCT.md` overstates the claim and must be corrected before a buyer sees it.

### One inference was withdrawn mid-session

From the operator's screenshot of Notion's disconnect dialog, it was written into `docs/proof/fixture.md`, this checkpoint and a gate event that `unreached` inside a declared root is reachable by permissions. The API refuted it the same day. The paragraph carrying that inference also carried the label *"UI capability CONFIRMED; API consequence OPEN"* — the label was right and the inference beside it was not. **A UI affordance is not an API behaviour, and the label is not the safeguard; making the request is.**

### Also landed

- `scripts/setup-proof-fixture.sh` — hardened three times after real failures: a TTY guard with a `/dev/tty` fallback, non-empty prompts, a y/n gate with no default, and a token that is verified against `GET /v1/users/me` before it is written. Its remaining job is small; the fixture already exists.
- `docs/proof/fixture.md` — what exists, built how, and which measurements the build method could distort.
- `docs/proof/results.md` — the run, with every claim traced to a call.

### BLOCKERS

**One is new and it is technical.** `request_status` handling must be decided before scan code, because the current rule sits on the healthy path.

**Gate 1 is unchanged.** Five teams. Instruments written and waiting in `docs/demand-test/`. It advances when the operator sends. The Reddit diagnosis is the first send.

### EXACT NEXT STEPS

1. **ADR-0006, superseding ADR-0002 decision 4.** Positive test for `request_status.type === "incomplete"`. Decide also where an *uninformative* response sits on ADR-0005's evidence-sufficiency axis — it is neither `sufficient` nor `unreached`, and that gap is real.
2. **Correct `PRODUCT.md`.** State what is provable — declared-root coverage plus link resolution — and stop there. Working in `store.json` → `corrections_pending`.
3. **Re-verify the rest of `notion-api-practice.md`.** One of its two headline claims was false. The remainder is untested and should be treated as suspect.
4. **Finish the cheap proof questions.** Property-ID survival across a type change is ready to run — `TYPE_CHANGE_PROP=Status` in `.env`. Q3 needs a re-run against real content.

**NEXT-MODEL:** frontier model. Step 1 is a superseding ADR and step 2 restates the product's central claim after a refutation. Both are judgment under changed evidence. Steps 3 and 4 are mechanical and could go to the fast tier in a **separate** session — do not straddle the tiers in one.

**NEXT-REPO/CWD:** `C:\Users\mlpgr\2026_Projects\workspace_lint`

### Standing cautions carried forward

- **`.env` holds a live read-only Notion token.** Gitignored. Eleven of twelve values filled — `REAL_ROOT_ID` is the only empty one, deliberately, and Q8 stays unmeasured until it is set.
- **The fixture is mutable and is an instrument.** Editing rows, blocks or titles by hand changes what the proof measures. `wl-revoke-child` is currently disconnected — restoring it resets Q1.
- **Q3's stability result is provisional**, confounded by bulk-created timestamps. Do not promote it without a re-run against organic content.
- **Q4 and Q5 remain out of reach** of any hand-built fixture — Q4 needs a workspace over 11,200 objects; Q5 is a local Semgrep CLI test.
- **ADRs are never edited in place.** Refuted claims standing in ADR-0002 and ADR-0003 are correct, not bugs.
- **Citation hazard unchanged.** ISO 19011 and ISA 705 were read from unauthorised copies. Cite by clause; publish no URL.

---

## S003 — 2026-08-16 — ADR-0005 locks the outcome model; the 72-hour proof is unblocked

**PHASE:** Pre-build. No source code. Build gate still closed. The sweep banked in S002 was spent into one decision.

**TESTS:** None. No toolchain. Not a gap.

**ALL WORK LANDED AND MERGED.** PR #12, merged to `main` as `ebdae1b` on 2026-08-17. Branch `docs/adr-0005-outcome-model`, two commits — `db02541` (the ADR) and `af341e4` (the S003 close). Three content files:

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

1. **The fixture page tree already exists.** Built 2026-08-17 via the claude.ai Notion connector; IDs are in the gitignored `.env`; the full record, including the confound analysis, is `docs/proof/fixture.md`. Nine of twelve `.env` values are filled. **Two human steps remain and neither can be delegated:** create the `workspace-lint-proof` integration (Read content only), connect it to `wl-proof-fixture`, and paste the token; then attempt the revocation on `wl-revoke-child` and record `REVOCATION_SUPPORTED`. `scripts/setup-proof-fixture.sh` still walks both. **Step 2 is itself a proof result** — see below.
2. **Run the 72-hour proof as a `/prototype` on a `prototype/api-proof` branch** — not as build phase 0. ADR-0005 now defines what it must measure. `store.json` → `unknowns_assigned_to_proof` holds **eight** questions; three were added this session and all three test ADR-0005 itself:
   - Do `unreached` and `undecidable` ever diverge against a workspace with a deliberately unshared subtree? If they never separate, collapse evidence sufficiency to two values.
   - Can enumeration and fetching be separated against the real API? If not, the `disclaimed` disposition loses its trigger.
   - How often does `disclaimed` fire on a real workspace? If it is the normal case, ADR-0002's declared-root model needs revisiting before ADR-0005 does.
3. **The demand test needs no session.** The instruments are written. The Reddit diagnosis is the first send and the words are the operator's.
4. **Do not open Configuration Status Accounting yet.** ADR-0005 deferred it deliberately; it is blocked on re-verifying MIL-HDBK-61A Fig 8-3, which no verifier has checked.

**The revocation question is answered, and ADR-0005 does not narrow.** `docs/research/notion-api-practice.md` §5.2 rated selective revocation `(C)` — community reports, no reproduced primary write-up. Observed directly on 2026-08-17: Notion offers it, with a dialog reading *"Disconnect workspace-lint-proof and unlink share settings from parent page? This page will no longer inherit share settings from its parent. Admins can still restore settings later."*

Notion models it as **breaking inheritance**, not as a per-child deny, and the action is admin-reversible — so a recorded gap is a fact about one scan window, which is what ADR-0002 decision 5 already implies by requiring start and end times.

**Then the API refuted the thing that mattered.** `docs/research/notion-api-practice.md` §5.2 claimed a `child_page` block stays visible in the parent even when the child 404s, called it a "named, enumerable hole," and flagged it as *"the highest-value item to verify directly in the 72-hour proof, because a completeness proof would rest on this mechanism."* Verified 2026-08-17: **it is false.** After the disconnect the parent returns 2 blocks instead of 3 and the `child_page` block is gone, while the page still exists at the same ancestor path under full access. The child list is permission-filtered. §5.2's "detectable hole" and "undetectable hole" are one case, not two.

**An inference recorded earlier the same day is withdrawn.** From the UI dialog alone it was written here and in `docs/proof/fixture.md` that `unreached` inside a declared root is reachable by permissions. It is not. Revocation removes the resource from enumeration, so it never enters the applicable set. Inside a declared root, `unreached` comes only from rate limits, budget exhaustion, or abandoned pagination. Permissions produce a detectable gap at exactly one place — an inaccessible **declared root** — and only because the operator declared it.

**The rule that came out of it:** the coverage manifest can only name what the operator declared, or what the tool successfully enumerated. Nothing else is expressible. **REF001 is now the load-bearing coverage mechanism** — a *link* to an inaccessible page survives, because links live in page content rather than in the permission-filtered child list. Confirmed working: `wl-outside-grant` is linked from readable content and returns 404 on retrieve.

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
