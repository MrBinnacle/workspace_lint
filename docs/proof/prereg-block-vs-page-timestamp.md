# Pre-registration — does a `child_page` block's `last_edited_time` track its page's?

**Registered 2026-08-23, committed BEFORE the probe is run.** Session S042 close +1. The predictions
and the decision table below are fixed at commit; correcting them after the data is aiming the
instrument after reading the target.

## The question, and why it is worth a live run

S042 established that `slice/measurement.ts:240` is false: the scan already calls
`GET /v1/blocks/{block_id}/children`, a full block object carries `last_edited_time`, and a
`child_page` is a block object — so the field the flagship edit-age counter says does not exist is
already arriving and being discarded at `slice/notion-port.ts:61`.

That refutes the stated cause. It does **not** license the fix. Capturing the field and **labelling
it the page's edit age are two different decisions**, and only the first follows from the refutation.
If a `child_page` block's `last_edited_time` tracks the *block* — when the reference was created or
moved within its parent — rather than the *page's own content*, then rendering it as "last edited"
would replace a false boundary line with a false **number**, which is worse and much harder to
notice.

**The vendor does not settle it.** `/reference/block`, `/reference/page`,
`/reference/get-block-children` and `/reference/retrieve-a-page` were all fetched 2026-08-22 (200 OK)
and all are silent on whether the two values are guaranteed equal. `working-with-page-content` says
*"Pages are also blocks"* and *"you can use the page ID as a block ID"*, which is strong indirect
support and **is not a guarantee**. Status: **UNLOCATABLE**. This run is the empirical substitute.

## What the probe does, and what it touches

⛔ **It creates its own subject and deletes it. No existing page, block or property is modified.**
Editing real fixture content would have measured the same thing while risking content that other
proofs depend on; creating a scratch child is strictly safer and answers the identical question.

Sequence, under the fixture root (`FIXTURE_ROOT_ID`, confirmed good 2026-08-17):

1. **Create** a scratch child page `P` under the fixture root, titled with a run-stamped
   breadcrumb naming this pre-registration.
2. **Measure at rest** — `GET /v1/pages/{P}` → `page_ts_0`; `GET /v1/blocks/{root}/children` → find
   `P`'s `child_page` block → `block_ts_0`.
3. **Edit `P`'s own content** — append one paragraph block to `P`. This changes the page's content
   and touches nothing in the parent's block listing.
4. Wait past one-second granularity, then **re-measure both** → `page_ts_1`, `block_ts_1`.
5. **Edit again**, wait, **re-measure** → `page_ts_2`, `block_ts_2`. Two edits give two independent
   chances to observe divergence; one could coincide.
6. **Roll back** — archive `P`, then verify by read-back that it is archived.

The probe also **dumps the field names present on the `child_page` block object**, so the run
records the observed shape whatever the timestamps do.

**Read-only?** No — and this is the first probe in this repository that writes. It runs under the
operator's standing administrator grant with the discipline that grant carries: breadcrumb in the
created title, rollback in the same run, verification by read-back. ⚠ **Timestamps cannot be rolled
back.** The fixture root's own `last_edited_time` will move because a child was added and archived.
That is a known, accepted, and disclosed side effect; no other proof in `docs/proof/` reads the
fixture root's edit time.

**The token never reaches stdout.** Same discipline as `prototypes/live-ref001.ts`: `.env` is parsed
by the process, every line goes through `scrub()`, and the SDK is constructed with
`logLevel: 'error'` because its own warn logger bypasses application redaction.

## Predictions, registered before the run

Where the honest direction is the embarrassing one, the prediction takes it. **Here the embarrassing
direction is divergence** — it means the cheap fix is unavailable and the counter needs a different
design.

| # | Prediction | Refuted if |
| --- | --- | --- |
| **P1** | **The `child_page` block object carries `last_edited_time` at all.** The field is present and non-empty on the block returned in the parent's children listing. | The field is absent, or the object comes back partial (`object` + `id` only). **P1's refutation would refute S042's instrument-defect finding itself** and must be reported as such, loudly, not buried. |
| **P2** | **At rest the two are equal:** `block_ts_0 == page_ts_0`. | They differ before any edit — which settles the question immediately and in the embarrassing direction. |
| **P3** | ⭐ **THE DISCRIMINATOR. A content-only edit to `P` moves the PAGE timestamp and does NOT move the BLOCK timestamp:** `page_ts_1 > page_ts_0` **and** `block_ts_1 == block_ts_0`. | Either the page timestamp does not move (the edit did not register — instrument failure, re-run), **or the block timestamp moves with it**, which is the happy branch: the two track the same event. |
| **P4** | **The second edit reproduces the first.** Whatever P3 shows, edit 2 shows the same. | Edits 1 and 2 disagree — the behaviour is nondeterministic and no labelling decision may be taken from a single run. |
| **P5** | **Rollback verifies.** `P` reads back archived, and no other child of the fixture root changed. | Rollback fails or leaves `P` live — recorded as an instrument failure and the page is removed by hand before anything else runs. |

## The decision table — fixed now, read off after, never re-derived

| outcome | what it means | what happens to the counter |
| --- | --- | --- |
| **P3 HOLDS** (block ts frozen while page ts moves) | The two are **different objects tracking different events**. The block's timestamp is about the reference, not the content. | ⛔ **LABELLING REFUSED.** The field may still be captured, but it may not be rendered as "last edited" for that resource. The edit-age counter needs a different source — most likely a per-child `GET /v1/pages/{id}`, which is a cost decision, not a grant decision. |
| **P3 REFUTED, block ts moves with page ts, and P4 confirms** | The two track the same event across two independent edits. | ✅ **LABELLING LICENSED — as an EMPIRICAL finding, never as a documented guarantee.** Every downstream claim must say "observed on n=1, vendor silent" and carry this file as its locator. The vendor may change it without notice precisely because it never promised it. |
| **P2 REFUTED** (they differ at rest) | Settled before any edit. | Same as P3 HOLDS — labelling refused. |
| **P1 REFUTED** (no field on the block) | S042's instrument-defect finding is wrong. | ⛔ Stop. Re-open `docs/proof/dispositions-run2.md`'s finding and issue #158's banner; the boundary line the product ships may have been correct after all. |
| **P4 REFUTED** (edits disagree) | Nondeterministic. | ⛔ No labelling decision from this run. Re-run before deciding anything. |

## What this run cannot establish

- **Not a guarantee.** n=1 page, one workspace, one API version (`2026-03-11`), one moment. An
  observed equality is evidence of current behaviour and never a contract; the vendor's silence is
  what makes it revocable.
- **Not the partial-object question.** When the API returns a partial block object rather than a
  full one is undocumented and this probe does not force the partial case. If P1 is refuted, that
  is the first hypothesis to test, not a conclusion.
- **Not a fix.** It licenses or refuses one label. Building the counter is #158.
- **Nothing about the read.** Run 2 is adjudicated. This changes no bin and no branch.
