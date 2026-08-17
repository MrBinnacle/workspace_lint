# T1 scan scaffold — the first run of the product against the fixture, and two defects in its own report

- **Evidence class:** `observed`. This file records what the API and the code actually did.
  It outranks documentation on any question of fact.
- **Date:** 2026-08-17. `Notion-Version: 2026-03-11`. Read-only.
- **Ticket:** #42 (T1). **Spec:** `docs/spec/v0.1-scan-slice.md`.
- **Branch:** `build/t1-scan-scaffold`, cut from `proto/ref001-observed` with `origin/main` merged in.
- **Code:** `slice/`. Command: `npx tsx cli.ts scan --config ../wl.config.json`.

## 1. The run

The scan resolved the declared root, enumerated 15 blocks, found 3 child resources, descended into
the two `child_page` children, and stopped at the `child_database`. It returned **exit `3`** in
**6 requests** and **1.78 s wall**.

| Figure | Value |
| --- | --- |
| Applicable set | 4 resources — the declared root and its 3 children |
| Reached `fetched` | 3 of 4 |
| Reached `evaluated` | **0 of 4** |
| Disposition | `qualified` |
| Coverage vector (ADR-0011) | **empty** |
| Exit | **3** — gaps confined, coverage below the declared threshold |
| Requests · wall | 6 · 1782 ms |

**Neither the request count nor the wall time is a validated budget.** #7 owns budgets on a named
reference workspace and has not run. Two runs minutes apart returned 2043 ms and 1782 ms; nothing
should be concluded from either number beyond "the scoped run is seconds, not minutes."

## 2. Nothing reached `evaluated`, and that is the honest reading

#42 specifies *"no rules yet."* ADR-0005 decision 5's fifth stage is `evaluated`, and a resource is
evaluated when a **rule** judged it. This slice implements no rule. So the manifest records zero
evaluated resources and attaches a named cause to every one of the four:

> reached the end of the funnel unevaluated — this slice implements no rule (#42); evaluation
> arrives with SYS001 in #43

Three consequences, recorded here so they are not re-derived:

1. **The ADR-0011 coverage vector is empty.** It holds one entry per rule and there are no rules.
   The `0/4` and `3/4` figures printed are **funnel** figures with the unit `resources` named on
   the line. They are not a coverage ratio and must not be quoted as one.
2. **Exit `0` is unreachable in T1, by construction.** Every resource is a gap, so even a perfect
   run exits `3`. The first ticket that can return `0` is **#43**.
3. The bytes T1 *can* produce are `4`, `2` and `3`.

The alternative — letting `evaluated` mean "fetched without error" — would have printed a `3/4`
that reads as rule coverage and is not. That is the flattering direction, and it is the defect
class this product exists to detect.

## 3. Two defects, both in the report layer, both found by the live run

The offline suite was green before either of these was visible. Both were produced by running the
thing against the real workspace, which is the argument for Gate 3 in one line.

### 3.1 Page titles reached stdout under a report that claimed redaction

The first live run printed, in its call log:

```
ok    GET /v1/blocks/wl-pagination/children
ok    GET /v1/blocks/wl-revoke-parent/children
```

`wl-pagination` and `wl-revoke-parent` are **page titles**. Four sections above them the same report
printed *"page titles redacted by default"*. The pagination helper takes a human label for its
endpoint string and the scan passed the alias into it.

**A redaction control with a hole in it is worse than no control**, because the report asserts the
guarantee either way and a reader has no way to tell the two apart. Fixed: the label is the
resource ID. `CHECK-scan-scaffold.ts` TEST 6 now asserts over **every rendered line** that no
fixture title appears with redaction on — an assertion scoped to the manifest section alone would
have stayed green through this defect.

### 3.2 Truncated IDs are not a discriminator in this workspace

The first run rendered three distinct resources identically as `«3bf1351d…»`. Notion IDs are
time-ordered, so resources created in one session share their leading hex — the declared root and
two of its children share **eight** hex digits here. The manifest was correct at 4 applicable
resources; its rendering read like a double-count.

Fixed: the report prints the **full hyphenated ID**. Truncation is not redaction, and in this
workspace it was not disambiguation either. `CONTEXT.md`'s settled default already says a finding
names its resource *"by ID and link, never by title"* — the ID was always the right thing to print.

The same fix moved `Gap.resource` from the alias to the ID, so #43 inherits an ID-shaped resource
field rather than the redaction hole.

## 4. What the fixture could NOT exercise

Required by spec §1.3. The fixture is narrower than #10 specified: **one** data source rather than
three, no archived target, and no seeded `UNQ001`, `SCH001`, `DEP001` or `CAN001`.

| Criterion | Status in this run |
| --- | --- |
| 1 — enumerate the root, match a hand-written manifest | **Partially.** The root enumerated and the applicable set is 4. **No hand-written oracle was written before the run**, so the match is against the code's own output. Criterion 1 is NOT closed. |
| 2 — nested block trees to `REF001` depth | **Not exercised.** One level below the root. `REF001` is #44. |
| 3 — detect seeded defects | **Not exercised.** No rule exists in this slice. |
| 4 — unreadable target is `confirmed` / `unreachable` | **Not exercised.** Needs `REF001` (#44). |
| 5 — Markdown and byte-stable JSON | **Not exercised.** Console output only; #45. |
| 6 — coverage published as a vector | **Vacuously.** The vector is empty and the report says so. Real test needs ≥1 rule (#43). |
| 7 — the exit byte ADR-0008 assigns | **Partially.** `4`, `2` and `3` are exercised offline; `3` live. `0` and `1` are unreachable in T1. |
| 8 — within the stated budget | **Recorded, not validated.** 6 requests, 1.78 s. #7 owns budgets. |
| 9 — persist no token, no page-body text | **Exercised.** See §5. |

The mid-stream enumeration failure, the `request_status: incomplete` signal, the failed credential
and the unreachable declared root were all exercised **against the fake port, not against the API**.
Each is a behaviour of this code under an input the fixture cannot produce on demand.

## 5. Credential discipline

- `NOTION_TOKEN` is read from `.env` by the process and never printed. Every line routes through
  `scrub()`; the SDK's `logLevel` is pinned to `'error'` because its own warn logger writes to the
  console and bypasses application redaction.
- `grep -ci "ntn_\|secret_"` over the full run output: **0**. No `«REDACTED»` marker appeared
  either, which means no token-shaped string reached the scrubber at all.
- Titles in output with redaction on: **0**.
- Six calls, all `GET`: `/v1/users/me`, `/v1/pages/{id}`, `/v1/blocks/{id}/children` ×4. Nothing was
  created, updated, moved or deleted.

## 6. Live confirmations of standing facts

- **`request_status` was absent from all six responses.** Re-confirmed. The test remains positive
  only and no code path blocks on the field's arrival.
- **The pagination page took two `children` calls**, so the cursor loop is exercised live.
- **`GET /v1/blocks/{id}/children` still carries no truncation signal** and the report discloses
  that per run rather than hiding it (ADR-0006 decision 5).

## 7. The stop condition did not fire

*"Stop the project if the scan cannot produce a coverage manifest against declared roots without
write access or an LLM."* It produced one, read-only, with no LLM. **The stop condition is not
triggered.**

## Next

**#43** — SYS001 renders these gaps as findings, and evaluation begins. It is also the ticket that
makes exit `0` reachable and the coverage vector non-empty.
