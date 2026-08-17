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
- **Only `app.notion.com` is evidenced as an internal-link host.** `notion.so`, `www.notion.so`,
  `notion.com` and `*.notion.site` are in the prototype's regex and are **not** in the proof record.
  Do not let them into a spec on this session's authority. See **#34**.

**Environment.** `~/.claude/settings.json` is gitignored, so the `guard-downstream-framing-gh.py`
PreToolUse wiring exists only on this machine. **CC Safety Net failed closed once on a long
`gh issue create` heredoc** — write the body to the scratchpad and pass `--body-file`. The
`guard-git-pull-rebase.py` hook **blocks bare `git pull`**; use `git fetch origin <branch>` then
`git merge --ff-only origin/<branch>`.

**Operator rulings** are in `store.json` → `operator_rulings` and in project memory.

---

## S010 — 2026-08-17 — The first code ran, and it was false-green three ways

**PHASE:** Pre-build on `main` — still no `src/`, no `package.json`, no toolchain. **A toolchain now
exists on the throwaway branch `proto/ref001-observed` only.**

**TESTS:** `node prototypes/PROTOTYPE-check.js` — **26** assertions, all passing, no dependencies.
`npx tsc --noEmit` clean under `strict` in `prototypes/`. Both live on the throwaway branch.

**MERGED:** ADR-0010 (`7e318ba`, PR #32 → `e41261a`), the domain.md count fix (`8352b73`, same PR),
and the live proof record (`ba25b7a`, PR #33 → `612875a`). `origin/main` is at **`612875a`**.
**FILED:** #34. **CLOSED:** #31. **Nothing in flight.**

### ADR-0010 — one issue, four defects, one root cause

#31 reported that *"identical when any one key matches"* is not transitive. Drafting found three more,
all inside decision 6:

1. It **contradicts ADR-0003 decision 1** without citing it. ADR-0003 chose SARIF's `correlationGuid`
   path; decision 6 used the `fingerprints` path ADR-0003 had examined and rejected.
2. It makes ADR-0008's **own `updated` state unreachable**. Both keys carry the normalized observed
   value, which is evidence, so a value change breaks both at once — in exactly the case whose remedy
   column reads *"the debt you accepted is not the debt you have."*
3. Its key table **covers two of four shipping rules**. Both keys are property-composed; `REF001`
   names no property.

**Root cause:** decision 6 loaded whole identity into the fingerprint map. Return the map to the
discriminator role ADR-0003 assigned it and all four close together.

**The §0.5 sweep ran before the instrument was specified and paid.** The problem is deterministic
record linkage; the technique is **hierarchical matchkeys**. Wray 2024 (ONS, IJPDS 9(5), DOI
`10.23889/ijpds.v9i5.2656`) supplied what #31's fix lacked — *"records can only be linked once"*,
*"removing linked records from the matching pool"*. **#31 had independently reconstructed the field's
standard answer and was missing one-to-one.** Adopted **pass-ordered** matching over per-finding
probing, because a pass is a set join and has no visiting order to depend on at all.

### The live run — the pass is not the result

Eight read-only calls, `Notion-Version: 2026-03-11`. `REF001` fires on a **discovered** link with
`certainty: confirmed`, `target_state: unreachable`; disposition `qualified`, coverage 3/4, **exit 3**.
Exit 3 outranking exit 1 is **ADR-0008 decision 2's priority order observed firing for the first time**.

**Three false-green defects in my own implementation**, each the class the product exists to catch:

1. **The host allow-list was `/notion\.(so|site)/` and the fixture's own link is served from
   `app.notion.com`.** Zero links discovered, no error, clean `unqualified` verdict over a root with a
   dead link. It appeared to pass only because a synthetic control injected the known-bad ID — **a
   control that can substitute for the mechanism under test is not a control.** Filed as **#34**.
2. **The applicable set was built from `child_page` only**, so a `child_database` was invisible and
   coverage read **2/2 — 100%** over a root with three children. The denominator shrank to fit the
   blind spot.
3. **The exit byte read the findings list while the gap lived only in the manifest** — returned `1`
   where the contract requires `3`. Two copies of the coverage data drift, toward the flattering answer.

Plus one already forbidden: the manifest was keyed on **titles** and double-counted `wl-revoke-parent`,
against `CONTEXT.md`'s settled default *"Identity is the stable ID."*

**`Observed<T>` itself never misbehaved on any case tested.** Every defect was in the code around it.
That is the actual answer to the prototype's question.

### The finding neither prototype's red test covers

Reconnect the link target, leave `wl-revoke-child` revoked, and the scan reports **`unqualified`,
exit 0, verdict rendered** — a clean run over a workspace containing a page it cannot see. Not a model
defect; proof §4 rendered honestly. **The red test passes today only because the `REF001` link finding
happens to be firing**, not because anything detected the revocation. Recorded on **#14**.

### BLOCKERS

**None.** `.env` stays unreadable to tools and that no longer blocks anything — a process reads it.

### EXACT NEXT STEPS

1. **#34 — specify `REF001` link recognition.** It carries a real fork that must not be settled by
   assertion: **is an unrecognised *link* the same thing as an unjudgeable *resource*?** If yes it is a
   rule spec; if no, ADR-0005's evidence-sufficiency axis is missing a value and it needs an ADR first.
   Same shape as the `certainty`/`target state` split ADR-0005 got right by keeping two axes apart.
2. **#14 — correct `PRODUCT.md`.** It now has a runnable demonstration attached, and the demand test
   still targets the auditor branch that S009 argued is refuted. Rewrite before sending anything.
3. **Observe the remaining link hosts** before any spec claims them.
4. **Write `docs/research/INDEX.md`** — ten files, no index. Parked for a third session running; the
   reading order in `domain.md` names the directory but not which file answers your question.
5. **#29, #25, #24, #18, #19, #10, #8, #7** — unchanged. #25 now has a **fourth shape** on it.

**NEXT-MODEL:** **frontier**. #34's fork is an ADR-or-not judgement on an axis the project has already
got wrong once by collapsing two axes into one enum. **#18 and #19 remain mechanical and belong to
their own fast-tier session; do not straddle.**

**NEXT-REPO/CWD:** `C:\Users\mlpgr\2026_Projects\workspace_lint` — single repo; state, plan and resume
ritual all at the root. The prototype toolchain is on branch `proto/ref001-observed`, not on `main`.

**SELF-ASSESS:** VERDICT: 2 (operator-graded, solicited blind) · ATTRIB: none — task-inherent.

**Recorded against the grade, not as a qualification of it.** The session shipped a defect into an
accepted ADR's supersession chain once already (#31, S009) and this session's own first implementation
was false-green three separate ways. Both were caught in-session — the first by the mandatory grep, the
others by running the code instead of reading it. **The pattern across S009 and S010 is that the
artifacts are correct and the instruments built to serve them are not**, which is the thing to watch
next session rather than a reason to re-open this grade.
