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
- **ADR-0012 supersedes NO ADR.** It implements ADR-0011 decision 5 in code. What it supersedes is a
  **code comment** — `slice/verdict.ts`'s S014 header — and it is an ADR at all because that header
  demanded one. **Its decision 7 removes the `gaps.length` conjunct from the exit-`3` predicate:**
  ADR-0008 decision 2's table row stays TRUE and is now a special case, because ADR-0011 decision 5
  states the axis without the conjunct and restates exit `0` as *every rule* at or above the floor.
  With the conjunct, a sub-threshold rule with an empty gap list exited `0` while the reason string
  claimed every rule cleared the threshold.
- **ADR-0013 supersedes NO ADR and EXTENDS ADR-0006 decision 5.** It adds a component the outcome
  model never had: survey methodology splits errors of nonobservation into sampling, **coverage** and
  nonresponse; `unreached` and `undecidable` cover two and coverage error had no axis. **The missing
  component may never be rendered as a number** — two independent literatures, decision 3. An
  unattested enumeration is **not a Gap** and enters no ratio, vector or pervasiveness test. The rule
  is **"no call, no residual", NOT "never both"**: a partial enumeration is legitimately both.
  ADR-0006 decision 5's blind-endpoint disclosure **stands and still ships** — the register is the
  per-resource layer beneath it, and the reason a second layer was warranted is that decision 5's
  disclosure **was already shipping when the false green shipped**.
- **`CONTEXT.md` now carries SEVEN settled defaults and SEVEN glossary distinctions.** The seventh
  default is the tool-competence rule from #35; the seventh distinction is *a residual is not a gap*.
  Both counts were stale-by-one in the file's own prose before this session and are now correct.
- **ADR-0006 decision 2's search row is superseded by ADR-0007.** Cite ADR-0007's table.
- **ADR-0005's evidential floor is uneven and the ADR says so.** Decision 5's funnel rests on CONSORT,
  PRISMA and STROBE clauses **fetched but never re-verified**.
- **A refuted claim is never in one place.** Five times now, and the last was **five surfaces at
  once** — "the project is pre-build", standing in `CLAUDE.md`, `CONTEXT.md`, `README.md`,
  `docs/agents/domain.md` and this file after PR #56. **Grep the STATE, not your phrasing.** The S019
  sweep found two by grepping the words it was replacing (`pre-build`, `no source code`) and missed
  three that asserted the same state differently — `README.md` named the branch, `domain.md` said
  "there is no `src/` yet". A `/code-review` pass found all three. Grep branch names, paths, and the
  negation of the claim you are about to write.

**Research method.**

- **`docs/research/` has an INDEX.md as of 2026-08-17 (#54). Start there, not at the directory.**
  Thirteen files, one line each: the question it answers and what it refutes.
  <!-- claim: count glob="docs/research/*.md" exclude="INDEX.md" equals=13 -->
  Two entries carry notes
  rather than rows — `notion-live-probe.md` holds **observations** but is documented-tier and that is
  **not** a misfiling (it ran through an OAuth connector and ADR-0004 says it "does not clear the REST
  path"); and `unseen-population-sizing.md` vs `frame-completeness-prior-art.md` answer **different**
  questions — *how big is the gap* versus *may the frame be called sufficient* — which nearly produced
  a duplicate sweep.
- **WebSearch is exhausted at 200/200 and has been since before the ADR-0013 sweep.** `WebFetch` and
  the Scholar Gateway MCP still work. Scholar Gateway's corpus is **Wiley**.
- ⚠ **"Not checked" is a verdict, not a first response — work smarter, not harder.** S019 published a
  sweep with **eight** items marked not-checked because `WebSearch` was gone. **Six were one
  `WebFetch` away.** `http://export.arxiv.org/api/query?search_query=...` is a public no-key API and
  reaches the ACM/IEEE-adjacent preprint literature; regulators publish their own guides free
  (`stuklex.fi` turned a second-hand YVL quote into a first-hand one with a better requirement in it);
  and every tool documents itself. **Before writing "not checked", name the route not taken.** When
  nothing works, record the status codes — a 403 and a 402 are evidence, "unavailable" is not.
  Still genuinely blocked as of 2026-08-18: ISO OBP (403), IAEA (402), eCFR (bot-block redirect),
  nrc.gov (403), everyspec (404), and EIA-649 which has no public text at all.
  **The five-tier source ladder is at `docs/agents/domain.md` → "The source ladder".** Work down it;
  "not checked" is earned at tier 4, not reached for at tier 2.
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
**`guard-canonical-doc-edit.py` (added 2026-08-17) blocks `Edit`/`Write` to `CLAUDE.md`,
`CONTEXT.md`, `PRODUCT.md`, `docs/adr/**` and `docs/spec/**` unless an approved plan under
`~/.claude/plans/`, modified within 24h, **names that file**.** **`CLAUDE.md` was added on
2026-08-17 (S019)** after PR #56 left it asserting "Pre-build: no source code exists yet" to every
new session — the guard covered the documents an ADR supersedes and left outside the set the one
every session is bootstrapped from. It is guarded **machine-wide by basename, including
`~/.claude/CLAUDE.md`**; `/init` writing a new `CLAUDE.md` is blocked until a plan names it.
⚠ **The matcher does not distinguish a plan's Files table from its background prose.** A file
mentioned in passing is authorised. Treat the **Files table** as the authorisation; a quiet hook is
not approval. `PRODUCT.md` would have passed on that slack in S019 and was filed as **#61** instead. The approved plan's Files table is the authorisation
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
- **Gate 3, build at n=1: THE TRACER-BULLET SEQUENCE IS COMPLETE.** #42, #43, #44, #45 and #46 are
  all built and all **CLOSED**. #10's "no source on `main`" constraint is discharged.
- **Acceptance criterion 1 is CLOSED** (#43's live run, oracle committed before it, now 17
  comparisons). **Criterion 4 is CLOSED** (#44, on discovery not injection). **Criterion 5 is
  CLOSED** (#45, two live runs byte-identical at 5987 bytes — and the CONTROL is what closes it:
  the same two runs *without* `--deterministic` differ, so the claim is about Normalization
  removing something rather than about a report with nothing volatile in it).
- **SOURCE CODE IS ON `main`, in `slice/`, since PR #56 merged 2026-08-17 at 23:39Z** (merge commit
  `b138063`). This supersedes every earlier band's "not on `main`, nothing pushed" line; those stay
  standing as dated records. **PR #57 was closed unmerged** — `build/t2-sys001` is a strict ancestor
  of `t3`, so it delivered nothing extra, and merging it first would have restored
  `prototypes/verdict.ts`, the second exit-byte implementation ADR-0012 decision 1 deleted.
  A **`private: true`** package named `slice-v0.1`, deliberately **not** `src/`:
  `src/` asserts *this is the product tree*, and that claim is due the same day **#8** lands.
  **#8 no longer blocks anything from `main`.** `CONTEXT.md`'s Name constraint now reads "before the
  first **publishable** `package.json`", which is what the shipped file already asserts about itself.
  The operative trigger is `private: true` being removed or a tree being renamed `src/`.
  Suite: `cd slice && npm run check` — **ONE command, and it typechecks first**: `npm run typecheck
  && ` then NINE files, 38 + 56 + 92 + 124 + 89 + 50 + 76 + 56 + **29** = **610 assertions**, offline,
  no network, no token.
  <!-- claim: count glob="slice/CHECK-*.ts" exclude="CHECK-harness.ts,CHECK-fakes.ts" equals=9 --> ~~`npm run check` DOES NOT TYPECHECK~~ — **#60 CLOSED**, and the
  counterfactual is recorded: `main@f42fadd` printed `ALL CHECKS PASS` at **exit 0** over a tree
  carrying a real `TS2322`. The chain is `&&`, so a type error now stops the gate before any
  assertion runs. **`tsconfig.json` is a GLOB (`*.ts`), not a
  hand-kept list** — it was an explicit 26-entry `include` and a new file was silently untypechecked
  (#55). `CHECK-suite-registration.ts` is the control for both halves and now has FOUR tests: TEST 3
  covers **which** files the typecheck reads, TEST 4 covers **whether anything runs it**. TEST 4
  asserts the whole chain — invocation, that `typecheck` runs a real `tsc`, `--noEmit`, the `&&`
  separator, and the ordering — because asserting invocation alone leaves the control substitutable
  by `"typecheck": "echo ok"`.
  Live: `npx tsx cli.ts scan --config ../wl.config.json --oracle`,
  after `npx tsx make-fixture-config.ts [ENV_KEY]` writes the gitignored config from `.env` —
  **the key argument is how the live exit-byte table was produced.**
- **`prototypes/verdict.ts` NO LONGER EXISTS** (ADR-0012 decision 1). There is **one** executable
  implementation of the exit byte and it is `slice/verdict.ts`. `prototypes/live-ref001.ts` still
  exists and is still the proven `.env`-reading probe, but it **renders no verdict and no exit
  byte** — it exits `0` to mean *the probe completed*, never *the workspace conforms*.
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

**The code, and the four rules it has already paid for.** Added S015, each earned by a defect that
shipped past a green suite.

- **A drop-out carries STRUCTURE, never prose.** `Manifest` stores a
  `Loss { cause, bounded, target }` written by the site that lost the resource. Recovering those
  facts from a cause string was wrong twice in one commit: boundedness was pattern-matched, so a
  root whose child list failed **outright** was `bounded` (exit 3) while one that failed **halfway**
  was `unbounded` (exit 2) — failing harder bought the milder verdict; and `target` was inferred
  from the `resolved` stage, which `scan.ts` stamps straight from the parent's block listing, so a
  child whose own call 404'd was reported `present`.
- **The report may not print a value the run did not compute.** Three suppressions now live in
  `report.ts` because `verdict.ts` is frozen: a **disclaimed** report withholds the headline and the
  conformity ratio (ADR-0005 decision 3 — the per-rule vector still prints, it is evidence not a
  summary); an **exit-4** run prints no disposition, because `deriveVerdict` returns `unqualified`
  when there are no gaps and no violations; an **empty applicable set** has no evidence sufficiency.
  A JSON exporter that serialises the raw `verdict` object reintroduces all three.
- **Test assertions compare with `Object.is`, and section membership means cutting the section out.**
  Both suites carried `String(got) === String(want)`, which passes when the types differ, and
  `/GAPS[\s\S]*<id>/`, which spans the rest of the report. Shared harness: `CHECK-harness.ts`.
- **`evaluated` becomes an INTERSECTION the moment a second rule exists.** ADR-0005 decision 5 says
  *every applicable rule reached a judgement*. A union marks a resource evaluated because one rule
  judged it, and inflates every figure downstream. One edit away in `scan.ts`.
- **Verify a tracker write by reading it back.** `gh issue create` and `gh issue comment` route
  through GraphQL, which returned HTTP 503 for ~15 minutes in S015 while REST reads kept working.
  A retry loop reported success on a 503 body, because `--jq .html_url` prints the error JSON to
  stdout and the check tested only for a non-empty string. **A command's own output is not evidence
  it succeeded** — re-read the comment list. Full account in `gate_events.jsonl`, S015.

**No session grades. Operator ruling 2026-08-17:** *"We're not doing these grades anymore. It's a
waste of tokens."* Do not solicit a `VERDICT`, do not write a `SELF-ASSESS` line. Every other step
of the close ritual still runs; the ritual line records `verdict=n/a`.

**Operator rulings** are in `store.json` → `operator_rulings` and in project memory.

---

---

## S020 — 2026-08-18 — the gate did not compile the code it certified, and one number was wrong in five documents

**PHASE:** **BUILD.** Three units: **#60** (the typecheck in the gate), **#61** (`PRODUCT.md`'s
gate status and the sweep count), **#62** (the declared-baseline claim check). **Three issues
closed, one filed (#65).**

**TESTS:** **546 → 610 assertions across NINE suites**, exit 0, offline. **Thirteen mutation
checks this session, every one scored on the exit code** — three on the typecheck wiring, six on
the claim checker, four in the #61 pass's counterfactual set. Controls green in all cases.
**Deref: see the ritual line.**

**COMMITTED:** `70520e1`, `74e9b91` (`fix/typecheck-in-gate`); `8552ae3`
(`fix/product-md-gate-status`); `4f08f1f` (`build/claim-check`).
**MERGED BY THE OPERATOR:** PR **#64**, PR **#66**. **OPEN:** PR **#68**.

### The gate was certifying code it never compiled

`npm run check` chained eight suites and no compiler. `tsc --noEmit` sat in a script nothing
invoked, so a type error passed at exit 0 and every session ran two commands while reporting one
as the gate.

**The counterfactual was run, not argued.** With a deliberate `TS2322` on disk, `main@f42fadd`
printed `ALL CHECKS PASS` over 546 assertions and **exited 0**. That is this product's own defect
class — a green report over an unrun set — printed by the instrument that certifies the
repository.

`TEST 4` asserts **four links**, because asserting only that `check` mentions the typecheck leaves
the control substitutable by `"typecheck": "echo ok"`. Its ordering pair guards its own indices
first: without that, a script naming only the suites compares `-1 < 0` and passes vacuously.

### One number, five documents, and the issue asked for the wrong one

#61 said write **twelve** research sweeps. It is **thirteen** — the #62 sweep landed in S019's
post-close addendum, after the issue was filed. The stale count stood in `PRODUCT.md`,
`CONTEXT.md`, `docs/agents/domain.md` (**twice** — the read-order step and the structure diagram),
`docs/research/INDEX.md` and this file.

**`INDEX.md`'s stated failure mode is not the one that fired.** It said the failure mode is
"adding a file to `docs/research/` without adding a row here". Commit `ef6a237` added the file
**and its row**. The **hand-kept header scalar** is what broke, silently, because nothing read the
header against the table. Its drift counter is set to **one and recorded**, not reset.

### `CONTEXT.md` was declined under one plan and named under the next

The sweep found `CONTEXT.md:139` mid-execution, and it was **not** in the approved Files table.
The guard would most likely have passed it — the plan named the basename in **background prose**.
Declined, `EnterPlanMode` re-entered, the file named in the table, `ExitPlanMode`. **Second
instance of this exact loophole being declined rather than taken**; the first became #61.

Filing it for later was rejected on separate grounds: `PRODUCT.md` would have said thirteen while
the document that names it as gate authority said twelve.

### The claim check, and the drift it shipped inside itself

`slice/CHECK-claims.ts` evaluates inline `<!-- claim: ... -->` falsifiers — `count`, `exists`,
`absent` — inside `npm run check`. Design from the **completed** practitioner sweep: Terraform's
`plan -refresh-only -detailed-exitcode`.

**Two acceptance criteria were changed rather than dropped.** Criterion 3's `b138063` fixture is
**unsatisfiable by any inline-annotation design** — the annotations do not exist in that commit —
so a synthetic fixture proving the checker *fails* replaced it. Criterion 6's scope defers
tracker-backed status (needs the API; the gate is offline and that is worth more) and identifier
claims.

**The suite shipped the drift class it was built to catch.** This file still read *"eight files …
552 assertions"* while being one of the six documents the checker reads, so the gate went green
over a stale scalar in the commit that introduces the catcher. The evaluator's own fixtures
hard-coded `13` — a seventh copy of the scalar inside the retirer. And `absent` passed vacuously
on a mistyped path, which would have stayed green **after `REQ001` shipped**.

### `/code-review` earned its place twice, and found my own defects both times

Nine findings on #61, nine on #62. **All eighteen verified; all eighteen fixed.** Four were
defects the fix itself introduced — most tellingly, `domain.md`'s structure diagram still read
`12 files` after line 23 of the **same file** was corrected. That is the S019 miss repeating
inside its own repair, 119 lines apart.

### A merged PR is not work on `main`

PR #67 was stacked on #66. #66 merged to `main` at `01:44:11Z`; **#67 merged into the base branch
at `01:44:21Z`**, ten seconds after `main` had absorbed it. Nothing errored. The tell was **#62
staying open** — `Closes #N` fires only on a merge to the default branch. Verified with
`git merge-base --is-ancestor`, not with the PR's MERGED badge. Repaired as **PR #68**.

### BLOCKERS

**None.** PR #68 is open and carries #62's reviewed content to `main`.

### EXACT NEXT STEPS

**Fourteen issues open.** #65 was filed this session.

1. **Merge PR #68.** Until it lands, `slice/CHECK-claims.ts` is not on `main`, the gate on `main`
   is 552 rather than 610, and **#62 stays open**. `fix/product-md-gate-status` is spent and
   carries #67's merge commit; delete it rather than branch from it.
2. **#65 — "v0.1 rules" means eight in `PRODUCT.md` and four in `CONTEXT.md`/`CLAUDE.md`.**
   Filed this session. `PRODUCT.md`'s competitive claim depends on which sense the reader holds.
   Both files are plan-gated.
3. **#18 then #19 (narrowed).** An external review of the board verified that **#19 is
   half-shipped** — `slice/config.ts:65-74` already rejects a name-only root with the ticket's own
   rationale. What remains is the **rule-configuration surface** `REQ001` and `UNQ001` consume.
   #18 is the rule-to-hydration map and **may conclude property depth does not fit `PRODUCT.md`'s
   three-minute kill criterion**, which is a product finding landing on #7. **Frontier work.**
4. **#50 / #51** — the coverage-figure decisions, unchanged.
5. **#58 then #59**, once #18 and #19 land.
6. **#27 is closable.** `docs/research/notion-developer-platform.md` §8 already recommends: keep
   the local CLI, do not build on Workers, do not use a PAT. **What is open is accepting it** —
   an operator decision, not a research gap.
7. **#25** (still the tripwire, n unchanged at 2), **#7**, **#8**, **#24**, **#29** unchanged.

**NEXT-MODEL:** **frontier.** The next head after #68 and #65 is **#18** — a spec that may
invalidate a kill-criterion budget, with #19's narrowing riding on it. That is architecture and
ambiguity, not execution mechanics. **Do not straddle:** if the session instead only merges #68
and clears #65, that is fast-tier work and should be its own short session.

**NEXT-REPO/CWD:** `C:\Users\mlpgr\2026_Projects\workspace_lint` — single repo; state, plan and
resume ritual all at the root. **The four guard hooks and `deref_check.py` are NOT in this repo** —
they are machine-local and unversioned under `~/.claude/`, which is why #62's taxonomy overstates
the path class.

**NO SELF-ASSESS LINE, BY OPERATOR RULING 2026-08-17.** The ritual line records `verdict=n/a`.

---

---

## S019 — 2026-08-17 — the slice reached `main`, and the repository went on describing itself as pre-build

**PHASE:** **BUILD, and shipped to `main` for the first time.** No code was written this session. The
work was the merge, the tracker, and the five documents the merge falsified.

**TESTS:** `tsc --noEmit` clean. **546 slice assertions, exit 0**, unchanged and untouched. The guard
suite went **32 → 47 assertions, exit 0**, red at 8 failures before the change. **Two mutation checks,
both scored on the exit code** — the pre-existing one bypasses `plan_authorises`; the new one removes
`claude.md` from `CANONICAL_FILES` and confirms both `CLAUDE.md` blocks flip to allow while
`CONTEXT.md` stays blocked. **Deref: see the ritual line.**

**COMMITTED:** `7b79d43` on **`fix/post-merge-doc-drift`**, branched from `main` at `b138063`.
**MERGED BY THE OPERATOR:** PR **#56**. **CLOSED UNMERGED:** PR **#57**.
**FILED:** **#58**, **#59**, **#60**, **#61**. **COMMENTED:** #8, #19.

### The merge, and why only one PR of the two

Two PRs were open against `main`. `git merge-base --is-ancestor` settles it: `build/t2-sys001` is a
**strict ancestor** of `build/t3-ref001`, and `git log t3..t2` is empty. #56 delivered everything #57
did plus eleven commits. **Order was not cosmetic** — t2's tree still carries `prototypes/verdict.ts`,
which t3 deletes under ADR-0012 decision 1. Merging #57 first would have put two executable exit-byte
implementations on `main` and left them there for as long as #56 stayed open. #57 was closed with the
ancestry proof in a comment; the branch is left in place.

Both PRs arrived with GitHub's default branch-name titles and empty bodies. #56 was retitled and given
a body before the merge, because its merge commit is `main`'s permanent record of the largest change
in the repository's history.

### Five surfaces said pre-build, and my grep found two of them

The finding worth carrying: **I grepped for the wording I was replacing.** `pre-build`, `no source
code`, `72-hour`. That found `CLAUDE.md` and `CONTEXT.md`. It could not find `README.md`, which said
the source was on `build/t3-ref001`, or `docs/agents/domain.md`, which said "there is no `src/` yet",
or this file. **A stale claim does not have to reuse your phrasing to assert your state.**

`/code-review` found all three and every one of its eight findings verified. Two are worth naming:

- **One correction created the defect it then had to fix.** The new `CONTEXT.md` paragraph ends "See
  `PRODUCT.md` and `README.md`" while `README.md` still contradicted it. A pointer into a document
  that disagrees with you is worse than no pointer.
- **`docs/agents/domain.md` had pre-registered this exact revisit** — "the file-structure block and
  the 'no `src/` yet' line both go stale the day the first code lands." The trigger fired and nobody
  ran it. The Revisit-if now records that it fired, and stays registered because `src/` is still due.

### The guard covered the wrong set

`guard-canonical-doc-edit.py` protected `CONTEXT.md`, `PRODUCT.md`, `docs/adr/**` and `docs/spec/**` —
the documents an ADR supersedes — and left `CLAUDE.md` outside. `CLAUDE.md` is injected into every
session and it opened this one by asserting the project had no code. It is now guarded, **machine-wide
by basename**, which was chosen rather than inherited; the accepted costs are in the standing block.

**And the guard has slack the standing block now names.** `PRODUCT.md` needed two corrections and was
not in the approved plan's Files table — but the plan mentioned the basename in background prose, and
the matcher does not distinguish the two. The edit would have been allowed. Declining it and filing
**#61** is the whole of the decision: taking that slack inside the commit that widened the control
would have been the failure the control exists to stop.

### BLOCKERS

**None.** Nothing gates the build and nothing gates the queue.

### EXACT NEXT STEPS

**Fourteen issues open.** Four were filed this session.

1. ~~**Push `fix/post-merge-doc-drift`.**~~ **DONE, and merged to `main` in PR #63** — the document
   corrections, the sweep, the source ladder and this close. Nothing is outstanding on that branch.
2. **#60 — the typecheck is wired into nothing.** `npm run check` does not run `tsc` and no script
   does. The assertion belongs in `CHECK-suite-registration.ts`, which exists as the control for
   exactly this class of hole. `/implement` driving `/tdd`; **`CLAUDE.md` is plan-gated** and its gate
   paragraph collapses back to one command once this lands, so name it in the plan.
3. **#61 — `PRODUCT.md`.** Gate 2 has no closure marker while `CONTEXT.md` names `PRODUCT.md` as the
   authority for the gates; line 128 counts seven sweeps against twelve. Plan-gated: name the file in
   the **Files table**, not in prose.
4. **#51 / #50 / #24 — still the scope family**, unchanged from S018. #24 is upstream of ADR-0013's
   `attested` branch, which stays dead code until something calls search.
5. **#19 then #18.** Both now carry native `blocked_by` edges from **#58** (`REQ001`) and **#59**
   (`UNQ001`), the two build tickets for the Configured half of the rule catalog. #19's scope was
   restated in a comment: half its definition of done already ships in `slice/config.ts` for the roots
   case, and what is missing is the rule-configuration section.
6. **#62 — the claim-check.** Its §0.5 sweep is DONE (`docs/research/documented-claim-drift-prior-art.md`)
   and it changed the design from a drift detector to a **declared-baseline check**. Its own first step
   is a practitioner-tooling sweep the literature pass could not reach — `doctest`, rustdoc doctests,
   `cog`, ArchUnit, Terraform drift detection, AWS Config. **Do not write code before that runs.**
7. **#27**, **#25** (still the tripwire, n unchanged at 2 — **no new ADR landed this session**),
   **#7**, **#8**, **#29** unchanged.

**NEXT-MODEL:** **fast tier.** The next head is **#60** then **#61** — one script change with its
assertion in a file that already exists, and one document correction whose facts are settled in three
other documents. No ADR is expected and every governing decision is written. **Do not straddle:** if
the session instead opens #24, that is architecture and belongs on frontier in its own session.

**NEXT-REPO/CWD:** `C:\Users\mlpgr\2026_Projects\workspace_lint` — single repo; state, plan and resume
ritual all at the root. **Everything from this session is on `main`**, via PR #56 (the slice) and
PR #63 (the corrections, the sweep, the ladder, this close). Start the next session from `main` and
branch from there; `fix/post-merge-doc-drift` is spent. **The two guard files are NOT in this repo** —
`~/.claude/hooks/guard-canonical-doc-edit.py` and its suite are machine-local and unversioned, as all
four guards are.

**NO SELF-ASSESS LINE, BY OPERATOR RULING 2026-08-17.** The ritual line records `verdict=n/a`.

**POST-CLOSE ADDENDUM (S019, after `3503028` shipped) — the §0.5 sweep ran, and it refuted the design
the close left implied.** The band above ends by saying the missing check "needs a prior-art sweep
first, which is its own session." The operator directed it be done now. It was, and it did not need a
session — two Scholar Gateway queries.

~~"Building that check needs a prior-art sweep first, which is its own session."~~ The sweep is
complete and recorded at **`docs/research/documented-claim-drift-prior-art.md`**, indexed, and the
build ticket is **#62**. What the sweep changed:

- **The software literature is solving a harder problem than this repo has.** Traceability recovery,
  IR link reconstruction and learning-based code-comment consistency detection are all probabilistic
  *by construction*, because the link between a claim and its falsifier was never declared.
- **Aerospace and nuclear declare the baseline instead**, and the discipline has a name —
  **configuration management**, surveilling change "against a certified design baseline". Documentation
  currency is a regulated obligation there, not a tidiness preference.
- **Manual compliance evaluation runs to 25% of assessment effort** even where a regulator mandates
  and funds it (Varkoi et al. 2019). **That rules out the reflex design** — "have a session re-read
  the documents" — which is what this repository would otherwise have built.
- The five S019 instances split into **four classes** with different costs: path (self-healing, already
  covered by `deref_check.py`), count, status and identifier. Only the path class self-heals. The rest
  are quoted, never visited.

**Not checked and recorded as such:** ACM, IEEE, VLDB and USENIX are out of a Wiley corpus with
`WebSearch` exhausted at 200/200; one IAEA `WebFetch` returned HTTP 402; and **no practitioner tool was
verified** — that is #62's own first step and it gates writing any code.

---

---

## S018 — 2026-08-17 — the outcome model was one component short, and the byte now carries its own limitation

**PHASE:** **BUILD, past the tracer bullets.** Three phases: **#35** (ADR-0013), **#52** (the residual
register), and a four-issue documentation-and-instrument sweep (**#39, #53, #54, #55**).
**Seven issues closed: #35, #39, #52, #53, #54, #55** — and **#25 deliberately left OPEN**, because it
is the counter and closing it deletes the record.

**TESTS:** `tsc --noEmit` clean on TypeScript 7.0.2. **546 offline assertions across EIGHT suites**
(38 + 56 + 92 + 124 + 89 + 50 + 76 + 21), no network and no token. **Twelve mutation checks this
session, each scored on the EXIT CODE** — nine on the residual register, three on the new suite
control. **Deref: see the ritual line.**

**COMMITTED:** `0934a2b` (ADR-0013 + `CONTEXT.md` + the sweep), `bdee71e` (#52), `d7095fa` (#39/#54/#55),
`2bbcff6` (#53). **Nothing merged to `main`. Nothing pushed.**

### ADR-0013 — the model was one component short, and the missing one may never be a number

**#35 held two questions with different answers.** The rule as filed — *a denominator is never built
from the subset the tool can handle* — is about **tool competence** and is a **consequence of ADR-0005
decision 5 honestly applied**, so it became `CONTEXT.md`'s **seventh settled default**. The live
reproduction attached to the issue **satisfies that rule and still exits `0`**; that is **frame
fidelity**, and it got the ADR.

**The §0.5 sweep had never been run for this question.** Grep over `docs/`, `CONTEXT.md` and
`PRODUCT.md` returned **zero** hits for `coverage error`, `undercoverage`, `sampling frame`,
`verification bias`, `STARD`, `defeater`, `Motro`, `Razniewski` — across twelve ADRs. Three of four
domains returned, recorded at `docs/research/frame-completeness-prior-art.md`:

- **Survey methodology splits errors of nonobservation into sampling, coverage and nonresponse.**
  `unreached` is the nonresponse analogue and `undecidable` the measurement analogue. **Coverage error
  had no axis at all.** ADR-0005 exists because ADR-0003 was "one dimension short and mixed two axes";
  this is the same finding one level up.
- **The missing component cannot be measured**, by two independent literatures — survey methodology by
  definition, and the repo's own capture-recapture sweep by estimator mechanics. **So it may never be
  rendered as a ratio, a percentage or an estimate.** That is decision 3, and it forecloses inventing a
  coverage adjustment before an implementation invents one.
- **The induced bias runs in the flattering direction.** Kosinski & Barnhart 2003, Crossref-verified
  abstract: restricting to the verified subset means *"sensitivity would often be higher… than the
  true values."*

**All ten DOIs resolved against Crossref.** Quote status is tabulated **per quote**. The Groves
*"can never be measured"* clause is **second-hand via Pont** and labelled so; the prohibition survives
without it. **`Motro` and `Razniewski & Nutt` on query completeness over incomplete databases is the
closest formal analogue and is recorded NOT CHECKED** — ACM/VLDB, out of a Wiley corpus, WebSearch
exhausted at 200/200.

### #52 — the register ships, and exit 0 over a filtered child list is still exit 0

Live, `REVOKE_PARENT_ID`:

```
outcome SYS001:  conformity conforms · evidence sufficient · attestation unattested
exit:            0
byte basis:      compared 1/1 resources (100.0%) … · 1 residual(s): the enumerations
                 behind this figure could not be verified complete
```

**The byte did not move and must not.** ADR-0013 discloses the false green; it does not close it.
What changed is that the byte and its limitation are one line apart instead of two sections apart.
`FIXTURE_ROOT_ID` still exits `3` with `ORACLE MATCHED` and 3 residuals; two `--deterministic` runs are
byte-identical at **3554 bytes**.

### Five findings this session cost, each earned by something a green gate could not see

- **A mutation that stays GREEN names dead code, and the signal is the mutation that does not fire.**
  M7 deleted the line deciding whether an enumeration produces a residual at all; the 515-assertion
  suite stayed green, because the `attested` branch was **unreachable from any fixture**.
  `attestationOf(SEARCH)` bought nothing observable. TEST 8 reaches it with a hand-built `Manifest`.
- **The typecheck gate had a hole, and it is the same shape as the product's own defect class.**
  `slice/tsconfig.json` listed its files explicitly, so `CHECK-residuals.ts` was **silently
  untypechecked** — `tsc --noEmit` exited `0` over a file referencing five exports that did not exist,
  and **the TDD red state was invisible for one command.** Both gates here are list-driven;
  `npm run check` fails safer only because a missing suite shows in the assertion count. Closed by a
  glob plus `CHECK-suite-registration.ts`, whose own bootstrap hole is stated in the file.
- **The report denied a call its own log recorded.** A root whose children call 404s writes no
  enumeration record, so the report printed *"no enumeration was performed"* four sections above
  `404 object_not_found GET /v1/blocks/root/children`. Reworded to *"no enumeration produced a
  listing"*, true of both cases.
- **A count documented as one unit while computed in another.** The residual count was described as a
  count of **calls**; it is a count of **resources**. `MIDSTREAM` makes 3 block-children calls and
  yields 2 residuals. The value was right and the justification was wrong, across three surfaces, and
  the test passed only by accident of a fixture that fits every listing in one page.
- **An unamended quotation is the same defect wearing a citation.** #39's DoD asked for ADR-0008
  decision 2's exit table to be *quoted*. Quoting it verbatim would have shipped a **superseded**
  contract — ADR-0011 decision 5 restated its exit-`0` row and ADR-0012 decision 7 dropped the `gaps`
  conjunct from exit `3`.

### The failure worth carrying hardest: I filed a phantom issue

**#53 was filed from the S016 band without opening the spec.** Both its defects had been fixed under
ADR-0012's gate in `8dd2d36`, with the corrections *and their reasoning* written into the file. **Two
of its three DoD items were complete before the issue existed.** One command — `git log -- <file>` —
would have shown it.

This is the project's own recorded failure mode firing again. The prior instance carried **#14** as a
blocker for **three sessions**; this one took **one session** and wrote to the **tracker**, where a
phantom issue looks exactly like real work. Memory updated with the variant.

### BLOCKERS

**None for building.** The remaining queue is decisions and research, not code.

### EXACT NEXT STEPS

**Ten issues open. Six are mine, four are not.**

1. **#51 and #50 and #24 — decide together or say why not.** All three are v0.1 scope questions in one
   family: whether REF001's port widens to retrieve a data source (#51), whether ADR-0005 decision 2's
   applicability filter ships (#50), and whether v0.1 calls `POST /v1/search` at all (#24). **#24 is
   upstream of ADR-0013's `attested` branch**, which is dead code until something calls search.
2. **#19** then **#18** — two new specs, `docs/spec/`, both gated. Neither depends on 1.
3. **#27** — the Developer Platform gap. **WebSearch is exhausted**, but `WebFetch` reaches
   `developers.notion.com` directly, so the documentation half is doable; the observation half needs
   the fixture.
4. **#25 stays OPEN as the tripwire.** Verified this session: n is still **2**. Neither ADR-0012 nor
   ADR-0013 contradicts a research file. **Re-check the count when the next ADR lands** — at three, its
   own recommendation inverts and the hook gets installed.
5. **Four are not mine.** **#8** (npm name — still the only thing between this branch and `main`),
   **#7** (needs the integration connected to `REAL_ROOT_ID`), **#29** (buyer, needs demand evidence),
   and **#25**'s eventual go/no-go.

**NEXT-MODEL:** **fast tier.** The next head is #51/#50/#24 as one scope decision, and #19/#18 as two
specs. All five are separable execution mechanics against decisions already made — no ADR is expected,
and every governing decision is written. **Do not straddle:** if the session instead opens an ADR
(most likely from #24, if search turns out to change the coverage model), that is architecture and
belongs on frontier in its own session. Pick one before starting.

**NEXT-REPO/CWD:** `C:\Users\mlpgr\2026_Projects\workspace_lint` — single repo; state, plan and resume
ritual all at the root. The build lives on `build/t3-ref001` in this same clone.

**NO SELF-ASSESS LINE, BY OPERATOR RULING 2026-08-17.** The ritual line records `verdict=n/a`.


## S017 — 2026-08-17 — the tracer-bullet sequence closes, and the red test found a false green the product cannot detect

**PHASE:** **BUILD, complete at n=1.** Three phases: **#49** (ADR-0012), **#45** (T4 reports),
**#46** (T5 red test). **All five tracer bullets are built and CLOSED** — #42, #43, #44, #45, #46.

**TESTS:** `tsc --noEmit` clean in **both** packages on TypeScript 7.0.2. **449 offline assertions**
across six suites (38 + 56 + 92 + 124 + 89 + 50), no network and no token; `prototypes` 23, green.
**Nine mutation checks performed this session**, each run and confirmed red. **Deref: 35 path claims
checked / 6 flagged / all 6 hand-verified**, plus identifier, SHA and issue-state claims hand-checked
(all six flags are the machine-local hook paths under `~/.claude/`, outside the checker's `--root`).

**ALL FIVE EXIT BYTES REACHED LIVE**, each by its own seeded fault — the first time the byte contract
has been exercised end to end against the real API:

| Configuration | Byte | Disposition |
| --- | --- | --- |
| `FIXTURE_ROOT_ID`, floor 1.0 | `3` | `qualified` |
| `FIXTURE_ROOT_ID`, floor 0.5 | `1` | `qualified` |
| `REVOKE_PARENT_ID`, floor 1.0 | `0` | `unqualified` ← **the false green** |
| `UNSHARED_PAGE_ID`, floor 1.0 | `2` | `disclaimed` (root miss) |
| config naming a non-ID | `4` | none |

**COMMITTED:** `8dd2d36`, `37bd9e1`, `6b719cf`. **Nothing merged to `main`. Nothing pushed.**
**CLOSED:** #49, #45, #46. **COMMENTED:** #45, #46, #35.

### The finding — a false green the product cannot detect, and it is not a bug in this build

**A live scan of `wl-revoke-parent` returns exit `0`** — `unqualified`, `SYS001 1/1 resources
(100.0%)`, `conforms`, `evidence sufficient` — **over a page whose child the connection cannot see.**

The **builder identity** (full access, explicitly not part of the measurement) reads
`wl-revoke-parent` and finds `wl-revoke-child` (…`ce0fb949`) inside it. The read-only subject's
`GET /v1/blocks/{parent}/children` returns the paragraphs and **no `child_page` block at all**. The
child is not reported unreadable. **It is absent**, so the applicable set is built as 1, the
evaluated set is 1, and every published figure is internally consistent and true of a workspace that
is not the one being scanned.

**Not introduced by T1–T5 and not preventable by any of them.** ADR-0006 decision 2: the children
endpoint carries no truncation signal, so a filtered listing and a complete one are indistinguishable
in the response. ADR-0011's evidence section already names the shape.

**The sharp part:** the report *already* discloses that the traversal spine is trusted blind, and
prints exit `0` on the same page. Both true, same artifact, nothing connecting them.

**The reach of the mechanism is now decidable exactly — it is the BLOCK TYPE of the surviving trace:**

| Trace | Survives permission filtering | Caught by |
| --- | --- | --- |
| inline `href` in rich text (`wl-outside-grant`) | **yes**, the paragraph is readable | `REF001` → 404 → `confirmed`/`unreachable` |
| `child_page` block (`wl-revoke-child`) | **no**, the block goes with the permission | **nothing** |

**Filed against #35 with the reproduction and three candidate shapes. THE COVERAGE MODEL WAS NOT
TOUCHED** — #46's own Revisit-if requires it go to `docs/proof/` and the operator before any code
change. Pinned in `CHECK-redtest.ts` TEST 2 as a **documented limit carrying the issue number in its
assertion text**, so it cannot drift silently in either direction. Not endorsed.

### Two live-run caveats that must not be read past

- **The ADR-0012 divergence is NOT exercised live.** On the fixture `SYS001` sets the minimum and its
  coverage item is a resource, so the vector minimum and the funnel are the same number — the run
  would have exited `3` under the old code too. Exercised offline only, `CHECK-ref001` TEST 4.
- **`Finding.link` is NOT exercised live.** Only the declared root is retrieved with `GET /v1/pages`,
  and on this fixture the root is *evaluated*, so it produces no finding to carry a link. Offline
  only. Both recorded in `docs/proof/results-49-exit-byte.md` §4 and `results-t4-reports.md` §8.
- **Exit `2` is reached live by pervasiveness condition (a) only.** Condition (b), a genuinely
  **unbounded** gap, needs an enumeration to die mid-stream on a 429 or 502 and cannot be forced
  against a read-only connection. Offline only, via `MIDSTREAM`.

### Five rules this cost, each earned by a defect a green suite could not see

- **A conjunct copied verbatim from an ADR can falsify that ADR's own invariant.** ADR-0012's first
  implementation kept ADR-0008's *"gaps exist AND coverage below threshold"* and changed only the
  referent. A run whose weakest rule is below the floor with an **empty gap list** then exits `0`
  while the reason string claims every rule cleared the threshold. **The report refuting itself two
  lines apart.** ADR-0011 decision 5 states the axis without the conjunct.
- **A test written from the same misreading as the code confirms the misreading.** The check that
  should have caught the above was written in the same commit and asserted the wrong value. Review
  against the *source ADR*, not against the code you just wrote.
- **Grepping a test run for `FAIL` cannot distinguish a passing suite from a crashed one.** A
  mutation that removes a null-guard *crashes* the suite; the grep found no `FAIL` and it briefly
  read as a control that failed to fire. Score mutations on the whole output or on the exit code.
- **A reason string outlives the condition it describes, and then it is a false claim printed under
  a true value.** `LINK_NOT_CAPTURED` read *"this slice does not read the object's url field"* after
  the port started reading it. This product's own defect class, in its own output.
- **A "one document, three renderers" claim is worth exactly as much as its third renderer.** T4's
  terminal renderer still read raw scan state while the other two read the document; the manifest
  row order genuinely differed. If a design claim is in a file header, review the file against it.

### BLOCKERS

**None for building — there is nothing left in the tracer-bullet sequence to build.** #35 now blocks
any claim that a clean byte means a covered workspace, and it is a decision, not a defect.

### EXACT NEXT STEPS

1. **#35** — the decision this session created, with a live reproduction attached. May a scan that
   cannot detect permission filtering report `evidence: sufficient` and exit `0`? Three candidate
   shapes are on the issue and none is chosen. **This is an ADR and it is the largest open question
   in the product.**
2. **#51** — database references as a permanent coverage gap. Same port seam; #45 settled the page
   half only.
3. **#50**, **#39** (README contradicts ADR-0005 and ADR-0008 in four places), **#35**, **#27**,
   **#25**, **#24**, **#19**, **#18**, **#29**, **#7** unchanged.
4. **Two human steps, neither blocking:** **#8**, the npm name — still the only thing between the
   branch and `main` — and connecting the integration to `REAL_ROOT_ID`, which #7 needs.
5. **`wl-revoke-child` stays disconnected.** Restoring it resets proof question Q1 **and** removes
   the only live instance of the condition #35 now turns on. Decided, not defaulted.

**NEXT-MODEL:** **frontier.** The next head is **#35**, an ADR deciding whether a coverage figure
built from the subset the tool can see may be published as `sufficient` — irreversible,
cross-cutting, and it governs the meaning of every byte the product prints. **Do not straddle:** if
the session is instead scoped to #39's README reconciliation, that is separable execution mechanics
and belongs on the fast tier in its own session. Pick one before starting.

**NEXT-REPO/CWD:** `C:\Users\mlpgr\2026_Projects\workspace_lint` — single repo; state, plan and
resume ritual all at the root. The build lives on `build/t3-ref001` in this same clone.

**NO SELF-ASSESS LINE, BY OPERATOR RULING 2026-08-17.** The ritual line records `verdict=n/a`.


## S016 — 2026-08-17 — REF001 ships; review found a defect that would have failed a build on a healthy workspace

**PHASE:** **BUILD, and building.** Third tracer bullet landed. `#44` is built, reviewed, hardened,
committed on `build/t3-ref001`, and **CLOSED**. `#42` closed with it. The coverage vector has two
rows for the first time.

**TESTS:** `tsc --noEmit` clean on TypeScript 7.0.2. **268 offline assertions** across three suites
(53 + 92 + 123), no network and no token. **Seven mutation checks**, three of them new and each
verified by disabling the mechanism and confirming the check goes red: block descent off → the
nested link is undiscovered and the finding vanishes; the database drop-out off → one invented
`confirmed`/`unreachable` finding appears; cross-page dedupe off → the external count reads 2 for
one href. Live run: **exit 3**, 4 applicable, 3 evaluated, 1 internal reference, **7 requests**,
1.6 s, **`ORACLE MATCHED` on 17 comparisons** — seven of them new and committed to disk before the
run. **Deref: 26 path claims checked / 6 flagged / all 26 hand-verified.** All six flagged are the
standing-constraints block's machine-local hook paths under `~/.claude/hooks/`, outside the
checker's `--root`; all six exist and were listed by hand. **The deref step earned its keep on an
identifier claim the checker cannot see:** this band, the proof record, the #44 comment and the
commit message all said the oracle matched on **18** comparisons. It makes **17**. The count was
written from memory of the run rather than from the run. Corrected in all four; the work commit was
amended in place because it was unpushed, which is why its SHA is `a633e96` and not `04ec6b9`.

**COMMITTED:** **`a633e96`** (T3 REF001, including the five review fixes — the review ran BEFORE the
commit this time, which is the ordering S015 recorded getting wrong).
**Nothing merged to `main`. Nothing pushed.**
**FILED:** **#51**. **COMMENTED:** #44, #42, #49, #45. **CLOSED:** #44, #42.

### Acceptance criterion 4 is CLOSED, and it closed on discovery rather than injection

A link whose target the connection cannot read yields `certainty: confirmed` about
`target state: unreachable`. The scan was given **one** ID, the declared root; the target reached
the rule only by being read out of block content, and the call log proves it — the seventh request
is a `GET /v1/pages/{target}` the scan could not have issued without discovering the href first.
No synthetic injection path exists in this implementation at all.

### The review finding worth carrying forward

**Every reference target was retrieved with `GET /v1/pages`.** A database is not a page, so a
shared, readable database mentioned in block content would have 404'd and been reported
`certainty: confirmed` / `target state: unreachable`, exit `1` — **a defect the scan invented, on a
healthy workspace.** `ref001.ts` carries a header property forbidding exactly this — "a 429 or a 502
means the rule never reached a judgement" — and the defect walked in through a door that property
did not cover: **the property guarded the STATUS and the hole was in the OBJECT KIND.** A stated
invariant guards the case its author was thinking about. Fixed by recording the target kind from the
shape that discovered it; a database reference is now a named drop-out that spends no request and
produces no finding. Consequence filed as **#51**: every database reference is now a permanent
coverage gap.

### Four rules this cost, each earned by a defect a green suite could not see

- **A reference is not a resource, and one manifest holds both.** Entries carry their `unit` and the
  map slots on `(unit, key)`. A page under the root and a link pointing at that page collide on a
  bare key, and the collision DELETES a drop-out, which is the flattering direction.
- **Stage 5 is an INTERSECTION, and it is computed as one rather than asserted to be.**
  `evaluateStage` intersects over the rules applicable to each entry, so a third rule on `resources`
  narrows the stage by being added. A union marks a coverage item evaluated because ONE rule judged
  it and inflates every figure downstream.
- **A scan that reads only top-level blocks reports full coverage over a denominator it never
  built.** A dead link inside a toggle produced no reference and the run exited `0` over it.
  `readBlockTree` descends to a bounded depth; exhausting the bound is an UNBOUNDED loss on the
  containing page, never a silent stop.
- **`reportSection` returns the empty string for a heading it cannot find, and the empty string
  satisfies every negative assertion.** Two title-leak controls would have gone green if a heading in
  `report.ts` were renamed — a substitutable control, sitting inside the control. `requiredSection`
  throws instead. The same function also sliced two characters past its own marker.

### An instrument defect that looked exactly like a product defect

`fakePort` was keyed on the literal string of each fixture ID. The fixtures are written bare;
REF001 resolves targets in hyphenated form. So the fake returned **404 for a page it was holding** —
which made a readable target report as a dead link and a seeded 429 report as a 404. The real API
accepts either form. **Two red checks that looked like rule defects were defects in the fake.** The
fake now normalizes both sides through `hyphenate()`.

### Two departures from the spec, surfaced not silent

Both in `docs/proof/results-t3-ref001.md` §7. **`docs/spec/REF001-link-recognition.md` §5
contradicts itself** — it says an unrecognised candidate's drop-out carries a `SYS001` finding, and
it also says, twice and once marked non-negotiable in §7, that the candidate produces no finding and
carries no `certainty` and no `target_state`. §7 wins, and the type system agrees: `Finding`
requires both axes. And **§4 step 3 read literally makes every `#section` anchor a coverage gap**;
the frozen prototype tests the ID first and this implementation keeps that.
**Recommendation on the record: the code stands and the spec is the defect on both.** A spec is
edited in place, so it is a small edit under the plan gate and it can ride with #49.

### BLOCKERS

**None for building.** **#49 still blocks any run's byte being read as a coverage verdict over
every rule** — not #45 or #46 being built.

### EXACT NEXT STEPS

1. **#49 — the ADR.** `deriveVerdict` compares the funnel scalar; ADR-0011 decision 5 requires the
   minimum of the vector. `CHECK-ref001.ts` TEST 4 is now a **TRIPWIRE**: it asserts the byte is `0`
   where spec §6 test 3 requires `3`, and it goes RED the moment #49 lands. Its comment on the
   ticket carries the rest, including the §5-attribution correction and the `Verdict`-scalar
   question #45 makes visible.
2. **The two spec §5/§4 edits** ride with #49 under the same plan gate, or state why not.
3. **#45**, then **#46**. #45's comment now lists FOUR suppressions its exporter must honour — the
   fourth is `byteBasis`, which must travel with the byte.
4. **#51** — whether the port widens to retrieve a data source, or the permanent gap is accepted.
   Same seam as #45's `url` question. Decide together or say why not.
5. **#50**, **#39**, **#35**, **#27**, **#25**, **#24**, **#19**, **#18**, **#29**, **#7** unchanged.
6. **Two human steps, neither blocking:** **#8**, the npm name — still the only thing between the
   branch and `main` — and connecting the integration to `REAL_ROOT_ID`, which #7 needs.

**NEXT-MODEL:** **frontier.** The next head is **#49**, an ADR deciding what the exit byte compares
and whether a frozen primary source may diverge — irreversible, cross-cutting, and it governs every
byte the product has printed so far. **Do not straddle:** if the session is instead scoped to #45's
exporter against the four suppressions, that is separable execution mechanics and belongs on the
fast tier in its own session. Pick one before starting.

**NEXT-REPO/CWD:** `C:\Users\mlpgr\2026_Projects\workspace_lint` — single repo; state, plan and
resume ritual all at the root. The build lives on `build/t3-ref001` in this same clone.

**NO SELF-ASSESS LINE, BY OPERATOR RULING 2026-08-17.** The ritual line records `verdict=n/a`.


## S015 — 2026-08-17 — SYS001 ships, and review found three false claims the green suite could not

**PHASE:** **BUILD, and building.** Second tracer bullet landed. `#43` is built, reviewed, hardened,
committed on `build/t2-sys001`, and **CLOSED**. The coverage vector is no longer empty and exit `0`
is reachable for the first time.

**TESTS:** `tsc --noEmit` clean on **TypeScript 7.0.2** (the Go port; the repo's `tsconfig` uses no
removed option). **53 + 92 offline assertions pass**, no network and no token. **Five mutation
checks:** `gapsFrom` disabled → byte 3→0; findings removed from the verdict → byte 1→0; the
drop-out-cause clause removed from `judgeable` → **byte 2→0 and disposition disclaimed→unqualified**;
a required child removed → oracle red; a gap invented for a resource the manifest does not hold →
the disagreement is reported. Live run: **exit 3**, 4 applicable, 3 evaluated, 6 requests, 1.66 s,
**`ORACLE MATCHED`**. **Deref: 14 checked / 1 flagged / 14 hand-verified.**

**COMMITTED:** **`0d3c723`** (SYS001), **`95c60c5`** (the six review defects + a whole-slice
self-documenting-code pass). **Nothing merged to `main`. Nothing pushed.**
**FILED:** **#49**, **#50**. **COMMENTED:** #43, #44, #45. **CLOSED:** #43.

### What SYS001 may count as evaluated — the decision that took the session

A resource is judged only when the funnel delivered it **whole**: it reached `fetched` **and**
carries no `Loss`. The rejected alternative — SYS001 judges every manifest entry, because the entry
itself is the evidence — makes SYS001 report **100% coverage on every run by construction** and
deletes the exit-`3` path spec criterion 7 requires.

The consequence is unusual and deliberate: **SYS001's findings are about coverage items outside its
own evaluated set.** Every other rule finds a defect in something it read. SYS001 finds the absence
of a reading, and `CONTEXT.md`'s Gap entry forces it — *"one resource drop-out produces a gap in
every rule whose coverage items depended on it"*, and SYS001's coverage item **is** a resource.

**Certainty is always `confirmed`, including on a 404.** That is not a contradiction of
`CONTEXT.md`'s "a 404 produces indeterminate": certainty is about the proposition the finding
asserts. `REF001` asserts something about the **target**, which a 404 does not prove. `SYS001`
asserts something about **the scan** — *this resource was not evaluated* — which the manifest proves
outright.

### The review is what found the defects, and it returned after the commit

The offline suites were green and the live run was clean before any of six defects was visible.
**Three were introduced by the commit under review**, and every one was the report claiming
something the run had not established — a disclaimed report publishing a summary verdict over a
denominator it had just called unestablishable; a child the API refused reported `present`; a run
that made no successful call reporting `evidence: sufficient`. All are now standing constraints
above, with nineteen regression assertions naming each.

**Ordering failure worth fixing:** `/code-review` was launched before committing and returned
mid-refactor, so the fixes landed as a second commit. `/implement` specifies review **then** commit.

### BLOCKERS

**None for building.** **#49 blocks #44's exit byte being trustworthy**, not #44 being built.

### EXACT NEXT STEPS

1. **#44 — `REF001`.** Branch from `build/t2-sys001`. Its comment on the ticket carries the full
   handoff: the `evaluated`-intersection hazard, the `Loss` record contract for its two new drop-out
   sites, the shared seams, and criterion 4, which is still open and is its to close.
2. **#49 before #44's byte is believed.** `verdict.ts` compares the funnel scalar; ADR-0011
   decision 5 requires the minimum of the vector. They coincide only while one rule exists.
   **Check where the freeze actually lives before deciding how high the bar is.** `slice/verdict.ts`
   says *"frozen as a primary source (spec §5)"* and *"that is a decision, and it goes in an ADR
   before it goes in here."* **Spec §5 says only that the prototype "is kept as a primary source."**
   The ADR-before-code requirement is asserted by the code comment, not by the spec — caught by the
   S015 deref, after both the checkpoint and #49 had already attributed it to §5.
3. **#50** — whether ADR-0005 decision 2's applicability filter ships in v0.1. Likely decided
   alongside **#35**; same family.
4. **#42 is still OPEN** and its code shipped two sessions ago. Close it or say why not.
5. **Then #45, then #46.** #45's comment lists the three suppressions its JSON exporter must honour.
6. **Two human steps, neither blocking:** **#8**, the npm name — still the only thing between the
   branch and `main` — and connecting the integration to `REAL_ROOT_ID`, which #7 needs.
7. **#39, #35, #27, #25, #24, #19, #18, #29, #7** unchanged.

**NEXT-MODEL:** **frontier.** The next head is **#49**, an ADR that decides what the exit byte
compares and whether a frozen primary source may diverge — irreversible, cross-cutting, and it
governs #44's result. **Do not straddle:** if the session is instead scoped to #44's recogniser
alone, against `docs/spec/REF001-link-recognition.md` and the existing harness, that is separable
execution mechanics and belongs on the fast tier in its own session. Pick one before starting.

**NEXT-REPO/CWD:** `C:\Users\mlpgr\2026_Projects\workspace_lint` — single repo; state, plan and
resume ritual all at the root. The build lives on `build/t2-sys001` in this same clone.

**NO SELF-ASSESS LINE, BY OPERATOR RULING 2026-08-17.** The ritual line records `verdict=n/a`.

---

---

---

---

