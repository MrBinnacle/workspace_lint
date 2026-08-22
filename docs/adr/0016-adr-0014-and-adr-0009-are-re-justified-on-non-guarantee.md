# ADR-0016: ADR-0014 and ADR-0009 are re-justified on non-guarantee, and a re-justification is a header line the graph can read

- **Status:** Accepted
- **Date:** 2026-08-22
- **Closes:** issue #128.
- **Supersedes:** nothing. No decision in ADR-0014 or ADR-0009 is reversed, and no ADR is edited.
- **Re-justifies:** ADR-0014, ADR-0009
- **Corrects:** nothing in `docs/research/`.
- **Evidence:** ADR-0015 decisions 1, 2 and 4; ADR-0007 decisions 1, 3 and 6; ADR-0013 decisions 2
  and 3; `docs/vendor/access-enumeration.md`; `docs/research/vendor-assumption-drift-prior-art.md`
  §4.1; `slice/support.ts`; issues #128, #124

## Context

ADR-0015 refuted ADR-0002 finding 1 — the claim that no endpoint returns the set of objects an
integration may read — and replaced it with the narrower claim the evidence supports: search
<!-- nmf -->
enumerates the shared set, and nothing guarantees the enumeration is complete. The support graph
shipped in the same change (`slice/support.ts`) traversed the `- **Evidence:**` lines and put two
ADRs OUT, because both cite ADR-0002 as a support:

- **ADR-0014**, which removed `POST /v1/search` from the v0.1 scan.
- **ADR-0009**, which made the internal integration the primary credential and the Operator the
  accountability locus for the access boundary.

OUT is not false. A derived belief whose support is withdrawn is unjustified, not wrong, and
deciding which belief to retract is culprit selection — under-determined by construction
(DOI `10.1609/aimag.v11i4.866`). The suite reports the set and stops; issue #128 is where the
judgement was assigned, and this ADR is the judgement.

The method, stated before the verdicts because it is what #128 warned about: the filing session
formed a first reading — "ADR-0007 and ADR-0013 probably carry ADR-0014" — in the same pass that
found the problem, and the ticket explicitly declines that reading as the re-justification,
because it has the direction of least work. Each ADR was therefore re-read in full against two
questions: **which sentences actually route through the refuted finding**, and **does the
decision survive when each such sentence is restated on the ground ADR-0015 left standing** —
knowing, as the original authors did not, that search does return the shared set (ADR-0015
decision 4).

## Decision

### 1. ADR-0014 is re-justified. Its remaining supports carry it, with one clause restated

**Verdict: re-justified.** `POST /v1/search` stays out of the v0.1 scan, on grounds that never
depended on the refuted finding.

The re-reading found the refuted finding doing exactly one job in ADR-0014. Its decision 2 lists
three carried facts, and they are ADR-0002 findings **2 and 3**, not finding 1: the vendor's own
non-exhaustiveness sentence (now vendor-typed in ADR-0015 decision 2), the directly-shared-only
guarantee, and the ~11,200 figure that no decision may key on. The argument built on them is
attestation-shaped: an enumeration whose endpoint carries no completeness guarantee produces a
named residual, not a result (ADR-0013 decision 2), the missing component may never be rendered
as a number (ADR-0013 decision 3), and a discovery list built on such an enumeration fails in
the flattering direction — a first run that under-suggests looks like a small workspace. None of
that reasoning consumes finding 1.

The one sentence that does consume it is decision 2's pre-registered clause: *"the operator
supplies the denominator because no endpoint enumerates a connection's grant."*
<!-- nmf -->
**That clause is
restated here on the surviving ground: the operator supplies the denominator because no
enumeration of the grant is guaranteed complete** (ADR-0015 decisions 1 and 2). This is the same
move ADR-0015 made for the declared-roots requirement itself, arriving one document later — the
conclusion stays where it was because it never needed the premise that was retracted.

Re-read knowing ADR-0015 decision 4, search's candidacy actually improves: it does return the
shared set, so it is a genuine partial enumeration rather than nothing. That changes the reason
for exclusion from "returns nothing relevant" to "returns an enumeration the tool cannot
attest" — and the second reason is the one ADR-0014 wrote down. Its pre-registration already
covers the improved candidate: any future search output is a suggestion to the operator, never
an input to the coverage denominator.

***Revisit if:*** a re-reading finds a decision in ADR-0014 that only non-enumeration carries —
that is, a decision that fails under "search enumerates, without guarantee" but held under
"search does not enumerate." This session looked and found none; that is a search of a finite
document, but by one reader on one day.

### 2. ADR-0009 is re-justified. Decision 4's split stands, on a restated ground

**Verdict: re-justified.** The internal integration remains the primary credential, the Operator
remains the accountability locus, and decision 4's split — principal change detected, membership
drift for a fixed principal disclosed — stands.

The dependence was real and sharper than ADR-0014's. ADR-0009's header says the refuted finding
is *"what makes decision 4 necessary rather than merely cautious"*, and its scenario's step 3
concludes *"Neither side of that comparison is retrievable."* **That sentence is refuted as
written.** Under ADR-0015 decision 4, search retrieves the shared set on this run and on the
last one, so both sides of the comparison exist.

**Retrievable is not attestable, and the split survives on that distinction.** Detecting
membership drift means asserting *narrowing* — that the principal lost access to something. The
only enumeration available carries no completeness guarantee, and a resource absent from a
non-guaranteed index has not been shown inaccessible; treating that absence as a revocation is
negation as failure read as strong negation, the exact sentence-type error the gate now rejects
(`slice/negation.ts`). ADR-0009 already made the corresponding argument about coverage-ratio
deltas — *"a guess wearing a number"* — without knowing it also covered the enumeration route.
So the stronger requirement still cannot be built soundly, and the disclosure stands.
<!-- nmf -->

One asymmetry is recorded rather than built: an *appearance* in search results is positive
evidence of access, so widening is observable in principle even though narrowing is not. Nothing
changes in code on its account — ADR-0014 decision 1 keeps search out of every command path, so
the observation channel is deliberately unused, and the standing disclosure in decision 4 is
unchanged. The asymmetry is written down so that a future ADR reopening search finds it here
rather than rediscovering it.

***Revisit if:*** a future decision puts search into any command path — the asymmetry above then
becomes a live design input to the drift disclosure, and decision 4's wording should be re-read
against it. ***Or if:*** the operator judges non-guarantee too weak a ground for a boundary
decision this central, in which case the route is a superseding ADR, not a quiet re-reading.

### 3. A re-justification is a `Re-justifies:` header line in the ADR that performs it

The DoD of #128 requires the suite to stop reporting a re-justified ADR OUT, and the mechanism
did not exist: an OUT ADR cites its refuted support forever, because ADRs are never edited in
place. The record therefore lives in the one document that is writable — the re-justifying ADR
itself — as a header line this file carries and `slice/support.ts` now reads:

```markdown
- **Re-justifies:** ADR-0014, ADR-0009
```

Semantics, decided here and implemented in `slice/support.ts`:

- A node named in a `Re-justifies:` line is treated as IN despite its withdrawn support,
  **provided the discharging ADR is itself IN** — neither refuted nor OUT.
- A discharger that falls OUT discharges nothing, and everything it was holding up falls with
  it. Two OUT ADRs re-justifying each other discharge nothing, because neither is valid first.
- Discharged entries stay visible in the suite's output (`RE-JUSTIFIED … by …`). This is the
  baseline-not-suppression principle applied a third time, after `negation-baseline.json` and
  `support-baseline.json`.
- A sidecar file was considered and rejected: the two baselines exist because old ADRs cannot be
  edited, but a re-justification always has a new ADR to live in, and a record with a canonical
  home does not get a mirror.

**The line is a claim the graph cannot judge.** `support.ts` verifies that the re-justification
exists and that its author is IN — never that the reasoning is adequate. Adequacy is decided
where this document was reviewed. An inadequate re-justification is corrected the same way any
ADR is: a superseding record, which puts the discharged ADRs back OUT by making their discharger
invalid.

***Revisit if:*** a re-justification is ever authored primarily to silence the suite rather than
to state reasoning — the tell would be a Re-justifies line whose ADR contains no per-decision
re-reading. The convention would then need a stronger form, and per-assertion granularity
(#124's full fix) is the known next step.

## How to read the verdicts

Both rest on the same restated ground — non-guarantee, ADR-0015 decision 2 — which is why one
ADR carries both. They are informed proposals from a session that re-read every cited document
in full but is still one reader: decision 1's Revisit-if names the reading that would overturn
it, and decision 2 explicitly offers the operator the superseding route. What is not open to
re-reading is the mechanism's behaviour in decision 3, which is asserted by
`slice/CHECK-support.ts` and settled by running it.

## Consequences

- **No product behaviour changes.** No rule, no port method, no exit byte, no manifest stage
  moves. The scan after this ADR is byte-identical to the scan before it.
- **`slice/support.ts` gains the discharge mechanism** described in decision 3, and
  `slice/CHECK-support.ts` asserts both halves: ADR-0014 and ADR-0009 are OUT **before**
  discharge — so the retraction demonstrably still fires and the control is not substitutable
  by quietly withdrawing the refutation — and absent from the OUT set after it.
- **ADR-0014 and ADR-0009 are not edited.** A reader who finds the refuted citation standing in
  either Evidence line has found the record working. The discharge is visible in the suite
  output and recorded here.
- **The restated clauses do not weaken either decision.** Non-guarantee was already the
  load-bearing fact in ADR-0015's own re-founding of declared roots; both re-justifications
  inherit that ground rather than inventing a new one.
- **The widening asymmetry in decision 2 is on the record** for whichever future ADR reopens
  search, and for no other purpose.
