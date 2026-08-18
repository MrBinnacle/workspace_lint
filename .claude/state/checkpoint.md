# Checkpoint — workspace_lint

**Every earlier band** is archived verbatim at `.claude/state/checkpoint-archive.md`. This file holds
the standing constraints and the current band only.

⚠ **That sentence carried a band RANGE until 2026-08-18 and the range was wrong for six sessions** —
it said "S001–S009" while the file held seven bands, then "S001–S020" the moment one more rotated.
**ADR-0010 forbids a fingerprint containing anything volatile, and a count of bands in the one part
of this file meant to be stable is exactly that.** The range is gone rather than corrected: the
archive names its own bands, so this line does not need to.

## Standing constraints — always current, not session-scoped

⛔ **BEFORE YOU COMMIT A CLOSE: ROTATE. This file holds ONE band.** Move the previous band verbatim to
`.claude/state/checkpoint-archive.md` in the same commit that writes the new one, and **hoist anything
load-bearing out of it first** — the standing block below has claimed to be self-sufficient twice and
was not, most recently on 2026-08-18 when five claims had to be rescued from bands about to be cut.

**This instruction lives here, not in the close skill, because the close skill has no rotation step
and the rotation was pure model habit for nine sessions before it died at S016 and went unnoticed for
six more (#73).** It is still model-pull, now from the always-loaded surface rather than from an
unretrieved skill — which is weaker than a control and stronger than nothing. ~~#73 holds the real
fix; until it lands this line is the only thing standing between the file and the same curve.~~
**#73 is CLOSED and no mechanical fix landed** — it closed on the operator's own June Notion
doctrine, which had already written the general rule: **a state file is never evidence about the
thing it describes.** That doctrine also settles what this archive is for — G-010, *"Keep a pointer
or use Trash. Never keep a mirror… Accurate history alone is not a keep verdict; version control,
source history, and Trash already preserve rollback."* `checkpoint-archive.md` is a mirror of history
`git log` already holds, and every close writes its band twice because the close commit body IS the
band. **This line is now the only thing standing between the file and the same curve.**

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

**Four constraints hoisted from the S021 band on 2026-08-18 before it was archived**, because each
governs a design decision that has not been taken yet and nothing else in this file records them.

- ⛔ **Any phrasing containing "no other tool", "first" or "only" about the declared-falsifier idea
  must be dropped.** Di Iorio, Draicchio, Vitali & Zacchiroli, *"Constrained Wiki: The WikiWay to
  Validating Content"*, DOI `10.1155/2012/893575`, defines the predicate and prototyped it twice.
  What survives is narrower and better: dbt, Great Expectations and Terraform all keep the assertion
  in a repository and the data in a system elsewhere; **#69 collapses the two into one.** That is a
  design position, not a census, so one repo cannot refute it.
- **Resource-limit exhaustion may NEVER be reported as a refutation.** SMT-LIB 2.6 makes `unknown` a
  first-class response carrying a machine-readable cause. Binding under Notion's ~3 req/s ceiling.
- **Every aggregate must be arithmetically reconstructible from the per-item rows printed in the same
  report.** That is the buildable form of the counts-are-admissible-but-scores-are-not line, and it
  is the test #70 decision 3 turns on. An operator-set threshold is **not** a third option: Beller et
  al., 168,214 projects, 80%+ of config files never change after creation, so a threshold set once
  has a vendor default's authority and worse provenance.
- **The predicted failure mode of a declared-falsifier design is FREEZING, not deletion** — a page
  whose prose nobody edits because the claim must be re-derived. **Test any design against "does this
  make the prose more expensive to edit", never against "will people delete the claim".**

**Research method.**

- **A claim comment inside a fenced code block is DOCUMENTATION, not an assertion.** `CHECK-claims.ts`
  blanks fences before parsing and has a test for it. `README.md` carries a real `equals=13` example
  inside a ```` ```markdown ```` fence and it **must not** be updated when the count changes —
  updating it would assert that it is live. Verified 2026-08-18 when the count went 13 → 19 and
  README's example correctly stayed silent.
- **`docs/research/` has an INDEX.md as of 2026-08-17 (#54). Start there, not at the directory.**
  Nineteen files, one line each: the question it answers and what it refutes.
  <!-- claim: count glob="docs/research/*.md" exclude="INDEX.md" equals=19 -->
  **Four** entries carry notes
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
  `b138063`). This supersedes every earlier band's "not on `main`, nothing pushed" line **in
  `checkpoint-archive.md`**; those stay
  standing as dated records. **PR #57 was closed unmerged** — `build/t2-sys001` is a strict ancestor
  of `t3`, so it delivered nothing extra, and merging it first would have restored
  `prototypes/verdict.ts`, the second exit-byte implementation ADR-0012 decision 1 deleted.
  A **`private: true`** package named `slice-v0.1`, deliberately **not** `src/`:
  `src/` asserts *this is the product tree*, and that claim is due the same day **#8** lands.
  **#8 no longer blocks anything from `main`.** `CONTEXT.md`'s Name constraint now reads "before the
  first **publishable** `package.json`", which is what the shipped file already asserts about itself.
  The operative trigger is `private: true` being removed or a tree being renamed `src/`.
  Suite: `cd slice && npm run check` — **ONE command, and it typechecks first**: `npm run typecheck
  && ` then TEN files, 38 + **64** + 56 + 92 + 124 + 89 + 50 + 76 + 56 + **31** = **676 assertions**,
  offline, no network, no token. `CHECK-config.ts` is the tenth, added by #19; `CHECK-suite-registration.ts`
  went 29 → 31 because two of its assertions are per-suite.
  <!-- claim: count glob="slice/CHECK-*.ts" exclude="CHECK-harness.ts,CHECK-fakes.ts" equals=10 --> ~~`npm run check` DOES NOT TYPECHECK~~ — **#60 CLOSED**, and the
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

**What has never been exercised against the real API.** Hoisted from the S017 band on 2026-08-18
before it was archived, because nothing else records it and a session that lost it could claim the
exit byte is fully proven live. All five bytes have been reached live; three specific paths have not.

- **The ADR-0012 divergence is NOT exercised live.** On the fixture `SYS001` sets the minimum and its
  coverage item is a resource, so the vector minimum and the funnel are the same number — the run
  would have exited `3` under the old code too. Offline only, `CHECK-ref001` TEST 4.
- **`Finding.link` is NOT exercised live.** Only the declared root is retrieved with `GET /v1/pages`,
  and on this fixture the root is *evaluated*, so it produces no finding to carry a link. Offline
  only. Both recorded in `docs/proof/results-49-exit-byte.md` §4 and `results-t4-reports.md` §8.
- **Exit `2` is reached live by pervasiveness condition (a) only.** Condition (b), a genuinely
  **unbounded** gap, needs an enumeration to die mid-stream on a 429 or 502 and cannot be forced
  against a read-only connection. Offline only, via `MIDSTREAM`.

**Two manifest invariants, hoisted from S018 and S015 on 2026-08-18 for the same reason.**

- **A reference is not a resource, and one manifest holds both.** Entries carry their `unit` and the
  map slots on `(unit, key)`. A page under the root and a link pointing at that page collide on a
  bare key, and **the collision DELETES a drop-out, which is the flattering direction.**
- **`Certainty` is always `confirmed` on a `SYS001` finding, including on a 404, and that is NOT a
  contradiction of `CONTEXT.md`'s "a 404 produces `indeterminate`."** Certainty is about the
  proposition the finding asserts. `REF001` asserts something about the **target**, which a 404 does
  not prove. `SYS001` asserts something about **the scan** — *this resource was not evaluated* —
  which the manifest proves. A session that "fixes" `SYS001` to `indeterminate` breaks the rule.

**No session grades. Operator ruling 2026-08-17:** *"We're not doing these grades anymore. It's a
waste of tokens."* Do not solicit a `VERDICT`, do not write a `SELF-ASSESS` line. Every other step
of the close ritual still runs; the ritual line records `verdict=n/a`.

**Operator rulings** are in `store.json` → `operator_rulings` and in project memory.

---

---

---

## S022 — 2026-08-18 — the config learned to declare a rule, and refusing what it cannot run turned out to be the whole feature

**PHASE:** **BUILD.** #19's load-bearing half is built, reviewed, corrected and pushed. **One commit
(`b6518e6`), one PR (#79, OPEN), one issue filed (#78), one issue comment.** No canonical doc decided
anything new; `CLAUDE.md` and `README.md` changed only to stop asserting stale facts.

**TESTS:** **676 assertions, ten suites, exit 0, offline.** Up from 610. `CHECK-config.ts` is the
tenth suite (64 assertions); `CHECK-suite-registration.ts` went 29 → 31 because two of its assertions
are per-suite. **Deref: 41 path claims checked / 9 flagged / 9 hand-verified** — eight are the
machine-local `~/.claude/` hooks outside the checker's root, the ninth is `prototypes/verdict.ts`, an
absence claim the checker correctly confirms. Same shape as S021.

### The session opened on a state file that did not know what had happened

**The previous session wrote no band.** It merged PR #72, mirrored the Hans doctrine into
`docs/inputs/` as PR #77, filed #75 and #76, and closed #73 — and `checkpoint.md`'s EXACT NEXT STEPS
still said *"Merge PR #72"*. Three of its four steps were already done. The reconciliation was done by
reading the tracker at session start and it cost real context. **The rotation instruction at the top
of this file survived; the band itself never got written.**

### What shipped, and the design position inside it

`parseConfig` validated `version`, `roots` and `minCoverage`, so `REQ001` had nowhere to declare its
required property — which is why **#58 and #59 both named #19 as a blocking edge**. The section is
`rules`, optional, empty when absent, and `REQ001` is its only member: **#70 decision 1 is open**, and
a schema that guessed at `UNQ001`'s shape would be rewritten by whichever way that decision falls.

**Six refusals, each exiting 4.** A scope addressed by name/alias/URL; a `REQ001` entry with no scope;
a rule ID outside the catalog; a built-in rule (`SYS001`, `REF001` take no configuration); a
catalogued-but-unbuilt rule (`UNQ001` names #59); and a duplicate `(rule, normalized scope ID,
property)`. **The identity rejection is now ONE implementation** — `parseResourceRef`, called for
declared roots and rule scopes alike. It was one edit away from being two.

**`scope` is REQUIRED on a `REQ001` entry, and the absence of a default IS the decision.** A
required-property rule with no scope asserts the property over every enumerated resource, which infers
applicability from nothing — the list ADR-0001 decision 4 rejects. A default scope is available to #58
as a recorded decision; it is not available to a loader as a convenience.

**No severity field, deliberately.** ESLint separates severity from options at the loader and a rule
cannot read its own severity. This product has no severity axis: the exit byte derives from findings
and the coverage vector (ADR-0011, ADR-0012). A severity key would be a second, contradictory route to
the exit byte.

### The example config exposed a hole in the design that produced it

Writing `wl.config.example.json` is what found it. **The loader validates the document against a
HAND-KEPT table, so it said yes to `REQ001` while `scan.ts` runs `[SYS001, REF001]`** — an accepted
rule that nothing evaluates, which is the false green the `UNQ001` refusal exists to stop, in the
product's own entry point.

Closed by asking the **build** rather than the table: `unimplementedRules(configured, implemented)` in
`rule.ts`, wired into `cli.ts` before any call is made, with **`BUILT_RULES` exported from `scan.ts`
so the list has one definition**. That export also deleted a hand-written scalar — the CLI header
printed `rules implemented: 2 (SYS001, REF001)` as a literal.

**Then the example itself shipped broken**: it declared a `REQ001` entry the CLI rejected at exit 4,
so the only worked example in the repository was unusable. **Nothing in the suite loaded that file.**
It does now — `CHECK-config.ts` TEST 8. **An example config is an executable claim about the product,
and until this session nothing executed it.**

### Review found three defects, all introduced by this change

`/code-review high`, run before the commit. All three verified by repro, each fixed with the assertion
that missed it:

- **`RULE_STATUS[id]` resolved through `Object.prototype`.** `{"rule":"toString"}` walked past the
  not-in-catalog branch with `status.kind` undefined and fell through to the last return — telling the
  operator their typo was a real catalog rule shipping later. `Object.hasOwn` now. **The suite could
  not have caught it: every ID it tested had no prototype twin.** Four twins asserted.
- **`property` was validated with `.trim()` and STORED RAW**, so `"Owner"` and `"Owner "` loaded as two
  entries — the duplicate TEST 5 exists to close, one field to the right. `"Owner "` names no Notion
  property, so it would have added a pair to `REQ001`'s denominator that no observation fills.
- **A present-but-MALFORMED `id` got the identity message**, telling an operator who had written an
  `id` to supply an `id`. It fired on the likeliest path there is — the worked example pairs an `id`
  with an `alias`, so one wrong hex digit produced it.

### Controls, all scored on the exit code

- Bypass the scope identity rejection → `CHECK-config.ts` exits 1. Restored, exits 0.
- Remove `tsx CHECK-config.ts` from the check chain → `CHECK-suite-registration.ts` exits 1 naming the
  file. Restored, exits 0.
- **The claim gate went RED before the scalars were updated** — `checkpoint.md:219 count — 10 file(s)
  match slice/CHECK-*.ts`, exit 1. Counterfactual run rather than argued, second session running.

⚠ **Two NUL bytes appeared inside a template literal in `config.ts`** where spaces were written. The
signal was `grep` reporting **"Binary file config.ts matches"** and `file` reporting `data` — the
compiler, the tests and the diff were all clean and said nothing. Removed deliberately. **In a
repository whose method is grepping, a file that reads as binary is a silent loss of the primary
instrument.**

### BLOCKERS

**None.** PR #79 is open and mergeable and carries everything.

### EXACT NEXT STEPS

**Eighteen issues open.** #78 was filed this session. The operator ratified this ordering
("Concur"), and items 2–6 are mine to take without checking in.

1. **Merge PR #79.** It closes #19. Until it lands, `main` has no rule-configuration section and #58
   is still double-blocked.
2. **#51 — REF001 cannot retrieve a database target.** Highest-value item off the critical path:
   REF001 is the load-bearing coverage mechanism, and if every database reference is a permanent gap
   then a SHIPPED rule is producing gaps no amount of sharing can close.
3. **#18 — the rule-to-hydration map.** Now #58's ONLY remaining blocker. Check **#24** first: whether
   v0.1 calls `POST /v1/search` changes the request budget the map is estimated against.
4. **#70's three decisions**, then **#58**, then **#59**. Only #70-1's ADR-supersession question is
   the operator's.
5. **#78** before `REQ001`'s report format is fixed. It needs two live-API facts, not an argument.
6. **#71** — record and close. **#74** — count the broken references in "Hans".

**THE OPERATOR OWES THREE RULINGS, and #75/#76 rank above the build if he agrees with them.** #75: the
job statement in `PRODUCT.md` hands administration back to him, which his own Identity rule 3 forbids.
#76: the competitor is the credit meter, not another linter. Both change what the entry point is for,
so they change what #70's decisions are aimed at. Third: the **`zero-config` rename** —
`PRODUCT.md:123` and `ADR-0001:20` use the term for opposite things, recommended replacement
`policy-free scan`. All three touch plan-gated files.

⚠ **Seven issues carry `needs-triage` and none arrived from outside.** By the skill map's own rule
`/triage` is for issues you did not create, so these need **disposition**, not triage. The label is
doing nothing and the board reads as unsorted when it is not.

**NEXT-MODEL:** **frontier.** The head after #79 is **#51**, which asks whether a shipped rule's
central coverage claim survives a class of target it cannot retrieve — that is architecture, and #70's
three decisions sit behind it. **Do not straddle:** merging #79 and closing #71 is fast-tier work and
should be its own short session if that is all that happens.

**NEXT-REPO/CWD:** `C:\Users\mlpgr\2026_Projects\workspace_lint` — single repo; state, plan and resume
ritual all at the root. **The four guard hooks and `deref_check.py` are NOT in this repo** —
machine-local and unversioned under `~/.claude/`, verified present on this machine this session.

**NO SELF-ASSESS LINE, BY OPERATOR RULING 2026-08-17.** The ritual line records `verdict=n/a`.

**POST-CLOSE ADDENDUM (S022, after `3822c50` shipped) — the operator ruled on all three open
questions and re-ranked the queue, so the build is no longer the head.**

Ruled 2026-08-18, after the close, against a secondary pass the operator ran himself over live
`PRODUCT.md`, `CONTEXT.md` and this file. **He agrees with #75, #76 and the `zero-config` →
`policy-free` rename, and ranks #75 and #76 ABOVE the build.**

His stated grounds, which match what the tracker already held: Gate 1 closed on **framing 2** as the
entry point while the catalog and the build are still aimed at framings 1 and 3; #75 and #76 change
the job statement and the competitive claim, so they change what the entry point is **for**; the
rename is already developed in #70's comments and collides with ADR-0001 decision 4; and all three
need plan-gated edits to `PRODUCT.md` and the glossary surfaces around it.

### How the next session should treat this

**Non-negotiable — these are the operator's own decisions, not proposals.** He agreed to all three
and set the ranking. Do not re-open whether #75, #76 or the rename should happen, and do not
re-order them below the build. **Everything about HOW to land them is revisable**, and the session
holding the files open has evidence this one did not.

### The three, and what each one actually licenses

1. **#75 — the job statement.** `PRODUCT.md`'s "Job to be done" makes the operator the repairer and
   the report the deliverable. His own doctrine (`Hans Operating Instructions` v10.0, Identity rule
   3) says *"You administer the workspace. Matthew does not."* **Agreed: the statement changes.**
   *Revisit if:* rewriting it turns out to promise a capability v0.1 cannot ship — a job statement
   the product cannot satisfy is a worse defect than the one being fixed, and that trade is the
   operator's to re-decide, not the session's to resolve quietly.
2. **#76 — the competitor is the credit meter.** A Notion Custom Agent doing continuous
   reconciliation is metered per run, forever, at the vendor's price; a local CLI is not.
   **Agreed: the competitive claim changes.** *Revisit if:* Notion publishes pricing that removes
   the per-run meter, which would delete the asymmetry the claim rests on.
3. **The rename — `zero-config decay report` → `policy-free scan`.** `PRODUCT.md:123` and
   `ADR-0001:20` use "zero-config" for opposite things. **Agreed.**
   ⛔ **The rename does NOT touch `ADR-0001`.** An ADR is never edited in place; line 20 stays as
   written and stays correct. What changes is `PRODUCT.md`'s term and the surfaces that copy it.
   ⛔ **The rename does NOT decide #70-1.** Renaming the entry point is not the same act as deciding
   whether `UNQ001` is Configured, built-in or split — that still needs a superseding ADR if the
   built-in-with-violations route is taken. **A session that conflates these will believe ADR-0001
   decision 4 has been dealt with when it has not.**
   *Revisit if:* a grep finds "zero-config" load-bearing in a document that cannot be edited — an
   ADR or a dated proof record. Those stay as written and the rename becomes a glossary entry
   recording both senses, not a sweep.

### Two mechanical constraints on doing this work

**All three edits are plan-gated.** `guard-canonical-doc-edit.py` blocks `Edit`/`Write` to
`PRODUCT.md` and `CONTEXT.md` unless an approved plan under `~/.claude/plans/`, modified within 24h,
**names that file**. The route is `EnterPlanMode` → name the files → `ExitPlanMode`. ⚠ The matcher
does not distinguish a plan's Files table from its prose, so a file mentioned in passing passes;
**treat the Files table as the authorisation and a quiet hook as nothing.**

**A refuted claim is never in one place — five times now, once across five surfaces.** Grep the
STATE for the rename, not the phrasing: `zero-config`, `zero config`, `decay report`, and the
negation of what you are about to write. `README.md`, `docs/agents/domain.md` and `CONTEXT.md`'s
glossary have all carried copies of a `PRODUCT.md` claim before.

### EXACT NEXT STEPS, corrected in place

~~1. Merge PR #79.~~ **MERGED** as `e18c78f`; **#19 is CLOSED**. **PR #80 carries the close itself**
and is open — the close commit landed on the merged branch after the merge and was cherry-picked
onto a fresh branch off `main`.

1. **Merge PR #80**, or the entire S022 close exists only on a branch.
2. **#75 and #76, then the rename** — one plan, three documents, above the build by operator ruling.
   Recommended as one plan rather than three: they edit the same file and a second plan-gated pass
   over `PRODUCT.md` costs another gate cycle. *Revisit if:* the session finds #75's rewrite forces
   a change to `CONTEXT.md`'s glossary that #76 does not need, in which case split them.
3. **#51**, then **#18** (check **#24** first), then **#70's three decisions**, then **#58**, then
   **#59**. Unchanged in order; all now sit below item 2.
4. **#78** before `REQ001`'s report format is fixed. **#71** record and close. **#74** count the
   broken references in "Hans".

**NEXT-MODEL is unchanged: frontier.** The head is now three canonical-document rewrites that
change what the product claims to be for, which is further from mechanical than #51 was, not closer.

**The verdict field is NOT re-opened by this addendum.**
