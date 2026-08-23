# Constraint evidence — the incidents behind the standing block

`.claude/state/checkpoint.md`'s standing block states the rules and their checks. This file holds
the **incident narrative** that earned each one: the dates, the counterfactuals, the blow-by-blow of
how the claim went wrong the first time.

**Why the split.** The standing block is loaded into every session; this file is not. A rule has to
fire from the always-loaded surface, so the rule and its mechanical check stay there. The receipt
stays here, one grep away, for the session that wants to know whether the rule is still earning its
place.

⚠ **This file is NOT in `CHECK-claims.ts`'s `ANNOTATED` list**, so a `<!-- claim: -->` comment
written here is never evaluated. Do not move a claim comment into this file — it stops being gated
and nothing says so. Same reason `docs/vendor/` is excluded: these are dated records.

⚠ **Nothing here is authoritative.** Where this file and the standing block disagree, the standing
block wins and this file is the stale copy. Where this file and an ADR disagree, the ADR wins.

---

## The band range in the header

The pointer sentence at the top of `checkpoint.md` carried a band RANGE until 2026-08-18 and the
range was wrong for six sessions — it said "S001–S009" while the file held seven bands, then
"S001–S020" the moment one more rotated. ADR-0010 forbids a fingerprint containing anything
volatile, and a count of bands in the one part of that file meant to be stable is exactly that. The
range was deleted rather than corrected, because the archive names its own bands.

## Rotation, and why the instruction lives in the state file

The rotation instruction lives in `checkpoint.md` rather than in the close skill because **the close
skill has no rotation step**. Rotation was pure model habit for nine sessions, died at S016, and went
unnoticed for six more (#73).

`#73` is CLOSED and **no mechanical fix landed**. It closed on the operator's own June Notion
doctrine, which had already written the general rule: *a state file is never evidence about the thing
it describes.*

That doctrine also settles what the archive is for — **G-010**: *"Keep a pointer or use Trash. Never
keep a mirror… Accurate history alone is not a keep verdict; version control, source history, and
Trash already preserve rollback."* `checkpoint-archive.md` is a mirror of history `git log` already
holds, and every close writes its band twice because the close commit body IS the band.

The standing block has claimed to be self-sufficient twice and was not, most recently on 2026-08-18
when five claims had to be rescued from bands about to be cut.

## `REAL_ROOT_ID`, and the value nobody dereferenced

From 2026-08-19 to 2026-08-22 `REAL_ROOT_ID` pointed at `wl-outside-grant` — the never-connected
contrast page, which 404s by design — and the note read as *ready and waiting* for many sessions
because **nobody dereferenced the value**. It was corrected on 2026-08-22 to `Headquarters`, shared
by the operator in the Notion UI and verified by a live retrieve before the `.env` line was updated
in place.

## The grant, before the operator's share

The 2026-08-19 measurement found "two workspace-level pages plus the 150 synthetic rows, nothing
else" — the grant was fixture-only. Superseded 2026-08-22 by the operator's share, re-measured with
the same one-call `POST /v1/search` diagnostic: the fixture pages plus `Headquarters` and real
content beneath it, 100+ results, `has_more: true`.

## `CONTEXT.md`'s settled-default and glossary-distinction counts

The standing block carried "SEVEN settled defaults and SEVEN glossary distinctions" as a hand-kept
mirror. The distinctions count went to **eight** on 2026-08-22 when ADR-0017 added *a measurement is
not a finding*, and the state file was the only surface that went stale saying so.

Both counts had already been stale-by-one once before, **in `CONTEXT.md`'s own prose**, which is how
they came to be mirrored into the state file in the first place. The numbers were deleted rather than
corrected — G-010 again: this was a hand-kept mirror of a figure `CONTEXT.md` states in its own prose
two lines above the list it counts.

## "A refuted claim is never in one place" — the S019 sweep

The claim *"the project is pre-build"* stood in five surfaces at once after PR #56: `CLAUDE.md`,
`CONTEXT.md`, `README.md`, `docs/agents/domain.md` and `checkpoint.md`.

The S019 sweep found **two** by grepping the words it was replacing (`pre-build`, `no source code`)
and **missed three** that asserted the same state differently — `README.md` named the branch, and
`domain.md` said "there is no `src/` yet". A `/code-review` pass found all three.

That is the fifth occasion the shape has stood in three or more surfaces.

## "Not checked" is a verdict — the S019 sweep's eight

S019 published a sweep with **eight** items marked not-checked because `WebSearch` was exhausted.
**Six were one `WebFetch` away.** `stuklex.fi` turned a second-hand YVL quote into a first-hand one
with a better requirement in it.

## Why `CLAUDE.md` joined the canonical-doc guard

`guard-canonical-doc-edit.py` was added 2026-08-17 covering the documents an ADR supersedes, and left
outside the set the one file every session is bootstrapped from. PR #56 left `CLAUDE.md` asserting
"Pre-build: no source code exists yet" to every new session, so it was added the same day (S019).

The guard exists because the §5 plan gate was model-pull and **failed on two consecutive sessions**.

`PRODUCT.md` would have passed on the Files-table slack in S019 and was filed as **#61** instead.

## The skill router's predicate gap

On 2026-08-18 the `downstream-instruction-framing` router rule matched `\bADR\b` and `execution plan`
but **not the bare word "plan"**, so *"write me a plan for issue 18"* fired nothing. Verified against
the hook before and after; three patterns were added and five probes confirmed no false positive on
"plane"/"planner".

A rule that fires only when the operator's phrasing happens to contain a different word is model-pull
wearing a hook's clothes — and **a test suite is what would have caught it, not a reading**.

## The `findingFor(...)!` count that was invented

The S025 band said **NINE** call sites and it was wrong; there are three (`CHECK-sys001.ts` lines 61,
140, 330). Caught by the S026 close's deref step, the first time anything dereferenced it. The
*mechanism* was right and only the count was invented.

A count is the fastest-rotting claim there is, because it is quoted and never visited, and **each
re-quotation reads as corroboration**.

The same pass flagged `references.ts` line 245 as missing `link_to_page.database_id` — a **FALSE
alarm**: the line reads `b.link_to_page?.database_id` and the grep omitted the optional chaining. The
claim held; the check was the defect.

## The per-term assertion sum

The standing block carried a per-term sum of gate assertions. It was wrong three times: `693` over
ten terms while the gate ran 696 across ten; then `794` over eleven while the gate ran 795. The
`CHECK-claims.ts` term was stale on both occasions.

It was a hand-kept mirror of a number the gate computes on every run and the claim gate cannot check
— G-010. Deleted 2026-08-19.

## `tsconfig.json`, and the file nobody typechecked

`tsconfig.json` was an explicit 26-entry `include` list and a new file was silently untypechecked
(#55). It is a glob (`*.ts`) now.

`main@f42fadd` printed `ALL CHECKS PASS` at **exit 0** over a tree carrying a real `TS2322` — the
counterfactual that closed #60.

TEST 4 asserts the whole chain — invocation, that `typecheck` runs a real `tsc`, `--noEmit`, the `&&`
separator, and the ordering — because asserting invocation alone leaves the control **substitutable**
by `"typecheck": "echo ok"`.

## PR #57, closed unmerged

`build/t2-sys001` is a strict ancestor of `t3`, so it delivered nothing extra, and merging it first
would have restored `prototypes/verdict.ts` — the second exit-byte implementation ADR-0012 decision 1
deleted.

## The gates, as they closed

- **Gate 1, the demand test** — CLOSED 2026-08-17 on owner research rather than on a five-team send.
  #40 closed with it. It chose an entry point and **did not establish a price**.
- **Gate 2, the 72-hour proof (#10)** — CLOSED 2026-08-17 by the operator, on the grounds its own
  triage comment gave: circular as filed, six of nine checks requiring the build it existed to gate.
- **Gate 3, build at n=1** — #42, #43, #44, #45 and #46 all built and CLOSED.
- **Acceptance criterion 1** CLOSED (#43's live run, oracle committed before it, 17 comparisons).
  **Criterion 4** CLOSED (#44, on discovery not injection). **Criterion 5** CLOSED (#45, two live
  runs byte-identical at 5987 bytes — and the CONTROL is what closes it: the same two runs *without*
  `--deterministic` differ, so the claim is about Normalization removing something rather than about
  a report with nothing volatile in it).
- **#14** CLOSED — finished in `cc16d63` on 2026-08-16, and three checkpoints carried it as the
  blocker anyway.

## GitHub's parser closed four issues

`#7` closed `COMPLETED` over its own "Blocked on (1)" comment; `#70` closed over a body naming three
live decisions. The observation was right and the cause was wrong: **neither was closed by a person.**

GitHub's parser closed both, reading `<keyword> #<number>` out of narrative prose in a merged
state-file commit body — `resolved #70` in `71d26ed`, from the true sentence *"Five isolated SME
seats resolved #70 decision 1"*.

**Four issues went this way: #7, #10, #70, #73** — each one to two seconds after a merge, each
`COMPLETED`, each credited to the merger.

`actor` cannot tell you which it was: every actor here is `MrBinnacle` — the operator's account, the
identity `gh` writes as, and the merger. Reading it as "the operator decided" put a non-question on
the operator-only list for three sessions. **The tell is the lag**: compare `closedAt` against the
merge times in the same minute.

Full doctrine and the pre-merge grep: `docs/agents/issue-tracker.md` → "A commit body can close an
issue by accident".

## The first-hit sweep that filed a confident false correction

S031 grepped for a fallback string, found `'(unknown block)'` in `references.ts`, and filed a public
correction saying #100's brief had invented `'(unrecorded block)'`. **Both strings existed** —
`scan.ts` wrote the second, for a different condition — and the brief was accurate.

This is "a refuted claim is never in one place" running in reverse, and it is worse than the forward
version: a missed surface is a silent gap, while **a first-hit sweep produces a correction that reads
as thorough**.

Both strings now name their own cause and `CHECK-report.ts` asserts they are distinguishable.

## The `.claude/reference/` split itself

Created 2026-08-22 by a `/context-hygiene` pass. `checkpoint.md` had reached **871 lines / 70KB**,
four times the 200-line threshold at which Anthropic documents adherence degrading, and it is loaded
in full on every session before any work starts.

The standing block had accreted **eleven provenance-keyed sub-blocks** ("Four constraints hoisted
from the S021 band…") layered over eight topical ones. The provenance is not a normative claim — it
records how a line arrived, which `git log` and `checkpoint-archive.md` already hold — so the
preambles were replaced with topical headings and the incident narrative moved here.

**The audit key was mechanical, not a reading.** Every normative claim in the standing block is
bolded by convention, so the trim was gated on extracting all bolded spans before and after and
diffing the two sets; every disappearance had to be justified as provenance metadata, a duplicate, or
a relocation into this file. That instrument is reproducible:

```
sed -n '<first>,<last>p' .claude/state/checkpoint.md \
  | grep -o '[*][*][^*]*[*][*]' | sed 's/^..//; s/..$//' \
  | sed 's/[[:space:]]\+/ /g' | sort -u
```

⚠ **A bolded-span diff cannot see a control-flow change**, and it cannot see the loss of unbolded
narrative. That is why narrative was relocated here rather than deleted, and why firing disciplines —
rules that must ACT when a trigger occurs — were **kept inline in full** rather than demoted to this
file. Relocating a firing discipline trades standing cost for retrieval reliability, and §1 of the
operating rules classifies model-pull retrieval as unreliable.
