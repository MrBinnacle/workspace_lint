# Dispositions — run 2, the Measurements read

**Protocol:** `docs/proof/prereg-run2-kill-criterion-read.md` → "The read protocol — extended for
the counters". Bins cover **the Measurements section only**, one per report, five in total, plus
the density question. REF001/SYS001 findings are unchanged from run 1 and inherit their run-1 bins
per the registered rule; none was re-read.

**Status: READ COMPLETE — 5 of 5 Measurements sections binned, 2026-08-22. Every bin below is
SME-ADVISED. None is a cold owner read.**

⛔ **THIS DOCUMENT IDENTIFIES NOTHING IN THE SUBJECT WORKSPACE.** Role labels ROOT-A–E and
TARGET-1–5 only. A future session must not "improve" this file by adding identifiers.

---

## The protocol deviation, declared before the bins because the pre-registration cannot be edited

The pre-registration assigned this read to the operator, cold: *"The operator reads the five
`--show-titles` copies **cold** — no agent annotation before the read."* That is not what happened,
and the reason is a ruling he made **after registration and before any read**:

> "whoever SME(s) would manage this on a full tech product team … these are decisions that should
> never make it to me … not because I don't care, but because there's simply a correct answer —
> this is a linter."

Applied: whether a linter's report carries actionable signal is a determinate practitioner
question, not a values fork. The S040 close's framing of the density question as "the operator's
felt-surface call" was a misclassification of that kind.

Three consequences, recorded rather than smoothed:

1. **The amendment preceded every read.** No bin was moved after being seen.
2. **Run 1's findings bins are untouched.** They were his cold read and they stand.
3. **Every figure here names its layer.** The criterion's wording is *"a workspace owner
   recognises"*; a delegated read is a **proxy** for the owner. Any downstream claim quoting these
   figures must say "SME-advised" and must not imply a cold owner read. Run 1 already proved what
   layer-conflation costs: cold-read and verified acceptance differed 4-of-6 to 1-of-6.

**He may override any bin at any time.** An override is appended as its own dated line, never
edited into the table.

---

## Method — four isolated seats, counterbalanced

Four seats, dispatched in parallel with no visibility of each other; isolation is the anti-cascade
property. Each received the read protocol **verbatim**, the rendered-shape description **verbatim**,
a closed bin enum, and a fixed per-root output block, so the outputs join without reconciliation.

| seat | lens | read order |
| --- | --- | --- |
| product manager | signal vs noise for the owner; does the section change a decision | A → E |
| data analyst | measurement validity, denominator honesty | **E → A** |
| UX / content design | what the reader's attention does; the density question | A → E |
| support / customer success | actionability for a non-author; tool-limit vs workspace-defect misreads | **E → A** |

**Order was counterbalanced deliberately** — two seats forward, two reverse — so that an order
effect on the bins would be visible rather than baked in. It did not fire: the one root that drew a
split bin drew it from one forward seat and two reverse seats, so the split tracks the root, not
the reading order.

Every seat returned `status: nominal`. No seat reported a degraded read, a blocked file, or a
redaction-forced omission.

---

## The five bins

| report | PM | analyst | UX | support | **joined bin** |
| --- | --- | --- | --- | --- | --- |
| ROOT-A | NOISE | CANT-TELL | CANT-TELL | CANT-TELL | **CANT-TELL** (3 of 4) |
| ROOT-B | NOISE | NOISE | NOISE | NOISE | **NOISE** (4 of 4) |
| ROOT-C | NOISE | NOISE | NOISE | NOISE | **NOISE** (4 of 4) |
| ROOT-D | NOISE | NOISE | NOISE | NOISE | **NOISE** (4 of 4) |
| ROOT-E | NOISE | NOISE | NOISE | NOISE | **NOISE** (4 of 4) |

**SIGNAL bins: zero. Across five reports and four seats, twenty independent bin decisions, not one
seat on one root named a thing it would act on this sitting.** Every `action-named` field returned
`none`.

The four roots binned NOISE were unanimous, and the reasons converge on one mechanism: **on four of
five reports the numbers could not have come out any other way.** ROOT-D and ROOT-E resolved zero
references of any kind, so every inbound row is arithmetically forced to 0; ROOT-B's single row can
only be 0 or 1; ROOT-C reached no data source at all. A figure that cannot vary with the state of
the workspace is not a measurement of the workspace.

**ROOT-A is the one report where the counter could vary and did** — nine databases at 0, one at 1 —
and it is the only CANT-TELL. Three seats reached it independently, by three routes, on the same
defect: a 0 is equally consistent with an orphaned database and with one referenced from outside a
one-level subtree, and the report's own scope caveat forbids the only action the nine zeros
suggest. The support seat put it most usefully: the section "LOOKS like a finding — and the
section's own caveat withdraws it."

Per the pre-registration, **CANT-TELL is a defect of the report, not of the workspace, and its
count is a product measurement.** One of five.

---

## The density question

| seat | verdict |
| --- | --- |
| product manager | NOISE-BETWEEN-READER-AND-NUMBERS |
| data analyst | NOISE-BETWEEN-READER-AND-NUMBERS |
| UX / content design | NOISE-BETWEEN-READER-AND-NUMBERS |
| support / customer success | MIXED |

**Joined: NOISE-BETWEEN-READER-AND-NUMBERS**, three of four, with the fourth splitting the axis
rather than dissenting from it.

All four seats agree on the content and disagree only about whether the rendering defect is fatal:
**the disclosures are correct, and correctness is not the problem.** Measured: roughly 450 words of
boundary prose against two to eleven short rows; ~1,000 characters of prose per rendered figure on
ROOT-D; the prose byte-identical across all five reports.

Three findings the seats reached separately and that survive joining:

- **A statement identical on every run of a build is a property of the build, not a measurement of
  the workspace.** The three maintenance-load paragraphs are printed per report, per root, every
  scan, for a fact that changes once.
- **The disclosure trains the reader to skip the paragraph that disambiguates the numbers above
  it** — which is precisely the ROOT-A failure, arrived at from the UX seat independently of the
  analyst's route to the same place.
- **The provenance is unredeemable by the reader it is shown to.** Cause strings cite issue
  numbers, ADR numbers and repository file paths. To a non-author these "signal that an explanation
  exists somewhere they cannot reach, which converts a clear limit into a suspicion."

No seat proposed deleting a word of it. All four proposed **moving** it: one line per uncomputed
counter naming the blocker, full text behind a verbose flag or in DISCLOSURES — a placement defect,
not a candour defect.

---

## P7, scored

> **P7** — *at least 1 of the 5 Measurements bins is SIGNAL, and at most 1 is CANT-TELL.*
> *Refuted if: zero SIGNAL (the SURVIVES-NARROW branch fires); or ≥ 2 CANT-TELL.*

**REFUTED**, on the first clause, at full strength. Zero SIGNAL bins.

The second clause holds — exactly one CANT-TELL — so the registered `≥ 2 CANT-TELL` failure did
**not** fire: the completed report's defect rate does not dominate its signal. It has no signal to
dominate.

Run 2's prediction set closes at **five hold, two refuted** (P5 structurally, P7 on zero SIGNAL).
Both refutations are the registered embarrassing branch, and both fired at full strength.

---

## The adjudication — read off the registered procedure, not re-derived

The procedure fixes three branches over the **union of run-1 and run-2 evidence**. Reading it as
written:

> **SURVIVES-NARROW** — zero Measurements bins are SIGNAL. The entry point survives on the
> reference/coverage half only, and the counters — the content #70 decisions 2–4 and five tickets
> were spent building — read as noise to the one owner sampled. **This outcome obliges a filed
> ticket on the counter surface, not silence**, and any later claim that the policy-free counters
> carry the entry point must cite this outcome against itself.

# **SURVIVES-NARROW**

The entry point survives. It survives on the **reference/coverage half only** — run 1's verified
record stands unchanged: the surface returned one genuinely dead reference that its owner repaired
the same sitting, and that repair is visible to the product in three places in run 2 without being
told. Nothing in this read touches that.

What does not survive contact with the read is the **counter surface**. Five bins, zero SIGNAL.

**KILL was unreachable by construction and was not reached.** The pre-registration: *"the operator,
reading the completed surface cold, states in his own words that the surface as a whole is noise …
If he does not volunteer it, it did not happen."* No seat can produce that sentence, no bin
arithmetic reaches it, and nobody asked him for it. **It did not happen.** It remains available to
him at any time, on his own initiative, and a later session must not read SURVIVES-NARROW as having
foreclosed it.

Two facts fixed by results §3 that no bin could have moved, and which the branch must be read
against: two of the six countable signals `PRODUCT.md` lists render as boundary text on this build,
and a third is structurally 0-or-1.

---

## The obliged ticket, and the one thing that makes it cheap

SURVIVES-NARROW **obliges a filed ticket on the counter surface**. The read hands it a concrete
target, and vendor verification hands it a cheaper one than expected.

The three `computed: false` causes were re-verified against freshly fetched vendor pages
(2026-08-22), independently of the shipped text. **All three are accurate**, and none misattributes
a project-governance gap to the vendor or the reverse. The distinction that matters for scheduling:

| counter | real obstacle | grant needed |
| --- | --- | --- |
| relation / rollup / formula counts | port calls neither endpoint | **none** — `GET /v1/databases/{id}` (already authorized) → `GET /v1/data_sources/{id}` for the schema's `properties` map |
| view count | port does not call `GET /v1/views` | **none** — read-content already suffices |
| people-type empty values | rows require `POST /v1/data_sources/{id}/query` | **ASK-FIRST**, ungranted; a §3 governance gate, not a Notion limit |

**Two of the three uncomputed counters are unbuilt, not ungranted.** They need no operator decision
and no new grant — only the calls. That reframes the ticket from "price a fifth endpoint" to "build
two authorized GETs", and it is the single most actionable thing this read produced.

The last-edited counter is the flagship and the worst-performing: one row on every report, on every
root, on every policy-free run this build can produce. Whether that is a scope choice or a data gap
turns on an **open vendor question** (below).

---

## Instrument findings — what the read surfaced about the product

Recorded because a bin and a defect are independent: a section can bin NOISE and still be correct,
or bin NOISE *because* it is defective.

**Verified and standing:**

- **A zero row is indistinguishable from an empty state.** Nine rows of 0 cost nine lines to say
  one thing and read as nine findings. Ranked by the support seat as the highest misread risk in
  the set.
- **A degenerate range is printed in the furniture of a distribution.** ROOT-D/E rows cannot be
  non-zero; ROOT-B's can only be 0 or 1. The table is still sorted, still totalled.
- **The reference-population coverage ratio is never printed.** On ROOT-A, 39 references resolved
  and 1 landed on a reached database — a coverage of 1/39 that the reader can only recover by
  hunting two figures from different lines.
- **"not computed" and "not read" read as the same apology** but mean "the call was never made"
  and "the call cannot carry this field."
- **Nothing distinguishes a counter one authorized call away from one blocked on an ungranted
  POST** — which, per the table above, is the only part of those paragraphs a reader could act on.
- **Second-highest misread risk is a security risk.** "not retrieved" plus an endpoint name, and
  "the row endpoint in particular has NOT been granted", both read to a non-author as *their*
  permission problem. The remedy they would reach for is widening their own workspace sharing, to
  fix a problem that does not exist.

**Correctly behaved, recorded for the record:** the three uncomputed lines report `computed: false`
with a named cause and enter no ratio. No unattested enumeration was converted into a gap or a
denominator anywhere in the five reports. ADR-0013 holds on this surface.

**⛔ THE FLAGSHIP COUNTER'S ONE-ROW BEHAVIOUR IS AN INSTRUMENT DEFECT, NOT A SCOPE BOUNDARY.**
Resolved by vendor fetch after the seats reported and before this file was committed; every
file:line below was then verified directly at the hub rather than taken from the report.

`slice/measurement.ts:240` states, unqualified, that a child page enumerated from the root's block
listing has no retrieve *"so no response carrying its `last_edited_time` exists"*, and
`measurement.ts:302` renders that as the `over` line the reader sees. **The claim is false.**
`GET /v1/blocks/{block_id}/children` returns block objects, a full block object carries
`last_edited_time` (`/reference/block`, fetched 2026-08-22), and a `child_page` is a block object.
**The scan already makes that call.** The field arrives and is thrown away: `listChildren` declares
`results: unknown[]` (`slice/notion-port.ts:61`).

The precedent for the fix is in the same file, for the sibling method. `notion-port.ts:81-87`
records that `GET /v1/pages/{id}` "has always returned" `properties` and that the declared return
type discarded them (#58, #142) — fixed by widening the type, with the reasoning stated there:
*"Keeping more of one response is not a new endpoint, so … #51's ASK-FIRST precedent for adding an
endpoint does not apply here."* The same reasoning covers `listChildren`. **No new endpoint, no new
grant, no ask-first — a type widening.**

Two things this does **not** settle, and neither is a reason to leave a false sentence standing:

- **Whether a block's `last_edited_time` is the same instant as its page's is UNLOCATABLE.**
  `/reference/block`, `/reference/page`, `/reference/get-block-children` and
  `/reference/retrieve-a-page` were all fetched (200 OK, 2026-08-22) and all are silent. Vendor
  prose says *"Pages are also blocks"* and *"you can use the page ID as a block ID"*, which is
  strong indirect support and is **not** a guarantee. An empirical test — edit a page, diff the two
  timestamps — would settle it and was not run. **Capturing the field and labelling it the page's
  edit age are two decisions, and only the first is licensed today.**
- **When the API returns a partial rather than a full block object is not documented** — a partial
  carries `object` and `id` only. Not located on any of the pages above. This bounds the fix; it
  does not rescue the sentence, because one documented case where the field is present refutes an
  unqualified "no response … exists".

Consequence for scheduling: **three** of the uncomputed counters are unbuilt rather than ungranted,
and the flagship is the cheapest of the three.

**One claim raised by a seat and REJECTED at the hub after direct verification.** The analyst seat
reported the last-edited `over` line as "false as written", citing 36/11/76 successful page
retrieves against a one-row table. Verified directly rather than deferred: the `over` line is
explicitly scoped `(unit: resources)`, and reference targets sit in the **references** unit. The
seat pooled the two units — which is the exact hazard this repository already documents
(*"a reference is not a resource, and one manifest holds both"*). **The seat's conclusion does not
stand as stated.** What survives is narrower and is recorded as open below.

---

## Open, and deliberately not resolved here

- **The `2026-07-08` changelog locator for the 10,000 cap may be wrong.** A fresh fetch dates the
  entry `2026-04-20`. The date is asserted in **two** surfaces — `.claude/state/checkpoint.md:407`
  and `docs/vendor/WATCH.md:42`. **Not corrected**, because the verifying fetch covered one
  changelog page and explicitly left the archive unpaged: "not located in one fetch" is not "does
  not exist", and correcting a dated locator on a single negative would be negation as failure.
  Filed as a verification item; both surfaces named so a future sweep does not find one and stop.
- **`GET /v1/views` now documents a `request_status` field** carrying `complete`/`incomplete` and
  an `incomplete_reason` of `query_result_limit_reached` — a completeness signal unlike
  `GET /v1/blocks/{id}/children`. This bears on the ADR-0013 attestation question if that endpoint
  ever enters the port. The standing note that `request_status` "has never been seen on either
  branch" is about **observed responses** and is untouched by a documentation sighting; no code
  path may block on its arrival.

---

## What this read cannot establish

- **Not a population rate.** n=1, and the one is the operator's own workspace. Every figure is a
  density inside one workspace.
- **Not a cold owner read.** Four SME seats are a proxy. The criterion says "a workspace owner
  recognises"; this record says "SME-advised" everywhere and any figure quoted from it must too.
- **Not a KILL and not a refutation of one.** KILL was unreachable by delegation by construction.
- **Not a buyer signal, a price, or a segment.** #29 is untouched.
- **Not the databases' contents** (#51), **not the target-status distinction** (#135), **not the
  block-tree budget's owner** (#136) — all three reproduce here as registered and none is this
  read's business.
