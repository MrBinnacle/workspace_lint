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
2. ~~Attempt the revocation on `wl-revoke-child`.~~ **Done 2026-08-17. `REVOCATION_SUPPORTED=yes`.** See below.

## Selective revocation exists — observed 2026-08-17

`docs/research/notion-api-practice.md` §5.2 rated this `(C)`: community reports, no reproduced primary write-up. **It is now confirmed by direct observation**, and the mechanism is more specific than "revoke a child".

Opening `wl-revoke-child` → ⋯ → Connections → remove `workspace-lint-proof` produces a confirmation dialog reading, verbatim:

> **Disconnect workspace-lint-proof and unlink share settings from parent page?**
> This page will no longer inherit share settings from its parent. Admins can still restore settings later.

Three things follow, and the wording is load-bearing.

1. **Notion does not model this as a per-child deny.** It models it as **breaking inheritance**. The child stops inheriting the parent's share settings entirely and becomes independently permissioned. A tool cannot ask "is this child denied?" — it can only observe that the child's effective grant differs from its parent's.
2. **The action is reversible by an admin** — "Admins can still restore settings later." So an access gap observed during a scan is not necessarily a permanent property of the resource. A Coverage manifest that records a gap is recording a fact about one scan window, which is what ADR-0002 decision 5 already implies by requiring start and end times.
3. **`unreached` inside a Declared root is reachable by permissions, not only by rate limits.** This settles the branch that ADR-0005 flagged. The evidence-sufficiency axis keeps its full range and does **not** narrow. No superseding ADR is needed.

**What this does not yet establish.** Proof question 1 asks whether `wl-revoke-parent` still lists a `child_page` block pointing at the disconnected child while a direct retrieve of that child returns 404. That is the mechanism a completeness claim would rest on, and it is an API observation, not a UI one. It remains open until the proof runs.

Status: the UI capability is **CONFIRMED**. The API consequence is **still the open question**.

## Rebuilding

`scripts/setup-proof-fixture.sh` walks the whole thing by hand. It is now only needed for the two human steps above; the page tree already exists. Run it in a real terminal — it refuses a non-interactive stdin, and stage 1 verifies the token against `GET /v1/users/me` before writing it.
