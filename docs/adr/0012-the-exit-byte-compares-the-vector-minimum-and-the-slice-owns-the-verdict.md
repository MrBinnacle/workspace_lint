# ADR-0012: The exit byte compares the coverage vector's minimum, and the slice owns the only verdict implementation

- **Status:** Accepted
- **Date:** 2026-08-17
- **Closes:** issue #49.
- **Implements:** ADR-0011 decision 5, which stated the predicate and did not reach the code that
  computes it. This ADR carries no new coverage policy. It decides what `deriveVerdict` is handed,
  what `Verdict` carries, and which copy of the file is the real one.
- **Supersedes:** nothing in any prior ADR. ADR-0005, ADR-0008 and ADR-0011 all stand as written.
  It does supersede a **code comment** — `slice/verdict.ts`'s header, written in S014 — and the
  reason it is an ADR rather than an edit is that the header demanded one.
- **Observed evidence:** the live run of 2026-08-17 recorded in `docs/proof/results-t3-ref001.md`,
  where the funnel read 3/4 resources and `REF001` read 1/1 internal references; and
  `slice/CHECK-ref001.ts` TEST 4, a committed offline fixture in which the funnel reads 2/2 and
  `REF001` reads 0/1. **Before this ADR** that fixture set `byteBasis.byteWouldDiffer` to `true` and
  produced byte `0`, where `docs/spec/REF001-link-recognition.md` §6 test 3 requires `3`, and the
  check asserted the `0` on purpose as a tripwire. The defect was not predicted here — it was
  executing, and written down. Both the field and the `0` are gone as of this ADR.
- **Repository evidence:** `docs/proof/results-ref001-live.md` §4.
- **Not checked, and named because it was sought:** the divergence half of this decision — when a
  copy of a reference implementation may depart from its original — was taken to prior art and the
  sweep failed. Knight and Leveson's 1986 multiversion-programming paper returned HTTP 403 from the
  first author's university page and the FDA multiple-endpoints guidance returned HTTP 404, both on
  2026-08-17, and the session's search budget was exhausted before either could be re-located.
  **Neither is cited here, from memory or otherwise.** This follows ADR-0011's treatment of
  ISO/IEC/IEEE 29119-4. The decision does not rest on them; it rests on §4 of this repository's own
  proof record, which argues the point directly and was read in full.

## How to treat this document

You are not being given orders. This was written by the session that read the two live copies of
`verdict.ts`, diffed them, ran both suites, and confirmed which assertions each one uniquely holds.
It has **not** built `#45`'s JSON exporter, which is the consumer that makes decision 4 expensive if
decision 4 is wrong.

Each decision is labelled **revisable** or **non-negotiable**, and each revisable one names the
evidence that reopens it. Surface disagreement with reasoning; do not silently deviate.

## Context

### The defect

`deriveVerdict` computes `coverage = evaluated / applicable` from two scalars that count
**resources**, and compares that number to the declared threshold to decide exit `3`. ADR-0011
decision 5 requires the threshold to be a floor on **every rule's own coverage figure**, equivalently
a floor on the **minimum of the coverage vector**.

Those were the same number while `SYS001` was the only rule, because `SYS001`'s coverage item is a
resource. `REF001` shipped in T3 and counts internal references. They are two numbers now.

The failure is directional. A run that reads every resource and resolves no references leaves the
funnel at 100% and `REF001` at 0%: the exit-`3` condition never fires and the run reports success
over a rule that judged nothing. That is the Great Expectations defect ADR-0005 decision 4 already
names and prohibits — *"a suite in which half the expectations never executed can report 100%. The
number is not incomplete; it is wrong"* — arriving through the exit byte rather than through a
printed figure. `docs/spec/v0.1-scan-slice.md` §2 criterion 7 states the standard it fails: *"an
exit byte reached by another path is a different bug wearing the right number."*

### What T3 did instead of fixing it

T3 was forbidden from editing `verdict.ts` by the header quoted below, so it **measured** the
divergence rather than assuming it away. `ScanResult.byteBasis` carries `funnel`, `vectorMinimum`,
`declaredThreshold` and `byteWouldDiffer`, computed through the same `headlineCoverage()` the report's
headline uses — one code path, not two. `report.ts` prints a per-run disclosure, and when the two
figures fall on opposite sides of the threshold it prints a warning naming this issue and saying the
byte must not be read as a coverage verdict.

That was the right thing to do and it is why this ADR has an executing fixture rather than an
argument. All of it is scaffolding, and this decision deletes it.

### The freeze that forbade the edit does not say what it was read as saying

`slice/verdict.ts`'s header:

> COPIED VERBATIM from prototypes/verdict.ts, which is frozen as a primary source
> (docs/spec/v0.1-scan-slice.md §5). … If this file and the prototype's ever need to diverge in
> behaviour, that is a decision, and it goes in an ADR before it goes in here.

Both halves of its authority were checked against their sources and **neither holds**.

**One — spec §5 does not say it.** §5 says only that the prototype *"is kept as a **primary source**
and the toolchain is already there,"* inside a bullet labelled **revisable**, whose subject is
*where the slice is built*. It imposes no constraint on editing the copy. The words "frozen" and
"ADR before code" appear only in the code comment. This mis-attribution was found by the S015 close
and recorded on #49; #49's own body and two checkpoints had already repeated it. It is recorded again
here because the correction and the decision it bears on are now in the same document.

**Two — the cited proof record argues the opposite.** `docs/proof/results-ref001-live.md` §4 is the
header's evidence. Its rule is:

> `SYS001` is derived from the coverage manifest, not maintained beside it. The manifest is the
> single source of truth for what was not evaluated. A coverage rule whose input is a second copy of
> the coverage data is not a check on the scan; it is a check on the bookkeeping.

That is **derive, do not duplicate**. Holding `slice/verdict.ts` byte-identical to
`prototypes/verdict.ts` *is* a second copy maintained beside the first. The freeze does not protect
the invariant it cites. It instantiates the hazard, and it did so in the flattering direction: the
thing the two copies agreed on was a wrong comparison, and agreement was mistaken for correctness.

`diff prototypes/verdict.ts slice/verdict.ts` returns header lines only. Every line of logic is
byte-identical, exactly as the header claims. The claim is true. What it licenses is not.

### The prototype is exercised, and it holds one assertion nothing else holds

Checked rather than assumed. `prototypes/CHECK-link-recognition.ts:26` imports `deriveVerdict` and
asserts five exit-byte behaviours on it (lines 141, 144, 151, 158, 167). The suite passes today.

Four of the five are covered by the slice suites end-to-end through `scan()`. **The fifth is not.**
Line 158 — *"exit 0 requires the gap to be BASELINED as well"* — is the only assertion anywhere that
exercises `deriveVerdict`'s `newUnsuppressedFindings` branch, because `scan.ts` hardcodes that input
to `findings.length` and the slice has no baseline path at all. The prototype suite is the only
caller that reaches `deriveVerdict` **directly**, and directness is what buys that coverage.

Retiring the prototype's copy without noticing would have deleted a live assertion over an
ADR-0008 decision 3 branch, silently, in the course of a change justified by not losing controls.

## Decision

### 1. The slice owns the only executable `deriveVerdict`

`prototypes/verdict.ts` is deleted. `prototypes/CHECK-link-recognition.ts` drops its `deriveVerdict`
import and its verdict block — **eleven assertions over five `deriveVerdict` calls** — and returns to
being what its filename says, a link-recognition probe. It goes from 34 assertions to 23.

**Those eleven assertions are preserved, not dropped**, in a new `slice/CHECK-verdict.ts` that calls
`deriveVerdict` directly. That suite is new capability: the slice previously reached the verdict only
through `scan()`, which is why the baselined branch had no slice-side cover.

**`prototypes/live-ref001.ts` also imported the deleted file.** The plan for this change did not
anticipate that; `tsc` found it, the preceding grep did not, because the grep was scoped to `slice/`.
The probe **stops rendering a verdict** rather than gaining a third copy or importing the slice's. It
runs one rule and builds no coverage vector, so any byte it produced would be the funnel scalar,
which is the defect this ADR closes. It now prints the funnel and the finding count, states that it
renders no verdict, points at `slice/cli.ts`, and exits `0` to mean *the probe completed* — not *the
workspace conforms*. Its standing purpose is unchanged: it is the proven read-only probe that parses
`.env` in-process and keeps the token off stdout.

The prototype package continues to depend on nothing outside itself.

**No forwarding file and no cross-package import.** The two packages have separate `tsconfig`
include lists and separate `node_modules`. A `prototypes/verdict.ts` that exists only to re-export
the slice's is the duplication again wearing a different hat, and it would leave a file whose name
promises an implementation it does not contain.

### 2. The exit-`3` predicate compares the minimum of the coverage vector

`deriveVerdict` takes the coverage vector and compares `headlineCoverage(vector).ratio` against the
declared threshold. This is ADR-0011 decision 5 verbatim, reaching the code for the first time.

**The parameter is required, not optional.** An optional vector defaulting to the funnel scalar
keeps every existing call site compiling and silently comparing the wrong number — which is the
flattering direction, and it is the exact shape of the defect being fixed. A required parameter
breaks the old call sites at compile time. `tsc` is the enforcement.

### 3. An empty vector exits `3` with cause `no_applicable_subject`

ADR-0011 decision 6. A rule with an empty applicable set leaves the vector; if every rule's set is
empty the vector is empty, the minimum is undefined, and the scan judged nothing. That must not fall
through to `0`. It takes byte `3` and a distinct machine-readable cause, per the project's deletion
test — a value is distinct when its remedy is distinct, and the remedy here is the remedy for a
coverage gap.

This is the case ADR-0011 decision 6 named and no code path reached, because in T2 exit `4` covered
the only route to it.

### 4. `Verdict.applicable`, `.evaluated` and `.coverage` keep meaning RESOURCES

They are the funnel, and they stay the funnel. ADR-0011 decision 1 keeps the funnel deliberately:

> The five-stage funnel of ADR-0005 decision 5 is unchanged and still stages *resources*. Resources
> are what the scan fetches. Coverage items are what a rule counts. … Collapsing the two is what
> produced the defect.

Redefining those three fields to mean coverage items would collapse exactly that separation, and the
repository already reads them as resources everywhere: `report.ts` prints
`"N/M resources evaluated … (unit: resources)"`, `fixture-oracle.ts` asserts `verdict.applicable`
against the oracle's resource count, and roughly ten assertions across the three suites read them as
resource counts. One of those — the oracle — was committed before the run it judges and is the
instrument acceptance criterion 1 closed on.

**`Verdict` instead gains `coverageMinimum: CoverageRow | null`**, the whole row rather than the
number. A `CoverageRow` carries its `rule` and its `unit`, so no consumer can print the figure
without them. `null` is the empty-vector case of decision 3, and it is distinguishable from a ratio
of zero.

This is the field #45's JSON exporter serialises. It is also the fourth suppression #45 must honour:
`byteBasis` travels with the byte or neither is published.

### 5. `why` is built from the row, so it names its unit

`deriveVerdict` composes the exit-`3` reason through `formatRow()`, which renders
`"3/4 internal references (75.0%)"` and has no code path that omits the unit. This satisfies
ADR-0011 decision 4 and acceptance criterion 6 at the source.

It deletes the workaround shipped in `95c60c5`, which appended
`[figures in this reason are resources]` at the render layer. That was a disclosure of a defect, in
the wrong file, and it becomes false the moment the byte stops comparing resources.

### 6. What replaces the freeze

The ADR-before-code bar was a convention introduced in a code comment, resting on a citation that
does not support it. It is not re-imposed. The rule that replaces it is the one the proof record
actually supports:

> **There is one executable implementation of the exit byte, and both the live run and the offline
> suites execute it.**

Divergence is prevented by there being nothing to diverge from. That is a structural guarantee and
it costs no ceremony, where the previous bar was a comment that any session could edit and that two
sessions mis-cited.

### 7. The exit-`3` predicate drops its `gaps` conjunct

**Found by reviewing this change before committing it, not by a failing test.** The first
implementation kept ADR-0008 decision 2's row verbatim — *"gaps exist and are confined, **and**
coverage is below the declared threshold"* — and changed only what `coverage` referred to. That is
wrong, and it is wrong in the flattering direction.

With the conjunct, a run whose weakest rule is below the floor but whose gap list is empty falls
past exit `3`, past exit `1` if nothing is unsuppressed, and **exits `0`** — whereupon the reason
string asserts *"every rule's coverage is at or above the declared threshold"* beside a coverage row
reading `0/1 (0.0%)`. The report publishes a claim the run refutes two lines above it. That is this
project's own recorded defect class, arriving inside the predicate that exists to prevent it.

**ADR-0011 decision 5 already states the axis without the conjunct:** *"The evidence axis trips at
exit `3` if **any** rule falls below it,"* and it restates the exit-`0` invariant as *"no new
unsuppressed finding, and **every rule's** coverage at or above the declared threshold. No third
condition may ever produce `0`."* The conjunct made that invariant false. Removing it makes it true.

**ADR-0008 decision 2's row stays true.** Gaps plus a sub-threshold figure still exits `3`. It is now
a special case of the rule rather than the whole rule, which is the same relationship ADR-0011
decision 5 already has to that table.

**When no gap was recorded, the reason says so** rather than borrowing the gap wording. ADR-0005
decision 5 requires every drop-out to be recorded, so a coverage item that went unevaluated without
producing a gap means the coverage manifest and the coverage vector disagree. The byte is `3` either
way — the evidence is incomplete either way — and the operator is told which of the two things went
wrong.

**This changed an existing mutation check, and the change is recorded rather than absorbed.**
`CHECK-scan-scaffold.ts` TEST 5 disabled gap detection and asserted the byte fell from `3` to `0`;
its closing note said a byte that stayed at `3` would mean the suite measured nothing. Both were
correct when gaps were the only route to `3`. There are now two independent routes, so suppressing
one leaves the other standing and the byte does not move. The mutation is still detected — in the
disposition (`qualified` → `unqualified`), in the finding count (`1` → `0`), and in the reason string
— and the check now asserts those. **A byte defended by two independent conditions is a stronger
property than a byte that moves**, but it is a different property, and the check was rewritten to
state the one that is now true rather than loosened to keep passing.

## Consequences

**Gained: the byte the product prints is the byte ADR-0011 requires.** Every exit byte published
before this change compared the resource funnel. On single-rule runs that was the same number; on
T3's two-rule fixture it is not, and `CHECK-ref001.ts` TEST 4 holds the case where it differs.

**Gained: a direct unit suite over `deriveVerdict`.** The slice reached the verdict only through
`scan()`, which fixes `newUnsuppressedFindings` to `findings.length`. The new suite reaches the
branches `scan()` cannot express, starting with the baselined-gap path that ADR-0008 decision 3
defines and that only the prototype was covering.

**Gained: two copies become one.** The drift hazard `results-ref001-live.md` §4 records is closed by
construction rather than by a comment asking future sessions not to trigger it.

**Paid: the prototype stops being a control over the verdict.** It was one — the baseline assertion
proves it — and after this change it covers link recognition only. The coverage is preserved by
being moved, not by being kept in two places, and moving it is what makes the move safe to state.

**Paid: `deriveVerdict`'s signature is a breaking change.** Every caller must supply the vector. There
are two in the repository and `tsc` finds both. A third-party caller does not exist; the package is
`private: true` and unpublished, which is the window in which this change is cheap.

**Paid: `byteBasis` loses its most interesting field.** `byteWouldDiffer` becomes structurally
unreachable and is removed. `byteBasis` itself stays, because a run recording which figure its byte
compared is evidence, and #45 must serialise it.

**Rejected by consequence.** An optional vector parameter. A `prototypes/verdict.ts` that re-exports
the slice's. Redefining the funnel scalars to mean coverage items. Publishing `coverageMinimum` as a
bare number without its row. Any exit byte that compares a figure the run did not compute.

**Not decided here.** Whether `REF001`'s port widens to retrieve a data source, or whether every
database reference stays a permanent coverage gap — issue **#51**. Whether ADR-0005 decision 2's
applicability filter ships in v0.1 — issue **#50**. Whether a rule's denominator may be built from
the subset the tool can handle — issue **#35**. Whether the coverage vector is stored across runs —
the deferred Configuration Status Accounting question from ADR-0005.

## Decision status

- **Non-negotiable — the byte compares no figure the run did not compute.** This is spec §2
  criterion 7 and ADR-0005 decision 4 applied to the exit byte. Better evidence about the API does
  not bear on it.
- **Non-negotiable — the vector parameter is required.** The optional form is the defect with a
  default value. This is a claim about how silent failures happen, not about coverage policy.
- **Non-negotiable — one executable implementation.** Decision 6. Restoring a second copy reopens
  the hazard `results-ref001-live.md` §4 recorded.
- **Non-negotiable — exit `0` requires every rule at or above the threshold.** Decision 7. This is
  ADR-0011 decision 5's restated invariant, and the conjunct that broke it is the reason this
  decision exists. Re-adding a condition under which a sub-threshold rule can exit `0` is the
  defect, whatever else it buys.
- **Revisable with new evidence — decision 7's byte for the no-gap case.** *Revisit if:* a real
  configuration produces "weakest rule below the floor, no gap recorded" routinely. Today that state
  means the coverage manifest and the coverage vector disagree, which is a bookkeeping inconsistency
  and should be rare; if it turns out to be ordinary, it deserves its own machine-readable cause
  beside `no_applicable_subject` rather than sharing the plain exit-`3` reason. It is deliberately
  **not** given one now, because no run has produced it outside a hand-built test.
- **Revisable with new evidence — decision 4's field assignment.** *Revisit if:* #45's JSON exporter
  shows consumers cannot distinguish the funnel scalars from the coverage figures in practice, in
  which case the funnel scalars should move behind a named `funnel` object rather than sitting bare
  on `Verdict`. That is a rename, not a re-decision: the two figures stay separate either way.
- **Revisable with new evidence — decision 1's retirement of the prototype copy.** *Revisit if:* the
  prototype resumes being the thing that runs against the live workspace, which would make its
  independence worth its cost again. It is not today: `prototypes/live-ref001.ts` exists, and the
  slice's `cli.ts` is what the last two live runs executed.
- **Revisable with new evidence — stripping the verdict out of `prototypes/live-ref001.ts` rather
  than deleting the probe or wiring it to the slice.** *Revisit if:* an operator actually wants an
  exit byte from the probe — at which point the honest fix is to delete the probe and use
  `slice/cli.ts`, because a second byte-producing entry point is the two-copies hazard returning at
  the CLI layer rather than the module layer. Also *revisit if:* the probe stops being the only
  proven route to reading `.env` in-process, which is the sole reason it survives at all.

## Revisit if

**A rule ships whose coverage figure is not a ratio.** The minimum is defined over ratios. A rule
reporting coverage as something other than `evaluated / applicable` — a depth, a confidence, a
bounded interval — has no place in a minimum, and decision 2's predicate would need a comparable
scalar per rule or an explicit ordering.

**The minimum is always produced by the same rule.** ADR-0011 decision 4's own Revisit-if. If
`REF001` sets the minimum on every real workspace, the headline is `REF001`'s figure wearing a
disguise, and both the headline and this byte should be reconsidered together.

**`--min-coverage` gains a per-rule form.** Decision 2 compares one threshold to the minimum. An
operator wanting a different floor per rule makes the minimum the wrong reduction, because the
comparison would no longer be against a single number. ADR-0011 decision 5 has the same exposure and
says the same thing the other way round.
