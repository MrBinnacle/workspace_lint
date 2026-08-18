# ADR-0014: `POST /v1/search` has no role in the v0.1 scan, and the reason is not that search is broken

- **Status:** Accepted
- **Date:** 2026-08-18
- **Supersedes:** nothing. ADR-0002, ADR-0006, ADR-0007 and ADR-0013 all stand unchanged. This ADR decides the question ADR-0007 decision 3 deliberately declined to decide.
- **Corrects:** nothing in `docs/research/`.
- **Evidence:** ADR-0002 findings 1–3 and its decision; ADR-0007 decisions 1, 3 and 6; ADR-0013 decisions 2 and 3; `docs/research/notion-api-documented.md` §2 and the endpoint index; `PRODUCT.md` → "The config file is the suspect, not the segment"; `CONTEXT.md` → the settled defaults; `slice/notion-port.ts`, the attestation block; issue #24

## Context

ADR-0007 corrected one row of ADR-0006's per-endpoint truncation table. `POST /v1/search` does carry
a documented truncation signal. The correction is right, and ADR-0007 then said plainly that it does
not reach the product:

> **It does not reach the v0.1 product, because no document in this repository gives
> `POST /v1/search` a role in a scan.**

ADR-0007 opened five design surfaces, found every one of them silent, and refused to convert that
silence into a negative — because reading silence as absence is the exact error ADR-0007 exists to
correct. It filed the question instead, and pre-registered its own falsifier, in its Decision-status
section:

> *Revisit if:* a design surface not listed there assigns search a role, **or a decision assigns it
> one. Naming a sixth surface falsifies the enumeration**; it does not require re-deriving the row.

Issue #24 states the same test in one line — *"Naming a sixth surface that does assign search a role
settles this immediately."*

**This ADR is the sixth surface.** It assigns search a role, and the role it assigns is **none**.
The enumeration is falsified in the only honest direction available: by a decision, not by a further
silence.

### Why the question could not be left open

An undeclared endpoint is not a neutral state. Three things were live while #24 stayed open:

1. **ADR-0007's decision 1 table cannot be read.** Its search row is accurate and unexercised, and
   nothing said so where a reader would look. A row that is true of an endpoint and irrelevant to
   the product reads, at a glance, as a capability.
2. **ADR-0006 decision 5's per-run disclosure had two branches and no ruling.** The disclosure names
   which endpoint families a run used and which of those carried a signal. Whether search appears
   was a function of an undecided question.
3. **`slice/notion-port.ts` had already answered it in code**, and code that answers a question no
   document has decided is a decision nobody made.

## Decision

### 1. v0.1 calls `POST /v1/search` from no command path

Not from `scan`. Not from a setup or discovery path, because there is no such path. Not from any
future v0.1 command. The endpoint is out of the product until a superseding ADR puts it in.

This answers #24 requirement 1.

### 2. Root discovery is not in v0.1, and search would be the wrong instrument for it even if it were

The onboarding cost is real and this project has already named it. `PRODUCT.md`, under
*"The config file is the suspect, not the segment"*, records the objection the product must answer:

> **A config-driven linter is itself a maintenance tax, levied on people who by the same account
> have no maintenance energy left. … The tool must return something before it asks for anything.**

Declaring a root is part of what the tool asks for before it returns anything. So the pull toward a
discovery affordance is genuine, and it is the only candidate role search had left after ADR-0002
removed the other one.

**Search does not pay that cost. It relocates it.** ADR-0002 findings 1–3, unchanged:

- Notion documents search as **non-exhaustive**, verbatim: *"Search is not guaranteed to return
  everything, and the index may change as your connection iterates through pages and databases."*
- Only **directly shared** objects are guaranteed returned. **Inherited access is not.**
- The cursor dies at roughly **11,200 objects**, at the same position regardless of page size or
  request rate. Community-reported, recorded as **not re-confirmed** on refetch, and no decision may
  key on the number — ADR-0007 decision 1.

A discovery list built on those properties is **a partial enumeration the tool cannot attest**.
ADR-0013 decision 2 classifies that directly: attestation is a property of the endpoint, and an
enumeration whose endpoint carries no completeness guarantee produces a **named residual**, not a
result. ADR-0013 decision 3 adds the constraint that makes this fatal for an onboarding surface:
**the missing component may never be rendered as a number.** A first-run screen cannot tell the
operator how many roots it failed to suggest.

So the failure mode is a suggestion list that silently omits roots — **error in the flattering
direction**, which is the direction this project has now corrected in four separate places. A first
run that under-suggests looks like a small workspace. Nothing in the output distinguishes the two.

**Pre-registered, for any future ADR that does put search in.** Its output is a **suggestion to the
operator, never an input to the coverage denominator.** That is ADR-0002's ruling restated, not
reopened: the operator supplies the denominator because no endpoint enumerates a connection's grant,
and search is one of the five endpoints ADR-0002 checked and rejected for that job.

This answers #24 requirement 2.

### 3. ADR-0006 decision 5's per-run disclosure is unchanged for v0.1

ADR-0007 decision 6 stated the conditional: *"A run that does not call search produces an unchanged
disclosure."* Decision 1 above resolves the conditional to that branch, for every v0.1 run.

The disclosure keeps naming the endpoint families a run actually used. Search is not among them, so
search is neither in the blind list nor in the signalled list — it is **absent**, which is the
correct rendering of an endpoint the run did not call. A disclosure that named search in either list
would be describing a call that did not happen.

This answers #24 requirement 3.

### 4. ADR-0007 decision 1's search row is accurate and unexercised, and is now marked so

The row is not wrong and is not revoked. It states what Notion documents about an endpoint. This
project does not call that endpoint, so nothing in the shipped product depends on the row, and
nothing in the shipped product may be advertised on the strength of it.

**The prohibition ADR-0007 already recorded stands and is worth restating here, because this ADR is
where a reader will now arrive:** no claim that v0.1 detects truncated search may appear in a
report, in demand-test material, or in a product description. ADR-0007 rejected that by consequence
before search had a decision; it is now rejected by decision as well.

This answers #24 requirement 4, whose purpose was to stop a third session re-deriving the question.

### 5. The enumeration is closed, and a seventh surface exists in code

ADR-0007 decision 3 listed five silent surfaces. This ADR is the sixth and it is not silent.

The seventh is stronger than any of the six, because it executes. `slice/notion-port.ts` declares:

```ts
/** Carries a truncation signal — ADR-0007. Not called by this slice; classified so the table is not a one-row special case. */
export const SEARCH = 'POST /v1/search';
```

and classifies it `attested` in `ATTESTED_ENDPOINTS`, under a comment stating that attestation is a
property of the endpoint rather than of a response, so that **adding a call forces the
classification at the same moment**.

That is a fact about the built slice, and it was true before this ADR. What it was not is a
decision about v0.1 — a comment in a port file is not a design surface, and treating it as one would
repeat the reasoning ADR-0007 corrected. This ADR makes the decision; the code already anticipated
it and does not need to change.

**The mechanism there is the enforcement, not this document.** If a future session adds a search
call, `attestationOf` returns `attested` for it and the residual accounting changes at that call
site. Decision 1 is a rule that must be remembered; the port's classification table is a rule that
fires. Note the asymmetry rather than assume the ADR is doing the work.

## Consequences

**Gained: a stated negative where there was a silence.** #24 requirement 4 exists because an
unanswered scope question is re-derived by every session that meets it. Three sessions have now
opened the search question. This is the last one.

**Gained: `docs/spec/v0.1-hydration-map.md` can state what it does not cover.** The map enumerates
fetch depth per rule. Without this ADR it would either omit search — reproducing the silence in a
sixth surface — or decide the question inside a spec, which `docs/agents/domain.md` forbids.

**Paid: an onboarding cost stays unpaid.** Declaring a root is still a step, and this ADR removes
the only candidate instrument for removing it without supplying another. That is a real product
debt, recorded rather than hidden. It is not a large one at n=1, and it grows with adoption.

**Paid: nothing else.** ADR-0007 decision 2 established that the correction it made cannot change
scan behaviour, because ADR-0006 decision 1's test is positive. The same property makes this
decision cheap in the other direction: adding search later costs no redesign, only a superseding ADR
and the residual accounting the port already forces.

**Rejected by consequence.** Any v0.1 root-discovery affordance built on search. Any per-run
disclosure naming search. Any use of the ~11,200 figure, which was already rejected by ADR-0007 and
is now rejected twice.

**Evidential standing.** Every fact about search's properties in decision 2 is carried from ADR-0002
findings 1–3 and ADR-0007 decision 1, both of which cite primary sources. **No live call was made
for this ADR, and none was needed** — it decides what the product does, not what the API does. The
claim that the enumeration in ADR-0007 decision 3 had five members was checked by reading that ADR,
not by re-deriving the five.

## Decision status

- **Revisable with new evidence — decisions 1, 2 and 3.** Scope decisions with product surfaces, and
  all three move together. *Revisit if:* any condition in the Revisit-if section below fires.
- **Revisable with new evidence — decision 5's claim that the port's table is the enforcement.**
  *Revisit if:* a search call is added and the residual accounting does **not** change at the call
  site, which would mean the classification is decorative and decision 1 is unenforced.
- **Non-negotiable — search may never supply the coverage denominator.** That is ADR-0002's
  decision, not this one's, and it is restated here only because a future discovery affordance is
  the shape most likely to erode it. A superseding ADR would have to supersede ADR-0002, not this
  file.
- **Non-negotiable — no ADR is edited in place.** ADR-0006's refuted row and ADR-0007's conditional
  framing stay where they were written.

## Revisit if

**Notion ships an endpoint that enumerates a connection's grant.** This is ADR-0002's own Revisit-if
and it dissolves decision 2 rather than reversing it: root discovery gains a correct instrument, and
search stays out on the merits rather than for want of an alternative.

**A capped search is observed emitting no `request_status`.** ADR-0007's first Revisit-if, and it
tightens this decision rather than loosening it. A search call would then be an endpoint the run
cannot report honestly about, which ADR-0007 calls *"worse than the original error, because it
overstates coverage rather than understating it."*

**A capped search is observed emitting `request_status`.** The row moves from documented to
observed. That is a necessary condition for reopening decision 1 and not a sufficient one — the
non-exhaustiveness and the inherited-access hole in decision 2 are untouched by it.

**First-run setup stops being a named cost in `PRODUCT.md`.** Decision 2's discovery case rests
entirely on that complaint. If the config format changes enough that declaring a root is cheap, the
affordance loses its reason and this decision holds on weaker grounds it does not need.

**A v0.1 command is proposed that is not `scan`.** Decision 1 is stated over every v0.1 command
because only one exists. A second command is the shape most likely to acquire a discovery step
without anyone noticing this ADR applies to it.
