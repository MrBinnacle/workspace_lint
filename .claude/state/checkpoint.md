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
- **The entry point is the `policy-free decay report`, and `policy-free scan` is the run mode.**
  Renamed from "zero-config" on 2026-08-18 (PR #83) because the term named two incompatible things:
  **ADR-0001 decision 4 REJECTS "zero-config inference"** while `PRODUCT.md` named the adopted entry
  point after it. `CONTEXT.md` now defines **Policy**, **Policy-free scan** and **Built-in rule**.
  ⛔ **ADR-0001 was NOT edited and must not be** — its sense of the term is correct as written.
  ⛔ **The rename did NOT decide #70-1.** `PRODUCT.md`'s built-in duplicate-title sentence was
  re-termed **and marked contested in place**, naming ADR-0001 decision 4 as the collision. A session
  that reads the rename as having settled the built-in question is wrong, and the file says so.
- **`PRODUCT.md`'s job statement claims CENSUS REMOVAL ONLY**, since PR #83. The product removes the
  part where a human has to look; it does not remove the repair, because the non-goals forbid
  repairing content and Principle 7 makes read-only a product boundary. **Do not widen this claim.**
  #75's own candidate wording was rejected for promising "one recommendation, its evidence, and its
  rollback path" — unscoped report content, and a rollback path means nothing for a tool that writes
  nothing. Whether executive function forces a repair surface anyway is **#82**, and taking it
  reverses Principle 7 and needs a superseding ADR.
- **The competitive claim is the CREDIT METER, not another linter** (PR #83). Three limits ship with
  it and must travel with it: **no price**, **n=1 and the one is the owner**, and **"free" means no
  per-run vendor charge, not unlimited**. ⛔ **The enterprise half is NOT asserted** — it needs
  Notion's own pricing page, which has not been read.
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

**Four constraints hoisted from the S022 band on 2026-08-18 before it was archived**, because each
governs a design decision that has not been taken yet and the code alone does not state why.

- **`scope` is REQUIRED on a `REQ001` config entry, and the absence of a default IS the decision.**
  A required-property rule with no scope asserts the property over every enumerated resource, which
  infers applicability from nothing — the list ADR-0001 decision 4 rejects. A default scope is
  available to **#58** as a recorded decision; it is not available to a loader as a convenience.
- **No severity field in the config, deliberately.** ESLint separates severity from options at the
  loader and a rule cannot read its own severity. This product has no severity axis: the exit byte
  derives from findings and the coverage vector (ADR-0011, ADR-0012). A severity key would be a
  second, contradictory route to the exit byte.
- **An example config is an EXECUTABLE CLAIM about the product.** `wl.config.example.json` shipped
  declaring a `REQ001` entry the CLI rejected at exit 4 — the only worked example in the repository
  was unusable, and nothing in the suite loaded it. `CHECK-config.ts` TEST 8 loads it now.
  Any future example artifact needs a test that executes it, not a reviewer who reads it.
- ⚠ **Two NUL bytes once appeared inside a template literal in `config.ts`** where spaces were
  written. The compiler, the tests and the diff were all clean and said nothing; the only signal was
  `grep` reporting **"Binary file config.ts matches"** and `file` reporting `data`. **In a repository
  whose method is grepping, a file that reads as binary is a silent loss of the primary instrument.**

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

**Two standing risks in the enforcement layer, measured 2026-08-18 and deliberately NOT filed** —
neither blocks a rule, and the S025 standing rule forbids opening a decision ticket that does not.

- ⛔ **The enforcement layer exists on ONE machine and has no backup.** `~/.claude/settings.json` is
  gitignored, so every hook wiring in this project — the canonical-doc guard, the triage-label guard,
  the pull-rebase guard, the skill router — is reproducible nowhere. **§1 designates the hook layer as
  the place a discipline goes when it must survive the loop; that layer does not currently survive a
  disk.** This is the largest structural risk in the tooling and the cheapest to fix.
- ⚠ **`skill-router.py` has no test suite.** Three of nine hooks are tested
  (`guard-canonical-doc-edit` 163 lines, `guard-gh-issue-triage-label` 113, `guard-git-pull-rebase`
  98). The router is the untested one that matters most, because §14 marks
  `downstream-instruction-framing` MANDATORY and the router is the whole of that enforcement. It was
  measurably incomplete: on 2026-08-18 the rule matched `\bADR\b` and `execution plan` but **not the
  bare word "plan"**, so *"write me a plan for issue 18"* fired nothing. Verified against the hook
  before and after; three patterns were added and five probes confirm no false positive on
  "plane"/"planner". **A rule that fires only when the operator's phrasing happens to contain a
  different word is model-pull wearing a hook's clothes** — and a test suite is what would have
  caught it, not a reading.

**Six constraints hoisted from the S025 band on 2026-08-18 before it was archived**, plus two
adopted in S026. Each governs work that is not done, and nothing else in this file records them.

- ⭐ **THE STANDING RULE: no new decision ticket opens until four rules ship, unless it blocks a
  rule.** Adopted S025. The queue was growing faster than the build. **It is now countable** — the
  `decision` label was added 2026-08-18 and `gh issue list --label decision --state open` is the
  check. Eight open decision tickets at close. A rule stated over a set nobody could count was not a
  rule.
- ⛔ **A run can name a gap in its own report and exit `0`, and there is no second guard.** `#50`'s
  TEST 10b priced the reversal: `gapsFrom` derives the gap set from the manifest, which a rule cannot
  edit, so a mutated run still reports one gap and is still `qualified` — and the byte is green
  regardless, because ADR-0012 decision 2 makes it compare the coverage **vector**. Nothing sits
  behind the denominator decision.
- ⛔ **`notion-port.ts`'s header still says THREE read endpoints and there are four.**
  `GET /v1/databases/{id}` was authorized 2026-08-18 (#51). `/v1/data_sources/{id}` was neither
  requested nor granted. #51 stays open behind two operator-only preconditions.
- ⛔ **Three operator-only items block #51 and nothing else.** One `link_to_page` block pointing at
  `wl-dataset`, made in the Notion UI — `references.ts` line 245 reads `link_to_page.database_id` and
  no Markdown form produces that block, so the field is **unobserved**. A permanent database
  reference in the fixture, whose addition moves `fixture-oracle.ts`'s `references.applicable` and
  must be **re-pre-registered before the run, never corrected after it**. And `findingFor(...)!` at
  **THREE** call sites in `CHECK-sys001.ts` — lines 61, 140 and 330 — which sends a reversal to exit
  1 by throwing at TEST 1 before TEST 10's named ruling is reached; a diagnostic line now states the
  cause above the throw.
  ⚠ **The S025 band said NINE and it was wrong.** Caught by the S026 close's deref step, which is
  the first time anything dereferenced it. The **mechanism** was right and only the count was
  invented; a count is the fastest-rotting claim there is because it is quoted and never visited,
  and each re-quotation reads as corroboration. `grep -o "findingFor([^)]*)!" slice/CHECK-sys001.ts`
  is the check. *(The same pass flagged `references.ts` line 245 as missing
  `link_to_page.database_id` — a FALSE alarm: the line reads `b.link_to_page?.database_id` and the
  grep omitted the optional chaining. The claim held; the check was the defect. Search for
  `link_to_page` and read the line.)*
- ⚠ **`sed -i` and `cat >>` heredocs rewrite a CRLF file to LF**, and the flip lands in the committed
  blob because `core.autocrlf` is `false` and there is no `.gitattributes`. An 80-line append became
  `445 insertions, 338 deletions`. **Use the `Edit` tool on this repo's source files.** When a script
  must write, open with `newline=""` and preserve the file's own ending — the S026 band rotation did
  that and produced a symmetric 132-in/131-out diffstat.
- ⛔ **An empty task list is not evidence a background fork finished.** `TaskList` reported "No tasks
  found" twice while a `/code-review` fork was live; it returned ten minutes later with five valid
  findings. Wait, or say plainly that the work shipped unreviewed. Never predict a pending agent's
  result.
- **`.out-of-scope/` exists as of 2026-08-18 and is the record format for a refusal.** A refusal and
  a ticket are **independent choices**, and S025 treated them as one — it declined the ticket for
  good reasons and lost the record as a side effect. `/triage` reads the directory in step 1 to catch
  an already-rejected proposal and writes to it before closing a rejected enhancement. Seeded with
  the Convex refusal. An entry with **no issue behind it is the normal case here**, not a malformed
  one.
- ⚠ **A verification grep that returns nothing may have searched the wrong tree.** The Bash tool's
  cwd persists, so a `cd slice` from a test run silently redirects a repo-root-relative sweep and
  "no matches" reads exactly like a clean repository. This fired on 2026-08-18 against the stale-claim
  sweep itself — the one check that exists because the same false claim has stood in three or more
  surfaces five times. **Absolute-`cd` every verification command and carry a positive control**, so
  an empty result proves the search happened.

**The gates. Both of them are closed, and nothing gates the build.**

- **Gate 1, the demand test — CLOSED 2026-08-17** on owner research rather than on a five-team send.
  #40 closed with it. Framing 2, the **policy-free decay report**, is the entry point — renamed from
  "zero-config decay report" on 2026-08-18, substance unchanged. **It chose an
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
  && ` then TEN files, 38 + **64** + 56 + **109** + 124 + 89 + 50 + 76 + 56 + **31** = **693 assertions**,
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






## S026 — 2026-08-18 — the endpoint was decided out rather than left silent, and the hook that enforces "always frame a plan" did not know the word "plan"

**PHASE:** **BUILD.** #24 and #18 taken as ONE unit and both shipped. **Four commits, TWO PRs merged
(#89 as `846cd64`, #90 as `063b0a2`), three issues CLOSED (#24, #18, and #19 the day before),
nothing filed.** `main` is green at `063b0a2`.

**TESTS:** **696 assertions, ten suites, exit 0, offline.** Up from 693 — `CHECK-claims.ts` TEST 6
emits one assertion per claim comment and three were added. Verified on merged `main`.

**LIVE:** none. No API call was made this session, and none was needed: both artifacts decide what
the product does, not what the API does.

### What shipped — #24, as ADR-0014

**`POST /v1/search` has no role in the v0.1 scan, and the reason is not that search is broken.**
ADR-0007 decision 3 opened five design surfaces, found every one silent, refused to read that
silence as a negative, and pre-registered its falsifier: *a decision that assigns search a role
falsifies the enumeration.* **ADR-0014 is that decision and the role it assigns is none.**

It answers #24's four requirements in order. Root discovery is not in v0.1, and search would be the
wrong instrument even if it were: ADR-0002 findings 1–3 make it non-exhaustive, blind to inherited
access, and dead at ~11,200 objects, so a suggestion list is **a partial enumeration the tool cannot
attest** — a named residual under ADR-0013 decision 2, which decision 3 forbids rendering as a
number. **A first run that under-suggests looks like a small workspace.** ADR-0006 decision 5's
disclosure resolves to its unchanged branch. ADR-0007's search row is marked accurate-and-unexercised
so a fourth session does not re-derive it.

⭐ **Supersedes nothing, and that is the point.** It decides what an ADR declined to decide, which is
the first time this project has closed a scope question by *stating* a negative rather than by
leaving surfaces silent.

**A seventh surface exists and it executes.** `slice/notion-port.ts` already declares `SEARCH`,
classifies it `attested`, and comments *"Not called by this slice."* The ADR names which of the two
is enforcement — **the port's classification table, which fires when a call is added** — and which is
a rule that must be remembered. Do not let a later session read the ADR as the mechanism.

### What shipped — #18, as `docs/spec/v0.1-hydration-map.md`

Per rule: fetch depth, pagination requirement, endpoint attestation, and what a partial hydration
does to that rule's evidence sufficiency. The four deferred rules get a line each and **are assigned
no coverage item**. The one slice-scoping choice is marked revisable: `REQ001`'s acquisition route,
N page retrieves versus one paginated data-source query, unexercised either way.

⭐ **THE FINDING: the request budget is bound by block-tree SHAPE, not by workspace SIZE.** The
estimate is a formula and it **reproduces this project's only call log at exactly 7 requests**;
everything larger is labelled extrapolation from n=1 rather than presented as an estimate. At 150
resources: **~315 requests at 8% block nesting, ~495 at 20%**, against 540. The resource count
contributes one request each; the recursive descent contributes one per block with children and is
unbounded in the *shape* of the content. A tier-(C) third-party figure agrees from outside: one
250-block page with 50 toggles costs **103 calls — 19% of the budget, on one page.**

**Consequence not yet decided:** `PRODUCT.md`'s warm-scan kill criterion **cannot be predicted from a
resource count**, so a first run cannot warn an operator before exceeding it. Whether that warning is
owed is a product question the spec deliberately does not decide.

**Two ceilings the map prints.** `POST /v1/data_sources/{id}/query` caps at 10,000 and returns
`has_more: false` at exactly 10,000. And **`REQ001` over a relation or people property can read a
value truncated at 100 inside an otherwise SUCCESSFUL response** — a residual under ADR-0013, not a
violation, and **#58 meets it first.**

### The claim system was mutation-tested, and the sweep that followed nearly shipped a false clean

Moving the spec out of the tree takes the suite to **exit 1** with both claims failing by name and
path; moving it back returns exit 0. **A claim comment that cannot fail is not a check.**

⚠ Then the stale-claim sweep returned **empty** and was one sentence from being reported as clean.
`pwd` was `slice/` — a `cd` from a test run six calls earlier. From the repo root the same command
returned five matches. **That sweep exists because this repo has shipped the same false claim across
three or more surfaces five times; a false clean would have been the sixth, produced by the check
built to prevent it.** Hoisted to the standing block.

### What shipped — the tooling half (PR #90)

Five items, **nothing filed**, because none blocks a rule.

⭐ **The finding: `downstream-instruction-framing` is marked MANDATORY before ANY plan, and its
router patterns did not match the word "plan".** Tested against the live hook **negative first** —
*"write me a plan for issue 18"* produced nothing. It had been firing on `\bADR\b`, so its correct
behaviour earlier this session was **coincidence relative to the rule's stated purpose.** Three
patterns added; it now fires on that probe and on *"And triage/skill tooling plan"*, the operator's
actual message, which had produced no reminder at the time. Five probes confirm no false positive,
including `plane` and `planner`. **A router rule moves a discipline to the hook layer only to the
extent its predicate is complete.**

`.out-of-scope/` created and seeded with the Convex refusal S025 declined to record. A `decision`
label added — **supplementary, not a third category**, so `/triage`'s one-category invariant holds —
because the S025 standing rule is stated over decision tickets and nothing could count them. Ten
issues gained the `enhancement` they lacked; **16 of 16 already carried exactly one state role, which
is the triage-label guard's output, not diligence.** `CLAUDE.md` §14 now marks every skill
`[✓]`/`[/]`/`[off]` for reachability.

⚠ **The §14 fix came from making the error.** A search for `ask-matt` at `-maxdepth 4` returned
nothing and a present skill was reported non-existent. **Plugin skills sit at depth 7.** Twenty of
thirty-five Pocock skills are operator-only; `/triage` and `/ask-matt` are both among them and
neither had ever been named in §14.

### BLOCKERS

**None for the build. Nothing blocks #58 or #59 for the first time.** The three standing
operator-only items are hoisted into the standing block above and all three gate **#51 only**.

### EXACT NEXT STEPS

**Fourteen issues open**, eight of them decision tickets. #24 and #18 closed this session.

1. ⭐ **#58 — `REQ001`. THE PLAN IS WRITTEN AND APPROVED. Execute it, do not re-plan it.**
   `~/.claude/plans/steady-seeking-rocket.md`, approved 2026-08-18. It carries the Files table that
   is the `guard-canonical-doc-edit.py` authorisation token, so **re-approve it via `EnterPlanMode`
   if it has aged past 24h** — the guard checks mtime, not intent. Read
   `docs/spec/v0.1-hydration-map.md` §1.3 alongside it.
2. **#70 decision 1**, then **#59 — `UNQ001`**. That completes the four v0.1 rules.
3. **#51's implementation**, once the two operator preconditions are met. `notion-port.ts`'s header
   is wrong until then.
4. **Disposition sweep — fast tier, its own session.** **#71** record and close; **#74** count the
   broken references in "Hans". Both still `needs-triage`.
5. **Hook tests, `skill-router.py` first** — its own session. Three of nine hooks are tested and the
   untested router is the one §1 designates as the enforcement layer.

**Off the critical path and deliberately shut:** #8, #25, #27, #29, #69, #82, #84.

**Three skills are staged in `~/.claude/skills/_quarantine/`** and need manual §1.5 review before
promotion: `hidden-and-plugin-skill-reachability`, `router-skill-predicate-gap`,
`bash-cwd-drift-false-clean-grep`. None is active until promoted.

**NEXT-MODEL: fast tier.** #58 is separable execution mechanics against a spec that now exists and
names its own hazard; the decision work it depended on shipped this session. **Do not straddle:** if
the session would also take #70 decision 1 — which is irreversible-shaped and prose an ADR will be
read against — shrink the scope to #58 alone and give #70 its own frontier session.

**NEXT-REPO/CWD:** `C:\Users\mlpgr\2026_Projects\workspace_lint` — single repo; state, plan and
resume ritual all at the root.

### WHAT ONLY THE OPERATOR CAN DO

**To launch the next session:** `/clear` (never `/compact`) → select **fast tier** →
`/session-start-from-state`.

**Blocking #51:** the `link_to_page` block and the permanent database reference, both in the Notion
UI. Both are in the standing block above.

**Worth doing when there is slack, and on no ticket by design:** back up `~/.claude/settings.json`.
The whole hook layer exists on one machine with no reproduction path, and §1 designates that layer as
where a discipline goes when it must survive the loop.

**Promotion review** of the three quarantined skills.

**Actions no agent can perform at all:** anything in Notion's developer portal, any share or
permission change in the Notion UI (including reconnecting `wl-revoke-child`, which resets Q1),
merging a PR when the classifier declines it, and anything requiring a TTY — **the `!` prefix has no
TTY.**

**NO SELF-ASSESS LINE, BY OPERATOR RULING 2026-08-17.** The ritual line records `verdict=n/a`.

### POST-CLOSE ADDENDUM (S026, after `2487ab5` shipped) — #58 was planned, not built, and reading the code moved four things the plan had to absorb

The close shipped, PR #91 merged as `49bfcc0`, and the session continued. **No deliverable landed
after the close**, so this is an addendum rather than a second band: what follows is a plan, four
design findings, and three dispatches whose results have not arrived.

**The operator's direction, verbatim in effect:** run #58 in a **fresh session** with clean context.
The plan is the handoff.

#### The plan exists and is approved — `~/.claude/plans/steady-seeking-rocket.md`

⛔ **Execute it. Do not re-plan it.** It carries the Files table that is
`guard-canonical-doc-edit.py`'s authorisation token for `CONTEXT.md` and `PRODUCT.md`. The guard
checks the plan file's **mtime within 24h**, not intent — **if it has aged out, re-approve through
`EnterPlanMode` before touching either file.** That is a mechanical re-approval, not a re-decision.

#### Four findings from reading `slice/`, none of which were known at close

1. ⭐ **`slice/notion-port.ts` DISCARDS `properties`.** `retrievePage` is typed
   `Promise<{ id: string; url?: string }>` and the adapter casts the SDK response to it. `REQ001`'s
   entire input is thrown away at the seam. The fix is a **field, not a method** — `properties?` on
   the same return — so `GET /v1/pages/{id}` stays the same call and #51's ASK-FIRST precedent for a
   *new endpoint* does not apply.
2. ⭐ **The scan retrieves ONLY the declared root.** Descendants arrive as `child_page` blocks inside
   a parent's listing and are never fetched as pages, so there is no property data for any resource
   below the root. **`REQ001` needs a hydration stage that does not exist**, which is exactly the
   cost `docs/spec/v0.1-hydration-map.md` §1.3 priced as route 1.
3. ⭐ **The rule turns on one mapping, and it is forced away from the flattering direction.** A
   property **absent from the page's property map** is **NOT a violation** — the API returns the
   properties the integration can see, so absent means *not defined here* OR *not granted*, and the
   scan cannot tell which. Only *present-and-empty* is a violation. Collapsing the two reports a
   defect in the operator's workspace that is really a defect in the grant. This is #58's own
   hazard 1 and it is marked **non-negotiable** in the plan.
4. ⚠ **A live `REQ001` VIOLATION cannot be produced against the current fixture.** The readable pages
   carry `title`, which is non-empty; the only resources with arbitrary properties are rows inside
   `wl-dataset`, which this build does not enumerate. **The live run proves the conforming path and
   the gap path, not the violation path**, and `docs/proof/` must say so rather than imply a fuller
   proof. Creating a violating page is an operator-only Notion-UI action. **This is a fifth
   operator-only fixture item** and it belongs beside the two that gate #51.

#### Three read-only scouts were dispatched and HAVE NOT REPORTED

⛔ **Their findings are not in this file and must not be assumed.** Dispatched against **#78**
(property identity, name vs ID), **#70 decision 1** (built-in duplicate-title, the blocker on #59),
and **#71 + #74** (disposition prep). All three were read-only: no file was written and nothing was
posted to the tracker by them.

**An empty `TaskList` is not evidence a fork finished** — it returned "No tasks found" while all
three were live, which is the same signal that cost S025 a defect. A fresh session should treat these
three questions as **open and un-researched**, and re-dispatch rather than wait. If a return arrives
in the operator's terminal after this commit, it is evidence, and it lands as its own addendum.

#### One correction to the shipped band

The band's next-step 1 said to read the hydration map "first". ~~That was the whole of the
instruction.~~ It is now insufficient: the instruction is to **execute the approved plan**, and the
map is read alongside it. Corrected in place in EXACT NEXT STEPS above, because that block is read by
the next session rather than being a dated record.

**Nothing else in the S026 band is superseded.** The gate figure (696), the merge SHAs, the
`findingFor(...)!` correction to three, and every hoisted constraint stand as written.
