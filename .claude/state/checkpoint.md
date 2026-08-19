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
- ~~**`REAL_ROOT_ID` is still unexercised.** Nothing has called it.~~ ⛔ **CORRECTED 2026-08-19 —
  IT IS NOT MERELY UNEXERCISED, IT IS POINTED AT THE WRONG PAGE.** `REAL_ROOT_ID` holds
  `wl-outside-grant`, the fixture's **never-connected contrast page**, which 404s by design. A scan
  against it resolves in two requests to *"declared root UNREACHABLE"* and exit 2 — a path already
  exercised, so it yields nothing. `.env.example` describes the variable as *"A real workspace root,
  if you want disclaimed-frequency measured"* and ships it **empty**. The note read as *ready and
  waiting* for many sessions because nobody dereferenced the value. **Q8 and the Q3 re-run remain
  open and are NOT one config edit away.** They need a real root **shared with the integration in
  the Notion UI**, which is operator-only.
- ⛔ **THE INTEGRATION'S ENTIRE GRANT IS THE FIXTURE.** Measured 2026-08-19 with a one-call
  `POST /v1/search` diagnostic: two workspace-level pages plus the 150 synthetic `row NNN` pages, and
  nothing else. **No real content is reachable by the REST token until the operator shares a page.**
  ⚠ *Search as a DIAGNOSTIC does not violate ADR-0014* — that decision governs the product's command
  paths, and search's weakness (unattested, eventually consistent) bears on denominators, not on
  discovery. It is not a licence to put search in the scan.
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

**Four constraints hoisted from the S026 band on 2026-08-18 before it was archived**, because each
is a machine or method fact that nothing else in this file records.

- ⛔ **`~/.claude/skills/` IS A SYMLINK FARM OVER A VERSION-CONTROLLED REPO.**
  `subagent-research-reliability` resolves to
  `C:\Users\mlpgr\2026_Projects\skills\skills\orchestration\subagent-research-reliability`. Editing
  "the skill" edits that repo directly, on `main`, bypassing the quarantine gate — and `git status`
  in `~/.claude/skills` does not show it, because the path is beyond a symlink and git reports
  `fatal: pathspec ... is beyond a symbolic link`. **Before editing anything under
  `~/.claude/skills/<name>/`, resolve it with `readlink -f`. If the target leaves `~/.claude/`, you
  are editing a canonical repo.**
- ⛔ **NAME THE RETURN CHANNEL IN EVERY SUBAGENT DISPATCH.** Plain text a subagent prints is a DEAD
  LETTER — the main session never sees it, and four idle notifications carrying no content are
  indistinguishable from a finished report. Name **`SendMessage` to `main` plus one authorised
  scratchpad path**, every time. The patched skill that carries this as Check 0 is **in
  `_quarantine/` and is NOT live**, so this line is the only live copy.
- ⛔ **`role-council` SILENTLY NO-OPS ON THIS PROJECT.** It requires
  `<project-root>/.claude/role-council/config.md` and this repo has no `.claude/role-council/`
  directory. The skill treats the absence as opt-out and costs nothing — including costing you the
  council, with no signal. Working route: SME seats as subagents, with
  `parallel-review-disposition-schema` so the seats join and the return channel named above.
- **#70 decision 1 has a researched recommendation waiting, and it needs NO superseding ADR.**
  Policy-free mode emits a **`review`-kind result** with no conformity claim and no exit-byte
  contribution, and the **same release** ships the promotion path — the report prints the `UNQ001`
  config stanza. It follows from ADR-0001 decision 4, ADR-0005 decision 1 and ADR-0011. ⛔ **A
  superseding ADR IS required for what `PRODUCT.md`'s contested sentence asserts** — a built-in mode
  emitting *conformity violations* — because that reverses ADR-0001 decision 4 on the identical noun.
  **One ADDITIVE ADR is still warranted** for the third `findingKind`. Unsettled: whether the
  `review` result also appears in a *configured* run.

⭐ **THE STANDING DECISION-TICKET RULE WAS AMENDED 2026-08-18 AND THE OLD FORM MUST NOT BE RESTORED
BY INSTINCT.** It read *"no new decision ticket opens until four rules ship, unless it blocks a
rule"*. It limited **recording** where the problem was **scheduling**, which pushed decisions into
prose in this file — the one medium this project has proven six times it cannot trust — and made the
`decision` label expensive, corrupting the instrument the rule was counted with.

> **Record always, schedule never.** Every decision question is FILED. At most **one** decision
> ticket may be active — `decision` and not `deferred` — while any v0.1 rule is unbuilt. *Unless it
> blocks a rule*, unchanged, now gating scheduling rather than recording.

`deferred` is a supplementary label exactly as `decision` is, and **a deferred issue must name what
would make it active**. Full reasoning and the prior art — Kanban WIP limits, aviation's Minimum
Equipment List, ordinary defect triage, all three of which put the limit on work in progress and
never on the backlog — are in `docs/agents/triage-labels.md` → "The standing rule, as amended".
The check: `gh issue list --label decision --state open --json number,labels --jq '[.[] | select([.labels[].name] | index("deferred") | not)] | length'` ≤ 1.

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
  && ` then every registered suite, offline, no network, no token. The FILE COUNT is claim-gated
  below; the assertion total is not written here at all.
  ⛔ **THE PER-TERM SUM WAS DELETED ON 2026-08-19 AND MUST NOT BE RESTORED.** It was wrong three
  times: `693`/ten terms while the gate ran 696 across ten; then `794`/eleven while the gate ran
  795; the `CHECK-claims.ts` term was stale on both occasions. It is a hand-kept mirror of a number
  the gate computes on every run and the claim gate cannot check, which is precisely **G-010** —
  *keep a pointer, never a mirror*. **Re-derive it, never re-quote it:**
  `for f in slice/CHECK-*.ts; do npx tsx $f | grep -cE '^(PASS|FAIL)'; done`
  ⚠ That loop's exclusions are NOT the gate's: it counts `CHECK-harness.ts` and `CHECK-fakes.ts`,
  which are helpers that assert nothing and print nothing, so they contribute zero and the total is
  right by accident. The claim comment below excludes them deliberately.
  <!-- claim: count glob="slice/CHECK-*.ts" exclude="CHECK-harness.ts,CHECK-fakes.ts" equals=12 --> ~~`npm run check` DOES NOT TYPECHECK~~ — **#60 CLOSED**, and the
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

**Six constraints hoisted from the S029 band on 2026-08-19 before it was archived**, because each
governs work not yet done and nothing else in this file records them.

- ⭐ **AN ALWAYS-LOADED DOCUMENT IS NOT AUDITED BY READING IT FOR WRONGNESS — every line reads fine.
  It is audited by asking which lines a MECHANISM can falsify, and treating the rest as a mirror
  with a canonical owner.** `CLAUDE.md`'s `exists`/`absent` claims have never gone stale, because
  building a file turns the gate red. Its unchecked STATUS prose rotted twice in the same sentence
  slot. Extending the claim kinds to status claims is **#103**.
- **Sharpen the pointer first; inline only if sharpening fails.** Six lines of `CLAUDE.md` restated
  `docs/agents/domain.md` because two files had gone unread — and the root cause had already been
  fixed *in* `domain.md`, so the copy was redundant from the day it was written. Sharpening was
  never tried.
- ⛔ **Ask whether a ticket's own deliverable needs a decision's OUTPUT, not whether the decision is
  open.** Neither dereference check finds the self-imposed-blocker shape. `#59` was carried as
  blocked for four sessions by a dependency it had imposed on itself.
- ⛔ **Do not inherit completion from a closure.** `#7` closed `COMPLETED` over its own "Blocked on
  (1)" comment; `#70` closed over a body naming three live decisions.
  ⭐ **THE OBSERVATION WAS RIGHT AND THE CAUSE WAS WRONG, established 2026-08-19.** Neither was
  closed by a person. **GitHub's parser closed both**, reading `<keyword> #<number>` out of narrative
  prose in a merged state-file commit body — `resolved #70` in `71d26ed`, from the true sentence
  *"Five isolated SME seats resolved #70 decision 1"*. **Four issues went this way: #7, #10, #70,
  #73**, each one to two seconds after a merge, each `COMPLETED`, each credited to the merger.
  ⛔ **`actor` CANNOT TELL YOU WHICH IT WAS.** Every actor here is `MrBinnacle` — the operator's
  account, the identity `gh` writes as, and the merger. Reading it as "the operator decided" put a
  non-question on the operator-only list for three sessions. **The tell is the lag: compare
  `closedAt` against the merge times in the same minute.** Full doctrine and the pre-merge grep are
  in `docs/agents/issue-tracker.md` → "A commit body can close an issue by accident".
- **A subagent's quotation is a claim about a file, and is checked by opening the file.**
- ⚠ **A label read taken immediately after a label write can be stale.** GitHub's label index lags;
  a post-write count that looks like a failure should be re-read before it is recorded as one.

**The state role answers "whose move is it?"** Ruled and applied 2026-08-19; `needs-triage` means
only *not yet evaluated*. The vocabulary, its branch triggers and how `deferred` combines with it
are in `docs/agents/triage-labels.md`. ⛔ **It was surfaced as the operator's values decision three
times and was never one** — §0.6's test was never run on it, and a label named `needs-triage` on an
evaluated issue is simply false. The defect was an under-specified document, not an undecided call.

**Four constraints adopted in S030, 2026-08-19.**

- ⛔ **THE WRITE TOOL CAN EMIT A NUL BYTE.** `slice/unq001.ts` was authored whole by `Write` and
  shipped one NUL inside a template literal where a space was written — the identical shape to
  `config.ts` one day earlier, so this is not a property of `sed`, heredocs or python round-trips.
  A clean typecheck, twelve green suites and a mutation run all stayed silent. **Check every file
  you WROTE, not only the ones you rewrote, before committing.** `file <path>` reporting `data` is
  the cheap tell.
- ⛔ **A GUARD KEYED ON AN ENTRY COUNT IS AMBIGUOUS WHEN THE COVERAGE ITEM IS QUADRATIC.** `C(1,2)`
  is zero, so a one-member uniqueness scope that was hydrated and correctly compared is
  indistinguishable, by count, from a stage that never ran. `declareScopesNeverEnumerated` guards on
  whether the stage RAN; its REQ001 sibling may guard on the count only because that stage always
  declares at least one pair per declaration. **A zero is not an absence.**
- ⛔ **INLINE BACKTICKS DO NOT PROTECT A CLAIM COMMENT — only a fenced block does.** This file's own
  S029 next-step reproduced `absent path="slice/unq001.ts"` verbatim while warning about the two
  documents carrying it, and thereby made the claim itself: the S030 build turned the gate red on
  THREE surfaces, not two. **Name a claim's kind and path in prose, or fence it. Never reproduce the
  comment.** `CHECK-claims.ts` reads this file, `CLAUDE.md`, `CONTEXT.md`, `domain.md` (twice) and
  `docs/research/INDEX.md`; it does NOT read `checkpoint-archive.md`.
- ⚠ **A COLUMN WIDTH WRITTEN AS A CONSTANT BESIDE ONE THAT IS MEASURED is correct until the data
  outgrows the guess.** `report.ts` padded the manifest's unit column to 20 while measuring the
  resource column from the data; `resource pairs in a uniqueness scope` is 36, so UNQ001's loss text
  abutted its unit. Third instance of the shape in this repo, after `heading.length + 20` in
  `CHECK-harness.ts`. **Found by the live run and by no assertion.**

**Three constraints hoisted from the S027 band on 2026-08-19 before it was archived**, because each
is a standing fact and nothing else in this file records it.

- ⛔ **THE OPERATOR MERGES EVERY PR. `gh pr merge` IS DENIED TO THE AGENT** by the auto-mode
  classifier. Both of S027's PRs and S028's were merged by the operator. This is a standing
  constraint, not a task — never plan a step that depends on the agent merging, and never write a
  band claiming a PR's state from the MERGED badge. **Verify with `git merge-base --is-ancestor
  <sha> origin/main`.** The operator has merged mid-close twice — PR #38 during S026 and PR #94
  during S027 — so **re-read external state immediately before committing a close.**
- ⚠ **A UNIT TEST OF AN EVALUATOR MUST NOT DEPEND ON THE REPOSITORY'S OWN STATE.**
  `CHECK-claims.ts` used `slice/req001.ts` as its *"does not exist"* fixture and it rotted the
  moment the rule shipped — three assertions failed at once inside the suite whose job is catching
  stale claims. The evaluator was right; **its fixture had become a claim about the build.** Use a
  path that cannot ever exist, not one that merely does not exist yet.
- **The `_quarantine/` promotion review is still owed and is operator-only.** Four skills from this
  project's sessions are staged in `~/.claude/skills/_quarantine/` and need manual §1.5 review:
  `hidden-and-plugin-skill-reachability`, `router-skill-predicate-gap`,
  `bash-cwd-drift-false-clean-grep`, and the `subagent-research-reliability` patch. ⚠ **The
  directory holds 22 entries, not four** — the rest come from other projects. Do not read the
  quarantine as this project's queue.

**Two constraints hoisted from the S030 band on 2026-08-19 before it was archived**, because each
governs how a result may be described and nothing else in this file records them.

- ⛔ **SAY THE v0.1 CATALOG IS BUILT, NEVER THAT IT IS PROVEN.** All four rules ship. `UNQ001`'s and
  `REQ001`'s conformity-violation paths have **never run against the live API** — every readable
  title in the fixture is distinct and every required property carries a value, so a live run
  exercises the *conforming* path in both cases. The offline-only criteria are named per rule in
  `docs/spec/UNQ001-uniqueness.md` §6 and `docs/proof/results-59-unq001.md` §3. Both are released by
  the same operator action, `#102`.
- **The `not-built` loader class was REMOVED and must not come back as a convenience.** *"Is this
  rule built?"* is a question about the BUILD — `unimplementedRules` asks it and `cli.ts` rejects on
  it at exit 4 — and a `not-built` table in `config.ts` is a hand-kept mirror of `BUILT_RULES` that
  goes stale exactly as the last one did. *Revisit if:* a future rule is catalogued but unbuilt
  **and** `unimplementedRules` turns out not to cover it.

**Three constraints adopted in S031, 2026-08-19.** All three are about verification that reports
success, which is this project's oldest failure shape.

- ⛔ **A SWEEP THAT STOPS AT THE FIRST HIT PRODUCES A CONFIDENT FALSE CORRECTION.** S031 grepped for
  a fallback string, found `'(unknown block)'` in `references.ts`, and filed a public correction
  saying #100's brief had invented `'(unrecorded block)'`. Both strings existed — `scan.ts` wrote the
  second, for a different condition — and the brief was accurate. **This is "a refuted claim is never
  in one place" running in reverse**, and it is worse than the forward version: a missed surface is a
  silent gap, while a first-hit sweep produces a correction that reads as thorough. **Count the hits
  before writing the verdict.** Both strings now name their own cause and `CHECK-report.ts` asserts
  they are distinguishable, which is the assertion whose absence let a brief and a grep disagree.
- ⛔ **AN ASSERTION WHOSE SUBJECT CAN GO EMPTY IS SUBSTITUTABLE.** `x.includes('')` is TRUE for every
  `x`. `CHECK-report.ts` asserted `rendered.includes(SOURCE_NOT_APPLICABLE)`, so blanking that
  constant left the check green while the report printed a bare label and nothing after it. The
  mutation was run and this suite passed it; the catch came from a **literal regex in a different
  file**, by accident of how that one was written. **Guard the subject's emptiness first, then assert
  a literal that does not read the constant.** Same family as the `reportSection` → `''` hazard
  `requiredSection` exists for.
- ⛔ **VERIFY A MUTATION ACTUALLY SUBSTITUTED BEFORE SCORING THE RUN.** One of S031's six mutations
  used a mis-escaped search string, matched nothing, and the gate stayed at exit 0. **An unapplied
  mutation is indistinguishable from dead code, and both look like a green gate.** Print the
  substitution count, or grep for the mutated text, before believing the exit byte. This extends the
  standing rule that a green mutation names dead code: it may instead name a mutation that never
  happened.

⭐ **THE n=1 PROBLEM IS DISTRIBUTION, NOT ACCESS. Established S031 on the operator's reframing.**
The repository has read n=1 as an evidence problem to be solved by someone granting access. It is the
other way round: **nobody grants access to a tool with nothing to show.** The operator stated it
directly — *"it could be more than n=1 if we had results worth pitching to someone"* and *"why would
I declare my intent as far as end users/customers when we don't have something worth selling
ANYONE."* Both are right, and the second one refuses the request `#29` has been making for four
sessions. **Do not schedule a buyer conversation, a segment declaration or a pricing question ahead
of a measured rate.** `#117` owns the upstream half and names the three routes in cost order.
---

---

## S031 — 2026-08-19 — the finding got an address, and the strategy got its dependency order reversed

**PHASE:** **POST-BUILD.** All four v0.1 rules are on `main`. This session shipped one ticket end to
end and then spent the rest of itself on why shipping tickets is not currently producing evidence.

**TESTS:** **TWELVE suites, exit 0, offline.** Re-derived, never quoted.

**TRACKER:** 22 open. Two filed this session — `#117` and `#118`.

### ⭐ The finding: the n=1 problem is distribution, not access, and the operator named it

Hoisted to the standing block. The short form: the repository has spent four sessions treating "no
second workspace" as an access problem to be solved by someone granting a share. It is a
**distribution** problem — nobody grants access to a tool with nothing to show — and `#29` has been
asking the operator to declare a buyer for a thing that has no result worth pitching.

`#29` is retargeted rather than answered, with the operator's own two sentences on the ticket.
`#117` now owns the upstream half.

### ⭐ Nineteen research files and not one denominator

`docs/research/INDEX.md` was read line by line against the question *"how often does the defect this
product detects actually occur?"* **Nothing answers it.** Eleven files are prior art on design
problems, three are stated-preference evidence about what users say, one is competitive, one is
naming/legal. `docs/proof/results-first-real-workspace.md` is the only measurement and it is n=1
supporting an **existence** claim.

Three routes to a denominator are on `#117` in cost order: the owner's own workspace at full width
(one click, blocked under `#51`), a public-page corpus (sweep first — §0.5 hard trigger, four things
unsettled including terms of service and whether the measurement even transfers from rendered HTML
to API objects), and one consultant's client workspaces (the payoff, not the first move).

### ⛔ `PRODUCT.md` says the field is empty and one segment is not

`PRODUCT.md`'s counter-argument against consultants — *"a consultant billing hourly has an incentive
against a tool that mechanizes billable hours"* — is refuted by the file it cites.
`docs/research/notion-user-pain.md` §3 records **three** billing models: hourly, fixed builds
($1k–$25k+), and retainers. Under the last two the incentive **inverts**. The same section grades the
segment STRONG EVIDENCE / multiple sources, and two of those sources are not opinions — a
practitioner who hand-authors structural rules **and publishes them**, and a read-only structural
audit **already sold as a fixed-scope product** by Notion Rescue.

Filed as `#118`. ⚠ **It needs the §5 plan gate**, because `PRODUCT.md` is hook-blocked and the
authorisation token is the plan's **Files table**, not a mention in prose.

⛔ **This does NOT name a buyer.** No price tested, nobody contacted, `#29`'s DoD untouched.

### #100 shipped, and its own commit had to be corrected by the next one

`REF001` findings now carry `source` — the page and block that hold the link. It was a render
change: `references.ts` had recorded the data at discovery and `report.ts` rendered it zero times.

Three things worth carrying:

- ⭐ **A defect not in the ticket:** `scan.ts` passes the **bare** page ID, so `sourcePage` would have
  rendered unhyphenated beside hyphenated anchors and manifest rows. Two forms of one time-ordered ID
  in one report is the `#42` double-count shape. `idForm` normalises; `hyphenate` returning null for
  non-IDs is exactly what the fallback strings need.
- ⛔ **The first commit filed a false correction** against `#100`'s brief, and the second commit
  retracted it. Hoisted to the standing block as the first-hit-sweep constraint.
- ⛔ **The first commit shipped two defects it had named in its own prose** — a vacuous
  `includes('')` assertion and a README block promising a YAML config the binary cannot read. **A
  note that names a defect and ships it is worse than silence, because it reads as handled.** Both
  fixed in `02bea07`.

⚠ **FORWARD REFERENCE — everything in this section is on PR #116 and is NOT on `main` at the time
this band was written.** It resolves when the operator merges; until then a deref check will
correctly flag it, and that is the mechanism working rather than a stale claim.

`README.md` is now claim-gated (eight `exists`/`absent` annotations). ⚠ **That raises the floor and
does not close `#100`'s hole** — `count`/`exists`/`absent` cannot express a claim about behaviour,
which is what the opening sentence got wrong. `#103` owns the extension.

### BLOCKERS

**None mechanical.** The gate is green and the build is done. The blocker is evidential and it is
named: there is no measured rate of the defect anywhere in the repository.

### EXACT NEXT STEPS

**Twenty-two issues open** — 8, 25, 27, 29, 51, 69, 70, 74, 78, 82, 84, 95, 96, 97, 100, 101, 102,
103, 111, 113, 117, 118.

1. ⛔ **Merge state first, and by ancestry, never the badge.** `main` carries `bfdd449`. **PR #116 was
   open at close** — the `#100` work, two commits. `git merge-base --is-ancestor 02bea07 origin/main`
   before branching. The operator has merged mid-ritual or immediately after it on the last **four**
   closes; assume it is already merged and verify rather than reading this line as state.
2. ⭐ **`#51` IS THE CRITICAL PATH AND ITS FRAMING CHANGED.** It was "the ceiling". It is now the
   **precondition for the only evidence route that costs nothing** — widening the grant to a real
   root makes the ten-of-twenty ratio worse, not better, because the added resources are
   disproportionately data sources. Decision granted; implementation left. Two operator-only
   Notion-UI steps gate the live run.
3. **`#117`'s Route 2 sweep, and it is a research session not a build session.** ⛔ §0.5's hard
   trigger: **prior-art first, instrument second.** The web-decay literature — link rot, reference
   rot in scholarly citation — is the equivalent problem in another domain and has **not been
   opened**. It may hand over the method, the expected rate, or the finding that the number is
   already published, which collapses `#117` to a citation.
4. **`#111`** — `www.notion.so` is an OBSERVED internal-link host, so `REF001` under-reports today.
   ⛔ **Do not close it by extending the allow-list**; the host set is unbounded and the residue path
   is the soundness mechanism.
5. **`#96`** — a worked entry in `wl.config.example.json`. `UNQ001` is configurable too now.
   `CHECK-config.ts` TEST 8 executes that file, so whatever is added must load.
6. **`#118`** — needs `EnterPlanMode` with `PRODUCT.md` in the Files table. Small edit, gated
   process.
7. **Hook tests, `skill-router.py` first.** Three of nine tested. Its own session.

**⚠ THE DECISION WIP LIMIT IS LAPSED, AND THE COUNT WILL LOOK LIKE A VIOLATION.** Three active
decision tickets — `#113`, `#70`, `#117`. The limit read *"while any v0.1 rule is unbuilt"* and
`UNQ001` completed the catalogue on 2026-08-19. **This is not a breach.** `docs/agents/triage-labels.md`
records the lapse, written to be struck rather than deleted if a v0.2 catalogue revives the
condition. *Record always* is unaffected.

**NEXT-MODEL: frontier tier**, and this is a change from S030's recommendation. `#117` Route 2 and
`#51` are both ambiguity-heavy — one is a prior-art sweep whose framing decides what gets built, the
other is a port widening with a pre-registered oracle that must not be corrected after the run.
`#111` and `#96` remain fast-tier execution against settled briefs and can be straddled with each
other, nothing else.

**NEXT-REPO/CWD:** the `workspace_lint` repository root. ⚠ **Absolute-`cd` every verification
command** — shell cwd drifted into `slice/` twice this session and produced one falsely clean grep.
Carry a positive control so an empty result proves the search ran.

### WHAT ONLY THE OPERATOR CAN DO

⭐ **SHARING ONE REAL HUB WITH THE INTEGRATION IS STILL THE HIGHEST-VALUE ACTION AVAILABLE, AND IT IS
STILL ONE CLICK** — but its value is now **gated on `#51`**, which is new. A wider grant over a
database-heavy workspace produces a report that cannot see most of it, and that is not a result worth
showing anyone. **Land `#51` first, then share, then measure.**

**Merging PR #116.** `gh pr merge` is denied to the agent.

**`#102`'s fixture backlog, seven items**, all in the Notion UI. Two gate `#51` — one `link_to_page`
block pointing at `wl-dataset`, and a permanent database reference whose addition moves
`fixture-oracle.ts`'s `references.applicable` and ⛔ **must be re-pre-registered before the run, never
corrected after it.** One gates `#95`; one resets proof question Q1; one unlocks Q8 and the Q3 re-run.

**`#29` still needs contact with one person who is not the operator** — but **scheduled after `#117`
produces a denominator**, not before. That reordering is the session's main output and it came from
the operator, not from the analysis.

**`#118` needs a plan-gated `PRODUCT.md` edit.** The agent cannot start it without `EnterPlanMode`
naming that file in the Files table.

**Promotion review** of the quarantined skills — see the standing block.

**NO SELF-ASSESS LINE, BY OPERATOR RULING 2026-08-17.** The ritual line records `verdict=n/a`.
