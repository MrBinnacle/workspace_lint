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

## A finding nobody registered: the timestamps are minute-truncated

This is **not** one of P1–P5. It emerged from diagnosing run 1 and is recorded separately so that it
is not read as a registered result.

**Twelve of twelve observed values across two runs end `:00.000Z`.** Run 2 counts this in its own
output rather than leaving the results file to assert it, so a future run reproduces or refutes the
finding automatically.

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
