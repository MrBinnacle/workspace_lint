# Checkpoint — workspace_lint

Bands S001–S006 are archived verbatim at `.claude/state/checkpoint-archive.md`. This file holds
the standing constraints and the current band only.

## Standing constraints — always current, not session-scoped

**This block is the authority, and it is complete on its own.** Archived bands each end with a
"Standing cautions carried forward" paragraph pointing at the band before it. Those paragraphs are
dated records and stay standing in the archive, but the chain they form does not survive rotation —
read this block instead. Nothing here depends on a band still being present.

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

**ADR-0006 decision 2 is partly refuted. Do not cite its endpoint table.** The `POST /v1/search`
row says the endpoint carries no truncation signal. **It does** — Notion's `post-search` reference
documents `request_status`, and `notion-sdk-js` PR #711 adds it to `SearchResponse`. The
block-children row is correct and is now corroborated by that same PR, which omits
`ListBlockChildrenResponse`. ADR-0006 is not edited; **#21** carries the superseding ADR and should
land before **#10** ratifies the proof.

**Environment.** `~/.claude/settings.json` is gitignored, so the `guard-downstream-framing-gh.py`
PreToolUse wiring exists only on this machine. The hook file itself is committed.

**Operator rulings** are in `store.json` → `operator_rulings` and in project memory. They are not
restated here.

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
