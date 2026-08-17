# T3 live run — REF001 resolves a discovered link, and acceptance criterion 4 closes

Run 2026-08-17 against the fixture in `fixture.md`, using the `workspace-lint-proof` integration
(read-only) at `Notion-Version: 2026-03-11`. **Seven API calls, all reads.** Code: branch
`build/t3-ref001`, `slice/`.

This file records what the API did. It outranks the specification and the ADRs on a question of
fact, and it is the second live run of product code in this project.

---

## 1. The result

```
exit: 3
disposition: qualified
coverage vector:
  SYS001   3/4 resources (75.0%)
  REF001   1/1 internal references (100.0%)
headline: 3/4 resources (75.0%) — the MINIMUM of the vector, set by SYS001
requests: 7 · wall 1872 ms
ORACLE MATCHED
```

**The coverage vector has two rows for the first time**, over two different nouns, and the headline
is the minimum rather than a mean or a pooled count (ADR-0011 decision 4).

## 2. Acceptance criterion 4 is CLOSED, and it closed on discovery

> *Resolve a link whose target the connection cannot read, and confirm the finding is
> `certainty: confirmed` about a `target state: unreachable`.* — `docs/spec/v0.1-scan-slice.md` §2

Observed, verbatim from the run:

```
REF001  3bf1351d-6af4-8110-8dc5-dcc8bffb9742
    internal reference does not resolve — the target is unreachable (href(app.notion.com))
    certainty: confirmed · target state: unreachable · gap: bounded
    evidence: expected a resolvable internal target, observed 404 object_not_found on
              GET /v1/pages/3bf1351d-6af4-8110-8dc5-dcc8bffb9742 — absent or inaccessible,
              indistinguishable
    link: https://app.notion.com/…3bf1351d-6af4-8110-8dc5-dcc8bffb9742
```

The target is `wl-outside-grant`. **The scan was given one ID — the declared root.** The target ID
reached the rule only by being read out of the root's block content, and the call log shows the
consequence directly: the seventh request is a `GET /v1/pages/{target}` the scan could not have
issued without discovering the href first.

That is the property the previous red test did not have. `results-ref001-live.md` §2 records the
synthetic probe injecting the known-bad ID, so it passed whether or not discovery worked. The
synthetic path does not exist in this implementation at all.

**Both axes, both correct, and they disagree with each other on purpose.** `certainty: confirmed`
because *"this link cannot be resolved"* is a proved fact; `target state: unreachable` because a 404
covers absent and inaccessible and the API does not say which (Principle 3). #10's proof check 4
asserted `indeterminate` for the first of these and its own triage comment corrected it twice.

## 3. Seven requests, and what each one was for

```
ok   GET /v1/users/me
ok   GET /v1/pages/{root}
ok   GET /v1/blocks/root/children
ok   GET /v1/blocks/…fef57e44/children     ← wl-pagination, page 1
ok   GET /v1/blocks/…fef57e44/children     ← wl-pagination, page 2 (151 blocks)
ok   GET /v1/blocks/…70a06142/children     ← wl-revoke-parent
404  GET /v1/pages/…bffb9742               ← the discovered link target
```

**Link resolution costs one request per unique target.** Targets are deduplicated on the resolved
ID, so a page carrying fifty links to one dead target resolves it once. That is also why REF001's
applicable set counts targets rather than link instances: the ratio does not swing on how many times
an editor pasted the same URL.

`wl-pagination` took two calls, which is what the fixture was built to force (Q7).

## 4. The oracle was written before the run and matched on all 17 comparisons

`slice/fixture-oracle.ts` gained a `references` block naming what REF001 should find, transcribed
from `fixture.md` — *"Top-level, never connected. **Linked from the root.** The contrast case"* —
and from `results-ref001-live.md` §2's verbatim href. **It was committed to disk before this run
executed.** Seven of the seventeen comparisons are new and all seven matched:

- REF001's applicable set is 1 internal reference.
- 0 unrecognised candidates.
- The target `…bffb9742` was discovered in block content.
- It was recognised as an internal reference.
- It is unreachable.
- REF001 produced exactly 1 finding.
- That finding is `confirmed` about `unreachable`.

One oracle assertion had to be **narrowed** to stay true, and the narrowing is a real fact rather
than a convenience. The oracle requires `wl-outside-grant` to be **absent** from the manifest,
because it is not a child of the root. It is now **present in the manifest as a reference entry**,
keyed `ref:3bf1351d-…bffb9742`. Both statements are correct at once, so the absence assertion is
now scoped to the **resource** coverage item. Matching on the ID suffix alone would have failed on
the exact fact the fixture exists to produce.

## 4b. Review found four defects the green suite could not, and one would have failed a build

The three offline suites were green and this live run was clean before any of the four was visible.
All are fixed; each now has a check, and each check was **mutation-verified** — the mechanism was
disabled and the check was confirmed to go red.

**HIGH — a readable database would have been reported as a proved dead link.** Spec §3 Route A
requires `link_to_page.database_id` and `mention.type === 'database'` to be detected, and both
produced an internal reference. The resolution loop then called `GET /v1/pages/{id}` for every
target. **A database is not a page**, so a shared, perfectly reachable database `@`-mentioned in
block content would have 404'd and become `certainty: confirmed`, `target state: unreachable`,
exit `1`. That is *"a defect the scan invented"* — the failure `ref001.ts`'s own property 3 is
written to forbid, arriving through a door the property did not cover. Confirmed by mutation:
disabling the fix produces exactly one invented finding.

The fix records the target's **kind** on the reference, from the shape that carried it. A database
reference is a **named drop-out** in REF001's coverage — in the denominator, lowering the ratio,
producing no finding, spending no request. Widening the port to retrieve a data source is the real
remedy and is filed, not done here.

**A residual precision limit remains and is now carried on the finding itself.** A Route B href
states no object kind, so a 404 on one covers *"the target is a database"* as well as *"the link is
dead"*. The finding says so in its message; a Route A page mention carries no such qualifier,
because Route A stated the kind.

**MEDIUM — links inside container blocks were invisible.** Only top-level blocks were read, and
`has_children` was never inspected. A dead link inside a toggle produced no reference, no finding,
an empty REF001 row, and **exit `0` over a root containing it.** That is `CONTEXT.md` Non-goal 4,
and slice spec criterion 2 — *"retrieve nested block trees to the depth REF001 requires"* — is
marked non-negotiable. `readBlockTree` now descends to a bounded depth and request budget, skipping
`child_page` and `child_database` because those are separate resources. Exhausting either bound is
an **unbounded** loss on the containing page, so the disposition falls to `disclaimed` and the byte
to `2` rather than the scan stopping quietly.

**LOW — `mention.link_preview.url` was dropped**, and table-row rich text was never read. Both are
documented Route B shapes; a URL in either entered no denominator.

**LOW — the external-reference count moved with where a link was pasted.** Deduplication ran per
page, so one href on two pages counted twice. The report prints that number as a fact. It is now
deduplicated across pages.

**LOW — two redaction assertions could pass vacuously.** `reportSection` returns `''` for a heading
it cannot find, and `''` satisfies every negative assertion, so renaming a heading in `report.ts`
would have turned two title-leak controls green while testing nothing — a substitutable control,
inside the control. `requiredSection` now throws instead. The same function also sliced two
characters past its own marker; the offset is computed now rather than written as a constant.

## 5. What this run did NOT exercise

Stated because `docs/spec/v0.1-scan-slice.md` §1.3 requires it, and because a result reported as
complete over a fixture that cannot seed the defects is a coverage claim over an unrun set.

- **The residue path never fired on live data.** Zero unrecognised candidates: the only internal
  link in the fixture is on `app.notion.com`, which is in the allow-list. The residue is exercised
  offline (`CHECK-ref001.ts` TESTs 3, 4 and 7) and **has never been observed against the API.**
  Everything §2.1 marks *not checked* remains not checked.
- **Route A never fired either.** No page mention and no `link_to_page` block exists in the fixture,
  so both structural shapes stay **documented, not observed** — including the API's statement that a
  mention to an inaccessible page "is returned with just the ID", which is the strongest detection
  signal this rule has and is still untested against a live response.
- **No external link exists in the fixture**, so the exclusion path is offline-only too.
- **Nested block descent never fired.** The run reports *"15 top-level block(s), 15 with nesting"* —
  no block in the fixture has `has_children`, so the descent added **zero** requests and is
  **offline-only**. Its budget and its unbounded-loss path are unmeasured against the API.
- **No database reference exists in the fixture**, so the drop-out path added in §4b is offline-only
  too, and the API's actual response to `GET /v1/pages/{database_id}` remains **unobserved**. The
  fix does not depend on which status it returns — the reference is never retrieved — but the
  residual precision limit on Route B hrefs does.
- **`href-unparseable` has never fired anywhere but a unit test.** Spec §7 already names the
  Revisit-if: if it never fires on real data, merge it into `link-host-unrecognised`.
- **The exit byte was not exercised against a divergent vector.** SYS001 read 75% and REF001 read
  100%, so the funnel figure and the vector minimum were the same number and §6 below could not
  fire on this run. It fires offline.
- Unchanged from `results-t2-sys001.md`: no archived target, no seeded `UNQ001`, `SCH001`, `DEP001`
  or `CAN001`, one data source rather than three.

## 6. The exit byte is not yet the one ADR-0011 requires, and the report says so per run

`deriveVerdict` compares the **funnel scalar** — evaluated resources over applicable resources —
against the declared threshold. **ADR-0011 decision 5 makes the threshold a floor on every rule**,
that is, on the **minimum of the coverage vector**. Those were one number while SYS001 was the only
rule. They are two numbers now.

`verdict.ts` is copied verbatim from a frozen prototype, so what it compares is **#49's** decision
and not an edit this ticket may make. What the slice does instead is **measure the divergence**:
`ScanResult.byteBasis` carries both figures and the report prints them every run.

```
byte basis: compared 75.0% (funnel, unit: resources) against the declared threshold 1;
            ADR-0011 decision 5 requires 75.0% (SYS001, unit: resources)
```

**On this run the two agree and the byte is sound.** They do not always agree, and the failing case
is reachable and is checked offline: a run where every resource is evaluated and one link is
unrecognised reads funnel 2/2 and REF001 0/1. `CHECK-ref001.ts` TEST 4 asserts that this run
**exits 0** today, prints the disclosure, and is labelled a **tripwire** — it goes red the moment
#49 lands, which forces the file to be updated to the spec's expectation of exit 3.

`docs/spec/REF001-link-recognition.md` §5's exit table expects `1` where this implementation
produces `0`, for a second and separate reason recorded in §7 below.

## 7. Two places where the implementation departs from the spec, both surfaced not silent

The spec's own instruction is *"Surface the disagreement with the reasoning; scope is the
operator's call."*

**7.1 — An unrecognised candidate produces no finding, so it cannot reach exit `1`.** §5 says its
drop-out carries a `SYS001` finding; §5 and §7 both also say it *"produces no finding, carries no
`certainty`, and carries no `target_state`."* **The two halves of §5 disagree with each other.** The
non-negotiable in §7 wins, and the type system agrees with it: `Finding` requires a `certainty` and
a `targetState`, so emitting one would assert two facts the scan did not establish. The candidate is
a manifest drop-out instead — in the denominator, lowering the ratio, named with its cause. At the
default threshold of 1.0 it still reaches exit `3` through REF001's coverage row once #49 lands; it
is only the route to `1` that differs.

**7.2 — An unparseable href carrying no Notion-shaped ID is `external`, not `unrecognised`.** §4
step 3 reads *"URL fails to parse → UNRECOGNISED"* unconditionally, which makes every `#section`
anchor a coverage gap — the failure mode §7 itself names, where every real scan is qualified and
the disclosure stops being read. The frozen prototype tests the ID first and this implementation
keeps that. **The residue rule is untouched:** it keys on the ID, so every href that could name a
Notion resource still reaches it.

## 8. One redaction hazard REF001 introduces, and how it is closed

A Notion link copied from the UI reads `https://www.notion.so/My-Private-Roadmap-3bf1351d…`. **The
path carries the page title.** Spec §5 requires the verbatim href as the evidence for a drop-out and
`CONTEXT.md` redacts titles by default, and both hold only if the rendered form keeps the host and
the ID and drops everything else. `redactHref()` does that, and **every** rendered form of an href
goes through it — the manifest label, the GAPS line, the finding's `link`, and the finding's
evidence.

This is the same hole #42 shipped through an endpoint label, arriving through a different door.
`CHECK-ref001.ts` TEST 8 asserts the title appears on **no** rendered line, and asserts it section
by section as well, because the #42 defect was green in the section it was asserted over and broken
four sections later.

## 9. Next

- **#49** decides what the exit byte compares. Until it lands, no run's byte may be read as a
  coverage verdict over every rule, and TEST 4 is the tripwire that will force the change.
- **Route A is unobserved.** Adding one page mention and one `link_to_page` block to the fixture
  would move two rows of spec §3 from *documented* to *observed*, and would test the API's claim
  that an inaccessible mention returns with just the ID. That claim is the strongest detection
  signal REF001 has.
- **The residue is unobserved.** Nothing in this workspace has yet produced a link on a host outside
  the allow-list.
