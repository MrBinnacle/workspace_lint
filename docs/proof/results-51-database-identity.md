# Results — what a database ID names, and which endpoint retrieves it

Run 2026-08-18 against the live Notion API at `Notion-Version: 2026-03-11`, by the
`workspace-lint-proof` integration (read-only, connected to `wl-proof-fixture` only). Every call was
a `GET`. Nothing was created, updated, moved or deleted **by the subject identity**; two objects were
created by the builder identity and both are recorded in §6.

Issue #51 asked for this. It states two facts as unsettled and neither ADR, spec nor research file in
this repository settles them: which object a `child_database` block's ID names versus what
`mention.database.id` carries, and which endpoint retrieves it after the `2026-03-11` database /
data-source split.

Probes: `prototypes/live-db51.ts`, `live-db51b.ts`, `live-db51c.ts`, `live-db51d.ts`. IDs are printed
as 8-hex suffixes throughout, the discipline `docs/proof/fixture.md` already uses.

## 1. The finding, in one paragraph

A `child_database` block's `id` names the **database**, and so does `mention.database.id` — the same
ID, `…9887ee5b`. The **data source** under it is a different object with a different ID,
`…cd5c4903`, and that ID is not what any reference carries. `GET /v1/databases/{id}` returns the
database. `GET /v1/pages/{database_id}` returns **400 `validation_error`**, not 404, and the message
names the object kind. **One added GET — `GET /v1/databases/{id}` — resolves every database reference
this slice can discover.** `GET /v1/data_sources/{id}` is not needed for reference resolution at all:
no reference shape observed carries a data-source ID.

## 2. The truth table

Rows are ID kinds. Columns are retrieve endpoints. Status code, then response `code`.

| ID | `/v1/pages/{id}` | `/v1/databases/{id}` | `/v1/data_sources/{id}` | `/v1/blocks/{id}` |
| --- | --- | --- | --- | --- |
| page, granted (`…2a3bee7c`) | **200** `object=page` | 400 `validation_error` | 404 `object_not_found` | not run |
| database, granted (`…9887ee5b`) | 400 `validation_error` | **200** `object=database` | 404 `object_not_found` | **200** `object=block` |
| data source, granted (`…cd5c4903`) | 404 `object_not_found` | 404 `object_not_found` | **200** `object=data_source` | 404 `object_not_found` |
| page, outside the grant (`…bffb9742`) | 404 | 404 | 404 | not run |
| database, outside the grant (`…25ef8879`) | 404 | 404 | 404 | 404 |
| data source, outside the grant (`…f23e4b04`) | 404 | not run | 404 | not run |
| never allocated (`00000000-0000-4000-8000-000000000000`) | 404 | 404 | 404 | not run |

Three readings follow, and the third is the one that changes a decision.

**The two ID types are not interchangeable, and the API enforces it.** This confirms the upgrade
guide's sentence quoted in `docs/research/notion-api-documented.md` line 43 — *"You can't use a
database ID with the retrieve data source API, or vice-versa"* — by observation rather than by
citation. A database ID on `/v1/data_sources` is a 404, and a data-source ID on `/v1/databases` is a
404.

**A database ID is also a block ID.** `GET /v1/blocks/{database_id}` returns `object=block`. The
`child_database` block and the database it contains share one identifier. A data-source ID is not a
block ID.

**The 400 discloses the object kind, and only for objects inside the grant.** Verbatim, for the
database ID on `/v1/pages`:

> `Provided ID f937580c-…-b9119887ee5b is a database, not a page. Use the retrieve database API instead.`

and for the page ID on `/v1/databases`:

> `Provided database_id 3bf1351d-…-ee302a3bee7c is a page, not a database. Use the pages API instead, or pass the ID of the database itself.`

Outside the grant the API says nothing about kind. Every ungranted object returns the same 404
`object_not_found` on every endpoint, with the same "Make sure the relevant pages and databases are
shared with your integration" message. **Notion resolves the kind before it answers, but it discloses
the kind only to a connection that may read the object.** That is the correct privacy posture and it
is also the boundary of what this repository can infer from a status code.

## 3. What a Route A database reference carries — `mention.database.id` is the DATABASE

`docs/proof/fixture.md` recorded that the fixture contains no database reference at all, so this
could not be observed by reading. A temporary page was created under the fixture root by the builder
identity, read once by the subject, and then moved out of the root (§6). Three blocks, three shapes:

| Source form | Block shape observed | ID carried |
| --- | --- | --- |
| A bare database URL on its own line | `paragraph` with `mention.type = "database"`, keys of `mention.database`: `id` | `…9887ee5b` — the **database** |
| An inline Markdown link to the same URL | `paragraph`, `rich_text` with an `href` containing the 32-hex ID | `…9887ee5b` — the **database** |
| — | No `link_to_page` block was produced by either form | — |

`mention.database.id` is the database ID, not the data-source ID. `references.ts` line 266 routes a
`mention.type === 'database'` to `targetKind: 'database'`, and that classification is correct.

**One shape stays unobserved and it is named here rather than assumed.** `references.ts` line 245
also reads `link_to_page.database_id`, and neither Markdown form produces a `link_to_page` block —
that block is created in the Notion UI. Whether `link_to_page.database_id` carries the database ID or
the data-source ID is **UNOBSERVED**. The prior is strong: the field is named `database_id`, and §2
shows the API refuses a data-source ID wherever a database ID is expected, so a `database_id` field
holding a data-source ID would contradict a check the API itself enforces. A prior is not an
observation. §5 makes closing it a precondition of the implementation, not of the decision.

## 4. What this refutes in issue #51

#51 §"What shipped instead" states the Route B precision limit this way:

> A Route B href carries an ID and nothing that says what kind of object it names. A 404 on one
> therefore means *"not retrievable as a page"*, which covers a readable database as well as a dead
> link.

**The premise is false and the API says so.** A readable database does not 404 on `/v1/pages`. It
returns 400 `validation_error` with a message naming it a database. The two cases #51 says are
merged are separated by the status code, with no port widening at all.

The limit narrows rather than vanishing. A 404 on a Route B href still covers a dead link *and* a
database outside the grant, because §2 shows an ungranted object of any kind returns the same 404.
So the surviving statement is narrower and different in kind:

> A 404 on a Route B href covers a target that is absent and a target of any kind outside this
> connection's grant. It no longer covers a database this connection can read.

The case that produced an invented defect — a shared, perfectly readable database, `@`-mentioned —
is exactly the case that is now positively distinguishable. **The remaining ambiguity is confined to
targets the scan may not read, where `target_state: unreachable` is already the true and only
defensible answer under Principle 3.**

## 5. What the current slice does with a 400 today

`slice/scan.ts` treats any non-404 resolution failure as a drop-out and not a finding:

```ts
loss: target.status === 404 ? null : { cause: `target could not be retrieved — ${target.cause}`, … }
```

So a Route B href naming a readable database becomes a coverage gap with the cause `400
validation_error`, not an invented dead link. **The existing behaviour is sound.** It is also
uninformative where the API was specific: the API said "is a database, not a page" and the manifest
records a bare status.

## 6. Objects the builder created, and their disposition

Recorded because a fixture that changes silently stops being an oracle.

| Object | What it was for | Disposition |
| --- | --- | --- |
| `wl-dbref-probe` (page `…85a6a541`) | Held the three reference forms in §3. Created under `wl-proof-fixture`. | **Moved out of the root** to workspace level immediately after the single read. The root was re-enumerated afterwards: 15 blocks, same block types, `child_database` intact — identical to before. It is now a private top-level page the subject cannot see. |
| `wl-outside-grant-db` (database `…25ef8879`, data source `…f23e4b04`) | The §2 contrast case: a database **outside** the grant. The fixture had no such object, and without it the 400 kind-disclosure could not be bounded. | **Kept.** Top-level, never connected to the subject, never linked from any fixture page. It cannot enter any manifest. It is the database analogue of `wl-outside-grant`. |

Neither object changes the fixture's applicable set. `slice/fixture-oracle.ts` pins `applicable: 4`
resources and `references.applicable: 1`; both still hold, and neither constant was touched.

## 7. What is now settled, and what is not

**Settled by observation.** The object a `child_database` block's ID names. The object
`mention.database.id` carries. Which endpoint retrieves each ID kind. That a database ID is also a
block ID. That the two ID types are not interchangeable. That an in-grant kind mismatch returns 400
with the kind named, and that an out-of-grant miss returns 404 with nothing named.

**Not settled, and not settled here.** Whether `link_to_page.database_id` carries a database or a
data-source ID (§3) — it needs one `link_to_page` block, which must be made in the Notion UI. Whether
database references are common enough in real workspaces to matter, which is #51's own "Revisit if"
and still needs `REAL_ROOT_ID`.

Decision and recommendation: recorded on issue #51.
