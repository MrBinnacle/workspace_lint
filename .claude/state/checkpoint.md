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
- **Gate 3, build at n=1, is live. #42 and #43 have landed.** Tracked as #42 built (ticket still
  **OPEN** — the code shipped and nobody closed it) → **#43 DONE and CLOSED** → #44 → #45 → #46.
  #10's "no source on `main`" constraint is discharged; building on a branch from
  `proto/ref001-observed` is now a preference.
- **Acceptance criterion 1 is CLOSED**, on #43's live run, against an oracle committed before that
  run existed. Ten comparisons, `ORACLE MATCHED`. It is not closed retroactively for #42.
- **Source code exists, on `build/t2-sys001`, in `slice/`.** Commits `0ac7c2d`, `9dcb069`,
  `0d3c723`, `95c60c5`.
  A **`private: true`** package named `slice-v0.1`, deliberately **not** `src/` and not on `main`:
  `src/` asserts *this is the product tree*, and that claim is due the same day **#8** lands.
  **#8, the npm name, is now the only thing between this branch and `main`** — `CONTEXT.md` requires
  it "before the first `package.json`", and a private unpublishable package does not consume it.
  Suite: `cd slice && npm run check` — **two files, 53 + 92 assertions, offline, no network, no
  token**. Live: `npx tsx cli.ts scan --config ../wl.config.json --oracle`, after
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

