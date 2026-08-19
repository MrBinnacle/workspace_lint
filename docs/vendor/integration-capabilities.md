# Integration capabilities — what "Read content" grants

- **Fetched:** 2026-08-19.
- `https://developers.notion.com/reference/capabilities`

## The capability set, as the page names it

**Content capabilities:** Read content · Update content · Insert content
**Comment capabilities:** Read comments · Insert comments
**User capabilities:** No user information · User information without email addresses · User
information with email addresses

## Read content

The page states this capability *"gives a connection access to read existing content in a Notion
workspace"*, and that such a connection *"can call Retrieve a database, but not Update database."*
It references database objects, page objects and block objects as the three content types affected.

**This project's integration is read-only, which is Read content and nothing else.**

## ⛔ WHAT THIS PAGE DOES NOT SAY — and why that is the important half

**It does not mention data sources anywhere.** Its read-content example is *"Retrieve a database"*.

**The page predates the `2026-03-11` database/data-source split and has not been updated for it.**

> **Its silence about data sources is not evidence about data sources.**

That sentence is the whole reason this file exists. The capability requirement for the data-source
query endpoint **is documented** — on that endpoint's own page, quoted in `data-source-endpoints.md`
§2 — and a reader who stopped here would have concluded the opposite.

This is the repository's own method rule arriving from the other direction: *"a negative about an
endpoint requires that endpoint's own page."* The corollary now has a case behind it — **a positive
about an endpoint may also live on that endpoint's own page and nowhere else.**

## Bearing on Principle 7

A personal access token's API capability is documented as a single bundle — *"Read, create, update,
and search content"* — with no read-only variant, which is why the PAT is ruled out at the credential
layer. The internal integration's capability set above is separable, and that separability is what
lets Principle 7 hold at the credential rather than only at the call site.

⚠ **Not re-fetched in this pass.** The PAT bundle wording is carried from an earlier session's
reading and is repeated here without a fresh locator. **Treat it as UNVERIFIED** until someone fetches
the authorization page and quotes it.
