# `docs/vendor/` — what Notion states, in Notion's words

**One file per subject. Every claim carries a URL, a verbatim quote, and the date it was fetched.**

## What this is, and the one thing it is not

This is a **dated record of what the vendor's pages said on a given day.** It is evidence, in the
same class as `docs/proof/` and `docs/research/` — appended, never decided, and **never corrected to
match the present.** A quote here that the vendor has since changed is not a bug in this directory;
it is the drift this directory exists to make visible.

⛔ **It is therefore NOT in `CHECK-claims.ts`'s `ANNOTATED` list, deliberately.** That suite's own
header gives the reason for excluding `docs/inputs/` and `docs/proof/`: dated records must not be
corrected to match the present. The `vendor` claim kind checks **form** — url, ISO date, non-empty
quote — wherever it appears in an annotated decision document. Whether a quote is still on the page
is a **re-fetch** question, and re-fetching is not this gate's job.

## ⚠ THE FAILURE MODE OF THIS DIRECTORY, stated before it happens

**A stored quote passes forever unless it is re-fetched and diffed.** That is the VCR cassette
problem, recorded with locators in `docs/research/vendor-assumption-drift-prior-art.md` §2.4. A
corpus without a live re-check is a monument to one day's beliefs with better formatting than the
ADRs it was built to correct.

**So the rule is: an entry whose `fetched` date precedes the newest relevant changelog entry is
UNVERIFIED, and must be described that way rather than quoted as current.** `WATCH.md` is what makes
that checkable.

## The entries

| File | Subject | Fetched |
| --- | --- | --- |
| `data-source-endpoints.md` | Retrieve and query a data source; the read-content requirement; the 10,000 cap | 2026-08-19 |
| `integration-capabilities.md` | What "Read content" grants, and what the page does not say | 2026-08-19 |
| `link-domains.md` | The `app.notion.com/p/{id}` migration, and what it did NOT migrate | 2026-08-19 |
| `access-enumeration.md` | What routes enumerate a connection's reachable objects; the search-limitations page in full; ADR-0002 finding 1 refuted | 2026-08-19 |
| `rate-limits.md` | Two ceilings — per connection and per workspace; the standing ~3 req/s claim is incomplete, not refuted | 2026-08-19 |
| `WATCH.md` | Changelog reconciliation record | 2026-08-19 |

## How to add an entry

Fetch the page. Quote **verbatim**. Record the URL and the date. State what the page does **not**
say, separately and explicitly — a page's silence is the most misread evidence in this repository,
and four reversals on 2026-08-19 all came from reading silence as a negative.

⛔ **A negative capability claim requires a vendor sentence asserting the negative.** Absence of a
mention is `UNLOCATABLE`, never "cannot". See `slice/negation.ts`.
