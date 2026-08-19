# Request limits — there are TWO ceilings and this repository knows about one

- **Fetched:** 2026-08-19. `https://developers.notion.com/reference/request-limits`
- **Why this file exists:** the changelog entry dated **2026-06-16** says the API *"now applies a rate
  limit per workspace"*. This repository's standing constraint names *"Notion's ~3 req/s ceiling"*,
  which is the **per-connection** figure. The two had never been distinguished here.

## The two limits, verbatim

**Per connection:**

> "an average of three requests per second, with some bursts beyond the average allowed"

**Per workspace:**

> "shared across all of the workspace's connections and scaled to the workspace's plan"

**And the composition rule, which is the sentence that matters:**

> "Requests that exceed **either** limit return a `"rate_limited"` error code and an HTTP 429 response"

## ⚠ THE STANDING CLAIM IS INCOMPLETE, NOT REFUTED

`.claude/state/checkpoint.md` carries, hoisted from the S021 band:

> "Resource-limit exhaustion may NEVER be reported as a refutation. SMT-LIB 2.6 makes `unknown` a
> first-class response carrying a machine-readable cause. **Binding under Notion's ~3 req/s ceiling.**"

**The constraint holds and the design consequence is unchanged.** The `~3 req/s` figure is correct
and is the per-connection limit. What is missing is that **a second ceiling exists, binds
independently, and is not a constant.**

This distinction is recorded rather than collapsed, because collapsing it is the overshoot this
branch exists to prevent — the same culprit-selection error that took `#125`'s R1 and this session's
first reading of `#51`. **One clause of a claim being incomplete does not make the claim false.**

## What actually changes

⛔ **The request budget is NOT a fixed number.** The per-workspace ceiling is *"scaled to the
workspace's plan"*, so the same scan against the same declared root can exhaust at different points
in two workspaces, and the difference is a billing fact rather than a structural one.

⛔ **It is SHARED across all of the workspace's connections.** Our scan can be rate-limited by
activity it cannot see and did not cause — another integration in the same workspace. **A 429 is
therefore not evidence about our own request pattern**, which is exactly why exhaustion may never be
reported as a refutation. The constraint's *reason* is now stronger than the one recorded.

⚠ **No number is published for the per-workspace ceiling** on this page, and none is quoted here. Its
value per plan tier is **UNLOCATABLE** — the page names the scaling and not the scale.

## Other limits on the same page, recorded because they were fetched

- Payloads: *"payloads have a maximum size of 1000 block elements and 500KB overall"*.
- `Retry-After`: *"The header value is an integer number of seconds"*.
- Property-value limits (2000 characters for URLs and text, 100 elements for block arrays, 100
  related pages) are **property constraints, not request-depth limits**, and must not be re-quoted as
  the latter.

## ⛔ What this page does NOT say

**It does not distinguish internal integrations from public integrations in its rate-limit rules.**
The same per-connection and per-workspace limits are stated universally. Recorded explicitly because
this repository has twice read a page's silence as a negative, and a reader looking for an
internal-integration exemption will not find one stated either way.

## Bearing on a product claim, flagged not resolved

`PRODUCT.md`'s competitive claim ships with three limits, one of which is *"'free' means no per-run
vendor charge, not unlimited"*. A per-workspace ceiling **scaled to the workspace's plan** is a
first-party locator for that qualifier. It is flagged here and **not** written into `PRODUCT.md` —
that file is hook-guarded and the change would need its own plan.
