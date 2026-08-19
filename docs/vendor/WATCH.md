# Changelog watch — the reconciliation record

**Source:** `https://developers.notion.com/page/changelog`
**Last reviewed:** 2026-08-19. **Newest entry seen:** 2026-08-13.

## Why the record has this shape

Borrowed, not invented. **14 CFR 91.417(a)(2)** requires an operator to keep

> "the current status of applicable airworthiness directives (AD) including, for each, the **method of
> compliance**, the **AD number** and **revision date**" and "if the AD involves recurring action, the
> **time and date when the next action is required**."

Four fields: **identity**, **version**, **disposition — the route taken, not a boolean**, and
**expiry, which is CONDITIONAL and present only where the obligation recurs.** The expiry attaches to
the directive's recurrence, not to the reviewer's diligence.

⭐ **Our analogue of "recurring" is "nonmonotonic", and that is exactly the negative claims.** A
positive claim is monotonic under vendor change — Notion shipping a feature cannot falsify *"the API
does X"*. A negation-as-failure claim is nonmonotonic by construction, and **the vendor shipping
anything at all is the new information**. So only negative claims carry an expiry. That is why this
file is cheap: most of what we assert never needs re-checking.

The full derivation, with locators, is `docs/research/vendor-assumption-drift-prior-art.md` §5.

## ⛔ There is no feed. Polling is the only route.

Fetched 2026-08-19: the changelog is dated per entry and actively maintained, and it has **no RSS, no
Atom, no email subscription and no JSON form.** Diffing the page is ours to do.

⚠ **The page mixes REST API and MCP-connector entries.** Many recent entries concern the Notion MCP
connector and its tools (`notion-fetch`, `notion-query-data-sources`), not the REST endpoints this
product calls. **Filter before treating an entry as bearing on the product** — and record the filter
decision, because "not applicable" is a disposition and deserves the same audit trail as "applied".

## The record

| Entry | Version | Disposition — the route taken | Next action |
| --- | --- | --- | --- |
| Link domains move to `app.notion.com/p/{id}` | 2026-07-15 | **Applied.** Fetched verbatim, landed as `link-domains.md`, filed to `#111`. Recogniser checked against the new path prefix at `references.ts:154,196` — keys on ID shape, unaffected. | **Recurring.** It states the format "may change again", which is a standing nonmonotonic hazard against the host list. |
| Data-source query/retrieve endpoints | `2026-03-11` API version | **Applied.** Both pages fetched, landed as `data-source-endpoints.md`. Re-scoped `#51`; corrected `#125`'s R1. | **Recurring** — the endpoint set is the surface our negatives are written about. |
| Everything dated 2026-07-17 → 2026-08-13 | — | ⛔ **NOT REVIEWED.** Seven entries listed in the changelog summary were read as one-line summaries only and never opened. Most appear MCP-scoped; that appearance has not been verified. | **Due.** This is the outstanding reconciliation item. |

## What this record does not claim

- **It does not claim the changelog is complete.** A vendor may change behaviour without an entry.
  Nothing here detects that, and no mechanism surveyed does.
- **It does not claim the unreviewed entries are irrelevant.** They are unreviewed. The
  distinction between a **known, accepted** gap and an **unnoticed** one is NASA's deviation/waiver
  vocabulary (SE Handbook Rev 2 §6.5.1.2.3), and the row above makes this one known.
- **It sets no maximum staleness interval yet.** 10 CFR 50.71(e) puts a statutory 24-month ceiling on
  the *document as a whole* rather than per claim, which is the affordable shape — but Notion ships
  weekly and the right interval here is an open question, not an assumed one.
