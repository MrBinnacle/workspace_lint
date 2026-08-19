# UNQ001 uniqueness — the comparison predicate, the finding granularity, and the pair denominator

- **Status:** Specification. Binding on behaviour, not on fact.
- **Date:** 2026-08-19
- **Closes:** issue #59, the fourth and last v0.1 rule.
- **Requires no ADR.** §2 shows the finding-granularity question was already decided by ADR-0010
  decision 7 and explicitly delegated here. §1 and §3 decide behaviour no ADR speaks to. Nothing
  below reverses an ADR. The one thing that would — a per-**group** finding anchor — is named in
  §2 as the alternative that costs an ADR, and it is not taken.
- **Written after the code, not before it.** Unlike `REF001-link-recognition.md`, every claim below
  was executed before it was written. §5 lists which assertion scores each one. The one exception
  is §6, which is a limitation of the fixture and is marked as unexercised.
- **Observed evidence:** `docs/proof/results-59-unq001.md` — one live run, 2026-08-19, nine
  read-only calls, oracle pre-registered before the run and MATCHED. It exercised the **conforming**
  path and the data-source gap. ⛔ **It did NOT exercise the violation path**, because the fixture
  seeds no duplicate. See §6.
- **Documented evidence:** the measurement in #59's 2026-08-19T02:03Z comment — five data sources,
  996 rows, run through the Notion MCP connector, finding 8 duplicate-title groups and 9 excess
  rows. **Documented-tier, not proof-tier**: ADR-0004 holds that the connector does not clear the
  REST path, and it is n=1 on the owner's own workspace.
- **Supersedes nothing. Superseded by nothing.**

## 0. What the rule reports

A run configured with a uniqueness scope and a property reports whether any value of that property
occurs more than once inside that scope, and what share of the comparisons it was able to make.

The configuration is one `RuleDecl` member: `{ rule: 'UNQ001', scope, property }`. Both fields are
required and neither has a default. Scope has no default for the reason `REQ001`'s has none — a
rule with no declared scope asserts over every resource the scan happened to enumerate, which
infers applicability from nothing, and ADR-0001 decision 4 rejects that. The argument is stronger
here: the resulting denominator would be quadratic in a number nobody declared.

## 1. An empty value is not a value for uniqueness

**An empty value contributes no duplicate and produces no finding. Its pairs stay in the
denominator and stay in the evaluated set.**

Two empties are not the same value. They are two absences of one, and the remedy differs: *fill
these in*, not *de-duplicate these*. Treating empty as a value makes every untitled resource in a
scope collide with every other, converting one data-quality problem into a duplicate group of size
*n* — and `REQ001` already reports present-and-empty as a violation, so the collision would be a
second report of a defect the product already names, under a rule whose remedy is wrong for it.

The distinction already existed in the code before this rule: `slice/req001.ts` types
`PropertyReading` with `'value'` and `'empty'` as separate states, and `readProperty` already trims
strings and reads `allSpansBlank` over rich-text arrays.

**The half that is easiest to drop is the denominator.** An empty-valued resource is in the scope
and was read, so its pairs were genuinely compared — the rule looked and found no shared value.
They count toward the evaluated set. **Emptiness changes the comparison predicate, never the
coverage arithmetic.** Suppressing the pairs instead would shrink the denominator to fit the
answer, which is the defect `docs/proof/results-ref001-live.md` §3 records.

*Revisit if:* a scope is configured over a property where two blanks are a real collision — a slug,
or an external key. The answer is then a per-declaration flag, not a change to this default.

### 1.1 Comparison is by trimmed string, and is not case-folded

Trimming matches `readProperty`'s existing treatment. Case-folding is a policy claim about what
counts as the same value, and ADR-0001 decision 4 rejects inferred policy. `Owner` and `owner` are
two property names in Notion and `Alpha` and `alpha` are two values here.

*Revisit if:* a real workspace needs case-insensitive uniqueness — a per-declaration option, not a
default.

### 1.2 Two payload shapes are comparable and the rest are refused

`PropertyReading` carries a `comparable: string | null` on its `'value'` state. This build renders
a comparable for exactly two payload shapes:

| payload | comparable |
|---|---|
| a plain string | the string, trimmed |
| an array every element of which carries a `plain_text` string | the spans joined in order, trimmed once |
| anything else — a number, a checkbox, a select, a relation | **null** |

A null is a refusal, not a blank. `String(1.0)` and `String(1)` differ, and `JSON.stringify` over a
select object would make property order the comparison — both are answers this build will not
assert. A null comparable is reported as an **undecidable gap**: the rule is short, not the
workspace, which is the ruling `REQ001` already makes for an unreadable property shape. An empty
string in that slot would instead collide every uncomparable value with every other one.

*Revisit if:* a real configuration needs uniqueness over a numeric or select property. The answer
is a per-shape comparable stated here, not a `String()` reached for at the call site.

## 2. One finding per offending resource

**Five identical rows are five findings over ten evaluated pairs. Not one finding, and not ten.**

ADR-0010 already made this decision and left it here to close:

- `docs/adr/0010-baseline-matching-is-a-matchkey-hierarchy-over-a-resource-anchor.md:145` enters
  `UNQ001` in decision 7's table anchored on **"The page"**, hierarchy `propertyId/v1` then
  `propertyName/v1` — identical to `REQ001`.
- Line 153 states the table *"presumes the rule emits one finding per offending resource, which is
  what ADR-0005's and ADR-0008's `(rule, resource)` pair requires throughout"*, and that a
  per-**group** emission *"has no single resource to anchor to and the anchor model needs a
  group-level answer this ADR does not supply."*
- Line 211 files it as *"Open, and deliberately not decided here — the rule's own specification
  settles it."*

Per-resource emission therefore costs no ADR amendment. Per-group costs a new ADR. #59 states this
rule needs none, so per-resource is the only choice consistent with its own scope.

**Finding granularity and coverage item are separate axes.** ADR-0011 decision 2 fixes the coverage
item as unordered pairs independently of granularity — which is why `REQ001` anchors on a page
while counting pairs. #59's 2026-08-19T02:03Z comment says the denominator follows from
granularity; **it does not**, and that correction is on the ticket.

### 2.1 What a baseline does when one duplicate of a pair is deleted

Resources A and B share a value. Each carries its own finding under its own anchor. Delete B.

On the next run A is unique, so A's finding is absent; B's anchor no longer exists, so B's finding
is absent. **Both resolve independently, matching never crosses an anchor** (ADR-0010 decision 1),
and **no transitive closure is taken over the group** — the shape decision 1 forbids and a group
anchor would have invited.

**The co-participants are not in the discriminator**, and that is the mechanism that makes the
above true. A matchkey listing them would change the moment one duplicate is deleted, so every
surviving finding in the group would read as `new` on the next run. They are evidence, and evidence
enters a baseline through the digest.

ADR-0010 line 206's Revisit-if is not reachable in v0.1: it fires when two findings on one resource
are distinguishable only by observed value, and a selector naming one property yields one value per
resource.

## 3. The pairs are materialised, with a refusing guard

`slice/scan.ts` marks `evaluated` by intersecting every applicable rule's judgement over
`manifest.of(rule.unit)`, implementing ADR-0005 decision 5. **Entries under
`resource pairs in a uniqueness scope` therefore have to be pairs.** Holding resource-shaped entries
under a pair-shaped unit is the collapse ADR-0011 exists to stop — it had already shipped a
`2/2 — 100%` figure over a root with three children.

So the entry count is `C(n,2)`, and it is quadratic:

- **One resource dropping out removes `n−1` pairs, not one.**
- At 90% of resources read, `UNQ001` has evaluated **80.9%** of the pairs it quantifies over.
- A run printing a resource-shaped percentage under this rule's name is a false green.

### 3.1 The ceiling

**A scope above 1,000 resources is refused. The run exits 4 and nothing is compared.**

`docs/spec/v0.1-hydration-map.md` §4.1 documents a 10,000-row data-source ceiling, and a
10,000-member scope is roughly 50 million pair entries — inside the documented ceiling and not
viable. 1,000 resources is 499,500 pairs, and the refusal message states the scope size, the pair
count it would have materialised, and the ceiling.

**The refusal is atomic.** Every configured scope's size is checked before any pair is
materialised, because the message says *"Nothing was compared"* and a single pass makes that
sentence false the moment two scopes are configured and the second is the oversized one.

⚠ **The ceiling cannot be checked before the traversal, and #59's build note is wrong on that one
point.** It says the guard exits "before traversal, the same shape `unimplementedRules` uses for
exit 4". A config declares a scope by ID and never by size, so `n` is unknown until the scope is
enumerated and `cli.ts`'s pre-flight has nothing to test. The refusal fires at the point pairs would
be materialised and routes through the existing `didNotRunAsDeclared` seam, which ADR-0008
decision 2 sends to exit 4 ahead of every other condition. No second exit path was added.

*Revisit if:* a real configuration needs uniqueness above the ceiling. The answer is a streaming
counter computing `C(k,2)` and `C(n,2)` without materialising, which means changing the `evaluated`
intersection in `scan.ts` — a blast radius #59 does not carry.

### 3.2 A one-member scope is zero pairs, and the run says so

`C(1,2)` is zero. A uniqueness scope holding one resource contributes no coverage item, so the rule
leaves the vector under ADR-0011 decision 6. That is the correct arithmetic — one resource cannot
repeat a value against anything — but a configured rule producing no row looks exactly like a rule
that did not run, and the operator cannot tell the two apart from the report. **The run therefore
prints the reason.**

This is also the one place where the two configured rules differ structurally.
`declarePairsNeverEnumerated` can guard on `REQ001`'s entry count, because that stage declares at
least one pair per declaration always. Its `UNQ001` sibling cannot, and guards on whether the stage
ran: an entry count of zero is ambiguous between *hydrated and legitimately empty* and *never
reached*.

### 3.3 An unenumerable scope is one entry with no participants

Where a scope was never enumerated — the scan ended early, or the scope names a resource the
traversal never reached — **one** entry is declared, not a guessed `C(n,2)`. It carries no
participants. `n` is unknown, and registering a guessed count would put an invented number in a
denominator, which is the direction ADR-0013 decision 3 forbids for exactly this shape of unknown.

## 4. The duplicated value is never printed, in any mode

**The value enters no `Finding`, no discriminator, no message, no gap label and no call log,
including under `--show-titles`.** It is not on `UnqFacts` and must not be added to it.

The rule compares values in memory and records only the answer — a boolean. Same discipline
ADR-0010 decision 6 applies to matchkeys: **comparison is allowed, publication is not.** `REQ001`
sets the precedent verbatim: *"the rule stores whether a value was present, not what it was."*

The finding instead names the **co-participants by ID**, which is the actionable locator — the
operator opens either resource and the shared value is in front of them. Principle 2 is satisfied
because the observed fact, *shares its `<property>` value with these resources*, is checkable.

`--show-titles` opens page **titles**, which are the operator's own choice to reveal. A property
**value** the rule compared is not the same thing and has no flag.

## 5. What is executed, and where

| Claim | Scored by |
|---|---|
| §1 the predicate, including two nulls and case | `CHECK-unq001.ts` TEST 1 |
| §1 empty produces no finding **and** stays in the denominator | TEST 4, both halves separately, plus a mutant that collides the empties |
| §3 five resources are ten pairs; one drop-out removes four | TEST 2 |
| §3 the reversal — a resource-shaped denominator reads 80% where the truth is 60% | TEST 3, a mutant substituted into `BUILT_RULES` |
| §2 five identical rows are five findings over ten pairs | TEST 5 |
| §2.1 deleting one duplicate resolves both findings | TEST 5 |
| §4 the value appears on no rendered line, in either mode | TEST 6 |
| §4 the control is not substitutable | TEST 7, a mutant that puts the value on the finding |
| §3.1 the ceiling refuses; a scope at the ceiling runs | TEST 8 |
| §1.2 uncomparable is `undecidable`, unlocatable is `unreached` | TEST 9 |
| §3.3 the placeholder carries no participants | TEST 10 |
| §3.2 one member is zero pairs and the run says so | TEST 11 |
| a page in both rules' scopes is retrieved once | TEST 12 |

Every mutation is scored on the figures and the exit code, never by grepping a rendered report for
`FAIL` — a suite that crashes prints no `FAIL` at all.

## 6. What the fixture cannot exercise

**The rule ran live on 2026-08-19 and matched its pre-registered oracle. It has still never
produced a finding against the live API**, because the fixture seeds no duplicate. Seeding one is a
Notion-UI action and is operator-only; it is filed on **#102**.

⭐ **What the live run did establish is the thing this rule is for.** One unreadable resource in a
four-member scope removed **three of six pairs**, so `UNQ001` reported 50% where the resource-shaped
funnel reported 75% — and 50% became the report's headline, being the minimum of the vector. The
25-point gap is ADR-0011's argument, observed. Full record: `docs/proof/results-59-unq001.md`.

Per #59's Definition of Done, this build takes the second branch — record which criterion the
fixture could not exercise — rather than claiming a proof that did not run. Unexercised live:

- **The violation path.** No duplicate value exists in the fixture, so no live run has emitted a
  `UNQ001` finding.
- **The five-participant regrouping.** Offline only, TEST 5.
- **The ceiling.** The fixture has four resources; the refusal is offline only, TEST 8.
- **`Finding.link` on a `UNQ001` finding.** Inherits `REQ001`'s limitation: only the declared root
  is retrieved with `GET /v1/pages`, and a child staged from a parent's block listing has no url.

What a live run **can** exercise today is the clean path — pairs declared, compared, and reported
conforming — and the data-source gap. Both were exercised on 2026-08-19.

## 7. Revisit-ifs, collected

1. A scope over a property where two blanks are a real collision → a per-declaration flag (§1).
2. A workspace needing case-insensitive uniqueness → a per-declaration option (§1.1).
3. A configuration needing uniqueness over a numeric or select property → a per-shape comparable
   stated here (§1.2).
4. A configuration needing uniqueness above 1,000 resources → a streaming counter, and a change to
   the `evaluated` intersection (§3.1).
5. A uniqueness scope spanning more than one declared root → `slice/config.ts` accepts one root
   today, and #59 records that as a slice cut rather than a product limit.
6. **A scope that is naturally "every row in this data source"** → this rule inherits #51's
   limitation and its shape changes from a crawl to a query. #59's own Revisit-if.
