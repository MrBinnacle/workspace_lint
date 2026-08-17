# REF001 live run — the rule works, and the first implementation of it was false-green

Run 2026-08-17 against the fixture in `fixture.md`, using the `workspace-lint-proof` integration
(read-only) at `Notion-Version: 2026-03-11`. Eight API calls, all reads: `GET /v1/users/me`,
`GET /v1/pages/{id}`, `GET /v1/blocks/{id}/children`.

This is the first time any code in this project has called the API. The prototype that produced it is
throwaway and lives on branch `proto/ref001-observed`; it is **not** on `main`. This file records what
the API did, which outranks both the prototype and any ADR on a question of fact.

**The headline is not the pass.** `REF001` works end to end on live data. The result worth reading is
that the first implementation of it reported a clean workspace by staying silent, and did so through
three independent mechanisms, each of which is the defect class this product exists to detect.

---

## 1. `REF001` is confirmed working end to end, on discovered links

The run resolved every internal link found inside readable block content and produced:

```
REF001 FIRES — href(app.notion.com) → 3bf1351d…
  certainty:    confirmed
  target_state: unreachable
```

Both axes behave as `CONTEXT.md` requires and as ADR-0005 distinguishes. The finding is `confirmed`
because *"this link cannot be resolved"* is a proved fact; the target is `unreachable` rather than
`absent` because the 404 covers both worlds. `results.md` §4 established this rule as the load-bearing
coverage mechanism. It is now confirmed working against the API rather than against a fixture note.

**The report:** disposition `qualified`, coverage ratio 3/4, exit `3`.

Exit `3` rather than `1` is correct and worth stating: a confined gap with coverage below threshold
outranks a new finding on ADR-0008 decision 2's priority order. **Coverage outranks conformity in the
exit byte, and this run is the first observation of that ordering firing.**

## 2. Notion serves internal links from `app.notion.com`. An allow-list that omits it fails silently.

**Observed.** The fixture's own link to `wl-outside-grant`, read from the root's block content:

```
[paragraph] type=text  text="wl-outside-grant"
            href=https://app.notion.com/p/3bf1351d6af481108dc5dcc8bffb9742
```

The first implementation matched internal links with `/notion\.(so|site)/`. That test fails on
`app.notion.com`. The run discovered **zero** links, raised **no** error, and would have reported a
clean `unqualified` verdict over a root containing a dead link. It appeared to pass only because a
synthetic control injected the known-bad ID directly.

**Two consequences, and the second is the larger one.**

**(a) The host list is a correctness surface, not a detail.** `REF001`'s specification must enumerate
the hosts Notion actually serves. Observed here: `app.notion.com`. Not yet observed and therefore not
yet claimed: `notion.so`, `www.notion.so`, `notion.com`, `*.notion.site`. The prototype accepts all of
them; only one is evidenced.

**(b) An unclassifiable link must be reported, not dropped.** A link recogniser has three outcomes,
not two: internal, external, and **unrecognised**. An href carrying a Notion-shaped ID on a host the
tool does not know is exactly the `undecidable` case ADR-0005 defines — fetched, not judgeable — and
dropping it converts a coverage gap into a clean result. This is the same shape as ADR-0002 decision
4's inversion recorded in `results.md` §1: the mechanism was pointed the wrong way, so it fired on the
healthy path and stayed quiet on the degraded one.

**A control that can substitute for the mechanism under test is not a control.** The synthetic probe
passed the red test whether or not link *discovery* worked. It is now opt-in behind a flag.

## 3. The applicable set was built from what the code could classify, so the denominator shrank to fit

**Observed.** The root returns 15 blocks, of which three are child resources:

```
wl-pagination (child_page), wl-revoke-parent (child_page), wl-dataset (child_database)
```

The first implementation counted `child_page` only. `wl-dataset` is a `child_database` and was
invisible to it, so the coverage ratio read **2/2 — 100%** over a root with three children.

**The rule this establishes: the applicable set is derived from the enumerated response, never from
the subset the scan knows how to handle.** A denominator built from recognised types silently excludes
every type the tool does not yet support, and reports the highest coverage exactly where the tool is
weakest. Corrected, the same run reads 3/4.

## 4. The exit byte and the report disagreed, because coverage was held in two places

**Observed.** The coverage manifest showed `wl-dataset` stalled at `enumerated` with a named cause. The
findings list contained no `SYS001` entry. The exit byte reads the findings list, so it returned `1`
— *"at least one finding is new"* — when the contract required `3`.

Nothing was wrong with either data structure. They were maintained independently and drifted, and they
drifted toward the flattering answer.

**The rule: `SYS001` is derived from the coverage manifest, not maintained beside it.** The manifest is
the single source of truth for what was not evaluated. A coverage rule whose input is a second copy of
the coverage data is not a check on the scan; it is a check on the bookkeeping.

## 5. The manifest was keyed on titles and double-counted one resource

`wl-revoke-parent` was marked once as `revoke-parent` and once as `wl-revoke-parent`, producing five
manifest rows for four resources and inflating the denominator.

`CONTEXT.md`'s settled default already forbids this — *"Identity is the stable ID. Names are
report-only aliases."* The defect is recorded because the default existed, was known, and was violated
anyway in the first fifty lines of code written against it. ADR-0010 decision 1 makes the same call for
finding identity, for the same reason.

---

## Live re-confirmations

Each of these was previously recorded from the 2026-08-17 proof run and is confirmed again, first-hand,
by this run.

| Claim | Source | This run |
| --- | --- | --- |
| `wl-revoke-child` is **not** listed among its parent's children | `results.md` §4 | **CONFIRMED.** `revoke-parent` returns 2 blocks, 0 `child_page`. The child is invisible, not named-but-unreadable. |
| `request_status` is absent from normal responses | `results.md` §1 | **CONFIRMED.** Absent from every response in this run. The prototype tests positively for `type === "incomplete"` and blocks on nothing. |
| Block-children enumeration paginates and is separable from fetching | `results.md` §2 | **CONFIRMED.** `wl-pagination` returned 151 blocks over two calls — 100 with `has_more: true`, then 51 with `has_more: false`. |
| An unshared page returns 404, not 403 | `results.md` §4 | **CONFIRMED.** `object_not_found`, carrying no signal that separates absent from inaccessible. |
| `Notion-Version: 2026-03-11` is valid | `results.md` | **CONFIRMED.** All eight calls accepted. |

## What this run changed

| Question | Before | After |
| --- | --- | --- |
| `REF001` works end to end against the API | asserted from a fixture note | **CONFIRMED on discovered links** |
| Exit `3` outranks exit `1` in practice | specified in ADR-0008, unobserved | **observed firing** |
| Which hosts carry internal Notion links | unexamined | **`app.notion.com` observed; the others are unverified** |
| A link recogniser needs an `unrecognised` outcome | not stated anywhere | **required — a two-outcome recogniser is a false-green generator** |
| How the applicable set is derived | unstated | **from the enumerated response, never from the recognised subset** |
| Where `SYS001` gets its input | unstated | **derived from the manifest; a second copy drifts** |

## Next

1. **Specify `REF001`'s link recognition**, including the host list and the mandatory `unrecognised`
   outcome. Filed as an issue; it is a rule-specification gap, not an ADR question, unless the
   `unrecognised` outcome needs a new value on ADR-0005's evidence-sufficiency axis — which it may.
2. **Observe the remaining hosts.** Only `app.notion.com` is evidenced. Do not write the others into a
   spec as though they were.
3. **Q3 is still unsettled and this run does not touch it.** No repeated identical query was made.
4. **`REAL_ROOT_ID` is still unexercised.** Every result here is from the synthetic fixture, so Q8 —
   how often a real workspace forces a `disclaimed` disposition — remains open.
