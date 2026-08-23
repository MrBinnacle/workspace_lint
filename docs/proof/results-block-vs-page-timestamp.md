# Results — does a `child_page` block's `last_edited_time` track its page's?

**Pre-registration:** `docs/proof/prereg-block-vs-page-timestamp.md`, committed `cc0eb1c` before
either run. **Instrument:** `prototypes/block-vs-page-timestamp.ts`. **Run 2 executed 2026-08-23**,
API version `2026-03-11`, SDK `@notionhq/client` 5.25.2, one workspace, one page.

⚠ **No prediction and no decision-table row was changed between the two runs, and none may be.**
What changed is the instrument, in the two places named below. Correcting a prediction after reading
the data is aiming the instrument at the target; correcting a wait constant that made the registered
discriminator unobservable is repairing the instrument so the registered question can be asked at
all. The distinction is the whole of the discipline here, and this file states it before the numbers
so that a later reader can check the claim rather than take it.

Role labels only. No page title, identifier or URL from the workspace appears in this file.

## Run 1 is VOID, and its own verdict was wrong

Run 1 scored **P4 REFUTED** and reported the behaviour as nondeterministic, which under the
registered decision table means *no labelling decision from this run, re-run*. The re-run was the
right instruction. The stated reason for it was not: **run 1 carried two instrument defects and
neither was a fact about Notion.**

**Defect 1 — resolution.** The probe waited 2500ms between an edit and its measurement, under a
comment asserting *"Notion timestamps are second-granularity."* That assertion is false. **The API
truncates `last_edited_time` to the minute** — every one of run 1's six observed values ended
`:00.000Z`, as did every one of run 2's. A 2500ms wait cannot resolve a move that is only visible
across a minute boundary.

The consequence was precise, and it manufactured the nondeterminism. The scratch page was created in
one minute and edited twice in quick succession. Edit 1 fell inside the creation minute, so the
page's truncated timestamp could not move; edit 2 happened to cross a boundary, so it did. `P4`
compares edit 1's behaviour against edit 2's, found them different, and reported the API as
nondeterministic. **The two edits disagreed because the clock was coarser than the experiment, not
because the vendor's behaviour varied.**

The fix is a wait **before** each edit rather than after it. What must differ is the truncated minute
of the previous edit event and that of the next one; a wait placed between an edit and its read
changes neither. `PRE_EDIT_MS` is 70s — any interval of 60s or more crosses at least one boundary,
and the margin covers clock skew and the append call's own latency.

**Defect 2 — rollback, and it left a page in the workspace.** Run 1 archived by sending
`archived: true`. API version `2026-03-11` rejects that at validation —
`body.archived should be not present, instead was `true`` — so **the scratch page was left live**
and had to be removed by hand. The field is `in_trash`; the SDK marks `archived` deprecated in its
favour (`api-endpoints/pages.d.ts:526`). The read-back check was never at fault, since it already
tested both fields. Only the write was wrong.

The orphan was removed with `prototypes/trash-page.ts` — written for this — and **verified by
read-back** before run 2 was started. That tool takes an explicit identifier on the command line,
refuses to run without one, and never enumerates. Trash is not deletion; the page remains
recoverable by the operator.

⛔ **A run whose rollback fails is an instrument failure under P5, and its subject must be removed
before anything else runs.** Run 1 said so itself, loudly, and that instruction was correct.

## What run 2 observed

| | page `last_edited_time` | `child_page` block `last_edited_time` |
| --- | --- | --- |
| **t0** — at rest | `2026-08-23T04:08:00.000Z` | `2026-08-23T04:08:00.000Z` |
| **t1** — after content edit 1 | `2026-08-23T04:10:00.000Z` | `2026-08-23T04:10:00.000Z` |
| **t2** — after content edit 2 | `2026-08-23T04:11:00.000Z` | `2026-08-23T04:11:00.000Z` |

Each edit appended one paragraph block to the scratch page. Nothing in the parent's block listing was
touched, and no existing page, block or property was modified in either run.

**The `child_page` block object carried eleven fields:** `child_page`, `created_by`, `created_time`,
`has_children`, `id`, `in_trash`, `last_edited_by`, `last_edited_time`, `object`, `parent`, `type`.

## The predictions, scored

| # | Prediction | Outcome |
| --- | --- | --- |
| **P1** | The `child_page` block object carries `last_edited_time` at all | **HOLDS** |
| **P2** | At rest the two are equal | **HOLDS** |
| **P3** | ⭐ A content-only edit moves the page timestamp and does **not** move the block's | **REFUTED** — page moved on both edits, block moved with it on both |
| **P4** | The second edit reproduces the first | **HOLDS** |
| **P5** | Rollback verifies | **HOLDS** |

**P1 holding matters beyond this question.** Its refutation would have refuted S042's
instrument-defect finding itself. It did not: the field is present on the block object, which is what
`slice/measurement.ts:240` says does not exist and what `slice/notion-port.ts:61` discards.

## The verdict, read off the registered decision table

The table's second row, reached exactly: **P3 refuted, the block timestamp moves with the page
timestamp, and P4 confirms it across two independent edits.**

> ✅ **LABELLING LICENSED — as an EMPIRICAL finding, never as a documented guarantee.**

**Every downstream claim must say "observed n=1, vendor silent" and carry this file as its locator.**
The vendor may change this without notice precisely because it never promised it.

## Run 3 — independent replication, and three controls that run 2 did not have

Run 2 answered the question and **assumed three preconditions it never checked.** Each was the same
shape as the defects that voided run 1: a belief written into the instrument with nothing to falsify
it. Run 3 (2026-08-23) added the checks and re-ran.

| | page | block | verified |
| --- | --- | --- | --- |
| **t0** — at rest | `04:15:00.000Z` | `04:15:00.000Z` | — |
| **t1** — after edit 1 | `04:17:00.000Z` | `04:17:00.000Z` | edit landed, child blocks 1 → 2 |
| **t2** — after edit 2 | `04:18:00.000Z` | `04:18:00.000Z` | edit landed, child blocks 2 → 3 |

**All five predictions scored identically to run 2.** That is an independent replication: two runs,
two separate subject pages, same outcome. It remains one workspace and one page per run.

The three controls, and why each exists:

1. **The append is now proved to land**, by child-block count before and after. Without it, a dead
   append and a genuine vendor finding produce the *same* line — a page timestamp that does not move
   is exactly what a no-op edit should cause. Run 1's "page did not move on edit 1" was consistent
   with both readings and the instrument could not distinguish them.
2. **The wait now checks itself.** The smallest non-zero gap between observed values is an upper
   bound on the granularity — the real quantum divides it. Run 3 measured that bound at **60s**
   against a 70s wait and reported ADEQUATE. Had the bound ever exceeded the wait, the run would say
   so instead of silently reproducing run 1's false-nondeterminism verdict. **The constant no longer
   rests on a belief; the run derives the check from its own data.**
3. **A run that leaves a page in the workspace can no longer exit 0.** This is the one that let run
   1's orphan pass. Run 1 printed `REMOVE THIS PAGE BY HAND`, then exited `0` anyway, so the orphan
   was visible only to a human reading the whole log and to nothing downstream at all.

## Run 4 — the mutation, because a control that has never fired is not a control

Control 3 above was still unexercised: every clean run rolls back successfully, so the exit-5 branch
had never been reached. **A control asserted but never fired is this project's oldest failure shape.**

Run 4 reproduced run 1's defect deliberately — the rollback field mutated back from `in_trash` to
`archived` — and scored it under the four checks of
`~/.claude/skills/mutation-killed-by-the-wrong-mechanism`:

- **Substitution verified on the code site, not on prose.** The first attempt counted `archived: true`
  across the whole file and got **3**, two of which were this file's own header comment *describing*
  run 1's defect. **A grep that counts your documentation is not a substitution check.** Scored on
  the full call expression instead: exactly 1, and `in_trash` absent from the rollback site.
- **The mutation compiles** — typecheck exit 0. `archived` survives in the SDK types as deprecated,
  so it is the *API* that rejects it at runtime, not the compiler. A stillborn mutant would have
  tested `tsc` and nothing else.
- **Scored by name, not by exit code.** ⚠ Exit `5` is reachable from three branches, so the code
  alone is ambiguous. The rollback branch is identified by **P1, P2 and P4 holding while P5 flips** —
  proving the run completed non-vacuously and *reached* the branch rather than short-circuiting into
  one of the other two.
- **Non-vacuity confirmed.** Both edits verified landing; all measurements present.

**Result: caught.** Exit went `0` → `5`, P5 flipped to REFUTED, and the run reproduced run 1's error
string verbatim — `body.archived should be not present, instead was `true`` — which **confirms the
run-1 diagnosis rather than leaving it plausible.** The deliberately orphaned page was removed with
`trash-page.ts` and verified by read-back.

Run 4 also replicates the timestamp finding a third time.

## A finding nobody registered: the timestamps are minute-truncated

This is **not** one of P1–P5. It emerged from diagnosing run 1 and is recorded separately so that it
is not read as a registered result.

**Twenty-four of twenty-four observed values across four runs end `:00.000Z`.** The probe counts
this in its own output rather than leaving the results file to assert it, so a future run reproduces
or refutes the finding automatically. Runs 3 and 4 additionally measured the granularity bound at
**60s** from their own data.

**The vendor is silent, and its example actively misleads.** `https://developers.notion.com/reference/page`
(fetched 2026-08-23, 200 OK) says only *"Date and time when this page was updated. Formatted as an
ISO 8601 date time string"* and states nothing about precision, granularity or rounding. Its example
value is `"2020-03-17T19:10:04.968Z"` — millisecond precision, which is what the instrument's author
believed and what the live API does not do. **A documented example is not a documented contract, and
here the two point in opposite directions.**

⚠ This is an observation about current behaviour under one API version, in the same evidence class
as everything else in this file. It is not a vendor guarantee and must never be cited as one.

## What this run cannot establish

- **Not a guarantee.** n=1 page, one workspace, one API version, one moment. An observed equality is
  evidence of current behaviour and never a contract; the vendor's silence is what makes it
  revocable.
- **Not the partial-object question.** When the API returns a partial block object rather than a full
  one is undocumented, and this probe does not force the partial case. P1 held on a full object; it
  says nothing about a partial one.
- **Not a fix.** It licenses one label. Building the counter is `#158`.
- **Nothing about the read.** Run 2 of the kill-criterion read is adjudicated separately. This
  changes no bin and no branch.
- **Nothing about sub-minute edit ordering.** Minute truncation means two edits inside one minute are
  indistinguishable by timestamp. No design may rely on ordering or on elapsed time below that
  resolution.
