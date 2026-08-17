# Checkpoint — workspace_lint

Bands S001–S007 are archived verbatim at `.claude/state/checkpoint-archive.md`. This file holds
the standing constraints and the current band only.

## Standing constraints — always current, not session-scoped

**This block is the authority, and it is complete on its own.** Archived bands each end with a
"Standing cautions carried forward" paragraph pointing at the band before it. Those paragraphs are
dated records and stay standing in the archive, but the chain they form does not survive rotation —
read this block instead. Nothing here depends on a band still being present.

**Fixture and credentials.**

- `.env` holds a **live read-only Notion token**. Gitignored. **It cannot be read by any tool** —
  CC Safety Net blocks it on `secret.basename.env`, and the block forbids workarounds. Every claim
  in this file about `.env` contents is therefore **structurally unverifiable**. Do not spend a
  session-start step attempting it; report the claims as unverified and move on.
- **`REAL_ROOT_ID` was reported set by the operator on 2026-08-17. Unconfirmed, per the above.**
  If good it unblocks Q8, the Q3 re-run against organic timestamps, and **#7**. Two gates sit in
  front of any run: the integration must **also be connected to that page** in Notion's share
  settings, which is a human step — a missing share returns 404 and reads as a coverage failure
  rather than a setup gap — and Q8's output is a manifest of **real** page titles and IDs, so the
  redaction question is decided before results land in the repo.
- **The fixture is mutable and it is an instrument.** Editing rows, blocks or titles by hand
  changes what the proof measures. **`wl-revoke-child` is currently disconnected** — restoring it
  resets Q1.

**Proof questions.** Full status in `store.json` → `unknowns_assigned_to_proof`.

- **Q3's stability result is provisional**, confounded by bulk-created timestamps. Do not promote
  it without a re-run against organic content.
- **Q4 and Q5 are out of reach of any hand-built fixture.** Q4 needs a workspace over 11,200
  objects; Q5 is a local Semgrep CLI test with nothing to do with Notion.

**Documents.**

- **ADRs are never edited in place.** A refuted claim standing in ADR-0002 or ADR-0003 is correct,
  not a bug. **Living docs — `PRODUCT.md`, `CONTEXT.md` — are corrected directly.** That carve-out
  is the whole rule; without it the constraint reads as "never correct anything."
- **ADR-0005's evidential floor is uneven and the ADR says so.** Decisions 1–3 rest on
  adversarially re-verified primary sources. Decision 5's funnel rests on CONSORT 13a/13b, PRISMA
  16b and STROBE 13 — **fetched but never re-verified**, adopted on three-way convergence.
  Re-verify the clause numbers before quoting them anywhere published.
- **A refuted claim is never in one place.** Twice now it has been three surfaces. Grep before
  asserting a correction is scoped.

**Research method.**

- **Scouts self-nominate their softest claims.** Use those to prioritise verification, **never to
  bound it.** One scout's file came back stronger than it flagged; the genuine errors were
  elsewhere.
- **Citation hazards** — full list in `store.json` → `citation_hazards`. ISO 19011:2018 and ISA
  705 were read from unauthorised copies: cite by clause or paragraph, publish no URL. Six further
  standards were reached only through consultancy paraphrase and are not citable at clause level.
- **`docs/inputs/` holds inputs, none canonical**, with differing evidentiary weight. Do not treat
  them as parity.

**Numbers now sitting in a locked ADR, both unverified.**

- **The `10,000` cap constant is vendor-documented and unobserved.** No real capped response has
  confirmed it, and vendor documentation has already been wrong once here
  (`notion-api-practice.md` §5.2). When it reaches code it needs a named constant, a comment
  pointing at ADR-0006, and a test that fails loudly on disagreement.
- **`request_status: {"type": "complete"}` has never been seen on either branch.** No decision
  depends on it. No code path may block on its arrival.

**ADR-0006 decision 2's search row is superseded by ADR-0007. Cite ADR-0007's table, not
ADR-0006's.** `POST /v1/search` **does** carry `request_status`, and it has **no documented cap** —
so ADR-0006 decision 4's exclusion of search from the cap-proximity trip survives on its stated
reason. **A signal is not a cap.** ADR-0006's other two rows stand, and its block-children finding
is now *stronger*: PR #711 threads the field through seven response types and omits
`ListBlockChildrenResponse`, so that claim rests on an enumerated omission rather than on
documentation silence. **ADR-0007's search row is documented, not observed** — no capped search has
been seen, and neither branch of `request_status` has been seen on any endpoint. That is the
evidence class that produced ADR-0002 decision 4.

**The corrected row changes nothing the product does, and v0.1 may not call search at all.** Five
design surfaces are silent on whether a scan uses `POST /v1/search`; that silence is **not** a
finding, and ADR-0007 refuses to convert it into one. Open as **#24**.

**Environment.** `~/.claude/settings.json` is gitignored, so the `guard-downstream-framing-gh.py`
PreToolUse wiring exists only on this machine. The hook file itself is committed.

**Operator rulings** are in `store.json` → `operator_rulings` and in project memory. They are not
restated here.

---

## S008 — 2026-08-17 — The correction held, and two of its three findings were not in the issue

**PHASE:** Pre-build. No source code. Build gate closed. Board is decisions and chores only.

**TESTS:** None. No toolchain. Not a gap.

**ALL WORK MERGED.** PR #23 merged as `280524e` (`5e22750`) during the close — the operator merged
it while this band was being written, so ADR-0007 is on `main` and nothing is in flight. Issues
**#24** and **#25** filed as its follow-ups. **#10 is unblocked**: `main` no longer carries the
known-wrong table, so ratification is free to proceed.

### #21 shipped as ADR-0007, and the issue's own framing was one of the things audited

#21 was well drafted — it named the wrong row, both primary sources, and four things the ADR had to
do. **Both sources were re-fetched anyway**, because the error being corrected was caused by trusting
a page nobody had opened, and inheriting the correction's evidence repeats the method while fixing
the instance. Both confirmed. One fact came back that #21 had not mentioned: **the search reference
documents no cap**, so ADR-0006 decision 4's exclusion of search from the cap-proximity trip survives
on exactly its stated reason. *A signal is not a cap.*

**The error was inert, and that is not a defence.** ADR-0006 decision 1 makes the test positive, so
the scan looks for `request_status` on every response page and never consults the table to decide
whether to look. A wrong **None** in a descriptive column gated nothing, and if search never emits
the field the behaviour is identical to the old table. Containment came from a decision made for
another reason. **A negative in a table that *did* gate behaviour would have shipped.**

**The coverage benefit does not reach v0.1, which contradicts #21.** The issue says the correction
makes the ~11,200 wall reportable. True of the endpoint, not of the product: five design surfaces —
ADR-0002, `CONTEXT.md`, `PRODUCT.md`, #18's hydration map, and the proof run — are **silent** on
whether a scan calls search. ADR-0007 states the silence and **refuses to assert the negative**,
because misreading silence as absence is the error it exists to correct. Filed as **#24**.

### The grep would have returned two files, not one

`notion-api-practice.md` §4.5 and `competitive-landscape.md` §4 both carried the correct fact, both
landed in `12106c5` at 18:51, and ADR-0006 is `f8917fa` at 21:42 — ancestry confirmed with
`git merge-base --is-ancestor`. So the standing method rule was not a coin flip against thin
evidence. **Second ADR to contradict a file already in the tree.** Enforcement filed as **#25** with
a recommendation to *wait for a third instance*: two occurrences justify writing the rule down, and a
permanent tax on every ADR write wants more than n=2.

**ADR-0006's central finding came out stronger.** Block-children carrying no signal rested on
documentation silence — the same inference that failed on the search row — and now rests on PR #711
naming seven response types and omitting `ListBlockChildrenResponse`.

### Two small ones

`docs/agents/domain.md` used "ADR-0007 (event-sourced orders)" as a placeholder example, which now
collides with a real ADR; renumbered to `ADR-00NN`. And **the PreToolUse hook caught the PR body
shipping without a Revisit-if** — the ADR had a full one, the PR did not, and a reviewer reads the
PR first. Appended rather than argued with.

### BLOCKERS

**None technical.** `.env` is unreadable by any tool, so its claims are permanently unverifiable —
this is a stated hole in the session-start verification pass, not a blocker. **Gate 1 is unchanged
and is not on the board**; it advances when the operator sends, and the Reddit diagnosis is the first
send.

### EXACT NEXT STEPS

1. **#20 — baseline state machine + exit-code contract.** The top agent item and the one with real
   design content: exit status composes report disposition *and* coverage ratio, two independent
   inputs.
2. **#24** — whether v0.1 calls search. A scope decision with a product surface, not a lookup.
3. **#18, #19** — mechanical, and they belong to their own fast-tier session.
4. **#10** — now unblocked by ADR-0007 landing. Still `needs-triage` on its own un-runnable
   checklist item.
5. **#8, #14, #25** — operator decisions. Not agent work.

**NEXT-MODEL:** frontier for **#20** — a state machine composing two independent exit inputs is
judgement, and **#24** is a scope call with an onboarding surface. **#18** and **#19** are mechanical
and get their own fast-tier session. **Do not straddle**; shrink the next session's scope rather than
cross the tier boundary inside it.

**NEXT-REPO/CWD:** `C:\Users\mlpgr\2026_Projects\workspace_lint` — single repo; state, plan and
resume ritual all at the root.

**SELF-ASSESS:** VERDICT: 2 (ADR-0007 landed with two findings the issue had not specified, and the correction's own evidence was re-fetched rather than inherited) · ATTRIB: skill
