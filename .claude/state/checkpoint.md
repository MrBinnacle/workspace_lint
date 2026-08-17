# Checkpoint — workspace_lint

Bands S001–S008 are archived verbatim at `.claude/state/checkpoint-archive.md`. This file holds
the standing constraints and the current band only.

## Standing constraints — always current, not session-scoped

**This block is the authority, and it is complete on its own.** Archived bands each end with a
"Standing cautions carried forward" paragraph pointing at the band before it. Those paragraphs are
dated records and stay standing in the archive, but the chain they form does not survive rotation —
read this block instead. Nothing here depends on a band still being present.

**Credentials and fixture.**

- `.env` holds a **live read-only Notion token**. Gitignored. **It cannot be read by any tool** —
  CC Safety Net blocks it on `secret.basename.env`, and the block forbids workarounds. Every claim
  in this file about `.env` contents is therefore **structurally unverifiable**. Do not spend a
  session-start step attempting it; report the claims as unverified and move on.
- **`REAL_ROOT_ID` was reported set by the operator on 2026-08-17. Unconfirmed, per the above.**
  If good it unblocks Q8, the Q3 re-run against organic timestamps, and **#7**. The integration must
  **also be connected to that page** in Notion's share settings — a human step, and a missing share
  returns 404 that reads as a coverage failure rather than a setup gap.
- **The PAT is ruled out and no longer needs testing.** ADR-0009 gated it on observation; the #27
  sweep closed it on documentation instead. A PAT offers exactly two capability options and the API
  one is a single bundle — *"Read, create, update, and search content"* — with no read-only variant,
  so it violates **Principle 7** at the credential layer regardless of which endpoints the code
  calls. **Do not run the PAT fixture test in #27's DoD.** It would measure reach for a credential
  the product cannot use.
- **The fixture is mutable and it is an instrument.** Editing rows, blocks or titles by hand
  changes what the proof measures. **`wl-revoke-child` is currently disconnected** — restoring it
  resets Q1. `wl-outside-grant` is the working REF001 control: 404 on retrieve, link readable.

**Proof questions.** Full status in `store.json` → `unknowns_assigned_to_proof`.

- **Q3's stability result is provisional**, confounded by bulk-created timestamps. Do not promote
  it without a re-run against organic content.
- **Q4 and Q5 are out of reach of any hand-built fixture.** Q4 needs a workspace over 11,200
  objects; Q5 is a local Semgrep CLI test with nothing to do with Notion.

**Documents.**

- **ADRs are never edited in place.** A refuted claim standing in ADR-0002, ADR-0003 or ADR-0008 is
  correct, not a bug. **Living docs — `PRODUCT.md`, `CONTEXT.md` — are corrected directly.** That
  carve-out is the whole rule; without it the constraint reads as "never correct anything."
- **ADR-0005's evidential floor is uneven and the ADR says so.** Decisions 1–3 rest on
  adversarially re-verified primary sources. Decision 5's funnel rests on CONSORT 13a/13b, PRISMA
  16b and STROBE 13 — **fetched but never re-verified**, adopted on three-way convergence.
- **A refuted claim is never in one place.** Three times now it has been three surfaces. Grep before
  asserting a correction is scoped.
- **ADR-0006 decision 2's search row is superseded by ADR-0007.** Cite ADR-0007's table.
  `POST /v1/search` **does** carry `request_status` and has **no documented cap**. A signal is not a
  cap. ADR-0006's block-children finding is *stronger* than when written: PR #711 threads the field
  through seven response types and omits `ListBlockChildrenResponse`.

**Research method.**

- **Citations are receipts.** Operator ruling, 2026-08-17: a claim carries a locator a third party
  can follow — URL plus fetch date, file plus section, commit SHA, clause number. *"Anything short
  of that — paraphrase without pointer, 'as we discussed,' 'Notion's docs say' — is commentary, not
  evidence."*
- **A negative about an endpoint requires that endpoint's own page** (ADR-0007 decision 4). **Now
  generalised: a claim about a model requires that model's own reference.** ADR-0009 asserted a
  capability-model fact without opening the capabilities page. Grep of `docs/research/` would not
  have caught it — the fact was not in the repository at all.
- **Scouts self-nominate their softest claims.** Use those to prioritise verification, never to
  bound it.
- **Citation hazards** — full list in `store.json`. ISO 19011:2018 and ISA 705 were read from
  unauthorised copies: cite by clause, publish no URL.
- **Research agents cannot reach Reddit.** `notion-user-pain.md`'s own next action — re-run with a
  Reddit-capable fetch path — is **permanently blocked**. The solo and small-team
  willingness-to-configure verdicts stay "NO EVIDENCE FOUND" and "WEAK", produced by a blocked
  crawler rather than by an absence in the world.

**Numbers in a locked ADR, both unverified.**

- **The `10,000` cap constant is vendor-documented and unobserved.** When it reaches code it needs a
  named constant, a comment pointing at ADR-0006, and a test that fails loudly on disagreement.
- **`request_status: {"type": "complete"}` has never been seen on either branch.** No code path may
  block on its arrival.

**Environment.** `~/.claude/settings.json` is gitignored, so the `guard-downstream-framing-gh.py`
PreToolUse wiring exists only on this machine. The hook file itself is committed. **CC Safety Net
failed closed once on 2026-08-17** — a long `gh issue create` heredoc returned *"command analysis
failed unexpectedly. This is not caused by your command."* The fix that worked: write the body to
the scratchpad, pass `--body-file`. Do not brute-force variants.

**Operator rulings** are in `store.json` → `operator_rulings` and in project memory.

---

## S009 — 2026-08-17 — Four phases, and the one that produced no commit produced the most

**PHASE:** Pre-build. No source code, no toolchain. Build gate closed.

**TESTS:** None. No toolchain. Not a gap — and it is now the problem, see the verdict.

**MERGED:** ADR-0008 (`33017b8`, PR #26 → `f6f8c5c`), ADR-0009 (`40062cd`, PR #28 → `6faf04c`), and the
Developer Platform sweep (`d8cebd7`, PR #30 → `d189f18`). `origin/main` is at **`d189f18`**.
**FILED:** #29, #31. **Nothing in flight.**

### The three shipped decisions, in one paragraph each

**ADR-0008** specifies the exit contract and the baseline state machine. Two of #20's premises broke
under drafting: `suppressed` is not a baseline state (SARIF separates it), and keying exit status on
the report disposition would have made the baseline permanently inert, because ADR-0005 decision 3's
`unqualified` carries a conformity clause. Two findings the issue did not contain: **`resolved` is a
coverage claim** — it requires the (rule, resource) pair to have reached `evaluated`, or the baseline
shrinks because access shrank, which is a bug ESLint ships today. And **the fingerprint kill
criterion is not cleared**: drafting asserted page-ID stability as an obvious property of UUIDs, and
ADR-0007's mandatory grep returned `notion-api-documented.md` **§3, "Object identity has no documented
guarantee"** (line 596), recording it as documented-silent with only a negative search result behind
it. That rule has now paid for itself once, which is the third data point **#25** was waiting on.
**Locator defect:** ADR-0008 line 175 and PR #26 cite this as "§596", which is the *line number*
written as a section number and would send a reader looking for a section that does not exist. ADR-0008
is merged and not edited; the superseding ADR for **#31** carries the correction.

**ADR-0009** defines `Operator` — used 35 times across the canonical docs with no definition, inside
other glossary entries. Split into **Operator / Executor / Consumer**; roles distinct, people may
coincide. Integration primary, PAT secondary-and-now-dead. The operator supplied the verdict and it
was adopted with **one substantive amendment**: the requirement that any membership change surface as
a coverage-boundary change is unimplementable, because no endpoint returns a user's accessible set.
Split into **detected** (principal change) versus **disclosed** (drift under a fixed principal), with
a falling coverage ratio explicitly barred as a detector.

**The #27 sweep** answered all six questions from primary sources and none by observation. **ADR-0002's
Revisit-if was checked and has NOT fired.** Workers can be read-only via an integration token but have
no exit byte, both output shapes reopen a stated boundary, and they have been billed since
**2026-08-11** on credits consumed per run and scaled by run duration — a meter that charges more the
more completely the scan reads.

### The findings that are not in any ADR

**1. ADR-0008 decision 6 is defective. Filed as #31.** *"Two entries are logically identical when any
one key matches"* is not transitive. Take the closure and unrelated findings merge; don't and matching
is order-dependent, violating **ADR-0004**. Fix: **priority-ordered probing** — a deterministic total
function, not a relation. Needs a superseding ADR. **The prototype will build identity on this, so fix
it first.**

**2. The false-green synthesis — the session's largest finding.** `notion-user-pain.md` §4: structural
rot is *"a chronic irritation, not an acute incident"* with no published damage account, while broken
integrations produce panic and quantified loss. Sundararajan names the mechanism verbatim: *"The
execution log still shows green. That's the part that makes it hard to catch."* Every high-intensity
item in this repository is **one defect class — a system reporting success over an unverified state**:
`has_more` lying at 10,000 rows, permission-filtered child lists, block-children with no truncation
signal, relations truncating at 25, formulas returning `unsupported`, `grep -q` exiting 0 after an
error, and the proof's own vanishing `child_page`. **The product is an anti-false-green instrument,
not a tidiness linter.** This dissolves the engineer-versus-auditor fork the session had forced an
hour earlier: both buyers have the same defect, on different surfaces.

**3. The session's own zero-config argument was wrong.** It claimed the rule catalogue is backwards on
a configured-versus-not axis. `notion-user-pain.md` §2 says the inversion is **loudness versus
testability** — the two loudest pains (P1 staleness, P9 clutter) are the two the tool cannot honestly
claim to solve, and willingness-to-configure is **strongest** exactly where the testable pains are
voiced. Ranking by *intensity* rather than volume inverts it again and dissolves §2's "central
tension" — the furious pains are the silent-failure pains, and those are the most testable.

**4. `PRODUCT.md`'s demand test targets a branch this session argued is refuted.** *"Five teams that
must prove a structural claim to a third party"* is the auditor. Both the demand test and its kill
criterion name that buyer. **Rewrite before sending anything.**

**5. That refutation is conditional and was overstated when made.** It rests on ADR-0005 decision 3's
claim that an unbounded gap *"cannot be sized"* — which is itself unexamined against the field that
sizes unobserved populations. Do not treat the auditor branch as settled-dead.

**6. Four unasked rigour questions**, recorded in memory as `bannister-goes-to-the-problem-domain`:
certain-vs-possible answers (incomplete-information databases), transaction isolation and phantoms
(**`UNQ001` is phantom-prone by construction and may return `conforms` over a workspace holding a
duplicate**), unseen-population estimation, and entity resolution.

**7. Architecture calls, made and not yet ADR'd.** The core type is provenance, not `Page`:
`Observed<T> = complete | partial+cause | unreachable`, with **no function `Observed<T> → T`** and
combinators that propagate partiality — so `unique` over a `partial` list *cannot* return true. One
adapter seam is the only code permitted to construct an `Observed`. **TypeScript**, because the
official SDK's types are the `request_status` source of truth and give drift detection at `tsc` time.

### BLOCKERS

**None technical.** `.env` stays unreadable. Gate 1 is unchanged and advances when the operator sends
— **but the send target is now wrong**, per finding 4.

### EXACT NEXT STEPS

1. **#31 — supersede ADR-0008 decision 6.** Twenty minutes, and the prototype depends on it.
2. **Prototype REF001 end to end** against the live fixture with `Observed<T>` in place. Red test
   already exists: the link to `wl-outside-grant` must produce `certainty: confirmed`,
   `target_state: unreachable`, and with `wl-revoke-child` disconnected the run must **not** emit an
   unqualified verdict. `/prototype`, not `/wayfinder` — the fog is not in the decisions, there are
   nine ADRs of decisions made with no runnable feedback.
3. **Re-read the eight rules as false-green detectors** rather than tidiness checks. P3's four named
   defect classes look uncovered by the current catalogue.
4. **Write `docs/research/INDEX.md`** — one line per file: the question it answers, its trust tier,
   what it refutes. Ten files with no index is the second half of the mechanism the post-close
   addendum describes; naming the directory is not the same as knowing which file to open.
5. **#29, #24, #25, #18, #19, #10, #8, #7** — unchanged. **#25 now has its third data point and a new
   shape**: ADR-0009's case was a *missing* file rather than a contradicted one, so grep alone cannot
   be the whole enforcement.

**NEXT-MODEL:** **frontier**. The next session writes a superseding ADR and then prototypes against a
live API with a novel provenance type — irreversible head plus ambiguity. **#18 and #19 remain
mechanical and belong to their own fast-tier session; do not straddle.**

**NEXT-REPO/CWD:** `C:\Users\mlpgr\2026_Projects\workspace_lint` — single repo; state, plan and
resume ritual all at the root.

**POST-CLOSE ADDENDUM (S009, after `65f6106` shipped) — the agent-facing reading list omitted the
evidence layer, and that is the mechanism behind every incident this band records.**

`docs/agents/domain.md` is what `CLAUDE.md` points every agent at. Its section *"Before exploring,
read these"* named `CONTEXT.md`, `CONTEXT-MAP.md` and `docs/adr/` — **the decision layer only**. It
never named `docs/research/` or `docs/proof/`. It was an unlocalised upstream template, which is also
why S008 had to renumber its `ADR-0007 (event-sourced orders)` placeholder after it collided with a
real ADR.

Rewritten specific to this repo. It now carries the read order with **evidence outranking assertion**,
the evidence-class-per-directory table (`proof` beats `research` beats `adr` on questions of fact),
the three method rules, and the citation standard including *cite by section heading, not line number*.
`CLAUDE.md`'s own two-line Domain-docs entry carried the same omission one level up and is corrected —
per the standing rule that a refuted claim is never in one place.

**A count was corrected while writing it.** The first draft said *"four ADRs have now contradicted or
talked past evidence already in this repo"* in two files. Checked against source: **#25 is the record
and says two**, ADR-0007 is the *corrector* rather than an offender, and ADR-0009's case is a
different shape — the fact was **not** in the repo, so grep returns nothing and silence reads as
agreement. The three incidents are now written as two shapes with the grep-blind one named, because
rule 1 only catches one of them.

**Not done, and deliberately parked:** `docs/research/INDEX.md` (ten files, no index — a reading list
that names a directory still does not say which file answers your question) and the #25 hook decision.
The forward reference is marked inline in `domain.md` rather than left to rot.

**SELF-ASSESS:** VERDICT: 2 (operator-graded, solicited blind) · ATTRIB: none — task-inherent
· **AMENDED** 2026-08-17, see addendum above and the caveats below. The verdict is **not** re-opened.

**Caveat attached to the grade, not a re-opening of it.** The session shipped a defect into `main`
(#31) and wrote a wrong locator into a merged ADR. Both were caught in-session, by the mandatory grep
and by the close's dereference pass respectively. The operator's own read is that the gap is rigour
rather than triage, and the largest finding of the session came from the operator's product intuition,
not from the agent.
