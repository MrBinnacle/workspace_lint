# Pre-registration — the owner's real workspace, read through the MCP connector

**Registered 2026-08-19, committed BEFORE the first fetch.** Session S031.

This repository is public. **No identifier, title, or URL from the subject workspace appears in this
file or in the result file that follows it.** Counts, rates and shapes only.

## Why this run exists, and why it is not the run the project has been waiting for

The project has treated "someone must share a workspace with the read-only REST integration" as the
gate on all evidence. **That framing was wrong and this run is the demonstration.** Two facts
dissolve it:

1. **`slice/references.ts` has ZERO imports.** Its entry point is
   `extractReferences(blocks: unknown[], sourcePage: string)`. The recogniser — the thing that finds
   internal references and classifies them — is completely decoupled from the API, the token and the
   grant. It will read blocks from any source that can produce them.
2. **The MCP connector reaches the owner's whole workspace today.** It is a different credential path
   from the REST integration, whose entire grant is the synthetic fixture.

⛔ **THIS RUN IS DOCUMENTED-TIER, NOT PROOF-TIER, AND THAT IS NOT A TECHNICALITY.** ADR-0004 states
that the OAuth connector path "does not clear the REST path." Two different credential paths see
different objects. **Nothing measured here may be promoted into a claim about what the product's REST
port does.** What it can support is a claim about *the world* — how often the defect occurs in a real
workspace — which is a different proposition and is the one `#117` says the project has no evidence
for.

## What is being measured

**One question:** in a real, unmanaged, long-lived Notion workspace, how often does an internal
reference name a target that does not resolve?

Secondary: what is the resource-kind mix, and is the dead-reference rate even the interesting defect?

## Predictions, registered before the first fetch

The operator's stated expectation is *"I guarantee you it's a gold mine."* Every prediction below is
therefore written to be **refutable in the direction that would embarrass it**, not in the direction
that would confirm it.

| # | Prediction | Refuted if |
| --- | --- | --- |
| **P1** | The workspace holds **≥ 100** top-level items. | Fewer than 100. |
| **P2** | **At least one** internal reference resolves for nobody. | Zero dead references found across the sampled set. |
| **P3** | ⚠ **The per-page dead-reference rate is LOW — under 10% of sampled pages carry one.** | 10% or more do. **This is the prediction the "gold mine" expectation contradicts, and it is registered deliberately.** |
| **P4** | Databases / data sources are **≥ 20%** of top-level items. | Under 20%. |
| **P5** | The most frequent structural defect is **not** dead references — it is flatness or duplication. | Dead references outnumber every other observable defect class. |
| **P6** | The MCP connector resolves targets the REST integration could not, so any rate measured here is a **LOWER bound** on what the product would report. | The connector fails to resolve targets the REST path would reach. |

## Method

1. Enumerate top-level items through the connector.
2. Sample pages. **The sampling frame and the sample size are recorded in the result file, including
   what the frame cannot see** — the same residual discipline the product ships, turned on its own
   evidence.
3. Extract internal references from fetched content.
4. Attempt to resolve each target through the same connector. A target that does not resolve is a
   candidate dead reference.
5. ⛔ **A non-resolution is not a deletion.** `REF001`'s own wording holds here: *absent or
   inaccessible, indistinguishable.* No result may be written as "deleted".

## The control, without which the run proves nothing

**A target known to resolve must be fetched in the same session and succeed.** The first real-workspace
run established this: two 404s prove nothing unless a positive control retrieved successfully
alongside them. Without the control, a connector fault and a dead link are the same observation.

## What this run cannot establish

- **Not a population rate.** n=1 workspace. It is a density *within* one workspace, and calling it a
  rate across workspaces would be the denominator error this product exists to detect.
- **Not proof of the REST port's behaviour.** See the tier note above.
- **Not a buyer signal.** `#29` is untouched by anything measured here.
