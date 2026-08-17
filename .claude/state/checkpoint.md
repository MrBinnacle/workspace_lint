# Checkpoint — workspace_lint

Bands S001–S005 are archived verbatim at `.claude/state/checkpoint-archive.md`. This file holds
the standing constraints and the current band only.

## Standing constraints — always current, not session-scoped

**This block is the authority.** Each band below also ends with a "Standing cautions carried
forward" paragraph that points at the band before it. Those paragraphs are dated records and stay
standing, but the chain they form is broken by the archive — read this block instead. Nothing here
is safe to drop because a band was archived.

**Fixture and credentials.**

- `.env` holds a **live read-only Notion token**. Gitignored. Eleven of twelve values filled.
  `REAL_ROOT_ID` is the only empty one, deliberately, and Q8 stays unmeasured until it is set.
- **The fixture is mutable and it is an instrument.** Editing rows, blocks or titles by hand
  changes what the proof measures. **`wl-revoke-child` is currently disconnected** — restoring it
  resets Q1.

**Proof questions.** Full status in `store.json` → `unknowns_assigned_to_proof`.

- **Q3's stability result is provisional**, confounded by bulk-created timestamps. Do not promote
  it without a re-run against organic content.
- **Q4 and Q5 are out of reach of any hand-built fixture.** Q4 needs a workspace over 11,200
  objects; Q5 is a local Semgrep CLI test with nothing to do with Notion.

**Documents.**

- **ADRs are never edited in place.** A refuted claim standing in ADR-0002 or ADR-0003 is correct,
  not a bug. **Living docs — `PRODUCT.md`, `CONTEXT.md` — are corrected directly.** That carve-out
  is the whole rule; without it the constraint reads as "never correct anything."
- **ADR-0005's evidential floor is uneven and the ADR says so.** Decisions 1–3 rest on
  adversarially re-verified primary sources. Decision 5's funnel rests on CONSORT 13a/13b, PRISMA
  16b and STROBE 13 — **fetched but never re-verified**, adopted on three-way convergence.
  Re-verify the clause numbers before quoting them anywhere published.
- **A refuted claim is never in one place.** Twice now it has been three surfaces. Grep before
  asserting a correction is scoped.

**Research method.**

- **Scouts self-nominate their softest claims.** Use those to prioritise verification, **never to
  bound it.** One scout's file came back stronger than it flagged; the genuine errors were
  elsewhere.
- **Citation hazards** — full list in `store.json` → `citation_hazards`. ISO 19011:2018 and ISA
  705 were read from unauthorised copies: cite by clause or paragraph, publish no URL. Six further
  standards were reached only through consultancy paraphrase and are not citable at clause level.
- **`docs/inputs/` holds inputs, none canonical**, with differing evidentiary weight. Do not treat
  them as parity.

**Numbers now sitting in a locked ADR, both unverified.**

- **The `10,000` cap constant is vendor-documented and unobserved.** No real capped response has
  confirmed it, and vendor documentation has already been wrong once here
  (`notion-api-practice.md` §5.2). When it reaches code it needs a named constant, a comment
  pointing at ADR-0006, and a test that fails loudly on disagreement.
- **`request_status: {"type": "complete"}` has never been seen on either branch.** No decision
  depends on it. No code path may block on its arrival.

**Environment.** `~/.claude/settings.json` is gitignored, so the `guard-downstream-framing-gh.py`
PreToolUse wiring exists only on this machine. The hook file itself is committed.

**Operator rulings** are in `store.json` → `operator_rulings` and in project memory. They are not
restated here.

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
