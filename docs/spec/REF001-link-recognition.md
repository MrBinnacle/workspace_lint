# REF001 link recognition — the host set, the detection paths, and the `unrecognised` outcome

- **Status:** Specification. Binding on behaviour, not on fact.
- **Date:** 2026-08-17
- **Closes:** issue #34.
- **Requires no ADR.** §1 answers the ADR-or-not fork #34 raised and shows the answer is
  `undecidable`, an existing value. The working is in §1 so a later reader can check it rather
  than take it.
- **Observed evidence:** `docs/proof/results-ref001-live.md` §2 and §3 (run 2026-08-17, eight
  read-only calls, `Notion-Version: 2026-03-11`).
- **Documented evidence:** Notion Help, *Manage your Notion Sites*, sections "Create a new
  notion.site domain" and "Connect a custom domain"
  (`https://www.notion.com/help/manage-your-notion-sites`, fetched 2026-08-17). Notion API
  reference, *Rich text* (`https://developers.notion.com/reference/rich-text`, fetched
  2026-08-17).
- **Prior art:** Livshits et al., *In Defense of Soundiness: A Manifesto*, CACM 58(2), February
  2015, DOI `10.1145/2644805`. XCCDF 1.1.4 schema `resultEnumType`
  (`https://csrc.nist.gov/schema/xccdf/1.1.4/xccdf-1.1.4.xsd`, fetched 2026-08-17).
  LinkChecker, module `linkcheck/checker/unknownurl.py`
  (`https://linkchecker.github.io/linkchecker/_modules/linkcheck/checker/unknownurl.html`,
  fetched 2026-08-17).

## How to treat this document

You are not being given orders. This is the output of a session that had the model, the proof
record and a cross-domain prior-art sweep, and that **did not run the API while writing this** and
**cannot see your working tree**. The last session's implementation of this same rule was
false-green three separate ways, so treat a specification written without execution as a proposal
that has not yet met the API.

You are inside the code and the live workspace. That is better evidence than this document has for
anything empirical.

You are licensed and encouraged to:

- Contradict any host, field name, or block shape below that the API does not actually produce.
  This document marks each claim observed, documented, or not checked; **anything not marked
  observed is a prediction.**
- Restructure the detection order in §3 if a live response shows the ordering cannot be
  implemented as written.
- Reject §6's test design if a better red test exists that still exercises discovery.

You should not:

- Weaken §4's residue rule or §5's reporting duty because they are inconvenient to implement.
  Those are the point of the issue and they are marked non-negotiable in §7.
- Silently deviate. Surface the disagreement with the reasoning; scope is the operator's call.

## 1. The fork, answered: `unrecognised` is `undecidable`, and no new axis value is needed

#34 asks whether an unrecognised **link** is the same thing as an unjudgeable **resource**, and
forbids settling it by assertion. Four independent lines converge on the same answer.

**1.1 — The project's own deletion test excludes it.** `CONTEXT.md` states the rule: *a value is
distinct when its remedy is distinct*, and it works as a deletion test — a value whose remedy
duplicates another's is not a value. ADR-0005 states the same rule as *a value earns its place only
if it changes what the operator does next.*

| Candidate | ADR-0005's stated remedy | Remedy for an unrecognised link |
| --- | --- | --- |
| `unreached` | "Widen access, or raise the request budget." | Does nothing. The page was fetched; the link was read. |
| `undecidable` | "Neither sharing more nor re-running helps. Fix the rule, the configuration, or the data." | Exactly this. Extend the recogniser, or fix the link. |

The remedies are identical. The value is deleted by the project's own test.

**1.2 — #34's counter-argument is real and lands on a different layer.** The issue argues that the
tool "does not know whether there is a resource at all, rather than knowing there is one it cannot
judge." That distinction is genuine. It is also *not a remedy difference*, so it does not earn an
axis value. It earns a **cause**, and ADR-0005 decision 5 constraint 2 already requires one:
every drop-out carries a specific machine-readable cause, and generic causes are banned. §5 assigns
the causes.

**1.3 — XCCDF puts the same case on the same side.** The 1.1.4 schema's `resultEnumType`
distinguishes `notchecked` — *"Rule did not cause any evaluation by the checking engine"* — from
`unknown` — *"could not tell what happened, results with this status are not to be scored"*. ADR-0005's
`unreached` is `notchecked`; its `undecidable` is `unknown`. REF001 **did** run on the page: it
fetched the blocks and read the rich text. It could not classify one item. That is `unknown`, not
`notchecked`. (Quoted with a version label because ADR-0005 records that XCCDF 1.2 rewrote every
description.)

**1.4 — A shipping tool in this exact product category makes the same call.** LinkChecker's
`UnknownUrl.build_url()` gives an unhandled URL one of two outcomes and **neither is silence**:

```python
if self.is_ignored():
    self.add_info(_("%(scheme)s URL ignored.") % {"scheme": self.scheme.capitalize()})
    self.set_result(_("ignored"))
else:
    self.set_result(_("URL is unrecognized or has invalid syntax"), valid=False)
```

One validity axis; the discrimination lives in the message, not in a third validity value. Same
layering this section arrives at.

**1.5 — The field's prescription is disclosure, not a new verdict.** The soundiness manifesto names
this failure mode precisely and prescribes the remedy this project already owns. Verbatim, from the
"threefold message":

> "We issue a call to the community to identify clearly the nature and extent of unsoundness in
> static analyses. Currently, in published papers, sources of unsoundness often lurk in the shadows,
> with caveats only mentioned in an off-hand manner in an implementation or evaluation section. This
> can lead a casual reader to **erroneously conclude that the analysis is sound**."

The last clause is the false-green mechanism of `results-ref001-live.md` §2, stated in 2015. The
prescribed remedy is to enumerate and publish the unhandled set — which is the coverage manifest's
job here, not the evidence-sufficiency axis's.

**Conclusion.** #34 is a rule-specification task. ADR-0005's evidence-sufficiency axis is not
missing a value and no ADR is required to close the issue.

**One tension was surfaced rather than resolved here, and it has since been resolved elsewhere.**
This spec observed that `CONTEXT.md` defined *Applicable set* as "The in-scope **resources** a rule's
preconditions fit" while REF001's applicable set is a set of internal references, which the glossary
calls **Edges**. It filed the mismatch as issue #36 rather than correcting a canonical definition.

**ADR-0011 closed #36 on 2026-08-17.** Every rule now declares its own **coverage item**; REF001's
is an internal reference. `CONTEXT.md` is corrected and the coverage ratio is a per-rule vector, not
a scalar over resources. §5 below was written in terms of references and needed no change — it was
working around the glossary and now works with it. ADR-0011 also corrected issue #36's own table,
which recorded `REQ001`'s unit as a resource; it is a (resource, required property) pair.

## 2. The host set is unbounded. Enumeration cannot be the soundness mechanism.

#34 offers two options for the host set: enumerate observed hosts only, or take a documented list
and mark it documented-not-observed. **Both are insufficient, and the reason is documented rather
than speculative.**

Notion Help, *Manage your Notion Sites*, section "Connect a custom domain":

> "Workspace owners on paid plans can connect their existing custom domains with Notion Sites by
> purchasing the custom domain add-on."

A Notion page can therefore be served from a domain **Notion does not own and this project cannot
enumerate**. A user who pastes such a URL into a block has created an internal reference on an
arbitrary host. No allow-list is complete, and no future live run can make one complete.

This satisfies #34's own first *Revisit if* — *"A live run observes a host not in the set. Then the
enumeration approach is insufficient on its own and the unrecognised reporting path is doing the
real work"* — **before** the spec was written rather than after a future run. The consequence it
names is adopted: **the residue path is the primary mechanism and the host list is an optimisation.**

A second fact points the same way, and it is first-party since 2026-08-19: the vendor's own
changelog entry of 2026-07-15 (fetched and mirrored at `docs/vendor/link-domains.md`) describes the
host migration to `app.notion.com` and states the link values are *"not stable identifiers: their
domain and path format may change again."* A moving host set and an unbounded one argue for the same
design. *(This paragraph originally rested on third-party reports marked not checked; the vendor
receipt replaced them on 2026-08-22, #111.)*

### 2.1 The host table, each entry marked

`KNOWN_INTERNAL_HOSTS` — hosts that may be classified `internal` without further evidence:

| Host | Class | Locator |
| --- | --- | --- |
| `app.notion.com` | **observed** | `results-ref001-live.md` §2 — `href=https://app.notion.com/p/3bf1351d6af481108dc5dcc8bffb9742` |
| `*.notion.site` | **documented, not observed** | Notion Help, *Manage your Notion Sites*, "Create a new notion.site domain": *"it will be displayed at the start of any public page URLs, such as `acme.notion.site`"* |
| `www.notion.so` | **observed** | `results-first-real-workspace.md` §4 — three link candidates on this host in one run (2026-08-19). Moved from `CANDIDATE_HOSTS` 2026-08-22, #111. |
| `notion.so` | **documented, not observed** | `docs/vendor/link-domains.md` — vendor changelog entry dated 2026-07-15, *"Existing `notion.so` links continue to open correctly."* Moved 2026-08-22, #111. The `www.` form is a separate host string; neither row vouches for the other. |

`CANDIDATE_HOSTS` — **not checked.** These must **not** enter the allow-list until a locator exists.
Each is currently reported through the residue path, which is the safe direction.

| Host | Status | The check that would settle it |
| --- | --- | --- |
| `notion.com` | not checked | Copy a page link from the Notion UI and record the host, or observe one in live block content. Its siblings entering the table is not a locator for it — that inference is the one ADR-0001 decision 4 rejects (#111). |
| custom domains | **documented and unbounded** | None exists. This is the entry that makes enumeration insufficient. |

The previous implementation's regex `/notion\.(so|site)/` matched **none** of the observed hosts and
**one** of the not-checked ones. It was built entirely from the untested half of this table.

## 3. Detection paths, each marked

A reference reaches REF001 by one of two routes. Route A needs no host parsing at all and is
therefore immune to §2's whole problem. Implement A first.

### Route A — structural references (host-free)

| Shape | Carries the target ID | Class | Locator |
| --- | --- | --- | --- |
| `mention.type === "page"` → `mention.page.id` | yes, UUIDv4 | **documented, not observed** | API ref, *Rich text*, page mention |
| `mention.type === "database"` → `mention.database.id` | yes, UUIDv4 | **documented, not observed** | API ref, *Rich text*, database mention |
| `link_to_page` block, `type` of `page_id` or `database_id` | yes | **speculative** — not observed, not verified against the block reference | — |
| `child_page` / `child_database` | n/a — parentage, not reference | observed | `results-ref001-live.md` §3 |

Route A carries a property worth stating, because it is the strongest detection signal this rule
has. The API reference states, for both page and database mentions:

> "If a connection doesn't have access to the mentioned page, then the mention is returned with just
> the ID."

**The reference survives the permission failure it is trying to report.** That is the ideal input
for REF001 and it needs no host list, no URL parsing, and no allow-list maintenance.

### Route B — URL references (host parsing required)

| Shape | Class | Locator |
| --- | --- | --- |
| rich text `href` on a `text` span | **observed** | `results-ref001-live.md` §2 |
| `text.link.url` | **documented** | API ref, *Rich text*: *"An object with information about any inline link in this text, if included."* |
| `mention.link_preview.url` | **documented**; carries a URL, no page ID | API ref, *Rich text*, link preview mention |
| relative, `/`-prefixed href | **speculative** — handled by the previous prototype, never observed | — |
| `bookmark`, `embed`, `link_preview` blocks | **not checked** — block-level URL carriers, not examined | Open the block reference for each. |

One documented detail removes a trap: `href` is defined as *"The URL of any link **or Notion
mention** in this text, if any."* A mention therefore appears on **both** routes. Deduplicate on the
resolved target ID, not on the detection route, or every mention is counted twice — the same
double-count already recorded in `results-ref001-live.md` §5.

## 4. The recogniser has three outcomes and its residue is never empty by construction

Two-outcome recognisers are false-green generators, because every input the tool fails to understand
falls into `external` and disappears. The fix is not a longer host list. It is a classifier whose
"I do not know" branch is reachable and reported.

Classify each candidate in this order. **First match wins.**

```
1. Route A structural reference           → internal(target_id)
2. href / link.url absent                 → not a reference; ignore
3. URL fails to parse AND carries a       → UNRECOGNISED(cause: href-unparseable)
   Notion-shaped ID
4. host ∈ KNOWN_INTERNAL_HOSTS            → internal(target_id extracted from path)
5. URL carries a Notion-shaped ID         → UNRECOGNISED(cause: link-host-unrecognised)
6. otherwise                              → external; recorded as a non-defect exclusion
                                            per ADR-0005 decision 2
```

**Step 3 carries the ID condition, and it did not in the first version of this document.** Written
as a bare *"URL fails to parse → UNRECOGNISED"*, step 3 classifies every `#section` anchor as a
coverage gap, because a bare fragment is not a parseable absolute URL. That is the failure mode §7
already names for step 5 — every real scan qualified and the disclosure stopped being read — reached
by a different route. The implementation tests the ID first and always has: an unparseable href
carrying no Notion-shaped ID is `external`; one carrying an ID is `unrecognised`. The deviation was
surfaced rather than silent, in `slice/references.ts` and in `docs/proof/results-t3-ref001.md` §7,
and **the code was right and this document was the defect.** Corrected here under ADR-0012's plan
gate. The residue rule is untouched: it keys on the ID shape, so every href that could name a Notion
resource still reaches the residue.

Step 5 is the whole design. A Notion-shaped ID is a 32-character hexadecimal string or an
8-4-4-4-12 UUID, matched anywhere in the URL path or query. It is what makes the residue non-empty:
without it, an internal link on a custom domain reaches step 6 and vanishes.

**Step 5 over-reports, deliberately.** A non-Notion URL that happens to contain 32 hex characters is
classified `unrecognised` and appears in the report as a gap that is not really a gap. That asymmetry
is chosen, and the reasoning is the product's own:

- A false `unrecognised` costs precision. The report is qualified when it could have been
  unqualified. The operator sees the href, sees it is unrelated, and moves on.
- A false `external` costs **soundness**. It is `CONTEXT.md` Non-goal 4 — *hiding access gaps inside
  a passing result* — and it is the exact defect `results-ref001-live.md` §2 records.

The costs are not symmetric and the tool must fail toward the cheaper one. This is the same rule
`results-ref001-live.md` §3 reached from the other direction — *the applicable set is derived from
the enumerated response, never from the subset the scan knows how to handle*. Links and child
resources are two instances of one rule: **the tool's own competence must never define its
denominator.**

**That rule is now decided, and it is a settled default rather than an ADR.** It binds every rule and
it is recorded in `CONTEXT.md`'s settled defaults, because it is a **consequence of ADR-0005
decision 5 honestly applied** rather than a new decision: the funnel already requires every drop-out
to name its resource and carry a specific cause, and a type the recogniser cannot handle is a
drop-out like any other. Issue #35, closed by ADR-0013.

**And ADR-0013 draws the boundary this section needs a reader to know.** The rule above is about
**tool competence** — the denominator built from what the code can name. It does **not** cover
**frame fidelity**, where the enumeration itself was filtered upstream. A permission-filtered child
listing **satisfies** the rule above — the denominator was built from exactly what the API returned —
and still produces a false green, because `GET /v1/blocks/{id}/children` carries no truncation signal
and a filtered listing is identical to a complete one in the response. That failure has a different
remedy and is disclosed as a **residual**, not as a gap. Nothing in §4 detects it, and §4 is not
where it is fixed.

***Revisit if:*** a **third** instance of the tool-competence failure appears in a **third** rule.
Two stand today, both in this family — the `app.notion.com` host allow-list and the `child_page`-only
applicable set, at `docs/proof/results-ref001-live.md` §2 and §3. At three, the "consequence of an
honestly applied funnel" reading is much weaker, because the funnel is being applied and the defect
recurs anyway, and the default earns promotion to an ADR. `CONTEXT.md` carries the same clause.

## 5. What `unrecognised` does to the report, the coverage ratio, and the exit byte

**Applicable set.** REF001's applicable set is the internal references discovered in fetched block
content, plus every candidate classified `unrecognised`. An `unrecognised` candidate is in the
denominator. That is the point: excluding it reproduces the §3 defect, where the denominator shrank
to fit the blind spot and coverage read 100% over a root the tool could not fully see.

**Manifest.** Each `unrecognised` candidate is one drop-out at the **Evaluated** stage of ADR-0005
decision 5's funnel, satisfying its three constraints:

1. *Every drop-out names its resource.* The record names the containing page ID, the block ID, and
   the verbatim href. The gap is **bounded** — it can be counted and each member named.
2. *A specific machine-readable cause; generic causes banned.* Two causes are defined and
   `skipped: error` is prohibited:
   - `link-host-unrecognised` — parsed, carries a Notion-shaped ID, host not in the allow-list.
   - `href-unparseable` — the href is not a parseable URL.
3. *Explained versus unexplained.* Both are **explained**: the cause is known and the evidence — the
   verbatim href — is attached.

**Evidence sufficiency.** REF001 reports `undecidable` for the run when its candidate set is
non-empty, per §1. If applicable references were also never fetched, `unreached` takes precedence,
per ADR-0005 decision 1.

**Conformity is unaffected.** An `unrecognised` candidate produces **no `REF001` finding**. It is not
a `REF001` violation, it carries no `certainty`, and it carries no `target_state` — nothing about the
target was established, which is exactly what the record says. Conformity is computed over the
evaluated set only. Collapsing this into a `REF001` finding would assert a defect the scan did not
prove and would break `CONTEXT.md`'s certainty distinction. The type system enforces it: `Finding`
requires both a `certainty` and a `target_state`, and an unrecognised candidate can supply neither.

**The drop-out it creates is a `SYS001` finding, and that is not a contradiction of the paragraph
above.** This document previously said "produces **no finding**" without a rule name while also
saying, below, that a coverage gap carries a `SYS001` finding — two statements that read as a
contradiction and were reported as one in `docs/proof/results-t3-ref001.md` §7. They are about
different rules. `REF001` asserts something about the **target**, which an unrecognised href does not
establish. `SYS001` asserts something about **the scan** — *this coverage item was not evaluated* —
which the manifest proves outright. §7's non-negotiable bullet is scoped the same way and now says
so. Corrected under ADR-0012's plan gate; the code was right on this too.

**Coverage ratio.** REF001's coverage ratio is resolved references over discovered references.
Every `unrecognised` candidate lowers it. Per ADR-0005 decision 4 it is published together with the
conformity ratio, never alone. Per ADR-0011 it is **one row of the report's coverage vector**, with
its unit — internal references — printed beside it, and it is never pooled into a count with another
rule's figure. Wherever "the declared threshold" appears below, it is a floor on **this rule's own**
figure, not on any aggregate.

**Disposition.** The gap is bounded and no declared root is lost, so neither pervasiveness condition
in ADR-0005 decision 3 fires. Disposition is `qualified`, not `disclaimed`. A summary verdict is
still rendered, with the gap stated.

**Exit byte**, per ADR-0008 decision 2's priority order `4 > 2 > 3 > 1 > 0`:

| Situation | Exit |
| --- | --- |
| Unrecognised candidates exist and coverage is below the declared threshold | `3` |
| Unrecognised candidates exist, coverage is at or above the declared threshold, and their `SYS001` findings are new and unsuppressed | `1` |
| Unrecognised candidates exist, coverage is at or above the declared threshold, and their `SYS001` findings are **baselined** | `0` |

**The third row is the only route to exit `0` with an unrecognised link, and it is narrower than it
first looks.** An earlier draft of this section claimed exit `0` followed from raising the coverage
threshold alone. That was wrong and the check in §6 caught it on its first run. A coverage gap
carries a `SYS001` finding — `CONTEXT.md` makes `SYS001` the finding identity for a gap — and
ADR-0008 decision 2 fires exit `1` on any finding that is new and unsuppressed. Raising the
threshold removes the exit `3` condition and lands on exit `1`, not on exit `0`.

So an unrecognised link reaches exit `0` only when the operator has **baselined** it. That is an
explicit recorded decision, not a configuration tweak, and it is the correct bar. The report is
still `qualified`, the manifest still names every dropped href, and both ratios are still published.
ADR-0008's invariant holds exactly: exit `0` asserts no new unsuppressed finding and coverage at or
above the declared threshold, and nothing else. ADR-0011 restated the coverage clause as **every
rule's** coverage at or above the threshold, which tightens this table rather than loosening it —
REF001 clearing the floor no longer implies the run does.

**The ADR outranks this spec.** Where the two disagree the ADR wins and the spec is the defect,
which is what happened here.

## 6. The red test

DoD item 4 requires a test that fails when a link on a known host is silently dropped, and it must
exercise **discovery**, not resolution of a pre-supplied ID.

The previous red test failed this. `results-ref001-live.md` §2: the synthetic probe injected the
known-bad ID directly, so it passed whether or not discovery worked — *a control that can substitute
for the mechanism under test is not a control.* The synthetic path is now opt-in behind a flag and
must stay off in this test.

**Test 1 — discovery on the observed host (the red test #34 asks for).**
Fixture root, real block content, synthetic injection disabled. Assert that REF001 discovers the
`app.notion.com` href **from block content** and reports `certainty: confirmed`,
`target_state: unreachable`. The assertion is on the discovered target ID, and the ID must appear
nowhere in the test's own inputs. Mutating `KNOWN_INTERNAL_HOSTS` to remove `app.notion.com` must
turn this test red. **If that mutation leaves it green, the test is measuring the injection path
again and is invalid.**

**Test 2 — the residue is reachable.**
Feed a candidate carrying a Notion-shaped ID on a host that is not in the allow-list. Assert one
manifest drop-out with cause `link-host-unrecognised`, zero findings, and REF001 `undecidable`.

**Test 3 — the residue reaches the exit byte.**
With Test 2's candidate present and a declared coverage threshold of 1.0, assert exit `3`. This is
the check `results-ref001-live.md` §4 shows is needed: the manifest and the exit byte were
maintained independently and drifted toward the flattering answer.

**Test 4 — external links do not enter the denominator.**
A plain `https://example.com/blog` href must classify `external` and must not change REF001's
coverage ratio. Without this, step 5's over-reporting is unbounded and every scan is permanently
qualified.

Tests 1 and 4 constrain each other. That is intended: one fails if the recogniser is too narrow, the
other if it is too wide.

**These exist, and the count changed under ADR-0012.** `prototypes/CHECK-link-recognition.ts` now
holds **23** assertions against `prototypes/link-recognition.ts` alone — offline, no network, no
`.env`, `npx tsc --noEmit` clean under `strict`. It held 34 against
`prototypes/link-recognition.ts` and `prototypes/verdict.ts`. **`prototypes/verdict.ts` is deleted**
(ADR-0012 decision 1: one executable implementation of the exit byte) and the eleven exit-byte
assertions moved to `slice/CHECK-verdict.ts`, which calls `deriveVerdict` directly. No assertion was
dropped; test 3 below is the one that moved.

**The tests that matter now run in the slice.** `slice/CHECK-ref001.ts` carries 124 assertions
including tests 1, 2, 3 and 4 of this section against the shipped implementation, and
`slice/CHECK-verdict.ts` carries 34 over the exit byte. Test 3's assertion read exit `0` until
ADR-0012 and now reads `3`, which is what this section always required.

Two results worth recording, because both were found by running the checks rather than by re-reading
the reasoning:

- **Test 1b demonstrates its own sensitivity.** Removing `app.notion.com` from the host list turns
  the discovery red, so the entry is shown to be load-bearing rather than asserted to be. Test 1c
  executes the regex the first implementation actually shipped and confirms that under this spec the
  same defect degrades to a reported gap instead of a clean verdict.
- **The suite corrected §5's exit table on its first run.** See the note there. The version of this
  document that was reasoned about and the version that survived execution differ, which is the
  whole argument for writing the checks before trusting the spec.

## 7. Decision status

**Non-negotiable — these are the issue's substance, not implementation preference.**

- The recogniser has a reachable `unrecognised` outcome and it is reported. Dropping an
  unclassifiable candidate is `CONTEXT.md` Non-goal 4.
- An `unrecognised` candidate stays in the coverage denominator.
- An `unrecognised` candidate produces no **`REF001`** finding and asserts no `target_state`. The
  `SYS001` finding over its manifest drop-out is a different rule making a different claim, and it
  is required — see §5. The rule name was absent from this bullet until ADR-0012.
- No host enters `KNOWN_INTERNAL_HOSTS` without a locator. The `CANDIDATE_HOSTS` table is not an
  allow-list.
- **Anchor text on a dead-target finding is TITLE-CLASS DISCLOSURE, not a new disclosure category,
  so it is governed by the existing `--show-titles` opt-in and there is NO SECOND FLAG.** Ruled on
  issue #135 by the remedy test — *a value is distinct when its remedy is distinct* (`CONTEXT.md`,
  ADR-0009 decision 6) — and the remedy here is identical to a title's: redact by default, reveal
  under the operator's opt-in. Recorded in spec #139 and built in #141. The finding carries the
  source-side anchor text because it is the one string the workspace still holds about a target the
  API refuses, and without it the operator cannot bin the finding REPAIR or NOISE without leaving
  the report — measured, not assumed: run 1 produced 1-of-5 CANT-TELL for this reason
  (`docs/proof/dispositions-real-roots.md`). ⚠ A reference discovered by **Route A** carries no
  anchor text at all, because a `link_to_page` is a block rather than a rich-text run; that absence
  renders as its own stated third state and must never be collapsed into the redaction placeholder.
  *Revisit if:* a case appears where anchor text needs a remedy distinct from a title's — that
  reopens the classification, and adding a second flag without one does not.

**Revisable with new evidence — you have better access than this document.**

- The Route A and Route B tables. *Revisit if:* a live response shows a shape that is absent,
  differently named, or additional. Anything marked speculative or not checked is a prediction.
- The step order in §4. *Revisit if:* the API makes structural-first unimplementable.
- The Notion-shaped ID test in step 5. *Revisit if:* live data shows the 32-hex form is not what
  hrefs actually carry, or the false-positive rate makes every real scan qualified — measure it
  before changing it, and report the measurement.
- §5's `href-unparseable` cause. *Revisit if:* it never fires on real data, in which case merge it
  into `link-host-unrecognised` and delete the value under the same deletion test §1 used.

## Revisit if

**A locator is found for `notion.com`.** Move the row from `CANDIDATE_HOSTS` to the host table with
its locator. This lowers false `unrecognised` reports and changes no behaviour that matters for
soundness. *(This clause originally named `www.notion.so` and `notion.so` too; both fired and both
rows moved on 2026-08-22, #111 — the first at observed tier from `results-first-real-workspace.md`
§4, the second at documented tier from the vendor changelog entry of 2026-07-15.)*

**Route A turns out to cover every internal reference Notion actually produces.** #34's second
*Revisit if*. Then host matching is dead weight and this spec narrows to §3 Route A. It is testable
against the fixture and **has not been tested** — the 2026-08-17 run observed an `href` and no
mention at all.

**The false-positive rate of step 5 is measured and is high.** Step 5 is chosen on an asymmetry
argument, not on data. If real workspaces carry many 32-hex non-Notion URLs, every scan is qualified
and the disclosure stops being read — which ADR-0005's fourth *Revisit if* already names as a
failure mode for the sampling statement.

**`CONTEXT.md`'s applicable-set definition is corrected to admit edges.** §1's surfaced tension.
Then §5's wording aligns with the glossary instead of working around it.
