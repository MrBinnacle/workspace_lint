# Checkpoint — workspace_lint

**Every earlier band** is archived verbatim at `.claude/state/checkpoint-archive.md`. This file holds
the standing constraints and the current band only. **The incident narrative behind the constraints
below lives in `.claude/reference/constraint-evidence.md`** — the rule and its check stay here, the
receipt lives there, and that file is not loaded into a session unless you open it.

⚠ **This pointer carries NO band range and must never be given one.** **ADR-0010 forbids a
fingerprint containing anything volatile, and a count of bands in the one part of this file meant to
be stable is exactly that.** It was wrong for six sessions before it was deleted. The archive names
its own bands.

## Standing constraints — always current, not session-scoped

⛔ **BEFORE YOU COMMIT A CLOSE: ROTATE. This file holds ONE band.** Move the previous band verbatim to
`.claude/state/checkpoint-archive.md` in the same commit that writes the new one, and **hoist anything
load-bearing out of it first** — the standing block below has claimed to be self-sufficient twice and
was not.

**This instruction lives here, not in the close skill, because the close skill has no rotation step
and the rotation was pure model habit for nine sessions before it died at S016 and went unnoticed for
six more (#73).** It is still model-pull, now from the always-loaded surface rather than from an
unretrieved skill — which is weaker than a control and stronger than nothing. **#73 is CLOSED and no
mechanical fix landed**, on the doctrine that **a state file is never evidence about the thing it
describes.** That doctrine also settles what the archive is for — **G-010**, *"Keep a pointer or use
Trash. Never keep a mirror… Accurate history alone is not a keep verdict; version control, source
history, and Trash already preserve rollback."* — which `checkpoint-archive.md` violates, because
every close writes its band twice and the close commit body IS the band. **This line is now the only
thing standing between the file and the same curve.**

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
- **`REAL_ROOT_ID` holds a REAL root as of 2026-08-22:** `Headquarters`
  (`28a1351d-6af4-818d-a555-de4585036900`, workspace-parent), shared by the operator in the Notion
  UI and verified by a live retrieve before the `.env` line was updated in place. **It pointed at a
  404-by-design page for three days and read as *ready and waiting* because nobody dereferenced it.**
  **Q8 and the Q3 re-run are now one declared-root away** — and sprint session B's run 1 is unblocked.
- **THE GRANT IS NO LONGER FIXTURE-ONLY.** Re-measured 2026-08-22 with the same one-call
  `POST /v1/search` diagnostic: the fixture pages PLUS `Headquarters` and real content beneath it
  (100+ results, `has_more: true`), superseding the 2026-08-19 fixture-only finding.
  ⚠ *Search as a DIAGNOSTIC does not violate ADR-0014* — that decision governs the product's command
  paths, and search's weakness (unattested, eventually consistent) bears on denominators, not on
  discovery. It is not a licence to put search in the scan.
- **The PAT is ruled out and no longer needs testing.** A PAT's API capability is a single bundle —
  *"Read, create, update, and search content"* — with no read-only variant, so it violates **Principle 7**
  at the credential layer. **Do not run the PAT fixture test in #27's DoD.**
- **The fixture is mutable and it is an instrument.** **`wl-revoke-child` is still disconnected**,
  re-confirmed live 2026-08-17 — restoring it resets Q1. `wl-outside-grant` is the working REF001
  control: 404 on retrieve, link readable.
- **The operator granted standing administrator scope over his workspace (S036).** The discipline
  on every material edit: breadcrumb + rollback, read Notion's enhanced-markdown spec before any
  write (a database mention is `mention-database`, not `mention-page`; a full-content replace
  trashes child pages), verify by read-back — and nothing workspace-identifying enters this public
  repo (role labels and counts only). Hoisted from the S036 band; project memory carries the same
  rule but is machine-local.

**Proof questions.** Full status in `store.json` → `unknowns_assigned_to_proof`.

- **Q3's stability result is provisional**, confounded by bulk-created timestamps, and the live run did
  **not** touch it — no repeated identical query was made.
- **Q4 and Q5 are out of reach of any hand-built fixture.**

**Documents.**

⚠ **The supersession entries below are a REVERSE index and therefore a mirror.** Every ADR states its
own forward relation in a structured `- **Supersedes:**` field, so **this list is re-derivable and
must be re-derived rather than trusted when it matters**:
`grep -rn '^- \*\*Supersedes:\*\*' docs/adr/`. It is kept because the forward field answers *what did
ADR-0011 kill* while a reader usually holds a superseded ADR and asks *is this still good*, which the
forward field cannot answer without reading all of them. **A mirror has rotted here four times; this
one has a one-command check and no gate. #103 owns making prose like this annotatable.**

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
- ⛔ **`CONTEXT.md`'s settled-default and glossary-distinction counts are RE-DERIVED BY COUNTING THE
  LIST, NEVER RE-QUOTED FROM HERE.** **The numbers are deleted rather than corrected**, which is
  G-010: a hand-kept mirror of a figure `CONTEXT.md` states in its own prose two lines above the list
  it counts. Both had gone stale, here and in `CONTEXT.md` itself. The check is
  `grep -c '^- \*\*' ` over each section, or reading the list.
- **ADR-0006 decision 2's search row is superseded by ADR-0007.** Cite ADR-0007's table.
- **ADR-0005's evidential floor is uneven and the ADR says so.** Decision 5's funnel rests on CONSORT,
  PRISMA and STROBE clauses **fetched but never re-verified**.
- **A refuted claim is never in one place.** Five times now, and the last was **five surfaces at
  once**. **Grep the STATE, not your phrasing** — the sweep that grepped the words it was replacing
  found two of five. **Grep branch names, paths, and the negation of the claim you are about to
  write.**

**Design positions not yet taken.** Each governs a decision that is still open.

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

**Config surface.** The code alone does not state why any of these are as they are.

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
- ⚠ **NUL bytes have twice appeared inside a template literal where spaces were written** — see
  "Byte-level and rendering hazards" below for the rule and the check. **In a repository whose method
  is grepping, a file that reads as binary is a silent loss of the primary instrument.**

**Research method.**

- **A claim comment inside a fenced code block is DOCUMENTATION, not an assertion.** `CHECK-claims.ts`
  blanks fences before parsing and has a test for it. `README.md` carries a real `equals=13` example
  inside a ```` ```markdown ```` fence and it **must not** be updated when the count changes —
  updating it would assert that it is live. Verified 2026-08-18 when the count went 13 → 19 and
  README's example correctly stayed silent.
- **`docs/research/` has an INDEX.md as of 2026-08-17 (#54). Start there, not at the directory.**
  One line each: the question it answers and what it refutes. The count is claim-gated below and is
  deliberately not written out here.
  <!-- claim: count glob="docs/research/*.md" exclude="INDEX.md" equals=21 -->
  **Four** entries carry notes
  rather than rows — `notion-live-probe.md` holds **observations** but is documented-tier and that is
  **not** a misfiling (it ran through an OAuth connector and ADR-0004 says it "does not clear the REST
  path"); and `unseen-population-sizing.md` vs `frame-completeness-prior-art.md` answer **different**
  questions — *how big is the gap* versus *may the frame be called sufficient* — which nearly produced
  a duplicate sweep.
- **WebSearch is exhausted at 200/200 and has been since before the ADR-0013 sweep.** `WebFetch` and
  the Scholar Gateway MCP still work. Scholar Gateway's corpus is **Wiley**.
- ⚠ **"Not checked" is a verdict, not a first response — work smarter, not harder.** A sweep once
  published **eight** not-checked items and **six were one `WebFetch` away**.
  `http://export.arxiv.org/api/query?search_query=...` is a public no-key API reaching the
  ACM/IEEE-adjacent preprint literature; regulators publish their own guides free; and every tool
  documents itself. **Before writing "not checked", name the route not taken.** When nothing works,
  record the status codes — **a 403 and a 402 are evidence, "unavailable" is not.**
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
- **`notion.com` is the one internal-link host still NOT CHECKED** — no locator at any tier, and
  its siblings entering the table on 2026-08-22 (#111) is not one (ADR-0001 decision 4). The rest
  of the host question is no longer this section's business: the table's membership and evidence
  tiers are **gate-verified** (`CHECK-ref001.ts` asserts each entry and its tier by host name) and
  its authority is `docs/spec/REF001-link-recognition.md` §2.1 — re-derive the count from the gate,
  never re-quote it here (#103 owns making such prose annotatable). **#34 is CLOSED.** The residue
  path remains the primary mechanism; the list is an optimisation, per the standing constraint below.
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
`~/.claude/plans/`, modified within 24h, **names that file**.** **`CLAUDE.md` is in the guarded set**
and is guarded **machine-wide by basename, including `~/.claude/CLAUDE.md`**; `/init` writing a new
`CLAUDE.md` is blocked until a plan names it.
⚠ **The matcher does not distinguish a plan's Files table from its background prose.** A file
mentioned in passing is authorised. **Treat the Files table as the authorisation token; a quiet hook
is not approval** — the slack was filed as **#61**.
**There is deliberately no environment-variable escape** — an env var is a blanket unlock the
model can set for itself, which is the failure the guard exists to stop. The escape is
`EnterPlanMode` → name the file in the plan → `ExitPlanMode`. **Not guarded, deliberately:**
`.claude/state/*` (the close ritual writes it after the plan is spent) and `docs/research/` +
`docs/proof/` (evidence, appended not decided — and gating them would tax the activity that outranks
an ADR on a question of fact). Suite: `~/.claude/hooks/test_guard_canonical_doc_edit.py`, 32
assertions **including a mutation check**, plus a 6-case end-to-end run against the wired hook. **It
exists because the §5 plan gate was model-pull and failed on two consecutive sessions.** The
`guard-git-pull-rebase.py` hook **blocks bare `git pull`**; use `git fetch origin <branch>` then
`git merge --ff-only origin/<branch>`. **`guard-gh-issue-triage-label.py` blocks `gh issue create`
without a triage-role label**, reading the roles from `docs/agents/triage-labels.md`; escape is
`TRIAGE_LABEL_ACK=1`. Its wiring is machine-local for the same reason the others' is.

**Two standing risks in the enforcement layer, deliberately NOT filed** — neither blocks a rule.

- ⛔ **The enforcement layer exists on ONE machine and has no backup.** `~/.claude/settings.json` is
  gitignored, so every hook wiring in this project — the canonical-doc guard, the triage-label guard,
  the pull-rebase guard, the skill router — is reproducible nowhere. **§1 designates the hook layer as
  the place a discipline goes when it must survive the loop; that layer does not currently survive a
  disk.** This is the largest structural risk in the tooling and the cheapest to fix.
- ⚠ **`skill-router.py` has no test suite.** Three of TWELVE hooks are tested.
  **`ls ~/.claude/hooks/*.py` is the check, and that count has itself read wrong for two sessions.**
  The router is the untested one that matters most, because §14 marks
  `downstream-instruction-framing` MANDATORY and the router is the whole of that enforcement. **It
  has already been caught firing on some phrasings of a trigger and not others**, and **a rule that
  fires only when the operator's phrasing happens to contain a different word is model-pull wearing a
  hook's clothes** — a test suite is what would have caught it, not a reading.

**The queue, the denominator, and what blocks `#51`.**

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
  ⚠ **That count was carried as NINE for a band and was invented.** **A count is the fastest-rotting
  claim there is, because it is quoted and never visited, and each re-quotation reads as
  corroboration.** `grep -o "findingFor([^)]*)!" slice/CHECK-sys001.ts` is the check. **Its companion
  grep raised a FALSE alarm by omitting optional chaining** — search for `link_to_page` and read the
  line rather than trusting the pattern.
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

**Skills, subagents and the machine.**

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
- ⛔ **THE POCOCK SKILL LAYER IS FIXED IN THE PLUGIN CACHE, AND A PLUGIN UPDATE WIPES THE FIX.** 20 of
  35 installed `mattpocock-skills` carried `disable-model-invocation: true` — **the Skill tool REFUSES
  those and they never enter the session listing** — and `skill-rules.json` held 15 router rules of
  which **none named a Pocock skill**. Both halves are in as of 2026-08-22: the flag is off 9 workflow
  skills (18 files, both cached plugin versions) and the router is at 21 rules, six naming a Pocock
  skill. ⚠ **Re-check after ANY `mattpocock-skills` update** that those nine still resolve and are
  model-invocable. **A router rule naming a skill the Skill tool refuses is a SILENT NO-OP and looks
  exactly like success** — worse than the original state, because the nudge fires and the call fails.
  ⛔ **Writing to `~/.claude/hooks/` is denied to the agent**, so the router half is operator-only.
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

**Negation, the vendor corpus, and what the recogniser never gated.**

- ⭐ **A NEGATIVE CLAIM ABOUT NOTION IS NOW GATE-ENFORCED.** *"The API cannot do X"*, derived from
  *"we looked and found no way"*, is **negation as failure** under a closed-world assumption, not a
  negation — it reads *"it is not currently believed that"* (DOI `10.1155/2013/632319`).
  `slice/negation.ts` scans `docs/adr/`, `docs/spec/`, `CONTEXT.md` and `PRODUCT.md` and **fails on an
  untyped vendor-negative sentence**. Three markers: a **`vendor` claim comment** carrying `url`,
  `fetched` and `quote` (strong negation), an **`nmf` comment** (declared negation as failure), or a
  `negation-baseline.json` entry. ⚠ **The literal syntax is deliberately NOT written out here** — this
  file is in `CHECK-claims.ts`'s `ANNOTATED` list, so a spelled-out example is parsed as a live claim
  and reddens the gate. It did, on 2026-08-19, inside the block describing the checker. The syntax
  lives in `slice/negation.ts`'s header, which is not scanned. ⛔ **Absence is never evidence** — not a missing method on our port, not a page that fails to
  mention a feature, not an index without an entry. **A source silent about X never contradicts "X is
  impossible."**
- ⭐ **WHY FOUR OF FOUR RAN ONE WAY, WITH NO APPEAL TO BIAS.** A positive claim is **monotonic** under
  vendor change; a negation-as-failure claim is **nonmonotonic by construction**, and the vendor
  shipping *anything at all* is the new information. **Negative claims are the only class Notion's
  forward development can falsify by addition.** So only negative claims need an expiry — which is
  what makes the changelog watch affordable.
- ⛔ **`#51` IS NOT A CEILING AND THE ENDPOINT NAMED IN ITS RE-SCOPE WAS THE WRONG ONE.**
  `GET /v1/data_sources/{id}` returns *"the structure and columns"* — the schema, not the rows. The
  ten-of-twenty gap is emitted at `slice/scan.ts:455`, in the traversal, and needs **rows**:
  `POST /v1/data_sources/{id}/query`, which states *"This endpoint requires a connection to have read
  content capabilities"* — a capability the read-only integration **holds**. ⚠ It is a POST and a
  fifth endpoint: **ASK FIRST, not granted.** The `10,000` cap has a locator on that same page and on
  the 2026-07-08 changelog entry, stated **per query**.
- ⛔ **THE CORPUS IS A CASSETTE UNLESS IT IS RE-FETCHED.** `docs/vendor/` holds fetched vendor
  evidence and is **deliberately not** in `CHECK-claims.ts`'s `ANNOTATED` list — dated records must
  not be corrected to match the present. **A stored quote passes forever unless re-fetched and
  diffed.** `docs/vendor/WATCH.md` is the reconciliation record, in 14 CFR 91.417(a)(2)'s four fields:
  identity, version, **disposition as the route taken rather than a boolean**, and an expiry that is
  **conditional on recurrence**.
- ⛔ **`references.ts` HAS ZERO IMPORTS, so "someone must share a workspace" gated nothing.** The
  recogniser was never coupled to the API, the token or the grant. That belief cost four sessions.
  **`docs/proof/results-owner-workspace-mcp.md`** holds the live MCP run; the product was **not
  involved** in finding the dead reference, which is a **Null arm that passed**, and `#121` holds the
  Full-vs-Null design. By `skill-harness`'s own published standard the verdict is **UNMEASURED**.
- **"352+ top-level pages" was a pagination cursor read as a count. It is 57.** An enumeration is
  complete because it **terminated**, never because of a number in its cursor.
- **The support graph exists at document granularity.** `slice/support.ts` reads each ADR's
  `- **Evidence:**` line as a support list. A dangling edge fails; four ADRs with none are declared
  BASE in `support-baseline.json` because an ADR is never edited in place. **OUT is not false** — a
  derived belief whose support is withdrawn is unjustified, not wrong, and culprit selection is
  under-determined (DOI `10.1609/aimag.v11i4.866`), so the suite reports the set and stops.

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

Gate 1 (demand, #40), Gate 2 (the 72-hour proof, #10) and Gate 3 (build at n=1 — #42 through #46, the
tracer-bullet sequence) are all CLOSED, as are acceptance criteria 1, 4 and 5. Dates, grounds and the
controls that closed them: `.claude/reference/constraint-evidence.md` → "The gates, as they closed".
Three things from them still bind:

- **Gate 1 chose an entry point and did not establish a price** — no willingness-to-pay figure exists
  for any framing.
- **#10's checks are build-acceptance criteria, not pre-build gates**, and its "no source on `main`"
  constraint is discharged.
- **SOURCE CODE IS ON `main`, in `slice/`, since PR #56 merged 2026-08-17 at 23:39Z** (merge commit
  `b138063`). This supersedes every earlier band's "not on `main`, nothing pushed" line **in
  `checkpoint-archive.md`**; those stay standing as dated records. **PR #57 was closed unmerged, and
  merging it would have restored a second exit-byte implementation ADR-0012 decision 1 deleted.**
  A **`private: true`** package named `slice-v0.1`, deliberately **not** `src/`, because `src/`
  asserts *this is the product tree* and that claim is due the same day **#8** lands. **#8 no longer
  blocks anything from `main`**, and **the operative trigger is `private: true` being removed or a
  tree being renamed `src/`.**
  Suite: `cd slice && npm run check` — **ONE command, and it typechecks first**: `npm run typecheck
  && ` then every registered suite, offline, no network, no token. **The FILE COUNT is claim-gated
  below; the assertion total is not written here at all.**
  ⛔ **THE PER-TERM SUM WAS DELETED ON 2026-08-19 AND MUST NOT BE RESTORED.** It was wrong three
  times. It is a hand-kept mirror of a number the gate computes on every run and the claim gate
  cannot check, which is precisely **G-010** — *keep a pointer, never a mirror*. **Re-derive it,
  never re-quote it:**
  `for f in slice/CHECK-*.ts; do npx tsx $f | grep -cE '^(PASS|FAIL)'; done`
  ⚠ **That loop's exclusions are NOT the gate's** — it counts `CHECK-harness.ts` and `CHECK-fakes.ts`,
  helpers that assert nothing, so they contribute zero and **the total is right by accident.**
  <!-- claim: count glob="slice/CHECK-*.ts" exclude="CHECK-harness.ts,CHECK-fakes.ts" equals=16 -->
  **#60 CLOSED** — the gate typechecks, the chain is `&&`, and a type error stops it before any
  assertion runs. **`tsconfig.json` is a GLOB (`*.ts`), not a hand-kept list.**
  `CHECK-suite-registration.ts` is the control for both halves: **TEST 3 covers WHICH files the
  typecheck reads, TEST 4 covers WHETHER anything runs it**, and **TEST 4 asserts the whole chain
  because asserting invocation alone leaves the control substitutable by `"typecheck": "echo ok"`.**
  Live: `npx tsx cli.ts scan --config ../wl.config.json --oracle`,
  after `npx tsx make-fixture-config.ts [ENV_KEY]` writes the gitignored config from `.env` —
  **the key argument is how the live exit-byte table was produced.**
- **`prototypes/verdict.ts` NO LONGER EXISTS** (ADR-0012 decision 1). There is **one** executable
  implementation of the exit byte and it is `slice/verdict.ts`. `prototypes/live-ref001.ts` still
  exists and is still the proven `.env`-reading probe, but it **renders no verdict and no exit
  byte** — it exits `0` to mean *the probe completed*, never *the workspace conforms*.
- **#14 is CLOSED**, and three checkpoints carried it as the blocker anyway.

**What still holds about the proof:** the fixture is **narrower than #10 specified** — one data
source rather than three, no archived target, no seeded `UNQ001`, `SCH001`, `DEP001` or `CAN001`.
Any recorded build result must state which criteria the fixture could not exercise.

**Three disciplines this cost.** Cite `PRODUCT.md` by **heading** — "Gates, in order", "Kill
criteria" — never by line number. **Deref a NEXT-STEPS blocker against the artifact before adopting
it**; `git log -- <file>` is usually enough. And **read an issue's COMMENTS, not only its body** —
`gh api repos/OWNER/REPO/issues/N/comments` — because a merged spec shipped two defects #10's triage
comment had already corrected. **The artifact was opened and the discussion attached to it was not**,
which is one failure shape, and it fired twice in one session.

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
- ~~**Exit `2` is reached live by pervasiveness condition (a) only.**~~ **SUPERSEDED 2026-08-22
  (S036): condition (b) was reached live** — not by a mid-stream 429/502, which still cannot be
  forced, but by a path no fixture modelled: the per-resource **block-tree budget of 40 requests**
  exhausted on an ordinary long reference page, producing an UNBOUNDED gap and a disclaimed
  disposition (`docs/proof/results-real-roots-rest.md` §4.1). The budget has no open owner —
  the report's reason string cites CLOSED #7 — and **#136** now holds that question.

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

**Auditing a document, and reading a tracker.**

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
  ⭐ **GitHub's parser closed four issues — #7, #10, #70 and #73** — reading `<keyword> #<number>`
  out of narrative prose in a merged state-file commit body. ⛔ **`actor` CANNOT TELL YOU WHICH IT
  WAS**, because every actor here is `MrBinnacle`: the operator's account, the identity `gh` writes
  as, and the merger. **The tell is the lag: compare `closedAt` against the merge times in the same
  minute.** Full doctrine and the pre-merge grep are in `docs/agents/issue-tracker.md` → "A commit
  body can close an issue by accident".
- **A subagent's quotation is a claim about a file, and is checked by opening the file.**
- ⚠ **A label read taken immediately after a label write can be stale.** GitHub's label index lags;
  a post-write count that looks like a failure should be re-read before it is recorded as one.

**The state role answers "whose move is it?"** Ruled and applied 2026-08-19; `needs-triage` means
only *not yet evaluated*. The vocabulary, its branch triggers and how `deferred` combines with it
are in `docs/agents/triage-labels.md`. ⛔ **It was surfaced as the operator's values decision three
times and was never one** — §0.6's test was never run on it, and a label named `needs-triage` on an
evaluated issue is simply false. The defect was an under-specified document, not an undecided call.

**Byte-level and rendering hazards.**

- ⛔ **THE WRITE TOOL CAN EMIT A NUL BYTE.** Twice now — `config.ts` and `slice/unq001.ts`, one day
  apart, both inside a template literal where a space was written — **so this is not a property of
  `sed`, heredocs or python round-trips.** A clean typecheck, twelve green suites and a mutation run
  all stayed silent; the tells are `grep` reporting **"Binary file … matches"** and `file <path>`
  reporting `data`. **Check every file you WROTE, not only the ones you rewrote, before committing.**
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

**Merging, fixtures and the quarantine.**

- ⛔ **THE OPERATOR MERGES EVERY PR. `gh pr merge` IS DENIED TO THE AGENT** by the auto-mode
  classifier. Both of S027's PRs and S028's were merged by the operator. This is a standing
  constraint, not a task — never plan a step that depends on the agent merging, and never write a
  band claiming a PR's state from the MERGED badge. **Verify with `git merge-base --is-ancestor
  <sha> origin/main`.** The operator has merged mid-close twice — PR #38 during S026 and PR #94
  during S027 — so **re-read external state immediately before committing a close.**
  And S036 added the sharper form: **a push that succeeds after the PR merged lands on a closed
  PR** — six pushes were dead letters behind a MERGED badge; re-verify the PR state, never the
  push exit code.
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

**How a result may be described.**

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

**Verification that reports success — this project's oldest failure shape.**

- ⛔ **A SWEEP THAT STOPS AT THE FIRST HIT PRODUCES A CONFIDENT FALSE CORRECTION.** **This is "a
  refuted claim is never in one place" running in reverse**, and it is worse than the forward
  version: a missed surface is a silent gap, while **a first-hit sweep produces a correction that
  reads as thorough**. **Count the hits before writing the verdict.**
- ⛔ **AN ASSERTION THAT CANNOT FAIL PASSES AS LOUDLY AS A REAL ONE. Three instances here, one
  family.** `x.includes('')` is TRUE for every `x`, so blanking the constant left `CHECK-report.ts`
  green over a bare label; `rendered.includes(BLANKED)` the same way; and a disjunct
  `|| /link:/.test(term)` was a tautology because the findings section prints `link:` four lines up.
  **A disjunction whose second term is a tautology asserts nothing about the first.** **Guard the
  subject's emptiness first, then assert a literal that does not read the constant.** Same family as
  the `reportSection` → `''` hazard `requiredSection` exists for.
- ⛔ **VERIFY A MUTATION ACTUALLY SUBSTITUTED BEFORE SCORING THE RUN**, and **score it on the exit
  code** — a crashed suite prints no `FAIL`. A mis-escaped search string once matched nothing and the
  gate stayed at exit 0. **An unapplied mutation is indistinguishable from dead code, and both look
  like a green gate.** Print the substitution count, or grep for the mutated text, before believing
  the exit byte. **This extends the standing rule that a green mutation names dead code: it may
  instead name a mutation that never happened.**
- ⛔ **A MUTATION THAT FAILS IN THE WRONG FILE IS A FINDING ABOUT THE CONTROL, NOT A PASS.** Wiring a
  measurement into the exit byte's inputs turned the gate red through `CHECK-sys001`, **not** through
  `CHECK-measurements`, because that isolation test compared the real derivation against a
  deliberately extreme one and **both arms HAD measurements** — so it could only ever detect a channel
  keyed on measurement CONTENT and was blind to one keyed on mere PRESENCE. ⭐ **Generalise it: an
  isolation control needs an arm where the thing under test is ABSENT, not only one where it
  differs.** **Check which file a mutation reddens, never only that the gate went red.**

**Measurements, and what `#143`/`#145` can actually compute.**

- ⛔ **`#101` IS FROZEN AND ADR-0017 DID NOT PRE-DECIDE IT.** The `undeclared-invariant` tier is a
  tier **of a rule** and therefore has a rule-level channel to the exit byte; a Measurement owns no
  rule ID and has none. ADR-0017 decision 4 states that contrast deliberately so a later session
  cannot read the Measurements decision as having settled #101 by implication. It has not.
- ⛔ **THE MEASUREMENT BOUNDARY IS NOW CANON — CITE ADR-0017, NEVER THIS FILE AND NEVER THE #70
  THREAD.** The eight operational rules, the eight worked examples, the reconstructibility gate test
  and the no-channel-at-any-level decision all live there as of PR #149. The state file's job here is
  a pointer; restating any of it is the mirror this file has been burned by four times.
- ⛔ **`#143` AND `#145` WILL SHIP BOUNDARY LINES, NOT COUNTS, AND THAT IS THE SPEC'S OWN FALLBACK.**
  `NotionPort` has three methods and none retrieves a database; `scan.ts` marks every
  `child_database` a drop-out. So per-database relation/rollup/formula counts and people-type
  empty-value counts have **no input available** and render "not computed" with the cause. The
  consequence is load-bearing and is the operator's call, not the agent's: **run 2 would then read a
  surface where two of four measurements are boundary lines**, which prices `#51`'s fifth-endpoint
  grant in terms of what the kill-criterion test can actually test. Do not request an endpoint;
  surface the price.
- ⭐ **`#143`'s VIEW-COUNT VENDOR CHECK IS ALREADY DISCHARGED IN THIS REPO — do not re-fetch and do
  not answer it from memory.** `docs/vendor/list-views.md`, fetched 2026-08-19: `GET /v1/views`
  returns view metadata for a specified database and the read-only capability suffices. **It is a
  NEW ENDPOINT**, so it is outside spec #139's scope (*"No new endpoint enters the scan for a
  measurement"*) and outside the current grant. The claim is POSITIVE and therefore monotonic under
  vendor change, so it needs no expiry — unlike a negative one.
- **`#145`'s owner signal selects properties by TYPE `people`, never by NAME.** Matching a property
  called "Owner" infers meaning from a label, which Principle 4 forbids. The property's own name
  prints as data beside the count.

⭐ **THE n=1 PROBLEM IS DISTRIBUTION, NOT ACCESS.** The repository has read n=1 as an evidence problem
to be solved by someone granting access. It is the other way round: **nobody grants access to a tool
with nothing to show** — the operator's own reframing, which refuses the request `#29` has been
making for four sessions. **Do not schedule a buyer conversation, a segment declaration or a pricing
question ahead of a measured rate.** `#117` owns the upstream half and names the three routes in cost
order.

**Placement, tooling, and the two things this file must not become.** Hoisted from the S039 band and
the S040 session before either was archived.

- ⛔ **AGENT CONFIGURATION IS NOT PART OF THE PRODUCT AND DOES NOT GO IN THIS TREE.** The product is
  `slice/`. A `UserPromptSubmit` hook was built into `.claude/` in S040, argued for in a commit
  message, and removed before merge. **The guarded set — `CLAUDE.md`, `CONTEXT.md`, `PRODUCT.md`,
  `docs/adr/**`, `docs/spec/**` — does NOT include `.claude/hooks/` or `.claude/settings.json`**, so
  a hook committed there is an always-firing instruction channel through no plan gate and no claim
  check. `CLAUDE.md` now carries an `absent` claim on that directory and it is verified to fire.
  ⚠ **The guard hole is real and unclosed, and only the operator can close it** — hook wiring is
  write-denied to the agent. The correct home for an agent-behaviour nudge is the user or plugin
  layer, and that restriction is a feature rather than an obstacle to route around.
- ⛔ **CHECK WHAT IS INSTALLED BEFORE BUILDING AN INSTRUMENT, AND FIRE CONTEXT7 BEFORE ASSERTING A
  LIBRARY FACT.** `docs/agents/tooling.md` holds the rule, the re-derivation command and the
  relevance table; `CLAUDE.md` points at it. **The inventory is re-derived, never re-quoted** —
  plugin skills nest under a version directory, so a shallow find reports nothing and that is not an
  absence. `trailofbits/mutation-testing` targets TypeScript and sat unopened through a whole sprint
  of hand-run mutations. `mewt` v4.0.0 exists and is **not installed**.
- ⭐ **RESUME FROM THE TICKET, NOT FROM THIS FILE.** `/implement` per ticket, `/clear` between, and no
  close ritual between tickets — only at the end of the unit. Adopted S039 and used successfully in
  S040 for three tickets in one branch. *Revisit if:* an implementation session is still opening by
  reading 700 lines of standing block.

---

## S042 — 2026-08-23 — the counter surface read as noise, and the flagship counter turned out to be broken rather than bounded

**PHASE:** VERDICT SPRINT — **run 2 is ADJUDICATED. The branch is SURVIVES-NARROW.** PR #159 merged
(operator, mid-session). Issue #158 filed and then widened. Nothing in the sprint now waits on a read.

**TESTS:** Gate green on `main` at session start and again before the close — 16 suites, exit 0,
typecheck first. **No `slice/` change this session**; the instrument ran as merged and every finding
below is about it, not from changing it.

**Model:** run on **Opus 5** by explicit operator override of the S041 close's `NEXT-MODEL: Fable 5`
line. He asked for the Fable requirement to be proven empirically; it could not be. See the ruling
below — it is the durable output of that exchange.

### What the read found

Four isolated SME seats — product manager, data analyst, UX/content design, support/CS — each given
the read protocol verbatim, a closed bin enum and a fixed output block. **Order was counterbalanced,
two seats A→E and two E→A**, so an order effect would be visible rather than baked in. It did not
fire. All four returned `status: nominal`.

**Twenty independent bin decisions returned ZERO SIGNAL.** Four roots unanimous NOISE; ROOT-A
CANT-TELL from three of four seats, reached by three different routes. Density joined
NOISE-BETWEEN-READER-AND-NUMBERS three of four, the fourth MIXED and splitting the axis rather than
dissenting.

The mechanism, and it is sharper than "the counters are boring": **on four of five reports the
numbers could not have come out any other way.** ROOT-D/E resolved zero references of any kind, so
every inbound row is arithmetically forced to 0 — and is still printed sorted and totalled, in the
furniture of a distribution. ROOT-B's single row can only be 0 or 1. ROOT-C reached no data source.
A figure that cannot vary with the state of the workspace is not a measurement of the workspace.

**P7 REFUTED on its first clause.** Second clause held — exactly one CANT-TELL — so the registered
"defect rate dominates the signal" failure did **not** fire: there is no signal to dominate. Run 2
closes **five hold, two refuted**, both refutations on the registered embarrassing branch, both at
full strength.

### ⛔ THE FLAGSHIP COUNTER IS BROKEN, NOT BOUNDED — the session's most consequential finding

`slice/measurement.ts:240` asserts, unqualified, that a child page enumerated from the root's block
listing has no retrieve *"so no response carrying its `last_edited_time` exists"*, and `:302` renders
that as the `over` line. **It is false.** `GET /v1/blocks/{block_id}/children` returns block objects,
a full block object carries `last_edited_time`, a `child_page` is a block object — **and the scan
already makes that call.** The field arrives on every run and is discarded because `listChildren`
declares `results: unknown[]` (`slice/notion-port.ts:61`).

**The fix is precedented in the same file for the sibling method.** `notion-port.ts:81-87` widened
`retrievePage` for exactly this reason (#58, #142), recording the governance ruling with it:
*"Keeping more of one response is not a new endpoint, so … #51's ASK-FIRST precedent for adding an
endpoint does not apply here."* **No new endpoint, no new grant, no ask-first — a type widening.**

Two limits ride with it and neither rescues the sentence. **Whether a block's `last_edited_time` is
the same instant as its page's is UNLOCATABLE** — four vendor pages fetched, all silent; *"Pages are
also blocks"* is strong indirect support and is not a guarantee, and an edit-and-diff test would
settle it. **Capturing the field and labelling it the page's edit age are two decisions and only the
first is licensed today** — shipping the second uncited would be a measurement-validity defect, which
is worse than the boundary line it replaces. And the partial-vs-full block case is undocumented,
which bounds the fix.

### The scheduling consequence, which is the useful half

All three `computed: false` causes were re-verified against freshly fetched vendor pages and **all
three are accurate** — none misattributes a governance gap to the vendor or the reverse. With the
flagship defect above, **THREE of the uncomputed counters are UNBUILT rather than UNGRANTED**:
relation/rollup/formula counts need two already-authorized GETs; the view count needs a call whose
read-content capability is already held; the flagship needs a type widening. **Only people-type
empty values needs the ask-first POST.** The counter work is far cheaper than the boundary lines made
it look, and #158 carries that scope with the widened part bannered at the top of the body.

### Two things deliberately NOT done, and the reasons are the point

- **A seat's headline claim was REJECTED at the hub.** The analyst reported the last-edited `over`
  line "false as written", citing 36/11/76 retrieves against a one-row table. Verified directly: the
  line is scoped `(unit: resources)` and reference targets sit in the **references** unit — the seat
  pooled them, which is the hazard this file already documents. **The most compelling seat finding
  was the one most likely to be a scope-conflation artifact**, because a cross-population comparison
  produces a dramatic-looking contradiction. Verify the dramatic one first.
- **A changelog locator was left WRONG on purpose.** A fresh fetch dates the 10,000-cap entry
  `2026-04-20`, not the `2026-07-08` asserted in **two** surfaces — this file (the `#51` block) and
  `docs/vendor/WATCH.md`. Not corrected: the verifying fetch covered one changelog page and left the
  archive unpaged, and "not located in one fetch" is not "does not exist". Correcting on a single
  negative would be the negation-as-failure this repo gates against. **Both surfaces are named here
  so a future sweep does not find one and stop.**

### ⭐ OPERATOR RULING — the model-routing rule is UNMEASURED, and he ruled on it

Asked to prove the Fable-5 reservation empirically, the honest answer was that nothing measures it.
`gate_events.jsonl` has no model field; `retrospection.jsonl` mentions a model once, describing the
routing change itself; **44 `NEXT-MODEL:` declarations across the 41 archived bands are all
prospective, and ZERO record an outcome attributable to tier.** The escalation rule has never been
recorded catching anything. Published vendor material orders the tiers but publishes no head-to-head
eval.
⚠ **That count shipped in draft as "31", read off a `head -30`-truncated grep, and was caught inside
this same close by dereferencing it — the fastest-rotting claim there is, failing exactly as this
file predicts.** The load-bearing half survived correction unchanged: tier-attributable outcomes = 0.
Re-derive, never re-quote: `grep -cE '^\*\*NEXT-MODEL|^NEXT-MODEL' .claude/state/checkpoint-archive.md`.

**He overrode to Opus 5 and the session shipped its deliverable.** That is one data point, not a
refutation. **The routing rule fails this repository's own audit standard** — no mechanism can
falsify it and its central term is defined so a tier assignment can never be wrong in a checkable
way. *Revisit if:* a `model` field is added to the close record plus a retrospection line naming any
later-reversed decision; ~10 sessions then gives a denominator. **Until then say UNMEASURED, not
"required".**

### EXACT NEXT STEPS

**⚠ Corrected in place after the close shipped — the test named in step 1 is now BUILT. See the
addendum at the foot of this band for what changed and when.**

0. **RUN THE PROBE FIRST — one command, no arguments, from the repo root:**
   `cd prototypes && npx tsx block-vs-page-timestamp.ts`
   It is built, typechecked and **unrun**, on **PR #161** (open at close — merge it first).
   Pre-registration: `docs/proof/prereg-block-vs-page-timestamp.md`, committed before the probe so
   the predictions cannot be aimed after the data. It **scores P1–P5 and prints the verdict itself**
   off a decision table fixed in advance — do not re-derive one.
   ⛔ **THIS PROBE WRITES** — the first in the repo that does. It creates its own scratch child page
   under the fixture root, edits it twice, archives it, verifies by read-back; no existing page,
   block or property is touched. Rollback is in a `finally` and prints the id by hand if it fails.
   The fixture root's own `last_edited_time` moves and cannot be rolled back — disclosed, accepted,
   and no other proof reads it. Record the run in `docs/proof/results-block-vs-page-timestamp.md`,
   role labels only.
   ⭐ **If P1 comes back REFUTED, STOP** — that refutes the S042 instrument-defect finding itself and
   reopens both `dispositions-run2.md` and #158's banner. Proceeding past a refuted P1 is the one
   way this sequence goes badly wrong.
1. **Then take #158.** Three counters are unbuilt-not-ungranted and the flagship is the cheapest —
   widen `listChildren`'s declared return type and let the edit-age table render the reached set.
   **Read the banner at the top of #158's body before the body**; the scope was widened after filing.
   ⛔ **Capture the field; label it the page's edit age ONLY if step 0 licensed that** — and if it
   did, the licence is empirical on n=1 with the vendor silent, never a documented guarantee, and
   every downstream claim must say so and cite the prereg.
2. **Then the two authorized GETs** — `GET /v1/databases/{id}` (already authorized) →
   `GET /v1/data_sources/{id}` for the schema's `properties` map, and `GET /v1/views`. Neither needs
   an operator decision. ⛔ `GET /v1/databases/{id}` no longer returns a property schema on the API
   version in force; it returns a `data_sources` list. The shipped cause text already says so — do
   not "simplify" it to one call.
3. **Render a forced value as forced.** Where a row cannot be non-zero, say so instead of sorting and
   totalling it. Same family as the quadratic-coverage hazard already in this file: a zero is not an
   absence.
4. **Do not re-run the read.** It is adjudicated. Any later claim that the policy-free counters carry
   the entry point must cite SURVIVES-NARROW against itself, per the pre-registration.

**NEXT-MODEL: Opus 5 at `/effort xhigh`** — #158 is execution against a written scope with the
governance question already settled in-file, which is Opus-tier by the routing rule's own terms. The
one genuinely open decision it contains — whether a captured block timestamp may be *labelled* page
edit age — is a measurement-validity call; **if the empirical test comes back ambiguous, close early
and take that question to a Fable session rather than deciding it on the wrong tier.**

**NEXT-REPO/CWD:** the `workspace_lint` repository root.

### WHAT ONLY THE OPERATOR CAN DO

Merge the next PR. Volunteer the KILL sentence if he ever wants to — **nobody asks, and
SURVIVES-NARROW has not foreclosed it.** Close the `.claude/hooks/` + `.claude/settings.json` guard
hole.

**Skills: DONE this session, not pending.** He approved promotion in-session, so
`context7-serves-deprecated-api-pages` and `declined-computation-hides-a-discarded-field` are **live**
in `~/.claude/skills/` (both real directories, neither a symlink into the canonical skills repo),
each with a `gotchas.md`, and `llm-judge-calibration` is at **1.1.0** with Discipline 8 — the
categorical/isolated-seat variant where pairwise does not apply and order counterbalancing replaces
position swap. Quarantine is back to 22. ⚠ **`write-a-skill` is operator-only (`disable-model-invocation`)
and the Skill tool refuses it**, so §1.5 conventions were applied by hand; if he wants the
authored-by-the-skill treatment on any of the three, only he can fire it. Grant the ask-first
POST if people-type empty values are ever worth it. Install `mewt`.

**POST-CLOSE ADDENDUM (S042, after `ba2ebc7` shipped) — the edit-and-diff test that gates #158's
cheapest item is now BUILT and UNRUN, on PR #161.**

The close named that test as the thing standing between capture and labelling, and left it as work
for someone else. The operator asked for it staged to standard instead, saying he did not know how
to run it. So it was built the same session the close shipped: pre-registration first
(`docs/proof/prereg-block-vs-page-timestamp.md`, P1–P5 plus a five-row decision table fixed before
any data), then `prototypes/block-vs-page-timestamp.ts`, then one copy-pasteable command.

Design call worth carrying forward: **the probe creates its own subject rather than editing existing
fixture content.** Same measurement, no risk to content other proofs depend on. It is the first
writing probe here and it inherits `live-ref001`'s token discipline verbatim.

**Found while wiring it, and not yet fixed:** `prototypes/tsconfig.json` carries a **hand-kept
`include` list** — the same defect `slice/` fixed under #60 by globbing. The new file typechecked
clean only because it was not being checked at all; **exit 0 was vacuous until the file was added to
the list.** It is added and compiles, the list is still hand-kept, and the next probe will hit this
again. Low stakes — `prototypes/` is not the product tree — but it is the identical shape the gate
exists to catch, living one directory over from the gate.

~~The close's step 1 said the test was unbuilt and that "nobody has run it".~~ Half of that is now
wrong: it is built. **It is still unrun**, and the EXACT NEXT STEPS above were corrected in place —
per the amendment convention, forward-looking surfaces are fixed directly rather than left for the
next session to reconcile against an addendum it reads second.

No bin, no branch and no adjudication is touched. Run 2 stays adjudicated at SURVIVES-NARROW.
