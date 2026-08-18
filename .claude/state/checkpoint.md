# Checkpoint — workspace_lint

Bands **S001–S020** are archived verbatim at `.claude/state/checkpoint-archive.md`. This file holds
the standing constraints and the current band only, and as of 2026-08-18 that is true rather than
aspirational — it said "S001–S009" while carrying seven bands.

## Standing constraints — always current, not session-scoped

⛔ **BEFORE YOU COMMIT A CLOSE: ROTATE. This file holds ONE band.** Move the previous band verbatim to
`.claude/state/checkpoint-archive.md` in the same commit that writes the new one, and **hoist anything
load-bearing out of it first** — the standing block below has claimed to be self-sufficient twice and
was not, most recently on 2026-08-18 when five claims had to be rescued from bands about to be cut.

**This instruction lives here, not in the close skill, because the close skill has no rotation step
and the rotation was pure model habit for nine sessions before it died at S016 and went unnoticed for
six more (#73).** It is still model-pull, now from the always-loaded surface rather than from an
unretrieved skill — which is weaker than a control and stronger than nothing. **#73 holds the real
fix; until it lands this line is the only thing standing between the file and the same curve.**

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

## S021 — 2026-08-18 — five experts answered the questions, one refuted the pitch, and the claim gate caught its first real drift

**PHASE:** **BUILD, but no product code was written.** The session was a proposal, five expert
sweeps, and the documentation change that landed them. **Three issues filed (#69, #70, #71), one
PR opened (#72), six issue comments, nine new/changed documents.**

**TESTS:** **610 assertions, exit 0, offline** — unchanged, no suite added. **The counterfactual was
run rather than argued:** with six files on disk and no scalar updated, `npm run check` went **red at
exit 1 with six failing claims.** **Deref: 51 path claims checked / 10 flagged / 10 hand-verified** —
nine are the machine-local `~/.claude/` hooks outside the checker's root, and the tenth is
`prototypes/verdict.ts`, an **absence claim the checker correctly confirms**.

**COMMITTED:** `e9bfc10`, `f4345b5` on **`docs/land-expert-sweeps`**. **OPEN: PR #72.**

### The operator proposed a pivot, and four of its load-bearing claims did not survive

The proposal: scale `CHECK-claims.ts` into Notion pages, so a page carries a declared falsifier next
to its prose. Filed as **#69**. It collides with `CONTEXT.md` in four places, and the review pass
found a fifth the issue did not name.

**The moat claim is refuted by a 2012 paper.** Di Iorio, Draicchio, Vitali & Zacchiroli,
*"Constrained Wiki: The WikiWay to Validating Content"*, DOI `10.1155/2012/893575`, defines the
predicate and prototyped it twice, for MediaWiki and MoinMoin. DOI resolved against Crossref. **Any
phrasing containing "no other tool", "first" or "only" must be dropped.** What survives is narrower
and better: dbt, Great Expectations and Terraform all keep the assertion in a repository and the data
in a system elsewhere; #69 collapses the two into one. That is a design position, not a census, so it
cannot be refuted by finding one repo.

**The audience claim is the Gherkin promise and it was never audited.** Practitioner surveys put the
population at 60.7% developers and **1.8% business analysts**; both papers hedge readability with
*"in theory"* in their own abstracts; readability by end users was measured, authorship never was.
Verdict is **unsupported, not refuted** — the one paper likely to hold a direct measurement is closed
access.

**The predicted failure mode is FREEZING, not deletion.** *"Some teams find that parts of the system
are effectively frozen due to the challenges of finding and modifying the examples associated with
them."* A page whose prose nobody edits because the claim must be re-derived is the decay this
product detects, arriving as a side effect of the fix. **Test any design against "does this make the
prose more expensive to edit", not against "will people delete the claim".**

**Two constraints arrive from other fields.** SMT-LIB 2.6: `unknown` is a first-class response
carrying a machine-readable cause, and **resource-limit exhaustion may never be reported as a
refutation** — binding under Notion's ~3 req/s ceiling. And **Razniewski & Nutt (VLDB 2011) is no
longer NOT CHECKED**; the S018 band's line stands as a dated record **in `checkpoint-archive.md`**.
It is **free at `vldb.org`** and
the paywall assumption was wrong. Filed as **#71**.

### The finding that outranks the pivot: the build is not aimed at the gate's own conclusion

Found while checking the operator's tickets, filed as **#70**. Gate 1 closed on **framing 2**, the
zero-config decay report. The catalog builds framings 1 and 3. Three of framing 2's six signals have
**no rule ID and no ticket**, and `PRODUCT.md`'s kill criterion for the entry point **cannot fire,
because the surface it evaluates is not built.**

**And "zero-config" names something two canonical documents disagree about.**
`docs/adr/0001-linter-not-entropy-engine.md:20` rejects *"zero-config inference of owner, canon,
uniqueness, or peer status"*; `PRODUCT.md:123` names the adopted entry point the *"zero-config decay
report"*. Recommended replacement: **`policy-free scan`** — a run with declared roots and no declared
policy. **NOT RENAMED THIS SESSION.** It is the operator's call and both files are plan-gated.

**ADR-0001 decision 4 forbids what `PRODUCT.md:86` proposes.** Making duplicate-title detection
**built-in** is *"zero-config inference of … uniqueness"* — the identical list, in an **ADR** rather
than a settled default. So it needs a **superseding ADR**, not a paragraph. `PRODUCT.md` carries both
the violation at line 86 and the warning against it at line 82. **The only route that does not need a
new ADR is the finding's KIND:** a shared title is an Observation and infers nothing; a violated
declared-unique value is a conformity violation and needs a Policy.

### What the five sweeps settled, in one line each

- **SARIF has six `kind` values and `informational` ≠ `review`.** A shared title is `review`-shaped.
  **SARIF contains `metric` zero times in 227 pages**; SonarQube gates on **metrics, never issues**.
  And **every surveyed non-failing tier ships its own escalation switch** — non-failing is a default,
  never a property. So the Observation must print the `UNQ001` stanza that promotes it.
- **Counts and totals are admissible; scores are not.** The buildable test: **every aggregate must be
  arithmetically reconstructible from the per-item rows printed in the same report.** Eight rules and
  a worked pass/fail table are on #70.
- **An operator-set threshold is not a third option.** Beller et al., **168,214 projects**: 80%+ of
  config files never change after creation. A threshold set once has a vendor default's authority and
  **worse provenance**. The product already has a legal home for thresholds — a configured Rule.
- **The Maintainability Index has not been recalibrated since 1994** and is still shipped. Gate 3 runs
  at n=1, so **nothing this product ships can be calibrated.**
- **Google deleted the warning tier**, and its 2009 Fixit fixed **16%** of reviewed warnings while
  **44%** became filed bugs. The counter-argument lands hardest on the metrics section.

### The claim gate caught its first real drift, and two things it structurally cannot see

Six failing claims at exit 1, then green. **That is #62 working on the first change that tried to
move past it.** In S019 the same class shipped and a person found it afterwards.

**`README.md`'s `equals=13` correctly did NOT fire.** It is inside a ```` ```markdown ```` fence,
`CHECK-claims.ts` blanks fences before parsing, and TEST covers it — *"a claim inside a fence is
ignored"*. **The example is documentation of the syntax and stays at 13.** Changing it would imply it
is live.

**Two ordinals drifted that no claim covers**, both found by grep: `docs/agents/domain.md`'s structure
diagram read `13 files` **127 lines from its own corrected prose** — the same surface that drifted in
the #61 pass — and `INDEX.md` called `sweep-raw/` *"not a fourteenth entry"*, which is the exact
ordinal drift that file records as DRIFT INSTANCE 1. **An unannotated sentence is unchecked.**

**`INDEX.md`'s drift counter stays at ONE.** This change added files *with* their rows *and* updated
every scalar. Recording it as a drift instance would misreport the history.

### The operator's standing order fired again, and I had broken it

Round 1 of the grilling put five decisions to the operator. His answer: *"Ask experts in their
respective fields - not me."* That is the standing order in project memory and this is at least the
second time it has needed restating. **A decision with a literature is not a values decision.** Four
of the five had one; the fifth was scope and I decided it rather than handing it back.

### BLOCKERS

**None.** PR #72 is open and carries everything.

### EXACT NEXT STEPS

**Sixteen issues open.** Three were filed this session.

1. **Merge PR #72.** It closes #65. Until it lands, `main` has thirteen sweeps and the six expert
   files exist nowhere but the branch.
2. **#70 needs three decisions before #59 is built** — they change its blocking edges. Is `UNQ001`
   Configured, built-in, or **split**? Do the three decay signals become Rules or a non-Rule
   observations section? Where is the ADR-0001 line, operationally? All three have evidence on the
   issue; **the built-in-with-violations option is out unless an ADR supersedes ADR-0001 decision 4.**
3. **#69 is v0.2, recommended, behind gate 3.** Its three gating items are unchanged: the carrier
   proof (which Notion block type can hold a claim — **cheapest and most likely to invalidate the
   design**), the Coda gap, and the Principle 6 ADR.
4. **#18 then #19**, unchanged, then **#58 and #59**. #18 is unaffected by every #70 decision — a
   hydration-depth map does not depend on whether a rule is configured.
5. **#71** — record and close, or keep open as a coverage-model design input. Recommended: close it
   and reopen against #18's request budget, since affordability is unmeasurable before the map exists.
6. **#50 / #51 / #24 / #25 / #27 / #7 / #8 / #29** unchanged.

**NEXT-MODEL:** **frontier.** The next head after #72 is **#70's three decisions**, and they are
architecture: one of them turns on whether an ADR must be superseded, and all three govern what the
entry point is allowed to print. **Do not straddle:** merging #72 and closing #71 is fast-tier work
and should be its own short session if that is all that happens.

**NEXT-REPO/CWD:** `C:\Users\mlpgr\2026_Projects\workspace_lint` — single repo; state, plan and
resume ritual all at the root. **The four guard hooks and `deref_check.py` are NOT in this repo** —
machine-local and unversioned under `~/.claude/`, verified present on this machine this session.

**NO SELF-ASSESS LINE, BY OPERATOR RULING 2026-08-17.** The ritual line records `verdict=n/a`.

**POST-CLOSE ADDENDUM (S021, after `a0189fc` shipped) — the hygiene trim found a step that had
stopped firing six sessions ago, and going to first principles refuted the fix I had drafted for it.**

~~**Sixteen issues open.**~~ **Eighteen.** #73 and #74 were filed after the close.

**`d3173d9` — the trim.** `checkpoint.md` 1165 → 447 lines. Bands S015–S020 archived. **Five claims
were hoisted first and would otherwise have been lost** — the three live-run caveats, the manifest
`(unit, key)` rule, and the `SYS001` certainty rule. They are in the standing block above. The
standing block's own assertion that it is *"complete on its own"* was **false when tested**.

**#73 — the rotation stopped at S016 and nothing noticed for six sessions.** Measured: rotation ran at
**nine consecutive closes**, then stopped dead. `session-end-to-state` has **no rotation step** — the
ritual appends and nothing removes, so the rotation was model habit carried by each close reading the
previous one. The invariant is also **inexpressible**: the claim grammar has three kinds and all three
are filesystem predicates, so no annotation could have caught it.

**The first version of #73 proposed a fourth claim kind. The operator stopped it, and he was right.**
Every drift this repository has ever recorded is a **hand-kept copy of a fact the system already
holds**. `INDEX.md` had already concluded *"a generated index removes the scalar rather than reminding
anyone to update it"* — and #62 built the reminder. **A claim checker is a verification answer to a
duplication problem.** The split that matters is **re-derivable vs not**, and it is forced by the
reader being stateless: a stateless gate can only verify what it can re-derive right now. Asserted
claims need a dated observation with provenance, which is what `docs/proof/` is for and why it
outranks documentation. Verified: the S018 close **commit body is the S018 band**, so every close
writes its band twice and `checkpoint-archive.md` is 1,999 lines of the first copy.

**⚠ ADR-0010 forbids a fingerprint containing anything volatile. `checkpoint.md`'s header carried
"Bands S001–S009" — a volatile count in the one part of the file meant to be stable. The repository
wrote the rule for findings and violated it in its own state file.**

**#74 — Notion AI is stateless, so the workspace holds a boot-up document.** The operator wrote one
roughly a year ago so a stateless Notion AI would answer with context. **This repository was bitten by
the identical failure** — `CLAUDE.md` told every new session the project was pre-build after source
reached `main`. `REF001` and `SYS001` are already built and are exactly what checks such a document.
**The artifact is a page named "Hans" plus subpages, and the current build cannot reach it** — the
integration's grant covers the fixture, `REAL_ROOT_ID` is still unexercised, and sharing real content
is the human step #7 waits on. **Route: the Notion MCP connector, deferred to a later session by the
operator.** ⚠ MCP is a different credential path — ADR-0004 says it *"does not clear the REST path"* —
so a reading of "Hans" is **documented-tier**, belongs in `docs/research/`, and does **not** close #7.

**EXACT NEXT STEPS, corrected in place:**

1. **Merge PR #72**, unchanged. It now carries four commits including the trim.
2. **Read "Hans" and its subpages via the Notion MCP connector** and count references that no longer
   resolve — #74's verification step 1. Cheap, and it is the first real evidence for the boot-up-
   document framing. File the result in `docs/research/`, never `docs/proof/`.
3. **#73 before any further claim annotation is written.** Adding a fifth derived scalar deepens the
   defect it names.
4. **#70's three decisions**, then #18 → #19 → #58/#59, unchanged.

**NEXT-MODEL is unchanged: frontier.** #73 and #74 are both scope-and-architecture questions and they
join #70 at the head. **The verdict field is NOT re-opened by this addendum.**

---

