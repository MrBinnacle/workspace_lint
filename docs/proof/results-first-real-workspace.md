# First run against a real workspace — two live broken references, and the ceiling measured

- **Date:** 2026-08-19
- **Subject:** an organic Notion workspace belonging to the project owner. **n=1.**
- **Mode:** policy-free — one declared root, no rule configuration. `SYS001` and `REF001` only.
- **Command:** `npx tsx cli.ts scan --config ../wl.config.json --deterministic`
- **Cost:** **85 requests, 23.2 s**, all read-only.
- **Result:** exit **3**. Coverage headline **10/20 resources (50.0%)**, set by `SYS001`.

⛔ **THIS DOCUMENT IDENTIFIES NOTHING IN THE SUBJECT WORKSPACE.** No page ID, title, URL or
structure appears below. This repository is public, the subject is a private workspace, and
`CONTEXT.md`'s settled default — *name a resource by ID and link, never by title* — was written for
the product's output. It applies at least as hard to the product's own evidence. References are
labelled by role. **A future session must not "improve" this file by adding the identifiers**; the
raw run was kept out of the repository deliberately.

## 1. Why this run matters

Every prior proof ran against `docs/proof/fixture.md` — a four-resource workspace built by hand to
exercise known paths. It answers *does the mechanism work*. It cannot answer *does the tool find
anything a person did not already know*, because everything in it was planted.

This is the first run against content nobody built for the tool.

## 2. The predictions, registered before the run

Written in-session before the scan and reproduced verbatim in outcome:

| prediction | outcome |
|---|---|
| `SYS001` ≈ 10/20 resources (~50%) | **exact — 10/20, 50.0%** |
| exit 3 | **exit 3** |
| `REF001` produces 1–3 findings | **3** |
| **"most or all are grant-boundary crossings, not real dead links"** | ⛔ **REFUTED — 1 of 3 is grant boundary, 2 are genuinely unresolvable** |
| "no finding that tells the owner anything they did not know" | ⛔ **REFUTED** |

**The two refuted rows are the result.** The coverage arithmetic was predictable from the workspace
shape; the findings were not.

## 3. Two references that resolve for nobody

Two `mention(page)` targets returned `404 object_not_found`. One of them is referenced **from the
declared root itself, inside the callout that tells a reader how to begin work** — the instruction
names a target that no longer resolves.

**These are not permission artifacts, and the control is what establishes it.** Each target was
re-requested through a second, independently-authenticated identity with a different grant. Both
failed there too — and the **positive control passed**: a third page, known to exist and known to
sit outside the scanned subtree, was retrieved successfully by that same identity in the same
session. Without that control the two 404s would prove nothing, which is the trap
`docs/agents/domain.md` names.

⚠ **The finding's own wording stays correct and must not be strengthened.** `REF001` reports
*"absent or inaccessible, indistinguishable"*, and that remains the honest claim: a target invisible
to two identities may still exist somewhere neither can reach. Deletion is the strong reading, not a
proved one. **Principle 3 is doing its job here and the report should not be edited to sound more
certain than the API allows.**

**The third finding is a true grant-boundary case** — a page that exists, sits outside the shared
subtree, and is correctly reported with the same wording. One in three, not three in three. The
prediction that this class would dominate was wrong.

## 4. `www.notion.so` is an observed internal-link host

Three link candidates travelled the **`unrecognised` residue path** on host `www.notion.so`.

The standing record says: *"Only `app.notion.com` is evidenced as an internal-link host, and
`*.notion.site` is documented. `notion.so`, `www.notion.so` and `notion.com` are **not checked** — no
locator exists for any of the three."* That was accurate when written and is now superseded by
observation: **this run produced three locators on `www.notion.so`.**

**The consequence is that `REF001` under-reports today.** Those three targets were never retrieved.
They are disclosed as residue rather than silently dropped — the residue path working exactly as
designed — but they are internal references that went unresolved, so the rule's applicable set is
understated by three and no dead-link verdict was reached for any of them.

⚠ **This does not license adding the host to an allow-list without thought.** The standing
constraint holds: *the host set is unbounded and no allow-list can ever be complete*, because Notion
documents custom domains for Sites. The residue path remains the soundness mechanism and the host
list remains an optimisation. What this run establishes is only that **one specific host is
observed**, which is a locator the record previously did not have.

## 5. A finding you cannot act on is not yet a finding

**`sourcePage` and `sourceBlock` are captured in the manifest and rendered zero times.**
`manifest.ts` declares both on `RefFacts`, `references.ts` populates them at the point of discovery,
and `grep -c sourcePage report.ts` returns **0**.

So the report states that a target is unreachable and never states **which page contains the link**.
On a twenty-resource scan the reader can find it by hand. Across a workspace of several hundred
top-level pages they cannot, and the finding degrades to an alarm with no address.

This is issue **#100** — *"README promises one plain repair action and no finding carries one"* —
observed rather than argued, and the fix is smaller than the ticket implies: **the data is already
in the manifest. It is a render change, not a capture change.**

## 6. The ceiling, measured

**Half of the scanned surface is invisible.** Ten of the twenty resources are data sources, and all
ten are bounded gaps carrying the same cause: *data-source enumeration is not implemented in this
slice.* That single fact fully explains the 50.0% headline; no other resource failed to evaluate.

`REF001` reached **35/39 internal references (89.7%)**, so the reference path is in far better shape
than the resource path.

**What this bounds.** On a workspace whose structure lives in databases, the tool currently reads the
container and none of the contents. Spec §1.2 cut data-source enumeration deliberately and **#51**
holds the reference half. This run turns both from a design note into a measured limit: *half*, on a
real hub, on the first attempt.

## 7. What this run does not establish

- **n=1, and the one is the owner.** The same limit `PRODUCT.md` records for the demand evidence.
- **One declared root, one level deep.** The workspace's most visible disorder is at the top level —
  several hundred sibling pages — and the tool cannot see that shape at all, because ADR-0002 makes
  a declared root mandatory and ADR-0014 keeps search out of root discovery. **The scan was aimed at
  a hub because a hub is the only thing it can be aimed at.**
- **No configured rule ran.** `REQ001` and `UNQ001` had empty applicable sets, so this says nothing
  about either.
- **No claim about deletion.** See §3.

## 8. What follows

1. **#100 is now the highest-value small fix.** Render `sourcePage`. Without it no finding is
   actionable, and the data is already captured.
2. **File the `www.notion.so` observation** so the host question reopens on evidence, and record that
   `REF001`'s applicable set is understated wherever that host appears.
3. **#51 and data-source enumeration are the ceiling**, now with a number attached.
4. **The kill criterion did not fire.** `PRODUCT.md` asks whether a first run against a real decayed
   workspace *"produces a report its owner reads as noise."* It produced two references that resolve
   for nobody, one of them in the instruction that tells a reader where to start. That is not noise.
   **It is also not yet a product**, for the reasons in §6 and §7.
