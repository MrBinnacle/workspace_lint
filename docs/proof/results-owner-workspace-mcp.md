# Result — the owner's real workspace, through the MCP connector

**Run 2026-08-19, S031.** Pre-registration: `docs/proof/prereg-owner-workspace-mcp.md`, committed at
`b761931` **before the first fetch**.

This repository is public. **No identifier, title or URL from the subject workspace appears below.**

⛔ **DOCUMENTED-TIER, NOT PROOF-TIER.** ADR-0004: the connector path does not clear the REST path.
Nothing here may be promoted into a claim about what the product's REST port does.

## The framing this run refutes

The project has treated *"someone must share a workspace with the read-only REST integration"* as the
gate on all evidence, and the last session wrote that the highest-value action available was a share
the owner could not perform. **That gate was self-imposed.**

`slice/references.ts` has **zero imports**. Its entry point is
`extractReferences(blocks: unknown[], sourcePage: string)`. The recogniser was never coupled to the
API, the token or the grant — it reads blocks from any source that can produce them. A second
credential path with a wider grant was available the whole time.

**Elapsed from "no second workspace is reachable" to a confirmed dead reference in a live, real,
long-lived workspace: six calls.**

## Scored against the pre-registration

| # | Prediction | Result |
| --- | --- | --- |
| **P1** | ≥ 100 top-level items | ⛔ **REFUTED.** 57 private, 0 shared. |
| **P2** | ≥ 1 internal reference resolves for nobody | ✅ **CONFIRMED.** One, on the workspace's primary operations surface. |
| **P3** | Per-page dead-reference rate under 10% | ⚠ **NOT ESTABLISHED — 2 pages sampled.** Not a rate. Recorded as unmet, not as passed. |
| **P4** | Data sources ≥ 20% of top-level items | ⛔ **REFUTED.** 5 of 57 ≈ 8.8%. |
| **P5** | Dead references are not the most frequent defect | ⚠ **NOT ESTABLISHED.** Sample too small. |
| **P6** | The connector resolves what REST could not, so any rate here is a lower bound | ✅ **CONFIRMED by construction** — the REST integration's entire grant is the synthetic fixture, so its rate over this workspace is undefined. |

**Two refuted, two confirmed, two unmet.** The two unmet ones are unmet because the run stopped at
an existence finding; they are not silently marked passed.

⚠ **A prior belief was also refuted, and the way it was refuted is worth more than the number.**
Project memory recorded this workspace as "352+ flat top-level pages". The enumeration returns **57**.

⛔ **THE "352" CAME FROM READING A PAGINATION CURSOR AS A COUNT.** `list-private-pages` with
`limit=10` returns `nextCursor: "offset:221"`. Continuing from that cursor returns the remaining 46
items and stops. `221` is an **opaque** cursor — the tool's own schema says so — and it indexes
nothing a caller may interpret. `limit=200` returns all 57 in one page with no cursor at all.

⚠ **This session nearly made the same error in the opposite direction.** On seeing `offset:221` after
having recorded 57, the first move was to assume the 57-item response had been silently truncated and
that the scoring above was invalid. **It was not.** Both readings were inferences from an opaque
value; only paginating to exhaustion and counting rows settled it.

**The lesson is this project's own, arriving from outside:** an enumeration's completeness may be
read from its termination behaviour, never from a number inside its cursor. That is `ADR-0013`'s
attestation rule — *no call, no residual* — applied to a paginator, and it is the second time a
count carried across sessions and never dereferenced has been wrong.

## The finding

**A dead internal reference sits in the callout that tells a reader how to launch work**, on the
workspace's primary operations surface. `404 object_not_found` on the target ID.

**The control is what makes it a finding.** A sibling reference in the same section of the same page,
fetched in the same session through the same call shape, resolved successfully. Without it a
connector fault and a dead link are the same observation.

⚠ **Non-resolution is not deletion.** `REF001`'s own wording holds: *absent or inaccessible,
indistinguishable.* This is not written as a deletion.

⚠ **A tempting signal was tested and rejected.** Some references render with a title and some render
self-closing with no title, and the dead one is self-closing — which looks like a detector. It is
not: a reference to a page that demonstrably exists renders self-closing on one page and titled on
another. **Title-rendering is not a resolution signal**, and a rule built on it would have been a
false detector shipped on two observations.

## ⭐ The finding that is larger than the dead link

**This workspace is not a knowledge base. It is an AI operating apparatus**, and the owner built it
without this project's involvement: operating instructions for a stateless assistant, versioned
protocol specs, a graduation-enforcement protocol, a circuit-breaker triage stack, a pre-creation
similarity check, a control-claim lifecycle, an if/then assertion log, an AI delegation doctrine, a
governed-AI operating doctrine, a content-role classification test harness, and a workspace-graph
traversal suite.

**Agents already run maintenance sweeps in it and write the results back as structured log entries.**
Two are visible on the operations surface. One records moving thirteen pages out of it. The other
records a sweep against an awareness registry, concluding: *"No unauthorized move candidates found.
No pages moved. No ambiguous items flagged."*

⭐ **THAT SWEEP RAN ON A SURFACE CARRYING A DEAD REFERENCE, AND REPORTED CLEAN.**

**It could not have found it, and no prompt would fix that.** An LLM reading a page sees the link's
*label*, not its *target*. It does not dereference. So it reports success over a broken substrate —
which is the exact proposition this repository was built on: *a green report over half a workspace is
a lie.* The apparatus is a green report.

## What this changes

The product has been framed as a linter for a human who must prove a structural claim to an
audience. That framing has no evidenced buyer, a free CI-shaped competitor, and a primary segment
ruled out on the grounds that it writes the tool itself.

The observed failure is different and it is not hypothetical: **an autonomous agent, operating on a
workspace as its substrate, cannot verify the references it is reading, and reports success anyway.**
The owner is not the only person pointing agents at a knowledge base.

Two properties this codebase already has become load-bearing under that framing rather than being an
honesty tax:

1. **Coverage is part of the result.** An agent about to act needs to know what its context source
   could not see. No surveyed competitor fails a run on incomplete coverage.
2. **The recogniser is substrate-agnostic.** Zero imports, `blocks: unknown[]` in. It does not know it
   is looking at Notion.

⛔ **This is a hypothesis with one existence proof, not a validated market.** It is written here as
what the evidence suggests, and the next act is a falsification attempt, not a build. **No ADR, no
`PRODUCT.md` edit, and no scope change follows from this file.**

## Next

1. **A rate, not an anecdote.** The method is now mechanical and cheap: enumerate, fetch, feed
   `extractReferences`, resolve, count. It needs no new grant and no operator action.
2. **Falsify the agent framing before building for it.** The claim to attack is *"LLM agents
   silently inherit broken references from their context source."* If a mainstream agent framework
   already dereferences and reports, the framing is dead and this file is why.
3. **`#51` is no longer on the critical path for evidence.** It bounds what the REST product can see.
   It does not gate measurement, because measurement does not go through the REST port.

## Revisit if

- A larger sample finds **zero** further dead references. Then n=2 is two anecdotes and P3's low-rate
  prediction stands after all.
- The agent-substrate framing survives its falsification attempt. Only then does it earn an ADR.

---

## ADDENDUM — the operator opened the whole workspace, and one surface reframes the question

The workspace contains a **versioned doctrine→agent-operations ontology at v0.4**, a separate
red-team page written against its own v0.3, and an active pre-build falsification program. Structure:

- a 12-primitive meta-model, and above it eight **invariant coordination problems** stated
  domain-independently — personnel discontinuity, communication degradation, leadership loss,
  environment divergence, uncertainty, recurring decisions, individual→institutional learning,
  authority under uncertainty;
- a 34-row source catalog, each row mapped to the primitive it implements;
- a transfer matrix graded **strong / conditional / weak-or-misleading / no meaningful analogue**,
  where every strong row carries a named failure mode and a **falsifiable evaluation hypothesis**;
- a hypothesis **H1** with an explicit decision rule and kill criterion. Status: **Unmeasured**;
- a decisive experiment with four arms — native baseline, minimal primitive packet, independent
  verifier, doctrine-specific increment — with admission rules, stress conditions, cost accounting,
  an UNRESOLVED verdict reserved for instrument failure, and a stated evidence ceiling.

⭐ **The negative taxonomy is the tell.** Most analogy work has no transfer boundary. This one names
what does *not* transfer and why, and says outright that the method exists to stop "analogy being
laundered into doctrine." It also rejects its own most flattering premise — *"a doctrine survived
because it worked"* → **Rejected**, cited against the institution's own record of lessons relearned.

### Why this is evidence about THIS project and not a change of subject

The two artifacts are the same claim at two altitudes.

| This repository | The ontology |
| --- | --- |
| verify the **substrate** an agent reads | verify the agent's **operating architecture** |
| coverage is part of the result; publish what you could not see | *"binary verified/unverified flattens real information"* → two-axis grading |
| enforcement is a hook, not a rule in prose | *"agents don't obey from legitimacy or consequence; enforcement must be mechanical — hooks, not orders"* |
| pre-registered oracle, mutation-scored controls | *"frozen prereg; scheduled re-qual"*, four-arm controlled comparison |
| `CHECK-claims.ts` falsifies documented claims mechanically | *"prose checklists get rationalized around → mechanical validator, hard gate"* |

⭐ **THE DEAD REFERENCE FOUND ABOVE IS AN INSTANCE OF THE ONTOLOGY'S OWN STRESS CONDITION.** Its
experiment lists *corrupted evidence* and *dependency failure* among the conditions under which agent
behaviour must be audited. A live reference on the operations surface does not resolve, and an agent
sweep of that same surface reported clean. **That is the predicted failure occurring naturally, in
the author's own apparatus, undetected by it** — produced by an instrument built independently of it.
One observation, not a rate.

### What is NOT established

⛔ **Everything in the ontology is marked Unmeasured, by its own author.** H1's status is Unmeasured.

⛔ **The prior-art scan is explicitly incomplete** — its own contribution callout says *"provisional
until the prior-art scan and v0.4 tests complete."* **This is the §0.5 gate, and it is the gate this
repository has hit five times**, including once where a 2012 paper had already defined and prototyped
a predicate this project believed was unoccupied. The ontology's methodological rule and this
repository's Bannister rule are the same rule.

⛔ **Nothing here says the ontology is a product.** It says the evidence for one is more likely to be
found there than in a Notion linter, and it names the test that would settle it.
