# Checkpoint — workspace_lint

Bands S001–S009 are archived verbatim at `.claude/state/checkpoint-archive.md`. This file holds
the standing constraints and the current band only.

## Standing constraints — always current, not session-scoped

**This block is the authority, and it is complete on its own.** Archived bands each end with a
"Standing cautions carried forward" paragraph pointing at the band before it. Those paragraphs are
dated records and stay standing in the archive, but the chain they form does not survive rotation —
read this block instead. Nothing here depends on a band still being present.

**Credentials and fixture.**

- `.env` holds a **live read-only Notion token**. Gitignored. **It cannot be read by any tool** —
  CC Safety Net blocks it on `secret.basename.env`, and the block forbids workarounds. Do not spend
  a session-start step attempting it.
- **A process may read `.env` even though you may not.** Proven 2026-08-17: `prototypes/live-ref001.ts`
  — **on branch `proto/ref001-observed`, not on `main`** — parses it with `fs` and calls the API. That is normal operation, not a workaround — the discipline
  is that **the token never reaches stdout**. That file routes every line through a `scrub()` and sets
  the SDK's `logLevel: 'error'`, because the SDK's own warn logger bypasses application redaction.
- **`NOTION_TOKEN` and `FIXTURE_ROOT_ID` are now CONFIRMED GOOD** — eight live calls succeeded on
  2026-08-17. `UNSHARED_PAGE_ID`, `REVOKE_PARENT_ID` and `PAGINATION_PAGE_ID` are confirmed by use.
- **`REAL_ROOT_ID` is still unexercised.** Nothing has called it. Q8 and the Q3 re-run against organic
  timestamps remain open, and **#7** with them.
- **The PAT is ruled out and no longer needs testing.** A PAT's API capability is a single bundle —
  *"Read, create, update, and search content"* — with no read-only variant, so it violates **Principle 7**
  at the credential layer. **Do not run the PAT fixture test in #27's DoD.**
- **The fixture is mutable and it is an instrument.** **`wl-revoke-child` is still disconnected**,
  re-confirmed live 2026-08-17 — restoring it resets Q1. `wl-outside-grant` is the working REF001
  control: 404 on retrieve, link readable.

**Proof questions.** Full status in `store.json` → `unknowns_assigned_to_proof`.

- **Q3's stability result is provisional**, confounded by bulk-created timestamps, and the live run did
  **not** touch it — no repeated identical query was made.
- **Q4 and Q5 are out of reach of any hand-built fixture.**

**Documents.**

- **ADRs are never edited in place.** A refuted claim standing in ADR-0002, ADR-0003 or ADR-0008 is
  correct, not a bug. **Living docs — `PRODUCT.md`, `CONTEXT.md` — are corrected directly.** That
  carve-out is the whole rule; without it the constraint reads as "never correct anything."
- **`docs/spec/` exists as of 2026-08-17** and holds per-rule behavioural specs. Same evidence class
  as `docs/adr/`, differing in **scope, not authority**: an ADR decides something cross-cutting, a
  spec decides how one rule behaves. **A spec never supersedes an ADR** — where they disagree the
  ADR wins and the spec is the defect, which has already happened once (spec §5, exit byte).
  Unlike an ADR a spec **is** edited in place. Registered in `docs/agents/domain.md`.
- **ADR-0005 decision 4, ADR-0008 decision 4 and ADR-0008 decision 2's coverage clause are
  superseded by ADR-0011**, merged to `main` in PR #38. The coverage ratio is **per rule, over that rule's own
  coverage item**, and the report publishes the **vector**; the headline is the **minimum**, never a
  mean. `--min-coverage` is a floor on **every** rule. Everything else in both ADRs stands, including
  ADR-0005 decision 4's prohibition on publishing a ratio alone, which ADR-0011 strengthens.
- **ADR-0008 decision 6 is superseded by ADR-0010.** Cite ADR-0010 for anything about fingerprints,
  baseline matching or finding identity. ADR-0008 decisions 1–5 and 7 stand unchanged, as do decision
  6's four SARIF constraints and its two-hazard analysis.
- **ADR-0006 decision 2's search row is superseded by ADR-0007.** Cite ADR-0007's table.
- **ADR-0005's evidential floor is uneven and the ADR says so.** Decision 5's funnel rests on CONSORT,
  PRISMA and STROBE clauses **fetched but never re-verified**.
- **A refuted claim is never in one place.** Four times now. Grep before asserting a correction is scoped.

**Research method.**

- **Citations are receipts.** A claim carries a locator a third party can follow — URL plus fetch date,
  file plus **section heading**, commit SHA, clause number. Never a line number written as a section.
- **A negative about an endpoint requires that endpoint's own page**; **a claim about a model requires
  that model's own reference**. And now a fourth shape, recorded on **#25**: **an ADR that contradicts an
  earlier ADR is caught by none of the three method rules**, because rule 1's grep targets
  `docs/research/`. If the grep becomes a hook it covers one shape of four as specified.
- **Citation hazards** — ISO 19011:2018 and ISA 705 were read from unauthorised copies: cite by clause,
  publish no URL.
- **Research agents cannot reach Reddit.** The solo and small-team willingness-to-configure verdicts
  are produced by a blocked crawler, not by an absence in the world.

**Numbers and facts that are unverified, and stay labelled so.**

- **The `10,000` cap constant is vendor-documented and unobserved.**
- **`request_status` has never been seen on either branch.** Re-confirmed absent from all eight live
  responses. No code path may block on its arrival; the test is positive only.
- **Only `app.notion.com` is evidenced as an internal-link host**, and **`*.notion.site` is
  documented**. `notion.so`, `www.notion.so` and `notion.com` are **not checked** — no locator
  exists for any of the three. They were removed from the prototype's host list on 2026-08-17 and
  travel the residue path instead. Settled by `docs/spec/REF001-link-recognition.md` §2.1, **merged
  to `main` in PR #37**. **#34 is CLOSED.**
- **Notion IDs are time-ordered, so an ID PREFIX is not a discriminator in this workspace.** The
  declared root and two of its children share **eight leading hex digits**. `#42`'s first live run
  rendered three distinct resources identically as `«3bf1351d…»` and the manifest read like a
  double-count when it was correct. **Print the full hyphenated ID; match on the full ID or on the
  SUFFIX**, which is what `docs/proof/fixture.md` records and what `slice/fixture-oracle.ts` uses.
- **A redaction control with a hole in it is worse than no control.** `#42` printed page titles into
  its call log — the pagination helper's endpoint label was the alias — four lines under a report
  asserting *"page titles redacted by default"*. The report makes the guarantee either way and the
  reader cannot tell. **Assert redaction over EVERY rendered line, never over one section.**
- **The host set is unbounded and no allow-list can ever be complete.** Notion documents custom
  domains for Sites — *"Workspace owners on paid plans can connect their existing custom domains"* —
  so a page can be served from a domain Notion does not own. This is why the `unrecognised` residue
  path is the primary detection mechanism and the host list is only an optimisation. Do not let a
  future session re-frame the host list as the soundness mechanism.

**Environment.** `~/.claude/settings.json` is gitignored, so the `guard-downstream-framing-gh.py`
PreToolUse wiring exists only on this machine. **CC Safety Net failed closed once on a long
`gh issue create` heredoc** — write the body to the scratchpad and pass `--body-file`. The
**`guard-canonical-doc-edit.py` (added 2026-08-17) blocks `Edit`/`Write` to `CONTEXT.md`,
`PRODUCT.md`, `docs/adr/**` and `docs/spec/**` unless an approved plan under `~/.claude/plans/`,
modified within 24h, **names that file**.** The approved plan's Files table is the authorisation
token. **There is deliberately no environment-variable escape** — an env var is a blanket unlock the
model can set for itself, which is the failure the guard exists to stop. The escape is
`EnterPlanMode` → name the file in the plan → `ExitPlanMode`. **Not guarded, deliberately:**
`.claude/state/*` (the close ritual writes it after the plan is spent) and `docs/research/` +
`docs/proof/` (evidence, appended not decided — and gating them would tax the activity that outranks
an ADR on a question of fact). Suite: `~/.claude/hooks/test_guard_canonical_doc_edit.py`, 32
assertions **including a mutation check**, plus a 6-case end-to-end run against the wired hook. It
exists because the §5 plan gate was model-pull and failed on two consecutive sessions. The
`guard-git-pull-rebase.py` hook **blocks bare `git pull`**; use `git fetch origin <branch>` then
`git merge --ff-only origin/<branch>`. **`guard-gh-issue-triage-label.py` blocks `gh issue create`
without a triage-role label**, reading the roles from `docs/agents/triage-labels.md`; escape is
`TRIAGE_LABEL_ACK=1`. Its wiring is machine-local for the same reason the others' is.

**The gates. Both of them are closed, and nothing gates the build.**

- **Gate 1, the demand test — CLOSED 2026-08-17** on owner research rather than on a five-team send.
  #40 closed with it. Framing 2, the zero-config decay report, is the entry point. **It chose an
  entry point and did not establish a price** — no willingness-to-pay figure exists for any framing.
- **Gate 2, the 72-hour proof (#10) — CLOSED 2026-08-17** by the operator, on the grounds its own
  triage comment gave: circular as filed, six of nine checks requiring the build it existed to gate.
  Its checks are **build-acceptance criteria**, not pre-build gates.
- **Gate 3, build at n=1, is live, and #42 has landed.** Tracked as #42 **DONE** → #43, #44 in
  parallel → #45 → #46. #10's "no source on `main`" constraint is discharged; building on a branch
  from `proto/ref001-observed` is now a preference.
- **Source code exists, on `build/t1-scan-scaffold`, in `slice/`.** Commits `0ac7c2d` and `9dcb069`.
  A **`private: true`** package named `slice-v0.1`, deliberately **not** `src/` and not on `main`:
  `src/` asserts *this is the product tree*, and that claim is due the same day **#8** lands.
  **#8, the npm name, is now the only thing between this branch and `main`** — `CONTEXT.md` requires
  it "before the first `package.json`", and a private unpublishable package does not consume it.
  Suite: `cd slice && npx tsx CHECK-scan-scaffold.ts` — **50 checks, offline, no network, no token**.
  Live: `npx tsx cli.ts scan --config ../wl.config.json --oracle`, after
  `npx tsx make-fixture-config.ts` writes the gitignored config from `.env`.
- **#14 is CLOSED** — finished in `cc16d63` on 2026-08-16, and three checkpoints carried it as the
  blocker anyway.

**What still holds about the proof:** the fixture is **narrower than #10 specified** — one data
source rather than three, no archived target, no seeded `UNQ001`, `SCH001`, `DEP001` or `CAN001`.
Any recorded build result must state which criteria the fixture could not exercise.

**Three disciplines this cost.** Cite `PRODUCT.md` by **heading** — "Gates, in order", "Kill
criteria" — never by line number. **Deref a NEXT-STEPS blocker against the artifact before adopting
it**; `git log -- <file>` is usually enough. And **read an issue's COMMENTS, not only its body** —
`gh api repos/OWNER/REPO/issues/N/comments`. A merged spec shipped two defects that #10's triage
comment had already corrected, and `docs/inputs/` was skipped a third time the same session. **The
artifact was opened and the discussion attached to it was not** — that is one failure shape, and it
fired twice in one session.

**No session grades. Operator ruling 2026-08-17:** *"We're not doing these grades anymore. It's a
waste of tokens."* Do not solicit a `VERDICT`, do not write a `SELF-ASSESS` line. Every other step
of the close ritual still runs; the ritual line records `verdict=n/a`.

**Operator rulings** are in `store.json` → `operator_rulings` and in project memory.

---

---

---

---

## S014 — 2026-08-17 — The first product code, and the live run found two defects the green suite could not

**PHASE:** **BUILD, and building.** Gate 3's first tracer bullet landed. `#42` is built, reviewed
and committed on `build/t1-scan-scaffold`. **The stop condition did not fire** — the scan produced a
coverage manifest against a declared root, read-only, with no LLM.

**TESTS:** `tsc --noEmit` clean. **50 offline checks pass** (`slice/CHECK-scan-scaffold.ts`), no
network and no token. **Two mutation checks, both live:** TEST 5 disables `gapsFrom` and the exit
byte moves **3 → 0**; TEST 7 removes a required child and the oracle goes **red**. Live run: **exit
3**, 4 applicable, 3 fetched, **0 evaluated**, 6 requests, 1.78 s, `ORACLE MATCHED`.
`grep -ci "ntn_\|secret_"` over full output: **0**. Titles in output: **0**.
**Deref: 11 checked / 0 flagged / 11 hand-verified.**

**COMMITTED:** `aaab38f` (merge main), **`0ac7c2d`** (T1 scaffold), **`9dcb069`** (report seam +
fixture oracle). **Nothing merged to `main`. Nothing pushed.** **COMMENTED:** #42, #43, #44, #45,
#46, #8.

### The design point that governs #43

`#42` says *"no rules yet."* ADR-0005 decision 5's `evaluated` stage means **a rule judged it**. So
this slice evaluates **nothing** and names that cause on every resource. Three consequences, and a
later session must not re-derive them:

1. **The ADR-0011 coverage vector is EMPTY.** The printed `0/4` and `3/4` are **funnel** figures with
   the unit `resources` named on the line. **They are not a coverage ratio.**
2. **Exit `0` is unreachable in T1 by construction.** A perfect run still exits `3`. #43 is the first
   ticket that can return `0`.
3. **`newUnsuppressedFindings: 0` is passed explicitly.** `deriveVerdict` defaults it to
   `violations + gaps.length`, which would exit `1` on a slice with no findings at all. **This is the
   single most likely place for #43 to put the exit byte quietly wrong.**

Letting `evaluated` mean "fetched without error" would have printed a `3/4` that reads as rule
coverage and is not — the flattering direction, inside the coverage instrument.

### Running it against the real workspace is what found the bugs

The offline suite was green before either defect was visible. **That is the argument for Gate 3 in
one line.** Titles reached stdout under a report claiming redaction; three distinct resources
rendered identically because Notion IDs are time-ordered. Both fixed, both now in the standing
constraints above, both regression-checked over *every* rendered line rather than one section.

### Acceptance criterion 1 is OPEN, deliberately

Spec §2 criterion 1: *"The hand-written manifest is the test oracle and must be written **before**
the run."* None existed when `#42` ran, so its applicable set of 4 was validated **against the code's
own output** — the defect class this product exists to detect. `slice/fixture-oracle.ts` now
pre-registers the expectation, transcribed from `docs/proof/fixture.md`'s "What exists" table, and
**closes the criterion for #43's run, not retroactively for #42's.** It matched live, including both
absence predictions: `wl-outside-grant` is not a child of the root, and **`wl-revoke-child` is still
invisible**, which re-confirms Q1 against the live API on 2026-08-17.

### The review ran without its context isolation, and the close says so

`mattpocock-skills:code-review` spawns two sub-agents so the axes cannot pollute each other. **Both
idled repeatedly and neither ever returned a report** — three notifications from one, four from the
other. Both axes were then run in the main context. Every finding was checked against the files
(`verdict.ts` byte-compared to the frozen prototype, every cited ADR decision number resolved,
ADR-0008's exit table compared row by row), but **no independent context confirmed them.** Findings:
0 hard violations, 4 judgement calls, 2 partial spec requirements.

### Two skills could not be invoked, and that is a harness fact, not a missing install

**14 of the 25 registered** `mattpocock-skills` carry **`disable-model-invocation: true`** (20 of
the 35 `SKILL.md` files on disk, but 10 of those are unregistered `in-progress/` and `misc/`). The
flag hides a skill from the model's listing **and refuses the `Skill` tool outright even after the
operator types the name**. A slash command typed **mid-turn** arrives as literal text and never expands.
`/to-tickets` and `/implement` both failed this way before `/implement` was re-sent from idle.
Recorded as project memory `hidden-skills-need-their-own-message`.

### BLOCKERS

**None.** #43 and #44 are unblocked and can run in parallel.

### EXACT NEXT STEPS

1. **`/clear`, then `/mattpocock-skills:implement` #43** in a fresh context — sent as its own
   message from idle, or it will not expand. Branch from `build/t1-scan-scaffold`.
   **Run with `--oracle`; criterion 1 closes on that run.**
2. **#44 in parallel**, separate context. `REF001`, the load-bearing mechanism. `prototypes/`
   already holds the recogniser and `docs/spec/REF001-link-recognition.md` specifies it — copy out,
   do not edit the frozen prototype.
3. **Then #45, then #46.** `slice/report.ts` already exists as a separate file so #45 does not
   hand-merge against #43 and #44.
4. **Two human steps, neither blocking:** **#8**, the npm name — now the only thing between the
   branch and `main` — and connecting the integration to `REAL_ROOT_ID`, which #7 needs.
5. **Title redaction is NO LONGER a pending human step.** `#42` implements `CONTEXT.md`'s settled
   default: titles redacted, `--show-titles` opts in, and the live run printed zero titles.
6. **#39, #35, #27, #25, #24, #19, #18, #29, #7** unchanged.

**NEXT-MODEL:** **fast tier.** #43 is separable execution mechanics against a written spec, a
written DoD, and an existing test harness with two working mutation checks — the ambiguity was spent
in #42. **Do not straddle:** if the session would also reopen the manifest serialisation shape, the
npm name (#8), or whether `SYS001` needs its own ADR, that is a frontier head and belongs in its own
session.

**NEXT-REPO/CWD:** `C:\Users\mlpgr\2026_Projects\workspace_lint` — single repo; state, plan and
resume ritual all at the root. The build lives on `build/t1-scan-scaffold` in this same clone.

**NO SELF-ASSESS LINE, BY OPERATOR RULING 2026-08-17.** The ritual line records `verdict=n/a`.
