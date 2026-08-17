# The 72-hour proof fixture

Built 2026-08-17 in the workspace *Matthew Gruber's Notion*. This file records what exists, who built it, and which measurements that construction method could distort.

`.env` holds the IDs and is gitignored. `.env.example` carries the shape.

## Two identities, and they are not the same

| | Identity | Used for |
| --- | --- | --- |
| **Builder** | The claude.ai Notion connector — OAuth, broad workspace access, read and write | Creating the fixture pages |
| **Subject** | `workspace-lint-proof` — internal integration, read-only, granted one page | Everything the proof measures |

The proof measures what the **subject** can see. The builder made the content; it is not part of the measurement.

## What exists

| Page | ID suffix | Purpose |
| --- | --- | --- |
| `wl-proof-fixture` | `…2a3bee7c` | The Declared root. The subject is connected here and nowhere else. |
| `wl-pagination` | `…fef57e44` | 151 blocks. Forces `GET /v1/blocks/{id}/children` to paginate. Q7. |
| `wl-dataset` | ds `…cd5c4903` | 150 rows, `Status` select. Q2 and Q3. |
| `wl-revoke-parent` | `…70a06142` | Holds the revocation target. Q1. |
| `wl-revoke-child` | `…ce0fb949` | The revocation target. |
| `wl-outside-grant` | `…bffb9742` | Top-level, never connected. Linked from the root. The contrast case. |

`wl-outside-grant` is **not** under the root. That is deliberate. It gives the proof a link whose target the subject cannot resolve — a `REF001` finding with an `unreachable` target state, which ADR-0005 distinguishes sharply from an `unreached` Gap.

## Does building it this way confound the measurement?

Asked before the build finished, and it is the right question. The answer is no for the core measurements, with two caveats that are recorded rather than dismissed.

**It does not confound the coverage measurements.** Creation identity has no bearing on what a read-only integration can enumerate. The subject's grant is determined by which pages it is connected to, not by who typed the content. A fixture file's author does not change what a parser reads from it.

**It does not confound Q1 or Q6.** Those turn on whether the subject can be *denied* access to `wl-revoke-child`. That is a permission question about the subject, decided entirely after the content exists.

**It does not confound the v0.1 rules.** None of `REF001`, `REQ001`, `UNQ001`, `SCH001`, `REL001`, `DEP001` or `CAN001` reads `created_by`. If a future rule does, this fixture stops being neutral for it.

### Caveat 1 — bulk creation clusters timestamps, which bears on Q3

The 150 rows were created in two API calls, so their `created_time` values cluster into two tight groups rather than spreading across days as organic rows would.

Q3 asks whether result order is stable across two identical paginated calls. If Notion's default ordering is timestamp-derived, near-identical timestamps could make order **either** artificially stable **or** artificially unstable, depending on how ties are broken. Neither result would generalise to a real workspace.

**Do not conclude from this fixture alone that ordering is stable.** Confirm any Q3 result against `REAL_ROOT_ID` content, or treat the answer as provisional and say so in the write-up.

### Caveat 2 — block types came from Markdown conversion

`wl-pagination`'s blocks were produced by the connector's Markdown-to-block conversion, not by a human paste. Verified after creation: 151 blocks, all paragraphs, one intro plus 150 fixture lines. That is the structure Q7 needs.

A human paste of the same text produces the same paragraph blocks, so this is a verified equivalence rather than an assumption. Recorded because it was checked, not because it was doubted.

### Not a caveat, but a standing limit

The fixture is synthetic no matter who builds it. **Q8** — how often a pervasively gapped scan forces a `disclaimed` Report disposition — cannot be answered here at all. It needs `REAL_ROOT_ID`. **Q4**, the ~11,200-object search ceiling, needs a workspace larger than anything hand-built.

## What a human still has to do

Two things, and neither can be delegated.

1. **Create the `workspace-lint-proof` integration and connect it to `wl-proof-fixture`.** Read content only; Insert and Update off, per Principle 7. Paste the token into `.env` as `NOTION_TOKEN`.
2. **Attempt the revocation on `wl-revoke-child`, and record `REVOCATION_SUPPORTED`.** Notion documents that a connection inherits to every child. Whether one child can then be un-shared is unverified — the research marks it `(C)`, community reports with no reproduced primary source. It is proof question 1.

**A `no` on step 2 is a finding, not a setup failure.** It would mean every descendant of a Declared root is always readable, so an `unreached` Gap inside a Declared root could arise only from rate limits and pagination, never from permissions. That narrows ADR-0005's evidence-sufficiency axis and must be written up before the proof runs.

## Rebuilding

`scripts/setup-proof-fixture.sh` walks the whole thing by hand. It is now only needed for the two human steps above; the page tree already exists. Run it in a real terminal — it refuses a non-interactive stdin, and stage 1 verifies the token against `GET /v1/users/me` before writing it.
