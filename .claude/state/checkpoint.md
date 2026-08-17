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
- **The host set is unbounded and no allow-list can ever be complete.** Notion documents custom
  domains for Sites — *"Workspace owners on paid plans can connect their existing custom domains"* —
  so a page can be served from a domain Notion does not own. This is why the `unrecognised` residue
  path is the primary detection mechanism and the host list is only an optimisation. Do not let a
  future session re-frame the host list as the soundness mechanism.

**Environment.** `~/.claude/settings.json` is gitignored, so the `guard-downstream-framing-gh.py`
PreToolUse wiring exists only on this machine. **CC Safety Net failed closed once on a long
`gh issue create` heredoc** — write the body to the scratchpad and pass `--body-file`. The
`guard-git-pull-rebase.py` hook **blocks bare `git pull`**; use `git fetch origin <branch>` then
`git merge --ff-only origin/<branch>`.

**Operator rulings** are in `store.json` → `operator_rulings` and in project memory.

---

## S011 — 2026-08-17 — The sweep changed the design, and the test refuted the spec

**PHASE:** Pre-build on `main` — still no `src/`, no `package.json`, no toolchain. The toolchain and
all working code remain on the throwaway branch `proto/ref001-observed`.

**TESTS:** `node prototypes/PROTOTYPE-check.js` — 26 assertions, all passing.
**`npx tsx prototypes/CHECK-link-recognition.ts` — 34 assertions, all passing, offline, no network
and no `.env`.** `npx tsc --noEmit` clean under `strict`. All on the throwaway branch.

**MERGED:** PR #37 — `docs/spec/REF001-link-recognition.md` and the `docs/agents/domain.md`
registration, commits `844778e` and `c9eb5d0`. **The operator merged it during this session**, so the
spec is on `main` and `origin/main` is at `39d6d2a`. **#34 is CLOSED.**
**PUSHED:** `e064a89` on `proto/ref001-observed`. **FILED:** #35, #36. **Nothing in flight.**

### #34's fork, answered on four lines rather than by assertion

**An unrecognised link is ADR-0005's `undecidable`. No new axis value, and no ADR.**

1. **The project's own deletion test.** `undecidable`'s stated remedy — *"neither sharing more nor
   re-running helps. Fix the rule, the configuration, or the data"* — is **verbatim** the remedy for
   an unrecognised link. A value whose remedy duplicates another's is not a value.
2. **#34's counter-argument relocated, not dismissed.** *"The tool does not know whether there is a
   resource at all"* is a real epistemic difference that changes **no operator action**, so it is a
   manifest **cause** — which ADR-0005 decision 5 constraint 2 already demands.
3. **XCCDF 1.1.4** splits `notchecked` (*"did not cause any evaluation"*) from `unknown` (*"could not
   tell what happened"*). REF001 **ran** on the page. That is `unknown`.
4. **LinkChecker's shipping handler** gives an unhandled URL `"ignored"` or `"URL is unrecognized"`,
   and **neither outcome is silence.**

### The §0.5 sweep changed the design before the instrument was built

**The host set is unbounded, and that is documented rather than suspected.** Notion Help,
*Manage your Notion Sites*: *"Workspace owners on paid plans can connect their existing custom
domains with Notion Sites."* A page can be served from a domain **Notion does not own**, so no
allow-list is completable. **#34's own first Revisit-if fired before the spec was written**, and its
named consequence is adopted: the residue path is primary, the host list is an optimisation, and
classification keys on a Notion-shaped ID so the residue is **non-empty by construction**.

The sweep's decisive hit was the **soundiness manifesto** (Livshits et al., CACM 58(2), February
2015, DOI `10.1145/2644805`), which names this exact false-green eleven years early — unsoundness
that *"lurks in the shadows"* lets a reader *"erroneously conclude that the analysis is sound"* — and
prescribes **disclosure of the unhandled set, not a new verdict value.**

A second documented find: page and database mentions are *"returned with just the ID"* when the
connection cannot see the target. **That reference survives the permission failure it reports**, needs
no host parsing, and is now the first detection route.

### The spec was refuted by the test written to satisfy it

Spec §5 claimed an unrecognised reference could exit `0` once coverage clears the declared threshold.
**It cannot.** A coverage gap carries a `SYS001` finding and ADR-0008 decision 2 fires exit `1` on any
finding that is new and unsuppressed. **Exit `0` requires the gap to be BASELINED** — an explicit
operator decision, not a threshold tweak. Fixed in `c9eb5d0`. The ADR outranks the spec.

**S010 said to watch for "the artifacts are correct and the instruments built to serve them are not."
This session is the third instance and the first where the instrument caught the artifact.** Test 1b
is why: it removes `app.notion.com` from the host list and asserts the discovery goes red, so the
control **demonstrates its own sensitivity** instead of asserting it. That requires the host list to
be a parameter rather than a module constant, which is the entire design cost.

### BLOCKERS

**None.**

### EXACT NEXT STEPS

1. **#36 first, then #35.** #36 is the narrower one and #35's answer partly depends on it: whether a
   denominator rule binds every rule is easier to settle once the *unit* of the denominator is
   settled. Both were surfaced by writing the spec, and neither was decided in it on purpose.
2. **#14 — correct `PRODUCT.md`.** Unchanged from S010 and still ahead of any outbound send.
3. **Observe the remaining link hosts**, and test whether Route A alone covers every internal
   reference — #34's second Revisit-if, still open and testable against the fixture.
4. **Write `docs/research/INDEX.md`** — ten files, no index. **Parked for a fourth session running.**
5. **#29, #27, #25, #24, #18, #19, #10, #8, #7** — unchanged.

**NEXT-MODEL:** **frontier**. #36 is a canonical-glossary change whose scope question — `UNQ001`'s
denominator is neither a resource nor an edge — is the same collapse-two-axes-into-one shape this
project has now got wrong three times. **#18 and #19 remain mechanical and belong to their own
fast-tier session; do not straddle.**

**NEXT-REPO/CWD:** `C:\Users\mlpgr\2026_Projects\workspace_lint` — single repo; state, plan and
resume ritual all at the root. The prototype toolchain is on `proto/ref001-observed`, not `main`.

**SELF-ASSESS:** VERDICT: 2 (operator-graded, solicited blind) · ATTRIB: none — task-inherent.
