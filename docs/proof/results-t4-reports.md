# T4 — Markdown and byte-stable JSON. What the run earned.

Recorded 2026-08-17, branch `build/t3-ref001`, issue #45, acceptance criteria 5 and 6.

## 1. What shipped

`slice/normalize.ts` — the named, versioned Normalization function ADR-0004 requires and which did
not exist in the tree. `buildReportDocument()` in `slice/report.ts` — one document, from which the
terminal report, the Markdown report and the JSON report are all rendered. `--json`, `--markdown`
and `--deterministic` on the CLI.

## 2. Criterion 5 is CLOSED, on the live fixture

Two read-only runs, `Notion-Version: 2026-03-11`:

```
npx tsx cli.ts scan --config ../wl.config.json --deterministic --json f1.json
npx tsx cli.ts scan --config ../wl.config.json --deterministic --json f2.json
cmp f1.json f2.json
```

**Byte-identical, 5987 bytes.** Exit `3` on both. `ORACLE MATCHED` on 17 comparisons, unchanged.

**The control that makes this non-vacuous:** the same two runs *without* `--deterministic` **differ**.
If they had matched, the determinism claim would have been about a report with nothing volatile in
it rather than about Normalization doing anything. The differing field is `wallMs` — 4640 ms on one
run, and the wall clock is not a property of the workspace.

## 3. RFC 8785, and the claim this repository already carried

`docs/research/static-analysis-prior-art.md` warns: *"naive `JSON.stringify` with sorted keys is
**not** JCS, because number formatting and UTF-16 ordering differ from what most sort
implementations produce."*

**That warning is correct, and it is aimed at other languages.** Measured on Node 22 / TypeScript
7.0.2 before `normalize.ts` was written:

| RFC 8785 requirement | This platform |
| --- | --- |
| Keys sorted by UTF-16 code unit, ascending, shorter prefix first | `Array.sort()` **is** that order. `A Z a a1 ab abc b } ~ é 😀`, and `ab` precedes `abc`. |
| Numbers per ECMAScript `Number::toString` | `JSON.stringify` already emits it: `1e+21`, `1e-7`, `5e-324`, `333333333.3333333`. |
| Control chars as lowercase `\uhhhh`, five short forms | `JSON.stringify` matches. |
| **Lone surrogates are an error** | **Diverges.** `JSON.stringify('\ud800')` returns `"\ud800"` rather than failing. |

So `canonicalize()` is a recursive key sort, a lone-surrogate rejection, and `JSON.stringify`. **One
of the four clauses is new code**; the other three are citations to platform behaviour that was
executed and recorded. **No dependency was added**, which also avoids the §3 ASK-FIRST gate.

`NaN` and `±Infinity` throw as well. `JSON.stringify` writes `null` for all three, which turns a
broken computation into a legal-looking document.

## 4. The four suppressions are now structural, not remembered

#45's ticket: *"A JSON exporter that serialises the raw `verdict` object rather than the rendered
decisions **will reintroduce every one of them.**"*

A withheld value is a discriminated union — `{published: true, value}` or `{published: false,
reason, because}`. **`value` does not exist on the unpublished branch**, so no renderer can emit a
withheld figure; `tsc` rejects the access. A nullable field would have left every emitter free to
print `null`, and printing a zero where the report refused to judge is exactly what ADR-0005
decision 3 forbids.

`because` is machine-readable and separates two states one `null` would collapse: the report
**declined** to publish (`withheld-disclaimed`) versus there was **nothing** to publish
(`absent-no-subject`, `absent-did-not-run`).

Verified in the JSON bytes, not only in the types: a disclaimed run's JSON carries
`"headline":{"because"…` and no headline value, and an exit-`4` run's JSON contains the string
`unqualified` **nowhere**, though `deriveVerdict` still returns it.

## 5. Mutation checks

Each performed by disabling the mechanism and observing the result.

| # | Mutation | Result |
| --- | --- | --- |
| 1 | Remove the recursive key sort in `canonicalize()` | **RED.** Two objects with the same keys in different insertion orders produce different bytes. The fixture uses two insertion orders on purpose — one order is already sorted half the time, so a single-object test proves nothing. |
| 2 | Emit the `volatile` block under `--deterministic` | **RED.** The two-run byte-identity assertion fails on `wallMs`. |
| 3 | Skip `redactHref()` on the captured page url | **RED, in all three formats.** The title leaks to the terminal, the Markdown and the JSON. |
| 4 | Reverse the terminal's manifest row order relative to the document | **RED.** TEST 10 catches the three renderings disagreeing. |
| 5 | Serialise the raw verdict instead of the document | Executed as an assertion, not a source edit: the naive exporter publishes a coverage figure over a disclaimed run that the document refuses to publish. |

## 6. The defect the review found, which the green suite could not

The design claim is *one document, three renderers*. **It was two-thirds true.**

The terminal renderer read `r.manifest`, `r.gaps` and `r.findings` **directly** while the Markdown
and JSON emitters read the document. The three could therefore disagree about manifest row order,
about which name a gap prints, and about which reason travels with a null link — and the manifest
order **did** differ, because the document sorts by `(unit, key)` while the raw manifest is in
insertion order, which is call order.

Found by reading the change against its own file header, not by a failing check. The suite was green
throughout. Fixed by making every section of the terminal renderer read the document, and pinned by
**TEST 10**, which mutation 4 shows is discriminating.

**Insertion order is a fact about the traversal and the network, not about the workspace.** That is
the same reason `calls` is classified volatile.

## 7. `LINK_NOT_CAPTURED` had become a false statement

It read *"not captured — this slice does not read the object's url field"*. That stopped being true
the moment `NotionPort.retrievePage` stopped discarding `url`. **A reason string that outlives the
condition it describes is a false claim printed under a true value** — this product's own defect
class, in its own output.

Corrected to what is actually true: `GET /v1/pages` runs for the **declared root** and for
**REF001's reference targets**, and for nothing else. A child is staged from its parent's block
listing and is never retrieved, so it has no url to capture. A data source is not retrieved at all —
issue **#51**.

## 8. The link widening, scoped to pages by operator decision

`NotionPort.retrievePage` was typed `Promise<{ id: string }>` and the live adapter cast the SDK page
down to it. It now carries `url`, threaded to `Finding.link`.

**Redacted at the point of ENTRY, in `scan.ts`, not at the point of render.** A Notion URL copied
from the UI reads `.../My-Private-Roadmap-3bf1351d…` — the title is *inside the path*. Three
renderers plus a durable JSON artifact each remembering to redact is the shape of the #42 leak;
`Manifest.Entry.link` therefore holds the already-redacted form and there is no raw url downstream
of `scan.ts`.

**Verified live**, by direct probe rather than by inference: the real API returned a url and the
manifest held `https://app.notion.com/…3bf1351d-6af4-8057-8496-ee302a3bee7c`. Zero occurrences of
any fixture alias or title in either live artifact.

### What the live run does NOT show

**No live SYS001 finding carries a link.** The only resource retrieved with `GET /v1/pages` is the
declared root, and on this fixture the root is *evaluated*, so it produces no finding. The single
live `SYS001` finding is on the data source, which is never retrieved.

The link path is exercised **offline only**, by a fixture where the root resolves — capturing the
url — and then loses its child list, so the root itself goes unevaluated and the finding is the
root's. Finding that out is what corrected the first version of the test, which asserted against the
standard fixture and could not have passed.

## 9. Tests

`npx tsc --noEmit` clean in **both** packages on TypeScript 7.0.2.

| Suite | Assertions | Before |
| --- | --- | --- |
| `CHECK-verdict.ts` | 38 | 38 |
| `CHECK-scan-scaffold.ts` | 56 | 56 |
| `CHECK-sys001.ts` | 92 | 92 |
| `CHECK-ref001.ts` | 124 | 124 |
| `CHECK-report.ts` | **89** | did not exist |
| **total** | **399** | 310 |

`prototypes/CHECK-link-recognition.ts`: 23, green. No existing assertion was deleted.

## 10. What is still open

- **#51** — a reference naming a database is still a permanent coverage gap, and the report
  discloses it per run rather than letting a clean `REF001` row imply coverage.
- **ADR-0004 decision 2's Snapshot** — a content-addressed snapshot between fetch and analysis is
  **not** built. The slice runs rules against the manifest in one pass and spec §1.2 does not scope
  one in. Named so the omission is deliberate rather than overlooked.
- **#46** — T5, the red test, is next.
- **#8** — the npm name is still the only thing between this branch and `main`.
