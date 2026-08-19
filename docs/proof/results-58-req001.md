# #58 — REQ001, the first configured rule. What the runs earned.

Recorded 2026-08-18, branch `build/t6-req001`, against the plan
`~/.claude/plans/steady-seeking-rocket.md` and ADR-0010 decision 7.

## 1. What changed

`NotionPort.retrievePage` was typed `Promise<{ id: string; url?: string }>`. `GET /v1/pages/{id}`
has always returned `properties` and the seam discarded it, so REQ001's entire input was thrown away
at the port. The return type gains `properties?`. **No endpoint was added**, so #51's ASK-FIRST
precedent for a new endpoint does not apply and `notion-port.ts`'s three-endpoint header is still
true.

The scan retrieved **only the declared root**. Every descendant arrives as a `child_page` block
inside its parent's listing and a block carries no properties, so a rule about properties needed a
hydration stage that did not exist. `hydrateRequiredProperties()` in `scan.ts` is that stage: one
`GET /v1/pages` per in-scope resource, grouped so the cost is linear in resources rather than in
pairs, and the declared root's map is reused from the retrieve the traversal already made.

`REQ001` is in `BUILT_RULES`. The build now executes three of the four v0.1 rules.

## 2. The mapping this rule turns on

| Observation | Verdict |
| --- | --- |
| Property present in the map, value empty | **violation** — the rule read it |
| Property present, value non-empty | conforms |
| Property **absent from the map** | **gap, never a violation** |
| No `properties` map in the response | gap — hydration failed |
| Present, and its value cannot be read | gap — the build is short, not the page |

Row 3 is #58's hazard 1 and it is non-negotiable. A Notion page returns the properties the
integration **can see**, so an absent property is *not defined here* **or** *not granted*, and the
API does not say which. Collapsing rows 1 and 3 reports a defect in the operator's workspace that is
really a defect in the grant.

**Row 5 is not in the plan's table and the code still has to answer it.** A property object whose
own `type` key is missing from it is present and unreadable. It is a gap, and its evidence
sufficiency is `undecidable` rather than `unreached`, because neither sharing more nor re-running
helps — the rule has to learn the shape. That is the same ruling REF001 makes for an unrecognised
link.

## 3. The offline suite

`npx tsc --noEmit` clean on TypeScript 7.0.2.

| Suite | Assertions | Before |
| --- | --- | --- |
| `CHECK-verdict.ts` | 38 | 38 |
| `CHECK-config.ts` | 64 | 64 |
| `CHECK-scan-scaffold.ts` | 56 | 56 |
| `CHECK-sys001.ts` | 109 | 109 |
| `CHECK-ref001.ts` | 124 | 124 |
| `CHECK-req001.ts` | **92** | did not exist |
| `CHECK-report.ts` | 89 | 89 |
| `CHECK-redtest.ts` | **52** | 50 |
| `CHECK-residuals.ts` | 76 | 76 |
| `CHECK-claims.ts` | **61** | 59 |
| `CHECK-suite-registration.ts` | **33** | 31 |
| **total** | **794** | 696 |

Green, offline, no network and no token. `CHECK-suite-registration.ts` moved by two because two of
its assertions are per-suite, and the suite count is now **eleven**.

**`CHECK-redtest.ts` TEST 5 changed by two assertions and its claim did not.** It read *"two rules
ran, not eight"* and *"no REQ001 ran"*. Three rules run now, and REQ001 contributes nothing for a
different reason than before: it is no longer absent, it is present with an **empty applicable set**,
because that fixture's config declares no required property. Those two states are indistinguishable
in a report and are not the same fact, so the suite now asserts which one it is.

## 4. The mutation

`CHECK-req001.ts` TEST 9 substitutes a mutant into `BUILT_RULES` that drops the drop-out test from
`judgeable`, which is the one-line change that collapses row 3 into row 1.

| | control | mutant |
| --- | --- | --- |
| REQ001 findings on an absent property | 0 | **1** |
| exit byte | 3 | **1** |
| REQ001 coverage row | 0/1 | **1/1** |
| disposition | qualified | qualified |

**The disposition does not move, and that is worth recording.** Both runs are `qualified` — one by a
gap, one by a violation — so an operator reading the disposition alone cannot see the reversal at
all. The byte and the finding list carry it. A mutation that changed nothing would mean TEST 3
measures nothing; three things change.

## 5. The live runs

Two runs, read-only, against the proof fixture. `npx tsx make-fixture-config.ts FIXTURE_ROOT_ID
--property <name>` then `npx tsx cli.ts scan --config ../wl.config.json --oracle`.

**The oracle was pre-registered in `fixture-oracle.ts` and committed before either run**, and it
holds one row per planned run. The property is read off the run rather than passed in: an oracle
that has to be told what to expect can be told the answer.

| | run 1 — `title` | run 2 — `Owner` |
| --- | --- | --- |
| pairs applicable | 4 | 4 |
| pairs evaluated | 3 | 0 |
| REQ001 findings | 0 | 0 |
| REQ001 coverage row | 3/4 (75.0%) | 0/4 (0.0%) |
| headline set by | SYS001, 3/4 resources | **REQ001, 0/4 pairs** |
| conformity | conforms | **ABSENT** |
| evidence sufficiency | unreached | unreached |
| requests | 9 | 9 |
| exit byte | 3 | 3 |
| oracle | MATCHED | MATCHED |

Every pre-registered row matched on both runs. Nothing in the oracle was edited after a run.

Run 2's per-pair gaps print with the cause the rule wrote:

```
bounded   3bf1351d-…-2a3bee7c · "Owner"  property-not-in-map — "Owner" is not in the property map
                                          this connection can see, which is either an undefined
                                          property or an ungranted one
```

**The data source appears twice in run 2's gap list and both entries are correct.** One is the
resource — `SYS001`'s coverage item — and one is the (resource, property) pair, which is `REQ001`'s.
They are different nouns counted in different denominators, which is ADR-0011 decision 4 working
rather than a double count.

### 5.1 ⭐ The observation these runs were worth making

**The REST path returns a property ID, and the connector path did not.**
`docs/research/notion-live-probe.md` § "Probe 3 — Property IDs" records **no** property ID for
`title`, `text` and `date` over an OAuth connector. On `GET /v1/pages/{id}` at
`Notion-Version: 2026-03-11`, **3 of 4 pairs in run 1 carried a property ID** — the three that were
located; the fourth is the data source, which is never hydrated.

So ADR-0010 decision 7's first matchkey, `propertyId/v1`, **is populated in practice on the REST
path**. That was unobserved in this repository before these runs, and the plan built against a
vendored SDK *type declaration* rather than a response. The type declaration is now corroborated by
an observation.

It does not clear the ADR's open question. Decision 7's *Revisit if* asks whether a property ID
survives a **type change**, and neither run changed a property's type. That experiment is still
unrun.

## 6. What these runs do NOT prove

**A live REQ001 violation was not produced and could not be.** Every readable page in the fixture
carries a non-empty `title`, and the only resources with arbitrary properties are rows inside
`wl-dataset`, which this build does not enumerate. **The live evidence covers the conforming path
and the gap path. The violation path is proven offline only** — `CHECK-req001.ts` TEST 1.

Creating a violating page is an operator-only action in the Notion UI. It is a **fifth operator-only
fixture item**, beside the two that gate #51.

Also unexercised live: row 4 (a response with no properties map), row 5 (an unreadable value shape),
and a scope naming a resource this scan never enumerated. All three are offline-only, in TESTS 4, 5
and 6.

## 6.5 What the code review changed, and one of the six was a real defect

`/code-review high` ran over the working tree before the commit and returned six findings. All six
were reproduced and all six are fixed here. Three changed behaviour and each carries a test; the
first is the one that mattered.

**1 — a configured rule vanished on every early return.** `hydrateRequiredProperties()` runs after
the traversal, and three paths return before it: a failed auth, an unreachable declared root, and a
failed root enumeration. On each of them REQ001 declared no pairs, so its applicable set was empty,
it **left the coverage vector** under ADR-0011 decision 6, and the run was byte-identical to one
where no rule had been configured at all. **The floor the operator declared was silently not
applied.** It was never a false green — those paths already exit 2 or 4 on the root's own gap — it
was a missing disclosure, and CONTEXT.md's Gap entry names it: a drop-out "produces a gap in every
rule whose coverage items depended on it". `declarePairsNeverEnumerated()` in `finish()` declares
them, idempotently. TEST 10.

**2 — `readProperty` used `name in properties`, which walks `Object.prototype`.** A property
configured as `constructor`, `toString` or `valueOf` was found on the prototype, so the pair was
recorded as **located in the map** — false — with the cause `property-shape-unread` and the remedy
"extend the rule" instead of "the property is not there". It could never produce a violation, since
every prototype value falls through to `unreadable`. It handed the operator the wrong remedy.
`Object.prototype.hasOwnProperty.call`. TEST 11.

**3 — a page that is both a link target and in scope was retrieved twice.** REF001's resolution loop
already calls `GET /v1/pages` and threw the response's `properties` away, so the hydration stage paid
for the same page again. Under a ~3 req/s ceiling that doubles the budget on exactly the pages most
likely to be in scope, and a 429 on the second call converts a conforming pair into a gap. TEST 12
counts the calls.

**Both new controls were mutated before being trusted.** Reverting fix 1 and fix 3 takes the suite to
**exit 1** with five named failures — `got=-1 want=1`, `got=2 want=1` — and restoring them returns
exit 0. A test that passes the moment it is written has not been shown to fail.

The other three were documentation and tooling: the checkpoint's hand-kept assertion sum was wrong by
three and is now marked "re-derive, never re-quote"; `CONTEXT.md` and `PRODUCT.md` cited this file
without a `claim: exists` annotation, so a forgotten `git add` would have left two canonical
documents pointing at nothing with the gate green; and `make-fixture-config.ts --property title`
without a positional argument read the flag itself as the env key.

## 7. Consequences for the request budget

Nine requests on a four-resource fixture, against seven before REQ001 — **one retrieve per in-scope
page, minus the declared root, whose map arrived with the traversal**. That is route 1 of
`docs/spec/v0.1-hydration-map.md` §1.3 as priced, and it is linear in resources rather than in pairs
because the hydration groups every required property of one page into one call.

The spec's finding stands unchanged: the budget is bound by block-tree **shape**, not by workspace
**size**, and REQ001 adds a term that scales with the resource count rather than with nesting.
