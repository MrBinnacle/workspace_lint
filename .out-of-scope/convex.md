# Convex

This project does not adopt Convex, in any capacity, at this time.

**Prior requests: none.** Evaluated 2026-08-18 in session S025, from an external prompt asking
whether Convex was worth adopting. No issue was ever filed, deliberately. This file is the record;
the tracker stayed clean.

## Why this is out of scope

**Every candidate capability is store-and-distribute, and that job is already assigned.** ADR-0003
names the anchors: *"SARIF 2.1.0 is the output contract's design source. SonarQube's issue-lifecycle
model is the state machine over it."* A hosted reactive datastore would sit underneath a contract
that already has a design source and a state machine. It would not add a capability; it would add a
second answer to a question ADR-0003 closed.

**The layer it would sit on has not been built.** The slice has no baseline file and no suppressions.
`slice/finding.ts` says so in its header — every finding in this slice is `new` by construction, and
a `baselineState` field defaulted to `new` would be *"a computed-looking claim"* — and
`slice/report.ts` restates it at the render site. Issues #5 and #20 both closed as *design*. Adopting
a distribution layer for a baseline that does not exist inverts the order of the work.

**The one capability SARIF cannot carry is already ruled inadmissible.** Coverage history over time
is the honest gap in the SARIF contract, and it is exactly what a reactive datastore would be good
at. ADR-0009 decision 4 closed it on the merits, independent of any storage question:

> A falling coverage ratio between two same-principal runs is **not** a detector. It is confounded by
> deleted pages, budget exhaustion and rule reselection, and presenting it as evidence of narrowed
> membership would be **a guess wearing a number**.

So the strongest case for adoption is a case for computing something the project has already decided
it will not publish.

**Hosting anything is downstream of a threat review this project has not run.** Issue #6 settled the
adjacent question and its reasoning reaches further than its title:

> CI is a different privacy contract, not a packaging detail. A GitHub Action sends report data to
> GitHub logs and artifacts, and it puts the Notion token in a GitHub secret. That contradicts a
> strict local-only claim.

A hosted datastore is the same contract change with a larger surface. Even the GitHub Action — a far
smaller step — ships **after** the local core, gated on that review.

## What would reopen this

Not a better Convex. The blockers are ordering and product decisions, so the conditions are:

- **A baseline file exists and its distribution is a real problem.** #5 and #20 would have to reopen
  and land first. Until then there is nothing to distribute.
- **ADR-0009 decision 4 is superseded** by an ADR that makes a coverage delta over time admissible.
  That is the only capability at stake that SARIF cannot express, and it is currently prohibited on
  grounds that have nothing to do with where data is stored.
- **A threat review clears a non-local data path**, per #6's reasoning. This is a precondition, not
  an argument for adoption.

All three would have to hold. Any one alone leaves the refusal standing.
